import { describe, expect, it } from 'vitest';

import {
  BOOKMARK_CSV_COLUMNS,
  MAX_CSV_ROWS,
  exportBookmarksCsv,
  exportPromptsCsv,
  importCounts,
  markDuplicateRows,
  parseCsvImport,
} from './csv-transfer';

const now = new Date('2026-09-28T12:00:00.000Z');

describe('CSV export', () => {
  it('exports bookmarks with a BOM, semicolon separator and no private identifiers', () => {
    const csv = exportBookmarksCsv([{
      id: 'private-id',
      userId: 'private-user',
      title: 'Example',
      url: 'https://example.com',
      description: 'Description',
      tags: ['work', 'AI'],
      favorite: true,
      favicon: 'https://example.com/favicon.ico',
      createdAt: '2026-01-02T03:04:05.000Z',
    }]);

    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain(BOOKMARK_CSV_COLUMNS.join(';'));
    expect(csv).toContain('[""work"",""AI""]');
    expect(csv).not.toContain('private-id');
    expect(csv).not.toContain('private-user');
    expect(csv).not.toContain('favicon.ico');
  });

  it('neutralizes spreadsheet formulae in untrusted fields', () => {
    const csv = exportPromptsCsv([{
      id: 'prompt-id',
      userId: 'user-id',
      title: '=HYPERLINK("https://example.com")',
      content: '+SUM(1,2)',
      tags: [],
      favorite: false,
      createdAt: '2026-01-02T03:04:05.000Z',
      updatedAt: '2026-01-02T03:04:05.000Z',
    }]);

    expect(csv).toContain("'=HYPERLINK");
    expect(csv).toContain("'+SUM");
  });

  it('keeps the header row when a library is empty', () => {
    expect(exportBookmarksCsv([])).toBe(`\uFEFF${BOOKMARK_CSV_COLUMNS.join(';')}\r\n`);
  });
});

describe('CSV import', () => {
  it('detects a semicolon-separated bookmark file and applies safe defaults', () => {
    const result = parseCsvImport([
      'title;url;tags;favorite',
      'Example;https://example.com;"[""work""]";true',
    ].join('\r\n'), now);

    expect(result.fileErrors).toEqual([]);
    expect(result.kind).toBe('bookmarks');
    expect(result.delimiter).toBe(';');
    expect(result.rows[0]).toMatchObject({ status: 'valid', title: 'Example' });
    expect(result.rows[0].data).toMatchObject({
      url: 'https://example.com',
      tags: ['work'],
      favorite: true,
      createdAt: now.toISOString(),
    });
  });

  it('accepts comma-separated prompts and restores formula-neutralized content', () => {
    const result = parseCsvImport([
      'title,content,tags,createdAt,updatedAt',
      "'=Title,\"'+SUM(1,2)\",[],2026-01-01T00:00:00.000Z,2026-01-02T00:00:00.000Z",
    ].join('\n'), now);

    expect(result.kind).toBe('prompts');
    expect(result.rows[0].data).toMatchObject({ title: '=Title', content: '+SUM(1,2)' });
  });

  it('rejects unknown/internal headers without accepting their values', () => {
    const result = parseCsvImport('title;url;userId\nExample;https://example.com;attacker', now);

    expect(result.fileErrors).toContain('Cabeceras no permitidas: userId.');
  });

  it('keeps valid rows and reports invalid rows independently', () => {
    const result = parseCsvImport([
      'title;url;tags;favorite',
      'Valid;https://example.com;[];false',
      'Unsafe;javascript:alert(1);[];false',
      'Bad tags;https://example.org;not-json;false',
    ].join('\n'), now);

    expect(importCounts(result)).toEqual({ valid: 1, invalid: 2, duplicate: 0 });
    expect(result.rows[1].error).toContain('HTTP o HTTPS');
    expect(result.rows[2].error).toContain('lista JSON válida');
  });

  it('rejects future or inconsistent dates', () => {
    const futureBookmark = parseCsvImport(
      'title;url;createdAt\nFuture;https://example.com;2027-01-01T00:00:00.000Z',
      now,
    );
    const inconsistentPrompt = parseCsvImport(
      'title;content;createdAt;updatedAt\nPrompt;Content;2026-01-02T00:00:00.000Z;2026-01-01T00:00:00.000Z',
      now,
    );

    expect(futureBookmark.rows[0].status).toBe('invalid');
    expect(inconsistentPrompt.rows[0].status).toBe('invalid');
  });

  it('marks existing and repeated rows as duplicates', () => {
    const parsed = parseCsvImport([
      'title;url',
      'Existing;https://example.com',
      'Repeated;https://new.example.com',
      'Repeated again;https://new.example.com',
    ].join('\n'), now);
    const result = markDuplicateRows(parsed, { bookmarks: [{ url: 'https://example.com' }] });

    expect(importCounts(result)).toEqual({ valid: 1, invalid: 0, duplicate: 2 });
  });

  it('enforces the maximum number of rows', () => {
    const rows = Array.from({ length: MAX_CSV_ROWS + 1 }, (_, index) => `Title ${index};https://example.com/${index}`);
    const result = parseCsvImport(['title;url', ...rows].join('\n'), now);

    expect(result.fileErrors[0]).toContain('2000 filas');
    expect(result.rows).toHaveLength(MAX_CSV_ROWS);
  });
});
