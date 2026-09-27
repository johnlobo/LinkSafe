'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark, Loader2, Sparkles } from 'lucide-react';

import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { es } from '@/lib/i18n/es';
import { createPromptBookmarklet } from '@/lib/prompt-capture';

export default function BrowserIntegrationPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const linkBookmarkletRef = useRef<HTMLAnchorElement>(null);
  const promptBookmarkletRef = useRef<HTMLAnchorElement>(null);
  const [linkBookmarklet, setLinkBookmarklet] = useState('');
  const [promptBookmarklet, setPromptBookmarklet] = useState('');

  useEffect(() => {
    if (!loading && !user) router.replace('/login?next=%2Fbrowser');
  }, [loading, router, user]);

  useEffect(() => {
    const basePath = process.env.NEXT_PUBLIC_APP_BASEPATH || '';
    const addUrl = `${window.location.origin}${basePath}/add`;
    const promptUrl = `${window.location.origin}${basePath}/prompts/new?capture=1`;
    const targetOrigin = window.location.origin;
    setLinkBookmarklet(`javascript:(()=>{window.open('${addUrl}?url='+encodeURIComponent(location.href)+'&title='+encodeURIComponent(document.title),'linksafe-add','popup,width=560,height=720')})()`);
    setPromptBookmarklet(createPromptBookmarklet(promptUrl, targetOrigin));
  }, []);

  useEffect(() => {
    // Set this directly because React sanitizes javascript: URLs in JSX.
    if (linkBookmarkletRef.current && linkBookmarklet) linkBookmarkletRef.current.setAttribute('href', linkBookmarklet);
    if (promptBookmarkletRef.current && promptBookmarklet) promptBookmarkletRef.current.setAttribute('href', promptBookmarklet);
  }, [linkBookmarklet, promptBookmarklet]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" /></div>;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 p-4 py-10 md:py-16">
      <Logo />
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>{es.browser.title}</CardTitle>
          <CardDescription>
            {es.browser.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <section className="space-y-4 rounded-lg border p-5">
              <div><h2 className="font-semibold">{es.browser.linksTitle}</h2><p className="mt-1 text-sm text-muted-foreground">{es.browser.linksDescription}</p></div>
              <div className="rounded-lg bg-muted/40 p-5 text-center"><p className="mb-4 text-sm text-muted-foreground">{es.browser.dragInstruction}</p><a ref={linkBookmarkletRef} href="#link-bookmarklet" draggable className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90" onClick={(event) => event.preventDefault()} title={es.browser.dragTitle}><Bookmark className="h-4 w-4" />{es.browser.saveToLinkSafe}</a></div>
              <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground"><li>{es.browser.stepOne}</li><li>{es.browser.stepTwo}</li><li>{es.browser.stepThree}</li></ol>
            </section>
            <section className="space-y-4 rounded-lg border p-5">
              <div><h2 className="font-semibold">{es.browser.promptsTitle}</h2><p className="mt-1 text-sm text-muted-foreground">{es.browser.promptsDescription}</p></div>
              <div className="rounded-lg bg-muted/40 p-5 text-center"><p className="mb-4 text-sm text-muted-foreground">{es.browser.dragInstruction}</p><a ref={promptBookmarkletRef} href="#prompt-bookmarklet" draggable className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90" onClick={(event) => event.preventDefault()} title={es.browser.dragTitle}><Sparkles className="h-4 w-4" />{es.browser.savePromptToLinkSafe}</a></div>
              <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground"><li>{es.browser.stepOne}</li><li>{es.browser.promptStepTwo}</li><li>{es.browser.promptStepThree}</li></ol>
            </section>
          </div>

          <p className="text-xs text-muted-foreground">
            {es.browser.limitation}
          </p>

          <Button variant="outline" onClick={() => router.push('/')}>{es.browser.back}</Button>
        </CardContent>
      </Card>
    </main>
  );
}
