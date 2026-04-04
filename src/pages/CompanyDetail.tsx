import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PageTransition } from '../components/layout/PageTransition';
import {
  ArrowLeft, Save, Building2, Phone, Mail, MapPin, Calendar, Users,
  Edit2, Trash2, X, Plus, Check, User, AlertCircle, ClipboardList,
  Shield, Key, Info, Briefcase, Award, Heart, TrendingUp
} from 'lucide-react';
import { Company } from '../types';
import toast from 'react-hot-toast';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const SECTOR_COLORS: Record<string, string> = {
  'İnşaat': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'Lojistik': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'Lojistik & Taşımacılık': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'Sanayi/Üretim': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'Enerji': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  'Sağlık': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  'Gıda': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'Teknoloji': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
};

const selectClass =
  'flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 transition-all';

const inputClass =
  'flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 transition-all';

type DetailSection = 'overview' | 'contact' | 'locations' | 'personnel' | 'incidents' | 'stats';

// ─── SECTION CONFIG ───────────────────────────────────────────────────────────
const SECTION_ICONS: Record<DetailSection, React.ElementType> = {
  overview: Building2,
  contact: Phone,
  locations: MapPin,
  personnel: Users,
  incidents: AlertCircle,
  stats: TrendingUp,
};

const SECTION_COLORS: Record<DetailSection, string> = {
  overview: 'from-indigo-500 to-purple-600',
  contact: 'from-blue-500 to-cyan-600',
  locations: 'from-emerald-500 to-teal-600',
  personnel: 'from-orange-500 to-pink-600',
  incidents: 'from-red-500 to-rose-600',
  stats: 'from-violet-500 to-purple-600',
};

const SECTION_LABELS: Record<DetailSection, string> = {
  overview: 'Firma Bilgileri',
  contact: 'İletişim & Adres',
  locations: 'Lokasyonlar',
  personnel: 'Personeller',
  incidents: 'Olaylar & Kazalar',
  stats: 'İstatistikler',
};

const ALL_SECTIONS: DetailSection[] = ['overview', 'contact', 'locations', 'personnel', 'incidents', 'stats'];

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

