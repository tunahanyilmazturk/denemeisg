import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Certificate } from '../types';
import type { Company, Personnel } from '../types';
import {
  t,
  PDF_COLORS,
  PDF_FONTS,
  addPdfHeader,
  addPdfFooter,
  addSectionTitle,
  addField,
  addFieldPair,
  addStatusBadge,
  checkPageBreak,
  addDivider,
  formatDate,
} from './turkishPdfHelper';

// ============================================================================
// CERTIFICATE PDF GENERATOR
// ============================================================================

interface CertificatePDFOptions {
  certificate: Certificate;
  company?: Company;
  personnel?: Personnel;
  osgbSettings?: {
    companyName?: string;
    companyTitle?: string;
    logo?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
}

const getStatusBadgeType = (status: string | undefined): 'success' | 'warning' | 'danger' | 'neutral' => {
  if (!status) return 'neutral';
  const s = status.toLowerCase();
  if (s.includes('aktif')) return 'success';
  if (s.includes('dolmus') || s.includes('dolmuş')) return 'danger';
  if (s.includes('iptal')) return 'neutral';
  return 'neutral';
};

export const generateCertificatePDF = (options: CertificatePDFOptions): jsPDF => {
  const { certificate, company, personnel: person, osgbSettings } = options;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - 30;

  // ─── HEADER ────────────────────────────────────────────────────────────────
  let yPos = addPdfHeader(doc, 'SGRTIFIKA RAPORU', {
    logo: osgbSettings?.logo || certificate.companyLogo,
    companyName: osgbSettings?.companyName || certificate.companyName,
    companyTitle: osgbSettings?.companyTitle,
    phone: osgbSettings?.phone,
    email: osgbSettings?.email,
    address: osgbSettings?.address,
    subtitle: `${certificate.certificateNo} - ${certificate.type}`,
  });

  // ─── SERTIFIKA BILGILERI ────────────────────────────────────────────────────
  yPos = addSectionTitle(doc, 'SERTIFIKA BILGILERI', yPos);
  yPos += 2;

  // Certificate No & Type
  yPos = addFieldPair(doc, 'Sertifika No', certificate.certificateNo, 'Sertifika Tipi', certificate.type, yPos);
  yPos += 2;

  // Title
  yPos = addField(doc, 'Sertifika Basligi', certificate.title, 15, yPos, contentWidth);
  yPos += 2;

  // Status
  const statusLabel = certificate.status || 'Belirtilmemis';
  doc.setFontSize(PDF_FONTS.bodySize);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.gray700);
  doc.text('Durum:', 20, yPos);
  addStatusBadge(doc, statusLabel, 50, yPos - 3.5, getStatusBadgeType(certificate.status));
  yPos += 8;

  // Description
  if (certificate.description) {
    yPos = addField(doc, 'Aciklama', certificate.description, 15, yPos, contentWidth);
    yPos += 2;
  }

  // Notes
  if (certificate.notes) {
    yPos = addField(doc, 'Notlar', certificate.notes, 15, yPos, contentWidth);
    yPos += 2;
  }

  yPos = addDivider(doc, yPos);
  yPos += 4;

  // ─── PERSONEL BILGILERI ─────────────────────────────────────────────────────
  yPos = addSectionTitle(doc, 'PERSONEL BILGILERI', yPos);
  yPos += 2;

  if (person) {
    yPos = addFieldPair(doc, 'Adi Soyadi', `${person.firstName} ${person.lastName}`, 'Rol', person.role, yPos);
    yPos += 2;
    yPos = addFieldPair(doc, 'TC Kimlik No', person.tcNo || '-', 'Telefon', person.phone || '-', yPos);
    yPos += 2;
    yPos = addFieldPair(doc, 'E-posta', person.email || '-', 'Baslangic Tarihi', person.startDate ? formatDate(person.startDate) : '-', yPos);
    yPos += 2;
  } else {
    yPos = addField(doc, 'Personel', 'Bilinmiyor', 15, yPos, contentWidth);
    yPos += 2;
  }

  yPos = addDivider(doc, yPos);
  yPos += 4;

  // ─── FIRMA BILGILERI ────────────────────────────────────────────────────────
  yPos = addSectionTitle(doc, 'FIRMA BILGILERI', yPos);
  yPos += 2;

