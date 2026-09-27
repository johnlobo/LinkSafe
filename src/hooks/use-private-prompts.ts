'use client';

import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import type { Prompt } from '@/lib/types';

export function usePrivatePrompts() {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<Prompt[]>([]);

  useEffect(() => {
    if (!user) {
      setPrompts([]);
      return;
    }
    const promptsQuery = query(collection(db, 'prompts'), where('userId', '==', user.uid));
    return onSnapshot(promptsQuery, (snapshot) => {
      setPrompts(snapshot.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          userId: data.userId,
          title: data.title,
          content: data.content,
          tags: Array.isArray(data.tags) ? data.tags : [],
          notes: data.notes,
          sourceUrl: data.sourceUrl,
          author: data.author,
          language: data.language,
          model: data.model,
          favorite: data.favorite === true,
          createdAt: data.createdAt?.toDate?.().toISOString() ?? new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.().toISOString() ?? new Date().toISOString(),
        } satisfies Prompt;
      }));
    });
  }, [user]);

  return prompts;
}
