export type Severity = 'Düşük' | 'Orta' | 'Yüksek' | 'Kritik';
export type IncidentStatus = 'Açık' | 'İnceleniyor' | 'Kapalı';
export type TrainingStatus = 'Planlandı' | 'Tamamlandı' | 'İptal';

export type PPEStatus = 'Aktif' | 'İade Edildi' | 'Yıprandı/Kayıp';
export type PPEType = 'Baret' | 'İş Ayakkabısı' | 'Eldiven' | 'Gözlük' | 'Reflektörlü Yelek' | 'Kulaklık' | 'Emniyet Kemeri' | 'Diğer';

export type RiskStatus = 'Açık' | 'Devam Ediyor' | 'Giderildi';

export interface Company {
  id: string;
  name: string;
  sector: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  locations?: string[];
  createdAt: string;
}

export type PersonnelClass = 'A' | 'B' | 'C';
export type PersonnelStatus = 'Aktif' | 'Pasif' | 'İstifa Etti';
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | '0+';

// ISG Personel Rolleri
export type PersonnelRole =
  // İSG Profesyonelleri
  | 'İşyeri Hekimi'
  | 'İş Güvenliği Uzmanı'
  | 'İşyeri Hemşiresi'
  | 'Sağlık Teknikeri'
  | 'İşyeri Hekimi Yardımcısı'
  | 'İş Güvenliği Teknikeri'
  | 'İşyeri Hekimi Asistanı'
  // Yönetim
  | 'Müdür'
  | 'Genel Müdür'
  | 'Şantiye Şefi'
  | 'Bölge Müdürü'
  | 'İşletme Müdürü'
  | 'Fabrika Müdürü'
  // Teknik
  | 'Mühendis'
  | 'Tekniker'
  | 'Teknisyen'
  | 'Mimar'
  // Üretim/İşçi
  | 'Usta'
  | 'Kalfa'
  | 'İşçi'
  | 'Operatör'
  | 'Üretim Personeli'
  // Destek
  | 'Sekreter'
  | 'Yönetici Asistanı'
  | 'Muhasebeci'
  | 'İnsan Kaynakları'
  | 'Satış Temsilcisi'
  | 'Sürücü'
  | 'Güvenlik Görevlisi'
  | 'Temizlik Personeli'
  // Diğer
  | 'Stajyer'
  | 'Geçici İşçi'
  | 'Taşeron Personeli'
  | 'Diğer';

export interface Personnel {
  id: string;
  firstName: string;
  lastName: string;
  tcNo: string;
  role: string;
  class?: PersonnelClass;
  status?: PersonnelStatus;
  assignedCompanyId?: string;
  phone: string;
  email: string;
  startDate: string;
  endDate?: string;
  birthDate?: string;
  bloodType?: BloodType;
  avatar?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  education?: string;
  certifications?: string[];
  medicalExams?: MedicalExam[];
  ppeRecords?: PPERecord[];
}

export interface MedicalExam {
  id: string;
  date: string;
  type: string;
  result: string;
  nextExamDate?: string;
  notes?: string;
}

export interface PPERecord {
  id: string;
  ppeType: PPEType;
  issuedDate: string;
  expiryDate?: string;
  status: PPEStatus;
}

export type IncidentType = 'İş Kazası' | 'Ramak Kala' | 'Meslek Hastalığı' | 'Çevre Olayı' | 'Maddi Hasarlı Olay';

export type InjuryType = 'Kırık-Çıkık' | 'Çatlak' | 'Ezilme' | 'Sıyrık' | 'Kesik' | 'Travma' | 'Bayılma' | 'Yanık' | 'Çapak kaçması' | 'Yumuşak doku zedelenmesi' | 'Kas zedelenmesi/yırtılması' | 'Batma/Delinme' | 'Burkulma' | 'Kas kasılması' | 'Zehirlenme' | 'Diğer';

