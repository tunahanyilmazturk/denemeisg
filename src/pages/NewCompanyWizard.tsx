import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PageTransition } from '../components/layout/PageTransition';
import { Company } from '../types';
import toast from 'react-hot-toast';
import {
  Plus, ChevronRight, ChevronLeft, Building2, Phone, MapPin, User,
  Mail, Check, X, Info, ClipboardList
} from 'lucide-react';


const selectClass =
  'flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 transition-all';

const inputClass =
  'flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 transition-all';

// ─── COMPANY ICON ─────────────────────────────────────────────────────────────
const CompanyIcon = ({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) => {
  const colors = [
    'from-blue-500 to-cyan-600',
    'from-indigo-500 to-purple-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-pink-600',
    'from-rose-500 to-red-600',
    'from-amber-500 to-orange-600',
    'from-violet-500 to-purple-600',
  ];
  const colorIndex = (name.charCodeAt(0) || 0) % colors.length;
  const sizeClass = size === 'sm' ? 'w-10 h-10' : size === 'lg' ? 'w-12 h-12' : 'w-12 h-12';
  const iconSize = size === 'sm' ? 'h-5 w-5' : 'h-6 w-6';

  return (
    <div className={`${sizeClass} rounded-2xl bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center text-white font-bold shrink-0 shadow-lg ring-4 ring-white/20`}>
      <Building2 className={iconSize} />
    </div>
  );
};

// ─── STEP ICONS ─────────────────────────────────────────────────────────────────
const STEP_ICONS = [Building2, Phone, MapPin];
const STEP_COLORS = [
  'from-indigo-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
];

const StepItem = ({ num, label, active, completed }: { num: number; label: string; active: boolean; completed: boolean }) => {
  const Icon = STEP_ICONS[num - 1] || Building2;
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
export const NewCompanyWizard = () => {
  const navigate = useNavigate();
  const { addCompany, sectors, locationDefinitions } = useStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Company>>({
    locations: [],
  });
  const [newLocation, setNewLocation] = useState('');
  const [sectorLocationsAutoAdded, setSectorLocationsAutoAdded] = useState(false);

  const totalSteps = 3;

  const steps = [
    { num: 1, label: 'Temel Bilgiler' },
    { num: 2, label: 'İletişim & Adres' },
    { num: 3, label: 'Lokasyonlar' },
  ];

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.name?.trim()) {
        toast.error('Firma adı zorunludur.');
        return;
      }
      if (!formData.sector) {
        toast.error('Sektör seçilmelidir.');
        return;
      }
      if (!formData.contactPerson?.trim()) {
        toast.error('Yetkili kişi adı zorunludur.');
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.phone?.trim()) {
        toast.error('Telefon numarası zorunludur.');
        return;
      }
      if (!formData.email?.trim()) {
        toast.error('E-posta adresi zorunludur.');
        return;
      }
      if (!formData.address?.trim()) {
        toast.error('Adres zorunludur.');
        return;
      }
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (!formData.name?.trim()) {
      toast.error('Firma adı zorunludur.');
      return;
    }
    if (!formData.sector) {
      toast.error('Sektör seçilmelidir.');
      return;
    }
    if (!formData.contactPerson?.trim()) {
      toast.error('Yetkili kişi adı zorunludur.');
      return;
    }
    if (!formData.phone?.trim() || !formData.email?.trim() || !formData.address?.trim()) {
      toast.error('İletişim bilgileri zorunludur.');
      return;
    }

    const newCompany: Company = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name!,
      sector: formData.sector!,
      contactPerson: formData.contactPerson!,
      phone: formData.phone!,
      email: formData.email!,
      address: formData.address!,
      locations: formData.locations,
      createdAt: new Date().toISOString(),
    };

    addCompany(newCompany);
    toast.success('Firma başarıyla eklendi!');
    navigate('/companies');
  };

  const addLocation = () => {
    if (!newLocation.trim()) return;
    const locations = formData.locations || [];
    if (!locations.includes(newLocation.trim())) {
      setFormData(p => ({ ...p, locations: [...locations, newLocation.trim()] }));
      setNewLocation('');
    } else {
      toast.error('Bu lokasyon zaten eklenmiş.');
    }
  };

  const removeLocation = (idx: number) => {
    setFormData(p => ({ ...p, locations: (p.locations || []).filter((_, i) => i !== idx) }));
  };

  // ─── RENDER STEP CONTENT ──────────────────────────────────────────────────────
  const renderStepContent = () => {
    switch (currentStep) {
      // STEP 1: Temel Bilgiler
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
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Temel Bilgiler</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Firma adı, sektör ve yetkili kişi bilgileri</p>
                </div>
              </div>
            </div>

            {/* Firma Bilgileri */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5" />
                Firma Bilgileri
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Firma Adı <span className="text-red-500">*</span>
                    </label>
                    <Input
                      className={inputClass}
                      placeholder="Örn: ABC İnşaat Ltd. Şti."
                      value={formData.name || ''}
                      onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Sektör <span className="text-red-500">*</span>
                    </label>
                    <select
                      className={selectClass}
                      value={formData.sector || ''}
                      onChange={e => {
                        const selectedSectorName = e.target.value;
                        setFormData(p => ({ ...p, sector: selectedSectorName }));
                        
                        // Auto-populate locations when sector changes
                        if (selectedSectorName && !sectorLocationsAutoAdded) {
                          const selectedSector = sectors.find(s => s.name === selectedSectorName);
                          if (selectedSector) {
                            // Get sector-specific and global locations
                            const sectorLocs = locationDefinitions
                              .filter(loc => loc.sectorId === selectedSector.id || !loc.sectorId)
                              .map(loc => loc.name);
                            
                            setFormData(p => ({
                              ...p,
                              sector: selectedSectorName,
                              locations: sectorLocs
                            }));
                            setSectorLocationsAutoAdded(true);
                            toast.success(`${sectorLocs.length} lokasyon otomatik eklendi. İstediğiniz gibi düzenleyebilirsiniz.`);
                          }
                        } else if (!selectedSectorName) {
                          // Reset if sector cleared
                          setSectorLocationsAutoAdded(false);
                        }
                      }}
                    >
                      <option value="">Sektör Seçiniz</option>
                      {sectors.map(sector => (
                        <option key={sector.id} value={sector.name}>{sector.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Yetkili Kişi Bilgileri */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <User className="h-3.5 w-3.5" />
                Yetkili Kişi
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      Yetkili Kişi Adı <span className="text-red-500">*</span>
                    </label>
                    <Input
                      className={inputClass}
                      placeholder="Örn: Mehmet Yılmaz"
                      value={formData.contactPerson || ''}
                      onChange={e => setFormData(p => ({ ...p, contactPerson: e.target.value }))}
                    />
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      <p className="text-blue-700 dark:text-blue-300 text-xs">Firma ile iletişim kurulacak birincil yetkili kişiyi belirtiniz.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      // STEP 2: İletişim & Adres
      case 2:
        return (
          <div className="space-y-5">
            {/* Header */}
            <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                  <Phone className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">İletişim & Adres</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Telefon, e-posta ve adres bilgileri</p>
                </div>
              </div>
            </div>

            {/* İletişim */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" />
                İletişim Bilgileri
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      Telefon <span className="text-red-500">*</span>
                    </label>
                    <Input
                      className={inputClass}
                      placeholder="0555 xxx xx xx"
                      value={formData.phone || ''}
                      onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      E-posta <span className="text-red-500">*</span>
                    </label>
                    <Input
                      className={inputClass}
                      type="email"
                      placeholder="ornek@firma.com"
                      value={formData.email || ''}
                      onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Adres */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" />
                Adres Bilgileri
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    Firma Adresi <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    className="flex w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 resize-none transition-all"
                    placeholder="Firma merkez adresi..."
                    value={formData.address || ''}
                    onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      // STEP 3: Lokasyonlar
      case 3:
        return (
          <div className="space-y-5">
            {/* Header */}
            <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <MapPin className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Lokasyonlar</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Firma şubeleri ve iş yerlerini ekleyiniz</p>
                </div>
              </div>
            </div>

            {/* Lokasyon Ekleme */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" />
                Lokasyon Ekle
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex gap-3">
                  <Input
                    className={inputClass}
                    placeholder="Örn: A Şubesi, İstanbul Şantiyesi, Ankara Ofis..."
                    value={newLocation}
                    onChange={e => setNewLocation(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addLocation();
                      }
                    }}
                  />
                  <Button type="button" onClick={addLocation} className="shrink-0 px-5 gap-2">
                    <Plus className="h-4 w-4" />
                    Ekle
                  </Button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" />
                  Enter tuşuna basarak veya Ekle butonuna tıklayarak lokasyon ekleyebilirsiniz
                </p>
              </div>
            </div>

            {/* Lokasyon Listesi */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <ClipboardList className="h-3.5 w-3.5" />
                Ekli Lokasyonlar ({(formData.locations || []).length})
              </h3>
              {(formData.locations || []).length === 0 ? (
                <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                  <MapPin className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-0.5">Henüz Lokasyon Eklenmedi</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">Lokasyon zorunlu değildir, sonradan da ekleyebilirsiniz</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {(formData.locations || []).map((location, idx) => (
                    <div key={idx} className="group flex items-center justify-between bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/50 rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-sm">
                          <MapPin className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">{location}</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">#{idx + 1}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLocation(idx)}
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

            {/* Sektöre göre otomatik ekleme bilgisi */}
            {sectorLocationsAutoAdded && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-emerald-800 dark:text-emerald-200">
                    <p className="font-semibold mb-1">Sektör Lokasyonları Eklendi</p>
                    <p className="text-emerald-700 dark:text-emerald-300">Seçtiğiniz sektöre ait lokasyonlar otomatik olarak eklendi. İsterseniz listedeki lokasyonları silebilir veya yeni lokasyonlar ekleyebilirsiniz.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Bilgi notu */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Bilgi</p>
                  <p className="text-blue-700 dark:text-blue-300">Sektör seçtiğinizde ilgili lokasyonlar otomatik eklenir. Bunlara ek olarak manuel lokasyon da ekleyebilirsiniz. Lokasyonları daha sonra düzenlemek de mümkündür.</p>
                </div>
              </div>
            </div>
          </div>
        );

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
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">Yeni Firma</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Sisteme yeni firma ekleyin</p>
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

            {/* Company Preview */}
            <div className="p-4 pt-3 border-t border-slate-200 dark:border-slate-700 mt-auto">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-widest">Firma Önizleme</p>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-4">
                  <CompanyIcon name={formData.name || '?'} size="md" />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {formData.name || '—'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {formData.sector || 'Sektör seçilmedi'}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {formData.contactPerson && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                          <User className="h-3 w-3" />
                          {formData.contactPerson}
                        </span>
                      )}
                      {(formData.locations || []).length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          <MapPin className="h-3 w-3" />
                          {(formData.locations || []).length} lokasyon
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
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">Yeni Firma</h1>
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
                const Icon = STEP_ICONS[step.num - 1] || Building2;
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
          <div className="shrink-0 border-t border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-4 lg:px-6 py-3">
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
                  onClick={() => navigate('/companies')}
                >
                  İptal
                </Button>

                {currentStep < totalSteps ? (
                  <Button onClick={handleNext} className="gap-2 px-6">
                    İleri <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button variant="success" onClick={handleSubmit} className="gap-2 px-6">
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
