import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { PPE, PPEType, PPEStatus } from '../types';
import { Plus, Search, Edit2, Trash2, Download, FileText, HardHat, Filter, X } from 'lucide-react';
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

const ppeTypes: PPEType[] = ['Baret', 'İş Ayakkabısı', 'Eldiven', 'Gözlük', 'Reflektörlü Yelek', 'Kulaklık', 'Emniyet Kemeri', 'Diğer'];

export const PPEPage = () => {
  const { ppes, personnel, addPPE, updatePPE, deletePPE } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPPE, setCurrentPPE] = useState<Partial<PPE>>({});
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
  } = useDataTable<PPE>({
    data: ppes,
    initialSort: { key: 'issueDate', direction: 'desc' },
    initialPageSize: 10,
  });

  // Apply custom filters
  const filteredPPEs = paginatedData.filter((p) => {
    const person = personnel.find(per => per.id === p.personnelId);
    const personName = person ? `${person.firstName} ${person.lastName}`.toLowerCase() : '';
    
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      personName.includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filters.status || filters.status === 'all' || p.status === filters.status;
    const matchesType = !filters.type || filters.type === 'all' || p.type === filters.type;
    
    return matchesSearch && matchesStatus && matchesType;
  });

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
    if (window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
      deletePPE(id);
      toast.success('Kayıt silindi.');
    }
  };

  const openEditModal = (ppe: PPE) => {
    setCurrentPPE(ppe);
    setIsModalOpen(true);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('KKD Zimmet Listesi', 14, 15);
    
    const tableData = ppes.map(p => {
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
    const data = ppes.map(p => {
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

  const columns = [
    {
      key: 'name',
      header: 'Ekipman',
      sortable: true,
      render: (p: PPE) => (
        <div>
          <div className="font-medium text-slate-900 dark:text-white">{p.name}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{p.type}</div>
        </div>
      ),
    },
    {
      key: 'personnelId',
      header: 'Personel',
      sortable: true,
      render: (p: PPE) => {
        const person = personnel.find(per => per.id === p.personnelId);
        return person ? (
          <span className="text-slate-700 dark:text-slate-300">{person.firstName} {person.lastName}</span>
        ) : (
          <span className="text-red-500">Silinmiş Personel</span>
        );
      },
    },
    {
      key: 'issueDate',
      header: 'Veriliş Tarihi',
      sortable: true,
      width: '130px',
      render: (p: PPE) => (
        <span className="text-slate-700 dark:text-slate-300">
          {new Date(p.issueDate).toLocaleDateString('tr-TR')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Durum',
      sortable: true,
      width: '130px',
      render: (p: PPE) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(p.status)}`}>
          {p.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'İşlemler',
      width: '100px',
      render: (p: PPE) => (
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

  const hasActiveFilters = searchTerm || filters.status || filters.type;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">KKD Takibi</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-lg">Kişisel Koruyucu Donanım zimmet ve durum takibi.</p>
          </div>
          <div className="flex items-center gap-3">
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
        <div className="bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-2xl rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-5">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Ekipman veya personel ara..." 
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
                  Ekipman Tipi
                </label>
                <select
                  value={filters.type || 'all'}
                  onChange={(e) => setFilter('type', e.target.value === 'all' ? '' : e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200"
                >
                  <option value="all">Tüm Tipler</option>
                  {ppeTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Durum
                </label>
                <select
                  value={filters.status || 'all'}
                  onChange={(e) => setFilter('status', e.target.value === 'all' ? '' : e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="Aktif">Aktif</option>
                  <option value="İade Edildi">İade Edildi</option>
                  <option value="Yıprandı/Kayıp">Yıprandı/Kayıp</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Data Table */}
        <DataTable
          data={filteredPPEs}
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
          emptyMessage={
            <div className="flex flex-col items-center justify-center py-8">
              <HardHat className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-slate-500 dark:text-slate-400">KKD kaydı bulunamadı.</p>
            </div>
          }
        />

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
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
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
                className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
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
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
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
                className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
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
      </div>
    </PageTransition>
  );
};
