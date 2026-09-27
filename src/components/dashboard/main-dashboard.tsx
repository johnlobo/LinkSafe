'use client';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import type { Bookmark } from '@/lib/types';
import { db } from '@/lib/firebase';
import { AddBookmarkDialog } from './add-bookmark-dialog';
import { BookmarkList } from './bookmark-list';
import { Header } from './header';
import { SidebarContent } from './sidebar-content';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '../logo';
import { LayoutGrid, List, Rows3 } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { collectMetadataValues, normalizeMetadataValues } from '@/lib/bookmark-utils';
import { getErrorMessage } from '@/lib/errors';
import { LibraryShell } from '@/components/library/library-shell';
import { es } from '@/lib/i18n/es';

type BookmarkSortOrder = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc';
type BookmarkViewMode = 'big-cards' | 'small-cards' | 'list';

const VIEW_MODE_KEY = 'linksafe:bookmarks:view-mode';
const SORT_ORDER_KEY = 'linksafe:bookmarks:sort-order';

function isViewMode(value: string | null): value is BookmarkViewMode {
  return value === 'big-cards' || value === 'small-cards' || value === 'list';
}

function isSortOrder(value: string | null): value is BookmarkSortOrder {
  return value === 'date-desc' || value === 'date-asc' || value === 'title-asc' || value === 'title-desc';
}

