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
  createdAt: string;
}

export interface Personnel {
  id: string;
  firstName: string;
  lastName: string;
  tcNo: string;
  role: string;
  assignedCompanyId?: string;
  phone: string;
  email: string;
  startDate: string;
}

export type IncidentType = 'İş Kazası' | 'Ramak Kala' | 'Meslek Hastalığı' | 'Çevre Olayı' | 'Maddi Hasarlı Olay';

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

