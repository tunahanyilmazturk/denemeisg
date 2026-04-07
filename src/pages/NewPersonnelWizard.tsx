import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PageTransition } from '../components/layout/PageTransition';
import { Personnel, PersonnelClass, PersonnelStatus, BloodType, PersonnelRole, EducationLevel } from '../types';
import toast from 'react-hot-toast';
import {
  Plus, ChevronRight, ChevronLeft, User, Phone, Mail, Calendar, Building2, Shield, Heart,
  ClipboardList, Award, AlertCircle, Check, X, Info, Lock, Eye, EyeOff, CheckCircle, XCircle, FileText
} from 'lucide-react';
import { validatePasswordStrength, getPasswordRules } from '../utils/passwordStrength';
import { validateEmail } from '../utils/helpers';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
// Grouped roles for better UX
const ROLE_GROUPS = {
  'İSG Profesyonelleri': [
    'İşyeri Hekimi',
    'İş Güvenliği Uzmanı',
    'İşyeri Hemşiresi',
    'Sağlık Teknikeri',
    'İşyeri Hekimi Yardımcısı',
    'İş Güvenliği Teknikeri',
    'İşyeri Hekimi Asistanı',
  ],
  'Yönetim': [
    'Müdür',
    'Genel Müdür',
    'Şantiye Şefi',
    'Bölge Müdürü',
    'İşletme Müdürü',
    'Fabrika Müdürü',
  ],
  'Teknik': [
    'Mühendis',
    'Tekniker',
    'Teknisyen',
    'Mimar',
  ],
  'Üretim / İşçi': [
    'Usta',
    'Kalfa',
    'İşçi',
    'Operatör',
    'Üretim Personeli',
  ],
  'Destek': [
    'Sekreter',
    'Yönetici Asistanı',
    'Muhasebeci',
    'İnsan Kaynakları',
    'Satış Temsilcisi',
    'Sürücü',
    'Güvenlik Görevlisi',
    'Temizlik Personeli',
  ],
  'Diğer': [
    'Stajyer',
    'Geçici İşçi',
    'Taşeron Personeli',
    'Diğer',
  ],
} as const;

const PERSONNEL_ROLES: PersonnelRole[] = Object.values(ROLE_GROUPS).flat() as PersonnelRole[];

const CLASSES: PersonnelClass[] = ['A', 'B', 'C'];
const STATUSES: PersonnelStatus[] = ['Aktif', 'Pasif', 'İstifa Etti'];
const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-'];
const EDUCATION_LEVELS: EducationLevel[] = [
  'Belirtilmemiş', 'İlkokul', 'Ortaokul', 'Lise', 'Ön Lisans', 'Lisans', 'Yüksek Lisans', 'Doktora',
];

// Hazır ISG sertifika listesi
const PRESET_CERTIFICATES = [
  'Temel İSG Eğitimi',
  'İlk Yardım Sertifikası',
  'Yangın Söndürme Eğitimi',
  'Yüksekte Çalışma Sertifikası',
  'Elektrik Güvenliği Sertifikası',
  'Forklift Operatör Belgesi',
  'Vinç Operatör Belgesi',
  'Kaynak Güvenliği Sertifikası',
  'Kimyasal Madde Güvenliği',
  'Radyasyon Güvenliği Sertifikası',
  'Kapalı Alan Çalışma Sertifikası',
  'İş Makinesi Operatör Belgesi',
  'Gürültü Denetimi Sertifikası',
  'Kişisel Koruyucu Donanım (KKD) Eğitimi',
  'Acil Durum Tahliye Ekip Sertifikası',
];

// İSG Sınıfı gerektiren roller
const ISG_ROLES: PersonnelRole[] = [
  'İşyeri Hekimi',
  'İş Güvenliği Uzmanı',
  'İşyeri Hemşiresi',
  'Sağlık Teknikeri',
  'İşyeri Hekimi Yardımcısı',
  'İş Güvenliği Teknikeri',
  'İşyeri Hekimi Asistanı',
];

