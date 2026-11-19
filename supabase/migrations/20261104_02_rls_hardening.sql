-- ============================================================================
-- Nova OBS · P0 / 02 · RLS sertleştirmesi
-- ----------------------------------------------------------------------------
-- Kapatılan açıklar:
--   1. authenticated kullanıcıların profiles tablosuna doğrudan INSERT
--      yapabilmesi (student_number spoofing / eksik profil oluşturma).
--   2. Tüm akademisyenlerin bütün profilleri okuyabilmesi.
--   3. academician_directory ve student_directory tablolarının RLS kapalı
--      olması ve tüm kurumsal e-posta / öğrenci numaralarının okunabilmesi.
--
-- ÖNEMLİ BAĞIMLILIK:
--   profiles INSERT politikası kaldırıldığı için istemcideki
--   AuthProvider.fetchOrCreateProfile() yedek INSERT yolu artık çalışmaz.
--   Bu dosya, istemci fallback'i kaldırılmış sürüm canlıya alınmadan
--   UYGULANMAMALIDIR. Fallback hâlâ açıkken profili eksik bir kullanıcı
--   girişte kalıcı hata alır; 02 bunu düzeltemez.
--
--   Ayrıca aşağıdaki DO bloğu şunları zorunlu kılar:
--     * auth.users üzerindeki on_auth_user_created trigger'ı etkin olmalı.
--     * handle_new_user() SECURITY DEFINER olmalı ve profiles RLS'ini
--       atlayabilecek bir sahibe ait olmalı.
--     * auth.users içindeki her kullanıcının bir profiles satırı olmalı.
--   Bu koşullardan biri sağlanmazsa migration commit edilmez.
--
-- SIRA: 01 uygulandıktan sonra çalıştırılmalıdır (is_admin() kullanır).
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 0. Girişi kırmayacak ön koşullar
-- ----------------------------------------------------------------------------
do $preflight$
declare
  v_missing_profiles integer;
  v_trigger_count integer;
  v_handle_new_user oid;
  v_handle_secdef boolean;
  v_handle_owner oid;
  v_profiles_owner oid;
  v_is_admin_owner oid;
  v_students_without_number integer;
  v_academicians_without_key integer;
begin
  if to_regprocedure('public.is_admin()') is null then
    raise exception
      '02 uygulanamaz: public.is_admin() yok. Önce 01 uygulanmalıdır.';
  end if;

  if to_regprocedure('public.is_listed_academician(text)') is not null then
    raise exception
      '02 uygulanamaz: public.is_listed_academician(text) zaten var. Mevcut tanımı inceleyin.'
      using hint = '02, bu fonksiyonu create or replace ile oluşturur; önceki tanım sessizce ezilmemelidir.';
  end if;

  select count(*)
    into v_missing_profiles
  from auth.users u
  left join public.profiles p on p.id = u.id
  where p.id is null;

  if v_missing_profiles > 0 then
    raise exception
      '02 uygulanamaz: % auth kullanıcısının profili yok. Önce geri doldurma yapın.',
      v_missing_profiles
      using hint = '00 preflight auth_without_profile değerini kontrol edin.';
  end if;

  v_handle_new_user := to_regprocedure('public.handle_new_user()');

  if v_handle_new_user is null then
    raise exception
      '02 uygulanamaz: public.handle_new_user() yok; OTP girişi profil oluşturamaz.';
  end if;

  select p.prosecdef, p.proowner
    into v_handle_secdef, v_handle_owner
  from pg_proc p
  where p.oid = v_handle_new_user;

  if not v_handle_secdef then
    raise exception
      '02 uygulanamaz: handle_new_user() SECURITY DEFINER değil; profiles INSERT politikası kaldırılınca giriş kırılır.';
  end if;

  select c.relowner
    into v_profiles_owner
  from pg_class c
  where c.oid = 'public.profiles'::regclass;

  if v_handle_owner <> v_profiles_owner
     and not exists (
       select 1 from pg_roles r
       where r.oid = v_handle_owner and (r.rolsuper or r.rolbypassrls)
     )
  then
    raise exception
      '02 uygulanamaz: handle_new_user() sahibi profiles RLS''ini atlayamaz.'
      using hint = 'Migration''ı tablo sahibi (Supabase''de postgres) rolüyle çalıştırın.';
  end if;

  select count(*)
    into v_trigger_count
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'auth'
    and c.relname = 'users'
    and t.tgname = 'on_auth_user_created'
    and not t.tgisinternal
    and t.tgenabled <> 'D'
    and t.tgfoid = v_handle_new_user;

  if v_trigger_count <> 1 then
    raise exception
      '02 uygulanamaz: auth.users.on_auth_user_created trigger''ı etkin değil veya handle_new_user()''a bağlı değil.';
  end if;

  select p.proowner
    into v_is_admin_owner
  from pg_proc p
  where p.oid = to_regprocedure('public.is_admin()');

  if v_is_admin_owner <> v_profiles_owner
     and not exists (
       select 1 from pg_roles r
       where r.oid = v_is_admin_owner and (r.rolsuper or r.rolbypassrls)
     )
  then
    raise exception
      '02 uygulanamaz: is_admin() sahibi profiles RLS''ini atlayamaz; admin politikası bozulur.';
  end if;

  select count(*)
    into v_students_without_number
  from public.profiles
  where role = 'student'
    and (student_number is null or btrim(student_number) = '');

  select count(*)
    into v_academicians_without_key
  from public.profiles
  where role = 'academician'
    and (academician_key is null or btrim(academician_key) = '');

  if v_students_without_number > 0 or v_academicians_without_key > 0 then
    raise notice
      '02 oncesi veri uyarisi: % ogrenci numarasiz, % akademisyen anahtarsiz. Bu kullanicilar giris yapabilir ancak yoklama/ders erisimi sinirli olur.',
      v_students_without_number,
      v_academicians_without_key;
  end if;
