import { Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('flex items-center gap-2 text-primary', className)}>
      <Leaf className="h-7 w-7" />
      <span className="flex flex-col">
        <span className="text-2xl font-bold leading-none tracking-tighter">LinkSafe</span>
        <span className="mt-1 text-[10px] font-medium leading-none tracking-wide text-muted-foreground">
          v{process.env.NEXT_PUBLIC_APP_VERSION}
        </span>
      </span>
    </Link>
  );
}
