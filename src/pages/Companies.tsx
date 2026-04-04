import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { DataTable } from '../components/ui/DataTable';
import { Modal } from '../components/ui/Modal';
import { useDataTable } from '../hooks/useDataTable';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';
import { Plus, Download, FileText, Search, Trash2, Filter, X, Building2, MapPin, Calendar, Users, TrendingUp, Eye, Phone, Mail, CheckSquare, Square, LayoutGrid, List, AlertCircle, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import { Company } from '../types';
import toast from 'react-hot-toast';
import { PageTransition } from '../components/layout/PageTransition';

// Sector colors mapping
const SECTOR_COLORS: Record<string, string> = {
  'İnşaat': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  'Lojistik': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  'Lojistik & Taşımacılık': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  'Sanayi/Üretim': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  'Enerji': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
  'Sağlık': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800',
  'Gıda': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800',
  'Teknoloji': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
};

type ViewMode = 'table' | 'card';

export const Companies = () => {
  const navigate = useNavigate();
  const { companies, deleteCompany, personnel, incidents, sectors } = useStore();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);
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
  } = useDataTable<Company>({
    data: companies,
    initialSort: { key: 'name', direction: 'asc' },
    initialPageSize: 10,
  });

  // Get unique sectors and cities for filter
  const uniqueSectors = useMemo(() => sectors.map(s => s.name).sort(), [sectors]);
  const uniqueCities = useMemo(() => {
    const cities = new Set<string>();
    companies.forEach(c => {
      // Extract city from address (simple extraction, assumes format like "City, Country" or just city name)
      const addressParts = c.address?.split(',');
      if (addressParts && addressParts.length > 0) {
        const city = addressParts[addressParts.length - 1].trim();
        if (city) cities.add(city);
      }
    });
    return Array.from(cities).sort();
  }, [companies]);

  // Calculate statistics with company-specific counts
  const stats = useMemo(() => {
    const totalCompanies = companies.length;
    const totalPersonnel = personnel.filter(p => p.assignedCompanyId).length;
    const totalLocations = companies.reduce((sum, c) => sum + (c.locations?.length || 0), 0);
    const totalIncidents = incidents.filter(i => companies.some(c => c.id === i.companyId)).length;
    const sectorDistribution = companies.reduce((acc, c) => {
      acc[c.sector] = (acc[c.sector] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topSector = Object.entries(sectorDistribution).sort((a, b) => b[1] - a[1])[0];
    
    return {
      totalCompanies,
      totalPersonnel,
      totalLocations,
      totalIncidents,
      topSector: topSector ? topSector[0] : 'N/A',
      sectorDistribution,
    };
  }, [companies, personnel, incidents]);

  // Calculate per-company stats
  const companyStats = useMemo(() => {
    const statsMap = new Map<string, { personnelCount: number; incidentCount: number }>();
    companies.forEach(company => {
      const personnelCount = personnel.filter(p => p.assignedCompanyId === company.id).length;
      const incidentCount = incidents.filter(i => i.companyId === company.id).length;
      statsMap.set(company.id, { personnelCount, incidentCount });
    });
    return statsMap;
  }, [companies, personnel, incidents]);

  // Apply custom filters (note: useDataTable already applies basic search and filters)
  // We extend with additional filters
  const filteredCompanies = useMemo(() => {
    let result = [...companies];

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((c) =>
        c.name.toLowerCase().includes(term) ||
        c.sector.toLowerCase().includes(term) ||
        c.contactPerson.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.phone.includes(term)
      );
    }

    // Apply sector filter
    if (filters.sector && filters.sector !== 'all') {
      result = result.filter(c => c.sector === filters.sector);
    }

    // Apply city filter
    if (filters.city && filters.city !== 'all') {
      result = result.filter(c => c.address?.includes(filters.city));
    }

    return result;
  }, [companies, searchTerm, filters]);

  // Paginate the filtered companies
  const totalItems = filteredCompanies.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const displayedCompanies = filteredCompanies.slice(startIndex, endIndex);

  const handleDelete = (id: string) => {
    setCompanyToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (companyToDelete) {
      deleteCompany(companyToDelete);
      toast.success('Firma başarıyla silindi.');
      setDeleteModalOpen(false);
      setCompanyToDelete(null);
    }
  };

  const toggleSelectCompany = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newSelected = new Set(selectedCompanies);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCompanies(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedCompanies.size === displayedCompanies.length) {
      setSelectedCompanies(new Set());
    } else {
      setSelectedCompanies(new Set(displayedCompanies.map(c => c.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedCompanies.size === 0) {
      toast.error('Lütfen silmek için firma seçiniz.');
      return;
    }
    setBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = () => {
    selectedCompanies.forEach(id => deleteCompany(id));
    const count = selectedCompanies.size;
    setSelectedCompanies(new Set());
    setBulkDeleteModalOpen(false);
    toast.success(`${count} firma başarıyla silindi.`);
  };

  const getSectorColor = (sector: string) => {
    return SECTOR_COLORS[sector] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  };

  const handleExportPDF = () => {
    const columns = ['Firma Adı', 'Sektör', 'Yetkili Kişi', 'Telefon', 'E-posta', 'Personel', 'Olay'];
    const data = filteredCompanies.map(c => {
      const stats = companyStats.get(c.id) || { personnelCount: 0, incidentCount: 0 };
      return [c.name, c.sector, c.contactPerson, c.phone, c.email, stats.personnelCount.toString(), stats.incidentCount.toString()];
    });
    exportToPDF('Firmalar Listesi', columns, data, 'firmalar');
    toast.success('PDF başarıyla indirildi.');
  };

  const handleExportExcel = () => {
    const data = filteredCompanies.map(c => {
      const stats = companyStats.get(c.id) || { personnelCount: 0, incidentCount: 0 };
      return {
        'Firma Adı': c.name,
        'Sektör': c.sector,
        'Yetkili Kişi': c.contactPerson,
        'Telefon': c.phone,
        'E-posta': c.email,
        'Adres': c.address,
        'Lokasyon Sayısı': c.locations?.length || 0,
        'Personel Sayısı': stats.personnelCount,
        'Olay Sayısı': stats.incidentCount,
        'Kayıt Tarihi': new Date(c.createdAt).toLocaleDateString('tr-TR')
      };
    });
    exportToExcel(data, 'firmalar');
    toast.success('Excel başarıyla indirildi.');
  };

  const columns = [
    {
      key: 'select',
      header: () => (
        <button onClick={toggleSelectAll} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors">
          {selectedCompanies.size === displayedCompanies.length && displayedCompanies.length > 0 ? (
            <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          ) : (
            <Square className="h-4 w-4 text-slate-400" />
          )}
        </button>
      ),
      width: '40px',
      render: (c: Company) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSelectCompany(c.id, e);
          }}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
        >
          {selectedCompanies.has(c.id) ? (
            <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          ) : (
            <Square className="h-4 w-4 text-slate-400" />
          )}
        </button>
      ),
    },
    {
      key: 'name',
      header: 'Firma Adı',
      sortable: true,
      render: (c: Company) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <div className="font-medium text-slate-900 dark:text-white">{c.name}</div>
            <div className="text-xs text-slate-500">{c.address}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'sector',
      header: 'Sektör',
      sortable: true,
      render: (c: Company) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${getSectorColor(c.sector)}`}>
          {c.sector}
        </span>
      ),
    },
    {
      key: 'contactPerson',
      header: 'Yetkili',
      sortable: true,
      render: (c: Company) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900 dark:text-white">{c.contactPerson}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'İletişim',
      render: (c: Company) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <Phone className="h-3 w-3 text-slate-400" />
            <span className="text-sm text-slate-900 dark:text-white">{c.phone}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Mail className="h-3 w-3 text-slate-400" />
            <span className="text-xs text-slate-500 dark:text-slate-400">{c.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'stats',
      header: 'İstatistikler',
      render: (c: Company) => {
        const stats = companyStats.get(c.id) || { personnelCount: 0, incidentCount: 0 };
        return (
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {stats.personnelCount}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {stats.incidentCount}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {c.locations?.length || 0}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Kayıt Tarihi',
      sortable: true,
      render: (c: Company) => (
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
          <Calendar className="h-3.5 w-3.5" />
          <span className="text-sm">{new Date(c.createdAt).toLocaleDateString('tr-TR')}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'İşlemler',
      width: '100px',
      render: (c: Company) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/companies/${c.id}`);
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

  const hasActiveFilters = searchTerm || filters.sector || filters.city;

  return (
    <PageTransition>
      <div className="space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Building2 className="h-6 w-6" />
              </div>
              <TrendingUp className="h-5 w-5 opacity-70" />
            </div>
            <p className="text-2xl font-bold mb-1">{stats.totalCompanies}</p>
            <p className="text-sm text-white/80">Toplam Firma</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              <TrendingUp className="h-5 w-5 opacity-70" />
            </div>
            <p className="text-2xl font-bold mb-1">{stats.totalPersonnel}</p>
            <p className="text-sm text-white/80">Atanmış Personel</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <MapPin className="h-6 w-6" />
              </div>
              <TrendingUp className="h-5 w-5 opacity-70" />
            </div>
            <p className="text-2xl font-bold mb-1">{stats.totalLocations}</p>
            <p className="text-sm text-white/80">Toplam Lokasyon</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-pink-600 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <AlertCircle className="h-6 w-6" />
              </div>
              <TrendingUp className="h-5 w-5 opacity-70" />
            </div>
            <p className="text-2xl font-bold mb-1">{stats.totalIncidents}</p>
            <p className="text-sm text-white/80">Toplam Olay</p>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
              Firmalar
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-lg">Sistemde kayıtlı firmaları yönetin.</p>
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
            
            {selectedCompanies.size > 0 && (
              <Button variant="danger" onClick={handleBulkDelete} className="gap-2">
                <Trash2 className="h-4 w-4" /> Seçilileri Sil ({selectedCompanies.size})
              </Button>
            )}
            <Button variant="secondary" onClick={handleExportExcel} className="gap-2">
              <Download className="h-4 w-4" /> Excel
            </Button>
            <Button variant="secondary" onClick={handleExportPDF} className="gap-2">
              <FileText className="h-4 w-4" /> PDF
            </Button>
            <Button onClick={() => navigate('/companies/new')} className="gap-2">
              <Plus className="h-4 w-4" /> Yeni Firma
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Firma adı, sektör veya yetkili ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
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
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" />
                  Sektör
                </label>
                <select
                  value={filters.sector || 'all'}
                  onChange={(e) => {
                    setFilter('sector', e.target.value === 'all' ? '' : e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Tüm Sektörler</option>
                  {uniqueSectors.map(sector => (
                    <option key={sector} value={sector}>{sector}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  Şehir
                </label>
                <select
                  value={filters.city || 'all'}
                  onChange={(e) => {
                    setFilter('city', e.target.value === 'all' ? '' : e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Tüm Şehirler</option>
                  {uniqueCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Data Display */}
        {viewMode === 'table' ? (
          <DataTable
            data={displayedCompanies}
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
            emptyMessage="Firma kaydı bulunamadı."
            onRowClick={(c) => navigate(`/companies/${c.id}`)}
          />
        ) : (
          <>
            {/* Card View */}
            <div className="bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-2xl rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-6">
              {displayedCompanies.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <Building2 className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-lg font-semibold text-slate-600 dark:text-slate-400">Firma kaydı bulunamadı.</p>
                  <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Yeni firma eklemek için yukarıdaki butonu kullanın.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedCompanies.map((company) => {
                    const stats = companyStats.get(company.id) || { personnelCount: 0, incidentCount: 0 };
                    const isSelected = selectedCompanies.has(company.id);
                    
                    return (
                      <div
                        key={company.id}
                        className={`group relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/50 rounded-2xl p-5 border-2 transition-all cursor-pointer hover:shadow-xl ${
                          isSelected
                            ? 'border-indigo-500 dark:border-indigo-400 shadow-lg shadow-indigo-500/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                        }`}
                        onClick={() => navigate(`/companies/${company.id}`)}
                      >
                        {/* Selection Checkbox */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectCompany(company.id, e);
                          }}
                          className="absolute top-3 right-3 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors z-10"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          ) : (
                            <Square className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
                          )}
                        </button>

                        {/* Company Icon */}
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg">
                            <Building2 className="w-7 h-7 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate mb-1">
                              {company.name}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${getSectorColor(company.sector)}`}>
                              {company.sector}
                            </span>
                          </div>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <Users className="h-4 w-4 text-slate-400 shrink-0" />
                            <span className="truncate">{company.contactPerson}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                            <span>{company.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                            <span className="truncate">{company.email}</span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Users className="h-3.5 w-3.5 text-blue-500" />
                              <span className="text-lg font-bold text-slate-900 dark:text-white">{stats.personnelCount}</span>
                            </div>
                            <p className="text-xs text-slate-500">Personel</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
                              <span className="text-lg font-bold text-slate-900 dark:text-white">{stats.incidentCount}</span>
                            </div>
                            <p className="text-xs text-slate-500">Olay</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                              <span className="text-lg font-bold text-slate-900 dark:text-white">{company.locations?.length || 0}</span>
                            </div>
                            <p className="text-xs text-slate-500">Lokasyon</p>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/companies/${company.id}`);
                            }}
                            className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-lg transition-all"
                            title="Detayları Gör"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(company.id);
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
                  {/* Page size selector */}
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

                  {/* Navigation buttons */}
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
          title="Firmayı Sil"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-400">
              Bu firmayı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
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
              <strong>{selectedCompanies.size} firmayı</strong> kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setBulkDeleteModalOpen(false)}>
                İptal
              </Button>
              <Button variant="danger" onClick={confirmBulkDelete} className="gap-2">
                <Trash2 className="h-4 w-4" /> {selectedCompanies.size} Firmayı Sil
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
};
