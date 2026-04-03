import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { DataTable } from '../components/ui/DataTable';
import { useDataTable } from '../hooks/useDataTable';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';
import { Plus, Download, FileText, Search, Edit2, Trash2, Filter, X, Building2, MapPin, Calendar, Users, TrendingUp, Grid3x3, List, Eye, Phone, Mail, CheckSquare, Square } from 'lucide-react';
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

type ViewMode = 'grid' | 'list';

export const Companies = () => {
  const navigate = useNavigate();
  const { companies, addCompany, updateCompany, deleteCompany, personnel } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCompany, setCurrentCompany] = useState<Partial<Company>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [newLocation, setNewLocation] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [detailCompanyId, setDetailCompanyId] = useState<string | null>(null);

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
  } = useDataTable<Company>({
    data: companies,
    initialSort: { key: 'name', direction: 'asc' },
    initialPageSize: 10,
  });

  // Get unique sectors for filter
  const uniqueSectors = useMemo(() => [...new Set(companies.map(c => c.sector))].sort(), [companies]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalCompanies = companies.length;
    const totalPersonnel = personnel.filter(p => p.assignedCompanyId).length;
    const totalLocations = companies.reduce((sum, c) => sum + (c.locations?.length || 0), 0);
    const sectorDistribution = companies.reduce((acc, c) => {
      acc[c.sector] = (acc[c.sector] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topSector = Object.entries(sectorDistribution).sort((a, b) => b[1] - a[1])[0];
    
    return {
      totalCompanies,
      totalPersonnel,
      totalLocations,
      topSector: topSector ? topSector[0] : 'N/A',
    };
  }, [companies, personnel]);

  // Apply custom filters
  const filteredCompanies = paginatedData.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSector = !filters.sector || filters.sector === 'all' || c.sector === filters.sector;
    
    return matchesSearch && matchesSector;
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentCompany.id) {
      updateCompany(currentCompany as Company);
      toast.success('Firma başarıyla güncellendi.');
    } else {
      addCompany({
        ...currentCompany,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
      } as Company);
      toast.success('Firma başarıyla eklendi.');
    }
    setIsModalOpen(false);
    setCurrentCompany({});
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bu firmayı silmek istediğinize emin misiniz?')) {
      deleteCompany(id);
      toast.success('Firma başarıyla silindi.');
    }
  };

  const openEditModal = (company: Company) => {
    setCurrentCompany(company);
    setIsModalOpen(true);
  };

  const addLocation = () => {
    const locations = currentCompany.locations || [];
    if (newLocation.trim() && !locations.includes(newLocation.trim())) {
      setCurrentCompany({
        ...currentCompany,
        locations: [...locations, newLocation.trim()]
      });
      setNewLocation('');
    }
  };

  const removeLocation = (locationToRemove: string) => {
    const locations = currentCompany.locations || [];
    setCurrentCompany({
      ...currentCompany,
      locations: locations.filter(loc => loc !== locationToRemove)
    });
  };

  const toggleSelectCompany = (id: string) => {
    const newSelected = new Set(selectedCompanies);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCompanies(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedCompanies.size === filteredCompanies.length) {
      setSelectedCompanies(new Set());
    } else {
      setSelectedCompanies(new Set(filteredCompanies.map(c => c.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedCompanies.size === 0) {
      toast.error('Lütfen silmek için firma seçiniz.');
      return;
    }
    if (window.confirm(`${selectedCompanies.size} firmayı silmek istediğinize emin misiniz?`)) {
      selectedCompanies.forEach(id => deleteCompany(id));
      setSelectedCompanies(new Set());
      toast.success(`${selectedCompanies.size} firma başarıyla silindi.`);
    }
  };

  const getSectorColor = (sector: string) => {
    return SECTOR_COLORS[sector] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  };

  const getDetailCompany = () => {
    return companies.find(c => c.id === detailCompanyId);
  };

  const getCompanyPersonnel = (companyId: string) => {
    return personnel.filter(p => p.assignedCompanyId === companyId);
  };

  const handleExportPDF = () => {
    const columns = ['Firma Adı', 'Sektör', 'Yetkili Kişi', 'Telefon', 'E-posta'];
    const data = companies.map(c => [c.name, c.sector, c.contactPerson, c.phone, c.email]);
    exportToPDF('Firmalar Listesi', columns, data, 'firmalar');
    toast.success('PDF başarıyla indirildi.');
  };

  const handleExportExcel = () => {
    const data = companies.map(c => ({
      'Firma Adı': c.name,
      'Sektör': c.sector,
      'Yetkili Kişi': c.contactPerson,
      'Telefon': c.phone,
      'E-posta': c.email,
      'Adres': c.address,
      'Kayıt Tarihi': new Date(c.createdAt).toLocaleDateString('tr-TR')
    }));
    exportToExcel(data, 'firmalar');
    toast.success('Excel başarıyla indirildi.');
  };

  const columns = [
    {
      key: 'select',
      header: () => (
        <button onClick={toggleSelectAll} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors">
          {selectedCompanies.size === filteredCompanies.length && filteredCompanies.length > 0 ? (
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
            toggleSelectCompany(c.id);
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
        <div className="flex flex-col">
          <span className="text-slate-900 dark:text-white">{c.phone}</span>
          <span className="text-slate-500 dark:text-slate-400 text-xs">{c.email}</span>
        </div>
      ),
    },
    {
      key: 'locations',
      header: 'Lokasyonlar',
      render: (c: Company) => (
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {c.locations?.length || 0} lokasyon
          </span>
        </div>
      ),
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
      width: '140px',
      render: (c: Company) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDetailCompanyId(c.id);
            }}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg dark:text-indigo-400 dark:hover:bg-indigo-900/30 transition-colors"
            title="Detayları Gör"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(c);
            }}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
            title="Düzenle"
          >
            <Edit2 className="h-4 w-4" />
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

  const hasActiveFilters = searchTerm || filters.sector;

  const detailCompany = getDetailCompany();
  const companyPersonnel = detailCompanyId ? getCompanyPersonnel(detailCompanyId) : [];

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
                <Building2 className="h-6 w-6" />
              </div>
            </div>
            <p className="text-lg font-bold mb-1 truncate">{stats.topSector}</p>
            <p className="text-sm text-white/80">En Yaygın Sektör</p>
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
          <div className="flex items-center gap-3 flex-wrap">
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
            <Button variant="secondary" onClick={() => { setCurrentCompany({}); setIsModalOpen(true); }} className="gap-2">
              <Plus className="h-4 w-4" /> Hızlı Ekle
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
                  Sektör
                </label>
                <select
                  value={filters.sector || 'all'}
                  onChange={(e) => setFilter('sector', e.target.value === 'all' ? '' : e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Tüm Sektörler</option>
                  {uniqueSectors.map(sector => (
                    <option key={sector} value={sector}>{sector}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Data Table or Grid View */}
        {viewMode === 'list' ? (
          <DataTable
            data={filteredCompanies}
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
          />
        ) : (
          <div className="space-y-4">
            {/* Grid View */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCompanies.length === 0 ? (
                <div className="col-span-full text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                  <Building2 className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                  <p className="text-slate-600 dark:text-slate-400">Firma kaydı bulunamadı.</p>
                </div>
              ) : (
                filteredCompanies.map((company) => (
                  <div
                    key={company.id}
                    className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer"
                    onClick={() => setDetailCompanyId(company.id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                          <Building2 className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-900 dark:text-white truncate">{company.name}</h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border mt-1 ${getSectorColor(company.sector)}`}>
                            {company.sector}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectCompany(company.id);
                        }}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                      >
                        {selectedCompanies.has(company.id) ? (
                          <CheckSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        ) : (
                          <Square className="h-5 w-5 text-slate-400" />
                        )}
                      </button>
                    </div>

                    <div className="space-y-2.5 mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Users className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">{company.contactPerson}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <span>{company.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <span className="truncate">{company.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span>{company.locations?.length || 0} lokasyon</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(company.createdAt).toLocaleDateString('tr-TR')}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(company);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
                          title="Düzenle"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(company.id);
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

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
          title={currentCompany.id ? "Firmayı Düzenle" : "Yeni Firma Ekle"}
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Firma Adı</label>
              <Input required value={currentCompany.name || ''} onChange={e => setCurrentCompany({...currentCompany, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sektör</label>
              <Input required value={currentCompany.sector || ''} onChange={e => setCurrentCompany({...currentCompany, sector: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Yetkili Kişi</label>
              <Input required value={currentCompany.contactPerson || ''} onChange={e => setCurrentCompany({...currentCompany, contactPerson: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefon</label>
                <Input required value={currentCompany.phone || ''} onChange={e => setCurrentCompany({...currentCompany, phone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">E-posta</label>
                <Input required type="email" value={currentCompany.email || ''} onChange={e => setCurrentCompany({...currentCompany, email: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Adres</label>
              <Input required value={currentCompany.address || ''} onChange={e => setCurrentCompany({...currentCompany, address: e.target.value})} />
            </div>
            
            {/* Locations Management */}
            <div className="space-y-3 pt-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Lokasyonlar
              </label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Yeni lokasyon ekle (örn: A Blok, Şantiye)" 
                  value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addLocation())}
                />
                <Button type="button" variant="secondary" onClick={addLocation}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {currentCompany.locations && currentCompany.locations.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {currentCompany.locations.map((loc, idx) => (
                    <span 
                      key={idx} 
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
                    >
                      {loc}
                      <button
                        type="button"
                        onClick={() => removeLocation(loc)}
                        className="ml-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>İptal</Button>
              <Button type="submit">Kaydet</Button>
            </div>
          </form>
        </Modal>

        {/* Company Detail Modal */}
        <Modal
          isOpen={!!detailCompanyId}
          onClose={() => setDetailCompanyId(null)}
          title="Firma Detayları"
          size="xl"
        >
          {detailCompany && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start gap-4 pb-5 border-b border-slate-200 dark:border-slate-700">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                  <Building2 className="h-8 w-8" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{detailCompany.name}</h2>
                  <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold border ${getSectorColor(detailCompany.sector)}`}>
                    {detailCompany.sector}
                  </span>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">İletişim Bilgileri</h3>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Yetkili Kişi</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{detailCompany.contactPerson}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Telefon</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{detailCompany.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">E-posta</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{detailCompany.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Adres</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{detailCompany.address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Diğer Bilgiler</h3>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Kayıt Tarihi</p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {new Date(detailCompany.createdAt).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Personel Sayısı</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{companyPersonnel.length} kişi</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Locations */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Lokasyonlar ({detailCompany.locations?.length || 0})
                </h3>
                {detailCompany.locations && detailCompany.locations.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {detailCompany.locations.map((location, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700">
                        <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{location}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic">Henüz lokasyon eklenmemiş.</p>
                )}
              </div>

              {/* Personnel List */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Personeller ({companyPersonnel.length})
                </h3>
                {companyPersonnel.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {companyPersonnel.map((person) => (
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
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic">Bu firmaya atanmış personel bulunmuyor.</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="ghost" onClick={() => setDetailCompanyId(null)}>Kapat</Button>
                <Button onClick={() => { setDetailCompanyId(null); openEditModal(detailCompany); }}>
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
