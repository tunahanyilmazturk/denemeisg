import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';
import { Plus, Download, FileText, Search, Edit2, Trash2 } from 'lucide-react';
import { Personnel } from '../types';
import toast from 'react-hot-toast';

import { PageTransition } from '../components/layout/PageTransition';

export const PersonnelPage = () => {
  const { personnel, companies, addPersonnel, updatePersonnel, deletePersonnel } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPerson, setCurrentPerson] = useState<Partial<Personnel>>({});

  const filteredPersonnel = personnel.filter(p => 
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    const data = filteredPersonnel.map(p => ({
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

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">Personeller</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-lg">Kendi çalışanlarımızı ve firma atamalarını yönetin.</p>
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

      <div className="bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-2xl rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
        <div className="p-5 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="İsim veya görev ara..." 
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
                <th className="px-6 py-3">Ad Soyad</th>
                <th className="px-6 py-3">Görev</th>
                <th className="px-6 py-3">Atanan Firma</th>
                <th className="px-6 py-3">İletişim</th>
                <th className="px-6 py-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredPersonnel.map((person) => (
                <tr key={person.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {person.firstName} {person.lastName}
                    <div className="text-xs text-gray-500 font-normal mt-0.5">TC: {person.tcNo}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {person.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {companies.find(c => c.id === person.assignedCompanyId)?.name || (
                      <span className="text-gray-400 italic">Atanmadı</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span>{person.phone}</span>
                      <span className="text-gray-500 dark:text-gray-400 text-xs">{person.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEditModal(person)} className="p-1 text-blue-600 hover:bg-blue-50 rounded dark:text-blue-400 dark:hover:bg-blue-900/30">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(person.id)} className="p-1 text-red-600 hover:bg-red-50 rounded dark:text-red-400 dark:hover:bg-red-900/30">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPersonnel.length === 0 && (
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
              className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
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
