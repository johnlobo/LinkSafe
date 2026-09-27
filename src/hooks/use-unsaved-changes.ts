'use client';

import { useEffect } from 'react';

export function useUnsavedChanges(enabled: boolean, message: string) {
  useEffect(() => {
    if (!enabled) return;

    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = message;
    };

    const interceptLinks = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(target instanceof HTMLAnchorElement) || target.target === '_blank') return;
      const destination = new URL(target.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.href === window.location.href) return;
      if (!window.confirm(message)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const interceptBack = () => {
      if (!window.confirm(message)) window.history.forward();
    };

    window.addEventListener('beforeunload', beforeUnload);
    window.addEventListener('popstate', interceptBack);
    document.addEventListener('click', interceptLinks, true);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      window.removeEventListener('popstate', interceptBack);
      document.removeEventListener('click', interceptLinks, true);
    };
  }, [enabled, message]);
}
