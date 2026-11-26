# Nova OBS · P0 migration planı

Bu dizin, P0 güvenlik çalışmasının **Aşama 1** çıktısıdır. Bu aşamada yalnızca
yedekleme, mevcut şema incelemesi ve migration hazırlığı yapıldı. **Hiçbir SQL
canlı veritabanında çalıştırılmadı ve hiçbir istemci kaynak dosyası
değiştirilmedi.**

## Kritik uyarılar

1. **`supabase/schema.sql` migration'lardan sonra tekrar çalıştırılmamalıdır.**
   `schema.sql` yalnızca temiz kurulum içindir. Eski `profiles` INSERT
   politikasını, dizin SELECT yetkilerini ve geniş authenticated okumalarını
   geri getirir; 02/03'ün kapattığı açıkları yeniden açar. Mevcut veritabanında
   yalnızca `supabase/migrations/` altındaki dosyalar kullanılmalıdır. Temiz
   kurulum şeması Aşama 2'de migration'larla eşitlenecektir.
2. **`01_attendance_rollback.sql` yoklama verisini kalıcı olarak siler.**
   Oturumlar, secret'lar, katılımcılar, imzalar, deneme kayıtları,
   `academician_courses` ve `course_rosters` seed'i silinir. `profiles`,
   `conversations`, `messages` ve `conversation_reads` korunur. Geri alma
   öncesi fiziksel yedek ve gerekirse tablo bazlı yedek zorunludur.
3. **Geri alma güvenlik açıklarını bilinçli olarak yeniden açar.** `02`
   rollback istemci profil INSERT'ini, tüm akademisyenlerin profil okumasını
   ve dizin erişimini geri getirir. `03` rollback trigger/cron fonksiyonlarını
   PUBLIC EXECUTE'a açar. Geri almalar yalnızca acil durum içindir.
4. **Staging, yedek ve restore testi zorunludur.** Önce staging projesinde
   00 → 01 → 02 → 03 sırası ve doğrulama çalıştırılmalı, ardından yedekten
   geri dönüş denenmelidir. Bu test tamamlanmadan production'a
   uygulanmamalıdır.
5. **Migration'lar veritabanı sahibi rolüyle çalıştırılmalıdır.** Supabase'de
   bu rol `postgres`'tir. `SECURITY DEFINER` fonksiyonların RLS'i atlayabilmesi
   ve tablo sahipliğinin doğru olması buna bağlıdır. `service_role` anahtarı
   hiçbir adımda kullanılmaz.

## Durum

| Alan | Durum |
|---|---|
| Dosya/git yedeği | Alındı (workspace dışında `OBS-backups/20261104-175604`) |
| Git commit | `ffea85e` · temiz çalışma ağacı |
| Canlı DB yedeği | **Kullanıcı tarafından alınmalı** |
| Canlı şema ön kontrolü | **Kullanıcı tarafından çalıştırılmalı** |
| Migration dosyaları | Hazır, çalıştırılmadı |
| İstemci entegrasyonu | Aşama 2'ye bırakıldı; `02` canlıya alınmadan önce fallback kaldırılmalı |
| AWS taşıması | P0 kapsamı dışında; servis arayüzü korunuyor |

Çalışma ortamında `.env`, Supabase CLI, Docker, `psql` veya `pg_dump`
bulunmadığı için canlı veritabanına bağlanılamadı. Bu nedenle fiziksel DB
yedeği ve canlı şema çıktısı bu ortamda üretilemedi.

## Dosyalar ve uygulama sırası

| Sıra | Dosya | Amaç | Uygulama koşulu |
|---|---|---|---|
| 0 | `20261104_00_preflight_readonly.sql` | Mevcut şemayı salt okur | Her zaman; sonuç kaydedilmeli |
| 1 | `20261104_01_attendance.sql` | Sunucu taraflı QR yoklama | Tablo/fonksiyon çakışması yoksa |
| 2 | `20261104_02_rls_hardening.sql` | Profil/dizin RLS sertleştirme | `auth_without_profile = 0`, trigger etkin, istemci fallback kaldırılmışsa |
| 3 | `20261104_03_authorization.sql` | Fonksiyon/tablo ACL | 01 ve 02 başarılıysa |
| 4 | `../checks/20261104_p0_verification.sql` | Uygulama sonrası doğrulama | 03 sonrası; hata varsa canlı trafik açılmaz |

Geri alma sırası **tersine** olmalıdır:

1. `20261104_03_authorization_rollback.sql`
2. `20261104_02_rls_hardening_rollback.sql`
3. `20261104_01_attendance_rollback.sql` — **yoklama verisini siler**

