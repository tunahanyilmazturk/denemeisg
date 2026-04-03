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

export interface Personnel {
  id: string;
  firstName: string;
  lastName: string;
  tcNo: string;
  role: string;
  class?: PersonnelClass;
  assignedCompanyId?: string;
  phone: string;
  email: string;
  startDate: string;
}

export type IncidentType = 'İş Kazası' | 'Ramak Kala' | 'Meslek Hastalığı' | 'Çevre Olayı' | 'Maddi Hasarlı Olay';

export type InjuryType = 'Kırık-Çıkık' | 'Çatlak' | 'Ezilme' | 'Sıyrık' | 'Kesik' | 'Travma' | 'Bayılma' | 'Yanık' | 'Çapak kaçması' | 'Yumuşak doku zedelenmesi' | 'Kas zedelenmesi/yırtılması' | 'Batma/Delinme' | 'Burkulma' | 'Kas kasılması' | 'Zehirlenme' | 'Diğer';

export type SeverityLevel = 'Önemsiz' | '0-1 Gün' | '1-2 Gün' | '3 Gün ve Sonrası' | 'Minör' | 'Ciddi/Majör';

export type BodyPart = 'Baş' | 'Yüz' | 'Göz' | 'El-El Bileği' | 'Parmak' | 'Kol-Omuz' | 'Boyun' | 'Ayak-Ayak Bileği' | 'Bacak' | 'Bel' | 'İç organlar' | 'Göğüs-karın' | 'Omurga' | 'Diğer';

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
  // Revde Tedavi Bilgileri
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

