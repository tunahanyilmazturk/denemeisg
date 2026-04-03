import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Incident, Severity, IncidentStatus, IncidentType, InjuryType, SeverityLevel, BodyPart } from '../types';
import { PageTransition } from '../components/layout/PageTransition';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { CheckCircle2, ChevronRight, ChevronLeft, AlertCircle, Upload, X, FileText, Image as ImageIcon, Lightbulb, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const steps = [
  { id: 1, title: 'Firma & Temel Bilgiler' },
  { id: 2, title: 'Olay Detayları' },
  { id: 3, title: 'Kazalı Bilgileri' },
  { id: 4, title: 'Revirde Tedavi Bilgileri' },
  { id: 5, title: 'Önlem Önerileri' },
  { id: 6, title: 'Açıklamalar' },
  { id: 7, title: 'Gözden Geçirme' }
];

// Constants for dropdowns
const EMPLOYMENT_TYPES: ('Tam zamanlı' | 'Yarı zamanlı' | 'Ofis' | 'Geçici' | 'Taşeron' | 'Stajyer')[] = 
  ['Tam zamanlı', 'Yarı zamanlı', 'Ofis', 'Geçici', 'Taşeron', 'Stajyer'];

const INJURY_TYPES: InjuryType[] = ['Kırık-Çıkık', 'Çatlak', 'Ezilme', 'Sıyrık', 'Kesik', 'Travma', 'Bayılma', 'Yanık', 'Çapak kaçması', 'Yumuşak doku zedelenmesi', 'Kas zedelenmesi/yırtılması', 'Batma/Delinme', 'Burkulma', 'Kas kasılması', 'Zehirlenme', 'Diğer'];

const SEVERITY_LEVELS: SeverityLevel[] = ['Önemsiz', '0-1 Gün', '1-2 Gün', '3 Gün ve Sonrası', 'Minör', 'Ciddi/Majör'];

const BODY_PARTS: BodyPart[] = ['Baş', 'Yüz', 'Göz', 'El-El Bileği', 'Parmak', 'Kol-Omuz', 'Boyun', 'Ayak-Ayak Bileği', 'Bacak', 'Bel', 'İç Organlar', 'Göğüs-Karın', 'Omurga', 'Diğer'];

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

export const NewIncidentWizard = () => {
  const navigate = useNavigate();
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
    // New fields for Step 2
    incidentReason: '',
    jobDuringIncident: '',
    equipmentUsed: '',
    hasWitness: false
  });
  
  // Update available options when company changes
  useEffect(() => {
    if (formData.companyId) {
      const company = companies.find(c => c.id === formData.companyId);
      if (company) {
        // Find sector by name (for now, until we add sectorId to Company)
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
  React.useEffect(() => {
    if (!isTitleEdited && formData.date && formData.companyId && formData.type) {
      const company = companies.find(c => c.id === formData.companyId);
      const companyName = company ? company.name : 'Bilinmeyen Firma';
      const dateStr = new Date(formData.date).toLocaleDateString('tr-TR');
      const autoTitle = `${dateStr} - ${companyName} - ${formData.type}`;
      
      setFormData(prev => ({ ...prev, title: autoTitle }));
    }
  }, [formData.date, formData.companyId, formData.type, companies, isTitleEdited]);

  const handleNext = () => {
    // Validation for step 1
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
    
    // Validation for step 2
    if (currentStep === 2) {
      // No required validation for Step 2 anymore
      // User can proceed without entering details
    }
    
    if (currentStep < 7) setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.date || !formData.companyId || !formData.description) {
      toast.error('Lütfen zorunlu alanları doldurun.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addIncident({
        ...formData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      } as Incident);
      
      toast.success('Olay bildirimi başarıyla oluşturuldu.');
      navigate('/incidents');
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
      setFormData({...formData, injuredPersonEmploymentType: current.filter(t => t !== type)});
    } else {
      setFormData({...formData, injuredPersonEmploymentType: [...current, type]});
    }
  }, [formData]);

  const toggleInjuryType = useCallback((type: InjuryType) => {
    const current = formData.injuryTypes || [];
    if (current.includes(type)) {
      setFormData({...formData, injuryTypes: current.filter(t => t !== type)});
    } else {
      setFormData({...formData, injuryTypes: [...current, type]});
    }
  }, [formData]);

  const toggleBodyPart = useCallback((part: BodyPart) => {
    const current = formData.affectedBodyParts || [];
    if (current.includes(part)) {
      setFormData({...formData, affectedBodyParts: current.filter(p => p !== part)});
    } else {
      setFormData({...formData, affectedBodyParts: [...current, part]});
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

    // Personnel suggestions based on incident type and injuries
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

    // Equipment suggestions
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

    // Environment suggestions
    if (injuryTypes.includes('Kırık-Çıkık') || injuryTypes.includes('Düşme')) {
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

    // Method suggestions
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
      setFormData({...formData, [measureKey]: newMeasures});
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
    setFormData({...formData, [measureKey]: newMeasures});
  }, [formData]);

  // File handling functions
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: AttachedFile[] = [];
    
    Array.from(files).forEach((file: File) => {
      // Check file size (max 10MB)
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
    const injuryTypes = formData.injuryTypes?.join(', ') || '';
    const bodyParts = formData.affectedBodyParts?.join(', ') || '';
    
    let description = `${date} tarihinde ${companyName} bünyesinde ${location} bölgesinde çalışmakta olan ${injuredPerson} `;
    
    if (formData.type === 'İş Kazası') {
      description += `iş kazası geçirmiştir.`;
    } else if (formData.type === 'Ramak Kala') {
      description += `ramak kala olayı yaşamıştır.`;
    } else {
      description += `${formData.type?.toLowerCase()} yaşamıştır.`;
    }
    
    if (injuryTypes) {
      description += ` Yaralanma türü: ${injuryTypes}.`;
    }
    if (bodyParts) {
      description += ` Etkilenen bölgeler: ${bodyParts}.`;
    }
    if (formData.description) {
      description += ` Olayın kısa özeti: ${formData.description}`;
    }
    
    return description;
  }, [formData, companies, personnel]);

  const generateMedicalDescription = useCallback(() => {
    const injuredPerson = formData.injuredPersonName || 'Personel';
    const injuryTypes = formData.injuryTypes?.join(', ') || 'yaralanma';
    const severity = formData.severityLevel || 'Belirtilmemiş';
    const bodyParts = formData.affectedBodyParts?.join(', ') || 'belirtilen bölgeler';
    
    let description = `${injuredPerson}, ${bodyParts} bölgesinde ${injuryTypes} şeklinde yaralanmıştır.`;
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

  // Render step content
  const renderStepContent = () => {
    const selectedCompany = companies.find(c => c.id === formData.companyId);
    const availableLocations = selectedCompany?.locations || [];
    
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-display font-semibold mb-6 text-slate-900 dark:text-white">Firma & Temel Bilgiler</h2>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  İlgili Firma <span className="text-red-500">*</span>
                </label>
                <select 
                  required
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 transition-all duration-200"
                  value={formData.companyId || ''}
                  onChange={e => setFormData({...formData, companyId: e.target.value, location: ''})}
                >
                  <option value="">Firma Seçiniz</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">İlgili Personel (Opsiyonel)</label>
                <select 
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 transition-all duration-200"
                  value={formData.personnelId || ''}
                  onChange={e => setFormData({...formData, personnelId: e.target.value})}
                >
                  <option value="">Personel Seçiniz</option>
                  {personnel
                    .filter(p => !formData.companyId || p.assignedCompanyId === formData.companyId)
                    .map(p => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                  ))}
                </select>
                {formData.companyId && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Sadece seçili firmaya ait personeller listelenmektedir.</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Olay Türü <span className="text-red-500">*</span>
                  </label>
                  <select 
                    required
                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 transition-all duration-200"
                    value={formData.type || 'İş Kazası'}
                    onChange={e => setFormData({...formData, type: e.target.value as IncidentType})}
                  >
                    <option value="İş Kazası">İş Kazası</option>
                    <option value="Ramak Kala">Ramak Kala</option>
                    <option value="Meslek Hastalığı">Meslek Hastalığı</option>
                    <option value="Çevre Olayı">Çevre Olayı</option>
                    <option value="Maddi Hasarlı Olay">Maddi Hasarlı Olay</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Olay Başlığı <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    required 
                    value={formData.title || ''} 
                    onChange={e => { setIsTitleEdited(true); setFormData({...formData, title: e.target.value}); }} 
                    placeholder="Otomatik oluşturulur veya düzenleyin" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Tarih <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    required 
                    type="date" 
                    value={formData.date || ''} 
                    onChange={e => setFormData({...formData, date: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Lokasyon</label>
                  {availableLocations.length > 0 ? (
                    <select
                      className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 transition-all duration-200"
                      value={formData.location || ''}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                    >
                      <option value="">Lokasyon Seçiniz</option>
                      {availableLocations.map((loc, idx) => (
                        <option key={idx} value={loc}>{loc}</option>
                      ))}
                    </select>
                  ) : (
                    <Input 
                      value={formData.location || ''} 
                      onChange={e => setFormData({...formData, location: e.target.value})} 
                      placeholder="Örn: A Blok 3. Kat, Şantiye Alanı" 
                    />
                  )}
                </div>
              </div>

              <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Dosya Ekle (Fotoğraf, PDF vb.)</label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all">
                    <Upload className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Dosya seçin veya sürükleyin</span>
                    <input type="file" className="hidden" multiple onChange={handleFileUpload} accept="image/*,.pdf,.doc,.docx" />
                  </label>
                </div>
                {attachedFiles.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {attachedFiles.map(file => (
                      <div key={file.id} className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                          {file.type.startsWith('image/') ? (
                            <ImageIcon className="h-4 w-4 text-indigo-500" />
                          ) : (
                            <FileText className="h-4 w-4 text-slate-500" />
                          )}
                          <span className="text-sm text-slate-700 dark:text-slate-300">{file.name}</span>
                          <span className="text-xs text-slate-500">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
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

      case 2:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-display font-semibold mb-6 text-slate-900 dark:text-white">Olay Detayları</h2>
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Başlangıç Durumu</label>
                  <select
                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 transition-all duration-200"
                    value={formData.status || 'Açık'}
                    onChange={e => setFormData({...formData, status: e.target.value as IncidentStatus})}
                  >
                    <option value="Açık">Açık</option>
                    <option value="İnceleniyor">İnceleniyor</option>
                    <option value="Kapalı">Kapalı</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Öncelik/Şiddet</label>
                  <select
                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 transition-all duration-200"
                    value={formData.severity || 'Orta'}
                    onChange={e => setFormData({...formData, severity: e.target.value as Severity})}
                  >
                    <option value="Düşük">Düşük</option>
                    <option value="Orta">Orta</option>
                    <option value="Yüksek">Yüksek</option>
                    <option value="Kritik">Kritik</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Olayı Tetikleyen Neden</label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 h-10 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 transition-all duration-200"
                    value={formData.rootCause || ''}
                    onChange={e => {
                      setFormData({...formData, rootCause: e.target.value});
                      setManualReason('');
                    }}
                  >
                    <option value="">Seçin veya manuel girin...</option>
                    {availableReasons.map(reason => (
                      <option key={reason.id} value={reason.name}>{reason.name}</option>
                    ))}
                  </select>
                </div>
                {availableReasons.length === 0 && (
                  <Input
                    value={formData.rootCause || ''}
                    onChange={e => setFormData({...formData, rootCause: e.target.value})}
                    placeholder="Manuel olarak neden girin..."
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Olay Anında Yapılan İş</label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 h-10 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 transition-all duration-200"
                    value={formData.injuredPersonProcessDesc || ''}
                    onChange={e => {
                      setFormData({...formData, injuredPersonProcessDesc: e.target.value});
                      setManualJob('');
                    }}
                  >
                    <option value="">Seçin veya manuel girin...</option>
                    {availableJobs.map(job => (
                      <option key={job.id} value={job.name}>{job.name}</option>
                    ))}
                  </select>
                </div>
                {availableJobs.length === 0 && (
                  <Input
                    value={formData.injuredPersonProcessDesc || ''}
                    onChange={e => setFormData({...formData, injuredPersonProcessDesc: e.target.value})}
                    placeholder="Manuel olarak iş tanımını girin..."
                  />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Kullanılan Alet/Ekipman</label>
                  <div className="space-y-2 max-h-64 overflow-y-auto p-3 border border-slate-200 dark:border-slate-700 rounded-xl">
                    {availableEquipment.length > 0 ? (
                      <>
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
                              <span className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {equipment.category}
                              </span>
                            )}
                          </label>
                        ))}
                      </>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={manualEquipment}
                      onChange={e => setManualEquipment(e.target.value)}
                      placeholder="Manuel ekipman ekle..."
                    />
                    <Button
                      variant="secondary"
                      onClick={() => {
                        if (manualEquipment.trim()) {
                          setSelectedEquipment([...selectedEquipment, manualEquipment]);
                          setManualEquipment('');
                        }
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {selectedEquipment.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedEquipment.map((item, idx) => {
                        const equipment = availableEquipment.find(e => e.id === item);
                        return (
                          <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100 text-sm">
                            {equipment?.name || item}
                            <button
                              onClick={() => setSelectedEquipment(selectedEquipment.filter((_, i) => i !== idx))}
                              className="ml-1 hover:text-indigo-700 dark:hover:text-indigo-300"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tanık Var mı?</label>
                  <select
                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 transition-all duration-200"
                    value={formData.hospitalReferral ? 'true' : 'false'}
                    onChange={e => setFormData({...formData, hospitalReferral: e.target.value === 'true'})}
                  >
                    <option value="false">Hayır</option>
                    <option value="true">Evet</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-display font-semibold mb-6 text-slate-900 dark:text-white">Kazalı Bilgileri</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 -mt-4 mb-4">Yaralanan personelin bilgilerini giriniz.</p>
            
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Adı, Soyadı</label>
                  <Input 
                    value={formData.injuredPersonName || ''} 
                    onChange={e => setFormData({...formData, injuredPersonName: e.target.value})} 
                    placeholder="Örn: Ahmet Yılmaz" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Proses Tanımı</label>
                  <Input 
                    value={formData.injuredPersonProcessDesc || ''} 
                    onChange={e => setFormData({...formData, injuredPersonProcessDesc: e.target.value})} 
                    placeholder="Örn: Üretim hattı operatörü" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Bölüm / Firma</label>
                  <Input 
                    value={formData.injuredPersonDepartment || ''} 
                    onChange={e => setFormData({...formData, injuredPersonDepartment: e.target.value})} 
                    placeholder="Örn: Üretim / ABC Ltd. Şti." 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Doğum Tarihi</label>
                  <Input 
                    type="date"
                    value={formData.injuredPersonBirthDate || ''} 
                    onChange={e => setFormData({...formData, injuredPersonBirthDate: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Sicil No</label>
                  <Input 
                    value={formData.injuredPersonEmployeeId || ''} 
                    onChange={e => setFormData({...formData, injuredPersonEmployeeId: e.target.value})} 
                    placeholder="Örn: 12345" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Çalışma Tipi</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {EMPLOYMENT_TYPES.map((type) => (
                    <label key={type} className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
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

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Toplam Tecrübe Süresi</label>
                  <Input 
                    value={formData.injuredPersonTotalExperience || ''} 
                    onChange={e => setFormData({...formData, injuredPersonTotalExperience: e.target.value})} 
                    placeholder="Örn: 5 yıl" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Bu Görevdeki Tecrübe</label>
                  <Input 
                    value={formData.injuredPersonTaskExperience || ''} 
                    onChange={e => setFormData({...formData, injuredPersonTaskExperience: e.target.value})} 
                    placeholder="Örn: 2 yıl" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Cinsiyet</label>
                  <select 
                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 transition-all duration-200"
                    value={formData.injuredPersonGender || ''}
                    onChange={e => setFormData({...formData, injuredPersonGender: e.target.value as 'Erkek' | 'Kadın'})}
                  >
                    <option value="">Seçiniz</option>
                    <option value="Erkek">Erkek</option>
                    <option value="Kadın">Kadın</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Vardiya</label>
                  <Input 
                    value={formData.injuredPersonShift || ''} 
                    onChange={e => setFormData({...formData, injuredPersonShift: e.target.value})} 
                    placeholder="Örn: Sabah / Akşam / Gece" 
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-display font-semibold mb-6 text-slate-900 dark:text-white">Revirde Tedavi Bilgileri</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 -mt-4 mb-4">Olaylar ve ramak kala olaylar için bu kısım doldurulmayacaktır.</p>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Yaralanma Türü</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {INJURY_TYPES.map((type) => (
                    <label key={type} className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
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

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Yaralanan Organ</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {BODY_PARTS.map((part) => (
                    <label key={part} className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
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

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ciddiyet / İş Günü Kaybı</label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {SEVERITY_LEVELS.map((level) => (
                    <label key={level} className="flex flex-col items-center gap-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <input
                        type="radio"
                        name="severityLevel"
                        checked={formData.severityLevel === level}
                        onChange={() => setFormData({...formData, severityLevel: level})}
                        className="rounded-full border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs text-center text-slate-700 dark:text-slate-300">{level}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Çalışılamayan Gün Sayısı</label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.daysOff || ''}
                    onChange={e => setFormData({...formData, daysOff: parseInt(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Kısıtlı Çalışma Günü</label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.restrictedWorkDays || ''}
                    onChange={e => setFormData({...formData, restrictedWorkDays: parseInt(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">İşbaşı Tarihi</label>
                  <Input
                    type="date"
                    value={formData.returnToWorkDate || ''}
                    onChange={e => setFormData({...formData, returnToWorkDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <input
                  type="checkbox"
                  id="hospitalReferral"
                  checked={formData.hospitalReferral || false}
                  onChange={e => setFormData({...formData, hospitalReferral: e.target.checked})}
                  className="rounded border-amber-300 text-amber-600 focus:ring-amber-500 h-5 w-5"
                />
                <label htmlFor="hospitalReferral" className="text-sm font-medium text-amber-800 dark:text-amber-400">
                  Hastaneye Sevk Edildi
                </label>
              </div>
            </div>
          </div>
        );

      case 5:
        const suggestions = generateSuggestions();

        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-display font-semibold mb-6 text-slate-900 dark:text-white">Önlem Önerileri</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 -mt-4 mb-4">
              Bu tür olayları/kazaları önlemek için alınacak önlem önerileri.
              <span className="text-indigo-600 dark:text-indigo-400 font-medium"> Seçtiğiniz bilgilere göre otomatik öneriler getirildi.</span>
            </p>
            
            <div className="space-y-6">
              <div className="space-y-3 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-400">1) İnsanda</h3>
                  {suggestions.personnel.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        suggestions.personnel.forEach(s => {
                          if (!formData.measuresPersonnel?.includes(s)) {
                            addMeasure('personnel', s);
                          }
                        });
                      }}
                      className="text-xs flex items-center gap-1 px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg transition-colors"
                    >
                      <Lightbulb className="h-3 w-3" />
                      Tüm Önerileri Ekle
                    </button>
                  )}
                </div>
                
                {suggestions.personnel.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3 p-2 bg-blue-100/50 dark:bg-blue-900/20 rounded-lg">
                    {suggestions.personnel.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (!formData.measuresPersonnel?.includes(suggestion)) {
                            addMeasure('personnel', suggestion);
                          }
                        }}
                        className="text-xs flex items-center gap-1 px-2 py-1 bg-white dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/60 transition-colors border border-blue-200 dark:border-blue-700"
                      >
                        <Plus className="h-3 w-3" />
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Input
                    value={measureInputs.personnel}
                    onChange={e => setMeasureInputs(prev => ({ ...prev, personnel: e.target.value }))}
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addMeasure('personnel', measureInputs.personnel))}
                    placeholder="Örn: Eğitim verilmesi, Farkındalık artırılması..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => addMeasure('personnel', measureInputs.personnel)}
                  >
                    Ekle
                  </Button>
                </div>
                {formData.measuresPersonnel && formData.measuresPersonnel.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.measuresPersonnel.map((measure, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                      >
                        {measure}
                        <button
                          type="button"
                          onClick={() => removeMeasure('personnel', measure)}
                          className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3 p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-emerald-900 dark:text-emerald-400">2) Makina / Teçhizatta</h3>
                  {suggestions.equipment.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        suggestions.equipment.forEach(s => {
                          if (!formData.measuresEquipment?.includes(s)) {
                            addMeasure('equipment', s);
                          }
                        });
                      }}
                      className="text-xs flex items-center gap-1 px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg transition-colors"
                    >
                      <Lightbulb className="h-3 w-3" />
                      Tüm Önerileri Ekle
                    </button>
                  )}
                </div>
                
                {suggestions.equipment.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3 p-2 bg-emerald-100/50 dark:bg-emerald-900/20 rounded-lg">
                    {suggestions.equipment.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (!formData.measuresEquipment?.includes(suggestion)) {
                            addMeasure('equipment', suggestion);
                          }
                        }}
                        className="text-xs flex items-center gap-1 px-2 py-1 bg-white dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-900/60 transition-colors border border-emerald-200 dark:border-emerald-700"
                      >
                        <Plus className="h-3 w-3" />
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Input
                    value={measureInputs.equipment}
                    onChange={e => setMeasureInputs(prev => ({ ...prev, equipment: e.target.value }))}
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addMeasure('equipment', measureInputs.equipment))}
                    placeholder="Örn: KKD temini, Güvenlik ekipmanı kurulumu..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => addMeasure('equipment', measureInputs.equipment)}
                  >
                    Ekle
                  </Button>
                </div>
                {formData.measuresEquipment && formData.measuresEquipment.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.measuresEquipment.map((measure, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                      >
                        {measure}
                        <button
                          type="button"
                          onClick={() => removeMeasure('equipment', measure)}
                          className="ml-1 text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3 p-4 rounded-xl bg-purple-50/50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-purple-900 dark:text-purple-400">3) Ortamda</h3>
                  {suggestions.environment.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        suggestions.environment.forEach(s => {
                          if (!formData.measuresEnvironment?.includes(s)) {
                            addMeasure('environment', s);
                          }
                        });
                      }}
                      className="text-xs flex items-center gap-1 px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg transition-colors"
                    >
                      <Lightbulb className="h-3 w-3" />
                      Tüm Önerileri Ekle
                    </button>
                  )}
                </div>
                
                {suggestions.environment.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3 p-2 bg-purple-100/50 dark:bg-purple-900/20 rounded-lg">
                    {suggestions.environment.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (!formData.measuresEnvironment?.includes(suggestion)) {
                            addMeasure('environment', suggestion);
                          }
                        }}
                        className="text-xs flex items-center gap-1 px-2 py-1 bg-white dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/60 transition-colors border border-purple-200 dark:border-purple-700"
                      >
                        <Plus className="h-3 w-3" />
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Input
                    value={measureInputs.environment}
                    onChange={e => setMeasureInputs(prev => ({ ...prev, environment: e.target.value }))}
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addMeasure('environment', measureInputs.environment))}
                    placeholder="Örn: Aydınlatma iyileştirilmesi, Yer düzeni..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => addMeasure('environment', measureInputs.environment)}
                  >
                    Ekle
                  </Button>
                </div>
                {formData.measuresEnvironment && formData.measuresEnvironment.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.measuresEnvironment.map((measure, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                      >
                        {measure}
                        <button
                          type="button"
                          onClick={() => removeMeasure('environment', measure)}
                          className="ml-1 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3 p-4 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-amber-900 dark:text-amber-400">4) Yöntemde</h3>
                  {suggestions.method.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        suggestions.method.forEach(s => {
                          if (!formData.measuresMethod?.includes(s)) {
                            addMeasure('method', s);
                          }
                        });
                      }}
                      className="text-xs flex items-center gap-1 px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-lg transition-colors"
                    >
                      <Lightbulb className="h-3 w-3" />
                      Tüm Önerileri Ekle
                    </button>
                  )}
                </div>
                
                {suggestions.method.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3 p-2 bg-amber-100/50 dark:bg-amber-900/20 rounded-lg">
                    {suggestions.method.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (!formData.measuresMethod?.includes(suggestion)) {
                            addMeasure('method', suggestion);
                          }
                        }}
                        className="text-xs flex items-center gap-1 px-2 py-1 bg-white dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-md hover:bg-amber-50 dark:hover:bg-amber-900/60 transition-colors border border-amber-200 dark:border-amber-700"
                      >
                        <Plus className="h-3 w-3" />
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Input
                    value={measureInputs.method}
                    onChange={e => setMeasureInputs(prev => ({ ...prev, method: e.target.value }))}
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addMeasure('method', measureInputs.method))}
                    placeholder="Örn: Prosedür güncellemesi, Çalışma talimatı..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => addMeasure('method', measureInputs.method)}
                  >
                    Ekle
                  </Button>
                </div>
                {formData.measuresMethod && formData.measuresMethod.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.measuresMethod.map((measure, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                      >
                        {measure}
                        <button
                          type="button"
                          onClick={() => removeMeasure('method', measure)}
                          className="ml-1 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-display font-semibold mb-6 text-slate-900 dark:text-white">Açıklamalar</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 -mt-4 mb-4">
              Aşağıdaki açıklama alanlarını manuel olarak doldurabilir veya "Otomatik Doldur" butonları ile sistem tarafından otomatik oluşturulmasını sağlayabilirsiniz.
            </p>
            
            <div className="space-y-6">
              <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">1. Olay Açıklaması</label>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setFormData({...formData, incidentDescription: generateIncidentDescription()})}
                    className="text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                  >
                    ✨ Otomatik Doldur
                  </Button>
                </div>
                <textarea
                  className="flex min-h-[120px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 transition-all duration-200"
                  value={formData.incidentDescription || ''}
                  onChange={e => setFormData({...formData, incidentDescription: e.target.value})}
                  placeholder="Olayın detaylı açıklamasını giriniz..."
                />
              </div>

              <div className="space-y-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-emerald-900 dark:text-emerald-400">2. Revir Tedavi Açıklaması</label>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setFormData({...formData, medicalTreatmentDescription: generateMedicalDescription()})}
                    className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  >
                    ✨ Otomatik Doldur
                  </Button>
                </div>
                <textarea
                  className="flex min-h-[120px] w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-emerald-800 dark:bg-slate-900 dark:text-slate-50 transition-all duration-200"
                  value={formData.medicalTreatmentDescription || ''}
                  onChange={e => setFormData({...formData, medicalTreatmentDescription: e.target.value})}
                  placeholder="Revirde uygulanan tedavi açıklamasını giriniz..."
                />
              </div>

              <div className="space-y-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-amber-900 dark:text-amber-400">3. Kök Neden Analizi</label>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setFormData({...formData, rootCauseAnalysis: generateRootCauseAnalysis()})}
                    className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  >
                    ✨ Otomatik Doldur
                  </Button>
                </div>
                <textarea
                  className="flex min-h-[200px] w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-amber-800 dark:bg-slate-900 dark:text-slate-50 transition-all duration-200 font-mono"
                  value={formData.rootCauseAnalysis || ''}
                  onChange={e => setFormData({...formData, rootCauseAnalysis: e.target.value})}
                  placeholder="Kök neden analizini giriniz..."
                />
              </div>
            </div>
          </div>
        );

      case 7:
        const company = companies.find(c => c.id === formData.companyId);
        const person = personnel.find(p => p.id === formData.personnelId);
        
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-display font-semibold mb-6 text-slate-900 dark:text-white">Gözden Geçirme</h2>
            
            <div className="bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl p-6 space-y-6 border border-slate-200/60 dark:border-slate-700/60">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Olay Başlığı & Türü</h3>
                  <p className="mt-1 text-base font-medium text-slate-900 dark:text-white">
                    {formData.title || '-'} <span className="text-sm font-normal text-slate-500">({formData.type || 'İş Kazası'})</span>
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Tarih & Lokasyon</h3>
                  <p className="mt-1 text-base text-slate-900 dark:text-white">
                    {formData.date ? new Date(formData.date).toLocaleDateString('tr-TR') : '-'} 
                    {formData.location ? ` • ${formData.location}` : ''}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">İlgili Firma</h3>
                  <p className="mt-1 text-base text-slate-900 dark:text-white">{company?.name || '-'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">İlgili Personel</h3>
                  <p className="mt-1 text-base text-slate-900 dark:text-white">
                    {person ? `${person.firstName} ${person.lastName}` : 'Belirtilmedi'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Durum</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      formData.status === 'Kapalı' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      formData.status === 'İnceleniyor' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {formData.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Olay Açıklaması</h3>
                <p className="mt-2 text-sm text-slate-900 dark:text-white whitespace-pre-wrap">
                  {formData.description || '-'}
                </p>
              </div>

              {attachedFiles.length > 0 && (
                <div className="pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Ekli Dosyalar</h3>
                  <div className="space-y-2">
                    {attachedFiles.map(file => (
                      <div key={file.id} className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                        {file.type.startsWith('image/') ? (
                          <ImageIcon className="h-4 w-4 text-indigo-500" />
                        ) : (
                          <FileText className="h-4 w-4 text-slate-500" />
                        )}
                        <span className="text-sm text-slate-700 dark:text-slate-300">{file.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {(!formData.title || !formData.date || !formData.companyId || !formData.description) && (
              <div className="flex items-center gap-2 p-4 text-sm text-amber-800 bg-amber-50 rounded-lg dark:bg-amber-900/30 dark:text-amber-400">
                <AlertCircle className="h-5 w-5" />
                <p>Lütfen tüm zorunlu alanları doldurduğunuzdan emin olun.</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <PageTransition>
      <div className="h-full flex flex-col">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">Yeni Olay Bildirimi</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-lg">Adım adım kaza veya ramak kala olayını sisteme kaydedin.</p>
        </div>

        <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden min-h-0">
          <div className="flex flex-col lg:flex-row min-h-[600px]">
            
            {/* Steps Sidebar */}
            <div className="w-full lg:w-72 bg-slate-50 dark:bg-slate-800/50 p-6 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-700">
              <nav className="space-y-2">
                {steps.map((step) => {
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id;
                  const isClickable = step.id <= currentStep || isCompleted;
                  
                  return (
                    <button
                      key={step.id}
                      onClick={() => isClickable && setCurrentStep(step.id)}
                      disabled={!isClickable}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 shadow-sm'
                          : isCompleted
                            ? 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                            : 'text-slate-400 dark:text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                          : isCompleted
                            ? 'bg-emerald-500 text-white dark:bg-emerald-500'
                            : 'bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                      </div>
                      <span className="text-sm">{step.title}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Progress Indicator */}
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">İlerleme</p>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${(currentStep / steps.length) * 100}%` }}
                    />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Adım {currentStep} / {steps.length}</p>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
              <div className="min-h-[400px]">
                {renderStepContent()}
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-200 dark:border-slate-700">
                <Button 
                  variant="secondary" 
                  onClick={currentStep === 1 ? () => navigate('/incidents') : handlePrev}
                >
                  {currentStep === 1 ? 'İptal' : (
                    <>
                      <ChevronLeft className="h-4 w-4 mr-2" /> Geri
                    </>
                  )}
                </Button>
                
                {currentStep < 7 ? (
                  <Button onClick={handleNext}>
                    İleri <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit} 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-md hover:shadow-emerald-500/20"
                    disabled={!formData.title || !formData.date || !formData.companyId || !formData.description || isSubmitting}
                    loading={isSubmitting}
                  >
                    Bildirimi Kaydet <CheckCircle2 className="h-4 w-4 ml-2" />
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
