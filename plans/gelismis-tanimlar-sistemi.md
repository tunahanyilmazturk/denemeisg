# 🏗️ Gelişmiş Tanımlar Sistemi - Mimari Plan

## 📋 Genel Bakış

Olay bildirim sistemi için dinamik, yapılandırılabilir tanımlar ekle. Sektörlere bağlı iş türleri, ekipmanlar, lokasyonlar ve olay nedenleri yönetimi.

---

## 🎯 Temel Hedefler

1. ✅ **Sistem Entegrasyonu:** Sektör → İş Türü → Ekipman → Lokasyon → Olay Nedenleri
2. ✅ **Dinamik İçerik:** Firma sektörü değişirse otomatik olarak alanlar güncellenir
3. ✅ **Kullanıcı Kontrol:** Settings'de basit CRUD arayüzü
4. ✅ **Seçmeli + Manuel:** Hazır listelerden seç VEYA manuel giriş yap

---

## 📊 Veri Yapısı Tasarımı

### 1. Types (types/index.ts)

```typescript
// Sector & Industry Definition
interface Sector {
  id: string;
  name: string; // "İnşaat", "Lojistik", "Tarım", vs.
  code?: string; // "CONST", "LOGIS", etc.
  description?: string;
}

interface JobDefinition {
  id: string;
  sectorId: string; // Hangi sektöre ait
  name: string; // "Şantiye Şefi", "Forklift Operatörü", vs.
  description?: string;
  riskLevel?: 'Düşük' | 'Orta' | 'Yüksek'; // Default risk seviyesi
}

interface EquipmentDefinition {
  id: string;
  sectorId: string;
  name: string; // "Forklift", "Vinç", "Kask", vs.
  category?: 'PPE' | 'Machinery' | 'Tool';
  riskAssociated?: string[]; // İlişkili riskler
}

interface LocationDefinition {
  id: string;
  companyId?: string; // Firma bazlı OR global
  name: string; // "A Blok", "Depo 1", vs.
  type?: 'Office' | 'Warehouse' | 'Site' | 'Other';
  riskLevel?: 'Düşük' | 'Orta' | 'Yüksek';
}

interface IncidentReasonDefinition {
  id: string;
  sectorId?: string; // Opsiyonel: Sektör bazlı
  name: string; // "Kaygan zemin", "Ekipman arızası", vs.
  category?: 'Human' | 'Equipment' | 'Environment' | 'Method';
  commonInjuries?: InjuryType[]; // Bu nedenle sık görülen yaralanmalar
}

interface AdvancedDefinitionsConfig {
  sectors: Sector[];
  jobDefinitions: JobDefinition[];
  equipmentDefinitions: EquipmentDefinition[];
  locationDefinitions: LocationDefinition[];
  incidentReasonDefinitions: IncidentReasonDefinition[];
}
```

---

## 🔄 Store Entegrasyonu (useStore.ts)

### State'e Eklenecekler:

```typescript
interface AppState {
  // Existing...
  
  // Advanced Definitions
  sectors: Sector[];
  jobDefinitions: JobDefinition[];
  equipmentDefinitions: EquipmentDefinition[];
  locationDefinitions: LocationDefinition[];
  incidentReasonDefinitions: IncidentReasonDefinition[];
  
  // Actions
  addSector: (sector: Sector) => void;
  updateSector: (sector: Sector) => void;
  deleteSector: (id: string) => void;
  
  addJobDefinition: (job: JobDefinition) => void;
  updateJobDefinition: (job: JobDefinition) => void;
  deleteJobDefinition: (id: string) => void;
  getJobsBySector: (sectorId: string) => JobDefinition[];
  
  addEquipmentDefinition: (equipment: EquipmentDefinition) => void;
  updateEquipmentDefinition: (equipment: EquipmentDefinition) => void;
  deleteEquipmentDefinition: (id: string) => void;
  getEquipmentBySector: (sectorId: string) => EquipmentDefinition[];
  
  addLocationDefinition: (location: LocationDefinition) => void;
  updateLocationDefinition: (location: LocationDefinition) => void;
  deleteLocationDefinition: (id: string) => void;
  getLocationsByCompany: (companyId: string) => LocationDefinition[];
  getGlobalLocations: () => LocationDefinition[];
  
  addIncidentReasonDefinition: (reason: IncidentReasonDefinition) => void;
  updateIncidentReasonDefinition: (reason: IncidentReasonDefinition) => void;
  deleteIncidentReasonDefinition: (id: string) => void;
  getReasonsBySector: (sectorId: string) => IncidentReasonDefinition[];
  getAllReasons: () => IncidentReasonDefinition[];
}
```

