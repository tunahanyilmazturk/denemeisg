/**
 * Turkish PDF Helper
 * 
 * jsPDF'in varsayılan Helvetica fontu Türkçe özel karakterleri desteklemez.
 * Bu modül Türkçe karakterleri PDF'de doğru görüntülenmesi için dönüştürür
 * ve PDF oluşturma yardımcı fonksiyonları sağlar.
 */

import jsPDF from 'jspdf';

// ============================================================================
// TURKISH CHARACTER MAP
// ============================================================================

const TURKISH_CHAR_MAP: Record<string, string> = {
  'ç': 'c', 'Ç': 'C',
  'ğ': 'g', 'Ğ': 'G', 
  'ı': 'i', 'İ': 'I',
  'ö': 'o', 'Ö': 'O',
  'ş': 's', 'Ş': 'S',
  'ü': 'u', 'Ü': 'U',
};

/**
 * Türkçe özel karakterleri ASCII karşılıklarına dönüştürür.
 * jsPDF Helvetica fontunda Türkçe karakterler gösterilemediği için kullanılır.
 */
export const turkishToAscii = (text: string | undefined | null): string => {
  if (!text) return '-';
  return text.replace(/[çÇğĞıİöÖşŞüÜ]/g, (char) => TURKISH_CHAR_MAP[char] || char);
};

/**
 * Kısaltma: t() - turkishToAscii'nin kısa hali
 */
export const t = turkishToAscii;

// ============================================================================
// PDF STYLING CONSTANTS
// ============================================================================

export const PDF_COLORS = {
  // Primary
  primary: [79, 70, 229] as [number, number, number],       // Indigo-600
  primaryLight: [238, 242, 255] as [number, number, number], // Indigo-50
  primaryDark: [55, 48, 163] as [number, number, number],    // Indigo-800
  
  // Status
  success: [34, 197, 94] as [number, number, number],       // Green-500
  successLight: [220, 252, 231] as [number, number, number], // Green-100
  warning: [245, 158, 11] as [number, number, number],      // Amber-500
  warningLight: [254, 243, 199] as [number, number, number], // Amber-100
  danger: [239, 68, 68] as [number, number, number],        // Red-500
  dangerLight: [254, 226, 226] as [number, number, number], // Red-100
  info: [59, 130, 246] as [number, number, number],         // Blue-500
  infoLight: [219, 234, 254] as [number, number, number],   // Blue-100
  
  // Neutrals
  white: [255, 255, 255] as [number, number, number],
  black: [0, 0, 0] as [number, number, number],
  gray50: [249, 250, 251] as [number, number, number],
  gray100: [243, 244, 246] as [number, number, number],
  gray200: [229, 231, 235] as [number, number, number],
  gray300: [209, 213, 219] as [number, number, number],
  gray400: [156, 163, 175] as [number, number, number],
  gray500: [107, 114, 128] as [number, number, number],
  gray600: [75, 85, 99] as [number, number, number],
  gray700: [55, 65, 81] as [number, number, number],
  gray800: [31, 41, 55] as [number, number, number],
  
  // Accent
  purple: [168, 85, 247] as [number, number, number],
  emerald: [16, 185, 129] as [number, number, number],
  cyan: [6, 182, 212] as [number, number, number],
};

export const PDF_FONTS = {
  titleSize: 16,
  subtitleSize: 13,
  sectionSize: 11,
  bodySize: 9,
  smallSize: 8,
  tinySize: 7,
};

// ============================================================================
// PDF HELPER FUNCTIONS
// ============================================================================

/**
 * PDF'e logo ekler (base64 formatında)
 */
export const addLogo = (doc: jsPDF, logoBase64?: string, x = 15, y = 10, w = 40, h = 15) => {
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', x, y, w, h);
      return true;
    } catch (error) {
      console.warn('Logo eklenemedi:', error);
      return false;
    }
  }
  return false;
};

/**
 * PDF sayfasına üst başlık ekler (logo, firma bilgisi, başlık)
 */
