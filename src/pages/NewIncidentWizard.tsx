import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';
import { Incident, IncidentPhoto, Severity, IncidentStatus, IncidentType, InjuryType, SeverityLevel, BodyPart } from '../types';
import { PageTransition } from '../components/layout/PageTransition';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { FileUpload } from '../components/ui/FileUpload';
import {
  Plus, ChevronRight, ChevronLeft, AlertTriangle, Building2, Calendar,
  ClipboardList, FileText, Image as ImageIcon, Upload, X, Check, Info,
  User, Shield, Heart, Lightbulb, MapPin, Wrench, Activity, Eye, Camera
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const EMPLOYMENT_TYPES: ('Tam zamanlı' | 'Yarı zamanlı' | 'Ofis' | 'Geçici' | 'Taşeron' | 'Stajyer')[] =
  ['Tam zamanlı', 'Yarı zamanlı', 'Ofis', 'Geçici', 'Taşeron', 'Stajyer'];

const INJURY_TYPES: InjuryType[] = ['Kırık-Çıkık', 'Çatlak', 'Ezilme', 'Sıyrık', 'Kesik', 'Travma', 'Bayılma', 'Yanık', 'Çapak kaçması', 'Yumuşak doku zedelenmesi', 'Kas zedelenmesi/yırtılması', 'Batma/Delinme', 'Burkulma', 'Kas kasılması', 'Zehirlenme', 'Diğer'];

const SEVERITY_LEVELS: SeverityLevel[] = ['Önemsiz', '0-1 Gün', '1-2 Gün', '3 Gün ve Sonrası', 'Minör', 'Ciddi/Majör'];

const BODY_PARTS: BodyPart[] = ['Baş', 'Yüz', 'Göz', 'El-El Bileği', 'Parmak', 'Kol-Omuz', 'Boyun', 'Ayak-Ayak Bileği', 'Bacak', 'Bel', 'İç Organlar', 'Göğüs-Karın', 'Omurga', 'Diğer'];

const selectClass =
  'flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 transition-all';

const inputClass =
  'flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 transition-all';

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

// ─── INCIDENT ICON ────────────────────────────────────────────────────────────
const IncidentIcon = ({ type, size = 'md' }: { type: string; size?: 'sm' | 'md' | 'lg' }) => {
  const colors: Record<string, string> = {
    'İş Kazası': 'from-red-500 to-rose-600',
    'Ramak Kala': 'from-amber-500 to-orange-600',
    'Meslek Hastalığı': 'from-purple-500 to-violet-600',
    'Çevre Olayı': 'from-emerald-500 to-teal-600',
    'Maddi Hasarlı Olay': 'from-blue-500 to-cyan-600',
  };
  const color = colors[type] || 'from-indigo-500 to-purple-600';
  const sizeClass = size === 'sm' ? 'w-10 h-10' : size === 'lg' ? 'w-12 h-12' : 'w-12 h-12';
  const iconSize = size === 'sm' ? 'h-5 w-5' : 'h-6 w-6';

  return (
    <div className={`${sizeClass} rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold shrink-0 shadow-lg ring-4 ring-white/20`}>
      <AlertTriangle className={iconSize} />
    </div>
  );
};

// ─── STEP ICONS ─────────────────────────────────────────────────────────────────
const STEP_ICONS = [Building2, ClipboardList, User, Heart, Shield, FileText, Camera, Eye];
const STEP_COLORS = [
  'from-indigo-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-red-600',
  'from-amber-500 to-orange-600',
  'from-violet-500 to-purple-600',
  'from-pink-500 to-rose-600',
  'from-slate-500 to-slate-600',
];

const StepItem = ({ num, label, active, completed }: { num: number; label: string; active: boolean; completed: boolean }) => {
  const Icon = STEP_ICONS[num - 1] || AlertTriangle;
  return (
    <div className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition-all ${
      active ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
    }`}>
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm flex-shrink-0 transition-all ${
          active
            ? `bg-gradient-to-br ${STEP_COLORS[num - 1]} text-white shadow-lg shadow-indigo-500/30 scale-110`
            : completed
              ? 'bg-emerald-500 text-white shadow-md'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
        }`}
      >
        {completed ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${
          active ? 'text-indigo-700 dark:text-indigo-300' : completed ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'
        }`}>
          {label}
        </p>
        <p className={`text-[11px] ${
          active ? 'text-indigo-500 dark:text-indigo-400' : completed ? 'text-emerald-500 dark:text-emerald-500' : 'text-slate-400 dark:text-slate-500'
        }`}>
          {completed ? 'Tamamlandı' : active ? 'Devam ediyor' : 'Bekliyor'}
        </p>
      </div>
    </div>
  );
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export const NewIncidentWizard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    companies,
    personnel,
    addIncident,
    sectors,
    jobDefinitions,
    equipmentDefinitions,
    incidentReasonDefinitions,
    getJobsBySector,
    getEquipmentBySector,
    getReasonsBySector,
    getAllReasons
  } = useStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isTitleEdited, setIsTitleEdited] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [incidentPhotos, setIncidentPhotos] = useState<IncidentPhoto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic content based on selected company's sector
  const [availableJobs, setAvailableJobs] = useState(jobDefinitions);
  const [availableEquipment, setAvailableEquipment] = useState(equipmentDefinitions);
  const [availableReasons, setAvailableReasons] = useState(incidentReasonDefinitions);

  // Manual input states for Step 2
  const [manualReason, setManualReason] = useState('');
  const [manualJob, setManualJob] = useState('');
  const [manualEquipment, setManualEquipment] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);

  // Measure input states
  const [measureInputs, setMeasureInputs] = useState({
    personnel: '',
    equipment: '',
    environment: '',
    method: ''
  });

  const [formData, setFormData] = useState<Partial<Incident>>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    companyId: '',
    personnelId: '',
    description: '',
    severity: 'Orta',
    status: 'Açık',
    type: 'İş Kazası',
    affectedBodyPart: '',
    rootCause: '',
    measuresPersonnel: [],
    measuresEquipment: [],
    measuresEnvironment: [],
    measuresMethod: [],
    incidentReason: '',
    jobDuringIncident: '',
    equipmentUsed: '',
    hasWitness: false
  });

  const totalSteps = 8;

  const steps = [
    { num: 1, label: 'Firma & Temel Bilgiler' },
    { num: 2, label: 'Olay Detayları' },
    { num: 3, label: 'Kazalı Bilgileri' },
    { num: 4, label: 'Revirde Tedavi' },
    { num: 5, label: 'Önlem Önerileri' },
    { num: 6, label: 'Açıklamalar' },
    { num: 7, label: 'Fotoğraflar' },
    { num: 8, label: 'Gözden Geçirme' },
  ];

  // Update available options when company changes
  useEffect(() => {
    if (formData.companyId) {
      const company = companies.find(c => c.id === formData.companyId);
      if (company) {
        const sector = sectors.find(s => s.name === company.sector);
        if (sector) {
          setAvailableJobs(getJobsBySector(sector.id));
          setAvailableEquipment(getEquipmentBySector(sector.id));
          setAvailableReasons(getReasonsBySector(sector.id));
        }
      }
    } else {
      setAvailableJobs(jobDefinitions);
      setAvailableEquipment(equipmentDefinitions);
      setAvailableReasons(getAllReasons());
    }
  }, [formData.companyId, companies, sectors, jobDefinitions, equipmentDefinitions, incidentReasonDefinitions, getJobsBySector, getEquipmentBySector, getReasonsBySector, getAllReasons]);

  // Auto-generate title
  useEffect(() => {
    if (!isTitleEdited && formData.date && formData.companyId && formData.type) {
      const company = companies.find(c => c.id === formData.companyId);
      const companyName = company ? company.name : 'Bilinmeyen Firma';
      const dateStr = new Date(formData.date).toLocaleDateString('tr-TR');
      const autoTitle = `${dateStr} - ${companyName} - ${formData.type}`;
      setFormData(prev => ({ ...prev, title: autoTitle }));
    }
  }, [formData.date, formData.companyId, formData.type, companies, isTitleEdited]);

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.companyId) {
        toast.error('Lütfen bir firma seçiniz.');
        return;
      }
      if (!formData.type) {
        toast.error('Lütfen olay türünü seçiniz.');
        return;
      }
      if (!formData.date) {
        toast.error('Lütfen tarih seçiniz.');
        return;
      }
    }
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    // description is auto-generated into incidentDescription; allow either field
    const hasDescription = formData.description || formData.incidentDescription;
    if (!formData.title || !formData.date || !formData.companyId || !hasDescription) {
      const missing: string[] = [];
      if (!formData.title) missing.push('Başlık');
      if (!formData.date) missing.push('Tarih');
      if (!formData.companyId) missing.push('Firma');
      if (!hasDescription) missing.push('Açıklama');
      toast.error(`Lütfen zorunlu alanları doldurun: ${missing.join(', ')}`);
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newId = Date.now().toString();
      addIncident({
        ...formData,
        photos: incidentPhotos.length > 0 ? incidentPhotos : undefined,
        id: newId,
        createdBy: user?.id,
        createdAt: new Date().toISOString(),
      } as Incident);

      toast.success('Olay bildirimi başarıyla oluşturuldu.');
      navigate(`/incidents/${newId}`);
    } catch (error) {
      toast.error('Bir hata oluştu. Lütfen tekrar deneyiniz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle functions for checkboxes
  const toggleEmploymentType = useCallback((type: typeof EMPLOYMENT_TYPES[number]) => {
    const current = formData.injuredPersonEmploymentType || [];
    if (current.includes(type)) {
      setFormData({ ...formData, injuredPersonEmploymentType: current.filter(t => t !== type) });
    } else {
      setFormData({ ...formData, injuredPersonEmploymentType: [...current, type] });
    }
  }, [formData]);

  const toggleInjuryType = useCallback((type: InjuryType) => {
    const current = formData.injuryTypes || [];
    if (current.includes(type)) {
      setFormData({ ...formData, injuryTypes: current.filter(t => t !== type) });
    } else {
      setFormData({ ...formData, injuryTypes: [...current, type] });
    }
  }, [formData]);

  const toggleBodyPart = useCallback((part: BodyPart) => {
    const current = formData.affectedBodyParts || [];
    if (current.includes(part)) {
      setFormData({ ...formData, affectedBodyParts: current.filter(p => p !== part) });
    } else {
      setFormData({ ...formData, affectedBodyParts: [...current, part] });
    }
  }, [formData]);

  // Generate smart suggestions based on incident data
  const generateSuggestions = useCallback(() => {
    const suggestions = {
      personnel: [] as string[],
      equipment: [] as string[],
      environment: [] as string[],
      method: [] as string[]
    };

    const incidentType = formData.type;
    const injuryTypes = formData.injuryTypes || [];
    const bodyParts = formData.affectedBodyParts || [];
    const severity = formData.severityLevel;

    if (incidentType === 'İş Kazası') {
      suggestions.personnel.push('İSG eğitimi verilmesi', 'Farkındalık artırılması', 'Risk analizi eğitimi');
    }
    if (incidentType === 'Ramak Kala') {
      suggestions.personnel.push('Tehlike farkındalık eğitimi', 'Gözlem yeteneği geliştirme');
    }
    if (injuryTypes.includes('Kırık-Çıkık') || injuryTypes.includes('Çatlak')) {
      suggestions.personnel.push('Dikkat ve odaklanma eğitimi', 'Yorgunluk yönetimi eğitimi');
    }
    if (bodyParts.includes('Göz') || bodyParts.includes('Yüz')) {
      suggestions.personnel.push('KKD kullanım eğitimi (gözlük, kask)', 'Yüz koruma önlemleri');
    }
    if (bodyParts.includes('El-El Bileği') || bodyParts.includes('Parmak')) {
      suggestions.personnel.push('El koruma ekipmanı kullanımı', 'Eldiven seçimi eğitimi');
    }
    if (severity === 'Ciddi/Majör' || severity === '3 Gün ve Sonrası') {
      suggestions.personnel.push('Acil durum müdahale eğitimi', 'İlk yardım eğitimi');
    }

    if (bodyParts.includes('Baş') || bodyParts.includes('Yüz')) {
      suggestions.equipment.push('Kask temini', 'Yüz koruma siperliği', 'Gözlük dağıtımı');
    }
    if (bodyParts.includes('El-El Bileği') || bodyParts.includes('Parmak')) {
      suggestions.equipment.push('Uygun eldivenin temini', 'Koruyucu el aletleri');
    }
    if (bodyParts.includes('Ayak-Ayak Bileği')) {
      suggestions.equipment.push('İş ayakkabısı temini', 'Kaymaz tabanlı ayakkabı');
    }
    if (injuryTypes.includes('Yanık')) {
      suggestions.equipment.push('Alev geciktirici kıyafet', 'Eldiven ve koruyucu ekipman');
    }
    if (injuryTypes.includes('Zehirlenme')) {
      suggestions.equipment.push('Solunum cihazı temini', 'Hava ölçüm cihazı');
    }
    if (incidentType === 'Yüksekte Çalışma') {
      suggestions.equipment.push('Güvenlik kemeri ve halat', 'İskele kontrolü');
    }

    if (injuryTypes.includes('Kırık-Çıkık') || injuryTypes.includes('Düşme' as InjuryType)) {
      suggestions.environment.push('Zemin düzeltmesi', 'Kaymaz zemin kaplaması', 'Aydınlatma iyileştirmesi');
    }
    if (injuryTypes.includes('Yanık')) {
      suggestions.environment.push('Havalandırma iyileştirmesi', 'Yangın söndürme sistemleri');
    }
    if (injuryTypes.includes('Zehirlenme')) {
      suggestions.environment.push('Hava kalitesi izleme', 'Havalandırma sistemi');
    }
    if (bodyParts.includes('Göz')) {
      suggestions.environment.push('Aydınlatma seviyesi artırılması', 'Parlama önleyici tedbirler');
    }
    suggestions.environment.push('Yer düzeni ve düzenlilik', 'Uyarı işaretleri levhaları');

    suggestions.method.push('İş güvenliği talimatlarının güncellenmesi');
    suggestions.method.push('Periyodik risk değerlendirmesi');
    suggestions.method.push('Güvenli çalışma prosedürleri');
    if (incidentType === 'İş Kazası') {
      suggestions.method.push('Kaza önleme planı hazırlanması');
    }
    if (severity === 'Ciddi/Majör') {
      suggestions.method.push('Acil durum planı gözden geçirme');
    }
    suggestions.method.push('Periyodik İSG toplantıları');

    return suggestions;
  }, [formData]);

  // Measure management functions
  const addMeasure = useCallback((type: keyof typeof measureInputs, value: string) => {
    if (!value.trim()) return;

    const measureKeyMap = {
      personnel: 'measuresPersonnel',
      equipment: 'measuresEquipment',
      environment: 'measuresEnvironment',
      method: 'measuresMethod'
    };

    const measureKey = measureKeyMap[type] as keyof Incident;
    const current = (formData[measureKey] as string[]) || [];

    if (!current.includes(value.trim())) {
      const newMeasures = [...current, value.trim()];
      setFormData({ ...formData, [measureKey]: newMeasures });
    }
    setMeasureInputs(prev => ({ ...prev, [type]: '' }));
  }, [formData]);

  const removeMeasure = useCallback((type: keyof typeof measureInputs, value: string) => {
    const measureKeyMap = {
      personnel: 'measuresPersonnel',
      equipment: 'measuresEquipment',
      environment: 'measuresEnvironment',
      method: 'measuresMethod'
    };

    const measureKey = measureKeyMap[type] as keyof Incident;
    const current = (formData[measureKey] as string[]) || [];
    const newMeasures = current.filter(m => m !== value);
    setFormData({ ...formData, [measureKey]: newMeasures });
  }, [formData]);

  // File handling functions
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: AttachedFile[] = [];

    Array.from(files).forEach((file: File) => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} dosyası 10MB'dan büyük olamaz.`);
        return;
      }

      const newFile: AttachedFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file)
      };

      newFiles.push(newFile);
    });

    if (newFiles.length > 0) {
      setAttachedFiles(prev => [...prev, ...newFiles]);
      toast.success(`${newFiles.length} dosya eklendi.`);
    }
  }, []);

  const removeFile = useCallback((id: string) => {
    setAttachedFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.url) {
        URL.revokeObjectURL(file.url);
      }
      return prev.filter(f => f.id !== id);
    });
  }, []);

  // Auto-generate description functions
  const generateIncidentDescription = useCallback(() => {
    const company = companies.find(c => c.id === formData.companyId);
    const person = personnel.find(p => p.id === formData.personnelId);
    const injuredPerson = formData.injuredPersonName || (person ? `${person.firstName} ${person.lastName}` : 'Personel');
    const companyName = company?.name || 'Firma';
    const location = formData.location || 'Belirtilen lokasyon';
    const date = formData.date ? new Date(formData.date).toLocaleDateString('tr-TR') : 'Tarih';
    const injuryTypesStr = formData.injuryTypes?.join(', ') || '';
    const bodyPartsStr = formData.affectedBodyParts?.join(', ') || '';

    let description = `${date} tarihinde ${companyName} bünyesinde ${location} bölgesinde çalışmakta olan ${injuredPerson} `;

    if (formData.type === 'İş Kazası') {
      description += `iş kazası geçirmiştir.`;
    } else if (formData.type === 'Ramak Kala') {
      description += `ramak kala olayı yaşamıştır.`;
    } else {
      description += `${formData.type?.toLowerCase()} yaşamıştır.`;
    }

    if (injuryTypesStr) {
      description += ` Yaralanma türü: ${injuryTypesStr}.`;
    }
    if (bodyPartsStr) {
      description += ` Etkilenen bölgeler: ${bodyPartsStr}.`;
    }
    if (formData.description) {
      description += ` Olayın kısa özeti: ${formData.description}`;
    }

    return description;
  }, [formData, companies, personnel]);

  const generateMedicalDescription = useCallback(() => {
    const injuredPerson = formData.injuredPersonName || 'Personel';
    const injuryTypesStr = formData.injuryTypes?.join(', ') || 'yaralanma';
    const severity = formData.severityLevel || 'Belirtilmemiş';
    const bodyPartsStr = formData.affectedBodyParts?.join(', ') || 'belirtilen bölgeler';

    let description = `${injuredPerson}, ${bodyPartsStr} bölgesinde ${injuryTypesStr} şeklinde yaralanmıştır.`;
    description += ` Ciddiyet derecesi: ${severity}.`;

    if (formData.treatmentInfo) {
      description += ` Uygulanan tedavi: ${formData.treatmentInfo}.`;
    } else {
      description += ` Revire başvurmuş, ilk müdahale yapılmıştır.`;
    }

    if (formData.hospitalReferral) {
      description += ` Hastaneye sevk edilmiştir.`;
    }

    if (formData.daysOff && formData.daysOff > 0) {
      description += ` Çalışan ${formData.daysOff} gün dinlenmeye tabi tutulmuştur.`;
    }

    return description;
  }, [formData]);

  const generateRootCauseAnalysis = useCallback(() => {
    const person = personnel.find(p => p.id === formData.personnelId);
    const injuredPerson = formData.injuredPersonName || (person ? `${person.firstName} ${person.lastName}` : 'Personel');
    const experience = formData.injuredPersonTaskExperience || 'Belirtilmemiş';
    const shift = formData.injuredPersonShift || 'Belirtilmemiş';

    let analysis = `KÖK NEDEN ANALİZİ\n\n`;
    analysis += `1. OLAY ÖZETİ:\n`;
    analysis += `- Olay tarihi: ${formData.date ? new Date(formData.date).toLocaleDateString('tr-TR') : '-'}\n`;
    analysis += `- Kazalı personel: ${injuredPerson}\n`;
    analysis += `- Görevdeki tecrübesi: ${experience}\n`;
    analysis += `- Çalışma vardiyası: ${shift}\n\n`;

    analysis += `2. GÖZLEMLENEN NEDENLER:\n`;
    analysis += `- İnsan faktörü: Tecrübe seviyesi veya dikkat eksikliği\n`;
    analysis += `- Çevre koşulları: ${formData.location || 'Belirtilen lokasyon'}\n`;
    analysis += `- Organizasyon: Vardiya düzeni veya eğitim ihtiyacı\n\n`;

    analysis += `3. TEMEL NEDENLER:\n`;
    analysis += `- Risk değerlendirmesi yetersizliği\n`;
    analysis += `- Eğitim ve bilgilendirme eksiklikleri\n`;
    analysis += `- Güvenli çalışma prosedürlerinin uygulanmaması\n\n`;

    analysis += `4. ÖNERİLEN DÜZELTİCİ FAALİYETLER:\n`;
    if (formData.measuresPersonnel?.length) {
      analysis += `- İnsan önlemleri: ${formData.measuresPersonnel.join(', ')}\n`;
    }
    if (formData.measuresEquipment?.length) {
      analysis += `- Ekipman önlemleri: ${formData.measuresEquipment.join(', ')}\n`;
    }
    if (formData.measuresEnvironment?.length) {
      analysis += `- Ortam önlemleri: ${formData.measuresEnvironment.join(', ')}\n`;
    }
    if (formData.measuresMethod?.length) {
      analysis += `- Yöntem önlemleri: ${formData.measuresMethod.join(', ')}\n`;
    }

    return analysis;
  }, [formData, personnel]);

  // ─── RENDER STEP CONTENT ──────────────────────────────────────────────────────
  const renderStepContent = () => {
    const selectedCompany = companies.find(c => c.id === formData.companyId);
    const availableLocations = selectedCompany?.locations || [];

    switch (currentStep) {
      // STEP 1: Firma & Temel Bilgiler
      case 1:
        return (
          <div className="space-y-5">
            {/* Header */}
            <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Building2 className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Firma & Temel Bilgiler</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Olay ile ilgili firma, tür ve tarih bilgileri</p>
                </div>
              </div>
            </div>

            {/* Firma Seçimi */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5" />
                Firma & Personel
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      İlgili Firma <span className="text-red-500">*</span>
                    </label>
                    <select
                      className={selectClass}
                      value={formData.companyId || ''}
                      onChange={e => setFormData({ ...formData, companyId: e.target.value, location: '' })}
                    >
                      <option value="">Firma Seçiniz</option>
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">İlgili Personel</label>
                    <select
                      className={selectClass}
                      value={formData.personnelId || ''}
                      onChange={e => setFormData({ ...formData, personnelId: e.target.value })}
                    >
                      <option value="">Personel Seçiniz (Opsiyonel)</option>
                      {personnel
                        .filter(p => !formData.companyId || p.assignedCompanyId === formData.companyId)
                        .map(p => (
                          <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                        ))}
                    </select>
                    {formData.companyId && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Sadece seçili firmaya ait personeller listelenmektedir.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Olay Bilgileri */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5" />
                Olay Bilgileri
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Olay Türü <span className="text-red-500">*</span>
                    </label>
                    <select
                      className={selectClass}
                      value={formData.type || 'İş Kazası'}
                      onChange={e => setFormData({ ...formData, type: e.target.value as IncidentType })}
                    >
                      <option value="İş Kazası">İş Kazası</option>
                      <option value="Ramak Kala">Ramak Kala</option>
                      <option value="Meslek Hastalığı">Meslek Hastalığı</option>
                      <option value="Çevre Olayı">Çevre Olayı</option>
                      <option value="Maddi Hasarlı Olay">Maddi Hasarlı Olay</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Olay Başlığı <span className="text-red-500">*</span>
                    </label>
                    <Input
                      className={inputClass}
                      value={formData.title || ''}
                      onChange={e => { setIsTitleEdited(true); setFormData({ ...formData, title: e.target.value }); }}
                      placeholder="Otomatik oluşturulur veya düzenleyin"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Tarih <span className="text-red-500">*</span>
                    </label>
                    <Input
                      className={inputClass}
                      type="date"
                      value={formData.date || ''}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      Lokasyon
                    </label>
                    {availableLocations.length > 0 ? (
                      <select
                        className={selectClass}
                        value={formData.location || ''}
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                      >
                        <option value="">Lokasyon Seçiniz</option>
                        {availableLocations.map((loc, idx) => (
                          <option key={idx} value={loc}>{loc}</option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        className={inputClass}
                        value={formData.location || ''}
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Örn: A Blok 3. Kat, Şantiye Alanı"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Dosya Ekleme */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <Upload className="h-3.5 w-3.5" />
                Dosya Ekleme
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                <label className="flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all">
                  <Upload className="h-5 w-5 text-slate-400" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Dosya seçin veya sürükleyin (Fotoğraf, PDF vb.)</span>
                  <input type="file" className="hidden" multiple onChange={handleFileUpload} accept="image/*,.pdf,.doc,.docx" />
                </label>
                {attachedFiles.length > 0 && (
                  <div className="space-y-2">
                    {attachedFiles.map(file => (
                      <div key={file.id} className="group flex items-center justify-between bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/50 rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                            file.type.startsWith('image/') ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-slate-500 to-slate-600'
                          }`}>
                            {file.type.startsWith('image/') ? (
                              <ImageIcon className="h-4 w-4 text-white" />
                            ) : (
                              <FileText className="h-4 w-4 text-white" />
                            )}
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">{file.name}</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-60 group-hover:opacity-100"
                          title="Sil"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      // STEP 2: Olay Detayları
      case 2:
        return (
          <div className="space-y-5">
            {/* Header */}
            <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                  <ClipboardList className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Olay Detayları</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Durum, şiddet, tetikleyen nedenler ve kullanılan ekipman</p>
                </div>
              </div>
            </div>

            {/* Durum & Şiddet */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <Activity className="h-3.5 w-3.5" />
                Durum & Şiddet
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Başlangıç Durumu</label>
                    <select
                      className={selectClass}
                      value={formData.status || 'Açık'}
                      onChange={e => setFormData({ ...formData, status: e.target.value as IncidentStatus })}
                    >
                      <option value="Açık">Açık</option>
                      <option value="İnceleniyor">İnceleniyor</option>
                      <option value="Kapalı">Kapalı</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Öncelik / Şiddet</label>
                    <select
                      className={selectClass}
                      value={formData.severity || 'Orta'}
                      onChange={e => setFormData({ ...formData, severity: e.target.value as Severity })}
                    >
                      <option value="Düşük">Düşük</option>
                      <option value="Orta">Orta</option>
                      <option value="Yüksek">Yüksek</option>
                      <option value="Kritik">Kritik</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Tetikleyen Neden & Yapılan İş */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5" />
                Neden & İş Tanımı
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Olayı Tetikleyen Neden</label>
                  {availableReasons.length > 0 && (
                    <select
                      className={selectClass}
                      value={formData.rootCause || ''}
                      onChange={e => {
                        setFormData({ ...formData, rootCause: e.target.value });
                        setManualReason('');
                      }}
                    >
                      <option value="">Listeden seçin...</option>
                      {availableReasons.map(reason => (
                        <option key={reason.id} value={reason.name}>{reason.name}</option>
                      ))}
                    </select>
                  )}
                  <Input
                    className={inputClass}
                    value={formData.rootCause || ''}
                    onChange={e => setFormData({ ...formData, rootCause: e.target.value })}
                    placeholder="Manuel olarak neden yazın..."
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {availableReasons.length > 0 ? 'Yukarıdan seçebilir veya manuel yazabilirsiniz' : 'Manuel olarak nedeni giriniz'}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Olay Anında Yapılan İş</label>
                  {availableJobs.length > 0 && (
                    <select
                      className={selectClass}
                      value={formData.injuredPersonProcessDesc || ''}
                      onChange={e => {
                        setFormData({ ...formData, injuredPersonProcessDesc: e.target.value });
                        setManualJob('');
                      }}
                    >
                      <option value="">Listeden seçin...</option>
                      {availableJobs.map(job => (
                        <option key={job.id} value={job.name}>{job.name}</option>
                      ))}
                    </select>
                  )}
                  <Input
                    className={inputClass}
                    value={formData.injuredPersonProcessDesc || ''}
                    onChange={e => setFormData({ ...formData, injuredPersonProcessDesc: e.target.value })}
                    placeholder="Manuel olarak iş tanımını yazın..."
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {availableJobs.length > 0 ? 'Yukarıdan seçebilir veya manuel yazabilirsiniz' : 'Manuel olarak iş tanımını giriniz'}
                  </p>
                </div>
              </div>
            </div>

            {/* Ekipman & Tanık */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <Wrench className="h-3.5 w-3.5" />
                Ekipman & Tanık
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Kullanılan Alet / Ekipman</label>
                    {availableEquipment.length > 0 && (
                      <div className="space-y-2 max-h-48 overflow-y-auto p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800">
                        {availableEquipment.map(equipment => (
                          <label key={equipment.id} className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <input
                              type="checkbox"
                              checked={selectedEquipment.includes(equipment.id)}
                              onChange={e => {
                                if (e.target.checked) {
                                  setSelectedEquipment([...selectedEquipment, equipment.id]);
                                } else {
                                  setSelectedEquipment(selectedEquipment.filter(id => id !== equipment.id));
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-sm font-medium flex-1">{equipment.name}</span>
                            {equipment.category && (
                              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                                {equipment.category}
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        className={inputClass}
                        value={manualEquipment}
                        onChange={e => setManualEquipment(e.target.value)}
                        placeholder="Manuel ekipman ekle..."
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          if (manualEquipment.trim()) {
                            setSelectedEquipment([...selectedEquipment, manualEquipment]);
                            setManualEquipment('');
                          }
                        }}
                        className="shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {selectedEquipment.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedEquipment.map((item, idx) => {
                          const equipment = availableEquipment.find(e => e.id === item);
                          return (
                            <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 text-sm">
                              {equipment?.name || item}
                              <button
                                onClick={() => setSelectedEquipment(selectedEquipment.filter((_, i) => i !== idx))}
                                className="ml-1 hover:text-indigo-600 dark:hover:text-indigo-300"
                              >
                                ×
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tanık Var mı?</label>
                    <select
                      className={selectClass}
                      value={formData.hospitalReferral ? 'true' : 'false'}
                      onChange={e => setFormData({ ...formData, hospitalReferral: e.target.value === 'true' })}
                    >
                      <option value="false">Hayır</option>
                      <option value="true">Evet</option>
                    </select>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-3 border border-blue-200 dark:border-blue-800 mt-2">
                      <p className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-1.5">
                        <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                        Tanık varsa detayları açıklama bölümünde belirtebilirsiniz.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      // STEP 3: Kazalı Bilgileri
      case 3:
        return (
          <div className="space-y-5">
            {/* Header */}
            <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <User className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Kazalı Bilgileri</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Yaralanan personelin kişisel ve iş bilgileri</p>
                </div>
              </div>
            </div>

            {/* Kişisel Bilgiler */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <User className="h-3.5 w-3.5" />
                Kişisel Bilgiler
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Adı, Soyadı</label>
                    <Input
                      className={inputClass}
                      value={formData.injuredPersonName || ''}
                      onChange={e => setFormData({ ...formData, injuredPersonName: e.target.value })}
                      placeholder="Örn: Ahmet Yılmaz"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Proses Tanımı</label>
                    <Input
                      className={inputClass}
                      value={formData.injuredPersonProcessDesc || ''}
                      onChange={e => setFormData({ ...formData, injuredPersonProcessDesc: e.target.value })}
                      placeholder="Örn: Üretim hattı operatörü"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Doğum Tarihi
                    </label>
                    <Input
                      className={inputClass}
                      type="date"
                      value={formData.injuredPersonBirthDate || ''}
                      onChange={e => setFormData({ ...formData, injuredPersonBirthDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sicil No</label>
                    <Input
                      className={inputClass}
                      value={formData.injuredPersonEmployeeId || ''}
                      onChange={e => setFormData({ ...formData, injuredPersonEmployeeId: e.target.value })}
                      placeholder="Örn: 12345"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Çalışma Bilgileri */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <ClipboardList className="h-3.5 w-3.5" />
                Çalışma Bilgileri
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Çalışma Tipi</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {EMPLOYMENT_TYPES.map((type) => (
                      <label key={type} className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <input
                          type="checkbox"
                          checked={(formData.injuredPersonEmploymentType || []).includes(type)}
                          onChange={() => toggleEmploymentType(type)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Toplam Tecrübe Süresi</label>
                    <Input
                      className={inputClass}
                      value={formData.injuredPersonTotalExperience || ''}
                      onChange={e => setFormData({ ...formData, injuredPersonTotalExperience: e.target.value })}
                      placeholder="Örn: 5 yıl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Bu Görevdeki Tecrübe</label>
                    <Input
                      className={inputClass}
                      value={formData.injuredPersonTaskExperience || ''}
                      onChange={e => setFormData({ ...formData, injuredPersonTaskExperience: e.target.value })}
                      placeholder="Örn: 2 yıl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Cinsiyet</label>
                    <select
                      className={selectClass}
                      value={formData.injuredPersonGender || ''}
                      onChange={e => setFormData({ ...formData, injuredPersonGender: e.target.value as 'Erkek' | 'Kadın' })}
                    >
                      <option value="">Seçiniz</option>
                      <option value="Erkek">Erkek</option>
                      <option value="Kadın">Kadın</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Vardiya</label>
                    <Input
                      className={inputClass}
                      value={formData.injuredPersonShift || ''}
                      onChange={e => setFormData({ ...formData, injuredPersonShift: e.target.value })}
                      placeholder="Örn: Sabah / Akşam / Gece"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      // STEP 4: Revirde Tedavi Bilgileri
      case 4:
        return (
          <div className="space-y-5">
            {/* Header */}
            <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center">
                  <Heart className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Revirde Tedavi Bilgileri</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Yaralanma türü, etkilenen bölge ve tedavi bilgileri</p>
                </div>
              </div>
            </div>

            {/* Yaralanma Türü */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <Heart className="h-3.5 w-3.5" />
                Yaralanma Türü
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {INJURY_TYPES.map((type) => (
                    <label key={type} className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <input
                        type="checkbox"
                        checked={(formData.injuryTypes || []).includes(type)}
                        onChange={() => toggleInjuryType(type)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Yaralanan Organ */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <Activity className="h-3.5 w-3.5" />
                Yaralanan Organ
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {BODY_PARTS.map((part) => (
                    <label key={part} className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <input
                        type="checkbox"
                        checked={(formData.affectedBodyParts || []).includes(part)}
                        onChange={() => toggleBodyPart(part)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{part}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Ciddiyet & İş Günü Kaybı */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <Shield className="h-3.5 w-3.5" />
                Ciddiyet & İş Günü Kaybı
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {SEVERITY_LEVELS.map((level) => (
                    <label key={level} className="flex flex-col items-center gap-1 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <input
                        type="radio"
                        name="severityLevel"
                        checked={formData.severityLevel === level}
                        onChange={() => setFormData({ ...formData, severityLevel: level })}
                        className="rounded-full border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs text-center text-slate-700 dark:text-slate-300">{level}</span>
                    </label>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Çalışılamayan Gün Sayısı</label>
                    <Input
                      className={inputClass}
                      type="number"
                      min="0"
                      value={formData.daysOff || ''}
                      onChange={e => setFormData({ ...formData, daysOff: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Kısıtlı Çalışma Günü</label>
                    <Input
                      className={inputClass}
                      type="number"
                      min="0"
                      value={formData.restrictedWorkDays || ''}
                      onChange={e => setFormData({ ...formData, restrictedWorkDays: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      İşbaşı Tarihi
                    </label>
                    <Input
                      className={inputClass}
                      type="date"
                      value={formData.returnToWorkDate || ''}
                      onChange={e => setFormData({ ...formData, returnToWorkDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Hastaneye Sevk */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
              <label className="flex items-center gap-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hospitalReferral || false}
                  onChange={e => setFormData({ ...formData, hospitalReferral: e.target.checked })}
                  className="rounded border-amber-300 text-amber-600 focus:ring-amber-500 h-5 w-5"
                />
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Hastaneye Sevk Edildi</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">Personel hastaneye sevk edildi ise işaretleyiniz</p>
                </div>
              </label>
            </div>

            {/* Bilgi */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Bilgi</p>
                  <p className="text-blue-700 dark:text-blue-300">Olaylar ve ramak kala olaylar için bu kısım doldurulmayacaktır.</p>
                </div>
              </div>
            </div>
          </div>
        );

      // STEP 5: Önlem Önerileri
      case 5: {
        const measureKeyMap: Record<string, string> = {
          personnel: 'measuresPersonnel',
          equipment: 'measuresEquipment',
          environment: 'measuresEnvironment',
          method: 'measuresMethod'
        };

        const renderMeasureTextArea = (
          key: 'personnel' | 'equipment' | 'environment' | 'method',
          title: string,
          placeholder: string,
          bgClass: string,
          borderClass: string,
        ) => {
          const measureKey = measureKeyMap[key] as keyof Incident;
          const currentValue = (formData[measureKey] as string[])?.join('\n') || '';

          return (
            <div className={`space-y-3 p-4 rounded-xl ${bgClass} border ${borderClass}`}>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
              <textarea
                rows={4}
                className="flex w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 resize-none transition-all"
                value={currentValue}
                onChange={e => {
                  const lines = e.target.value.split('\n').filter(line => line.trim());
                  setFormData({ ...formData, [measureKey]: lines });
                }}
                placeholder={placeholder}
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Her satıra bir önlem yazabilirsiniz
              </p>
            </div>
          );
        };

        return (
          <div className="space-y-5">
            {/* Header */}
            <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <Shield className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Önlem Önerileri</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Benzer olayları önlemek için alınacak tedbirleri açıklama metni olarak yazın
                  </p>
                </div>
              </div>
            </div>

            {renderMeasureTextArea(
              'personnel',
              '1) İnsanda',
              'Örn:\nEğitim verilmesi\nFarkındalık artırılması\nRisk analizi eğitimi',
              'bg-blue-50/50 dark:bg-blue-900/10',
              'border-blue-200 dark:border-blue-800'
            )}

            {renderMeasureTextArea(
              'equipment',
              '2) Makina / Teçhizatta',
              'Örn:\nKKD temini\nGüvenlik ekipmanı kurulumu\nBakım periyodlarının güncellenmesi',
              'bg-emerald-50/50 dark:bg-emerald-900/10',
              'border-emerald-200 dark:border-emerald-800'
            )}

            {renderMeasureTextArea(
              'environment',
              '3) Ortamda',
              'Örn:\nAydınlatma iyileştirilmesi\nYer düzeni ve düzenlilik\nUyarı işaretleri levhaları',
              'bg-purple-50/50 dark:bg-purple-900/10',
              'border-purple-200 dark:border-purple-800'
            )}

            {renderMeasureTextArea(
              'method',
              '4) Yöntemde',
              'Örn:\nProsedür güncellemesi\nGüvenli çalışma talimatları\nPeriyodik risk değerlendirmesi',
              'bg-amber-50/50 dark:bg-amber-900/10',
              'border-amber-200 dark:border-amber-800'
            )}
          </div>
        );
      }

      // STEP 6: Açıklamalar
      case 6:
        return (
          <div className="space-y-5">
            {/* Header */}
            <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <FileText className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Açıklamalar</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Manuel doldurun veya otomatik oluşturma butonlarını kullanın</p>
                </div>
              </div>
            </div>

            {/* Olay Açıklaması */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" />
                Olay Açıklaması
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setFormData({ ...formData, incidentDescription: generateIncidentDescription() })}
                    className="text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 gap-1"
                  >
                    <Lightbulb className="h-3 w-3" />
                    Otomatik Doldur
                  </Button>
                </div>
                <textarea
                  rows={5}
                  className="flex w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 resize-none transition-all"
                  value={formData.incidentDescription || ''}
                  onChange={e => setFormData({ ...formData, incidentDescription: e.target.value })}
                  placeholder="Olayın detaylı açıklamasını giriniz..."
                />
              </div>
            </div>

            {/* Revir Tedavi Açıklaması */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide flex items-center gap-2">
                <Heart className="h-3.5 w-3.5" />
                Revir Tedavi Açıklaması
              </h3>
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 space-y-3">
                <div className="flex items-center justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setFormData({ ...formData, medicalTreatmentDescription: generateMedicalDescription() })}
                    className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 gap-1"
                  >
                    <Lightbulb className="h-3 w-3" />
                    Otomatik Doldur
                  </Button>
                </div>
                <textarea
                  rows={5}
                  className="flex w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:border-emerald-800 dark:bg-slate-800 dark:text-slate-50 resize-none transition-all"
                  value={formData.medicalTreatmentDescription || ''}
                  onChange={e => setFormData({ ...formData, medicalTreatmentDescription: e.target.value })}
                  placeholder="Revirde uygulanan tedavi açıklamasını giriniz..."
                />
              </div>
            </div>

            {/* Kök Neden Analizi */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5" />
                Kök Neden Analizi
              </h3>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800 space-y-3">
                <div className="flex items-center justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setFormData({ ...formData, rootCauseAnalysis: generateRootCauseAnalysis() })}
                    className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 gap-1"
                  >
                    <Lightbulb className="h-3 w-3" />
                    Otomatik Doldur
                  </Button>
                </div>
                <textarea
                  rows={8}
                  className="flex w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:border-amber-800 dark:bg-slate-800 dark:text-slate-50 resize-none transition-all font-mono"
                  value={formData.rootCauseAnalysis || ''}
                  onChange={e => setFormData({ ...formData, rootCauseAnalysis: e.target.value })}
                  placeholder="Kök neden analizini giriniz..."
                />
              </div>
            </div>
          </div>
        );

      // STEP 7: Fotoğraflar
      case 7:
        return (
          <div className="space-y-5">
            {/* Header */}
            <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                  <Camera className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Fotoğraflar</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Olay yerine ait fotoğrafları yükleyin (opsiyonel)</p>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Fotoğraf Yükleme İpuçları</p>
                  <p className="text-blue-700 dark:text-blue-300">
                    Olay yerinin genel görünümü, yaralanma bölgesi (uygunsa), kullanılan ekipman ve çevre koşullarını gösteren fotoğraflar ekleyin. Her fotoğraf için kısa bir açıklama yazmanız raporlamada faydalı olacaktır.
                  </p>
                </div>
              </div>
            </div>

            {/* File Upload Component */}
            <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <FileUpload
                photos={incidentPhotos}
                onPhotosChange={setIncidentPhotos}
                maxFiles={10}
                maxSizeMB={5}
              />
            </div>

            {/* Quick Stats */}
            {incidentPhotos.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white text-center">
                  <p className="text-2xl font-bold">{incidentPhotos.length}</p>
                  <p className="text-xs text-white/80">Toplam Fotoğraf</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white text-center">
                  <p className="text-2xl font-bold">
                    {(incidentPhotos.reduce((sum, p) => sum + p.size, 0) / (1024 * 1024)).toFixed(1)}MB
                  </p>
                  <p className="text-xs text-white/80">Toplam Boyut</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 text-white text-center">
                  <p className="text-2xl font-bold">
                    {incidentPhotos.filter(p => p.caption).length}
                  </p>
                  <p className="text-xs text-white/80">Açıklamalı</p>
                </div>
              </div>
            )}
          </div>
        );

      // STEP 8: Gözden Geçirme
      case 8: {
        const company = companies.find(c => c.id === formData.companyId);
        const person = personnel.find(p => p.id === formData.personnelId);

        return (
          <div className="space-y-5">
            {/* Header */}
            <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center">
                  <Eye className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Gözden Geçirme</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Girilen bilgileri kontrol ediniz</p>
                </div>
              </div>
            </div>

            {/* Özet Kartları */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <ClipboardList className="h-3.5 w-3.5" />
                Olay Özeti
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">Olay Başlığı & Türü</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {formData.title || '—'} <span className="text-xs font-normal text-slate-500">({formData.type || 'İş Kazası'})</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">Tarih & Lokasyon</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {formData.date ? new Date(formData.date).toLocaleDateString('tr-TR') : '—'}
                      {formData.location ? ` • ${formData.location}` : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">İlgili Firma</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{company?.name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">İlgili Personel</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {person ? `${person.firstName} ${person.lastName}` : 'Belirtilmedi'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">Durum</p>
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                      formData.status === 'Kapalı' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      formData.status === 'İnceleniyor' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {formData.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">Şiddet</p>
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                      formData.severity === 'Kritik' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      formData.severity === 'Yüksek' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      formData.severity === 'Orta' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {formData.severity}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Açıklama */}
            {formData.description && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" />
                  Olay Açıklaması
                </h3>
                <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-900 dark:text-white whitespace-pre-wrap">{formData.description}</p>
                </div>
              </div>
            )}

            {/* Ekli Dosyalar */}
            {attachedFiles.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                  <Upload className="h-3.5 w-3.5" />
                  Ekli Dosyalar ({attachedFiles.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {attachedFiles.map(file => (
                    <div key={file.id} className="flex items-center gap-3 bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/50 rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-700">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                        file.type.startsWith('image/') ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-slate-500 to-slate-600'
                      }`}>
                        {file.type.startsWith('image/') ? (
                          <ImageIcon className="h-4 w-4 text-white" />
                        ) : (
                          <FileText className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">{file.name}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Yüklenen Fotoğraflar */}
            {incidentPhotos.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                  <Camera className="h-3.5 w-3.5" />
                  Yüklenen Fotoğraflar ({incidentPhotos.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {incidentPhotos.map(photo => (
                    <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                      <img
                        src={photo.url}
                        alt={photo.caption || photo.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <p className="text-white text-xs font-medium truncate">
                          {photo.caption || photo.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Uyarı */}
            {(!formData.title || !formData.date || !formData.companyId || (!formData.description && !formData.incidentDescription)) && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-semibold mb-1">Eksik Alanlar</p>
                    <p className="text-amber-700 dark:text-amber-300">Lütfen tüm zorunlu alanları doldurduğunuzdan emin olun (Başlık, Tarih, Firma, Açıklama).</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  // Progress percentage
  const progressPercent = Math.round(((currentStep - 1) / (totalSteps - 1)) * 100);

  return (
    <PageTransition>
      <div className="flex h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 -mx-4 -my-4">
        {/* ─── SIDEBAR ─── */}
        <div className="hidden lg:flex flex-col w-[320px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 overflow-y-auto shrink-0">
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="p-6 pb-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">Yeni Olay</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Olay bildirimi oluşturun</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600 dark:text-slate-400">İlerleme</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{currentStep}/{totalSteps}</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="flex-1 px-4 py-2 space-y-1">
              {steps.map(step => (
                <button
                  key={step.num}
                  onClick={() => setCurrentStep(step.num)}
                  className="w-full text-left transition-all"
                >
                  <StepItem
                    num={step.num}
                    label={step.label}
                    active={currentStep === step.num}
                    completed={currentStep > step.num}
                  />
                </button>
              ))}
            </div>

            {/* Incident Preview */}
            <div className="p-4 pt-3 border-t border-slate-200 dark:border-slate-700 mt-auto">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-widest">Olay Önizleme</p>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-4">
                  <IncidentIcon type={formData.type || 'İş Kazası'} size="md" />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {formData.title || '—'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {formData.type || 'Tür seçilmedi'}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {formData.companyId && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                          <Building2 className="h-3 w-3" />
                          {companies.find(c => c.id === formData.companyId)?.name || '—'}
                        </span>
                      )}
                      {formData.severity && (
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          formData.severity === 'Kritik' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                          formData.severity === 'Yüksek' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                          formData.severity === 'Orta' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            formData.severity === 'Kritik' ? 'bg-red-500' :
                            formData.severity === 'Yüksek' ? 'bg-orange-500' :
                            formData.severity === 'Orta' ? 'bg-amber-500' : 'bg-slate-400'
                          }`}></span>
                          {formData.severity}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── CONTENT ─── */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Mobile Header + Step Nav */}
          <div className="lg:hidden shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 pt-4 pb-3">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">Yeni Olay Bildirimi</h1>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg">{currentStep}/{totalSteps}</span>
            </div>
            {/* Mobile Progress */}
            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
              {steps.map(step => {
                const Icon = STEP_ICONS[step.num - 1] || AlertTriangle;
                return (
                  <button key={step.num} onClick={() => setCurrentStep(step.num)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      currentStep === step.num ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 shadow-sm'
                      : currentStep > step.num ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                      currentStep === step.num ? `bg-gradient-to-br ${STEP_COLORS[step.num - 1]} text-white shadow-sm`
                      : currentStep > step.num ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                      {currentStep > step.num ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                    </span>
                    <span className="hidden sm:inline">{step.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable Main Content */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="max-w-4xl mx-auto w-full">
              {renderStepContent()}
            </div>
          </div>

          {/* Fixed Navigation Buttons */}
          <div className="shrink-0 border-t border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-4 lg:px-6 py-3 wizard-nav-buttons">
            <div className="max-w-4xl mx-auto w-full flex justify-between items-center gap-3">
              <Button
                variant="ghost"
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" /> Geri
              </Button>

              <div className="flex items-center gap-3">
                {/* Step Dots (Desktop) */}
                <div className="hidden lg:flex items-center gap-1.5 mr-2">
                  {steps.map((step) => (
                    <div
                      key={step.num}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        currentStep === step.num ? 'w-6 bg-indigo-500' : currentStep > step.num ? 'w-2 bg-emerald-500' : 'w-2 bg-slate-300 dark:bg-slate-600'
                      }`}
                    />
                  ))}
                </div>

                <Button
                  variant="ghost"
                  onClick={() => navigate('/incidents')}
                >
                  İptal
                </Button>

                {currentStep < totalSteps ? (
                  <Button onClick={handleNext} className="gap-2 px-6">
                    İleri <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="success"
                    onClick={handleSubmit}
                    className="gap-2 px-6"
                    disabled={!formData.title || !formData.date || !formData.companyId || (!formData.description && !formData.incidentDescription) || isSubmitting}
                    loading={isSubmitting}
                  >
                    <Check className="h-4 w-4" /> Kaydet & Bitir
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};
