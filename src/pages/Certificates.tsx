import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { DataTable } from '../components/ui/DataTable';
import { useDataTable } from '../hooks/useDataTable';
import { exportToExcel } from '../utils/exportUtils';
import { exportCertificatePDF } from '../utils/certificatePdfUtils';
import { Plus, Download, Search, Edit2, Trash2, Award, Filter, X, Grid3x3, List, Eye, TrendingUp, CheckSquare, Square, Calendar, User, Building2, FileText, AlertCircle, Save, FileDown } from 'lucide-react';
import { Certificate, CertificateStatus, CertificateType } from '../types';
import toast from 'react-hot-toast';
import { PageTransition } from '../components/layout/PageTransition';
import { useUserDataFilter } from '../hooks/useUserDataFilter';

const CERTIFICATE_TYPES: CertificateType[] = [
  'İSG Eğitimi', 'Yangın Güvenliği', 'İlk Yardım', 'Yüksekte Çalışma',
  'Forklift Operatörlüğü', 'Elektrik Güvenliği', 'Kimyasal Güvenlik',
  'Acil Durum Eğitimi', 'Genel Güvenlik', 'Diğer'
];

const CERTIFICATE_STATUSES: CertificateStatus[] = ['Aktif', 'Süresi Dolmuş', 'İptal Edildi'];

const selectClass =
  'flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 transition-all';

const inputClass =
  'flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 transition-all';

type ViewMode = 'grid' | 'list';