`02` geri alınmadan `01` geri alınmamalıdır: `02` içindeki profil politikası
`public.is_admin()` fonksiyonuna bağlıdır. `01` geri alınmadan önce fiziksel
yedek ve gerekirse tablo bazlı yoklama yedeği alınmalıdır.

## Aşama 1 ön koşulları

1. **Staging projesi**: production ile aynı PostgreSQL/Supabase sürümünde bir
   staging projesi kullanın.
2. **Fiziksel yedek**: Supabase Dashboard → Database → Backups üzerinden
   production yedeği alın.
3. **Restore testi**: yedeğin staging'de geri yüklenebildiğini doğrulayın.
   Geri yükleme denenmemiş yedek güvenilir sayılmaz.
4. `20261104_00_preflight_readonly.sql` dosyasını SQL Editor'de **DB sahibi
   (`postgres`) rolüyle** çalıştırın ve çıktıyı kaydedin. Şunlar zorunludur:
   - `auth_without_profile = 0`
   - `academician_profile_mismatch = 0`
   - `student_profile_mismatch = 0`
   - `student_number_null = 0`
   - `student_number_format = 0`
   - `academician_key_missing = 0`
   - `function_collision` çıktısı boş
   - `attendance_object.already_exists` tümü `false`
   - `pgcrypto_function.current_user_can_execute` tümü `true`
   - `uuid_function.current_user_can_execute = true`
   - `attendance_purge_job` durumu not edilmeli (pg_cron var/yok)
   - `roster_directory_coverage.missing_numbers` not edilmeli
   - `verified_directory_keys` içinde `mert` kaydı var
5. `attendance_*` tablo veya fonksiyonlarından biri zaten varsa **01'i
   çalıştırmayın**; mevcut şemayı ayrıca inceleyin. 01 ayrıca kendi çakışma
   guard'ı ile transaction'ı durdurur.
6. Profil bütünlüğü bozuksa önce geri doldurma planı uygulayın. `02`,
   `auth_without_profile > 0` ise commit etmez.
7. `02` uygulanmadan önce istemcideki `AuthProvider.fetchOrCreateProfile()`
   yedek INSERT yolu kaldırılmış sürüm canlıya alınmalıdır. Aksi hâlde profili
   eksik bir kullanıcı girişte kalıcı hata alır; SQL bunu telafi edemez.
8. `02`, `on_auth_user_created` trigger'ının etkin ve `handle_new_user()`'ın
   `SECURITY DEFINER` olduğunu ayrıca doğrular; sağlanmazsa commit etmez.
9. Migration'lar `postgres` (tablo sahibi) rolüyle çalıştırılmalıdır;
   `SECURITY DEFINER` fonksiyonların RLS'i atlaması buna bağlıdır.

## Kapsam ve tasarım kararları

### 1. Sunucu taraflı QR yoklama

**Mevcut durum:** Oturumlar, secret ve imzalar yalnızca `localStorage` ve
`BroadcastChannel` üzerinde tutuluyor. Kod istemcide FNV benzeri bir hash ile
üretiliyor; öğrenci kimliği, ders kaydı ve tekrar katılım kontrolü istemciye
güveniyor. Her tarayıcı kendi kopyasını yazabildiği için yarış koşulları ve
sahte katılım mümkün.

**Yeni yapı:**

- `academician_courses`: ders ve doğrulanmış sahibi.
- `course_rosters`: derse kayıtlı öğrenci numaraları.
- `attendance_sessions`: sunucu zamanı, süre, döngü, sahip.
- `attendance_session_secrets`: istemciye kapalı HMAC secret.
- `attendance_participants`: benzersiz katılım kaydı.
- `attendance_signatures`: data URL imza + SHA-256 + boyut.
- `attendance_attempts`: geçersiz kod hız sınırı.

**Sunucu kuralları:**

- Kod 8 karakter, 20 saniyede bir döner.
- Geçerli kod + önceki 3 slot kabul edilir.
- Süre, slot ve sahiplik sunucu saatine göre doğrulanır.
- Yalnızca `course_rosters` içindeki öğrenci katılabilir.
- Aynı oturumda aynı profil veya öğrenci numarası ikinci kez katılamaz.
- Geçersiz kod denemesi profil başına 60 saniyede 5 ile sınırlıdır.
- İmza en fazla 200 KiB çözülmüş veri / 300.000 karakter metin olabilir.
- `SECURITY DEFINER` RPC'ler dışında tablolara yazma yetkisi yoktur.
- Secret ve deneme tablolarının RLS politikası ve istemci yetkisi yoktur.
- `attendance_attempts` 7 günden eski kayıtları tutmaz. pg_cron varsa
  `nova-obs-purge-attendance-attempts` işi saatlik çalışır; yoksa
  `select public.attendance_purge_attempts(7);` manuel çalıştırılmalıdır.
