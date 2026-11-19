-- ============================================================================
-- Nova OBS · P0 / 01 · Geri alma (YIKICI)
-- ----------------------------------------------------------------------------
-- !!! UYARI: BU DOSYA TÜM YOKLAMA VERİSİNİ KALICI OLARAK SİLER. !!!
--
-- Silinen veriler:
--   * attendance_sessions, attendance_session_secrets
--   * attendance_participants, attendance_signatures
--   * attendance_attempts
--   * academician_courses ve course_rosters (seed kayıtları dahil)
--
-- Korunan veriler:
--   * profiles, conversations, messages, conversation_reads
--   * auth.users ve Supabase Auth oturumları
--
-- Çalıştırmadan önce zorunlu adımlar:
--   1. Önce 03, sonra 02 geri alınmış olmalı.
--   2. Canlı veritabanının fiziksel yedeği alınmış olmalı.
--   3. Yoklama kayıtları gerekliyse ayrıca yedekleyin; örnek:
--        create table public._backup_attendance_sessions as
--          select * from public.attendance_sessions;
--        create table public._backup_attendance_participants as
--          select * from public.attendance_participants;
--        create table public._backup_attendance_signatures as
--          select * from public.attendance_signatures;
--   4. Bu dosya kasıtlı olarak çalıştırılmalıdır; otomatik/CI hattına
--      bağlanmamalıdır.
--
-- SIRA: Önce 03, sonra 02 geri alınmalıdır. 02'deki profiles politikası
-- public.is_admin() fonksiyonuna bağlıdır; 01'i doğrudan geri almak bu
-- politikayı da düşürebilir.
--
-- Bu dosya yalnızca 01 migration'ının oluşturduğu nesneleri kaldırır.
-- Mevcut profiles/conversations/messages verilerine dokunmaz.
-- ============================================================================

begin;

-- Yapısal koruma: aynı isimli ama farklı şemalı tabloları silme.
do $rollback_guard$
declare
  v_mismatch text;
begin
  select string_agg(x.name, ', ' order by x.name)
    into v_mismatch
  from (
    values
      ('academician_courses', 'academician_key'),
      ('course_rosters', 'student_number'),
      ('attendance_sessions', 'rotation_seconds'),
      ('attendance_session_secrets', 'secret'),
      ('attendance_participants', 'code_slot'),
      ('attendance_signatures', 'signature_sha256'),
      ('attendance_attempts', 'reason')
  ) as x(name, signature_column)
  where to_regclass('public.' || x.name) is not null
    and not exists (
      select 1
      from information_schema.columns c
      where c.table_schema = 'public'
        and c.table_name = x.name
        and c.column_name = x.signature_column
    );

  if v_mismatch is not null then
    raise exception
      'Geri alma durduruldu: şu tablolar P0 şemasına benzemiyor: %', v_mismatch
      using hint = 'Aynı isimli farklı tabloları silmemek için önce manuel inceleme yapın.';
  end if;

  -- Provenance kontrolü: tablolar varsa 01'in yardımcı fonksiyonu da olmalı.
  -- Aynı isimli, elle oluşturulmuş tabloları silmemek için ek koruma.
  if to_regclass('public.attendance_sessions') is not null
     and to_regprocedure('public._attendance_sha256_hex(text)') is null
  then
    raise exception
      'Geri alma durduruldu: yoklama tabloları var ama 01 yardımcı fonksiyonu yok; kaynak belirsiz.'
      using hint = 'Tabloların 01 migration''ından geldiğini doğrulamadan silmeyin.';
  end if;
end
$rollback_guard$;

-- Realtime yayınından çıkar ---------------------------------------------------
do $realtime$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    begin
      alter publication supabase_realtime
        drop table public.attendance_participants;
    exception
      when undefined_object then null;
    end;

    begin
      alter publication supabase_realtime
        drop table public.attendance_sessions;
    exception
      when undefined_object then null;
    end;
  end if;
end
$realtime$;

-- Zamanlanmış temizleme işini kaldır -----------------------------------------
-- Fonksiyon silinmeden önce cron işi kaldırılmazsa iş her saat hata verir.
do $cron$
declare
  v_job_id bigint;
begin
  if to_regclass('cron.job') is null then
    return;
  end if;

  execute 'select jobid from cron.job where jobname = $1'
    into v_job_id
    using 'nova-obs-purge-attendance-attempts';

  if v_job_id is not null then
    execute format('select cron.unschedule(%s)', v_job_id);
  end if;
end
$cron$;

-- RPC'ler --------------------------------------------------------------------
drop function if exists public.attendance_purge_attempts(integer);
drop function if exists public.attendance_join_session(uuid, text, text);
drop function if exists public.attendance_lookup_code(text);
drop function if exists public.attendance_end_session(uuid);
drop function if exists public.attendance_current_code(uuid);
drop function if exists public.attendance_start_session(text, integer);

-- İç yardımcılar -------------------------------------------------------------
drop function if exists public._attendance_rate_limited(uuid);
drop function if exists public.is_enrolled_in_session(uuid);
drop function if exists public.is_session_owner(uuid);
drop function if exists public.is_enrolled_in_course(text);
drop function if exists public.is_course_owner(text);
drop function if exists public.my_student_number();
drop function if exists public.my_academician_key();
drop function if exists public.is_admin();
drop function if exists public._attendance_matching_slot(
  text, uuid, timestamptz, integer, text, integer
);
drop function if exists public._attendance_code(text, uuid, bigint, integer);
drop function if exists public._attendance_random_secret();
drop function if exists public._attendance_sha256_hex(text);
drop function if exists public._attendance_hmac_sha256(text, text);

-- Tablolar (bağımlılık sırası) ----------------------------------------------
drop table if exists public.attendance_signatures;
drop table if exists public.attendance_participants;
drop table if exists public.attendance_attempts;
drop table if exists public.attendance_session_secrets;
drop table if exists public.attendance_sessions;
drop table if exists public.course_rosters;
drop table if exists public.academician_courses;

commit;

-- ============================================================================
-- Geri alma sonrası kontrol
-- ----------------------------------------------------------------------------
-- Aşağıdaki sorgu tüm nesnelerin kaldırıldığını doğrulamalıdır:
--
-- select object_name,
--        to_regclass('public.' || object_name) is not null as still_exists
-- from unnest(array[
--   'academician_courses',
--   'course_rosters',
--   'attendance_sessions',
--   'attendance_session_secrets',
--   'attendance_participants',
--   'attendance_signatures',
--   'attendance_attempts'
-- ]) as object_name;
-- ============================================================================
