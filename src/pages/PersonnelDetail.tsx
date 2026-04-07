import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PageTransition } from '../components/layout/PageTransition';
import {
  ArrowLeft, Save, User, Phone, Mail, Calendar, Building2, Shield, Heart,
  Award, AlertCircle, Plus, X, Edit2, Trash2, Clock, MapPin,
  Key, Lock, Unlock, Check,
  ClipboardList, Briefcase, GraduationCap, UserCheck, Info, Download, FileText, Activity, TrendingUp
} from 'lucide-react';
import { Personnel, PersonnelClass, PersonnelStatus, BloodType, MedicalExam } from '../types';
import { exportPersonnelReport } from '../utils/exportUtils';
import toast from 'react-hot-toast';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CLASSES: PersonnelClass[] = ['A', 'B', 'C'];
const STATUSES: PersonnelStatus[] = ['Aktif', 'Pasif', 'İstifa Etti'];
const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+'];

// İSG Rolleri
const ISG_ROLES = [
  'İşyeri Hekimi',
  'İş Güvenliği Uzmanı',
  'İşyeri Hemşiresi',
  'Sağlık Teknikeri',
  'İşyeri Hekimi Yardımcısı',
  'İş Güvenliği Teknikeri',
  'İşyeri Hekimi Asistanı',
];

const STATUS_COLORS: Record<PersonnelStatus, string> = {
  'Aktif':        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Pasif':        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'İstifa Etti':  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const CLASS_COLORS: Record<PersonnelClass, string> = {
  A: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  B: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  C: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

const selectClass =
  'flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 transition-all';

const inputClass =
  'flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 transition-all';

type DetailSection = 'overview' | 'contact' | 'work' | 'health' | 'certs' | 'incidents' | 'trainings' | 'account';

// ─── SECTION CONFIG ───────────────────────────────────────────────────────────
const SECTION_ICONS: Record<DetailSection, React.ElementType> = {
  overview: User,
  contact: Phone,
  work: Building2,
  health: Heart,
  certs: Award,
  incidents: AlertCircle,
  trainings: ClipboardList,
  account: Key,
};

const SECTION_COLORS: Record<DetailSection, string> = {
  overview: 'from-indigo-500 to-purple-600',
  contact: 'from-blue-500 to-cyan-600',
  work: 'from-emerald-500 to-teal-600',
  health: 'from-red-500 to-rose-600',
  certs: 'from-amber-500 to-orange-600',
  incidents: 'from-orange-500 to-pink-600',
  trainings: 'from-violet-500 to-purple-600',
  account: 'from-slate-500 to-slate-600',
};

const SECTION_LABELS: Record<DetailSection, string> = {
  overview: 'Kişisel Bilgiler',
  contact: 'İletişim & Adres',
  work: 'İş Bilgileri',
  health: 'Sağlık',
  certs: 'Sertifikalar',
  incidents: 'Olaylar & Kazalar',
  trainings: 'Eğitimler',
  account: 'Sistem Hesabı',
};

const ALL_SECTIONS: DetailSection[] = ['overview', 'contact', 'work', 'health', 'certs', 'incidents', 'trainings', 'account'];

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
  const sizeClass = size === 'sm' ? 'w-10 h-10' : size === 'lg' ? 'w-12 h-12' : 'w-12 h-12';
  const textClass = size === 'sm' ? 'text-sm' : 'text-lg';

  return (
    <div className={`${sizeClass} rounded-2xl bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center text-white font-bold shrink-0 shadow-lg ring-4 ring-white/20`}>
      <span className={textClass}>{initials}</span>
    </div>
  );
};

