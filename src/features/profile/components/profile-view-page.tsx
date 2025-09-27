'use client';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';

export default function ProfileViewPage() {
  const { user, userInfo } = useAuth();
  if (!user) return null;
  return (
    <div className='flex w-full flex-col p-4 gap-4'>
      <div>
        <div className='text-sm text-muted-foreground'>Email</div>
        <div className='text-base'>{(user as any).email}</div>
      </div>
      {userInfo?.role && (
        <div>
          <div className='text-sm text-muted-foreground'>Role</div>
          <div className='text-base'>{userInfo.roleDisplayName}</div>
        </div>
      )}
      <div>
        <Button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/sign-in'; }}>Sign out</Button>
      </div>
    </div>
  );
}
