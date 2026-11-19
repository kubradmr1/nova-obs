-- ============================================================================
-- Nova OBS · P0 ön kontrol (SALT OKUNUR)
-- ----------------------------------------------------------------------------
-- Bu dosya hiçbir şema/tablo/veri değiştirmez. Canlı veritabanında
-- çalıştırmadan önce Supabase Dashboard → Database → Backups üzerinden
-- fiziksel yedek alınmalıdır.
--
-- Çıktıyı kaydedin; 20261104_01_attendance.sql uygulanmadan önce aşağıdaki
-- maddelerin doğrulanması gerekir:
--   * pgcrypto kurulu ve hangi şemada? hmac/digest/gen_random_bytes erişilebilir mi?
--   * profiles satırları auth.users ile eksiksiz mi?
--   * rol/akademisyen anahtarı/öğrenci numarası istismar edilmiş mi?
--   * student_number NULL veya hatalı biçimde mi?
--   * dizin tabloları hâlâ RLS kapalı ve authenticated tarafından okunabilir mi?
--   * attendance_* tablo/fonksiyonları daha önce oluşturulmuş mu?
--   * attendance_attempts temizleme işi (pg_cron) mevcut mu?
--   * seed roster öğrencileri student_directory ve profiles ile eşleşiyor mu?
-- ============================================================================

begin read only;

-- 1. Ortam ------------------------------------------------------------------
select
  'environment' as section,
  current_database() as database_name,
  current_user as current_role,
  session_user as session_role,
  current_setting('server_version') as server_version,
  now() as captured_at;

-- 2. Eklentiler ve şemaları -------------------------------------------------
select
  'extension' as section,
  e.extname,
  n.nspname as extension_schema,
  e.extversion
from pg_extension e
join pg_namespace n on n.oid = e.extnamespace
where e.extname in ('pgcrypto', 'pg_cron')
order by e.extname;

-- pgcrypto'nun gerçekten ihtiyaç duyulan fonksiyonları sağladığını ve migration
-- sahibinin bu fonksiyonları çağırabildiğini doğrula.
select
  'pgcrypto_function' as section,
  n.nspname as extension_schema,
  p.proname,
  pg_get_function_identity_arguments(p.oid) as arguments,
  has_function_privilege(current_user, p.oid, 'EXECUTE') as current_user_can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
join pg_extension e on e.extnamespace = n.oid
where e.extname = 'pgcrypto'
  and p.proname in ('hmac', 'digest', 'gen_random_bytes')
order by p.proname, arguments;

select
  'uuid_function' as section,
  n.nspname as function_schema,
  p.proname,
  has_function_privilege(current_user, p.oid, 'EXECUTE') as current_user_can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where p.proname = 'gen_random_uuid'
  and pg_get_function_identity_arguments(p.oid) = ''
order by n.nspname;

select
  'schema' as section,
  nspname as schema_name,
  pg_get_userbyid(nspowner) as owner
from pg_namespace
where nspname in ('public', 'extensions', 'auth', 'cron')
order by nspname;

-- 3. Mevcut tablolar ve RLS durumu ------------------------------------------
select
  'table' as section,
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls,
  pg_get_userbyid(c.relowner) as owner
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
order by c.relname;

-- 4. Politikalar -------------------------------------------------------------
select
  'policy' as section,
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 5. Tablo yetkileri ---------------------------------------------------------
select
  'table_grant' as section,
  table_name,
  grantee,
  string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('PUBLIC', 'anon', 'authenticated', 'service_role')
group by table_name, grantee
order by table_name, grantee;

-- 6. Fonksiyonlar: SECURITY DEFINER ve search_path ---------------------------
select
  'function' as section,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  case when p.prosecdef then 'SECURITY DEFINER' else 'SECURITY INVOKER' end as security,
  p.proconfig as function_settings,
  pg_get_userbyid(p.proowner) as owner
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'handle_new_user',
    'current_profile_role',
    'is_conversation_participant',
    'purge_expired_messages',
    'is_admin',
    'my_academician_key',
    'my_student_number',
    'is_course_owner',
    'is_enrolled_in_course',
    'is_session_owner',
    'is_enrolled_in_session',
    'attendance_start_session',
    'attendance_current_code',
    'attendance_end_session',
    'attendance_lookup_code',
    'attendance_join_session'
  )
order by p.proname, arguments;

