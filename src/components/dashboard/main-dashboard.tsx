'use client';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sidebar,
  SidebarContent as SidebarUiContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '../logo';
import { Button } from '../ui/button';
import { LayoutGrid, List, Rows3 } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export function MainDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [allPublicTags, setAllPublicTags] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'date-desc' | 'date-asc' | 'title-asc' | 'title-desc'>(
    'date-desc'
  );
  const [viewMode, setViewMode] = useState<'big-cards' | 'small-cards' | 'list'>('big-cards');

  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');

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

  // Fetch all tags from all users for autocomplete
  useEffect(() => {
    const fetchAllTags = async () => {
      const q = query(collection(db, 'bookmarks'));
      const querySnapshot = await getDocs(q);
      const tags = new Set<string>();
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.tags && Array.isArray(data.tags)) {
          data.tags.forEach((tag: string) => tags.add(tag));
        }
      });
      setAllPublicTags(Array.from(tags).sort());
    };

    fetchAllTags();
  }, [bookmarks]); // Re-fetch if local bookmarks change to include new tags immediately

  useEffect(() => {
    if (!dialogOpen) {
      setEditingBookmark(null);
    }
  }, [dialogOpen]);

  const handleSaveBookmark = async (bookmarkData: Omit<Bookmark, 'id' | 'createdAt'>, id?: string) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to save bookmarks.' });
      return;
    }

    try {
      const dataToSave: any = { ...bookmarkData };
      if (dataToSave.favicon === undefined) {
        delete dataToSave.favicon;
      }

      if (id) {
        // Edit
        const bookmarkRef = doc(db, 'bookmarks', id);
        await updateDoc(bookmarkRef, dataToSave);
        toast({ title: 'Success', description: 'Bookmark updated.' });
      } else {
        // Add
        await addDoc(collection(db, 'bookmarks'), {
          ...dataToSave,
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
        toast({ title: 'Success', description: 'Bookmark added.' });
      }
      setDialogOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
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

  const handleDeleteBookmark = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'bookmarks', id));
      toast({
        title: 'Bookmark Deleted',
        description: 'The bookmark has been removed from your list.',
      });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const allCurrentUserTags = useMemo(() => {
    const tags = new Set<string>();
    bookmarks.forEach((bm) => bm.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [bookmarks]);

  const filteredBookmarks = useMemo(() => {
    return bookmarks
      .filter((bm) => {
        const searchLower = searchText.toLowerCase();
        const matchesSearch =
          bm.title.toLowerCase().includes(searchLower) ||
          bm.url.toLowerCase().includes(searchLower) ||
          (bm.description && bm.description.toLowerCase().includes(searchLower));

        const matchesTags =
          selectedTags.length === 0 || selectedTags.every((tag) => bm.tags.includes(tag));

        return matchesSearch && matchesTags;
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
  }, [bookmarks, searchText, selectedTags, sortOrder]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Logo className="animate-pulse" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarUiContent>
          <SidebarContent allTags={allCurrentUserTags} selectedTags={selectedTags} setSelectedTags={setSelectedTags} />
        </SidebarUiContent>
        <SidebarFooter>
          <p className="px-4 py-2 text-xs text-muted-foreground">
            v{process.env.NEXT_PUBLIC_APP_VERSION}
          </p>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <Header setSearchText={setSearchText} openAddDialog={openAddDialog} />
        <main className="flex-1 p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold">Your Bookmarks</h1>
            <div className='flex items-center gap-2'>
              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(value) => {
                  if (value) setViewMode(value as any);
                }}
                aria-label="View mode"
              >
                <ToggleGroupItem value="big-cards" aria-label="Big card view">
                  <LayoutGrid className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="small-cards" aria-label="Small card view">
                  <Rows3 className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="List view">
                  <List className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>

              <div className="w-[180px]">
                <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Newest First</SelectItem>
                    <SelectItem value="date-asc">Oldest First</SelectItem>
                    <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                    <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <BookmarkList
            bookmarks={filteredBookmarks}
            onEdit={openEditDialog}
            onDelete={handleDeleteBookmark}
            openAddDialog={openAddDialog}
            viewMode={viewMode}
          />
        </main>
      </SidebarInset>

      <AddBookmarkDialog
        key={dialogMode === 'add' ? 'add-bookmark' : editingBookmark?.id}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveBookmark}
        mode={dialogMode}
        bookmark={editingBookmark}
        allTags={allPublicTags}
      >
        <div style={{ display: 'none' }} />
      </AddBookmarkDialog>

    </SidebarProvider>
  );
}
