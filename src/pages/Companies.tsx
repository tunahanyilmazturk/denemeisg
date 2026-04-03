import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';
import { Plus, Download, FileText, Search, Edit2, Trash2 } from 'lucide-react';
import { Company } from '../types';
import toast from 'react-hot-toast';

import { PageTransition } from '../components/layout/PageTransition';

export const Companies = () => {
  const { companies, addCompany, updateCompany, deleteCompany } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCompany, setCurrentCompany] = useState<Partial<Company>>({});

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.sector.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleExportPDF = () => {
    const columns = ['Firma Adı', 'Sektör', 'Yetkili Kişi', 'Telefon', 'E-posta'];
    const data = filteredCompanies.map(c => [c.name, c.sector, c.contactPerson, c.phone, c.email]);
    exportToPDF('Firmalar Listesi', columns, data, 'firmalar');
    toast.success('PDF başarıyla indirildi.');
  };

  const handleExportExcel = () => {
    const data = filteredCompanies.map(c => ({
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

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">Firmalar</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-lg">Sistemde kayıtlı firmaları yönetin.</p>
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

      <div className="bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-2xl rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
        <div className="p-5 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Firma adı veya sektör ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800/50 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3">Firma Adı</th>
                <th className="px-6 py-3">Sektör</th>
                <th className="px-6 py-3">Yetkili</th>
                <th className="px-6 py-3">İletişim</th>
                <th className="px-6 py-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredCompanies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{company.name}</td>
                  <td className="px-6 py-4">{company.sector}</td>
                  <td className="px-6 py-4">{company.contactPerson}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span>{company.phone}</span>
                      <span className="text-gray-500 dark:text-gray-400 text-xs">{company.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEditModal(company)} className="p-1 text-blue-600 hover:bg-blue-50 rounded dark:text-blue-400 dark:hover:bg-blue-900/30">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(company.id)} className="p-1 text-red-600 hover:bg-red-50 rounded dark:text-red-400 dark:hover:bg-red-900/30">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCompanies.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Kayıt bulunamadı.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
