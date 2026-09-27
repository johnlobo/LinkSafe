'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { addDoc, collection, deleteDoc, deleteField, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Check, CheckCircle2, Loader2, Lock, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';

import { TagInput } from '@/components/dashboard/tag-input';
import { PromptPageShell } from '@/components/prompts/prompt-page-shell';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { usePrivatePrompts } from '@/hooks/use-private-prompts';
import { useToast } from '@/hooks/use-toast';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { normalizeMetadataValues } from '@/lib/bookmark-utils';
import { getErrorMessage } from '@/lib/errors';
import { db } from '@/lib/firebase';
import { es } from '@/lib/i18n/es';
import { compactPromptValues, emptyPromptValues, promptSchema, type PromptFormValues } from '@/lib/prompt-schema';
import {
  parsePromptCapture,
  PROMPT_CAPTURE_READY_MESSAGE,
  PROMPT_CAPTURE_RECEIVED_MESSAGE,
} from '@/lib/prompt-capture';

type PromptFormPageProps = {
  mode: 'create' | 'edit';
  promptId?: string;
};

export function PromptFormPage({ mode, promptId }: PromptFormPageProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const prompts = usePrivatePrompts();
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [allowLeave, setAllowLeave] = useState(false);
  const [captureMode, setCaptureMode] = useState(false);
  const [captureSaved, setCaptureSaved] = useState(false);
  const captureReceived = useRef(false);

  const form = useForm<PromptFormValues>({ resolver: zodResolver(promptSchema), defaultValues: emptyPromptValues });
  const values = form.watch();
  const allTags = useMemo(() => normalizeMetadataValues(prompts.flatMap((prompt) => prompt.tags)), [prompts]);
  const allLanguages = useMemo(() => normalizeMetadataValues(prompts.map((prompt) => prompt.language).filter((value): value is string => Boolean(value))), [prompts]);
  const allModels = useMemo(() => normalizeMetadataValues(prompts.map((prompt) => prompt.model).filter((value): value is string => Boolean(value))), [prompts]);
  useUnsavedChanges(form.formState.isDirty && !allowLeave, es.prompts.unsavedBrowser);

  useEffect(() => {
    if (!authLoading && !user) {
      const next = mode === 'create' ? `/prompts/new${window.location.search}` : `/prompts/${promptId}/edit`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [authLoading, mode, promptId, router, user]);

  useEffect(() => {
    const enabled = mode === 'create' && new URLSearchParams(window.location.search).get('capture') === '1';
    setCaptureMode(enabled);
    if (!enabled || !window.opener) return;

    const receiveCapture = (event: MessageEvent) => {
      if (captureReceived.current || event.origin !== window.location.origin || event.source !== window.opener) return;
      const capture = parsePromptCapture(event.data);
      if (!capture) return;
      captureReceived.current = true;
      form.setValue('title', capture.title, { shouldDirty: true, shouldValidate: true });
      form.setValue('content', capture.content, { shouldDirty: true, shouldValidate: true });
      form.setValue('sourceUrl', capture.sourceUrl, { shouldDirty: true, shouldValidate: true });
      if (capture.content.length > 50_000) {
        toast({ variant: 'destructive', title: es.capture.tooLongTitle, description: es.capture.tooLongDescription });
      }
      window.opener.postMessage({ type: PROMPT_CAPTURE_RECEIVED_MESSAGE }, window.location.origin);
    };

    window.addEventListener('message', receiveCapture);
    window.opener.postMessage({ type: PROMPT_CAPTURE_READY_MESSAGE }, window.location.origin);
    return () => window.removeEventListener('message', receiveCapture);
  }, [form, mode, toast]);

  useEffect(() => {
    if (mode !== 'edit' || !promptId || !user) return;
    let active = true;
    getDoc(doc(db, 'prompts', promptId))
      .then((snapshot) => {
        if (!active) return;
        if (!snapshot.exists() || snapshot.data().userId !== user.uid) {
          setNotFound(true);
          return;
        }
        const data = snapshot.data();
        form.reset({
          title: data.title ?? '',
          content: data.content ?? '',
          tags: Array.isArray(data.tags) ? data.tags : [],
          notes: data.notes ?? '',
          sourceUrl: data.sourceUrl ?? '',
          author: data.author ?? '',
          language: data.language ?? '',
          model: data.model ?? '',
        });
      })
      .catch((error: unknown) => {
        if (active) toast({ variant: 'destructive', title: es.common.error, description: getErrorMessage(error, es.prompts.loadError) });
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [form, mode, promptId, toast, user]);

  const cancel = () => {
    if (form.formState.isDirty && !window.confirm(es.prompts.unsavedBrowser)) return;
    setAllowLeave(true);
    router.push(mode === 'edit' && promptId ? `/prompts/${promptId}` : '/prompts');
  };

  const submit = async (formValues: PromptFormValues) => {
    if (!user) return;
    setSaving(true);
    try {
      const normalizedTags = normalizeMetadataValues(formValues.tags, allTags);
      const normalizedLanguage = normalizeMetadataValues(formValues.language ? [formValues.language] : [], allLanguages)[0] ?? '';
      const normalizedModel = normalizeMetadataValues(formValues.model ? [formValues.model] : [], allModels)[0] ?? '';
      const normalizedValues = { ...formValues, tags: normalizedTags, language: normalizedLanguage, model: normalizedModel };
      const data = compactPromptValues(normalizedValues);
      let savedId = promptId;
      if (mode === 'create') {
        const reference = await addDoc(collection(db, 'prompts'), {
          ...data,
          userId: user.uid,
          favorite: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        savedId = reference.id;
        toast({ title: es.common.success, description: es.prompts.created });
      } else if (promptId) {
        const removedFields: Record<string, ReturnType<typeof deleteField>> = {};
        for (const key of ['notes', 'sourceUrl', 'author', 'language', 'model'] as const) {
          if (!normalizedValues[key].trim()) removedFields[key] = deleteField();
        }
        await updateDoc(doc(db, 'prompts', promptId), { ...data, ...removedFields, updatedAt: serverTimestamp() });
        toast({ title: es.common.success, description: es.prompts.savedChanges });
      }
      setAllowLeave(true);
      form.reset(formValues);
      if (captureMode && mode === 'create') {
        setCaptureSaved(true);
        window.setTimeout(() => window.close(), 1_200);
      } else {
        router.push(`/prompts/${savedId}`);
      }
    } catch (error: unknown) {
      toast({ variant: 'destructive', title: es.common.error, description: getErrorMessage(error, es.common.unexpectedError) });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!promptId) return;
    try {
      await deleteDoc(doc(db, 'prompts', promptId));
      setAllowLeave(true);
      toast({ title: es.prompts.deletedTitle, description: es.prompts.deletedDescription });
      router.push('/prompts');
    } catch (error: unknown) {
      toast({ variant: 'destructive', title: es.common.error, description: getErrorMessage(error, es.common.unexpectedError) });
    }
  };

  const pageTitle = mode === 'create' ? es.prompts.newTitle : es.prompts.editTitle;
  const saveLabel = mode === 'create' ? es.prompts.save : es.prompts.saveChanges;

  if (authLoading || loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" /></div>;
  if (captureSaved) return <main className="flex min-h-screen items-center justify-center p-4"><Card className="w-full max-w-md"><CardContent className="space-y-4 p-8 text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-primary" /><h1 className="text-2xl font-semibold">{es.capture.promptSavedTitle}</h1><p className="text-muted-foreground">{es.capture.promptSavedDescription}</p><Button variant="outline" onClick={() => window.close()}>{es.common.close}</Button></CardContent></Card></main>;
  if (notFound) return (
    <PromptPageShell title={es.prompts.notFound}>
      <main className="p-6"><Card className="mx-auto max-w-xl"><CardContent className="p-8 text-center"><h1 className="text-2xl font-semibold">{es.prompts.notFound}</h1><p className="mt-2 text-muted-foreground">{es.prompts.notFoundDescription}</p><Button className="mt-6" onClick={() => router.push('/prompts')}>{es.prompts.detailBack}</Button></CardContent></Card></main>
    </PromptPageShell>
  );

  return (
    <PromptPageShell
      title={pageTitle}
      confirmNavigation={() => !form.formState.isDirty || window.confirm(es.prompts.unsavedBrowser)}
      actions={(
        <><Button type="button" variant="outline" onClick={cancel}>{es.common.cancel}</Button><Button type="submit" form="prompt-form" disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}<span className="hidden sm:inline">{saveLabel}</span><span className="sm:hidden">{es.common.save}</span></Button></>
      )}
    >
      <main className="mx-auto w-full max-w-7xl p-4 md:p-6">
        <div className="mb-6"><h1 className="text-3xl font-semibold">{pageTitle}</h1><p className="mt-1 text-muted-foreground">{mode === 'create' ? es.prompts.newDescription : es.prompts.editDescription}</p></div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card>
            <CardContent className="p-5 md:p-7">
              <Form {...form}>
                <form id="prompt-form" onSubmit={form.handleSubmit(submit)} className="space-y-6">
                  <FormField control={form.control} name="title" render={({ field }) => <FormItem><FormLabel>{es.prompts.titleField}</FormLabel><FormControl><Input {...field} maxLength={200} placeholder={es.prompts.titlePlaceholder} autoFocus /></FormControl><FormMessage /></FormItem>} />
                  <FormField control={form.control} name="content" render={({ field }) => <FormItem><FormLabel>{es.prompts.content}</FormLabel><FormControl><Textarea {...field} maxLength={50_000} rows={14} placeholder={es.prompts.contentPlaceholder} className="font-mono" /></FormControl><p className="text-xs text-muted-foreground">{es.prompts.contentHelp}</p><FormMessage /></FormItem>} />
                  <FormField control={form.control} name="tags" render={({ field }) => <FormItem><FormLabel>{es.prompts.tags}</FormLabel><FormControl><TagInput {...field} allTags={allTags} value={field.value} onChange={field.onChange} placeholder={es.prompts.tagsPlaceholder} /></FormControl><FormMessage /></FormItem>} />
                  <Accordion type="single" collapsible>
                    <AccordionItem value="optional"><AccordionTrigger>{es.prompts.optionalDetails}</AccordionTrigger><AccordionContent className="space-y-5">
                      <FormField control={form.control} name="notes" render={({ field }) => <FormItem><FormLabel>{es.prompts.notes}</FormLabel><FormControl><Textarea {...field} maxLength={5_000} rows={5} placeholder={es.prompts.notesPlaceholder} /></FormControl><FormMessage /></FormItem>} />
                      <FormField control={form.control} name="sourceUrl" render={({ field }) => <FormItem><FormLabel>{es.prompts.sourceUrl}</FormLabel><FormControl><Input {...field} maxLength={2_048} type="url" placeholder="https://example.com" /></FormControl><FormMessage /></FormItem>} />
                      <div className="grid gap-5 sm:grid-cols-3">
                        <FormField control={form.control} name="author" render={({ field }) => <FormItem><FormLabel>{es.prompts.author}</FormLabel><FormControl><Input {...field} maxLength={200} /></FormControl><FormMessage /></FormItem>} />
                        <FormField control={form.control} name="language" render={({ field }) => <FormItem><FormLabel>{es.prompts.language}</FormLabel><FormControl><Input {...field} list="prompt-languages" maxLength={200} /></FormControl><datalist id="prompt-languages">{allLanguages.map((value) => <option key={value} value={value} />)}</datalist><FormMessage /></FormItem>} />
                        <FormField control={form.control} name="model" render={({ field }) => <FormItem><FormLabel>{es.prompts.model}</FormLabel><FormControl><Input {...field} list="prompt-models" maxLength={200} /></FormControl><datalist id="prompt-models">{allModels.map((value) => <option key={value} value={value} />)}</datalist><FormMessage /></FormItem>} />
                      </div>
                    </AccordionContent></AccordionItem>
                  </Accordion>
                </form>
              </Form>
            </CardContent>
          </Card>
          <aside className="space-y-6">
            <Card className="lg:sticky lg:top-24">
              <CardHeader><CardTitle className="flex items-center justify-between text-base"><span>{es.prompts.preview}</span><span className="text-xs font-normal text-muted-foreground">{es.prompts.previewCard}</span></CardTitle></CardHeader>
              <CardContent className="space-y-5"><Sparkles className="h-6 w-6 text-primary" /><h2 className="text-xl font-semibold">{values.title || es.prompts.previewTitle}</h2><p className="line-clamp-6 whitespace-pre-wrap text-sm text-muted-foreground">{values.content || es.prompts.previewContent}</p><div className="flex flex-wrap gap-2">{values.tags.length ? values.tags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>) : <span className="text-sm text-muted-foreground">{es.prompts.noTagsPreview}</span>}</div><p className="flex gap-2 border-t pt-4 text-xs text-muted-foreground"><Lock className="h-4 w-4 shrink-0" />{es.prompts.privateNotice}</p></CardContent>
            </Card>
            {mode === 'edit' ? <Card className="border-destructive/40"><CardHeader><CardTitle className="text-base text-destructive">{es.prompts.dangerZone}</CardTitle></CardHeader><CardContent><p className="mb-4 text-sm text-muted-foreground">{es.prompts.dangerDescription}</p><Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}><Trash2 className="mr-2 h-4 w-4" />{es.prompts.deletePrompt}</Button></CardContent></Card> : null}
          </aside>
        </div>
      </main>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{es.prompts.deleteTitle}</AlertDialogTitle><AlertDialogDescription>{es.prompts.deleteDescription}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{es.common.cancel}</AlertDialogCancel><AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{es.common.delete}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </PromptPageShell>
  );
}
