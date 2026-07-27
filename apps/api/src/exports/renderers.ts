import { Workbook } from 'exceljs';
// pdfkit ne fournit pas de types ESM par défaut (esModuleInterop désactivé dans ce projet, comme
// pour `nodemailer` ailleurs) — import namespace explicite, la valeur exportée (`export =`) a sa
// propre signature de construction (voir @types/pdfkit).
import * as PDFDocument from 'pdfkit';

export interface ExportColumn {
  key: string;
  label: string;
}

export interface ExportTableData {
  columns: ExportColumn[];
  rows: Record<string, string | number | null>[];
}

function cellText(value: string | number | null | undefined): string {
  return value === null || value === undefined ? '' : String(value);
}

/** RM-EXP-004/17.6 : CSV — implémentation minimale, pas de dépendance externe (RFC4180 basique). */
export function renderCsv(data: ExportTableData): Buffer {
  const escape = (value: string): string => {
    if (/[",\n;]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };
  const lines = [data.columns.map((c) => escape(c.label)).join(';')];
  for (const row of data.rows) {
    lines.push(data.columns.map((c) => escape(cellText(row[c.key]))).join(';'));
  }
  // BOM UTF-8 : Excel (et la plupart des tableurs) n'affichent correctement les accents en CSV
  // qu'avec ce préfixe, sinon les caractères français (é, è, à...) s'affichent mal à l'ouverture.
  return Buffer.concat([Buffer.from('﻿', 'utf8'), Buffer.from(lines.join('\r\n'), 'utf8')]);
}

/** RM-EXP-004/17.6 : Excel, via `exceljs`. */
export async function renderExcel(title: string, data: ExportTableData): Promise<Buffer> {
  const workbook = new Workbook();
  workbook.creator = 'GROUPI';
  workbook.created = new Date();
  const sheet = workbook.addWorksheet(title.slice(0, 31) || 'Export');
  sheet.columns = data.columns.map((c) => ({ header: c.label, key: c.key, width: 22 }));
  sheet.getRow(1).font = { bold: true };
  for (const row of data.rows) {
    sheet.addRow(row);
  }
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * RM-EXP-004/17.6 : PDF, via `pdfkit` — table dessinée "à la main" (positionnement de texte en
 * grille) plutôt qu'avec l'API `.table()` documentée par `@types/pdfkit` : la version de `pdfkit`
 * installée dans ce projet ne l'implémente pas encore (décalage entre les typings et le paquet
 * publié), une dépendance dessus aurait échoué au runtime malgré une compilation TypeScript propre.
 */
export function renderPdf(title: string, subtitle: string, data: ExportTableData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 32, size: 'A4', layout: 'landscape' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(16).font('Helvetica-Bold').fillColor('#0e3a5c').text('GROUPI');
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#111').text(title);
    doc.fontSize(9).font('Helvetica').fillColor('#555').text(subtitle);
    doc.moveDown(0.75);

    const columns = data.columns;
    const left = doc.page.margins.left;
    const pageWidth = doc.page.width - left - doc.page.margins.right;
    const colWidth = pageWidth / Math.max(columns.length, 1);
    const rowHeight = 16;
    const bottomLimit = doc.page.height - doc.page.margins.bottom;

    function drawHeaderRow(y: number): void {
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#0e3a5c');
      columns.forEach((col, i) => {
        doc.text(col.label, left + i * colWidth, y, { width: colWidth - 4, ellipsis: true });
      });
      doc
        .moveTo(left, y + rowHeight - 3)
        .lineTo(left + pageWidth, y + rowHeight - 3)
        .strokeColor('#0e3a5c')
        .lineWidth(0.75)
        .stroke();
    }

    let y = doc.y;
    drawHeaderRow(y);
    y += rowHeight;

    if (data.rows.length === 0) {
      // ERR-EXP-002 : aucune donnée correspondant aux critères — export vide mais généré quand même,
      // avec un message d'information plutôt qu'un fichier totalement muet.
      doc.fontSize(9).font('Helvetica-Oblique').fillColor('#555').text('Aucune donnée ne correspond aux critères sélectionnés.', left, y + 6);
    }

    for (const row of data.rows) {
      if (y + rowHeight > bottomLimit) {
        doc.addPage();
        y = doc.page.margins.top;
        drawHeaderRow(y);
        y += rowHeight;
      }
      doc.fontSize(7.5).font('Helvetica').fillColor('#111');
      columns.forEach((col, i) => {
        doc.text(cellText(row[col.key]), left + i * colWidth, y, { width: colWidth - 4, ellipsis: true });
      });
      y += rowHeight;
    }

    doc.end();
  });
}
