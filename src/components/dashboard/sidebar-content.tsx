'use client';

import { Bookmark, Star, Tag } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

type SidebarContentProps = {
  allTags: string[];
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (showFavoritesOnly: boolean) => void;
  totalCount: number;
  favoriteCount: number;
};

export function SidebarContent({
  allTags,
  selectedTags,
  setSelectedTags,
  showFavoritesOnly,
  setShowFavoritesOnly,
  totalCount,
  favoriteCount,
}: SidebarContentProps) {
  const toggleTag = (tag: string) => {
    setSelectedTags(
      selectedTags.includes(tag)
        ? selectedTags.filter((t) => t !== tag)
        : [...selectedTags, tag]
    );
  };

  return (
    <div className="p-4">
      <Card className="mb-4">
        <CardHeader className="p-4">
          <CardTitle className="text-base">Bookmarks</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 p-4 pt-0">
          <Button
            type="button"
            variant={!showFavoritesOnly ? 'secondary' : 'ghost'}
            className="justify-between"
            onClick={() => setShowFavoritesOnly(false)}
          >
            <span className="flex items-center gap-2"><Bookmark className="h-4 w-4" />All</span>
            <span>{totalCount}</span>
          </Button>
          <Button
            type="button"
            variant={showFavoritesOnly ? 'secondary' : 'ghost'}
            className="justify-between"
            onClick={() => setShowFavoritesOnly(true)}
          >
            <span className="flex items-center gap-2"><Star className="h-4 w-4" />Favorites</span>
            <span>{favoriteCount}</span>
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Tag className="h-4 w-4" />
            Filter by Tags
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {allTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? 'default' : 'secondary'}
                  className="cursor-pointer transition-all hover:scale-105"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No tags yet. Add tags to your bookmarks to filter them here.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
