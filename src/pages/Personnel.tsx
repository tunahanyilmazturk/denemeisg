import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { DataTable } from '../components/ui/DataTable';
import { Modal } from '../components/ui/Modal';
import { useDataTable } from '../hooks/useDataTable';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';
import {
  Plus, Download, FileText, Search, Trash2, Filter, X,
  User, Phone, Mail, Calendar, Building2,
  Users, UserCheck, UserX, Clock, List, Eye, TrendingUp,
  CheckSquare, Square, LayoutGrid, AlertCircle, Award, ChevronLeft, ChevronRight,
  Shield, Heart, Briefcase
} from 'lucide-react';
import { Personnel, PersonnelClass, PersonnelStatus } from '../types';
import toast from 'react-hot-toast';
import { PageTransition } from '../components/layout/PageTransition';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CLASSES: PersonnelClass[] = ['A', 'B', 'C'];
const STATUSES: PersonnelStatus[] = ['Aktif', 'Pasif', 'İstifa Etti'];

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

type ViewMode = 'table' | 'card';

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
  const sizeClass = size === 'sm' ? 'w-9 h-9 text-sm' : size === 'lg' ? 'w-16 h-16 text-2xl' : 'w-11 h-11 text-base';

  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center text-white font-bold shrink-0`}>
      {initials}
    </div>
  );
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export const PersonnelPage = () => {
  const navigate = useNavigate();
  const { personnel, companies, deletePersonnel, incidents, trainings } = useStore();

  const [showFilters, setShowFilters] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>(window.innerWidth < 1024 ? 'card' : 'table');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<string | null>(null);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

  const {
    sortConfig,
    handleSort,
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    clearFilters,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
  } = useDataTable<Personnel>({
    data: personnel,
    initialSort: { key: 'firstName', direction: 'asc' },
    initialPageSize: 10,
  });

  // Custom filter values
  const filterCompany = filters.company || '';
  const filterStatus = filters.status || '';
  const filterClass = filters.class || '';
  const filterRole = filters.role || '';

  // Get unique roles for filter
  const uniqueRoles = useMemo(() => {
    const roles = new Set<string>();
    personnel.forEach(p => { if (p.role) roles.add(p.role); });
    return Array.from(roles).sort();
  }, [personnel]);

  // Filtered personnel (manual filtering to avoid double-filter bug)
  const filtered = useMemo(() => {
    let result = [...personnel];

    // Apply search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(p =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.tcNo.includes(q) ||
        (p.email?.toLowerCase().includes(q)) ||
        (p.phone?.includes(q))
      );
    }

    // Apply filters
    if (filterCompany) result = result.filter(p => p.assignedCompanyId === filterCompany);
    if (filterStatus) result = result.filter(p => (p.status || 'Aktif') === filterStatus);
    if (filterClass) result = result.filter(p => p.class === filterClass);
    if (filterRole) result = result.filter(p => p.role === filterRole);

    return result;
  }, [personnel, searchTerm, filterCompany, filterStatus, filterClass, filterRole]);

  // Pagination
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const displayedPersonnel = filtered.slice(startIndex, endIndex);

  // Per-personnel stats
  const personnelStats = useMemo(() => {
    const statsMap = new Map<string, { incidentCount: number; trainingCount: number }>();
    personnel.forEach(person => {
      const incidentCount = incidents.filter(i => i.personnelId === person.id).length;
      const trainingCount = trainings.filter(t => t.participants?.includes(person.id)).length;
      statsMap.set(person.id, { incidentCount, trainingCount });
    });
    return statsMap;
  }, [personnel, incidents, trainings]);

  // Summary stats
  const stats = useMemo(() => ({
    total: personnel.length,
    active: personnel.filter(p => !p.status || p.status === 'Aktif').length,
    passive: personnel.filter(p => p.status === 'Pasif').length,
    resigned: personnel.filter(p => p.status === 'İstifa Etti').length,
  }), [personnel]);

  // ── handlers ──
  const handleDelete = (id: string) => {
    setPersonToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (personToDelete) {
      deletePersonnel(personToDelete);
      toast.success('Personel silindi.');
      setDeleteModalOpen(false);
      setPersonToDelete(null);
    }
  };

  const toggleSelectPerson = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newSelected = new Set(selectedPersonnel);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPersonnel(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedPersonnel.size === displayedPersonnel.length) {
      setSelectedPersonnel(new Set());
    } else {
      setSelectedPersonnel(new Set(displayedPersonnel.map(p => p.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedPersonnel.size === 0) {
      toast.error('Lütfen silmek için personel seçiniz.');
      return;
    }
    setBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = () => {
    selectedPersonnel.forEach(id => deletePersonnel(id));
    const count = selectedPersonnel.size;
    setSelectedPersonnel(new Set());
    setBulkDeleteModalOpen(false);
    toast.success(`${count} personel başarıyla silindi.`);
  };

  const handleExportPDF = () => {
    exportToPDF(
      'Personel Listesi',
      ['Ad Soyad', 'TC No', 'Görev', 'Durum', 'Sınıf', 'Firma', 'Telefon', 'Olay', 'Eğitim'],
      filtered.map(p => {
        const pStats = personnelStats.get(p.id) || { incidentCount: 0, trainingCount: 0 };
        return [
          `${p.firstName} ${p.lastName}`,
          p.tcNo,
          p.role,
          p.status || 'Aktif',
          p.class || '-',
          companies.find(c => c.id === p.assignedCompanyId)?.name || '-',
          p.phone,
          pStats.incidentCount.toString(),
          pStats.trainingCount.toString(),
        ];
      }),
      'personeller'
    );
    toast.success('PDF indirildi.');
  };

  const handleExportExcel = () => {
    exportToExcel(
      filtered.map(p => {
        const pStats = personnelStats.get(p.id) || { incidentCount: 0, trainingCount: 0 };
        return {
          'Ad': p.firstName, 'Soyad': p.lastName,
          'TC No': p.tcNo, 'Görev': p.role,
          'Durum': p.status || 'Aktif',
          'Sınıf': p.class || '-',
          'Firma': companies.find(c => c.id === p.assignedCompanyId)?.name || '-',
          'Telefon': p.phone, 'E-posta': p.email,
          'Başlama': p.startDate ? new Date(p.startDate).toLocaleDateString('tr-TR') : '-',
          'Kan Grubu': p.bloodType || '-',
          'Olay Sayısı': pStats.incidentCount,
          'Eğitim Sayısı': pStats.trainingCount,
          'Sertifikalar': (p.certifications || []).join(', ') || '-',
        };
      }),
      'personeller'
    );
    toast.success('Excel indirildi.');
  };

  const hasFilters = searchTerm || filterCompany || filterStatus || filterClass || filterRole;

  // DataTable columns
  const columns = [
    {
      key: 'select',
      header: () => (
        <button onClick={toggleSelectAll} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors">
          {selectedPersonnel.size === displayedPersonnel.length && displayedPersonnel.length > 0 ? (
            <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          ) : (
            <Square className="h-4 w-4 text-slate-400" />
          )}
        </button>
      ),
      width: '40px',
      render: (p: Personnel) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSelectPerson(p.id, e);
          }}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
        >
          {selectedPersonnel.has(p.id) ? (
            <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          ) : (
            <Square className="h-4 w-4 text-slate-400" />
          )}
        </button>
      ),
    },
    {
      key: 'name',
      header: 'Ad Soyad',
      sortable: true,
      render: (p: Personnel) => (
        <div className="flex items-center gap-3">
          <Avatar person={p} size="sm" />
          <div>
            <div className="font-medium text-slate-900 dark:text-white">{p.firstName} {p.lastName}</div>
            <div className="text-xs text-slate-500">{p.role}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Durum',
      sortable: true,
      render: (p: Personnel) => {
        const status = p.status || 'Aktif';
        return (
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${STATUS_COLORS[status]}`}>
              {status}
            </span>
            {p.class && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold ${CLASS_COLORS[p.class]}`}>
                {p.class}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'assignedCompanyId',
      header: 'Firma',
      render: (p: Personnel) => {
        const company = companies.find(c => c.id === p.assignedCompanyId);
        return company ? (
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-sm text-slate-600 dark:text-slate-400">{company.name}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        );
      },
    },
    {
      key: 'phone',
      header: 'İletişim',
      render: (p: Personnel) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <Phone className="h-3 w-3 text-slate-400" />
            <span className="text-sm text-slate-900 dark:text-white">{p.phone}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Mail className="h-3 w-3 text-slate-400" />
            <span className="text-xs text-slate-500 dark:text-slate-400">{p.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'stats',
      header: 'İstatistikler',
      render: (p: Personnel) => {
        const pStats = personnelStats.get(p.id) || { incidentCount: 0, trainingCount: 0 };
        return (
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5" title="Olaylar">
              <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {pStats.incidentCount}
              </span>
            </div>
            <div className="flex items-center gap-1.5" title="Eğitimler">
              <Award className="h-3.5 w-3.5 text-violet-500" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {pStats.trainingCount}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'startDate',
      header: 'İşe Başlama',
      sortable: true,
      render: (p: Personnel) => (
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
          <Calendar className="h-3.5 w-3.5" />
          <span className="text-sm">{p.startDate ? new Date(p.startDate).toLocaleDateString('tr-TR') : '—'}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'İşlemler',
      width: '100px',
      render: (p: Personnel) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/personnel/${p.id}`);
            }}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg dark:text-indigo-400 dark:hover:bg-indigo-900/30 transition-colors"
            title="Detayları Gör"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(p.id);
            }}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
            title="Sil"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-5">

        {/* ─── STAT CARDS ─── */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Users className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 opacity-70 hidden sm:block" />
            </div>
            <p className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1">{stats.total}</p>
            <p className="text-xs sm:text-sm text-white/80">Toplam Personel</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <UserCheck className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 opacity-70 hidden sm:block" />
            </div>
            <p className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1">{stats.active}</p>
            <p className="text-xs sm:text-sm text-white/80">Aktif</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Clock className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 opacity-70 hidden sm:block" />
            </div>
            <p className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1">{stats.passive}</p>
            <p className="text-xs sm:text-sm text-white/80">Pasif</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <UserX className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 opacity-70 hidden sm:block" />
            </div>
            <p className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1">{stats.resigned}</p>
            <p className="text-xs sm:text-sm text-white/80">İstifa Etti</p>
          </div>
        </div>

        {/* ─── HEADER ─── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">Personeller</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-lg">Çalışan kayıtlarını yönetin.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Tablo Görünümü"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'card'
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Kart Görünümü"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>

            <Button variant="secondary" onClick={handleExportExcel} className="gap-2">
              <Download className="h-4 w-4" /> Excel
            </Button>
            <Button variant="secondary" onClick={handleExportPDF} className="gap-2">
              <FileText className="h-4 w-4" /> PDF
            </Button>
            <Button onClick={() => navigate('/personnel/new')} className="gap-2">
              <Plus className="h-4 w-4" /> Yeni Personel
            </Button>
          </div>
        </div>

        {/* ─── SEARCH & FILTERS ─── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="İsim, TC, görev, e-posta veya telefon ara..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="ghost"
                onClick={() => setShowFilters(!showFilters)}
                className={`gap-2 ${showFilters ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
              >
                <Filter className="h-4 w-4" /> Filtreler
                {hasFilters && <span className="w-2 h-2 rounded-full bg-indigo-500" />}
              </Button>
              {hasFilters && (
                <Button variant="ghost" onClick={clearFilters} className="gap-2 text-slate-500">
                  <X className="h-4 w-4" /> Temizle
                </Button>
              )}
              {selectedPersonnel.size > 0 && (
                <Button variant="danger" onClick={handleBulkDelete} className="gap-2">
                  <Trash2 className="h-4 w-4" /> Seçilileri Sil ({selectedPersonnel.size})
                </Button>
              )}
            </div>
          </div>
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> Firma
                </label>
                <select className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  value={filterCompany} onChange={e => { setFilter('company', e.target.value); setCurrentPage(1); }}>
                  <option value="">Tüm Firmalar</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5" /> Durum
                </label>
                <select className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  value={filterStatus} onChange={e => { setFilter('status', e.target.value); setCurrentPage(1); }}>
                  <option value="">Tüm Durumlar</option>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" /> Sınıf
                </label>
                <select className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  value={filterClass} onChange={e => { setFilter('class', e.target.value); setCurrentPage(1); }}>
                  <option value="">Tüm Sınıflar</option>
                  {CLASSES.map(c => <option key={c} value={c}>{c} Sınıfı</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" /> Görev
                </label>
                <select className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  value={filterRole} onChange={e => { setFilter('role', e.target.value); setCurrentPage(1); }}>
                  <option value="">Tüm Görevler</option>
                  {uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ─── DATA DISPLAY ─── */}
        {viewMode === 'table' ? (
          <DataTable
            data={displayedPersonnel}
            columns={columns}
            sortConfig={sortConfig}
            onSort={handleSort}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            totalItems={totalItems}
            startIndex={startIndex}
            endIndex={endIndex}
            keyExtractor={(p) => p.id}
            emptyMessage="Personel bulunamadı."
            onRowClick={(p) => navigate(`/personnel/${p.id}`)}
          />
        ) : (
          <>
            {/* Card View */}
            <div className="bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-2xl rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-6">
              {displayedPersonnel.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-lg font-semibold text-slate-600 dark:text-slate-400">Personel bulunamadı.</p>
                  <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Yeni personel eklemek için yukarıdaki butonu kullanın.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedPersonnel.map((person) => {
                    const pStats = personnelStats.get(person.id) || { incidentCount: 0, trainingCount: 0 };
                    const isSelected = selectedPersonnel.has(person.id);
                    const status = person.status || 'Aktif';
                    const company = companies.find(c => c.id === person.assignedCompanyId);

                    return (
                      <div
                        key={person.id}
                        className={`group relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/50 rounded-2xl p-5 border-2 transition-all cursor-pointer hover:shadow-xl ${
                          isSelected
                            ? 'border-indigo-500 dark:border-indigo-400 shadow-lg shadow-indigo-500/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                        }`}
                        onClick={() => navigate(`/personnel/${person.id}`)}
                      >
                        {/* Selection Checkbox */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectPerson(person.id, e);
                          }}
                          className="absolute top-3 right-3 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors z-10"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          ) : (
                            <Square className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
                          )}
                        </button>

                        {/* Person Info */}
                        <div className="flex items-start gap-4 mb-4">
                          <Avatar person={person} size="lg" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate mb-1">
                              {person.firstName} {person.lastName}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{person.role}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${STATUS_COLORS[status]}`}>
                                {status}
                              </span>
                              {person.class && (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold ${CLASS_COLORS[person.class]}`}>
                                  {person.class} Sınıfı
                                </span>
                              )}
                              {person.bloodType && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                  <Heart className="h-3 w-3" />
                                  {person.bloodType}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Contact & Company */}
                        <div className="space-y-2 mb-4">
                          {company && (
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                              <span className="truncate">{company.name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                            <span>{person.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                            <span className="truncate">{person.email}</span>
                          </div>
                          {person.startDate && (
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                              <span>{new Date(person.startDate).toLocaleDateString('tr-TR')}</span>
                            </div>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
                              <span className="text-lg font-bold text-slate-900 dark:text-white">{pStats.incidentCount}</span>
                            </div>
                            <p className="text-xs text-slate-500">Olay</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Award className="h-3.5 w-3.5 text-violet-500" />
                              <span className="text-lg font-bold text-slate-900 dark:text-white">{pStats.trainingCount}</span>
                            </div>
                            <p className="text-xs text-slate-500">Eğitim</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Award className="h-3.5 w-3.5 text-amber-500" />
                              <span className="text-lg font-bold text-slate-900 dark:text-white">{person.certifications?.length || 0}</span>
                            </div>
                            <p className="text-xs text-slate-500">Sertifika</p>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/personnel/${person.id}`);
                            }}
                            className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-lg transition-all"
                            title="Detayları Gör"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(person.id);
                            }}
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg transition-all"
                            title="Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Card View Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-slate-900 dark:text-white">{startIndex + 1}-{endIndex}</span>
                  {' / '}{totalItems} kayıt gösteriliyor
                </div>
                
                <div className="flex items-center gap-2">
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="h-9 px-2 text-sm rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={6}>6</option>
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                    <option value={48}>48</option>
                  </select>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <ChevronLeft className="w-4 h-4 -ml-3" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <div className="flex items-center gap-1 px-2">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Sayfa {currentPage} / {totalPages}
                      </span>
                    </div>

                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                      <ChevronRight className="w-4 h-4 -ml-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Personeli Sil"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-400">
              Bu personeli kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>
                İptal
              </Button>
              <Button variant="danger" onClick={confirmDelete} className="gap-2">
                <Trash2 className="h-4 w-4" /> Sil
              </Button>
            </div>
          </div>
        </Modal>

        {/* Bulk Delete Confirmation Modal */}
        <Modal
          isOpen={bulkDeleteModalOpen}
          onClose={() => setBulkDeleteModalOpen(false)}
          title="Toplu Silme"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-400">
              <strong>{selectedPersonnel.size} personeli</strong> kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setBulkDeleteModalOpen(false)}>
                İptal
              </Button>
              <Button variant="danger" onClick={confirmBulkDelete} className="gap-2">
                <Trash2 className="h-4 w-4" /> {selectedPersonnel.size} Personeli Sil
              </Button>
            </div>
          </div>
        </Modal>

      </div>
    </PageTransition>
  );
};
