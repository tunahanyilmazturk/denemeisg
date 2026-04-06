import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ImageGallery } from '../components/ui/ImageGallery';
import { Modal } from '../components/ui/Modal';
import { PageTransition } from '../components/layout/PageTransition';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Save, AlertTriangle, Building2, Calendar, MapPin, User,
  ClipboardList, Heart, Shield, FileText, Camera, Edit2, Trash2,
  Activity, Eye, Clock, AlertCircle, Check, X, ChevronRight,
  Lightbulb, Wrench, Info, Download, Mail, MessageCircle, Share2, FileDown,
  MessageSquare, History, Copy, Printer, BarChart3, TrendingUp,
  Plus, Send, BookOpen, Zap, Target, Timer, Hash, ChevronDown,
  ChevronUp, ExternalLink, Bookmark, Bell, MoreHorizontal
} from 'lucide-react';
import { Incident, Severity, IncidentStatus, IncidentType, IncidentNote, ActivityEntry } from '../types';
import { downloadIncidentPDF, getIncidentPDFDataURL } from '../utils/incidentPdfUtils';
import toast from 'react-hot-toast';

// ─── TYPES ────────────────────────────────────────────────────────────────────
type DetailTab = 'overview' | 'injured' | 'treatment' | 'measures' | 'descriptions' | 'photos' | 'notes' | 'timeline';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const TAB_CONFIG: { id: DetailTab; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'overview', label: 'Genel Bilgiler', icon: Eye, color: 'from-indigo-500 to-purple-600' },
  { id: 'injured', label: 'Kazalı Bilgileri', icon: User, color: 'from-emerald-500 to-teal-600' },
  { id: 'treatment', label: 'Tedavi Bilgileri', icon: Heart, color: 'from-rose-500 to-red-600' },
  { id: 'measures', label: 'Önlem Önerileri', icon: Shield, color: 'from-amber-500 to-orange-600' },
  { id: 'descriptions', label: 'Açıklamalar', icon: FileText, color: 'from-violet-500 to-purple-600' },
  { id: 'photos', label: 'Fotoğraflar', icon: Camera, color: 'from-pink-500 to-rose-600' },
  { id: 'notes', label: 'Notlar', icon: MessageSquare, color: 'from-cyan-500 to-blue-600' },
  { id: 'timeline', label: 'Aktivite', icon: History, color: 'from-slate-500 to-gray-600' },
];

const SEVERITY_COLORS: Record<Severity, string> = {
  'Kritik': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  'Yüksek': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  'Orta': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  'Düşük': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
};

const SEVERITY_DOT: Record<Severity, string> = {
  'Kritik': 'bg-red-500',
  'Yüksek': 'bg-orange-500',
  'Orta': 'bg-amber-500',
  'Düşük': 'bg-emerald-500',
};

const SEVERITY_PULSE: Record<Severity, string> = {
  'Kritik': 'animate-pulse bg-red-400',
  'Yüksek': 'animate-pulse bg-orange-400',
  'Orta': 'bg-amber-400',
  'Düşük': 'bg-emerald-400',
};

const STATUS_COLORS: Record<IncidentStatus, string> = {
  'Açık': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'İnceleniyor': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Kapalı': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const STATUS_ICON: Record<IncidentStatus, React.ElementType> = {
  'Açık': AlertCircle,
  'İnceleniyor': Activity,
  'Kapalı': Check,
};

const TYPE_COLORS: Record<string, string> = {
  'İş Kazası': 'from-red-500 to-rose-600',
  'Ramak Kala': 'from-amber-500 to-orange-600',
  'Meslek Hastalığı': 'from-purple-500 to-violet-600',
  'Çevre Olayı': 'from-emerald-500 to-teal-600',
  'Maddi Hasarlı Olay': 'from-blue-500 to-cyan-600',
};

