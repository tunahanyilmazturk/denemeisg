import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { DataTable } from '../components/ui/DataTable';
import { ImageGallery } from '../components/ui/ImageGallery';
import { useDataTable } from '../hooks/useDataTable';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';
import { Plus, Download, FileText, Search, Edit2, Trash2, AlertCircle, Filter, X, Grid3x3, List, Eye, TrendingUp, CheckSquare, Square, Building2, User, Calendar, MapPin, ClipboardList, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { Incident, Severity, IncidentStatus, IncidentType } from '../types';
import toast from 'react-hot-toast';
import { PageTransition } from '../components/layout/PageTransition';
import { useUserDataFilter, useCanViewAll } from '../hooks/useUserDataFilter';

type ViewMode = 'grid' | 'list';

// Available incident types
const INCIDENT_TYPES: IncidentType[] = ['İş Kazası', 'Ramak Kala', 'Meslek Hastalığı', 'Çevre Olayı', 'Maddi Hasarlı Olay'];

export const Incidents = () => {
  const navigate = useNavigate();
  const { incidents, companies, personnel, addIncident, updateIncident, deleteIncident } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentIncident, setCurrentIncident] = useState<Partial<Incident>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(window.innerWidth < 1024 ? 'grid' : 'list');
  const [selectedIncidents, setSelectedIncidents] = useState<Set<string>>(new Set());
  const [detailIncidentId, setDetailIncidentId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [incidentToDelete, setIncidentToDelete] = useState<string | null>(null);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

  // Filter incidents based on user role (admin/manager see all, others see only their own)
  const userIncidents = useUserDataFilter(incidents);
  const canViewAll = useCanViewAll();

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
  } = useDataTable<Incident>({
    data: userIncidents,
    initialSort: { key: 'date', direction: 'desc' },
    initialPageSize: 10,
  });

  // Apply custom filters (manual filtering to avoid double-filter bug)
  const filteredIncidents = useMemo(() => {
    let result = [...userIncidents];

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((i) => 
        i.title.toLowerCase().includes(term) || 
        companies.find(c => c.id === i.companyId)?.name.toLowerCase().includes(term) ||
        i.description?.toLowerCase().includes(term) ||
        i.location?.toLowerCase().includes(term)
      );
    }
    
    // Apply filters
    if (filters.severity && filters.severity !== 'all') {
      result = result.filter(i => i.severity === filters.severity);
    }
    if (filters.status && filters.status !== 'all') {
      result = result.filter(i => i.status === filters.status);
    }
    if (filters.company && filters.company !== 'all') {
      result = result.filter(i => i.companyId === filters.company);
    }
    if (filters.type && filters.type !== 'all') {
      result = result.filter(i => i.type === filters.type);
    }
    
    return result;
  }, [userIncidents, searchTerm, filters, companies]);

  // Pagination
  const totalItems = filteredIncidents.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const displayedIncidents = filteredIncidents.slice(startIndex, endIndex);

  // Calculate statistics (based on user-visible incidents)
  const stats = useMemo(() => ({
    total: userIncidents.length,
    open: userIncidents.filter(i => i.status === 'Açık').length,
    investigating: userIncidents.filter(i => i.status === 'İnceleniyor').length,
    closed: userIncidents.filter(i => i.status === 'Kapalı').length,
    critical: userIncidents.filter(i => i.severity === 'Kritik' || i.severity === 'Yüksek').length,
  }), [userIncidents]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentIncident.id) {
      updateIncident(currentIncident as Incident);
      toast.success('Olay bildirimi başarıyla güncellendi.');
    }
    setIsModalOpen(false);
    setCurrentIncident({});
  };

  const handleDelete = (id: string) => {
    setIncidentToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (incidentToDelete) {
      deleteIncident(incidentToDelete);
      toast.success('Olay bildirimi başarıyla silindi.');
      setDeleteModalOpen(false);
      setIncidentToDelete(null);
    }
  };

  const openEditModal = (incident: Incident) => {
    setCurrentIncident(incident);
    setIsModalOpen(true);
  };

  const toggleSelectIncident = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newSelected = new Set(selectedIncidents);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIncidents(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIncidents.size === displayedIncidents.length) {
      setSelectedIncidents(new Set());
    } else {
      setSelectedIncidents(new Set(displayedIncidents.map(i => i.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIncidents.size === 0) {
      toast.error('Lütfen silmek için olay seçiniz.');
      return;
    }
    setBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = () => {
    selectedIncidents.forEach(id => deleteIncident(id));
    const count = selectedIncidents.size;
    setSelectedIncidents(new Set());
    setBulkDeleteModalOpen(false);
    toast.success(`${count} olay bildirimi başarıyla silindi.`);
  };

  const getDetailIncident = () => {
    return incidents.find(i => i.id === detailIncidentId);
  };

  const handleExportPDF = () => {
    const columns = ['Başlık', 'Firma', 'Personel', 'Tarih', 'Öncelik', 'Durum', 'Tür'];
    const data = filteredIncidents.map(i => {
      const person = personnel.find(p => p.id === i.personnelId);
      return [
        i.title, 
        companies.find(c => c.id === i.companyId)?.name || '-',
        person ? `${person.firstName} ${person.lastName}` : '-',
        new Date(i.date).toLocaleString('tr-TR'),
        i.severity,
        i.status,
        i.type || '-'
      ];
    });
    exportToPDF('Kaza ve Olay Bildirimleri', columns, data, 'olaylar');
    toast.success('PDF başarıyla indirildi.');
  };

  const handleExportExcel = () => {
    const data = filteredIncidents.map(i => {
      const person = personnel.find(p => p.id === i.personnelId);
      return {
        'Başlık': i.title,
        'Açıklama': i.description,
        'Firma': companies.find(c => c.id === i.companyId)?.name || '-',
        'İlgili Personel': person ? `${person.firstName} ${person.lastName}` : '-',
        'Tarih': new Date(i.date).toLocaleString('tr-TR'),
        'Konum': i.location,
        'Olay Türü': i.type || '-',
        'Öncelik': i.severity,
        'Durum': i.status,
        'Kök Neden': i.rootCause || '-',
        'Kayıt Tarihi': new Date(i.createdAt).toLocaleString('tr-TR')
      };
    });
    exportToExcel(data, 'olaylar');
    toast.success('Excel başarıyla indirildi.');
  };

  const getSeverityColor = (severity: Severity) => {
    switch(severity) {
      case 'Kritik': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'Yüksek': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'Orta': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'Düşük': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityDotColor = (severity: Severity) => {
    switch(severity) {
      case 'Kritik': return 'bg-red-500';
      case 'Yüksek': return 'bg-orange-500';
      case 'Orta': return 'bg-amber-500';
      case 'Düşük': return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: IncidentStatus) => {
    switch(status) {
      case 'Açık': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'İnceleniyor': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'Kapalı': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const detailIncident = getDetailIncident();
  const detailCompany = detailIncident ? companies.find(c => c.id === detailIncident.companyId) : null;
  const detailPerson = detailIncident?.personnelId ? personnel.find(p => p.id === detailIncident.personnelId) : null;

  const columns = [
    {
      key: 'select',
      header: () => (
        <button onClick={toggleSelectAll} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors">
          {selectedIncidents.size === displayedIncidents.length && displayedIncidents.length > 0 ? (
            <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          ) : (
            <Square className="h-4 w-4 text-slate-400" />
          )}
        </button>
      ),
      width: '40px',
      render: (i: Incident) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSelectIncident(i.id, e);
          }}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
        >
          {selectedIncidents.has(i.id) ? (
            <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          ) : (
            <Square className="h-4 w-4 text-slate-400" />
          )}
        </button>
      ),
    },
    {
      key: 'title',
      header: 'Olay',
      sortable: true,
      render: (i: Incident) => (
        <div className="flex items-start gap-2">
          <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${getSeverityDotColor(i.severity)}`} title={i.severity} />
          <div>
            <p className="font-medium text-slate-900 dark:text-white">{i.title}</p>
            <p className="text-xs text-slate-500 truncate max-w-xs mt-1">{i.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'companyId',
      header: 'Firma & Personel',
      sortable: true,
      render: (i: Incident) => {
        const person = personnel.find(p => p.id === i.personnelId);
        return (
          <div>
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              <p className="font-medium text-slate-900 dark:text-white text-sm">{companies.find(c => c.id === i.companyId)?.name}</p>
            </div>
            {person && (
              <div className="flex items-center gap-1.5 mt-1">
                <User className="h-3 w-3 text-slate-400" />
                <p className="text-xs text-slate-500">{person.firstName} {person.lastName}</p>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'location',
      header: 'Konum & Tür',
      render: (i: Incident) => (
        <div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            <p className="text-sm text-slate-700 dark:text-slate-300">{i.location}</p>
          </div>
          {i.type && (
            <p className="text-xs text-slate-500 mt-1">{i.type}</p>
          )}
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Tarih',
      sortable: true,
      width: '140px',
      render: (i: Incident) => (
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span className="whitespace-nowrap text-slate-700 dark:text-slate-300 text-sm">
            {new Date(i.date).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}
          </span>
        </div>
      ),
    },
    {
      key: 'severity',
      header: 'Öncelik',
      sortable: true,
      width: '110px',
      render: (i: Incident) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(i.severity)}`}>
          {i.severity}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Durum',
      sortable: true,
      width: '110px',
      render: (i: Incident) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(i.status)}`}>
          {i.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'İşlemler',
      width: '140px',
      render: (i: Incident) => (
        <div className="flex items-center justify-end gap-2">
          <button
           onClick={(e) => {
             e.stopPropagation();
             navigate(`/incidents/${i.id}`);
           }}
           className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg dark:text-indigo-400 dark:hover:bg-indigo-900/30 transition-colors"
           title="Detayları Gör"
         >
           <Eye className="h-4 w-4" />
         </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(i);
            }}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
            title="Düzenle"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(i.id);
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

  const hasActiveFilters = searchTerm || filters.severity || filters.status || filters.company || filters.type;

  return (
    <PageTransition>
      <div className="space-y-4">
        {/* Stats Cards */}
        <div className="hidden lg:grid lg:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <AlertCircle className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 opacity-70 hidden sm:block" />
            </div>
            <p className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1">{stats.total}</p>
            <p className="text-xs sm:text-sm text-white/80">Toplam Olay</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <AlertCircle className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 opacity-70 hidden sm:block" />
            </div>
            <p className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1">{stats.open}</p>
            <p className="text-xs sm:text-sm text-white/80">Açık</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Search className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 opacity-70 hidden sm:block" />
            </div>
            <p className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1">{stats.investigating}</p>
            <p className="text-xs sm:text-sm text-white/80">İnceleniyor</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <CheckSquare className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 opacity-70 hidden sm:block" />
            </div>
            <p className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1">{stats.closed}</p>
            <p className="text-xs sm:text-sm text-white/80">Kapalı</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-pink-600 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white shadow-lg col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <AlertCircle className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 opacity-70 hidden sm:block" />
            </div>
            <p className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1">{stats.critical}</p>
            <p className="text-xs sm:text-sm text-white/80">Kritik/Yüksek</p>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
              Kaza ve Olay Bildirimleri
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-lg">İş kazaları ve ramak kala olaylarını takip edin.</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {selectedIncidents.size > 0 && (
              <Button variant="danger" onClick={handleBulkDelete} className="gap-2">
                <Trash2 className="h-4 w-4" /> Seçilileri Sil ({selectedIncidents.size})
              </Button>
            )}
            <Button variant="secondary" onClick={handleExportExcel} className="gap-2">
              <Download className="h-4 w-4" /> Excel
            </Button>
            <Button variant="secondary" onClick={handleExportPDF} className="gap-2">
              <FileText className="h-4 w-4" /> PDF
            </Button>
            <Button onClick={() => navigate('/incidents/new')} className="gap-2">
              <AlertCircle className="h-4 w-4" /> Yeni Bildirim
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Olay başlığı, firma, açıklama veya konum ara..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                <Button variant="ghost" onClick={clearFilters} className="gap-2 text-slate-500">
                  <X className="h-4 w-4" />
                  Temizle
                </Button>
              )}
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> Firma
                </label>
                <select
                  value={filters.company || 'all'}
                  onChange={(e) => { setFilter('company', e.target.value === 'all' ? '' : e.target.value); setCurrentPage(1); }}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="all">Tüm Firmalar</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" /> Öncelik
                </label>
                <select
                  value={filters.severity || 'all'}
                  onChange={(e) => { setFilter('severity', e.target.value === 'all' ? '' : e.target.value); setCurrentPage(1); }}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="all">Tüm Öncelikler</option>
                  <option value="Düşük">Düşük</option>
                  <option value="Orta">Orta</option>
                  <option value="Yüksek">Yüksek</option>
                  <option value="Kritik">Kritik</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <CheckSquare className="h-3.5 w-3.5" /> Durum
                </label>
                <select
                  value={filters.status || 'all'}
                  onChange={(e) => { setFilter('status', e.target.value === 'all' ? '' : e.target.value); setCurrentPage(1); }}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="Açık">Açık</option>
                  <option value="İnceleniyor">İnceleniyor</option>
                  <option value="Kapalı">Kapalı</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <ClipboardList className="h-3.5 w-3.5" /> Olay Türü
                </label>
                <select
                  value={filters.type || 'all'}
                  onChange={(e) => { setFilter('type', e.target.value === 'all' ? '' : e.target.value); setCurrentPage(1); }}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="all">Tüm Türler</option>
                  {INCIDENT_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Data View */}
        {viewMode === 'list' ? (
          <DataTable
            data={displayedIncidents}
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
            keyExtractor={(i) => i.id}
            emptyMessage="Olay kaydı bulunamadı."
          />
        ) : (
          <>
            <div className="bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-2xl rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-6">
              {displayedIncidents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-lg font-semibold text-slate-600 dark:text-slate-400">Olay kaydı bulunamadı.</p>
                  <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Yeni olay bildirimi eklemek için yukarıdaki butonu kullanın.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedIncidents.map((incident) => {
                    const company = companies.find(c => c.id === incident.companyId);
                    const person = personnel.find(p => p.id === incident.personnelId);
                    const isSelected = selectedIncidents.has(incident.id);
                    
                    return (
                      <div
                        key={incident.id}
                        className={`group relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/50 rounded-2xl p-5 border-2 transition-all cursor-pointer hover:shadow-xl ${
                          isSelected
                            ? 'border-indigo-500 dark:border-indigo-400 shadow-lg shadow-indigo-500/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                        }`}
                        onClick={() => navigate(`/incidents/${incident.id}`)}
                      >
                        {/* Selection & Severity */}
                        <div className="flex items-start justify-between mb-3">
                          <div className={`w-3 h-3 rounded-full ${getSeverityDotColor(incident.severity)}`} title={incident.severity} />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelectIncident(incident.id, e);
                            }}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                          >
                            {isSelected ? (
                              <CheckSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            ) : (
                              <Square className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
                            )}
                          </button>
                        </div>

                        {/* Title & Description */}
                        <div className="mb-4">
                          <h3 className="font-bold text-slate-900 dark:text-white line-clamp-2 mb-2">{incident.title}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{incident.description}</p>
                        </div>

                        {/* Info */}
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <Building2 className="h-4 w-4 text-slate-400" />
                            <span className="truncate">{company?.name}</span>
                          </div>
                          {person && (
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <User className="h-4 w-4 text-slate-400" />
                              <span>{person.firstName} {person.lastName}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            <span>{incident.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <span>{new Date(incident.date).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex gap-2 flex-wrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${getSeverityColor(incident.severity)}`}>
                              {incident.severity}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusColor(incident.status)}`}>
                              {incident.status}
                            </span>
                            {incident.type && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                {incident.type}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(incident);
                            }}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-all"
                            title="Düzenle"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(incident.id);
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

            {/* Grid View Pagination */}
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

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Olayı Düzenle"
        className="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Olay Başlığı</label>
            <Input required value={currentIncident.title || ''} onChange={e => setCurrentIncident({...currentIncident, title: e.target.value})} />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Açıklama</label>
            <textarea 
              required
              className="flex min-h-[100px] w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
              value={currentIncident.description || ''}
              onChange={e => setCurrentIncident({...currentIncident, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Firma</label>
              <select 
                required
                className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
                value={currentIncident.companyId || ''}
                onChange={e => setCurrentIncident({...currentIncident, companyId: e.target.value})}
              >
                <option value="">Seçiniz</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">İlgili Personel (Opsiyonel)</label>
              <select 
                className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
                value={currentIncident.personnelId || ''}
                onChange={e => setCurrentIncident({...currentIncident, personnelId: e.target.value})}
              >
                <option value="">Seçiniz</option>
                {personnel.filter(p => p.assignedCompanyId === currentIncident.companyId).map(p => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tarih ve Saat</label>
              <Input required type="datetime-local" value={currentIncident.date ? currentIncident.date.substring(0, 16) : ''} onChange={e => setCurrentIncident({...currentIncident, date: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Konum/Bölüm</label>
              <Input required value={currentIncident.location || ''} onChange={e => setCurrentIncident({...currentIncident, location: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Öncelik/Şiddet</label>
              <select 
                required
                className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
                value={currentIncident.severity || 'Orta'}
                onChange={e => setCurrentIncident({...currentIncident, severity: e.target.value as Severity})}
              >
                <option value="Düşük">Düşük</option>
                <option value="Orta">Orta</option>
                <option value="Yüksek">Yüksek</option>
                <option value="Kritik">Kritik</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Durum</label>
              <select 
                required
                className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
                value={currentIncident.status || 'Açık'}
                onChange={e => setCurrentIncident({...currentIncident, status: e.target.value as IncidentStatus})}
              >
                <option value="Açık">Açık</option>
                <option value="İnceleniyor">İnceleniyor</option>
                <option value="Kapalı">Kapalı</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Olay Türü</label>
              <select 
                className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
                value={currentIncident.type || ''}
                onChange={e => setCurrentIncident({...currentIncident, type: e.target.value as IncidentType})}
              >
                <option value="">Seçiniz</option>
                {INCIDENT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>İptal</Button>
            <Button type="submit">Kaydet</Button>
          </div>
        </form>
      </Modal>

      {/* Incident Detail Modal */}
      <Modal
        isOpen={!!detailIncidentId}
        onClose={() => setDetailIncidentId(null)}
        title="Olay Detayları"
        size="xl"
      >
        {detailIncident && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4 pb-5 border-b border-slate-200 dark:border-slate-700">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-lg">
                <AlertCircle className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{detailIncident.title}</h2>
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold border ${getSeverityColor(detailIncident.severity)}`}>
                    {detailIncident.severity}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(detailIncident.status)}`}>
                    {detailIncident.status}
                  </span>
                  {detailIncident.type && (
                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                      {detailIncident.type}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Açıklama</h3>
              <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                {detailIncident.description}
              </p>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Olay Bilgileri</h3>
                <div className="space-y-2.5">
                  {detailCompany && (
                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Firma</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{detailCompany.name}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Konum</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{detailIncident.location}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Olay Tarihi</p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {new Date(detailIncident.date).toLocaleString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Diğer Bilgiler</h3>
                <div className="space-y-2.5">
                  {detailPerson && (
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">İlgili Personel</p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {detailPerson.firstName} {detailPerson.lastName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{detailPerson.role}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Kayıt Tarihi</p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {new Date(detailIncident.createdAt).toLocaleString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  {detailIncident.type && (
                    <div className="flex items-start gap-3">
                      <ClipboardList className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Olay Türü</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{detailIncident.type}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Info */}
            {detailIncident.rootCause && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Kök Neden Analizi</h3>
                <p className="text-slate-700 dark:text-slate-300 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                  {detailIncident.rootCause}
                </p>
              </div>
            )}

            {/* Photos */}
            {detailIncident.photos && detailIncident.photos.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Olay Fotoğrafları ({detailIncident.photos.length})
                </h3>
                <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                  <ImageGallery photos={detailIncident.photos} columns={3} maxDisplay={6} />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button variant="ghost" onClick={() => setDetailIncidentId(null)}>Kapat</Button>
              <Button onClick={() => { setDetailIncidentId(null); openEditModal(detailIncident); }}>
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
        onClose={() => setDeleteModalOpen(false)}
        title="Olay Bildirimini Sil"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            Bu olay bildirimini kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
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
            <strong>{selectedIncidents.size} olay bildirimini</strong> kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setBulkDeleteModalOpen(false)}>
              İptal
            </Button>
            <Button variant="danger" onClick={confirmBulkDelete} className="gap-2">
              <Trash2 className="h-4 w-4" /> {selectedIncidents.size} Olay Bildirimini Sil
            </Button>
          </div>
        </div>
      </Modal>
    </div>
    </PageTransition>
  );
};
