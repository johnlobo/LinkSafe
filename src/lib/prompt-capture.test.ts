import { describe, expect, it } from 'vitest';

import { createPromptBookmarklet, parsePromptCapture, PROMPT_CAPTURE_MESSAGE } from './prompt-capture';

describe('parsePromptCapture', () => {
  it('acepta una captura válida sin truncar su contenido', () => {
    const content = 'x'.repeat(50_001);
    expect(parsePromptCapture({ type: PROMPT_CAPTURE_MESSAGE, version: 1, title: 'Página', content, sourceUrl: 'https://example.com' })?.content).toHaveLength(50_001);
  });

  it('rechaza tipos, versiones y protocolos no admitidos', () => {
    expect(parsePromptCapture({ type: 'otro', version: 1, title: '', content: '', sourceUrl: 'https://example.com' })).toBeNull();
    expect(parsePromptCapture({ type: PROMPT_CAPTURE_MESSAGE, version: 2, title: '', content: '', sourceUrl: 'https://example.com' })).toBeNull();
    expect(parsePromptCapture({ type: PROMPT_CAPTURE_MESSAGE, version: 1, title: '', content: '', sourceUrl: 'javascript:alert(1)' })).toBeNull();
  });
});

describe('createPromptBookmarklet', () => {
  it('envía la captura por postMessage y no la incluye en la URL', () => {
    const result = createPromptBookmarklet('https://linksafe.example/prompts/new?capture=1', 'https://linksafe.example');
    expect(result).toContain('postMessage(p,o)');
    expect(result).toContain('window.getSelection');
    expect(result).not.toContain('encodeURIComponent');
    expect(() => new Function(result.slice('javascript:'.length))).not.toThrow();
  });
});
