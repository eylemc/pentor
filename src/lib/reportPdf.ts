import type { ReportResponse } from '@/services/api';

type PdfLine = { text: string; bold?: boolean; size?: number; color?: [number, number, number]; gap?: number; minSpace?: number };

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 46;
const TOP = 74;
const BOTTOM = 48;

function ascii(value: unknown): string {
  return String(value ?? '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2192/g, '->')
    .replace(/\u00a0/g, ' ')
    .split('')
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code === 10 || (code >= 32 && code <= 126);
    })
    .join('');
}

function wrap(text: string, width: number): string[] {
  const paragraphs = ascii(text).split(/\n/);
  const output: string[] = [];
  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
      output.push('');
      continue;
    }
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length <= width) line = candidate;
      else {
        if (line) output.push(line);
        line = word;
      }
    }
    if (line) output.push(line);
  }
  return output;
}

function escapePdf(text: string): string {
  return ascii(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function reportLines(report: ReportResponse): PdfLine[] {
  const lines: PdfLine[] = [
    { text: 'SECURITY REPORT', bold: true, size: 22, color: [8, 13, 20], gap: 8 },
    { text: report.domain, bold: true, size: 14, color: [16, 185, 129] },
    { text: `${report.tier ?? 'Security Scan'}  |  Generated ${new Date(report.generatedAt).toLocaleString('en-US')}`, size: 11, color: [100, 116, 139], gap: 12 },
    { text: `SECURITY SCORE: ${report.score}/100`, bold: true, size: 17, color: report.score >= 85 ? [16, 185, 129] : [245, 158, 11] },
    { text: `Critical ${report.severityCounts.critical}   High ${report.severityCounts.high}   Medium ${report.severityCounts.medium}   Low ${report.severityCounts.low}   Passed ${report.severityCounts.passed}`, size: 12, gap: 14 },
    { text: 'EXECUTIVE SUMMARY', bold: true, size: 13, color: [8, 13, 20], gap: 4 },
    ...wrap(report.summary, 70).map((text) => ({ text, size: 12 })),
  ];

  if (report.scanCoverage) {
    lines.push(
      { text: '', gap: 8 },
      { text: 'SCAN COVERAGE', bold: true, size: 13, gap: 4 },
      { text: `${report.scanCoverage.rawMatches} raw matches; ${report.scanCoverage.uniqueMatches} unique findings; ${report.scanCoverage.duplicatesSuppressed} duplicates suppressed.`, size: 11.5 },
      ...report.scanCoverage.passes.map((pass) => ({
        text: `${pass.name}: ${pass.status}, ${pass.source}${pass.elapsedMs != null ? `, ${(pass.elapsedMs / 1000).toFixed(1)}s` : ''}${pass.matches != null ? `, ${pass.matches} matches` : ''}`,
        size: 10.5,
        color: [100, 116, 139] as [number, number, number],
      })),
      ...report.scanCoverage.limitations.flatMap((note) => wrap(`Scope note: ${note}`, 72).map((text) => ({ text, size: 10.5, color: [100, 116, 139] as [number, number, number] }))),
    );
  }

  if (report.dataSecurityCoverage) {
    const coverage = report.dataSecurityCoverage;
    lines.push(
      { text: '', gap: 8 },
      { text: 'DATABASE & INJECTION SECURITY', bold: true, size: 13, gap: 4 },
      ...wrap(`Pentor discovered ${coverage.discovered} public routes and tested ${coverage.tested} selected inputs using ${coverage.requests} security checks. ${(coverage.errorSignals ?? 0) + (coverage.booleanSignals ?? 0)} potential injection issues were confirmed.`, 70).map((text) => ({ text, size: 11.5 })),
      ...wrap(`${(coverage.errorSignals ?? 0) === 0 ? 'No database error exposure was detected.' : 'Database error exposure requires review.'} ${(coverage.booleanSignals ?? 0) === 0 ? 'No repeatable injection behavior was observed.' : 'Repeatable injection behavior requires review.'}`, 70).map((text) => ({ text, size: 10.5, color: [100, 116, 139] as [number, number, number] })),
    );
  }

  if (report.toolSecurityCoverage) {
    const tools = report.toolSecurityCoverage;
    lines.push(
      { text: '', gap: 6 },
      { text: 'INDEPENDENT SQL INJECTION VERIFICATION', bold: true, size: 13, gap: 4 },
      ...wrap(`${tools.sqlmap.length} selected public route(s) received an additional automated SQL injection assessment. ${tools.sqlmap.some((item) => item.vulnerable) ? 'A potential SQL injection point was identified and requires review.' : 'No SQL injection point was confirmed.'}${tools.nmap ? ` Public database services detected: ${tools.nmap.openDatabaseServices.length}.` : ''}`, 70).map((text) => ({ text, size: 11.5 })),
    );
  }

  if (report.rlsSecurityCoverage) {
    const rls = report.rlsSecurityCoverage;
    lines.push(
      { text: '', gap: 6 },
      { text: 'ROW-LEVEL SECURITY', bold: true, size: 13, gap: 4 },
      ...wrap(`Supabase read-only isolation matrix checked ${rls.checked} of ${rls.tables} configured tables. Cross-user exposures: ${rls.crossUserLeaks}; anonymous exposures: ${rls.anonymousLeaks}.`, 70).map((text) => ({ text, size: 11.5 })),
      { text: 'Service-role and administrator keys were not accepted. No row contents were retained.', size: 10.5, color: [100, 116, 139] },
    );
  }

  lines.push(
    { text: '', gap: 12 },
    { text: 'DETAILED FINDINGS', bold: true, size: 16, gap: 12 },
  );
  report.findings.forEach((finding, index) => {
    const block: PdfLine[] = [
      { text: `${index + 1}. [${finding.severity.toUpperCase()}] ${finding.title}`, bold: true, size: 15, color: finding.severity === 'critical' ? [239, 68, 68] : finding.severity === 'high' ? [245, 158, 11] : [8, 13, 20], gap: 5 },
      { text: `${finding.id} | ${finding.category} | ${finding.confidence} confidence | ${finding.severity === 'passed' ? 'no action needed' : finding.status}`, size: 10, color: [100, 116, 139] },
      { text: `Affected area: ${finding.affectedArea}`, bold: true, size: 11.5 },
      ...wrap(`Observed: ${finding.observed}`, 70).map((text) => ({ text, size: 11.5 })),
      ...wrap(`Why it matters: ${finding.impact}`, 70).map((text) => ({ text, size: 11.5 })),
      ...(finding.severity === 'passed' ? [] : wrap(`Recommended fix: ${finding.recommendation}`, 70).map((text) => ({ text, size: 11.5 }))),
      ...finding.references.flatMap((reference) => wrap(`Reference: ${reference}`, 70).map((text) => ({ text, size: 10, color: [100, 116, 139] as [number, number, number] }))),
      { text: '', gap: 7 },
    ];
    const estimatedHeight = block.reduce((total, line) => total + Math.max(10, (line.size ?? 9) * 1.35) + (line.gap ?? 0), 0);
    // Keep the title with a useful portion of the finding without wasting half a page.
    block[0].minSpace = Math.min(estimatedHeight, 190);
    lines.push(...block);
  });
  return lines;
}

function makePdf(report: ReportResponse): Uint8Array {
  const pages: string[][] = [];
  let commands: string[] = [];
  let y = PAGE_HEIGHT - TOP;

  const startPage = () => {
    commands = [
      '0.031 0.051 0.078 rg 0 798 595 44 re f',
      '0.063 0.725 0.506 rg 46 813 10 10 re f',
      '1 1 1 rg BT /F2 13 Tf 63 814 Td (PENTOR) Tj ET',
    ];
    y = PAGE_HEIGHT - TOP;
  };
  const finishPage = () => {
    commands.push('0.88 0.91 0.94 RG 46 38 m 549 38 l S');
    commands.push('0.39 0.45 0.55 rg BT /F1 7.5 Tf 46 25 Td (Controlled, authorized assessment. Results do not prove the absence of other vulnerabilities.) Tj ET');
    pages.push(commands);
  };

  startPage();
  for (const line of reportLines(report)) {
    const size = line.size ?? 9;
    const height = Math.max(10, size * 1.35) + (line.gap ?? 0);
    if ((line.minSpace && y - line.minSpace < BOTTOM) || y - height < BOTTOM) {
      finishPage();
      startPage();
    }
    if (line.text) {
      const [r, g, b] = line.color ?? [36, 47, 62];
      commands.push(`${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} rg BT /${line.bold ? 'F2' : 'F1'} ${size} Tf 0.55 Tw ${MARGIN} ${y.toFixed(1)} Td (${escapePdf(line.text)}) Tj ET`);
    }
    y -= height;
  }
  finishPage();

  const renderedPages = pages.map((page, index) => [
    ...page,
    `0.39 0.45 0.55 rg BT /F1 7.5 Tf 549 25 Td (${index + 1} / ${pages.length}) Tj ET`,
  ].join('\n'));

  const objects: string[] = [];
  const add = (value: string) => { objects.push(value); return objects.length; };
  const fontRegular = add('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman /Encoding /WinAnsiEncoding >>');
  const fontBold = add('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold /Encoding /WinAnsiEncoding >>');
  const contentIds = renderedPages.map((content) => add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`));
  const pagesId = objects.length + renderedPages.length + 1;
  const pageIds = contentIds.map((contentId) => add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> /Contents ${contentId} 0 R >>`));
  add(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`);
  const catalogId = add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  let pdf = '%PDF-1.4\n%PENTOR\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index <= objects.length; index += 1) pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

export async function generateReportPdf(report: ReportResponse): Promise<void> {
  const bytes = makePdf(report);
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeDomain = report.domain.replace(/[^a-z0-9.-]/gi, '-');
  link.href = url;
  link.download = `pentor-${safeDomain}-${new Date(report.generatedAt).toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
