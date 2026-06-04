/**
 * Shared spreadsheet import/export helpers used by the bulk-import screens
 * (pickups, clients). Reads .csv / .xlsx / .xls and writes downloadable
 * templates.
 *
 * `xlsx` (SheetJS) is ~7MB, so it's loaded with a dynamic `import()` — it
 * only ships in the import route's chunk, never the main client bundle.
 */

export interface ParsedSheet {
  /** Header cells, trimmed and lower-cased (used as record keys). */
  headers: string[];
  /** One record per non-empty data row, keyed by the lower-cased header. */
  rows: Record<string, string>[];
}

/** A spreadsheet-ish file we know how to parse. */
export function isImportableFile(file: File): boolean {
  return /\.(csv|xlsx|xls)$/i.test(file.name);
}

/**
 * Parse the first worksheet of a CSV/XLSX/XLS file into header + row records.
 * Values are read as formatted text (`raw: false`) so money/weights keep the
 * shape the user typed. Fully-blank rows are dropped.
 */
export async function parseSpreadsheet(file: File): Promise<ParsedSheet> {
  const XLSX = await import('xlsx');
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: false });
  const firstSheet = wb.SheetNames[0];
  if (!firstSheet) return { headers: [], rows: [] };
  const ws = wb.Sheets[firstSheet]!;
  const aoa = XLSX.utils.sheet_to_json<string[]>(ws, {
    header: 1,
    blankrows: false,
    defval: '',
    raw: false,
  });
  if (aoa.length === 0) return { headers: [], rows: [] };

  const headers = (aoa[0] ?? []).map((h) => String(h ?? '').trim().toLowerCase());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < aoa.length; i++) {
    const cells = aoa[i] ?? [];
    const record: Record<string, string> = {};
    let hasValue = false;
    headers.forEach((h, idx) => {
      const v = String(cells[idx] ?? '').trim();
      record[h] = v;
      if (v) hasValue = true;
    });
    if (hasValue) rows.push(record);
  }
  return { headers, rows };
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Build and download an .xlsx template: a header row plus a handful of
 * example rows so users can see the expected shape.
 */
export async function downloadXlsxTemplate(
  filename: string,
  headers: string[],
  sampleRows: (string | number)[][],
): Promise<void> {
  const XLSX = await import('xlsx');
  const aoa = [headers, ...sampleRows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  triggerDownload(
    new Blob([out], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    filename,
  );
}

/** Download a plain CSV template (header row + example rows). */
export function downloadCsvTemplate(
  filename: string,
  headers: string[],
  sampleRows: (string | number)[][],
): void {
  const escape = (v: string | number) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers, ...sampleRows].map((r) => r.map(escape).join(','));
  triggerDownload(
    new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }),
    filename,
  );
}
