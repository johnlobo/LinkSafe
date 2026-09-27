'use client';

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { LayoutGrid, List, Rows3 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Header } from '@/components/dashboard/header';
import { LibraryShell } from '@/components/library/library-shell';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { collectMetadataValues } from '@/lib/bookmark-utils';
import { getErrorMessage } from '@/lib/errors';
import { db } from '@/lib/firebase';
import { es } from '@/lib/i18n/es';
import { promptMatchesFilters, sortPrompts, type PromptSortOrder, type PromptViewMode } from '@/lib/prompt-utils';
import type { Prompt } from '@/lib/types';
import { Logo } from '@/components/logo';
import { PromptList } from './prompt-list';
import { usePromptLibraryState } from './prompt-library-state';
import { PromptSidebar } from './prompt-sidebar';

const VIEW_MODE_KEY = 'linksafe:prompts:view-mode';
const SORT_ORDER_KEY = 'linksafe:prompts:sort-order';

function isViewMode(value: string | null): value is PromptViewMode {
  return value === 'big-cards' || value === 'small-cards' || value === 'list';
}

function isSortOrder(value: string | null): value is PromptSortOrder {
  return value === 'updated-desc' || value === 'updated-asc' || value === 'title-asc' || value === 'title-desc';
}

export function PromptsDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const filters = usePromptLibraryState();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [pendingDelete, setPendingDelete] = useState<Prompt | null>(null);
  const [viewMode, setViewMode] = useState<PromptViewMode>('big-cards');
  const [sortOrder, setSortOrder] = useState<PromptSortOrder>('updated-desc');
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  useEffect(() => {
    const savedView = window.localStorage.getItem(VIEW_MODE_KEY);
    const savedSort = window.localStorage.getItem(SORT_ORDER_KEY);
    if (isViewMode(savedView)) setViewMode(savedView);
    if (isSortOrder(savedSort)) setSortOrder(savedSort);
    setPreferencesLoaded(true);
  }, []);

  useEffect(() => { if (preferencesLoaded) window.localStorage.setItem(VIEW_MODE_KEY, viewMode); }, [preferencesLoaded, viewMode]);
  useEffect(() => { if (preferencesLoaded) window.localStorage.setItem(SORT_ORDER_KEY, sortOrder); }, [preferencesLoaded, sortOrder]);

  useEffect(() => {
    if (!loading && !user) router.replace('/login?next=%2Fprompts');
  }, [loading, router, user]);

  useEffect(() => {
    if (!user) return;
    const promptsQuery = query(collection(db, 'prompts'), where('userId', '==', user.uid));
    return onSnapshot(promptsQuery, (snapshot) => {
      setPrompts(snapshot.docs.map((item) => {
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
          createdAt: data.createdAt?.toDate?.().toISOString() ?? new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.().toISOString() ?? new Date().toISOString(),
        } satisfies Prompt;
      }));
    }, (error) => {
      toast({ variant: 'destructive', title: es.common.error, description: getErrorMessage(error, es.common.unexpectedError) });
    });
  }, [toast, user]);

  const tags = useMemo(() => collectMetadataValues(prompts.flatMap((prompt) => prompt.tags)), [prompts]);
  const languages = useMemo(() => collectMetadataValues(prompts.map((prompt) => prompt.language).filter((value): value is string => Boolean(value))), [prompts]);
  const models = useMemo(() => collectMetadataValues(prompts.map((prompt) => prompt.model).filter((value): value is string => Boolean(value))), [prompts]);
  const favoriteCount = useMemo(() => prompts.filter((prompt) => prompt.favorite).length, [prompts]);
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const prompt of prompts) {
      for (const tag of new Set(prompt.tags.map((value) => value.trim().toLocaleLowerCase('es')))) {
        if (tag) counts[tag] = (counts[tag] ?? 0) + 1;
      }
    }
    return counts;
  }, [prompts]);
  const visiblePrompts = useMemo(() => sortPrompts(prompts.filter((prompt) => promptMatchesFilters(prompt, filters)), sortOrder), [filters, prompts, sortOrder]);

  const createPrompt = () => router.push('/prompts/new');

  const copyPrompt = async (prompt: Prompt) => {
    try {
      await navigator.clipboard.writeText(prompt.content);
      toast({ title: es.prompts.copied, description: es.prompts.copiedDescription });
    } catch {
      toast({ variant: 'destructive', title: es.common.error, description: es.prompts.copyFailed });
    }
  };

  const toggleFavorite = async (prompt: Prompt) => {
    try {
      await updateDoc(doc(db, 'prompts', prompt.id), { favorite: !prompt.favorite, updatedAt: serverTimestamp() });
      toast({ title: es.common.success, description: prompt.favorite ? es.prompts.favoriteRemoved : es.prompts.favoriteAdded });
    } catch (error: unknown) {
      toast({ variant: 'destructive', title: es.common.error, description: getErrorMessage(error, es.common.unexpectedError) });
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteDoc(doc(db, 'prompts', pendingDelete.id));
      toast({ title: es.prompts.deletedTitle, description: es.prompts.deletedDescription });
    } catch (error: unknown) {
      toast({ variant: 'destructive', title: es.common.error, description: getErrorMessage(error, es.common.unexpectedError) });
    } finally {
      setPendingDelete(null);
    }
  };

  if (loading || !user) return <div className="flex h-screen items-center justify-center"><Logo className="animate-pulse" /></div>;

  return (
    <LibraryShell
      activeLibrary="prompts"
      header={<Header searchText={filters.searchText} setSearchText={filters.setSearchText} onCreate={createPrompt} searchPlaceholder={es.prompts.search} createLabel={es.prompts.create} />}
      sidebarContent={(
        <PromptSidebar
          tags={tags}
          languages={languages}
          models={models}
          selectedTags={filters.selectedTags}
          selectedLanguages={filters.selectedLanguages}
          selectedModels={filters.selectedModels}
          favoritesOnly={filters.favoritesOnly}
          totalCount={prompts.length}
          favoriteCount={favoriteCount}
          tagCounts={tagCounts}
          onTagsChange={filters.setSelectedTags}
          onLanguagesChange={filters.setSelectedLanguages}
          onModelsChange={filters.setSelectedModels}
          onFavoritesChange={filters.setFavoritesOnly}
        />
      )}
    >
      <main className="flex-1 p-4 md:p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="text-sm font-medium text-primary">{es.navigation.privateAccount}</p><h1 className="text-3xl font-semibold">{es.prompts.title}</h1><p className="text-muted-foreground">{es.prompts.subtitle}</p></div>
          <div className="flex items-center gap-2">
            <ToggleGroup type="single" value={viewMode} onValueChange={(value) => { if (isViewMode(value)) setViewMode(value); }} aria-label={es.bookmarks.viewMode}>
              <ToggleGroupItem value="big-cards" aria-label={es.bookmarks.bigCards}><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
              <ToggleGroupItem value="small-cards" aria-label={es.bookmarks.smallCards}><Rows3 className="h-4 w-4" /></ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label={es.bookmarks.list}><List className="h-4 w-4" /></ToggleGroupItem>
            </ToggleGroup>
            <Select value={sortOrder} onValueChange={(value) => { if (isSortOrder(value)) setSortOrder(value); }}>
              <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="updated-desc">{es.prompts.updatedNewest}</SelectItem>
                <SelectItem value="updated-asc">{es.prompts.updatedOldest}</SelectItem>
                <SelectItem value="title-asc">{es.bookmarks.titleAsc}</SelectItem>
                <SelectItem value="title-desc">{es.bookmarks.titleDesc}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <PromptList prompts={visiblePrompts} viewMode={viewMode} onCreate={createPrompt} onCopy={copyPrompt} onDelete={setPendingDelete} onToggleFavorite={toggleFavorite} />
      </main>
      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{es.prompts.deleteTitle}</AlertDialogTitle><AlertDialogDescription>{es.prompts.deleteDescription}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{es.common.cancel}</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{es.common.delete}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LibraryShell>
  );
}
