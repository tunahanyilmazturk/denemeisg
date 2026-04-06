import React, { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { 
  Building2, Users, AlertTriangle, CheckCircle, GraduationCap, HardHat, ShieldAlert, 
  TrendingUp, TrendingDown, Calendar, Activity, FileWarning, Clock, CheckCircle2,
  ArrowRight, BarChart3, PieChart as PieChartIcon, ListTodo, Download, Filter,
  Sparkles, Target, Zap, Bell, ArrowUpRight, ArrowDownRight,
  Lightbulb, Info, MoreHorizontal, ChevronDown, RefreshCw, Eye,
  Shield, AlertCircle, Award, Package, UserCheck, Flame, Heart
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, AreaChart, Area, LineChart, Line 
} from 'recharts';
import { PageTransition } from '../components/layout/PageTransition';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { exportToPDF } from '../utils/exportUtils';
import toast from 'react-hot-toast';

export const Dashboard = () => {
  const { companies, personnel, incidents, trainings, ppes, risks, isDarkMode } = useStore();
  const [dateRange, setDateRange] = useState(30);

  // Calculate statistics
  const openIncidents = incidents.filter(i => i.status !== 'Kapalı').length;
  const criticalIncidents = incidents.filter(i => i.severity === 'Kritik' || i.severity === 'Yüksek').length;
  const activePPEs = ppes.filter(p => p.status === 'Aktif').length;
  const openRisks = risks.filter(r => r.status !== 'Giderildi');
  const highRisks = openRisks.filter(r => r.score > 12).length;
  const mediumRisks = openRisks.filter(r => r.score > 6 && r.score <= 12).length;
  const completedTrainings = trainings.filter(t => t.status === 'Tamamlandı').length;
  const upcomingTrainings = trainings.filter(t => t.status === 'Planlandı').length;
  const activePersonnel = personnel.filter(p => p.status === 'Aktif' || !p.status).length;

  // Risk stats
  const riskStats = useMemo(() => ({
    total: risks.length,
    open: openRisks.length,
    high: highRisks,
    medium: mediumRisks,
    low: openRisks.filter(r => r.score <= 6).length,
    resolved: risks.filter(r => r.status === 'Giderildi').length,
  }), [risks, openRisks, highRisks, mediumRisks]);

  // Incident stats by month
  const incidentsByMonth = useMemo(() => {
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const currentMonth = new Date().getMonth();
    const last6Months = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      last6Months.push(months[monthIndex]);
    }
    
    return last6Months.map((month, idx) => {
      const targetMonth = (currentMonth - (5 - idx) + 12) % 12;
      const count = incidents.filter(i => {
        const incidentDate = new Date(i.date);
        return incidentDate.getMonth() === targetMonth;
      }).length;
      return { name: month, incidents: count };
    });
  }, [incidents]);

  // Training completion rate
  const trainingStats = useMemo(() => {
    const completed = completedTrainings;
    const planned = upcomingTrainings;
    const cancelled = trainings.filter(t => t.status === 'İptal').length;
    return [
      { name: 'Tamamlandı', value: completed, color: '#10b981' },
      { name: 'Planlandı', value: planned, color: '#6366f1' },
      { name: 'İptal', value: cancelled, color: '#ef4444' },
    ];
  }, [trainings, completedTrainings, upcomingTrainings]);

  // Severity data
  const severityData = [
    { name: 'Düşük', value: incidents.filter(i => i.severity === 'Düşük').length, color: '#10b981' },
    { name: 'Orta', value: incidents.filter(i => i.severity === 'Orta').length, color: '#f59e0b' },
    { name: 'Yüksek', value: incidents.filter(i => i.severity === 'Yüksek').length, color: '#f97316' },
    { name: 'Kritik', value: incidents.filter(i => i.severity === 'Kritik').length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const statusData = [
    { name: 'Açık', value: incidents.filter(i => i.status === 'Açık').length },
    { name: 'İnceleniyor', value: incidents.filter(i => i.status === 'İnceleniyor').length },
    { name: 'Kapalı', value: incidents.filter(i => i.status === 'Kapalı').length },
  ];

  const riskDistribution = [
    { name: 'Düşük (1-6)', value: riskStats.low, color: '#10b981' },
    { name: 'Orta (7-12)', value: riskStats.medium, color: '#f59e0b' },
    { name: 'Yüksek (13-25)', value: riskStats.high, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const chartTextColor = isDarkMode ? '#9ca3af' : '#4b5563';

  // AI Insights
  const insights = useMemo(() => {
    const items: { type: string; icon: React.ElementType; title: string; description: string; action: string; gradient: string }[] = [];
    
    if (highRisks > 0) {
      items.push({
        type: 'warning',
        icon: ShieldAlert,
        title: `${highRisks} Yüksek Risk Tespit Edildi`,
        description: 'Öncelikli risk değerlendirmesi ve önlem alınması gerekiyor.',
        action: '/risks',
        gradient: 'from-amber-500/20 to-orange-500/20'
      });
    }
    
    if (openIncidents > 3) {
      items.push({
        type: 'danger',
        icon: AlertTriangle,
        title: `${openIncidents} Açık Olay Var`,
        description: 'Çözüm bekleyen olay sayısı yüksek. İnceleme başlatılması önerilir.',
        action: '/incidents',
        gradient: 'from-red-500/20 to-rose-500/20'
      });
    }
    
    const completionRate = trainings.length > 0 ? (completedTrainings / trainings.length) * 100 : 0;
    if (completionRate < 50 && trainings.length > 0) {
      items.push({
        type: 'info',
        icon: GraduationCap,
        title: `Eğitim Tamamlama Oranı %${completionRate.toFixed(0)}`,
        description: 'Eğitim tamamlama oranı düşük. Hatırlatmalar gönderilmesi önerilir.',
        action: '/trainings',
        gradient: 'from-blue-500/20 to-indigo-500/20'
      });
    }
    
    if (ppes.filter(p => p.status === 'Yıprandı/Kayıp').length > 0) {
      items.push({
        type: 'warning',
        icon: HardHat,
        title: `${ppes.filter(p => p.status === 'Yıprandı/Kayıp').length} KKD Yenilenme Gerekiyor`,
        description: 'Yıpranmış veya kayıp KKD ekipmanlarının yenilenmesi gerekiyor.',
        action: '/ppe',
        gradient: 'from-amber-500/20 to-yellow-500/20'
      });
    }
    
    return items.slice(0, 4);
  }, [highRisks, openIncidents, trainings, completedTrainings, ppes]);

  const handleExportDashboard = () => {
    const data = {
      'Toplam Firma': companies.length,
      'Toplam Personel': personnel.length,
      'Açık Olaylar': openIncidents,
      'Aktif KKD': activePPEs,
      'Yüksek Riskler': highRisks,
      'Tamamlanan Eğitim': completedTrainings,
    };
    exportToPDF('Dashboard Raporu', ['Metrik', 'Değer'], Object.entries(data).map(([k, v]) => [k, String(v)]), 'dashboard-raporu');
    toast.success('Dashboard raporu indirildi');
  };

  // Company comparison data
  const companyComparisonData = useMemo(() => {
    return companies.map(company => {
      const companyPersonnel = personnel.filter(p => p.assignedCompanyId === company.id).length;
      const companyIncidents = incidents.filter(i => i.companyId === company.id).length;
      const companyTrainings = trainings.filter(t => 
        t.participants.some(pid => 
          personnel.find(p => p.id === pid)?.assignedCompanyId === company.id
        )
      ).length;
      return {
        name: company.name.length > 15 ? company.name.substring(0, 15) + '...' : company.name,
        personnel: companyPersonnel,
        incidents: companyIncidents,
        trainings: companyTrainings,
      };
    }).filter(c => c.personnel > 0 || c.incidents > 0).slice(0, 5);
  }, [companies, personnel, incidents, trainings]);

  // Quick actions
  const quickActions = [
    { label: 'Yeni Olay Bildir', icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', gradient: 'from-red-500 to-rose-600', to: '/incidents/new' },
    { label: 'Risk Ekle', icon: ShieldAlert, color: 'text-orange-600 dark:text-orange-400', gradient: 'from-orange-500 to-amber-600', to: '/risks' },
    { label: 'Eğitim Planla', icon: GraduationCap, color: 'text-blue-600 dark:text-blue-400', gradient: 'from-blue-500 to-indigo-600', to: '/trainings/new' },
    { label: 'Personel Ekle', icon: Users, color: 'text-indigo-600 dark:text-indigo-400', gradient: 'from-indigo-500 to-purple-600', to: '/personnel/new' },
  ];

  // Completion/progress metrics
  const safetyScore = useMemo(() => {
    let score = 100;
    // Deduct for open incidents
    score -= Math.min(openIncidents * 5, 30);
    // Deduct for high risks
    score -= Math.min(highRisks * 8, 25);
    // Deduct for untrained (low completion)
    if (trainings.length > 0) {
      const rate = completedTrainings / trainings.length;
      score -= Math.round((1 - rate) * 20);
    }
    // Deduct for damaged PPE
    score -= Math.min(ppes.filter(p => p.status === 'Yıprandı/Kayıp').length * 3, 15);
    return Math.max(0, Math.min(100, score));
  }, [openIncidents, highRisks, trainings, completedTrainings, ppes]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-emerald-500 to-teal-600';
    if (score >= 60) return 'from-amber-500 to-orange-600';
    return 'from-red-500 to-rose-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'İyi';
    if (score >= 60) return 'Orta';
    return 'Dikkat';
  };

  return (
    <PageTransition>
      <div className="space-y-4 sm:space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-sm sm:text-lg">Sistem genel bakış ve özet istatistikler.</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(Number(e.target.value))}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value={7}>Son 7 gün</option>
              <option value={30}>Son 30 gün</option>
              <option value={90}>Son 90 gün</option>
              <option value={365}>Son 1 yıl</option>
            </select>
            <button
              onClick={handleExportDashboard}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors text-sm font-medium whitespace-nowrap touch-manipulation"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">PDF İndir</span>
              <span className="sm:hidden">PDF</span>
            </button>
          </div>
        </div>

        {/* Welcome Banner with Safety Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-2xl p-6 shadow-xl"
        >
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-6 w-6 text-white/80" />
                <h2 className="text-xl font-display font-bold text-white">İSG Güvenlik Skoru</h2>
              </div>
              <p className="text-white/70 text-sm max-w-lg">
                Açık olaylar, yüksek riskler, eğitim tamamlama ve KKD durumuna göre hesaplanan genel güvenlik değerlendirmesi.
              </p>
              <div className="flex items-center gap-4 sm:gap-6 mt-4 overflow-x-auto pb-1">
                <div className="text-center shrink-0">
                  <p className="text-white/60 text-xs">Firmalar</p>
                  <p className="text-white text-lg sm:text-xl font-bold">{companies.length}</p>
                </div>
                <div className="w-px h-8 bg-white/20 shrink-0" />
                <div className="text-center shrink-0">
                  <p className="text-white/60 text-xs">Personel</p>
                  <p className="text-white text-lg sm:text-xl font-bold">{personnel.length}</p>
                </div>
                <div className="w-px h-8 bg-white/20 shrink-0" />
                <div className="text-center shrink-0">
                  <p className="text-white/60 text-xs">Açık Olay</p>
                  <p className="text-white text-lg sm:text-xl font-bold">{openIncidents}</p>
                </div>
                <div className="w-px h-8 bg-white/20 shrink-0" />
                <div className="text-center shrink-0">
                  <p className="text-white/60 text-xs">Yüksek Risk</p>
                  <p className="text-white text-lg sm:text-xl font-bold">{highRisks}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center shrink-0">
              <div className={`relative w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center border-4 ${
                safetyScore >= 80 ? 'border-emerald-400' : safetyScore >= 60 ? 'border-amber-400' : 'border-red-400'
              }`}>
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-white">{safetyScore}</p>
                  <p className="text-xs text-white/70">/100</p>
                </div>
              </div>
              <span className={`mt-2 text-sm font-semibold px-3 py-1 rounded-full ${
                safetyScore >= 80 ? 'bg-emerald-500/30 text-emerald-200' : 
                safetyScore >= 60 ? 'bg-amber-500/30 text-amber-200' : 
                'bg-red-500/30 text-red-200'
              }`}>
                {getScoreLabel(safetyScore)}
              </span>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full -mb-24" />
          <div className="absolute top-1/2 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mt-16" />
        </motion.div>

        {/* AI Insights */}
        {insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200 dark:border-amber-800/50 p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <h2 className="text-lg font-display font-semibold text-slate-900 dark:text-white">Akıllı Öneriler</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {insights.map((insight, idx) => (
                <Link
                  key={idx}
                  to={insight.action}
                  className={`flex items-start gap-3 p-4 bg-gradient-to-br ${insight.gradient} rounded-xl hover:shadow-md transition-all border border-white/50 dark:border-slate-700/50`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${
                    insight.type === 'danger' ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400' :
                    insight.type === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400' :
                    'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
                  }`}>
                    <insight.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white text-sm">{insight.title}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{insight.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action, idx) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link
                to={action.to}
                className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500 transition-all duration-300 group"
              >
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${action.gradient} text-white group-hover:scale-110 transition-transform shadow-sm`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  {action.label}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Gradient Stats Grid */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-4">
          {[
            { label: 'Toplam Personel', value: personnel.length, icon: Users, gradient: 'from-indigo-500 to-purple-600', subtext: `${activePersonnel} aktif` },
            { label: 'Açık Olaylar', value: openIncidents, icon: AlertTriangle, gradient: 'from-red-500 to-rose-600', subtext: `${criticalIncidents} yüksek öncelikli` },
            { label: 'Aktif KKD', value: activePPEs, icon: HardHat, gradient: 'from-emerald-500 to-teal-600', subtext: `${ppes.length} toplam zimmet` },
            { label: 'Yüksek Riskler', value: highRisks, icon: ShieldAlert, gradient: 'from-amber-500 to-orange-600', subtext: `${mediumRisks} orta, ${riskStats.low} düşük` },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className={`relative overflow-hidden bg-gradient-to-br ${stat.gradient} rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg hover:shadow-xl transition-all duration-300`}
            >
              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-white/80">{stat.label}</p>
                    <p className="text-2xl sm:text-3xl font-display font-bold text-white mt-0.5 sm:mt-1">{stat.value}</p>
                    <p className="text-[10px] sm:text-xs text-white/70 mt-0.5 sm:mt-1">{stat.subtext}</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-white/20 backdrop-blur-xl rounded-lg sm:rounded-xl">
                    <stat.icon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-white/10 rounded-full -mr-10 -mt-10 sm:-mr-16 sm:-mt-16" />
              <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-24 sm:h-24 bg-white/10 rounded-full -ml-8 -mb-8 sm:-ml-12 sm:-mb-12" />
            </motion.div>
          ))}
        </div>

        {/* Progress Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Training Completion */}
          <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-indigo-500" />
                <h3 className="font-display font-semibold text-slate-900 dark:text-white">Eğitim Tamamlama</h3>
              </div>
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {trainings.length > 0 ? Math.round((completedTrainings / trainings.length) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 mb-2">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-1000"
                style={{ width: `${trainings.length > 0 ? (completedTrainings / trainings.length) * 100 : 0}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>{completedTrainings} tamamlandı</span>
              <span>{trainings.length} toplam</span>
            </div>
          </div>

          {/* Risk Resolution */}
          <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-emerald-500" />
                <h3 className="font-display font-semibold text-slate-900 dark:text-white">Risk Giderilme</h3>
              </div>
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {risks.length > 0 ? Math.round((riskStats.resolved / risks.length) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 mb-2">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-1000"
                style={{ width: `${risks.length > 0 ? (riskStats.resolved / risks.length) * 100 : 0}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>{riskStats.resolved} giderildi</span>
              <span>{risks.length} toplam</span>
            </div>
          </div>

          {/* Incident Resolution */}
          <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-blue-500" />
                <h3 className="font-display font-semibold text-slate-900 dark:text-white">Olay Kapatma</h3>
              </div>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {incidents.length > 0 ? Math.round((incidents.filter(i => i.status === 'Kapalı').length / incidents.length) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 mb-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-1000"
                style={{ width: `${incidents.length > 0 ? (incidents.filter(i => i.status === 'Kapalı').length / incidents.length) * 100 : 0}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>{incidents.filter(i => i.status === 'Kapalı').length} kapatıldı</span>
              <span>{incidents.length} toplam</span>
            </div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Incident Severity Distribution */}
          <div className="bg-white dark:bg-[#09090b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 mb-4">
              <PieChartIcon className="h-5 w-5 text-slate-400" />
              <h2 className="text-lg font-display font-semibold text-slate-900 dark:text-white">Olay Şiddet Dağılımı</h2>
            </div>
            <div className="h-[240px] w-full">
              {incidents.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {severityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                        borderColor: isDarkMode ? '#1e293b' : '#e2e8f0',
                        borderRadius: '0.75rem',
                      }}
                      itemStyle={{ color: chartTextColor }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                  <p>Henüz olay kaydı yok</p>
                </div>
              )}
            </div>
          </div>

          {/* Incident Trends */}
          <div className="bg-white dark:bg-[#09090b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-slate-400" />
              <h2 className="text-lg font-display font-semibold text-slate-900 dark:text-white">Aylık Olay Trendi</h2>
            </div>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={incidentsByMonth}>
                  <defs>
                    <linearGradient id="dashIncGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#e2e8f0'} vertical={false} />
                  <XAxis dataKey="name" stroke={chartTextColor} tick={{ fill: chartTextColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis stroke={chartTextColor} tick={{ fill: chartTextColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDarkMode ? '#09090b' : '#ffffff',
                      borderColor: isDarkMode ? '#1e293b' : '#e2e8f0',
                      borderRadius: '0.75rem',
                    }}
                  />
                  <Area type="monotone" dataKey="incidents" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#dashIncGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="bg-white dark:bg-[#09090b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="h-5 w-5 text-slate-400" />
              <h2 className="text-lg font-display font-semibold text-slate-900 dark:text-white">Risk Dağılımı</h2>
            </div>
            <div className="h-[240px] w-full">
              {risks.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {riskDistribution.map((entry, index) => (
                        <Cell key={`risk-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                        borderColor: isDarkMode ? '#1e293b' : '#e2e8f0',
                        borderRadius: '0.75rem',
                      }}
                      itemStyle={{ color: chartTextColor }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                  <p>Henüz risk kaydı yok</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Incident Status */}
          <div className="bg-white dark:bg-[#09090b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 mb-4">
              <ListTodo className="h-5 w-5 text-slate-400" />
              <h2 className="text-lg font-display font-semibold text-slate-900 dark:text-white">Olay Durumları</h2>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#e2e8f0'} vertical={false} />
                  <XAxis dataKey="name" stroke={chartTextColor} tick={{ fill: chartTextColor }} axisLine={false} tickLine={false} />
                  <YAxis stroke={chartTextColor} tick={{ fill: chartTextColor }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: isDarkMode ? '#1e293b' : '#f1f5f9' }}
                    contentStyle={{ 
                      backgroundColor: isDarkMode ? '#09090b' : '#ffffff',
                      borderColor: isDarkMode ? '#1e293b' : '#e2e8f0',
                      borderRadius: '0.75rem',
                    }}
                  />
                  <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Training Completion */}
          <div className="bg-white dark:bg-[#09090b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="h-5 w-5 text-slate-400" />
              <h2 className="text-lg font-display font-semibold text-slate-900 dark:text-white">Eğitim Durumları</h2>
            </div>
            <div className="h-[200px] w-full">
              {trainings.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={trainingStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {trainingStats.map((entry, index) => (
                        <Cell key={`training-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                        borderColor: isDarkMode ? '#1e293b' : '#e2e8f0',
                        borderRadius: '0.75rem',
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                  <p>Henüz eğitim kaydı yok</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lists Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Upcoming Trainings */}
          <div className="bg-white dark:bg-[#09090b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-slate-400" />
                <h2 className="text-lg font-display font-semibold text-slate-900 dark:text-white">Yaklaşan Eğitimler</h2>
              </div>
              <Link to="/trainings" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                Tümünü Gör <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {trainings
                .filter(t => t.status === 'Planlandı')
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .slice(0, 4)
                .map(training => (
                <div key={training.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                      <GraduationCap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{training.title}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{training.trainer} • {training.participants.length} Katılımcı</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium px-3 py-1.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 rounded-full">
                    {new Date(training.date).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              ))}
              {trainings.filter(t => t.status === 'Planlandı').length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-slate-500 dark:text-slate-400">
                  <CheckCircle2 className="h-10 w-10 mb-2 text-slate-300" />
                  <p>Planlanmış eğitim bulunmuyor.</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Incidents */}
          <div className="bg-white dark:bg-[#09090b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileWarning className="h-5 w-5 text-slate-400" />
                <h2 className="text-lg font-display font-semibold text-slate-900 dark:text-white">Son Olay Bildirimleri</h2>
              </div>
              <Link to="/incidents" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                Tümünü Gör <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {incidents.slice(-4).reverse().map(incident => (
                <div key={incident.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      incident.severity === 'Kritik' ? 'bg-gradient-to-br from-red-500 to-rose-600' :
                      incident.severity === 'Yüksek' ? 'bg-gradient-to-br from-orange-500 to-red-600' :
                      incident.severity === 'Orta' ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                      'bg-gradient-to-br from-emerald-500 to-teal-600'
                    } shadow-sm`}>
                      <AlertTriangle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white truncate max-w-[200px]">{incident.title}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{incident.severity} • {new Date(incident.date).toLocaleDateString('tr-TR')}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    incident.status === 'Açık' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                    incident.status === 'İnceleniyor' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                  }`}>
                    {incident.status}
                  </span>
                </div>
              ))}
              {incidents.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-slate-500 dark:text-slate-400">
                  <CheckCircle2 className="h-10 w-10 mb-2 text-slate-300" />
                  <p>Henüz olay bildirimi yok.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Company Comparison Chart */}
        <div className="bg-white dark:bg-[#09090b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-display font-semibold text-slate-900 dark:text-white">Firma Karşılaştırması</h2>
          </div>
          <div className="h-[250px] w-full">
            {companyComparisonData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={companyComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#e2e8f0'} vertical={false} />
                  <XAxis dataKey="name" stroke={chartTextColor} tick={{ fill: chartTextColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis stroke={chartTextColor} tick={{ fill: chartTextColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                      borderColor: isDarkMode ? '#1e293b' : '#e2e8f0',
                      borderRadius: '0.75rem',
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar dataKey="personnel" name="Personel" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="incidents" name="Olay" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="trainings" name="Eğitim" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                <p>Firma verisi bulunmuyor</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};