  if (company) {
    yPos = addFieldPair(doc, 'Firma Adi', company.name, 'Sektor', company.sector || '-', yPos);
    yPos += 2;
    yPos = addFieldPair(doc, 'Yetkili Kisi', company.contactPerson || '-', 'Telefon', company.phone || '-', yPos);
    yPos += 2;
    yPos = addField(doc, 'Adres', company.address || '-', 15, yPos, contentWidth);
    yPos += 2;
  } else if (certificate.companyName) {
    yPos = addField(doc, 'Firma', certificate.companyName, 15, yPos, contentWidth);
    yPos += 2;
  }

  yPos = addDivider(doc, yPos);
  yPos += 4;

  // ─── TARIH VE EGITIM BILGILERI ──────────────────────────────────────────────
  yPos = addSectionTitle(doc, 'TARIH VE EGITIM BILGILERI', yPos);
  yPos += 2;

  yPos = addFieldPair(doc, 'Duzenleme Tarihi', formatDate(certificate.issueDate), 'Son Gecerlilik', certificate.expiryDate ? formatDate(certificate.expiryDate) : 'Belirsiz', yPos);
  yPos += 2;

  if (certificate.duration) {
    yPos = addFieldPair(doc, 'Egitim Suresi', `${certificate.duration} saat`, 'Sinav Puani', certificate.score !== undefined ? `${certificate.score}` : '-', yPos);
    yPos += 2;
  }

  yPos = addField(doc, 'Duzenleyen', certificate.issuer, 15, yPos, contentWidth);
  yPos += 2;

  // ─── IMZA ALANI ─────────────────────────────────────────────────────────────
  yPos = checkPageBreak(doc, yPos, 60);
  yPos += 10;

  // Signature section
  const sigY = yPos;
  const colWidth = contentWidth / 3;

  // Duzenleyen imza
  doc.setFontSize(PDF_FONTS.smallSize);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.gray700);
  doc.text(t('Duzenleyen'), 15 + colWidth * 0.5, sigY, { align: 'center' });

  doc.setLineWidth(0.3);
  doc.setDrawColor(...PDF_COLORS.gray300);
  doc.line(15 + colWidth * 0.5 - 30, sigY + 15, 15 + colWidth * 0.5 + 30, sigY + 15);

  doc.setFontSize(PDF_FONTS.tinySize);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.gray500);
  doc.text(t(certificate.signatureName || certificate.issuer), 15 + colWidth * 0.5, sigY + 20, { align: 'center' });
  doc.text(t(certificate.signatureTitle || ''), 15 + colWidth * 0.5, sigY + 24, { align: 'center' });

  // Firma yetkilisi imza
  doc.setFontSize(PDF_FONTS.smallSize);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.gray700);
  doc.text(t('Firma Yetkilisi'), 15 + colWidth * 1.5, sigY, { align: 'center' });

  doc.line(15 + colWidth * 1.5 - 30, sigY + 15, 15 + colWidth * 1.5 + 30, sigY + 15);

  doc.setFontSize(PDF_FONTS.tinySize);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.gray500);
  doc.text(t(company?.contactPerson || ''), 15 + colWidth * 1.5, sigY + 20, { align: 'center' });

  // Personel imza
  doc.setFontSize(PDF_FONTS.smallSize);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.gray700);
  doc.text(t('Katilimci'), 15 + colWidth * 2.5, sigY, { align: 'center' });

  doc.line(15 + colWidth * 2.5 - 30, sigY + 15, 15 + colWidth * 2.5 + 30, sigY + 15);

  doc.setFontSize(PDF_FONTS.tinySize);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.gray500);
  doc.text(t(person ? `${person.firstName} ${person.lastName}` : ''), 15 + colWidth * 2.5, sigY + 20, { align: 'center' });

  // ─── FOOTER ─────────────────────────────────────────────────────────────────
  addPdfFooter(doc, osgbSettings?.companyName || certificate.companyName);

  return doc;
};

export const exportCertificatePDF = (options: CertificatePDFOptions): void => {
  const doc = generateCertificatePDF(options);
  const fileName = `Sertifika_${options.certificate.certificateNo}_${options.certificate.title.replace(/\s+/g, '_')}.pdf`;
  doc.save(t(fileName));
};
