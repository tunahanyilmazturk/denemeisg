import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';
import { Plus, Download, FileText, Search, Edit2, Trash2, AlertCircle, Filter } from 'lucide-react';
import { Incident, Severity, IncidentStatus } from '../types';
import toast from 'react-hot-toast';

import { PageTransition } from '../components/layout/PageTransition';

export const Incidents = () => {
  const navigate = useNavigate();
  const { incidents, companies, personnel, addIncident, updateIncident, deleteIncident } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<Severity | 'Tümü'>('Tümü');
  const [filterStatus, setFilterStatus] = useState<IncidentStatus | 'Tümü'>('Tümü');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentIncident, setCurrentIncident] = useState<Partial<Incident>>({});

  const filteredIncidents = incidents.filter(i => {
    const matchesSearch = i.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          companies.find(c => c.id === i.companyId)?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === 'Tümü' || i.severity === filterSeverity;
    const matchesStatus = filterStatus === 'Tümü' || i.status === filterStatus;
    
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentIncident.id) {
      updateIncident(currentIncident as Incident);
      toast.success('Olay bildirimi başarıyla güncellendi.');
    }
    setIsModalOpen(false);
    setCurrentIncident({});
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bu olay bildirimini silmek istediğinize emin misiniz?')) {
      deleteIncident(id);
      toast.success('Olay bildirimi başarıyla silindi.');
    }
  };

  const openEditModal = (incident: Incident) => {
    setCurrentIncident(incident);
    setIsModalOpen(true);
  };

  const handleExportPDF = () => {
    const columns = ['Başlık', 'Firma', 'Tarih', 'Öncelik', 'Durum'];
    const data = filteredIncidents.map(i => [
      i.title, 
      companies.find(c => c.id === i.companyId)?.name || '-',
      new Date(i.date).toLocaleString('tr-TR'),
      i.severity,
      i.status
    ]);
    exportToPDF('Kaza ve Olay Bildirimleri', columns, data, 'olaylar');
    toast.success('PDF başarıyla indirildi.');
  };

  const handleExportExcel = () => {
    const data = filteredIncidents.map(i => ({
      'Başlık': i.title,
      'Açıklama': i.description,
      'Firma': companies.find(c => c.id === i.companyId)?.name || '-',
      'İlgili Personel': personnel.find(p => p.id === i.personnelId)?.firstName + ' ' + personnel.find(p => p.id === i.personnelId)?.lastName || '-',
      'Tarih': new Date(i.date).toLocaleString('tr-TR'),
      'Konum': i.location,
      'Öncelik': i.severity,
      'Durum': i.status,
      'Kayıt Tarihi': new Date(i.createdAt).toLocaleString('tr-TR')
    }));
    exportToExcel(data, 'olaylar');
    toast.success('Excel başarıyla indirildi.');
  };

  const getSeverityColor = (severity: Severity) => {
    switch(severity) {
      case 'Kritik': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'Yüksek': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'Orta': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'Düşük': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: IncidentStatus) => {
    switch(status) {
      case 'Açık': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'İnceleniyor': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'Kapalı': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">Kaza ve Olay Bildirimleri</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-lg">İş kazaları ve ramak kala olaylarını takip edin.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handleExportExcel} className="gap-2">
            <Download className="h-4 w-4" /> Excel
          </Button>
          <Button variant="secondary" onClick={handleExportPDF} className="gap-2">
            <FileText className="h-4 w-4" /> PDF
          </Button>
          <Button onClick={() => navigate('/incidents/new')} className="gap-2">
            <AlertCircle className="h-4 w-4" /> Yeni Bildirim
          </Button>
        </div>
      </div>

      <div className="bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-2xl rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
        <div className="p-5 border-b border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Olay başlığı veya firma ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-3">
            <select 
              className="flex h-10 rounded-xl border border-slate-200 bg-white/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-[#09090b]/50 dark:text-slate-50 transition-all duration-200"
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value as Severity | 'Tümü')}
            >
              <option value="Tümü">Tüm Öncelikler</option>
              <option value="Düşük">Düşük</option>
              <option value="Orta">Orta</option>
              <option value="Yüksek">Yüksek</option>
              <option value="Kritik">Kritik</option>
            </select>
            <select 
              className="flex h-10 rounded-xl border border-slate-200 bg-white/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-[#09090b]/50 dark:text-slate-50 transition-all duration-200"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as IncidentStatus | 'Tümü')}
            >
              <option value="Tümü">Tüm Durumlar</option>
              <option value="Açık">Açık</option>
              <option value="İnceleniyor">İnceleniyor</option>
              <option value="Kapalı">Kapalı</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800/50 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3">Olay</th>
                <th className="px-6 py-3">Firma & Konum</th>
                <th className="px-6 py-3">Tarih</th>
                <th className="px-6 py-3">Öncelik</th>
                <th className="px-6 py-3">Durum</th>
                <th className="px-6 py-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredIncidents.map((incident) => (
                <tr key={incident.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 dark:text-white">{incident.title}</p>
                    <p className="text-xs text-gray-500 truncate max-w-xs mt-1">{incident.description}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium">{companies.find(c => c.id === incident.companyId)?.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{incident.location}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(incident.date).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(incident.severity)}`}>
                      {incident.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
                      {incident.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEditModal(incident)} className="p-1 text-blue-600 hover:bg-blue-50 rounded dark:text-blue-400 dark:hover:bg-blue-900/30">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(incident.id)} className="p-1 text-red-600 hover:bg-red-50 rounded dark:text-red-400 dark:hover:bg-red-900/30">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredIncidents.length === 0 && (
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
        title="Olayı Düzenle"
        className="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Olay Başlığı</label>
            <Input required value={currentIncident.title || ''} onChange={e => setCurrentIncident({...currentIncident, title: e.target.value})} />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Açıklama</label>
            <textarea 
              required
              className="flex min-h-[100px] w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
              value={currentIncident.description || ''}
              onChange={e => setCurrentIncident({...currentIncident, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Firma</label>
              <select 
                required
                className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
                value={currentIncident.companyId || ''}
                onChange={e => setCurrentIncident({...currentIncident, companyId: e.target.value})}
              >
                <option value="">Seçiniz</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">İlgili Personel (Opsiyonel)</label>
              <select 
                className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
                value={currentIncident.personnelId || ''}
                onChange={e => setCurrentIncident({...currentIncident, personnelId: e.target.value})}
              >
                <option value="">Seçiniz</option>
                {personnel.filter(p => p.assignedCompanyId === currentIncident.companyId).map(p => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tarih ve Saat</label>
              <Input required type="datetime-local" value={currentIncident.date ? currentIncident.date.substring(0, 16) : ''} onChange={e => setCurrentIncident({...currentIncident, date: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Konum/Bölüm</label>
              <Input required value={currentIncident.location || ''} onChange={e => setCurrentIncident({...currentIncident, location: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Öncelik/Şiddet</label>
              <select 
                required
                className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
                value={currentIncident.severity || 'Orta'}
                onChange={e => setCurrentIncident({...currentIncident, severity: e.target.value as Severity})}
              >
                <option value="Düşük">Düşük</option>
                <option value="Orta">Orta</option>
                <option value="Yüksek">Yüksek</option>
                <option value="Kritik">Kritik</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Durum</label>
              <select 
                required
                className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
                value={currentIncident.status || 'Açık'}
                onChange={e => setCurrentIncident({...currentIncident, status: e.target.value as IncidentStatus})}
              >
                <option value="Açık">Açık</option>
                <option value="İnceleniyor">İnceleniyor</option>
                <option value="Kapalı">Kapalı</option>
              </select>
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
