import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Sector, JobDefinition, EquipmentDefinition, LocationDefinition, IncidentReasonDefinition, Severity } from '../../types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { 
  Plus, Pencil, Trash2, ChevronDown, ChevronRight, 
  Factory, Briefcase, Wrench, MapPin, AlertTriangle, X, Save
} from 'lucide-react';
import toast from 'react-hot-toast';

type ActiveSection = 'sectors' | 'jobs' | 'equipment' | 'locations' | 'reasons' | null;

const SEVERITY_OPTIONS: Severity[] = ['Düşük', 'Orta', 'Yüksek', 'Kritik'];
const EQUIPMENT_CATEGORIES = ['PPE', 'Machinery', 'Tool', 'Other'] as const;
const LOCATION_TYPES = ['Office', 'Warehouse', 'Site', 'Other'] as const;
const REASON_CATEGORIES = ['Human', 'Equipment', 'Environment', 'Method'] as const;

const CATEGORY_LABELS: Record<string, string> = {
  PPE: 'KKD',
  Machinery: 'Makine',
  Tool: 'El Aleti',
  Other: 'Diğer',
  Human: 'İnsan',
  Equipment: 'Ekipman',
  Environment: 'Ortam',
  Method: 'Yöntem',
  Office: 'Ofis',
  Warehouse: 'Depo',
  Site: 'Şantiye/Saha',
};