export const addPdfHeader = (
  doc: jsPDF, 
  title: string, 
  options?: {
    logo?: string;
    companyName?: string;
    companyTitle?: string;
    phone?: string;
    email?: string;
    address?: string;
    subtitle?: string;
  }
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  let hasLogo = false;
  
  // Logo
  if (options?.logo) {
    hasLogo = addLogo(doc, options.logo);
  }
  
  // Firma bilgileri - sag taraf
  if (options?.companyName) {
    doc.setFontSize(PDF_FONTS.bodySize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.gray800);
    doc.text(t(options.companyName), pageWidth - 15, 15, { align: 'right' });
    
    doc.setFontSize(PDF_FONTS.tinySize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.gray500);
    let yInfo = 19;
    if (options.companyTitle) {
      doc.text(t(options.companyTitle), pageWidth - 15, yInfo, { align: 'right' });
      yInfo += 3.5;
    }
    if (options.phone) {
      doc.text(`Tel: ${options.phone}`, pageWidth - 15, yInfo, { align: 'right' });
      yInfo += 3.5;
    }
    if (options.email) {
      doc.text(`E-posta: ${options.email}`, pageWidth - 15, yInfo, { align: 'right' });
      yInfo += 3.5;
    }
    if (options.address) {
      doc.text(t(options.address), pageWidth - 15, yInfo, { align: 'right' });
    }
  }
  
  // Baslik
  const titleY = hasLogo ? 35 : 20;
  doc.setFontSize(PDF_FONTS.titleSize);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text(t(title), pageWidth / 2, titleY, { align: 'center' });
  
  // Alt baslik
  if (options?.subtitle) {
    doc.setFontSize(PDF_FONTS.smallSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.gray500);
    doc.text(t(options.subtitle), pageWidth / 2, titleY + 5, { align: 'center' });
  }
  
  // Yatay cizgi
  const lineY = hasLogo ? 42 : (options?.subtitle ? 28 : 25);
  doc.setLineWidth(0.8);
  doc.setDrawColor(...PDF_COLORS.primary);
  doc.line(15, lineY, pageWidth - 15, lineY);
  
  // Ince ikinci cizgi
  doc.setLineWidth(0.3);
  doc.setDrawColor(...PDF_COLORS.gray200);
  doc.line(15, lineY + 1.5, pageWidth - 15, lineY + 1.5);
  
  doc.setTextColor(...PDF_COLORS.black);
  return lineY + 6;
};

/**
 * PDF sayfalarına alt bilgi ekler (sayfa numarası, tarih)
 */
