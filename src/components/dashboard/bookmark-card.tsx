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

type BookmarkCardProps = {
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
};

export function BookmarkCard({ bookmark, onEdit, onDelete }: BookmarkCardProps) {
  const domain = new URL(bookmark.url).hostname;
  const [faviconError, setFaviconError] = useState(false);

  const handleFaviconError = () => {
    setFaviconError(true);
  };

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow duration-300 hover:shadow-lg">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
        <div className="flex items-start gap-4">
          <div className="relative mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border bg-card">
            {bookmark.favicon && !faviconError ? (
              <img
                src={bookmark.favicon}
                alt={`${bookmark.title} favicon`}
                width={20}
                height={20}
                className="object-contain"
                onError={handleFaviconError}
              />
            ) : (
              <Globe className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold leading-tight">
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
              >
                {bookmark.title}
              </a>
            </CardTitle>
            <p className="text-xs text-muted-foreground">{domain}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
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
      <CardContent className="flex flex-grow flex-col justify-between pt-0">
        <p className="mb-4 text-sm text-muted-foreground">{bookmark.description}</p>
        <div className="flex flex-wrap gap-2">
          {bookmark.tags.map((tag, index) => (
            <Badge key={`${tag}-${index}`} variant="secondary" className="cursor-pointer">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
