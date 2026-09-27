import { z } from 'zod';

import { isHttpUrl } from './bookmark-utils';
import { es } from './i18n/es';

const optionalMetadata = z.string().max(200, es.prompts.metadataMax);

export const promptSchema = z.object({
  title: z.string().trim().min(1, es.prompts.titleRequired).max(200, es.prompts.titleMax),
  content: z.string().trim().min(1, es.prompts.contentRequired).max(50_000, es.prompts.contentMax),
  tags: z.array(z.string().trim().min(1).max(50, es.prompts.tagMax)).max(20, es.prompts.tagsMax),
  notes: z.string().max(5_000, es.prompts.notesMax),
  sourceUrl: z
    .string()
    .max(2_048, es.prompts.sourceUrlMax)
    .refine((value) => !value || isHttpUrl(value), es.prompts.sourceUrlInvalid),
  author: optionalMetadata,
  language: optionalMetadata,
  model: optionalMetadata,
});

export type PromptFormValues = z.infer<typeof promptSchema>;

export const emptyPromptValues: PromptFormValues = {
  title: '',
  content: '',
  tags: [],
  notes: '',
  sourceUrl: '',
  author: '',
  language: '',
  model: '',
};

export function compactPromptValues(values: PromptFormValues): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {
    title: values.title.trim(),
    content: values.content.trim(),
    tags: values.tags,
  };

  for (const key of ['notes', 'sourceUrl', 'author', 'language', 'model'] as const) {
    const value = values[key].trim();
    if (value) result[key] = value;
  }
  return result;
}
