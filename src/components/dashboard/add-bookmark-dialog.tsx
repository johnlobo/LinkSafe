'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Globe } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { autoFillBookmarkDetails } from '@/ai/flows/auto-fill-bookmark-details';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Bookmark } from '@/lib/types';
import { TagInput } from './tag-input';

const bookmarkSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid URL.' }),
  title: z.string().min(1, { message: 'Title is required.' }),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type BookmarkFormValues = z.infer<typeof bookmarkSchema>;

type AddBookmarkDialogProps = {
  bookmark?: Bookmark | null;
  onSave: (bookmark: Omit<Bookmark, 'id' | 'createdAt'>, id?: string) => void;
  mode: 'add' | 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allTags: string[];
};

export function AddBookmarkDialog({
  bookmark,
  onSave,
  mode,
  open,
  onOpenChange,
  allTags,
}: AddBookmarkDialogProps) {
  const [isFetching, setIsFetching] = useState(false);
  const { toast } = useToast();

  const form = useForm<BookmarkFormValues>({
    resolver: zodResolver(bookmarkSchema),
    defaultValues: {
      url: '',
      title: '',
      description: '',
      tags: [],
    },
  });

  useEffect(() => {
    if (open) {
      const defaultValues = {
        url: bookmark?.url ?? '',
        title: bookmark?.title ?? '',
        description: bookmark?.description ?? '',
        tags: bookmark?.tags ?? [],
      };
      form.reset(defaultValues);
    } else {
      const timer = setTimeout(() => {
        document.body.style.removeProperty('pointer-events');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open, bookmark, form]);

  const handleUrlBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const url = e.target.value;
    if (url && !form.getValues('title')) {
      try {
        new URL(url);
        setIsFetching(true);
        const result = await autoFillBookmarkDetails({ url });
        if (result.title) {
          form.setValue('title', result.title, { shouldValidate: true });
          toast({ title: 'Details fetched', description: result.title });
        }
      } catch (error) {
        // Silently ignore — user can fill title manually
        console.warn('autoFill failed:', error);
      } finally {
        setIsFetching(false);
      }
    }
  };

  const onSubmit = async (data: BookmarkFormValues) => {
    const url = data.url;
    let favicon: string | undefined = bookmark?.favicon;

    // Only refetch favicon if URL changed or not present
    if (url !== bookmark?.url || !favicon) {
      try {
        setIsFetching(true);
        const details = await autoFillBookmarkDetails({ url });
        favicon = details.favicon;
      } catch (error) {
        console.log("Couldn't fetch favicon, but saving bookmark anyway.");
      } finally {
        setIsFetching(false);
      }
    }


    onSave({ ...data, tags: data.tags || [], favicon }, bookmark?.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]" onCloseAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add a new bookmark' : 'Edit bookmark'}</DialogTitle>
          <DialogDescription>Fill in the details below. Click save when you&apos;re done.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="https://example.com" {...field} onBlur={handleUrlBlur} className="pl-9" />
                      {isFetching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. My Favorite Example" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="A short description of the website." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <TagInput
                      {...field}
                      allTags={allTags}
                      placeholder="Add a tag..."
                      value={field.value || []}
                      onChange={(tags) => field.onChange(tags)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isFetching}>
                {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Bookmark
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