export const addPdfFooter = (doc: jsPDF, companyName?: string) => {
  const pageCount = (doc as any).internal.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Alt cizgi
    doc.setLineWidth(0.3);
    doc.setDrawColor(...PDF_COLORS.gray200);
    doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
    
    doc.setFontSize(PDF_FONTS.tinySize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.gray400);
    
    // Sol: Firma adi
    if (companyName) {
      doc.text(t(companyName), 15, pageHeight - 10);
    }
    
    // Orta: Sayfa numarasi
    doc.text(
      `Sayfa ${i} / ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    
    // Sag: Tarih
    const now = new Date();
    const dateStr = now.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    doc.text(
      `${dateStr} ${timeStr}`,
      pageWidth - 15,
      pageHeight - 10,
      { align: 'right' }
    );
  }
};

/**
 * Bölüm başlığı ekler (renkli arka planlı)
 */
export const addSectionTitle = (
  doc: jsPDF, 
  title: string, 
  yPos: number, 
  color: [number, number, number] = PDF_COLORS.primary
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Arka plan
  doc.setFillColor(...color);
  doc.roundedRect(15, yPos, pageWidth - 30, 8, 1.5, 1.5, 'F');
  
  // Metin
  doc.setFontSize(PDF_FONTS.sectionSize);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.white);
  doc.text(t(title), 20, yPos + 5.5);
  
  doc.setTextColor(...PDF_COLORS.black);
  return yPos + 12;
};

/**
 * Alt bölüm başlığı ekler (ince çizgili)
 */
export const addSubSectionTitle = (
  doc: jsPDF, 
  title: string, 
  yPos: number,
  color: [number, number, number] = PDF_COLORS.primary
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.setFontSize(PDF_FONTS.bodySize + 1);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...color);
  doc.text(t(title), 20, yPos);
  
  doc.setLineWidth(0.5);
  doc.setDrawColor(...color);
  doc.line(20, yPos + 1.5, pageWidth - 20, yPos + 1.5);
  
  doc.setTextColor(...PDF_COLORS.black);
  return yPos + 6;
};

/**
 * Etiket:Değer çifti ekler
 */
export const addField = (
  doc: jsPDF, 
  label: string, 
  value: string | number | undefined | null, 
  x: number, 
  y: number, 
  maxWidth: number = 80
): number => {
  doc.setFontSize(PDF_FONTS.bodySize);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.gray600);
  doc.text(t(label) + ':', x, y);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.black);
  const val = value !== undefined && value !== null ? String(value) : '-';
  const lines = doc.splitTextToSize(t(val), maxWidth);
  doc.text(lines, x, y + 4);
  
  return y + 4 + (lines.length * 4);
};

/**
 * İki sütunlu alan çifti ekler
 */
export const addFieldPair = (
  doc: jsPDF,
  label1: string, value1: string | number | undefined | null,
  label2: string, value2: string | number | undefined | null,
  y: number
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const col1X = 20;
  const col2X = pageWidth / 2 + 5;
  const maxW = (pageWidth - 40) / 2 - 10;
  
  const y1 = addField(doc, label1, value1 !== undefined && value1 !== null ? String(value1) : '-', col1X, y, maxW);
  const y2 = addField(doc, label2, value2 !== undefined && value2 !== null ? String(value2) : '-', col2X, y, maxW);
  
  return Math.max(y1, y2);
};

/**
 * Kutu içinde bilgi alanı
 */
export const addInfoBox = (
  doc: jsPDF,
  yPos: number,
  height: number,
  bgColor: [number, number, number] = PDF_COLORS.gray50,
  borderColor: [number, number, number] = PDF_COLORS.gray200
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.setFillColor(...bgColor);
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.roundedRect(15, yPos, pageWidth - 30, height, 2, 2, 'FD');
  
  return yPos;
};

/**
 * Durum etiketi ekler (renkli rozet)
 */
export const addStatusBadge = (
  doc: jsPDF, 
  text: string, 
  x: number, 
  y: number,
  type: 'success' | 'warning' | 'danger' | 'info' | 'neutral' = 'neutral'
): void => {
  const colorMap = {
    success: { bg: PDF_COLORS.successLight, text: [22, 101, 52] as [number, number, number] },
    warning: { bg: PDF_COLORS.warningLight, text: [146, 64, 14] as [number, number, number] },
    danger: { bg: PDF_COLORS.dangerLight, text: [153, 27, 27] as [number, number, number] },
    info: { bg: PDF_COLORS.infoLight, text: [30, 64, 175] as [number, number, number] },
    neutral: { bg: PDF_COLORS.gray100, text: PDF_COLORS.gray700 },
  };
  
  const colors = colorMap[type];
  const textWidth = doc.getTextWidth(t(text)) + 6;
  
  doc.setFillColor(...colors.bg);
  doc.roundedRect(x, y - 3, textWidth, 5.5, 1, 1, 'F');
  
  doc.setFontSize(PDF_FONTS.smallSize);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.text);
  doc.text(t(text), x + 3, y + 0.5);
  
  doc.setTextColor(...PDF_COLORS.black);
};

/**
 * Sayfa sonu kontrolü - gerekirse yeni sayfa ekler
 */
export const checkPageBreak = (doc: jsPDF, currentY: number, neededSpace: number = 20): number => {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (currentY + neededSpace > pageHeight - 20) {
    doc.addPage();
    return 20;
  }
  return currentY;
};

/**
 * Çok satırlı metin yazar (sayfa sonu kontrolü ile)
 */
export const addMultiLineText = (
  doc: jsPDF, 
  text: string, 
  x: number, 
  y: number, 
  maxWidth: number,
  lineHeight: number = 4
): number => {
  const lines = doc.splitTextToSize(t(text), maxWidth);
  let currentY = y;
  
  for (const line of lines) {
    currentY = checkPageBreak(doc, currentY, lineHeight + 2);
    doc.text(line, x, currentY);
    currentY += lineHeight;
  }
  
  return currentY;
};

/**
 * Madde işaretli liste ekler
 */
export const addBulletList = (
  doc: jsPDF,
  items: string[],
  x: number,
  y: number,
  maxWidth: number = 160,
  bulletColor: [number, number, number] = PDF_COLORS.primary
): number => {
  let currentY = y;
  const pageWidth = doc.internal.pageSize.getWidth();
  const effectiveMaxWidth = Math.min(maxWidth, pageWidth - x - 15);
  
  doc.setFontSize(PDF_FONTS.bodySize);
  doc.setFont('helvetica', 'normal');
  
  items.forEach((item) => {
    currentY = checkPageBreak(doc, currentY, 8);
    
    // Madde isareti (kucuk daire)
    doc.setFillColor(...bulletColor);
    doc.circle(x + 1.5, currentY - 1, 0.8, 'F');
    
    // Metin
    doc.setTextColor(...PDF_COLORS.black);
    const lines = doc.splitTextToSize(t(item), effectiveMaxWidth - 8);
    lines.forEach((line: string, lineIdx: number) => {
      if (lineIdx > 0) currentY = checkPageBreak(doc, currentY, 4);
      doc.text(line, x + 5, currentY);
      if (lineIdx < lines.length - 1) currentY += 4;
    });
    currentY += 5;
  });
  
  return currentY;
};

/**
 * Yatay ayırıcı çizgi
 */
export const addDivider = (
  doc: jsPDF, 
  y: number, 
  color: [number, number, number] = PDF_COLORS.gray200
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setLineWidth(0.3);
  doc.setDrawColor(...color);
  doc.line(20, y, pageWidth - 20, y);
  return y + 3;
};

// ============================================================================
// DATE FORMATTERS
// ============================================================================

export const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (dateStr: string | undefined): string => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
};

export const formatShortDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};
