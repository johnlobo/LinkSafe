'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark, Loader2 } from 'lucide-react';

import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';

export default function BrowserIntegrationPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const bookmarkletRef = useRef<HTMLAnchorElement>(null);
  const [bookmarklet, setBookmarklet] = useState('');

  useEffect(() => {
    if (!loading && !user) router.replace('/login?next=%2Fbrowser');
  }, [loading, router, user]);

  useEffect(() => {
    const basePath = process.env.NEXT_PUBLIC_APP_BASEPATH || '';
    const addUrl = `${window.location.origin}${basePath}/add`;
    const code = `javascript:(()=>{window.open('${addUrl}?url='+encodeURIComponent(location.href)+'&title='+encodeURIComponent(document.title),'linksafe-add','popup,width=560,height=720')})()`;
    setBookmarklet(code);
  }, []);

  useEffect(() => {
    // Set this directly because React sanitizes javascript: URLs in JSX.
    if (bookmarkletRef.current && bookmarklet) {
      bookmarkletRef.current.setAttribute('href', bookmarklet);
    }
  }, [bookmarklet]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" /></div>;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 p-4 py-10 md:py-16">
      <Logo />
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Save pages from Chrome</CardTitle>
          <CardDescription>
            Add this bookmarklet once, then use it on any web page to open a pre-filled LinkSafe form.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-muted/40 p-6 text-center">
            <p className="mb-4 text-sm text-muted-foreground">
              Drag this button to Chrome&apos;s bookmarks bar
            </p>
            <a
              ref={bookmarkletRef}
              href="#bookmarklet"
              draggable
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
              onClick={(event) => event.preventDefault()}
              title="Drag to your bookmarks bar"
            >
              <Bookmark className="h-4 w-4" />
              Save to LinkSafe
            </a>
          </div>

          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Show the bookmarks bar in Chrome with Ctrl+Shift+B.</li>
            <li>Drag “Save to LinkSafe” onto the bar.</li>
            <li>While viewing a page, click the new bookmark and save.</li>
          </ol>

          <p className="text-xs text-muted-foreground">
            Bookmarklets cannot run on Chrome internal pages such as chrome:// URLs or the Chrome Web Store.
          </p>

          <Button variant="outline" onClick={() => router.push('/')}>Back to bookmarks</Button>
        </CardContent>
      </Card>
    </main>
  );
}
