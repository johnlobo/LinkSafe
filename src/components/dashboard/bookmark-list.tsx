'use client';

import { BookmarkCard } from './bookmark-card';
import type { Bookmark } from '@/lib/types';
import { Button } from '../ui/button';
import { FilePlus2 } from 'lucide-react';
import { BookmarkListItem } from './bookmark-list-item';
import { BookmarkCardSmall } from './bookmark-card-small';
import { cn } from '@/lib/utils';

type BookmarkListProps = {
  bookmarks: Bookmark[];
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (bookmark: Bookmark) => void;
  openAddDialog: () => void;
  viewMode: 'big-cards' | 'small-cards' | 'list';
};

export function BookmarkList({ bookmarks, onEdit, onDelete, onToggleFavorite, openAddDialog, viewMode }: BookmarkListProps) {
  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-border bg-card/50 p-8 text-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">No bookmarks found</h2>
          <p className="mt-2 text-muted-foreground">
            It looks like you haven&apos;t added any bookmarks yet, or none match your current filters.
          </p>
          <Button className="mt-6" onClick={openAddDialog}>
            <FilePlus2 className="mr-2 h-4 w-4" />
            Add Your First Bookmark
          </Button>
        </div>
      </div>
    );
  }
  
  const containerClass = cn('gap-4', {
    'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4': viewMode === 'big-cards',
    'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6': viewMode === 'small-cards',
    'flex flex-col gap-2': viewMode === 'list',
  });


  return (
    <div className={containerClass}>
      {bookmarks.map((bookmark) => {
        if (viewMode === 'list') {
          return <BookmarkListItem key={bookmark.id} bookmark={bookmark} onEdit={onEdit} onDelete={onDelete} onToggleFavorite={onToggleFavorite} />;
        }
        if (viewMode === 'small-cards') {
            return <BookmarkCardSmall key={bookmark.id} bookmark={bookmark} onEdit={onEdit} onDelete={onDelete} onToggleFavorite={onToggleFavorite} />;
        }
        return <BookmarkCard key={bookmark.id} bookmark={bookmark} onEdit={onEdit} onDelete={onDelete} onToggleFavorite={onToggleFavorite} />;
      })}
    </div>
  );
}
