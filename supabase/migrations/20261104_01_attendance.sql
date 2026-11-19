-- ============================================================================
-- Nova OBS · P0 / 01 · Sunucu taraflı QR yoklama şeması
-- ----------------------------------------------------------------------------
-- Bu migration yalnızca YENİ tablolar, yardımcı fonksiyonlar ve RPC'ler
-- oluşturur. Mevcut profiles / conversations / messages tablolarını değiştirmez.
--
-- Çalıştırmadan önce:
--   1. 20261104_00_preflight_readonly.sql çalıştırılıp çıktısı incelenmeli.
--   2. Canlı veritabanının fiziksel yedeği alınmalı.
--   3. attendance_* nesnelerinin daha önce oluşturulmadığı doğrulanmalı.
--
-- Tasarım sınırları:
--   * Kod 8 karakterdir; 20 saniyede bir döner.
--   * Geçerli kod + önceki 3 slot kabul edilir (yaklaşık 60-80 sn imza payı).
--   * Yalnızca course_rosters içindeki öğrenci katılabilir.
--   * Tekrar katılım hem profil hem öğrenci numarası düzeyinde engellenir.
--   * Geçersiz kod denemesi profil başına 60 saniyede 5 ile sınırlıdır.
--   * İmza data URL olarak saklanır; çözülmüş boyut 200 KiB ile sınırlıdır.
--   * Secret, oturum sahibi akademisyen dahil hiçbir istemciye verilmez.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 0. Çakışma koruması (tek seferlik migration)
-- ----------------------------------------------------------------------------
-- 01 yalnızca boş bir isim alanına uygulanır. Aynı isimli tablo, index veya
-- fonksiyon varsa `create or replace` mevcut şemayı sessizce bozabilir; bu
-- blok transaction'ın tamamını geri alarak durdurur.
do $collision_guard$
declare
  v_tables text;
  v_functions text;
begin
  select string_agg(t.name, ', ' order by t.name)
    into v_tables
  from unnest(array[
    'academician_courses',
    'course_rosters',
    'attendance_sessions',
    'attendance_session_secrets',
    'attendance_participants',
    'attendance_signatures',
    'attendance_attempts'
  ]) as t(name)
  where to_regclass('public.' || t.name) is not null;

  if v_tables is not null then
    raise exception
      '01 uygulanamaz: şu tablolar zaten var: %', v_tables
      using hint = 'Mevcut şemayı inceleyin; 00 preflight ve README koşullarını uygulayın.';
  end if;

  select string_agg(distinct p.proname, ', ' order by p.proname)
    into v_functions
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and (
      p.proname ~ '^_?attendance_'
      or p.proname in (
        'is_admin',
        'my_academician_key',
        'my_student_number',
        'is_course_owner',
        'is_enrolled_in_course',
        'is_session_owner',
        'is_enrolled_in_session'
      )
    );

  if v_functions is not null then
    raise exception
      '01 uygulanamaz: şu fonksiyon adları zaten kullanılıyor: %', v_functions
      using hint = 'Fonksiyonları inceleyin; create or replace mevcut gövdeyi ezer.';
  end if;
end
$collision_guard$;

-- ----------------------------------------------------------------------------
-- 1. pgcrypto bağımlılığı ve şema çözümlü iç yardımcılar
-- ----------------------------------------------------------------------------
-- Supabase pgcrypto'yu genellikle "extensions" şemasına kurar. search_path=''
-- kullanan SECURITY DEFINER fonksiyonlarda extensions.hmac gibi sabit bir şema
-- varsaymak kırılgandır. Bu yüzden gerçek şema bir kez tespit edilip
-- iç yardımcılar oluşturulur.
do $migration$
declare
  v_crypto_schema text;
begin
  select n.nspname
    into v_crypto_schema
  from pg_extension e
  join pg_namespace n on n.oid = e.extnamespace
  where e.extname = 'pgcrypto';

  if v_crypto_schema is null then
    raise exception 'pgcrypto extension is required for attendance';
  end if;

  execute format($ddl$
    create or replace function public._attendance_hmac_sha256(
      p_message text,
      p_key text
    )
    returns bytea
    language sql
    immutable
    security definer
    set search_path = ''
    as $fn$
      select %I.hmac(
        pg_catalog.convert_to(p_message, 'UTF8'),
        pg_catalog.convert_to(p_key, 'UTF8'),
        'sha256'::text
      )
    $fn$;
  $ddl$, v_crypto_schema);

  execute format($ddl$
    create or replace function public._attendance_sha256_hex(p_text text)
    returns text
    language sql
    immutable
    security definer
    set search_path = ''
    as $fn$
      select pg_catalog.encode(
        %I.digest(
          pg_catalog.convert_to(p_text, 'UTF8'),
          'sha256'::text
        ),
        'hex'
      )
    $fn$;
  $ddl$, v_crypto_schema);

  execute format($ddl$
    create or replace function public._attendance_random_secret()
    returns text
    language sql
    volatile
    security definer
    set search_path = ''
    as $fn$
      select pg_catalog.encode(%I.gen_random_bytes(32), 'base64')
    $fn$;
  $ddl$, v_crypto_schema);
