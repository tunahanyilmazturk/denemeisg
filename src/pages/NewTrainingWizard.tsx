import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PageTransition } from '../components/layout/PageTransition';
import { Training, TrainingStatus } from '../types';
import toast from 'react-hot-toast';
import {
  Plus, ChevronRight, ChevronLeft, GraduationCap, ClipboardList, Users,
  Check, X, Info, Search, Calendar, Clock, Building2, CheckCircle, UserCheck
} from 'lucide-react';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const inputClass =
  'flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 transition-all';

const selectClass =
  'flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 transition-all';

// ─── TRAINING ICON ─────────────────────────────────────────────────────────────
const TrainingIcon = ({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) => {
  const colors = [
    'from-blue-500 to-cyan-600',
    'from-indigo-500 to-purple-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-pink-600',
    'from-rose-500 to-red-600',
    'from-amber-500 to-orange-600',
    'from-violet-500 to-purple-600',
  ];
  const colorIndex = (name.charCodeAt(0) || 0) % colors.length;
  const sizeClass = size === 'sm' ? 'w-10 h-10' : size === 'lg' ? 'w-12 h-12' : 'w-12 h-12';
  const iconSize = size === 'sm' ? 'h-5 w-5' : 'h-6 w-6';

  return (
    <div className={`${sizeClass} rounded-2xl bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center text-white font-bold shrink-0 shadow-lg ring-4 ring-white/20`}>
      <GraduationCap className={iconSize} />
    </div>
  );
};

// ─── STEP ICONS ─────────────────────────────────────────────────────────────────
const STEP_ICONS = [GraduationCap, ClipboardList, Users];
const STEP_COLORS = [
  'from-indigo-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
];

const StepItem = ({ num, label, active, completed }: { num: number; label: string; active: boolean; completed: boolean }) => {
  const Icon = STEP_ICONS[num - 1] || GraduationCap;
  return (
    <div className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition-all ${
      active ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
    }`}>
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm flex-shrink-0 transition-all ${
          active
            ? `bg-gradient-to-br ${STEP_COLORS[num - 1]} text-white shadow-lg shadow-indigo-500/30 scale-110`
            : completed
              ? 'bg-emerald-500 text-white shadow-md'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
        }`}
      >
        {completed ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${
          active ? 'text-indigo-700 dark:text-indigo-300' : completed ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'
        }`}>
          {label}
        </p>
        <p className={`text-[11px] ${
          active ? 'text-indigo-500 dark:text-indigo-400' : completed ? 'text-emerald-500 dark:text-emerald-500' : 'text-slate-400 dark:text-slate-500'
        }`}>
          {completed ? 'Tamamlandı' : active ? 'Devam ediyor' : 'Bekliyor'}
        </p>
      </div>
    </div>
  );
};

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
const getStatusColor = (status: TrainingStatus) => {
  switch(status) {
    case 'İptal': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'Planlandı': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'Tamamlandı': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export const NewTrainingWizard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addTraining, personnel, companies } = useStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Training>>({
    participants: [],
    status: 'Planlandı',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string>('all');

  const totalSteps = 3;

  const steps = [
    { num: 1, label: 'Eğitim Bilgileri' },
    { num: 2, label: 'Durum & Açıklama' },
    { num: 3, label: 'Katılımcılar' },
  ];

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.title?.trim()) {
        toast.error('Eğitim başlığı zorunludur.');
        return;
      }
      if (!formData.trainer?.trim()) {
        toast.error('Eğitmen adı zorunludur.');
        return;
      }
      if (!formData.date) {
        toast.error('Tarih ve saat seçilmelidir.');
        return;
      }
      if (!formData.duration || formData.duration <= 0) {
        toast.error('Süre saat cinsinden girilmelidir.');
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.status) {
        toast.error('Durum seçilmelidir.');
        return;
      }
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (!formData.title?.trim()) {
      toast.error('Eğitim başlığı zorunludur.');
      return;
    }
    if (!formData.trainer?.trim()) {
      toast.error('Eğitmen adı zorunludur.');
      return;
    }
    if (!formData.date) {
      toast.error('Tarih ve saat zorunludur.');
      return;
    }
    if (!formData.duration || formData.duration <= 0) {
      toast.error('Süre zorunludur.');
      return;
    }
    if (!formData.status) {
      toast.error('Durum seçilmelidir.');
      return;
    }

    const newTraining: Training = {
      id: Math.random().toString(36).substr(2, 9),
      title: formData.title!,
      trainer: formData.trainer!,
      date: formData.date!,
      duration: formData.duration!,
      participants: formData.participants || [],
      status: formData.status!,
      description: formData.description,
      createdBy: user?.id,
      createdAt: new Date().toISOString(),
    };

    addTraining(newTraining);
    toast.success('Eğitim başarıyla eklendi!');
    navigate('/trainings');
  };

  const toggleParticipant = (personnelId: string) => {
    const participants = formData.participants || [];
    if (participants.includes(personnelId)) {
      setFormData({ ...formData, participants: participants.filter(id => id !== personnelId) });
    } else {
      setFormData({ ...formData, participants: [...participants, personnelId] });
    }
  };

  const filteredPersonnel = useMemo(() => {
    let result = [...personnel];
    
    // Company filter
    if (companyFilter && companyFilter !== 'all') {
      result = result.filter(p => p.assignedCompanyId === companyFilter);
    }
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(term) ||
        p.role.toLowerCase().includes(term)
      );
    }
    
    return result;
  }, [personnel, companyFilter, searchTerm]);

  // Group filtered personnel by company
  const groupedPersonnel: Record<string, typeof filteredPersonnel> = useMemo(() => {
    const groups: Record<string, typeof filteredPersonnel> = {};
    filteredPersonnel.forEach(p => {
      const companyName = p.assignedCompanyId
        ? companies.find(c => c.id === p.assignedCompanyId)?.name || 'Diğer'
        : 'Firmaya Atanmamış';
      if (!groups[companyName]) groups[companyName] = [];
      groups[companyName].push(p);
    });
    return groups;
  }, [filteredPersonnel, companies]);

  const selectAllFiltered = () => {
    const currentParticipants = formData.participants || [];
    const newIds = filteredPersonnel
      .filter(p => !currentParticipants.includes(p.id))
      .map(p => p.id);
    setFormData({ ...formData, participants: [...currentParticipants, ...newIds] });
  };

  const deselectAllFiltered = () => {
    const filteredIds = new Set(filteredPersonnel.map(p => p.id));
    setFormData({ ...formData, participants: (formData.participants || []).filter(id => !filteredIds.has(id)) });
  };

  // ─── RENDER STEP CONTENT ──────────────────────────────────────────────────────
  const renderStepContent = () => {
    switch (currentStep) {
      // STEP 1: Eğitim Bilgileri
      case 1:
        return (
          <div className="space-y-5">
            {/* Header */}
            <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <GraduationCap className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Eğitim Bilgileri</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Eğitim başlığı, eğitmen, tarih ve süre bilgileri</p>
                </div>
              </div>
            </div>

            {/* Eğitim Detayları */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <GraduationCap className="h-3.5 w-3.5" />
                Eğitim Detayları
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Eğitim Başlığı <span className="text-red-500">*</span>
                  </label>
                  <Input
                    className={inputClass}
                    placeholder="Örn: Temel İş Sağlığı ve Güvenliği Eğitimi"
                    value={formData.title || ''}
                    onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Eğitmen <span className="text-red-500">*</span>
                  </label>
                  <Input
                    className={inputClass}
                    placeholder="Örn: Mehmet Kaya"
                    value={formData.trainer || ''}
                    onChange={e => setFormData(p => ({ ...p, trainer: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Tarih & Süre */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                Zamanlama
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Tarih ve Saat <span className="text-red-500">*</span>
                    </label>
                    <Input
                      className={inputClass}
                      type="datetime-local"
                      value={formData.date ? formData.date.substring(0, 16) : ''}
                      onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Süre (Saat) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      className={inputClass}
                      type="number"
                      min="1"
                      step="0.5"
                      placeholder="Örn: 8"
                      value={formData.duration || ''}
                      onChange={e => setFormData(p => ({ ...p, duration: parseFloat(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bilgi notu */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="text-blue-700 dark:text-blue-300 text-xs">Eğitim başlığı ve eğitmen bilgisi zorunludur. Tarih ve süre bilgilerini doğru girdiğinizden emin olun.</p>
              </div>
            </div>
          </div>
        );

      // STEP 2: Durum & Açıklama
      case 2:
        return (
          <div className="space-y-5">
            {/* Header */}
            <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                  <ClipboardList className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Durum & Açıklama</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Eğitim durumu ve notları</p>
                </div>
              </div>
            </div>

            {/* Durum */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <ClipboardList className="h-3.5 w-3.5" />
                Eğitim Durumu
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Durum <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={selectClass}
                    value={formData.status || 'Planlandı'}
                    onChange={e => setFormData(p => ({ ...p, status: e.target.value as TrainingStatus }))}
                  >
                    <option value="Planlandı">Planlandı</option>
                    <option value="Tamamlandı">Tamamlandı</option>
                    <option value="İptal">İptal</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Açıklama */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <Info className="h-3.5 w-3.5" />
                Açıklama ve Notlar
              </h3>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Açıklama / Notlar (Opsiyonel)
                  </label>
                  <textarea
                    rows={5}
                    className="flex w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 resize-none transition-all"
                    placeholder="Eğitim hakkında ek notlar, açıklamalar veya özel durumlar..."
                    value={formData.description || ''}
                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5" />
                    Eğitim içeriği, hedefleri veya özel notları buraya ekleyebilirsiniz
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      // STEP 3: Katılımcılar
      case 3:
        return (
          <div className="space-y-5">
            {/* Header */}
            <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Users className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Katılımcılar</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Eğitime katılacak personelleri seçin</p>
                </div>
              </div>
            </div>

            {/* Search & Company Filter */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <Search className="h-3.5 w-3.5" />
                Filtrele ve Ara
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    className={`${inputClass} pl-10`}
                    placeholder="Personel adı veya rol ara..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  className={selectClass}
                  value={companyFilter}
                  onChange={e => setCompanyFilter(e.target.value)}
                >
                  <option value="all">Tüm Firmalar</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  <option value="unassigned">Firmaya Atanmamış</option>
                </select>
              </div>
            </div>

            {/* Bulk Actions & Selection Count */}
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <Users className="h-3.5 w-3.5" />
                Personel Seçimi
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                  {(formData.participants || []).length} / {personnel.length}
                </span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllFiltered}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-1"
                >
                  <CheckCircle className="h-3.5 w-3.5" /> Tümünü Seç
                </button>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <button
                  type="button"
                  onClick={deselectAllFiltered}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:underline font-medium flex items-center gap-1"
                >
                  <X className="h-3.5 w-3.5" /> Temizle
                </button>
              </div>
            </div>

            {/* Personel Listesi - Grouped */}
            {personnel.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                <Users className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-0.5">Sistemde Personel Yok</p>
                <p className="text-xs text-slate-500 dark:text-slate-500">Önce personel ekleyerek başlayın</p>
              </div>
            ) : filteredPersonnel.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <Search className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className="text-sm text-slate-500 dark:text-slate-400">Arama sonucu bulunamadı</p>
              </div>
            ) : (
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 max-h-[400px] overflow-y-auto space-y-4">
                {Object.entries(groupedPersonnel).map(([groupName, members]) => (
                  <div key={groupName}>
                    <div className="flex items-center gap-2 mb-2 sticky top-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm py-1 -mx-1 px-1 rounded-lg">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">{groupName}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">({members.length})</span>
                    </div>
                    <div className="space-y-1">
                      {members.map(p => (
                        <label
                          key={p.id}
                          className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-all group ${
                            formData.participants?.includes(p.id)
                              ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 w-4 h-4"
                            checked={formData.participants?.includes(p.id) || false}
                            onChange={() => toggleParticipant(p.id)}
                          />
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                              {p.firstName[0]}{p.lastName[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                {p.firstName} {p.lastName}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{p.role}</p>
                            </div>
                            {formData.participants?.includes(p.id) && (
                              <UserCheck className="h-4 w-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bilgi notu */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Bilgi</p>
                  <p className="text-blue-700 dark:text-blue-300">Katılımcı seçimi zorunlu değildir. Eğitim sonrasında da katılımcı ekleyebilirsiniz.</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Progress percentage
  const progressPercent = Math.round(((currentStep - 1) / (totalSteps - 1)) * 100);

  return (
    <PageTransition>
      <div className="flex h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 -mx-4 -my-4">
        {/* ─── SIDEBAR ─── */}
        <div className="hidden lg:flex flex-col w-[320px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 overflow-y-auto shrink-0">
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="p-6 pb-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">Yeni Eğitim</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Sisteme yeni eğitim ekleyin</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600 dark:text-slate-400">İlerleme</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{currentStep}/{totalSteps}</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="flex-1 px-4 py-2 space-y-1">
              {steps.map(step => (
                <button
                  key={step.num}
                  onClick={() => setCurrentStep(step.num)}
                  className="w-full text-left transition-all"
                >
                  <StepItem
                    num={step.num}
                    label={step.label}
                    active={currentStep === step.num}
                    completed={currentStep > step.num}
                  />
                </button>
              ))}
            </div>

            {/* Training Preview */}
            <div className="p-4 pt-3 border-t border-slate-200 dark:border-slate-700 mt-auto">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-widest">Eğitim Önizleme</p>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-4">
                  <TrainingIcon name={formData.title || '?'} size="md" />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {formData.title || 'Eğitim Başlığı'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {formData.trainer || 'Eğitmen belirtilmedi'}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {formData.date && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          <Calendar className="h-3 w-3" />
                          {new Date(formData.date).toLocaleDateString('tr-TR')}
                        </span>
                      )}
                      {(formData.participants || []).length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          <Users className="h-3 w-3" />
                          {(formData.participants || []).length} katılımcı
                        </span>
                      )}
                      {formData.status && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${getStatusColor(formData.status)}`}>
                          {formData.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── CONTENT ─── */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Mobile Header + Step Nav */}
          <div className="lg:hidden shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 pt-4 pb-3">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">Yeni Eğitim</h1>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg">{currentStep}/{totalSteps}</span>
            </div>
            {/* Mobile Progress */}
            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
              {steps.map(step => {
                const Icon = STEP_ICONS[step.num - 1] || GraduationCap;
                return (
                  <button key={step.num} onClick={() => setCurrentStep(step.num)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      currentStep === step.num ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 shadow-sm'
                      : currentStep > step.num ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                      currentStep === step.num ? `bg-gradient-to-br ${STEP_COLORS[step.num - 1]} text-white shadow-sm`
                      : currentStep > step.num ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                      {currentStep > step.num ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                    </span>
                    <span className="hidden sm:inline">{step.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable Main Content */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="max-w-4xl mx-auto w-full">
              {renderStepContent()}
            </div>
          </div>

          {/* Fixed Navigation Buttons */}
          <div className="shrink-0 border-t border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-4 lg:px-6 py-3 wizard-nav-buttons">
            <div className="max-w-4xl mx-auto w-full flex justify-between items-center gap-3">
              <Button
                variant="ghost"
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" /> Geri
              </Button>

              <div className="flex items-center gap-3">
                {/* Step Dots (Desktop) */}
                <div className="hidden lg:flex items-center gap-1.5 mr-2">
                  {steps.map((step) => (
                    <div
                      key={step.num}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        currentStep === step.num ? 'w-6 bg-indigo-500' : currentStep > step.num ? 'w-2 bg-emerald-500' : 'w-2 bg-slate-300 dark:bg-slate-600'
                      }`}
                    />
                  ))}
                </div>

                <Button
                  variant="ghost"
                  onClick={() => navigate('/trainings')}
                >
                  İptal
                </Button>

                {currentStep < totalSteps ? (
                  <Button onClick={handleNext} className="gap-2 px-6">
                    İleri <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button variant="success" onClick={handleSubmit} className="gap-2 px-6">
                    <Check className="h-4 w-4" /> Kaydet & Bitir
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};
