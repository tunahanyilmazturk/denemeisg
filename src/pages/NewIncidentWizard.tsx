import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Incident, Severity, IncidentStatus, IncidentType, InjuryType, SeverityLevel, BodyPart } from '../types';
import { PageTransition } from '../components/layout/PageTransition';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { CheckCircle2, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const steps = [
  { id: 1, title: 'Firma & Temel Bilgiler' },
  { id: 2, title: 'Olay Detayları' },
  { id: 3, title: 'Kazalı Bilgileri' },
  { id: 4, title: 'Revde Tedavi Bilgileri' },
  { id: 5, title: 'Önlem Önerileri' },
  { id: 6, title: 'Gözden Geçirme' }
];

export const NewIncidentWizard = () => {
  const navigate = useNavigate();
  const { companies, personnel, addIncident } = useStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isTitleEdited, setIsTitleEdited] = useState(false);
  
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
    measuresMethod: []
  });

  // Anlık otomatik başlık güncelleme
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
    if (currentStep < 6) setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.date || !formData.companyId || !formData.description) {
      toast.error('Lütfen zorunlu alanları doldurun.');
      return;
    }

    addIncident({
      ...formData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    } as Incident);
    
    toast.success('Olay bildirimi başarıyla oluşturuldu.');
    navigate('/incidents');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        const selectedCompany = companies.find(c => c.id === formData.companyId);
        const availableLocations = selectedCompany?.locations || [];
        
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-display font-semibold mb-6 text-slate-900 dark:text-white">Firma & Temel Bilgiler</h2>
            <div className="space-y-5">
              {/* Company Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">İlgili Firma <span className="text-red-500">*</span></label>
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
              
              {/* Personnel Selection */}
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
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Olay Türü <span className="text-red-500">*</span></label>
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
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Olay Başlığı <span className="text-red-500">*</span></label>
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
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tarih <span className="text-red-500">*</span></label>
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
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-display font-semibold mb-6 text-slate-900 dark:text-white">Olay Detayları</h2>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Olay Açıklaması <span className="text-red-500">*</span></label>
                <textarea 
                  required
                  className="flex min-h-[120px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 transition-all duration-200"
                  value={formData.description || ''}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Olayın nasıl gerçekleştiğini detaylı bir şekilde açıklayın..."
                />
              </div>
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
              </div>
            </div>
          </div>
        );
      case 3:
        // Kazalı Bilgileri - Injured person information
        const employmentTypes: ('Tam zamanlı' | 'Yarı zamanlı' | 'Ofis' | 'Geçici' | 'Taşeron' | 'Stajyer')[] = 
          ['Tam zamanlı', 'Yarı zamanlı', 'Ofis', 'Geçici', 'Taşeron', 'Stajyer'];

        const toggleEmploymentType = (type: 'Tam zamanlı' | 'Yarı zamanlı' | 'Ofis' | 'Geçici' | 'Taşeron' | 'Stajyer') => {
          const current = formData.injuredPersonEmploymentType || [];
          if (current.includes(type)) {
            setFormData({...formData, injuredPersonEmploymentType: current.filter(t => t !== type)});
          } else {
            setFormData({...formData, injuredPersonEmploymentType: [...current, type]});
          }
        };

        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-display font-semibold mb-6 text-slate-900 dark:text-white">Kazalı Bilgileri</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 -mt-4 mb-4">Yaralanan personelin bilgilerini giriniz.</p>
            
            <div className="space-y-5">
              {/* Row 1: Name, Process Description */}
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

              {/* Row 2: Department/Company, Birth Date, Employee ID */}
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

              {/* Employment Type Checkboxes */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Çalışma Tipi</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {employmentTypes.map((type) => (
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

              {/* Experience and Gender Row */}
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
        // Revde Tedavi Bilgileri - Medical treatment information step
        const injuryTypes: InjuryType[] = ['Kırık-Çıkık', 'Çatlak', 'Ezilme', 'Sıyrık', 'Kesik', 'Travma', 'Bayılma', 'Yanık', 'Çapak kaçması', 'Yumuşak doku zedelenmesi', 'Kas zedelenmesi/yırtılması', 'Batma/Delinme', 'Burkulma', 'Kas kasılması', 'Zehirlenme', 'Diğer'];
        const severityLevels: SeverityLevel[] = ['Önemsiz', '0-1 Gün', '1-2 Gün', '3 Gün ve Sonrası', 'Minör', 'Ciddi/Majör'];
        const bodyParts: BodyPart[] = ['Baş', 'Yüz', 'Göz', 'El-El Bileği', 'Parmak', 'Kol-Omuz', 'Boyun', 'Ayak-Ayak Bileği', 'Bacak', 'Bel', 'İç organlar', 'Göğüs-karın', 'Omurga', 'Diğer'];

        const toggleInjuryType = (type: InjuryType) => {
          const current = formData.injuryTypes || [];
          if (current.includes(type)) {
            setFormData({...formData, injuryTypes: current.filter(t => t !== type)});
          } else {
            setFormData({...formData, injuryTypes: [...current, type]});
          }
        };

        const toggleBodyPart = (part: BodyPart) => {
          const current = formData.affectedBodyParts || [];
          if (current.includes(part)) {
            setFormData({...formData, affectedBodyParts: current.filter(p => p !== part)});
          } else {
            setFormData({...formData, affectedBodyParts: [...current, part]});
          }
        };

        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-display font-semibold mb-6 text-slate-900 dark:text-white">Revde Tedavi Bilgileri</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 -mt-4 mb-4">Olaylar ve ramak kaldılar için bu kısım doldurulmayacaktır.</p>
            
            <div className="space-y-6">
              {/* Injury Types */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Yaralanma Türü</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {injuryTypes.map((type) => (
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

              {/* Body Parts */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Yaralanan Organ</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {bodyParts.map((part) => (
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

              {/* Severity Level */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ciddiyet / İş Günü Kaybı</label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {severityLevels.map((level) => (
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

              {/* Treatment Info */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tedavi / Tanı</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 transition-all duration-200"
                  value={formData.treatmentInfo || ''}
                  onChange={e => setFormData({...formData, treatmentInfo: e.target.value})}
                  placeholder="Uygulanan tedavi ve tanı bilgileri..."
                />
              </div>

              {/* Days off and work restrictions */}
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

              {/* Hospital Referral */}
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
      case 4:
        // Preventive measures step
        const [newPersonnelMeasure, setNewPersonnelMeasure] = useState('');
        const [newEquipmentMeasure, setNewEquipmentMeasure] = useState('');
        const [newEnvironmentMeasure, setNewEnvironmentMeasure] = useState('');
        const [newMethodMeasure, setNewMethodMeasure] = useState('');

        const addMeasure = (type: 'personnel' | 'equipment' | 'environment' | 'method', value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
          if (!value.trim()) return;
          
          const current = type === 'personnel' ? formData.measuresPersonnel || [] :
                         type === 'equipment' ? formData.measuresEquipment || [] :
                         type === 'environment' ? formData.measuresEnvironment || [] :
                         formData.measuresMethod || [];
          
          if (!current.includes(value.trim())) {
            const newMeasures = [...current, value.trim()];
            if (type === 'personnel') setFormData({...formData, measuresPersonnel: newMeasures});
            else if (type === 'equipment') setFormData({...formData, measuresEquipment: newMeasures});
            else if (type === 'environment') setFormData({...formData, measuresEnvironment: newMeasures});
            else setFormData({...formData, measuresMethod: newMeasures});
          }
          setter('');
        };

        const removeMeasure = (type: 'personnel' | 'equipment' | 'environment' | 'method', value: string) => {
          const current = type === 'personnel' ? formData.measuresPersonnel || [] :
                         type === 'equipment' ? formData.measuresEquipment || [] :
                         type === 'environment' ? formData.measuresEnvironment || [] :
                         formData.measuresMethod || [];
          
          const newMeasures = current.filter(m => m !== value);
          if (type === 'personnel') setFormData({...formData, measuresPersonnel: newMeasures});
          else if (type === 'equipment') setFormData({...formData, measuresEquipment: newMeasures});
          else if (type === 'environment') setFormData({...formData, measuresEnvironment: newMeasures});
          else setFormData({...formData, measuresMethod: newMeasures});
        };

        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-display font-semibold mb-6 text-slate-900 dark:text-white">Önlem Önerileri</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 -mt-4 mb-4">Bu tür olayları/kazaları önlemek için alınacak önlem önerileri:</p>
            
            <div className="space-y-6">
              {/* 1) İnsanda */}
              <div className="space-y-3 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-900 dark:text-blue-400">1) İnsanda</h3>
                <div className="flex gap-2">
                  <Input
                    value={newPersonnelMeasure}
                    onChange={e => setNewPersonnelMeasure(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addMeasure('personnel', newPersonnelMeasure, setNewPersonnelMeasure))}
                    placeholder="Örn: Eğitim verilmesi, Farkındalık artırılması..."
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={() => addMeasure('personnel', newPersonnelMeasure, setNewPersonnelMeasure)}
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

              {/* 2) Makina / Teçhizatta */}
              <div className="space-y-3 p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800">
                <h3 className="font-semibold text-emerald-900 dark:text-emerald-400">2) Makina / Teçhizatta</h3>
                <div className="flex gap-2">
                  <Input
                    value={newEquipmentMeasure}
                    onChange={e => setNewEquipmentMeasure(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addMeasure('equipment', newEquipmentMeasure, setNewEquipmentMeasure))}
                    placeholder="Örn: KKD temini, Güvenlik ekipmanı kurulumu..."
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={() => addMeasure('equipment', newEquipmentMeasure, setNewEquipmentMeasure)}
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

              {/* 3) Ortamda */}
              <div className="space-y-3 p-4 rounded-xl bg-purple-50/50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800">
                <h3 className="font-semibold text-purple-900 dark:text-purple-400">3) Ortamda</h3>
                <div className="flex gap-2">
                  <Input
                    value={newEnvironmentMeasure}
                    onChange={e => setNewEnvironmentMeasure(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addMeasure('environment', newEnvironmentMeasure, setNewEnvironmentMeasure))}
                    placeholder="Örn: Aydınlatma iyileştirilmesi, Yer düzeni..."
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={() => addMeasure('environment', newEnvironmentMeasure, setNewEnvironmentMeasure)}
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

              {/* 4) Yöntemde */}
              <div className="space-y-3 p-4 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                <h3 className="font-semibold text-amber-900 dark:text-amber-400">4) Yöntemde</h3>
                <div className="flex gap-2">
                  <Input
                    value={newMethodMeasure}
                    onChange={e => setNewMethodMeasure(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addMeasure('method', newMethodMeasure, setNewMethodMeasure))}
                    placeholder="Örn: Prosedür güncellemesi, Çalışma talimatı..."
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={() => addMeasure('method', newMethodMeasure, setNewMethodMeasure)}
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

              {/* Kazalı Bilgileri */}
              {(formData.injuredPersonName || formData.injuredPersonDepartment || formData.injuredPersonBirthDate) && (
                <div className="pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Kazalı Bilgileri</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                    {formData.injuredPersonName && (
                      <div>
                        <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400">Adı, Soyadı</h4>
                        <p className="mt-1 text-sm text-slate-900 dark:text-white">{formData.injuredPersonName}</p>
                      </div>
                    )}
                    {formData.injuredPersonDepartment && (
                      <div>
                        <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400">Bölüm / Firma</h4>
                        <p className="mt-1 text-sm text-slate-900 dark:text-white">{formData.injuredPersonDepartment}</p>
                      </div>
                    )}
                    {formData.injuredPersonBirthDate && (
                      <div>
                        <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400">Doğum Tarihi</h4>
                        <p className="mt-1 text-sm text-slate-900 dark:text-white">
                          {new Date(formData.injuredPersonBirthDate).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    )}
                    {formData.injuredPersonEmployeeId && (
                      <div>
                        <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400">Sicil No</h4>
                        <p className="mt-1 text-sm text-slate-900 dark:text-white">{formData.injuredPersonEmployeeId}</p>
                      </div>
                    )}
                    {formData.injuredPersonProcessDesc && (
                      <div>
                        <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400">Proses Tanımı</h4>
                        <p className="mt-1 text-sm text-slate-900 dark:text-white">{formData.injuredPersonProcessDesc}</p>
                      </div>
                    )}
                    {formData.injuredPersonEmploymentType && formData.injuredPersonEmploymentType.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400">Çalışma Tipi</h4>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {formData.injuredPersonEmploymentType.map((type, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {formData.injuredPersonTotalExperience && (
                      <div>
                        <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400">Toplam Tecrübe</h4>
                        <p className="mt-1 text-sm text-slate-900 dark:text-white">{formData.injuredPersonTotalExperience}</p>
                      </div>
                    )}
                    {formData.injuredPersonTaskExperience && (
                      <div>
                        <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400">Bu Görevdeki Tecrübe</h4>
                        <p className="mt-1 text-sm text-slate-900 dark:text-white">{formData.injuredPersonTaskExperience}</p>
                      </div>
                    )}
                    {formData.injuredPersonGender && (
                      <div>
                        <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400">Cinsiyet</h4>
                        <p className="mt-1 text-sm text-slate-900 dark:text-white">{formData.injuredPersonGender}</p>
                      </div>
                    )}
                    {formData.injuredPersonShift && (
                      <div>
                        <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400">Vardiya</h4>
                        <p className="mt-1 text-sm text-slate-900 dark:text-white">{formData.injuredPersonShift}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Medical Treatment Info */}
              {(formData.injuryTypes?.length || formData.affectedBodyParts?.length || formData.treatmentInfo || formData.severityLevel || formData.hospitalReferral) && (
                <div className="pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Revde Tedavi Bilgileri</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                    {formData.injuryTypes && formData.injuryTypes.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400">Yaralanma Türü</h4>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {formData.injuryTypes.map((type, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {formData.affectedBodyParts && formData.affectedBodyParts.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400">Yaralanan Organ</h4>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {formData.affectedBodyParts.map((part, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                              {part}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {formData.severityLevel && (
                      <div>
                        <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400">Ciddiyet</h4>
                        <p className="mt-1 text-sm text-slate-900 dark:text-white">{formData.severityLevel}</p>
                      </div>
                    )}
                    {(formData.daysOff !== undefined || formData.restrictedWorkDays !== undefined) && (
                      <div>
                        <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400">Çalışma Durumu</h4>
                        <p className="mt-1 text-sm text-slate-900 dark:text-white">
                          {formData.daysOff ? `${formData.daysOff} gün çalışılamayan` : ''}
                          {formData.daysOff && formData.restrictedWorkDays ? ', ' : ''}
                          {formData.restrictedWorkDays ? `${formData.restrictedWorkDays} gün kısıtlı çalışma` : ''}
                        </p>
                      </div>
                    )}
                    {formData.returnToWorkDate && (
                      <div>
                        <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400">İşbaşı Tarihi</h4>
                        <p className="mt-1 text-sm text-slate-900 dark:text-white">
                          {new Date(formData.returnToWorkDate).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    )}
                  </div>
                  {formData.treatmentInfo && (
                    <div className="mt-4">
                      <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400">Tedavi / Tanı</h4>
                      <p className="mt-1 text-sm text-slate-900 dark:text-white">{formData.treatmentInfo}</p>
                    </div>
                  )}
                  {formData.hospitalReferral && (
                    <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                      <p className="text-sm text-amber-800 dark:text-amber-400 font-medium">Hastaneye sevk edildi</p>
                    </div>
                  )}
                </div>
              )}

              {/* Preventive Measures Info */}
              {(formData.measuresPersonnel?.length || formData.measuresEquipment?.length || formData.measuresEnvironment?.length || formData.measuresMethod?.length) && (
                <div className="pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Önlem Önerileri</h3>
                  <div className="space-y-3">
                    {formData.measuresPersonnel && formData.measuresPersonnel.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-blue-600 dark:text-blue-400">1) İnsanda</h4>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {formData.measuresPersonnel.map((measure, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              {measure}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {formData.measuresEquipment && formData.measuresEquipment.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-emerald-600 dark:text-emerald-400">2) Makina / Teçhizatta</h4>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {formData.measuresEquipment.map((measure, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                              {measure}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {formData.measuresEnvironment && formData.measuresEnvironment.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-purple-600 dark:text-purple-400">3) Ortamda</h4>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {formData.measuresEnvironment.map((measure, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                              {measure}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {formData.measuresMethod && formData.measuresMethod.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-amber-600 dark:text-amber-400">4) Yöntemde</h4>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {formData.measuresMethod.map((measure, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              {measure}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
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

        {/* Sidebar Layout */}
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
            <div className="flex-1 p-6 lg:p-8">
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
                
                {currentStep < 6 ? (
                  <Button onClick={handleNext}>
                    İleri <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit} 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-md hover:shadow-emerald-500/20"
                    disabled={!formData.title || !formData.date || !formData.companyId || !formData.description}
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
