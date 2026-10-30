-- ============================================================================
-- Nova Teknik Üniversitesi OBS · Supabase şeması
-- ----------------------------------------------------------------------------
-- Bu dosya; E-posta OTP kimlik doğrulaması, rol tabanlı erişim (RLS),
-- Realtime mesajlaşma ve 7 günlük otomatik mesaj temizliği (pg_cron) için
-- gerekli tüm tablo, fonksiyon, politika ve işleri oluşturur.
--
-- Kullanım:
--   1. Supabase Dashboard → SQL Editor → bu dosyanın tamamını çalıştırın.
--   2. Authentication → Providers → Email: "Enable Email provider" açık olsun.
--   3. Authentication → Email Templates → "Magic Link" şablonunda
--      {{ .ConfirmationURL }} yerine {{ .Token }} kullanın (6 haneli kod).
--   4. Database → Extensions → pg_cron ve pgcrypto etkin olsun.
--   5. Proje kökünde .env dosyasına VITE_SUPABASE_URL ve
--      VITE_SUPABASE_ANON_KEY değerlerini ekleyin.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. Dizinler (allowlist): OTP ile giriş yapan kullanıcının rolü buradan atanır
-- ----------------------------------------------------------------------------

create table if not exists public.academician_directory (
  email text primary key,
  academician_key text not null unique,
  full_name text not null,
  department text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.student_directory (
  email text primary key,
  student_number text not null unique,
  full_name text not null,
  department text not null default 'Bulut Bilişim Operatörlüğü',
  created_at timestamptz not null default now()
);

-- Uygulamadaki akademisyen listesiyle birebir eşleşen demo kayıtları.
-- Kurumsal adreslerinizi değiştirirseniz src/data/academicians.ts ile
-- aynı tutmaya dikkat edin.
insert into public.academician_directory (email, academician_key, full_name, department)
values
  ('cafer.cinar@uni.edu.tr', 'cafer', 'Dr. Öğr. Üyesi Cafer Ahmet Çınar', 'Bulut Bilişim Operatörlüğü'),
  ('mert.aydin@uni.edu.tr', 'mert', 'Dr. Öğr. Üyesi Mert Aydın', 'Bilgisayar Mühendisliği'),
  ('selin.kara@uni.edu.tr', 'selin', 'Doç. Dr. Selin Kara', 'Bilgisayar Mühendisliği'),
  ('can.demir@uni.edu.tr', 'can', 'Dr. Öğr. Üyesi Can Demir', 'Bilgisayar Mühendisliği'),
  ('ayse.kaya@uni.edu.tr', 'ayse', 'Prof. Dr. Ayşe Kaya', 'Bilgisayar Mühendisliği'),
  ('deniz.arslan@uni.edu.tr', 'deniz', 'Dr. Öğr. Üyesi Deniz Arslan', 'Yazılım Mühendisliği'),
  ('okan.yildiz@uni.edu.tr', 'okan', 'Doç. Dr. Okan Yıldız', 'Matematik'),
  ('laura.blake@uni.edu.tr', 'laura', 'Öğr. Gör. Laura Blake', 'Teknik İngilizce')
on conflict (email) do update
set academician_key = excluded.academician_key,
    full_name = excluded.full_name,
    department = excluded.department;

-- Demo öğrencileri: OTP ile giriş yaptıklarında isim/numara otomatik eşlenir.
insert into public.student_directory (email, student_number, full_name, department)
values
  ('elif.yilmaz@ogr.uni.edu.tr', '2024001234', 'Elif Yılmaz', 'Bulut Bilişim Operatörlüğü'),
  ('kaan.demir@ogr.uni.edu.tr', '2024001188', 'Kaan Demir', 'Bulut Bilişim Operatörlüğü'),
  ('derya.sahin@ogr.uni.edu.tr', '2024001276', 'Derya Şahin', 'Bulut Bilişim Operatörlüğü')
on conflict (email) do update
set student_number = excluded.student_number,
    full_name = excluded.full_name,
    department = excluded.department;

-- ----------------------------------------------------------------------------
-- 2. Profiller
-- ----------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  role text not null default 'student' check (role in ('student', 'academician', 'admin')),
  student_number text unique,
  academician_key text unique,
  department text not null default '',
  created_at timestamptz not null default now()
);

-- Yeni bir auth kullanıcısı oluştuğunda profili otomatik hazırla.
-- E-posta akademisyen dizinindeyse 'academician', değilse 'student' atanır.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(coalesce(new.email, ''));
  v_academic public.academician_directory%rowtype;
  v_student public.student_directory%rowtype;