- KVKK/hesap silme: `opened_by` ve `student_profile_id` alanları
  `ON DELETE SET NULL`; katılım ve imza kayıtları denormalize
  `student_number`/`student_name` ile korunur. Ders kaydı (`course_code`)
  `ON DELETE RESTRICT` ile geçmişin sessizce silinmesini engeller.

**Seed sahipliği:**

- `BM201 → mert`: kaynak kodda doğrulandı
  (`src/data/student.ts` ders eğitmeni, `src/data/messaging.ts` görüşme
  eşleşmesi).
- `BM305 → NULL`: doğrulanmış sahip bulunmadığı için atanmadı. Ders sahibi
  atanana kadar yoklama başlatılamaz.
- Roster: BM201 için 12, BM305 için 8 kayıt.

**Riskler:**

- `academician_courses` daha önce farklı sahiplikle oluşturulduysa seed
  `on conflict do nothing` nedeniyle sahipliği düzeltmez.
- 20 roster kaydından yalnızca üçü (`2024001234`, `2024001188`,
  `2024001276`) `student_directory` içinde. Diğer öğrenciler OTP ile giriş
  yapabilir ancak `student_number` atanamadığı için yoklamaya katılamaz.
  Uçtan uca katılım testi yalnızca dizin + profil eşleşmesi olan öğrencilerle
  yapılabilir; 00 ve doğrulama çıktıları eksikleri listeler.
- İmza data URL olarak saklanır; P0 kabulüdür. P1'de Storage'a taşınmalıdır.
- Kod, önceki 3 slot boyunca geçerlidir; imza adımına yaklaşık 60-80 saniye
  tanınır. Bu bilinçli bir kullanılabilirlik tercihidir.
- 01, aynı isimli tablo veya fonksiyon varsa transaction'ı durdurur. Bu
  bilinçli bir korumadır; mevcut nesneler elle incelenmelidir.

**Geri alma:** `20261104_01_attendance_rollback.sql` tüm yoklama tablolarını,
secret'ları, katılımcıları, imzaları, deneme kayıtlarını, ders/roster seed'ini
ve Realtime/cron kayıtlarını kaldırır. **Bu veriler kalıcı olarak silinir.**
`profiles`, `conversations`, `messages` korunur. Dosya, aynı isimli farklı
şemalı tabloları silmemek için yapısal ve provenance guard'ı içerir.

### 2. RLS sertleştirmesi

**Mevcut durum:**

- `profiles` INSERT politikası istemcinin `role='student'` ve boş
  `academician_key` ile satır oluşturmasına izin veriyor; `student_number`
  sınırlandırılmıyor.
- Tüm akademisyenler bütün profilleri okuyabiliyor.
- `academician_directory` ve `student_directory` RLS kapalı ve tüm kurumsal
  e-posta / öğrenci numaraları authenticated kullanıcılara açık.

**Yeni yapı:**

- Profil okuma: yalnızca kendi satırı veya admin.
- Profil yazma: yalnızca `auth.users` trigger'ı (`SECURITY DEFINER`).
- Dizinler: RLS açık, istemci SELECT yetkisi yok.
- Dizin kontrolü gereken görüşme INSERT politikası
  `is_listed_academician()` definer fonksiyonuna taşındı.

**Riskler:**

- İstemcideki `fetchOrCreateProfile()` yedek INSERT yolu artık çalışmaz.
  `02`, istemci fallback'i kaldırılmadan ve `auth_without_profile = 0`
  doğrulanmadan uygulanmamalıdır. Aksi hâlde profili eksik kullanıcı girişte
  kalıcı hata alır.
- `02`, trigger'ın etkin ve `handle_new_user()`'ın `SECURITY DEFINER` olduğunu
  ayrıca doğrular. Definer fonksiyonların sahibi `profiles` /
  `academician_directory` RLS'ini atlayamıyorsa migration commit etmez.
- Profil okuma yalnızca kendi satırı veya admin olduğu için akademisyen
  panelinin ileride toplu profil okuması eklemesi hâlinde ayrı definer RPC
  gerekir.

**Geri alma:** `20261104_02_rls_hardening_rollback.sql` eski politikaları geri
getirir; istemci profil INSERT'ini, tüm akademisyenlerin profil okumasını ve
dizin erişimini bilinçli olarak yeniden açar. Yalnızca acil durum içindir.

### 3. Demo rol yükseltme açığı

