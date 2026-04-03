import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Risk, RiskStatus } from '../types';
import { Plus, Search, Edit2, Trash2, Download, FileText, ShieldAlert } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { PageTransition } from '../components/layout/PageTransition';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const RisksPage = () => {
  const { risks, addRisk, updateRisk, deleteRisk } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRisk, setCurrentRisk] = useState<Partial<Risk>>({ probability: 1, severity: 1 });

  const filteredRisks = risks.filter(r => 
    r.hazard.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.risk.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.responsible.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const score = (currentRisk.probability || 1) * (currentRisk.severity || 1);
    
    if (currentRisk.id) {
      updateRisk({ ...currentRisk, score } as Risk);
      toast.success('Risk kaydı güncellendi.');
    } else {
      addRisk({
        ...currentRisk,
        score,
        id: Date.now().toString(),
      } as Risk);
      toast.success('Yeni risk kaydı eklendi.');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
      deleteRisk(id);
      toast.success('Kayıt silindi.');
    }
  };

  const openEditModal = (risk: Risk) => {
    setCurrentRisk(risk);
    setIsModalOpen(true);
  };

  const getScoreColor = (score: number) => {
    if (score <= 6) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (score <= 12) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('Risk Değerlendirme Tablosu', 14, 15);
    
    const tableData = filteredRisks.map(r => [
      new Date(r.date).toLocaleDateString('tr-TR'),
      r.hazard,
      r.risk,
      `${r.probability} x ${r.severity} = ${r.score}`,
      r.controlMeasure,
      r.status
    ]);

    (doc as any).autoTable({
      head: [['Tarih', 'Tehlike', 'Risk', 'Skor (O x Ş)', 'Kontrol Tedbiri', 'Durum']],
      body: tableData,
      startY: 20,
    });

    doc.save('risk-degerlendirmesi.pdf');
    toast.success('PDF olarak dışa aktarıldı.');
  };

  const handleExportExcel = () => {
    const data = filteredRisks.map(r => ({
      'Tarih': new Date(r.date).toLocaleDateString('tr-TR'),
      'Tehlike': r.hazard,
      'Risk': r.risk,
      'Olasılık': r.probability,
      'Şiddet': r.severity,
      'Skor': r.score,
      'Kontrol Tedbiri': r.controlMeasure,
      'Sorumlu': r.responsible,
      'Durum': r.status
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Riskler');
    XLSX.writeFile(wb, 'risk-degerlendirmesi.xlsx');
    toast.success('Excel olarak dışa aktarıldı.');
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">Risk Değerlendirmesi</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-lg">Tehlike ve riskleri belirleyin, skorlayın ve tedbirleri takip edin.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleExportExcel} className="gap-2">
              <Download className="h-4 w-4" /> Excel
            </Button>
            <Button variant="secondary" onClick={handleExportPDF} className="gap-2">
              <FileText className="h-4 w-4" /> PDF
            </Button>
            <Button onClick={() => { setCurrentRisk({ probability: 1, severity: 1, status: 'Açık' }); setIsModalOpen(true); }} className="gap-2">
              <Plus className="h-4 w-4" /> Yeni Risk
            </Button>
          </div>
        </div>

        <div className="bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-2xl rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
          <div className="p-5 border-b border-slate-200/60 dark:border-slate-800/60">
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Tehlike, risk veya sorumlu ara..." 
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
                  <th className="px-6 py-3">Tehlike / Risk</th>
                  <th className="px-6 py-3 text-center">Skor (O x Ş)</th>
                  <th className="px-6 py-3">Kontrol Tedbiri</th>
                  <th className="px-6 py-3">Sorumlu</th>
                  <th className="px-6 py-3">Durum</th>
                  <th className="px-6 py-3 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredRisks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center justify-center">
                        <ShieldAlert className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                        <p>Kayıt bulunamadı.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRisks.map((risk) => (
                    <tr key={risk.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{risk.hazard}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{risk.risk}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getScoreColor(risk.score)}`}>
                          {risk.score}
                        </span>
                        <div className="text-[10px] text-gray-400 mt-1">{risk.probability} x {risk.severity}</div>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate" title={risk.controlMeasure}>
                        {risk.controlMeasure}
                      </td>
                      <td className="px-6 py-4">{risk.responsible}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          risk.status === 'Giderildi' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          risk.status === 'Devam Ediyor' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {risk.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEditModal(risk)} className="p-1 text-blue-600 hover:bg-blue-50 rounded dark:text-blue-400 dark:hover:bg-blue-900/30">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(risk.id)} className="p-1 text-red-600 hover:bg-red-50 rounded dark:text-red-400 dark:hover:bg-red-900/30">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={currentRisk.id ? 'Risk Kaydını Düzenle' : 'Yeni Risk Kaydı'}
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tespit Tarihi</label>
              <Input required type="date" value={currentRisk.date || ''} onChange={e => setCurrentRisk({...currentRisk, date: e.target.value})} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tehlike Kaynağı</label>
              <Input required value={currentRisk.hazard || ''} onChange={e => setCurrentRisk({...currentRisk, hazard: e.target.value})} placeholder="Örn: Yüksekte çalışma" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Olası Risk</label>
              <Input required value={currentRisk.risk || ''} onChange={e => setCurrentRisk({...currentRisk, risk: e.target.value})} placeholder="Örn: Düşme, yaralanma" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Olasılık (1-5)</label>
                <select 
                  required
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
                  value={currentRisk.probability || 1}
                  onChange={e => setCurrentRisk({...currentRisk, probability: Number(e.target.value)})}
                >
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Şiddet (1-5)</label>
                <select 
                  required
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
                  value={currentRisk.severity || 1}
                  onChange={e => setCurrentRisk({...currentRisk, severity: Number(e.target.value)})}
                >
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Kontrol Tedbiri</label>
              <textarea 
                required
                className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
                value={currentRisk.controlMeasure || ''}
                onChange={e => setCurrentRisk({...currentRisk, controlMeasure: e.target.value})}
                placeholder="Alınacak önlemleri yazın..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sorumlu</label>
                <Input required value={currentRisk.responsible || ''} onChange={e => setCurrentRisk({...currentRisk, responsible: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Durum</label>
                <select 
                  required
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
                  value={currentRisk.status || 'Açık'}
                  onChange={e => setCurrentRisk({...currentRisk, status: e.target.value as RiskStatus})}
                >
                  <option value="Açık">Açık</option>
                  <option value="Devam Ediyor">Devam Ediyor</option>
                  <option value="Giderildi">Giderildi</option>
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