const NOTE_TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  note: { label: 'Not', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', icon: MessageSquare },
  action: { label: 'Aksiyon', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', icon: Zap },
  decision: { label: 'Karar', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', icon: Target },
};

const ACTIVITY_TYPE_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  status_change: { icon: Activity, color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30' },
  edit: { icon: Edit2, color: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30' },
  note: { icon: MessageSquare, color: 'text-cyan-500 bg-cyan-100 dark:bg-cyan-900/30' },
  create: { icon: Plus, color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30' },
  delete: { icon: Trash2, color: 'text-red-500 bg-red-100 dark:bg-red-900/30' },
  measure: { icon: Shield, color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30' },
  other: { icon: Info, color: 'text-slate-500 bg-slate-100 dark:bg-slate-900/30' },
};

const selectClass =
  'flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 transition-all';

// ─── HELPER: Calculate completeness ──────────────────────────────────────────
function calcCompleteness(incident: Incident): { percent: number; details: { label: string; done: boolean }[] } {
  const checks = [
    { label: 'Olay Başlığı', done: !!incident.title },
    { label: 'Firma', done: !!incident.companyId },
    { label: 'Tarih', done: !!incident.date },
    { label: 'Konum', done: !!incident.location },
    { label: 'Açıklama', done: !!incident.description },
    { label: 'Olay Türü', done: !!incident.type },
    { label: 'Kazalı Bilgileri', done: !!(incident.injuredPersonName || incident.injuredPersonDepartment) },
    { label: 'Yaralanma Türleri', done: !!(incident.injuryTypes && incident.injuryTypes.length > 0) },
    { label: 'Tedavi Bilgisi', done: !!(incident.treatmentInfo || incident.medicalTreatmentDescription) },
    { label: 'Kök Neden', done: !!(incident.rootCause || incident.rootCauseAnalysis) },
    { label: 'Önlem Önerileri', done: !!((incident.measuresPersonnel?.length || 0) + (incident.measuresEquipment?.length || 0) + (incident.measuresEnvironment?.length || 0) + (incident.measuresMethod?.length || 0)) },
    { label: 'Fotoğraflar', done: !!(incident.photos && incident.photos.length > 0) },
  ];
  const doneCount = checks.filter(c => c.done).length;
  return { percent: Math.round((doneCount / checks.length) * 100), details: checks };
}

// ─── HELPER: Time ago ─────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'Az önce';
  if (diffMinutes < 60) return `${diffMinutes} dk önce`;
  if (diffHours < 24) return `${diffHours} saat önce`;
  if (diffDays < 7) return `${diffDays} gün önce`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta önce`;
  return new Date(dateStr).toLocaleDateString('tr-TR');
}

// ─── HELPER: Days since incident ──────────────────────────────────────────────
function daysSince(dateStr: string): number {
  const now = new Date();
  const date = new Date(dateStr);
  return Math.floor((now.getTime() - date.getTime()) / 86400000);
}

// ─── HELPER COMPONENTS ────────────────────────────────────────────────────────
const InfoRow = ({ icon: Icon, label, value, className = '' }: { icon: React.ElementType; label: string; value: React.ReactNode; className?: string }) => (
  <div className={`flex items-start gap-3 ${className}`}>
    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <div className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{value || '—'}</div>
    </div>
  </div>
);

const SectionCard = ({ title, icon: Icon, children, className = '', collapsible = false, defaultOpen = true }: { title: string; icon: React.ElementType; children: React.ReactNode; className?: string; collapsible?: boolean; defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`bg-white/50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden ${className}`}>
      <button
        onClick={() => collapsible && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-5 py-4 ${collapsible ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors' : 'cursor-default'}`}
      >
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
          <Icon className="h-3.5 w-3.5" />
          {title}
        </h3>
        {collapsible && (
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </motion.div>
        )}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MeasureTag: React.FC<{ text: string; color: string }> = ({ text, color }) => (
  <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${color}`}>
    <Check className="h-3 w-3" />
    {text}
  </span>
);

const CircularProgress = ({ percent, size = 80, strokeWidth = 6 }: { percent: number; size?: number; strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;
  const color = percent >= 80 ? '#10b981' : percent >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="none" className="text-slate-200 dark:text-slate-700" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-slate-900 dark:text-white">{percent}%</span>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color, subtext }: { icon: React.ElementType; label: string; value: string | number; color: string; subtext?: string }) => (
  <div className={`${color} rounded-xl p-4 text-center`}>
    <Icon className="h-5 w-5 mx-auto mb-1.5 opacity-80" />
    <p className="text-xl font-bold">{value}</p>
    <p className="text-xs opacity-80 mt-0.5">{label}</p>
    {subtext && <p className="text-[10px] opacity-60 mt-0.5">{subtext}</p>}
  </div>
);

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export const IncidentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { incidents, companies, personnel, updateIncident, deleteIncident, addIncident, userProfile } = useStore();

  const incident = incidents.find(i => i.id === id);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Incident>>({});
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pdfPreviewURL, setPdfPreviewURL] = useState<string | null>(null);
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', message: '' });
  const [newNote, setNewNote] = useState('');
  const [newNoteType, setNewNoteType] = useState<'note' | 'action' | 'decision'>('note');
  const [showCompleteness, setShowCompleteness] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);

  const company = useMemo(() => incident ? companies.find(c => c.id === incident.companyId) : null, [incident, companies]);
  const person = useMemo(() => incident?.personnelId ? personnel.find(p => p.id === incident.personnelId) : null, [incident, personnel]);

  // Related incidents (same company or same type)
  const relatedIncidents = useMemo(() => {
    if (!incident) return [];
    return incidents.filter(i =>
      i.id !== incident.id &&
      (i.companyId === incident.companyId || i.type === incident.type)
    ).slice(0, 5);
  }, [incident, incidents]);

  // Completeness
  const completeness = useMemo(() => incident ? calcCompleteness(incident) : { percent: 0, details: [] }, [incident]);

  // Days info
  const daysOpen = useMemo(() => incident ? daysSince(incident.date) : 0, [incident]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

      if (e.key === 'e' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (!isEditing && incident) handleStartEdit();
      }
      if (e.key === 'Escape') {
        if (isEditing) handleCancelEdit();
        if (shareModalOpen) setShareModalOpen(false);
        if (deleteModalOpen) setDeleteModalOpen(false);
      }
      if (e.key === 'p' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, shareModalOpen, deleteModalOpen, incident]);

  if (!incident) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6"
          >
            <AlertCircle className="w-10 h-10 text-slate-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Olay Bulunamadı</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Aradığınız olay bildirimi bulunamadı veya silinmiş olabilir.</p>
          <Button onClick={() => navigate('/incidents')} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Olaylara Dön
          </Button>
        </div>
      </PageTransition>
    );
  }

  const handleStartEdit = () => {
    setEditForm({ ...incident });
    setIsEditing(true);
    addActivityEntry('edit', 'Düzenleme modu açıldı');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const handleSaveEdit = () => {
    if (!editForm.title || !editForm.date || !editForm.companyId) {
      toast.error('Lütfen zorunlu alanları doldurun.');
      return;
    }
    const updated = {
      ...incident,
      ...editForm,
      updatedAt: new Date().toISOString(),
    } as Incident;

    // Add activity entry
    const changes: string[] = [];
    if (editForm.title !== incident.title) changes.push('başlık');
    if (editForm.status !== incident.status) changes.push('durum');
    if (editForm.severity !== incident.severity) changes.push('öncelik');
    if (editForm.location !== incident.location) changes.push('konum');
    if (editForm.description !== incident.description) changes.push('açıklama');

    const logEntry: ActivityEntry = {
      id: crypto.randomUUID(),
      action: 'Bilgiler güncellendi',
      description: changes.length > 0 ? `Güncellenen alanlar: ${changes.join(', ')}` : 'Bilgiler güncellendi',
      user: userProfile.name || 'Sistem',
      timestamp: new Date().toISOString(),
      type: 'edit',
    };

    updated.activityLog = [...(updated.activityLog || []), logEntry];

    updateIncident(updated);
    toast.success('Olay bildirimi güncellendi.');
    setIsEditing(false);
    setEditForm({});
  };

  const handleDelete = () => {
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    deleteIncident(incident.id);
    toast.success('Olay bildirimi silindi.');
    setDeleteModalOpen(false);
    navigate('/incidents');
  };

  const handleStatusChange = (status: IncidentStatus) => {
    const logEntry: ActivityEntry = {
      id: crypto.randomUUID(),
      action: `Durum değişikliği: ${incident.status} → ${status}`,
      description: `Olay durumu "${incident.status}" konumundan "${status}" konumuna güncellendi.`,
      user: userProfile.name || 'Sistem',
      timestamp: new Date().toISOString(),
      type: 'status_change',
    };

    updateIncident({
      ...incident,
      status,
      updatedAt: new Date().toISOString(),
      activityLog: [...(incident.activityLog || []), logEntry],
    });
    toast.success(`Durum "${status}" olarak güncellendi.`);
  };

  const handleDuplicate = () => {
    const newIncident: Incident = {
      ...incident,
      id: crypto.randomUUID(),
      title: `${incident.title} (Kopya)`,
      status: 'Açık' as IncidentStatus,
      createdAt: new Date().toISOString(),
      updatedAt: undefined,
      notes: [],
      activityLog: [{
        id: crypto.randomUUID(),
        action: 'Olay kopyalandı',
        description: `"${incident.title}" olayından kopyalandı.`,
        user: userProfile.name || 'Sistem',
        timestamp: new Date().toISOString(),
        type: 'create',
      }],
    };
    addIncident(newIncident);
    toast.success('Olay bildirimi kopyalandı.');
    navigate(`/incidents/${newIncident.id}`);
  };

  const handlePrint = () => {
    window.print();
    toast.success('Yazdırma penceresi açıldı.');
  };

  const addActivityEntry = (type: ActivityEntry['type'], description: string) => {
    const logEntry: ActivityEntry = {
      id: crypto.randomUUID(),
      action: description,
      description,
      user: userProfile.name || 'Sistem',
      timestamp: new Date().toISOString(),
      type,
    };
    updateIncident({
      ...incident,
      activityLog: [...(incident.activityLog || []), logEntry],
    });
  };

  const handleAddNote = () => {
    if (!newNote.trim()) {
      toast.error('Lütfen bir not yazın.');
      return;
    }

    const note: IncidentNote = {
      id: crypto.randomUUID(),
      author: userProfile.name || 'Anonim',
      content: newNote.trim(),
      createdAt: new Date().toISOString(),
      type: newNoteType,
    };

    const logEntry: ActivityEntry = {
      id: crypto.randomUUID(),
      action: `Yeni ${NOTE_TYPE_CONFIG[newNoteType].label.toLowerCase()} eklendi`,
      description: newNote.trim().substring(0, 100) + (newNote.trim().length > 100 ? '...' : ''),
      user: userProfile.name || 'Sistem',
      timestamp: new Date().toISOString(),
      type: 'note',
    };

    updateIncident({
      ...incident,
      notes: [...(incident.notes || []), note],
      activityLog: [...(incident.activityLog || []), logEntry],
      updatedAt: new Date().toISOString(),
    });

    setNewNote('');
    toast.success(`${NOTE_TYPE_CONFIG[newNoteType].label} eklendi.`);
  };

  const handleDeleteNote = (noteId: string) => {
    updateIncident({
      ...incident,
      notes: (incident.notes || []).filter(n => n.id !== noteId),
      updatedAt: new Date().toISOString(),
    });
    toast.success('Not silindi.');
  };

  const typeColor = TYPE_COLORS[incident.type || 'İş Kazası'] || 'from-indigo-500 to-purple-600';
  const photoCount = incident.photos?.length || 0;
  const noteCount = incident.notes?.length || 0;
  const activityCount = incident.activityLog?.length || 0;
  const StatusIcon = STATUS_ICON[incident.status];

  // ─── SHARE & EXPORT HANDLERS ────────────────────────────────────────────
  const handleDownloadPDF = () => {
    downloadIncidentPDF({ incident, company: company || undefined, person: person || undefined });
    toast.success('PDF indirildi.');
  };

  const handlePreviewPDF = () => {
    const dataURL = getIncidentPDFDataURL({ incident, company: company || undefined, person: person || undefined });
    setPdfPreviewURL(dataURL);
    setShareModalOpen(true);
  };

  const handleSendEmail = () => {
    if (!emailForm.to) {
      toast.error('Lütfen alıcı e-posta adresini girin.');
      return;
    }

    const subject = emailForm.subject || `Olay Bildirimi: ${incident.title}`;
    const body = emailForm.message || `Merhaba,\n\nEkte "${incident.title}" başlıklı olay bildirimi raporunu bulabilirsiniz.\n\nOlay Tarihi: ${new Date(incident.date).toLocaleDateString('tr-TR')}\nFirma: ${company?.name || '-'}\nDurum: ${incident.status}\n\nSaygılarımla.`;

    const mailtoLink = `mailto:${emailForm.to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;

    toast.success('E-posta uygulamanız açılıyor...');
    setEmailForm({ to: '', subject: '', message: '' });
  };

  const handleShareWhatsApp = () => {
    const text = `*OLAY BİLDİRİMİ RAPORU*\n\n` +
                 `📋 *Başlık:* ${incident.title}\n` +
                 `📅 *Tarih:* ${new Date(incident.date).toLocaleDateString('tr-TR')}\n` +
                 `🏢 *Firma:* ${company?.name || '-'}\n` +
                 `📍 *Lokasyon:* ${incident.location}\n` +
                 `⚠️ *Durum:* ${incident.status}\n` +
                 `🔴 *Şiddet:* ${incident.severity}\n\n` +
                 `${incident.description ? `*Açıklama:* ${incident.description.substring(0, 200)}${incident.description.length > 200 ? '...' : ''}` : ''}`;

    const whatsappLink = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappLink, '_blank');
    toast.success('WhatsApp açılıyor...');
  };

  // ─── TAB CONTENT RENDERER ──────────────────────────────────────────────────
  const renderTabContent = () => {
    switch (activeTab) {
      // ─── OVERVIEW TAB ─────────────────────────────────────────────────
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Status & Quick Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold border ${SEVERITY_COLORS[incident.severity]}`}>
                <span className={`w-2 h-2 rounded-full ${SEVERITY_PULSE[incident.severity]} mr-2`} />
                {incident.severity}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${STATUS_COLORS[incident.status]}`}>
                <StatusIcon className="h-3.5 w-3.5" />
                {incident.status}
              </span>
              {incident.type && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  {incident.type}
                </span>
              )}

              {/* Days Open Badge */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <Timer className="h-3.5 w-3.5" />
                {daysOpen} gündür açık
              </span>

              {/* Status Changer */}
              <div className="ml-auto flex items-center gap-2">
                {incident.status !== 'Kapalı' && (
                  <>
                    {incident.status === 'Açık' && (
                      <Button variant="secondary" size="sm" onClick={() => handleStatusChange('İnceleniyor')} className="gap-1.5 text-xs">
                        <Activity className="h-3.5 w-3.5" /> İncelemeye Al
                      </Button>
                    )}
                    <Button variant="success" size="sm" onClick={() => handleStatusChange('Kapalı')} className="gap-1.5 text-xs">
                      <Check className="h-3.5 w-3.5" /> Kapat
                    </Button>
                  </>
                )}
                {incident.status === 'Kapalı' && (
                  <Button variant="secondary" size="sm" onClick={() => handleStatusChange('Açık')} className="gap-1.5 text-xs">
                    <AlertCircle className="h-3.5 w-3.5" /> Yeniden Aç
                  </Button>
                )}
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                icon={Calendar}
                label="Olay Tarihi"
                value={new Date(incident.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                color="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                subtext={new Date(incident.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
              />
              <StatCard
                icon={Clock}
                label="Geçen Süre"
                value={`${daysOpen} gün`}
                color="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                subtext={incident.status === 'Kapalı' ? 'Çözüldü' : 'Devam ediyor'}
              />
              <StatCard
                icon={Heart}
                label="İş Günü Kaybı"
                value={incident.daysOff || 0}
                color="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                subtext="gün"
              />
              <StatCard
                icon={Camera}
                label="Kanıt"
                value={photoCount}
                color="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                subtext="fotoğraf"
              />
            </div>

            {/* Description */}
            {incident.description && (
              <SectionCard title="Olay Açıklaması" icon={FileText} collapsible>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {incident.description}
                </p>
              </SectionCard>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SectionCard title="Olay Bilgileri" icon={AlertTriangle}>
                <div className="space-y-4">
                  <InfoRow icon={Building2} label="Firma" value={
                    company ? (
                      <Link to={`/companies/${company.id}`} className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1">
                        {company.name}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    ) : '—'
                  } />
                  <InfoRow icon={MapPin} label="Konum / Bölüm" value={incident.location} />
                  <InfoRow icon={Calendar} label="Olay Tarihi" value={
                    new Date(incident.date).toLocaleString('tr-TR', {
                      year: 'numeric', month: 'long', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })
                  } />
                  <InfoRow icon={ClipboardList} label="Olay Türü" value={incident.type} />
                  <InfoRow icon={Hash} label="Olay No" value={
                    <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{incident.id.substring(0, 8).toUpperCase()}</span>
                  } />
                </div>
              </SectionCard>

              <SectionCard title="İlgili Personel & Kayıt" icon={User}>
                <div className="space-y-4">
                  {person ? (
                    <>
                      <InfoRow icon={User} label="İlgili Personel" value={
                        <Link to={`/personnel/${person.id}`} className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1">
                          {person.firstName} {person.lastName}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      } />
                      <InfoRow icon={ClipboardList} label="Görevi" value={person.role} />
                    </>
                  ) : (
                    <InfoRow icon={User} label="İlgili Personel" value="Belirtilmedi" />
                  )}
                  <InfoRow icon={Clock} label="Kayıt Tarihi" value={
                    new Date(incident.createdAt).toLocaleString('tr-TR', {
                      year: 'numeric', month: 'long', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })
                  } />
                  {incident.updatedAt && (
                    <InfoRow icon={Edit2} label="Son Güncelleme" value={
                      <span className="flex items-center gap-1.5">
                        {timeAgo(incident.updatedAt)}
                        <span className="text-xs text-slate-400">({new Date(incident.updatedAt).toLocaleString('tr-TR')})</span>
                      </span>
                    } />
                  )}
                </div>
              </SectionCard>
            </div>

            {/* Root Cause */}
            {incident.rootCause && (
              <SectionCard title="Kök Neden" icon={AlertTriangle} collapsible>
                <p className="text-sm text-slate-700 dark:text-slate-300 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                  {incident.rootCause}
                </p>
              </SectionCard>
            )}

            {/* Related Incidents */}
            {relatedIncidents.length > 0 && (
              <SectionCard title={`İlgili Olaylar (${relatedIncidents.length})`} icon={BookOpen} collapsible defaultOpen={false}>
                <div className="space-y-2">
                  {relatedIncidents.map((ri) => (
                    <Link
                      key={ri.id}
                      to={`/incidents/${ri.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                    >
                      <div className={`w-2 h-2 rounded-full ${SEVERITY_DOT[ri.severity]}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {ri.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(ri.date).toLocaleDateString('tr-TR')} · {ri.type || 'Belirtilmemiş'} · {ri.status}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                    </Link>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Edit Form */}
            {isEditing && (
              <SectionCard title="Olay Bilgilerini Düzenle" icon={Edit2}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Olay Başlığı *</label>
                      <Input value={editForm.title || ''} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tarih *</label>
                      <Input type="datetime-local" value={editForm.date ? editForm.date.substring(0, 16) : ''} onChange={e => setEditForm({ ...editForm, date: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Firma *</label>
                      <select className={selectClass} value={editForm.companyId || ''} onChange={e => setEditForm({ ...editForm, companyId: e.target.value })}>
                        <option value="">Seçiniz</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Konum</label>
                      <Input value={editForm.location || ''} onChange={e => setEditForm({ ...editForm, location: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Öncelik</label>
                      <select className={selectClass} value={editForm.severity || 'Orta'} onChange={e => setEditForm({ ...editForm, severity: e.target.value as Severity })}>
                        <option value="Düşük">Düşük</option>
                        <option value="Orta">Orta</option>
                        <option value="Yüksek">Yüksek</option>
                        <option value="Kritik">Kritik</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Durum</label>
                      <select className={selectClass} value={editForm.status || 'Açık'} onChange={e => setEditForm({ ...editForm, status: e.target.value as IncidentStatus })}>
                        <option value="Açık">Açık</option>
                        <option value="İnceleniyor">İnceleniyor</option>
                        <option value="Kapalı">Kapalı</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Olay Türü</label>
                      <select className={selectClass} value={editForm.type || ''} onChange={e => setEditForm({ ...editForm, type: e.target.value as IncidentType })}>
                        <option value="">Seçiniz</option>
                        <option value="İş Kazası">İş Kazası</option>
                        <option value="Ramak Kala">Ramak Kala</option>
                        <option value="Meslek Hastalığı">Meslek Hastalığı</option>
                        <option value="Çevre Olayı">Çevre Olayı</option>
                        <option value="Maddi Hasarlı Olay">Maddi Hasarlı Olay</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">İlgili Personel</label>
                      <select className={selectClass} value={editForm.personnelId || ''} onChange={e => setEditForm({ ...editForm, personnelId: e.target.value })}>
                        <option value="">Seçiniz</option>
                        {personnel.filter(p => !editForm.companyId || p.assignedCompanyId === editForm.companyId).map(p => (
                          <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Açıklama</label>
                    <textarea
                      rows={4}
                      className="flex w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 resize-none transition-all"
                      value={editForm.description || ''}
                      onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Kök Neden</label>
                    <Input value={editForm.rootCause || ''} onChange={e => setEditForm({ ...editForm, rootCause: e.target.value })} />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" onClick={handleCancelEdit} className="gap-1.5">
                      <X className="h-4 w-4" /> İptal
                    </Button>
                    <Button onClick={handleSaveEdit} className="gap-2">
                      <Save className="h-4 w-4" /> Kaydet
                    </Button>
                  </div>
                </div>
              </SectionCard>
            )}
          </div>
        );

      // ─── INJURED PERSON TAB ───────────────────────────────────────────
      case 'injured':
        return (
          <div className="space-y-6">
            <SectionCard title="Kazalı Kişisel Bilgiler" icon={User}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow icon={User} label="Adı Soyadı" value={incident.injuredPersonName} />
                <InfoRow icon={ClipboardList} label="Bölüm / Firma" value={incident.injuredPersonDepartment} />
                <InfoRow icon={Calendar} label="Doğum Tarihi" value={incident.injuredPersonBirthDate ? new Date(incident.injuredPersonBirthDate).toLocaleDateString('tr-TR') : null} />
                <InfoRow icon={ClipboardList} label="Sicil No" value={incident.injuredPersonEmployeeId} />
                <InfoRow icon={User} label="Cinsiyet" value={incident.injuredPersonGender} />
                <InfoRow icon={ClipboardList} label="Proses Tanımı" value={incident.injuredPersonProcessDesc} />
              </div>
            </SectionCard>

            <SectionCard title="Çalışma Bilgileri" icon={ClipboardList}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow icon={Clock} label="Toplam Tecrübe" value={incident.injuredPersonTotalExperience} />
                <InfoRow icon={Clock} label="Bu Görevdeki Tecrübe" value={incident.injuredPersonTaskExperience} />
                <InfoRow icon={Activity} label="Vardiya" value={incident.injuredPersonShift} />
                <InfoRow icon={ClipboardList} label="Çalışma Tipi" value={
                  incident.injuredPersonEmploymentType?.length
                    ? <div className="flex flex-wrap gap-1.5 mt-1">
                        {incident.injuredPersonEmploymentType.map((t, i) => (
                          <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                            {t}
                          </span>
                        ))}
                      </div>
                    : null
                } />
              </div>
            </SectionCard>

            {!incident.injuredPersonName && !incident.injuredPersonDepartment && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800 flex items-start gap-3"
              >
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  Kazalı bilgileri henüz girilmemiş. Olay bildirimi düzenleyerek bu bilgileri doldurabilirsiniz.
                </div>
              </motion.div>
            )}
          </div>
        );

      // ─── TREATMENT TAB ────────────────────────────────────────────────
      case 'treatment':
        return (
          <div className="space-y-6">
            <SectionCard title="Yaralanma Türleri" icon={Heart}>
              {incident.injuryTypes?.length ? (
                <div className="flex flex-wrap gap-2">
                  {incident.injuryTypes.map((type, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                    >
                      {type}
                    </motion.span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Yaralanma türü belirtilmemiş.</p>
              )}
            </SectionCard>

            <SectionCard title="Etkilenen Bölgeler" icon={Activity}>
              {incident.affectedBodyParts?.length ? (
                <div className="flex flex-wrap gap-2">
                  {incident.affectedBodyParts.map((part, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800"
                    >
                      {part}
                    </motion.span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Etkilenen bölge belirtilmemiş.</p>
              )}
            </SectionCard>

            <SectionCard title="Ciddiyet & İş Günü Kaybı" icon={Shield}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Ciddiyet Derecesi</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{incident.severityLevel || '—'}</p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800 text-center">
                  <p className="text-xs text-red-600 dark:text-red-400 mb-1">Çalışılamayan Gün</p>
                  <p className="text-lg font-bold text-red-700 dark:text-red-300">{incident.daysOff || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800 text-center">
                  <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">Kısıtlı Çalışma Günü</p>
                  <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{incident.restrictedWorkDays || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 text-center">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">İşbaşı Tarihi</p>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                    {incident.returnToWorkDate ? new Date(incident.returnToWorkDate).toLocaleDateString('tr-TR') : '—'}
                  </p>
                </div>
              </div>
            </SectionCard>

            {/* Hospital Referral */}
            <div className={`rounded-xl p-4 border flex items-center gap-4 ${
              incident.hospitalReferral
                ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800'
                : 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800'
            }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                incident.hospitalReferral ? 'bg-amber-200 dark:bg-amber-800' : 'bg-emerald-200 dark:bg-emerald-800'
              }`}>
                {incident.hospitalReferral ? <AlertTriangle className="h-5 w-5 text-amber-700 dark:text-amber-300" /> : <Check className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />}
              </div>
              <div>
                <p className={`text-sm font-semibold ${incident.hospitalReferral ? 'text-amber-800 dark:text-amber-200' : 'text-emerald-800 dark:text-emerald-200'}`}>
                  {incident.hospitalReferral ? 'Hastaneye Sevk Edildi' : 'Hastaneye Sevk Edilmedi'}
                </p>
              </div>
            </div>

            {incident.treatmentInfo && (
              <SectionCard title="Tedavi Bilgisi" icon={Heart} collapsible>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{incident.treatmentInfo}</p>
              </SectionCard>
            )}
          </div>
        );

      // ─── MEASURES TAB ─────────────────────────────────────────────────
      case 'measures': {
        const hasMeasures = (incident.measuresPersonnel?.length || 0) + (incident.measuresEquipment?.length || 0) + (incident.measuresEnvironment?.length || 0) + (incident.measuresMethod?.length || 0);

        return (
          <div className="space-y-6">
            {hasMeasures ? (
              <>
                {/* Measures Summary Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center border border-blue-200 dark:border-blue-800">
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{incident.measuresPersonnel?.length || 0}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">İnsan</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center border border-emerald-200 dark:border-emerald-800">
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{incident.measuresEquipment?.length || 0}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">Makina/Teçhizat</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center border border-purple-200 dark:border-purple-800">
                    <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{incident.measuresEnvironment?.length || 0}</p>
                    <p className="text-xs text-purple-600 dark:text-purple-400">Ortam</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center border border-amber-200 dark:border-amber-800">
                    <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{incident.measuresMethod?.length || 0}</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">Yöntem</p>
                  </div>
                </div>

                {incident.measuresPersonnel?.length ? (
                  <SectionCard title="1) İnsanda" icon={User} collapsible>
                    <div className="flex flex-wrap gap-2">
                      {incident.measuresPersonnel.map((m, i) => (
                        <MeasureTag key={i} text={m} color="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" />
                      ))}
                    </div>
                  </SectionCard>
                ) : null}

                {incident.measuresEquipment?.length ? (
                  <SectionCard title="2) Makina / Teçhizatta" icon={Wrench} collapsible>
                    <div className="flex flex-wrap gap-2">
                      {incident.measuresEquipment.map((m, i) => (
                        <MeasureTag key={i} text={m} color="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" />
                      ))}
                    </div>
                  </SectionCard>
                ) : null}

                {incident.measuresEnvironment?.length ? (
                  <SectionCard title="3) Ortamda" icon={MapPin} collapsible>
                    <div className="flex flex-wrap gap-2">
                      {incident.measuresEnvironment.map((m, i) => (
                        <MeasureTag key={i} text={m} color="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" />
                      ))}
                    </div>
                  </SectionCard>
                ) : null}

                {incident.measuresMethod?.length ? (
                  <SectionCard title="4) Yöntemde" icon={Lightbulb} collapsible>
                    <div className="flex flex-wrap gap-2">
                      {incident.measuresMethod.map((m, i) => (
                        <MeasureTag key={i} text={m} color="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" />
                      ))}
                    </div>
                  </SectionCard>
                ) : null}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <Shield className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-lg font-semibold text-slate-600 dark:text-slate-400">Önlem önerisi girilmemiş</p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Olay bildirimi düzenleyerek önlem önerileri ekleyebilirsiniz.</p>
              </div>
            )}
          </div>
        );
      }

      // ─── DESCRIPTIONS TAB ─────────────────────────────────────────────
      case 'descriptions':
        return (
          <div className="space-y-6">
            <SectionCard title="Olay Açıklaması" icon={FileText} collapsible>
              {incident.incidentDescription ? (
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                  {incident.incidentDescription}
                </p>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Detaylı olay açıklaması girilmemiş.</p>
              )}
            </SectionCard>

            <SectionCard title="Revir Tedavi Açıklaması" icon={Heart} collapsible>
              {incident.medicalTreatmentDescription ? (
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                  {incident.medicalTreatmentDescription}
                </p>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Revir tedavi açıklaması girilmemiş.</p>
              )}
            </SectionCard>

            <SectionCard title="Kök Neden Analizi" icon={AlertTriangle} collapsible>
              {incident.rootCauseAnalysis ? (
                <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800 font-mono">
                  {incident.rootCauseAnalysis}
                </pre>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Kök neden analizi girilmemiş.</p>
              )}
            </SectionCard>
          </div>
        );

      // ─── PHOTOS TAB ───────────────────────────────────────────────────
      case 'photos':
        return (
          <div className="space-y-6">
            {photoCount > 0 ? (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white text-center">
                    <p className="text-2xl font-bold">{photoCount}</p>
                    <p className="text-xs text-white/80">Toplam Fotoğraf</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white text-center">
                    <p className="text-2xl font-bold">
                      {(incident.photos!.reduce((sum, p) => sum + p.size, 0) / (1024 * 1024)).toFixed(1)}MB
                    </p>
                    <p className="text-xs text-white/80">Toplam Boyut</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 text-white text-center">
                    <p className="text-2xl font-bold">
                      {incident.photos!.filter(p => p.caption).length}
                    </p>
                    <p className="text-xs text-white/80">Açıklamalı</p>
                  </div>
                </div>

                <SectionCard title={`Fotoğraflar (${photoCount})`} icon={Camera}>
                  <ImageGallery photos={incident.photos!} columns={3} maxDisplay={12} />
                </SectionCard>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <Camera className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-lg font-semibold text-slate-600 dark:text-slate-400">Fotoğraf yüklenmemiş</p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Olay bildirimi düzenleyerek fotoğraf ekleyebilirsiniz.</p>
              </div>
            )}
          </div>
        );

      // ─── NOTES TAB ────────────────────────────────────────────────────
      case 'notes':
        return (
          <div className="space-y-6">
            {/* Add Note Form */}
            <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2 mb-4">
                <Plus className="h-3.5 w-3.5" />
                Yeni Not Ekle
              </h3>
              <div className="space-y-3">
                {/* Note Type Selector */}
                <div className="flex gap-2">
                  {(Object.entries(NOTE_TYPE_CONFIG) as [string, { label: string; color: string; icon: React.ElementType }][]).map(([key, config]) => {
                    const NoteIcon = config.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => setNewNoteType(key as 'note' | 'action' | 'decision')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          newNoteType === key
                            ? config.color + ' ring-2 ring-offset-1 ring-indigo-300 dark:ring-indigo-600'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <NoteIcon className="h-3.5 w-3.5" />
                        {config.label}
                      </button>
                    );
                  })}
                </div>
                <textarea
                  rows={3}
                  className="flex w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 resize-none transition-all"
                  placeholder="Notunuzu buraya yazın..."
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      handleAddNote();
                    }
                  }}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Ctrl+Enter ile hızlı gönder</p>
                  <Button size="sm" onClick={handleAddNote} className="gap-1.5">
                    <Send className="h-3.5 w-3.5" /> Ekle
                  </Button>
                </div>
              </div>
            </div>

            {/* Notes List */}
            {(incident.notes?.length || 0) > 0 ? (
              <div className="space-y-3">
                {[...(incident.notes || [])].reverse().map((note, idx) => {
                  const config = NOTE_TYPE_CONFIG[note.type || 'note'];
                  const NoteIcon = config.icon;
                  return (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 group"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
                          <NoteIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
                              {config.label}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{note.author}</span>
                            <span className="text-xs text-slate-400">·</span>
                            <span className="text-xs text-slate-400">{timeAgo(note.createdAt)}</span>
                          </div>
                          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{note.content}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 transition-all flex-shrink-0"
                          title="Notu Sil"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-lg font-semibold text-slate-600 dark:text-slate-400">Henüz not yok</p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Yukarıdaki formu kullanarak not ekleyin.</p>
              </div>
            )}
          </div>
        );

      // ─── TIMELINE TAB ─────────────────────────────────────────────────
      case 'timeline': {
        const allActivities = [...(incident.activityLog || [])].reverse();

        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <History className="h-4 w-4" />
                Aktivite Geçmişi
                <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full">{allActivities.length}</span>
              </h3>
            </div>

            {allActivities.length > 0 ? (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[19px] top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />

                <div className="space-y-4">
                  {allActivities.map((entry, idx) => {
                    const typeConfig = ACTIVITY_TYPE_ICONS[entry.type] || ACTIVITY_TYPE_ICONS.other;
                    const EntryIcon = typeConfig.icon;
                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="relative flex items-start gap-4 pl-0"
                      >
                        <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeConfig.color}`}>
                          <EntryIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{entry.action}</p>
                          </div>
                          {entry.description !== entry.action && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{entry.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <User className="h-3 w-3" /> {entry.user}
                            </span>
                            <span className="text-xs text-slate-400">·</span>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {timeAgo(entry.timestamp)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <History className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-lg font-semibold text-slate-600 dark:text-slate-400">Aktivite kaydı yok</p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Bu olay üzerinde yapılan değişiklikler burada görünecek.</p>
              </div>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <PageTransition>
      <div className="space-y-4 max-w-full mx-0 print:space-y-2">
        {/* Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/incidents')} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Geri
            </Button>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
            <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
              <Link to="/incidents" className="hover:text-indigo-600 dark:hover:text-indigo-400">Olaylar</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-slate-900 dark:text-white font-medium truncate max-w-[200px]">{incident.title}</span>
            </nav>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Primary Actions */}
            <Button variant="secondary" onClick={handlePreviewPDF} className="gap-2">
              <Eye className="h-4 w-4" /> <span className="hidden sm:inline">PDF</span> Önizle
            </Button>
            <Button variant="secondary" onClick={handleDownloadPDF} className="gap-2">
              <Download className="h-4 w-4" /> <span className="hidden sm:inline">PDF</span> İndir
            </Button>
            <Button variant="secondary" onClick={() => { setPdfPreviewURL(null); setShareModalOpen(true); }} className="gap-2">
              <Share2 className="h-4 w-4" /> <span className="hidden sm:inline">Paylaş</span>
            </Button>
            {!isEditing && (
              <Button variant="secondary" onClick={handleStartEdit} className="gap-2">
                <Edit2 className="h-4 w-4" /> <span className="hidden sm:inline">Düzenle</span>
              </Button>
            )}

            {/* More Actions Dropdown */}
            <div className="relative">
              <Button variant="secondary" onClick={() => setShowMoreActions(!showMoreActions)} className="gap-1.5 px-2.5">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              <AnimatePresence>
                {showMoreActions && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMoreActions(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -5, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-20"
                    >
                      <button onClick={() => { handleDuplicate(); setShowMoreActions(false); }} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <Copy className="h-4 w-4" /> Kopyala
                      </button>
                      <button onClick={() => { handlePrint(); setShowMoreActions(false); }} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <Printer className="h-4 w-4" /> Yazdır
                      </button>
                      <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
                      <button onClick={() => { handleDelete(); setShowMoreActions(false); }} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 className="h-4 w-4" /> Sil
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden print:shadow-none print:border-0">
          <div className={`bg-gradient-to-r ${typeColor} p-6 sm:p-8 relative overflow-hidden`}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/20" />
              <div className="absolute -left-5 -bottom-5 w-32 h-32 rounded-full bg-white/10" />
            </div>

            <div className="flex items-start gap-4 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-lg flex-shrink-0">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-white/70 bg-white/10 px-2 py-0.5 rounded-md">
                    #{incident.id.substring(0, 8).toUpperCase()}
                  </span>
                  <span className={`text-xs font-medium text-white/90 bg-white/15 px-2 py-0.5 rounded-md flex items-center gap-1`}>
                    <StatusIcon className="h-3 w-3" /> {incident.status}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 truncate">{incident.title}</h1>
                <div className="flex flex-wrap items-center gap-3 text-white/80 text-sm">
                  {company && (
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-4 w-4" /> {company.name}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" /> {new Date(incident.date).toLocaleDateString('tr-TR')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" /> {incident.location}
                  </span>
                  {person && (
                    <span className="flex items-center gap-1.5">
                      <User className="h-4 w-4" /> {person.firstName} {person.lastName}
                    </span>
                  )}
                </div>
              </div>

              {/* Completeness Circle - Desktop */}
              <div className="hidden sm:flex flex-col items-center gap-1">
                <CircularProgress percent={completeness.percent} size={64} strokeWidth={5} />
                <button
                  onClick={() => setShowCompleteness(!showCompleteness)}
                  className="text-[10px] text-white/60 hover:text-white/90 transition-colors"
                >
                  Tamamlanma
                </button>
              </div>
            </div>
          </div>

          {/* Completeness Detail Panel */}
          <AnimatePresence>
            {showCompleteness && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-b border-slate-200 dark:border-slate-700"
              >
                <div className="p-5 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" /> Tamamlanma Durumu
                    </h3>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{completeness.percent}%</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full mb-4 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${completeness.percent}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        completeness.percent >= 80 ? 'bg-emerald-500' : completeness.percent >= 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {completeness.details.map((item, idx) => (
                      <div key={idx} className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg ${
                        item.done
                          ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                          : 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
                      }`}>
                        {item.done ? <Check className="h-3 w-3 flex-shrink-0" /> : <X className="h-3 w-3 flex-shrink-0" />}
                        <span className="truncate">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content with Sidebar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden print:shadow-none print:border-0">
          <div className="flex flex-col lg:flex-row min-h-[500px]">
            {/* Sidebar Tabs */}
            <div className="w-full lg:w-72 bg-slate-50 dark:bg-slate-800/50 p-4 lg:p-6 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-700 print:hidden">
              <nav className="space-y-1.5">
                {TAB_CONFIG.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const badgeCount = tab.id === 'photos' ? photoCount : tab.id === 'notes' ? noteCount : tab.id === 'timeline' ? activityCount : 0;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isActive
                          ? `bg-gradient-to-br ${tab.color} text-white shadow-sm`
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                      }`}>
                        <tab.icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm">{tab.label}</span>
                      {badgeCount > 0 && (
                        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-semibold ${
                          isActive
                            ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}>
                          {badgeCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Completeness Mini */}
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setShowCompleteness(!showCompleteness)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tamamlanma</p>
                    <span className={`text-xs font-bold ${
                      completeness.percent >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                      completeness.percent >= 50 ? 'text-amber-600 dark:text-amber-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>{completeness.percent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${completeness.percent}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        completeness.percent >= 80 ? 'bg-emerald-500' : completeness.percent >= 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                    />
                  </div>
                </button>
              </div>

              {/* Quick Stats */}
              <div className="mt-3">
                <div className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 space-y-2">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Özet</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Yaralanma</span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">{incident.injuryTypes?.length || 0} tür</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Önlemler</span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      {(incident.measuresPersonnel?.length || 0) + (incident.measuresEquipment?.length || 0) + (incident.measuresEnvironment?.length || 0) + (incident.measuresMethod?.length || 0)} adet
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Fotoğraf</span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">{photoCount} adet</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Notlar</span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">{noteCount} adet</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400">İş Günü Kaybı</span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">{incident.daysOff || 0} gün</span>
                  </div>
                </div>
              </div>

              {/* Keyboard Shortcuts */}
              <div className="mt-3 hidden lg:block">
                <div className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Kısayollar</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Düzenle</span>
                      <kbd className="text-[10px] bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-mono">E</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Yazdır</span>
                      <kbd className="text-[10px] bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-mono">Ctrl+P</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">İptal</span>
                      <kbd className="text-[10px] bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-mono">Esc</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-6 lg:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderTabContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Olay Bildirimini Sil"
          size="sm"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-800 dark:text-red-200">Bu işlem geri alınamaz!</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                  "{incident.title}" olay bildirimi ve tüm ilgili veriler kalıcı olarak silinecektir.
                </p>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Hash className="h-3.5 w-3.5" />
                <span className="font-mono text-xs">{incident.id.substring(0, 8).toUpperCase()}</span>
                <span className="text-slate-400">·</span>
                <span>{new Date(incident.date).toLocaleDateString('tr-TR')}</span>
                <span className="text-slate-400">·</span>
                <span>{incident.severity}</span>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="ghost" onClick={() => setDeleteModalOpen(false)} className="flex-1">
                İptal
              </Button>
              <Button variant="danger" onClick={confirmDelete} className="flex-1 gap-2">
                <Trash2 className="h-4 w-4" /> Sil
              </Button>
            </div>
          </div>
        </Modal>

        {/* Share & PDF Modal */}
        <Modal
          isOpen={shareModalOpen}
          onClose={() => { setShareModalOpen(false); setPdfPreviewURL(null); }}
          title="Rapor Paylaş"
          size="xl"
        >
          <div className="space-y-6">
            {/* PDF Preview */}
            {pdfPreviewURL && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" />
                  PDF Önizleme
                </h3>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <iframe
                    src={pdfPreviewURL}
                    className="w-full h-[400px] sm:h-[500px]"
                    title="PDF Önizleme"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleDownloadPDF} className="gap-2 flex-1">
                    <Download className="h-4 w-4" /> PDF İndir
                  </Button>
                  <Button variant="ghost" onClick={() => setPdfPreviewURL(null)} className="gap-2">
                    <X className="h-4 w-4" /> Kapat
                  </Button>
                </div>
              </div>
            )}

            {/* Share Buttons */}
            {!pdfPreviewURL && (
              <>
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                    <Share2 className="h-3.5 w-3.5" />
                    Hızlı İşlemler
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={handlePreviewPDF}
                      className="group flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                        <Eye className="h-6 w-6" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">PDF Önizle</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Raporu görüntüle</p>
                      </div>
                    </button>

                    <button
                      onClick={handleDownloadPDF}
                      className="group flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                        <FileDown className="h-6 w-6" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">PDF İndir</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Cihazınıza kaydet</p>
                      </div>
                    </button>

                    <button
                      onClick={handleShareWhatsApp}
                      className="group flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                        <MessageCircle className="h-6 w-6" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">WhatsApp</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Mesaj ile paylaş</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Email Section */}
                <div className="space-y-3 border-t border-slate-200 dark:border-slate-700 pt-6">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5" />
                    E-posta ile Gönder
                  </h3>
                  <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Alıcı E-posta</label>
                      <Input
                        type="email"
                        placeholder="ornek@firma.com"
                        value={emailForm.to}
                        onChange={e => setEmailForm({ ...emailForm, to: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Konu</label>
                      <Input
                        placeholder={`Olay Bildirimi: ${incident.title}`}
                        value={emailForm.subject}
                        onChange={e => setEmailForm({ ...emailForm, subject: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Mesaj</label>
                      <textarea
                        rows={4}
                        className="flex w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 resize-none transition-all"
                        placeholder={`Merhaba,\n\nEkte "${incident.title}" başlıklı olay bildirimi raporunu bulabilirsiniz.`}
                        value={emailForm.message}
                        onChange={e => setEmailForm({ ...emailForm, message: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button onClick={handleSendEmail} className="gap-2 flex-1">
                        <Mail className="h-4 w-4" /> E-posta Gönder
                      </Button>
                      <Button variant="secondary" onClick={handleDownloadPDF} className="gap-2">
                        <Download className="h-4 w-4" /> PDF Ekle
                      </Button>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-3 border border-blue-200 dark:border-blue-800 flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        E-posta uygulamanız açılacaktır. PDF dosyasını e-postaya eklemek için önce "PDF Ekle" butonuna tıklayarak indirin, ardından e-postaya dosya olarak ekleyin.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
};
