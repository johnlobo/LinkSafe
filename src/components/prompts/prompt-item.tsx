'use client';

import Link from 'next/link';
import { Copy, Edit, MoreVertical, Sparkles, Star, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { es } from '@/lib/i18n/es';
import type { PromptViewMode } from '@/lib/prompt-utils';
import type { Prompt } from '@/lib/types';
import { cn } from '@/lib/utils';

type PromptItemProps = {
  prompt: Prompt;
  viewMode: PromptViewMode;
  onCopy: (prompt: Prompt) => void;
  onDelete: (prompt: Prompt) => void;
  onToggleFavorite: (prompt: Prompt) => void;
};

function Actions({ prompt, onCopy, onDelete, onToggleFavorite }: Omit<PromptItemProps, 'viewMode'>) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label={es.prompts.copy} onClick={() => onCopy(prompt)}>
        <Copy className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        aria-label={prompt.favorite ? es.bookmarks.removeFavorite : es.bookmarks.addFavorite}
        aria-pressed={prompt.favorite}
        onClick={() => onToggleFavorite(prompt)}
      >
        <Star className={prompt.favorite ? 'h-4 w-4 fill-primary text-primary' : 'h-4 w-4'} />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" /><span className="sr-only">{es.bookmarks.moreOptions}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/prompts/${prompt.id}/edit`}><Edit className="mr-2 h-4 w-4" />{es.common.edit}</Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(prompt)}>
            <Trash2 className="mr-2 h-4 w-4" />{es.common.delete}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function Tags({ tags, limit }: { tags: string[]; limit?: number }) {
  const visible = limit ? tags.slice(0, limit) : tags;
  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}
      {limit && tags.length > limit ? <Badge variant="outline">+{tags.length - limit}</Badge> : null}
    </div>
  );
}

export function PromptItem(props: PromptItemProps) {
  const { prompt, viewMode } = props;
  const router = useRouter();
  const updated = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(new Date(prompt.updatedAt));
  const openDetail = () => router.push(`/prompts/${prompt.id}`);
  const openFromContainer = (event: React.MouseEvent<HTMLElement>) => {
    if (!(event.target instanceof Element) || !event.target.closest('a,button')) openDetail();
  };
  const openFromKeyboard = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' && event.target === event.currentTarget) openDetail();
  };

  if (viewMode === 'list') {
    return (
      <article role="link" tabIndex={0} onClick={openFromContainer} onKeyDown={openFromKeyboard} className="flex cursor-pointer items-center gap-3 rounded-lg border bg-card p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Sparkles className="h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <Link href={`/prompts/${prompt.id}`} className="block truncate text-sm font-semibold hover:underline">{prompt.title}</Link>
          <p className="truncate text-xs text-muted-foreground">{prompt.content}</p>
        </div>
        <div className="hidden max-w-[35%] md:block"><Tags tags={prompt.tags} limit={3} /></div>
        <Actions {...props} />
      </article>
    );
  }

  const compact = viewMode === 'small-cards';
  return (
    <Card role="link" tabIndex={0} onClick={openFromContainer} onKeyDown={openFromKeyboard} className="flex h-full cursor-pointer flex-col transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <CardHeader className={cn('flex flex-row items-start justify-between gap-2 space-y-0', compact ? 'p-3' : 'p-5 pb-3')}>
        <div className="min-w-0">
          <Sparkles className="mb-3 h-5 w-5 text-primary" />
          <CardTitle className={cn('leading-tight', compact ? 'line-clamp-2 text-sm' : 'text-lg')}>
            <Link href={`/prompts/${prompt.id}`} className="hover:underline">{prompt.title}</Link>
          </CardTitle>
        </div>
        <Actions {...props} />
      </CardHeader>
      <CardContent className={cn('flex flex-1 flex-col justify-between', compact ? 'p-3 pt-0' : 'p-5 pt-0')}>
        <Link href={`/prompts/${prompt.id}`} className="mb-4 block">
          <p className={cn('whitespace-pre-wrap text-muted-foreground', compact ? 'line-clamp-3 text-xs' : 'line-clamp-4 text-sm')}>
            {prompt.content}
          </p>
        </Link>
        <div className="space-y-3">
          <Tags tags={prompt.tags} limit={compact ? 2 : undefined} />
          {!compact ? <p className="text-xs text-muted-foreground">{es.prompts.updated}: {updated}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
