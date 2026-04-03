import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Risk, RiskStatus } from '../types';
import { Plus, Search, Edit2, Trash2, Download, FileText, ShieldAlert, Filter, X, Grid3x3, List, Eye, TrendingUp, CheckSquare, Square, Calendar, User, AlertTriangle } from 'lucide-react';
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

export const RisksPage = () => {
  const { risks, addRisk, updateRisk, deleteRisk } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRisk, setCurrentRisk] = useState<Partial<Risk>>({ probability: 1, severity: 1 });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedRisks, setSelectedRisks] = useState<Set<string>>(new Set());
  const [detailRiskId, setDetailRiskId] = useState<string | null>(null);

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
  } = useDataTable<Risk>({
    data: risks,
    initialSort: { key: 'score', direction: 'desc' },
    initialPageSize: 10,
  });

  // Apply custom filters
  const filteredRisks = paginatedData.filter((r) => {
    const matchesSearch = 
      r.hazard.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.risk.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.responsible.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filters.status || filters.status === 'all' || r.status === filters.status;
    const matchesScoreRange = !filters.scoreRange || filters.scoreRange === 'all' || 
      (filters.scoreRange === 'low' && r.score <= 6) ||
      (filters.scoreRange === 'medium' && r.score > 6 && r.score <= 12) ||
      (filters.scoreRange === 'high' && r.score > 12);
    
    return matchesSearch && matchesStatus && matchesScoreRange;
  });

  // Calculate statistics
  const stats = useMemo(() => ({
    total: risks.length,
    open: risks.filter(r => r.status === 'Açık').length,
    inProgress: risks.filter(r => r.status === 'Devam Ediyor').length,
    resolved: risks.filter(r => r.status === 'Giderildi').length,
    highRisk: risks.filter(r => r.score > 12).length,
  }), [risks]);

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
      } as Risk);
      toast.success('Yeni risk kaydı eklendi.');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
      deleteRisk(id);
      toast.success('Kayıt silindi.');
    }
  };

  const openEditModal = (risk: Risk) => {
    setCurrentRisk(risk);
    setIsModalOpen(true);
  };

  const toggleSelectRisk = (id: string) => {
    const newSelected = new Set(selectedRisks);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRisks(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedRisks.size === filteredRisks.length) {
      setSelectedRisks(new Set());
    } else {
      setSelectedRisks(new Set(filteredRisks.map(r => r.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedRisks.size === 0) {
      toast.error('Lütfen silmek için risk seçiniz.');
      return;
    }
    if (window.confirm(`${selectedRisks.size} risk kaydını silmek istediğinize emin misiniz?`)) {
      selectedRisks.forEach(id => deleteRisk(id));
      setSelectedRisks(new Set());
      toast.success(`${selectedRisks.size} risk kaydı başarıyla silindi.`);
    }
  };

  const getDetailRisk = () => {
    return risks.find(r => r.id === detailRiskId);
  };

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

  const detailRisk = getDetailRisk();

  const columns = [
    {
      key: 'select',
      header: () => (
        <button onClick={toggleSelectAll} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors">
          {selectedRisks.size === filteredRisks.length && filteredRisks.length > 0 ? (
            <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          ) : (
            <Square className="h-4 w-4 text-slate-400" />
          )}
        </button>
      ),
      width: '40px',
      render: (r: Risk) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSelectRisk(r.id);
          }}
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
          <div className="font-medium text-slate-900 dark:text-white">{r.hazard}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{r.risk}</div>
        </div>
      ),
    },
    {
      key: 'score',
      header: 'Skor',
      sortable: true,
      width: '100px',
      render: (r: Risk) => (
        <div className="text-center">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${getScoreColor(r.score)}`}>
            {r.score}
          </span>
          <div className="text-[10px] text-slate-400 mt-1">{r.probability} × {r.severity}</div>
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
        <span className="text-slate-900 dark:text-white font-medium">{r.responsible}</span>
      ),
    },
    {
      key: 'status',
      header: 'Durum',
      sortable: true,
      width: '120px',
      render: (r: Risk) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
          r.status === 'Giderildi' 
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
          r.status === 'Devam Ediyor' 
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {r.status}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Tarih',
      sortable: true,
      width: '110px',
      render: (r: Risk) => new Date(r.date).toLocaleDateString('tr-TR'),
    },
    {
      key: 'actions',
      header: 'İşlemler',
      width: '140px',
      render: (r: Risk) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDetailRiskId(r.id);
            }}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg dark:text-indigo-400 dark:hover:bg-indigo-900/30 transition-colors"
            title="Detayları Gör"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(r);
            }}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
            title="Düzenle"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(r.id);
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

  const hasActiveFilters = searchTerm || filters.status || filters.scoreRange;

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('Risk Değerlendirme Tablosu', 14, 15);
    
    const tableData = filteredRisks.map(r => [
      new Date(r.date).toLocaleDateString('tr-TR'),
      r.hazard,
      r.risk,
      `${r.probability} x ${r.severity} = ${r.score}`,
      r.controlMeasure,
      r.status
    ]);

    (doc as any).autoTable({
      head: [['Tarih', 'Tehlike', 'Risk', 'Skor (O x Ş)', 'Kontrol Tedbiri', 'Durum']],
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
      'Olasılık': r.probability,
      'Şiddet': r.severity,
      'Skor': r.score,
      'Kontrol Tedbiri': r.controlMeasure,
      'Sorumlu': r.responsible,
      'Durum': r.status
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Riskler');
    XLSX.writeFile(wb, 'risk-degerlendirmesi.xlsx');
    toast.success('Excel olarak dışa aktarıldı.');
  };

  return (
    <PageTransition>
      <div className="space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <TrendingUp className="h-5 w-5 opacity-70" />
            </div>
            <p className="text-2xl font-bold mb-1">{stats.total}</p>
            <p className="text-sm text-white/80">Toplam Risk</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <TrendingUp className="h-5 w-5 opacity-70" />
            </div>
            <p className="text-2xl font-bold mb-1">{stats.open}</p>
            <p className="text-sm text-white/80">Açık</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <TrendingUp className="h-5 w-5 opacity-70" />
            </div>
            <p className="text-2xl font-bold mb-1">{stats.inProgress}</p>
            <p className="text-sm text-white/80">Devam Ediyor</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <CheckSquare className="h-6 w-6" />
              </div>
              <TrendingUp className="h-5 w-5 opacity-70" />
            </div>
            <p className="text-2xl font-bold mb-1">{stats.resolved}</p>
            <p className="text-sm text-white/80">Giderildi</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-pink-600 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
            <p className="text-2xl font-bold mb-1">{stats.highRisk}</p>
            <p className="text-sm text-white/80">Yüksek Riskli</p>
          </div>
        </div>

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
            <Button onClick={() => { setCurrentRisk({ probability: 1, severity: 1, status: 'Açık' }); setIsModalOpen(true); }} className="gap-2">
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
                placeholder="Tehlike, risk veya sorumlu ara..." 
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
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Durum
                </label>
                <select
                  value={filters.status || 'all'}
                  onChange={(e) => setFilter('status', e.target.value === 'all' ? '' : e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="Açık">Açık</option>
                  <option value="Devam Ediyor">Devam Ediyor</option>
                  <option value="Giderildi">Giderildi</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Risk Seviyesi
                </label>
                <select
                  value={filters.scoreRange || 'all'}
                  onChange={(e) => setFilter('scoreRange', e.target.value === 'all' ? '' : e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="all">Tüm Seviyeler</option>
                  <option value="low">Düşük (1-6)</option>
                  <option value="medium">Orta (7-12)</option>
                  <option value="high">Yüksek (13-25)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Data View */}
        {viewMode === 'list' ? (
          <DataTable
            data={filteredRisks}
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
            keyExtractor={(r) => r.id}
            emptyMessage={
              <div className="flex flex-col items-center justify-center py-8">
                <ShieldAlert className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-500 dark:text-slate-400">Risk kaydı bulunamadı.</p>
              </div>
            }
          />
        ) : (
          <div className="space-y-4">
            {filteredRisks.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-16 text-center">
                <ShieldAlert className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">Risk kaydı bulunamadı.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRisks.map((risk) => (
                  <div
                    key={risk.id}
                    className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer"
                    onClick={() => setDetailRiskId(risk.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
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
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectRisk(risk.id);
                        }}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                      >
                        {selectedRisks.has(risk.id) ? (
                          <CheckSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        ) : (
                          <Square className="h-5 w-5 text-slate-400" />
                        )}
                      </button>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <User className="h-4 w-4 text-slate-400" />
                        <span>{risk.responsible}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span>{new Date(risk.date).toLocaleDateString('tr-TR')}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex gap-2">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${getScoreColor(risk.score)}`}>
                          {getScoreLabel(risk.score)}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          risk.status === 'Giderildi'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          risk.status === 'Devam Ediyor'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {risk.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(risk);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(risk.id);
                          }}
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

        {/* Add/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={currentRisk.id ? 'Risk Kaydını Düzenle' : 'Yeni Risk Kaydı'}
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tespit Tarihi</label>
              <Input required type="date" value={currentRisk.date || ''} onChange={e => setCurrentRisk({...currentRisk, date: e.target.value})} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tehlike Kaynağı</label>
              <Input required value={currentRisk.hazard || ''} onChange={e => setCurrentRisk({...currentRisk, hazard: e.target.value})} placeholder="Örn: Yüksekte çalışma" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Olası Risk</label>
              <Input required value={currentRisk.risk || ''} onChange={e => setCurrentRisk({...currentRisk, risk: e.target.value})} placeholder="Örn: Düşme, yaralanma" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Olasılık (1-5)</label>
                <select 
                  required
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                  value={currentRisk.probability || 1}
                  onChange={e => setCurrentRisk({...currentRisk, probability: Number(e.target.value)})}
                >
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Şiddet (1-5)</label>
                <select 
                  required
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                  value={currentRisk.severity || 1}
                  onChange={e => setCurrentRisk({...currentRisk, severity: Number(e.target.value)})}
                >
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sorumlu</label>
                <Input required value={currentRisk.responsible || ''} onChange={e => setCurrentRisk({...currentRisk, responsible: e.target.value})} />
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

            <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>İptal</Button>
              <Button type="submit">Kaydet</Button>
            </div>
          </form>
        </Modal>

        {/* Risk Detail Modal */}
        <Modal
          isOpen={!!detailRiskId}
          onClose={() => setDetailRiskId(null)}
          title="Risk Detayları"
          size="xl"
        >
          {detailRisk && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start gap-4 pb-5 border-b border-slate-200 dark:border-slate-700">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                  detailRisk.score > 12 ? 'bg-gradient-to-br from-red-500 to-rose-600' :
                  detailRisk.score > 6 ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                  'bg-gradient-to-br from-emerald-500 to-teal-600'
                }`}>
                  <span className="text-3xl font-bold">{detailRisk.score}</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{detailRisk.hazard}</h2>
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold border ${getScoreColor(detailRisk.score)}`}>
                      {getScoreLabel(detailRisk.score)} Risk
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      detailRisk.status === 'Giderildi'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      detailRisk.status === 'Devam Ediyor'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {detailRisk.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Risk Description */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Olası Risk</h3>
                <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                  {detailRisk.risk}
                </p>
              </div>

              {/* Risk Score */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Olasılık</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{detailRisk.probability}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Şiddet</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{detailRisk.severity}</p>
                </div>
                <div className={`rounded-xl p-4 border text-center ${
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
                </div>
              </div>

              {/* Control Measure */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Kontrol Tedbiri</h3>
                <p className="text-slate-700 dark:text-slate-300 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                  {detailRisk.controlMeasure}
                </p>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Sorumlu</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{detailRisk.responsible}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Tespit Tarihi</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {new Date(detailRisk.date).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="ghost" onClick={() => setDetailRiskId(null)}>Kapat</Button>
                <Button onClick={() => { setDetailRiskId(null); openEditModal(detailRisk); }}>
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
