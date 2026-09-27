import type { ReactNode } from 'react';

import { PromptLibraryStateProvider } from '@/components/prompts/prompt-library-state';

export default function PromptsLayout({ children }: { children: ReactNode }) {
  return <PromptLibraryStateProvider>{children}</PromptLibraryStateProvider>;
}
