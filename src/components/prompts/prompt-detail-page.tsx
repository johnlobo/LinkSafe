'use client';

import Link from 'next/link';
import { Copy, Edit, ExternalLink, Loader2, Lock, Star, Trash2 } from 'lucide-react';
import { deleteDoc, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { PromptPageShell } from '@/components/prompts/prompt-page-shell';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/errors';
import { db } from '@/lib/firebase';
import { es } from '@/lib/i18n/es';
import type { Prompt } from '@/lib/types';

export function PromptDetailPage({ promptId }: { promptId: string }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace(`/login?next=${encodeURIComponent(`/prompts/${promptId}`)}`);
  }, [authLoading, promptId, router, user]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    getDoc(doc(db, 'prompts', promptId))
      .then((snapshot) => {
        if (!active || !snapshot.exists()) return;
        const data = snapshot.data();
        if (data.userId !== user.uid) return;
        setPrompt({
          id: snapshot.id,
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
        });
      })
      .catch((error: unknown) => {
        if (active) toast({ variant: 'destructive', title: es.common.error, description: getErrorMessage(error, es.prompts.loadError) });
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [promptId, toast, user]);

  const copy = async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt.content);
      toast({ title: es.prompts.copied, description: es.prompts.copiedDescription });
    } catch {
      toast({ variant: 'destructive', title: es.common.error, description: es.prompts.copyFailed });
    }
  };

  const toggleFavorite = async () => {
    if (!prompt) return;
    try {
      await updateDoc(doc(db, 'prompts', prompt.id), { favorite: !prompt.favorite, updatedAt: serverTimestamp() });
      setPrompt({ ...prompt, favorite: !prompt.favorite, updatedAt: new Date().toISOString() });
      toast({ title: es.common.success, description: prompt.favorite ? es.prompts.favoriteRemoved : es.prompts.favoriteAdded });
    } catch (error: unknown) {
      toast({ variant: 'destructive', title: es.common.error, description: getErrorMessage(error, es.common.unexpectedError) });
    }
  };

  const remove = async () => {
    if (!prompt) return;
    try {
      await deleteDoc(doc(db, 'prompts', prompt.id));
      toast({ title: es.prompts.deletedTitle, description: es.prompts.deletedDescription });
      router.push('/prompts');
    } catch (error: unknown) {
      toast({ variant: 'destructive', title: es.common.error, description: getErrorMessage(error, es.common.unexpectedError) });
    }
  };

  if (authLoading || loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" /></div>;
  if (!prompt) return <PromptPageShell title={es.prompts.notFound}><main className="p-6"><Card className="mx-auto max-w-xl"><CardContent className="p-8 text-center"><h1 className="text-2xl font-semibold">{es.prompts.notFound}</h1><p className="mt-2 text-muted-foreground">{es.prompts.notFoundDescription}</p><Button className="mt-6" onClick={() => router.push('/prompts')}>{es.prompts.detailBack}</Button></CardContent></Card></main></PromptPageShell>;

  const metadata = [
    [es.prompts.author, prompt.author],
    [es.prompts.language, prompt.language],
    [es.prompts.model, prompt.model],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));
  const dateFormatter = new Intl.DateTimeFormat('es-ES', { dateStyle: 'long', timeStyle: 'short' });

  return (
    <PromptPageShell
      title={prompt.title}
      actions={(
        <>
          <Button variant="outline" size="sm" onClick={copy}><Copy className="mr-2 h-4 w-4" /><span className="hidden sm:inline">{es.prompts.copy}</span></Button>
          <Button variant="outline" size="icon" aria-label={prompt.favorite ? es.bookmarks.removeFavorite : es.bookmarks.addFavorite} onClick={toggleFavorite}><Star className={prompt.favorite ? 'h-4 w-4 fill-primary text-primary' : 'h-4 w-4'} /></Button>
          <Button size="sm" asChild><Link href={`/prompts/${prompt.id}/edit`}><Edit className="mr-2 h-4 w-4" />{es.common.edit}</Link></Button>
        </>
      )}
    >
      <main className="mx-auto w-full max-w-5xl p-4 md:p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div><p className="mb-2 flex items-center gap-2 text-sm text-primary"><Lock className="h-4 w-4" />{es.navigation.privateAccount}</p><h1 className="text-3xl font-semibold tracking-tight">{prompt.title}</h1><p className="mt-2 text-sm text-muted-foreground">{es.prompts.updated}: {dateFormatter.format(new Date(prompt.updatedAt))}</p></div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-6">
            <Card><CardHeader><CardTitle>{es.prompts.content}</CardTitle></CardHeader><CardContent><pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7">{prompt.content}</pre></CardContent></Card>
            {prompt.notes ? <Card><CardHeader><CardTitle>{es.prompts.notes}</CardTitle></CardHeader><CardContent><p className="whitespace-pre-wrap text-sm text-muted-foreground">{prompt.notes}</p></CardContent></Card> : null}
          </div>
          <aside className="space-y-6">
            <Card><CardContent className="space-y-5 p-5"><div className="flex flex-wrap gap-2">{prompt.tags.length ? prompt.tags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>) : <span className="text-sm text-muted-foreground">{es.prompts.noTagsPreview}</span>}</div>{metadata.map(([label, value]) => <div key={label}><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-sm">{value}</p></div>)}{prompt.sourceUrl ? <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{es.prompts.sourceUrl}</p><a href={prompt.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-1 break-all text-sm text-primary hover:underline">{prompt.sourceUrl}<ExternalLink className="h-3 w-3 shrink-0" /></a></div> : null}<p className="flex gap-2 border-t pt-4 text-xs text-muted-foreground"><Lock className="h-4 w-4 shrink-0" />{es.prompts.privateNotice}</p></CardContent></Card>
            <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}><Trash2 className="mr-2 h-4 w-4" />{es.prompts.deletePrompt}</Button>
          </aside>
        </div>
      </main>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{es.prompts.deleteTitle}</AlertDialogTitle><AlertDialogDescription>{es.prompts.deleteDescription}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{es.common.cancel}</AlertDialogCancel><AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{es.common.delete}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </PromptPageShell>
  );
}
