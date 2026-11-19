-- ============================================================================
-- Nova OBS · P0 / 03 · Yetkilendirme ve fonksiyon ACL sertleştirmesi
-- ----------------------------------------------------------------------------
-- Amaç:
--   * RLS politikalarında kullanılan yardımcıların yalnızca authenticated
--     rolüne açık olması.
--   * İç yardımcıların (secret, kod, rate-limit) istemciye kapalı kalması.
--   * Trigger ve cron fonksiyonlarının doğrudan çağrılamaması.
--   * profiles / dizinler / yoklama tablolarında doğrudan yazma yetkisinin
--     bulunmaması.
--
-- SIRA: 01 ve 02 uygulandıktan sonra çalıştırılmalıdır.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. Trigger / cron / RLS yardımcıları
-- ----------------------------------------------------------------------------
revoke all on function public.handle_new_user()
  from public, anon, authenticated;

revoke all on function public.purge_expired_messages()
  from public, anon, authenticated;

revoke all on function public.current_profile_role()
  from public, anon;
grant execute on function public.current_profile_role()
  to authenticated;

revoke all on function public.is_conversation_participant(uuid)
  from public, anon;
grant execute on function public.is_conversation_participant(uuid)
  to authenticated;

revoke all on function public.is_admin()
  from public, anon;
grant execute on function public.is_admin()
  to authenticated;

revoke all on function public.is_listed_academician(text)
  from public, anon;
grant execute on function public.is_listed_academician(text)
  to authenticated;

revoke all on function public.my_academician_key()
  from public, anon;
grant execute on function public.my_academician_key()
  to authenticated;

revoke all on function public.my_student_number()
  from public, anon;
grant execute on function public.my_student_number()
  to authenticated;

revoke all on function public.is_course_owner(text)
  from public, anon;
grant execute on function public.is_course_owner(text)
  to authenticated;

revoke all on function public.is_enrolled_in_course(text)
  from public, anon;
grant execute on function public.is_enrolled_in_course(text)
  to authenticated;

revoke all on function public.is_session_owner(uuid)
  from public, anon;
grant execute on function public.is_session_owner(uuid)
  to authenticated;

revoke all on function public.is_enrolled_in_session(uuid)
  from public, anon;
grant execute on function public.is_enrolled_in_session(uuid)
  to authenticated;

-- ----------------------------------------------------------------------------
-- 2. Yoklama iç yardımcıları: tamamen kapalı
-- ----------------------------------------------------------------------------
revoke all on function public._attendance_hmac_sha256(text, text)
  from public, anon, authenticated;
revoke all on function public._attendance_sha256_hex(text)
  from public, anon, authenticated;
revoke all on function public._attendance_random_secret()
  from public, anon, authenticated;
revoke all on function public._attendance_code(text, uuid, bigint, integer)
  from public, anon, authenticated;
revoke all on function public._attendance_matching_slot(
  text, uuid, timestamptz, integer, text, integer
) from public, anon, authenticated;
revoke all on function public._attendance_rate_limited(uuid)
  from public, anon, authenticated;
revoke all on function public.attendance_purge_attempts(integer)
  from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3. Yoklama RPC'leri: yalnızca authenticated
-- ----------------------------------------------------------------------------
revoke all on function public.attendance_start_session(text, integer)
  from public, anon;
grant execute on function public.attendance_start_session(text, integer)
  to authenticated;

revoke all on function public.attendance_current_code(uuid)
  from public, anon;
grant execute on function public.attendance_current_code(uuid)
  to authenticated;

revoke all on function public.attendance_end_session(uuid)
  from public, anon;
grant execute on function public.attendance_end_session(uuid)
  to authenticated;

revoke all on function public.attendance_lookup_code(text)
  from public, anon;
grant execute on function public.attendance_lookup_code(text)
  to authenticated;

revoke all on function public.attendance_join_session(uuid, text, text)
  from public, anon;
grant execute on function public.attendance_join_session(uuid, text, text)
  to authenticated;

-- ----------------------------------------------------------------------------
-- 4. Tablo ACL'leri: doğrudan yazma yok
-- ----------------------------------------------------------------------------
revoke insert, update, delete, truncate on table public.profiles
  from anon, authenticated;

revoke all on table public.academician_directory, public.student_directory
  from public, anon, authenticated;

revoke update, delete, truncate on table
  public.conversations,
  public.messages
from anon, authenticated;

-- conversation_reads için istemcinin okundu bilgisi yazması gerekir.
-- Bu tabloda select/insert/update korunur; delete/truncate kapalıdır.
revoke delete, truncate on table public.conversation_reads
  from anon, authenticated;

revoke insert, update, delete, truncate on table
  public.academician_courses,
  public.course_rosters,
  public.attendance_sessions,
  public.attendance_participants,
  public.attendance_signatures,
  public.attendance_session_secrets,
  public.attendance_attempts
from public, anon, authenticated;

revoke all on table
  public.attendance_session_secrets,
  public.attendance_attempts
from public, anon, authenticated;

