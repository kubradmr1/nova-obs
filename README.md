<div align="center">

<img src="./public/nova-mark.svg" alt="Nova Teknik Üniversitesi" width="88" height="88" />

# Nova Teknik Üniversitesi

### Öğrenci Bilgi Sistemi (OBS)

**Bulut Bilişim Operatörlüğü** öğrencileri için tasarlanmış; cam efektli (glassmorphism) arayüzü, dönemlik ders kaydı, geri sayımlı sınav takvimi, e-imzalı belge üretimi ve canlı GANO simülatörüyle modern bir öğrenci bilgi sistemi.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=flat-square)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white&style=flat-square)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white&style=flat-square)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square)](https://tailwindcss.com)
[![Lisans](https://img.shields.io/badge/Demo-E%C4%9Fitim_ama%C3%A7l%C4%B1-7C5CFF?style=flat-square)](#-demo-hesapları)

</div>

---

## İçindekiler

- [Genel Bakış](#-genel-bakış)
- [Demo Hesapları](#-demo-hesapları)
- [Öne Çıkan Özellikler](#-öne-çıkan-özellikler)
- [Rol Bazlı Modüller](#-rol-bazlı-modüller)
- [Ders Kaydı Akışı](#-ders-kaydı-akışı)
- [Belge Üretimi](#-belge-üretimi)
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

## Teknoloji Yığını

| Katman | Teknoloji |
| --- | --- |
| UI | React 19, React Router 7 |
| Dil | TypeScript (strict, `noUnusedLocals`, `noUnusedParameters`) |
| Build | Vite 8 |
| Stil | Tailwind CSS 4 (`@tailwindcss/vite`) |
| İkonlar | lucide-react |
| Tipografi | Inter + Sora |
| Durum / kalıcılık | React Context + `localStorage` |
| Belge çıktısı | `window.open` + yazdırma CSS'i (A4) |

---

## Kurulum

Gereksinim: **Node.js 20+** ve npm.

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Üretim derlemesi (tsc --noEmit + vite build)
npm run build

# Derlemeyi önizle
npm run preview
```

Geliştirme sunucusu varsayılan olarak `http://127.0.0.1:5173/` adresinde açılır.

---

## Proje Yapısı

```text
OBS/
├── public/
│   └── nova-mark.svg           # Nova Teknik logosu / favicon
├── src/
│   ├── components/
│   │   ├── auth/               # Giriş ekranı bileşenleri
│   │   └── ui/                 # Card, Button, FormFields, Logo, Avatar…
│   ├── config/                 # branding.ts (kurum adı, birim, doğrulama alan adı), rol tanımları
│   ├── context/                # Auth, tema ve mesajlaşma context'leri
│   ├── data/                   # Öğrenci, ders/müfredat, sınav takvimi, akademisyen, duyuru verileri
│   ├── hooks/                  # useAuth, useMessaging, useStoredList…
│   ├── layouts/                # PanelLayout (cam efektli sidebar), rol layout'ları
│   ├── pages/
│   │   ├── academician/        # Dashboard, not girişi, mesajlar
│   │   ├── admin/              # Kayıt formları, ders tanımlama, duyurular
│   │   ├── student/            # Dashboard, notlar, ders kaydı, sınavlar, GANO, transkript…
│   │   └── LoginPage.tsx
│   ├── services/               # Kimlik doğrulama servisi
│   ├── styles/                 # Tailwind teması ve global stiller
│   ├── types/                  # Paylaşılan TypeScript tipleri
│   └── utils/                  # Notlandırma, belge üretimi, tarih ve sınıf yardımcıları
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

Tüm demo verileri tarayıcıda saklanır; sunucu veya veritabanı gerektirmez.

| Anahtar | İçerik |
| --- | --- |
| `obs.session` | Aktif oturum bilgisi |
| `obs.theme` | Tema tercihi (`light` / `dark`) |
| `obs.chats.v1` | Öğrenci–akademisyen sohbetleri |
| `obs.gradebooks.v1` | Akademisyen not girişleri |
| `obs.student.forms.v1` | Öğrenci form ve belge talepleri |
| `obs.course.registration.v1` | Dönemlik ders kaydı, seçmeli dersler ve onay durumu |
| `obs.student.gpa-scenario.v1` | GANO simülatörü harf notu senaryosu |
| `obs.admin.students.v1` | Yönetici tarafından kaydedilen öğrenciler |
| `obs.admin.academicians.v1` | Kaydedilen akademisyenler |
| `obs.admin.courses.v1` | Tanımlanan dersler |
| `obs.admin.announcements.v1` | Yayınlanan duyurular |

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
