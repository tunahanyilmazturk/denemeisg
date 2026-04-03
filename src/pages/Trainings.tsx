import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';
import { Plus, Download, FileText, Search, Edit2, Trash2, GraduationCap } from 'lucide-react';
import { Training, TrainingStatus } from '../types';
import toast from 'react-hot-toast';
import { PageTransition } from '../components/layout/PageTransition';

export const Trainings = () => {
  const { trainings, personnel, addTraining, updateTraining, deleteTraining } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTraining, setCurrentTraining] = useState<Partial<Training>>({ participants: [] });

  const filteredTrainings = trainings.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.trainer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentTraining.id) {
      updateTraining(currentTraining as Training);
      toast.success('Eğitim başarıyla güncellendi.');
    } else {
      addTraining({
        ...currentTraining,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
      } as Training);
      toast.success('Eğitim başarıyla eklendi.');
    }
    setIsModalOpen(false);
    setCurrentTraining({ participants: [] });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bu eğitimi silmek istediğinize emin misiniz?')) {
      deleteTraining(id);
      toast.success('Eğitim başarıyla silindi.');
    }
  };

  const openEditModal = (training: Training) => {
    setCurrentTraining(training);
    setIsModalOpen(true);
  };

  const toggleParticipant = (personnelId: string) => {
    const participants = currentTraining.participants || [];
    if (participants.includes(personnelId)) {
      setCurrentTraining({ ...currentTraining, participants: participants.filter(id => id !== personnelId) });
    } else {
      setCurrentTraining({ ...currentTraining, participants: [...participants, personnelId] });
    }
  };

  const handleExportPDF = () => {
    const columns = ['Eğitim Adı', 'Eğitmen', 'Tarih', 'Süre (Saat)', 'Durum', 'Katılımcı Sayısı'];
    const data = filteredTrainings.map(t => [
      t.title, 
      t.trainer,
      new Date(t.date).toLocaleString('tr-TR'),
      t.duration.toString(),
      t.status,
      t.participants.length.toString()
    ]);
    exportToPDF('Eğitimler Listesi', columns, data, 'egitimler');
    toast.success('PDF başarıyla indirildi.');
  };

  const handleExportExcel = () => {
    const data = filteredTrainings.map(t => ({
      'Eğitim Adı': t.title,
      'Eğitmen': t.trainer,
      'Tarih': new Date(t.date).toLocaleString('tr-TR'),
      'Süre (Saat)': t.duration,
      'Durum': t.status,
      'Katılımcı Sayısı': t.participants.length,
      'Kayıt Tarihi': new Date(t.createdAt).toLocaleString('tr-TR')
    }));
    exportToExcel(data, 'egitimler');
    toast.success('Excel başarıyla indirildi.');
  };

  const getStatusColor = (status: TrainingStatus) => {
    switch(status) {
      case 'İptal': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'Planlandı': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Tamamlandı': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">Eğitimler</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-lg">İSG eğitimlerini ve katılımcıları takip edin.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleExportExcel} className="gap-2">
              <Download className="h-4 w-4" /> Excel
            </Button>
            <Button variant="secondary" onClick={handleExportPDF} className="gap-2">
              <FileText className="h-4 w-4" /> PDF
            </Button>
            <Button onClick={() => { setCurrentTraining({ participants: [], status: 'Planlandı' }); setIsModalOpen(true); }} className="gap-2">
              <Plus className="h-4 w-4" /> Yeni Eğitim
            </Button>
          </div>
        </div>

        <div className="bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-2xl rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
          <div className="p-5 border-b border-slate-200/60 dark:border-slate-800/60">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Eğitim adı veya eğitmen ara..." 
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
                  <th className="px-6 py-3">Eğitim</th>
                  <th className="px-6 py-3">Eğitmen</th>
                  <th className="px-6 py-3">Tarih & Süre</th>
                  <th className="px-6 py-3">Katılımcılar</th>
                  <th className="px-6 py-3">Durum</th>
                  <th className="px-6 py-3 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredTrainings.map((training) => (
                  <tr key={training.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {training.title}
                    </td>
                    <td className="px-6 py-4">{training.trainer}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span>{new Date(training.date).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">{training.duration} Saat</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex -space-x-2 overflow-hidden">
                        {training.participants.slice(0, 3).map(pId => {
                          const p = personnel.find(person => person.id === pId);
                          return (
                            <div key={pId} className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-900 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium" title={p ? `${p.firstName} ${p.lastName}` : 'Bilinmeyen'}>
                              {p ? p.firstName[0] + p.lastName[0] : '?'}
                            </div>
                          );
                        })}
                        {training.participants.length > 3 && (
                          <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-900 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-medium text-gray-500">
                            +{training.participants.length - 3}
                          </div>
                        )}
                        {training.participants.length === 0 && <span className="text-gray-400 italic">Yok</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(training.status)}`}>
                        {training.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(training)} className="p-1 text-blue-600 hover:bg-blue-50 rounded dark:text-blue-400 dark:hover:bg-blue-900/30">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(training.id)} className="p-1 text-red-600 hover:bg-red-50 rounded dark:text-red-400 dark:hover:bg-red-900/30">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredTrainings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Kayıt bulunamadı.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title={currentTraining.id ? "Eğitimi Düzenle" : "Yeni Eğitim Planla"}
          className="max-w-2xl"
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Eğitim Başlığı</label>
              <Input required value={currentTraining.title || ''} onChange={e => setCurrentTraining({...currentTraining, title: e.target.value})} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Eğitmen</label>
                <Input required value={currentTraining.trainer || ''} onChange={e => setCurrentTraining({...currentTraining, trainer: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Durum</label>
                <select 
                  required
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
                  value={currentTraining.status || 'Planlandı'}
                  onChange={e => setCurrentTraining({...currentTraining, status: e.target.value as TrainingStatus})}
                >
                  <option value="Planlandı">Planlandı</option>
                  <option value="Tamamlandı">Tamamlandı</option>
                  <option value="İptal">İptal</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tarih ve Saat</label>
                <Input required type="datetime-local" value={currentTraining.date ? currentTraining.date.substring(0, 16) : ''} onChange={e => setCurrentTraining({...currentTraining, date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Süre (Saat)</label>
                <Input required type="number" min="1" value={currentTraining.duration || ''} onChange={e => setCurrentTraining({...currentTraining, duration: parseInt(e.target.value)})} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Katılımcılar</label>
              <div className="border border-gray-300 dark:border-gray-700 rounded-md p-3 max-h-40 overflow-y-auto space-y-2 bg-gray-50 dark:bg-gray-900/50">
                {personnel.map(p => (
                  <label key={p.id} className="flex items-center gap-3 cursor-pointer p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                      checked={currentTraining.participants?.includes(p.id) || false}
                      onChange={() => toggleParticipant(p.id)}
                    />
                    <span className="text-sm">{p.firstName} {p.lastName} <span className="text-gray-500 text-xs">({p.role})</span></span>
                  </label>
                ))}
                {personnel.length === 0 && <p className="text-sm text-gray-500">Sistemde personel bulunmuyor.</p>}
              </div>
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