export function MainDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<BookmarkSortOrder>('date-desc');
  const [viewMode, setViewMode] = useState<BookmarkViewMode>('big-cards');
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

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
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch current user's bookmarks
  useEffect(() => {
    if (user?.uid) {
      const q = query(collection(db, 'bookmarks'), where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userBookmarks: Bookmark[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          userBookmarks.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
          } as Bookmark);
        });
        setBookmarks(userBookmarks);
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (!dialogOpen) {
      setEditingBookmark(null);
    }
  }, [dialogOpen]);

  useEffect(() => {
    if (!pendingDeleteId) {
      const timer = setTimeout(() => {
        document.body.style.removeProperty('pointer-events');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pendingDeleteId]);


  const handleSaveBookmark = async (bookmarkData: Omit<Bookmark, 'id' | 'createdAt'>, id?: string) => {
    if (!user) {
      toast({ variant: 'destructive', title: es.common.error, description: es.bookmarks.loginRequired });
      return;
    }

    try {
      const dataToSave: Omit<Bookmark, 'id' | 'createdAt'> = {
        ...bookmarkData,
        tags: normalizeMetadataValues(bookmarkData.tags, allCurrentUserTags),
      };
      if (dataToSave.favicon === undefined) {
        delete dataToSave.favicon;
      }

      if (id) {
        // Edit
        const bookmarkRef = doc(db, 'bookmarks', id);
        await updateDoc(bookmarkRef, dataToSave);
        toast({ title: es.common.success, description: es.bookmarks.updated });
      } else {
        // Add
        await addDoc(collection(db, 'bookmarks'), {
          ...dataToSave,
          favorite: dataToSave.favorite ?? false,
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
        toast({ title: es.common.success, description: es.bookmarks.added });
      }
      setDialogOpen(false);
    } catch (error: unknown) {
      toast({ variant: 'destructive', title: es.common.error, description: getErrorMessage(error, es.common.unexpectedError) });
    }
  };

  const openAddDialog = () => {
    setDialogMode('add');
    setEditingBookmark(null);
    setDialogOpen(true);
  };

  const openEditDialog = (bookmark: Bookmark) => {
    setDialogMode('edit');
    setEditingBookmark(bookmark);
    setDialogOpen(true);
  };

  const handleDeleteBookmark = (id: string) => {
    setPendingDeleteId(id);
  };

  const handleToggleFavorite = async (bookmark: Bookmark) => {
    try {
      await updateDoc(doc(db, 'bookmarks', bookmark.id), {
        favorite: !bookmark.favorite,
      });
    } catch (error: unknown) {
      toast({ variant: 'destructive', title: es.common.error, description: getErrorMessage(error, es.common.unexpectedError) });
    }
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await deleteDoc(doc(db, 'bookmarks', pendingDeleteId));
      toast({
        title: es.bookmarks.deletedTitle,
        description: es.bookmarks.deletedDescription,
      });
    } catch (error: unknown) {
      toast({ variant: 'destructive', title: es.common.error, description: getErrorMessage(error, es.common.unexpectedError) });
    } finally {
      setPendingDeleteId(null);
    }
  };

  const allCurrentUserTags = useMemo(() => {
    return collectMetadataValues(bookmarks.flatMap((bookmark) => bookmark.tags));
  }, [bookmarks]);

  const favoriteCount = useMemo(
    () => bookmarks.filter((bookmark) => bookmark.favorite === true).length,
    [bookmarks]
  );

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const bookmark of bookmarks) {
      for (const tag of new Set(bookmark.tags.map((value) => value.trim().toLocaleLowerCase('es')))) {
        if (tag) counts[tag] = (counts[tag] ?? 0) + 1;
      }
    }
    return counts;
  }, [bookmarks]);

  const filteredBookmarks = useMemo(() => {
    return bookmarks
      .filter((bm) => {
        const searchLower = searchText.toLowerCase();
        const bookmarkTags = new Set(bm.tags.map((tag) => tag.trim().toLowerCase()));
        const matchesSearch =
          bm.title.toLowerCase().includes(searchLower) ||
          bm.url.toLowerCase().includes(searchLower) ||
          (bm.description && bm.description.toLowerCase().includes(searchLower));

        const matchesTags =
          selectedTags.length === 0 ||
          selectedTags.every((tag) => bookmarkTags.has(tag.trim().toLowerCase()));

        const matchesFavorites = !showFavoritesOnly || bm.favorite === true;

        return matchesSearch && matchesTags && matchesFavorites;
      })
      .sort((a, b) => {
        switch (sortOrder) {
          case 'date-asc':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'title-asc':
            return a.title.localeCompare(b.title);
          case 'title-desc':
            return b.title.localeCompare(a.title);
          case 'date-desc':
          default:
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });
  }, [bookmarks, searchText, selectedTags, showFavoritesOnly, sortOrder]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Logo className="animate-pulse" />
      </div>
    );
  }

  return (
    <LibraryShell
      activeLibrary="bookmarks"
      header={(
        <Header
          setSearchText={setSearchText}
          searchText={searchText}
          onCreate={openAddDialog}
          searchPlaceholder={es.bookmarks.search}
          createLabel={es.bookmarks.add}
        />
      )}
      sidebarContent={(
        <SidebarContent
          allTags={allCurrentUserTags}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          showFavoritesOnly={showFavoritesOnly}
          setShowFavoritesOnly={setShowFavoritesOnly}
          totalCount={bookmarks.length}
          favoriteCount={favoriteCount}
          tagCounts={tagCounts}
        />
      )}
    >
        <main className="flex-1 p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold">{es.bookmarks.title}</h1>
            <div className='flex items-center gap-2'>
              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(value) => {
                  if (isViewMode(value)) setViewMode(value);
                }}
                aria-label={es.bookmarks.viewMode}
              >
                <ToggleGroupItem value="big-cards" aria-label={es.bookmarks.bigCards}>
                  <LayoutGrid className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="small-cards" aria-label={es.bookmarks.smallCards}>
                  <Rows3 className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label={es.bookmarks.list}>
                  <List className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>

              <div className="w-[180px]">
                <Select
                  value={sortOrder}
                  onValueChange={(value) => {
                    if (isSortOrder(value)) setSortOrder(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={es.bookmarks.sort} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">{es.bookmarks.newest}</SelectItem>
                    <SelectItem value="date-asc">{es.bookmarks.oldest}</SelectItem>
                    <SelectItem value="title-asc">{es.bookmarks.titleAsc}</SelectItem>
                    <SelectItem value="title-desc">{es.bookmarks.titleDesc}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <BookmarkList
            bookmarks={filteredBookmarks}
            onEdit={openEditDialog}
            onDelete={handleDeleteBookmark}
            onToggleFavorite={handleToggleFavorite}
            openAddDialog={openAddDialog}
            viewMode={viewMode}
          />
        </main>
      <AddBookmarkDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveBookmark}
        mode={dialogMode}
        bookmark={editingBookmark}
        allTags={allCurrentUserTags}
      />

      <AlertDialog open={!!pendingDeleteId} onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{es.bookmarks.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {es.bookmarks.deleteDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{es.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {es.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </LibraryShell>
  );
}
