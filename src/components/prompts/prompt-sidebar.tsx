'use client';

import { Languages, Sparkles, Star, Tag } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { es } from '@/lib/i18n/es';

type PromptSidebarProps = {
  tags: string[];
  languages: string[];
  models: string[];
  selectedTags: string[];
  selectedLanguages: string[];
  selectedModels: string[];
  favoritesOnly: boolean;
  totalCount: number;
  favoriteCount: number;
  tagCounts: Record<string, number>;
  onTagsChange: (value: string[]) => void;
  onLanguagesChange: (value: string[]) => void;
  onModelsChange: (value: string[]) => void;
  onFavoritesChange: (value: boolean) => void;
};

function toggle(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function Facet({
  title,
  icon: Icon,
  values,
  selected,
  emptyText,
  onChange,
  counts,
}: {
  title: string;
  icon: typeof Tag;
  values: string[];
  selected: string[];
  emptyText: string;
  onChange: (value: string[]) => void;
  counts?: Record<string, number>;
}) {
  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="flex items-center gap-2 text-base"><Icon className="h-4 w-4" />{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {values.length ? (
          <div className="flex flex-wrap gap-2">
            {values.map((value) => (
              <Badge
                key={value}
                variant={selected.includes(value) ? 'default' : 'secondary'}
                className="cursor-pointer"
                onClick={() => onChange(toggle(selected, value))}
              >
                {value}{counts ? <span className="ml-1 opacity-70">{counts[value.toLocaleLowerCase('es')] ?? 0}</span> : null}
              </Badge>
            ))}
          </div>
        ) : <p className="text-sm text-muted-foreground">{emptyText}</p>}
      </CardContent>
    </Card>
  );
}

export function PromptSidebar(props: PromptSidebarProps) {
  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader className="p-4"><CardTitle className="text-base">{es.prompts.title}</CardTitle></CardHeader>
        <CardContent className="grid gap-2 p-4 pt-0">
          <Button type="button" variant={!props.favoritesOnly ? 'secondary' : 'ghost'} className="justify-between" onClick={() => props.onFavoritesChange(false)}>
            <span className="flex items-center gap-2"><Sparkles className="h-4 w-4" />{es.prompts.all}</span><span>{props.totalCount}</span>
          </Button>
          <Button type="button" variant={props.favoritesOnly ? 'secondary' : 'ghost'} className="justify-between" onClick={() => props.onFavoritesChange(true)}>
            <span className="flex items-center gap-2"><Star className="h-4 w-4" />{es.prompts.favorites}</span><span>{props.favoriteCount}</span>
          </Button>
        </CardContent>
      </Card>
      <Facet title={es.prompts.tags} icon={Tag} values={props.tags} selected={props.selectedTags} emptyText={es.prompts.noTags} onChange={props.onTagsChange} counts={props.tagCounts} />
      <Facet title={es.prompts.languages} icon={Languages} values={props.languages} selected={props.selectedLanguages} emptyText={es.prompts.noLanguages} onChange={props.onLanguagesChange} />
      <Facet title={es.prompts.models} icon={Sparkles} values={props.models} selected={props.selectedModels} emptyText={es.prompts.noModels} onChange={props.onModelsChange} />
    </div>
  );
}
