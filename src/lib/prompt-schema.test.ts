import { describe, expect, it } from 'vitest';

import { compactPromptValues, emptyPromptValues, promptSchema } from './prompt-schema';

describe('promptSchema', () => {
  it('acepta un prompt mínimo', () => {
    expect(promptSchema.safeParse({ ...emptyPromptValues, title: 'Título', content: 'Contenido' }).success).toBe(true);
  });

  it('rechaza contenido vacío y límites excedidos', () => {
    expect(promptSchema.safeParse({ ...emptyPromptValues, title: 'Título', content: '' }).success).toBe(false);
    expect(promptSchema.safeParse({ ...emptyPromptValues, title: 'x'.repeat(201), content: 'Contenido' }).success).toBe(false);
    expect(promptSchema.safeParse({ ...emptyPromptValues, title: 'Título', content: 'x'.repeat(50_001) }).success).toBe(false);
    expect(promptSchema.safeParse({ ...emptyPromptValues, title: 'Título', content: 'Contenido', tags: Array.from({ length: 21 }, (_, index) => `tag-${index}`) }).success).toBe(false);
  });

  it('solo admite URL de origen HTTP o HTTPS', () => {
    expect(promptSchema.safeParse({ ...emptyPromptValues, title: 'Título', content: 'Contenido', sourceUrl: 'ftp://example.com' }).success).toBe(false);
    expect(promptSchema.safeParse({ ...emptyPromptValues, title: 'Título', content: 'Contenido', sourceUrl: 'https://example.com' }).success).toBe(true);
  });
});

describe('compactPromptValues', () => {
  it('elimina metadatos opcionales vacíos', () => {
    expect(compactPromptValues({ ...emptyPromptValues, title: ' Título ', content: ' Contenido ', author: ' ' })).toEqual({
      title: 'Título',
      content: 'Contenido',
      tags: [],
    });
  });
});
