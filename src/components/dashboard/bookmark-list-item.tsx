'use client';

import { Globe, MoreVertical, Edit, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Bookmark } from '@/lib/types';
import { cn } from '@/lib/utils';
import { es } from '@/lib/i18n/es';

type BookmarkListItemProps = {
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (bookmark: Bookmark) => void;
};

export function BookmarkListItem({ bookmark, onEdit, onDelete, onToggleFavorite }: BookmarkListItemProps) {
  const domain = new URL(bookmark.url).hostname;
  const [faviconError, setFaviconError] = useState(false);

  const handleFaviconError = () => {
    setFaviconError(true);
  };

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-card/80'
      )}
    >
      <div className="relative flex h-6 w-6 flex-shrink-0 items-center justify-center">
        {bookmark.favicon && !faviconError ? (
          <img
            src={bookmark.favicon}
            alt={`Icono de ${bookmark.title}`}
            width={16}
            height={16}
            className="object-contain"
            onError={handleFaviconError}
          />
        ) : (
          <Globe className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      <div className="flex-grow overflow-hidden">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate text-sm font-semibold hover:underline focus:outline-none focus:ring-1 focus:ring-ring rounded-sm"
          title={bookmark.title}
        >
          {bookmark.title}
        </a>
        <p className="truncate text-xs text-muted-foreground">{domain}</p>
      </div>

      <div className="hidden flex-shrink-0 gap-1 md:flex">
        {bookmark.tags.slice(0, 3).map((tag) => (
          <Badge key={tag} variant="secondary" className="cursor-pointer">
            {tag}
          </Badge>
        ))}
        {bookmark.tags.length > 3 && (
            <Badge variant="outline">+{bookmark.tags.length - 3}</Badge>
        )}
      </div>

      <div className="flex-shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="mr-1 h-8 w-8"
          aria-label={bookmark.favorite ? es.bookmarks.removeFavorite : es.bookmarks.addFavorite}
          aria-pressed={bookmark.favorite === true}
          onClick={() => onToggleFavorite(bookmark)}
        >
          <Star className={bookmark.favorite ? 'h-4 w-4 fill-primary text-primary' : 'h-4 w-4'} />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">{es.bookmarks.moreOptions}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(bookmark)}>
              <Edit className="mr-2 h-4 w-4" />
              <span>{es.common.edit}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(bookmark.id)} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>{es.common.delete}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
