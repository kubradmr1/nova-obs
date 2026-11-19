-- ============================================================================
-- Nova OBS · P0 / 02 · Geri alma
-- ----------------------------------------------------------------------------
-- !!! DİKKAT: BU DOSYA GÜVENLİK AÇIKLARINI BİLİNÇLİ OLARAK GERİ AÇAR. !!!
--
-- Yeniden açılan açıklar:
--   * authenticated istemci kendi profilini role='student' ile oluşturabilir.
--   * student_number istemci tarafından serbestçe yazılabilir.
--   * Tüm akademisyenler bütün profilleri okuyabilir.
--   * academician_directory ve student_directory tüm authenticated
--     kullanıcılara açılır (kurumsal e-posta / öğrenci numarası sızar).
--   * conversations INSERT politikası dizini doğrudan okumaya döner.
--
-- SIRA: Yalnızca 03 geri alındıktan sonra çalıştırılmalıdır. 01 geri
-- alınmadan önce çalıştırılmalıdır; aksi hâlde profiles politikası
-- public.is_admin() olmadığı için bozulur.
--
-- Bu geri alma yalnızca geçici acil dönüş içindir. Kalıcı çözüm, istemci
-- fallback'i kaldırılmış sürümü geri yüklemektir.
-- ============================================================================

begin;

-- 1. Görüşme politikasını eski hâline getir ---------------------------------
drop policy if exists "conversations_insert_students" on public.conversations;
create policy "conversations_insert_students"
on public.conversations
for insert
to authenticated
with check (
  student_id = auth.uid()
  and public.current_profile_role() = 'student'
  and lower(student_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  and exists (
    select 1
    from public.academician_directory d
    where lower(d.email) = lower(academician_email)
  )
);

drop function if exists public.is_listed_academician(text);

-- 2. Dizinleri eski (RLS kapalı) hâline getir -------------------------------
alter table public.academician_directory disable row level security;
alter table public.student_directory disable row level security;

grant select on table
  public.academician_directory,
  public.student_directory
to authenticated;

-- 3. Profiles politikalarını eski hâline getir ------------------------------
drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_staff"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.current_profile_role() in ('academician', 'admin')
);

drop policy if exists "profiles_insert_self_student" on public.profiles;
create policy "profiles_insert_self_student"
on public.profiles
for insert
to authenticated
with check (
  id = auth.uid()
  and role = 'student'
  and academician_key is null
);

grant select, insert on table public.profiles to authenticated;

commit;

-- ============================================================================
-- Geri alma sonrası bilinen riskler
-- ----------------------------------------------------------------------------
-- * İstemci, kendi profilini student rolüyle oluşturabilir.
-- * student_number istemci tarafından serbestçe yazılabilir.
-- * Tüm akademisyenler bütün profilleri okuyabilir.
-- * Dizinlerdeki e-posta ve öğrenci numaraları authenticated kullanıcılara
--   açılır.
-- Bu durum yalnızca geçici acil geri dönüş içindir.
-- ============================================================================