// ─── STEP ITEM (Sidebar menu item) ───────────────────────────────────────────
const SidebarMenuItem = ({ section, active, badge }: { section: DetailSection; active: boolean; badge?: number }) => {
  const Icon = SECTION_ICONS[section];
  const label = SECTION_LABELS[section];
  const color = SECTION_COLORS[section];

  return (
    <div className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition-all ${
      active ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
    }`}>
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm flex-shrink-0 transition-all ${
          active
            ? `bg-gradient-to-br ${color} text-white shadow-lg shadow-indigo-500/30 scale-110`
            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${
          active ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400'
        }`}>
          {label}
        </p>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
          {badge}
        </span>
      )}
    </div>
  );
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export const PersonnelDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { personnel, companies, updatePersonnel, deletePersonnel, incidents, trainings, ppes: ppeList } = useStore();
  const { systemUsers, resetUserPassword, toggleUserStatus, deleteSystemUser, hasRole, loadSystemUsers } = useAuthStore();

  // Load system users on mount to properly link personnel to user accounts
  useEffect(() => {
    loadSystemUsers();
  }, [loadSystemUsers]);

  // Permission check
  const canEdit = hasRole(['superadmin', 'admin', 'mudur']);

  const person = personnel.find(p => p.id === id);
  const company = person ? companies.find(c => c.id === person.assignedCompanyId) : null;

  const [activeSection, setActiveSection] = useState<DetailSection>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Personnel>>({});
  const [newCert, setNewCert] = useState('');

  // Related data
  const personIncidents = useMemo(() =>
    person ? incidents.filter(i => i.personnelId === person.id) : [], [person, incidents]
  );
  const personTrainings = useMemo(() =>
    person ? trainings.filter(t => t.participants?.includes(person.id)) : [], [person, trainings]
  );
  const personPPE = useMemo(() =>
    person ? ppeList.filter(p => p.personnelId === person.id) : [], [person, ppeList]
  );
  const linkedUser = useMemo(() =>
    person ? systemUsers.find(u => u.email === person.email) : null, [person, systemUsers]
  );

  // Check if person is ISG role
  const isISGRole = person && ISG_ROLES.includes(person.role);
  
  // Check if assigned as company ISG specialist or doctor
  const assignedAsISG = useMemo(() => {
    if (!person || !person.assignedCompanyId) return null;
    const assignedCompany = companies.find(c => c.id === person.assignedCompanyId);
    if (!assignedCompany) return null;
    
    if (assignedCompany.isgSpecialistId === person.id) return 'İSG Uzmanı';
    if (assignedCompany.workplaceDoctorId === person.id) return 'İşyeri Hekimi';
    return null;
  }, [person, companies]);

  // Statistics
  const personnelStats = useMemo(() => {
    if (!person) return null;
    
    const workDays = person.startDate
      ? Math.floor((new Date().getTime() - new Date(person.startDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    
    return {
      incidents: personIncidents.length,
      trainings: personTrainings.length,
      certifications: (person.certifications || []).length,
      medicalExams: (person.medicalExams || []).length,
      workDays,
      workYears: (workDays / 365).toFixed(1),
    };
  }, [person, personIncidents, personTrainings]);

  if (!person) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <User className="h-16 w-16 text-slate-300 dark:text-slate-600" />
          <h2 className="text-xl font-bold text-slate-600 dark:text-slate-400">Personel bulunamadı</h2>
          <Button onClick={() => navigate('/personnel')} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Personel Listesine Dön
          </Button>
        </div>
      </PageTransition>
    );
  }

  const status = person.status || 'Aktif';

  // Edit handlers
  const startEditing = () => {
    setEditData({ ...person });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditData({});
    setIsEditing(false);
  };

  const saveChanges = () => {
    if (!editData.firstName?.trim() || !editData.lastName?.trim()) {
      toast.error('Ad ve soyad zorunludur.');
      return;
    }
    if (!editData.tcNo?.trim() || editData.tcNo.length !== 11) {
      toast.error('TC kimlik numarası 11 haneli olmalıdır.');
      return;
    }
    updatePersonnel(editData as Personnel);
    toast.success('Personel bilgileri güncellendi.');
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Bu personeli kalıcı olarak silmek istediğinize emin misiniz?')) {
      deletePersonnel(person.id);
      toast.success('Personel silindi.');
      navigate('/personnel');
    }
  };

  const addCert = () => {
    if (!newCert.trim()) return;
    setEditData(d => ({ ...d, certifications: [...(d.certifications || []), newCert.trim()] }));
    setNewCert('');
  };

  const removeCert = (idx: number) => {
    setEditData(d => ({ ...d, certifications: (d.certifications || []).filter((_, i) => i !== idx) }));
  };

  const addExam = () => {
    const exam: MedicalExam = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      type: 'Periyodik Muayene',
      result: 'Normal',
      nextExamDate: '',
    };
    setEditData(d => ({ ...d, medicalExams: [...(d.medicalExams || []), exam] }));
  };

  const handleResetPassword = async () => {
    if (!linkedUser) return;
    const newPass = prompt('Yeni şifre giriniz (min 6 karakter):');
    if (!newPass || newPass.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır.');
      return;
    }
    await resetUserPassword(linkedUser.id, newPass);
    toast.success('Şifre sıfırlandı.');
  };

  const handleToggleUserStatus = async () => {
    if (!linkedUser) return;
    await toggleUserStatus(linkedUser.id);
    toast.success(linkedUser.isEmailVerified ? 'Kullanıcı hesabı pasifleştirildi.' : 'Kullanıcı hesabı aktifleştirildi.');
  };

  const handleDeleteUser = async () => {
    if (!linkedUser) return;
    if (window.confirm('Bu kullanıcının sistem hesabını silmek istediğinize emin misiniz?')) {
      await deleteSystemUser(linkedUser.id);
      toast.success('Sistem hesabı silindi.');
    }
  };

  // Export handler
  const handleExport = () => {
    if (!person) return;
    exportPersonnelReport([person], companies);
    toast.success('Personel raporu dışa aktarıldı.');
  };

  // Get badges for sidebar
  const getBadge = (section: DetailSection): number | undefined => {
    switch (section) {
      case 'certs': return (person.certifications || []).length || undefined;
      case 'health': return (person.medicalExams || []).length || undefined;
      case 'incidents': return personIncidents.length || undefined;
      case 'trainings': return personTrainings.length || undefined;
      default: return undefined;
    }
  };

  // Data source for editing
  const data = isEditing ? editData : person;

  // ─── RENDER SECTION CONTENT ─────────────────────────────────────────────────
  const renderSectionContent = () => {
    switch (activeSection) {
      // ─── OVERVIEW ─────────────────────────────────────────────────────
      case 'overview':
        return (
          <div className="space-y-5">
            <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <User className="h-4.5 w-4.5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Kişisel Bilgiler</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Ad, soyad, TC kimlik ve temel bilgiler</p>
                  </div>
                </div>
                <Button variant="secondary" onClick={handleExport} className="gap-2 text-xs">
                  <Download className="h-3.5 w-3.5" /> Dışa Aktar
                </Button>
              </div>
            </div>

            {/* Statistics Cards */}
            {personnelStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Olaylar</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{personnelStats.incidents}</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">Kayıtlı olay</p>
                </div>

                <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-violet-200 dark:border-violet-800">
                  <div className="flex items-center justify-between mb-2">
                    <ClipboardList className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">Eğitimler</span>
                  </div>
                  <p className="text-2xl font-bold text-violet-900 dark:text-violet-100">{personnelStats.trainings}</p>
                  <p className="text-xs text-violet-700 dark:text-violet-300 mt-0.5">Katılım</p>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center justify-between mb-2">
                    <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Sertifikalar</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{personnelStats.certifications}</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">Belge</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Çalışma</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{personnelStats.workYears}</p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">Yıl</p>
                </div>
              </div>
            )}

            {/* ISG Role Indicator */}
            {(isISGRole || assignedAsISG) && (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-100">İSG Personeli</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                        {person.role}
                      </span>
                    </div>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300">
                      {assignedAsISG ? (
                        <>Bu personel <strong>{company?.name}</strong> firmasında <strong>{assignedAsISG}</strong> olarak görevlendirilmiştir.</>
                      ) : (
                        <>Bu personel İş Sağlığı ve Güvenliği uzmanı olarak sınıflandırılmıştır.</>
                      )}
                    </p>
                    {person.class && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                          {person.class} Sınıfı
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <User className="h-3.5 w-3.5" />
                Kimlik Bilgileri
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Ad <span className="text-red-500">*</span></label>
                      <Input className={inputClass} value={editData.firstName || ''} onChange={e => setEditData(d => ({ ...d, firstName: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Soyad <span className="text-red-500">*</span></label>
                      <Input className={inputClass} value={editData.lastName || ''} onChange={e => setEditData(d => ({ ...d, lastName: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">TC Kimlik No <span className="text-red-500">*</span></label>
                      <Input className={inputClass} maxLength={11} value={editData.tcNo || ''} onChange={e => setEditData(d => ({ ...d, tcNo: e.target.value.replace(/\D/g, '') }))} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Doğum Tarihi</label>
                      <Input className={inputClass} type="date" value={editData.birthDate || ''} onChange={e => setEditData(d => ({ ...d, birthDate: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Görev <span className="text-red-500">*</span></label>
                      <Input className={inputClass} value={editData.role || ''} onChange={e => setEditData(d => ({ ...d, role: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Eğitim</label>
                      <Input className={inputClass} value={editData.education || ''} onChange={e => setEditData(d => ({ ...d, education: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">İSG Sınıfı</label>
                      <select className={selectClass} value={editData.class || ''} onChange={e => setEditData(d => ({ ...d, class: e.target.value as PersonnelClass || undefined }))}>
                        <option value="">Seçiniz</option>
                        {CLASSES.map(c => <option key={c} value={c}>{c} Sınıfı</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Durum</label>
                      <select className={selectClass} value={editData.status || 'Aktif'} onChange={e => setEditData(d => ({ ...d, status: e.target.value as PersonnelStatus }))}>
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { icon: User, label: 'Ad Soyad', value: `${person.firstName} ${person.lastName}` },
                      { icon: User, label: 'TC Kimlik No', value: person.tcNo },
                      { icon: Calendar, label: 'Doğum Tarihi', value: person.birthDate ? new Date(person.birthDate).toLocaleDateString('tr-TR') : '—' },
                      { icon: Briefcase, label: 'Görev / Pozisyon', value: person.role },
                      { icon: GraduationCap, label: 'Eğitim', value: person.education || '—' },
                      { icon: Shield, label: 'İSG Sınıfı', value: person.class ? `${person.class} Sınıfı` : '—' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                          <item.icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      // ─── CONTACT ──────────────────────────────────────────────────────
      case 'contact':
        return (
          <div className="space-y-5">
            <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                  <Phone className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">İletişim & Adres</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Telefon, e-posta, adres ve acil iletişim bilgileri</p>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" />
                İletişim Bilgileri
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" /> Telefon <span className="text-red-500">*</span>
                      </label>
                      <Input className={inputClass} value={editData.phone || ''} onChange={e => setEditData(d => ({ ...d, phone: e.target.value }))} placeholder="0555 xxx xx xx" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" /> E-posta <span className="text-red-500">*</span>
                      </label>
                      <Input className={inputClass} type="email" value={editData.email || ''} onChange={e => setEditData(d => ({ ...d, email: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" /> Adres
                      </label>
                      <textarea
                        rows={3}
                        className="flex w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 resize-none transition-all"
                        value={editData.address || ''}
                        onChange={e => setEditData(d => ({ ...d, address: e.target.value }))}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { icon: Phone, label: 'Telefon', value: person.phone },
                      { icon: Mail, label: 'E-posta', value: person.email },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                          <item.icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.value || '—'}</p>
                        </div>
                      </div>
                    ))}
                    {person.address && (
                      <div className="flex items-start gap-3 md:col-span-2">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Adres</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{person.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5" />
                Acil Durum İletişimi
              </h3>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-amber-800 dark:text-amber-200">Acil Kişi Adı</label>
                      <Input className={inputClass} value={editData.emergencyContact || ''} onChange={e => setEditData(d => ({ ...d, emergencyContact: e.target.value }))} placeholder="Ad Soyad (Yakınlık)" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-amber-800 dark:text-amber-200">Acil Telefon</label>
                      <Input className={inputClass} value={editData.emergencyPhone || ''} onChange={e => setEditData(d => ({ ...d, emergencyPhone: e.target.value }))} placeholder="0555 xxx xx xx" />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">Kişi</p>
                      <p className="font-semibold text-amber-900 dark:text-amber-100">{person.emergencyContact || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">Telefon</p>
                      <p className="font-semibold text-amber-900 dark:text-amber-100">{person.emergencyPhone || '—'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      // ─── WORK ─────────────────────────────────────────────────────────
      case 'work':
        return (
          <div className="space-y-5">
            <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Building2 className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">İş Bilgileri</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Firma, işe başlama, çıkış tarihi ve durum</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5" />
                Çalışma Bilgileri
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" /> Atanan Firma
                      </label>
                      <select className={selectClass} value={editData.assignedCompanyId || ''} onChange={e => setEditData(d => ({ ...d, assignedCompanyId: e.target.value }))}>
                        <option value="">Atanmadı</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" /> İşe Başlama <span className="text-red-500">*</span>
                      </label>
                      <Input className={inputClass} type="date" value={editData.startDate || ''} onChange={e => setEditData(d => ({ ...d, startDate: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" /> İşten Çıkış
                      </label>
                      <Input className={inputClass} type="date" value={editData.endDate || ''} onChange={e => setEditData(d => ({ ...d, endDate: e.target.value }))} />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Building2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Firma</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{company?.name || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">İşe Başlama</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{person.startDate ? new Date(person.startDate).toLocaleDateString('tr-TR') : '—'}</p>
                      </div>
                    </div>
                    {person.endDate && (
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">İşten Çıkış</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{new Date(person.endDate).toLocaleDateString('tr-TR')}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* PPE Records */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <Shield className="h-3.5 w-3.5" />
                KKD Kayıtları ({personPPE.length})
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                {personPPE.length === 0 ? (
                  <div className="text-center py-6">
                    <Shield className="h-10 w-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">KKD kaydı bulunmuyor</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {personPPE.map(ppe => (
                      <div key={ppe.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{ppe.name}</p>
                          <p className="text-xs text-slate-500">{ppe.type} — {new Date(ppe.issueDate).toLocaleDateString('tr-TR')}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          ppe.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          ppe.status === 'İade Edildi' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {ppe.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      // ─── HEALTH ───────────────────────────────────────────────────────
      case 'health':
        return (
          <div className="space-y-5">
            <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                  <Heart className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sağlık</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Kan grubu ve periyodik muayene bilgileri</p>
                </div>
              </div>
            </div>

            {/* Blood Type */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <Heart className="h-3.5 w-3.5" />
                Kan Grubu
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                {isEditing ? (
                  <div className="max-w-xs">
                    <select className={selectClass} value={editData.bloodType || ''} onChange={e => setEditData(d => ({ ...d, bloodType: e.target.value as BloodType || undefined }))}>
                      <option value="">Bilinmiyor</option>
                      {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 flex items-center justify-center">
                      <span className="text-xl font-bold text-red-600 dark:text-red-400">{person.bloodType || '?'}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Kan Grubu</p>
                      <p className="text-sm text-slate-500">{person.bloodType || 'Bilinmiyor'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Medical Exams */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5" />
                  Periyodik Muayeneler ({(isEditing ? editData.medicalExams : person.medicalExams || [])?.length || 0})
                </h3>
                {isEditing && (
                  <button onClick={addExam} className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                    <Plus className="h-3.5 w-3.5" /> Yeni Muayene
                  </button>
                )}
              </div>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                {isEditing ? (
                  (editData.medicalExams || []).length === 0 ? (
                    <div className="text-center py-6">
                      <Shield className="h-10 w-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm text-slate-500">"Yeni Muayene" butonuna tıklayarak muayene ekleyiniz</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(editData.medicalExams || []).map((exam, idx) => (
                        <div key={exam.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-xs text-slate-500">Tarih</label>
                              <Input className={inputClass} type="date" value={exam.date}
                                onChange={e => setEditData(d => {
                                  const exams = [...(d.medicalExams || [])];
                                  exams[idx] = { ...exams[idx], date: e.target.value };
                                  return { ...d, medicalExams: exams };
                                })} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-slate-500">Muayene Türü</label>
                              <Input className={inputClass} value={exam.type}
                                onChange={e => setEditData(d => {
                                  const exams = [...(d.medicalExams || [])];
                                  exams[idx] = { ...exams[idx], type: e.target.value };
                                  return { ...d, medicalExams: exams };
                                })} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-slate-500">Sonuç</label>
                              <Input className={inputClass} value={exam.result}
                                onChange={e => setEditData(d => {
                                  const exams = [...(d.medicalExams || [])];
                                  exams[idx] = { ...exams[idx], result: e.target.value };
                                  return { ...d, medicalExams: exams };
                                })} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-slate-500">Sonraki Muayene</label>
                              <Input className={inputClass} type="date" value={exam.nextExamDate || ''}
                                onChange={e => setEditData(d => {
                                  const exams = [...(d.medicalExams || [])];
                                  exams[idx] = { ...exams[idx], nextExamDate: e.target.value };
                                  return { ...d, medicalExams: exams };
                                })} />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <button onClick={() => setEditData(d => ({ ...d, medicalExams: (d.medicalExams || []).filter((_, i) => i !== idx) }))}
                              className="text-xs text-red-500 hover:underline font-medium">Sil</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  (person.medicalExams || []).length === 0 ? (
                    <div className="text-center py-6">
                      <Shield className="h-10 w-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">Muayene kaydı bulunmuyor</p>
                      <p className="text-xs text-slate-400 mt-1">Düzenleme modunda muayene ekleyebilirsiniz</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {person.medicalExams!.map((exam) => (
                        <div key={exam.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">{exam.type}</p>
                              <p className="text-sm text-slate-500 mt-0.5">{new Date(exam.date).toLocaleDateString('tr-TR')}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                              exam.result === 'Normal' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                              'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            }`}>
                              {exam.result}
                            </span>
                          </div>
                          {exam.nextExamDate && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200 dark:border-slate-600">
                              <Clock className="h-3.5 w-3.5 text-amber-500" />
                              <span className="text-xs text-amber-600 dark:text-amber-400">
                                Sonraki: {new Date(exam.nextExamDate).toLocaleDateString('tr-TR')}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        );

      // ─── CERTS ────────────────────────────────────────────────────────
      case 'certs':
        return (
          <div className="space-y-5">
            <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <Award className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sertifikalar</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Eğitim ve yetkinlik belgeleri</p>
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  Sertifika Ekle
                </h3>
                <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                  <div className="flex gap-3">
                    <Input
                      className={inputClass}
                      placeholder="Örn: İSG Eğitimi, Forklift Sertifikası, İlk Yardım..."
                      value={newCert}
                      onChange={e => setNewCert(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCert(); } }}
                    />
                    <Button type="button" onClick={addCert} className="shrink-0 px-5 gap-2">
                      <Plus className="h-4 w-4" /> Ekle
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <ClipboardList className="h-3.5 w-3.5" />
                Mevcut Sertifikalar ({(isEditing ? editData.certifications : person.certifications || [])?.length || 0})
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                {((isEditing ? editData.certifications : person.certifications) || []).length === 0 ? (
                  <div className="text-center py-8">
                    <Award className="h-10 w-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">Sertifika kaydı bulunmuyor</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {((isEditing ? editData.certifications : person.certifications) || []).map((cert, idx) => (
                      <div key={idx} className="group flex items-center justify-between bg-gradient-to-r from-white to-slate-50 dark:from-slate-700 dark:to-slate-700/50 rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-600 hover:shadow-md transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0 shadow-sm">
                            <Award className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{cert}</span>
                        </div>
                        {isEditing && (
                          <button onClick={() => removeCert(idx)}
                            className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-60 group-hover:opacity-100">
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      // ─── INCIDENTS ────────────────────────────────────────────────────
      case 'incidents':
        return (
          <div className="space-y-5">
            <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center">
                  <AlertCircle className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Olaylar & Kazalar</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Bu personele ait iş kazası ve olay kayıtları</p>
                </div>
              </div>
            </div>

            <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              {personIncidents.length === 0 ? (
                <div className="text-center py-10">
                  <AlertCircle className="h-10 w-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Olay kaydı bulunmuyor</p>
                  <p className="text-xs text-slate-500 mt-1">Bu personele ait herhangi bir olay veya kaza kaydı yok</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {personIncidents.map(incident => (
                    <div key={incident.id} className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 hover:shadow-md transition-all">
                      <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${
                        incident.severity === 'Kritik' ? 'bg-red-500' :
                        incident.severity === 'Yüksek' ? 'bg-orange-500' :
                        incident.severity === 'Orta' ? 'bg-amber-500' : 'bg-green-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-900 dark:text-white">{incident.title}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(incident.date).toLocaleDateString('tr-TR')}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            incident.severity === 'Kritik' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            incident.severity === 'Yüksek' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                            incident.severity === 'Orta' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                            {incident.severity}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            incident.status === 'Kapalı' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' :
                            incident.status === 'İnceleniyor' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          }`}>
                            {incident.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      // ─── TRAININGS ────────────────────────────────────────────────────
      case 'trainings':
        return (
          <div className="space-y-5">
            <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <ClipboardList className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Eğitimler</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Bu personelin katıldığı eğitimler</p>
                </div>
              </div>
            </div>

            <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              {personTrainings.length === 0 ? (
                <div className="text-center py-10">
                  <ClipboardList className="h-10 w-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Eğitim kaydı bulunmuyor</p>
                  <p className="text-xs text-slate-500 mt-1">Bu personele ait herhangi bir eğitim kaydı yok</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {personTrainings.map(training => (
                    <div key={training.id} className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 hover:shadow-md transition-all">
                      <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${
                        training.status === 'Tamamlandı' ? 'bg-emerald-500' :
                        training.status === 'İptal' ? 'bg-red-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-900 dark:text-white">{training.title}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(training.date).toLocaleDateString('tr-TR')} — {training.duration} saat — Eğitmen: {training.trainer}
                        </p>
                        <div className="mt-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            training.status === 'Tamamlandı' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            training.status === 'İptal' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                            {training.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      // ─── ACCOUNT ──────────────────────────────────────────────────────
      case 'account':
        return (
          <div className="space-y-5">
            <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center">
                  <Key className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sistem Hesabı</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Personelin uygulamaya giriş bilgileri</p>
                </div>
              </div>
            </div>

            <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              {linkedUser ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { icon: Mail, label: 'E-posta', value: linkedUser.email },
                      { icon: User, label: 'Rol', value: linkedUser.role },
                      { icon: Calendar, label: 'Oluşturulma', value: new Date(linkedUser.createdAt).toLocaleDateString('tr-TR') },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                          <item.icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.value}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                        <UserCheck className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Durum</p>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          linkedUser.isEmailVerified
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {linkedUser.isEmailVerified ? 'Aktif' : 'Pasif'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-3">
                    <Button variant="secondary" onClick={handleResetPassword} className="gap-2">
                      <Key className="h-4 w-4" /> Şifre Sıfırla
                    </Button>
                    <Button variant="secondary" onClick={handleToggleUserStatus} className="gap-2">
                      {linkedUser.isEmailVerified ? (
                        <><Lock className="h-4 w-4" /> Hesabı Pasifleştir</>
                      ) : (
                        <><Unlock className="h-4 w-4" /> Hesabı Aktifleştir</>
                      )}
                    </Button>
                    <Button variant="danger" onClick={handleDeleteUser} className="gap-2">
                      <Trash2 className="h-4 w-4" /> Hesabı Sil
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <Key className="h-10 w-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Sistem hesabı oluşturulmamış</p>
                  <p className="text-xs text-slate-500 mt-1">Yeni personel eklerken "Sistem Hesabı" adımından hesap oluşturabilirsiniz</p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <PageTransition>
      <div className="flex h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 -mx-4 -my-4">
        {/* ─── SIDEBAR ─── */}
        <div className="hidden lg:flex flex-col w-[320px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 overflow-y-auto shrink-0">
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="p-6 pb-5">
              <div className="flex items-center gap-3 mb-4">
                <Avatar person={person} size="lg" />
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">{person.firstName} {person.lastName}</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{person.role}</p>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${STATUS_COLORS[status]}`}>
                  {status}
                </span>
                {person.class && (
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${CLASS_COLORS[person.class]}`}>
                    {person.class} Sınıfı
                  </span>
                )}
                {person.bloodType && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    {person.bloodType}
                  </span>
                )}
              </div>

              {/* Quick Info */}
              <div className="space-y-2">
                {company && (
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{company.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{person.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{person.phone}</span>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="flex-1 px-4 py-2 space-y-1">
              {ALL_SECTIONS.map(section => (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className="w-full text-left transition-all"
                >
                  <SidebarMenuItem
                    section={section}
                    active={activeSection === section}
                    badge={getBadge(section)}
                  />
                </button>
              ))}
            </div>

            {/* Sidebar Footer: Actions */}
            <div className="p-4 pt-3 border-t border-slate-200 dark:border-slate-700 mt-auto space-y-2">
              {linkedUser && (
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Sistem Hesabı</span>
                    <span className={`ml-auto px-2 py-0.5 rounded text-[10px] font-bold ${
                      linkedUser.isEmailVerified
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {linkedUser.isEmailVerified ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── CONTENT ─── */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Mobile Header + Section Nav */}
          <div className="lg:hidden shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 pt-4 pb-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Avatar person={person} size="sm" />
                <div>
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white">{person.firstName} {person.lastName}</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{person.role}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
              {ALL_SECTIONS.map(section => {
                const Icon = SECTION_ICONS[section];
                return (
                  <button key={section} onClick={() => setActiveSection(section)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      activeSection === section ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                      activeSection === section ? `bg-gradient-to-br ${SECTION_COLORS[section]} text-white shadow-sm`
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                      <Icon className="h-3 w-3" />
                    </span>
                    <span className="hidden sm:inline">{SECTION_LABELS[section]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable Main Content */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="max-w-4xl mx-auto w-full">
              {renderSectionContent()}
            </div>
          </div>

          {/* Fixed Bottom Bar */}
          <div className="shrink-0 border-t border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-4 lg:px-6 py-3">
            <div className="max-w-4xl mx-auto w-full flex justify-between items-center gap-3">
              <Button variant="ghost" onClick={() => navigate('/personnel')} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Geri
              </Button>

              <div className="flex items-center gap-3">
                {isEditing ? (
                  <>
                    <Button variant="ghost" onClick={cancelEditing} className="gap-2">
                      <X className="h-4 w-4" /> İptal
                    </Button>
                    <Button onClick={saveChanges} className="gap-2 px-6">
                      <Check className="h-4 w-4" /> Kaydet
                    </Button>
                  </>
                ) : (
                  <>
                    {canEdit && (
                      <>
                        <Button variant="danger" onClick={handleDelete} className="gap-2">
                          <Trash2 className="h-4 w-4" /> Sil
                        </Button>
                        <Button variant="secondary" onClick={startEditing} className="gap-2 px-6">
                          <Edit2 className="h-4 w-4" /> Düzenle
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};
