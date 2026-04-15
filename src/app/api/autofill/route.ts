import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('[autofill] called');
  const url = request.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({});

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LinkSafe-bot/1.0)' },
    });
    clearTimeout(tid);
    if (!res.ok) return NextResponse.json({});

    const html = await res.text();

    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
    const title = titleMatch ? titleMatch[1].trim() : undefined;

    const base = new URL(url);
    let favicon: string | undefined;
    const m = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i);
    if (m) {
      const raw = m[1];
      if (raw.startsWith('http')) favicon = raw;
      else if (raw.startsWith('//')) favicon = `${base.protocol}${raw}`;
      else if (raw.startsWith('/')) favicon = `${base.origin}${raw}`;
      else favicon = `${base.origin}/${raw}`;
    } else {
      favicon = `${base.origin}/favicon.ico`;
    }

    return NextResponse.json({ title, favicon });
  } catch (err: any) {
    clearTimeout(tid);
    console.error('[autofill] error:', err?.message);
    return NextResponse.json({});
  }
}