### Mock Data (Başlangıç Tanımları):

```typescript
const mockSectors: Sector[] = [
  { id: '1', name: 'İnşaat', code: 'CONST' },
  { id: '2', name: 'Lojistik', code: 'LOGIS' },
  { id: '3', name: 'Sanayi', code: 'INDUS' },
];

const mockJobDefinitions: JobDefinition[] = [
  { id: '1', sectorId: '1', name: 'Şantiye Şefi', riskLevel: 'Yüksek' },
  { id: '2', sectorId: '1', name: 'İnşaat İşçi', riskLevel: 'Yüksek' },
  { id: '3', sectorId: '2', name: 'Forklift Operatörü', riskLevel: 'Orta' },
];

const mockEquipmentDefinitions: EquipmentDefinition[] = [
  { id: '1', sectorId: '1', name: 'İskele', category: 'Machinery' },
  { id: '2', sectorId: '1', name: 'Kask', category: 'PPE' },
  { id: '3', sectorId: '2', name: 'Forklift', category: 'Machinery' },
];

const mockIncidentReasonDefinitions: IncidentReasonDefinition[] = [
  { id: '1', sectorId: '1', name: 'Kaygan zemin', category: 'Environment' },
  { id: '2', sectorId: '1', name: 'İskele düşmesi', category: 'Equipment' },
  { id: '3', name: 'Dikkatsizlik', category: 'Human' },
];
```

---

## 🖥️ Settings Sayfası - Yeni Tab

### Yer: Settings.tsx

Mevcut tabs'a "Gelişmiş Tanımlar" ekle:

```typescript
const tabs = [
  { id: 'general', label: 'Genel Ayarlar', icon: Building },
  { id: 'notifications', label: 'Bildirimler', icon: Bell },
  { id: 'security', label: 'Güvenlik', icon: Shield },
  { id: 'profile', label: 'Profil', icon: User },
  { id: 'advanced', label: 'Gelişmiş Tanımlar', icon: Settings }, // YENİ
];
```

### Advanced Tab İçeriği:

```
├── Sub-tabs (Accordion veya Tab):
│   ├── 1. Sektör Yönetimi
│   │   ├── Liste tablosu (Ad, Kod, Açıklama, İşlemler)
│   │   ├── Ekle butonu
│   │   └── Her satırda: Düzenle / Sil butonları
│   │
│   ├── 2. İş Tanımları
│   │   ├── Sektör filtresi
│   │   ├── Seçilen sektörün iş tanımları
│   │   └── Ekle / Düzenle / Sil işlemleri
│   │
│   ├── 3. Ekipman Tanımları
│   │   ├── Sektör filtresi
│   │   ├── Kategori filtresi (PPE, Machinery, Tool)
│   │   └── CRUD işlemleri
│   │
│   ├── 4. Lokasyon Tanımları
│   │   ├── Global / Firma Bazlı toggle
│   │   ├── Firma seçimi (firma bazlı ise)
│   │   └── CRUD işlemleri
│   │
│   └── 5. Olay Nedenleri
│       ├── Sektör filtresi (Opsiyonel)
│       ├── Kategori filtresi
│       ├── İlişkili yaralanmalar seçimi
│       └── CRUD işlemleri
```

---

## 📝 NewIncidentWizard Step 2 Güncellemeleri

### Validasyon Hatası Düzeltme:

**Problem:** "Lütfen olay açıklamasını en az 10 karakter giriniz."
**Çözüm:** Step 2'deki "Kısa Olay Özeti" textarea'yı kaldır. Doğrulama Step 6'daki açıklamalar için yapılsın.

### Step 2 Revize Düzen:

```
├── Durum (Seçmeli)
├── Öncelik/Şiddet (Seçmeli)
├── Olayı Tetikleyen Neden (SEÇMELİ + MANUEL)
│   ├── Dropdown: Tanımlı nedenler (sektöre göre filtrelı)
│   └── Input: Özel neden (manuel)
├── Olay Anında Yapılan İş (SEÇMELİ + MANUEL)
│   ├── Dropdown: Tanımlı iş türleri (sektöre göre)
│   └── Input: Özel iş (manuel)
├── Kullanılan Alet/Ekipman (SEÇMELİ + MANUEL, MULTI)
│   ├── Checkboxes: Tanımlı ekipmanlar (sektöre göre)
│   └── Input: Özel ekipman (manuel)
└── Tanık Var mı? (Seçmeli: Evet/Hayır)
```

