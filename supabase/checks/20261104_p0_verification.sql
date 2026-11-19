-- ============================================================================
-- Nova OBS · P0 / Uygulama sonrası doğrulama (SALT OKUNUR)
-- ----------------------------------------------------------------------------
-- 00 → 01 → 02 → 03 uygulandıktan sonra Supabase SQL Editor'de çalıştırın.
-- Hiçbir tablo/veri değiştirmez. Bir güvenlik kontrolü başarısız olursa
-- DO bloğu exception ile durur ve hangi kontrolün düştüğünü yazar.
-- ============================================================================

begin read only;

-- 1. Nesneler ve RLS ---------------------------------------------------------
select
  'rls' as section,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'profiles',
    'academician_directory',
    'student_directory',
    'academician_courses',
    'course_rosters',
    'attendance_sessions',
    'attendance_session_secrets',
    'attendance_participants',
    'attendance_signatures',
    'attendance_attempts'
  )
order by c.relname;

-- 2. Politikalar -------------------------------------------------------------
select
  'policy' as section,
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'profiles',
    'conversations',
    'academician_courses',
    'course_rosters',
    'attendance_sessions',
    'attendance_participants',
    'attendance_signatures',
    'attendance_session_secrets',
    'attendance_attempts'
  )
order by tablename, cmd, policyname;

-- 3. Tablo yetkileri ---------------------------------------------------------
select
  'table_grant' as section,
  table_name,
  grantee,
  string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('PUBLIC', 'anon', 'authenticated', 'service_role')
  and table_name in (
    'profiles',
    'academician_directory',
    'student_directory',
    'academician_courses',
    'course_rosters',
    'attendance_sessions',
    'attendance_session_secrets',
    'attendance_participants',
    'attendance_signatures',
    'attendance_attempts'
  )
group by table_name, grantee
order by table_name, grantee;

-- 4. Fonksiyon yetkileri -----------------------------------------------------
select
  'function_acl' as section,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  case when p.prosecdef then 'SECURITY DEFINER' else 'SECURITY INVOKER' end as security,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute,
  p.proconfig as function_settings
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'handle_new_user',
    'current_profile_role',
    'is_conversation_participant',
    'purge_expired_messages',
    'is_admin',
    'is_listed_academician',
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
    'attendance_join_session',
    '_attendance_random_secret',
    '_attendance_code',
    '_attendance_matching_slot',
    '_attendance_rate_limited'
  )
order by p.proname, arguments;

-- 5. Seed sahipliği ve roster -------------------------------------------------
select
  'course_owner' as section,
  course_code,
  course_name,
  academician_key,
  term,
  room,
  is_active
from public.academician_courses
where course_code in ('BM201', 'BM305')
order by course_code;

select
  'roster_count' as section,
  course_code,
  count(*) as student_count
from public.course_rosters
group by course_code
order by course_code;

-- 5b. Roster / dizin / profil kapsamı ---------------------------------------
-- Katılım testi yalnızca aşağıda in_student_directory ve with_profile
-- değerleri 1 olan öğrencilerle uçtan uca çalıştırılabilir.
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
  string_agg(r.student_number, ', ' order by r.student_number)
    filter (where d.student_number is null) as missing_numbers
from roster r
left join public.student_directory d
  on d.student_number = r.student_number
left join public.profiles p
  on p.student_number = r.student_number
 and p.role = 'student';

-- 5c. attendance_attempts temizleme işi -------------------------------------
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
      'attendance_purge_job: pg_cron yok; temizlik manuel calistirilmalidir.';
  else
    execute 'select count(*) from cron.job where jobname = $1'
      into v_job_count
      using 'nova-obs-purge-attendance-attempts';

    if v_job_count = 0 then
      raise notice
        'attendance_purge_job: UYARI - planli temizlik isi bulunamadi.';
    else
      raise notice
        'attendance_purge_job: planli temizlik isi mevcut (%).',
        v_job_count;
    end if;
  end if;
end
$purge_job$;

-- 6. Kod üretimi deterministik ve 8 karakter mi? -----------------------------
select
  'code_test' as section,
  public._attendance_code(
    'test-secret-value',
    '00000000-0000-4000-8000-000000000001'::uuid,
    0,
    8
  ) as code,
  char_length(public._attendance_code(
    'test-secret-value',
    '00000000-0000-4000-8000-000000000001'::uuid,
    0,
    8
  )) as code_length,
  public._attendance_code(
    'test-secret-value',
    '00000000-0000-4000-8000-000000000001'::uuid,
    0,
    8
  ) = public._attendance_code(
    'test-secret-value',
    '00000000-0000-4000-8000-000000000001'::uuid,
    0,
    8
  ) as deterministic;

-- 7. Kritik güvenlik iddiaları ----------------------------------------------
do $verify$
declare
  v_code text;
  v_table text;
  v_function text;
