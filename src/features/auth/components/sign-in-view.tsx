'use client';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { GitHubLogoIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { fetchLocations, setActiveLocation, type LocationRow } from '@/lib/location/session';

export default function SignInViewPage({ stars }: { stars: number }) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const locs = await fetchLocations();
        if (!mounted) return;
        setLocations(locs);
        if (locs.length && !selectedLocationId) setSelectedLocationId(locs[0].id);
      } catch {
        // fallback handled inside fetchLocations
      }
    })();
    return () => { mounted = false; };
  }, [selectedLocationId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Resolve username -> email (fallback to username if it looks like an email)
      let emailToUse = username;
      if (!username.includes('@')) {
        try {
          const { data: rpcEmail, error: rpcErr } = await supabase.rpc('get_email_by_username', { p_username: username });
          if (rpcEmail) emailToUse = rpcEmail as string;
          if (rpcErr) {
            // Attempt direct table lookup if RPC unavailable
            const { data: prof, error: profErr } = await supabase
              .from('profiles')
              .select('email')
              .eq('username', username)
              .maybeSingle();
            if (prof && (prof as any).email) emailToUse = (prof as any).email as string;
            if (profErr) {
              console.warn('username->email fallback lookup failed:', (profErr as any)?.message);
            }
          }
        } catch (lookupErr) {
          console.warn('username->email lookup threw, using fallback');
        }
      }

      // If scoping is disabled, we do not require a location selection or membership check
      const { isLocationScopeEnabled } = await import('@/lib/config/flags');
      const scopedEnabled = isLocationScopeEnabled();
      if (scopedEnabled) {
        if (!selectedLocationId && selectedLocationId !== '') {
          throw new Error('Please select a location.');
        }
      }

      // Sign in first (secure), then validate membership if scoping is enabled
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email: emailToUse, password });
      if (signInErr) throw signInErr;

      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes?.user?.id;
      const role = (userRes?.user?.user_metadata as any)?.role as string | undefined;
      const isAdmin = role === 'admin';

      if (scopedEnabled) {
        // Admins can access any location; others must have membership
        if (!isAdmin) {
          if (!selectedLocationId) {
            await supabase.auth.signOut();
            throw new Error('Not authorized for the selected location');
          }
          const { data: member, error: memErr } = await supabase
            .from('user_locations')
            .select('location_id')
            .eq('user_id', uid)
            .eq('location_id', selectedLocationId)
            .maybeSingle();
          if (memErr) {
            await supabase.auth.signOut();
            throw new Error('Not authorized for the selected location');
          }
          if (!member) {
            await supabase.auth.signOut();
            throw new Error('Not authorized for the selected location');
          }
        }
      }

      const sel = locations.find(l => l.id === selectedLocationId);
      if (scopedEnabled) {
        // Allow admin "All locations" selection via empty id
        if (isAdmin && selectedLocationId === '') {
          setActiveLocation({ id: null, name: 'All locations' });
        } else {
          setActiveLocation({ id: selectedLocationId, name: sel?.name || 'Unknown' });
        }
      }

      router.replace('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <Link
        href='/examples/authentication'
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute top-4 right-4 hidden md:top-8 md:right-8'
        )}
      >
        Login
      </Link>
      <div className='bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r'>
        <div className='absolute inset-0 bg-zinc-900' />
        <div className='relative z-20 flex items-center text-lg font-medium'>
          <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='mr-2 h-6 w-6'>
            <path d='M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3' />
          </svg>
          Logo
        </div>
        <div className='relative z-20 mt-auto'>
          <blockquote className='space-y-2'>
            <p className='text-lg'>&ldquo;This starter template has saved me countless hours of work and helped me deliver projects faster.&rdquo;</p>
            <footer className='text-sm'>Random Dude</footer>
          </blockquote>
        </div>
      </div>
      <div className='flex h-full items-center justify-center p-4 lg:p-8'>
        <div className='flex w-full max-w-md flex-col items-center justify-center space-y-6'>
          <Link className={cn('group inline-flex hover:text-yellow-200')} target='_blank' href={'https://github.com/ilan2004/Ev-wheels'}>
            <div className='flex items-center'>
              <GitHubLogoIcon className='size-4' />
              <span className='ml-1 inline'>View E-Wheels on GitHub</span>{' '}
            </div>
          </Link>

          <form onSubmit={onSubmit} className='w-full space-y-3'>
            <Input type='text' placeholder='Username' value={username} onChange={(e) => setUsername(e.target.value)} required />
            <Input type='password' placeholder='Password' value={password} onChange={(e) => setPassword(e.target.value)} required />
            <div className='space-y-1'>
              <label className='text-sm text-muted-foreground'>Location</label>
              <select
                className='w-full border rounded h-9 px-2 bg-background'
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                required
              >
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
            {error && <div className='text-red-600 text-sm'>{error}</div>}
            <Button className='w-full' type='submit' disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className='text-muted-foreground px-8 text-center text-sm'>
            By clicking continue, you agree to our{' '}
            <Link href='/terms' className='hover:text-primary underline underline-offset-4'>
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href='/privacy' className='hover:text-primary underline underline-offset-4'>
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
