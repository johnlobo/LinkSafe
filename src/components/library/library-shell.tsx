'use client';

import Link from 'next/link';
import { Bookmark, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';

import { Logo } from '@/components/logo';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { es } from '@/lib/i18n/es';

export type LibraryKind = 'bookmarks' | 'prompts';

type LibraryShellProps = {
  activeLibrary: LibraryKind;
  header: ReactNode;
  sidebarContent: ReactNode;
  children: ReactNode;
};

const libraries = [
  { id: 'bookmarks' as const, href: '/', label: es.navigation.links, icon: Bookmark },
  { id: 'prompts' as const, href: '/prompts', label: es.navigation.prompts, icon: Sparkles },
];

function LibraryNavigation({ activeLibrary, mobile = false }: { activeLibrary: LibraryKind; mobile?: boolean }) {
  return (
    <nav
      aria-label={es.navigation.libraries}
      className={cn(mobile ? 'grid grid-cols-2' : 'space-y-1 px-3')}
    >
      {libraries.map(({ id, href, label, icon: Icon }) => (
        <Link
          key={id}
          href={href}
          aria-current={activeLibrary === id ? 'page' : undefined}
          className={cn(
            'flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors',
            mobile ? 'min-h-14 flex-col gap-0.5 rounded-none px-3 py-1 text-xs' : 'h-10 justify-start px-3',
            activeLibrary === id
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground'
          )}
        >
          <Icon className={mobile ? 'h-5 w-5' : 'h-4 w-4'} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function LibraryShell({ activeLibrary, header, sidebarContent, children }: LibraryShellProps) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="gap-5 p-4">
          <Logo />
          <div>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {es.navigation.libraries}
            </p>
            <LibraryNavigation activeLibrary={activeLibrary} />
          </div>
        </SidebarHeader>
        <SidebarContent>{sidebarContent}</SidebarContent>
        <SidebarFooter className="border-t p-4">
          <p className="text-xs text-muted-foreground">{es.navigation.privateAccount}</p>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-w-0 pb-16 md:pb-0">
        {header}
        {children}
      </SidebarInset>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur md:hidden">
        <LibraryNavigation activeLibrary={activeLibrary} mobile />
      </div>
    </SidebarProvider>
  );
}
