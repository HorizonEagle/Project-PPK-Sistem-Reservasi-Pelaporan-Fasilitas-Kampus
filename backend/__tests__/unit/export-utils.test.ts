import { describe, it, expect } from 'vitest';
import { generateCSV, generateHTMLTable } from '../../lib/export-utils';
import type { ExportColumn } from '../../lib/export-utils';

// ─── Test Data ────────────────────────────────────────────────────────────────

interface SampleRow {
  id: number;
  name: string;
  status: string;
  user: { name: string };
}

const columns: ExportColumn<SampleRow>[] = [
  { header: 'ID', key: 'id' },
  { header: 'Nama', key: 'name' },
  { header: 'Status', key: 'status', format: (v: string) => v.toUpperCase() },
  { header: 'User', key: 'user.name' },
];

const data: SampleRow[] = [
  { id: 1, name: 'Ruang A101', status: 'active', user: { name: 'Budi' } },
  { id: 2, name: 'Lab Kimia', status: 'inactive', user: { name: 'Siti' } },
];

// ─── generateCSV ──────────────────────────────────────────────────────────────

describe('generateCSV', () => {
  it('generates valid CSV with headers and rows', () => {
    const csv = generateCSV({ data, columns });
    const lines = csv.split('\n');

    expect(lines).toHaveLength(3); // 1 header + 2 data rows
    expect(lines[0]).toBe('"ID","Nama","Status","User"');
  });

  it('applies format function to columns', () => {
    const csv = generateCSV({ data, columns });
    expect(csv).toContain('"ACTIVE"');
    expect(csv).toContain('"INACTIVE"');
  });

  it('resolves nested keys (user.name)', () => {
    const csv = generateCSV({ data, columns });
    expect(csv).toContain('"Budi"');
    expect(csv).toContain('"Siti"');
  });

  it('escapes double quotes in values', () => {
    const dataWithQuotes: SampleRow[] = [
      { id: 1, name: 'Ruang "VIP"', status: 'active', user: { name: 'Test' } },
    ];
    const csv = generateCSV({ data: dataWithQuotes, columns });
    expect(csv).toContain('""VIP""');
  });

  it('handles null/undefined values', () => {
    const dataWithNull = [
      { id: 1, name: 'Test', status: 'active', user: { name: undefined as unknown as string } },
    ];
    const csv = generateCSV({ data: dataWithNull, columns });
    expect(csv).toContain('""');
  });

  it('returns only header line for empty data', () => {
    const csv = generateCSV({ data: [], columns });
    const lines = csv.split('\n');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe('"ID","Nama","Status","User"');
  });
});

// ─── generateHTMLTable ────────────────────────────────────────────────────────

describe('generateHTMLTable', () => {
  it('generates valid HTML document', () => {
    const html = generateHTMLTable({ data, columns, title: 'Laporan Test' });
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
  });

  it('includes the title', () => {
    const html = generateHTMLTable({ data, columns, title: 'Laporan Fasilitas' });
    expect(html).toContain('Laporan Fasilitas');
  });

  it('renders table headers', () => {
    const html = generateHTMLTable({ data, columns });
    expect(html).toContain('<th>ID</th>');
    expect(html).toContain('<th>Nama</th>');
    expect(html).toContain('<th>Status</th>');
    expect(html).toContain('<th>User</th>');
  });

  it('renders data rows', () => {
    const html = generateHTMLTable({ data, columns });
    expect(html).toContain('<td>Ruang A101</td>');
    expect(html).toContain('<td>ACTIVE</td>');
    expect(html).toContain('<td>Budi</td>');
  });

  it('escapes HTML entities in values', () => {
    const xssData: SampleRow[] = [
      { id: 1, name: '<script>alert("xss")</script>', status: 'active', user: { name: 'Test' } },
    ];
    const html = generateHTMLTable({ data: xssData, columns });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('includes print styles', () => {
    const html = generateHTMLTable({ data, columns });
    expect(html).toContain('@media print');
    expect(html).toContain('window.print()');
  });
});
