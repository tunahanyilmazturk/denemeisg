import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PageTransition } from '../components/layout/PageTransition';
import { Certificate, CertificateType, CertificateStatus } from '../types';
import toast from 'react-hot-toast';
import {
  Plus, ChevronRight, ChevronLeft, Award, ClipboardList, Users,
  Check, X, Info, Search, Calendar, FileText, Building2, Printer,
  Eye, Download, Clock, Zap, PenLine
} from 'lucide-react';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const inputClass =
  'flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 transition-all';

const selectClass =
  'flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 transition-all';

const CERTIFICATE_TYPES: CertificateType[] = [
  'İSG Eğitimi',
  'Yangın Güvenliği',
  'İlk Yardım',
  'Yüksekte Çalışma',
  'Forklift Operatörlüğü',
  'Elektrik Güvenliği',
  'Kimyasal Güvenlik',
  'Acil Durum Eğitimi',
  'Genel Güvenlik',
  'Diğer',
];

// Title templates auto-generated based on type + date
const TITLE_TEMPLATES: Record<CertificateType, string> = {
  'İSG Eğitimi': 'Temel İSG Eğitimi Katılım Belgesi',
  'Yangın Güvenliği': 'Yangın Güvenliği Eğitimi Sertifikası',
  'İlk Yardım': 'İlk Yardım Eğitimi Sertifikası',
  'Yüksekte Çalışma': 'Yüksekte Çalışma Eğitimi Sertifikası',
  'Forklift Operatörlüğü': 'Forklift Operatörlüğü Eğitimi Sertifikası',
  'Elektrik Güvenliği': 'Elektrik Güvenliği Eğitimi Sertifikası',
  'Kimyasal Güvenlik': 'Kimyasal Güvenlik Eğitimi Sertifikası',
  'Acil Durum Eğitimi': 'Acil Durum Eğitimi Katılım Belgesi',
  'Genel Güvenlik': 'Genel Güvenlik Eğitimi Sertifikası',
  'Diğer': 'Eğitim Katılım Belgesi',
};

// Quick duration presets (in months)
const DURATION_PRESETS = [
  { label: '3 Ay', months: 3 },
  { label: '6 Ay', months: 6 },
  { label: '9 Ay', months: 9 },
  { label: '1 Yıl', months: 12 },
  { label: '2 Yıl', months: 24 },
  { label: '3 Yıl', months: 36 },
  { label: 'Süresiz', months: 0 },
];

// Training topic presets for İlgili Eğitim section
const TRAINING_TOPIC_PRESETS: { label: string; type: CertificateType }[] = [
  { label: 'Yüksekte Çalışma', type: 'Yüksekte Çalışma' },
  { label: 'Temel İSG', type: 'İSG Eğitimi' },
  { label: 'Yangın Güvenliği', type: 'Yangın Güvenliği' },
  { label: 'İlk Yardım', type: 'İlk Yardım' },
  { label: 'Forklift', type: 'Forklift Operatörlüğü' },
  { label: 'Elektrik', type: 'Elektrik Güvenliği' },
  { label: 'Kimyasal', type: 'Kimyasal Güvenlik' },
  { label: 'Acil Durum', type: 'Acil Durum Eğitimi' },
];

const getToday = () => new Date().toISOString().split('T')[0];

const addMonthsToDate = (dateStr: string, months: number): string => {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
};

const generateAutoTitle = (type: CertificateType, dateStr?: string) => {
  const template = TITLE_TEMPLATES[type] || 'Eğitim Katılım Belgesi';
  if (dateStr) {
    const d = new Date(dateStr);
    const monthYear = d.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' });
    return `${template} - ${monthYear}`;
  }
  return template;
};

// ─── STEP ICONS ─────────────────────────────────────────────────────────────────
const STEP_ICONS = [Award, ClipboardList, Users, Eye];
const STEP_COLORS = [
  'from-indigo-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
];

