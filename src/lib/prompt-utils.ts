import type { Prompt } from './types';

export type PromptSortOrder = 'updated-desc' | 'updated-asc' | 'title-asc' | 'title-desc';
export type PromptViewMode = 'big-cards' | 'small-cards' | 'list';

export type PromptFilters = {
  searchText: string;
  selectedTags: string[];
  selectedLanguages: string[];
  selectedModels: string[];
  favoritesOnly: boolean;
};

function normalized(value: string | undefined): string {
  return value?.trim().toLocaleLowerCase('es') ?? '';
}

export function promptMatchesFilters(prompt: Prompt, filters: PromptFilters): boolean {
  const query = normalized(filters.searchText);
  const searchable = [
    prompt.title,
    prompt.content,
    prompt.notes,
    prompt.author,
    prompt.language,
    prompt.model,
    prompt.sourceUrl,
    ...prompt.tags,
  ].map(normalized);
  const promptTags = new Set(prompt.tags.map(normalized));
  const language = normalized(prompt.language);
  const model = normalized(prompt.model);

  return (
    (!query || searchable.some((value) => value.includes(query))) &&
    filters.selectedTags.every((tag) => promptTags.has(normalized(tag))) &&
    (filters.selectedLanguages.length === 0 || filters.selectedLanguages.some((value) => normalized(value) === language)) &&
    (filters.selectedModels.length === 0 || filters.selectedModels.some((value) => normalized(value) === model)) &&
    (!filters.favoritesOnly || prompt.favorite)
  );
}

export function sortPrompts(prompts: Prompt[], order: PromptSortOrder): Prompt[] {
  return [...prompts].sort((a, b) => {
    switch (order) {
      case 'updated-asc':
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      case 'title-asc':
        return a.title.localeCompare(b.title, 'es');
      case 'title-desc':
        return b.title.localeCompare(a.title, 'es');
      case 'updated-desc':
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });
}