export type SeverityLevel = 'Önemsiz' | '0-1 Gün' | '1-2 Gün' | '3 Gün ve Sonrası' | 'Minör' | 'Ciddi/Majör';

export type BodyPart = 'Baş' | 'Yüz' | 'Göz' | 'El-El Bileği' | 'Parmak' | 'Kol-Omuz' | 'Boyun' | 'Ayak-Ayak Bileği' | 'Bacak' | 'Bel' | 'İç Organlar' | 'Göğüs-Karın' | 'Omurga' | 'Diğer';

export interface Incident {
  id: string;
  title: string;
  description: string;
  date: string;
  companyId: string;
  personnelId?: string;
  severity: Severity;
  status: IncidentStatus;
  location: string;
  type?: IncidentType;
  affectedBodyPart?: string;
  rootCause?: string;
  // Revirde Tedavi Bilgileri
  injuryTypes?: InjuryType[];
  severityLevel?: SeverityLevel;
  treatmentInfo?: string;
  daysOff?: number;
  restrictedWorkDays?: number;
  returnToWorkDate?: string;
  hospitalReferral?: boolean;
  affectedBodyParts?: BodyPart[];
  // Önlem Önerileri
  measuresPersonnel?: string[];
  measuresEquipment?: string[];
  measuresEnvironment?: string[];
  measuresMethod?: string[];
  // Kazalı Bilgileri
  injuredPersonName?: string;
  injuredPersonDepartment?: string;
  injuredPersonCompany?: string;
  injuredPersonBirthDate?: string;
  injuredPersonEmployeeId?: string;
  injuredPersonProcessDesc?: string;
  injuredPersonEmploymentType?: ('Tam zamanlı' | 'Yarı zamanlı' | 'Ofis' | 'Geçici' | 'Taşeron' | 'Stajyer')[];
  injuredPersonTotalExperience?: string;
  injuredPersonTaskExperience?: string;
  injuredPersonGender?: 'Erkek' | 'Kadın';
  injuredPersonShift?: string;
  // Açıklamalar (Otomatik doldurulabilir)
  incidentDescription?: string;
  medicalTreatmentDescription?: string;
  rootCauseAnalysis?: string;
  createdAt: string;
}

export interface Training {
  id: string;
  title: string;
  trainer: string;
  date: string;
  duration: number; // saat cinsinden
  participants: string[]; // personel ID'leri
  status: TrainingStatus;
  description?: string;
  createdAt: string;
}

export interface PPE {
  id: string;
  personnelId: string;
  type: PPEType;
  name: string;
  issueDate: string;
  status: PPEStatus;
  notes?: string;
}

export interface Risk {
  id: string;
  hazard: string;
  risk: string;
  probability: number; // 1-5
  severity: number; // 1-5
  score: number; // probability * severity
  controlMeasure: string;
  responsible: string;
  status: RiskStatus;
  date: string;
}

// Advanced Definitions System
export interface Sector {
  id: string;
  name: string;
  code?: string;
  description?: string;
  createdAt: string;
}

export interface JobDefinition {
  id: string;
  sectorId: string;
  name: string;
  description?: string;
  riskLevel?: Severity;
  createdAt: string;
}

export interface EquipmentDefinition {
  id: string;
  sectorId: string;
  name: string;
  category?: 'PPE' | 'Machinery' | 'Tool' | 'Other';
  riskAssociated?: string[];
  createdAt: string;
}

export interface LocationDefinition {
  id: string;
  sectorId?: string;
  companyId?: string;
  name: string;
  type?: 'Office' | 'Warehouse' | 'Site' | 'Other';
  riskLevel?: Severity;
  createdAt: string;
}

export interface IncidentReasonDefinition {
  id: string;
  sectorId?: string;
  name: string;
  category?: 'Human' | 'Equipment' | 'Environment' | 'Method';
  commonInjuries?: InjuryType[];
  createdAt: string;
}

