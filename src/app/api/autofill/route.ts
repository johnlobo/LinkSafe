import { NextRequest, NextResponse } from 'next/server';

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
}

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

    const buffer = await res.arrayBuffer();

    // Detect charset: prefer Content-Type header, fall back to <meta charset>
    let charset = 'utf-8';
    const ctCharset = (res.headers.get('content-type') || '').match(/charset=([^\s;]+)/i)?.[1];
    if (ctCharset) {
      charset = ctCharset;
    } else {
      // Peek at the first 2 KB as ASCII to find a <meta charset> tag
      const peek = new TextDecoder('ascii', { fatal: false }).decode(buffer.slice(0, 2048));
      const metaCharset = peek.match(/<meta[^>]+charset=["']?\s*([^"'\s;>]+)/i)?.[1];
      if (metaCharset) charset = metaCharset;
    }

    let html: string;
    try {
      html = new TextDecoder(charset).decode(buffer);
    } catch {
      html = new TextDecoder('utf-8').decode(buffer);
    }

    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
    const title = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : undefined;

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
