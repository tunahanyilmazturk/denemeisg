import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { DataTable } from '../components/ui/DataTable';
import { useDataTable } from '../hooks/useDataTable';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';
import { Plus, Download, FileText, Search, Edit2, Trash2, Filter, X } from 'lucide-react';
import { Personnel } from '../types';
import toast from 'react-hot-toast';
import { PageTransition } from '../components/layout/PageTransition';

export const PersonnelPage = () => {
  const { personnel, companies, addPersonnel, updatePersonnel, deletePersonnel } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPerson, setCurrentPerson] = useState<Partial<Personnel>>({});
  const [showFilters, setShowFilters] = useState(false);

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
    initialSort: { key: 'lastName', direction: 'asc' },
    initialPageSize: 10,
  });

  // Apply custom filters
  const filteredPersonnel = paginatedData.filter((p) => {
    const matchesSearch = 
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tcNo.includes(searchTerm);
    
    const matchesCompany = !filters.companyId || filters.companyId === 'all' || p.assignedCompanyId === filters.companyId;
    const matchesRole = !filters.role || filters.role === 'all' || p.role === filters.role;
    
    return matchesSearch && matchesCompany && matchesRole;
  });

  // Get unique roles for filter
  const uniqueRoles = [...new Set(personnel.map(p => p.role))];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPerson.id) {
      updatePersonnel(currentPerson as Personnel);
      toast.success('Personel başarıyla güncellendi.');
    } else {
      addPersonnel({
        ...currentPerson,
        id: Math.random().toString(36).substr(2, 9),
      } as Personnel);
      toast.success('Personel başarıyla eklendi.');
    }
    setIsModalOpen(false);
    setCurrentPerson({});
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bu personeli silmek istediğinize emin misiniz?')) {
      deletePersonnel(id);
      toast.success('Personel başarıyla silindi.');
    }
  };

  const openEditModal = (person: Personnel) => {
    setCurrentPerson(person);
    setIsModalOpen(true);
  };

  const handleExportPDF = () => {
    const columns = ['Ad Soyad', 'TC No', 'Görev', 'Atanan Firma', 'Telefon'];
    const data = filteredPersonnel.map(p => [
      `${p.firstName} ${p.lastName}`, 
      p.tcNo, 
      p.role, 
      companies.find(c => c.id === p.assignedCompanyId)?.name || 'Atanmadı',
      p.phone
    ]);
    exportToPDF('Personel Listesi', columns, data, 'personeller');
    toast.success('PDF başarıyla indirildi.');
  };

  const handleExportExcel = () => {
    const data = personnel.map(p => ({
      'Ad': p.firstName,
      'Soyad': p.lastName,
      'TC No': p.tcNo,
      'Görev': p.role,
      'Atanan Firma': companies.find(c => c.id === p.assignedCompanyId)?.name || 'Atanmadı',
      'Telefon': p.phone,
      'E-posta': p.email,
      'İşe Başlama': new Date(p.startDate).toLocaleDateString('tr-TR')
    }));
    exportToExcel(data, 'personeller');
    toast.success('Excel başarıyla indirildi.');
  };

  const columns = [
    {
      key: 'lastName',
      header: 'Ad Soyad',
      sortable: true,
      render: (p: Personnel) => (
        <div>
          <div className="font-medium text-slate-900 dark:text-white">
            {p.firstName} {p.lastName}
          </div>
          <div className="text-xs text-slate-500 font-normal mt-0.5">TC: {p.tcNo}</div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Görev',
      sortable: true,
      render: (p: Personnel) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          {p.role}
        </span>
      ),
    },
    {
      key: 'assignedCompanyId',
      header: 'Atanan Firma',
      sortable: true,
      render: (p: Personnel) => (
        companies.find(c => c.id === p.assignedCompanyId)?.name || (
          <span className="text-slate-400 italic">Atanmadı</span>
        )
      ),
    },
    {
      key: 'phone',
      header: 'İletişim',
      render: (p: Personnel) => (
        <div className="flex flex-col">
          <span className="text-slate-900 dark:text-white">{p.phone}</span>
          <span className="text-slate-500 dark:text-slate-400 text-xs">{p.email}</span>
        </div>
      ),
    },
    {
      key: 'startDate',
      header: 'İşe Başlama',
      sortable: true,
      render: (p: Personnel) => new Date(p.startDate).toLocaleDateString('tr-TR'),
    },
    {
      key: 'actions',
      header: 'İşlemler',
      width: '100px',
      render: (p: Personnel) => (
        <div className="flex items-center justify-end gap-2">
          <button 
            onClick={() => openEditModal(p)} 
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button 
            onClick={() => handleDelete(p.id)} 
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const hasActiveFilters = searchTerm || filters.companyId || filters.role;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
              Personeller
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-lg">
              Kendi çalışanlarımızı ve firma atamalarını yönetin.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleExportExcel} className="gap-2">
              <Download className="h-4 w-4" /> Excel
            </Button>
            <Button variant="secondary" onClick={handleExportPDF} className="gap-2">
              <FileText className="h-4 w-4" /> PDF
            </Button>
            <Button onClick={() => { setCurrentPerson({}); setIsModalOpen(true); }} className="gap-2">
              <Plus className="h-4 w-4" /> Yeni Personel
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-2xl rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-5">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="İsim, TC veya görev ara..." 
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
            <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-800/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Firma
                </label>
                <select
                  value={filters.companyId || 'all'}
                  onChange={(e) => setFilter('companyId', e.target.value === 'all' ? '' : e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200"
                >
                  <option value="all">Tüm Firmalar</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Görev
                </label>
                <select
                  value={filters.role || 'all'}
                  onChange={(e) => setFilter('role', e.target.value === 'all' ? '' : e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200"
                >
                  <option value="all">Tüm Görevler</option>
                  {uniqueRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Data Table */}
        <DataTable
          data={filteredPersonnel}
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
          emptyMessage="Personel kaydı bulunamadı."
        />

        {/* Add/Edit Modal */}
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title={currentPerson.id ? "Personeli Düzenle" : "Yeni Personel Ekle"}
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ad</label>
                <Input required value={currentPerson.firstName || ''} onChange={e => setCurrentPerson({...currentPerson, firstName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Soyad</label>
                <Input required value={currentPerson.lastName || ''} onChange={e => setCurrentPerson({...currentPerson, lastName: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">TC Kimlik No</label>
                <Input required maxLength={11} value={currentPerson.tcNo || ''} onChange={e => setCurrentPerson({...currentPerson, tcNo: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Görev</label>
                <Input required value={currentPerson.role || ''} onChange={e => setCurrentPerson({...currentPerson, role: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Atanacak Firma</label>
              <select 
                className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                value={currentPerson.assignedCompanyId || ''}
                onChange={e => setCurrentPerson({...currentPerson, assignedCompanyId: e.target.value})}
              >
                <option value="">Atanmadı</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefon</label>
                <Input required value={currentPerson.phone || ''} onChange={e => setCurrentPerson({...currentPerson, phone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">E-posta</label>
                <Input required type="email" value={currentPerson.email || ''} onChange={e => setCurrentPerson({...currentPerson, email: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">İşe Başlama Tarihi</label>
              <Input required type="date" value={currentPerson.startDate || ''} onChange={e => setCurrentPerson({...currentPerson, startDate: e.target.value})} />
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
