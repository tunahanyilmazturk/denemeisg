import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';
import { Risk, RiskStatus, RiskType } from '../types';
import {
  Plus, Search, Edit2, Trash2, Download, FileText, ShieldAlert, Filter, X,
  Grid3x3, List, Eye, TrendingUp, CheckSquare, Square, Calendar, User,
  AlertTriangle, ChevronLeft, ChevronRight, BarChart3, Shield, MapPin,
  Tag, Clock, CheckCircle2, RefreshCw, Activity, Info, Hash
} from 'lucide-react';
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
import { useUserDataFilter } from '../hooks/useUserDataFilter';

type ViewMode = 'grid' | 'list' | 'matrix';

const RISK_TYPES: RiskType[] = ['Fiziksel', 'Kimyasal', 'Biyolojik', 'Ergonomik', 'Psikososyal', 'Çevresel', 'Elektrik', 'Diğer'];

const RISK_TYPE_COLORS: Record<RiskType, string> = {
  'Fiziksel':    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Kimyasal':    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Biyolojik':   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Ergonomik':   'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Psikososyal': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  'Çevresel':    'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  'Elektrik':    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'Diğer':       'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
};

export const RisksPage = () => {
  const { user } = useAuthStore();
  const { risks, addRisk, updateRisk, deleteRisk } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRisk, setCurrentRisk] = useState<Partial<Risk>>({ probability: 1, severity: 1 });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(window.innerWidth < 1024 ? 'grid' : 'list');
  const [selectedRisks, setSelectedRisks] = useState<Set<string>>(new Set());
  const [detailRiskId, setDetailRiskId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [riskToDelete, setRiskToDelete] = useState<string | null>(null);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'control' | 'review'>('info');

  // Filter risks based on user role
  const userRisks = useUserDataFilter(risks);

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
  } = useDataTable<Risk>({
    data: userRisks,
    initialSort: { key: 'score', direction: 'desc' },
    initialPageSize: 10,
  });

  // Unique responsibles for filter
  const uniqueResponsibles = useMemo(() => {
    const set = new Set<string>();
    userRisks.forEach(r => { if (r.responsible) set.add(r.responsible); });
    return Array.from(set).sort();
  }, [userRisks]);

  // Unique locations for filter
  const uniqueLocations = useMemo(() => {
    const set = new Set<string>();
    userRisks.forEach(r => { if (r.location) set.add(r.location); });
    return Array.from(set).sort();
  }, [userRisks]);

  // Manual filtering
  const filteredRisks = useMemo(() => {
    let result = [...userRisks];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((r) =>
        r.hazard.toLowerCase().includes(term) ||
        r.risk.toLowerCase().includes(term) ||
        r.responsible.toLowerCase().includes(term) ||
        r.controlMeasure.toLowerCase().includes(term) ||
        (r.location || '').toLowerCase().includes(term)
      );
    }

    if (filters.status && filters.status !== 'all') {
      result = result.filter(r => r.status === filters.status);
    }

    if (filters.scoreRange && filters.scoreRange !== 'all') {
      result = result.filter(r => {
        if (filters.scoreRange === 'low') return r.score <= 6;
        if (filters.scoreRange === 'medium') return r.score > 6 && r.score <= 12;
        if (filters.scoreRange === 'high') return r.score > 12;
        return true;
      });
    }

    if (filters.responsible && filters.responsible !== 'all') {
      result = result.filter(r => r.responsible === filters.responsible);
    }

    if (filters.riskType && filters.riskType !== 'all') {
      result = result.filter(r => r.riskType === filters.riskType);
    }

    if (filters.location && filters.location !== 'all') {
      result = result.filter(r => r.location === filters.location);
    }

    if (sortConfig.key) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key as keyof Risk];
        const bVal = b[sortConfig.key as keyof Risk];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        return 0;
      });
    }

    return result;
  }, [userRisks, searchTerm, filters.status, filters.scoreRange, filters.responsible, filters.riskType, filters.location, sortConfig]);

  // Pagination
  const totalItems = filteredRisks.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const displayedRisks = filteredRisks.slice(startIndex, endIndex);

  // Statistics
  const stats = useMemo(() => {
    const avgScore = risks.length > 0
      ? (risks.reduce((sum, r) => sum + r.score, 0) / risks.length).toFixed(1)
      : '0';

    const today = new Date();
    const overdueReviews = risks.filter(r => {
      if (!r.nextReviewDate) return false;
      return new Date(r.nextReviewDate) < today;
    }).length;

    return {
      total: risks.length,
      open: risks.filter(r => r.status === 'Açık').length,
      inProgress: risks.filter(r => r.status === 'Devam Ediyor').length,
      resolved: risks.filter(r => r.status === 'Giderildi').length,
      highRisk: risks.filter(r => r.score > 12).length,
      mediumRisk: risks.filter(r => r.score > 6 && r.score <= 12).length,
      lowRisk: risks.filter(r => r.score <= 6).length,
      avgScore,
      overdueReviews,
    };
  }, [risks]);

  // Matrix data: probability (rows 5→1) x severity (cols 1→5)
  const matrixData = useMemo(() => {
    const matrix: Record<string, Risk[]> = {};
    for (let p = 1; p <= 5; p++) {
      for (let s = 1; s <= 5; s++) {
        matrix[`${p}-${s}`] = filteredRisks.filter(r => r.probability === p && r.severity === s);
      }
    }
    return matrix;
  }, [filteredRisks]);

  // Risk type distribution
  const riskTypeStats = useMemo(() => {
    const counts: Record<string, number> = {};
    risks.forEach(r => {
      const t = r.riskType || 'Diğer';
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [risks]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const score = (currentRisk.probability || 1) * (currentRisk.severity || 1);

    if (currentRisk.id) {
      updateRisk({ ...currentRisk, score } as Risk);
      toast.success('Risk kaydı güncellendi.');
    } else {
      addRisk({
        ...currentRisk,
        score,
        id: Date.now().toString(),
        createdBy: user?.id,
      } as Risk);
      toast.success('Yeni risk kaydı eklendi.');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setRiskToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (riskToDelete) {
      deleteRisk(riskToDelete);
      toast.success('Kayıt silindi.');
      setRiskToDelete(null);
    }
    setDeleteModalOpen(false);
  };

  const openEditModal = (risk: Risk) => {
    setCurrentRisk(risk);
    setIsModalOpen(true);
  };

  const toggleSelectRisk = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newSelected = new Set(selectedRisks);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedRisks(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedRisks.size === displayedRisks.length && displayedRisks.length > 0) {
      setSelectedRisks(new Set());
    } else {
      setSelectedRisks(new Set(displayedRisks.map(r => r.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedRisks.size === 0) { toast.error('Lütfen silmek için risk seçiniz.'); return; }
    setBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = () => {
    const count = selectedRisks.size;
    selectedRisks.forEach(id => deleteRisk(id));
    setSelectedRisks(new Set());
    setBulkDeleteModalOpen(false);
    toast.success(`${count} risk kaydı başarıyla silindi.`);
  };

  const getDetailRisk = () => risks.find(r => r.id === detailRiskId);

  const getScoreColor = (score: number) => {
    if (score <= 6) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    if (score <= 12) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
  };

  const getScoreLabel = (score: number) => {
    if (score <= 6) return 'Düşük';
    if (score <= 12) return 'Orta';
    return 'Yüksek';
  };

  const getScoreDotColor = (score: number) => {
    if (score <= 6) return 'bg-emerald-500';
    if (score <= 12) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getMatrixCellColor = (p: number, s: number) => {
    const score = p * s;
    if (score <= 6) return 'bg-emerald-100 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-200 dark:hover:bg-emerald-900/40';
    if (score <= 12) return 'bg-amber-100 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 hover:bg-amber-200 dark:hover:bg-amber-900/40';
    return 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800 hover:bg-red-200 dark:hover:bg-red-900/40';
  };

  const getStatusDotColor = (status: RiskStatus) => {
    switch (status) {
      case 'Giderildi': return 'bg-emerald-500';
      case 'Devam Ediyor': return 'bg-blue-500';
      default: return 'bg-red-500';
    }
  };

  const getScoreBarWidth = (score: number) => `${Math.min((score / 25) * 100, 100)}%`;

  const isReviewOverdue = (nextReviewDate?: string) => {
    if (!nextReviewDate) return false;
    return new Date(nextReviewDate) < new Date();
  };

  const isReviewSoon = (nextReviewDate?: string) => {
    if (!nextReviewDate) return false;
    const diff = new Date(nextReviewDate).getTime() - new Date().getTime();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  };

  const detailRisk = getDetailRisk();

  const hasActiveFilters = searchTerm || filters.status || filters.scoreRange || filters.responsible || filters.riskType || filters.location;

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('Risk Değerlendirme Tablosu', 14, 15);

    const tableData = filteredRisks.map(r => [
      new Date(r.date).toLocaleDateString('tr-TR'),
      r.hazard,
      r.risk,
      r.riskType || '-',
      `${r.probability} x ${r.severity} = ${r.score}`,
      getScoreLabel(r.score),
      r.controlMeasure,
      r.responsible,
      r.status,
    ]);

    (doc as any).autoTable({
      head: [['Tarih', 'Tehlike', 'Risk', 'Tip', 'Skor', 'Seviye', 'Kontrol Tedbiri', 'Sorumlu', 'Durum']],
      body: tableData,
      startY: 20,
    });

    doc.save('risk-degerlendirmesi.pdf');
    toast.success('PDF olarak dışa aktarıldı.');
  };

  const handleExportExcel = () => {
    const data = filteredRisks.map(r => ({
      'Tarih': new Date(r.date).toLocaleDateString('tr-TR'),
      'Tehlike': r.hazard,
      'Risk': r.risk,
      'Risk Tipi': r.riskType || '-',
      'Konum': r.location || '-',
      'Olasılık': r.probability,
      'Şiddet': r.severity,
      'Skor': r.score,
      'Risk Seviyesi': getScoreLabel(r.score),
      'Kontrol Tedbiri': r.controlMeasure,
      'Sorumlu': r.responsible,
      'Durum': r.status,
      'Son İnceleme': r.lastReviewDate ? new Date(r.lastReviewDate).toLocaleDateString('tr-TR') : '-',
      'Sonraki İnceleme': r.nextReviewDate ? new Date(r.nextReviewDate).toLocaleDateString('tr-TR') : '-',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Riskler');
    XLSX.writeFile(wb, 'risk-degerlendirmesi.xlsx');
    toast.success('Excel olarak dışa aktarıldı.');
  };

  const columns = [
    {
      key: 'select',
      header: () => (
        <button onClick={toggleSelectAll} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors">
          {selectedRisks.size === displayedRisks.length && displayedRisks.length > 0 ? (
            <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          ) : (
            <Square className="h-4 w-4 text-slate-400" />
          )}
        </button>
      ),
      width: '40px',
      render: (r: Risk) => (
        <button
          onClick={(e) => { e.stopPropagation(); toggleSelectRisk(r.id); }}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
        >
          {selectedRisks.has(r.id) ? (
            <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          ) : (
            <Square className="h-4 w-4 text-slate-400" />
          )}
        </button>
      ),
    },
    {
      key: 'hazard',
      header: 'Tehlike / Risk',
      sortable: true,
      render: (r: Risk) => (
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full shrink-0 ${getScoreDotColor(r.score)}`} />
            <span className="font-medium text-slate-900 dark:text-white">{r.hazard}</span>
            {r.riskType && (
              <span className={`hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${RISK_TYPE_COLORS[r.riskType]}`}>
                {r.riskType}
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 ml-4 mt-0.5">{r.risk}</div>
          {r.location && (
            <div className="flex items-center gap-1 ml-4 mt-0.5">
              <MapPin className="h-2.5 w-2.5 text-slate-400" />
              <span className="text-[10px] text-slate-400">{r.location}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'score',
      header: 'Skor',
      sortable: true,
      width: '130px',
      render: (r: Risk) => (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${getScoreColor(r.score)}`}>
              {r.score}
            </span>
            <span className="text-[10px] text-slate-400">{r.probability} × {r.severity}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${
                r.score > 12 ? 'bg-red-500' : r.score > 6 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: getScoreBarWidth(r.score) }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'scoreRange',
      header: 'Risk Seviyesi',
      width: '120px',
      render: (r: Risk) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getScoreColor(r.score)}`}>
          {getScoreLabel(r.score)}
        </span>
      ),
    },
    {
      key: 'controlMeasure',
      header: 'Kontrol Tedbiri',
      sortable: true,
      render: (r: Risk) => (
        <div className="max-w-xs truncate text-slate-700 dark:text-slate-300" title={r.controlMeasure}>
          {r.controlMeasure}
        </div>
      ),
    },
    {
      key: 'responsible',
      header: 'Sorumlu',
      sortable: true,
      render: (r: Risk) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {r.responsible.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <span className="text-slate-900 dark:text-white font-medium">{r.responsible}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Durum',
      sortable: true,
      width: '130px',
      render: (r: Risk) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${getStatusDotColor(r.status)}`} />
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              r.status === 'Giderildi'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
              r.status === 'Devam Ediyor'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {r.status}
            </span>
          </div>
          {r.nextReviewDate && (
            <div className={`flex items-center gap-1 text-[10px] ${
              isReviewOverdue(r.nextReviewDate) ? 'text-red-500' :
              isReviewSoon(r.nextReviewDate) ? 'text-amber-500' : 'text-slate-400'
            }`}>
              <Clock className="h-2.5 w-2.5" />
              {isReviewOverdue(r.nextReviewDate) ? 'Gecikmiş!' :
               isReviewSoon(r.nextReviewDate) ? 'Yakında!' :
               new Date(r.nextReviewDate).toLocaleDateString('tr-TR')}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Tarih',
      sortable: true,
      width: '110px',
      render: (r: Risk) => (
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-sm">{new Date(r.date).toLocaleDateString('tr-TR')}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'İşlemler',
      width: '140px',
      render: (r: Risk) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setDetailRiskId(r.id); }}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg dark:text-indigo-400 dark:hover:bg-indigo-900/30 transition-colors"
            title="Detayları Gör"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); openEditModal(r); }}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
            title="Düzenle"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
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
      <div className="space-y-4">

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <ShieldAlert className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 opacity-70 hidden sm:block" />
            </div>
            <p className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1">{stats.total}</p>
            <p className="text-xs sm:text-sm text-white/80">Toplam Risk</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 opacity-70 hidden sm:block" />
            </div>
            <p className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1">{stats.open}</p>
            <p className="text-xs sm:text-sm text-white/80">Açık</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Activity className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 opacity-70 hidden sm:block" />
            </div>
            <p className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1">{stats.inProgress}</p>
            <p className="text-xs sm:text-sm text-white/80">Devam Ediyor</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 opacity-70 hidden sm:block" />
            </div>
            <p className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1">{stats.resolved}</p>
            <p className="text-xs sm:text-sm text-white/80">Giderildi</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-pink-600 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1">{stats.highRisk}</p>
            <p className="text-xs sm:text-sm text-white/80">Yüksek Riskli</p>
          </div>

          <div className={`${stats.overdueReviews > 0 ? 'bg-gradient-to-br from-rose-500 to-red-700' : 'bg-gradient-to-br from-cyan-500 to-blue-600'} rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white shadow-lg`}>
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Clock className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1">{stats.overdueReviews > 0 ? stats.overdueReviews : stats.avgScore}</p>
            <p className="text-xs sm:text-sm text-white/80">{stats.overdueReviews > 0 ? 'Gecikmiş İnceleme' : 'Ort. Skor'}</p>
          </div>
        </div>

        {/* Risk Type Distribution */}
        {riskTypeStats.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Risk Tipi Dağılımı</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {riskTypeStats.map(([type, count]) => (
                <button
                  key={type}
                  onClick={() => {
                    setFilter('riskType', filters.riskType === type ? '' : type);
                    setCurrentPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    filters.riskType === type
                      ? 'ring-2 ring-offset-1 ring-indigo-400 dark:ring-indigo-500 shadow-md'
                      : 'hover:shadow-sm'
                  } ${RISK_TYPE_COLORS[type as RiskType] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}
                >
                  {type}
                  <span className="font-bold bg-white/50 dark:bg-black/20 px-1 rounded-full">{count}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
              Risk Değerlendirmesi
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-lg">
              Tehlike ve riskleri belirleyin, skorlayın ve tedbirleri takip edin.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {selectedRisks.size > 0 && (
              <Button variant="danger" onClick={handleBulkDelete} className="gap-2">
                <Trash2 className="h-4 w-4" /> Seçilileri Sil ({selectedRisks.size})
              </Button>
            )}
            <Button variant="secondary" onClick={handleExportExcel} className="gap-2">
              <Download className="h-4 w-4" /> Excel
            </Button>
            <Button variant="secondary" onClick={handleExportPDF} className="gap-2">
              <FileText className="h-4 w-4" /> PDF
            </Button>
            <Button
              onClick={() => {
                setCurrentRisk({ probability: 1, severity: 1, status: 'Açık' });
                setIsModalOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" /> Yeni Risk
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tehlike, risk, tedbir, konum veya sorumlu ara..."
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
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
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
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                  title="Kart Görünümü"
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('matrix')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'matrix'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                  title="Risk Matrisi"
                >
                  <Hash className="h-4 w-4" />
                </button>
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowFilters(!showFilters)}
                className={`gap-2 ${showFilters ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
              >
                <Filter className="h-4 w-4" />
                Filtreler
                {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-indigo-500" />}
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" onClick={() => { clearFilters(); setCurrentPage(1); }} className="gap-2 text-slate-500">
                  <X className="h-4 w-4" /> Temizle
                </Button>
              )}
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <option value="Açık">Açık</option>
                  <option value="Devam Ediyor">Devam Ediyor</option>
                  <option value="Giderildi">Giderildi</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5" /> Risk Seviyesi
                </label>
                <select
                  value={filters.scoreRange || 'all'}
                  onChange={(e) => { setFilter('scoreRange', e.target.value === 'all' ? '' : e.target.value); setCurrentPage(1); }}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="all">Tüm Seviyeler</option>
                  <option value="low">Düşük (1-6)</option>
                  <option value="medium">Orta (7-12)</option>
                  <option value="high">Yüksek (13-25)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" /> Risk Tipi
                </label>
                <select
                  value={filters.riskType || 'all'}
                  onChange={(e) => { setFilter('riskType', e.target.value === 'all' ? '' : e.target.value); setCurrentPage(1); }}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="all">Tüm Tipler</option>
                  {RISK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Sorumlu
                </label>
                <select
                  value={filters.responsible || 'all'}
                  onChange={(e) => { setFilter('responsible', e.target.value === 'all' ? '' : e.target.value); setCurrentPage(1); }}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="all">Tüm Sorumlular</option>
                  {uniqueResponsibles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {uniqueLocations.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> Konum
                  </label>
                  <select
                    value={filters.location || 'all'}
                    onChange={(e) => { setFilter('location', e.target.value === 'all' ? '' : e.target.value); setCurrentPage(1); }}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="all">Tüm Konumlar</option>
                    {uniqueLocations.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Data View */}
        {viewMode === 'list' ? (
          <DataTable
            data={displayedRisks}
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
            keyExtractor={(r) => r.id}
            emptyMessage={
              <div className="flex flex-col items-center justify-center py-8">
                <ShieldAlert className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-500 dark:text-slate-400">Risk kaydı bulunamadı.</p>
              </div>
            }
          />
        ) : viewMode === 'matrix' ? (
          /* ---- RISK MATRIX VIEW ---- */
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Hash className="h-5 w-5 text-indigo-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Risk Matrisi (5×5)</h2>
                <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">— Olasılık × Şiddet</span>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mb-5 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-emerald-200 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700" />
                  <span className="text-xs text-slate-600 dark:text-slate-400">Düşük (1–6)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-amber-200 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700" />
                  <span className="text-xs text-slate-600 dark:text-slate-400">Orta (7–12)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-red-200 dark:bg-red-900/40 border border-red-300 dark:border-red-700" />
                  <span className="text-xs text-slate-600 dark:text-slate-400">Yüksek (13–25)</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                  {/* X-axis label */}
                  <div className="flex items-center mb-1 pl-20">
                    {[1, 2, 3, 4, 5].map(s => (
                      <div key={s} className="flex-1 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 min-w-[80px]">
                        Ş:{s}
                      </div>
                    ))}
                  </div>
                  {/* Y-axis label above */}
                  <div className="text-[10px] text-slate-400 text-center mb-1 pl-20">← Şiddet →</div>

                  {[5, 4, 3, 2, 1].map(p => (
                    <div key={p} className="flex items-stretch mb-1 gap-1">
                      {/* Y-axis label */}
                      <div className="w-16 flex items-center justify-end pr-2 text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                        O:{p}
                      </div>
                      {[1, 2, 3, 4, 5].map(s => {
                        const cellRisks = matrixData[`${p}-${s}`] || [];
                        const score = p * s;
                        return (
                          <div
                            key={s}
                            className={`flex-1 min-w-[80px] min-h-[72px] rounded-xl border-2 p-2 flex flex-col items-center justify-center cursor-pointer transition-all ${getMatrixCellColor(p, s)}`}
                            onClick={() => {
                              if (cellRisks.length > 0) {
                                toast(`${cellRisks.length} risk: ${cellRisks.map(r => r.hazard).join(', ')}`, { icon: 'ℹ️' });
                              }
                            }}
                          >
                            <div className="text-lg font-bold text-slate-700 dark:text-slate-300">{score}</div>
                            {cellRisks.length > 0 ? (
                              <div className={`text-xs font-bold mt-1 px-2 py-0.5 rounded-full ${
                                score > 12 ? 'bg-red-500 text-white' :
                                score > 6 ? 'bg-amber-500 text-white' :
                                'bg-emerald-500 text-white'
                              }`}>
                                {cellRisks.length}
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-400 mt-1">—</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  <div className="text-[10px] text-slate-400 text-center mt-1 pl-20">↑ Olasılık ↑</div>
                </div>
              </div>
            </div>

            {/* Risk distribution summary under matrix */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{stats.lowRisk}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Düşük Risk</p>
                <p className="text-xs text-slate-400">(1–6)</p>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-2">
                  <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.mediumRisk}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Orta Risk</p>
                <p className="text-xs text-slate-400">(7–12)</p>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-2">
                  <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.highRisk}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Yüksek Risk</p>
                <p className="text-xs text-slate-400">(13–25)</p>
              </div>
            </div>
          </div>
        ) : (
          /* ---- GRID VIEW ---- */
          <div className="space-y-4">
            {displayedRisks.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-16 text-center">
                <ShieldAlert className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">Risk kaydı bulunamadı.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedRisks.map((risk) => (
                  <div
                    key={risk.id}
                    className={`group bg-white dark:bg-slate-900 rounded-2xl border-2 p-5 hover:shadow-lg transition-all cursor-pointer ${
                      selectedRisks.has(risk.id)
                        ? 'border-indigo-400 dark:border-indigo-500 ring-2 ring-indigo-100 dark:ring-indigo-900/30'
                        : risk.score > 12
                          ? 'border-red-200 dark:border-red-800/50 hover:border-red-300 dark:hover:border-red-700'
                          : risk.score > 6
                            ? 'border-amber-200 dark:border-amber-800/50 hover:border-amber-300 dark:hover:border-amber-700'
                            : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                    }`}
                    onClick={() => setDetailRiskId(risk.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0 ${
                          risk.score > 12 ? 'bg-gradient-to-br from-red-500 to-rose-600' :
                          risk.score > 6 ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                          'bg-gradient-to-br from-emerald-500 to-teal-600'
                        }`}>
                          <span className="text-lg font-bold">{risk.score}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{risk.hazard}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{risk.risk}</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSelectRisk(risk.id, e); }}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors shrink-0 ml-2"
                      >
                        {selectedRisks.has(risk.id) ? (
                          <CheckSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        ) : (
                          <Square className="h-5 w-5 text-slate-400" />
                        )}
                      </button>
                    </div>

                    {/* Tags row */}
                    <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                      {risk.riskType && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${RISK_TYPE_COLORS[risk.riskType]}`}>
                          {risk.riskType}
                        </span>
                      )}
                      {risk.location && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          <MapPin className="h-2.5 w-2.5" />{risk.location}
                        </span>
                      )}
                      {isReviewOverdue(risk.nextReviewDate) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-pulse">
                          <Clock className="h-2.5 w-2.5" /> Gecikmiş
                        </span>
                      )}
                      {isReviewSoon(risk.nextReviewDate) && !isReviewOverdue(risk.nextReviewDate) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                          <Clock className="h-2.5 w-2.5" /> Yakında
                        </span>
                      )}
                    </div>

                    {/* Score bar */}
                    <div className="mb-3">
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            risk.score > 12 ? 'bg-red-500' : risk.score > 6 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: getScoreBarWidth(risk.score) }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-slate-400">O:{risk.probability} × Ş:{risk.severity}</span>
                        <span className={`text-[10px] font-semibold ${
                          risk.score > 12 ? 'text-red-600 dark:text-red-400' :
                          risk.score > 6 ? 'text-amber-600 dark:text-amber-400' :
                          'text-emerald-600 dark:text-emerald-400'
                        }`}>{getScoreLabel(risk.score)}</span>
                      </div>
                    </div>

                    {/* Control Measure Preview */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2.5 mb-3 border border-slate-100 dark:border-slate-700/50">
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{risk.controlMeasure}</p>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <User className="h-4 w-4 text-slate-400 shrink-0" />
                        <span className="truncate">{risk.responsible}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>{new Date(risk.date).toLocaleDateString('tr-TR')}</span>
                      </div>
                      {risk.nextReviewDate && (
                        <div className={`flex items-center gap-2 text-sm ${
                          isReviewOverdue(risk.nextReviewDate) ? 'text-red-500 dark:text-red-400' :
                          isReviewSoon(risk.nextReviewDate) ? 'text-amber-500 dark:text-amber-400' :
                          'text-slate-600 dark:text-slate-400'
                        }`}>
                          <RefreshCw className="h-4 w-4 shrink-0" />
                          <span>İnceleme: {new Date(risk.nextReviewDate).toLocaleDateString('tr-TR')}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex gap-2">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${getScoreColor(risk.score)}`}>
                          {getScoreLabel(risk.score)}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          risk.status === 'Giderildi'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          risk.status === 'Devam Ediyor'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(risk.status)}`} />
                          {risk.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditModal(risk); }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(risk.id); }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Grid View Pagination */}
            {filteredRisks.length > 0 && (
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

        {/* ================== Add/Edit Modal ================== */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={currentRisk.id ? 'Risk Kaydını Düzenle' : 'Yeni Risk Kaydı'}
          size="xl"
        >
          <form onSubmit={handleSave} className="space-y-4">
            {/* Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tespit Tarihi</label>
                <Input required type="date" value={currentRisk.date || ''} onChange={e => setCurrentRisk({...currentRisk, date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Risk Tipi</label>
                <select
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                  value={currentRisk.riskType || ''}
                  onChange={e => setCurrentRisk({...currentRisk, riskType: e.target.value as RiskType || undefined})}
                >
                  <option value="">— Seçiniz —</option>
                  {RISK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Hazard & Risk */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tehlike Kaynağı</label>
                <Input required value={currentRisk.hazard || ''} onChange={e => setCurrentRisk({...currentRisk, hazard: e.target.value})} placeholder="Örn: Yüksekte çalışma" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Olası Risk</label>
                <Input required value={currentRisk.risk || ''} onChange={e => setCurrentRisk({...currentRisk, risk: e.target.value})} placeholder="Örn: Düşme, yaralanma" />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Konum / Çalışma Alanı</label>
              <Input value={currentRisk.location || ''} onChange={e => setCurrentRisk({...currentRisk, location: e.target.value})} placeholder="Örn: A Blok, 3. Kat, Makine Dairesi" />
            </div>

            {/* Scoring */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Olasılık (1–5)</label>
                <select
                  required
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                  value={currentRisk.probability || 1}
                  onChange={e => setCurrentRisk({...currentRisk, probability: Number(e.target.value)})}
                >
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} — {['Çok Düşük', 'Düşük', 'Orta', 'Yüksek', 'Çok Yüksek'][n - 1]}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Şiddet (1–5)</label>
                <select
                  required
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                  value={currentRisk.severity || 1}
                  onChange={e => setCurrentRisk({...currentRisk, severity: Number(e.target.value)})}
                >
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} — {['Önemsiz', 'Küçük', 'Orta', 'Büyük', 'Felaket'][n - 1]}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Hesaplanan Skor</label>
                <div className={`flex h-10 items-center justify-center rounded-md border font-bold text-lg ${
                  getScoreColor((currentRisk.probability || 1) * (currentRisk.severity || 1))
                }`}>
                  {(currentRisk.probability || 1) * (currentRisk.severity || 1)}
                  <span className="text-xs ml-1 font-normal opacity-70">
                    ({getScoreLabel((currentRisk.probability || 1) * (currentRisk.severity || 1))})
                  </span>
                </div>
              </div>
            </div>

            {/* Score bar preview */}
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  (currentRisk.probability || 1) * (currentRisk.severity || 1) > 12 ? 'bg-red-500' :
                  (currentRisk.probability || 1) * (currentRisk.severity || 1) > 6 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: getScoreBarWidth((currentRisk.probability || 1) * (currentRisk.severity || 1)) }}
              />
            </div>

            {/* Control Measure */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Kontrol Tedbiri</label>
              <textarea
                required
                className="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                value={currentRisk.controlMeasure || ''}
                onChange={e => setCurrentRisk({...currentRisk, controlMeasure: e.target.value})}
                placeholder="Alınacak önlemleri yazın..."
              />
            </div>

            {/* Actions Taken */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Alınan Aksiyonlar <span className="text-slate-400 font-normal">(opsiyonel)</span></label>
              <textarea
                className="flex min-h-[60px] w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                value={currentRisk.actionsTaken || ''}
                onChange={e => setCurrentRisk({...currentRisk, actionsTaken: e.target.value})}
                placeholder="Bugüne kadar alınan aksiyonlar..."
              />
            </div>

            {/* Responsible & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sorumlu</label>
                <Input required value={currentRisk.responsible || ''} onChange={e => setCurrentRisk({...currentRisk, responsible: e.target.value})} placeholder="Sorumlu kişi" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Durum</label>
                <select
                  required
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                  value={currentRisk.status || 'Açık'}
                  onChange={e => setCurrentRisk({...currentRisk, status: e.target.value as RiskStatus})}
                >
                  <option value="Açık">Açık</option>
                  <option value="Devam Ediyor">Devam Ediyor</option>
                  <option value="Giderildi">Giderildi</option>
                </select>
              </div>
            </div>

            {/* Review Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5 text-slate-400" /> Son İnceleme Tarihi
                </label>
                <Input type="date" value={currentRisk.lastReviewDate || ''} onChange={e => setCurrentRisk({...currentRisk, lastReviewDate: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" /> Sonraki İnceleme Tarihi
                </label>
                <Input type="date" value={currentRisk.nextReviewDate || ''} onChange={e => setCurrentRisk({...currentRisk, nextReviewDate: e.target.value})} />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Notlar <span className="text-slate-400 font-normal">(opsiyonel)</span></label>
              <textarea
                className="flex min-h-[60px] w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                value={currentRisk.notes || ''}
                onChange={e => setCurrentRisk({...currentRisk, notes: e.target.value})}
                placeholder="Ek notlar..."
              />
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>İptal</Button>
              <Button type="submit">Kaydet</Button>
            </div>
          </form>
        </Modal>

        {/* ================== Risk Detail Modal ================== */}
        <Modal
          isOpen={!!detailRiskId}
          onClose={() => { setDetailRiskId(null); setActiveTab('info'); }}
          title="Risk Detayları"
          size="xl"
        >
          {detailRisk && (
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-start gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 ${
                  detailRisk.score > 12 ? 'bg-gradient-to-br from-red-500 to-rose-600' :
                  detailRisk.score > 6 ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                  'bg-gradient-to-br from-emerald-500 to-teal-600'
                }`}>
                  <span className="text-3xl font-bold">{detailRisk.score}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{detailRisk.hazard}</h2>
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold border ${getScoreColor(detailRisk.score)}`}>
                      {getScoreLabel(detailRisk.score)} Risk
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                      detailRisk.status === 'Giderildi'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      detailRisk.status === 'Devam Ediyor'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${getStatusDotColor(detailRisk.status)}`} />
                      {detailRisk.status}
                    </span>
                    {detailRisk.riskType && (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${RISK_TYPE_COLORS[detailRisk.riskType]}`}>
                        {detailRisk.riskType}
                      </span>
                    )}
                    {isReviewOverdue(detailRisk.nextReviewDate) && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-pulse">
                        <Clock className="h-3.5 w-3.5" /> İnceleme Gecikti!
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                {[
                  { key: 'info', label: 'Risk Bilgisi', icon: Info },
                  { key: 'control', label: 'Kontrol', icon: Shield },
                  { key: 'review', label: 'İnceleme', icon: RefreshCw },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key as 'info' | 'control' | 'review')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      activeTab === key
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Tab: Info */}
              {activeTab === 'info' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Olası Risk</h3>
                    <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                      {detailRisk.risk}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Olasılık</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{detailRisk.probability}</p>
                      <p className="text-[10px] text-slate-400">{['Çok Düşük', 'Düşük', 'Orta', 'Yüksek', 'Çok Yüksek'][detailRisk.probability - 1]}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Şiddet</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{detailRisk.severity}</p>
                      <p className="text-[10px] text-slate-400">{['Önemsiz', 'Küçük', 'Orta', 'Büyük', 'Felaket'][detailRisk.severity - 1]}</p>
                    </div>
                    <div className={`rounded-xl p-3 border text-center ${
                      detailRisk.score > 12 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                      detailRisk.score > 6 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' :
                      'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                    }`}>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Risk Skoru</p>
                      <p className={`text-2xl font-bold ${
                        detailRisk.score > 12 ? 'text-red-700 dark:text-red-400' :
                        detailRisk.score > 6 ? 'text-amber-700 dark:text-amber-400' :
                        'text-emerald-700 dark:text-emerald-400'
                      }`}>{detailRisk.score}</p>
                      <p className="text-[10px] text-slate-400">{getScoreLabel(detailRisk.score)}</p>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-slate-500">Risk Skor Barı</span>
                      <span className="text-xs text-slate-500">{detailRisk.score} / 25</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          detailRisk.score > 12 ? 'bg-gradient-to-r from-red-400 to-red-600' :
                          detailRisk.score > 6 ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
                          'bg-gradient-to-r from-emerald-400 to-emerald-600'
                        }`}
                        style={{ width: getScoreBarWidth(detailRisk.score) }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                      <User className="h-5 w-5 text-indigo-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Sorumlu</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{detailRisk.responsible}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                      <Calendar className="h-5 w-5 text-indigo-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Tespit Tarihi</p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {new Date(detailRisk.date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    {detailRisk.location && (
                      <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                        <MapPin className="h-5 w-5 text-indigo-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Konum</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{detailRisk.location}</p>
                        </div>
                      </div>
                    )}
                    {detailRisk.riskType && (
                      <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                        <Tag className="h-5 w-5 text-indigo-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Risk Tipi</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{detailRisk.riskType}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Control */}
              {activeTab === 'control' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Kontrol Tedbiri</h3>
                    <p className="text-slate-700 dark:text-slate-300 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                      {detailRisk.controlMeasure}
                    </p>
                  </div>
                  {detailRisk.actionsTaken && (
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Alınan Aksiyonlar</h3>
                      <p className="text-slate-700 dark:text-slate-300 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                        {detailRisk.actionsTaken}
                      </p>
                    </div>
                  )}
                  {detailRisk.notes && (
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Notlar</h3>
                      <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                        {detailRisk.notes}
                      </p>
                    </div>
                  )}
                  {!detailRisk.actionsTaken && !detailRisk.notes && (
                    <div className="text-center py-8 text-slate-400">
                      <Shield className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Ek aksiyon veya not bilgisi yok.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Review */}
              {activeTab === 'review' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {detailRisk.lastReviewDate ? (
                      <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Son İnceleme Tarihi</p>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {new Date(detailRisk.lastReviewDate).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 opacity-50">
                        <CheckCircle2 className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-slate-500">Son İnceleme Tarihi</p>
                          <p className="text-sm text-slate-400">Belirtilmemiş</p>
                        </div>
                      </div>
                    )}
                    {detailRisk.nextReviewDate ? (
                      <div className={`flex items-start gap-3 p-4 rounded-xl border ${
                        isReviewOverdue(detailRisk.nextReviewDate)
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          : isReviewSoon(detailRisk.nextReviewDate)
                            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                      }`}>
                        <Clock className={`h-5 w-5 mt-0.5 shrink-0 ${
                          isReviewOverdue(detailRisk.nextReviewDate) ? 'text-red-500' :
                          isReviewSoon(detailRisk.nextReviewDate) ? 'text-amber-500' : 'text-indigo-400'
                        }`} />
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Sonraki İnceleme Tarihi</p>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {new Date(detailRisk.nextReviewDate).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                          {isReviewOverdue(detailRisk.nextReviewDate) && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">⚠ İnceleme tarihi geçti!</p>
                          )}
                          {isReviewSoon(detailRisk.nextReviewDate) && !isReviewOverdue(detailRisk.nextReviewDate) && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">⏰ 30 gün içinde inceleme gerekli.</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 opacity-50">
                        <Clock className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-slate-500">Sonraki İnceleme</p>
                          <p className="text-sm text-slate-400">Belirtilmemiş</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {!detailRisk.lastReviewDate && !detailRisk.nextReviewDate && (
                    <div className="text-center py-8 text-slate-400">
                      <RefreshCw className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">İnceleme tarihi bilgisi girilmemiş.</p>
                      <p className="text-xs mt-1">Düzenle butonundan inceleme tarihleri ekleyebilirsiniz.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="ghost" onClick={() => { setDetailRiskId(null); setActiveTab('info'); }}>Kapat</Button>
                <Button onClick={() => { setDetailRiskId(null); setActiveTab('info'); openEditModal(detailRisk); }}>
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
          onClose={() => { setDeleteModalOpen(false); setRiskToDelete(null); }}
          title="Risk Kaydını Sil"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">
                Bu risk kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setDeleteModalOpen(false); setRiskToDelete(null); }}>İptal</Button>
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
                Seçili <strong>{selectedRisks.size}</strong> risk kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setBulkDeleteModalOpen(false)}>İptal</Button>
              <Button variant="danger" onClick={confirmBulkDelete}>
                {selectedRisks.size} Kaydı Sil
              </Button>
            </div>
          </div>
        </Modal>

      </div>
    </PageTransition>
  );
};
