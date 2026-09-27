'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

import { LibraryShell } from '@/components/library/library-shell';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { usePrivatePrompts } from '@/hooks/use-private-prompts';
import { collectMetadataValues } from '@/lib/bookmark-utils';
import { es } from '@/lib/i18n/es';
import { PromptSidebar } from './prompt-sidebar';
import { usePromptLibraryState } from './prompt-library-state';

type PromptPageShellProps = {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  confirmNavigation?: () => boolean;
};

export function PromptPageShell({ title, actions, children, confirmNavigation }: PromptPageShellProps) {
  const router = useRouter();
  const prompts = usePrivatePrompts();
  const filters = usePromptLibraryState();
  const tags = collectMetadataValues(prompts.flatMap((prompt) => prompt.tags));
  const languages = collectMetadataValues(prompts.map((prompt) => prompt.language).filter((value): value is string => Boolean(value)));
  const models = collectMetadataValues(prompts.map((prompt) => prompt.model).filter((value): value is string => Boolean(value)));
  const tagCounts: Record<string, number> = {};
  for (const prompt of prompts) {
    for (const tag of new Set(prompt.tags.map((value) => value.trim().toLocaleLowerCase('es')))) {
      if (tag) tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
  }

  const navigate = (callback: () => void) => {
    if (confirmNavigation && !confirmNavigation()) return;
    callback();
    router.push('/prompts');
  };

  return (
    <LibraryShell
      activeLibrary="prompts"
      header={(
        <header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur md:px-6">
          <SidebarTrigger className="md:hidden" />
          <Button variant="ghost" size="sm" asChild><Link href="/prompts"><ArrowLeft className="mr-2 h-4 w-4" />{es.prompts.detailBack}</Link></Button>
          <span className="hidden text-sm font-medium text-muted-foreground lg:inline">{title}</span>
          {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
        </header>
      )}
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
          favoriteCount={prompts.filter((prompt) => prompt.favorite).length}
          tagCounts={tagCounts}
          onTagsChange={(value) => navigate(() => filters.setSelectedTags(value))}
          onLanguagesChange={(value) => navigate(() => filters.setSelectedLanguages(value))}
          onModelsChange={(value) => navigate(() => filters.setSelectedModels(value))}
          onFavoritesChange={(value) => navigate(() => filters.setFavoritesOnly(value))}
        />
      )}
    >
      {children}
    </LibraryShell>
  );
}
