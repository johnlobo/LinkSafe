import { isHttpUrl } from './bookmark-utils';

export const PROMPT_CAPTURE_MESSAGE = 'linksafe:prompt-capture';
export const PROMPT_CAPTURE_READY_MESSAGE = 'linksafe:prompt-capture-ready';
export const PROMPT_CAPTURE_RECEIVED_MESSAGE = 'linksafe:prompt-capture-received';

export type PromptCapture = {
  title: string;
  content: string;
  sourceUrl: string;
};

export function createPromptBookmarklet(promptUrl: string, targetOrigin: string): string {
  return `javascript:(()=>{const u=${JSON.stringify(promptUrl)},o=${JSON.stringify(targetOrigin)},p={type:'${PROMPT_CAPTURE_MESSAGE}',version:1,title:document.title,content:String(window.getSelection?window.getSelection():''),sourceUrl:location.href},w=window.open(u,'linksafe-prompt','popup,width=980,height=820');let d=false,n=0;const s=()=>{if(!d&&w&&!w.closed)w.postMessage(p,o)},h=(e)=>{if(e.origin!==o||e.source!==w||!e.data)return;if(e.data.type==='${PROMPT_CAPTURE_READY_MESSAGE}')s();if(e.data.type==='${PROMPT_CAPTURE_RECEIVED_MESSAGE}'){d=true;window.removeEventListener('message',h)}};window.addEventListener('message',h);s();const t=setInterval(()=>{if(d||!w||w.closed||n++>120){clearInterval(t);window.removeEventListener('message',h)}else s()},500)})()`;
}

export function parsePromptCapture(value: unknown): PromptCapture | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Record<string, unknown>;
  if (data.type !== PROMPT_CAPTURE_MESSAGE || data.version !== 1) return null;
  if (typeof data.title !== 'string' || typeof data.content !== 'string' || typeof data.sourceUrl !== 'string') return null;
  if (!isHttpUrl(data.sourceUrl)) return null;
  return { title: data.title, content: data.content, sourceUrl: data.sourceUrl };
}
