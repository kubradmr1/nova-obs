<div align="center">

<img src="./public/nova-mark.svg" alt="Nova Teknik Üniversitesi" width="88" height="88" />

# Nova Teknik Üniversitesi

### Öğrenci Bilgi Sistemi (OBS)

**Bulut Bilişim Operatörlüğü** öğrencileri için tasarlanmış; cam efektli (glassmorphism) arayüzü, dönemlik ders kaydı, geri sayımlı sınav takvimi, e-imzalı belge üretimi ve canlı GANO simülatörüyle modern bir öğrenci bilgi sistemi.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=flat-square)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white&style=flat-square)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white&style=flat-square)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_%2B_Realtime-3ECF8E?logo=supabase&logoColor=white&style=flat-square)](https://supabase.com)
[![Lisans](https://img.shields.io/badge/Demo-E%C4%9Fitim_ama%C3%A7l%C4%B1-7C5CFF?style=flat-square)](#-demo-hesapları)

</div>

---

## İçindekiler

- [Genel Bakış](#-genel-bakış)
- [Demo Hesapları](#-demo-hesapları)
- [Supabase Modu](#-supabase-modu)
  - [E-posta OTP Girişi](#e-posta-otp-girişi)
  - [Rol Tabanlı Erişim (RLS)](#rol-tabanlı-erişim-rls)
  - [Realtime Mesajlaşma](#realtime-mesajlaşma)
  - [7 Günlük Mesaj TTL](#7-günlük-mesaj-ttl)
  - [Supabase Kurulumu](#supabase-kurulumu)
- [Öne Çıkan Özellikler](#-öne-çıkan-özellikler)
- [Rol Bazlı Modüller](#-rol-bazlı-modüller)
- [Ders Kaydı Akışı](#-ders-kaydı-akışı)
- [Belge Üretimi](#-belge-üretimi)
- [QR Yoklama](#-qr-yoklama)
- [Dil Desteği (TR/EN)](#-dil-desteği-tren)
- [Bulut Taşıma (AWS)](#-bulut-taşıma-aws)
- [Teknoloji Yığını](#-teknoloji-yığını)
- [Kurulum](#-kurulum)
- [Proje Yapısı](#-proje-yapısı)
- [Tasarım Sistemi](#-tasarım-sistemi)
- [Veri Saklama](#-veri-saklama)
- [Notlandırma Sistemi](#-notlandırma-sistemi)

---

## Genel Bakış

Nova Teknik Üniversitesi OBS; öğrenci, akademisyen ve yönetici rollerini tek bir modern arayüzde birleştirir. Proje, **Bulut Bilişim Operatörlüğü** ön lisans programı öğrencisi **Elif Yılmaz** üzerinden uçtan uca bir demo deneyimi sunar.

- **Danışman Akademisyen:** Dr. Öğr. Üyesi Cafer Ahmet Çınar
- **Bölüm:** Bulut Bilişim Operatörlüğü
- **Fakülte:** Meslek Yüksekokulu
- **Aktif Dönem:** 2026–2027 Güz
- **Kurum kimliği:** Tüm ekranlar, belge şablonları ve meta bilgiler `src/config/branding.ts` içindeki tek kaynaktan beslenir.

Geleneksel OBS menü başlıkları — *Genel İşlemler*, *Ders ve Dönem İşlemleri*, *Form İşlemleri*, *Kullanıcı İşlemleri* — yeniden yorumlanarak **cam efektli, gruplu yan menü kartlarına** dönüştürüldü. Her grup kendi ikon rengi, ışıltısı ve aktif durum geçişiyle tasarlandı.

---

## Demo Hesapları

Giriş ekranındaki sekmelerden rol seçip aşağıdaki bilgilerle giriş yapabilirsiniz. Demo modunda 6+ karakterli her şifre kabul edilir; önerilen hesaplar:

| Rol | Kullanıcı Adı | Şifre | Yönlendirme |
| --- | --- | --- | --- |
| Öğrenci | `2024001234` | `obs2026` | `/panel` |
| Akademisyen | `mert.aydin@uni.edu.tr` | `akademi2026` | `/hoca` |
| Yönetici | `yonetici` | `admin2026` | `/yonetim` |

> Oturum bilgileri `localStorage` üzerinde `obs.session` anahtarıyla saklanır; çıkış yaptığınızda temizlenir.
>
> **Supabase modu:** `.env` içinde `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` tanımlıysa şifreli demo formu yerine **e-posta OTP** girişi gösterilir. Demo hesapları yalnızca ortam değişkenleri boşken geçerlidir; ayrıntılar için [Supabase Modu](#-supabase-modu) bölümüne bakın.

---

## Supabase Modu

Proje iki modda çalışır; mod seçimi ortam değişkenlerine göre otomatik yapılır:

| Mod | Giriş | Mesajlaşma | Veri kaynağı |
| --- | --- | --- | --- |
| **Demo** (varsayılan) | Sekmeli şifreli demo formu | `localStorage` (`obs.chats.v1`) | Tarayıcı |
| **Supabase** | E-posta OTP (6 haneli kod) | Postgres + Realtime WebSocket | Supabase |

İki değerden biri eksikse uygulama güvenli biçimde demo moduna döner. Bu sayede Supabase kurulumu yapılmadan da Netlify önizlemesi ve yerel geliştirme çalışır.

### E-posta OTP Girişi

- Kullanıcı e-posta adresini girer, Supabase `signInWithOtp` ile 6 haneli tek kullanımlık kod gönderir.
- Kod `verifyOtp({ type: 'email' })` ile doğrulanır; oturum, yenileme ve çıkış işlemleri Supabase Auth tarafından yönetilir.
- İlk girişte `auth.users` kaydı ve profil otomatik oluşturulur. Rol ataması e-posta adresine göre yapılır:
  - `academician_directory` içinde bulunan adres → **akademisyen**
  - diğer adresler → **öğrenci**
  - yönetici rolü dizinlerden atanmaz; bilinçli olarak SQL ile verilir.
- "Akademisyen" sekmesi seçilip dizinde olmayan bir adresle giriş yapılırsa oturum kapatılır ve kullanıcıya uyarı gösterilir. Öğrenci sekmesinden akademisyen hesabıyla giriş yapılırsa kullanıcı kendi paneline yönlendirilir.
- Kod 10 dakika geçerlidir (Supabase ayarlarından 600 saniye olarak yapılandırılır). Yeniden gönderme için 30 saniyelik istemci bekleme süresi vardır.
- Supabase modunda demo `obs.session` anahtarı kullanılmaz; oturum Supabase istemcisinde saklanır.

`src/providers/AuthProvider.tsx` iki modu tek arayüzde birleştirir:

```ts
interface AuthContextValue {
  session: SessionUser | null;
  status: 'loading' | 'ready';
  isSupabaseMode: boolean;
  login: (...) => Promise<SessionUser>;      // demo
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
}
```

### Rol Tabanlı Erişim (RLS)

`supabase/schema.sql` aşağıdaki tabloları ve politikaları oluşturur:

| Tablo | Amaç | Erişim |
| --- | --- | --- |
| `profiles` | Kullanıcı adı, rol, öğrenci numarası, akademisyen anahtarı | Kendi profili + akademisyen/yönetici kadrosu; öğrenci yalnızca kendi profilini ekleyebilir |
| `academician_directory` | OTP e-postası → akademisyen rolü eşlemesi | Yalnızca okuma (authenticated) |
| `student_directory` | Demo öğrenci adı/numarası eşlemesi | Yalnızca okuma (authenticated) |
| `conversations` | Öğrenci–akademisyen ders görüşmesi | Katılımcılar; öğrenci yalnızca dizindeki akademisyene görüşme açar |
| `messages` | Mesaj gövdesi, gönderen ve rol | Görüşme katılımcıları; `sender_id = auth.uid()` ve rol eşleşmesi zorunlu |
| `conversation_reads` | Kullanıcı bazlı son okuma zamanı | Yalnızca kendi satırı |

- `handle_new_user()` trigger'ı yeni `auth.users` kaydında profili ve rolü otomatik hazırlar.
- Akademisyen henüz hiç giriş yapmamışsa görüşme `academician_email` üzerinden erişilebilir kalır; ilk girişte `academician_id` otomatik bağlanır.
- Öğrenci profil kimliği (`student_id`) ve akademisyen e-postası eşleşmesi, istemci tarafında filtre uygulanmasına ek olarak veritabanında da zorunlu tutulur.

### Realtime Mesajlaşma

`src/providers/SupabaseMessagingProvider.tsx`, Supabase modunda devreye girer:

- Açılışta görüşmeler, mesajlar ve okundu zamanları tek seferde yüklenir.
- `postgres_changes` aboneliği ile:
  - `messages` **INSERT** → yeni mesaj anında sohbete eklenir,
  - `messages` **DELETE** → TTL ile silinen mesaj açık ekrandan kaldırılır,
  - `conversations` **INSERT/UPDATE** → yeni görüşme veya akademisyen bağlantısı için liste yenilenir.
- Realtime aboneliğinden önce `realtime.setAuth(access_token)` çağrılır; böylece Postgres Changes olayları RLS ile filtrelenir.
- DELETE olayı yalnızca birincil anahtarı taşır; istemci tanımadığı kimlikleri yok sayar. Böylece başka görüşmelere ait içerik sızmaz.
- Okunmamış sayısı, `conversation_reads.last_read_at` ile mesaj zamanları karşılaştırılarak hesaplanır. Sohbet açıldığında okundu bilgisi 350 ms debounce ile `upsert` edilir.
- Mesaj gönderimi iyimser değil, veritabanı yanıtıyla eklenir; Realtime olayı aynı mesajı ikinci kez göndermeye çalışırsa kimlik üzerinden tekilleştirilir.

### 7 Günlük Mesaj TTL

`pg_cron`, mesajları oluşturulma tarihinden **7 gün** sonra otomatik siler:

```sql
-- supabase/schema.sql içinde tanımlı
select cron.schedule(
  'nova-obs-purge-expired-messages',
  '15 * * * *',                                  -- her saat başı :15
  'select public.purge_expired_messages();'
);
```

- `public.purge_expired_messages()` yalnızca `created_at < now() - interval '7 days'` koşulunu siler ve silinen satır sayısını döndürür.
- Fonksiyon `security definer` olarak tanımlıdır; istemci rolleri doğrudan çalıştıramaz.
- Silme işlemi Realtime `DELETE` olayı ürettiği için açık sohbet ekranları otomatik güncellenir.
- Elle doğrulama: `select public.purge_expired_messages();` ve `select * from cron.job;`

### Supabase Kurulumu

1. [supabase.com](https://supabase.com) üzerinde ücretsiz bir proje oluşturun.
2. **SQL Editor**'da [`supabase/schema.sql`](./supabase/schema.sql) dosyasının tamamını çalıştırın. Bu işlem tabloları, RLS politikalarını, trigger'ları, Realtime yayınını ve cron işini kurar.
3. **Authentication → Providers → Email**'i etkinleştirin. **Email OTP Expiration** değerini `600` saniye yapın.
4. **Authentication → Email Templates → Magic Link** şablonunu kod gönderecek şekilde düzenleyin:

   ```html
   <h2>Nova Teknik OBS giriş kodunuz</h2>
   <p>Tek kullanımlık kodunuz:</p>
   <p style="font-size:28px;font-weight:700;letter-spacing:6px">{{ .Token }}</p>
   <p>Kod 10 dakika geçerlidir. Bu kodu kimseyle paylaşmayın.</p>
   ```

   > `{{ .ConfirmationURL }}` yerine mutlaka `{{ .Token }}` kullanın; aksi halde e-postada 6 haneli kod yerine bağlantı gelir.

5. **Database → Extensions** bölümünde `pg_cron` ve `pgcrypto` eklentilerinin etkin olduğunu doğrulayın (SQL dosyası `create extension if not exists` ile dener).
6. Proje kökünde `.env.example` dosyasını `.env` olarak kopyalayıp değerleri girin:

   ```bash
   cp .env.example .env
   ```

   ```dotenv
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```

   Değerler **Project Settings → API** ekranındadır. Yalnızca `anon` public anahtarını kullanın; `service_role` anahtarı asla tarayıcıya girmemelidir.

7. `npm run dev` ile yeniden başlatın. Giriş ekranında şifre alanı yerine **e-posta OTP** akışı görünür.

**Akademisyen dizinini genişletme**

```sql
insert into public.academician_directory (email, academician_key, full_name, department)
values ('yeni.hoca@uni.edu.tr', 'yeni-hoca', 'Dr. Öğr. Üyesi Yeni Hoca', 'Bilgisayar Mühendisliği')
on conflict (email) do update
set academician_key = excluded.academician_key,
    full_name = excluded.full_name,
    department = excluded.department;
```

Dizin kaydından sonra ilk OTP girişi akademisyen rolünü otomatik verir. Kullanıcı daha önce giriş yaptıysa profilini elle güncelleyin:

```sql
update public.profiles
set role = 'academician', academician_key = 'yeni-hoca'
where email = 'yeni.hoca@uni.edu.tr';
```

**Yönetici atama**

```sql
update public.profiles set role = 'admin' where email = 'yonetici@uni.edu.tr';
```

**Netlify ortam değişkenleri**

Site → **Site configuration → Environment variables** bölümüne `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` ekleyip yeniden deploy edin. Vite değişkenleri derleme sırasında gömer; yalnızca Netlify panelinde tanımlamak yeterli değildir, yeni bir build gerekir.

> **Üretim notu:** Supabase'in varsayılan e-posta servisi saatlik gönderim sınırına sahiptir. Gerçek kullanımda **Authentication → SMTP Settings** üzerinden kendi SMTP sağlayıcınızı bağlayın. Ayrıca OTP gönderimi için Supabase'in yerleşik e-posta doğrulama ve hız sınırı ayarlarını gözden geçirin.

---

## Öne Çıkan Özellikler

### Öğrenci Paneli

- **Genel Bakış** — GANO, tamamlanan AKTS, dönem ortalaması, devamsızlık riski, yaklaşan sınavlar ve danışman kartı.
- **Duyurular** — Yönetici tarafından yayınlanan duyuruları kategori ve hedef kitleye göre listeler; sabitlenmiş duyurular öne çıkar.
- **Derslerim & Notlarım** — Vize (%40), Final (%60), ortalama ve harf notunu otomatik hesaplayan tablo; geçme durumu renk kodları ve finalden geçmek için gereken puan simülatörü.
- **Ders Kaydı & Müfredat** — Zorunlu dersler kilitli listelenir; seçmeli ders havuzundan kontenjan kontrollü seçim yapılır. AKTS/kredi sayacı, 30 AKTS hedefi ve 40 AKTS üst sınırı, danışman onay durumu ve onay zaman çizelgesi tek ekranda.
- **Sınav Takvimi & Notlar** — Vize, final ve bütünleme sınavlarını tarih, saat, derslik ve sıra numarasıyla listeler; bir sonraki sınava kalan gün/saat/dakikayı canlı geri sayımla gösterir. Ders bazında vize–final–ortalama–harf notu özeti eşlik eder.
- **Harf Notu & GANO Simülatörü** — Her dersin harf notunu değiştirerek dönem GNO'sunu ve olası yeni GANO'yu anında hesaplar; "Tümü AA", "Tümü FF" ve "Mevcut" ön ayarlarıyla senaryoları karşılaştırır.
- **Devamsızlık Takibi** — Ders bazında devam oranı, devamsızlık hakkı ve kritik eşik uyarıları.
- **Transkript** — Dönem bazlı akademik geçmiş, AKTS ilerlemesi ve Nova Teknik üniversite antetli resmî olmayan transkript görünümü.
- **Formlar & Belgeler** — Tek tıkla e-imzalı **Öğrenci Belgesi** ve **Transkript** çıktısı; ayrıca öğrenci belgesi, staj, **bulut laboratuvarı erişim formu** ve ders muafiyet dilekçesi talepleri için durum takibi.
- **Profil & Güvenlik** — Kayıt bilgileri, danışman iletişimi, doğrulamalı şifre değiştirme ve oturum güvenliği özeti.
- **Mesajlarım** — Ders akademisyenleriyle WhatsApp/Slack tarzı sohbet; okunmamış mesaj sayacı ve danışman iletişimi.

### Akademisyen Paneli

- Ders seçimi ve öğrenci listesi üzerinden **Vize / Final** not girişi.
- **Notları Kaydet** ile notların `localStorage` üzerinde kalıcılaşması.
- Gelen öğrenci mesajlarını bildirim sayacıyla gösteren ve yanıtlamaya izin veren mesaj kutusu.

### Yönetici Paneli

- **Öğrenci kaydı** ve **akademisyen kaydı** formları (doğrulama ve fakülte/bölüm bağımlılığı ile).
- **Ders tanımlama** — Kod, ad, fakülte, bölüm, akademisyen, kredi/AKTS, dönem ve kontenjan.
- **Duyuru yayınlama** — Kategori, hedef kitle (Tümü / Öğrenciler / Akademisyenler) ve sabitleme seçeneği.

### Deneyim

- Açık/koyu tema geçişi (`obs.theme`), sistem tercihine saygılı ve ilk boyamadan önce uygulanır.
- Cam efektli kartlar, yumuşak gradyanlar ve `animate-rise` sayfa geçişleri.
- Mobil, tablet ve masaüstünde tam responsive yerleşim; mobilde açılır menü.
- Rol bazlı rota koruması: yetkisiz erişimler giriş ekranına veya rolün ana sayfasına yönlendirilir.
- Erişilebilirlik: anlamlı başlık hiyerarşisi, `aria-*` etiketleri, odak halkaları ve klavye ile gezinme.

---

## Rol Bazlı Modüller

| Alan | Öğrenci | Akademisyen | Yönetici |
| --- | :---: | :---: | :---: |
| Genel bakış / dashboard | ✓ | ✓ | ✓ |
| Dersler ve not görüntüleme | ✓ | ✓ | ✓ |
| Ders kaydı & müfredat | ✓ | — | — |
| Sınav takvimi & geri sayım | ✓ | — | — |
| GANO simülatörü | ✓ | — | — |
| Not girişi ve kaydetme | — | ✓ | — |
| Devamsızlık ve transkript | ✓ | — | — |
| E-imzalı belge üretimi | ✓ | — | — |
| Form ve belge talepleri | ✓ | — | — |
| Mesajlaşma | ✓ | ✓ | — |
| Kullanıcı kaydı | — | — | ✓ |
| Ders tanımlama | — | — | ✓ |
| Duyuru yayınlama | görüntüler | — | ✓ |

---

## Ders Kaydı Akışı

`/panel/ders-kaydi` sayfası üç durumlu bir kayıt makinesi kullanır:

| Durum | Anlamı | Kullanılabilir eylem |
| --- | --- | --- |
| `draft` | Seçim yapılıyor | Danışman onayına gönder (30–40 AKTS aralığında), geri al |
| `pending` | Danışman incelemesinde | Demo modunda onay simülasyonu, düzenlemeye dön |
| `approved` | Onaylandı | Kaydı düzenle, sıfırla |

- Zorunlu dersler müfredattan gelir ve kilitlidir; seçmeli havuzdan **6 ders** arasından seçim yapılır.
- Sayaç; toplam AKTS, kredi, seçmeli ders sayısı ve zorunlu/seçmeli dağılımını gösterir.
- 40 AKTS üst sınırı aşılamaz; 30 AKTS hedefinin altındaki seçimlerde gönderim engellenir.
- Her değişiklik `obs.course.registration.v1` anahtarına yazılır; sayfa yenilense de senaryo korunur.

---

## Belge Üretimi

`Formlar & Belgeler` ekranındaki iki kart, tarayıcıda çalışan bir **belge simülatörü** sunar:

- **Öğrenci Belgesi** — Üniversite antetli, öğrenci kimlik bilgileri tablosu, danışman e-imza bloğu, belge numarası ve doğrulama deseni içeren A4 çıktı.
- **Transkript** — Ders dökümü (kredi, AKTS, ortalama, harf, katsayı), GANO/dönem GNO/AKTS özeti ve akademik geçmiş tablosu.

Akış: butona basıldığında yeni sekmede yazdırma görünümü açılır, 500 ms sonra yazdırma diyaloğu tetiklenir. Kullanıcı diyalogdan **“PDF olarak kaydet”** seçeneğini kullanır. Popup engellenirse arayüzde uyarı gösterilir. Değerler `escapeHtml` ile temizlenir; belgelerde demo niteliği taşıdıklarına dair dipnot bulunur. Bu akış harici PDF kütüphanesi gerektirmez.

---

## QR Yoklama

Akademisyenler ders esnasında süreli bir yoklama oturumu açar; öğrenciler dönen QR kodu kamerayla tarayıp ekrana **dokunmatik dijital imza** atarak katılır.

**Akademisyen akışı** (`/hoca/yoklama`)
- Ders seçimi ve süre (5/10/15/30 dk) ile oturum başlatılır; dersi başka bir oturum açıksa otomatik kapatılır.
- Ekranda `qrcode` ile üretilen QR, 6 haneli yedek kod, geri sayım ve kod yenilenme çubuğu gösterilir.
- Katılan öğrenciler gerçek zamanlı listelenir; imza görüntülenebilir, oturum bitirilebilir.

**Öğrenci akışı** (`/panel/yoklama`)
- Kamera (`BarcodeDetector`) ile QR taranır veya yedek kod elle girilir.
- Oturum doğrulandıktan sonra imza tuvaline parmak/fare ile imza atılır ve katılım kaydedilir.
- Katılım geçmişi ve saklanan imzalar görüntülenebilir.

**Kod güvenliği**
- Kod, `sessionId + döngü numarası + gizli anahtar` üzerinden FNV-1a ile türetilir ve varsayılan **20 saniyede bir** yenilenir.
- İmza adımı kod ömründen uzun sürebildiği için son 3 döngü (yaklaşık 1 dakika) geçerli kabul edilir; oturum süresi ayrıca kontrol edilir.
- Yalnızca ders listesindeki öğrenciler katılabilir, aynı öğrenci ikinci kez imzalayamaz.

**Demo modunda senkronizasyon** `localStorage` (`obs.attendance.sessions.v1`) + `BroadcastChannel` üzerinden sekmeler arasında sağlanır. Supabase/AWS moduna geçerken yalnızca `src/services/attendance/` altındaki depo adaptörü değişir; ekranlar ve iş kuralları aynı kalır.

---

## Dil Desteği (TR/EN)

Arayüzün tamamı Türkçe ve İngilizce arasında değiştirilebilir.

- Sağ üstteki dil düğmesi (`TR` / `EN`) anında geçiş yapar; tercih `obs.locale` anahtarında saklanır ve `<html lang>` güncellenir.
- Sözlük `src/i18n/messages.ts` içinde tip güvenli biçimde tanımlıdır: Türkçe metinler kaynak, İngilizce karşılıklar `Partial` olarak tutulur; eksik çeviri otomatik Türkçeye düşer.
- Sayfa kümeleri kendi namespace dosyalarında yaşar (`src/i18n/namespaces/`), böylece yeni metin eklemek merkezi dosyayı büyütmez.
- Değişkenli metinler `{count}`, `{course}` gibi yer tutucularla çalışır; tarih/saat biçimlendirmesi `Intl` ile seçilen dile göre yapılır.
- Ders, kişi ve duyuru gibi demo verileri çevrilmez; kısaltmalarda TR için **AKTS**, EN için **ECTS** kullanılır.

---

## Bulut Taşıma (AWS)

Uygulama, veri katmanı adaptör tabanlı olduğundan AWS'e taşınırken ekranlar değişmez:

| Katman | Bugün | AWS hedefi |
| --- | --- | --- |
| Kimlik | Supabase Auth (Email OTP) veya demo oturumu | Amazon Cognito (e-posta OTP) |
| Yoklama verisi | `LocalAttendanceRepository` (localStorage + BroadcastChannel) | `AttendanceRepository` arayüzünü uygulayan HTTP adaptörü |
| Mesajlaşma | Supabase Realtime / localStorage | API Gateway + Lambda + DynamoDB Streams veya AppSync |
| Dosya/imza | Tarayıcıda veri URL'i | S3 (imza görüntüleri) |

Yapılandırma `src/config/runtime.ts` üzerinden ortam değişkenleriyle yönetilir:

| Değişken | Açıklama |
| --- | --- |
| `VITE_DATA_BACKEND` | `local`, `supabase` veya `aws`. Boşsa Supabase anahtarları varsa `supabase`, yoksa `local` seçilir. |
| `VITE_API_BASE_URL` | AWS API ağ geçidi kök adresi (ör. `https://api.ornek.edu.tr/v1`). |
| `VITE_AWS_REGION` | Hedef bölge (ör. `eu-central-1`). |
| `VITE_ATTENDANCE_ROTATION_SECONDS` | QR kod yenilenme süresi (10–120 sn, varsayılan 20). |

**Taşıma adımları**
1. `AttendanceRepository` (`src/types/attendance.ts`) arayüzünü uygulayan `HttpAttendanceRepository` ekleyin; `attendanceService` oluşturulurken bu adaptörü geçin.
2. Mesajlaşma için `MessagingProvider` arayüzünü uygulayan AWS sağlayıcısını `providers/` altına ekleyin.
3. Kimlik akışını Cognito'ya bağlayın; `AuthProvider` içindeki `resolveSupabaseSession` yerine Cognito doğrulaması kullanılır.
4. `.env` içine `VITE_DATA_BACKEND=aws`, `VITE_API_BASE_URL`, `VITE_AWS_REGION` değerlerini girin.

> Tarayıcı paketine yalnızca public yapılandırma girer. AWS erişim anahtarları ve `service_role` benzeri gizli anahtarlar asla `VITE_*` değişkenlerine yazılmamalıdır; imzalama sunucu tarafında yapılmalıdır.

---

## Teknoloji Yığını

| Katman | Teknoloji |
| --- | --- |
| UI | React 19, React Router 7 |
| Dil | TypeScript (strict, `noUnusedLocals`, `noUnusedParameters`) |
| Build | Vite 8 |
| Stil | Tailwind CSS 4 (`@tailwindcss/vite`) |
| İkonlar | lucide-react |
| Tipografi | Inter + Sora |
| Kimlik doğrulama | Supabase Auth (e-posta OTP) · demo modunda yerel şifre kontrolü |
| Veritabanı / Realtime | Supabase Postgres + Realtime (WebSocket) |
| Zamanlanmış görev | `pg_cron` — 7 günlük mesaj TTL |
| Durum / kalıcılık | React Context + `localStorage` (demo) / Supabase (OTP modu) |
| Belge çıktısı | `window.open` + yazdırma CSS'i (A4) |

---

## Kurulum

Gereksinim: **Node.js 20+** ve npm.

```bash
# Bağımlılıkları yükle
npm install

# (Opsiyonel) Supabase modu için ortam değişkenleri
cp .env.example .env
# .env içine VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY değerlerini girin
# Bulut taşıma için VITE_DATA_BACKEND / VITE_API_BASE_URL / VITE_AWS_REGION kullanılır

# Geliştirme sunucusunu başlat
npm run dev

# Üretim derlemesi (tsc --noEmit + vite build)
npm run build

# Derlemeyi önizle
npm run preview
```

Geliştirme sunucusu varsayılan olarak `http://127.0.0.1:5173/` adresinde açılır.

`.env` boşsa uygulama demo modunda (şifreli demo girişi + `localStorage`) çalışır. Supabase tablolarını kurmak için [Supabase Kurulumu](#supabase-kurulumu) adımlarını izleyin.

---

## Proje Yapısı

```text
OBS/
├── public/
│   └── nova-mark.svg           # Nova Teknik logosu / favicon
├── supabase/
│   └── schema.sql              # Tablolar, RLS, Realtime, pg_cron TTL
├── src/
│   ├── components/
│   │   ├── attendance/         # QR görseli, kamera tarayıcı, imza tuvali
│   │   ├── auth/               # Giriş ekranı, OTP formu, AuthGate
│   │   └── ui/                 # Card, Button, FormFields, Logo, Avatar…
│   ├── config/                 # branding.ts, runtime.ts (backend/API/bölge), rol ve RBAC tanımları
│   ├── context/                # Auth, tema, i18n ve mesajlaşma context'leri
│   ├── data/                   # Öğrenci, ders/müfredat, sınav takvimi, akademisyen, duyuru verileri
│   ├── hooks/                  # useAuth, useI18n, useAttendance, useMessaging…
│   ├── i18n/                   # TR kaynak sözlük + EN karşılıkları ve namespace dosyaları
│   ├── layouts/                # PanelLayout (cam efektli sidebar), rol layout'ları
│   ├── lib/                    # supabase.ts (ortam değişkeni kontrollü istemci)
│   ├── pages/
│   │   ├── academician/        # Dashboard, not girişi, mesajlar
│   │   ├── admin/              # Kayıt formları, ders tanımlama, duyurular
│   │   ├── student/            # Dashboard, notlar, ders kaydı, sınavlar, GANO, transkript…
│   │   └── LoginPage.tsx
│   ├── providers/              # AuthProvider, MessagingProvider, SupabaseMessagingProvider
│   ├── services/               # Kimlik doğrulama, yoklama servisi ve depo adaptörleri
│   ├── styles/                 # Tailwind teması ve global stiller
│   ├── types/                  # Paylaşılan TypeScript tipleri (supabase.ts satır tipleri)
│   └── utils/                  # Notlandırma, belge üretimi, tarih ve sınıf yardımcıları
├── .env.example                # Ortam değişkeni şablonu (Supabase + veri arka ucu)
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Tasarım Sistemi

- **Marka gradyanı:** `#7c5cff → #5f6bff → #a855f7`
- **Cam kartlar:** `backdrop-blur-xl`, yarı saydam yüzeyler, ince beyaz kenarlıklar ve düşük opaklıkta gölgeler.
- **Köşe yarıçapı:** Kartlarda `26px`, form kontrollerinde `16px`.
- **Yan menü:** 276px genişliğinde; gruplu cam kartlar (`Genel İşlemler`, `Ders ve Dönem İşlemleri`, `Form İşlemleri`, `Kullanıcı İşlemleri`), program ve danışman kartları.
- **Tema:** `.dark` sınıfı `<html>` üzerinde; tercih `obs.theme` anahtarında saklanır.
- **Hareket:** `animate-rise` giriş animasyonu, gradyan hover geçişleri ve aktif menü vurguları.

---

## Veri Saklama

**Demo modunda** tüm veriler tarayıcıda saklanır; sunucu veya veritabanı gerekmez. Tema tercihi her iki modda da yereldir.

| Anahtar | İçerik |
| --- | --- |
| `obs.session` | Demo oturum bilgisi (Supabase modunda kullanılmaz) |
| `obs.locale` | Dil tercihi (`tr` / `en`) |
| `obs.theme` | Tema tercihi (`light` / `dark`) |
| `obs.attendance.sessions.v1` | QR yoklama oturumları, katılımcılar ve dijital imzalar |
| `obs.chats.v1` | Demo öğrenci–akademisyen sohbetleri |
| `obs.gradebooks.v1` | Akademisyen not girişleri |
| `obs.student.forms.v1` | Öğrenci form ve belge talepleri |
| `obs.course.registration.v1` | Dönemlik ders kaydı, seçmeli dersler ve onay durumu |
| `obs.student.gpa-scenario.v1` | GANO simülatörü harf notu senaryosu |
| `obs.admin.students.v1` | Yönetici tarafından kaydedilen öğrenciler |
| `obs.admin.academicians.v1` | Kaydedilen akademisyenler |
| `obs.admin.courses.v1` | Tanımlanan dersler |
| `obs.admin.announcements.v1` | Yayınlanan duyurular |

**Supabase modunda** oturum, profiller, görüşmeler, mesajlar ve okundu bilgileri Postgres tablolarında tutulur; tarayıcıda yalnızca Supabase Auth oturum belirteci ve `obs.theme` kalır. Mesajlar 7 gün sonra `pg_cron` tarafından otomatik silinir.

> Demo verilerini sıfırlamak için tarayıcı geliştirici araçlarından ilgili anahtarları temizleyin.

---

## Notlandırma Sistemi

- **Dönem ortalaması:** Vize × 0.40 + Final × 0.60
- **Harf aralıkları:** AA, BA, BB, CB, CC, DC, DD, FD, FF
- **Geçme koşulu:** 60 ve üzeri (DD dahil)
- **GANO:** Dönem ortalamalarının AKTS ağırlıklı hesabı
- **GANO projeksiyonu:** `(mevcut GANO × 60 + dönem GNO × dönem AKTS) / (60 + dönem AKTS)` — simülatördeki senaryo, ders kredileriyle ağırlıklandırılarak hesaplanır.

---

<div align="center">

**Nova Teknik Üniversitesi · Öğrenci Bilgi Sistemi**

Bulut Bilişim Operatörlüğü için tasarlandı · Demo verilerle hazırlanmıştır

</div>
