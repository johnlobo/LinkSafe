import { describe, expect, it } from 'vitest';

import type { Prompt } from './types';
import { promptMatchesFilters, sortPrompts } from './prompt-utils';

const prompt: Prompt = {
  id: 'one',
  userId: 'user-a',
  title: 'Revisión de código',
  content: 'Analiza este componente React',
  tags: ['Desarrollo', 'React'],
  notes: 'Usar antes de publicar',
  author: 'Equipo',
  language: 'Español',
  model: 'GPT-5',
  sourceUrl: 'https://example.com',
  favorite: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-02-01T00:00:00.000Z',
};

describe('promptMatchesFilters', () => {
  it('busca en contenido y metadatos sin distinguir mayúsculas', () => {
    expect(promptMatchesFilters(prompt, {
      searchText: 'COMPONENTE',
      selectedTags: [],
      selectedLanguages: [],
      selectedModels: [],
      favoritesOnly: false,
    })).toBe(true);
  });

  it('exige todas las etiquetas seleccionadas', () => {
    const base = {
      searchText: '',
      selectedLanguages: [],
      selectedModels: [],
      favoritesOnly: false,
    };
    expect(promptMatchesFilters(prompt, { ...base, selectedTags: ['react', 'desarrollo'] })).toBe(true);
    expect(promptMatchesFilters(prompt, { ...base, selectedTags: ['react', 'producto'] })).toBe(false);
  });

  it('filtra por idioma, modelo y favoritos', () => {
    expect(promptMatchesFilters(prompt, {
      searchText: '',
      selectedTags: [],
      selectedLanguages: ['español'],
      selectedModels: ['gpt-5'],
      favoritesOnly: true,
    })).toBe(true);
  });
});

describe('sortPrompts', () => {
  it('ordena por última modificación de forma descendente', () => {
    const older = { ...prompt, id: 'older', updatedAt: '2026-01-15T00:00:00.000Z' };
    expect(sortPrompts([older, prompt], 'updated-desc').map((item) => item.id)).toEqual(['one', 'older']);
  });
});
