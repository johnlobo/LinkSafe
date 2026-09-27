import Papa from 'papaparse';

import { isHttpUrl } from './bookmark-utils';
import type { Bookmark, Prompt } from './types';

export const MAX_CSV_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_CSV_ROWS = 2_000;
export const CSV_PREVIEW_ROWS = 20;

export const BOOKMARK_CSV_COLUMNS = [
  'title',
  'url',
  'description',
  'tags',
  'favorite',
  'createdAt',
] as const;

export const PROMPT_CSV_COLUMNS = [
  'title',
  'content',
  'tags',
  'notes',
  'sourceUrl',
  'author',
  'language',
  'model',
  'favorite',
  'createdAt',
  'updatedAt',
] as const;

export type ImportKind = 'bookmarks' | 'prompts';

export type BookmarkImportData = {
  title: string;
  url: string;
  description?: string;
  tags: string[];
  favorite: boolean;
  createdAt: string;
};

export type PromptImportData = {
  title: string;
  content: string;
  tags: string[];
  notes?: string;
  sourceUrl?: string;
  author?: string;
  language?: string;
  model?: string;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ImportData = BookmarkImportData | PromptImportData;

export type ImportRow = {
  rowNumber: number;
  title: string;
  detail: string;
  status: 'valid' | 'invalid' | 'duplicate';
  error?: string;
  data?: ImportData;
};

export type CsvImportResult = {
  kind?: ImportKind;
  delimiter?: string;
  rows: ImportRow[];
  fileErrors: string[];
};

type ExistingRecords = {
  bookmarks?: Pick<Bookmark, 'url'>[];
  prompts?: Pick<Prompt, 'title' | 'content'>[];
};

const FORMULA_PREFIX = "'";
const FORMULA_START = /^[=+\-@\t\r]/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

function exportDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function unescapeExportedFormula(value: string): string {
  return value.startsWith(FORMULA_PREFIX) && FORMULA_START.test(value.slice(1))
    ? value.slice(1)
    : value;
}

export function exportBookmarksCsv(bookmarks: Bookmark[]): string {
  const data = bookmarks.map((bookmark) => ({
    title: bookmark.title,
    url: bookmark.url,
    description: bookmark.description ?? '',
    tags: JSON.stringify(bookmark.tags),
    favorite: bookmark.favorite === true ? 'true' : 'false',
    createdAt: exportDate(bookmark.createdAt),
  }));

  return `\uFEFF${Papa.unparse({ fields: [...BOOKMARK_CSV_COLUMNS], data }, {
    delimiter: ';',
    newline: '\r\n',
    header: true,
    escapeFormulae: true,
  })}`;
}

export function exportPromptsCsv(prompts: Prompt[]): string {
  const data = prompts.map((prompt) => ({
    title: prompt.title,
    content: prompt.content,
    tags: JSON.stringify(prompt.tags),
    notes: prompt.notes ?? '',
    sourceUrl: prompt.sourceUrl ?? '',
    author: prompt.author ?? '',
    language: prompt.language ?? '',
    model: prompt.model ?? '',
    favorite: prompt.favorite ? 'true' : 'false',
    createdAt: exportDate(prompt.createdAt),
    updatedAt: exportDate(prompt.updatedAt),
  }));

  return `\uFEFF${Papa.unparse({ fields: [...PROMPT_CSV_COLUMNS], data }, {
    delimiter: ';',
    newline: '\r\n',
    header: true,
    escapeFormulae: true,
  })}`;
}

function normalizeHeader(header: string): string {
  return header.replace(/^\uFEFF/, '').trim();
}

function detectKind(fields: string[]): ImportKind | undefined {
  const fieldSet = new Set(fields);
  if (fieldSet.has('title') && fieldSet.has('url') && !fieldSet.has('content')) return 'bookmarks';
  if (fieldSet.has('title') && fieldSet.has('content') && !fieldSet.has('url')) return 'prompts';
  return undefined;
}

function parseBoolean(value: string, field: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  throw new Error(`${field} debe ser true o false.`);
}

function parseTags(value: string): string[] {
  if (!value.trim()) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error('tags debe ser una lista JSON válida, por ejemplo ["trabajo","IA"].');
  }
  if (!Array.isArray(parsed)) throw new Error('tags debe ser una lista JSON.');
  if (parsed.length > 20) throw new Error('tags no puede contener más de 20 etiquetas.');

  const tags: string[] = [];
  const seen = new Set<string>();
  for (const tag of parsed) {
    if (typeof tag !== 'string') throw new Error('Todas las etiquetas deben ser texto.');
    const normalized = tag.trim();
    if (!normalized || normalized.length > 50) {
      throw new Error('Cada etiqueta debe tener entre 1 y 50 caracteres.');
    }
    const key = normalized.toLocaleLowerCase('es');
    if (!seen.has(key)) {
      seen.add(key);
      tags.push(normalized);
    }
  }
  return tags;
}