const SEVERITY_COLORS: Record<string, string> = {
  'Düşük': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Orta': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Yüksek': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Kritik': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

// ────────────────────────────── MODAL ──────────────────────────────
interface ModalProps {
  title: string;
  onClose: () => void;
  onSave: () => void;
  children: React.ReactNode;
}
const Modal = ({ title, onClose, onSave, children }: ModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg">
      <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white">{title}</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <X className="h-5 w-5 text-slate-500" />
        </button>
      </div>
      <div className="p-5 space-y-4">{children}</div>
      <div className="flex justify-end gap-3 p-5 border-t border-slate-200 dark:border-slate-700">
        <Button type="button" variant="ghost" onClick={onClose}>İptal</Button>
        <Button type="button" onClick={onSave} className="gap-2">
          <Save className="h-4 w-4" />
          Kaydet
        </Button>
      </div>
    </div>
  </div>
);

// ────────────────────────────── SECTION HEADER ──────────────────────────────
interface SectionHeaderProps {
  id: ActiveSection;
  active: ActiveSection;
  onToggle: (id: ActiveSection) => void;
  icon: React.ElementType;
  title: string;
  count: number;
  color: string;
}
const SectionHeader = ({ id, active, onToggle, icon: Icon, title, count, color }: SectionHeaderProps) => (
  <button
    type="button"
    onClick={() => onToggle(active === id ? null : id)}
    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
      active === id
        ? `${color} border-current`
        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
    }`}
  >
    <div className="flex items-center gap-3">
      <Icon className="h-5 w-5" />
      <span className="font-semibold text-slate-900 dark:text-white">{title}</span>
      <span className="px-2 py-0.5 rounded-full text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
        {count}
      </span>
    </div>
    {active === id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
  </button>
);

// ────────────────────────────── MAIN COMPONENT ──────────────────────────────
export const AdvancedDefinitionsTab = () => {
  const {
    sectors, addSector, updateSector, deleteSector,
    jobDefinitions, addJobDefinition, updateJobDefinition, deleteJobDefinition,
    equipmentDefinitions, addEquipmentDefinition, updateEquipmentDefinition, deleteEquipmentDefinition,
    locationDefinitions, addLocationDefinition, updateLocationDefinition, deleteLocationDefinition,
    incidentReasonDefinitions, addIncidentReasonDefinition, updateIncidentReasonDefinition, deleteIncidentReasonDefinition,
    companies,
  } = useStore();

  const [activeSection, setActiveSection] = useState<ActiveSection>('sectors');

  // ── Sector State ──
  const [sectorModal, setSectorModal] = useState(false);
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [sectorForm, setSectorForm] = useState({ name: '', code: '', description: '' });

  // ── Job State ──
  const [jobModal, setJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState<JobDefinition | null>(null);
  const [jobForm, setJobForm] = useState({ sectorId: '', name: '', description: '', riskLevel: 'Orta' as Severity });
  const [jobSectorFilter, setJobSectorFilter] = useState('');

  // ── Equipment State ──
  const [eqModal, setEqModal] = useState(false);
  const [editingEq, setEditingEq] = useState<EquipmentDefinition | null>(null);
  const [eqForm, setEqForm] = useState({ sectorId: '', name: '', category: 'Machinery' as EquipmentDefinition['category'] });
  const [eqSectorFilter, setEqSectorFilter] = useState('');
  const [eqCategoryFilter, setEqCategoryFilter] = useState('');

  // ── Location State ──
  const [locModal, setLocModal] = useState(false);
  const [editingLoc, setEditingLoc] = useState<LocationDefinition | null>(null);
  const [locForm, setLocForm] = useState({ companyId: '', name: '', type: 'Site' as LocationDefinition['type'], riskLevel: 'Orta' as Severity });
  const [locFilter, setLocFilter] = useState<'all' | 'global' | string>('all');

  // ── Reason State ──
  const [reasonModal, setReasonModal] = useState(false);
  const [editingReason, setEditingReason] = useState<IncidentReasonDefinition | null>(null);
  const [reasonForm, setReasonForm] = useState({ sectorId: '', name: '', category: 'Human' as IncidentReasonDefinition['category'] });
  const [reasonSectorFilter, setReasonSectorFilter] = useState('');
  const [reasonCategoryFilter, setReasonCategoryFilter] = useState('');

  const genId = (prefix: string) => `${prefix}-${Date.now()}`;

  // ───────────── SECTOR HANDLERS ─────────────
  const openAddSector = () => {
    setEditingSector(null);
    setSectorForm({ name: '', code: '', description: '' });
    setSectorModal(true);
  };
  const openEditSector = (s: Sector) => {
    setEditingSector(s);
    setSectorForm({ name: s.name, code: s.code || '', description: s.description || '' });
    setSectorModal(true);
  };
  const saveSector = () => {
    if (!sectorForm.name.trim()) { toast.error('Sektör adı zorunludur.'); return; }
    if (editingSector) {
      updateSector({ ...editingSector, ...sectorForm });
      toast.success('Sektör güncellendi.');
    } else {
      addSector({ id: genId('sec'), ...sectorForm, createdAt: new Date().toISOString() });
      toast.success('Sektör eklendi.');
    }
    setSectorModal(false);
  };
  const handleDeleteSector = (id: string) => {
    deleteSector(id);
    toast.success('Sektör silindi.');
  };

  // ───────────── JOB HANDLERS ─────────────
  const openAddJob = () => {
    setEditingJob(null);
    setJobForm({ sectorId: '', name: '', description: '', riskLevel: 'Orta' });
    setJobModal(true);
  };
  const openEditJob = (j: JobDefinition) => {
    setEditingJob(j);
    setJobForm({ sectorId: j.sectorId, name: j.name, description: j.description || '', riskLevel: j.riskLevel || 'Orta' });
    setJobModal(true);
  };
  const saveJob = () => {
    if (!jobForm.sectorId) { toast.error('Sektör seçimi zorunludur.'); return; }
    if (!jobForm.name.trim()) { toast.error('İş tanımı adı zorunludur.'); return; }
    if (editingJob) {
      updateJobDefinition({ ...editingJob, ...jobForm });
      toast.success('İş tanımı güncellendi.');
    } else {
      addJobDefinition({ id: genId('job'), ...jobForm, createdAt: new Date().toISOString() });
      toast.success('İş tanımı eklendi.');
    }
    setJobModal(false);
  };

  // ───────────── EQUIPMENT HANDLERS ─────────────
  const openAddEq = () => {
    setEditingEq(null);
    setEqForm({ sectorId: '', name: '', category: 'Machinery' });
    setEqModal(true);
  };
  const openEditEq = (e: EquipmentDefinition) => {
    setEditingEq(e);
    setEqForm({ sectorId: e.sectorId, name: e.name, category: e.category || 'Machinery' });
    setEqModal(true);
  };
  const saveEq = () => {
    if (!eqForm.sectorId) { toast.error('Sektör seçimi zorunludur.'); return; }
    if (!eqForm.name.trim()) { toast.error('Ekipman adı zorunludur.'); return; }
    if (editingEq) {
      updateEquipmentDefinition({ ...editingEq, ...eqForm });
      toast.success('Ekipman güncellendi.');
    } else {
      addEquipmentDefinition({ id: genId('eq'), ...eqForm, createdAt: new Date().toISOString() });
      toast.success('Ekipman eklendi.');
    }
    setEqModal(false);
  };

  // ───────────── LOCATION HANDLERS ─────────────
  const openAddLoc = () => {
    setEditingLoc(null);
    setLocForm({ companyId: '', name: '', type: 'Site', riskLevel: 'Orta' });
    setLocModal(true);
  };
  const openEditLoc = (l: LocationDefinition) => {
    setEditingLoc(l);
    setLocForm({ companyId: l.companyId || '', name: l.name, type: l.type || 'Site', riskLevel: l.riskLevel || 'Orta' });
    setLocModal(true);
  };
  const saveLoc = () => {
    if (!locForm.name.trim()) { toast.error('Lokasyon adı zorunludur.'); return; }
    if (editingLoc) {
      updateLocationDefinition({ ...editingLoc, companyId: locForm.companyId || undefined, name: locForm.name, type: locForm.type, riskLevel: locForm.riskLevel });
      toast.success('Lokasyon güncellendi.');
    } else {
      addLocationDefinition({ id: genId('loc'), companyId: locForm.companyId || undefined, name: locForm.name, type: locForm.type, riskLevel: locForm.riskLevel, createdAt: new Date().toISOString() });
      toast.success('Lokasyon eklendi.');
    }
    setLocModal(false);
  };

  // ───────────── REASON HANDLERS ─────────────
  const openAddReason = () => {
    setEditingReason(null);
    setReasonForm({ sectorId: '', name: '', category: 'Human' });
    setReasonModal(true);
  };
  const openEditReason = (r: IncidentReasonDefinition) => {
    setEditingReason(r);
    setReasonForm({ sectorId: r.sectorId || '', name: r.name, category: r.category || 'Human' });
    setReasonModal(true);
  };
  const saveReason = () => {
    if (!reasonForm.name.trim()) { toast.error('Neden adı zorunludur.'); return; }
    if (editingReason) {
      updateIncidentReasonDefinition({ ...editingReason, sectorId: reasonForm.sectorId || undefined, name: reasonForm.name, category: reasonForm.category });
      toast.success('Olay nedeni güncellendi.');
    } else {
      addIncidentReasonDefinition({ id: genId('rsn'), sectorId: reasonForm.sectorId || undefined, name: reasonForm.name, category: reasonForm.category, createdAt: new Date().toISOString() });
      toast.success('Olay nedeni eklendi.');
    }
    setReasonModal(false);
  };

  // ───────────── FILTERED DATA ─────────────
  const filteredJobs = jobSectorFilter
    ? jobDefinitions.filter(j => j.sectorId === jobSectorFilter)
    : jobDefinitions;

  const filteredEquipment = equipmentDefinitions.filter(e => {
    if (eqSectorFilter && e.sectorId !== eqSectorFilter) return false;
    if (eqCategoryFilter && e.category !== eqCategoryFilter) return false;
    return true;
  });

  const filteredLocations = locationDefinitions.filter(l => {
    if (locFilter === 'global') return !l.companyId;
    if (locFilter !== 'all' && locFilter !== 'global') return l.companyId === locFilter;
    return true;
  });

  const filteredReasons = incidentReasonDefinitions.filter(r => {
    if (reasonSectorFilter && r.sectorId !== reasonSectorFilter && r.sectorId) return false;
    if (reasonCategoryFilter && r.category !== reasonCategoryFilter) return false;
    return true;
  });

  const selectClass = "flex h-10 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 transition-all duration-200";

  return (
    <div className="space-y-3">
      <div className="mb-6">
        <h2 className="text-xl font-display font-semibold text-slate-900 dark:text-white">Gelişmiş Tanımlar</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Sektörel tanımlamaları, ekipmanları, lokasyonları ve olay nedenlerini buradan yönetin.
          Bu tanımlar olay bildirim formunda otomatik olarak kullanılır.
        </p>
      </div>

      {/* ─────── SEKTÖRLER ─────── */}
      <SectionHeader
        id="sectors" active={activeSection} onToggle={setActiveSection}
        icon={Factory} title="Sektör Yönetimi" count={sectors.length}
        color="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700"
      />
      {activeSection === 'sectors' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="flex justify-end p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <Button type="button" onClick={openAddSector} className="gap-2 text-sm h-8 px-3">
              <Plus className="h-3.5 w-3.5" /> Sektör Ekle
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Sektör Adı</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Kod</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Açıklama</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sectors.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{s.name}</td>
                    <td className="px-4 py-3">
                      {s.code && <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400">{s.code}</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{s.description}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditSector(s)} className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDeleteSector(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {sectors.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">Henüz sektör eklenmedi.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────── İŞ TANIMLARI ─────── */}
      <SectionHeader
        id="jobs" active={activeSection} onToggle={setActiveSection}
        icon={Briefcase} title="İş Tanımları" count={jobDefinitions.length}
        color="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700"
      />
      {activeSection === 'jobs' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <select className="flex-1 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-50"
              value={jobSectorFilter} onChange={e => setJobSectorFilter(e.target.value)}>
              <option value="">Tüm Sektörler</option>
              {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <Button type="button" onClick={openAddJob} className="gap-2 text-sm h-8 px-3">
              <Plus className="h-3.5 w-3.5" /> Ekle
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">İş Tanımı</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Sektör</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Risk Seviyesi</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredJobs.map(j => (
                  <tr key={j.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{j.name}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                      {sectors.find(s => s.id === j.sectorId)?.name}
                    </td>
                    <td className="px-4 py-3">
                      {j.riskLevel && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_COLORS[j.riskLevel] || ''}`}>
                          {j.riskLevel}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditJob(j)} className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => { deleteJobDefinition(j.id); toast.success('Silindi.'); }} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredJobs.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">Kayıt bulunamadı.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────── EKİPMAN TANIMLARI ─────── */}
      <SectionHeader
        id="equipment" active={activeSection} onToggle={setActiveSection}
        icon={Wrench} title="Ekipman Tanımları" count={equipmentDefinitions.length}
        color="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-300 dark:border-amber-700"
      />
      {activeSection === 'equipment' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <div className="flex gap-2 flex-1">
              <select className="flex-1 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-50"
                value={eqSectorFilter} onChange={e => setEqSectorFilter(e.target.value)}>
                <option value="">Tüm Sektörler</option>
                {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select className="flex-1 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-50"
                value={eqCategoryFilter} onChange={e => setEqCategoryFilter(e.target.value)}>
                <option value="">Tüm Kategoriler</option>
                {EQUIPMENT_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>
            <Button type="button" onClick={openAddEq} className="gap-2 text-sm h-8 px-3">
              <Plus className="h-3.5 w-3.5" /> Ekle
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Ekipman Adı</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Sektör</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Kategori</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredEquipment.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{e.name}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                      {sectors.find(s => s.id === e.sectorId)?.name}
                    </td>
                    <td className="px-4 py-3">
                      {e.category && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          {CATEGORY_LABELS[e.category] || e.category}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditEq(e)} className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => { deleteEquipmentDefinition(e.id); toast.success('Silindi.'); }} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredEquipment.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">Kayıt bulunamadı.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────── LOKASYONLAR ─────── */}
      <SectionHeader
        id="locations" active={activeSection} onToggle={setActiveSection}
        icon={MapPin} title="Lokasyon Tanımları" count={locationDefinitions.length}
        color="bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 border-purple-300 dark:border-purple-700"
      />
      {activeSection === 'locations' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <select className="flex-1 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-50"
              value={locFilter} onChange={e => setLocFilter(e.target.value)}>
              <option value="all">Tümü</option>
              <option value="global">Global (Firma bağımsız)</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Button type="button" onClick={openAddLoc} className="gap-2 text-sm h-8 px-3">
              <Plus className="h-3.5 w-3.5" /> Ekle
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Lokasyon Adı</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Firma</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Tip</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Risk</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLocations.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{l.name}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                      {l.companyId ? companies.find(c => c.id === l.companyId)?.name : <span className="text-indigo-500">Global</span>}
                    </td>
                    <td className="px-4 py-3">
                      {l.type && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {CATEGORY_LABELS[l.type] || l.type}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {l.riskLevel && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_COLORS[l.riskLevel] || ''}`}>
                          {l.riskLevel}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditLoc(l)} className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => { deleteLocationDefinition(l.id); toast.success('Silindi.'); }} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredLocations.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">Kayıt bulunamadı.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────── OLAY NEDENLERİ ─────── */}
      <SectionHeader
        id="reasons" active={activeSection} onToggle={setActiveSection}
        icon={AlertTriangle} title="Olay Nedenleri" count={incidentReasonDefinitions.length}
        color="bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 border-rose-300 dark:border-rose-700"
      />
      {activeSection === 'reasons' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <div className="flex gap-2 flex-1">
              <select className="flex-1 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-50"
                value={reasonSectorFilter} onChange={e => setReasonSectorFilter(e.target.value)}>
                <option value="">Tüm Sektörler</option>
                <option value="_global">Global (Sektörsüz)</option>
                {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select className="flex-1 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-50"
                value={reasonCategoryFilter} onChange={e => setReasonCategoryFilter(e.target.value)}>
                <option value="">Tüm Kategoriler</option>
                {REASON_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>
            <Button type="button" onClick={openAddReason} className="gap-2 text-sm h-8 px-3">
              <Plus className="h-3.5 w-3.5" /> Ekle
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Neden</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Sektör</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Kategori</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredReasons.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{r.name}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                      {r.sectorId ? sectors.find(s => s.id === r.sectorId)?.name : <span className="text-indigo-500">Global</span>}
                    </td>
                    <td className="px-4 py-3">
                      {r.category && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.category === 'Human' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          r.category === 'Equipment' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          r.category === 'Environment' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        }`}>
                          {CATEGORY_LABELS[r.category] || r.category}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditReason(r)} className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => { deleteIncidentReasonDefinition(r.id); toast.success('Silindi.'); }} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredReasons.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">Kayıt bulunamadı.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════ MODALS ═══════ */}

      {/* Sektör Modal */}
      {sectorModal && (
        <Modal title={editingSector ? 'Sektörü Düzenle' : 'Yeni Sektör Ekle'} onClose={() => setSectorModal(false)} onSave={saveSector}>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Sektör Adı <span className="text-red-500">*</span></label>
              <Input value={sectorForm.name} onChange={e => setSectorForm(p => ({ ...p, name: e.target.value }))} placeholder="Örn: İnşaat, Lojistik, Sanayi..." />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Kod</label>
              <Input value={sectorForm.code} onChange={e => setSectorForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="Örn: CONST, LOGIS..." maxLength={6} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Açıklama</label>
              <Input value={sectorForm.description} onChange={e => setSectorForm(p => ({ ...p, description: e.target.value }))} placeholder="Kısa açıklama..." />
            </div>
          </div>
        </Modal>
      )}

      {/* İş Tanımı Modal */}
      {jobModal && (
        <Modal title={editingJob ? 'İş Tanımını Düzenle' : 'Yeni İş Tanımı Ekle'} onClose={() => setJobModal(false)} onSave={saveJob}>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Sektör <span className="text-red-500">*</span></label>
              <select className={selectClass} value={jobForm.sectorId} onChange={e => setJobForm(p => ({ ...p, sectorId: e.target.value }))}>
                <option value="">Sektör Seçiniz</option>
                {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">İş Tanımı <span className="text-red-500">*</span></label>
              <Input value={jobForm.name} onChange={e => setJobForm(p => ({ ...p, name: e.target.value }))} placeholder="Örn: Forklift Operatörü, Şantiye İşçisi..." />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Risk Seviyesi</label>
              <select className={selectClass} value={jobForm.riskLevel} onChange={e => setJobForm(p => ({ ...p, riskLevel: e.target.value as Severity }))}>
                {SEVERITY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Açıklama</label>
              <Input value={jobForm.description} onChange={e => setJobForm(p => ({ ...p, description: e.target.value }))} placeholder="Opsiyonel açıklama..." />
            </div>
          </div>
        </Modal>
      )}

      {/* Ekipman Modal */}
      {eqModal && (
        <Modal title={editingEq ? 'Ekipmanı Düzenle' : 'Yeni Ekipman Ekle'} onClose={() => setEqModal(false)} onSave={saveEq}>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Sektör <span className="text-red-500">*</span></label>
              <select className={selectClass} value={eqForm.sectorId} onChange={e => setEqForm(p => ({ ...p, sectorId: e.target.value }))}>
                <option value="">Sektör Seçiniz</option>
                {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ekipman Adı <span className="text-red-500">*</span></label>
              <Input value={eqForm.name} onChange={e => setEqForm(p => ({ ...p, name: e.target.value }))} placeholder="Örn: Forklift, Kask, Taşlama Makinesi..." />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Kategori</label>
              <select className={selectClass} value={eqForm.category} onChange={e => setEqForm(p => ({ ...p, category: e.target.value as EquipmentDefinition['category'] }))}>
                {EQUIPMENT_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>
          </div>
        </Modal>
      )}

      {/* Lokasyon Modal */}
      {locModal && (
        <Modal title={editingLoc ? 'Lokasyonu Düzenle' : 'Yeni Lokasyon Ekle'} onClose={() => setLocModal(false)} onSave={saveLoc}>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Firma (Boş bırakırsanız global olur)</label>
              <select className={selectClass} value={locForm.companyId} onChange={e => setLocForm(p => ({ ...p, companyId: e.target.value }))}>
                <option value="">Global (Tüm firmalar)</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Lokasyon Adı <span className="text-red-500">*</span></label>
              <Input value={locForm.name} onChange={e => setLocForm(p => ({ ...p, name: e.target.value }))} placeholder="Örn: A Blok, Depo 1, Şantiye Alanı..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tip</label>
                <select className={selectClass} value={locForm.type} onChange={e => setLocForm(p => ({ ...p, type: e.target.value as LocationDefinition['type'] }))}>
                  {LOCATION_TYPES.map(t => <option key={t} value={t}>{CATEGORY_LABELS[t] || t}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Risk Seviyesi</label>
                <select className={selectClass} value={locForm.riskLevel} onChange={e => setLocForm(p => ({ ...p, riskLevel: e.target.value as Severity }))}>
                  {SEVERITY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Olay Nedeni Modal */}
      {reasonModal && (
        <Modal title={editingReason ? 'Nedeni Düzenle' : 'Yeni Olay Nedeni Ekle'} onClose={() => setReasonModal(false)} onSave={saveReason}>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Sektör (Boş bırakırsanız tüm sektörlerde görünür)</label>
              <select className={selectClass} value={reasonForm.sectorId} onChange={e => setReasonForm(p => ({ ...p, sectorId: e.target.value }))}>
                <option value="">Global (Tüm sektörler)</option>
                {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Neden Adı <span className="text-red-500">*</span></label>
              <Input value={reasonForm.name} onChange={e => setReasonForm(p => ({ ...p, name: e.target.value }))} placeholder="Örn: Kaygan zemin, Ekipman arızası..." />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Kategori</label>
              <select className={selectClass} value={reasonForm.category} onChange={e => setReasonForm(p => ({ ...p, category: e.target.value as IncidentReasonDefinition['category'] }))}>
                {REASON_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