begin
  if not (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass) then
    raise exception 'profiles RLS is not enabled';
  end if;

  if not (select relrowsecurity from pg_class where oid = 'public.academician_directory'::regclass) then
    raise exception 'academician_directory RLS is not enabled';
  end if;

  if not (select relrowsecurity from pg_class where oid = 'public.student_directory'::regclass) then
    raise exception 'student_directory RLS is not enabled';
  end if;

  if not (select relrowsecurity from pg_class where oid = 'public.attendance_sessions'::regclass) then
    raise exception 'attendance_sessions RLS is not enabled';
  end if;

  if not (select relrowsecurity from pg_class where oid = 'public.attendance_attempts'::regclass) then
    raise exception 'attendance_attempts RLS is not enabled';
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and cmd = 'INSERT'
  ) then
    raise exception 'profiles has an INSERT policy';
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename in ('attendance_session_secrets', 'attendance_attempts')
  ) then
    raise exception 'secret/attempt tables have policies';
  end if;

  if has_table_privilege('authenticated', 'public.profiles', 'INSERT') then
    raise exception 'authenticated can insert profiles';
  end if;

  if has_table_privilege('authenticated', 'public.profiles', 'UPDATE') then
    raise exception 'authenticated can update profiles';
  end if;

  if has_table_privilege('authenticated', 'public.academician_directory', 'SELECT') then
    raise exception 'authenticated can read academician_directory';
  end if;

  if has_table_privilege('authenticated', 'public.student_directory', 'SELECT') then
    raise exception 'authenticated can read student_directory';
  end if;

  if has_table_privilege('authenticated', 'public.attendance_sessions', 'INSERT') then
    raise exception 'authenticated can insert attendance_sessions';
  end if;

  if has_table_privilege('authenticated', 'public.attendance_participants', 'INSERT') then
    raise exception 'authenticated can insert attendance_participants';
  end if;

  if has_table_privilege('authenticated', 'public.attendance_session_secrets', 'SELECT') then
    raise exception 'authenticated can read attendance_session_secrets';
  end if;

  if has_table_privilege('authenticated', 'public.attendance_attempts', 'SELECT') then
    raise exception 'authenticated can read attendance_attempts';
  end if;

  if has_function_privilege(
    'authenticated',
    'public._attendance_random_secret()',
    'EXECUTE'
  ) then
    raise exception 'authenticated can execute _attendance_random_secret';
  end if;

  if has_function_privilege(
    'anon',
    'public.attendance_join_session(uuid, text, text)',
    'EXECUTE'
  ) then
    raise exception 'anon can execute attendance_join_session';
  end if;

  if not has_function_privilege(
    'authenticated',
    'public.attendance_join_session(uuid, text, text)',
    'EXECUTE'
  ) then
    raise exception 'authenticated cannot execute attendance_join_session';
  end if;

  if (select count(*) from public.course_rosters where course_code = 'BM201') <> 12 then
    raise exception 'BM201 roster count is not 12';
  end if;

  if (select count(*) from public.course_rosters where course_code = 'BM305') <> 8 then
    raise exception 'BM305 roster count is not 8';
  end if;

  if (select academician_key from public.academician_courses where course_code = 'BM201')
     is distinct from 'mert' then
    raise exception 'BM201 owner is not mert';
  end if;

  v_code := public._attendance_code(
    'test-secret-value',
    '00000000-0000-4000-8000-000000000001'::uuid,
    0,
    8
  );

  if char_length(v_code) <> 8 then
    raise exception 'attendance code is not 8 characters';
  end if;

  if v_code ~ '[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]' then
    raise exception 'attendance code contains invalid characters';
  end if;

  -- --------------------------------------------------------------------------
  -- Tüm yoklama tablolarında RLS ve yazma yasağı
  -- --------------------------------------------------------------------------
  foreach v_table in array array[
    'academician_courses',
    'course_rosters',
    'attendance_sessions',
    'attendance_session_secrets',
    'attendance_participants',
    'attendance_signatures',
    'attendance_attempts'
  ]
  loop
    if not (
      select c.relrowsecurity
      from pg_class c
      where c.oid = ('public.' || v_table)::regclass
    ) then
      raise exception 'RLS is not enabled on %', v_table;
    end if;

    if has_table_privilege('authenticated', 'public.' || v_table, 'INSERT')
       or has_table_privilege('authenticated', 'public.' || v_table, 'UPDATE')
       or has_table_privilege('authenticated', 'public.' || v_table, 'DELETE')
       or has_table_privilege('authenticated', 'public.' || v_table, 'TRUNCATE')
    then
      raise exception 'authenticated has write privilege on %', v_table;
    end if;

    if has_table_privilege('anon', 'public.' || v_table, 'SELECT') then
      raise exception 'anon can select %', v_table;
    end if;
  end loop;

  -- --------------------------------------------------------------------------
  -- Pozitif tablo yetkileri: giriş ve mesajlaşma korunmalı
  -- --------------------------------------------------------------------------
  if not has_table_privilege('authenticated', 'public.profiles', 'SELECT') then
    raise exception 'authenticated lost profiles SELECT';
  end if;

  if has_table_privilege('authenticated', 'public.profiles', 'DELETE')
     or has_table_privilege('authenticated', 'public.profiles', 'TRUNCATE') then
    raise exception 'authenticated can delete profiles';
  end if;

  if not has_table_privilege('authenticated', 'public.conversations', 'SELECT')
     or not has_table_privilege('authenticated', 'public.conversations', 'INSERT') then
    raise exception 'authenticated lost conversations SELECT/INSERT';
  end if;

  if not has_table_privilege('authenticated', 'public.messages', 'SELECT')
     or not has_table_privilege('authenticated', 'public.messages', 'INSERT') then
    raise exception 'authenticated lost messages SELECT/INSERT';
  end if;

  if not has_table_privilege('authenticated', 'public.conversation_reads', 'SELECT')
     or not has_table_privilege('authenticated', 'public.conversation_reads', 'INSERT')
     or not has_table_privilege('authenticated', 'public.conversation_reads', 'UPDATE') then
    raise exception 'authenticated lost conversation_reads SELECT/INSERT/UPDATE';
  end if;

  if has_table_privilege('authenticated', 'public.conversation_reads', 'DELETE')
     or has_table_privilege('authenticated', 'public.conversation_reads', 'TRUNCATE') then
    raise exception 'authenticated can delete conversation_reads';
  end if;

  if not has_table_privilege('authenticated', 'public.academician_courses', 'SELECT')
     or not has_table_privilege('authenticated', 'public.course_rosters', 'SELECT')
     or not has_table_privilege('authenticated', 'public.attendance_sessions', 'SELECT')
     or not has_table_privilege('authenticated', 'public.attendance_participants', 'SELECT')
     or not has_table_privilege('authenticated', 'public.attendance_signatures', 'SELECT') then
    raise exception 'authenticated lost attendance SELECT privileges';
  end if;

  if has_table_privilege('authenticated', 'public.student_directory', 'SELECT') then
    raise exception 'authenticated can read student_directory';
  end if;

  -- --------------------------------------------------------------------------
  -- OTP trigger ve profil oluşturma yolu
  -- --------------------------------------------------------------------------
  if to_regprocedure('public.handle_new_user()') is null then
    raise exception 'handle_new_user() is missing';
  end if;

  if not (
    select p.prosecdef
    from pg_proc p
    where p.oid = to_regprocedure('public.handle_new_user()')
  ) then
    raise exception 'handle_new_user() is not SECURITY DEFINER';
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
      and t.tgfoid = to_regprocedure('public.handle_new_user()')
  ) then
    raise exception 'on_auth_user_created trigger is missing or disabled';
  end if;

  if has_function_privilege('anon', 'public.handle_new_user()', 'EXECUTE') then
    raise exception 'anon can execute handle_new_user';
  end if;

  if has_function_privilege('authenticated', 'public.purge_expired_messages()', 'EXECUTE')
     or has_function_privilege('anon', 'public.purge_expired_messages()', 'EXECUTE') then
    raise exception 'message purge function is executable by clients';
  end if;

  if has_function_privilege('authenticated', 'public.attendance_purge_attempts(integer)', 'EXECUTE')
     or has_function_privilege('anon', 'public.attendance_purge_attempts(integer)', 'EXECUTE') then
    raise exception 'attendance purge function is executable by clients';
  end if;

  -- --------------------------------------------------------------------------
  -- Fonksiyon EXECUTE matrisi
  -- --------------------------------------------------------------------------
  foreach v_function in array array[
    'public.current_profile_role()',
    'public.is_conversation_participant(uuid)',
    'public.is_admin()',
    'public.is_listed_academician(text)',
    'public.my_academician_key()',
    'public.my_student_number()',
    'public.is_course_owner(text)',
    'public.is_enrolled_in_course(text)',
    'public.is_session_owner(uuid)',
    'public.is_enrolled_in_session(uuid)',
    'public.attendance_start_session(text, integer)',
    'public.attendance_current_code(uuid)',
    'public.attendance_end_session(uuid)',
    'public.attendance_lookup_code(text)',
    'public.attendance_join_session(uuid, text, text)'
  ]
  loop
    if not has_function_privilege('authenticated', v_function, 'EXECUTE') then
      raise exception 'authenticated cannot execute %', v_function;
    end if;

    if has_function_privilege('anon', v_function, 'EXECUTE') then
      raise exception 'anon can execute %', v_function;
    end if;
  end loop;

  foreach v_function in array array[
    'public._attendance_hmac_sha256(text, text)',
    'public._attendance_sha256_hex(text)',
    'public._attendance_random_secret()',
    'public._attendance_code(text, uuid, bigint, integer)',
    'public._attendance_matching_slot(text, uuid, timestamptz, integer, text, integer)',
    'public._attendance_rate_limited(uuid)'
  ]
  loop
    if has_function_privilege('authenticated', v_function, 'EXECUTE') then
      raise exception 'authenticated can execute internal helper %', v_function;
    end if;
  end loop;

  raise notice 'Nova OBS P0 verification passed';
end
$verify$;

commit;
