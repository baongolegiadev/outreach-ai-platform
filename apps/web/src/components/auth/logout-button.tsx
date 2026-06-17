'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { clearAuthSession } from '@/lib/auth-storage';
import { logout } from '@/lib/auth-api';

export function LogoutButton(): React.JSX.Element {
  const router = useRouter();

  async function handleLogout(): Promise<void> {
    try {
      await logout();
    } finally {
      clearAuthSession();
      router.push('/login');
      router.refresh();
    }
  }

  return (
    <Button variant="outline" onClick={handleLogout}>
      Log out
    </Button>
  );
}
