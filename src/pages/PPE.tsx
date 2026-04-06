import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { PPE, PPEType, PPEStatus } from '../types';
import { Plus, Search, Edit2, Trash2, Download, FileText, HardHat, Filter, X, Grid3x3, List, Eye, TrendingUp, CheckSquare, Square, Calendar, User, ChevronLeft, ChevronRight, Package, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { DataTable } from '../components/ui/DataTable';
import { useDataTable } from '../hooks/useDataTable';
import { PageTransition } from '../components/layout/PageTransition';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

type ViewMode = 'grid' | 'list';

const ppeTypes: PPEType[] = ['Baret', 'İş Ayakkabısı', 'Eldiven', 'Gözlük', 'Reflektörlü Yelek', 'Kulaklık', 'Emniyet Kemeri', 'Diğer'];

export const PPEPage = () => {
  const { ppes, personnel, addPPE, updatePPE, deletePPE } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPPE, setCurrentPPE] = useState<Partial<PPE>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(window.innerWidth < 1024 ? 'grid' : 'list');
  const [selectedPPEs, setSelectedPPEs] = useState<Set<string>>(new Set());
  const [detailPPEId, setDetailPPEId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [ppeToDelete, setPPEToDelete] = useState<string | null>(null);
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
  } = useDataTable<PPE>({
    data: ppes,
    initialSort: { key: 'issueDate', direction: 'desc' },
    initialPageSize: 10,
  });

  // Manual filtering on raw data to avoid double-filter bug
  const filteredPPEs = useMemo(() => {
    let result = [...ppes];

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((p) => {
        const person = personnel.find(per => per.id === p.personnelId);
        const personName = person ? `${person.firstName} ${person.lastName}`.toLowerCase() : '';
        return (
          p.name.toLowerCase().includes(term) ||
          p.type.toLowerCase().includes(term) ||
          personName.includes(term) ||
          (p.notes && p.notes.toLowerCase().includes(term))
        );
      });
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      result = result.filter(p => p.status === filters.status);
    }

    // Type filter
    if (filters.type && filters.type !== 'all') {
      result = result.filter(p => p.type === filters.type);
    }

    // Personnel filter
    if (filters.personnelId && filters.personnelId !== 'all') {
      result = result.filter(p => p.personnelId === filters.personnelId);
    }

    // Sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key as keyof PPE];
        const bVal = b[sortConfig.key as keyof PPE];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortConfig.direction === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        return 0;
      });
    }

    return result;
  }, [ppes, searchTerm, filters.status, filters.type, filters.personnelId, sortConfig, personnel]);

  // Manual pagination
  const totalItems = filteredPPEs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const displayedPPEs = filteredPPEs.slice(startIndex, endIndex);

  // Calculate statistics
  const stats = useMemo(() => {
    const activePPEs = ppes.filter(p => p.status === 'Aktif');
    const totalDays = activePPEs.reduce((sum, p) => {
      const issueDate = new Date(p.issueDate);
      const today = new Date();
      const days = Math.floor((today.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);
    const avgDays = activePPEs.length > 0 ? Math.round(totalDays / activePPEs.length) : 0;

    return {
      total: ppes.length,
      active: ppes.filter(p => p.status === 'Aktif').length,
      returned: ppes.filter(p => p.status === 'İade Edildi').length,
      lost: ppes.filter(p => p.status === 'Yıprandı/Kayıp').length,
      avgDays,
    };
  }, [ppes]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPPE.id) {
      updatePPE(currentPPE as PPE);
      toast.success('KKD kaydı güncellendi.');
    } else {
      addPPE({
        ...currentPPE,
        id: Date.now().toString(),
      } as PPE);
      toast.success('Yeni KKD kaydı eklendi.');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setPPEToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (ppeToDelete) {
      deletePPE(ppeToDelete);
      toast.success('Kayıt silindi.');
      setPPEToDelete(null);
    }
    setDeleteModalOpen(false);
  };

  const openEditModal = (ppe: PPE) => {
    setCurrentPPE(ppe);
    setIsModalOpen(true);
  };

  const toggleSelectPPE = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newSelected = new Set(selectedPPEs);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPPEs(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedPPEs.size === displayedPPEs.length && displayedPPEs.length > 0) {
      setSelectedPPEs(new Set());
    } else {
      setSelectedPPEs(new Set(displayedPPEs.map(p => p.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedPPEs.size === 0) {
      toast.error('Lütfen silmek için KKD seçiniz.');
      return;
    }
    setBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = () => {
    const count = selectedPPEs.size;
    selectedPPEs.forEach(id => deletePPE(id));
    setSelectedPPEs(new Set());
    setBulkDeleteModalOpen(false);
    toast.success(`${count} KKD kaydı başarıyla silindi.`);
  };

  const getDetailPPE = () => {
    return ppes.find(p => p.id === detailPPEId);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('KKD Zimmet Listesi', 14, 15);
    
    const tableData = filteredPPEs.map(p => {
      const person = personnel.find(per => per.id === p.personnelId);
      return [
        p.type,
        p.name,
        person ? `${person.firstName} ${person.lastName}` : 'Bilinmiyor',
        new Date(p.issueDate).toLocaleDateString('tr-TR'),
        p.status
      ];
    });

    (doc as any).autoTable({
      head: [['Tip', 'Ekipman', 'Personel', 'Veriliş Tarihi', 'Durum']],
      body: tableData,
      startY: 20,
    });

    doc.save('kkd-listesi.pdf');
    toast.success('PDF olarak dışa aktarıldı.');
  };

  const handleExportExcel = () => {
    const data = filteredPPEs.map(p => {
      const person = personnel.find(per => per.id === p.personnelId);
      return {
        'Tip': p.type,
        'Ekipman': p.name,
        'Personel': person ? `${person.firstName} ${person.lastName}` : 'Bilinmiyor',
        'Veriliş Tarihi': new Date(p.issueDate).toLocaleDateString('tr-TR'),
        'Durum': p.status,
        'Notlar': p.notes || ''
      };
    });
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'KKD Listesi');
    XLSX.writeFile(wb, 'kkd-listesi.xlsx');
    toast.success('Excel olarak dışa aktarıldı.');
  };

  const getStatusColor = (status: PPEStatus) => {
    switch(status) {
      case 'Aktif': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'İade Edildi': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Yıprandı/Kayıp': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDotColor = (status: PPEStatus) => {
    switch(status) {
      case 'Aktif': return 'bg-emerald-500';
      case 'İade Edildi': return 'bg-blue-500';
      case 'Yıprandı/Kayıp': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPPETypeIcon = (type: PPEType) => {
    switch(type) {
      case 'Baret': return HardHat;
      case 'İş Ayakkabısı': return Package;
      case 'Eldiven': return Shield;
      case 'Gözlük': return Eye;
      case 'Reflektörlü Yelek': return Shield;
      case 'Kulaklık': return Shield;
      case 'Emniyet Kemeri': return Shield;
      default: return Package;
    }
  };

  const detailPPE = getDetailPPE();
  const detailPerson = detailPPE ? personnel.find(p => p.id === detailPPE.personnelId) : null;

  const columns = [
    {
      key: 'select',
      header: () => (
        <button onClick={toggleSelectAll} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors">
          {selectedPPEs.size === displayedPPEs.length && displayedPPEs.length > 0 ? (
            <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          ) : (
            <Square className="h-4 w-4 text-slate-400" />
          )}
        </button>
      ),
      width: '40px',
      render: (p: PPE) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSelectPPE(p.id);
          }}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
        >
          {selectedPPEs.has(p.id) ? (
            <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          ) : (
            <Square className="h-4 w-4 text-slate-400" />
          )}
        </button>
      ),
    },
    {
      key: 'name',
      header: 'Ekipman',
      sortable: true,
      render: (p: PPE) => {
        const Icon = getPPETypeIcon(p.type);
        return (
          <div className="flex items-start gap-2">
            <Icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mt-1 shrink-0" />
            <div>
              <div className="font-medium text-slate-900 dark:text-white">{p.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{p.type}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'personnelId',
      header: 'Personel',
      sortable: true,
      render: (p: PPE) => {
        const person = personnel.find(per => per.id === p.personnelId);
        return person ? (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {person.firstName[0]}{person.lastName[0]}
            </div>
            <span className="text-slate-700 dark:text-slate-300">{person.firstName} {person.lastName}</span>
          </div>
        ) : (
          <span className="text-red-500">Silinmiş Personel</span>
        );
      },
    },
    {
      key: 'issueDate',
      header: 'Veriliş Tarihi',
      sortable: true,
      width: '140px',
      render: (p: PPE) => (
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-sm">{new Date(p.issueDate).toLocaleDateString('tr-TR')}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Durum',
      sortable: true,
      width: '140px',
      render: (p: PPE) => (
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${getStatusDotColor(p.status)}`} />
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(p.status)}`}>
            {p.status}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'İşlemler',
      width: '140px',
      render: (p: PPE) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDetailPPEId(p.id);
            }}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg dark:text-indigo-400 dark:hover:bg-indigo-900/30 transition-colors"
            title="Detayları Gör"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(p);
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

  const hasActiveFilters = searchTerm || filters.status || filters.type || filters.personnelId;

  return (
    <PageTransition>
      <div className="space-y-4">
        {/* Stats Cards */}
        <div className="hidden lg:grid lg:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <HardHat className="h-6 w-6" />
              </div>
              <TrendingUp className="h-5 w-5 opacity-70" />
            </div>
            <p className="text-2xl font-bold mb-1">{stats.total}</p>
            <p className="text-sm text-white/80">Toplam KKD</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <CheckSquare className="h-6 w-6" />
              </div>
              <TrendingUp className="h-5 w-5 opacity-70" />
            </div>
            <p className="text-2xl font-bold mb-1">{stats.active}</p>
            <p className="text-sm text-white/80">Aktif</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <HardHat className="h-6 w-6" />
              </div>
              <TrendingUp className="h-5 w-5 opacity-70" />
            </div>
            <p className="text-2xl font-bold mb-1">{stats.returned}</p>
            <p className="text-sm text-white/80">İade Edildi</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <TrendingUp className="h-5 w-5 opacity-70" />
            </div>
            <p className="text-2xl font-bold mb-1">{stats.lost}</p>
            <p className="text-sm text-white/80">Yıprandı/Kayıp</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Calendar className="h-6 w-6" />
              </div>
            </div>
            <p className="text-2xl font-bold mb-1">{stats.avgDays}</p>
            <p className="text-sm text-white/80">Ort. Kullanım (Gün)</p>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">KKD Takibi</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-lg">Kişisel Koruyucu Donanım zimmet ve durum takibi.</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {selectedPPEs.size > 0 && (
              <Button variant="danger" onClick={handleBulkDelete} className="gap-2">
                <Trash2 className="h-4 w-4" /> Seçilileri Sil ({selectedPPEs.size})
              </Button>
            )}
            <Button variant="secondary" onClick={handleExportExcel} className="gap-2">
              <Download className="h-4 w-4" /> Excel
            </Button>
            <Button variant="secondary" onClick={handleExportPDF} className="gap-2">
              <FileText className="h-4 w-4" /> PDF
            </Button>
            <Button onClick={() => { setCurrentPPE({ status: 'Aktif' }); setIsModalOpen(true); }} className="gap-2">
              <Plus className="h-4 w-4" /> Yeni Kayıt
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Ekipman, personel veya not ara..." 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
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
                <Filter className="h-4 w-4" />
                Filtreler
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                )}
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" onClick={() => { clearFilters(); setCurrentPage(1); }} className="gap-2 text-slate-500">
                  <X className="h-4 w-4" />
                  Temizle
                </Button>
              )}
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <HardHat className="h-3.5 w-3.5" /> Ekipman Tipi
                </label>
                <select
                  value={filters.type || 'all'}
                  onChange={(e) => { setFilter('type', e.target.value === 'all' ? '' : e.target.value); setCurrentPage(1); }}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="all">Tüm Tipler</option>
                  {ppeTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" /> Durum
                </label>
                <select
                  value={filters.status || 'all'}
                  onChange={(e) => { setFilter('status', e.target.value === 'all' ? '' : e.target.value); setCurrentPage(1); }}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="Aktif">Aktif</option>
                  <option value="İade Edildi">İade Edildi</option>
                  <option value="Yıprandı/Kayıp">Yıprandı/Kayıp</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Personel
                </label>
                <select
                  value={filters.personnelId || 'all'}
                  onChange={(e) => { setFilter('personnelId', e.target.value === 'all' ? '' : e.target.value); setCurrentPage(1); }}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="all">Tüm Personel</option>
                  {personnel.map(p => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Data View */}
        {viewMode === 'list' ? (
          <DataTable
            data={displayedPPEs}
            columns={columns}
            sortConfig={sortConfig}
            onSort={handleSort}
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            totalItems={totalItems}
            startIndex={startIndex}
            endIndex={endIndex}
            keyExtractor={(p) => p.id}
            emptyMessage={
              <div className="flex flex-col items-center justify-center py-8">
                <HardHat className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-500 dark:text-slate-400">KKD kaydı bulunamadı.</p>
              </div>
            }
          />
        ) : (
          <div className="space-y-4">
            {displayedPPEs.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-16 text-center">
                <HardHat className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">KKD kaydı bulunamadı.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedPPEs.map((ppe) => {
                  const person = personnel.find(p => p.id === ppe.personnelId);
                  const Icon = getPPETypeIcon(ppe.type);
                  return (
                    <div
                      key={ppe.id}
                      className={`group bg-white dark:bg-slate-900 rounded-2xl border-2 p-5 hover:shadow-lg transition-all cursor-pointer ${
                        selectedPPEs.has(ppe.id)
                          ? 'border-indigo-400 dark:border-indigo-500 ring-2 ring-indigo-100 dark:ring-indigo-900/30'
                          : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                      }`}
                      onClick={() => setDetailPPEId(ppe.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shrink-0">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{ppe.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{ppe.type}</p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectPPE(ppe.id, e);
                          }}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                        >
                          {selectedPPEs.has(ppe.id) ? (
                            <CheckSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          ) : (
                            <Square className="h-5 w-5 text-slate-400" />
                          )}
                        </button>
                      </div>

                      {ppe.notes && (
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2.5 mb-3 border border-slate-100 dark:border-slate-700/50">
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{ppe.notes}</p>
                        </div>
                      )}

                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <User className="h-4 w-4 text-slate-400" />
                          <span>{person ? `${person.firstName} ${person.lastName}` : 'Bilinmiyor'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span>{new Date(ppe.issueDate).toLocaleDateString('tr-TR')}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(ppe.status)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(ppe.status)}`} />
                          {ppe.status}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(ppe);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(ppe.id);
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Grid View Pagination */}
            {filteredPPEs.length > 0 && (
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-2">
                  <select
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                    className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {[6, 9, 12, 24].map(size => (
                      <option key={size} value={size}>{size} / sayfa</option>
                    ))}
                  </select>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {startIndex + 1}-{Math.min(endIndex, totalItems)} / {totalItems}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, safeCurrentPage - 1))}
                    disabled={safeCurrentPage === 1}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        if (totalPages <= 5) return true;
                        if (page === 1 || page === totalPages) return true;
                        return Math.abs(page - safeCurrentPage) <= 1;
                      })
                      .map((page, idx, arr) => (
                        <React.Fragment key={page}>
                          {idx > 0 && arr[idx - 1] !== page - 1 && (
                            <span className="px-1 text-slate-400">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                              safeCurrentPage === page
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, safeCurrentPage + 1))}
                    disabled={safeCurrentPage === totalPages}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={currentPPE.id ? 'KKD Kaydını Düzenle' : 'Yeni KKD Kaydı'}
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ekipman Tipi</label>
                <select 
                  required
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                  value={currentPPE.type || ''}
                  onChange={e => setCurrentPPE({...currentPPE, type: e.target.value as PPEType})}
                >
                  <option value="">Seçiniz</option>
                  {ppeTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Model/Marka/Detay</label>
                <Input required value={currentPPE.name || ''} onChange={e => setCurrentPPE({...currentPPE, name: e.target.value})} placeholder="Örn: 3M X5000 Baret" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Zimmetlenecek Personel</label>
              <select 
                required
                className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                value={currentPPE.personnelId || ''}
                onChange={e => setCurrentPPE({...currentPPE, personnelId: e.target.value})}
              >
                <option value="">Personel Seçiniz</option>
                {personnel.map(p => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Veriliş Tarihi</label>
                <Input required type="date" value={currentPPE.issueDate || ''} onChange={e => setCurrentPPE({...currentPPE, issueDate: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Durum</label>
                <select 
                  required
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                  value={currentPPE.status || 'Aktif'}
                  onChange={e => setCurrentPPE({...currentPPE, status: e.target.value as PPEStatus})}
                >
                  <option value="Aktif">Aktif</option>
                  <option value="İade Edildi">İade Edildi</option>
                  <option value="Yıprandı/Kayıp">Yıprandı/Kayıp</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notlar (Opsiyonel)</label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                value={currentPPE.notes || ''}
                onChange={e => setCurrentPPE({...currentPPE, notes: e.target.value})}
              />
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>İptal</Button>
              <Button type="submit">Kaydet</Button>
            </div>
          </form>
        </Modal>

        {/* PPE Detail Modal */}
        <Modal
          isOpen={!!detailPPEId}
          onClose={() => setDetailPPEId(null)}
          title="KKD Detayları"
          size="xl"
        >
          {detailPPE && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start gap-4 pb-5 border-b border-slate-200 dark:border-slate-700">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                  <HardHat className="h-8 w-8" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{detailPPE.name}</h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-2">{detailPPE.type}</p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(detailPPE.status)}`}>
                    <span className={`w-2 h-2 rounded-full ${getStatusDotColor(detailPPE.status)}`} />
                    {detailPPE.status}
                  </span>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Ekipman Bilgileri</h3>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3">
                      <HardHat className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Ekipman Tipi</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{detailPPE.type}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Veriliş Tarihi</p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {new Date(detailPPE.issueDate).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Personel Bilgileri</h3>
                  <div className="space-y-2.5">
                    {detailPerson ? (
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {detailPerson.firstName[0]}{detailPerson.lastName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {detailPerson.firstName} {detailPerson.lastName}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{detailPerson.role}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-red-500 italic">Personel bilgisi bulunamadı.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {detailPPE.notes && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Notlar</h3>
                  <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    {detailPPE.notes}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="ghost" onClick={() => setDetailPPEId(null)}>Kapat</Button>
                <Button onClick={() => { setDetailPPEId(null); openEditModal(detailPPE); }}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Düzenle
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => { setDeleteModalOpen(false); setPPEToDelete(null); }}
          title="KKD Kaydını Sil"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">
                Bu KKD kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setDeleteModalOpen(false); setPPEToDelete(null); }}>İptal</Button>
              <Button variant="danger" onClick={confirmDelete}>Sil</Button>
            </div>
          </div>
        </Modal>

        {/* Bulk Delete Confirmation Modal */}
        <Modal
          isOpen={bulkDeleteModalOpen}
          onClose={() => setBulkDeleteModalOpen(false)}
          title="Toplu Silme"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">
                Seçili <strong>{selectedPPEs.size}</strong> KKD kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setBulkDeleteModalOpen(false)}>İptal</Button>
              <Button variant="danger" onClick={confirmBulkDelete}>
                {selectedPPEs.size} Kaydı Sil
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
};
