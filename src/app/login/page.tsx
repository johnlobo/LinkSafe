'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { es } from '@/lib/i18n/es';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login({ email, password });
      const requestedPath = new URLSearchParams(window.location.search).get('next');
      router.push(requestedPath?.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : '/');
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: es.auth.loginFailed,
        description: getAuthErrorMessage(error, es.common.unexpectedError),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Logo />
          </div>
          <CardTitle className="text-3xl font-bold">{es.auth.welcomeBack}</CardTitle>
          <CardDescription>{es.auth.loginDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">{es.auth.email}</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-base"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="password">{es.auth.password}</Label>
                <Link href="#" className="ml-auto inline-block text-sm underline" prefetch={false}>
                  {es.auth.forgotPassword}
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-base"
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full text-base font-semibold" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {es.auth.login}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            {es.auth.noAccount}{' '}
            <Link href="/register" className="underline" prefetch={false}>
              {es.auth.register}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
