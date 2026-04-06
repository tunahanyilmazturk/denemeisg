import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Incident } from '../types';
import type { Company, Personnel } from '../types';
import {
  t,
  PDF_COLORS,
  PDF_FONTS,
  addPdfHeader,
  addPdfFooter,
  addSectionTitle,
  addSubSectionTitle,
  addField,
  addFieldPair,
  addInfoBox,
  addStatusBadge,
  checkPageBreak,
  addMultiLineText,
  addBulletList,
  addDivider,
  formatDate,
  formatDateTime,
} from './turkishPdfHelper';

// ============================================================================
// ADVANCED INCIDENT PDF REPORT - TURKISH CHARACTER SUPPORT
// ============================================================================

interface IncidentPDFOptions {
  incident: Incident;
  company?: Company;
  person?: Personnel;
  osgbSettings?: {
    companyName?: string;
    companyTitle?: string;
    logo?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
}

// ============================================================================
// SEVERITY & STATUS HELPERS
// ============================================================================

const getSeverityBadgeType = (severity: string | undefined): 'danger' | 'warning' | 'info' | 'neutral' => {
  if (!severity) return 'neutral';
  const s = severity.toLowerCase();
  if (s.includes('kritik') || s.includes('critical')) return 'danger';
  if (s.includes('yüksek') || s.includes('high')) return 'warning';
  if (s.includes('orta') || s.includes('medium')) return 'info';
  return 'neutral';
};

const getStatusBadgeType = (status: string | undefined): 'success' | 'warning' | 'danger' | 'info' | 'neutral' => {
  if (!status) return 'neutral';
  const s = status.toLowerCase();
  if (s.includes('kapali') || s.includes('closed') || s.includes('tamamland')) return 'success';
  if (s.includes('inceleme') || s.includes('progress') || s.includes('devam')) return 'warning';
  if (s.includes('acik') || s.includes('open')) return 'info';
  return 'neutral';
};

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

export const generateIncidentPDF = (options: IncidentPDFOptions): jsPDF => {
  const { incident, company, person, osgbSettings } = options;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // ─── HEADER ────────────────────────────────────────────────────────────────
  let yPos = addPdfHeader(doc, 'OLAY BILDIRIM RAPORU', {
    logo: osgbSettings?.logo,
    companyName: osgbSettings?.companyName,
    companyTitle: osgbSettings?.companyTitle,
    phone: osgbSettings?.phone,
    email: osgbSettings?.email,
    address: osgbSettings?.address,
    subtitle: `Olay No: ${incident.id} | Tarih: ${formatDate(incident.date)}`,
  });
  yPos += 3;
  
  // ─── GENEL BILGILER ────────────────────────────────────────────────────────
  yPos = checkPageBreak(doc, yPos, 70);
  yPos = addSectionTitle(doc, 'GENEL BILGILER', yPos);
  yPos += 3;
  
  // Ana bilgi kutusu
  addInfoBox(doc, yPos, 48, PDF_COLORS.gray50, PDF_COLORS.gray200);
  yPos += 5;
  
  // Olay basligi - tam genislik
  yPos = addField(doc, 'Olay Basligi', incident.title, 20, yPos, pageWidth - 50);
  yPos += 2;
  
  // Iki sutunlu alanlar
  yPos = addFieldPair(doc, 
    'Olay Turu', incident.type || '-',
    'Olay Tarihi', formatDateTime(incident.date),
    yPos
  );
  yPos += 2;
  yPos = addFieldPair(doc,
    'Firma', company?.name || '-',
    'Lokasyon', incident.location,
    yPos
  );
  yPos += 2;
  if (person) {
    yPos = addFieldPair(doc,
      'Ilgili Personel', `${person.firstName} ${person.lastName}`,
      'Sicil No', person.tcNo || '-',
      yPos
    );
  }
  yPos += 8;
  
  // Durum ve Oncelik rozetleri
  yPos = checkPageBreak(doc, yPos, 25);
  
  // Durum kutusu
  addInfoBox(doc, yPos, 18, PDF_COLORS.white, PDF_COLORS.gray200);
  yPos += 4;
  
  doc.setFontSize(PDF_FONTS.bodySize);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.gray600);
  doc.text('Durum:', 20, yPos);
  addStatusBadge(doc, incident.status || '-', 42, yPos - 0.5, getStatusBadgeType(incident.status));
  
  doc.text('Oncelik/Siddet:', pageWidth / 2 + 5, yPos);
  addStatusBadge(doc, incident.severity || '-', pageWidth / 2 + 40, yPos - 0.5, getSeverityBadgeType(incident.severity));
  
