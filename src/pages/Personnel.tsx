import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { DataTable } from '../components/ui/DataTable';
import { useDataTable } from '../hooks/useDataTable';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';
import {
  Plus, Download, FileText, Search, Edit2, Trash2, Filter, X,
  User, Phone, Mail, Calendar, Building2, Shield, Heart,
  ClipboardList, Award, AlertCircle, ChevronDown, ChevronUp,
  Users, UserCheck, UserX, Clock, Grid3x3, List, Eye, TrendingUp,
  CheckSquare, Square
} from 'lucide-react';
import { Personnel, PersonnelClass, PersonnelStatus, BloodType } from '../types';
import toast from 'react-hot-toast';
import { PageTransition } from '../components/layout/PageTransition';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CLASSES: PersonnelClass[] = ['A', 'B', 'C'];
const STATUSES: PersonnelStatus[] = ['Aktif', 'Pasif', 'İstifa Etti'];
const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+'];

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
  'flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50';

type ModalTab = 'basic' | 'contact' | 'health' | 'certs';
type ViewMode = 'grid' | 'list';

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
  const { personnel, companies, addPersonnel, updatePersonnel, deletePersonnel } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPerson, setCurrentPerson] = useState<Partial<Personnel>>({});
  const [modalTab, setModalTab] = useState<ModalTab>('basic');
  const [showFilters, setShowFilters] = useState(false);
  const [newCert, setNewCert] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedPersonnel, setSelectedPersonnel] = useState<Set<string>>(new Set());
  const [detailPersonId, setDetailPersonId] = useState<string | null>(null);

  const {
    paginatedData,
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
    totalPages,
    totalItems,
    startIndex,
    endIndex,
  } = useDataTable<Personnel>({
    data: personnel,
    initialSort: { key: 'firstName', direction: 'asc' },
    initialPageSize: 10,
  });

  // Custom filters
  const filterCompany = filters.company || '';
  const filterStatus = filters.status || '';
  const filterClass = filters.class || '';

  // Filtered personnel
  const filtered = paginatedData.filter(p => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q ||
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      p.role.toLowerCase().includes(q) ||
      p.tcNo.includes(q) ||
      (p.email?.toLowerCase().includes(q));
    const matchCompany = !filterCompany || p.assignedCompanyId === filterCompany;
    const matchStatus = !filterStatus || (p.status || 'Aktif') === filterStatus;
    const matchClass = !filterClass || p.class === filterClass;
    return matchSearch && matchCompany && matchStatus && matchClass;
  });

  const stats = useMemo(() => ({
    total: personnel.length,
    active: personnel.filter(p => !p.status || p.status === 'Aktif').length,
    passive: personnel.filter(p => p.status === 'Pasif').length,
    resigned: personnel.filter(p => p.status === 'İstifa Etti').length,
  }), [personnel]);

  // ── handlers ──
  const openAdd = () => {
    navigate('/personnel/new');
  };

  const openEdit = (p: Personnel) => {
    setCurrentPerson({ ...p });
    setModalTab('basic');
    setNewCert('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPerson.firstName?.trim() || !currentPerson.lastName?.trim()) {
      toast.error('Ad ve soyad zorunludur.'); return;
    }
    if (!currentPerson.tcNo?.trim() || currentPerson.tcNo.length !== 11) {
      toast.error('TC kimlik numarası 11 haneli olmalıdır.'); return;
    }
    if (currentPerson.id) {
      updatePersonnel(currentPerson as Personnel);
      toast.success('Personel güncellendi.');
    } else {
      addPersonnel({ ...currentPerson, id: Math.random().toString(36).substr(2, 9) } as Personnel);
      toast.success('Personel eklendi.');
    }
    setIsModalOpen(false);
    setCurrentPerson({});
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bu personeli silmek istediğinize emin misiniz?')) {
      deletePersonnel(id);
      toast.success('Personel silindi.');
    }
  };

  const addCert = () => {
    if (!newCert.trim()) return;
    setCurrentPerson(p => ({ ...p, certifications: [...(p.certifications || []), newCert.trim()] }));
    setNewCert('');
  };

  const removeCert = (idx: number) => {
    setCurrentPerson(p => ({ ...p, certifications: (p.certifications || []).filter((_, i) => i !== idx) }));
  };

  const toggleSelectPerson = (id: string) => {
    const newSelected = new Set(selectedPersonnel);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPersonnel(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedPersonnel.size === filtered.length) {
      setSelectedPersonnel(new Set());
    } else {
      setSelectedPersonnel(new Set(filtered.map(p => p.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedPersonnel.size === 0) {
      toast.error('Lütfen silmek için personel seçiniz.');
      return;
    }
    if (window.confirm(`${selectedPersonnel.size} personeli silmek istediğinize emin misiniz?`)) {
      selectedPersonnel.forEach(id => deletePersonnel(id));
      setSelectedPersonnel(new Set());
      toast.success(`${selectedPersonnel.size} personel başarıyla silindi.`);
    }
  };

  const getDetailPerson = () => {
    return personnel.find(p => p.id === detailPersonId);
  };

  const handleExportPDF = () => {
    exportToPDF(
      'Personel Listesi',
      ['Ad Soyad', 'TC No', 'Görev', 'Durum', 'Sınıf', 'Firma', 'Telefon'],
      filtered.map(p => [
        `${p.firstName} ${p.lastName}`,
        p.tcNo,
        p.role,
        p.status || 'Aktif',
        p.class || '-',
        companies.find(c => c.id === p.assignedCompanyId)?.name || '-',
        p.phone,
      ]),
      'personeller'
    );
    toast.success('PDF indirildi.');
  };

  const handleExportExcel = () => {
    exportToExcel(
      filtered.map(p => ({
        'Ad': p.firstName, 'Soyad': p.lastName,
        'TC No': p.tcNo, 'Görev': p.role,
        'Durum': p.status || 'Aktif',
        'Sınıf': p.class || '-',
        'Firma': companies.find(c => c.id === p.assignedCompanyId)?.name || '-',
        'Telefon': p.phone, 'E-posta': p.email,
        'Başlama': p.startDate ? new Date(p.startDate).toLocaleDateString('tr-TR') : '-',
        'Kan Grubu': p.bloodType || '-',
        'Sertifikalar': (p.certifications || []).join(', ') || '-',
      })),
      'personeller'
    );
    toast.success('Excel indirildi.');
  };

  const hasFilters = searchTerm || filterCompany || filterStatus || filterClass;

  const detailPerson = getDetailPerson();
  const detailCompany = detailPerson ? companies.find(c => c.id === detailPerson.assignedCompanyId) : null;

  // DataTable columns
  const columns = [
    {
      key: 'select',
      header: () => (
        <button onClick={toggleSelectAll} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors">
          {selectedPersonnel.size === filtered.length && filtered.length > 0 ? (
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
            toggleSelectPerson(p.id);
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
      key: 'tcNo',
      header: 'TC No',
      sortable: true,
    },
    {
      key: 'status',
      header: 'Durum',
      sortable: true,
      render: (p: Personnel) => {
        const status = p.status || 'Aktif';
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${STATUS_COLORS[status]}`}>
            {status}
          </span>
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
        <div className="flex flex-col">
          <span className="text-sm text-slate-900 dark:text-white">{p.phone}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">{p.email}</span>
        </div>
      ),
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
      width: '140px',
      render: (p: Personnel) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDetailPersonId(p.id);
            }}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg dark:text-indigo-400 dark:hover:bg-indigo-900/30 transition-colors"
            title="Detayları Gör"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit(p);
            }}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
            title="Düzenle"
          >
            <Edit2 className="h-4 w-4" />
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

  // ─── MODAL TABS ──────────────────────────────────────────────────────────────
  const TABS: { key: ModalTab; label: string; icon: React.ElementType }[] = [
    { key: 'basic',   label: 'Temel Bilgiler', icon: User },
    { key: 'contact', label: 'İletişim & Adres', icon: Phone },
    { key: 'health',  label: 'Sağlık', icon: Heart },
    { key: 'certs',   label: 'Sertifikalar', icon: Award },
  ];

  return (
    <PageTransition>
      <div className="space-y-5">

        {/* ─── HEADER ─── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">Personeller</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-lg">Çalışan kayıtlarını yönetin.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="secondary" onClick={handleExportExcel} className="gap-2">
              <Download className="h-4 w-4" /> Excel
            </Button>
            <Button variant="secondary" onClick={handleExportPDF} className="gap-2">
              <FileText className="h-4 w-4" /> PDF
            </Button>
            <Button onClick={openAdd} className="gap-2">
              <Plus className="h-4 w-4" /> Yeni Personel
            </Button>
            <Button variant="secondary" onClick={() => { /* Quick add modal */ setIsModalOpen(true); setCurrentPerson({ status: 'Aktif' }); setModalTab('basic'); setNewCert(''); }} className="gap-2">
              <Plus className="h-4 w-4" /> Hızlı Ekle
            </Button>
          </div>
        </div>

        {/* ─── STAT CARDS ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              <TrendingUp className="h-5 w-5 opacity-70" />
            </div>
            <p className="text-2xl font-bold mb-1">{stats.total}</p>
            <p className="text-sm text-white/80">Toplam Personel</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <UserCheck className="h-6 w-6" />
              </div>
              <TrendingUp className="h-5 w-5 opacity-70" />
            </div>
            <p className="text-2xl font-bold mb-1">{stats.active}</p>
            <p className="text-sm text-white/80">Aktif</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Clock className="h-6 w-6" />
              </div>
              <TrendingUp className="h-5 w-5 opacity-70" />
            </div>
            <p className="text-2xl font-bold mb-1">{stats.passive}</p>
            <p className="text-sm text-white/80">Pasif</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <UserX className="h-6 w-6" />
              </div>
              <TrendingUp className="h-5 w-5 opacity-70" />
            </div>
            <p className="text-2xl font-bold mb-1">{stats.resigned}</p>
            <p className="text-sm text-white/80">İstifa Etti</p>
          </div>
        </div>

        {/* ─── SEARCH & FILTERS ─── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="İsim, TC, görev veya e-posta ara..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                  title="Liste Görünümü"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                  title="Kart Görünümü"
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
              </div>
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
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Firma</label>
                <select className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  value={filterCompany} onChange={e => setFilter('company', e.target.value)}>
                  <option value="">Tüm Firmalar</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Durum</label>
                <select className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  value={filterStatus} onChange={e => setFilter('status', e.target.value)}>
                  <option value="">Tüm Durumlar</option>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Sınıf</label>
                <select className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  value={filterClass} onChange={e => setFilter('class', e.target.value)}>
                  <option value="">Tüm Sınıflar</option>
                  {CLASSES.map(c => <option key={c} value={c}>{c} Sınıfı</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ─── DATA VIEW ─── */}
        {viewMode === 'list' ? (
          <DataTable
            data={filtered}
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
          />
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-slate-500 dark:text-slate-400 px-1">
              {filtered.length} / {personnel.length} personel gösteriliyor
            </div>

            {filtered.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-16 text-center">
                <Users className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">Personel bulunamadı.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map(p => {
                  const company = companies.find(c => c.id === p.assignedCompanyId);
                  const status = p.status || 'Aktif';
                  const isExpanded = expandedId === p.id;

                  return (
                    <div
                      key={p.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setDetailPersonId(p.id)}
                    >
                  {/* Card Header */}
                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      <Avatar person={p} size="lg" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                              {p.firstName} {p.lastName}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{p.role}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelectPerson(p.id);
                              }}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                              {selectedPersonnel.has(p.id) ? (
                                <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                              ) : (
                                <Square className="h-4 w-4 text-slate-400" />
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEdit(p);
                              }}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg dark:text-indigo-400 dark:hover:bg-indigo-900/30 transition-colors"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(p.id);
                              }}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
                            {status}
                          </span>
                          {p.class && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CLASS_COLORS[p.class]}`}>
                              {p.class} Sınıfı
                            </span>
                          )}
                          {p.bloodType && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              {p.bloodType}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Basic Info */}
                    <div className="mt-4 space-y-1.5">
                      {company && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{company.name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span>{p.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{p.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span>İşe başlama: {p.startDate ? new Date(p.startDate).toLocaleDateString('tr-TR') : '-'}</span>
                      </div>
                    </div>
                  </div>

                      {/* Expand Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(isExpanded ? null : p.id);
                        }}
                    className="w-full px-5 py-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    {isExpanded ? 'Daha az göster' : 'Detaylar'}
                  </button>

                      {/* Expanded Details */}
                      {isExpanded && (
                    <div className="px-5 pb-4 border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
                      {(p.birthDate || p.emergencyContact) && (
                        <div className="space-y-1.5">
                          {p.birthDate && (
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                              <span>Doğum: {new Date(p.birthDate).toLocaleDateString('tr-TR')}</span>
                            </div>
                          )}
                          {p.emergencyContact && (
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
                              <span>{p.emergencyContact} - {p.emergencyPhone || '-'}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {p.address && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-xs">{p.address}</p>
                      )}
                      {p.education && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <ClipboardList className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span>{p.education}</span>
                        </div>
                      )}
                      {p.certifications && p.certifications.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                            <Award className="h-3 w-3" /> Sertifikalar
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {p.certifications.map((cert, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                {cert}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {p.medicalExams && p.medicalExams.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                            <Heart className="h-3 w-3" /> Son Sağlık Muayenesi
                          </p>
                          {(() => {
                            const last = p.medicalExams![p.medicalExams!.length - 1];
                            return (
                              <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2">
                                <div className="font-medium">{last.type}</div>
                                <div>{new Date(last.date).toLocaleDateString('tr-TR')} — {last.result}</div>
                                {last.nextExamDate && <div className="text-amber-600 dark:text-amber-400">Sonraki: {new Date(last.nextExamDate).toLocaleDateString('tr-TR')}</div>}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                      </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination for Grid View */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {startIndex + 1}-{Math.min(endIndex, totalItems)} / {totalItems} kayıt
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Önceki
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Sonraki
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── ADD / EDIT MODAL ─── */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={currentPerson.id ? 'Personeli Düzenle' : 'Yeni Personel Ekle'}
        >
          <form onSubmit={handleSave} className="space-y-0">
            {/* Modal Avatar Preview */}
            <div className="flex items-center gap-4 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <Avatar person={currentPerson} size="lg" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {currentPerson.firstName || 'Ad'} {currentPerson.lastName || 'Soyad'}
                </p>
                <p className="text-sm text-slate-500">{currentPerson.role || 'Görev girilmedi'}</p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 mb-4 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setModalTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    modalTab === tab.key
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* ── Tab: Basic ── */}
            {modalTab === 'basic' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Ad <span className="text-red-500">*</span></label>
                    <Input required value={currentPerson.firstName || ''} onChange={e => setCurrentPerson(p => ({ ...p, firstName: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Soyad <span className="text-red-500">*</span></label>
                    <Input required value={currentPerson.lastName || ''} onChange={e => setCurrentPerson(p => ({ ...p, lastName: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">TC Kimlik No <span className="text-red-500">*</span></label>
                    <Input required maxLength={11} value={currentPerson.tcNo || ''} onChange={e => setCurrentPerson(p => ({ ...p, tcNo: e.target.value.replace(/\D/g, '') }))} placeholder="11 hane" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Doğum Tarihi</label>
                    <Input type="date" value={currentPerson.birthDate || ''} onChange={e => setCurrentPerson(p => ({ ...p, birthDate: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Görev / Pozisyon <span className="text-red-500">*</span></label>
                    <Input required value={currentPerson.role || ''} onChange={e => setCurrentPerson(p => ({ ...p, role: e.target.value }))} placeholder="Örn: Şantiye Şefi" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">İSG Sınıfı</label>
                    <select className={selectClass} value={currentPerson.class || ''} onChange={e => setCurrentPerson(p => ({ ...p, class: e.target.value as PersonnelClass || undefined }))}>
                      <option value="">Seçiniz</option>
                      {CLASSES.map(c => <option key={c} value={c}>{c} Sınıfı</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Durum</label>
                    <select className={selectClass} value={currentPerson.status || 'Aktif'} onChange={e => setCurrentPerson(p => ({ ...p, status: e.target.value as PersonnelStatus }))}>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Atanan Firma</label>
                    <select className={selectClass} value={currentPerson.assignedCompanyId || ''} onChange={e => setCurrentPerson(p => ({ ...p, assignedCompanyId: e.target.value }))}>
                      <option value="">Atanmadı</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">İşe Başlama <span className="text-red-500">*</span></label>
                    <Input required type="date" value={currentPerson.startDate || ''} onChange={e => setCurrentPerson(p => ({ ...p, startDate: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">İşten Çıkış</label>
                    <Input type="date" value={currentPerson.endDate || ''} onChange={e => setCurrentPerson(p => ({ ...p, endDate: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Eğitim Durumu</label>
                  <Input value={currentPerson.education || ''} onChange={e => setCurrentPerson(p => ({ ...p, education: e.target.value }))} placeholder="Örn: Lise, Üniversite, Yüksek Lisans..." />
                </div>
              </div>
            )}

            {/* ── Tab: Contact ── */}
            {modalTab === 'contact' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Telefon <span className="text-red-500">*</span></label>
                    <Input required value={currentPerson.phone || ''} onChange={e => setCurrentPerson(p => ({ ...p, phone: e.target.value }))} placeholder="0555 xxx xx xx" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">E-posta <span className="text-red-500">*</span></label>
                    <Input required type="email" value={currentPerson.email || ''} onChange={e => setCurrentPerson(p => ({ ...p, email: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Adres</label>
                  <textarea
                    rows={3}
                    className="flex w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 resize-none"
                    value={currentPerson.address || ''}
                    onChange={e => setCurrentPerson(p => ({ ...p, address: e.target.value }))}
                    placeholder="Ev adresi..."
                  />
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" /> Acil Durum İletişimi
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Acil Kişi Adı</label>
                      <Input value={currentPerson.emergencyContact || ''} onChange={e => setCurrentPerson(p => ({ ...p, emergencyContact: e.target.value }))} placeholder="Ad Soyad (Yakınlık)" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Acil Telefon</label>
                      <Input value={currentPerson.emergencyPhone || ''} onChange={e => setCurrentPerson(p => ({ ...p, emergencyPhone: e.target.value }))} placeholder="0555 xxx xx xx" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab: Health ── */}
            {modalTab === 'health' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Kan Grubu</label>
                  <select className={selectClass} value={currentPerson.bloodType || ''} onChange={e => setCurrentPerson(p => ({ ...p, bloodType: e.target.value as BloodType || undefined }))}>
                    <option value="">Bilinmiyor</option>
                    {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                  </select>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-emerald-500" /> Periyodik Muayeneler
                    </p>
                    <button type="button"
                      onClick={() => {
                        const exam = { id: Math.random().toString(36).substr(2, 9), date: new Date().toISOString().split('T')[0], type: 'Periyodik Muayene', result: 'Normal', nextExamDate: '' };
                        setCurrentPerson(p => ({ ...p, medicalExams: [...(p.medicalExams || []), exam] }));
                      }}
                      className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                      <Plus className="h-3.5 w-3.5" /> Ekle
                    </button>
                  </div>
                  {(currentPerson.medicalExams || []).length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">Henüz muayene kaydı yok.</p>
                  ) : (
                    <div className="space-y-2">
                      {(currentPerson.medicalExams || []).map((exam, idx) => (
                        <div key={exam.id} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-slate-500">Tarih</label>
                              <Input type="date" className="h-8 text-xs" value={exam.date}
                                onChange={e => setCurrentPerson(p => {
                                  const exams = [...(p.medicalExams || [])];
                                  exams[idx] = { ...exams[idx], date: e.target.value };
                                  return { ...p, medicalExams: exams };
                                })} />
                            </div>
                            <div>
                              <label className="text-xs text-slate-500">Muayene Türü</label>
                              <Input className="h-8 text-xs" value={exam.type}
                                onChange={e => setCurrentPerson(p => {
                                  const exams = [...(p.medicalExams || [])];
                                  exams[idx] = { ...exams[idx], type: e.target.value };
                                  return { ...p, medicalExams: exams };
                                })} />
                            </div>
                            <div>
                              <label className="text-xs text-slate-500">Sonuç</label>
                              <Input className="h-8 text-xs" value={exam.result}
                                onChange={e => setCurrentPerson(p => {
                                  const exams = [...(p.medicalExams || [])];
                                  exams[idx] = { ...exams[idx], result: e.target.value };
                                  return { ...p, medicalExams: exams };
                                })} />
                            </div>
                            <div>
                              <label className="text-xs text-slate-500">Sonraki Muayene</label>
                              <Input type="date" className="h-8 text-xs" value={exam.nextExamDate || ''}
                                onChange={e => setCurrentPerson(p => {
                                  const exams = [...(p.medicalExams || [])];
                                  exams[idx] = { ...exams[idx], nextExamDate: e.target.value };
                                  return { ...p, medicalExams: exams };
                                })} />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <button type="button"
                              onClick={() => setCurrentPerson(p => ({ ...p, medicalExams: (p.medicalExams || []).filter((_, i) => i !== idx) }))}
                              className="text-xs text-red-500 hover:underline">Sil</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Tab: Certs ── */}
            {modalTab === 'certs' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Örn: İSG Eğitimi, Forklift Sertifikası, İlk Yardım..."
                    value={newCert}
                    onChange={e => setNewCert(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCert(); } }}
                  />
                  <Button type="button" onClick={addCert} className="shrink-0">Ekle</Button>
                </div>
                {(currentPerson.certifications || []).length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">Sertifika kaydı yok.</p>
                ) : (
                  <div className="space-y-2">
                    {(currentPerson.certifications || []).map((cert, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Award className="h-4 w-4 text-indigo-500 shrink-0" />
                          <span className="text-slate-800 dark:text-slate-200">{cert}</span>
                        </div>
                        <button type="button" onClick={() => removeCert(idx)} className="text-red-400 hover:text-red-600 p-1">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-5 mt-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>İptal</Button>
              <Button type="submit">Kaydet</Button>
            </div>
          </form>
        </Modal>

        {/* ─── PERSONNEL DETAIL MODAL ─── */}
        <Modal
          isOpen={!!detailPersonId}
          onClose={() => setDetailPersonId(null)}
          title="Personel Detayları"
          size="xl"
        >
          {detailPerson && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start gap-4 pb-5 border-b border-slate-200 dark:border-slate-700">
                <Avatar person={detailPerson} size="lg" />
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                    {detailPerson.firstName} {detailPerson.lastName}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-2">{detailPerson.role}</p>
                  <div className="flex flex-wrap gap-2">
                    {detailPerson.status && (
                      <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${STATUS_COLORS[detailPerson.status]}`}>
                        {detailPerson.status}
                      </span>
                    )}
                    {detailPerson.class && (
                      <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${CLASS_COLORS[detailPerson.class]}`}>
                        {detailPerson.class} Sınıfı
                      </span>
                    )}
                    {detailPerson.bloodType && (
                      <span className="px-3 py-1 rounded-lg text-sm font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        {detailPerson.bloodType}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Kişisel Bilgiler</h3>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">TC Kimlik No</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{detailPerson.tcNo}</p>
                      </div>
                    </div>
                    {detailPerson.birthDate && (
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Doğum Tarihi</p>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {new Date(detailPerson.birthDate).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                      </div>
                    )}
                    {detailPerson.education && (
                      <div className="flex items-start gap-3">
                        <ClipboardList className="h-5 w-5 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Eğitim</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{detailPerson.education}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">İletişim</h3>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Telefon</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{detailPerson.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">E-posta</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{detailPerson.email}</p>
                      </div>
                    </div>
                    {detailPerson.address && (
                      <div className="flex items-start gap-3">
                        <Building2 className="h-5 w-5 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Adres</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{detailPerson.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Work Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">İş Bilgileri</h3>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 grid grid-cols-2 gap-4">
                  {detailCompany && (
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Firma</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{detailCompany.name}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">İşe Başlama</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {detailPerson.startDate ? new Date(detailPerson.startDate).toLocaleDateString('tr-TR') : '—'}
                    </p>
                  </div>
                  {detailPerson.endDate && (
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">İşten Çıkış</p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {new Date(detailPerson.endDate).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Emergency Contact */}
              {(detailPerson.emergencyContact || detailPerson.emergencyPhone) && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Acil Durum İletişimi
                  </h3>
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                    <p className="font-semibold text-amber-900 dark:text-amber-100">
                      {detailPerson.emergencyContact} {detailPerson.emergencyPhone && `— ${detailPerson.emergencyPhone}`}
                    </p>
                  </div>
                </div>
              )}

              {/* Certifications */}
              {detailPerson.certifications && detailPerson.certifications.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Sertifikalar ({detailPerson.certifications.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {detailPerson.certifications.map((cert, i) => (
                      <span key={i} className="px-3 py-1 rounded-lg text-sm bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Medical Exams */}
              {detailPerson.medicalExams && detailPerson.medicalExams.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Sağlık Muayeneleri ({detailPerson.medicalExams.length})
                  </h3>
                  <div className="space-y-2">
                    {detailPerson.medicalExams.map((exam) => (
                      <div key={exam.id} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-semibold text-slate-900 dark:text-white">{exam.type}</p>
                          <span className="text-xs text-slate-500">{new Date(exam.date).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Sonuç: {exam.result}</p>
                        {exam.nextExamDate && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                            Sonraki: {new Date(exam.nextExamDate).toLocaleDateString('tr-TR')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="ghost" onClick={() => setDetailPersonId(null)}>Kapat</Button>
                <Button onClick={() => { setDetailPersonId(null); openEdit(detailPerson); }}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Düzenle
                </Button>
              </div>
            </div>
          )}
        </Modal>

      </div>
    </PageTransition>
  );
};