end
$preflight$;

-- ----------------------------------------------------------------------------
-- 1. Dizin allowlist'i için güvenli kontrol
-- ----------------------------------------------------------------------------
create or replace function public.is_listed_academician(p_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.academician_directory d
    where lower(d.email) = lower(btrim(coalesce(p_email, '')))
  );
$$;

revoke all on function public.is_listed_academician(text)
  from public, anon;
grant execute on function public.is_listed_academician(text)
  to authenticated;

-- Dizin RLS'i açıldığında definer fonksiyonun sahibi RLS'i atlayabilmelidir.
do $definer_check$
declare
  v_function_owner oid;
  v_directory_owner oid;
begin
  select p.proowner
    into v_function_owner
  from pg_proc p
  where p.oid = to_regprocedure('public.is_listed_academician(text)');

  select c.relowner
    into v_directory_owner
  from pg_class c
  where c.oid = 'public.academician_directory'::regclass;

  if v_function_owner <> v_directory_owner
     and not exists (
       select 1 from pg_roles r
       where r.oid = v_function_owner and (r.rolsuper or r.rolbypassrls)
     )
  then
    raise exception
      '02 uygulanamaz: is_listed_academician() sahibi academician_directory RLS''ini atlayamaz.'
      using hint = 'Migration''ı tablo sahibi (Supabase''de postgres) rolüyle çalıştırın.';
  end if;
end
$definer_check$;

-- ----------------------------------------------------------------------------
-- 2. Profiles: yalnızca kendi profili veya admin
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_self_or_staff" on public.profiles;
drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.is_admin()
);

drop policy if exists "profiles_insert_self_student" on public.profiles;

-- İstemcinin doğrudan profil yazması tamamen kapatılır.
-- Profil oluşturma yalnızca auth.users trigger'ı (SECURITY DEFINER) ile yapılır.
revoke all on table public.profiles from public, anon, authenticated;
grant select on table public.profiles to authenticated;

-- ----------------------------------------------------------------------------
-- 3. Dizin tabloları: RLS açık, istemci erişimi yok
-- ----------------------------------------------------------------------------
alter table public.academician_directory enable row level security;
alter table public.student_directory enable row level security;

revoke all on table public.academician_directory, public.student_directory
  from public, anon, authenticated;

-- Dizinlere SELECT politikası bilinçli olarak eklenmez. Erişim yalnızca
-- SECURITY DEFINER fonksiyonlar ve service_role üzerinden yapılır.

-- ----------------------------------------------------------------------------
-- 4. Görüşme oluşturma: dizin kontrolünü definer fonksiyona taşı
-- ----------------------------------------------------------------------------
drop policy if exists "conversations_insert_students" on public.conversations;
create policy "conversations_insert_students"
on public.conversations
for insert
to authenticated
with check (
  student_id = auth.uid()
  and public.current_profile_role() = 'student'
  and lower(student_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  and public.is_listed_academician(academician_email)
);

-- ----------------------------------------------------------------------------
-- 5. Giriş ve profil yolunun bozulmadığını doğrula
-- ----------------------------------------------------------------------------
do $postcheck$
begin
  if not has_table_privilege('authenticated', 'public.profiles', 'SELECT') then
    raise exception 'profiles SELECT yetkisi authenticated rolünden kaldırıldı';
  end if;

  if has_table_privilege('authenticated', 'public.profiles', 'INSERT') then
    raise exception 'authenticated hâlâ profiles INSERT yapabiliyor';
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and cmd = 'INSERT'
  ) then
    raise exception 'profiles INSERT politikası hâlâ mevcut';
  end if;

  if not exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'auth'
      and c.relname = 'users'
      and t.tgname = 'on_auth_user_created'
      and not t.tgisinternal
      and t.tgenabled <> 'D'
  ) then
    raise exception 'on_auth_user_created trigger''ı etkin değil; OTP girişi profil oluşturamaz';
  end if;
end
$postcheck$;

commit;
