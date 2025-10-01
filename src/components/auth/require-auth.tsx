'use client';

import { PropsWithChildren } from 'react';
import { useRequireAuth } from '@/lib/auth/use-require-auth';

export default function RequireAuth({
  redirectTo = '/auth/sign-in',
  children
}: PropsWithChildren<{ redirectTo?: string }>) {
  useRequireAuth(redirectTo);
  return children as any;
}
