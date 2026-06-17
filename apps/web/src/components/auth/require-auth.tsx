'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getAuthSession } from '@/lib/auth-storage';

export function RequireAuth({ children }: { children: React.ReactNode }): React.JSX.Element | null {
  const router = useRouter();
  const pathname = usePathname();
  const session = getAuthSession();

  useEffect(() => {
    if (!session) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, router, session]);

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
