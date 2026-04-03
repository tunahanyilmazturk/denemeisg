import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { PPE, PPEType, PPEStatus } from '../types';
import { Plus, Search, Edit2, Trash2, Download, FileText, HardHat } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { PageTransition } from '../components/layout/PageTransition';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const ppeTypes: PPEType[] = ['Baret', 'İş Ayakkabısı', 'Eldiven', 'Gözlük', 'Reflektörlü Yelek', 'Kulaklık', 'Emniyet Kemeri', 'Diğer'];

export const PPEPage = () => {
  const { ppes, personnel, addPPE, updatePPE, deletePPE } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPPE, setCurrentPPE] = useState<Partial<PPE>>({});

  const filteredPPEs = ppes.filter(p => {
    const person = personnel.find(per => per.id === p.personnelId);
    const personName = person ? `${person.firstName} ${person.lastName}`.toLowerCase() : '';
    return p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           p.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
           personName.includes(searchTerm.toLowerCase());
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
    
    const tableData = filteredPPEs.map(p => {
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
    const data = filteredPPEs.map(p => {
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

  return (
    <PageTransition>
      <div className="space-y-8">
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

        <div className="bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-2xl rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
          <div className="p-5 border-b border-slate-200/60 dark:border-slate-800/60">
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Ekipman veya personel ara..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800/50 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3">Ekipman</th>
                  <th className="px-6 py-3">Personel</th>
                  <th className="px-6 py-3">Veriliş Tarihi</th>
                  <th className="px-6 py-3">Durum</th>
                  <th className="px-6 py-3 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredPPEs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center justify-center">
                        <HardHat className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                        <p>Kayıt bulunamadı.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPPEs.map((ppe) => {
                    const person = personnel.find(p => p.id === ppe.personnelId);
                    return (
                      <tr key={ppe.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 dark:text-white">{ppe.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{ppe.type}</div>
                        </td>
                        <td className="px-6 py-4">
                          {person ? `${person.firstName} ${person.lastName}` : <span className="text-red-500">Silinmiş Personel</span>}
                        </td>
                        <td className="px-6 py-4">{new Date(ppe.issueDate).toLocaleDateString('tr-TR')}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            ppe.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            ppe.status === 'İade Edildi' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {ppe.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openEditModal(ppe)} className="p-1 text-blue-600 hover:bg-blue-50 rounded dark:text-blue-400 dark:hover:bg-blue-900/30">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(ppe.id)} className="p-1 text-red-600 hover:bg-red-50 rounded dark:text-red-400 dark:hover:bg-red-900/30">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

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
