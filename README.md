# HanTech İSG Platform

<div align="center">
  <img src="public/logo/logo.png" alt="HanTech Logo" width="80" />
  <h3>İş Sağlığı ve Güvenliği Yönetim Sistemi</h3>
  <p>Modern, kapsamlı ve kullanıcı dostu İSG yönetim platformu</p>

  ![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)
  ![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite)
  ![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.0-06B6D4?logo=tailwindcss)
  ![Zustand](https://img.shields.io/badge/Zustand-5.0-brown)
</div>

---

## İçindekiler

- [Özellikler](#özellikler)
- [Teknolojiler](#teknolojiler)
- [Proje Yapısı](#proje-yapısı)
- [Kurulum](#kurulum)
- [Geliştirme](#geliştirme)
- [Kullanıcı Rolleri ve Yetkilendirme](#kullanıcı-rolleri-ve-yetkilendirme)
- [Modüller](#modüller)
- [Ayarlar ve Konfigürasyon](#ayarlar-ve-konfigürasyon)
- [Dışa Aktarma ve Raporlama](#dışa-aktarma-ve-raporlama)
- [PWA Desteği](#pwa-desteği)
- [Katkıda Bulunma](#katkıda-bulunma)

---

## Özellikler

- 🏢 **Firma Yönetimi** — Müşteri firma kayıtları, sektör atamaları, ISG personel atamaları
- 👥 **Personel Yönetimi** — Personel profilleri, muayene kayıtları, KKD zimmetleri
- ⚠️ **Kaza & Olay Bildirimleri** — Detaylı olay raporlama, fotoğraflı kayıt, aktivite takibi
- 🎓 **Eğitim Yönetimi** — Eğitim planlama, katılımcı takibi, sertifika bağlantısı
- 🏆 **Sertifika Yönetimi** — Sertifika oluşturma, PDF ihracı, son kullanma takibi
- 🛡️ **Risk Değerlendirme** — Risk matrisi, olasılık × şiddet hesaplaması, durum takibi
- 🪖 **KKD Takibi** — Ekipman zimmetleme, durum yönetimi, iade takibi
- 📊 **Analizler & Raporlar** — Grafikler, istatistikler, PDF/Excel dışa aktarma
- 🤖 **Yapay Zeka Desteği** — Gemini API ile olay açıklaması, kök neden analizi
- 🎨 **Özelleştirilebilir Görünüm** — Dark/light mod, renk aksanları, yazı boyutu
- 📱 **Tam Mobil Uyumluluk** — Responsive tasarım, PWA desteği, dokunmatik optimizasyon
- 🔐 **Rol Tabanlı Yetkilendirme** — 6 farklı kullanıcı rolü, kaynak bazlı izin sistemi
- 🌐 **PWA** — Çevrimdışı çalışma, ana ekrana ekleme, push bildirimler

---

## Teknolojiler

| Teknoloji | Sürüm | Amaç |
|-----------|-------|------|
| **React** | 19 | UI framework |
| **TypeScript** | 5.8 | Tip güvenliği |
| **Vite** | 8.0 | Build tool |
| **Tailwind CSS** | 4.0 | Stil sistemi |
| **Zustand** | 5.0 | Global state yönetimi |
| **React Router DOM** | 7.0 | Sayfa yönlendirme |
| **Motion** | 12.0 | Animasyonlar |
| **Recharts** | 3.0 | Grafikler |
| **jsPDF** | 4.0 | PDF oluşturma |
| **XLSX** | 0.18 | Excel dışa aktarma |
| **React Hot Toast** | 2.0 | Bildirimler |
| **Lucide React** | 1.0 | İkonlar |
| **date-fns** | 4.0 | Tarih işlemleri |

---

## Proje Yapısı

```
src/
├── App.tsx                     # Ana uygulama ve route konfigürasyonu
├── main.tsx                    # Uygulama giriş noktası
├── index.css                   # Global stiller, Tailwind direktifleri
├── vite-env.d.ts               # Vite ortam tipleri
│
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.tsx  # Korumalı rota bileşeni
│   ├── layout/
│   │   ├── Header.tsx          # Üst menü (arama, bildirimler, kullanıcı menüsü)
│   │   ├── Layout.tsx          # Ana sayfa iskelet yapısı
│   │   ├── MobileNav.tsx       # Mobil alt navigasyon
│   │   ├── PageTransition.tsx  # Sayfa geçiş animasyonları
│   │   └── Sidebar.tsx         # Sol kenar çubuğu navigasyonu
│   ├── settings/
│   │   ├── AdvancedDefinitionsTab.tsx
│   │   ├── AppearanceSettingsTab.tsx
│   │   └── NotificationSettingsTab.tsx
│   ├── ui/
│   │   ├── Button.tsx          # Düğme bileşeni (+ cn() yardımcı fonksiyonu)
│   │   ├── DataTable.tsx       # Sıralama/sayfalama destekli tablo
│   │   ├── FileUpload.tsx      # Dosya yükleme bileşeni
│   │   ├── ImageGallery.tsx    # Fotoğraf galerisi
│   │   ├── Input.tsx           # Form input bileşeni
│   │   └── Modal.tsx           # Modal diyalog bileşeni
│   └── ErrorBoundary.tsx       # Hata sınırı bileşenleri
│
├── constants/
│   └── index.ts                # Tüm sabit değerler (tipler, renkler, mesajlar)
│
├── hooks/
│   ├── useAppearance.ts        # Görünüm ayarları hook'u
│   ├── useDataTable.ts         # Tablo sıralama/filtreleme/sayfalama
│   └── useUserDataFilter.ts    # Kullanıcı bazlı veri filtreleme
│
├── pages/
│   ├── Dashboard.tsx           # Ana panel (istatistikler, grafikler)
│   ├── Companies.tsx           # Firma listesi
│   ├── CompanyDetail.tsx       # Firma detay sayfası
│   ├── NewCompanyWizard.tsx    # Firma ekleme sihirbazı
│   ├── Personnel.tsx           # Personel listesi
│   ├── PersonnelDetail.tsx     # Personel detay sayfası
│   ├── NewPersonnelWizard.tsx  # Personel ekleme sihirbazı
│   ├── Incidents.tsx           # Olay listesi
│   ├── IncidentDetail.tsx      # Olay detay sayfası
│   ├── NewIncidentWizard.tsx   # Olay bildirimi sihirbazı
│   ├── Trainings.tsx           # Eğitim listesi
│   ├── NewTrainingWizard.tsx   # Eğitim planlama sihirbazı
│   ├── Certificates.tsx        # Sertifika listesi
│   ├── NewCertificateWizard.tsx# Sertifika oluşturma sihirbazı
│   ├── Risks.tsx               # Risk listesi
│   ├── PPE.tsx                 # KKD listesi
│   ├── Reports.tsx             # Raporlar ve analizler
│   ├── Settings.tsx            # Sistem ayarları
│   ├── Profile.tsx             # Kullanıcı profili
│   ├── Login.tsx               # Giriş sayfası
│   └── ForgotPassword.tsx      # Şifre sıfırlama
│
├── store/
│   ├── mockData.ts             # Başlangıç veri tanımları
│   ├── useAuthStore.ts         # Kimlik doğrulama store'u
│   └── useStore.ts             # Ana uygulama store'u
│
├── types/
│   ├── auth.ts                 # Kimlik doğrulama tipleri ve rol izinleri
│   └── index.ts                # Ana uygulama tipleri
│
└── utils/
    ├── certificatePdfUtils.ts  # Sertifika PDF oluşturma
    ├── exportUtils.ts          # PDF/Excel dışa aktarma
    ├── helpers.ts              # Genel yardımcı fonksiyonlar
    ├── incidentPdfUtils.ts     # Olay raporu PDF oluşturma
    ├── passwordStrength.ts     # Şifre güvenlik kontrolü
    ├── tokenManager.ts         # JWT token yönetimi
    └── turkishPdfHelper.ts     # Türkçe karakter desteği
```

---

## Kurulum

### Gereksinimler

- Node.js 18+
- npm 9+ veya yarn 1.22+

### Adımlar

```bash
# Depoyu klonlayın
git clone https://github.com/your-org/hantech-isg.git
cd hantech-isg

# Bağımlılıkları yükleyin
npm install

# Ortam değişkenlerini ayarlayın
cp .env.example .env
# .env dosyasını düzenleyin

# Geliştirme sunucusunu başlatın
npm run dev
```

### Ortam Değişkenleri

`.env` dosyasında aşağıdaki değişkenleri tanımlayın:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## Geliştirme

```bash
# Geliştirme sunucusu (http://localhost:3000)
npm run dev

# TypeScript tür kontrolü
npm run lint

# Production build
npm run build

# Production build önizleme
npm run preview

# Testleri çalıştır
npm run test

# Test arayüzü
npm run test:ui
```

---

## Kullanıcı Rolleri ve Yetkilendirme

| Rol | Açıklama | Yetkiler |
|-----|----------|---------|
| `superadmin` | Süper Yönetici | Tüm işlemler |
| `admin` | Sistem Yöneticisi | Kullanıcı yönetimi dahil tüm işlemler |
| `mudur` | Müdür | Tüm ISG operasyonları okuma/yazma, raporlar |
| `isg_uzmani` | İSG Uzmanı | ISG operasyonları okuma/yazma |
| `isyeri_hekimi` | İşyeri Hekimi | ISG operasyonları okuma/yazma |
| `viewer` | İzleyici | Yalnızca okuma erişimi |

### Demo Kullanıcılar

| Email | Şifre | Rol |
|-------|-------|-----|
| `admin@hantech.com` | `Admin123!` | Admin |
| `uzman@hantech.com` | `Uzman123!` | İSG Uzmanı |
| `hekim@hantech.com` | `Hekim123!` | İşyeri Hekimi |
| `mudur@hantech.com` | `Mudur123!` | Müdür |

---

## Modüller

### 1. Dashboard
- Güvenlik skoru (0-100)
- Açık olaylar, yüksek riskler, eğitim tamamlama oranı
- Akıllı öneriler ve uyarılar
- Aylık trend grafikleri
- Firma karşılaştırma

### 2. Kaza & Olay Bildirimleri
- Çok adımlı olay kaydı sihirbazı
- Olay türleri: İş Kazası, Ramak Kala, Meslek Hastalığı, Çevre Olayı
- Fotoğraf yükleme ve galeri
- Yaralanma/vücut bölgesi kayıtları
- Önlem önerileri (4M: İnsan, Ekipman, Çevre, Metot)
- Aktivite geçmişi
- PDF raporu dışa aktarma
- AI destekli açıklama oluşturma

### 3. Eğitimler & Sertifikalar
- Eğitim planlama ve katılımcı yönetimi
- Sertifika şablonu özelleştirme
- Kaşe/imza görüntüsü ekleme
- Toplu PDF ihracı

### 4. Risk Değerlendirme
- Tehlike × Olasılık × Şiddet matrisi
- Risk puanı hesaplama
- Durum takibi (Açık / Devam Ediyor / Giderildi)
- Excel/PDF dışa aktarma

### 5. KKD Takibi
- Personel bazlı zimmet kayıtları
- Ekipman durumu takibi
- Yıpranmış/kayıp uyarıları

---

## Ayarlar ve Konfigürasyon

### Görünüm Ayarları
- Tema: Açık / Koyu / Sistem
- Yazı boyutu: Küçük / Orta / Büyük
- Renk aksanı: 8 farklı renk seçeneği

### OSGB Firma Bilgileri
- Firma adı, ticari ünvan
- Logo yükleme
- İletişim bilgileri

### Gelişmiş Tanımlamalar
- Sektör tanımları
- İş tanımları (sektöre göre)
- Ekipman tanımları
- Lokasyon tanımları
- Olay neden tanımları

---

## Dışa Aktarma ve Raporlama

| Format | Modüller |
|--------|---------|
| **PDF** | Dashboard, Olaylar, Sertifikalar, Risk Raporu |
| **Excel** | Olaylar, Eğitimler, Sertifikalar, KKD, Riskler, Personeller, Firmalar |

---

## PWA Desteği

Uygulama Progressive Web App (PWA) olarak kullanılabilir:

- **Çevrimdışı çalışma** — Service Worker ile önbellekleme
- **Ana ekrana ekleme** — Mobil ve masaüstünde uygulama kısayolu
- **Otomatik güncelleme** — Yeni versiyon yayınlandığında otomatik güncelleme
- **Font önbellekleme** — Google Fonts offline çalışması

---

## Katkıda Bulunma

1. Bu depoyu fork'layın
2. Özellik branchi oluşturun: `git checkout -b feature/yeni-ozellik`
3. Değişikliklerinizi commit edin: `git commit -m 'feat: yeni özellik eklendi'`
4. Branch'i push'layın: `git push origin feature/yeni-ozellik`
5. Pull Request açın

### Commit Mesaj Formatı

```
type(scope): kısa açıklama

feat: yeni özellik
fix: hata düzeltme
refactor: kod yeniden düzenleme
docs: dokümantasyon
style: stil değişiklikleri
test: test ekleme/güncelleme
chore: genel bakım
```

---

## Lisans

Bu proje Apache 2.0 lisansı altında dağıtılmaktadır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

<div align="center">
  <p>© 2026 HanTech Teknoloji A.Ş. — Tüm hakları saklıdır.</p>
</div>
