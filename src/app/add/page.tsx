'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { CheckCircle2, Globe, Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

import { autoFillBookmarkDetails } from '@/ai/flows/auto-fill-bookmark-details';
import { Logo } from '@/components/logo';
import { TagInput } from '@/components/dashboard/tag-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { isHttpUrl, normalizeMetadataValues } from '@/lib/bookmark-utils';

const schema = z.object({
  url: z
    .string()
    .url({ message: 'Please enter a valid URL.' })
    .refine(isHttpUrl, { message: 'Only HTTP and HTTPS URLs are allowed.' }),
  title: z.string().min(1, { message: 'Title is required.' }),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type Values = z.infer<typeof schema>;

export default function AddFromBrowserPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { url: '', title: '', description: '', tags: [] },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    form.reset({
      url: params.get('url') || '',
      title: params.get('title') || '',
      description: '',
      tags: [],
    });
  }, [form]);

  useEffect(() => {
    if (!loading && !user) {
      const basePath = process.env.NEXT_PUBLIC_APP_BASEPATH || '';
      const path = basePath && window.location.pathname.startsWith(basePath)
        ? window.location.pathname.slice(basePath.length)
        : window.location.pathname;
      const returnTo = `${path}${window.location.search}`;
      router.replace(`/login?next=${encodeURIComponent(returnTo)}`);
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (!user) return;
    getDocs(query(collection(db, 'bookmarks'), where('userId', '==', user.uid)))
      .then((snapshot) => {
        const tags = new Set<string>();
        snapshot.forEach((item) => {
          const value = item.data().tags;
          if (Array.isArray(value)) value.forEach((tag) => tags.add(tag));
        });
        setAllTags(Array.from(tags).sort());
      })
      .catch(() => setAllTags([]));
  }, [user]);

  const close = () => {
    if (window.opener) window.close();
    else router.push('/');
  };

  const handleUrlBlur = async () => {
    const url = form.getValues('url');
    if (!url || form.getValues('title')) return;
    try {
      new URL(url);
      const details = await autoFillBookmarkDetails({ url });
      if (details.title) form.setValue('title', details.title, { shouldValidate: true });
    } catch {
      // Validation will show malformed URLs.
    }
  };

  const onSubmit = async (values: Values) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const details = await autoFillBookmarkDetails({ url: values.url });
      const data: Record<string, unknown> = {
        ...values,
        tags: normalizeMetadataValues(values.tags || [], allTags),
        favorite: false,
        userId: user.uid,
        createdAt: serverTimestamp(),
      };
      if (details.favicon) data.favicon = details.favicon;
      await addDoc(collection(db, 'bookmarks'), data);
      setSaved(true);
      if (window.opener) window.setTimeout(() => window.close(), 1200);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Could not save bookmark', description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" /></div>;
  }

  if (saved) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center shadow-xl">
          <CardContent className="space-y-4 p-8">
            <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
            <h1 className="text-2xl font-semibold">Bookmark saved</h1>
            <p className="text-sm text-muted-foreground">You can return to the page you were viewing.</p>
            <Button variant="outline" onClick={close}>Close</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-3 sm:p-6">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="relative">
          <Logo />
          <Button type="button" size="icon" variant="ghost" className="absolute right-3 top-3" onClick={close}>
            <X className="h-4 w-4" /><span className="sr-only">Close</span>
          </Button>
          <CardTitle className="pt-3">Save bookmark</CardTitle>
          <CardDescription>Review the page details before saving.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="url" render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl><div className="relative"><Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input {...field} onBlur={handleUrlBlur} className="pl-9" /></div></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} autoFocus /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Optional note about this page" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="tags" render={({ field }) => (
                <FormItem><FormLabel>Tags</FormLabel><FormControl><TagInput {...field} allTags={allTags} value={field.value || []} onChange={field.onChange} placeholder="Add a tag..." /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={close}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save bookmark</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
