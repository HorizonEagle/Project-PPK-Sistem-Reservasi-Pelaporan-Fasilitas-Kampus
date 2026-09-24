/**
 * Utility functions for exporting data in various formats.
 * Currently supports CSV, but designed to be extensible to Excel and PDF formats.
 */

// Format definitions
export type ExportFormat = 'csv' | 'excel' | 'pdf';

/**
 * Interface representing a standardized column for export
 */
export interface ExportColumn<T> {
  header: string;
  key: keyof T | string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  format?: (value: any, row: T) => string;
}

/**
 * Base options for all export functions
 */
export interface ExportOptions<T> {
  data: T[];
  columns: ExportColumn<T>[];
  filename?: string;
  title?: string;
}

/**
 * Generate CSV string from data array and columns definitions
 */
export function generateCSV<T>({ data, columns }: ExportOptions<T>): string {
  // 1. Generate headers
  const headers = columns.map((col) => `"${col.header.replace(/"/g, '""')}"`);
  
  // 2. Generate rows
  const rows = data.map((item) => {
    return columns.map((col) => {
      // Extract value
      let value: unknown;
      
      // Handle nested keys (e.g., 'user.name')
      if (typeof col.key === 'string' && col.key.includes('.')) {
        const parts = col.key.split('.');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value = parts.reduce((obj: any, part) => (obj ? obj[part] : undefined), item);
      } else {
        value = item[col.key as keyof T];
      }
      
      // Apply custom formatting if provided
      if (col.format) {
        value = col.format(value, item);
      }
      
      // Escape and wrap in quotes for CSV safety
      if (value === null || value === undefined) {
        return '""';
      }
      
      const stringValue = String(value);
      return `"${stringValue.replace(/"/g, '""')}"`;
    });
  });

  // 3. Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(','))
  ].join('\n');
  
  return csvContent;
}

/**
 * Generate HTML string that can be opened by Excel or printed to PDF.
 * This is a lightweight alternative to using complex PDF/Excel libraries.
 */
export function generateHTMLTable<T>({ data, columns, title = 'Export Data' }: ExportOptions<T>): string {
  const headersHTML = columns.map(col => `<th>${escapeHTML(col.header)}</th>`).join('');
  
  const rowsHTML = data.map((item) => {
    const cells = columns.map((col) => {
      let value: unknown;
      
      if (typeof col.key === 'string' && col.key.includes('.')) {
        const parts = col.key.split('.');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value = parts.reduce((obj: any, part) => (obj ? obj[part] : undefined), item);
      } else {
        value = item[col.key as keyof T];
      }
      
      if (col.format) {
        value = col.format(value, item);
      }
      
      return `<td>${escapeHTML(String(value ?? ''))}</td>`;
    });
    return `<tr>${cells.join('')}</tr>`;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(title)}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      color: #333;
    }
    h1 {
      text-align: center;
      color: #1a56db;
      margin-bottom: 20px;
    }
    .date-info {
      text-align: right;
      margin-bottom: 15px;
      font-size: 14px;
      color: #666;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 10px;
      text-align: left;
    }
    th {
      background-color: #f9fafb;
      font-weight: bold;
      color: #374151;
    }
    tr:nth-child(even) {
      background-color: #f9fafb;
    }
    @media print {
      body { margin: 0; padding: 20px; }
      @page { margin: 1cm; size: landscape; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px;">
    <button onclick="window.print()" style="padding: 8px 16px; background-color: #1a56db; color: white; border: none; border-radius: 4px; cursor: pointer;">
      Cetak / Simpan PDF
    </button>
  </div>
  
  <h1>${escapeHTML(title)}</h1>
  <div class="date-info">
    Diekspor pada: ${new Date().toLocaleString('id-ID')}
  </div>
  
  <table>
    <thead>
      <tr>
        ${headersHTML}
      </tr>
    </thead>
    <tbody>
      ${rowsHTML}
    </tbody>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Basic HTML escaping to prevent injection when rendering tables
 */
function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
