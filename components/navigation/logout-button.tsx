'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const onLogout = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/sign-in');
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <button type="button" onClick={onLogout} disabled={isLoggingOut} className={className}>
      {isLoggingOut ? 'Logging out...' : 'Logout'}
    </button>
  );
}
