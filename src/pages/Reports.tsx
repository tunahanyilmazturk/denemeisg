import React, { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { PageTransition } from '../components/layout/PageTransition';
import { motion } from 'motion/react';
import {
  BarChart3, PieChart as PieChartIcon, TrendingUp, Users, Building2,
  AlertTriangle, GraduationCap, HardHat, ShieldAlert, Calendar,
  Download, FileText, Filter, ChevronDown, ArrowUpRight, ArrowDownRight,
  Activity, CheckCircle2, Clock, XCircle, Target, Zap, Package, UserCheck,
  AlertCircle, Award, TrendingDown, Eye, Grid3x3
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
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');

  const isDark = isDarkMode;
  const chartTextColor = isDark ? '#9ca3af' : '#4b5563';

  // Filter data by selected company
  const filteredData = useMemo(() => {
    if (selectedCompanyId === 'all') {
      return { personnel, incidents, trainings, ppes, risks };
    }
    return {
      personnel: personnel.filter(p => p.assignedCompanyId === selectedCompanyId),
      incidents: incidents.filter(i => i.companyId === selectedCompanyId),
      trainings: trainings.filter(t => {
        const companyPersonnel = personnel.filter(p => p.assignedCompanyId === selectedCompanyId).map(p => p.id);
        return t.participants.some(pId => companyPersonnel.includes(pId));
      }),
      ppes: ppes.filter(p => {
        const person = personnel.find(per => per.id === p.personnelId);
        return person?.assignedCompanyId === selectedCompanyId;
      }),
      risks: risks // Risks are not company-specific in current schema
    };
  }, [selectedCompanyId, personnel, incidents, trainings, ppes, risks]);

  // Overview Stats
  const stats = useMemo(() => {
    const totalCompanies = companies.length;
    const totalPersonnel = filteredData.personnel.length;
    const totalIncidents = filteredData.incidents.length;
    const totalTrainings = filteredData.trainings.length;
    const totalPPEs = filteredData.ppes.length;
    const totalRisks = filteredData.risks.length;
    
    const pendingIncidents = filteredData.incidents.filter(i => i.status === 'İnceleniyor').length;
    const completedTrainings = filteredData.trainings.filter(t => t.status === 'Tamamlandı').length;
    const activePPEs = filteredData.ppes.filter(p => p.status === 'Aktif').length;
    const highRisks = filteredData.risks.filter(r => {
      const score = (r.probability || 1) * (r.severity || 1);
      return score >= 13;
    }).length;

    const criticalIncidents = filteredData.incidents.filter(i => i.severity === 'Kritik').length;
    const openIncidents = filteredData.incidents.filter(i => i.status === 'Açık').length;
    const closedIncidents = filteredData.incidents.filter(i => i.status === 'Kapalı').length;
    const activePersonnel = filteredData.personnel.filter(p => p.status === 'Aktif' || !p.status).length;

    return {
      totalCompanies, totalPersonnel, totalIncidents, totalTrainings, totalPPEs, totalRisks,
      pendingIncidents, completedTrainings, activePPEs, highRisks, criticalIncidents,
      openIncidents, closedIncidents, activePersonnel
    };
  }, [companies, filteredData]);

  // Incident Severity Distribution
  const incidentSeverityData = useMemo(() => {
    const severityCount = filteredData.incidents.reduce((acc, incident) => {
      acc[incident.severity] = (acc[incident.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'Düşük', value: severityCount['Düşük'] || 0, color: '#10b981' },
      { name: 'Orta', value: severityCount['Orta'] || 0, color: '#f59e0b' },
      { name: 'Yüksek', value: severityCount['Yüksek'] || 0, color: '#ef4444' },
      { name: 'Kritik', value: severityCount['Kritik'] || 0, color: '#7f1d1d' },
    ].filter(d => d.value > 0);
  }, [filteredData.incidents]);

  // Incident Status Distribution
  const incidentStatusData = useMemo(() => {
    const statusCount = filteredData.incidents.reduce((acc, incident) => {
      acc[incident.status] = (acc[incident.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'Açık', value: statusCount['Açık'] || 0 },
      { name: 'İnceleniyor', value: statusCount['İnceleniyor'] || 0 },
      { name: 'Kapalı', value: statusCount['Kapalı'] || 0 },
    ].filter(d => d.value > 0);
  }, [filteredData.incidents]);

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

    filteredData.incidents.forEach(incident => {
      const date = new Date(incident.date);
      const key = date.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });
      if (months.hasOwnProperty(key)) {
        months[key]++;
      }
    });

    return Object.entries(months).map(([name, value]) => ({ name, value }));
  }, [filteredData.incidents]);

  // Training Status Distribution
  const trainingStatusData = useMemo(() => {
    const statusCount = filteredData.trainings.reduce((acc, training) => {
      acc[training.status] = (acc[training.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'Planlandı', value: statusCount['Planlandı'] || 0 },
      { name: 'Tamamlandı', value: statusCount['Tamamlandı'] || 0 },
      { name: 'İptal', value: statusCount['İptal'] || 0 },
    ].filter(d => d.value > 0);
  }, [filteredData.trainings]);

  // PPE Status Distribution
  const ppeStatusData = useMemo(() => {
    const statusCount = filteredData.ppes.reduce((acc, ppe) => {
      acc[ppe.status] = (acc[ppe.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'Aktif', value: statusCount['Aktif'] || 0, color: '#10b981' },
      { name: 'İade Edildi', value: statusCount['İade Edildi'] || 0, color: '#6b7280' },
      { name: 'Yıprandı/Kayıp', value: statusCount['Yıprandı/Kayıp'] || 0, color: '#ef4444' },
    ].filter(d => d.value > 0);
  }, [filteredData.ppes]);

  // Risk Score Distribution
  const riskDistributionData = useMemo(() => {
    const low = filteredData.risks.filter(r => {
      const score = (r.probability || 1) * (r.severity || 1);
      return score <= 6;
    }).length;
    const medium = filteredData.risks.filter(r => {
      const score = (r.probability || 1) * (r.severity || 1);
      return score > 6 && score <= 12;
    }).length;
    const high = filteredData.risks.filter(r => {
      const score = (r.probability || 1) * (r.severity || 1);
      return score > 12;
    }).length;

    return [
      { name: 'Düşük (1-6)', value: low, color: '#10b981' },
      { name: 'Orta (7-12)', value: medium, color: '#f59e0b' },
      { name: 'Yüksek (13+)', value: high, color: '#ef4444' },
    ].filter(d => d.value > 0);
  }, [filteredData.risks]);

  // Company Personnel Distribution
  const companyPersonnelData = useMemo(() => {
    if (selectedCompanyId !== 'all') {
      const company = companies.find(c => c.id === selectedCompanyId);
      if (!company) return [];
      
      const roleDistribution = filteredData.personnel.reduce((acc, p) => {
        const role = p.role || 'Diğer';
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(roleDistribution)
        .map(([name, count]) => ({ name, personnel: count as number }))
        .sort((a, b) => (b.personnel as number) - (a.personnel as number))
        .slice(0, 8);
    }

    return companies.map(company => ({
      name: company.name.length > 15 ? company.name.substring(0, 15) + '...' : company.name,
      personnel: personnel.filter(p => p.assignedCompanyId === company.id).length,
    })).filter(c => c.personnel > 0).slice(0, 8);
  }, [companies, personnel, selectedCompanyId, filteredData.personnel]);

  // Recent Activity Summary
  const recentActivity = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentIncidents = filteredData.incidents.filter(i => new Date(i.createdAt) > thirtyDaysAgo).length;
    const recentTrainings = filteredData.trainings.filter(t => new Date(t.createdAt) > thirtyDaysAgo).length;

    return { recentIncidents, recentTrainings };
  }, [filteredData.incidents, filteredData.trainings]);

  // Personnel Role Distribution
  const personnelRoleData = useMemo(() => {
    const roleCount = filteredData.personnel.reduce((acc, p) => {
      const role = p.role || 'Diğer';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(roleCount)
      .map(([name, count]) => ({ name, value: count as number }))
      .sort((a, b) => (b.value as number) - (a.value as number))
      .slice(0, 8);
  }, [filteredData.personnel]);

  // Risk Matrix Data
  const riskMatrixData = useMemo(() => {
    const matrix: { probability: number; severity: number; count: number }[] = [];
    
    for (let prob = 1; prob <= 5; prob++) {
      for (let sev = 1; sev <= 5; sev++) {
        const count = filteredData.risks.filter(r => r.probability === prob && r.severity === sev).length;
        if (count > 0) {
          matrix.push({ probability: prob, severity: sev, count });
        }
      }
    }
    
    return matrix;
  }, [filteredData.risks]);

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

  const GradientStatCard = ({
    label, value, icon: Icon, gradient, trend, subtext
  }: {
    label: string;
    value: number;
    icon: React.ElementType;
    gradient: string;
    trend?: 'up' | 'down' | 'neutral';
    subtext?: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden bg-gradient-to-br ${gradient} rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300`}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-white/80">{label}</p>
            <p className="text-3xl font-display font-bold text-white mt-1">
              {value.toLocaleString('tr-TR')}
            </p>
            {subtext && (
              <p className="text-xs text-white/70 mt-1">{subtext}</p>
            )}
          </div>
          <div className="p-3 bg-white/20 backdrop-blur-xl rounded-xl">
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-3">
            {trend === 'up' ? (
              <ArrowUpRight className="h-4 w-4 text-white" />
            ) : trend === 'down' ? (
              <ArrowDownRight className="h-4 w-4 text-white" />
            ) : null}
            <span className="text-xs font-medium text-white/90">
              {trend === 'up' ? 'Artış trendi' : trend === 'down' ? 'Azalış trendi' : 'Sabit'}
            </span>
          </div>
        )}
      </div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
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
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            >
              <option value="all">Tüm Firmalar</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
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
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          {[
            { id: 'overview', label: 'Genel Bakış', icon: BarChart3 },
            { id: 'incidents', label: 'Olay Analizi', icon: AlertTriangle },
            { id: 'trainings', label: 'Eğitim Raporu', icon: GraduationCap },
            { id: 'personnel', label: 'Personel Analizi', icon: Users },
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
              <GradientStatCard
                label="Toplam Personel"
                value={stats.totalPersonnel}
                icon={Users}
                gradient="from-indigo-500 to-purple-600"
                subtext={stats.activePersonnel > 0 ? `${stats.activePersonnel} aktif` : undefined}
              />
              <GradientStatCard
                label="Toplam Olay"
                value={stats.totalIncidents}
                icon={AlertTriangle}
                gradient="from-red-500 to-rose-600"
                trend={stats.openIncidents > 0 ? 'up' : 'neutral'}
                subtext={`${stats.openIncidents} açık`}
              />
              <GradientStatCard
                label="Toplam Eğitim"
                value={stats.totalTrainings}
                icon={GraduationCap}
                gradient="from-emerald-500 to-teal-600"
                subtext={`${stats.completedTrainings} tamamlandı`}
              />
              <GradientStatCard
                label="Toplam Risk"
                value={stats.totalRisks}
                icon={ShieldAlert}
                gradient="from-amber-500 to-orange-600"
                trend={stats.highRisks > 5 ? 'up' : 'neutral'}
                subtext={`${stats.highRisks} yüksek`}
              />
              <GradientStatCard
                label="Kritik Olay"
                value={stats.criticalIncidents}
                icon={AlertCircle}
                gradient="from-rose-600 to-red-700"
                trend={stats.criticalIncidents > 0 ? 'up' : 'down'}
              />
              <GradientStatCard
                label="Aktif KKD"
                value={stats.activePPEs}
                icon={HardHat}
                gradient="from-blue-500 to-cyan-600"
                subtext={`${stats.totalPPEs} toplam`}
              />
              <GradientStatCard
                label="Son 30 Gün Olay"
                value={recentActivity.recentIncidents}
                icon={Activity}
                gradient="from-violet-500 to-purple-600"
              />
              <GradientStatCard
                label="Son 30 Gün Eğitim"
                value={recentActivity.recentTrainings}
                icon={Calendar}
                gradient="from-sky-500 to-blue-600"
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
                    {selectedCompanyId === 'all' ? 'Firma Başına Personel' : 'Role Göre Personel Dağılımı'}
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
          <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <GradientStatCard label="Toplam Olay" value={stats.totalIncidents} icon={AlertTriangle} gradient="from-red-500 to-rose-600" />
              <GradientStatCard label="Açık Olaylar" value={stats.openIncidents} icon={AlertCircle} gradient="from-amber-500 to-orange-600" />
              <GradientStatCard label="İncelenen" value={stats.pendingIncidents} icon={Eye} gradient="from-blue-500 to-indigo-600" />
              <GradientStatCard label="Kritik Olay" value={stats.criticalIncidents} icon={Zap} gradient="from-rose-600 to-red-700" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Incident Severity */}
              <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white">
                    Olay Şiddet Dağılımı
                  </h3>
                  <PieChartIcon className="h-5 w-5 text-slate-400" />
                </div>
                <div className="h-[280px]">
                  {incidentSeverityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={incidentSeverityData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={95}
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
              <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white">
                    Olay Durum Dağılımı
                  </h3>
                  <BarChart3 className="h-5 w-5 text-slate-400" />
                </div>
                <div className="h-[280px]">
                  {incidentStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={incidentStatusData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} vertical={false} />
                        <XAxis dataKey="name" stroke={chartTextColor} tick={{ fill: chartTextColor }} />
                        <YAxis stroke={chartTextColor} tick={{ fill: chartTextColor }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? '#1e293b' : '#fff',
                            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
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

              {/* Monthly Trend */}
              <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2">
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
                        <linearGradient id="incidentTrendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                      <XAxis dataKey="name" stroke={chartTextColor} tick={{ fill: chartTextColor }} />
                      <YAxis stroke={chartTextColor} tick={{ fill: chartTextColor }} />
                      <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '0.75rem' }} />
                      <Area type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#incidentTrendGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trainings Tab */}
        {activeTab === 'trainings' && (
          <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <GradientStatCard label="Toplam Eğitim" value={stats.totalTrainings} icon={GraduationCap} gradient="from-emerald-500 to-teal-600" />
              <GradientStatCard label="Tamamlanan" value={stats.completedTrainings} icon={CheckCircle2} gradient="from-green-500 to-emerald-600" />
              <GradientStatCard label="Planlanan" value={filteredData.trainings.filter(t => t.status === 'Planlandı').length} icon={Clock} gradient="from-amber-500 to-orange-600" />
              <GradientStatCard label="İptal Edilen" value={filteredData.trainings.filter(t => t.status === 'İptal').length} icon={XCircle} gradient="from-red-500 to-rose-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Training Status */}
              <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white">
                    Eğitim Durumları
                  </h3>
                  <PieChartIcon className="h-5 w-5 text-slate-400" />
                </div>
                <div className="h-[280px]">
                  {trainingStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={trainingStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={95}
                          paddingAngle={5}
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
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Tamamlanan</p>
                        <p className="text-sm text-slate-500">Başarıyla biten</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {stats.completedTrainings}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
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
                      {filteredData.trainings.filter(t => t.status === 'Planlandı').length}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">İptal Edilen</p>
                        <p className="text-sm text-slate-500">İptal olan eğitimler</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {filteredData.trainings.filter(t => t.status === 'İptal').length}
                    </span>
                  </div>

                  {stats.totalTrainings > 0 && (
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                          <Award className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">Tamamlanma Oranı</p>
                          <p className="text-sm text-slate-500">Başarı yüzdesi</p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        %{Math.round((stats.completedTrainings / stats.totalTrainings) * 100)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Personnel Tab */}
        {activeTab === 'personnel' && (
          <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <GradientStatCard label="Toplam Personel" value={stats.totalPersonnel} icon={Users} gradient="from-indigo-500 to-purple-600" />
              <GradientStatCard label="Aktif" value={stats.activePersonnel} icon={UserCheck} gradient="from-emerald-500 to-teal-600" />
              <GradientStatCard label="Firma Sayısı" value={stats.totalCompanies} icon={Building2} gradient="from-blue-500 to-indigo-600" />
              <GradientStatCard label="KKD Kaydı" value={stats.totalPPEs} icon={HardHat} gradient="from-amber-500 to-orange-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Role Distribution */}
              <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white">
                    Role Göre Dağılım
                  </h3>
                  <Users className="h-5 w-5 text-slate-400" />
                </div>
                <div className="h-[280px]">
                  {personnelRoleData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={personnelRoleData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} horizontal={false} />
                        <XAxis type="number" stroke={chartTextColor} tick={{ fill: chartTextColor }} />
                        <YAxis dataKey="name" type="category" stroke={chartTextColor} tick={{ fill: chartTextColor, fontSize: 11 }} width={120} />
                        <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '0.75rem' }} />
                        <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                      <p>Personel kaydı bulunmamaktadır</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Company Distribution */}
              <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white">
                    Firma Başına Personel
                  </h3>
                  <Building2 className="h-5 w-5 text-slate-400" />
                </div>
                <div className="h-[280px]">
                  {companyPersonnelData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={companyPersonnelData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} vertical={false} />
                        <XAxis dataKey="name" stroke={chartTextColor} tick={{ fill: chartTextColor, fontSize: 11 }} />
                        <YAxis stroke={chartTextColor} tick={{ fill: chartTextColor }} />
                        <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '0.75rem' }} />
                        <Bar dataKey="personnel" fill="#6366f1" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                      <p>Veri bulunmamaktadır</p>
                    </div>
                  )}
                </div>
              </div>

              {/* PPE Distribution */}
              <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white">
                    KKD Durum Dağılımı
                  </h3>
                  <Package className="h-5 w-5 text-slate-400" />
                </div>
                <div className="h-[280px]">
                  {ppeStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={ppeStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={5} dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}>
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
                      <p>KKD kaydı bulunmamaktadır</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Personnel Status Summary */}
              <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white mb-4">
                  Personel Durum Özeti
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                        <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Aktif Personel</p>
                        <p className="text-sm text-slate-500">Çalışmaya devam eden</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {stats.activePersonnel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-900/30 rounded-lg">
                        <XCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Pasif/Ayrılan</p>
                        <p className="text-sm text-slate-500">Çalışmayan personel</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                      {stats.totalPersonnel - stats.activePersonnel}
                    </span>
                  </div>
                  {stats.totalPersonnel > 0 && (
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                          <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">Aktiflik Oranı</p>
                          <p className="text-sm text-slate-500">Aktif personel yüzdesi</p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        %{Math.round((stats.activePersonnel / stats.totalPersonnel) * 100)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Risks Tab */}
        {activeTab === 'risks' && (
          <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <GradientStatCard label="Toplam Risk" value={stats.totalRisks} icon={ShieldAlert} gradient="from-amber-500 to-orange-600" />
              <GradientStatCard label="Yüksek Risk" value={stats.highRisks} icon={AlertTriangle} gradient="from-red-500 to-rose-600" />
              <GradientStatCard label="Açık" value={filteredData.risks.filter(r => r.status === 'Açık').length} icon={AlertCircle} gradient="from-orange-500 to-red-600" />
              <GradientStatCard label="Giderildi" value={filteredData.risks.filter(r => r.status === 'Giderildi').length} icon={CheckCircle2} gradient="from-emerald-500 to-green-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Risk Distribution */}
              <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white">
                    Risk Skor Dağılımı
                  </h3>
                  <PieChartIcon className="h-5 w-5 text-slate-400" />
                </div>
                <div className="h-[280px]">
                  {riskDistributionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={riskDistributionData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={5} dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}>
                          {riskDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                      <p>Henüz risk kaydı bulunmamaktadır</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Risk Status Distribution */}
              <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white">
                    Risk Durum Dağılımı
                  </h3>
                  <BarChart3 className="h-5 w-5 text-slate-400" />
                </div>
                <div className="h-[280px]">
                  {filteredData.risks.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Açık', value: filteredData.risks.filter(r => r.status === 'Açık').length },
                        { name: 'Devam Ediyor', value: filteredData.risks.filter(r => r.status === 'Devam Ediyor').length },
                        { name: 'Giderildi', value: filteredData.risks.filter(r => r.status === 'Giderildi').length },
                      ].filter(d => d.value > 0)}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} vertical={false} />
                        <XAxis dataKey="name" stroke={chartTextColor} tick={{ fill: chartTextColor }} />
                        <YAxis stroke={chartTextColor} tick={{ fill: chartTextColor }} />
                        <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '0.75rem' }} />
                        <Bar dataKey="value" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                      <p>Henüz risk kaydı bulunmamaktadır</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 5x5 Risk Matrix */}
              <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white">
                    5×5 Risk Matrisi
                  </h3>
                  <Grid3x3 className="h-5 w-5 text-slate-400" />
                </div>
                <div className="overflow-x-auto">
                  <div className="flex items-end gap-1">
                    <div className="flex flex-col items-center gap-1 mr-1">
                      <span className="text-[10px] text-slate-400 font-medium -rotate-90 w-4 mb-4">OLASILIK</span>
                      {[5, 4, 3, 2, 1].map(prob => (
                        <div key={prob} className="w-8 h-12 flex items-center justify-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {prob}
                        </div>
                      ))}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col gap-1">
                        {[5, 4, 3, 2, 1].map(prob => (
                          <div key={prob} className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(sev => {
                              const score = prob * sev;
                              const matrixItem = riskMatrixData.find(m => m.probability === prob && m.severity === sev);
                              const count = matrixItem?.count || 0;
                              const bgColor = score <= 6 ? 'bg-emerald-500' : score <= 12 ? 'bg-amber-500' : 'bg-red-500';
                              const bgOpacity = count > 0 ? '' : 'opacity-20';
                              
                              return (
                                <div
                                  key={`${prob}-${sev}`}
                                  className={`flex-1 h-12 ${bgColor} ${bgOpacity} rounded-lg flex flex-col items-center justify-center text-white transition-all ${count > 0 ? 'shadow-md ring-2 ring-white/30' : ''}`}
                                  title={`Olasılık: ${prob}, Şiddet: ${sev}, Skor: ${score}, Kayıt: ${count}`}
                                >
                                  <span className="text-[10px] font-medium">{score}</span>
                                  {count > 0 && (
                                    <span className="text-xs font-bold">{count}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                        <div className="flex gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map(sev => (
                            <div key={sev} className="flex-1 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                              {sev}
                            </div>
                          ))}
                        </div>
                        <div className="text-center text-[10px] text-slate-400 font-medium mt-1">ŞİDDET</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-emerald-500" />
                      <span className="text-xs text-slate-500 dark:text-slate-400">Düşük (1-6)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-amber-500" />
                      <span className="text-xs text-slate-500 dark:text-slate-400">Orta (7-12)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-red-500" />
                      <span className="text-xs text-slate-500 dark:text-slate-400">Yüksek (13+)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
};