const selectClass =
  'flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 transition-all';

const inputClass =
  'flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 transition-all';

// ─── AVATAR ───────────────────────────────────────────────────────────────────
const Avatar = ({ person, size = 'md' }: { person: Partial<Personnel>; size?: 'sm' | 'md' | 'lg' }) => {
  const initials = `${(person.firstName || '?')[0]}${(person.lastName || '?')[0]}`.toUpperCase();
  const colors = [
    'from-indigo-500 to-purple-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-pink-600',
    'from-rose-500 to-red-600',
  ];
  const colorIndex = (person.firstName?.charCodeAt(0) || 0) % colors.length;
  const sizeClass = size === 'sm' ? 'w-10 h-10 text-sm' : size === 'lg' ? 'w-24 h-24 text-3xl' : 'w-12 h-12 text-base';

  return (
    <div className={`${sizeClass} rounded-2xl bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center text-white font-bold shrink-0 shadow-lg ring-4 ring-white/20`}>
      {initials}
    </div>
  );
};

// ─── STEP ICONS ─────────────────────────────────────────────────────────────────
const STEP_ICONS = [User, Phone, Building2, Heart, Award, Lock];
const STEP_COLORS = [
  'from-indigo-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-red-600',
  'from-amber-500 to-orange-600',
  'from-violet-500 to-purple-600',
];