end
$migration$;

revoke all on function public._attendance_hmac_sha256(text, text)
  from public, anon, authenticated;
revoke all on function public._attendance_sha256_hex(text)
  from public, anon, authenticated;
revoke all on function public._attendance_random_secret()
  from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 2. Ders sahipliği ve ders listeleri
-- ----------------------------------------------------------------------------
create table public.academician_courses (
  course_code text primary key,
  course_name text not null,
  -- KVKK: dizin kaydı silindiğinde ders kaydı korunur, sahiplik NULL'a düşer.
  -- Sahipsiz ders için yoklama başlatılamaz (is_course_owner false).
  academician_key text
    references public.academician_directory (academician_key)
    on update cascade
    on delete set null,
  term text not null default '',
  room text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint academician_courses_code_format
    check (course_code ~ '^[A-Z]{2,8}[0-9]{3,4}$'),
  constraint academician_courses_name_length
    check (char_length(btrim(course_name)) between 1 and 160)
);

create index academician_courses_owner_idx
  on public.academician_courses (academician_key)
  where academician_key is not null;

create table public.course_rosters (
  course_code text not null
    references public.academician_courses (course_code)
    on update cascade
    on delete cascade,
  student_number text not null,
  student_name text not null default '',
  created_at timestamptz not null default now(),
  primary key (course_code, student_number),
  constraint course_rosters_student_number_format
    check (student_number ~ '^[0-9]{4,12}$'),
  constraint course_rosters_student_name_length
    check (char_length(btrim(student_name)) <= 160)
);

create index course_rosters_student_idx
  on public.course_rosters (student_number);

-- ----------------------------------------------------------------------------
-- 3. Yoklama oturumları, secret, katılımcı, imza ve deneme kayıtları
-- ----------------------------------------------------------------------------
create table public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  course_code text not null
    references public.academician_courses (course_code)
    on update cascade
    on delete restrict,
  course_name text not null,
  term text not null default '',
  room text not null default '',
  -- KVKK: akademisyen dizin kaydı silinirse geçmiş oturum korunur.
  -- academician_name denormalize edildiği için denetim izi kaybolmaz.
  academician_key text
    references public.academician_directory (academician_key)
    on update cascade
    on delete set null,
  academician_name text not null,
  -- KVKK: profil/hesap silindiğinde oturum silinmez, açan kişi NULL'a düşer.
  opened_by uuid
    references public.profiles (id)
    on update cascade
    on delete set null,
  started_at timestamptz not null default clock_timestamp(),
  ends_at timestamptz not null,
  duration_minutes integer not null,
  rotation_seconds integer not null default 20,
  status text not null default 'active',
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  constraint attendance_sessions_status_check
    check (status in ('active', 'ended')),
  constraint attendance_sessions_end_check
    check (ends_at > started_at),
  constraint attendance_sessions_duration_check
    check (duration_minutes between 5 and 120),
  constraint attendance_sessions_rotation_check
    check (rotation_seconds between 10 and 120),
  constraint attendance_sessions_ended_at_check
    check (
      (status = 'active' and ended_at is null)
      or (status = 'ended' and ended_at is not null)
    )
);

create unique index attendance_sessions_one_active_per_course_idx
  on public.attendance_sessions (course_code)
  where status = 'active';

create unique index attendance_sessions_one_active_per_academician_idx
  on public.attendance_sessions (academician_key)
  where status = 'active';

create index attendance_sessions_active_ends_idx
  on public.attendance_sessions (ends_at)
  where status = 'active';

create index attendance_sessions_owner_started_idx
  on public.attendance_sessions (academician_key, started_at desc);

create table public.attendance_session_secrets (
  session_id uuid primary key
    references public.attendance_sessions (id)
    on delete cascade,
  secret text not null,
  created_at timestamptz not null default now(),
  constraint attendance_session_secrets_length
    check (char_length(secret) between 40 and 128)
);

create table public.attendance_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null
    references public.attendance_sessions (id)
    on delete cascade,
  -- KVKK: öğrenci hesabı silindiğinde katılım kaydı korunur; kimlik
  -- student_number/student_name üzerinden denetim için saklanır.
  student_profile_id uuid
    references public.profiles (id)
    on update cascade
    on delete set null,
  student_number text not null,
  student_name text not null,
  code_slot bigint not null,
  signed_at timestamptz not null default clock_timestamp(),
  constraint attendance_participants_number_format
    check (student_number ~ '^[0-9]{4,12}$'),
  constraint attendance_participants_name_length
    check (char_length(btrim(student_name)) between 1 and 160),
  constraint attendance_participants_slot_check
    check (code_slot >= 0),
  constraint attendance_participants_unique_student
    unique (session_id, student_profile_id),
  constraint attendance_participants_unique_number
    unique (session_id, student_number)
);

