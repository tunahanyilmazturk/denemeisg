import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { DataTable } from '../components/ui/DataTable';
import { useDataTable } from '../hooks/useDataTable';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';
import { Plus, Download, FileText, Search, Edit2, Trash2, Filter, X, Building2, MapPin } from 'lucide-react';
import { Company } from '../types';
import toast from 'react-hot-toast';
import { PageTransition } from '../components/layout/PageTransition';

export const Companies = () => {
  const { companies, addCompany, updateCompany, deleteCompany } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCompany, setCurrentCompany] = useState<Partial<Company>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [newLocation, setNewLocation] = useState('');

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

  // Apply custom filters
  const filteredCompanies = paginatedData.filter((c) => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSector = !filters.sector || filters.sector === 'all' || c.sector === filters.sector;
    
    return matchesSearch && matchesSector;
  });

  // Get unique sectors for filter
  const uniqueSectors = [...new Set(companies.map(c => c.sector))].sort();

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
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
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
      key: 'createdAt',
      header: 'Kayıt Tarihi',
      sortable: true,
      render: (c: Company) => new Date(c.createdAt).toLocaleDateString('tr-TR'),
    },
    {
      key: 'actions',
      header: 'İşlemler',
      width: '100px',
      render: (c: Company) => (
        <div className="flex items-center justify-end gap-2">
          <button 
            onClick={() => openEditModal(c)} 
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button 
            onClick={() => handleDelete(c.id)} 
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const hasActiveFilters = searchTerm || filters.sector;

  return (
    <PageTransition>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
              Firmalar
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-lg">Sistemde kayıtlı firmaları yönetin.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleExportExcel} className="gap-2">
              <Download className="h-4 w-4" /> Excel
            </Button>
            <Button variant="secondary" onClick={handleExportPDF} className="gap-2">
              <FileText className="h-4 w-4" /> PDF
            </Button>
            <Button onClick={() => { setCurrentCompany({}); setIsModalOpen(true); }} className="gap-2">
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
            <div className="flex items-center gap-2">
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

        {/* Data Table */}
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
      </div>
    </PageTransition>
  );
};