// ─── SIDEBAR MENU ITEM ────────────────────────────────────────────────────────
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
export const CompanyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { companies, updateCompany, deleteCompany, personnel, incidents, trainings, sectors, locationDefinitions } = useStore();

  const company = companies.find(c => c.id === id);

  const [activeSection, setActiveSection] = useState<DetailSection>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Company>>({});
  const [newLocation, setNewLocation] = useState('');

  // Related data
  const companyPersonnel = useMemo(() =>
    company ? personnel.filter(p => p.assignedCompanyId === company.id) : [], [company, personnel]
  );

  const companyIncidents = useMemo(() =>
    company ? incidents.filter(i => i.companyId === company.id) : [], [company, incidents]
  );

  const companyTrainings = useMemo(() => {
    if (!company) return [];
    const personnelIds = companyPersonnel.map(p => p.id);
    return trainings.filter(t => t.participants?.some(pid => personnelIds.includes(pid)));
  }, [company, companyPersonnel, trainings]);

  // Statistics
  const companyStats = useMemo(() => {
    if (!company) return { activePersonnel: 0, totalIncidents: 0, openIncidents: 0, completedTrainings: 0 };
    return {
      activePersonnel: companyPersonnel.filter(p => !p.status || p.status === 'Aktif').length,
      totalIncidents: companyIncidents.length,
      openIncidents: companyIncidents.filter(i => i.status !== 'Kapalı').length,
      completedTrainings: companyTrainings.filter(t => t.status === 'Tamamlandı').length,
    };
  }, [company, companyPersonnel, companyIncidents, companyTrainings]);

  if (!company) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <Building2 className="h-16 w-16 text-slate-300 dark:text-slate-600" />
          <h2 className="text-xl font-bold text-slate-600 dark:text-slate-400">Firma bulunamadı</h2>
          <Button onClick={() => navigate('/companies')} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Firma Listesine Dön
          </Button>
        </div>
      </PageTransition>
    );
  }

  const getSectorColor = (sector: string) => {
    return SECTOR_COLORS[sector] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  };

  // Edit handlers
  const startEditing = () => {
    setEditData({ ...company });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditData({});
    setIsEditing(false);
  };

  const saveChanges = () => {
    if (!editData.name?.trim()) {
      toast.error('Firma adı zorunludur.');
      return;
    }
    if (!editData.sector) {
      toast.error('Sektör seçilmelidir.');
      return;
    }
    if (!editData.contactPerson?.trim()) {
      toast.error('Yetkili kişi adı zorunludur.');
      return;
    }
    if (!editData.phone?.trim() || !editData.email?.trim()) {
      toast.error('İletişim bilgileri zorunludur.');
      return;
    }
    updateCompany(editData as Company);
    toast.success('Firma bilgileri güncellendi.');
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Bu firmayı kalıcı olarak silmek istediğinize emin misiniz?')) {
      deleteCompany(company.id);
      toast.success('Firma silindi.');
      navigate('/companies');
    }
  };

  const addLocation = () => {
    if (!newLocation.trim()) return;
    const locations = editData.locations || [];
    if (!locations.includes(newLocation.trim())) {
      setEditData(d => ({ ...d, locations: [...locations, newLocation.trim()] }));
      setNewLocation('');
    } else {
      toast.error('Bu lokasyon zaten eklenmiş.');
    }
  };

  const removeLocation = (idx: number) => {
    setEditData(d => ({ ...d, locations: (d.locations || []).filter((_, i) => i !== idx) }));
  };

  // Get badges for sidebar
  const getBadge = (section: DetailSection): number | undefined => {
    switch (section) {
      case 'locations': return (company.locations || []).length || undefined;
      case 'personnel': return companyPersonnel.length || undefined;
      case 'incidents': return companyIncidents.length || undefined;
      default: return undefined;
    }
  };

  // ─── RENDER SECTION CONTENT ─────────────────────────────────────────────────
  const renderSectionContent = () => {
    switch (activeSection) {
      // ─── OVERVIEW ─────────────────────────────────────────────────────
      case 'overview':
        return (
          <div className="space-y-5">
            <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Building2 className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Firma Bilgileri</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Temel firma bilgileri ve sektör</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5" />
                Temel Bilgiler
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Firma Adı <span className="text-red-500">*</span></label>
                      <Input className={inputClass} value={editData.name || ''} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} placeholder="Firma adını giriniz" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sektör <span className="text-red-500">*</span></label>
                      <select className={selectClass} value={editData.sector || ''} onChange={e => setEditData(d => ({ ...d, sector: e.target.value }))}>
                        <option value="">Sektör Seçiniz</option>
                        {sectors.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Yetkili Kişi <span className="text-red-500">*</span></label>
                      <Input className={inputClass} value={editData.contactPerson || ''} onChange={e => setEditData(d => ({ ...d, contactPerson: e.target.value }))} />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { icon: Building2, label: 'Firma Adı', value: company.name },
                      { icon: Briefcase, label: 'Sektör', value: company.sector, badge: true },
                      { icon: User, label: 'Yetkili Kişi', value: company.contactPerson },
                      { icon: Calendar, label: 'Kayıt Tarihi', value: new Date(company.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }) },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                          <item.icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
                          {item.badge ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold ${getSectorColor(company.sector)}`}>
                              {item.value}
                            </span>
                          ) : (
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.value}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5" />
                Özet Bilgiler
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800 text-center">
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{companyPersonnel.length}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Personel</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 text-center">
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{(company.locations || []).length}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Lokasyon</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-pink-50 dark:from-orange-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800 text-center">
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{companyIncidents.length}</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Olay</p>
                </div>
                <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-violet-200 dark:border-violet-800 text-center">
                  <p className="text-2xl font-bold text-violet-700 dark:text-violet-300">{companyTrainings.length}</p>
                  <p className="text-xs text-violet-600 dark:text-violet-400 mt-1">Eğitim</p>
                </div>
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
                  <p className="text-xs text-slate-500 dark:text-slate-400">Telefon, e-posta ve adres bilgileri</p>
                </div>
              </div>
            </div>

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
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { icon: Phone, label: 'Telefon', value: company.phone },
                      { icon: Mail, label: 'E-posta', value: company.email },
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
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" />
                Adres Bilgileri
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                {isEditing ? (
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" /> Firma Adresi <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      className="flex w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 resize-none transition-all"
                      value={editData.address || ''}
                      onChange={e => setEditData(d => ({ ...d, address: e.target.value }))}
                    />
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Adres</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{company.address || '—'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      // ─── LOCATIONS ────────────────────────────────────────────────────
      case 'locations':
        return (
          <div className="space-y-5">
            <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <MapPin className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Lokasyonlar</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Firma şubeleri ve iş yerleri</p>
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  Lokasyon Ekle
                </h3>
                <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                  <div className="flex gap-3">
                    <Input
                      className={inputClass}
                      placeholder="Örn: A Şubesi, İstanbul Şantiyesi, Ankara Ofis..."
                      value={newLocation}
                      onChange={e => setNewLocation(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLocation(); } }}
                    />
                    <Button type="button" onClick={addLocation} className="shrink-0 px-5 gap-2">
                      <Plus className="h-4 w-4" /> Ekle
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-2">
                    <Info className="h-3.5 w-3.5" />
                    Enter tuşuna basarak veya Ekle butonuna tıklayarak lokasyon ekleyebilirsiniz
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <ClipboardList className="h-3.5 w-3.5" />
                Lokasyon Listesi ({(isEditing ? editData.locations : company.locations || [])?.length || 0})
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                {((isEditing ? editData.locations : company.locations) || []).length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                    <MapPin className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Henüz lokasyon eklenmemiş</p>
                    <p className="text-xs text-slate-500 mt-1">Düzenleme modunda lokasyon ekleyebilirsiniz</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {((isEditing ? editData.locations : company.locations) || []).map((location, idx) => (
                      <div key={idx} className="group flex items-center justify-between bg-gradient-to-r from-white to-slate-50 dark:from-slate-700 dark:to-slate-700/50 rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-600 hover:shadow-md transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-sm">
                            <MapPin className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">{location}</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">#{idx + 1}</span>
                          </div>
                        </div>
                        {isEditing && (
                          <button onClick={() => removeLocation(idx)}
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

      // ─── PERSONNEL ────────────────────────────────────────────────────
      case 'personnel':
        return (
          <div className="space-y-5">
            <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center">
                  <Users className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Personeller</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Bu firmaya atanmış personeller</p>
                </div>
              </div>
            </div>

            <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              {companyPersonnel.length === 0 ? (
                <div className="text-center py-10">
                  <Users className="h-10 w-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Personel bulunmuyor</p>
                  <p className="text-xs text-slate-500 mt-1">Bu firmaya atanmış personel yok</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {companyPersonnel.map(person => {
                    const personStatus = person.status || 'Aktif';
                    const statusColor = personStatus === 'Aktif'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : personStatus === 'Pasif'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';

                    return (
                      <div
                        key={person.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => navigate(`/personnel/${person.id}`)}
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {person.firstName[0]}{person.lastName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {person.firstName} {person.lastName}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{person.role}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${statusColor}`}>
                            {personStatus}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Personnel Summary */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Personel Özeti</p>
                  <p className="text-blue-700 dark:text-blue-300">
                    Toplam {companyPersonnel.length} personel, {companyStats.activePersonnel} aktif.
                    Personel detayına tıklayarak bilgilere ulaşabilirsiniz.
                  </p>
                </div>
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
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                  <AlertCircle className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Olaylar & Kazalar</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Bu firmaya ait iş kazası ve olay kayıtları</p>
                </div>
              </div>
            </div>

            <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              {companyIncidents.length === 0 ? (
                <div className="text-center py-10">
                  <AlertCircle className="h-10 w-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Olay kaydı bulunmuyor</p>
                  <p className="text-xs text-slate-500 mt-1">Bu firmaya ait herhangi bir olay veya kaza kaydı yok</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {companyIncidents.map(incident => {
                    const incidentPerson = personnel.find(p => p.id === incident.personnelId);
                    return (
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
                            {incidentPerson && ` — ${incidentPerson.firstName} ${incidentPerson.lastName}`}
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
                            {incident.type && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                {incident.type}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {companyStats.openIncidents > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-semibold">Açık Olaylar</p>
                    <p className="text-amber-700 dark:text-amber-300">{companyStats.openIncidents} adet açık/incelenmekte olan olay bulunuyor.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      // ─── STATS ────────────────────────────────────────────────────────
      case 'stats':
        return (
          <div className="space-y-5">
            <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <TrendingUp className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">İstatistikler</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Firma bazlı özet istatistikler</p>
                </div>
              </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-5 text-white shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Users className="h-6 w-6" />
                  </div>
                </div>
                <p className="text-3xl font-bold mb-1">{companyPersonnel.length}</p>
                <p className="text-sm text-white/80">Toplam Personel</p>
                <p className="text-xs text-white/60 mt-1">{companyStats.activePersonnel} aktif</p>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <MapPin className="h-6 w-6" />
                  </div>
                </div>
                <p className="text-3xl font-bold mb-1">{(company.locations || []).length}</p>
                <p className="text-sm text-white/80">Lokasyon</p>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-pink-600 rounded-2xl p-5 text-white shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                </div>
                <p className="text-3xl font-bold mb-1">{companyIncidents.length}</p>
                <p className="text-sm text-white/80">Toplam Olay</p>
                {companyStats.openIncidents > 0 && (
                  <p className="text-xs text-white/60 mt-1">{companyStats.openIncidents} açık</p>
                )}
              </div>

              <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <ClipboardList className="h-6 w-6" />
                  </div>
                </div>
                <p className="text-3xl font-bold mb-1">{companyTrainings.length}</p>
                <p className="text-sm text-white/80">Toplam Eğitim</p>
                <p className="text-xs text-white/60 mt-1">{companyStats.completedTrainings} tamamlandı</p>
              </div>
            </div>

            {/* Training List */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <ClipboardList className="h-3.5 w-3.5" />
                Son Eğitimler
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                {companyTrainings.length === 0 ? (
                  <div className="text-center py-6">
                    <ClipboardList className="h-10 w-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm text-slate-500">Eğitim kaydı bulunmuyor</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {companyTrainings.slice(0, 5).map(training => (
                      <div key={training.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                        <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${
                          training.status === 'Tamamlandı' ? 'bg-emerald-500' :
                          training.status === 'İptal' ? 'bg-red-500' : 'bg-blue-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-900 dark:text-white">{training.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {new Date(training.date).toLocaleDateString('tr-TR')} — {training.duration} saat — {training.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                <CompanyIcon name={company.name} size="lg" />
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">{company.name}</h1>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${getSectorColor(company.sector)}`}>
                    {company.sector}
                  </span>
                </div>
              </div>

              {/* Quick Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{company.contactPerson}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{company.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{company.email}</span>
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

            {/* Sidebar Footer: Quick Stats */}
            <div className="p-4 pt-3 border-t border-slate-200 dark:border-slate-700 mt-auto">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-widest">Firma Özeti</p>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{companyPersonnel.length}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Personel</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{(company.locations || []).length}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Lokasyon</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{companyIncidents.length}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Olay</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{companyTrainings.length}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Eğitim</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── CONTENT ─── */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Mobile Header + Section Nav */}
          <div className="lg:hidden shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 pt-4 pb-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <CompanyIcon name={company.name} size="sm" />
                <div>
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white">{company.name}</h1>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${getSectorColor(company.sector)}`}>
                    {company.sector}
                  </span>
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
              <Button variant="ghost" onClick={() => navigate('/companies')} className="gap-2">
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
                    <Button variant="danger" onClick={handleDelete} className="gap-2">
                      <Trash2 className="h-4 w-4" /> Sil
                    </Button>
                    <Button variant="secondary" onClick={startEditing} className="gap-2 px-6">
                      <Edit2 className="h-4 w-4" /> Düzenle
                    </Button>
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
