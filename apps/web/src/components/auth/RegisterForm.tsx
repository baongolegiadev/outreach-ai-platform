'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterRequestSchema, type RegisterRequest } from '@/lib/auth-types';
import { useAuthStore } from '@/lib/auth-store';
import { ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [error, setError] = useState<string>('');
  const { register: registerUser, isLoading } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterRequest>({
    resolver: zodResolver(RegisterRequestSchema),
  });

  const onSubmit = async (data: RegisterRequest) => {
    setError('');
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        name: data.name,
        workspaceName: data.workspaceName,
      });
      onSuccess?.();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Create Account</h1>
        <p className="text-gray-600 mt-2">Get started with Outreach AI</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Full Name (Optional)
          </Label>
          <Input
            {...register('name')}
            id="name"
            type="text"
            autoComplete="name"
            placeholder="John Doe"
            data-testid="name-input"
          />
          {errors.name && (
            <p className="text-sm text-destructive" role="alert">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">
            Email
          </Label>
          <Input
            {...register('email')}
            id="email"
            type="email"
            autoComplete="email"
            placeholder="your@email.com"
            data-testid="email-input"
          />
          {errors.email && (
            <p className="text-sm text-destructive" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="workspaceName">
            Workspace Name
          </Label>
          <Input
            {...register('workspaceName')}
            id="workspaceName"
            type="text"
            autoComplete="organization"
            placeholder="My Company"
            data-testid="workspace-name-input"
          />
          {errors.workspaceName && (
            <p className="text-sm text-destructive" role="alert">
              {errors.workspaceName.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">
            Password
          </Label>
          <Input
            {...register('password')}
            id="password"
            type="password"
            autoComplete="new-password"
            data-testid="password-input"
          />
          {errors.password && (
            <p className="text-sm text-destructive" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3" role="alert">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full"
          data-testid="register-button"
        >
          {isLoading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>

      {onSwitchToLogin && (
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in
            </button>
          </p>
        </div>
      )}
    </div>
  );
}