Bu açık tamamen istemci tarafındadır ve SQL ile kapatılamaz. Aşama 2'de:

- Demo giriş yalnızca `import.meta.env.DEV` veya açık staging bayrağında açık
  olacak; production build'de tamamen kapalı olacak.
- Demo oturumu yalnızca bellekte tutulacak; sayfa yenilenince giriş
  gerekecek.
- `authenticate(role, ...)` çağrısındaki rol, kullanıcı isteğinden değil
  sabit demo hesap tanımından doğrulanacak.
- Bilinmeyen kimlik veya rol kombinasyonu reddedilecek.
- RBAC bilinmeyen yollarda varsayılan olarak reddedecek.
- `RequireRole` yalnızca oturum rolüne değil, sağlayıcı/oturum bütünlüğüne de
  bakacak.

Bu değişiklikler Aşama 2'de yapılmadan demo modu güvenli kabul edilmemelidir.

### 4. Öğrenci / akademisyen yetkilendirmesi

- Ders sahipliği `academician_courses.academician_key` üzerinden sunucuda
  doğrulanır.
- Oturum açma, kod üretme, oturum kapatma yalnızca oturum sahibine açıktır.
- Katılım kimliği istemciden alınmaz; `auth.uid()` ve `profiles` üzerinden
  türetilir.
- Admin yoklama başlatamaz; yalnızca RLS üzerinden denetim amaçlı okuyabilir.
- Doğrudan tablo yazma yetkisi kaldırılmıştır.

## Aşama 2 istemci entegrasyonu (henüz yapılmadı)

Uygulanacak dosyalar ve işler:

| Dosya | Değişiklik |
|---|---|
| `src/config/runtime.ts` | `codeLength: 8`, sunucu modu |
| `src/types/attendance.ts` | RPC sonuç tipleri, `invalid-signature`, `rate-limited` |
| `src/services/attendance/supabaseRepository.ts` | Yeni: RPC + Realtime adaptörü |
| `src/services/attendance/index.ts` | Sunucu servisini seçen factory |
| `src/providers/AuthProvider.tsx` | Demo bellek oturumu, profil INSERT fallback kaldırma |
| `src/services/authService.ts` | Sabit demo rolü, production'da demo reddi |
| `src/config/rbac.ts` | Bilinmeyen yol = reddet |
| `src/components/auth/RequireRole.tsx` | Sağlayıcı/oturum bütünlüğü |
| `src/pages/academician/QrAttendancePage.tsx` | RPC kod/oturum/katılımcı |
| `src/pages/student/QrAttendancePage.tsx` | RPC lookup/join, QR payload |
| `src/components/attendance/SignaturePad.tsx` | 200 KiB sınırı, data URL |
| `supabase/schema.sql` | Temiz kurulum için migration'larla eşitleme (mevcut DB'de çalıştırılmaz) |
| `README.md` | Yeni akış, env ve güvenlik notları |

`AttendanceService` arayüzü korunacak; AWS adaptörü P0'a dahil edilmeyecek.

## Test senaryoları

### Şema ve yetki

1. `00` çalışınca hiçbir nesne değişmemeli.
2. `01` sonrası 7 yeni tablo ve `attendance_*` RPC'leri oluşmalı.
3. `authenticated` rolü `attendance_session_secrets` ve
   `attendance_attempts` okuyamamalı.
4. `authenticated` rolü `attendance_sessions` veya
   `attendance_participants` içine doğrudan INSERT yapamamalı.
5. `authenticated` rolü `profiles.role` veya `student_number` güncelleyememeli.
6. `authenticated` rolü dizin tablolarını okuyamamalı.
7. Mert BM201 oturumu başlatabilmeli; BM305 için `forbidden` almalı.
8. Mert başka bir akademisyenin dersini başlatamamalı.
9. Admin yoklama başlatamamalı.

### Kod ve süre

10. Dönen kod tam 8 karakter ve alfabeye uygun olmalı.
11. Aynı secret/session/slot deterministik aynı kodu üretmeli.
12. 20 saniye sonra kod değişmeli.
13. Geçerli kod + önceki 3 slot kabul edilmeli; 4 slot öncesi reddedilmeli.
14. Süresi bitmiş oturum `expired`, kapatılmış oturum `closed` dönmeli.
15. İstemci saatini ileri/geri almak sonucu değiştirmemeli.

### Katılım

