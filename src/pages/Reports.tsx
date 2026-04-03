import React, { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { PageTransition } from '../components/layout/PageTransition';
import { motion } from 'motion/react';
import { 
  BarChart3, PieChart as PieChartIcon, TrendingUp, Users, Building2, 
  AlertTriangle, GraduationCap, HardHat, ShieldAlert, Calendar, 
  Download, FileText, Filter, ChevronDown, ArrowUpRight, ArrowDownRight,
  Activity, CheckCircle2, Clock, XCircle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { Button } from '../components/ui/Button';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

export const Reports = () => {
  const { 
    companies, personnel, incidents, trainings, ppes, risks, isDarkMode 
  } = useStore();
  
  const [dateRange, setDateRange] = useState('30'); // days
  const [activeTab, setActiveTab] = useState('overview');

  const isDark = isDarkMode;
  const chartTextColor = isDark ? '#9ca3af' : '#4b5563';

  // Overview Stats
  const stats = useMemo(() => {
    const totalCompanies = companies.length;
    const totalPersonnel = personnel.length;
    const totalIncidents = incidents.length;
    const totalTrainings = trainings.length;
    const totalPPEs = ppes.length;
    const totalRisks = risks.length;
    
    const pendingIncidents = incidents.filter(i => i.status === 'İnceleniyor').length;
    const completedTrainings = trainings.filter(t => t.status === 'Tamamlandı').length;
    const activePPEs = ppes.filter(p => p.status === 'Aktif').length;
    const highRisks = risks.filter(r => {
      const score = (r.probability || 1) * (r.severity || 1);
      return score >= 13;
    }).length;

    return {
      totalCompanies, totalPersonnel, totalIncidents, totalTrainings, totalPPEs, totalRisks,
      pendingIncidents, completedTrainings, activePPEs, highRisks
    };
  }, [companies, personnel, incidents, trainings, ppes, risks]);

  // Incident Severity Distribution
  const incidentSeverityData = useMemo(() => {
    const severityCount = incidents.reduce((acc, incident) => {
      acc[incident.severity] = (acc[incident.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'Düşük', value: severityCount['Düşük'] || 0, color: '#10b981' },
      { name: 'Orta', value: severityCount['Orta'] || 0, color: '#f59e0b' },
      { name: 'Yüksek', value: severityCount['Yüksek'] || 0, color: '#ef4444' },
      { name: 'Kritik', value: severityCount['Kritik'] || 0, color: '#7f1d1d' },
    ].filter(d => d.value > 0);
  }, [incidents]);

  // Incident Status Distribution
  const incidentStatusData = useMemo(() => {
    const statusCount = incidents.reduce((acc, incident) => {
      acc[incident.status] = (acc[incident.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'Açık', value: statusCount['Açık'] || 0 },
      { name: 'İnceleniyor', value: statusCount['İnceleniyor'] || 0 },
      { name: 'Çözüldü', value: statusCount['Çözüldü'] || 0 },
      { name: 'Kapalı', value: statusCount['Kapalı'] || 0 },
    ].filter(d => d.value > 0);
  }, [incidents]);

  // Monthly Incident Trend
  const monthlyIncidentData = useMemo(() => {
    const months: Record<string, number> = {};
    const now = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });
      months[key] = 0;
    }

    incidents.forEach(incident => {
      const date = new Date(incident.date);
      const key = date.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });
      if (months.hasOwnProperty(key)) {
        months[key]++;
      }
    });

    return Object.entries(months).map(([name, value]) => ({ name, value }));
  }, [incidents]);

  // Training Status Distribution
  const trainingStatusData = useMemo(() => {
    const statusCount = trainings.reduce((acc, training) => {
      acc[training.status] = (acc[training.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'Planlandı', value: statusCount['Planlandı'] || 0 },
      { name: 'Devam Ediyor', value: statusCount['Devam Ediyor'] || 0 },
      { name: 'Tamamlandı', value: statusCount['Tamamlandı'] || 0 },
      { name: 'İptal', value: statusCount['İptal'] || 0 },
    ].filter(d => d.value > 0);
  }, [trainings]);

  // PPE Status Distribution
  const ppeStatusData = useMemo(() => {
    const statusCount = ppes.reduce((acc, ppe) => {
      acc[ppe.status] = (acc[ppe.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'Aktif', value: statusCount['Aktif'] || 0, color: '#10b981' },
      { name: 'Kullanımda', value: statusCount['Kullanımda'] || 0, color: '#3b82f6' },
      { name: 'Süresi Dolmuş', value: statusCount['Süresi Dolmuş'] || 0, color: '#ef4444' },
      { name: 'İade Edildi', value: statusCount['İade Edildi'] || 0, color: '#6b7280' },
    ].filter(d => d.value > 0);
  }, [ppes]);

  // Risk Score Distribution
  const riskDistributionData = useMemo(() => {
    const low = risks.filter(r => {
      const score = (r.probability || 1) * (r.severity || 1);
      return score <= 6;
    }).length;
    const medium = risks.filter(r => {
      const score = (r.probability || 1) * (r.severity || 1);
      return score > 6 && score <= 12;
    }).length;
    const high = risks.filter(r => {
      const score = (r.probability || 1) * (r.severity || 1);
      return score > 12;
    }).length;

    return [
      { name: 'Düşük (1-6)', value: low, color: '#10b981' },
      { name: 'Orta (7-12)', value: medium, color: '#f59e0b' },
      { name: 'Yüksek (13+)', value: high, color: '#ef4444' },
    ].filter(d => d.value > 0);
  }, [risks]);

  // Company Personnel Distribution
  const companyPersonnelData = useMemo(() => {
    return companies.map(company => ({
      name: company.name.length > 15 ? company.name.substring(0, 15) + '...' : company.name,
      personnel: personnel.filter(p => p.assignedCompanyId === company.id).length,
    })).filter(c => c.personnel > 0).slice(0, 8);
  }, [companies, personnel]);

  // Recent Activity Summary
  const recentActivity = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentIncidents = incidents.filter(i => new Date(i.createdAt) > thirtyDaysAgo).length;
    const recentTrainings = trainings.filter(t => new Date(t.createdAt) > thirtyDaysAgo).length;

    return { recentIncidents, recentTrainings };
  }, [incidents, trainings]);

  const handleExportPDF = () => {
    const data = {
      'Toplam Firma': stats.totalCompanies,
      'Toplam Personel': stats.totalPersonnel,
      'Toplam Olay': stats.totalIncidents,
      'Toplam Eğitim': stats.totalTrainings,
      'Toplam KKD': stats.totalPPEs,
      'Toplam Risk': stats.totalRisks,
    };
    exportToPDF('İSG Analiz Raporu', ['Metrik', 'Değer'], Object.entries(data).map(([k, v]) => [k, String(v)]), 'analiz-raporu');
    toast.success('PDF raporu indirildi');
  };

  const handleExportExcel = () => {
    const data = [
      { 'Metrik': 'Toplam Firma', 'Değer': stats.totalCompanies },
      { 'Metrik': 'Toplam Personel', 'Değer': stats.totalPersonnel },
      { 'Metrik': 'Toplam Olay', 'Değer': stats.totalIncidents },
      { 'Metrik': 'Toplam Eğitim', 'Değer': stats.totalTrainings },
      { 'Metrik': 'Bekleyen Olay', 'Değer': stats.pendingIncidents },
      { 'Metrik': 'Tamamlanan Eğitim', 'Değer': stats.completedTrainings },
    ];
    exportToExcel(data, 'analiz-raporu');
    toast.success('Excel raporu indirildi');
  };

  const StatCard = ({ 
    label, value, icon: Icon, color, trend, subtext 
  }: { 
    label: string; 
    value: number; 
    icon: React.ElementType; 
    color: string;
    trend?: 'up' | 'down' | 'neutral';
    subtext?: string;
  }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-2xl font-display font-bold text-slate-900 dark:text-white mt-1">
            {value.toLocaleString('tr-TR')}
          </p>
          {subtext && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtext}</p>
          )}
        </div>
        <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}15` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-3">
          {trend === 'up' ? (
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          ) : trend === 'down' ? (
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          ) : null}
          <span className={`text-xs font-medium ${
            trend === 'up' ? 'text-emerald-500' : 
            trend === 'down' ? 'text-red-500' : 'text-slate-400'
          }`}>
            {trend === 'up' ? 'Artış' : trend === 'down' ? 'Azalış' : 'Değişim yok'}
          </span>
        </div>
      )}
    </motion.div>
  );

  return (
    <PageTransition>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
              Analiz ve Raporlar
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-lg">
              İSG verilerinin kapsamlı analizi ve istatistikleri.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            >
              <option value="7">Son 7 gün</option>
              <option value="30">Son 30 gün</option>
              <option value="90">Son 90 gün</option>
              <option value="365">Son 1 yıl</option>
            </select>
            <Button variant="secondary" onClick={handleExportExcel} className="gap-2">
              <Download className="h-4 w-4" /> Excel
            </Button>
            <Button variant="secondary" onClick={handleExportPDF} className="gap-2">
              <FileText className="h-4 w-4" /> PDF
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
          {[
            { id: 'overview', label: 'Genel Bakış', icon: BarChart3 },
            { id: 'incidents', label: 'Olay Analizi', icon: AlertTriangle },
            { id: 'trainings', label: 'Eğitim Raporu', icon: GraduationCap },
            { id: 'risks', label: 'Risk Değerlendirme', icon: ShieldAlert },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'text-indigo-600 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                  : 'text-slate-500 border-transparent hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                label="Toplam Firma" 
                value={stats.totalCompanies} 
                icon={Building2} 
                color="#6366f1"
                subtext={`${personnel.length} personel`}
              />
              <StatCard 
                label="Toplam Personel" 
                value={stats.totalPersonnel} 
                icon={Users} 
                color="#8b5cf6"
                subtext={`${stats.totalCompanies} firmada`}
              />
              <StatCard 
                label="Toplam Olay" 
                value={stats.totalIncidents} 
                icon={AlertTriangle} 
                color="#ef4444"
                trend="up"
                subtext={`${stats.pendingIncidents} beklemede`}
              />
              <StatCard 
                label="Toplam Eğitim" 
                value={stats.totalTrainings} 
                icon={GraduationCap} 
                color="#10b981"
                subtext={`${stats.completedTrainings} tamamlandı`}
              />
              <StatCard 
                label="Toplam KKD" 
                value={stats.totalPPEs} 
                icon={HardHat} 
                color="#f59e0b"
                subtext={`${stats.activePPEs} aktif`}
              />
              <StatCard 
                label="Toplam Risk" 
                value={stats.totalRisks} 
                icon={ShieldAlert} 
                color="#ec4899"
                subtext={`${stats.highRisks} yüksek risk`}
              />
              <StatCard 
                label="Son 30 Gün Olay" 
                value={recentActivity.recentIncidents} 
                icon={Activity} 
                color="#6366f1"
              />
              <StatCard 
                label="Son 30 Gün Eğitim" 
                value={recentActivity.recentTrainings} 
                icon={Calendar} 
                color="#3b82f6"
              />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Monthly Incident Trend */}
              <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white">
                    Aylık Olay Trendi
                  </h3>
                  <TrendingUp className="h-5 w-5 text-slate-400" />
                </div>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyIncidentData}>
                      <defs>
                        <linearGradient id="incidentGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                      <XAxis dataKey="name" stroke={chartTextColor} tick={{ fill: chartTextColor }} />
                      <YAxis stroke={chartTextColor} tick={{ fill: chartTextColor }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: isDark ? '#1e293b' : '#fff',
                          border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                          borderRadius: '0.75rem',
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#incidentGradient)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Company Personnel Distribution */}
              <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white">
                    Firma Başına Personel
                  </h3>
                  <Building2 className="h-5 w-5 text-slate-400" />
                </div>
                <div className="h-[250px]">
                  {companyPersonnelData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={companyPersonnelData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} horizontal={false} />
                        <XAxis type="number" stroke={chartTextColor} tick={{ fill: chartTextColor }} />
                        <YAxis dataKey="name" type="category" stroke={chartTextColor} tick={{ fill: chartTextColor, fontSize: 12 }} width={100} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: isDark ? '#1e293b' : '#fff',
                            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                            borderRadius: '0.75rem',
                          }}
                        />
                        <Bar dataKey="personnel" fill="#6366f1" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                      <p>Veri bulunmamaktadır</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Incidents Tab */}
        {activeTab === 'incidents' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Incident Severity */}
            <div className="bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-2xl rounded-2xl p-5 border border-slate-200/60 dark:border-slate-800/60">
              <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white mb-4">
                Olay Şiddet Dağılımı
              </h3>
              <div className="h-[300px]">
                {incidentSeverityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={incidentSeverityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {incidentSeverityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                    <p>Henüz olay kaydı bulunmamaktadır</p>
                  </div>
                )}
              </div>
            </div>

            {/* Incident Status */}
            <div className="bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-2xl rounded-2xl p-5 border border-slate-200/60 dark:border-slate-800/60">
              <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white mb-4">
                Olay Durum Dağılımı
              </h3>
              <div className="h-[300px]">
                {incidentStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={incidentStatusData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} vertical={false} />
                      <XAxis dataKey="name" stroke={chartTextColor} tick={{ fill: chartTextColor }} />
                      <YAxis stroke={chartTextColor} tick={{ fill: chartTextColor }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: isDark ? '#1e293b' : '#fff',
                          borderRadius: '0.75rem',
                        }}
                      />
                      <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                    <p>Henüz olay kaydı bulunmamaktadır</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Trainings Tab */}
        {activeTab === 'trainings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Training Status */}
            <div className="bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-2xl rounded-2xl p-5 border border-slate-200/60 dark:border-slate-800/60">
              <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white mb-4">
                Eğitim Durumları
              </h3>
              <div className="h-[300px]">
                {trainingStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={trainingStatusData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {trainingStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                    <p>Henüz eğitim kaydı bulunmamaktadır</p>
                  </div>
                )}
              </div>
            </div>

            {/* Training Stats */}
            <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white mb-4">
                Eğitim İstatistikleri
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Tamamlanan</p>
                      <p className="text-sm text-slate-500">Başarıyla biten eğitimler</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {stats.completedTrainings}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                      <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Planlanan</p>
                      <p className="text-sm text-slate-500">Yaklaşan eğitimler</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {trainings.filter(t => t.status === 'Planlandı').length}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Aktif</p>
                      <p className="text-sm text-slate-500">Şu an devam eden</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {trainings.filter(t => t.status === 'Planlandı').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Risks Tab */}
        {activeTab === 'risks' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Risk Distribution */}
            <div className="bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-2xl rounded-2xl p-5 border border-slate-200/60 dark:border-slate-800/60">
              <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white mb-4">
                Risk Skor Dağılımı
              </h3>
              <div className="h-[300px]">
                {riskDistributionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {riskDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                    <p>Henüz risk kaydı bulunmamaktadır</p>
                  </div>
                )}
              </div>
            </div>

            {/* PPE Status */}
            <div className="bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-2xl rounded-2xl p-5 border border-slate-200/60 dark:border-slate-800/60">
              <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white mb-4">
                KKD Durum Dağılımı
              </h3>
              <div className="h-[300px]">
                {ppeStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ppeStatusData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {ppeStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                    <p>Henüz KKD kaydı bulunmamaktadır</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
};
