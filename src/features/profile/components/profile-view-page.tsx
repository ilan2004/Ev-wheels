'use client';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';

export default function ProfileViewPage() {
  const { user, userInfo } = useAuth();
  if (!user) return null;
  return (
    <div className='flex w-full flex-col gap-4 p-4'>
      <div>
        <div className='text-muted-foreground text-sm'>Email</div>
        <div className='text-base'>{(user as any).email}</div>
      </div>
      {userInfo?.role && (
        <div>
          <div className='text-muted-foreground text-sm'>Role</div>
          <div className='text-base'>{userInfo.roleDisplayName}</div>
        </div>
      )}
      <div>
        <Button
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = '/sign-in';
          }}
        >
          Sign out
        </Button>
      </div>
    </div>
  );
}