16. Roster'da olan Elif (`2024001234`) geçerli kod ve imza ile katılmalı.
17. Roster'da olmayan öğrenci `not-enrolled` almalı.
18. Aynı öğrenci ikinci kez `duplicate` almalı.
19. Aynı öğrenci numarası farklı profille `duplicate` almalı.
20. Boş imza `signature-required`, bozuk data URL `invalid-signature` almalı.
21. 200 KiB üzeri imza `signature-too-large` almalı.
22. Aynı anda gelen iki katılım isteğinden yalnızca biri başarılı olmalı.
23. 5 geçersiz koddan sonraki deneme `rate-limited` almalı; 60 saniye sonra
    sınır açılmalı.

### Gizlilik

24. Öğrenci başka öğrencinin imzasını okuyamamalı.
25. Akademisyen yalnızca kendi oturumunun katılımcılarını/imzalarını
    okuyabilmeli.
26. Akademisyen tüm profilleri listeleyememeli.
27. Anon rolü hiçbir yoklama tablosunu okuyamamalı.

### Geri alma

28. `03 → 02 → 01` sırası hatasız çalışmalı.
29. `01` geri alındıktan sonra tüm yoklama nesneleri kalkmalı; mevcut
    `profiles`, `conversations`, `messages` verileri korunmalı. Yoklama
    verisinin silindiği bilinçli kabul edilmelidir.
30. Geri alma sonrası mevcut demo/OTP mesajlaşma akışı çalışmaya devam etmeli.

### Ek P0 kontrolleri

31. `01`, önceden aynı isimli tablo veya fonksiyon varsa transaction'ı
    durdurmalı; hiçbir nesne commit edilmemeli.
32. `02`, `auth_without_profile > 0` ise commit etmemeli.
33. `02`, `on_auth_user_created` trigger'ı yoksa veya devre dışıysa commit
    etmemeli.
34. `02`, `handle_new_user()` `SECURITY DEFINER` değilse veya sahibi profiles
    RLS'ini atlayamıyorsa commit etmemeli.
35. `03` sonrası mesaj gönderme/alma, okundu yazma ve OTP girişi çalışmaya
    devam etmeli.
36. pg_cron varsa `nova-obs-purge-attendance-attempts` işi saatlik
    planlanmalı; 7 günden eski denemeler silinmeli.
37. pg_cron yoksa `01` hata vermemeli; `attendance_purge_attempts(7)` manuel
    çalışmalı.
38. Profil/hesap silindiğinde yoklama oturumu, katılım ve imza kaydı
    silinmemeli; `opened_by` / `student_profile_id` NULL olmalı.
39. `01` rollback yapısal guard'ı, aynı isimli farklı şemalı tablo varsa
    durmalı; cron işini kaldırmalı.
40. `01` rollback sonrası `attendance_*` tabloları, fonksiyonları ve cron işi
    kalmamalı; `profiles` / `conversations` / `messages` korunmalı.

## Uygulama notları

- Dosyaları Supabase SQL Editor'de **tek seferde** ve **`postgres` (DB sahibi)
  rolüyle** çalıştırın. `SECURITY DEFINER` fonksiyonların RLS'i atlaması ve
  tablo sahipliği buna bağlıdır.
- `01` transaction içindedir; hata durumunda tamamı geri alınır. Çakışma
  guard'ı aynı isimli tablo/fonksiyon varsa durur.
- `02` transaction içindedir; trigger/profil bütünlüğü sağlanmazsa commit
  etmez. İstemci `fetchOrCreateProfile()` fallback'i kaldırılmadan
  uygulanmamalıdır.
- `03` içindeki `DO` bloğu başarısız olursa migration commit edilmez.
- Uygulama sonrası `../checks/20261104_p0_verification.sql` çalıştırın. Hata
  varsa canlı trafik açılmaz ve geri alma planı uygulanır.
- **`supabase/schema.sql` migration'lardan sonra tekrar çalıştırılmamalıdır**;
  eski RLS politikalarını ve geniş yetkileri geri getirir.
- **Geri alma veri kaybettirir:** `01_attendance_rollback.sql` yoklama
  verisini siler. Öncesinde fiziksel yedek ve gerekirse tablo bazlı yedek
  alınmalıdır.
- Canlıya uygulamadan önce staging projesinde aynı sıra, doğrulama ve
  yedekten restore testi yapılmalıdır. Test edilmemiş yedek güvenilir
  değildir.
- `service_role` veya `sb_secret_...` anahtarı hiçbir istemci dosyasına veya
  `.env` örneğine eklenmemelidir. İstemci yalnızca public anahtarı
  (`VITE_SUPABASE_PUBLISHABLE_KEY`, eski kurulumlarda `VITE_SUPABASE_ANON_KEY`)
  kullanır; SQL Editor oturumu ayrı bir yönetim kanalıdır.
