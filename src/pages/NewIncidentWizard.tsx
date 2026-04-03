import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Incident, Severity, IncidentStatus, IncidentType } from '../types';
import { PageTransition } from '../components/layout/PageTransition';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { CheckCircle2, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const steps = [
  { id: 1, title: 'Temel Bilgiler' },
  { id: 2, title: 'İlgililer' },
  { id: 3, title: 'Olay Detayları' },
  { id: 4, title: 'Gözden Geçirme' }
];

export const NewIncidentWizard = () => {
  const navigate = useNavigate();
  const { companies, personnel, addIncident } = useStore();
  const [currentStep, setCurrentStep] = useState(1);
  
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
    rootCause: ''
  });

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
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
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-display font-semibold mb-6 text-slate-900 dark:text-white">Temel Bilgiler</h2>
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Olay Türü <span className="text-red-500">*</span></label>
                  <select 
                    required
                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-[#09090b]/50 dark:text-slate-50 transition-all duration-200"
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
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    placeholder="Örn: İskeleden Düşme, Elektrik Çarpması" 
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
                  <Input 
                    value={formData.location || ''} 
                    onChange={e => setFormData({...formData, location: e.target.value})} 
                    placeholder="Örn: A Blok 3. Kat, Şantiye Alanı" 
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-display font-semibold mb-6 text-slate-900 dark:text-white">İlgili Firma ve Personel</h2>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">İlgili Firma <span className="text-red-500">*</span></label>
                <select 
                  required
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-[#09090b]/50 dark:text-slate-50 transition-all duration-200"
                  value={formData.companyId || ''}
                  onChange={e => setFormData({...formData, companyId: e.target.value})}
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
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-[#09090b]/50 dark:text-slate-50 transition-all duration-200"
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
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-display font-semibold mb-6 text-slate-900 dark:text-white">Olay Detayları</h2>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Olay Açıklaması <span className="text-red-500">*</span></label>
                <textarea 
                  required
                  className="flex min-h-[120px] w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-[#09090b]/50 dark:text-slate-50 transition-all duration-200"
                  value={formData.description || ''}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Olayın nasıl gerçekleştiğini detaylı bir şekilde açıklayın..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Şiddet Derecesi</label>
                  <select 
                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-[#09090b]/50 dark:text-slate-50 transition-all duration-200"
                    value={formData.severity || 'Orta'}
                    onChange={e => setFormData({...formData, severity: e.target.value as Severity})}
                  >
                    <option value="Düşük">Düşük (Ramak Kala / İlk Yardım)</option>
                    <option value="Orta">Orta (Tıbbi Müdahale)</option>
                    <option value="Yüksek">Yüksek (İş Günü Kaybı)</option>
                    <option value="Kritik">Kritik (Uzuv Kaybı / Ölüm)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Başlangıç Durumu</label>
                  <select 
                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-[#09090b]/50 dark:text-slate-50 transition-all duration-200"
                    value={formData.status || 'Açık'}
                    onChange={e => setFormData({...formData, status: e.target.value as IncidentStatus})}
                  >
                    <option value="Açık">Açık</option>
                    <option value="İnceleniyor">İnceleniyor</option>
                    <option value="Kapalı">Kapalı</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Etkilenen Uzuv (Opsiyonel)</label>
                  <Input 
                    value={formData.affectedBodyPart || ''} 
                    onChange={e => setFormData({...formData, affectedBodyPart: e.target.value})} 
                    placeholder="Örn: Sağ el, Sol ayak bileği" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Kök Neden Tahmini (Opsiyonel)</label>
                  <Input 
                    value={formData.rootCause || ''} 
                    onChange={e => setFormData({...formData, rootCause: e.target.value})} 
                    placeholder="Örn: KKD Kullanılmaması, Dikkatsizlik" 
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 4:
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
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Şiddet & Durum</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      formData.severity === 'Kritik' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      formData.severity === 'Yüksek' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      formData.severity === 'Orta' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    }`}>
                      {formData.severity}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      formData.status === 'Kapalı' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      formData.status === 'İnceleniyor' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {formData.status}
                    </span>
                  </div>
                </div>
                {formData.affectedBodyPart && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Etkilenen Uzuv</h3>
                    <p className="mt-1 text-base text-slate-900 dark:text-white">{formData.affectedBodyPart}</p>
                  </div>
                )}
                {formData.rootCause && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Kök Neden Tahmini</h3>
                    <p className="mt-1 text-base text-slate-900 dark:text-white">{formData.rootCause}</p>
                  </div>
                )}
              </div>
              
              <div className="pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Olay Açıklaması</h3>
                <p className="mt-2 text-sm text-slate-900 dark:text-white whitespace-pre-wrap">
                  {formData.description || '-'}
                </p>
              </div>
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
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">Yeni Olay Bildirimi</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-lg">Adım adım kaza veya ramak kala olayını sisteme kaydedin.</p>
        </div>

        {/* Stepper */}
        <div className="bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-2xl rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-6 md:p-8">
          <div className="mb-10">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              ></div>
              
              {steps.map((step) => (
                <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
                  <div 
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                      currentStep > step.id 
                        ? 'bg-indigo-600 text-white dark:bg-indigo-500 shadow-md shadow-indigo-500/20' 
                        : currentStep === step.id 
                          ? 'bg-indigo-600 text-white dark:bg-indigo-500 ring-4 ring-indigo-100 dark:ring-indigo-900/30 shadow-md shadow-indigo-500/20'
                          : 'bg-white text-slate-400 border-2 border-slate-200 dark:bg-[#09090b] dark:border-slate-700'
                    }`}
                  >
                    {currentStep > step.id ? <CheckCircle2 className="h-6 w-6" /> : step.id}
                  </div>
                  <span className={`text-sm font-medium hidden sm:block ${
                    currentStep >= step.id ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                  }`}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="min-h-[300px]">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
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
            
            {currentStep < 4 ? (
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
    </PageTransition>
  );
};
