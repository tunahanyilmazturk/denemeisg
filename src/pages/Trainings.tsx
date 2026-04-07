import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { DataTable } from '../components/ui/DataTable';
import { useDataTable } from '../hooks/useDataTable';
import { Plus, Download, FileText, Search, Edit2, Trash2, GraduationCap, Filter, X, Grid3x3, List, Eye, TrendingUp, CheckSquare, Square, Calendar, Users, Clock, ChevronLeft, ChevronRight, Building2, BookOpen, FileSpreadsheet } from 'lucide-react';
import { Training, TrainingStatus } from '../types';
import { exportToPDF, exportToExcel, exportTrainingsReport } from '../utils/exportUtils';
import toast from 'react-hot-toast';
import { PageTransition } from '../components/layout/PageTransition';
import { useUserDataFilter } from '../hooks/useUserDataFilter';

type ViewMode = 'grid' | 'list';

export const Trainings = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { trainings, personnel, companies, addTraining, updateTraining, deleteTraining } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTraining, setCurrentTraining] = useState<Partial<Training>>({ participants: [] });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(window.innerWidth < 1024 ? 'grid' : 'list');
  const [selectedTrainings, setSelectedTrainings] = useState<Set<string>>(new Set());
  const [detailTrainingId, setDetailTrainingId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [trainingToDelete, setTrainingToDelete] = useState<string | null>(null);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

  // Filter trainings based on user role (admin/manager see all, others see only their own)
  const userTrainings = useUserDataFilter(trainings);

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
  } = useDataTable<Training>({
    data: userTrainings,
    initialSort: { key: 'date', direction: 'desc' },
    initialPageSize: 10,
  });

  // Apply custom filters (manual filtering to avoid double-filter bug)
  const filteredTrainings = useMemo(() => {
    let result = [...userTrainings];

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((t) => 
        t.title.toLowerCase().includes(term) || 
        t.trainer.toLowerCase().includes(term) ||
        t.description?.toLowerCase().includes(term)
      );
    }
    
    // Apply filters
    if (filters.status && filters.status !== 'all') {
      result = result.filter(t => t.status === filters.status);
    }
    if (filters.company && filters.company !== 'all') {
      result = result.filter(t => {
        // Filter by participants' company
        return t.participants.some(pId => {
          const person = personnel.find(p => p.id === pId);
          return person?.assignedCompanyId === filters.company;
        });
      });
    }
    
    return result;
  }, [userTrainings, searchTerm, filters, personnel]);

  // Pagination
  const totalItems = filteredTrainings.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const displayedTrainings = filteredTrainings.slice(startIndex, endIndex);

  // Calculate statistics
  const stats = useMemo(() => ({
    total: trainings.length,
    planned: trainings.filter(t => t.status === 'Planlandı').length,
    completed: trainings.filter(t => t.status === 'Tamamlandı').length,
    cancelled: trainings.filter(t => t.status === 'İptal').length,
    totalParticipants: trainings.reduce((sum, t) => sum + t.participants.length, 0),
    totalHours: trainings.filter(t => t.status === 'Tamamlandı').reduce((sum, t) => sum + t.duration, 0),
  }), [trainings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentTraining.id) {
      updateTraining(currentTraining as Training);
      toast.success('Eğitim başarıyla güncellendi.');
    } else {
      addTraining({
        ...currentTraining,
        id: Math.random().toString(36).substr(2, 9),
        createdBy: user?.id,
        createdAt: new Date().toISOString(),
      } as Training);
      toast.success('Eğitim başarıyla eklendi.');
    }
    setIsModalOpen(false);
    setCurrentTraining({ participants: [] });
  };

  const handleDelete = (id: string) => {
    setTrainingToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (trainingToDelete) {
      deleteTraining(trainingToDelete);
      toast.success('Eğitim başarıyla silindi.');
      setDeleteModalOpen(false);
      setTrainingToDelete(null);
    }
  };

  const openEditModal = (training: Training) => {
    setCurrentTraining(training);
    setIsModalOpen(true);
  };

  const toggleParticipant = (personnelId: string) => {
    const participants = currentTraining.participants || [];
    if (participants.includes(personnelId)) {
      setCurrentTraining({ ...currentTraining, participants: participants.filter(id => id !== personnelId) });
    } else {
      setCurrentTraining({ ...currentTraining, participants: [...participants, personnelId] });
    }
  };

  const toggleSelectTraining = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newSelected = new Set(selectedTrainings);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTrainings(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedTrainings.size === displayedTrainings.length) {
      setSelectedTrainings(new Set());
    } else {
      setSelectedTrainings(new Set(displayedTrainings.map(t => t.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedTrainings.size === 0) {
      toast.error('Lütfen silmek için eğitim seçiniz.');
      return;
    }
    setBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = () => {
    selectedTrainings.forEach(id => deleteTraining(id));
    const count = selectedTrainings.size;
    setSelectedTrainings(new Set());
    setBulkDeleteModalOpen(false);
    toast.success(`${count} eğitim başarıyla silindi.`);
  };

  const getDetailTraining = () => {
    return trainings.find(t => t.id === detailTrainingId);
  };

  const handleExportPDF = () => {
    const columns = ['Eğitim Adı', 'Eğitmen', 'Tarih', 'Süre (Saat)', 'Durum', 'Katılımcı Sayısı', 'Katılımcılar'];
    const data = filteredTrainings.map(t => {
      const participantNames = t.participants
        .map(pId => {
          const p = personnel.find(person => person.id === pId);
          return p ? `${p.firstName} ${p.lastName}` : '';
        })
        .filter(Boolean)
        .join(', ');
      
      return [
        t.title, 
        t.trainer,
        new Date(t.date).toLocaleString('tr-TR'),
        t.duration.toString(),
        t.status,
        t.participants.length.toString(),
        participantNames || '-'
      ];
    });
    exportToPDF('Eğitimler Listesi', columns, data, 'egitimler');
    toast.success('PDF başarıyla indirildi.');
  };

  const handleExportExcel = () => {
    const data = filteredTrainings.map(t => {
      const participantNames = t.participants
        .map(pId => {
          const p = personnel.find(person => person.id === pId);
          return p ? `${p.firstName} ${p.lastName}` : '';
        })
        .filter(Boolean)
        .join(', ');
      
      return {
        'Eğitim Adı': t.title,
        'Açıklama': t.description || '-',
        'Eğitmen': t.trainer,
        'Tarih': new Date(t.date).toLocaleString('tr-TR'),
        'Süre (Saat)': t.duration,
        'Durum': t.status,
        'Katılımcı Sayısı': t.participants.length,
        'Katılımcılar': participantNames || '-',
        'Kayıt Tarihi': new Date(t.createdAt).toLocaleString('tr-TR')
      };
    });
    exportToExcel(data, 'egitimler');
    toast.success('Excel başarıyla indirildi.');
  };

  const handleDetailedExport = () => {
    exportTrainingsReport(filteredTrainings, personnel);
    toast.success('Detaylı rapor Excel olarak indirildi.');
  };

  const getStatusColor = (status: TrainingStatus) => {
    switch(status) {
      case 'İptal': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'Planlandı': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Tamamlandı': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDotColor = (status: TrainingStatus) => {
    switch(status) {
      case 'İptal': return 'bg-red-500';
      case 'Planlandı': return 'bg-blue-500';
      case 'Tamamlandı': return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  const detailTraining = getDetailTraining();
  const detailParticipants = detailTraining
    ? personnel.filter(p => detailTraining.participants.includes(p.id))
    : [];

  const columns = [
    {
      key: 'select',
      header: () => (
        <button onClick={toggleSelectAll} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors">
          {selectedTrainings.size === displayedTrainings.length && displayedTrainings.length > 0 ? (
            <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          ) : (
            <Square className="h-4 w-4 text-slate-400" />
          )}
        </button>
      ),
      width: '40px',
      render: (t: Training) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSelectTraining(t.id, e);
          }}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
        >
          {selectedTrainings.has(t.id) ? (
            <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          ) : (
            <Square className="h-4 w-4 text-slate-400" />
          )}
        </button>
      ),
    },
    {
      key: 'title',
      header: 'Eğitim',
      sortable: true,
      render: (t: Training) => (
        <div className="flex items-start gap-2">
          <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${getStatusDotColor(t.status)}`} title={t.status} />
          <div>
            <div className="font-medium text-slate-900 dark:text-white">{t.title}</div>
            {t.description && (
              <p className="text-xs text-slate-500 truncate max-w-xs mt-1">{t.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'trainer',
      header: 'Eğitmen',
      sortable: true,
      render: (t: Training) => (
        <div className="flex items-center gap-1.5">
          <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-700 dark:text-slate-300">{t.trainer}</span>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Tarih & Süre',
      sortable: true,
      width: '160px',
      render: (t: Training) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              {new Date(t.date).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-slate-400" />
            <span className="text-xs text-slate-500 dark:text-slate-400">{t.duration} Saat</span>
          </div>
        </div>
      ),
    },
    {
      key: 'participants',
      header: 'Katılımcılar',
      width: '140px',
      render: (t: Training) => (
        <div className="flex -space-x-2 overflow-hidden">
          {t.participants.slice(0, 3).map(pId => {
            const p = personnel.find(person => person.id === pId);
            return (
              <div 
                key={pId} 
                className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-900 bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-xs font-medium text-white" 
                title={p ? `${p.firstName} ${p.lastName}` : 'Bilinmeyen'}
              >
                {p ? p.firstName[0] + p.lastName[0] : '?'}
              </div>
            );
          })}
          {t.participants.length > 3 && (
            <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-medium text-slate-500">
              +{t.participants.length - 3}
            </div>
          )}
          {t.participants.length === 0 && <span className="text-slate-400 italic text-sm">Yok</span>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Durum',
      sortable: true,
      width: '110px',
      render: (t: Training) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(t.status)}`}>
          {t.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'İşlemler',
      width: '140px',
      render: (t: Training) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDetailTrainingId(t.id);
            }}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg dark:text-indigo-400 dark:hover:bg-indigo-900/30 transition-colors"
            title="Detayları Gör"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(t);
            }}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
            title="Düzenle"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(t.id);
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

  const hasActiveFilters = searchTerm || filters.status || filters.company;

  return (
    <PageTransition>
      <div className="space-y-4">
        {/* Stats Cards */}
        <div className="hidden lg:grid lg:grid-cols-6 gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <GraduationCap className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 opacity-70 hidden sm:block" />
            </div>
            <p className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1">{stats.total}</p>
            <p className="text-xs sm:text-sm text-white/80">Toplam Eğitim</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Calendar className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 opacity-70 hidden sm:block" />
            </div>
            <p className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1">{stats.planned}</p>
            <p className="text-xs sm:text-sm text-white/80">Planlandı</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <CheckSquare className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 opacity-70 hidden sm:block" />
            </div>
            <p className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1">{stats.completed}</p>
            <p className="text-xs sm:text-sm text-white/80">Tamamlandı</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <X className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 opacity-70 hidden sm:block" />
            </div>
            <p className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1">{stats.cancelled}</p>
            <p className="text-xs sm:text-sm text-white/80">İptal</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-pink-600 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Users className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1">{stats.totalParticipants}</p>
            <p className="text-xs sm:text-sm text-white/80">Toplam Katılımcı</p>
          </div>

          <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Clock className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1">{stats.totalHours}</p>
            <p className="text-xs sm:text-sm text-white/80">Toplam Saat</p>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">Eğitimler</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-lg">İSG eğitimlerini ve katılımcıları takip edin.</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {selectedTrainings.size > 0 && (
              <Button variant="danger" onClick={handleBulkDelete} className="gap-2">
                <Trash2 className="h-4 w-4" /> Seçilileri Sil ({selectedTrainings.size})
              </Button>
            )}
            <div className="relative flex-1 sm:flex-none">
              <Button variant="secondary" onClick={handleDetailedExport} className="gap-2">
                <FileSpreadsheet className="h-4 w-4" /> Detaylı Rapor
              </Button>
            </div>
            <Button variant="secondary" onClick={handleExportExcel} className="gap-2">
              <Download className="h-4 w-4" /> Excel
            </Button>
            <Button variant="secondary" onClick={handleExportPDF} className="gap-2">
              <FileText className="h-4 w-4" /> PDF
            </Button>
            <Button onClick={() => navigate('/trainings/new')} className="gap-2">
              <Plus className="h-4 w-4" /> Yeni Eğitim
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Eğitim adı, eğitmen veya açıklama ara..." 
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
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <option value="Planlandı">Planlandı</option>
                  <option value="Tamamlandı">Tamamlandı</option>
                  <option value="İptal">İptal</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> Firma (Katılımcı Bazlı)
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
            </div>
          )}
        </div>

        {/* Data View */}
        {viewMode === 'list' ? (
          <DataTable
            data={displayedTrainings}
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
            keyExtractor={(t) => t.id}
            emptyMessage="Eğitim kaydı bulunamadı."
          />
        ) : (
          <>
            <div className="bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-2xl rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-6">
              {displayedTrainings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <GraduationCap className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-lg font-semibold text-slate-600 dark:text-slate-400">Eğitim kaydı bulunamadı.</p>
                  <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Yeni eğitim planlamak için yukarıdaki butonu kullanın.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedTrainings.map((training) => {
                    const isSelected = selectedTrainings.has(training.id);
                    
                    return (
                      <div
                        key={training.id}
                        className={`group relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/50 rounded-2xl p-5 border-2 transition-all cursor-pointer hover:shadow-xl ${
                          isSelected
                            ? 'border-indigo-500 dark:border-indigo-400 shadow-lg shadow-indigo-500/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                        }`}
                        onClick={() => setDetailTrainingId(training.id)}
                      >
                        {/* Status dot & Selection */}
                        <div className="flex items-start justify-between mb-3">
                          <div className={`w-3 h-3 rounded-full ${getStatusDotColor(training.status)}`} title={training.status} />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelectTraining(training.id, e);
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

                        {/* Title & Trainer */}
                        <div className="mb-4">
                          <h3 className="font-bold text-slate-900 dark:text-white mb-2">{training.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <GraduationCap className="h-4 w-4 text-slate-400" />
                            <span>{training.trainer}</span>
                          </div>
                          {training.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">{training.description}</p>
                          )}
                        </div>

                        {/* Info */}
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <span>{new Date(training.date).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <span>{training.duration} Saat</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <Users className="h-4 w-4 text-slate-400" />
                            <span>{training.participants.length} Katılımcı</span>
                          </div>
                        </div>

                        {/* Badges & Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(training.status)}`}>
                            {training.status}
                          </span>
                        </div>

                        {/* Quick Actions */}
                        <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(training);
                            }}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-all"
                            title="Düzenle"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(training.id);
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
          title={currentTraining.id ? "Eğitimi Düzenle" : "Yeni Eğitim Planla"}
          className="max-w-2xl"
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Eğitim Başlığı</label>
              <Input required value={currentTraining.title || ''} onChange={e => setCurrentTraining({...currentTraining, title: e.target.value})} />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Açıklama (Opsiyonel)</label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
                value={currentTraining.description || ''}
                onChange={e => setCurrentTraining({...currentTraining, description: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Eğitmen</label>
                <Input required value={currentTraining.trainer || ''} onChange={e => setCurrentTraining({...currentTraining, trainer: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Durum</label>
                <select 
                  required
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
                  value={currentTraining.status || 'Planlandı'}
                  onChange={e => setCurrentTraining({...currentTraining, status: e.target.value as TrainingStatus})}
                >
                  <option value="Planlandı">Planlandı</option>
                  <option value="Tamamlandı">Tamamlandı</option>
                  <option value="İptal">İptal</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tarih ve Saat</label>
                <Input required type="datetime-local" value={currentTraining.date ? currentTraining.date.substring(0, 16) : ''} onChange={e => setCurrentTraining({...currentTraining, date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Süre (Saat)</label>
                <Input required type="number" min="1" value={currentTraining.duration || ''} onChange={e => setCurrentTraining({...currentTraining, duration: parseInt(e.target.value)})} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Katılımcılar</label>
              <div className="border border-gray-300 dark:border-gray-700 rounded-md p-3 max-h-40 overflow-y-auto space-y-2 bg-gray-50 dark:bg-gray-900/50">
                {personnel.map(p => (
                  <label key={p.id} className="flex items-center gap-3 cursor-pointer p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                      checked={currentTraining.participants?.includes(p.id) || false}
                      onChange={() => toggleParticipant(p.id)}
                    />
                    <span className="text-sm">{p.firstName} {p.lastName} <span className="text-gray-500 text-xs">({p.role})</span></span>
                  </label>
                ))}
                {personnel.length === 0 && <p className="text-sm text-gray-500">Sistemde personel bulunmuyor.</p>}
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>İptal</Button>
              <Button type="submit">Kaydet</Button>
            </div>
          </form>
        </Modal>

        {/* Training Detail Modal */}
        <Modal
          isOpen={!!detailTrainingId}
          onClose={() => setDetailTrainingId(null)}
          title="Eğitim Detayları"
          size="xl"
        >
          {detailTraining && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start gap-4 pb-5 border-b border-slate-200 dark:border-slate-700">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white shadow-lg">
                  <GraduationCap className="h-8 w-8" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{detailTraining.title}</h2>
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(detailTraining.status)}`}>
                      {detailTraining.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {detailTraining.description && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Açıklama
                  </h3>
                  <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    {detailTraining.description}
                  </p>
                </div>
              )}

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Eğitim Bilgileri</h3>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3">
                      <GraduationCap className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Eğitmen</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{detailTraining.trainer}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Tarih</p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {new Date(detailTraining.date).toLocaleString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Süre</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{detailTraining.duration} Saat</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Diğer Bilgiler</h3>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Katılımcı Sayısı</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{detailTraining.participants.length} Kişi</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Kayıt Tarihi</p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {new Date(detailTraining.createdAt).toLocaleString('tr-TR', {
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
              </div>

              {/* Participants */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Katılımcılar ({detailParticipants.length})
                </h3>
                {detailParticipants.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                    {detailParticipants.map((person) => (
                      <div key={person.id} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-sm font-bold">
                          {person.firstName[0]}{person.lastName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {person.firstName} {person.lastName}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{person.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic">Bu eğitime katılımcı eklenmemiş.</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="ghost" onClick={() => setDetailTrainingId(null)}>Kapat</Button>
                <Button onClick={() => { setDetailTrainingId(null); openEditModal(detailTraining); }}>
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
          title="Eğitimi Sil"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-400">
              Bu eğitimi kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
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
              <strong>{selectedTrainings.size} eğitimi</strong> kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setBulkDeleteModalOpen(false)}>
                İptal
              </Button>
              <Button variant="danger" onClick={confirmBulkDelete} className="gap-2">
                <Trash2 className="h-4 w-4" /> {selectedTrainings.size} Eğitimi Sil
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
};