function parseDate(value: string, field: string, fallback: Date, now: Date): string {
  if (!value.trim()) return fallback.toISOString();
  if (!ISO_DATE.test(value.trim())) throw new Error(`${field} debe ser una fecha ISO 8601 válida.`);
  const parsed = new Date(value.trim());
  if (Number.isNaN(parsed.getTime())) throw new Error(`${field} debe ser una fecha ISO 8601 válida.`);
  if (parsed.getTime() > now.getTime()) throw new Error(`${field} no puede estar en el futuro.`);
  return parsed.toISOString();
}

function requiredText(row: Record<string, string>, field: string, maxLength: number): string {
  const value = unescapeExportedFormula(row[field] ?? '').trim();
  if (!value) throw new Error(`${field} es obligatorio.`);
  if (value.length > maxLength) throw new Error(`${field} no puede superar los ${maxLength.toLocaleString('es-ES')} caracteres.`);
  return value;
}

function optionalText(row: Record<string, string>, field: string, maxLength: number): string | undefined {
  const value = unescapeExportedFormula(row[field] ?? '').trim();
  if (!value) return undefined;
  if (value.length > maxLength) throw new Error(`${field} no puede superar los ${maxLength.toLocaleString('es-ES')} caracteres.`);
  return value;
}

function webUrl(row: Record<string, string>, field: string, required: boolean): string | undefined {
  const value = unescapeExportedFormula(row[field] ?? '').trim();
  if (!value && !required) return undefined;
  if (!value) throw new Error(`${field} es obligatorio.`);
  if (value.length > 2_048) throw new Error(`${field} no puede superar los 2.048 caracteres.`);
  if (!isHttpUrl(value)) throw new Error(`${field} debe ser una URL HTTP o HTTPS válida.`);
  return value;
}

function parseBookmarkRow(row: Record<string, string>, now: Date): BookmarkImportData {
  return {
    title: requiredText(row, 'title', 200),
    url: webUrl(row, 'url', true)!,
    description: optionalText(row, 'description', 5_000),
    tags: parseTags(row.tags ?? ''),
    favorite: parseBoolean(row.favorite ?? '', 'favorite'),
    createdAt: parseDate(row.createdAt ?? '', 'createdAt', now, now),
  };
}

function parsePromptRow(row: Record<string, string>, now: Date): PromptImportData {
  const createdAt = parseDate(row.createdAt ?? '', 'createdAt', now, now);
  const updatedAt = parseDate(row.updatedAt ?? '', 'updatedAt', new Date(createdAt), now);
  if (new Date(updatedAt).getTime() < new Date(createdAt).getTime()) {
    throw new Error('updatedAt no puede ser anterior a createdAt.');
  }
  return {
    title: requiredText(row, 'title', 200),
    content: requiredText(row, 'content', 50_000),
    tags: parseTags(row.tags ?? ''),
    notes: optionalText(row, 'notes', 5_000),
    sourceUrl: webUrl(row, 'sourceUrl', false),
    author: optionalText(row, 'author', 200),
    language: optionalText(row, 'language', 200),
    model: optionalText(row, 'model', 200),
    favorite: parseBoolean(row.favorite ?? '', 'favorite'),
    createdAt,
    updatedAt,
  };
}

function rowDetail(kind: ImportKind, data: ImportData): string {
  return kind === 'bookmarks'
    ? (data as BookmarkImportData).url
    : (data as PromptImportData).content;
}