-- 6b. İsim/signature çakışması: 01 ve 02 aynı isimli fonksiyonları
-- create or replace ile oluşturur. Önceden var olan farklı bir gövde veya
-- farklı signature sessizce ezilmemelidir.
select
  'function_collision' as section,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  case when p.prosecdef then 'SECURITY DEFINER' else 'SECURITY INVOKER' end as security,
  pg_get_userbyid(p.proowner) as owner
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and (
    p.proname ~ '^_?attendance_'
    or p.proname in (
      'is_admin',
      'is_listed_academician',
      'my_academician_key',
      'my_student_number',
      'is_course_owner',
      'is_enrolled_in_course',
      'is_session_owner',
      'is_enrolled_in_session'
    )
  )
order by p.proname, arguments;

-- 7. Trigger'lar -------------------------------------------------------------
select
  'trigger' as section,
  event_object_schema,
  event_object_table,
  trigger_name,
  action_timing,
  event_manipulation,
  action_statement
from information_schema.triggers
where trigger_schema = 'public'
order by event_object_table, trigger_name;

-- 8. Realtime yayını ---------------------------------------------------------
select
  'publication' as section,
  pub.pubname,
  schemaname,
  tablename
from pg_publication pub
join pg_publication_tables pt on pt.pubname = pub.pubname
where pub.pubname = 'supabase_realtime'
order by schemaname, tablename;

-- 9. Kimlik ve profil bütünlüğü ---------------------------------------------
select
  'profile_role_counts' as section,
  role,
  count(*) as profile_count
from public.profiles
group by role
order by role;

select
  'auth_without_profile' as section,
  count(*) as auth_users_without_profile
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

select
  'profile_email_mismatch' as section,
  count(*) as mismatched_profiles
from public.profiles p
join auth.users u on u.id = p.id
where lower(coalesce(u.email, '')) <> lower(p.email);

select
  'academician_profile_mismatch' as section,
  count(*) as invalid_academician_profiles
from public.profiles p
left join public.academician_directory d
  on d.academician_key = p.academician_key
where p.role = 'academician'
  and (p.academician_key is null or d.email is null or lower(d.email) <> lower(p.email));

select
  'student_profile_mismatch' as section,
  count(*) as invalid_student_profiles
from public.profiles p
left join public.student_directory d
  on d.student_number = p.student_number
where p.role = 'student'
  and p.student_number is not null
  and (d.email is null or lower(d.email) <> lower(p.email));

-- Öğrenci profilinde numara zorunludur; 01'deki yoklama katılımı bu alanı
-- kullanır. NULL/boş numara, istemci fallback'i ile oluşturulmuş eksik
-- profillere işaret eder.
select
  'student_number_null' as section,
  count(*) as students_without_number
from public.profiles
where role = 'student'
  and (student_number is null or btrim(student_number) = '');

select
  'student_number_format' as section,
  count(*) as invalid_student_numbers
from public.profiles
where role = 'student'
  and student_number is not null
  and student_number !~ '^[0-9]{4,12}$';

select
  'academician_key_missing' as section,
  count(*) as academicians_without_key
from public.profiles
where role = 'academician'
  and (academician_key is null or btrim(academician_key) = '');

select
  'non_student_with_number' as section,
  count(*) as non_student_profiles_with_number
from public.profiles
where role <> 'student'
  and student_number is not null;

select
  'directory_rows' as section,
  (select count(*) from public.academician_directory) as academicians,
  (select count(*) from public.student_directory) as students;

select
  'verified_directory_keys' as section,
  academician_key,
  email,
  full_name
from public.academician_directory
where academician_key in ('mert', 'cafer')
order by academician_key;

-- Seed roster kapsamı: 01 içindeki 20 öğrenciden kaçı student_directory ve
-- profiles içinde? Dizin kapsamı dışındaki öğrenciler OTP ile giriş yapsa bile
-- student_number atanamadığı için yoklamaya katılamaz.
with roster(student_number) as (
  values
    ('2024001234'), ('2024001188'), ('2024001276'), ('2023001142'),
    ('2023001088'), ('2024001210'), ('2023001176'), ('2024001245'),
    ('2023001123'), ('2024001268'), ('2023001190'), ('2024001299'),
    ('2023001044'), ('2023001067'), ('2024001201'), ('2023001099'),
    ('2024001226'), ('2023001110'), ('2024001254'), ('2023001132')
)
select
  'roster_directory_coverage' as section,
  count(*) as roster_students,
  count(d.student_number) as in_student_directory,
  count(p.id) as with_profile,
  count(*) - count(d.student_number) as missing_from_directory,
  string_agg(r.student_number, ', ' order by r.student_number)
    filter (where d.student_number is null) as missing_numbers