create index attendance_participants_student_idx
  on public.attendance_participants (student_profile_id, signed_at desc);

create table public.attendance_signatures (
  participant_id uuid primary key
    references public.attendance_participants (id)
    on delete cascade,
  session_id uuid not null
    references public.attendance_sessions (id)
    on delete cascade,
  -- KVKK: öğrenci hesabı silindiğinde imza kaydı ve SHA-256 özeti korunur.
  student_profile_id uuid
    references public.profiles (id)
    on update cascade
    on delete set null,
  signature_data text not null,
  mime_type text not null,
  byte_size integer not null,
  signature_sha256 text not null,
  created_at timestamptz not null default now(),
  constraint attendance_signatures_data_length
    check (char_length(signature_data) between 1 and 300000),
  constraint attendance_signatures_data_format
    check (signature_data ~ '^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$'),
  constraint attendance_signatures_mime_check
    check (mime_type in ('image/png', 'image/jpeg', 'image/webp')),
  constraint attendance_signatures_byte_size
    check (byte_size between 1 and 204800),
  constraint attendance_signatures_hash_format
    check (signature_sha256 ~ '^[0-9a-f]{64}$')
);

create index attendance_signatures_student_idx
  on public.attendance_signatures (student_profile_id);

create table public.attendance_attempts (
  id bigint generated always as identity primary key,
  profile_id uuid not null
    references public.profiles (id)
    on delete cascade,
  session_id uuid
    references public.attendance_sessions (id)
    on delete cascade,
  reason text not null,
  attempted_at timestamptz not null default clock_timestamp(),
  constraint attendance_attempts_reason_check
    check (reason in ('invalid-code'))
);

create index attendance_attempts_rate_idx
  on public.attendance_attempts (profile_id, attempted_at desc)
  where reason = 'invalid-code';

-- ----------------------------------------------------------------------------
-- 4. Kod üretimi ve doğrulaması
-- ----------------------------------------------------------------------------
create or replace function public._attendance_code(
  p_secret text,
  p_session_id uuid,
  p_slot bigint,
  p_length integer default 8
)
returns text
language plpgsql
immutable
security definer
set search_path = ''
as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_digest bytea;
  v_code text := '';
  v_byte integer;
  v_index integer;
begin
  if p_length < 6 or p_length > 32 then
    raise exception 'attendance code length must be between 6 and 32'
      using errcode = '22023';
  end if;

  if p_slot is null or p_slot < 0 then
    raise exception 'attendance code slot must be non-negative'
      using errcode = '22023';
  end if;

  v_digest := public._attendance_hmac_sha256(
    p_session_id::text || ':' || p_slot::text,
    p_secret
  );

  for v_index in 0..(p_length - 1) loop
    v_byte := pg_catalog.get_byte(v_digest, v_index);
    v_code := v_code || pg_catalog.substr(v_alphabet, (v_byte % 32) + 1, 1);
  end loop;

  return v_code;
end;
$$;

revoke all on function public._attendance_code(text, uuid, bigint, integer)
  from public, anon, authenticated;