const StepItem = ({ num, label, active, completed }: { num: number; label: string; active: boolean; completed: boolean }) => {
  const Icon = STEP_ICONS[num - 1] || User;
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
export const NewPersonnelWizard = () => {
  const navigate = useNavigate();
  const { companies, addPersonnel, updateCompany } = useStore();
  const { createUser } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Personnel>>({
    status: 'Aktif',
    certifications: [],
    medicalExams: [],
  });
  const [newCert, setNewCert] = useState('');

  // Account creation state
  const [accountData, setAccountData] = useState({
    createAccount: true,
    password: '',
    confirmPassword: '',
    systemRole: 'personel' as 'personel' | 'isg_uzmani' | 'isyeri_hekimi' | 'mudur' | 'viewer',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const totalSteps = 6;

  const steps = [
    { num: 1, label: 'Temel Bilgiler' },
    { num: 2, label: 'İletişim & Adres' },
    { num: 3, label: 'Atanacak Firma' },
    { num: 4, label: 'Sağlık Bilgileri' },
    { num: 5, label: 'Sertifikalar' },
    { num: 6, label: 'Sistem Hesabı' },
  ];

  const handleNext = () => {
    // Validation
    if (currentStep === 1) {
      if (!formData.firstName?.trim()) {
        toast.error('Ad zorunludur.');
        return;
      }
      if (!formData.lastName?.trim()) {
        toast.error('Soyad zorunludur.');
        return;
      }
      if (formData.tcNo && formData.tcNo.trim().length > 0 && formData.tcNo.length !== 11) {
        toast.error('TC kimlik numarası 11 haneli olmalıdır.');
        return;
      }
      if (!formData.role) {
        toast.error('Görev seçilmelidir.');
        return;
      }
      if (!formData.startDate) {
        toast.error('İşe başlama tarihi zorunludur.');
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

  const handleSubmit = async () => {
    // Final validation
    if (!formData.firstName?.trim() || !formData.lastName?.trim()) {
      toast.error('Ad ve soyad zorunludur.');
      return;
    }
    if (formData.tcNo && formData.tcNo.trim().length > 0 && formData.tcNo.length !== 11) {
      toast.error('TC kimlik numarası 11 haneli olmalıdır.');
      return;
    }
    if (!formData.role) {
      toast.error('Görev seçilmelidir.');
      return;
    }
    if (!formData.phone?.trim() || !formData.email?.trim()) {
      toast.error('Telefon ve e-posta zorunludur.');
      return;
    }
    if (!formData.startDate) {
      toast.error('İşe başlama tarihi zorunludur.');
      return;
    }

    // Account validation
    if (accountData.createAccount) {
      if (!accountData.password) {
        toast.error('Şifre zorunludur.');
        return;
      }
      if (accountData.password !== accountData.confirmPassword) {
        toast.error('Şifreler eşleşmiyor.');
        return;
      }
      const passwordCheck = validatePasswordStrength(accountData.password);
      if (passwordCheck.score < 2) {
        toast.error('Daha güçlü bir şifre belirleyin.');
        return;
      }
    }

    const newPersonnel: Personnel = {
      id: Math.random().toString(36).substr(2, 9),
      firstName: formData.firstName!,
      lastName: formData.lastName!,
      tcNo: formData.tcNo!,
      role: formData.role!,
      phone: formData.phone!,
      email: formData.email!,
      startDate: formData.startDate!,
      class: formData.class,
      status: formData.status,
      assignedCompanyId: formData.assignedCompanyId,
      birthDate: formData.birthDate,
      bloodType: formData.bloodType,
      address: formData.address,
      emergencyContact: formData.emergencyContact,
      emergencyPhone: formData.emergencyPhone,
      education: formData.education,
      endDate: formData.endDate,
      certifications: formData.certifications,
      medicalExams: formData.medicalExams,
    };

    // Add personnel to the store
    addPersonnel(newPersonnel);

    // Auto-assign ISG roles to company
    if (formData.assignedCompanyId && formData.role) {
      const assignedCompany = companies.find(c => c.id === formData.assignedCompanyId);
      if (assignedCompany) {
        const isISGSpecialist = formData.role === 'İş Güvenliği Uzmanı' || formData.role === 'İş Güvenliği Teknikeri';
        const isDoctor = formData.role === 'İşyeri Hekimi' || formData.role === 'İşyeri Hekimi Yardımcısı' || formData.role === 'İşyeri Hekimi Asistanı';

        if (isISGSpecialist && !assignedCompany.isgSpecialistId) {
          updateCompany({ ...assignedCompany, isgSpecialistId: newPersonnel.id });
          toast.success(`${formData.firstName} ${formData.lastName}, ${assignedCompany.name} firmasına İSG Uzmanı olarak atandı.`);
        } else if (isDoctor && !assignedCompany.workplaceDoctorId) {
          updateCompany({ ...assignedCompany, workplaceDoctorId: newPersonnel.id });
          toast.success(`${formData.firstName} ${formData.lastName}, ${assignedCompany.name} firmasına İşyeri Hekimi olarak atandı.`);
        }
      }
    }

    // Create system account if enabled
    if (accountData.createAccount) {
      try {
        await createUser({
          firstName: formData.firstName!,
          lastName: formData.lastName!,
          email: formData.email!,
          password: accountData.password,
          phone: formData.phone,
          department: formData.assignedCompanyId
            ? companies.find(c => c.id === formData.assignedCompanyId)?.name
            : undefined,
          role: accountData.systemRole,
        });
        toast.success('Personel ve kullanıcı hesabı başarıyla oluşturuldu!');
      } catch (error) {
        toast.success('Personel eklendi ancak hesap oluşturulurken hata oluştu.');
      }
    } else {
      toast.success('Personel başarıyla eklendi!');
    }

    navigate('/personnel');
  };

  const addCert = () => {
    if (!newCert.trim()) return;
    setFormData(p => ({ ...p, certifications: [...(p.certifications || []), newCert.trim()] }));
    setNewCert('');
  };

  const removeCert = (idx: number) => {
    setFormData(p => ({ ...p, certifications: (p.certifications || []).filter((_, i) => i !== idx) }));
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
                  <User className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Temel Bilgiler</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Personelin kimlik ve iş bilgileri</p>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Ad <span className="text-red-500">*</span>
                    </label>
                    <Input
                      className={inputClass}
                      placeholder="Örn: Mehmet"
                      value={formData.firstName || ''}
                      onChange={e => setFormData(p => ({ ...p, firstName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Soyad <span className="text-red-500">*</span>
                    </label>
                    <Input
                      className={inputClass}
                      placeholder="Örn: Yılmaz"
                      value={formData.lastName || ''}
                      onChange={e => setFormData(p => ({ ...p, lastName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      TC Kimlik No (Opsiyonel)
                    </label>
                    <Input
                      className={inputClass}
                      placeholder="11 haneli"
                      maxLength={11}
                      value={formData.tcNo || ''}
                      onChange={e => setFormData(p => ({ ...p, tcNo: e.target.value.replace(/\D/g, '') }))}
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
                      value={formData.birthDate || ''}
                      onChange={e => setFormData(p => ({ ...p, birthDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Eğitim Durumu</label>
                    <select
                      className={selectClass}
                      value={formData.educationLevel || ''}
                      onChange={e => setFormData(p => ({ ...p, educationLevel: e.target.value as EducationLevel || undefined }))}
                    >
                      <option value="">Seçiniz</option>
                      {EDUCATION_LEVELS.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* İş Bilgileri */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <ClipboardList className="h-3.5 w-3.5" />
                İş Bilgileri
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Görev / Pozisyon <span className="text-red-500">*</span>
                    </label>
                    <select
                      className={selectClass}
                      value={formData.role || ''}
                      onChange={e => setFormData(p => ({ ...p, role: e.target.value }))}
                    >
                      <option value="">Görev Seçiniz</option>
                      {Object.entries(ROLE_GROUPS).map(([group, roles]) => (
                        <optgroup key={group} label={group}>
                          {roles.map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      İşe Başlama <span className="text-red-500">*</span>
                    </label>
                    <Input
                      className={inputClass}
                      type="date"
                      value={formData.startDate || ''}
                      onChange={e => setFormData(p => ({ ...p, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      İşten Çıkış
                    </label>
                    <Input
                      className={inputClass}
                      type="date"
                      value={formData.endDate || ''}
                      onChange={e => setFormData(p => ({ ...p, endDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {ISG_ROLES.includes(formData.role as PersonnelRole) && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5" />
                        İSG Sınıfı
                      </label>
                      <select
                        className={selectClass}
                        value={formData.class || ''}
                        onChange={e => setFormData(p => ({ ...p, class: e.target.value as PersonnelClass || undefined }))}
                      >
                        <option value="">Seçiniz</option>
                        {CLASSES.map(c => (
                          <option key={c} value={c}>{c} Sınıfı</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className={`space-y-1.5 ${!ISG_ROLES.includes(formData.role as PersonnelRole) ? 'md:col-span-3' : ''}`}>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Durum</label>
                    <select
                      className={selectClass}
                      value={formData.status || 'Aktif'}
                      onChange={e => setFormData(p => ({ ...p, status: e.target.value as PersonnelStatus }))}
                    >
                      {STATUSES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
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
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">İletişim Bilgileri</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Telefon, e-posta ve adres bilgileri</p>
                </div>
              </div>
            </div>

            {/* İletişim */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" />
                İletişim
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      placeholder="ornek@email.com"
                      value={formData.email || ''}
                      onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Adres</label>
                    <Input
                      className={inputClass}
                      placeholder="Adres giriniz..."
                      value={formData.address || ''}
                      onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Acil Durum */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5" />
                Acil Durum İletişimi
              </h3>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800 space-y-3">
                <p className="text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Acil durumlarda aranacak kişinin bilgilerini giriniz.</span>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-amber-800 dark:text-amber-200">Acil Kişi Adı</label>
                    <Input
                      className="border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-800 focus:ring-amber-500 focus:border-amber-500"
                      placeholder="Ad Soyad (Yakınlık derecesi)"
                      value={formData.emergencyContact || ''}
                      onChange={e => setFormData(p => ({ ...p, emergencyContact: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-amber-800 dark:text-amber-200">Acil Telefon</label>
                    <Input
                      className="border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-800 focus:ring-amber-500 focus:border-amber-500"
                      placeholder="0555 xxx xx xx"
                      value={formData.emergencyPhone || ''}
                      onChange={e => setFormData(p => ({ ...p, emergencyPhone: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      // STEP 3: Atanacak Firma
      case 3:
        return (
          <div className="space-y-5">
            {/* Header */}
            <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Building2 className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Firma Ataması</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Personelin çalışacağı firmayı seçiniz</p>
                </div>
              </div>
            </div>

            {/* Firma Seçimi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    Atanacak Firma
                  </label>
                  <select
                    className={selectClass}
                    value={formData.assignedCompanyId || ''}
                    onChange={e => setFormData(p => ({ ...p, assignedCompanyId: e.target.value }))}
                  >
                    <option value="">Firma Seçiniz (Opsiyonel)</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.assignedCompanyId ? (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-bold text-indigo-900 dark:text-indigo-100">
                        {companies.find(c => c.id === formData.assignedCompanyId)?.name}
                      </p>
                      <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        {companies.find(c => c.id === formData.assignedCompanyId)?.sector}
                      </p>
                      <div className="mt-3 pt-3 border-t border-indigo-200 dark:border-indigo-800">
                        <p className="text-xs text-indigo-600 dark:text-indigo-400">
                          {companies.find(c => c.id === formData.assignedCompanyId)?.contactPerson}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center">
                  <Building2 className="h-10 w-10 mb-2 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Firma Seçilmedi</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Zorunlu değildir</p>
                </div>
              )}
            </div>

            {/* ISG Role Auto-Assignment Info */}
            {formData.assignedCompanyId && formData.role && (
              formData.role === 'İş Güvenliği Uzmanı' || formData.role === 'İş Güvenliği Teknikeri' ||
              formData.role === 'İşyeri Hekimi' || formData.role === 'İşyeri Hekimi Yardımcısı' || formData.role === 'İşyeri Hekimi Asistanı'
            ) && (() => {
              const selectedCompany = companies.find(c => c.id === formData.assignedCompanyId);
              const isISGSpecialist = formData.role === 'İş Güvenliği Uzmanı' || formData.role === 'İş Güvenliği Teknikeri';
              const isDoctor = formData.role === 'İşyeri Hekimi' || formData.role === 'İşyeri Hekimi Yardımcısı' || formData.role === 'İşyeri Hekimi Asistanı';
              const hasExistingISG = selectedCompany?.isgSpecialistId;
              const hasExistingDoctor = selectedCompany?.workplaceDoctorId;

              if ((isISGSpecialist && hasExistingISG) || (isDoctor && hasExistingDoctor)) {
                return (
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-amber-800 dark:text-amber-200">
                        <p className="font-semibold mb-1">Uyarı</p>
                        <p className="text-amber-700 dark:text-amber-300">
                          Bu firmada zaten {isISGSpecialist ? 'bir İSG Uzmanı' : 'bir İşyeri Hekimi'} atanmış durumda.
                          Yeni personel firmaya atanacak ancak otomatik {isISGSpecialist ? 'İSG Uzmanı' : 'İşyeri Hekimi'} olarak belirlenmeyecektir.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-emerald-800 dark:text-emerald-200">
                      <p className="font-semibold mb-1">Otomatik Atama</p>
                      <p className="text-emerald-700 dark:text-emerald-300">
                        Bu personel, {selectedCompany?.name} firmasına {isISGSpecialist ? 'İSG Uzmanı' : 'İşyeri Hekimi'} olarak otomatik atanacaktır.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Bilgi</p>
                  <p className="text-blue-700 dark:text-blue-300">
                    Firma atamasını daha sonra da yapabilirsiniz. Personel listesinden düzenleme yaparak atama gerçekleştirebilirsiniz.
                    {formData.role && (formData.role === 'İş Güvenliği Uzmanı' || formData.role === 'İş Güvenliği Teknikeri' || formData.role === 'İşyeri Hekimi' || formData.role === 'İşyeri Hekimi Yardımcısı' || formData.role === 'İşyeri Hekimi Asistanı') &&
                      ' İSG görevlileri için firma seçtiğinizde, otomatik olarak firmanın İSG sorumlusu olarak atanabilirsiniz.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      // STEP 4: Sağlık Bilgileri
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
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sağlık Bilgileri</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Kan grubu ve tıbbi bilgiler</p>
                </div>
              </div>
            </div>

            {/* Kan Grubu */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5" />
                    Kan Grubu
                  </label>
                  <select
                    className={selectClass}
                    value={formData.bloodType || ''}
                    onChange={e => setFormData(p => ({ ...p, bloodType: e.target.value as BloodType || undefined }))}
                  >
                    <option value="">Bilinmiyor / Seçiniz</option>
                    {BLOOD_TYPES.map(bt => (
                      <option key={bt} value={bt}>{bt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.bloodType ? (
                <div className="bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20 rounded-xl p-4 border border-rose-200 dark:border-rose-800 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shrink-0 shadow-lg">
                    <span className="text-white font-bold text-xl">{formData.bloodType}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-rose-900 dark:text-rose-100">Kan Grubu Seçildi</p>
                    <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">Acil durumlarda kullanılacak</p>
                  </div>
                </div>
              ) : (
                <div className="text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center py-6">
                  <Heart className="h-8 w-8 mb-2 text-slate-300 dark:text-slate-600" />
                  <p className="text-xs text-slate-500">Kan grubu henüz seçilmedi</p>
                </div>
              )}
            </div>

            {/* Sağlık Notları */}
            <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ClipboardList className="h-3.5 w-3.5" />
                Sağlık Notları
              </label>
              <textarea
                className="flex w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 transition-all resize-none"
                rows={3}
                placeholder="Kronik hastalıklar, ilaç kullanımı, alerjiler veya özel sağlık durumları..."
                value={formData.healthNotes || ''}
                onChange={e => setFormData(p => ({ ...p, healthNotes: e.target.value }))}
              />
            </div>

            {/* Sağlık Raporu PDF */}
            <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Sağlık Raporu (PDF)
              </label>
              {formData.healthReportBase64 ? (
                <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-4 py-3 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">{formData.healthReportFileName}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">PDF yüklendi</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = formData.healthReportBase64!;
                        link.download = formData.healthReportFileName || 'saglik-raporu.pdf';
                        link.click();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 transition-colors"
                    >
                      İndir
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, healthReportBase64: undefined, healthReportFileName: undefined }))}
                      className="px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/40 text-xs font-semibold text-red-700 dark:text-red-300 hover:bg-red-200 transition-colors"
                    >
                      Kaldır
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl py-8 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors group">
                  <FileText className="h-8 w-8 text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 transition-colors mb-2" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">PDF dosyası seçin</p>
                  <p className="text-xs text-slate-400 mt-1">Sağlık raporunu buraya yükleyin</p>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = ev => {
                        setFormData(p => ({
                          ...p,
                          healthReportBase64: ev.target?.result as string,
                          healthReportFileName: file.name,
                        }));
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              )}
            </div>

            {/* Tıbbi Muayene Bilgisi */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-1">Tıbbi Muayene Kayıtları</h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Tıbbi muayene ve periyodik muayene kayıtlarını personel eklendikten sonra düzenleme ekranından ekleyebilirsiniz.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      // STEP 5: Sertifikalar
      case 5:
        return (
          <div className="space-y-5">
            {/* Header */}
            <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <Award className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sertifikalar & Eğitimler</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">İSG eğitimi, iş güvenliği belgesi vb.</p>
                </div>
              </div>
            </div>

            {/* Hazır Sertifika Hızlı Seçim */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <Award className="h-3.5 w-3.5" />
                Hızlı Sertifika Seçimi
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Aşağıdan bir veya birden fazla sertifika seçin:</p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_CERTIFICATES.map(cert => {
                    const isAdded = (formData.certifications || []).includes(cert);
                    return (
                      <button
                        key={cert}
                        type="button"
                        onClick={() => {
                          if (isAdded) {
                            setFormData(p => ({ ...p, certifications: (p.certifications || []).filter(c => c !== cert) }));
                          } else {
                            setFormData(p => ({ ...p, certifications: [...(p.certifications || []), cert] }));
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          isAdded
                            ? 'bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-200 dark:shadow-amber-900/30'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-amber-400 hover:text-amber-700 dark:hover:text-amber-400'
                        }`}
                      >
                        {isAdded ? <><Check className="h-3 w-3 inline mr-1" />{cert}</> : cert}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Manuel Sertifika Ekleme */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <Plus className="h-3.5 w-3.5" />
                Manuel Ekle
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex gap-3">
                  <Input
                    className={inputClass}
                    placeholder="Örn: İSG Eğitimi, Forklift Sertifikası, İlk Yardım..."
                    value={newCert}
                    onChange={e => setNewCert(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCert();
                      }
                    }}
                  />
                  <Button type="button" onClick={addCert} className="shrink-0 px-5 gap-2">
                    <Plus className="h-4 w-4" />
                    Ekle
                  </Button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" />
                  Enter tuşuna basarak veya Ekle butonuna tıklayarak sertifika ekleyebilirsiniz
                </p>
              </div>
            </div>

            {/* Sertifika Listesi */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <ClipboardList className="h-3.5 w-3.5" />
                Ekli Sertifikalar ({(formData.certifications || []).length})
              </h3>
              {(formData.certifications || []).length === 0 ? (
                <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                  <Award className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-0.5">Henüz Sertifika Eklenmedi</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">Yukarıdaki alandan sertifika ekleyebilirsiniz</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {(formData.certifications || []).map((cert, idx) => (
                    <div key={idx} className="group flex items-center justify-between bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/50 rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0 shadow-sm">
                          <Award className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">{cert}</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">#{idx + 1}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCert(idx)}
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
        );

      // STEP 6: Sistem Hesabı
      case 6:
        const passwordStrength = accountData.password ? validatePasswordStrength(accountData.password) : null;
        const passwordRules = getPasswordRules();
        const passwordsMatch = accountData.password && accountData.confirmPassword && accountData.password === accountData.confirmPassword;
        
        return (
          <div className="space-y-5">
            {/* Header */}
            <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Lock className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sistem Hesabı</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Personele giriş yapabilmesi için kullanıcı hesabı oluşturun</p>
                </div>
              </div>
            </div>

            {/* Toggle Account Creation */}
            <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <label className="flex items-center gap-4 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={accountData.createAccount}
                    onChange={(e) => setAccountData(prev => ({ ...prev, createAccount: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-7 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:bg-indigo-500 transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md peer-checked:translate-x-5 transition-transform" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Kullanıcı Hesabı Oluştur</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Personel bu bilgilerle sisteme giriş yapabilecek
                  </p>
                </div>
              </label>
            </div>

            {accountData.createAccount && (
              <>
                {/* Login Email Info */}
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100 mb-1">Giriş E-postası</p>
                      <p className="text-sm text-indigo-700 dark:text-indigo-300 font-mono bg-indigo-100 dark:bg-indigo-800/30 px-3 py-1.5 rounded-lg inline-block">
                        {formData.email || 'E-posta adresi henüz girilmedi'}
                      </p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">
                        Personelin 2. adımda girdiğiniz e-posta adresi giriş bilgileri olarak kullanılacaktır.
                      </p>
                    </div>
                  </div>
                </div>

                {/* System Role */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5" />
                    Sistem Rolü
                  </h3>
                  <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <select
                      className={selectClass}
                      value={accountData.systemRole}
                      onChange={(e) => setAccountData(prev => ({ ...prev, systemRole: e.target.value as typeof accountData.systemRole }))}
                    >
                      <option value="personel">Personel - Sınırlı erişim</option>
                      <option value="isg_uzmani">İSG Uzmanı - Eğitim ve risk yönetimi</option>
                      <option value="isyeri_hekimi">İşyeri Hekimi - Sağlık kayıtları</option>
                      <option value="mudur">Müdür - Genel görüntüleme</option>
                      <option value="viewer">Gözlemci - Sadece görüntüleme</option>
                    </select>
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5" />
                    Şifre Belirleme
                  </h3>
                  <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-4">
                    {/* Password Input */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Şifre <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className={`${inputClass} pl-10 pr-10`}
                          placeholder="••••••••"
                          value={accountData.password}
                          onChange={(e) => setAccountData(prev => ({ ...prev, password: e.target.value }))}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Password Strength Bar */}
                    {passwordStrength && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                passwordStrength.score <= 1 ? 'bg-red-500' :
                                passwordStrength.score === 2 ? 'bg-amber-500' :
                                passwordStrength.score === 3 ? 'bg-blue-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                            />
                          </div>
                          <span className={`text-xs font-semibold ${
                            passwordStrength.score <= 1 ? 'text-red-500' :
                            passwordStrength.score === 2 ? 'text-amber-500' :
                            passwordStrength.score === 3 ? 'text-blue-500' : 'text-emerald-500'
                          }`}>
                            {passwordStrength.label}
                          </span>
                        </div>

                        {/* Password Rules */}
                        <div className="grid grid-cols-2 gap-1.5">
                          {passwordRules.map((rule, idx) => {
                            const met = rule.test(accountData.password);
                            return (
                              <div key={idx} className="flex items-center gap-1.5">
                                {met ? (
                                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                                )}
                                <span className={`text-xs ${met ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}`}>
                                  {rule.rule}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Şifre Tekrar <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          className={`${inputClass} pl-10 pr-10`}
                          placeholder="••••••••"
                          value={accountData.confirmPassword}
                          onChange={(e) => setAccountData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {accountData.confirmPassword && (
                        <div className="flex items-center gap-1.5 mt-1">
                          {passwordsMatch ? (
                            <>
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                              <span className="text-xs text-emerald-600 dark:text-emerald-400">Şifreler eşleşiyor</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3.5 w-3.5 text-red-500" />
                              <span className="text-xs text-red-600 dark:text-red-400">Şifreler eşleşmiyor</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Summary Info */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-emerald-800 dark:text-emerald-200">
                      <p className="font-semibold mb-1">Hesap Bilgileri Özeti</p>
                      <p className="text-emerald-700 dark:text-emerald-300">
                        Personel, <strong>{formData.email}</strong> adresi ve belirlediğiniz şifre ile sisteme giriş yapabilecek.
                        İlk girişte şifresini değiştirmesi önerilir.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {!accountData.createAccount && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-semibold mb-1">Hesap Oluşturulmayacak</p>
                    <p className="text-amber-700 dark:text-amber-300">
                      Personel sisteme giriş yapamayacak. Daha sonra Kullanıcı Yönetimi panelinden hesap oluşturabilirsiniz.
                    </p>
                  </div>
                </div>
              </div>
            )}
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
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">Yeni Personel</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Sisteme yeni personel ekleyin</p>
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

            {/* Avatar Preview */}
            <div className="p-4 pt-3 border-t border-slate-200 dark:border-slate-700 mt-auto">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-widest">Personel Önizleme</p>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-4">
                  <Avatar person={formData} size="md" />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {formData.firstName || '—'} {formData.lastName || '—'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {formData.role || 'Görev seçilmedi'}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {formData.assignedCompanyId && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                          <Building2 className="h-3 w-3" />
                          {companies.find(c => c.id === formData.assignedCompanyId)?.name || '—'}
                        </span>
                      )}
                      {formData.status && (
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          formData.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                          formData.status === 'Pasif' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            formData.status === 'Aktif' ? 'bg-emerald-500' : formData.status === 'Pasif' ? 'bg-slate-400' : 'bg-red-500'
                          }`}></span>
                          {formData.status}
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
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">Yeni Personel</h1>
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
                const Icon = STEP_ICONS[step.num - 1] || User;
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
                  onClick={() => navigate('/personnel')}
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