  doc.setTextColor(...PDF_COLORS.black);
  yPos += 18;
  
  // Aciklama
  if (incident.description) {
    yPos = checkPageBreak(doc, yPos, 30);
    yPos += 2;
    doc.setFontSize(PDF_FONTS.bodySize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.gray700);
    doc.text('Olay Aciklamasi:', 20, yPos);
    yPos += 4;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.black);
    yPos = addMultiLineText(doc, incident.description, 20, yPos, pageWidth - 40);
    yPos += 5;
  }
  
  // ─── KAZALI BILGILERI ──────────────────────────────────────────────────────
  if (incident.injuredPersonName || incident.injuredPersonDepartment) {
    yPos = checkPageBreak(doc, yPos, 55);
    yPos = addSectionTitle(doc, 'KAZALI BILGILERI', yPos, PDF_COLORS.info);
    yPos += 3;
    
    addInfoBox(doc, yPos, 42, PDF_COLORS.infoLight, PDF_COLORS.gray200);
    yPos += 5;
    
    if (incident.injuredPersonName) {
      yPos = addFieldPair(doc,
        'Ad Soyad', incident.injuredPersonName,
        'Bolum/Firma', incident.injuredPersonDepartment || '-',
        yPos
      );
      yPos += 2;
    }
    if (incident.injuredPersonBirthDate) {
      yPos = addFieldPair(doc,
        'Dogum Tarihi', formatDate(incident.injuredPersonBirthDate),
        'Cinsiyet', incident.injuredPersonGender || '-',
        yPos
      );
      yPos += 2;
    }
    if (incident.injuredPersonEmployeeId) {
      yPos = addFieldPair(doc,
        'Sicil No', incident.injuredPersonEmployeeId,
        'Gorev', incident.injuredPersonDepartment || '-',
        yPos
      );
      yPos += 2;
    }
    yPos += 6;
    
    // Calisma tecrubesi
    if (incident.injuredPersonTotalExperience || incident.injuredPersonTaskExperience) {
      yPos = checkPageBreak(doc, yPos, 20);
      addInfoBox(doc, yPos, 14, PDF_COLORS.gray50, PDF_COLORS.gray200);
      yPos += 4;
      
      if (incident.injuredPersonTotalExperience) {
        addField(doc, 'Toplam Tecrube', incident.injuredPersonTotalExperience, 20, yPos);
      }
      if (incident.injuredPersonTaskExperience) {
        addField(doc, 'Bu Gorevdeki Tecrube', incident.injuredPersonTaskExperience, pageWidth / 2 + 5, yPos);
      }
      yPos += 14;
    }
  }
  
  // ─── TEDAVI BILGILERI ──────────────────────────────────────────────────────
  if (incident.injuryTypes?.length || incident.affectedBodyParts?.length) {
    yPos = checkPageBreak(doc, yPos, 45);
    yPos = addSectionTitle(doc, 'TEDAVI BILGILERI', yPos, PDF_COLORS.danger);
    yPos += 3;
    
    // Yaralanma turleri
    if (incident.injuryTypes?.length) {
      yPos = checkPageBreak(doc, yPos, 20);
      yPos = addSubSectionTitle(doc, 'Yaralanma Turleri', yPos, PDF_COLORS.danger);
      yPos += 2;
      
      addInfoBox(doc, yPos, incident.injuryTypes.length * 5 + 4, PDF_COLORS.dangerLight, PDF_COLORS.gray200);
      yPos += 3;
      doc.setFontSize(PDF_FONTS.bodySize);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...PDF_COLORS.gray800);
      incident.injuryTypes.forEach((type) => {
        doc.setFillColor(...PDF_COLORS.danger);
        doc.circle(23, yPos - 1, 1, 'F');
        doc.text(t(type), 27, yPos);
        yPos += 5;
      });
      doc.setTextColor(...PDF_COLORS.black);
      yPos += 3;
    }
    
    // Etkilenen bolgeler
    if (incident.affectedBodyParts?.length) {
      yPos = checkPageBreak(doc, yPos, 20);
      yPos = addSubSectionTitle(doc, 'Etkilenen Bolgeler', yPos, PDF_COLORS.warning);
      yPos += 2;
      
      addInfoBox(doc, yPos, incident.affectedBodyParts.length * 5 + 4, PDF_COLORS.warningLight, PDF_COLORS.gray200);
      yPos += 3;
      doc.setFontSize(PDF_FONTS.bodySize);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...PDF_COLORS.gray800);
      incident.affectedBodyParts.forEach((part) => {
        doc.setFillColor(...PDF_COLORS.warning);
        doc.circle(23, yPos - 1, 1, 'F');
        doc.text(t(part), 27, yPos);
        yPos += 5;
      });
      doc.setTextColor(...PDF_COLORS.black);
      yPos += 3;
    }
    
    // Ciddiyet ve is gunu kaybi
    if (incident.severityLevel || incident.daysOff !== undefined || incident.restrictedWorkDays !== undefined) {
      yPos = checkPageBreak(doc, yPos, 25);
      
      addInfoBox(doc, yPos, 18, PDF_COLORS.warningLight, PDF_COLORS.warning);
      yPos += 4;
      
      const col1X = 20;
      const col2X = 20 + (pageWidth - 30) / 3;
      const col3X = 20 + 2 * (pageWidth - 30) / 3;
      
      if (incident.severityLevel) {
        addField(doc, 'Ciddiyet', incident.severityLevel, col1X, yPos);
      }
      if (incident.daysOff !== undefined) {
        addField(doc, 'Is Gunu Kaybi', `${incident.daysOff} gun`, col2X, yPos);
      }
      if (incident.restrictedWorkDays !== undefined) {
        addField(doc, 'Kisitli Calisma', `${incident.restrictedWorkDays} gun`, col3X, yPos);
      }
      yPos += 16;
    }
    
    // Hastane sevk
    if (incident.hospitalReferral) {
      yPos = checkPageBreak(doc, yPos, 14);
      addInfoBox(doc, yPos, 10, PDF_COLORS.dangerLight, PDF_COLORS.danger);
      yPos += 5;
      doc.setFontSize(PDF_FONTS.bodySize + 1);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...PDF_COLORS.danger);
      doc.text('!! HASTANEYE SEVK EDILDI', 20, yPos);
      doc.setTextColor(...PDF_COLORS.black);
      yPos += 10;
    }
  }
  
  // ─── ONLEM ONERILERI ───────────────────────────────────────────────────────
  const hasMeasures = (incident.measuresPersonnel?.length || 0) + 
                     (incident.measuresEquipment?.length || 0) + 
                     (incident.measuresEnvironment?.length || 0) + 
                     (incident.measuresMethod?.length || 0) > 0;
  
  if (hasMeasures) {
    yPos = checkPageBreak(doc, yPos, 45);
    yPos = addSectionTitle(doc, 'ONLEM ONERILERI', yPos, PDF_COLORS.emerald);
    yPos += 5;
    
    if (incident.measuresPersonnel?.length) {
      yPos = checkPageBreak(doc, yPos, 20);
      yPos = addSubSectionTitle(doc, '1) Insanda', yPos, PDF_COLORS.info);
      yPos += 2;
      yPos = addBulletList(doc, incident.measuresPersonnel, 22, yPos, pageWidth - 50, PDF_COLORS.info);
      yPos += 2;
    }
    
    if (incident.measuresEquipment?.length) {
      yPos = checkPageBreak(doc, yPos, 20);
      yPos = addSubSectionTitle(doc, '2) Makina/Techizatta', yPos, PDF_COLORS.emerald);
      yPos += 2;
      yPos = addBulletList(doc, incident.measuresEquipment, 22, yPos, pageWidth - 50, PDF_COLORS.emerald);
      yPos += 2;
    }
    
    if (incident.measuresEnvironment?.length) {
      yPos = checkPageBreak(doc, yPos, 20);
      yPos = addSubSectionTitle(doc, '3) Ortamda', yPos, PDF_COLORS.purple);
      yPos += 2;
      yPos = addBulletList(doc, incident.measuresEnvironment, 22, yPos, pageWidth - 50, PDF_COLORS.purple);
      yPos += 2;
    }
    
    if (incident.measuresMethod?.length) {
      yPos = checkPageBreak(doc, yPos, 20);
      yPos = addSubSectionTitle(doc, '4) Yontemde', yPos, PDF_COLORS.warning);
      yPos += 2;
      yPos = addBulletList(doc, incident.measuresMethod, 22, yPos, pageWidth - 50, PDF_COLORS.warning);
      yPos += 2;
    }
  }
  
  // ─── DETAYLI ACIKLAMALAR ───────────────────────────────────────────────────
  if (incident.incidentDescription || incident.medicalTreatmentDescription || incident.rootCauseAnalysis) {
    yPos = checkPageBreak(doc, yPos, 45);
    yPos = addSectionTitle(doc, 'DETAYLI ACIKLAMALAR', yPos, PDF_COLORS.gray700);
    yPos += 5;
    
    if (incident.incidentDescription) {
      yPos = checkPageBreak(doc, yPos, 25);
      yPos = addSubSectionTitle(doc, 'Olay Aciklamasi', yPos, PDF_COLORS.gray600);
      yPos += 2;
      
      addInfoBox(doc, yPos - 2, 0, PDF_COLORS.gray50, PDF_COLORS.gray200); // will be behind text
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(PDF_FONTS.bodySize);
      doc.setTextColor(...PDF_COLORS.gray800);
      const startY = yPos;
      yPos = addMultiLineText(doc, incident.incidentDescription, 22, yPos, pageWidth - 44);
      
      // Draw box behind text
      const boxHeight = yPos - startY + 4;
      addInfoBox(doc, startY - 3, boxHeight, PDF_COLORS.gray50, PDF_COLORS.gray200);
      // Re-draw text on top of box
      doc.setTextColor(...PDF_COLORS.gray800);
      addMultiLineText(doc, incident.incidentDescription, 22, startY, pageWidth - 44);
      yPos += 5;
    }
    
    if (incident.medicalTreatmentDescription) {
      yPos = checkPageBreak(doc, yPos, 25);
      yPos = addSubSectionTitle(doc, 'Revir Tedavi Aciklamasi', yPos, PDF_COLORS.danger);
      yPos += 2;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(PDF_FONTS.bodySize);
      doc.setTextColor(...PDF_COLORS.gray800);
      yPos = addMultiLineText(doc, incident.medicalTreatmentDescription, 22, yPos, pageWidth - 44);
      yPos += 5;
    }
    
    if (incident.rootCauseAnalysis) {
      yPos = checkPageBreak(doc, yPos, 25);
      yPos = addSubSectionTitle(doc, 'Kok Neden Analizi', yPos, PDF_COLORS.warning);
      yPos += 2;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(PDF_FONTS.smallSize);
      doc.setTextColor(...PDF_COLORS.gray800);
      yPos = addMultiLineText(doc, incident.rootCauseAnalysis, 22, yPos, pageWidth - 44, 3.5);
      yPos += 5;
    }
  }
  
  // ─── IMZA ALANI ────────────────────────────────────────────────────────────
  yPos = checkPageBreak(doc, yPos, 50);
  yPos += 5;
  yPos = addDivider(doc, yPos);
  yPos += 5;
  
  doc.setFontSize(PDF_FONTS.smallSize);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.gray600);
  doc.text('IMZA ALANI', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;
  
  // Imza kutulari
  const signBoxWidth = (pageWidth - 40) / 3 - 5;
  const signY = yPos;
  
  // Uzman imzasi
  doc.setDrawColor(...PDF_COLORS.gray300);
  doc.setLineWidth(0.3);
  doc.roundedRect(15, signY, signBoxWidth, 25, 2, 2, 'S');
  doc.setFontSize(PDF_FONTS.tinySize);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.gray500);
  doc.text('ISG Uzmani', 15 + signBoxWidth / 2, signY + 12, { align: 'center' });
  doc.text('Imza / Tarih', 15 + signBoxWidth / 2, signY + 17, { align: 'center' });
  
  // Isveren imzasi
  const sign2X = 15 + signBoxWidth + 5;
  doc.roundedRect(sign2X, signY, signBoxWidth, 25, 2, 2, 'S');
  doc.text('Isveren Vekili', sign2X + signBoxWidth / 2, signY + 12, { align: 'center' });
  doc.text('Imza / Tarih', sign2X + signBoxWidth / 2, signY + 17, { align: 'center' });
  
  // Kazali imzasi
  const sign3X = sign2X + signBoxWidth + 5;
  doc.roundedRect(sign3X, signY, signBoxWidth, 25, 2, 2, 'S');
  doc.text('Kazali / Ilgili', sign3X + signBoxWidth / 2, signY + 12, { align: 'center' });
  doc.text('Imza / Tarih', sign3X + signBoxWidth / 2, signY + 17, { align: 'center' });
  
  doc.setTextColor(...PDF_COLORS.black);
  
  // ─── FOOTER ────────────────────────────────────────────────────────────────
  addPdfFooter(doc, osgbSettings?.companyName);
  
  return doc;
};

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

export const downloadIncidentPDF = (options: IncidentPDFOptions) => {
  const doc = generateIncidentPDF(options);
  const filename = `Olay_Raporu_${options.incident.id}_${new Date().getTime()}.pdf`;
  doc.save(filename);
};

export const getIncidentPDFBlob = (options: IncidentPDFOptions): Blob => {
  const doc = generateIncidentPDF(options);
  return doc.output('blob');
};

export const getIncidentPDFDataURL = (options: IncidentPDFOptions): string => {
  const doc = generateIncidentPDF(options);
  return doc.output('dataurlstring');
};
