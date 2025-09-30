'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  IconLoader2,
  IconBattery,
  IconShield,
  IconUser
} from '@tabler/icons-react';
import {
  UserRole,
  DEFAULT_USER_ROLE,
  getRoleDisplayName
} from '@/lib/auth/utils';
import { toast } from 'sonner';

export default function AssignRolePage() {
  const { user, isLoaded } = useAuth() as any;
  const router = useRouter();
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
      return;
    }

    // For Supabase: we default to technician via metadata at signup; just go to dashboard
    if (user) {
      router.push('/dashboard');
      return;
    }
  }, [user, isLoaded, router]);

  const assignDefaultRole = async () => {
    if (!user) return;

    // Since you've manually set the role in Clerk dashboard,
    // we just need to redirect to dashboard
    setIsAssigning(true);

    try {
      // With Supabase, role is in user_metadata. Just continue.
      toast.success('Account ready! Redirecting...');
      router.replace('/dashboard');
    } catch (error) {
      console.error('Error checking role:', error);
      toast.error(
        'Error checking role. Please refresh the page or contact support.'
      );
    } finally {
      setIsAssigning(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <IconLoader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to sign-in
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4'>
      <div className='w-full max-w-md space-y-6'>
        {/* Welcome Message */}
        <Card>
          <CardHeader className='text-center'>
            <div className='mb-4 flex items-center justify-center gap-2'>
              <IconBattery className='h-8 w-8 text-blue-600' />
              <CardTitle className='text-2xl font-bold text-gray-900'>
                Welcome to E-Wheels
              </CardTitle>
            </div>
            <CardDescription className='text-gray-600'>
              Let&apos;s set up your account to get you started
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='text-center'>
              <div className='mb-2 text-sm text-gray-600'>
                Hello,{' '}
                <span className='font-medium'>{(user as any).email}</span>
              </div>
              <p className='text-sm text-gray-500'>
                We&apos;re assigning you the default role to get you started. An
                administrator can update your permissions later if needed.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Role Information */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <IconShield className='h-5 w-5 text-blue-600' />
              Your Role Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3'>
              <IconUser className='h-6 w-6 text-blue-600' />
              <div>
                <div className='font-medium text-blue-900'>
                  {getRoleDisplayName(DEFAULT_USER_ROLE)}
                </div>
                <div className='text-sm text-blue-700'>
                  Access to battery and customer management
                </div>
              </div>
              <Badge variant='secondary' className='ml-auto'>
                Default
              </Badge>
            </div>

            <div className='rounded-lg bg-gray-50 p-3 text-xs text-gray-500'>
              <div className='mb-1 font-medium'>What you can do:</div>
              <ul className='list-inside list-disc space-y-1'>
                <li>View and manage battery records</li>
                <li>View customer information</li>
                <li>Generate quotations</li>
                <li>Print labels and QR codes</li>
                <li>Update inventory</li>
              </ul>
            </div>

            <Button
              onClick={assignDefaultRole}
              disabled={isAssigning}
              className='w-full'
              size='lg'
            >
              {isAssigning ? (
                <>
                  <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
                  Setting up your account...
                </>
              ) : (
                'Continue to Dashboard'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card className='border-yellow-200 bg-yellow-50'>
          <CardContent className='pt-6'>
            <div className='text-center text-sm text-yellow-800'>
              <div className='mb-2 font-medium'>
                Need different permissions?
              </div>
              <p>
                Contact your administrator to request additional access or role
                changes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