from roster r
left join public.student_directory d
  on d.student_number = r.student_number
left join public.profiles p
  on p.student_number = r.student_number
 and p.role = 'student';

-- 10. Yoklama nesneleri daha önce oluşturulmuş mu? ---------------------------
select
  'attendance_object' as section,
  t.object_name,
  to_regclass('public.' || t.object_name) is not null as already_exists
from unnest(array[
  'academician_courses',
  'course_rosters',
  'attendance_sessions',
  'attendance_session_secrets',
  'attendance_participants',
  'attendance_signatures',
  'attendance_attempts'
]) as t(object_name)
order by t.object_name;

-- 10b. attendance_attempts temizleme işi ------------------------------------
-- 01, pg_cron varsa saatlik temizleme işi kurar. Burada yalnızca mevcut durum
-- raporlanır; pg_cron yoksa 01 sonrası iş manuel kurulmalıdır.
select
  'attendance_purge_job' as section,
  exists (select 1 from pg_extension where extname = 'pg_cron') as pg_cron_installed,
  to_regclass('cron.job') is not null as cron_job_table_present;

do $purge_job$
declare
  v_job_count integer;
begin
  if to_regclass('cron.job') is null then
    raise notice
      'attendance_purge_job: pg_cron yok. 01 sonrasi attendance_attempts temizligi manuel kurulmalidir.';
  else
    execute 'select count(*) from cron.job where jobname = $1'
      into v_job_count
      using 'nova-obs-purge-attendance-attempts';

    raise notice
      'attendance_purge_job: nova-obs-purge-attendance-attempts eslesen is sayisi = %',
      v_job_count;
  end if;
end
$purge_job$;

-- 11. İncelenecek mevcut riskli politikalar ---------------------------------
select
  'profiles_insert_policy' as section,
  policyname,
  roles,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'profiles'
  and cmd = 'INSERT';

select
  'open_directory' as section,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  has_table_privilege('authenticated', c.oid, 'SELECT') as authenticated_can_select
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('academician_directory', 'student_directory')
order by c.relname;

commit;

-- ============================================================================
-- Yorumlama notları
-- ----------------------------------------------------------------------------
-- 1) pgcrypto 'extensions' şemasında kurulu olabilir. 01 numaralı migration
--    bu şemayı otomatik tespit edip iç yardımcıları oluşturur.
-- 2) auth_without_profile > 0 ise 02 numaralı migration uygulanmadan önce
--    profil geri doldurma çalıştırılmalıdır. Aksi hâlde OTP kullanıcıları
--    giriş yapamaz.
-- 3) academician_profile_mismatch > 0 veya student_profile_mismatch > 0 ise
--    rol/numara istismarı olabilir. Migration uygulanmadan önce satırlar
--    incelenmelidir.
-- 4) attendance_object.already_exists = true veya function_collision satırı
--    dönüyorsa 01 migration'ı körlemesine uygulanmamalıdır; mevcut nesnelerin
--    şeması ve sahipliği ayrıca incelenmelidir. 01 bu durumda bilinçli olarak
--    hata verir.
-- 5) BM201 → 'mert' eşleşmesi kaynak kodda doğrulanmıştır. BM305 için
--    doğrulanmış bir sahip yoktur; seed'de academician_key = NULL kalır.
-- 6) student_number_null > 0 veya student_number_format > 0 ise 02 öncesinde
--    veri düzeltilmelidir. 02'den sonra istemcinin kendi profilini yazma yolu
--    kapalıdır.
-- 7) roster_directory_coverage.missing_numbers: bu öğrenciler OTP ile giriş
--    yapsa bile student_number atanamaz ve yoklamaya katılamaz. Uçtan uca
--    katılım testi yalnızca dizin ve profilde eşleşen öğrencilerle yapılabilir.
-- 8) attendance_purge_job: pg_cron yoksa 01 sonrası
--    select public.attendance_purge_attempts(7); düzenli çalıştırılmalıdır.
-- ============================================================================
