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

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await register({ name, email, password });
      router.push('/');
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: es.auth.registerFailed,
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
          <CardTitle className="text-3xl font-bold">{es.auth.createAccount}</CardTitle>
          <CardDescription>{es.auth.registerDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">{es.auth.name}</Label>
              <Input
                id="name"
                type="text"
                placeholder={es.auth.yourName}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-base"
                disabled={isLoading}
              />
            </div>
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
              <Label htmlFor="password">{es.auth.password}</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-base"
                minLength={6}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full text-base font-semibold" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {es.auth.register}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            {es.auth.alreadyRegistered}{' '}
            <Link href="/login" className="underline" prefetch={false}>
              {es.auth.login}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