export const Certificates = () => {
  const navigate = useNavigate();
  const { certificates, personnel, companies, deleteCertificate, updateCertificate } = useStore();
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(window.innerWidth < 1024 ? 'grid' : 'list');
  const [selectedCertificates, setSelectedCertificates] = useState<Set<string>>(new Set());
  const [detailCertificateId, setDetailCertificateId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [certificateToDelete, setCertificateToDelete] = useState<string | null>(null);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Certificate>>({});

  // Filter certificates based on user role (admin/manager see all, others see only their own)
  const userCertificates = useUserDataFilter(certificates);

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
  } = useDataTable<Certificate>({
    data: userCertificates,
    initialSort: { key: 'issueDate', direction: 'desc' },
    initialPageSize: 10,
  });

  // Apply custom filters
  const filteredCertificates = useMemo(() => {
    let result = [...userCertificates];

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((c) =>
        c.title.toLowerCase().includes(term) ||
        c.certificateNo.toLowerCase().includes(term) ||
        c.type.toLowerCase().includes(term) ||
        c.issuer.toLowerCase().includes(term)
      );
    }
    
    // Apply filters
    if (filters.status && filters.status !== 'all') {
      result = result.filter(c => c.status === filters.status);
    }
    if (filters.type && filters.type !== 'all') {
      result = result.filter(c => c.type === filters.type);
    }
    
    return result;
  }, [userCertificates, searchTerm, filters]);

  // Pagination
  const totalItems = filteredCertificates.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const displayedCertificates = filteredCertificates.slice(startIndex, endIndex);

  // Calculate statistics
  const stats = useMemo(() => ({
    total: userCertificates.length,
    active: userCertificates.filter(c => c.status === 'Aktif').length,
    expired: userCertificates.filter(c => c.status === 'Süresi Dolmuş').length,
    expiringSoon: userCertificates.filter(c => {
      if (!c.expiryDate || c.status !== 'Aktif') return false;
      const daysUntilExpiry = Math.floor((new Date(c.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    }).length,
  }), [userCertificates]);

  const handleDelete = (id: string) => {
    setCertificateToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (certificateToDelete) {
      deleteCertificate(certificateToDelete);
      toast.success('Sertifika başarıyla silindi.');
      setDeleteModalOpen(false);
      setCertificateToDelete(null);
    }
  };

  const toggleSelectCertificate = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newSelected = new Set(selectedCertificates);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCertificates(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedCertificates.size === displayedCertificates.length) {
      setSelectedCertificates(new Set());
    } else {
      setSelectedCertificates(new Set(displayedCertificates.map(c => c.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedCertificates.size === 0) {
      toast.error('Lütfen silmek için sertifika seçiniz.');
      return;
    }
    setBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = () => {
    selectedCertificates.forEach(id => deleteCertificate(id));
    const count = selectedCertificates.size;
    setSelectedCertificates(new Set());
    setBulkDeleteModalOpen(false);
    toast.success(`${count} sertifika başarıyla silindi.`);
  };

  const getDetailCertificate = () => {
    return certificates.find(c => c.id === detailCertificateId);
  };

  // Edit functionality
  const startEditing = useCallback(() => {
    const cert = certificates.find(c => c.id === detailCertificateId);
    if (cert) {
      setEditFormData({ ...cert });
      setIsEditing(true);
    }
  }, [certificates, detailCertificateId]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditFormData({});
  }, []);

  const saveEditing = useCallback(() => {
    if (!editFormData.id) return;
    const cert = certificates.find(c => c.id === editFormData.id);
    if (!cert) return;

    const updatedCert: Certificate = {
      ...cert,
      ...editFormData,
      updatedAt: new Date().toISOString(),
    } as Certificate;

    updateCertificate(updatedCert);
    setIsEditing(false);
    setEditFormData({});
    toast.success('Sertifika başarıyla güncellendi.');
  }, [editFormData, certificates, updateCertificate]);

  // PDF export
  const handleExportPDF = useCallback((certificateId: string) => {
    const cert = certificates.find(c => c.id === certificateId);
    if (!cert) return;

    const person = personnel.find(p => p.id === cert.personnelId);
    const company = cert.companyId ? companies.find(c => c.id === cert.companyId) : undefined;

    exportCertificatePDF({
      certificate: cert,
      company,
      personnel: person,
    });

    toast.success('PDF başarıyla indirildi.');
  }, [certificates, personnel, companies]);

  const handleExportExcel = () => {
    const data = filteredCertificates.map(c => {
      const person = personnel.find(p => p.id === c.personnelId);
      const company = companies.find(co => co.id === c.companyId);
      
      return {
        'Sertifika No': c.certificateNo,
        'Başlık': c.title,
        'Tip': c.type,
        'Personel': person ? `${person.firstName} ${person.lastName}` : '-',
        'Firma': company?.name || c.companyName || '-',
        'Düzenleyen': c.issuer,
        'Düzenleme Tarihi': new Date(c.issueDate).toLocaleString('tr-TR', { dateStyle: 'short' }),
        'Son Geçerlilik': c.expiryDate ? new Date(c.expiryDate).toLocaleString('tr-TR', { dateStyle: 'short' }) : 'Belirsiz',
        'Durum': c.status,
        'Süre (Saat)': c.duration || '-',
        'Kayıt Tarihi': new Date(c.createdAt).toLocaleString('tr-TR')
      };
    });
    exportToExcel(data, 'sertifikalar');
    toast.success('Excel başarıyla indirildi.');
  };

  const getStatusColor = (status: CertificateStatus) => {
    switch(status) {
      case 'Aktif': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'Süresi Dolmuş': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'İptal Edildi': return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDotColor = (status: CertificateStatus) => {
    switch(status) {
      case 'Aktif': return 'bg-emerald-500';
      case 'Süresi Dolmuş': return 'bg-red-500';
      case 'İptal Edildi': return 'bg-slate-500';
      default: return 'bg-gray-500';
    }
  };

  const detailCertificate = getDetailCertificate();
  const detailPerson = detailCertificate ? personnel.find(p => p.id === detailCertificate.personnelId) : null;
  const detailCompany = detailCertificate?.companyId ? companies.find(c => c.id === detailCertificate.companyId) : null;

  const columns = [
    {
      key: 'select',
      header: () => (
        <button onClick={toggleSelectAll} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors">
          {selectedCertificates.size === displayedCertificates.length && displayedCertificates.length > 0 ? (
            <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          ) : (
            <Square className="h-4 w-4 text-slate-400" />
          )}
        </button>
      ),
      width: '40px',
      render: (c: Certificate) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSelectCertificate(c.id, e);
          }}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
        >
          {selectedCertificates.has(c.id) ? (
            <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          ) : (
            <Square className="h-4 w-4 text-slate-400" />
          )}
        </button>
      ),
    },
    {
      key: 'title',
      header: 'Sertifika',
      sortable: true,
      render: (c: Certificate) => {
        const person = personnel.find(p => p.id === c.personnelId);
        return (
          <div className="flex items-start gap-2">
            <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${getStatusDotColor(c.status)}`} title={c.status} />
            <div>
              <div className="font-medium text-slate-900 dark:text-white">{c.title}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">{c.certificateNo}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{c.type}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'personnel',
      header: 'Personel',
      render: (c: Certificate) => {
        const person = personnel.find(p => p.id === c.personnelId);
        return person ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
              {person.firstName[0]}{person.lastName[0]}
            </div>
            <div>
              <div className="text-sm font-medium text-slate-900 dark:text-white">{person.firstName} {person.lastName}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{person.role}</div>
            </div>
          </div>
        ) : (
          <span className="text-slate-400 italic text-sm">Bilinmiyor</span>
        );
      },
    },
    {
      key: 'dates',
      header: 'Tarihler',
      sortable: true,
      width: '180px',
      render: (c: Certificate) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs text-slate-700 dark:text-slate-300">
              {new Date(c.issueDate).toLocaleDateString('tr-TR')}
            </span>
          </div>
          {c.expiryDate && (
            <div className="flex items-center gap-1.5">
              <AlertCircle className="h-3 w-3 text-slate-400" />
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {new Date(c.expiryDate).toLocaleDateString('tr-TR')}
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'issuer',
      header: 'Düzenleyen',
      sortable: true,
      render: (c: Certificate) => (
        <span className="text-sm text-slate-700 dark:text-slate-300">{c.issuer}</span>
      ),
    },
    {
      key: 'status',
      header: 'Durum',
      sortable: true,
      width: '130px',
      render: (c: Certificate) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(c.status)}`}>
          {c.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'İşlemler',
      width: '100px',
      render: (c: Certificate) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDetailCertificateId(c.id);
            }}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg dark:text-indigo-400 dark:hover:bg-indigo-900/30 transition-colors"
            title="Detayları Gör"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(c.id);
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

  const hasActiveFilters = searchTerm || filters.status || filters.type;

  return (
    <PageTransition>
      <div className="space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Award className="h-6 w-6" />
              </div>
              <TrendingUp className="h-5 w-5 opacity-70" />
            </div>
            <p className="text-2xl font-bold mb-1">{stats.total}</p>
            <p className="text-sm text-white/80">Toplam Sertifika</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <CheckSquare className="h-6 w-6" />
              </div>
            </div>
            <p className="text-2xl font-bold mb-1">{stats.active}</p>
            <p className="text-sm text-white/80">Aktif</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <AlertCircle className="h-6 w-6" />
              </div>
            </div>
            <p className="text-2xl font-bold mb-1">{stats.expiringSoon}</p>
            <p className="text-sm text-white/80">Süresi Dolacak (30 Gün)</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <X className="h-6 w-6" />
              </div>
            </div>
            <p className="text-2xl font-bold mb-1">{stats.expired}</p>
            <p className="text-sm text-white/80">Süresi Dolmuş</p>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">Sertifikalar</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-lg">Personel eğitim sertifikalarını yönetin.</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {selectedCertificates.size > 0 && (
              <Button variant="danger" onClick={handleBulkDelete} className="gap-2">
                <Trash2 className="h-4 w-4" /> Seçilileri Sil ({selectedCertificates.size})
              </Button>
            )}
            <Button variant="secondary" onClick={handleExportExcel} className="gap-2">
              <Download className="h-4 w-4" /> Excel
            </Button>
            <Button onClick={() => navigate('/certificates/new')} className="gap-2">
              <Plus className="h-4 w-4" /> Yeni Sertifika
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Sertifika adı, numara, tip veya düzenleyen ara..." 
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
                  <option value="Aktif">Aktif</option>
                  <option value="Süresi Dolmuş">Süresi Dolmuş</option>
                  <option value="İptal Edildi">İptal Edildi</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5" /> Sertifika Tipi
                </label>
                <select
                  value={filters.type || 'all'}
                  onChange={(e) => { setFilter('type', e.target.value === 'all' ? '' : e.target.value); setCurrentPage(1); }}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="all">Tüm Tipler</option>
                  <option value="İSG Eğitimi">İSG Eğitimi</option>
                  <option value="Yangın Güvenliği">Yangın Güvenliği</option>
                  <option value="İlk Yardım">İlk Yardım</option>
                  <option value="Yüksekte Çalışma">Yüksekte Çalışma</option>
                  <option value="Forklift Operatörlüğü">Forklift Operatörlüğü</option>
                  <option value="Elektrik Güvenliği">Elektrik Güvenliği</option>
                  <option value="Kimyasal Güvenlik">Kimyasal Güvenlik</option>
                  <option value="Acil Durum Eğitimi">Acil Durum Eğitimi</option>
                  <option value="Genel Güvenlik">Genel Güvenlik</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Data View */}
        {viewMode === 'list' ? (
          <DataTable
            data={displayedCertificates}
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
            keyExtractor={(c) => c.id}
            emptyMessage="Sertifika kaydı bulunamadı."
          />
        ) : (
          <div className="bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-2xl rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-6">
            {displayedCertificates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <Award className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-lg font-semibold text-slate-600 dark:text-slate-400">Sertifika kaydı bulunamadı.</p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Yeni sertifika oluşturmak için yukarıdaki butonu kullanın.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedCertificates.map((certificate) => {
                  const isSelected = selectedCertificates.has(certificate.id);
                  const person = personnel.find(p => p.id === certificate.personnelId);
                  
                  return (
                    <div
                      key={certificate.id}
                      className={`group relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/50 rounded-2xl p-5 border-2 transition-all cursor-pointer hover:shadow-xl ${
                        isSelected
                          ? 'border-indigo-500 dark:border-indigo-400 shadow-lg shadow-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                      }`}
                      onClick={() => setDetailCertificateId(certificate.id)}
                    >
                      {/* Status dot & Selection */}
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusDotColor(certificate.status)}`} title={certificate.status} />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectCertificate(certificate.id, e);
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

                      {/* Certificate Info */}
                      <div className="mb-4">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">{certificate.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
                          <FileText className="h-4 w-4 text-slate-400" />
                          <span className="text-xs">{certificate.certificateNo}</span>
                        </div>
                        <span className="inline-block text-xs px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium">
                          {certificate.type}
                        </span>
                      </div>

                      {/* Personnel */}
                      {person && (
                        <div className="mb-3 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                            {person.firstName[0]}{person.lastName[0]}
                          </div>
                          <div className="text-sm">
                            <div className="font-medium text-slate-900 dark:text-white">{person.firstName} {person.lastName}</div>
                          </div>
                        </div>
                      )}

                      {/* Dates */}
                      <div className="space-y-2 mb-3 text-xs">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{new Date(certificate.issueDate).toLocaleDateString('tr-TR')}</span>
                        </div>
                        {certificate.expiryDate && (
                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <AlertCircle className="h-3.5 w-3.5" />
                            <span>Geçerli: {new Date(certificate.expiryDate).toLocaleDateString('tr-TR')}</span>
                          </div>
                        )}
                      </div>

                      {/* Status Badge */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(certificate.status)}`}>
                          {certificate.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Certificate Detail / Edit Modal */}
        <Modal
          isOpen={!!detailCertificateId}
          onClose={() => { setDetailCertificateId(null); cancelEditing(); }}
          title={isEditing ? 'Sertifika Düzenle' : 'Sertifika Detayları'}
          size="xl"
        >
          {detailCertificate && !isEditing && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start gap-4 pb-5 border-b border-slate-200 dark:border-slate-700">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                  <Award className="h-8 w-8" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{detailCertificate.title}</h2>
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(detailCertificate.status)}`}>
                      {detailCertificate.status}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                      {detailCertificate.type}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Sertifika Bilgileri</h3>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Sertifika No</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{detailCertificate.certificateNo}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Düzenleyen</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{detailCertificate.issuer}</p>
                      </div>
                    </div>
                    {detailPerson && (
                      <div className="flex items-start gap-3">
                        <User className="h-5 w-5 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Personel</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{detailPerson.firstName} {detailPerson.lastName}</p>
                          <p className="text-sm text-slate-500">{detailPerson.role}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Tarih Bilgileri</h3>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Düzenleme Tarihi</p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {new Date(detailCertificate.issueDate).toLocaleString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    {detailCertificate.expiryDate && (
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Son Geçerlilik Tarihi</p>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {new Date(detailCertificate.expiryDate).toLocaleString('tr-TR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                    {detailCompany && (
                      <div className="flex items-start gap-3">
                        <Building2 className="h-5 w-5 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Firma</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{detailCompany.name}</p>
                        </div>
                      </div>
                    )}
                    {detailCertificate.duration && (
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Eğitim Süresi</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{detailCertificate.duration} saat</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {detailCertificate.description && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Açıklama</h3>
                  <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    {detailCertificate.description}
                  </p>
                </div>
              )}

              {/* Notes */}
              {detailCertificate.notes && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Notlar</h3>
                  <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    {detailCertificate.notes}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => handleExportPDF(detailCertificate.id)}
                    className="gap-2"
                  >
                    <FileDown className="h-4 w-4" /> PDF İndir
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => { setDetailCertificateId(null); cancelEditing(); }}>
                    Kapat
                  </Button>
                  <Button onClick={startEditing} className="gap-2">
                    <Edit2 className="h-4 w-4" /> Düzenle
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Mode */}
          {detailCertificate && isEditing && (
            <div className="space-y-5">
              {/* Edit Header Info */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center gap-3">
                  <Edit2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <p className="text-sm text-indigo-800 dark:text-indigo-200">
                    Sertifika bilgilerini düzenlemektesiniz. Değişikliklerinizi kaydetmek için "Kaydet" butonuna tıklayın.
                  </p>
                </div>
              </div>

              {/* Edit Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Sertifika Başlığı <span className="text-red-500">*</span>
                  </label>
                  <input
                    className={inputClass}
                    value={editFormData.title || ''}
                    onChange={e => setEditFormData({ ...editFormData, title: e.target.value })}
                    placeholder="Sertifika başlığı"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Sertifika No <span className="text-red-500">*</span>
                  </label>
                  <input
                    className={inputClass}
                    value={editFormData.certificateNo || ''}
                    onChange={e => setEditFormData({ ...editFormData, certificateNo: e.target.value })}
                    placeholder="Sertifika numarası"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sertifika Tipi</label>
                  <select
                    className={selectClass}
                    value={editFormData.type || ''}
                    onChange={e => setEditFormData({ ...editFormData, type: e.target.value as CertificateType })}
                  >
                    {CERTIFICATE_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Durum</label>
                  <select
                    className={selectClass}
                    value={editFormData.status || ''}
                    onChange={e => setEditFormData({ ...editFormData, status: e.target.value as CertificateStatus })}
                  >
                    {CERTIFICATE_STATUSES.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Düzenleyen</label>
                  <input
                    className={inputClass}
                    value={editFormData.issuer || ''}
                    onChange={e => setEditFormData({ ...editFormData, issuer: e.target.value })}
                    placeholder="Düzenleyen kişi/kurum"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Personel</label>
                  <select
                    className={selectClass}
                    value={editFormData.personnelId || ''}
                    onChange={e => setEditFormData({ ...editFormData, personnelId: e.target.value })}
                  >
                    <option value="">Personel Seçiniz</option>
                    {personnel.map(p => (
                      <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Düzenleme Tarihi</label>
                  <input
                    className={inputClass}
                    type="date"
                    value={editFormData.issueDate || ''}
                    onChange={e => setEditFormData({ ...editFormData, issueDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Son Geçerlilik Tarihi</label>
                  <input
                    className={inputClass}
                    type="date"
                    value={editFormData.expiryDate || ''}
                    onChange={e => setEditFormData({ ...editFormData, expiryDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Eğitim Süresi (saat)</label>
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    value={editFormData.duration || ''}
                    onChange={e => setEditFormData({ ...editFormData, duration: parseInt(e.target.value) || undefined })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Açıklama</label>
                <textarea
                  rows={3}
                  className="flex w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 resize-none transition-all"
                  value={editFormData.description || ''}
                  onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                  placeholder="Sertifika açıklaması..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Notlar</label>
                <textarea
                  rows={2}
                  className="flex w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 resize-none transition-all"
                  value={editFormData.notes || ''}
                  onChange={e => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="Ek notlar..."
                />
              </div>

              {/* Edit Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="ghost" onClick={cancelEditing}>
                  İptal
                </Button>
                <Button
                  onClick={saveEditing}
                  className="gap-2"
                  disabled={!editFormData.title || !editFormData.certificateNo}
                >
                  <Save className="h-4 w-4" /> Kaydet
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Sertifikayı Sil"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-400">
              Bu sertifikayı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
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
              <strong>{selectedCertificates.size} sertifikayı</strong> kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setBulkDeleteModalOpen(false)}>
                İptal
              </Button>
              <Button variant="danger" onClick={confirmBulkDelete} className="gap-2">
                <Trash2 className="h-4 w-4" /> {selectedCertificates.size} Sertifikayı Sil
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
};
