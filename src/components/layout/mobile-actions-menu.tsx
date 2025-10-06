'use client';

import React from 'react';
import { IconMenu2, IconExternalLink } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import SearchInput from '@/components/search-input';
import { ModeToggle } from '@/components/layout/ThemeToggle/theme-toggle';
import { ThemeSelector } from '@/components/theme-selector';
import { useAuth } from '@/hooks/use-auth';

export default function MobileActionsMenu() {
  const { user } = useAuth();
  const email =
    (user &&
      ((user as any).email ?? (user as any)?.email_addresses?.[0]?.email)) ||
    '';

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='h-9 w-9 md:hidden'
          aria-label='Open menu'
        >
          <IconMenu2 className='h-5 w-5' />
        </Button>
      </SheetTrigger>
      <SheetContent side='right' className='p-0'>
        <SheetHeader className='border-b p-4'>
          <SheetTitle>Menu</SheetTitle>
          {email ? (
            <SheetDescription className='truncate'>
              Signed in as {email}
            </SheetDescription>
          ) : (
            <SheetDescription>Quick actions</SheetDescription>
          )}
        </SheetHeader>

        <div className='flex flex-col gap-4 p-4'>
          <div>
            <SearchInput />
          </div>

          <div className='flex flex-col gap-2'>
            <span className='text-muted-foreground text-xs font-medium'>
              Theme
            </span>
            <div className='flex items-center gap-2'>
              <ModeToggle />
              <div className='min-w-0 flex-1'>
                <ThemeSelector />
              </div>
            </div>
          </div>

          <div className='pt-2'>
            <a
              href='https://github.com/ilan2004/Ev-wheels'
              target='_blank'
              rel='noopener noreferrer'
              className='text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm'
            >
              <IconExternalLink className='h-4 w-4' />
              View project on GitHub
            </a>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