### Dinamik İçerik Akışı:

```
1. Firma seçilir (Step 1)
   ↓
2. Firma sektörü Store'dan alınır
   ↓
3. Step 2'deki dropdown'lar otomatik doldurulur:
   - Olay Nedenleri (sektöre göre filtrelenmişs)
   - İş Tanımları (sektöre göre)
   - Ekipmanlar (sektöre göre)
   ↓
4. Kullanıcı seçim yapabilir VEYA manuel girebilir
```

---

## 🔗 Entegrasyon Noktaları

### 1. Company → Sector → Definitions

```
Company.sector (string) 
→ Sector.id (string) 
→ Definitions filtrelenmiş olur
```

Güncelleme: `Company` interface'ine `sectorId` ekle:

```typescript
interface Company {
  // Existing...
  sectorId?: string; // YENİ
  sector?: string;   // Compatibility için şimdilik tutalım
}
```

### 2. Cascading Dropdowns

Step 1'de Firma seçilir → Step 2'de dropdown'lar otomatik güncellenir.

### 3. Form Validation

Step 2'de "Ileri" butonuna tıklandığında:
- Seçmeli alanlar kontrol edilir (En az bir seçim veya manuel giriş)
- "Tanık Var mı?" opsiyonel olabilir

---

## 🎨 UI/UX Öneriler

### Settings - Advanced Tab

**Layout:** Accordion veya Sub-tabs (Material Design tarzı)

```
┌─ Sektör Yönetimi (genişlet/daralt)
│  ├─ Tablo (5 sütun max)
│  ├─ Ekle butonu
│  └─ Modal/Drawer: Sektör Ekle/Düzenle
│
├─ İş Tanımları
├─ Ekipman Tanımları
├─ Lokasyon Tanımları
└─ Olay Nedenleri
```

### Step 2 - Seçmeli + Manuel Alanlar

```
┌─ Olayı Tetikleyen Neden
│  ├─ Dropdown: [Kaygan zemin ▼]
│  │  └─ Öneriler: "Kaygan zemin", "Ekipman arızası", etc.
│  ├─ Veya
│  └─ Input: "Diğer neden (manuel yazınız)"
│
├─ Kullanılan Alet/Ekipman (Multiple seçim)
│  ├─ Checkboxes:
│  │  ☐ Forklift
│  │  ☐ Kask
│  │  ☐ Eldiven
│  └─ Input: "Diğer ekipman ekle"
```

---

## 🚀 Uygulama Sırası

1. **Types** - Yeni interface'ler ekle
2. **Store** - Yeni state ve actions ekle
3. **Settings** - Advanced Tab implementasyonu
4. **NewIncidentWizard** - Step 2 güncellemeleri
5. **Integration** - Cascading dropdown'lar
6. **Testing** - Form akışı test

---

## 📌 Zorunlu vs Opsiyonel Alanlar

| Alan | Zorunlu | Açıklama |
|------|---------|----------|
| Olayı Tetikleyen Neden | ⚠️ Min 1 | Seçim VEYA manuel |
| Olay Anında Yapılan İş | ⚠️ Min 1 | Seçim VEYA manuel |
| Kullanılan Alet/Ekipman | ❌ Hayır | Seçim ve/veya manuel |
| Tanık Var mı? | ❌ Hayır | İsteğe bağlı |

---

## 🔄 API Integrasyonu (Gelecek)

Bu sistem şimdilik **localStorage** (Zustand persist) kullanır.
Gelecekte REST API'ye geçiş için:

```
POST /api/v1/sectors
GET  /api/v1/sectors/:id/jobs
PUT  /api/v1/equipment/:id
DELETE /api/v1/locations/:id
```

---

## ✅ Başarı Kriterleri

- [ ] Sektör CRUD tam fonksiyonel
- [ ] Firma sektörü değişince dropdown'lar otomatik güncellenir
- [ ] Manuel giriş + seçmeli alanlar beraber çalışır
- [ ] Validasyon hataları düzeltildi
- [ ] TypeScript hata yok
- [ ] Dark mode desteği var
- [ ] Responsive tasarım