begin
  if v_email = '' then
    return new;
  end if;

  select * into v_academic
  from public.academician_directory
  where lower(email) = v_email;

  if v_academic.email is not null then
    insert into public.profiles (id, email, full_name, role, academician_key, department)
    values (
      new.id,
      v_email,
      v_academic.full_name,
      'academician',
      v_academic.academician_key,
      v_academic.department
    )
    on conflict (id) do nothing;

    -- Akademisyen ilk kez giriş yaptığında bekleyen görüşmelere bağla.
    update public.conversations
    set academician_id = new.id
    where lower(academician_email) = v_email
      and academician_id is null;

    return new;
  end if;

  select * into v_student
  from public.student_directory
  where lower(email) = v_email;

  insert into public.profiles (id, email, full_name, role, student_number, department)
  values (
    new.id,
    v_email,
    coalesce(v_student.full_name, initcap(replace(split_part(v_email, '@', 1), '.', ' '))),
    'student',
    v_student.student_number,
    coalesce(v_student.department, 'Öğrenci')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Daha önce oluşturulmuş auth kullanıcıları için tek seferlik geri doldurma.
insert into public.profiles (id, email, full_name, role, academician_key, student_number, department)
select
  u.id,
  lower(u.email),
  coalesce(
    a.full_name,
    s.full_name,
    initcap(replace(split_part(lower(u.email), '@', 1), '.', ' '))
  ),
  case when a.email is not null then 'academician' else 'student' end,
  a.academician_key,
  s.student_number,
  coalesce(a.department, s.department, 'Öğrenci')
from auth.users u
left join public.academician_directory a on lower(a.email) = lower(u.email)
left join public.student_directory s on lower(s.email) = lower(u.email)
where u.email is not null
on conflict (id) do nothing;

update public.conversations c
set academician_id = p.id
from public.profiles p
where p.role = 'academician'
  and lower(c.academician_email) = lower(p.email)
  and c.academician_id is null;

-- ----------------------------------------------------------------------------
-- 3. Görüşmeler, mesajlar ve okundu bilgisi
-- ----------------------------------------------------------------------------

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  student_email text not null,
  student_name text not null,
  student_number text not null default '',
  academician_id uuid references public.profiles (id) on delete set null,
  academician_email text not null,
  academician_key text not null,
  course_code text not null,
  course_name text not null,
  created_at timestamptz not null default now(),
  constraint conversations_unique_thread
    unique (student_id, academician_email, course_code)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  sender_role text not null check (sender_role in ('student', 'academician')),
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_reads (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, profile_id)
);

create index if not exists conversations_student_idx
  on public.conversations (student_id);
create index if not exists conversations_academician_idx
  on public.conversations (academician_id);
create index if not exists conversations_academician_email_idx
  on public.conversations (lower(academician_email));
create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at);
create index if not exists messages_created_at_idx
  on public.messages (created_at);

-- ----------------------------------------------------------------------------
-- 4. Yardımcı fonksiyonlar (RLS içinde güvenli kullanım için)
-- ----------------------------------------------------------------------------

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_conversation_participant(target_conversation uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.conversations c
    where c.id = target_conversation
      and (
        c.student_id = auth.uid()
        or c.academician_id = auth.uid()
        or lower(c.academician_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  );
$$;

-- Mesajların 7 gün sonra silinmesi. pg_cron her saat başı :15'te çağırır.
create or replace function public.purge_expired_messages()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  delete from public.messages
  where created_at < now() - interval '7 days';

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.purge_expired_messages() from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 5. Row Level Security (RLS)
-- ----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.conversation_reads enable row level security;

-- Dizinler yalnızca okunabilir; yazma yalnızca SQL Editor / service role.
alter table public.academician_directory disable row level security;
alter table public.student_directory disable row level security;

-- Profiller -----------------------------------------------------------------
drop policy if exists "profiles_select_self_or_staff" on public.profiles;
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

-- Görüşmeler ----------------------------------------------------------------
drop policy if exists "conversations_select_participants" on public.conversations;
create policy "conversations_select_participants"
on public.conversations
for select
to authenticated
using (
  student_id = auth.uid()
  or academician_id = auth.uid()
  or lower(academician_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

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

-- Mesajlar ------------------------------------------------------------------
drop policy if exists "messages_select_participants" on public.messages;
create policy "messages_select_participants"
on public.messages
for select
to authenticated
using (public.is_conversation_participant(conversation_id));

drop policy if exists "messages_insert_participants" on public.messages;
create policy "messages_insert_participants"
on public.messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and public.is_conversation_participant(conversation_id)
  and sender_role = public.current_profile_role()
);

-- Okundu bilgisi ------------------------------------------------------------
drop policy if exists "reads_select_own" on public.conversation_reads;
create policy "reads_select_own"
on public.conversation_reads
for select
to authenticated
using (profile_id = auth.uid());

drop policy if exists "reads_insert_own" on public.conversation_reads;
create policy "reads_insert_own"
on public.conversation_reads
for insert
to authenticated
with check (
  profile_id = auth.uid()
  and public.is_conversation_participant(conversation_id)
);

drop policy if exists "reads_update_own" on public.conversation_reads;
create policy "reads_update_own"
on public.conversation_reads
for update
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 6. Yetkiler
-- ----------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;
grant select on public.academician_directory, public.student_directory to authenticated;
grant select, insert on public.profiles to authenticated;
grant select, insert on public.conversations to authenticated;
grant select, insert on public.messages to authenticated;
grant select, insert, update on public.conversation_reads to authenticated;

-- ----------------------------------------------------------------------------
-- 7. Supabase Realtime
-- ----------------------------------------------------------------------------
-- messages: yeni mesajlar ve TTL silmeleri anında yayınlanır.
-- conversations: yeni görüşmeler / akademisyen bağlantısı için.
-- DELETE olaylarında eski satırın yalnızca birincil anahtarı gönderilir;
-- istemci tanımadığı id'leri yok sayar, böylece içerik sızmaz.

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime for table public.messages, public.conversations;
  else
    begin
      alter publication supabase_realtime add table public.messages;
    exception
      when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.conversations;
    exception
      when duplicate_object then null;
    end;
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- 8. TTL / Cron: 7 günden eski mesajları her saat başı sil
-- ----------------------------------------------------------------------------

create extension if not exists pg_cron;

do $$
declare
  v_job_id bigint;
begin
  select jobid into v_job_id
  from cron.job
  where jobname = 'nova-obs-purge-expired-messages';

  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
  end if;

  perform cron.schedule(
    'nova-obs-purge-expired-messages',
    '15 * * * *',
    'select public.purge_expired_messages();'
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- 9. İsteğe bağlı yönetici ataması
-- ----------------------------------------------------------------------------
-- Yönetici rolü dizinlerden otomatik atanmaz. Gerektiğinde:
--   update public.profiles set role = 'admin' where email = 'yonetici@uni.edu.tr';