create or replace function public._attendance_matching_slot(
  p_secret text,
  p_session_id uuid,
  p_started_at timestamptz,
  p_rotation_seconds integer,
  p_code text,
  p_length integer default 8
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text := upper(btrim(coalesce(p_code, '')));
  v_slot bigint;
  v_offset integer;
  v_candidate bigint;
begin
  if char_length(v_code) <> p_length
    or v_code ~ '[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]'
  then
    return null;
  end if;

  v_slot := greatest(
    0::bigint,
    floor(
      extract(epoch from (clock_timestamp() - p_started_at))
      / greatest(p_rotation_seconds, 1)
    )::bigint
  );

  -- Geçerli slot + önceki 3 slot. İmza adımı birkaç rotasyon sürebilir.
  for v_offset in 0..3 loop
    v_candidate := v_slot - v_offset;

    if v_candidate < 0 then
      continue;
    end if;

    if public._attendance_code(
      p_secret,
      p_session_id,
      v_candidate,
      p_length
    ) = v_code then
      return v_candidate;
    end if;
  end loop;

  return null;
end;
$$;

revoke all on function public._attendance_matching_slot(
  text, uuid, timestamptz, integer, text, integer
) from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 5. RLS yardımcıları (yalnızca çağıranın kendi kimliğini okur)
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.my_academician_key()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select academician_key
  from public.profiles
  where id = auth.uid()
    and role = 'academician';
$$;

create or replace function public.my_student_number()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select student_number
  from public.profiles
  where id = auth.uid()
    and role = 'student';
$$;

create or replace function public.is_course_owner(p_course_code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.academician_courses c
    where c.course_code = p_course_code
      and c.academician_key is not null
      and c.academician_key = public.my_academician_key()
  );
$$;

create or replace function public.is_enrolled_in_course(p_course_code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.course_rosters r
    where r.course_code = p_course_code
      and r.student_number = public.my_student_number()
  );
$$;

create or replace function public.is_session_owner(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.attendance_sessions s
    join public.profiles p on p.id = s.opened_by
    where s.id = p_session_id
      and s.opened_by = auth.uid()
      and p.role = 'academician'
  );
$$;

create or replace function public.is_enrolled_in_session(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.attendance_sessions s
    join public.course_rosters r
      on r.course_code = s.course_code
     and r.student_number = public.my_student_number()
    where s.id = p_session_id
  );
$$;

create or replace function public._attendance_rate_limited(p_profile_id uuid)
returns boolean
language sql
volatile
security definer
set search_path = ''
as $$
  select count(*) >= 5
  from public.attendance_attempts a
  where a.profile_id = p_profile_id
    and a.reason = 'invalid-code'
    and a.attempted_at > clock_timestamp() - interval '60 seconds';
$$;

revoke all on function public.is_admin() from public, anon;
revoke all on function public.my_academician_key() from public, anon;
revoke all on function public.my_student_number() from public, anon;
revoke all on function public.is_course_owner(text) from public, anon;
revoke all on function public.is_enrolled_in_course(text) from public, anon;
revoke all on function public.is_session_owner(uuid) from public, anon;
revoke all on function public.is_enrolled_in_session(uuid) from public, anon;
revoke all on function public._attendance_rate_limited(uuid)
  from public, anon, authenticated;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.my_academician_key() to authenticated;
grant execute on function public.my_student_number() to authenticated;
grant execute on function public.is_course_owner(text) to authenticated;
grant execute on function public.is_enrolled_in_course(text) to authenticated;
grant execute on function public.is_session_owner(uuid) to authenticated;
grant execute on function public.is_enrolled_in_session(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- 6. RLS politikaları
-- ----------------------------------------------------------------------------
alter table public.academician_courses enable row level security;
alter table public.course_rosters enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.attendance_session_secrets enable row level security;
alter table public.attendance_participants enable row level security;
alter table public.attendance_signatures enable row level security;
alter table public.attendance_attempts enable row level security;

drop policy if exists "academician_courses_select_scope"
  on public.academician_courses;
create policy "academician_courses_select_scope"
on public.academician_courses
for select
to authenticated
using (
  public.is_admin()
  or public.is_course_owner(course_code)
  or public.is_enrolled_in_course(course_code)
);

drop policy if exists "course_rosters_select_scope"
  on public.course_rosters;
create policy "course_rosters_select_scope"
on public.course_rosters
for select
to authenticated
using (
  public.is_admin()
  or public.is_course_owner(course_code)
  or student_number = public.my_student_number()
);

drop policy if exists "attendance_sessions_select_scope"
  on public.attendance_sessions;
create policy "attendance_sessions_select_scope"
on public.attendance_sessions
for select
to authenticated
using (
  public.is_admin()
  or public.is_session_owner(id)
  or public.is_enrolled_in_session(id)
);

drop policy if exists "attendance_participants_select_scope"
  on public.attendance_participants;
create policy "attendance_participants_select_scope"
on public.attendance_participants
for select
to authenticated
using (
  public.is_admin()
  or public.is_session_owner(session_id)
  or student_profile_id = auth.uid()
);

drop policy if exists "attendance_signatures_select_scope"
  on public.attendance_signatures;
create policy "attendance_signatures_select_scope"
on public.attendance_signatures
for select
to authenticated
using (
  public.is_admin()
  or public.is_session_owner(session_id)
  or student_profile_id = auth.uid()
);

-- attendance_session_secrets ve attendance_attempts için bilinçli olarak
-- politika YOKTUR. Ayrıca aşağıda authenticated/anon yetkileri kaldırılır.

-- ----------------------------------------------------------------------------
-- 7. Tablo ve fonksiyon yetkileri
-- ----------------------------------------------------------------------------
revoke all on table
  public.academician_courses,
  public.course_rosters,
  public.attendance_sessions,
  public.attendance_participants,
  public.attendance_signatures
from public, anon, authenticated;

grant select on table
  public.academician_courses,
  public.course_rosters,
  public.attendance_sessions,
  public.attendance_participants,
  public.attendance_signatures
to authenticated;

revoke all on table
  public.attendance_session_secrets,
  public.attendance_attempts
from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 8. RPC'ler
-- ----------------------------------------------------------------------------
create or replace function public.attendance_start_session(
  p_course_code text,
  p_duration_minutes integer default 15
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles%rowtype;
  v_course public.academician_courses%rowtype;
  v_session_id uuid := gen_random_uuid();
  v_started_at timestamptz := clock_timestamp();
  v_ends_at timestamptz;
  v_duration integer := coalesce(p_duration_minutes, 15);
  v_rotation integer := 20;
  v_secret text;
  v_code text;
begin
  select *
    into v_profile
  from public.profiles
  where id = auth.uid();

  if not found or v_profile.role <> 'academician' then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;

  select *
    into v_course
  from public.academician_courses
  where course_code = upper(btrim(p_course_code))
    and is_active;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'course-not-found');
  end if;

  if v_course.academician_key is null
    or v_course.academician_key is distinct from v_profile.academician_key
  then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;

  if v_duration < 5 or v_duration > 120 then
    return jsonb_build_object('ok', false, 'reason', 'invalid-duration');
  end if;

  v_ends_at := v_started_at + make_interval(mins => v_duration);
  v_secret := public._attendance_random_secret();

  begin
    -- Aynı akademisyenin veya aynı dersin önceki aktif oturumunu kapat.
    -- Update ve insert aynı alt işlemde tutulur; insert çakışırsa kapatma
    -- işlemi de geri alınır.
    update public.attendance_sessions
    set status = 'ended',
        ended_at = v_started_at
    where status = 'active'
      and (
        course_code = v_course.course_code
        or academician_key = v_profile.academician_key
      );

    insert into public.attendance_sessions (
      id,
      course_code,
      course_name,
      term,
      room,
      academician_key,
      academician_name,
      opened_by,
      started_at,
      ends_at,
      duration_minutes,
      rotation_seconds,
      status
    )
    values (
      v_session_id,
      v_course.course_code,
      v_course.course_name,
      v_course.term,
      v_course.room,
      v_profile.academician_key,
      coalesce(nullif(v_profile.full_name, ''), v_profile.email),
      v_profile.id,
      v_started_at,
      v_ends_at,
      v_duration,
      v_rotation,
      'active'
    );
  exception
    when unique_violation then
      return jsonb_build_object('ok', false, 'reason', 'session-conflict');
  end;

  insert into public.attendance_session_secrets (session_id, secret)
  values (v_session_id, v_secret);

  v_code := public._attendance_code(v_secret, v_session_id, 0, 8);

  return jsonb_build_object(
    'ok', true,
    'session', jsonb_build_object(
      'id', v_session_id,
      'courseCode', v_course.course_code,
      'courseName', v_course.course_name,
      'term', v_course.term,
      'room', v_course.room,
      'academicianName', coalesce(nullif(v_profile.full_name, ''), v_profile.email),
      'startedAt', v_started_at,
      'endsAt', v_ends_at,
      'durationMinutes', v_duration,
      'rotationSeconds', v_rotation,
      'status', 'active'
    ),
    'code', v_code,
    'codeExpiresAt', v_started_at + make_interval(secs => v_rotation),
    'serverTime', clock_timestamp()
  );
end;
$$;

revoke all on function public.attendance_start_session(text, integer)
  from public, anon;
grant execute on function public.attendance_start_session(text, integer)
  to authenticated;

create or replace function public.attendance_current_code(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.attendance_sessions%rowtype;
  v_secret text;
  v_now timestamptz := clock_timestamp();
  v_slot bigint;
  v_code text;
  v_expires_at timestamptz;
  v_status text;
begin
  select *
    into v_session
  from public.attendance_sessions
  where id = p_session_id;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not-found');
  end if;

  if not public.is_session_owner(p_session_id) then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;

  select secret
    into v_secret
  from public.attendance_session_secrets
  where session_id = p_session_id;

  if v_secret is null then
    return jsonb_build_object('ok', false, 'reason', 'not-found');
  end if;

  v_status := case
    when v_session.status = 'ended' then 'ended'
    when v_now >= v_session.ends_at then 'expired'
    else 'active'
  end;

  if v_status <> 'active' then
    return jsonb_build_object(
      'ok', true,
      'status', v_status,
      'code', null,
      'sessionId', v_session.id,
      'endsAt', v_session.ends_at,
      'serverTime', v_now
    );
  end if;

  v_slot := greatest(
    0::bigint,
    floor(
      extract(epoch from (v_now - v_session.started_at))
      / greatest(v_session.rotation_seconds, 1)
    )::bigint
  );

  v_code := public._attendance_code(
    v_secret,
    v_session.id,
    v_slot,
    8
  );

  v_expires_at := v_session.started_at
    + make_interval(
        secs => ((v_slot + 1) * v_session.rotation_seconds)::double precision
      );

  return jsonb_build_object(
    'ok', true,
    'status', 'active',
    'sessionId', v_session.id,
    'code', v_code,
    'slot', v_slot,
    'codeExpiresAt', v_expires_at,
    'endsAt', v_session.ends_at,
    'rotationSeconds', v_session.rotation_seconds,
    'serverTime', v_now
  );
end;
$$;

revoke all on function public.attendance_current_code(uuid)
  from public, anon;
grant execute on function public.attendance_current_code(uuid)
  to authenticated;

create or replace function public.attendance_end_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.attendance_sessions%rowtype;
  v_ended_at timestamptz;
begin
  select *
    into v_session
  from public.attendance_sessions
  where id = p_session_id;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not-found');
  end if;

  if not public.is_session_owner(p_session_id) then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;

  v_ended_at := coalesce(v_session.ended_at, clock_timestamp());

  update public.attendance_sessions
  set status = 'ended',
      ended_at = v_ended_at
  where id = p_session_id
    and status = 'active';

  return jsonb_build_object(
    'ok', true,
    'sessionId', p_session_id,
    'status', 'ended',
    'endedAt', v_ended_at,
    'serverTime', clock_timestamp()
  );
end;
$$;

revoke all on function public.attendance_end_session(uuid)
  from public, anon;
grant execute on function public.attendance_end_session(uuid)
  to authenticated;

create or replace function public.attendance_lookup_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles%rowtype;
  v_row record;
  v_code text := upper(btrim(coalesce(p_code, '')));
  v_matched_slot bigint;
  v_already_joined boolean;
begin
  select *
    into v_profile
  from public.profiles
  where id = auth.uid();

  if not found
    or v_profile.role <> 'student'
    or v_profile.student_number is null
  then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;

  if public._attendance_rate_limited(v_profile.id) then
    return jsonb_build_object('ok', false, 'reason', 'rate-limited');
  end if;

  if char_length(v_code) <> 8
    or v_code ~ '[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]'
  then
    insert into public.attendance_attempts (profile_id, reason)
    values (v_profile.id, 'invalid-code');
    return jsonb_build_object('ok', false, 'reason', 'invalid-code');
  end if;

  -- Yalnızca öğrencinin kayıtlı olduğu derslerin aktif oturumları taranır.
  for v_row in
    select
      s.id,
      s.course_code,
      s.course_name,
      s.room,
      s.academician_name,
      s.started_at,
      s.ends_at,
      s.rotation_seconds,
      sec.secret
    from public.attendance_sessions s
    join public.attendance_session_secrets sec
      on sec.session_id = s.id
    join public.course_rosters r
      on r.course_code = s.course_code
     and r.student_number = v_profile.student_number
    where s.status = 'active'
      and s.ends_at > clock_timestamp()
    order by s.started_at desc
    limit 100
  loop
    v_matched_slot := public._attendance_matching_slot(
      v_row.secret,
      v_row.id,
      v_row.started_at,
      v_row.rotation_seconds,
      v_code,
      8
    );

    if v_matched_slot is not null then
      select exists (
        select 1
        from public.attendance_participants p
        where p.session_id = v_row.id
          and (
            p.student_profile_id = v_profile.id
            or p.student_number = v_profile.student_number
          )
      )
      into v_already_joined;

      return jsonb_build_object(
        'ok', true,
        'alreadyJoined', v_already_joined,
        'session', jsonb_build_object(
          'id', v_row.id,
          'courseCode', v_row.course_code,
          'courseName', v_row.course_name,
          'room', v_row.room,
          'academicianName', v_row.academician_name,
          'startedAt', v_row.started_at,
          'endsAt', v_row.ends_at,
          'rotationSeconds', v_row.rotation_seconds,
          'status', 'active'
        )
      );
    end if;
  end loop;

  insert into public.attendance_attempts (profile_id, reason)
  values (v_profile.id, 'invalid-code');

  return jsonb_build_object('ok', false, 'reason', 'invalid-code');
end;
$$;

revoke all on function public.attendance_lookup_code(text)
  from public, anon;
grant execute on function public.attendance_lookup_code(text)
  to authenticated;

create or replace function public.attendance_join_session(
  p_session_id uuid,
  p_code text,
  p_signature_data text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles%rowtype;
  v_session public.attendance_sessions%rowtype;
  v_secret text;
  v_now timestamptz := clock_timestamp();
  v_matched_slot bigint;
  v_participant_id uuid;
  v_signed_at timestamptz;
  v_mime_type text;
  v_signature_payload text;
  v_signature_bytes bytea;
  v_signature_size integer;
  v_signature_hash text;
begin
  select *
    into v_profile
  from public.profiles
  where id = auth.uid();

  if not found
    or v_profile.role <> 'student'
    or v_profile.student_number is null
  then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;

  if public._attendance_rate_limited(v_profile.id) then
    return jsonb_build_object('ok', false, 'reason', 'rate-limited');
  end if;

  select *
    into v_session
  from public.attendance_sessions
  where id = p_session_id;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not-found');
  end if;

  if v_session.status = 'ended' then
    return jsonb_build_object('ok', false, 'reason', 'closed');
  end if;

  if v_now >= v_session.ends_at then
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;

  select secret
    into v_secret
  from public.attendance_session_secrets
  where session_id = v_session.id;

  if v_secret is null then
    return jsonb_build_object('ok', false, 'reason', 'not-found');
  end if;

  if not exists (
    select 1
    from public.course_rosters r
    where r.course_code = v_session.course_code
      and r.student_number = v_profile.student_number
  ) then
    return jsonb_build_object('ok', false, 'reason', 'not-enrolled');
  end if;

  v_matched_slot := public._attendance_matching_slot(
    v_secret,
    v_session.id,
    v_session.started_at,
    v_session.rotation_seconds,
    p_code,
    8
  );

  if v_matched_slot is null then
    insert into public.attendance_attempts (
      profile_id,
      session_id,
      reason
    )
    values (
      v_profile.id,
      v_session.id,
      'invalid-code'
    );

    return jsonb_build_object('ok', false, 'reason', 'invalid-code');
  end if;

  if exists (
    select 1
    from public.attendance_participants p
    where p.session_id = v_session.id
      and (
        p.student_profile_id = v_profile.id
        or p.student_number = v_profile.student_number
      )
  ) then
    return jsonb_build_object('ok', false, 'reason', 'duplicate');
  end if;

  if p_signature_data is null or btrim(p_signature_data) = '' then
    return jsonb_build_object('ok', false, 'reason', 'signature-required');
  end if;

  if char_length(p_signature_data) > 300000 then
    return jsonb_build_object('ok', false, 'reason', 'signature-too-large');
  end if;

  if p_signature_data !~ '^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$' then
    return jsonb_build_object('ok', false, 'reason', 'invalid-signature');
  end if;

  v_mime_type := substring(p_signature_data from '^data:([^;]+);base64,');
  v_signature_payload := split_part(p_signature_data, ',', 2);

  begin
    v_signature_bytes := pg_catalog.decode(v_signature_payload, 'base64');
  exception
    when others then
      return jsonb_build_object('ok', false, 'reason', 'invalid-signature');
  end;

  v_signature_size := octet_length(v_signature_bytes);

  if v_signature_size = 0 then
    return jsonb_build_object('ok', false, 'reason', 'invalid-signature');
  end if;

  if v_signature_size > 204800 then
    return jsonb_build_object('ok', false, 'reason', 'signature-too-large');
  end if;

  v_signature_hash := public._attendance_sha256_hex(p_signature_data);

  begin
    insert into public.attendance_participants (
      session_id,
      student_profile_id,
      student_number,
      student_name,
      code_slot,
      signed_at
    )
    values (
      v_session.id,
      v_profile.id,
      v_profile.student_number,
      coalesce(nullif(v_profile.full_name, ''), v_profile.email),
      v_matched_slot,
      v_now
    )
    returning id, signed_at
      into v_participant_id, v_signed_at;

    insert into public.attendance_signatures (
      participant_id,
      session_id,
      student_profile_id,
      signature_data,
      mime_type,
      byte_size,
      signature_sha256
    )
    values (
      v_participant_id,
      v_session.id,
      v_profile.id,
      p_signature_data,
      v_mime_type,
      v_signature_size,
      v_signature_hash
    );
  exception
    when unique_violation then
      return jsonb_build_object('ok', false, 'reason', 'duplicate');
    when check_violation then
      return jsonb_build_object('ok', false, 'reason', 'invalid-signature');
  end;

  return jsonb_build_object(
    'ok', true,
    'participant', jsonb_build_object(
      'id', v_participant_id,
      'studentNumber', v_profile.student_number,
      'studentName', coalesce(nullif(v_profile.full_name, ''), v_profile.email),
      'signedAt', v_signed_at,
      'codeSlot', v_matched_slot
    ),
    'session', jsonb_build_object(
      'id', v_session.id,
      'courseCode', v_session.course_code,
      'courseName', v_session.course_name,
      'room', v_session.room,
      'academicianName', v_session.academician_name,
      'startedAt', v_session.started_at,
      'endsAt', v_session.ends_at,
      'rotationSeconds', v_session.rotation_seconds,
      'status', v_session.status
    ),
    'serverTime', clock_timestamp()
  );
end;
$$;

revoke all on function public.attendance_join_session(uuid, text, text)
  from public, anon;
grant execute on function public.attendance_join_session(uuid, text, text)
  to authenticated;

create or replace function public.attendance_purge_attempts(
  p_older_than_days integer default 7
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_days integer := greatest(1, coalesce(p_older_than_days, 7));
  v_deleted integer;
begin
  delete from public.attendance_attempts
  where attempted_at < clock_timestamp() - make_interval(days => v_days);

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.attendance_purge_attempts(integer)
  from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 8b. attendance_attempts temizleme işi
-- ----------------------------------------------------------------------------
-- Rate-limit telemetrisi 7 günden eski kayıtları tutmaz. pg_cron yoksa
-- migration durmaz; temizlik manuel çalıştırılmalıdır:
--   select public.attendance_purge_attempts(7);
-- İş, cron'u kuran veritabanı sahibi rolüyle çalışır; istemci EXECUTE
-- yetkisine ihtiyaç duymaz.
do $cron$
declare
  v_job_id bigint;
begin
  if to_regclass('cron.job') is null then
    raise notice
      'pg_cron yok: attendance_attempts temizligi manuel calistirilmalidir.';
    return;
  end if;

  execute 'select jobid from cron.job where jobname = $1'
    into v_job_id
    using 'nova-obs-purge-attendance-attempts';

  if v_job_id is not null then
    execute format('select cron.unschedule(%s)', v_job_id);
  end if;

  execute 'select cron.schedule($1, $2, $3)'
    using
      'nova-obs-purge-attendance-attempts',
      '45 * * * *',
      'select public.attendance_purge_attempts(7);';
end
$cron$;

-- ----------------------------------------------------------------------------
-- 9. Realtime yayını
-- ----------------------------------------------------------------------------
do $realtime$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    begin
      alter publication supabase_realtime
        add table public.attendance_sessions;
    exception
      when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime
        add table public.attendance_participants;
    exception
      when duplicate_object then null;
    end;
  end if;
end
$realtime$;

-- ----------------------------------------------------------------------------
-- 10. Doğrulanmış seed verileri
-- ----------------------------------------------------------------------------
-- BM201 → 'mert' eşleşmesi kaynak kodda doğrulanmıştır:
--   src/data/student.ts (COURSES: BM201 instructor)
--   src/data/messaging.ts (BM201 görüşmeleri academicianId='mert')
-- BM305 için doğrulanmış bir sahip yoktur. academician_key = NULL bırakılır;
-- ders sahipliği atanana kadar yoklama başlatılamaz.
insert into public.academician_courses (
  course_code,
  course_name,
  academician_key,
  term,
  room
)
values
  ('BM201', 'Veri Yapıları ve Algoritmalar', 'mert', '2026–2027 Güz', 'D-204'),
  ('BM305', 'Yazılım Mimarisi', null, '2026–2027 Güz', 'B-210')
on conflict (course_code) do nothing;

-- KAPSAM UYARISI (bilinçli olarak gizlenmez):
-- Aşağıdaki 20 roster kaydından yalnızca 2024001234 (Elif), 2024001188
-- (Kaan) ve 2024001276 (Derya) student_directory içindedir. Diğer öğrenciler
-- OTP ile giriş yapsa bile student_number atanamadığı için
-- attendance_join_session 'forbidden' döner. Uçtan uca katılım testi yalnızca
-- dizin + profil eşleşmesi olan öğrencilerle yapılabilir; eksik kayıtlar
-- 00 preflight çıktısında listelenir.
insert into public.course_rosters (
  course_code,
  student_number,
  student_name
)
values
  ('BM201', '2024001234', 'Elif Yılmaz'),
  ('BM201', '2024001188', 'Kaan Demir'),
  ('BM201', '2024001276', 'Derya Şahin'),
  ('BM201', '2023001142', 'Mert Koç'),
  ('BM201', '2023001088', 'Zeynep Arslan'),
  ('BM201', '2024001210', 'Ece Yıldırım'),
  ('BM201', '2023001176', 'Baran Aksoy'),
  ('BM201', '2024001245', 'İpek Doğan'),
  ('BM201', '2023001123', 'Alp Yalçın'),
  ('BM201', '2024001268', 'Sude Kılıç'),
  ('BM201', '2023001190', 'Ozan Şen'),
  ('BM201', '2024001299', 'Nehir Ateş'),
  ('BM305', '2023001044', 'Melis Kurt'),
  ('BM305', '2023001067', 'Kerem Aslan'),
  ('BM305', '2024001201', 'Aslı Çetin'),
  ('BM305', '2023001099', 'Efe Polat'),
  ('BM305', '2024001226', 'Defne Sarı'),
  ('BM305', '2023001110', 'Yiğit Bulut'),
  ('BM305', '2024001254', 'Zara Özkan'),
  ('BM305', '2023001132', 'Arda Güneş')
on conflict (course_code, student_number) do nothing;

comment on table public.academician_courses is
  'Ders sahipliği. academician_key NULL ise ders için yoklama başlatılamaz.';
comment on table public.attendance_sessions is
  'Yoklama oturumları. opened_by/academician_key NULL olabilir; hesap silimi geçmiş kaydı silmez.';
comment on table public.attendance_participants is
  'Katılım kayıtları. student_profile_id NULL olabilir; kimlik student_number ile korunur.';
comment on table public.attendance_session_secrets is
  'İstemciye asla verilmez; yalnızca SECURITY DEFINER RPC içinde okunur.';
comment on table public.attendance_signatures is
  'Dijital imza data URL. P0 sınırı: en fazla 200 KiB çözülmüş veri.';
comment on function public.attendance_purge_attempts(integer) is
  'Eski rate-limit telemetrisini siler. pg_cron varsa saatlik çalışır; yoksa manuel çağrılır.';

commit;
