'use client';

import { FilePlus2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { es } from '@/lib/i18n/es';
import type { PromptViewMode } from '@/lib/prompt-utils';
import type { Prompt } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PromptItem } from './prompt-item';

type PromptListProps = {
  prompts: Prompt[];
  viewMode: PromptViewMode;
  onCreate: () => void;
  onCopy: (prompt: Prompt) => void;
  onDelete: (prompt: Prompt) => void;
  onToggleFavorite: (prompt: Prompt) => void;
};

export function PromptList({ prompts, viewMode, onCreate, onCopy, onDelete, onToggleFavorite }: PromptListProps) {
  if (!prompts.length) {
    return (
      <div className="flex min-h-72 items-center justify-center rounded-lg border-2 border-dashed bg-card/50 p-8 text-center">
        <div>
          <h2 className="text-2xl font-semibold">{es.prompts.noResults}</h2>
          <p className="mt-2 text-muted-foreground">{es.prompts.noResultsDescription}</p>
          <Button className="mt-6" onClick={onCreate}><FilePlus2 className="mr-2 h-4 w-4" />{es.prompts.createFirst}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('gap-4', {
      'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4': viewMode === 'big-cards',
      'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5': viewMode === 'small-cards',
      'flex flex-col gap-2': viewMode === 'list',
    })}>
      {prompts.map((prompt) => (
        <PromptItem key={prompt.id} prompt={prompt} viewMode={viewMode} onCopy={onCopy} onDelete={onDelete} onToggleFavorite={onToggleFavorite} />
      ))}
    </div>
  );
}
