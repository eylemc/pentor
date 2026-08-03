import { jsPDF } from 'jspdf';
import type { Finding } from '@/data/findings';
import type { ReportResponse } from '@/services/api';

// Kept in a lazy-loaded module so PDF dependencies do not affect the initial application bundle.

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 16;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const COLORS = {
  ink: [8, 13, 20] as const,
  slate: [36, 47, 62] as const,
  muted: [100, 116, 139] as const,
  light: [226, 232, 240] as const,
  green: [16, 185, 129] as const,
  cyan: [6, 182, 212] as const,
  red: [239, 68, 68] as const,
  amber: [245, 158, 11] as const,
  white: [255, 255, 255] as const,
};

function clean(value: unknown): string {
  return String(value ?? '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2192/g, '->')
    .replace(/\u00A0/g, ' ')
    // eslint-disable-next-line no-control-regex
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');
}

function severityColor(severity: Finding['severity']): readonly [number, number, number] {
  if (severity === 'critical') return COLORS.red;
  if (severity === 'high') return COLORS.amber;
  if (severity === 'medium') return COLORS.green;
  if (severity === 'low') return COLORS.cyan;
  if (severity === 'passed') return COLORS.green;
  return COLORS.muted;
}

export function buildReportPdf(report: ReportResponse): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  let y = 0;

  const addPageHeader = (section?: string) => {
    doc.setFillColor(...COLORS.ink);
    doc.rect(0, 0, PAGE_WIDTH, 19, 'F');
    doc.setFillColor(...COLORS.green);
    doc.roundedRect(MARGIN, 5, 8, 8, 1.5, 1.5, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('PENTOR', MARGIN + 12, 11.2);
    if (section) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.light);
      doc.text(clean(section).toUpperCase(), PAGE_WIDTH - MARGIN, 11, { align: 'right' });
    }
    y = 28;
  };

  const newPage = (section?: string) => {
    doc.addPage();
    addPageHeader(section);
  };

  const ensureSpace = (height: number, section?: string) => {
    if (y + height > PAGE_HEIGHT - 18) newPage(section);
  };

  const heading = (text: string, size = 15) => {
    ensureSpace(size * 0.6 + 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    doc.setTextColor(...COLORS.ink);
    doc.text(clean(text), MARGIN, y);
    y += size * 0.55 + 3;
  };

  const paragraph = (text: string, options: { color?: readonly [number, number, number]; size?: number; indent?: number; section?: string } = {}) => {
    const size = options.size ?? 9.2;
    const indent = options.indent ?? 0;
    const lines = doc.splitTextToSize(clean(text), CONTENT_WIDTH - indent);
    const lineHeight = size * 0.43;
    for (const line of lines) {
      ensureSpace(lineHeight + 1, options.section);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(size);
      doc.setTextColor(...(options.color ?? COLORS.slate));
      doc.text(line, MARGIN + indent, y);
      y += lineHeight;
    }
    y += 2;
  };

  const label = (text: string) => {
    ensureSpace(10, 'Detailed Findings');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.3);
    doc.setTextColor(...COLORS.muted);
    doc.text(clean(text).toUpperCase(), MARGIN, y);
    y += 4.2;
  };

  // Cover and executive summary
  addPageHeader('Security Report');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(25);
  doc.setTextColor(...COLORS.ink);
  doc.text('Security Report', MARGIN, y + 7);
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.muted);
  doc.text(clean(report.domain), MARGIN, y);
  doc.text(clean(report.tier ?? 'Security Scan'), PAGE_WIDTH - MARGIN, y, { align: 'right' });
  y += 12;

  doc.setFillColor(247, 250, 252);
  doc.setDrawColor(...COLORS.light);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 45, 3, 3, 'FD');
  const scoreColor = report.score >= 85 ? COLORS.green : COLORS.amber;
  doc.setDrawColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.setLineWidth(3.2);
  doc.circle(MARGIN + 23, y + 22.5, 14, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(21);
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.text(String(report.score), MARGIN + 23, y + 21.5, { align: 'center' });
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.muted);
  doc.text('/100', MARGIN + 23, y + 27, { align: 'center' });
  const counts = report.severityCounts;
  const stats = [
    ['CRITICAL', counts.critical, COLORS.red], ['HIGH', counts.high, COLORS.amber],
    ['MEDIUM', counts.medium, COLORS.green], ['LOW', counts.low, COLORS.cyan], ['PASSED', counts.passed, COLORS.green],
  ] as const;
  stats.forEach(([name, value, color], index) => {
    const x = MARGIN + 54 + index * 24;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(String(value), x, y + 21, { align: 'center' });
    doc.setFontSize(6.2);
    doc.setTextColor(...COLORS.muted);
    doc.text(name, x, y + 27, { align: 'center' });
  });
  y += 55;
  heading('Executive summary', 14);
  paragraph(report.summary);
  paragraph(`Generated: ${new Date(report.generatedAt).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}`, { color: COLORS.muted, size: 8.2 });

  if (report.scanCoverage) {
    heading('Advanced scan coverage', 14);
    paragraph(`${report.scanCoverage.rawMatches} raw matches, ${report.scanCoverage.uniqueMatches} unique findings, and ${report.scanCoverage.duplicatesSuppressed} duplicate results suppressed.`);
    for (const pass of report.scanCoverage.passes) {
      ensureSpace(13, 'Scan Coverage');
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 10, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.2);
      doc.setTextColor(...COLORS.ink);
      doc.text(clean(pass.name), MARGIN + 3, y + 4.2);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(...COLORS.muted);
      const detail = `${pass.status} | ${pass.source}${pass.elapsedMs != null ? ` | ${(pass.elapsedMs / 1000).toFixed(1)}s` : ''}${pass.matches != null ? ` | ${pass.matches} matches` : ''}`;
      doc.text(clean(detail), MARGIN + 3, y + 7.7);
      y += 12;
    }
    report.scanCoverage.limitations.forEach((item) => paragraph(`Scope note: ${item}`, { color: COLORS.muted, size: 8.2 }));
  }

  // Detailed findings
  newPage('Detailed Findings');
  heading('Detailed findings', 18);
  paragraph(`${report.findings.length} findings are listed below in severity order. Passed checks are included to document observed coverage.`, { color: COLORS.muted });

  report.findings.forEach((finding, index) => {
    ensureSpace(38, 'Detailed Findings');
    if (index > 0) {
      doc.setDrawColor(...COLORS.light);
      doc.line(MARGIN, y - 2, PAGE_WIDTH - MARGIN, y - 2);
      y += 3;
    }
    const color = severityColor(finding.severity);
    doc.setFillColor(...color);
    doc.roundedRect(MARGIN, y - 3.6, 23, 6, 1.2, 1.2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.white);
    doc.text(finding.severity.toUpperCase(), MARGIN + 11.5, y + 0.5, { align: 'center' });
    doc.setTextColor(...COLORS.ink);
    doc.setFontSize(11.5);
    const titleLines = doc.splitTextToSize(clean(finding.title), CONTENT_WIDTH - 31);
    doc.text(titleLines, MARGIN + 29, y);
    y += Math.max(8, titleLines.length * 5 + 2);
    paragraph(`${finding.id} | ${finding.category} | ${finding.confidence} confidence | ${finding.status}`, { color: COLORS.muted, size: 7.6 });
    label('Affected area');
    paragraph(finding.affectedArea, { size: 8.8, section: 'Detailed Findings' });
    label('What Pentor observed');
    paragraph(finding.observed, { size: 8.8, section: 'Detailed Findings' });
    label('Why it matters');
    paragraph(finding.impact, { size: 8.8, section: 'Detailed Findings' });
    label('Recommended fix');
    paragraph(finding.recommendation, { size: 8.8, section: 'Detailed Findings' });
    if (finding.references?.length) {
      label('References');
      finding.references.forEach((reference) => paragraph(`- ${reference}`, { size: 7.8, color: COLORS.muted, indent: 2, section: 'Detailed Findings' }));
    }
    y += 3;
  });

  // Disclaimer and page numbers
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...COLORS.light);
    doc.line(MARGIN, PAGE_HEIGHT - 12, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(...COLORS.muted);
    doc.text('Pentor - Controlled, authorized security assessment. Results do not prove the absence of other vulnerabilities.', MARGIN, PAGE_HEIGHT - 7);
    doc.text(`${page} / ${pages}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 7, { align: 'right' });
  }
  return doc;
}

export async function generateReportPdf(report: ReportResponse): Promise<void> {
  const doc = buildReportPdf(report);
  const safeDomain = report.domain.replace(/[^a-z0-9.-]/gi, '-');
  doc.save(`pentor-${safeDomain}-${new Date(report.generatedAt).toISOString().slice(0, 10)}.pdf`);
}
