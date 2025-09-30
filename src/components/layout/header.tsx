'use client';

import React from 'react';
import { SidebarTrigger, useSidebar } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { Breadcrumbs } from '../breadcrumbs';
import SearchInput from '../search-input';
import { UserNav } from './user-nav';
import { ThemeSelector } from '../theme-selector';
import { ModeToggle } from './ThemeToggle/theme-toggle';
import CtaGithub from './cta-github';
import LocationSwitcher from '@/components/location/location-switcher';
import MobileActionsMenu from './mobile-actions-menu';

export default function Header() {
  const { isMobile } = useSidebar();

  return (
    <header className='flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
      <div className='flex items-center gap-2 px-4'>
        {/* Only show sidebar trigger on mobile */}
        {isMobile && (
          <>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='mr-2 h-4' />
          </>
        )}
        <Breadcrumbs />
      </div>

      <div className='flex items-center gap-2 px-4'>
        {/* Desktop actions */}
        <div className='hidden items-center gap-2 md:flex'>
          <LocationSwitcher />
          <CtaGithub />
          <SearchInput />
          <ModeToggle />
          <ThemeSelector />
        </div>
        {/* Always keep user avatar visible */}
        <UserNav />
        {/* Mobile actions menu trigger */}
        <MobileActionsMenu />
      </div>
    </header>
  );
}
