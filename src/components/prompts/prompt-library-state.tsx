'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type PromptLibraryState = {
  searchText: string;
  setSearchText: (value: string) => void;
  selectedTags: string[];
  setSelectedTags: (value: string[]) => void;
  selectedLanguages: string[];
  setSelectedLanguages: (value: string[]) => void;
  selectedModels: string[];
  setSelectedModels: (value: string[]) => void;
  favoritesOnly: boolean;
  setFavoritesOnly: (value: boolean) => void;
};

const PromptLibraryContext = createContext<PromptLibraryState | null>(null);

export function PromptLibraryStateProvider({ children }: { children: ReactNode }) {
  const [searchText, setSearchText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const value = useMemo(() => ({
    searchText,
    setSearchText,
    selectedTags,
    setSelectedTags,
    selectedLanguages,
    setSelectedLanguages,
    selectedModels,
    setSelectedModels,
    favoritesOnly,
    setFavoritesOnly,
  }), [favoritesOnly, searchText, selectedLanguages, selectedModels, selectedTags]);

  return <PromptLibraryContext.Provider value={value}>{children}</PromptLibraryContext.Provider>;
}

export function usePromptLibraryState(): PromptLibraryState {
  const context = useContext(PromptLibraryContext);
  if (!context) throw new Error('usePromptLibraryState must be used within PromptLibraryStateProvider');
  return context;
}
