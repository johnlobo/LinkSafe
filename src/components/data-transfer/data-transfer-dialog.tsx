'use client';

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Database,
  Download,
  FileText,
  Link2,
  Loader2,
  Upload,
} from 'lucide-react';
import {
  Timestamp,
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import type { DocumentData, QuerySnapshot } from 'firebase/firestore';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  BOOKMARK_CSV_COLUMNS,
  CSV_PREVIEW_ROWS,
  MAX_CSV_FILE_BYTES,
  PROMPT_CSV_COLUMNS,
  exportBookmarksCsv,
  exportPromptsCsv,
  importCounts,
  markDuplicateRows,
  parseCsvImport,
  type BookmarkImportData,
  type CsvImportResult,
  type ImportKind,
  type PromptImportData,
} from '@/lib/csv-transfer';
import { db } from '@/lib/firebase';
import { es } from '@/lib/i18n/es';
import type { Bookmark, Prompt } from '@/lib/types';
import { cn } from '@/lib/utils';

type DataTransferDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type View = 'home' | 'export' | 'import';
type ExportFile = { name: string; content: string; count: number };

const IMPORT_BATCH_SIZE = 400;

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

function downloadCsv(file: ExportFile) {
  const url = URL.createObjectURL(new Blob([file.content], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function snapshotBookmarks(snapshot: QuerySnapshot<DocumentData>): Bookmark[] {
  return snapshot.docs.map((item) => {
    const data = item.data();
    return {
      id: item.id,
      userId: data.userId,
      title: data.title,
      url: data.url,
      description: data.description,
      tags: Array.isArray(data.tags) ? data.tags : [],
      favicon: data.favicon,
      favorite: data.favorite === true,
      createdAt: data.createdAt?.toDate?.().toISOString() ?? '',
    };
  });
}

function snapshotPrompts(snapshot: QuerySnapshot<DocumentData>): Prompt[] {
  return snapshot.docs.map((item) => {
    const data = item.data();
    return {
      id: item.id,
      userId: data.userId,
      title: data.title,
      content: data.content,
      tags: Array.isArray(data.tags) ? data.tags : [],
      notes: data.notes,
      sourceUrl: data.sourceUrl,
      author: data.author,
      language: data.language,
      model: data.model,
      favorite: data.favorite === true,
      createdAt: data.createdAt?.toDate?.().toISOString() ?? '',
      updatedAt: data.updatedAt?.toDate?.().toISOString() ?? '',
    };
  });
}

export function DataTransferDialog({ open, onOpenChange }: DataTransferDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<View>('home');
  const [exportBookmarks, setExportBookmarks] = useState(true);
  const [exportPrompts, setExportPrompts] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportFiles, setExportFiles] = useState<ExportFile[]>([]);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [baseImport, setBaseImport] = useState<CsvImportResult | null>(null);
  const [importResult, setImportResult] = useState<CsvImportResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [operationError, setOperationError] = useState('');

  const busy = exporting || analyzing || importing;

  useEffect(() => {
    if (!open) {
      setView('home');
      setExportFiles([]);
      setSelectedFileName('');
      setBaseImport(null);
      setImportResult(null);
      setOperationError('');
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [open]);

  const counts = useMemo(() => importResult ? importCounts(importResult) : null, [importResult]);

  const loadExisting = async (kind: ImportKind) => {
    if (!user) throw new Error(es.dataTransfer.loginRequired);
    const collectionName = kind === 'bookmarks' ? 'bookmarks' : 'prompts';
    const snapshot = await getDocs(query(collection(db, collectionName), where('userId', '==', user.uid)));
    return kind === 'bookmarks'
      ? { bookmarks: snapshotBookmarks(snapshot).map(({ url }) => ({ url })) }
      : { prompts: snapshotPrompts(snapshot).map(({ title, content }) => ({ title, content })) };
  };

  const handleExport = async () => {
    if (!user || (!exportBookmarks && !exportPrompts)) return;
    setExporting(true);
    setExportFiles([]);
    setOperationError('');
    try {
      const tasks: Promise<ExportFile>[] = [];
      if (exportBookmarks) {
        tasks.push(getDocs(query(collection(db, 'bookmarks'), where('userId', '==', user.uid))).then((snapshot) => {
          const bookmarks = snapshotBookmarks(snapshot);
          return {
            name: `linksafe-enlaces-${dateStamp()}.csv`,
            content: exportBookmarksCsv(bookmarks),
            count: bookmarks.length,
          };
        }));
      }
      if (exportPrompts) {
        tasks.push(getDocs(query(collection(db, 'prompts'), where('userId', '==', user.uid))).then((snapshot) => {
          const prompts = snapshotPrompts(snapshot);
          return {
            name: `linksafe-prompts-${dateStamp()}.csv`,
            content: exportPromptsCsv(prompts),
            count: prompts.length,
          };
        }));
      }
      setExportFiles(await Promise.all(tasks));
    } catch {
      setOperationError(es.dataTransfer.exportError);
    } finally {
      setExporting(false);
    }
  };

  const handleFile = async (file?: File) => {
    setBaseImport(null);
    setImportResult(null);
    setOperationError('');
    setSelectedFileName(file?.name ?? '');
    if (!file) return;
    if (!file.name.toLocaleLowerCase('es').endsWith('.csv')) {
      setOperationError(es.dataTransfer.csvOnly);
      return;
    }
    if (file.size === 0) {
      setOperationError(es.dataTransfer.emptyFile);
      return;
    }
    if (file.size > MAX_CSV_FILE_BYTES) {
      setOperationError(es.dataTransfer.fileTooLarge);
      return;
    }

    setAnalyzing(true);
    try {
      const parsed = parseCsvImport(await file.text());
      setBaseImport(parsed);
      if (parsed.kind) {
        setImportResult(markDuplicateRows(parsed, await loadExisting(parsed.kind)));
      } else {
        setImportResult(parsed);
      }
    } catch {
      setOperationError(es.dataTransfer.readError);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleImport = async () => {
    if (!user || !baseImport?.kind || baseImport.fileErrors.length > 0) return;
    setImporting(true);
    setOperationError('');
    setProgress(0);
    let imported = 0;
    try {
      const latestResult = markDuplicateRows(baseImport, await loadExisting(baseImport.kind));
      setImportResult(latestResult);
      const validRows = latestResult.rows.filter((row) => row.status === 'valid' && row.data);
      for (let offset = 0; offset < validRows.length; offset += IMPORT_BATCH_SIZE) {
        const chunk = validRows.slice(offset, offset + IMPORT_BATCH_SIZE);
        const batch = writeBatch(db);
        for (const row of chunk) {
          if (baseImport.kind === 'bookmarks') {
            const data = row.data as BookmarkImportData;
            const target = doc(collection(db, 'bookmarks'));
            batch.set(target, {
              userId: user.uid,
              title: data.title,
              url: data.url,
              tags: data.tags,
              favorite: data.favorite,
              createdAt: Timestamp.fromDate(new Date(data.createdAt)),
              ...(data.description ? { description: data.description } : {}),
            });
          } else {
            const data = row.data as PromptImportData;
            const target = doc(collection(db, 'prompts'));
            batch.set(target, {
              userId: user.uid,
              title: data.title,
              content: data.content,
              tags: data.tags,
              favorite: data.favorite,
              createdAt: Timestamp.fromDate(new Date(data.createdAt)),
              updatedAt: Timestamp.fromDate(new Date(data.updatedAt)),
              ...(data.notes ? { notes: data.notes } : {}),
              ...(data.sourceUrl ? { sourceUrl: data.sourceUrl } : {}),
              ...(data.author ? { author: data.author } : {}),
              ...(data.language ? { language: data.language } : {}),
              ...(data.model ? { model: data.model } : {}),
            });
          }
        }
        await batch.commit();
        imported += chunk.length;
        setProgress(Math.round((imported / validRows.length) * 100));
      }
      toast({
        title: es.dataTransfer.importComplete,
        description: es.dataTransfer.importedCount(imported),
      });
      onOpenChange(false);
    } catch {
      setOperationError(es.dataTransfer.partialImportError(imported));
    } finally {
      setImporting(false);
    }
  };

  const setDialogOpen = (nextOpen: boolean) => {
    if (!nextOpen && busy) return;
    onOpenChange(nextOpen);
  };

  const backButton = view !== 'home' ? (
    <Button type="button" variant="ghost" size="sm" className="mb-1 w-fit px-0" onClick={() => setView('home')} disabled={busy}>
      <ArrowLeft className="mr-2 h-4 w-4" />
      {es.dataTransfer.back}
    </Button>
  ) : null;

  return (
    <Dialog open={open} onOpenChange={setDialogOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        {backButton}
        {view === 'home' && (
          <>
            <DialogHeader>
              <DialogTitle>{es.dataTransfer.title}</DialogTitle>
              <DialogDescription>{es.dataTransfer.description}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <button type="button" className="rounded-lg border p-5 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setView('export')}>
                <Download className="mb-3 h-6 w-6 text-primary" />
                <span className="block font-semibold">{es.dataTransfer.exportTitle}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{es.dataTransfer.exportDescription}</span>
              </button>
              <button type="button" className="rounded-lg border p-5 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setView('import')}>
                <Upload className="mb-3 h-6 w-6 text-primary" />
                <span className="block font-semibold">{es.dataTransfer.importTitle}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{es.dataTransfer.importDescription}</span>
              </button>
            </div>
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <Database className="mt-0.5 h-4 w-4 shrink-0" />
              {es.dataTransfer.privateProcessing}
            </p>
          </>
        )}

        {view === 'export' && (
          <>
            <DialogHeader>
              <DialogTitle>{es.dataTransfer.exportTitle}</DialogTitle>
              <DialogDescription>{es.dataTransfer.exportDialogDescription}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Label className="text-base">{es.dataTransfer.selectLibraries}</Label>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-4">
                <Checkbox checked={exportBookmarks} onCheckedChange={(checked) => { setExportBookmarks(checked === true); setExportFiles([]); }} />
                <Link2 className="h-5 w-5 text-muted-foreground" />
                <span>{es.navigation.links}</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-4">
                <Checkbox checked={exportPrompts} onCheckedChange={(checked) => { setExportPrompts(checked === true); setExportFiles([]); }} />
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span>{es.navigation.prompts}</span>
              </label>
              <p className="text-sm text-muted-foreground">{es.dataTransfer.separateFiles}</p>
            </div>
            {operationError && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>{es.common.error}</AlertTitle><AlertDescription>{operationError}</AlertDescription></Alert>}
            {exportFiles.length > 0 && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>{es.dataTransfer.filesReady}</AlertTitle>
                <AlertDescription>
                  <div className="mt-3 flex flex-col gap-2">
                    {exportFiles.map((file) => (
                      <Button key={file.name} type="button" variant="outline" className="justify-start" onClick={() => downloadCsv(file)}>
                        <Download className="mr-2 h-4 w-4" />
                        {file.name} ({es.dataTransfer.recordCount(file.count)})
                      </Button>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={busy}>{es.common.close}</Button>
              <Button type="button" onClick={handleExport} disabled={busy || (!exportBookmarks && !exportPrompts)}>
                {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                {es.dataTransfer.prepareFiles}
              </Button>
            </DialogFooter>
          </>
        )}

        {view === 'import' && (
          <>
            <DialogHeader>
              <DialogTitle>{es.dataTransfer.importTitle}</DialogTitle>
              <DialogDescription>{es.dataTransfer.importDialogDescription}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="mb-2 font-medium">{es.dataTransfer.requiredStructure}</p>
                <p className="text-sm font-medium">{es.navigation.links}</p>
                <code className="block overflow-x-auto whitespace-nowrap py-1 text-xs text-muted-foreground">{BOOKMARK_CSV_COLUMNS.join(';')}</code>
                <p className="mt-3 text-sm font-medium">{es.navigation.prompts}</p>
                <code className="block overflow-x-auto whitespace-nowrap py-1 text-xs text-muted-foreground">{PROMPT_CSV_COLUMNS.join(';')}</code>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                  <li>{es.dataTransfer.requiredFields}</li>
                  <li>{es.dataTransfer.tagsFormat}</li>
                  <li>{es.dataTransfer.importLimits}</li>
                </ul>
              </div>
              <div>
                <Label htmlFor="csv-file">{es.dataTransfer.chooseFile}</Label>
                <input
                  ref={fileInputRef}
                  id="csv-file"
                  type="file"
                  accept=".csv,text/csv"
                  className="mt-2 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1 file:text-secondary-foreground"
                  onChange={(event) => handleFile(event.target.files?.[0])}
                  disabled={busy}
                />
                {selectedFileName && <p className="mt-1 text-xs text-muted-foreground">{selectedFileName}</p>}
              </div>
              {analyzing && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{es.dataTransfer.analyzing}</div>}
              {operationError && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>{es.common.error}</AlertTitle><AlertDescription>{operationError}</AlertDescription></Alert>}
              {importResult && (
                <>
                  {importResult.fileErrors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>{es.dataTransfer.invalidFile}</AlertTitle>
                      <AlertDescription><ul className="list-disc pl-5">{importResult.fileErrors.map((error) => <li key={error}>{error}</li>)}</ul></AlertDescription>
                    </Alert>
                  )}
                  {importResult.kind && counts && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2 text-sm">
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">{es.dataTransfer.detectedType(importResult.kind === 'bookmarks' ? es.navigation.links : es.navigation.prompts)}</span>
                        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-700 dark:text-emerald-300">{es.dataTransfer.validCount(counts.valid)}</span>
                        <span className="rounded-full bg-amber-500/10 px-3 py-1 text-amber-700 dark:text-amber-300">{es.dataTransfer.duplicateCount(counts.duplicate)}</span>
                        <span className="rounded-full bg-destructive/10 px-3 py-1 text-destructive">{es.dataTransfer.invalidCount(counts.invalid)}</span>
                      </div>
                      <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border p-2">
                        {importResult.rows.slice(0, CSV_PREVIEW_ROWS).map((row) => (
                          <div key={row.rowNumber} className="grid grid-cols-[auto_1fr] gap-3 rounded-md p-2 text-sm hover:bg-muted/50">
                            <span className={cn('mt-0.5 h-2.5 w-2.5 rounded-full', row.status === 'valid' && 'bg-emerald-500', row.status === 'duplicate' && 'bg-amber-500', row.status === 'invalid' && 'bg-destructive')} />
                            <div className="min-w-0">
                              <p className="truncate font-medium">{es.dataTransfer.row(row.rowNumber)}: {row.title || es.dataTransfer.noTitle}</p>
                              <p className="truncate text-xs text-muted-foreground">{row.error ?? row.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {importResult.rows.length > CSV_PREVIEW_ROWS && <p className="text-xs text-muted-foreground">{es.dataTransfer.previewLimit(CSV_PREVIEW_ROWS, importResult.rows.length)}</p>}
                    </div>
                  )}
                </>
              )}
              {importing && <div className="space-y-2"><Progress value={progress} /><p className="text-xs text-muted-foreground">{es.dataTransfer.importProgress(progress)}</p></div>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={busy}>{es.common.cancel}</Button>
              <Button
                type="button"
                onClick={handleImport}
                disabled={busy || !counts || counts.valid === 0 || Boolean(importResult?.fileErrors.length)}
              >
                {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {counts ? es.dataTransfer.importValid(counts.valid) : es.dataTransfer.importAction}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
