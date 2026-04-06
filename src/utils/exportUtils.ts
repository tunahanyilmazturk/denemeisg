import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Company, Personnel, Incident, Training, PPE, Risk } from '../types';
import { t, PDF_COLORS, addPdfHeader, addPdfFooter, formatDate, formatDateTime, formatShortDate } from './turkishPdfHelper';

// ============================================================================
// PDF EXPORT - TURKISH CHARACTER SUPPORT
// ============================================================================

export const exportToPDF = (
  title: string,
  columns: string[],
  data: any[][],
  filename: string,
  options?: {
    companyName?: string;
    logo?: string;
    subtitle?: string;
  }
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header with Turkish support
  let yPos = addPdfHeader(doc, title, {
    logo: options?.logo,
    companyName: options?.companyName,
    subtitle: options?.subtitle,
  });
  
  // Convert Turkish characters in columns and data
  const safeColumns = columns.map(col => t(col));
  const safeData = data.map(row => row.map((cell: any) =>
    cell !== undefined && cell !== null ? t(String(cell)) : '-'
  ));
  
  // Add table with improved styling
  (doc as any).autoTable({
    startY: yPos,
    head: [safeColumns],
    body: safeData,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 3,
      lineColor: PDF_COLORS.gray200,
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: PDF_COLORS.primary,
      textColor: PDF_COLORS.white,
      fontStyle: 'bold',
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: PDF_COLORS.gray50,
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
    },
    margin: { left: 15, right: 15 },
    didDrawPage: (data: any) => {
      // Footer on each page
      const pageCount = doc.getNumberOfPages();
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(7);
      doc.setTextColor(...PDF_COLORS.gray400);
      doc.text(
        `Sayfa ${data.pageNumber} / ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
  });
  
  doc.save(`${filename}.pdf`);
};

// ============================================================================
// BASIC EXCEL EXPORT (for backward compatibility)
// ============================================================================

export const exportToExcel = (data: any[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

// ============================================================================
// ADVANCED EXCEL EXPORT WITH MULTIPLE SHEETS
// ============================================================================

interface DateRange {
  start?: string;
  end?: string;
}

interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}


// Helper function to apply column widths
const setColumnWidths = (worksheet: XLSX.WorkSheet, columns: ExcelColumn[]) => {
  const wscols = columns.map(col => ({ wch: col.width || 15 }));
  worksheet['!cols'] = wscols;
};

// Helper function to style header row
const styleHeaderRow = (worksheet: XLSX.WorkSheet, lastCol: string) => {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + '1';
    if (!worksheet[address]) continue;
    worksheet[address].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4F46E5" } },
      alignment: { horizontal: "center", vertical: "center" }
    };
  }
};

// ============================================================================
// OVERVIEW REPORT EXPORT
// ============================================================================

export const exportOverviewReport = (
  companies: Company[],
  personnel: Personnel[],
  incidents: Incident[],
  trainings: Training[],
  ppes: PPE[],
  risks: Risk[],
  dateRange?: DateRange,
  selectedCompanyId?: string
) => {
  const workbook = XLSX.utils.book_new();

  // Filter data by date range and company
  const filterByDate = (dateStr: string) => {
    if (!dateRange?.start && !dateRange?.end) return true;
    const date = new Date(dateStr);
    if (dateRange.start && date < new Date(dateRange.start)) return false;
    if (dateRange.end && date > new Date(dateRange.end)) return false;
    return true;
  };

  const filteredIncidents = incidents.filter(i =>
    (selectedCompanyId === 'all' || !selectedCompanyId || i.companyId === selectedCompanyId) &&
    filterByDate(i.date || i.createdAt)
  );
  const filteredTrainings = trainings.filter(t =>
    filterByDate(t.date || t.createdAt)
  );
  const filteredPPEs = ppes.filter(p =>
    filterByDate(p.issueDate)
  );
  const filteredRisks = risks.filter(r =>
    filterByDate(r.date)
  );

  // 1. SUMMARY SHEET
  const summaryData = [
    { 'Kategori': 'Genel İstatistikler', 'Metrik': '', 'Değer': '' },
    { 'Kategori': '', 'Metrik': 'Toplam Firma', 'Değer': companies.length },
    { 'Kategori': '', 'Metrik': 'Toplam Personel', 'Değer': personnel.length },
    { 'Kategori': '', 'Metrik': 'Aktif Personel', 'Değer': personnel.filter(p => p.status === 'Aktif' || !p.status).length },
    { 'Kategori': '', 'Metrik': '', 'Değer': '' },
    { 'Kategori': 'Olay İstatistikleri', 'Metrik': '', 'Değer': '' },
    { 'Kategori': '', 'Metrik': 'Toplam Olay', 'Değer': filteredIncidents.length },
    { 'Kategori': '', 'Metrik': 'Kritik Olay', 'Değer': filteredIncidents.filter(i => i.severity === 'Kritik').length },
    { 'Kategori': '', 'Metrik': 'Yüksek Şiddetli', 'Değer': filteredIncidents.filter(i => i.severity === 'Yüksek').length },
    { 'Kategori': '', 'Metrik': 'Açık Olay', 'Değer': filteredIncidents.filter(i => i.status === 'Açık').length },
    { 'Kategori': '', 'Metrik': 'Kapalı Olay', 'Değer': filteredIncidents.filter(i => i.status === 'Kapalı').length },
    { 'Kategori': '', 'Metrik': '', 'Değer': '' },
    { 'Kategori': 'Eğitim İstatistikleri', 'Metrik': '', 'Değer': '' },
    { 'Kategori': '', 'Metrik': 'Toplam Eğitim', 'Değer': filteredTrainings.length },
    { 'Kategori': '', 'Metrik': 'Tamamlanan', 'Değer': filteredTrainings.filter(t => t.status === 'Tamamlandı').length },
    { 'Kategori': '', 'Metrik': 'Toplam Eğitim Saati', 'Değer': filteredTrainings.filter(t => t.status === 'Tamamlandı').reduce((sum, t) => sum + (t.duration || 0), 0) },
    { 'Kategori': '', 'Metrik': '', 'Değer': '' },
    { 'Kategori': 'KKD İstatistikleri', 'Metrik': '', 'Değer': '' },
    { 'Kategori': '', 'Metrik': 'Toplam KKD', 'Değer': filteredPPEs.length },
    { 'Kategori': '', 'Metrik': 'Aktif KKD', 'Değer': filteredPPEs.filter(p => p.status === 'Aktif').length },
    { 'Kategori': '', 'Metrik': '', 'Değer': '' },
    { 'Kategori': 'Risk İstatistikleri', 'Metrik': '', 'Değer': '' },
    { 'Kategori': '', 'Metrik': 'Toplam Risk', 'Değer': filteredRisks.length },
    { 'Kategori': '', 'Metrik': 'Yüksek Risk (13+)', 'Değer': filteredRisks.filter(r => r.score >= 13).length },
    { 'Kategori': '', 'Metrik': 'Giderilmiş Risk', 'Değer': filteredRisks.filter(r => r.status === 'Giderildi').length },
    { 'Kategori': '', 'Metrik': 'Ortalama Risk Skoru', 'Değer': filteredRisks.length > 0 ? (filteredRisks.reduce((sum, r) => sum + r.score, 0) / filteredRisks.length).toFixed(2) : 0 },
  ];

  const summaryWS = XLSX.utils.json_to_sheet(summaryData);
  summaryWS['!cols'] = [{ wch: 30 }, { wch: 30 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, summaryWS, 'Genel Özet');

  // 2. COMPANIES SHEET
  const companiesData = companies.map(c => ({
    'Firma Adı': c.name,
    'Sektör': c.sector,
    'İletişim Kişisi': c.contactPerson,
    'Telefon': c.phone,
    'E-posta': c.email,
    'Adres': c.address,
    'Lokasyonlar': c.locations?.join(', ') || '-',
    'Kayıt Tarihi': formatDate(c.createdAt)
  }));
  const companiesWS = XLSX.utils.json_to_sheet(companiesData);
  companiesWS['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 25 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(workbook, companiesWS, 'Firmalar');

  // 3. PERSONNEL SHEET
  const personnelData = personnel.map(p => {
    const company = companies.find(c => c.id === p.assignedCompanyId);
    return {
      'Ad': p.firstName,
      'Soyad': p.lastName,
      'TC No': p.tcNo,
      'Görev': p.role,
      'Sınıf': p.class || '-',
      'Durum': p.status || 'Aktif',
      'Firma': company?.name || '-',
      'Telefon': p.phone,
      'E-posta': p.email,
      'İşe Başlama': formatDate(p.startDate),
      'Doğum Tarihi': formatDate(p.birthDate),
      'Kan Grubu': p.bloodType || '-'
    };
  });
  const personnelWS = XLSX.utils.json_to_sheet(personnelData);
  personnelWS['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 8 }, { wch: 10 }, { wch: 25 }, { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(workbook, personnelWS, 'Personel');

  // Save the workbook
  const dateRangeStr = dateRange?.start && dateRange?.end
    ? `_${formatDate(dateRange.start).replace(/\./g, '')}-${formatDate(dateRange.end).replace(/\./g, '')}`
    : '';
  XLSX.writeFile(workbook, `Genel_Rapor${dateRangeStr}_${new Date().getTime()}.xlsx`);
};

// ============================================================================
// INCIDENTS DETAILED REPORT
// ============================================================================

export const exportIncidentsReport = (
  incidents: Incident[],
  companies: Company[],
  personnel: Personnel[],
  dateRange?: DateRange,
  selectedCompanyId?: string
) => {
  const workbook = XLSX.utils.book_new();

  // Filter incidents
  const filterByDate = (dateStr: string) => {
    if (!dateRange?.start && !dateRange?.end) return true;
    const date = new Date(dateStr);
    if (dateRange.start && date < new Date(dateRange.start)) return false;
    if (dateRange.end && date > new Date(dateRange.end)) return false;
    return true;
  };

  const filteredIncidents = incidents.filter(i =>
    (selectedCompanyId === 'all' || !selectedCompanyId || i.companyId === selectedCompanyId) &&
    filterByDate(i.date || i.createdAt)
  );

  // MAIN INCIDENTS SHEET
  const incidentsData = filteredIncidents.map(i => {
    const company = companies.find(c => c.id === i.companyId);
    const person = personnel.find(p => p.id === i.personnelId);
    return {
      'Olay No': i.id,
      'Başlık': i.title,
      'Tarih': formatDateTime(i.date),
      'Firma': company?.name || '-',
      'İlgili Personel': person ? `${person.firstName} ${person.lastName}` : i.injuredPersonName || '-',
      'Şiddet': i.severity,
      'Durum': i.status,
      'Lokasyon': i.location,
      'Tip': (i as any).type || '-',
      'Açıklama': i.description.substring(0, 100) + (i.description.length > 100 ? '...' : ''),
      'Kök Neden': i.rootCause || '-',
      'Kayıt Tarihi': formatDateTime(i.createdAt)
    };
  });

  const incidentsWS = XLSX.utils.json_to_sheet(incidentsData);
  incidentsWS['!cols'] = [
    { wch: 10 }, { wch: 30 }, { wch: 18 }, { wch: 25 }, { wch: 25 },
    { wch: 10 }, { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 40 },
    { wch: 30 }, { wch: 18 }
  ];
  XLSX.utils.book_append_sheet(workbook, incidentsWS, 'Olaylar Listesi');

  // SEVERITY ANALYSIS SHEET
  const severityData = [
    { 'Şiddet Seviyesi': 'Kritik', 'Sayı': filteredIncidents.filter(i => i.severity === 'Kritik').length },
    { 'Şiddet Seviyesi': 'Yüksek', 'Sayı': filteredIncidents.filter(i => i.severity === 'Yüksek').length },
    { 'Şiddet Seviyesi': 'Orta', 'Sayı': filteredIncidents.filter(i => i.severity === 'Orta').length },
    { 'Şiddet Seviyesi': 'Düşük', 'Sayı': filteredIncidents.filter(i => i.severity === 'Düşük').length },
  ];
  const severityWS = XLSX.utils.json_to_sheet(severityData);
  severityWS['!cols'] = [{ wch: 20 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(workbook, severityWS, 'Şiddet Analizi');

  // STATUS ANALYSIS SHEET
  const statusData = [
    { 'Durum': 'Açık', 'Sayı': filteredIncidents.filter(i => i.status === 'Açık').length },
    { 'Durum': 'İnceleniyor', 'Sayı': filteredIncidents.filter(i => i.status === 'İnceleniyor').length },
    { 'Durum': 'Kapalı', 'Sayı': filteredIncidents.filter(i => i.status === 'Kapalı').length },
  ];
  const statusWS = XLSX.utils.json_to_sheet(statusData);
  statusWS['!cols'] = [{ wch: 20 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(workbook, statusWS, 'Durum Analizi');

  // BY COMPANY SHEET
  const companyIncidents = companies.map(c => ({
    'Firma': c.name,
    'Toplam Olay': filteredIncidents.filter(i => i.companyId === c.id).length,
    'Kritik': filteredIncidents.filter(i => i.companyId === c.id && i.severity === 'Kritik').length,
    'Yüksek': filteredIncidents.filter(i => i.companyId === c.id && i.severity === 'Yüksek').length,
    'Açık': filteredIncidents.filter(i => i.companyId === c.id && i.status === 'Açık').length,
    'Kapalı': filteredIncidents.filter(i => i.companyId === c.id && i.status === 'Kapalı').length,
  })).filter(c => c['Toplam Olay'] > 0);

  const companyIncidentsWS = XLSX.utils.json_to_sheet(companyIncidents);
  companyIncidentsWS['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(workbook, companyIncidentsWS, 'Firmaya Göre Analiz');

  const dateRangeStr = dateRange?.start && dateRange?.end
    ? `_${formatDate(dateRange.start).replace(/\./g, '')}-${formatDate(dateRange.end).replace(/\./g, '')}`
    : '';
  XLSX.writeFile(workbook, `Olay_Raporu${dateRangeStr}_${new Date().getTime()}.xlsx`);
};

// ============================================================================
// TRAININGS DETAILED REPORT
// ============================================================================

export const exportTrainingsReport = (
  trainings: Training[],
  personnel: Personnel[],
  dateRange?: DateRange
) => {
  const workbook = XLSX.utils.book_new();

  const filterByDate = (dateStr: string) => {
    if (!dateRange?.start && !dateRange?.end) return true;
    const date = new Date(dateStr);
    if (dateRange.start && date < new Date(dateRange.start)) return false;
    if (dateRange.end && date > new Date(dateRange.end)) return false;
    return true;
  };

  const filteredTrainings = trainings.filter(t => filterByDate(t.date || t.createdAt));

  // MAIN TRAININGS SHEET
  const trainingsData = filteredTrainings.map(t => ({
    'Eğitim No': t.id,
    'Başlık': t.title,
    'Eğitmen': t.trainer,
    'Tarih': formatDate(t.date),
    'Süre (Saat)': t.duration,
    'Katılımcı Sayısı': t.participants.length,
    'Durum': t.status,
    'Açıklama': t.description || '-',
    'Kayıt Tarihi': formatDateTime(t.createdAt)
  }));

  const trainingsWS = XLSX.utils.json_to_sheet(trainingsData);
  trainingsWS['!cols'] = [{ wch: 12 }, { wch: 35 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 40 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(workbook, trainingsWS, 'Eğitimler');

  // STATUS SUMMARY
  const statusData = [
    { 'Durum': 'Tamamlandı', 'Sayı': filteredTrainings.filter(t => t.status === 'Tamamlandı').length },
    { 'Durum': 'Planlandı', 'Sayı': filteredTrainings.filter(t => t.status === 'Planlandı').length },
    { 'Durum': 'İptal', 'Sayı': filteredTrainings.filter(t => t.status === 'İptal').length },
    { 'Durum': '', 'Sayı': '' },
    { 'Durum': 'Toplam Eğitim Saati', 'Sayı': filteredTrainings.filter(t => t.status === 'Tamamlandı').reduce((sum, t) => sum + (t.duration || 0), 0) },
  ];
  const statusWS = XLSX.utils.json_to_sheet(statusData);
  statusWS['!cols'] = [{ wch: 25 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(workbook, statusWS, 'Durum Özeti');

  // PARTICIPANTS DETAIL
  const participantsDetail: any[] = [];
  filteredTrainings.forEach(t => {
    t.participants.forEach(pId => {
      const person = personnel.find(p => p.id === pId);
      if (person) {
        participantsDetail.push({
          'Eğitim': t.title,
          'Tarih': formatDate(t.date),
          'Ad Soyad': `${person.firstName} ${person.lastName}`,
          'TC No': person.tcNo,
          'Görev': person.role,
          'Süre (Saat)': t.duration,
          'Durum': t.status
        });
      }
    });
  });

  if (participantsDetail.length > 0) {
    const participantsWS = XLSX.utils.json_to_sheet(participantsDetail);
    participantsWS['!cols'] = [{ wch: 35 }, { wch: 12 }, { wch: 25 }, { wch: 12 }, { wch: 20 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(workbook, participantsWS, 'Katılımcı Detayı');
  }

  const dateRangeStr = dateRange?.start && dateRange?.end
    ? `_${formatDate(dateRange.start).replace(/\./g, '')}-${formatDate(dateRange.end).replace(/\./g, '')}`
    : '';
  XLSX.writeFile(workbook, `Egitim_Raporu${dateRangeStr}_${new Date().getTime()}.xlsx`);
};

// ============================================================================
// PPE DETAILED REPORT
// ============================================================================

export const exportPPEReport = (
  ppes: PPE[],
  personnel: Personnel[],
  dateRange?: DateRange
) => {
  const workbook = XLSX.utils.book_new();

  const filterByDate = (dateStr: string) => {
    if (!dateRange?.start && !dateRange?.end) return true;
    const date = new Date(dateStr);
    if (dateRange.start && date < new Date(dateRange.start)) return false;
    if (dateRange.end && date > new Date(dateRange.end)) return false;
    return true;
  };

  const filteredPPEs = ppes.filter(p => filterByDate(p.issueDate));

  // MAIN PPE SHEET
  const ppeData = filteredPPEs.map(p => {
    const person = personnel.find(per => per.id === p.personnelId);
    return {
      'KKD No': p.id,
      'Personel': person ? `${person.firstName} ${person.lastName}` : '-',
      'TC No': person?.tcNo || '-',
      'KKD Tipi': p.type,
      'KKD Adı': p.name,
      'Veriliş Tarihi': formatDate(p.issueDate),
      'Durum': p.status,
      'Notlar': p.notes || '-'
    };
  });

  const ppeWS = XLSX.utils.json_to_sheet(ppeData);
  ppeWS['!cols'] = [{ wch: 12 }, { wch: 25 }, { wch: 12 }, { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(workbook, ppeWS, 'KKD Kayıtları');

  // TYPE ANALYSIS
  const typeCount: Record<string, number> = {};
  filteredPPEs.forEach(p => {
    typeCount[p.type] = (typeCount[p.type] || 0) + 1;
  });
  const typeData = Object.entries(typeCount).map(([type, count]) => ({
    'KKD Tipi': type,
    'Sayı': count
  }));
  const typeWS = XLSX.utils.json_to_sheet(typeData);
  typeWS['!cols'] = [{ wch: 25 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(workbook, typeWS, 'Tip Analizi');

  // STATUS ANALYSIS
  const statusData = [
    { 'Durum': 'Aktif', 'Sayı': filteredPPEs.filter(p => p.status === 'Aktif').length },
    { 'Durum': 'İade Edildi', 'Sayı': filteredPPEs.filter(p => p.status === 'İade Edildi').length },
    { 'Durum': 'Yıprandı/Kayıp', 'Sayı': filteredPPEs.filter(p => p.status === 'Yıprandı/Kayıp').length },
  ];
  const statusWS = XLSX.utils.json_to_sheet(statusData);
  statusWS['!cols'] = [{ wch: 25 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(workbook, statusWS, 'Durum Analizi');

  // BY PERSONNEL
  const personnelPPE = personnel.map(person => {
    const personPPEs = filteredPPEs.filter(p => p.personnelId === person.id);
    if (personPPEs.length === 0) return null;
    return {
      'Personel': `${person.firstName} ${person.lastName}`,
      'TC No': person.tcNo,
      'Görev': person.role,
      'Toplam KKD': personPPEs.length,
      'Aktif': personPPEs.filter(p => p.status === 'Aktif').length,
      'İade Edildi': personPPEs.filter(p => p.status === 'İade Edildi').length,
      'Kayıp/Yıpranan': personPPEs.filter(p => p.status === 'Yıprandı/Kayıp').length
    };
  }).filter(Boolean);

  if (personnelPPE.length > 0) {
    const personnelWS = XLSX.utils.json_to_sheet(personnelPPE);
    personnelWS['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, personnelWS, 'Personel Bazında');
  }

  const dateRangeStr = dateRange?.start && dateRange?.end
    ? `_${formatDate(dateRange.start).replace(/\./g, '')}-${formatDate(dateRange.end).replace(/\./g, '')}`
    : '';
  XLSX.writeFile(workbook, `KKD_Raporu${dateRangeStr}_${new Date().getTime()}.xlsx`);
};

// ============================================================================
// RISK DETAILED REPORT
// ============================================================================

export const exportRiskReport = (
  risks: Risk[],
  dateRange?: DateRange
) => {
  const workbook = XLSX.utils.book_new();

  const filterByDate = (dateStr: string) => {
    if (!dateRange?.start && !dateRange?.end) return true;
    const date = new Date(dateStr);
    if (dateRange.start && date < new Date(dateRange.start)) return false;
    if (dateRange.end && date > new Date(dateRange.end)) return false;
    return true;
  };

  const filteredRisks = risks.filter(r => filterByDate(r.date));

  // MAIN RISK SHEET
  const riskData = filteredRisks.map(r => ({
    'Risk No': r.id,
    'Tehlike': r.hazard,
    'Risk': r.risk,
    'Olasılık (1-5)': r.probability,
    'Şiddet (1-5)': r.severity,
    'Risk Skoru': r.score,
    'Risk Seviyesi': r.score <= 6 ? 'Düşük' : r.score <= 12 ? 'Orta' : 'Yüksek',
    'Kontrol Önlemi': r.controlMeasure,
    'Sorumlu': r.responsible,
    'Durum': r.status,
    'Tarih': formatDate(r.date)
  }));

  const riskWS = XLSX.utils.json_to_sheet(riskData);
  riskWS['!cols'] = [
    { wch: 10 }, { wch: 30 }, { wch: 30 }, { wch: 12 }, { wch: 12 },
    { wch: 12 }, { wch: 12 }, { wch: 35 }, { wch: 20 }, { wch: 12 }, { wch: 12 }
  ];
  XLSX.utils.book_append_sheet(workbook, riskWS, 'Risk Kayıtları');

  // RISK LEVEL ANALYSIS
  const levelData = [
    { 'Risk Seviyesi': 'Yüksek (13-25)', 'Sayı': filteredRisks.filter(r => r.score >= 13).length },
    { 'Risk Seviyesi': 'Orta (7-12)', 'Sayı': filteredRisks.filter(r => r.score >= 7 && r.score <= 12).length },
    { 'Risk Seviyesi': 'Düşük (1-6)', 'Sayı': filteredRisks.filter(r => r.score <= 6).length },
    { 'Risk Seviyesi': '', 'Sayı': '' },
    { 'Risk Seviyesi': 'Ortalama Risk Skoru', 'Sayı': filteredRisks.length > 0 ? (filteredRisks.reduce((sum, r) => sum + r.score, 0) / filteredRisks.length).toFixed(2) : 0 },
  ];
  const levelWS = XLSX.utils.json_to_sheet(levelData);
  levelWS['!cols'] = [{ wch: 25 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(workbook, levelWS, 'Seviye Analizi');

  // STATUS ANALYSIS
  const statusData = [
    { 'Durum': 'Açık', 'Sayı': filteredRisks.filter(r => r.status === 'Açık').length },
    { 'Durum': 'Devam Ediyor', 'Sayı': filteredRisks.filter(r => r.status === 'Devam Ediyor').length },
    { 'Durum': 'Giderildi', 'Sayı': filteredRisks.filter(r => r.status === 'Giderildi').length },
  ];
  const statusWS = XLSX.utils.json_to_sheet(statusData);
  statusWS['!cols'] = [{ wch: 25 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(workbook, statusWS, 'Durum Analizi');

  // 5x5 RISK MATRIX
  const matrixData: any[] = [];
  matrixData.push({ 'Olasılık↓ / Şiddet→': '', '1': '', '2': '', '3': '', '4': '', '5': '' });
  for (let prob = 5; prob >= 1; prob--) {
    const row: any = { 'Olasılık↓ / Şiddet→': prob };
    for (let sev = 1; sev <= 5; sev++) {
      const count = filteredRisks.filter(r => r.probability === prob && r.severity === sev).length;
      row[sev] = count > 0 ? count : '-';
    }
    matrixData.push(row);
  }
  const matrixWS = XLSX.utils.json_to_sheet(matrixData);
  matrixWS['!cols'] = [{ wch: 20 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }];
  XLSX.utils.book_append_sheet(workbook, matrixWS, 'Risk Matrisi');

  const dateRangeStr = dateRange?.start && dateRange?.end
    ? `_${formatDate(dateRange.start).replace(/\./g, '')}-${formatDate(dateRange.end).replace(/\./g, '')}`
    : '';
  XLSX.writeFile(workbook, `Risk_Raporu${dateRangeStr}_${new Date().getTime()}.xlsx`);
};

// ============================================================================
// PERSONNEL DETAILED REPORT
// ============================================================================

export const exportPersonnelReport = (
  personnel: Personnel[],
  companies: Company[]
) => {
  const workbook = XLSX.utils.book_new();

  // MAIN PERSONNEL SHEET
  const personnelData = personnel.map(p => {
    const company = companies.find(c => c.id === p.assignedCompanyId);
    return {
      'Ad': p.firstName,
      'Soyad': p.lastName,
      'TC No': p.tcNo,
      'Görev/Pozisyon': p.role,
      'Sınıf': p.class || '-',
      'Durum': p.status || 'Aktif',
      'Firma': company?.name || '-',
      'Telefon': p.phone,
      'E-posta': p.email,
      'Adres': p.address || '-',
      'İşe Başlama': formatDate(p.startDate),
      'İşten Ayrılma': formatDate(p.endDate),
      'Doğum Tarihi': formatDate(p.birthDate),
      'Kan Grubu': p.bloodType || '-',
      'Acil Durum İletişim': p.emergencyContact || '-',
      'Acil Durum Tel': p.emergencyPhone || '-',
      'Eğitim': p.education || '-'
    };
  });

  const personnelWS = XLSX.utils.json_to_sheet(personnelData);
  personnelWS['!cols'] = [
    { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 25 }, { wch: 8 }, { wch: 10 },
    { wch: 25 }, { wch: 15 }, { wch: 28 }, { wch: 30 }, { wch: 12 }, { wch: 12 },
    { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 20 }
  ];
  XLSX.utils.book_append_sheet(workbook, personnelWS, 'Personel Listesi');

  // BY COMPANY
  const companyPersonnel = companies.map(c => ({
    'Firma': c.name,
    'Toplam Personel': personnel.filter(p => p.assignedCompanyId === c.id).length,
    'Aktif': personnel.filter(p => p.assignedCompanyId === c.id && (p.status === 'Aktif' || !p.status)).length,
    'Pasif': personnel.filter(p => p.assignedCompanyId === c.id && p.status === 'Pasif').length,
    'İstifa Etti': personnel.filter(p => p.assignedCompanyId === c.id && p.status === 'İstifa Etti').length,
  })).filter(c => c['Toplam Personel'] > 0);

  const companyWS = XLSX.utils.json_to_sheet(companyPersonnel);
  companyWS['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(workbook, companyWS, 'Firmaya Göre');

  // BY ROLE
  const roleCount: Record<string, number> = {};
  personnel.forEach(p => {
    roleCount[p.role] = (roleCount[p.role] || 0) + 1;
  });
  const roleData = Object.entries(roleCount)
    .map(([role, count]) => ({ 'Görev/Pozisyon': role, 'Sayı': count }))
    .sort((a, b) => b.Sayı - a.Sayı);

  const roleWS = XLSX.utils.json_to_sheet(roleData);
  roleWS['!cols'] = [{ wch: 30 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(workbook, roleWS, 'Pozisyona Göre');

  // STATUS SUMMARY
  const statusData = [
    { 'Durum': 'Aktif', 'Sayı': personnel.filter(p => p.status === 'Aktif' || !p.status).length },
    { 'Durum': 'Pasif', 'Sayı': personnel.filter(p => p.status === 'Pasif').length },
    { 'Durum': 'İstifa Etti', 'Sayı': personnel.filter(p => p.status === 'İstifa Etti').length },
  ];
  const statusWS = XLSX.utils.json_to_sheet(statusData);
  statusWS['!cols'] = [{ wch: 20 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(workbook, statusWS, 'Durum Özeti');

  XLSX.writeFile(workbook, `Personel_Raporu_${new Date().getTime()}.xlsx`);
};
