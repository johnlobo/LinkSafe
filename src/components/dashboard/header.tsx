'use client';

import { Database, Plus, Search, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { DataTransferDialog } from '@/components/data-transfer/data-transfer-dialog';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { es } from '@/lib/i18n/es';

type HeaderProps = {
  setSearchText: (text: string) => void;
  searchText: string;
  onCreate: () => void;
  searchPlaceholder: string;
  createLabel: string;
};

export function Header({ setSearchText, searchText, onCreate, searchPlaceholder, createLabel }: HeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [dataTransferOpen, setDataTransferOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <div className="hidden md:block">
        <Logo />
      </div>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <form className="ml-auto flex-1 sm:flex-initial" onSubmit={(event) => event.preventDefault()}>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              value={searchText}
              placeholder={searchPlaceholder}
              className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </form>
        <Button className="shrink-0" onClick={onCreate}>
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{createLabel}</span>
        </Button>
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <UserIcon className="h-5 w-5" />
              <span className="sr-only">{es.account.menu}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user?.name || user?.email || es.account.myAccount}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>{es.account.profile}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/browser')}>
              {es.account.browserIntegration}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDataTransferOpen(true)}>
              <Database className="mr-2 h-4 w-4" />
              {es.account.dataTransfer}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>{es.auth.logout}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <DataTransferDialog open={dataTransferOpen} onOpenChange={setDataTransferOpen} />
    </header>
  );
}
