'use client';

import { Globe, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Bookmark } from '@/lib/types';

type BookmarkCardSmallProps = {
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
};

export function BookmarkCardSmall({ bookmark, onEdit, onDelete }: BookmarkCardSmallProps) {
  const domain = new URL(bookmark.url).hostname;
  const [faviconError, setFaviconError] = useState(false);

  const handleFaviconError = () => {
    setFaviconError(true);
  };

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow duration-300 hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between gap-2 p-3">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-grow items-start gap-3 overflow-hidden"
        >
          <div className="relative mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center">
            {bookmark.favicon && !faviconError ? (
              <img
                src={bookmark.favicon}
                alt={`${bookmark.title} favicon`}
                width={18}
                height={18}
                className="object-contain"
                onError={handleFaviconError}
              />
            ) : (
              <Globe className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex-grow overflow-hidden">
            <CardTitle className="truncate text-sm font-semibold leading-tight">{bookmark.title}</CardTitle>
            <p className="truncate text-xs text-muted-foreground">{domain}</p>
          </div>
        </a>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(bookmark)}>
              <Edit className="mr-2 h-4 w-4" />
              <span>Edit</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(bookmark.id)} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="flex-grow p-3 pt-0">
        <div className="flex flex-wrap gap-1">
          {bookmark.tags.map((tag, index) => (
            <Badge key={`${tag}-${index}`} variant="secondary" className="cursor-pointer text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
