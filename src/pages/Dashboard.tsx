import React, { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { 
  Building2, Users, AlertTriangle, CheckCircle, GraduationCap, HardHat, ShieldAlert, 
  TrendingUp, TrendingDown, Calendar, Activity, FileWarning, Clock, CheckCircle2,
  ArrowRight, BarChart3, PieChart as PieChartIcon, ListTodo, Download, Filter,
  Sparkles, Target, Zap, TrendingUpIcon, Bell, ArrowUpRight, ArrowDownRight,
  Lightbulb, AlertTriangle as Warning, Info, MoreHorizontal, ChevronDown, RefreshCw
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

const StatCard = ({ 
  label, 
  value, 
  icon: Icon, 
  color, 
  trend, 
  trendValue,
  index,
  subtitle
}: { 
  label: string; 
  value: number; 
  icon: React.ElementType; 
  color: string; 
  trend?: 'up' | 'down' | 'neutral'; 
  trendValue?: string;
  index: number;
  subtitle?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className="group relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-500 transition-all duration-300 overflow-hidden"
  >
    <div className={`absolute top-0 right-0 w-32 h-32 ${color.replace('text-', 'bg-')} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-full blur-3xl`} />
    <div className="relative flex items-center gap-5">
      <div className={`p-4 rounded-2xl ${color.replace('text-', 'bg-')}/20 ${color} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm`}>
        <Icon className="h-7 w-7" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          {trend && trend !== 'neutral' && (
            <span className={`flex items-center text-xs ${trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
              {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            </span>
          )}
        </div>
        <p className="text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight">{value}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        {trendValue && (
          <p className={`text-xs mt-1 ${trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-slate-500'}`}>
            {trendValue}
          </p>
        )}
      </div>
    </div>
  </motion.div>
);

export const Dashboard = () => {
  const { companies, personnel, incidents, trainings, ppes, risks, isDarkMode } = useStore();
  const [dateRange, setDateRange] = useState(30); // days

  // Calculate statistics
  const openIncidents = incidents.filter(i => i.status !== 'Kapalı').length;
  const activePPEs = ppes.filter(p => p.status === 'Aktif').length;
  const openRisks = risks.filter(r => r.status !== 'Giderildi');
  const highRisks = openRisks.filter(r => r.score > 12).length;
  const mediumRisks = openRisks.filter(r => r.score > 6 && r.score <= 12).length;
  const completedTrainings = trainings.filter(t => t.status === 'Tamamlandı').length;
  const upcomingTrainings = trainings.filter(t => t.status === 'Planlandı').length;

  // Risk stats for charts
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
    const total = trainings.length || 1;
    const completed = completedTrainings;
    const planned = upcomingTrainings;
    const cancelled = trainings.filter(t => t.status === 'İptal').length;
    return [
      { name: 'Tamamlandı', value: completed, color: '#10b981' },
      { name: 'Planlandı', value: planned, color: '#6366f1' },
      { name: 'İptal', value: cancelled, color: '#ef4444' },
    ];
  }, [trainings, completedTrainings, upcomingTrainings]);

  // Quick actions items
  const quickActions = [
    { label: 'Yeni Olay Bildir', icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', to: '/incidents/new' },
    { label: 'Risk Ekle', icon: ShieldAlert, color: 'text-orange-600 dark:text-orange-400', to: '/risks' },
    { label: 'Eğitim Planla', icon: GraduationCap, color: 'text-blue-600 dark:text-blue-400', to: '/trainings' },
    { label: 'Personel Ekle', icon: Users, color: 'text-indigo-600 dark:text-indigo-400', to: '/personnel' },
  ];

  const stats = [
    { 
      label: 'Toplam Personel', 
      value: personnel.length, 
      icon: Users, 
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      subtitle: `${companies.length} firmaya atanmış`,
      trend: 'up' as const 
    },
    { 
      label: 'Açık Olaylar', 
      value: openIncidents, 
      icon: AlertTriangle, 
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      subtitle: `${incidents.filter(i => i.severity === 'Kritik' || i.severity === 'Yüksek').length} yüksek öncelikli`,
      trend: openIncidents > 0 ? 'down' as const : 'neutral' as const,
      trendValue: openIncidents > 0 ? 'Acil çözüm gerekiyor' : undefined
    },
    { 
      label: 'Aktif KKD Zimmeti', 
      value: activePPEs, 
      icon: HardHat, 
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      subtitle: `${ppes.filter(p => p.status === 'Yıprandı/Kayıp').length} yıpranmış/kayıp`,
    },
    { 
      label: 'Yüksek Riskler', 
      value: highRisks, 
      icon: ShieldAlert, 
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      subtitle: `${mediumRisks} orta, ${riskStats.low} düşük risk`,
      trend: highRisks > 0 ? 'down' as const : 'neutral' as const,
      trendValue: highRisks > 0 ? 'Öncelikli müdahale' : undefined
    },
  ];

  // Prepare data for charts
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
    const items = [];
    
    if (highRisks > 0) {
      items.push({
        type: 'warning',
        icon: ShieldAlert,
        title: `${highRisks} Yüksek Risk Tespit Edildi`,
        description: 'Öncelikli risk değerlendirmesi ve önlem alınması gerekiyor.',
        action: '/risks'
      });
    }
    
    if (openIncidents > 3) {
      items.push({
        type: 'danger',
        icon: AlertTriangle,
        title: `${openIncidents} Açık Olay Var`,
        description: 'Çözüm bekleyen olay sayısı yüksek. İnceleme başlatılması önerilir.',
        action: '/incidents'
      });
    }
    
    const completionRate = trainings.length > 0 ? (completedTrainings / trainings.length) * 100 : 0;
    if (completionRate < 50 && trainings.length > 0) {
      items.push({
        type: 'info',
        icon: GraduationCap,
        title: `Eğitim Tamamlama Oranı %${completionRate.toFixed(0)}`,
        description: 'Eğitim tamamlama oranı düşük. Hatırlatmalar gönderilmesi önerilir.',
        action: '/trainings'
      });
    }
    
    const expiringPPEs = ppes.filter(p => p.status === 'Aktif').length;
    if (expiringPPEs > 0) {
      items.push({
        type: 'warning',
        icon: HardHat,
        title: `${expiringPPEs} KKD Kontrol Gerekiyor`,
        description: 'KKD zimmetlerinin periyodik kontrolü ve yenilenmesi gerekiyor.',
        action: '/ppe'
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

  return (
    <PageTransition>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-lg">Sistem genel bakış ve özet istatistikler.</p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(Number(e.target.value))}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value={7}>Son 7 gün</option>
              <option value={30}>Son 30 gün</option>
              <option value={90}>Son 90 gün</option>
              <option value={365}>Son 1 yıl</option>
            </select>
            <button
              onClick={handleExportDashboard}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors text-sm font-medium"
            >
              <Download className="h-4 w-4" />
              PDF İndir
            </button>
          </div>
        </div>

        {/* AI Insights */}
        {insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200 dark:border-amber-800/50 p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <h2 className="text-lg font-display font-semibold text-slate-900 dark:text-white">AI Insights & Öneriler</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {insights.map((insight, idx) => (
                <Link
                  key={idx}
                  to={insight.action}
                  className="flex items-start gap-3 p-4 bg-white/60 dark:bg-slate-800/60 rounded-xl hover:shadow-md transition-all"
                >
                  <div className={`p-2 rounded-lg ${
                    insight.type === 'danger' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                    insight.type === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                    'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    <insight.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white text-sm">{insight.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{insight.description}</p>
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
                <div className={`p-2 rounded-xl ${action.color.replace('text-', 'bg-')}/20 ${action.color} group-hover:scale-110 transition-transform shadow-sm`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  {action.label}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, idx) => (
            <StatCard 
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              trend={stat.trend}
              trendValue={stat.trendValue}
              subtitle={stat.subtitle}
              index={idx}
            />
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Incident Severity Distribution */}
          <div className="bg-white dark:bg-[#09090b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 mb-5">
              <PieChartIcon className="h-5 w-5 text-slate-500" />
              <h2 className="text-lg font-display font-semibold text-slate-900 dark:text-white">Olay Şiddet Dağılımı</h2>
            </div>
            <div className="h-[250px] w-full">
              {incidents.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
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
                        backgroundColor: isDarkMode ? '#09090b' : '#ffffff',
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
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 className="h-5 w-5 text-slate-500" />
              <h2 className="text-lg font-display font-semibold text-slate-900 dark:text-white">Aylık Olay Trendi</h2>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={incidentsByMonth}>
                  <defs>
                    <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
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
                  <Area type="monotone" dataKey="incidents" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorIncidents)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="bg-white dark:bg-[#09090b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 mb-5">
              <ShieldAlert className="h-5 w-5 text-slate-500" />
              <h2 className="text-lg font-display font-semibold text-slate-900 dark:text-white">Risk Dağılımı</h2>
            </div>
            <div className="h-[250px] w-full">
              {risks.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
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
                        backgroundColor: isDarkMode ? '#09090b' : '#ffffff',
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

        {/* Charts Row 2 & Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Incident Status */}
          <div className="bg-white dark:bg-[#09090b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 mb-5">
              <ListTodo className="h-5 w-5 text-slate-500" />
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
            <div className="flex items-center gap-2 mb-5">
              <GraduationCap className="h-5 w-5 text-slate-500" />
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
                      innerRadius={50}
                      outerRadius={80}
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
                        backgroundColor: isDarkMode ? '#09090b' : '#ffffff',
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
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-slate-500" />
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
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                      <GraduationCap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
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
          <div className="bg-white dark:bg-[#09090b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <FileWarning className="h-5 w-5 text-slate-500" />
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
                      incident.severity === 'Kritik' ? 'bg-red-100 dark:bg-red-900/30' :
                      incident.severity === 'Yüksek' ? 'bg-orange-100 dark:bg-orange-900/30' :
                      incident.severity === 'Orta' ? 'bg-amber-100 dark:bg-amber-900/30' :
                      'bg-emerald-100 dark:bg-emerald-900/30'
                    }`}>
                      <AlertTriangle className={`h-5 w-5 ${
                        incident.severity === 'Kritik' ? 'text-red-600 dark:text-red-400' :
                        incident.severity === 'Yüksek' ? 'text-orange-600 dark:text-orange-400' :
                        incident.severity === 'Orta' ? 'text-amber-600 dark:text-amber-400' :
                        'text-emerald-600 dark:text-emerald-400'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white truncate max-w-[200px]">{incident.title}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{incident.severity} Öncelik • {new Date(incident.date).toLocaleDateString('tr-TR')}</p>
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
          <div className="flex items-center gap-2 mb-5">
            <Building2 className="h-5 w-5 text-slate-500" />
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
                      backgroundColor: isDarkMode ? '#09090b' : '#ffffff',
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
