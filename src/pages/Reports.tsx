import React, { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { PageTransition } from '../components/layout/PageTransition';
import { motion } from 'motion/react';
import {
  BarChart3, PieChart as PieChartIcon, TrendingUp, Users, Building2,
  AlertTriangle, GraduationCap, HardHat, ShieldAlert, Calendar,
  Download, FileText, ArrowUpRight, ArrowDownRight,
  Activity, CheckCircle2, Clock, XCircle, Target, Zap, Package, UserCheck,
  AlertCircle, Eye, Grid3x3, Percent, Timer, CalendarDays, Filter, Table2,
  Lightbulb, LineChart as LineChartIcon
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Button } from '../components/ui/Button';
import {
  exportToPDF, exportToExcel,
  exportOverviewReport, exportIncidentsReport, exportTrainingsReport,
  exportPPEReport, exportRiskReport, exportPersonnelReport
} from '../utils/exportUtils';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];

export const Reports = () => {
  const { 
    companies, personnel, incidents, trainings, ppes, risks, isDarkMode 
  } = useStore();
  
  const [dateRange, setDateRange] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const isDark = isDarkMode;
  const chartTextColor = isDark ? '#9ca3af' : '#4b5563';

  // Date range filtering helper
  const isInDateRange = (dateStr: string) => {
    if (dateRange === 'all') return true;
    if (dateRange === 'custom') {
      const date = new Date(dateStr);
      if (customStartDate && date < new Date(customStartDate)) return false;
      if (customEndDate && date > new Date(customEndDate + 'T23:59:59')) return false;
      return true;
    }
    const date = new Date(dateStr);
    const now = new Date();
    const daysAgo = new Date();
    daysAgo.setDate(now.getDate() - Number(dateRange));
    return date >= daysAgo;
  };

  // Get date range object for Excel exports
  const getDateRangeForExport = () => {
    if (dateRange === 'custom' && customStartDate && customEndDate) {
      return { start: customStartDate, end: customEndDate };
    }
    if (dateRange === 'all') return undefined;
    const now = new Date();
    const start = new Date();
    start.setDate(now.getDate() - Number(dateRange));
    return {
      start: start.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0]
    };
  };

  // Filter data by selected company and date range
  const filteredData = useMemo(() => {
    let fPersonnel = personnel;
    let fIncidents = incidents;
    let fTrainings = trainings;
    let fPPEs = ppes;
    let fRisks = risks;

    // Company filter
    if (selectedCompanyId !== 'all') {
      const companyPersonnelIds = personnel.filter(p => p.assignedCompanyId === selectedCompanyId).map(p => p.id);
      fPersonnel = personnel.filter(p => p.assignedCompanyId === selectedCompanyId);
      fIncidents = incidents.filter(i => i.companyId === selectedCompanyId);
      fTrainings = trainings.filter(t => t.participants.some(pId => companyPersonnelIds.includes(pId)));
      fPPEs = ppes.filter(p => {
        const person = personnel.find(per => per.id === p.personnelId);
        return person?.assignedCompanyId === selectedCompanyId;
      });
    }

    // Date range filter
    if (dateRange !== 'all') {
      fIncidents = fIncidents.filter(i => isInDateRange(i.date || i.createdAt));
      fTrainings = fTrainings.filter(t => isInDateRange(t.date || t.createdAt));
      fPPEs = fPPEs.filter(p => isInDateRange(p.issueDate));
      fRisks = fRisks.filter(r => isInDateRange(r.date));
    }

    return {
      personnel: fPersonnel,
      incidents: fIncidents,
      trainings: fTrainings,
      ppes: fPPEs,
      risks: fRisks,
    };
  }, [selectedCompanyId, dateRange, personnel, incidents, trainings, ppes, risks]);

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
    const highRisks = filteredData.risks.filter(r => r.score >= 13).length;

    const criticalIncidents = filteredData.incidents.filter(i => i.severity === 'Kritik').length;
    const openIncidents = filteredData.incidents.filter(i => i.status === 'Açık').length;
    const closedIncidents = filteredData.incidents.filter(i => i.status === 'Kapalı').length;
    const activePersonnel = filteredData.personnel.filter(p => p.status === 'Aktif' || !p.status).length;

    const totalTrainingHours = filteredData.trainings
      .filter(t => t.status === 'Tamamlandı')
      .reduce((sum, t) => sum + (t.duration || 0), 0);

    const resolvedRisks = filteredData.risks.filter(r => r.status === 'Giderildi').length;
    const openRisks = filteredData.risks.filter(r => r.status === 'Açık').length;
    const avgRiskScore = totalRisks > 0
      ? Number((filteredData.risks.reduce((sum, r) => sum + r.score, 0) / totalRisks).toFixed(1))
      : 0;

    return {
      totalCompanies, totalPersonnel, totalIncidents, totalTrainings, totalPPEs, totalRisks,
      pendingIncidents, completedTrainings, activePPEs, highRisks, criticalIncidents,
      openIncidents, closedIncidents, activePersonnel, totalTrainingHours,
      resolvedRisks, openRisks, avgRiskScore
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

  // Incident Type Distribution
  const incidentTypeData = useMemo(() => {
    const typeCount = filteredData.incidents.reduce((acc, incident) => {
      const type = (incident as any).type || 'Belirtilmemiş';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeCount)
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData.incidents]);

  // Monthly Incident Trend
  const monthlyIncidentData = useMemo(() => {
    const months: Record<string, number> = {};
    const now = new Date();
    
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

  // Monthly Training Trend
  const monthlyTrainingData = useMemo(() => {
    const months: Record<string, { count: number; hours: number }> = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });
      months[key] = { count: 0, hours: 0 };
    }

    filteredData.trainings.forEach(training => {
      const date = new Date(training.date);
      const key = date.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });
      if (months.hasOwnProperty(key)) {
        months[key].count++;
        if (training.status === 'Tamamlandı') {
          months[key].hours += training.duration || 0;
        }
      }
    });

    return Object.entries(months).map(([name, data]) => ({ name, count: data.count, hours: data.hours }));
  }, [filteredData.trainings]);

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

  // PPE Type Distribution
  const ppeTypeData = useMemo(() => {
    const typeCount = filteredData.ppes.reduce((acc, ppe) => {
      acc[ppe.type] = (acc[ppe.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeCount)
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData.ppes]);

  // Risk Score Distribution
  const riskDistributionData = useMemo(() => {
    const low = filteredData.risks.filter(r => r.score <= 6).length;
    const medium = filteredData.risks.filter(r => r.score > 6 && r.score <= 12).length;
    const high = filteredData.risks.filter(r => r.score > 12).length;

    return [
      { name: 'Düşük (1-6)', value: low, color: '#10b981' },
      { name: 'Orta (7-12)', value: medium, color: '#f59e0b' },
      { name: 'Yüksek (13+)', value: high, color: '#ef4444' },
    ].filter(d => d.value > 0);
  }, [filteredData.risks]);

  // Company Personnel Distribution
  const companyPersonnelData = useMemo(() => {
    if (selectedCompanyId !== 'all') {
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

  // 12-Month Trend for Correlation Analysis
  const twelveMonthTrendData = useMemo(() => {
    const months: Record<string, { incidents: number; trainings: number; risks: number }> = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });
      months[key] = { incidents: 0, trainings: 0, risks: 0 };
    }
    filteredData.incidents.forEach(inc => {
      const key = new Date(inc.date).toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });
      if (months[key] !== undefined) months[key].incidents++;
    });
    filteredData.trainings.forEach(tr => {
      const key = new Date(tr.date).toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });
      if (months[key] !== undefined) months[key].trainings++;
    });
    filteredData.risks.forEach(r => {
      const key = new Date(r.date).toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });
      if (months[key] !== undefined) months[key].risks++;
    });
    return Object.entries(months).map(([name, data]) => ({ name, ...data }));
  }, [filteredData.incidents, filteredData.trainings, filteredData.risks]);

  // Period Comparison (current period vs prior equal period)
  const periodComparison = useMemo(() => {
    let currentDays = 30;
    if (dateRange === '7') currentDays = 7;
    else if (dateRange === '30') currentDays = 30;
    else if (dateRange === '90') currentDays = 90;
    else if (dateRange === '365') currentDays = 365;

    const now = new Date();
    const currentStart = new Date();
    currentStart.setDate(now.getDate() - currentDays);
    const priorEnd = new Date(currentStart);
    const priorStart = new Date();
    priorStart.setDate(now.getDate() - currentDays * 2);

    const isInCurrent = (ds: string) => { const d = new Date(ds); return d >= currentStart && d <= now; };
    const isInPrior = (ds: string) => { const d = new Date(ds); return d >= priorStart && d <= priorEnd; };

    let srcIncidents = selectedCompanyId !== 'all' ? incidents.filter(i => i.companyId === selectedCompanyId) : incidents;
    const companyPersonnelIds = selectedCompanyId !== 'all' ? personnel.filter(p => p.assignedCompanyId === selectedCompanyId).map(p => p.id) : personnel.map(p => p.id);
    let srcTrainings = selectedCompanyId !== 'all' ? trainings.filter(t => t.participants.some(id => companyPersonnelIds.includes(id))) : trainings;
    let srcRisks = risks;

    const calcChange = (cur: number, pri: number) => pri === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - pri) / pri) * 100);

    const curInc = srcIncidents.filter(i => isInCurrent(i.date || i.createdAt)).length;
    const priInc = srcIncidents.filter(i => isInPrior(i.date || i.createdAt)).length;
    const curTr = srcTrainings.filter(t => isInCurrent(t.date || t.createdAt)).length;
    const priTr = srcTrainings.filter(t => isInPrior(t.date || t.createdAt)).length;
    const curRisk = srcRisks.filter(r => isInCurrent(r.date)).length;
    const priRisk = srcRisks.filter(r => isInPrior(r.date)).length;

    const periodLabel =
      dateRange === '7' ? '7 günlük' :
      dateRange === '90' ? '90 günlük' :
      dateRange === '365' ? '1 yıllık' : '30 günlük';

    return {
      incidents: { current: curInc, prior: priInc, change: calcChange(curInc, priInc) },
      trainings: { current: curTr, prior: priTr, change: calcChange(curTr, priTr) },
      risks: { current: curRisk, prior: priRisk, change: calcChange(curRisk, priRisk) },
      periodLabel,
    };
  }, [selectedCompanyId, dateRange, incidents, trainings, risks, personnel]);

  // KPI Targets
  const kpiData = useMemo(() => {
    const incidentClosureRate = stats.totalIncidents > 0 ? Math.round((stats.closedIncidents / stats.totalIncidents) * 100) : 100;
    const trainingCompletionRate = stats.totalTrainings > 0 ? Math.round((stats.completedTrainings / stats.totalTrainings) * 100) : 0;
    const riskResolutionRate = stats.totalRisks > 0 ? Math.round((stats.resolvedRisks / stats.totalRisks) * 100) : 0;
    const ppeActiveRate = stats.totalPPEs > 0 ? Math.round((stats.activePPEs / stats.totalPPEs) * 100) : 0;
    const criticalIncidentRate = stats.totalIncidents > 0 ? Math.round(((stats.totalIncidents - stats.criticalIncidents) / stats.totalIncidents) * 100) : 100;

    return [
      { id: 'incident_closure', label: 'Olay Kapanış Oranı', current: incidentClosureRate, target: 90, unit: '%', icon: AlertTriangle, colorClass: 'from-rose-500 to-red-600', barOk: incidentClosureRate >= 90, barMid: incidentClosureRate >= 70 },
      { id: 'training_completion', label: 'Eğitim Tamamlanma', current: trainingCompletionRate, target: 80, unit: '%', icon: GraduationCap, colorClass: 'from-emerald-500 to-teal-600', barOk: trainingCompletionRate >= 80, barMid: trainingCompletionRate >= 60 },
      { id: 'risk_resolution', label: 'Risk Giderme Oranı', current: riskResolutionRate, target: 75, unit: '%', icon: ShieldAlert, colorClass: 'from-amber-500 to-orange-600', barOk: riskResolutionRate >= 75, barMid: riskResolutionRate >= 50 },
      { id: 'ppe_active', label: 'KKD Aktiflik Oranı', current: ppeActiveRate, target: 85, unit: '%', icon: HardHat, colorClass: 'from-indigo-500 to-purple-600', barOk: ppeActiveRate >= 85, barMid: ppeActiveRate >= 65 },
      { id: 'non_critical_rate', label: 'Kritik Olmayan Olay', current: criticalIncidentRate, target: 80, unit: '%', icon: CheckCircle2, colorClass: 'from-sky-500 to-blue-600', barOk: criticalIncidentRate >= 80, barMid: criticalIncidentRate >= 60 },
    ];
  }, [stats, filteredData.ppes]);

  // Auto-generated Insights
  const insights = useMemo(() => {
    const results: { type: 'warning' | 'success' | 'info' | 'danger'; title: string; message: string }[] = [];

    if (stats.totalIncidents > 0) {
      const criticalRate = (stats.criticalIncidents / stats.totalIncidents) * 100;
      if (criticalRate > 20) results.push({ type: 'danger', title: 'Yüksek Kritik Olay Oranı', message: `Olayların %${Math.round(criticalRate)}'i kritik seviyede. Acil önlem alınması önerilir.` });
      const openRate = (stats.openIncidents / stats.totalIncidents) * 100;
      if (openRate > 40) results.push({ type: 'warning', title: 'Açık Olay Oranı Yüksek', message: `Toplam olayların %${Math.round(openRate)}'i hâlâ açık durumda. Kapanış süreçleri hızlandırılmalı.` });
      if (stats.closedIncidents / stats.totalIncidents > 0.8) results.push({ type: 'success', title: 'Olay Yönetimi Başarılı', message: `Olayların %${Math.round((stats.closedIncidents / stats.totalIncidents) * 100)}'i kapatılmış. Mükemmel bir olay yönetimi performansı!` });
    }

    if (stats.totalTrainings > 0) {
      const cr = (stats.completedTrainings / stats.totalTrainings) * 100;
      if (cr < 60) results.push({ type: 'warning', title: 'Düşük Eğitim Tamamlanma', message: `Eğitimlerin yalnızca %${Math.round(cr)}'i tamamlandı. Eğitim planlaması gözden geçirilmeli.` });
      else if (cr >= 85) results.push({ type: 'success', title: 'Yüksek Eğitim Tamamlanma', message: `Eğitimlerin %${Math.round(cr)}'i başarıyla tamamlandı. Personel katılımı çok iyi seviyede.` });
    }

    if (stats.totalRisks > 0) {
      const highRate = (stats.highRisks / stats.totalRisks) * 100;
      if (highRate > 30) results.push({ type: 'danger', title: 'Yüksek Risk Yoğunluğu', message: `Risklerin %${Math.round(highRate)}'i yüksek seviyede. Risk azaltma önlemleri acilen gözden geçirilmeli.` });
      const resolveRate = (stats.resolvedRisks / stats.totalRisks) * 100;
      if (resolveRate > 70) results.push({ type: 'success', title: 'İyi Risk Giderme Performansı', message: `Risklerin %${Math.round(resolveRate)}'i giderilmiş. Risk yönetimi süreci etkin işliyor.` });
    }

    if (stats.totalPPEs > 0) {
      const wornRate = (filteredData.ppes.filter(p => p.status === 'Yıprandı/Kayıp').length / stats.totalPPEs) * 100;
      if (wornRate > 15) results.push({ type: 'warning', title: 'KKD Yenileme Gerekiyor', message: `KKD'lerin %${Math.round(wornRate)}'i yıpranmış veya kayıp. Stok yenileme planlanmalıdır.` });
    }

    if (periodComparison.incidents.change > 20) results.push({ type: 'warning', title: 'Olay Sayısında Artış Trendi', message: `Önceki ${periodComparison.periodLabel} döneme kıyasla olay sayısı %${periodComparison.incidents.change} arttı.` });
    else if (periodComparison.incidents.change < -10) results.push({ type: 'success', title: 'Olay Sayısında Olumlu Trend', message: `Olay sayısı önceki döneme kıyasla %${Math.abs(periodComparison.incidents.change)} azaldı. Güvenlik önlemleri işe yarıyor!` });

    if (results.length === 0) results.push({ type: 'info', title: 'Veriler Normal Seyrediyor', message: 'Tüm İSG göstergeleri kabul edilebilir aralıkta görünmektedir. İyi çalışmalar!' });

    return results;
  }, [stats, filteredData.ppes, periodComparison]);

  const handleExportPDF = () => {
    const data = [
      ['Toplam Firma', String(stats.totalCompanies)],
      ['Toplam Personel', String(stats.totalPersonnel)],
      ['Aktif Personel', String(stats.activePersonnel)],
      ['Toplam Olay', String(stats.totalIncidents)],
      ['Kritik Olay', String(stats.criticalIncidents)],
      ['Açık Olay', String(stats.openIncidents)],
      ['Toplam Eğitim', String(stats.totalTrainings)],
      ['Tamamlanan Eğitim', String(stats.completedTrainings)],
      ['Toplam Eğitim Saati', String(stats.totalTrainingHours)],
      ['Toplam KKD', String(stats.totalPPEs)],
      ['Aktif KKD', String(stats.activePPEs)],
      ['Toplam Risk', String(stats.totalRisks)],
      ['Yüksek Risk', String(stats.highRisks)],
      ['Ort. Risk Skoru', String(stats.avgRiskScore)],
      ['Giderilen Risk', String(stats.resolvedRisks)],
    ];
    exportToPDF('İSG Analiz Raporu', ['Metrik', 'Değer'], data, 'analiz-raporu');
    toast.success('PDF raporu indirildi');
  };

  const handleExportExcel = () => {
    const data = [
      { 'Metrik': 'Toplam Firma', 'Değer': stats.totalCompanies },
      { 'Metrik': 'Toplam Personel', 'Değer': stats.totalPersonnel },
      { 'Metrik': 'Aktif Personel', 'Değer': stats.activePersonnel },
      { 'Metrik': 'Toplam Olay', 'Değer': stats.totalIncidents },
      { 'Metrik': 'Kritik Olay', 'Değer': stats.criticalIncidents },
      { 'Metrik': 'Açık Olay', 'Değer': stats.openIncidents },
      { 'Metrik': 'Kapalı Olay', 'Değer': stats.closedIncidents },
      { 'Metrik': 'Toplam Eğitim', 'Değer': stats.totalTrainings },
      { 'Metrik': 'Tamamlanan Eğitim', 'Değer': stats.completedTrainings },
      { 'Metrik': 'Toplam Eğitim Saati', 'Değer': stats.totalTrainingHours },
      { 'Metrik': 'Toplam KKD', 'Değer': stats.totalPPEs },
      { 'Metrik': 'Aktif KKD', 'Değer': stats.activePPEs },
      { 'Metrik': 'Toplam Risk', 'Değer': stats.totalRisks },
      { 'Metrik': 'Yüksek Risk', 'Değer': stats.highRisks },
      { 'Metrik': 'Ort. Risk Skoru', 'Değer': stats.avgRiskScore },
      { 'Metrik': 'Giderilen Risk', 'Değer': stats.resolvedRisks },
    ];
    exportToExcel(data, 'analiz-raporu');
    toast.success('Excel raporu indirildi');
  };

  // Enhanced Excel export handlers for each tab
  const handleExportOverviewExcel = () => {
    exportOverviewReport(
      companies,
      filteredData.personnel,
      filteredData.incidents,
      filteredData.trainings,
      filteredData.ppes,
      filteredData.risks,
      getDateRangeForExport(),
      selectedCompanyId
    );
    toast.success('Detaylı genel rapor Excel\'e aktarıldı');
  };

  const handleExportIncidentsExcel = () => {
    exportIncidentsReport(
      filteredData.incidents,
      companies,
      personnel,
      getDateRangeForExport(),
      selectedCompanyId
    );
    toast.success('Detaylı olay raporu Excel\'e aktarıldı');
  };

  const handleExportTrainingsExcel = () => {
    exportTrainingsReport(
      filteredData.trainings,
      personnel,
      getDateRangeForExport()
    );
    toast.success('Detaylı eğitim raporu Excel\'e aktarıldı');
  };

  const handleExportPersonnelExcel = () => {
    exportPersonnelReport(
      filteredData.personnel,
      companies
    );
    toast.success('Detaylı personel raporu Excel\'e aktarıldı');
  };

  const handleExportPPEExcel = () => {
    exportPPEReport(
      filteredData.ppes,
      personnel,
      getDateRangeForExport()
    );
    toast.success('Detaylı KKD raporu Excel\'e aktarıldı');
  };

  const handleExportRiskExcel = () => {
    exportRiskReport(
      filteredData.risks,
      getDateRangeForExport()
    );
    toast.success('Detaylı risk raporu Excel\'e aktarıldı');
  };

  const tooltipStyle = {
    backgroundColor: isDark ? '#1e293b' : '#fff',
    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
    borderRadius: '0.75rem',
  };

  const GradientStatCard = ({
    label, value, icon: Icon, gradient, trend, subtext
  }: {
    label: string;
    value: number | string;
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
              {typeof value === 'number' ? value.toLocaleString('tr-TR') : value}
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

  const ProgressBar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => {
    const percentage = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-600 dark:text-slate-400 w-24 shrink-0">{label}</span>
        <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
          <div className={`h-2.5 rounded-full transition-all ${color}`} style={{ width: `${percentage}%` }} />
        </div>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 w-12 text-right">{value}</span>
      </div>
    );
  };

  const dateRangeLabel = dateRange === 'all' ? 'Tüm Zamanlar' :
    dateRange === '7' ? 'Son 7 Gün' :
    dateRange === '30' ? 'Son 30 Gün' :
    dateRange === '90' ? 'Son 90 Gün' :
    dateRange === '365' ? 'Son 1 Yıl' :
    dateRange === 'custom' ? 'Özel Tarih Aralığı' : 'Tüm Zamanlar';

  // Get the per-tab export handler
  const getTabExportHandler = () => {
    switch (activeTab) {
      case 'overview': return handleExportOverviewExcel;
      case 'incidents': return handleExportIncidentsExcel;
      case 'trainings': return handleExportTrainingsExcel;
      case 'personnel': return handleExportPersonnelExcel;
      case 'ppe': return handleExportPPEExcel;
      case 'risks': return handleExportRiskExcel;
      default: return handleExportOverviewExcel;
    }
  };

  const getTabExportLabel = () => {
    switch (activeTab) {
      case 'overview': return 'Genel Rapor';
      case 'incidents': return 'Olay Raporu';
      case 'trainings': return 'Eğitim Raporu';
      case 'personnel': return 'Personel Raporu';
      case 'ppe': return 'KKD Raporu';
      case 'risks': return 'Risk Raporu';
      default: return 'Rapor';
    }
  };

  return (
    <PageTransition>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
                Analiz ve Raporlar
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-lg">
                İSG verilerinin kapsamlı analizi ve istatistikleri.
                {dateRange !== 'all' && (
                  <span className="ml-2 text-indigo-600 dark:text-indigo-400 font-medium">({dateRangeLabel})</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant="primary"
                onClick={getTabExportHandler()}
                className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-0 shadow-lg shadow-emerald-500/25"
              >
                <Table2 className="h-4 w-4" /> {getTabExportLabel()} Excel
              </Button>
              <Button variant="secondary" onClick={handleExportExcel} className="gap-2">
                <Download className="h-4 w-4" /> Özet Excel
              </Button>
              <Button variant="secondary" onClick={handleExportPDF} className="gap-2">
                <FileText className="h-4 w-4" /> PDF
              </Button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-[#09090b] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <Filter className="h-4 w-4 text-indigo-500" />
              Filtreler:
            </div>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
            >
              <option value="all">Tüm Firmalar</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
            >
              <option value="all">Tüm Zamanlar</option>
              <option value="7">Son 7 gün</option>
              <option value="30">Son 30 gün</option>
              <option value="90">Son 90 gün</option>
              <option value="365">Son 1 yıl</option>
              <option value="custom">Özel Tarih Aralığı</option>
            </select>
            
            {dateRange === 'custom' && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                    placeholder="Başlangıç"
                  />
                </div>
                <span className="text-slate-400 text-sm">—</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                  placeholder="Bitiş"
                />
                {customStartDate && customEndDate && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap">
                    {Math.ceil((new Date(customEndDate).getTime() - new Date(customStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} gün
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px">
          {[
            { id: 'overview', label: 'Genel Bakış', icon: BarChart3 },
            { id: 'comparison', label: 'Dönem Karş.', icon: TrendingUp },
            { id: 'insights', label: 'İçgörüler', icon: Lightbulb },
            { id: 'kpi', label: 'KPI Takibi', icon: Target },
            { id: 'correlation', label: 'Korelasyon', icon: LineChartIcon },
            { id: 'incidents', label: 'Olay Analizi', icon: AlertTriangle },
            { id: 'trainings', label: 'Eğitim Raporu', icon: GraduationCap },
            { id: 'personnel', label: 'Personel Analizi', icon: Users },
            { id: 'ppe', label: 'KKD Analizi', icon: HardHat },
            { id: 'risks', label: 'Risk Değerlendirme', icon: ShieldAlert },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 -mb-px whitespace-nowrap ${
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

        {/* Comparison Tab */}
        {activeTab === 'comparison' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-display font-semibold text-slate-900 dark:text-white">
                  Dönemsel Karşılaştırma
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  Seçili {periodComparison.periodLabel} dönem ile önceki benzer dönemin karşılaştırması
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {[
                { label: 'Olaylar', icon: AlertTriangle, ...periodComparison.incidents, color: periodComparison.incidents.change > 0 ? 'red' : periodComparison.incidents.change < 0 ? 'emerald' : 'gray' },
                { label: 'Eğitimler', icon: GraduationCap, ...periodComparison.trainings, color: periodComparison.trainings.change >= 0 ? 'emerald' : 'red' },
                { label: 'Riskler', icon: ShieldAlert, ...periodComparison.risks, color: periodComparison.risks.change < 0 ? 'emerald' : periodComparison.risks.change > 0 ? 'red' : 'gray' },
              ].map((item) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl bg-${item.color}-100 dark:bg-${item.color}-900/30`}>
                        <item.icon className={`h-5 w-5 text-${item.color}-600 dark:text-${item.color}-400`} />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                          {item.current}
                        </p>
                      </div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-lg text-sm font-medium ${
                      item.change > 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      item.change < 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                    }`}>
                      {item.change > 0 ? '+' : ''}{item.change}%
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Önceki dönem</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{item.prior} kayıt</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-display font-semibold text-slate-900 dark:text-white">
                Yapay Zeka Destekli İçgörüler
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Veri analizi temelli otomatik öneriler ve uyarılar
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {insights.map((insight, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-5 rounded-2xl border-l-4 ${
                    insight.type === 'danger' ? 'bg-red-50 border-red-500 dark:bg-red-900/20 dark:border-red-500' :
                    insight.type === 'warning' ? 'bg-amber-50 border-amber-500 dark:bg-amber-900/20 dark:border-amber-500' :
                    insight.type === 'success' ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-900/20 dark:border-emerald-500' :
                    'bg-sky-50 border-sky-500 dark:bg-sky-900/20 dark:border-sky-500'
                  } shadow-sm`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      insight.type === 'danger' ? 'bg-red-200 dark:bg-red-800/50' :
                      insight.type === 'warning' ? 'bg-amber-200 dark:bg-amber-800/50' :
                      insight.type === 'success' ? 'bg-emerald-200 dark:bg-emerald-800/50' :
                      'bg-sky-200 dark:bg-sky-800/50'
                    }`}>
                      {insight.type === 'danger' ? <AlertTriangle className="h-5 w-5 text-red-700 dark:text-red-300" /> :
                       insight.type === 'warning' ? <AlertCircle className="h-5 w-5 text-amber-700 dark:text-amber-300" /> :
                       insight.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-700 dark:text-emerald-300" /> :
                       <Lightbulb className="h-5 w-5 text-sky-700 dark:text-sky-300" />}
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-semibold text-sm mb-1 ${
                        insight.type === 'danger' ? 'text-red-900 dark:text-red-100' :
                        insight.type === 'warning' ? 'text-amber-900 dark:text-amber-100' :
                        insight.type === 'success' ? 'text-emerald-900 dark:text-emerald-100' :
                        'text-sky-900 dark:text-sky-100'
                      }`}>
                        {insight.title}
                      </h4>
                      <p className={`text-sm leading-relaxed ${
                        insight.type === 'danger' ? 'text-red-700 dark:text-red-200' :
                        insight.type === 'warning' ? 'text-amber-700 dark:text-amber-200' :
                        insight.type === 'success' ? 'text-emerald-700 dark:text-emerald-200' :
                        'text-sky-700 dark:text-sky-200'
                      }`}>
                        {insight.message}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* KPI Tab */}
        {activeTab === 'kpi' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-display font-semibold text-slate-900 dark:text-white">
                KPI Performans Göstergeleri
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Hedefe yönelik performans takibi
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {kpiData.map((kpi) => (
                <motion.div
                  key={kpi.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${kpi.colorClass}`}>
                        <kpi.icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{kpi.label}</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                          {kpi.current}{kpi.unit}
                        </p>
                      </div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                      kpi.current >= kpi.target ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      kpi.current >= kpi.target * 0.7 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      Hedef: {kpi.target}{kpi.unit}
                    </div>
                  </div>
                  <div className="relative h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((kpi.current / kpi.target) * 100, 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        kpi.current >= kpi.target ? 'bg-emerald-500' :
                        kpi.current >= kpi.target * 0.7 ? 'bg-amber-500' :
                        'bg-red-500'
                      }`}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{kpi.current >= kpi.target ? 'Hedefe ulaşıldı ✓' : `%${Math.round((kpi.current / kpi.target) * 100)} tamamlandı`}</span>
                    {kpi.current < kpi.target && (
                      <span className="font-medium text-amber-600 dark:text-amber-400">
                        %{kpi.target - kpi.current} daha gerekli
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Correlation Tab */}
        {activeTab === 'correlation' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-display font-semibold text-slate-900 dark:text-white">
                Etkileşim Analizi
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Olay, Eğitim ve Risk verilerinin korelasyonu (12 aylık)
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500 to-red-600">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Olay-Eğitim İlişkisi</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white mt-0.5">
                      {stats.totalTrainings > 0 ? (Math.round(stats.totalIncidents / stats.totalTrainings * 100) / 100).toFixed(2) : '0'} olay/ eğitim
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Her eğitime düşen ortalama olay sayısı
                </p>
              </div>
              <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
                    <ShieldAlert className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Risk-Olay İlişkisi</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white mt-0.5">
                      {stats.totalRisks > 0 ? (Math.round(stats.totalIncidents / stats.totalRisks * 100) / 100).toFixed(2) : '0'} olay/ risk
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Her risk için gerçekleşen olay oranı
                </p>
              </div>
              <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                    <GraduationCap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Eğitim Risk Etkisi</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white mt-0.5">
                      {stats.totalTrainings > 0 ? (Math.round(stats.totalTrainingHours / stats.totalRisks * 100) / 100).toFixed(1) : '0'} saat/ risk
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Her risk için ayrılan eğitim saati
                </p>
              </div>
            </div>
            <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white mb-4">
                12 Aylık Trend Karşılaştırması
              </h3>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={twelveMonthTrendData}>
                    <defs>
                      <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="trGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="rkGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                    <XAxis dataKey="name" stroke={chartTextColor} tick={{ fill: chartTextColor }} />
                    <YAxis stroke={chartTextColor} tick={{ fill: chartTextColor }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                    <Area type="monotone" dataKey="incidents" name="Olaylar" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#incGrad)" />
                    <Area type="monotone" dataKey="trainings" name="Eğitimler" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#trGrad)" />
                    <Area type="monotone" dataKey="risks" name="Riskler" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#rkGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
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
                subtext={`${stats.openIncidents} açık, ${stats.criticalIncidents} kritik`}
              />
              <GradientStatCard
                label="Toplam Eğitim"
                value={stats.totalTrainings}
                icon={GraduationCap}
                gradient="from-emerald-500 to-teal-600"
                subtext={`${stats.completedTrainings} tamamlandı, ${stats.totalTrainingHours} saat`}
              />
              <GradientStatCard
                label="Toplam Risk"
                value={stats.totalRisks}
                icon={ShieldAlert}
                gradient="from-amber-500 to-orange-600"
                trend={stats.highRisks > 5 ? 'up' : 'neutral'}
                subtext={`${stats.highRisks} yüksek, ort. ${stats.avgRiskScore}`}
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

            {/* Overview Summary Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Risk Resolution Progress */}
              <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white mb-4">
                  Risk Giderme Durumu
                </h3>
                <div className="space-y-3">
                  <ProgressBar label="Açık" value={stats.openRisks} max={stats.totalRisks} color="bg-red-500" />
                  <ProgressBar label="Devam Ediyor" value={filteredData.risks.filter(r => r.status === 'Devam Ediyor').length} max={stats.totalRisks} color="bg-blue-500" />
                  <ProgressBar label="Giderildi" value={stats.resolvedRisks} max={stats.totalRisks} color="bg-emerald-500" />
                </div>
                {stats.totalRisks > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-sm text-slate-500">Giderme Oranı</span>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      %{Math.round((stats.resolvedRisks / stats.totalRisks) * 100)}
                    </span>
                  </div>
                )}
              </div>

              {/* Incident Closure Progress */}
              <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white mb-4">
                  Olay Kapanış Durumu
                </h3>
                <div className="space-y-3">
                  <ProgressBar label="Açık" value={stats.openIncidents} max={stats.totalIncidents} color="bg-red-500" />
                  <ProgressBar label="İnceleniyor" value={stats.pendingIncidents} max={stats.totalIncidents} color="bg-amber-500" />
                  <ProgressBar label="Kapalı" value={stats.closedIncidents} max={stats.totalIncidents} color="bg-emerald-500" />
                </div>
                {stats.totalIncidents > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-sm text-slate-500">Kapanma Oranı</span>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      %{Math.round((stats.closedIncidents / stats.totalIncidents) * 100)}
                    </span>
                  </div>
                )}
              </div>

              {/* Training Completion */}
              <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white mb-4">
                  Eğitim Tamamlanma
                </h3>
                <div className="space-y-3">
                  <ProgressBar label="Planlandı" value={filteredData.trainings.filter(t => t.status === 'Planlandı').length} max={stats.totalTrainings} color="bg-amber-500" />
                  <ProgressBar label="Tamamlandı" value={stats.completedTrainings} max={stats.totalTrainings} color="bg-emerald-500" />
                  <ProgressBar label="İptal" value={filteredData.trainings.filter(t => t.status === 'İptal').length} max={stats.totalTrainings} color="bg-red-500" />
                </div>
                {stats.totalTrainings > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-sm text-slate-500">Tamamlanma Oranı</span>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      %{Math.round((stats.completedTrainings / stats.totalTrainings) * 100)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                      <Tooltip contentStyle={tooltipStyle} />
                      <Area type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#incidentGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

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
                        <Tooltip contentStyle={tooltipStyle} />
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <GradientStatCard label="Toplam Olay" value={stats.totalIncidents} icon={AlertTriangle} gradient="from-red-500 to-rose-600" />
              <GradientStatCard label="Açık Olaylar" value={stats.openIncidents} icon={AlertCircle} gradient="from-amber-500 to-orange-600" />
              <GradientStatCard label="İncelenen" value={stats.pendingIncidents} icon={Eye} gradient="from-blue-500 to-indigo-600" />
              <GradientStatCard label="Kritik Olay" value={stats.criticalIncidents} icon={Zap} gradient="from-rose-600 to-red-700" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white">Olay Şiddet Dağılımı</h3>
                  <PieChartIcon className="h-5 w-5 text-slate-400" />
                </div>
                <div className="h-[280px]">
                  {incidentSeverityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={incidentSeverityData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={5} dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}>
                          {incidentSeverityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                      <p>Henüz olay kaydı bulunmamaktadır</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white">Olay Durum Dağılımı</h3>
                  <BarChart3 className="h-5 w-5 text-slate-400" />
                </div>
                <div className="h-[280px]">
                  {incidentStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={incidentStatusData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} vertical={false} />
                        <XAxis dataKey="name" stroke={chartTextColor} tick={{ fill: chartTextColor }} />
                        <YAxis stroke={chartTextColor} tick={{ fill: chartTextColor }} />
                        <Tooltip contentStyle={tooltipStyle} />
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

              {/* Incident Type Distribution */}
              <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white">Olay Tipi Dağılımı</h3>
                  <Package className="h-5 w-5 text-slate-400" />
                </div>
                <div className="h-[280px]">
                  {incidentTypeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={incidentTypeData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} horizontal={false} />
                        <XAxis type="number" stroke={chartTextColor} tick={{ fill: chartTextColor }} />
                        <YAxis dataKey="name" type="category" stroke={chartTextColor} tick={{ fill: chartTextColor, fontSize: 11 }} width={120} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                      <p>Olay tipi bilgisi bulunmamaktadır</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Monthly Trend */}
              <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white">Aylık Olay Trendi</h3>
                  <TrendingUp className="h-5 w-5 text-slate-400" />
                </div>
                <div className="h-[280px]">
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
                      <Tooltip contentStyle={tooltipStyle} />
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
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <GradientStatCard label="Toplam Eğitim" value={stats.totalTrainings} icon={GraduationCap} gradient="from-emerald-500 to-teal-600" />
              <GradientStatCard label="Tamamlanan" value={stats.completedTrainings} icon={CheckCircle2} gradient="from-green-500 to-emerald-600" />
              <GradientStatCard label="Planlanan" value={filteredData.trainings.filter(t => t.status === 'Planlandı').length} icon={Clock} gradient="from-amber-500 to-orange-600" />
              <GradientStatCard label="İptal Edilen" value={filteredData.trainings.filter(t => t.status === 'İptal').length} icon={XCircle} gradient="from-red-500 to-rose-600" />
              <GradientStatCard label="Toplam Saat" value={stats.totalTrainingHours} icon={Timer} gradient="from-indigo-500 to-purple-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white">Eğitim Durumları</h3>
                  <PieChartIcon className="h-5 w-5 text-slate-400" />
                </div>
                <div className="h-[280px]">
                  {trainingStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={trainingStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={5} dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}>
                          {trainingStatusData.map((_, index) => (
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

              {/* Monthly Training Trend */}
              <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white">Aylık Eğitim Trendi</h3>
                  <TrendingUp className="h-5 w-5 text-slate-400" />
                </div>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTrainingData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} vertical={false} />
                      <XAxis dataKey="name" stroke={chartTextColor} tick={{ fill: chartTextColor }} />
                      <YAxis stroke={chartTextColor} tick={{ fill: chartTextColor }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend />
                      <Bar dataKey="count" name="Eğitim Sayısı" fill="#10b981" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="hours" name="Toplam Saat" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Training Stats */}
              <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2">
                <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white mb-4">
                  Eğitim İstatistikleri
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Tamamlanan</p>
                        <p className="text-xs text-slate-500">Başarıyla biten</p>
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
                        <p className="text-xs text-slate-500">Yaklaşan</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {filteredData.trainings.filter(t => t.status === 'Planlandı').length}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                        <Timer className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Toplam Saat</p>
                        <p className="text-xs text-slate-500">Eğitim saati</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {stats.totalTrainingHours}
                    </span>
                  </div>

                  {stats.totalTrainings > 0 && (
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <Percent className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">Tamamlanma</p>
                          <p className="text-xs text-slate-500">Başarı oranı</p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <GradientStatCard label="Toplam Personel" value={stats.totalPersonnel} icon={Users} gradient="from-indigo-500 to-purple-600" />
              <GradientStatCard label="Aktif" value={stats.activePersonnel} icon={UserCheck} gradient="from-emerald-500 to-teal-600" />
              <GradientStatCard label="Firma Sayısı" value={stats.totalCompanies} icon={Building2} gradient="from-blue-500 to-indigo-600" />
              <GradientStatCard label="KKD Kaydı" value={stats.totalPPEs} icon={HardHat} gradient="from-amber-500 to-orange-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white">Role Göre Dağılım</h3>
                  <Users className="h-5 w-5 text-slate-400" />
                </div>
                <div className="h-[280px]">
                  {personnelRoleData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={personnelRoleData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} horizontal={false} />
                        <XAxis type="number" stroke={chartTextColor} tick={{ fill: chartTextColor }} />
                        <YAxis dataKey="name" type="category" stroke={chartTextColor} tick={{ fill: chartTextColor, fontSize: 11 }} width={120} />
                        <Tooltip contentStyle={tooltipStyle} />
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

              <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white">Firma Başına Personel</h3>
                  <Building2 className="h-5 w-5 text-slate-400" />
                </div>
                <div className="h-[280px]">
                  {companyPersonnelData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={companyPersonnelData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} vertical={false} />
                        <XAxis dataKey="name" stroke={chartTextColor} tick={{ fill: chartTextColor, fontSize: 11 }} />
                        <YAxis stroke={chartTextColor} tick={{ fill: chartTextColor }} />
                        <Tooltip contentStyle={tooltipStyle} />
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

              {/* Personnel Status Summary */}
              <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2">
                <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white mb-4">
                  Personel Durum Özeti
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                        <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Aktif Personel</p>
                        <p className="text-xs text-slate-500">Çalışmaya devam eden</p>
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
                        <p className="text-xs text-slate-500">Çalışmayan</p>
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
                          <p className="text-xs text-slate-500">Aktif personel yüzdesi</p>
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

        {/* PPE Tab */}
        {activeTab === 'ppe' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <GradientStatCard label="Toplam KKD" value={stats.totalPPEs} icon={HardHat} gradient="from-indigo-500 to-purple-600" />
              <GradientStatCard label="Aktif" value={stats.activePPEs} icon={CheckCircle2} gradient="from-emerald-500 to-teal-600" />
              <GradientStatCard label="İade Edildi" value={filteredData.ppes.filter(p => p.status === 'İade Edildi').length} icon={Package} gradient="from-blue-500 to-cyan-600" />
              <GradientStatCard label="Yıprandı/Kayıp" value={filteredData.ppes.filter(p => p.status === 'Yıprandı/Kayıp').length} icon={AlertTriangle} gradient="from-red-500 to-rose-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white">KKD Durum Dağılımı</h3>
                  <PieChartIcon className="h-5 w-5 text-slate-400" />
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

              <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white">KKD Tip Dağılımı</h3>
                  <HardHat className="h-5 w-5 text-slate-400" />
                </div>
                <div className="h-[280px]">
                  {ppeTypeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ppeTypeData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} horizontal={false} />
                        <XAxis type="number" stroke={chartTextColor} tick={{ fill: chartTextColor }} />
                        <YAxis dataKey="name" type="category" stroke={chartTextColor} tick={{ fill: chartTextColor, fontSize: 11 }} width={120} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                      <p>KKD tipi bilgisi bulunmamaktadır</p>
                    </div>
                  )}
                </div>
              </div>

              {/* PPE Stats Summary */}
              <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2">
                <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white mb-4">
                  KKD Özet Bilgileri
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Aktif KKD</p>
                        <p className="text-xs text-slate-500">Kullanımda olan</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {stats.activePPEs}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Kayıp/Yıpranan</p>
                        <p className="text-xs text-slate-500">Yenilenecek</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {filteredData.ppes.filter(p => p.status === 'Yıprandı/Kayıp').length}
                    </span>
                  </div>
                  {stats.totalPPEs > 0 && (
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                          <Percent className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">Aktiflik Oranı</p>
                          <p className="text-xs text-slate-500">Kullanım yüzdesi</p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        %{Math.round((stats.activePPEs / stats.totalPPEs) * 100)}
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
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <GradientStatCard label="Toplam Risk" value={stats.totalRisks} icon={ShieldAlert} gradient="from-amber-500 to-orange-600" />
              <GradientStatCard label="Yüksek Risk" value={stats.highRisks} icon={AlertTriangle} gradient="from-red-500 to-rose-600" />
              <GradientStatCard label="Açık" value={stats.openRisks} icon={AlertCircle} gradient="from-orange-500 to-red-600" />
              <GradientStatCard label="Giderildi" value={stats.resolvedRisks} icon={CheckCircle2} gradient="from-emerald-500 to-green-600" />
              <GradientStatCard label="Ort. Skor" value={stats.avgRiskScore} icon={Target} gradient="from-cyan-500 to-blue-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white">Risk Skor Dağılımı</h3>
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

              <div className="bg-white dark:bg-[#09090b] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white">Risk Durum Dağılımı</h3>
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
                        <Tooltip contentStyle={tooltipStyle} />
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
                  <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white">5×5 Risk Matrisi</h3>
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
