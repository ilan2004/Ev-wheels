'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export function useRequireAuth(redirectTo: string = '/sign-in') {
  const router = useRouter();
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!session) router.replace(redirectTo);
    })();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace(redirectTo);
    });

    return () => {
      mounted = false;
      subscription.subscription?.unsubscribe?.();
    };
  }, [router, redirectTo]);
}
