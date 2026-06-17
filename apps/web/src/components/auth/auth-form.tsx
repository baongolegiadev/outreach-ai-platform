'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { login, register } from '@/lib/auth-api';
import { setAuthSession } from '@/lib/auth-storage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AuthFormProps {
  mode: 'login' | 'signup';
}

export function AuthForm({ mode }: AuthFormProps): React.JSX.Element {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');
    const name = String(formData.get('name') ?? '');
    const workspaceName = String(formData.get('workspaceName') ?? '');

    try {
      const session =
        mode === 'signup'
          ? await register({
              email,
              password,
              name: name || undefined,
              workspaceName,
            })
          : await login({ email, password });
      setAuthSession(session);
      router.push('/app');
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Authentication failed. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>{mode === 'signup' ? 'Create your workspace' : 'Log in to Outreach AI'}</CardTitle>
        <CardDescription>
          {mode === 'signup'
            ? 'Start by creating an admin account and default workspace.'
            : 'Use your existing account credentials to continue.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" name="name" placeholder="Alex Carter" autoComplete="name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workspaceName">Workspace name</Label>
                <Input
                  id="workspaceName"
                  name="workspaceName"
                  placeholder="Acme Sales Team"
                  required
                />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              minLength={8}
              required
            />
          </div>
          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting
              ? 'Submitting...'
              : mode === 'signup'
                ? 'Create account'
                : 'Log in'}
          </Button>
        </form>
        <p className="mt-4 text-sm text-slate-600">
          {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
          <Link
            href={mode === 'signup' ? '/login' : '/signup'}
            className="font-medium text-slate-900 underline underline-offset-4"
          >
            {mode === 'signup' ? 'Log in' : 'Sign up'}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