grant select on table
  public.academician_courses,
  public.course_rosters,
  public.attendance_sessions,
  public.attendance_participants,
  public.attendance_signatures
to authenticated;

-- ----------------------------------------------------------------------------
-- 5. Uygulama sonrası otomatik kontroller
-- ----------------------------------------------------------------------------
do $verify$
declare
  v_table text;
  v_function text;
begin
  if not (
    select relrowsecurity
    from pg_class
    where oid = 'public.profiles'::regclass
  ) then
    raise exception 'profiles RLS is not enabled';
  end if;

  if not (
    select relrowsecurity
    from pg_class
    where oid = 'public.academician_directory'::regclass
  ) then
    raise exception 'academician_directory RLS is not enabled';
  end if;

  if not (
    select relrowsecurity
    from pg_class
    where oid = 'public.student_directory'::regclass
  ) then
    raise exception 'student_directory RLS is not enabled';
  end if;

  if not (
    select relrowsecurity
    from pg_class
    where oid = 'public.attendance_sessions'::regclass
  ) then
    raise exception 'attendance_sessions RLS is not enabled';
  end if;

  if not (
    select relrowsecurity
    from pg_class
    where oid = 'public.attendance_session_secrets'::regclass
  ) then
    raise exception 'attendance_session_secrets RLS is not enabled';
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and cmd = 'INSERT'
  ) then
    raise exception 'profiles still has an INSERT policy';
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename in ('attendance_session_secrets', 'attendance_attempts')
  ) then
    raise exception 'secret/attempt tables must not have policies';
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

  if has_table_privilege('anon', 'public.student_directory', 'SELECT') then
    raise exception 'anon can read student_directory';
  end if;

  if has_table_privilege('authenticated', 'public.attendance_sessions', 'INSERT') then
    raise exception 'authenticated can insert attendance sessions';
  end if;

  if has_table_privilege('authenticated', 'public.attendance_session_secrets', 'SELECT') then
    raise exception 'authenticated can read attendance secrets';
  end if;

  if has_table_privilege('authenticated', 'public.attendance_attempts', 'SELECT') then
    raise exception 'authenticated can read attendance attempts';
  end if;

  if not has_function_privilege(
    'authenticated',
    'public.attendance_join_session(uuid, text, text)',
    'EXECUTE'
  ) then
    raise exception 'authenticated cannot execute attendance_join_session';
  end if;

  if has_function_privilege(
    'anon',
    'public.attendance_join_session(uuid, text, text)',
    'EXECUTE'
  ) then
    raise exception 'anon can execute attendance_join_session';
  end if;

  if has_function_privilege(
    'authenticated',
    'public._attendance_random_secret()',
    'EXECUTE'
  ) then
    raise exception 'authenticated can execute secret generator';
  end if;

  if has_function_privilege(
    'authenticated',
    'public.handle_new_user()',
    'EXECUTE'
  ) then
    raise exception 'authenticated can execute handle_new_user';
  end if;

  -- --------------------------------------------------------------------------
  -- Pozitif kontroller: giriş ve mesajlaşma yolları korunmalı
  -- --------------------------------------------------------------------------
  if not has_table_privilege('authenticated', 'public.profiles', 'SELECT') then
    raise exception 'authenticated lost profiles SELECT';
  end if;

  if not has_table_privilege('authenticated', 'public.conversations', 'SELECT')
     or not has_table_privilege('authenticated', 'public.conversations', 'INSERT')
  then
    raise exception 'authenticated lost conversations SELECT/INSERT';
  end if;

  if not has_table_privilege('authenticated', 'public.messages', 'SELECT')
     or not has_table_privilege('authenticated', 'public.messages', 'INSERT')
  then
    raise exception 'authenticated lost messages SELECT/INSERT';
  end if;

  if not has_table_privilege('authenticated', 'public.conversation_reads', 'SELECT')
     or not has_table_privilege('authenticated', 'public.conversation_reads', 'INSERT')
     or not has_table_privilege('authenticated', 'public.conversation_reads', 'UPDATE')
  then
    raise exception 'authenticated lost conversation_reads SELECT/INSERT/UPDATE';
  end if;

  if has_table_privilege('authenticated', 'public.conversation_reads', 'DELETE')
     or has_table_privilege('authenticated', 'public.conversation_reads', 'TRUNCATE')
  then
    raise exception 'authenticated can delete conversation_reads';
  end if;

  if has_table_privilege('authenticated', 'public.student_directory', 'SELECT') then
    raise exception 'authenticated can read student_directory';
  end if;

  -- OTP girişinin profil oluşturma yolu
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
     or has_function_privilege('anon', 'public.purge_expired_messages()', 'EXECUTE')
  then
    raise exception 'message purge function is executable by clients';
  end if;

  if has_function_privilege('authenticated', 'public.attendance_purge_attempts(integer)', 'EXECUTE')
     or has_function_privilege('anon', 'public.attendance_purge_attempts(integer)', 'EXECUTE')
  then
    raise exception 'attendance purge function is executable by clients';
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
end
$verify$;

commit;