const StepItem = ({ num, label, active, completed }: { num: number; label: string; active: boolean; completed: boolean }) => {
  const Icon = STEP_ICONS[num - 1] || Award;
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

// ─── CERTIFICATE PREVIEW (LETTERHEAD) ─────────────────────────────────────────
const CertificatePreview = ({ formData, person, company }: {
  formData: Partial<Certificate>;
  person?: { firstName: string; lastName: string; role: string; tcNo: string } | null;
  company?: { name: string } | null;
}) => {
  return (
    <div className="bg-white rounded-xl border-2 border-indigo-200 shadow-xl overflow-hidden print:shadow-none print:border-0" id="certificate-preview">
      {/* Top Border */}
      <div className="h-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600" />
      
      {/* Header / Letterhead */}
      <div className="px-8 pt-6 pb-4 border-b-2 border-indigo-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
              <Award className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {formData.companyName || company?.name || 'Firma Adı'}
              </h1>
              <p className="text-xs text-slate-500">İş Sağlığı ve Güvenliği</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Sertifika No</p>
            <p className="text-sm font-bold text-indigo-700 font-mono">{formData.certificateNo || 'CERT-XXXX'}</p>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="px-8 py-6 text-center bg-gradient-to-b from-indigo-50/50 to-white">
        <div className="inline-block px-6 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold mb-3">
          {formData.type || 'Sertifika Tipi'}
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">
          {formData.title || 'Sertifika Başlığı'}
        </h2>
        <p className="text-sm text-slate-500">Eğitim Katılım Belgesi</p>
      </div>

      {/* Body */}
      <div className="px-8 py-6">
        <div className="text-center mb-6">
          <p className="text-sm text-slate-600">Bu belge ile aşağıda bilgileri yazılı olan personelin</p>
          <p className="text-sm text-slate-600">ilgili eğitime katılarak başarılı olduğunu onaylarız.</p>
        </div>

        {/* Personnel Info */}
        <div className="bg-slate-50 rounded-xl p-5 mb-6 border border-slate-200">
          <div className="text-center mb-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {person ? `${person.firstName[0]}${person.lastName[0]}` : '??'}
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-3">
              {person ? `${person.firstName} ${person.lastName}` : 'Personel Seçilmedi'}
            </h3>
            {person && (
              <p className="text-sm text-slate-500">{person.role}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-0.5">Eğitim Tarihi</p>
              <p className="font-semibold text-slate-700">
                {formData.issueDate ? new Date(formData.issueDate).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-0.5">Geçerlilik</p>
              <p className="font-semibold text-slate-700">
                {formData.expiryDate ? new Date(formData.expiryDate).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Süresiz'}
              </p>
            </div>
            {formData.duration && (
              <div className="text-center">
                <p className="text-xs text-slate-400 mb-0.5">Süre</p>
                <p className="font-semibold text-slate-700">{formData.duration} Saat</p>
              </div>
            )}
            {formData.score !== undefined && formData.score !== null && (
              <div className="text-center">
                <p className="text-xs text-slate-400 mb-0.5">Puan</p>
                <p className="font-semibold text-slate-700">{formData.score}/100</p>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {formData.description && (
          <div className="mb-6">
            <p className="text-sm text-slate-600 text-center italic">{formData.description}</p>
          </div>
        )}

        {/* Signature Area */}
        <div className="flex justify-between items-end pt-6 border-t border-slate-200 mt-6">
          <div className="text-center flex-1">
            <div className="h-16 flex items-end justify-center">
              {formData.signatureImage ? (
                <img src={formData.signatureImage} alt="İmza" className="h-12 object-contain" />
              ) : (
                <div className="w-32 border-b-2 border-slate-400" />
              )}
            </div>
            <p className="text-sm font-bold text-slate-900 mt-2">{formData.signatureName || formData.issuer || 'İmza Sahibi'}</p>
            <p className="text-xs text-slate-500">{formData.signatureTitle || 'İSG Uzmanı'}</p>
          </div>
          <div className="text-center flex-1">
            <div className="w-20 h-20 mx-auto rounded-full border-4 border-indigo-200 flex items-center justify-center bg-indigo-50">
              <Award className="h-8 w-8 text-indigo-600" />
            </div>
            <p className="text-xs text-slate-500 mt-2">Mühür</p>
          </div>
          <div className="text-center flex-1">
            <div className="h-16 flex items-end justify-center">
              <div className="w-32 border-b-2 border-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-900 mt-2">Firma Yetkilisi</p>
            <p className="text-xs text-slate-500">Onay</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-8 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400">
        <span>Düzenleme: {formData.issueDate ? new Date(formData.issueDate).toLocaleDateString('tr-TR') : '—'}</span>
        <span>{formData.companyName || company?.name || ''}</span>
        <span>No: {formData.certificateNo || '—'}</span>
      </div>

      {/* Bottom Border */}
      <div className="h-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600" />
    </div>
  );
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export const NewCertificateWizard = () => {
  const navigate = useNavigate();
  const { addCertificate, personnel, companies, trainings } = useStore();
  const { user } = useAuthStore();
  const printRef = useRef<HTMLDivElement>(null);

  const today = getToday();
  const defaultExpiry = addMonthsToDate(today, 12);

  // Find personnel matching logged-in user
  const loggedInPersonnel = useMemo(() => {
    if (!user) return null;
    return personnel.find(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase() === `${user.firstName} ${user.lastName}`.toLowerCase()
    ) || null;
  }, [user, personnel]);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Certificate>>({
    status: 'Aktif',
    certificateNo: `CERT-${Date.now().toString(36).toUpperCase()}`,
    issueDate: today,
    expiryDate: defaultExpiry,
    issuer: user ? `${user.firstName} ${user.lastName}` : '',
    personnelId: loggedInPersonnel?.id || undefined,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [manualCompanyName, setManualCompanyName] = useState('');
  const [useManualCompany, setUseManualCompany] = useState(false);
  const [selectedDurationPreset, setSelectedDurationPreset] = useState<number | null>(12);
  const [autoTitleEnabled, setAutoTitleEnabled] = useState(true);

  // Auto-generate title when type or date changes
  useEffect(() => {
    if (autoTitleEnabled && formData.type) {
      const newTitle = generateAutoTitle(formData.type, formData.issueDate);
      setFormData(prev => ({ ...prev, title: newTitle }));
    }
  }, [formData.type, formData.issueDate, autoTitleEnabled]);

  const totalSteps = 4;

  const steps = [
    { num: 1, label: 'Sertifika Bilgileri' },
    { num: 2, label: 'Personel & Firma' },
    { num: 3, label: 'Antetli Kağıt' },
    { num: 4, label: 'Önizleme & Kaydet' },
  ];

  const selectedPerson = useMemo(() => 
    personnel.find(p => p.id === formData.personnelId),
    [personnel, formData.personnelId]
  );

  const selectedCompany = useMemo(() =>
    companies.find(c => c.id === formData.companyId),
    [companies, formData.companyId]
  );

  const filteredPersonnel = useMemo(() => {
    if (!searchTerm) return personnel;
    const term = searchTerm.toLowerCase();
    return personnel.filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(term) ||
      p.role.toLowerCase().includes(term)
    );
  }, [personnel, searchTerm]);

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.title?.trim()) {
        toast.error('Sertifika başlığı zorunludur.');
        return;
      }
      if (!formData.type) {
        toast.error('Sertifika tipi seçilmelidir.');
        return;
      }
      if (!formData.issueDate) {
        toast.error('Düzenleme tarihi zorunludur.');
        return;
      }
      if (!formData.issuer?.trim()) {
        toast.error('Düzenleyen kişi zorunludur.');
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.personnelId) {
        toast.error('Personel seçilmelidir.');
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
    if (!formData.title?.trim() || !formData.type || !formData.issueDate || !formData.issuer?.trim() || !formData.personnelId) {
      toast.error('Lütfen zorunlu alanları doldurun.');
      return;
    }

    const newCertificate: Certificate = {
      id: Math.random().toString(36).substr(2, 9),
      certificateNo: formData.certificateNo || `CERT-${Date.now().toString(36).toUpperCase()}`,
      personnelId: formData.personnelId!,
      trainingId: formData.trainingId,
      type: formData.type!,
      title: formData.title!,
      description: formData.description,
      issueDate: formData.issueDate!,
      expiryDate: formData.expiryDate,
      status: formData.status || 'Aktif',
      issuer: formData.issuer!,
      companyId: formData.companyId,
      companyName: formData.companyName || selectedCompany?.name,
      signatureName: formData.signatureName,
      signatureTitle: formData.signatureTitle,
      signatureImage: formData.signatureImage,
      duration: formData.duration,
      score: formData.score,
      notes: formData.notes,
      createdAt: new Date().toISOString(),
    };

    addCertificate(newCertificate);
    toast.success('Sertifika başarıyla oluşturuldu!');
    navigate('/certificates');
  };

  const handlePrint = () => {
    const printContent = document.getElementById('certificate-preview');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Yazdırma penceresi açılamadı. Pop-up engelleyiciyi kontrol edin.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sertifika - ${formData.title || 'Belge'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
          @page { size: A4; margin: 20mm; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
        <script src="https://cdn.tailwindcss.com"><\/script>
      </head>
      <body class="p-0 m-0">
        <div class="max-w-3xl mx-auto">
          ${printContent.outerHTML}
        </div>
        <script>
          setTimeout(function() { window.print(); }, 500);
        <\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      toast.error('İmza dosyası 500KB\'dan küçük olmalıdır.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, signatureImage: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // ─── RENDER STEP CONTENT ──────────────────────────────────────────────────────
  const renderStepContent = () => {
    switch (currentStep) {
      // STEP 1: Sertifika Bilgileri
      case 1:
        return (
          <div className="space-y-5">
            <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Award className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sertifika Bilgileri</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Sertifika tipi seçin, başlık ve tarihler otomatik doldurulur</p>
                </div>
              </div>
            </div>

            {/* Sertifika Tipi - Öne Çıkarılmış */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <Zap className="h-3.5 w-3.5" />
                Sertifika Tipi Seçimi <span className="text-red-500">*</span>
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {CERTIFICATE_TYPES.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, type }))}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                        formData.type === type
                          ? 'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20 shadow-sm'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-slate-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Başlık - Otomatik Oluşturulan */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <Award className="h-3.5 w-3.5" />
                Temel Bilgiler
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Sertifika Başlığı <span className="text-red-500">*</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500"
                        checked={autoTitleEnabled}
                        onChange={e => setAutoTitleEnabled(e.target.checked)}
                      />
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Otomatik başlık</span>
                    </label>
                  </div>
                  <Input
                    className={inputClass}
                    placeholder={formData.type ? generateAutoTitle(formData.type, formData.issueDate) : 'Önce sertifika tipi seçin'}
                    value={formData.title || ''}
                    onChange={e => {
                      setAutoTitleEnabled(false);
                      setFormData(p => ({ ...p, title: e.target.value }));
                    }}
                  />
                  {autoTitleEnabled && formData.type && (
                    <p className="text-xs text-indigo-500 dark:text-indigo-400 flex items-center gap-1">
                      <Zap className="h-3 w-3" /> Tip ve tarihe göre otomatik oluşturuldu
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Sertifika No
                    </label>
                    <Input
                      className={inputClass}
                      placeholder="Otomatik oluşturulur"
                      value={formData.certificateNo || ''}
                      onChange={e => setFormData(p => ({ ...p, certificateNo: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Durum
                    </label>
                    <select
                      className={selectClass}
                      value={formData.status || 'Aktif'}
                      onChange={e => setFormData(p => ({ ...p, status: e.target.value as CertificateStatus }))}
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Süresi Dolmuş">Süresi Dolmuş</option>
                      <option value="İptal Edildi">İptal Edildi</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Tarih & Geçerlilik */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                Tarih & Geçerlilik
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Düzenleme Tarihi <span className="text-red-500">*</span>
                    </label>
                    <Input
                      className={inputClass}
                      type="date"
                      value={formData.issueDate || ''}
                      onChange={e => {
                        const newDate = e.target.value;
                        setFormData(p => ({
                          ...p,
                          issueDate: newDate,
                          expiryDate: selectedDurationPreset && selectedDurationPreset > 0
                            ? addMonthsToDate(newDate, selectedDurationPreset)
                            : p.expiryDate,
                        }));
                      }}
                    />
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Bugünün tarihi otomatik seçildi
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Son Geçerlilik Tarihi
                    </label>
                    <Input
                      className={inputClass}
                      type="date"
                      value={formData.expiryDate || ''}
                      onChange={e => {
                        setSelectedDurationPreset(null);
                        setFormData(p => ({ ...p, expiryDate: e.target.value }));
                      }}
                    />
                  </div>
                </div>

                {/* Quick Duration Buttons */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Clock className="h-3 w-3" /> Hızlı Geçerlilik Süresi
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DURATION_PRESETS.map(preset => (
                      <button
                        key={preset.months}
                        type="button"
                        onClick={() => {
                          setSelectedDurationPreset(preset.months);
                          if (preset.months === 0) {
                            setFormData(p => ({ ...p, expiryDate: undefined }));
                          } else if (formData.issueDate) {
                            setFormData(p => ({
                              ...p,
                              expiryDate: addMonthsToDate(formData.issueDate!, preset.months),
                            }));
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                          selectedDurationPreset === preset.months
                            ? 'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  {formData.expiryDate && formData.issueDate && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(formData.issueDate).toLocaleDateString('tr-TR')} → {new Date(formData.expiryDate).toLocaleDateString('tr-TR')}
                    </p>
                  )}
                  {selectedDurationPreset === 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Info className="h-3 w-3" /> Sertifika süresiz geçerli olacak
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Düzenleyen & Ek Bilgiler */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <PenLine className="h-3.5 w-3.5" />
                Düzenleyen & Detaylar
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Düzenleyen <span className="text-red-500">*</span>
                    </label>
                    <Input
                      className={inputClass}
                      placeholder="Örn: Mehmet Kaya"
                      value={formData.issuer || ''}
                      onChange={e => setFormData(p => ({ ...p, issuer: e.target.value }))}
                    />
                    {user && formData.issuer === `${user.firstName} ${user.lastName}` && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Check className="h-3 w-3" /> Giriş yapan hesaptan otomatik dolduruldu
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Süre (Saat)
                    </label>
                    <Input
                      className={inputClass}
                      type="number"
                      min="0"
                      placeholder="Örn: 8"
                      value={formData.duration || ''}
                      onChange={e => setFormData(p => ({ ...p, duration: parseInt(e.target.value) || undefined }))}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Açıklama / Notlar
                  </label>
                  <textarea
                    rows={3}
                    className="flex w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 resize-none transition-all"
                    placeholder="Sertifika hakkında ek notlar..."
                    value={formData.description || ''}
                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      // STEP 2: Personel & Firma
      case 2:
        return (
          <div className="space-y-5">
            <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                  <Users className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Personel & Firma</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Sertifika verilecek personeli ve firmayı seçin</p>
                </div>
              </div>
            </div>

            {/* Firma Seçimi - Geliştirilmiş */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5" />
                Firma (Opsiyonel)
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                {/* Toggle: Listeden Seç / Elle Gir */}
                <div className="flex items-center gap-3 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUseManualCompany(false);
                      setManualCompanyName('');
                      setFormData(p => ({ ...p, companyName: undefined }));
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      !useManualCompany
                        ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Listeden Seç
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUseManualCompany(true);
                      setFormData(p => ({ ...p, companyId: undefined }));
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                      useManualCompany
                        ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <PenLine className="h-3 w-3" /> Elle Gir
                  </button>
                </div>

                {!useManualCompany ? (
                  <select
                    className={selectClass}
                    value={formData.companyId || ''}
                    onChange={e => {
                      const id = e.target.value || undefined;
                      const comp = companies.find(c => c.id === id);
                      setFormData(p => ({
                        ...p,
                        companyId: id,
                        companyName: comp?.name || undefined,
                      }));
                    }}
                  >
                    <option value="">Firma Seçiniz</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-1.5">
                    <Input
                      className={inputClass}
                      placeholder="Firma adını yazın..."
                      value={manualCompanyName}
                      onChange={e => {
                        setManualCompanyName(e.target.value);
                        setFormData(p => ({ ...p, companyName: e.target.value }));
                      }}
                    />
                    <p className="text-xs text-blue-500 dark:text-blue-400 flex items-center gap-1">
                      <Info className="h-3 w-3" /> Listede olmayan firma adını elle yazabilirsiniz
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* İlgili Eğitim - Hızlı Seçimler Eklendi */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <ClipboardList className="h-3.5 w-3.5" />
                İlgili Eğitim (Opsiyonel)
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                {/* Quick Training Topic Presets */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Zap className="h-3 w-3" /> Hızlı Eğitim Konusu Seçimi
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TRAINING_TOPIC_PRESETS.map(preset => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          // Set the certificate type to match if not already set
                          if (!formData.type || formData.type !== preset.type) {
                            setFormData(p => ({ ...p, type: preset.type }));
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                          formData.type === preset.type
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Training Dropdown */}
                {trainings.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Veya mevcut eğitimlerden birini bağlayın
                    </label>
                    <select
                      className={selectClass}
                      value={formData.trainingId || ''}
                      onChange={e => setFormData(p => ({ ...p, trainingId: e.target.value || undefined }))}
                    >
                      <option value="">Eğitim seçiniz (opsiyonel)</option>
                      {trainings.filter(t => t.status === 'Tamamlandı').map(t => (
                        <option key={t.id} value={t.id}>
                          {t.title} - {new Date(t.date).toLocaleDateString('tr-TR')}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Personel Seçimi - Otomatik Giriş Yapan Seçili */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" />
                  Personel Seçimi <span className="text-red-500">*</span>
                </h3>
                {loggedInPersonnel && formData.personnelId !== loggedInPersonnel.id && (
                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, personnelId: loggedInPersonnel.id }))}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Users className="h-3 w-3" /> Kendimi seç
                  </button>
                )}
              </div>

              {/* Currently Selected Person Badge */}
              {formData.personnelId && selectedPerson && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 border border-indigo-200 dark:border-indigo-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                    {selectedPerson.firstName[0]}{selectedPerson.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-indigo-800 dark:text-indigo-200 truncate">
                      {selectedPerson.firstName} {selectedPerson.lastName}
                    </p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 truncate">{selectedPerson.role}</p>
                  </div>
                  {loggedInPersonnel && formData.personnelId === loggedInPersonnel.id && (
                    <span className="text-[10px] font-bold bg-indigo-200 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                      Giriş Yapan
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, personnelId: undefined }))}
                    className="p-1 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-800 rounded-lg transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  className={`${inputClass} pl-10`}
                  placeholder="Personel adı veya rol ara..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 max-h-[300px] overflow-y-auto space-y-2">
                {filteredPersonnel.map(p => {
                  const isLoggedIn = loggedInPersonnel?.id === p.id;
                  return (
                    <label
                      key={p.id}
                      className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-all group ${
                        formData.personnelId === p.id
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="personnelId"
                        className="text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 w-4 h-4"
                        checked={formData.personnelId === p.id}
                        onChange={() => setFormData(prev => ({ ...prev, personnelId: p.id }))}
                      />
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm ${
                          isLoggedIn ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                        }`}>
                          {p.firstName[0]}{p.lastName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {p.firstName} {p.lastName}
                            </p>
                            {isLoggedIn && (
                              <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-full shrink-0">
                                Sen
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{p.role}</p>
                        </div>
                      </div>
                    </label>
                  );
                })}
                {filteredPersonnel.length === 0 && (
                  <div className="text-center py-6">
                    <Search className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">Personel bulunamadı</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      // STEP 3: Antetli Kağıt Özelleştirme
      case 3:
        return (
          <div className="space-y-5">
            <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <FileText className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Antetli Kağıt</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Sertifika üzerindeki firma ve imza bilgilerini özelleştirin</p>
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
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Antetli Kağıt Üzerindeki Firma Adı
                  </label>
                  <Input
                    className={inputClass}
                    placeholder={selectedCompany?.name || 'Firma adı yazın'}
                    value={formData.companyName || ''}
                    onChange={e => setFormData(p => ({ ...p, companyName: e.target.value }))}
                  />
                  <p className="text-xs text-slate-400">Boş bırakılırsa seçilen firmanın adı kullanılır</p>
                </div>
              </div>
            </div>

            {/* İmza Bilgileri */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" />
                İmza Bilgileri
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      İmza Sahibi Adı
                    </label>
                    <Input
                      className={inputClass}
                      placeholder="Örn: Ahmet Yılmaz"
                      value={formData.signatureName || ''}
                      onChange={e => setFormData(p => ({ ...p, signatureName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      İmza Sahibi Ünvanı
                    </label>
                    <Input
                      className={inputClass}
                      placeholder="Örn: İSG Uzmanı"
                      value={formData.signatureTitle || ''}
                      onChange={e => setFormData(p => ({ ...p, signatureTitle: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    İmza Görseli (Opsiyonel)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSignatureUpload}
                      className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900/30 dark:file:text-indigo-300"
                    />
                    {formData.signatureImage && (
                      <div className="flex items-center gap-2">
                        <img src={formData.signatureImage} alt="İmza" className="h-12 object-contain border rounded" />
                        <button
                          onClick={() => setFormData(p => ({ ...p, signatureImage: undefined }))}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">PNG veya JPG, max 500KB. Sertifika üzerinde imza yerine gösterilir.</p>
                </div>
              </div>
            </div>

            {/* Ek Seçenekler */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <ClipboardList className="h-3.5 w-3.5" />
                Ek Bilgiler
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Sınav Puanı (Opsiyonel)
                  </label>
                  <Input
                    className={inputClass}
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Örn: 85"
                    value={formData.score ?? ''}
                    onChange={e => setFormData(p => ({ ...p, score: e.target.value ? parseInt(e.target.value) : undefined }))}
                  />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="text-blue-700 dark:text-blue-300 text-xs">Bu bilgiler sertifika belgesinin antetli kağıt ve imza bölümlerinde kullanılır. Bir sonraki adımda önizleme yapabilirsiniz.</p>
              </div>
            </div>
          </div>
        );

      // STEP 4: Önizleme & Kaydet
      case 4:
        return (
          <div className="space-y-5">
            <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                    <Eye className="h-4.5 w-4.5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Önizleme</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Sertifikanızı kontrol edin ve yazdırın</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={handlePrint} className="gap-2 text-xs">
                    <Printer className="h-3.5 w-3.5" /> Yazdır / PDF
                  </Button>
                </div>
              </div>
            </div>

            {/* Certificate Preview */}
            <div ref={printRef} className="max-w-3xl mx-auto">
              <CertificatePreview
                formData={formData}
                person={selectedPerson}
                company={selectedCompany}
              />
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
              <Info className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-emerald-800 dark:text-emerald-200">
                <p className="font-semibold mb-1">Yazdırma İpuçları</p>
                <p className="text-emerald-700 dark:text-emerald-300 text-xs">"Yazdır / PDF" butonuna tıklayarak sertifikayı A4 kağıda yazdırabilir veya PDF olarak kaydedebilirsiniz. Tarayıcınızın baskı ayarlarından "Arka plan grafiklerini yazdır" seçeneğini aktifleştirin.</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const progressPercent = Math.round(((currentStep - 1) / (totalSteps - 1)) * 100);

  return (
    <PageTransition>
      <div className="flex h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 -mx-4 -my-4">
        {/* ─── SIDEBAR ─── */}
        <div className="hidden lg:flex flex-col w-[320px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 overflow-y-auto shrink-0">
          <div className="flex flex-col h-full">
            <div className="p-6 pb-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">Yeni Sertifika</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Antetli sertifika oluşturun</p>
                </div>
              </div>

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

            {/* Preview */}
            <div className="p-4 pt-3 border-t border-slate-200 dark:border-slate-700 mt-auto">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-widest">Sertifika Özet</p>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0 shadow-lg">
                    <Award className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {formData.title || 'Sertifika Başlığı'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {selectedPerson ? `${selectedPerson.firstName} ${selectedPerson.lastName}` : 'Personel seçilmedi'}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {formData.type && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                          {formData.type}
                        </span>
                      )}
                      {formData.issueDate && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          <Calendar className="h-3 w-3" />
                          {new Date(formData.issueDate).toLocaleDateString('tr-TR')}
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
          {/* Mobile Header */}
          <div className="lg:hidden shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 pt-4 pb-3">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">Yeni Sertifika</h1>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg">{currentStep}/{totalSteps}</span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
              {steps.map(step => {
                const Icon = STEP_ICONS[step.num - 1] || Award;
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

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="max-w-4xl mx-auto w-full">
              {renderStepContent()}
            </div>
          </div>

          {/* Fixed Navigation */}
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
                  onClick={() => navigate('/certificates')}
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