export function parseCsvImport(csv: string, now = new Date()): CsvImportResult {
  const result = Papa.parse<Record<string, string>>(csv, {
    header: true,
    delimiter: '',
    delimitersToGuess: [',', ';'],
    dynamicTyping: false,
    skipEmptyLines: 'greedy',
    transformHeader: normalizeHeader,
  });
  const fields = result.meta.fields ?? [];
  const kind = detectKind(fields);
  const fileErrors: string[] = [];

  if (result.meta.delimiter !== ',' && result.meta.delimiter !== ';') {
    fileErrors.push('El separador debe ser una coma o un punto y coma.');
  }
  if (!kind) {
    fileErrors.push('No se ha podido identificar la estructura como Enlaces o Prompts.');
  }
  if (result.meta.renamedHeaders && Object.keys(result.meta.renamedHeaders).length > 0) {
    fileErrors.push('El archivo contiene cabeceras duplicadas.');
  }
  if (result.data.length > MAX_CSV_ROWS) {
    fileErrors.push(`El archivo supera el máximo de ${MAX_CSV_ROWS.toLocaleString('es-ES')} filas.`);
  }

  if (kind) {
    const allowed = new Set(kind === 'bookmarks' ? BOOKMARK_CSV_COLUMNS : PROMPT_CSV_COLUMNS);
    const unknown = fields.filter((field) => !allowed.has(field as never));
    if (unknown.length) fileErrors.push(`Cabeceras no permitidas: ${unknown.join(', ')}.`);
  }

  const parseErrorsByRow = new Map<number, string[]>();
  for (const error of result.errors) {
    const rowIndex = error.row ?? -1;
    const messages = parseErrorsByRow.get(rowIndex) ?? [];
    messages.push(error.message);
    parseErrorsByRow.set(rowIndex, messages);
  }

  const rows = result.data.slice(0, MAX_CSV_ROWS).map((rawRow, index): ImportRow => {
    const rowNumber = index + 2;
    const parserErrors = parseErrorsByRow.get(index);
    if (parserErrors?.length) {
      return {
        rowNumber,
        title: rawRow.title ?? '',
        detail: '',
        status: 'invalid',
        error: parserErrors.join(' '),
      };
    }
    if (!kind) {
      return { rowNumber, title: rawRow.title ?? '', detail: '', status: 'invalid', error: 'Estructura desconocida.' };
    }
    try {
      const data = kind === 'bookmarks' ? parseBookmarkRow(rawRow, now) : parsePromptRow(rawRow, now);
      return {
        rowNumber,
        title: data.title,
        detail: rowDetail(kind, data),
        status: 'valid',
        data,
      };
    } catch (error) {
      return {
        rowNumber,
        title: rawRow.title ?? '',
        detail: '',
        status: 'invalid',
        error: error instanceof Error ? error.message : 'Fila inválida.',
      };
    }
  });

  return { kind, delimiter: result.meta.delimiter, rows, fileErrors };
}

export function markDuplicateRows(result: CsvImportResult, existing: ExistingRecords): CsvImportResult {
  if (!result.kind) return result;
  const bookmarkUrls = new Set((existing.bookmarks ?? []).map((item) => item.url.trim()));
  const promptKeys = new Set((existing.prompts ?? []).map((item) => `${item.title}\u0000${item.content}`));

  return {
    ...result,
    rows: result.rows.map((row) => {
      if (row.status !== 'valid' || !row.data) return row;
      const duplicate = result.kind === 'bookmarks'
        ? bookmarkUrls.has((row.data as BookmarkImportData).url.trim())
        : promptKeys.has(`${(row.data as PromptImportData).title}\u0000${(row.data as PromptImportData).content}`);
      if (duplicate) return { ...row, status: 'duplicate', error: 'Ya existe en tu biblioteca.' };

      if (result.kind === 'bookmarks') {
        bookmarkUrls.add((row.data as BookmarkImportData).url.trim());
      } else {
        promptKeys.add(`${(row.data as PromptImportData).title}\u0000${(row.data as PromptImportData).content}`);
      }
      return row;
    }),
  };
}

export function importCounts(result: CsvImportResult) {
  return result.rows.reduce((counts, row) => {
    counts[row.status] += 1;
    return counts;
  }, { valid: 0, invalid: 0, duplicate: 0 });
}
