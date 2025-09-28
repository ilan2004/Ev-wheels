'use client';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail
} from '@/components/ui/sidebar';
import { UserAvatarProfile } from '@/components/user-avatar-profile';
import { navItems } from '@/constants/data';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useAuth } from '@/hooks/use-auth';
import {
  IconBell,
  IconChevronRight,
  IconChevronsDown,
  IconCreditCard,
  IconLogout,
  IconBattery,
  IconUserCircle,
  IconTrendingUp,
  IconAlertCircle
} from '@tabler/icons-react';
import { 
  SidebarQuickActions, 
  SidebarCategoryGroup, 
  SidebarRoleBadge 
} from './sidebar-menu-components';
import { measureRender } from '@/lib/performance/monitor';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { Icons } from '../icons';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
export const company = {
  name: 'E-Wheels',
  logo: IconBattery,
  plan: 'Professional',
  color: 'var(--primary)'
};

// Enhanced categorization with semantic colors and priorities
const CATEGORY_CONFIG = {
  core: {
    label: 'Core Operations',
    items: ['Dashboard', 'Search'],
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    accentColor: 'border-blue-200 dark:border-blue-800',
    priority: 1
  },
  workflow: {
    label: 'Workflow & Operations',
    items: ['Vehicles', 'Batteries', 'Tickets'],
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    accentColor: 'border-green-200 dark:border-green-800',
    priority: 2
  },
  business: {
    label: 'Business Operations',
    items: ['Customers', 'Quotes', 'Invoices', 'Inventory'],
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    accentColor: 'border-purple-200 dark:border-purple-800',
    priority: 3
  },
  insights: {
    label: 'Analytics & Reports',
    items: ['Reports'],
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    accentColor: 'border-orange-200 dark:border-orange-800',
    priority: 4
  },
  admin: {
    label: 'Administration',
    items: ['User Management', 'Settings'],
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    accentColor: 'border-red-200 dark:border-red-800',
    priority: 5
  },
  personal: {
    label: 'Personal',
    items: ['Profile'],
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-950/20',
    accentColor: 'border-gray-200 dark:border-gray-800',
    priority: 6
  }
};

// Status indicators for different navigation items
const getItemStatus = (title: string, pathname: string) => {
  const statusConfig = {
    'Tickets': { count: 12, urgent: 3, color: 'bg-red-500' },
    'Batteries': { count: 8, urgent: 1, color: 'bg-amber-500' },
    'Inventory': { count: 5, urgent: 2, color: 'bg-blue-500' },
    'Quotes': { count: 7, urgent: 0, color: 'bg-green-500' }
  };
  
  return statusConfig[title as keyof typeof statusConfig] || null;
};

// Get category for a navigation item
const getCategoryForItem = (title: string) => {
  for (const [key, config] of Object.entries(CATEGORY_CONFIG)) {
    if (config.items.includes(title)) {
      return { key, ...config };
    }
  }
  return { key: 'other', ...CATEGORY_CONFIG.personal };
};

export default function AppSidebar() {
  const pathname = usePathname();
  const { isOpen } = useMediaQuery();
  const { user, userInfo, isLoaded, hasAnyPermission } = useAuth();
  const router = useRouter();
  
  // Performance monitoring
  const finishRender = measureRender('AppSidebar');
  React.useEffect(() => {
    finishRender();
  });
  
  // Filter navigation items based on user permissions (role-aware)
  const filteredNavItems = React.useMemo(() => {
    if (!user || !isLoaded) return [];
    
    return navItems.filter(item => {
      // If no permissions specified, show to all authenticated users
      if (!item.permissions || item.permissions.length === 0) return true;
      
      // Check if user has any of the required permissions using role-aware checker
      return hasAnyPermission(item.permissions);
    }).map(item => ({
      ...item,
      items: item.items?.filter(subItem => {
        // Filter sub-items based on permissions
        if (!subItem.permissions || subItem.permissions.length === 0) return true;
        return hasAnyPermission(subItem.permissions);
      }) || []
    }));
  }, [user, isLoaded, hasAnyPermission]);
  
  // Memoize category calculations to avoid expensive re-computations
  const categorizedNavItems = React.useMemo(() => {
    if (filteredNavItems.length === 0) return [];
    
    const categorized = filteredNavItems.reduce((acc, item) => {
      const category = getCategoryForItem(item.title);
      if (!acc[category.key]) {
        acc[category.key] = { config: category, items: [] };
      }
      acc[category.key].items.push(item);
      return acc;
    }, {} as Record<string, { config: any; items: any[] }>);
    
    // Sort by priority and return as array for stable rendering
    return Object.entries(categorized)
      .sort(([, a], [, b]) => a.config.priority - b.config.priority);
  }, [filteredNavItems]);

  React.useEffect(() => {
    // Side effects based on sidebar state changes
  }, [isOpen]);

  if (!isLoaded) {
    return (
      <Sidebar collapsible='icon'>
        <SidebarContent className='flex items-center justify-center p-4'>
          <div>Loading...</div>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader>
        {/* Enhanced Company Header */}
        <div className='flex items-center gap-3 px-4 py-3 border-b border-sidebar-border/50'>
          <div className='relative'>
            <company.logo className='h-7 w-7 text-primary' />
            <div className='absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-sidebar-background animate-pulse' />
          </div>
          <div className='flex flex-col'>
            <span className='font-bold text-sm text-sidebar-foreground'>{company.name}</span>
          </div>
        </div>
        
        {/* Enhanced User Role & Status */}
        {userInfo?.role && (
          <div className='px-4 py-2 border-b border-sidebar-border/30'>
            <div className='flex items-center justify-between'>
              <SidebarRoleBadge userInfo={userInfo} />
              <div className='flex items-center gap-1'>
                <IconTrendingUp className='h-3 w-3 text-green-500' />
                <span className='text-xs text-green-600 dark:text-green-400 font-medium'>Active</span>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className='grid grid-cols-3 gap-2 mt-3 text-xs'>
              <div className='text-center p-1 rounded bg-blue-50 dark:bg-blue-950/20'>
                <div className='font-semibold text-blue-600 dark:text-blue-400'>12</div>
                <div className='text-muted-foreground'>Tasks</div>
              </div>
              <div className='text-center p-1 rounded bg-green-50 dark:bg-green-950/20'>
                <div className='font-semibold text-green-600 dark:text-green-400'>8</div>
                <div className='text-muted-foreground'>Done</div>
              </div>
              <div className='text-center p-1 rounded bg-amber-50 dark:bg-amber-950/20'>
                <div className='font-semibold text-amber-600 dark:text-amber-400'>3</div>
                <div className='text-muted-foreground'>Urgent</div>
              </div>
            </div>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent className='overflow-x-hidden'>
        {/* Quick Actions Section - Memoized */}
        <SidebarQuickActions />
        
        {/* Optimized Categorized Navigation with Memoized Components */}
        {categorizedNavItems.map(([categoryKey, { config, items }]) => (
          <SidebarCategoryGroup
            key={categoryKey}
            categoryKey={categoryKey}
            config={config}
            items={items}
            pathname={pathname}
          />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size='lg'
                  className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                >
                  {user && (
                    <UserAvatarProfile
                      className='h-8 w-8 rounded-lg'
                      showInfo
                      user={{
                        imageUrl: '',
                        fullName: `${(user as any).user_metadata?.firstName ?? ''} ${(user as any).user_metadata?.lastName ?? ''}`.trim() || null,
                        emailAddresses: [{ emailAddress: (user as any).email }]
                      }}
                    />
                  )}
                  <IconChevronsDown className='ml-auto size-4' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
                side='bottom'
                align='end'
                sideOffset={4}
              >
                <DropdownMenuLabel className='p-0 font-normal'>
                  <div className='px-1 py-1.5'>
                    {user && (
                      <UserAvatarProfile
                        className='h-8 w-8 rounded-lg'
                        showInfo
                        user={{
                          imageUrl: '',
                          fullName: `${(user as any).user_metadata?.firstName ?? ''} ${(user as any).user_metadata?.lastName ?? ''}`.trim() || null,
                          emailAddresses: [{ emailAddress: (user as any).email }]
                        }}
                      />
                    )}
                    {userInfo?.role && (
                      <div className='mt-1'>
                        <Badge variant='outline' className='text-xs'>
                          {userInfo.roleDisplayName}
                        </Badge>
                        {userInfo.employeeId && (
                          <div className='text-xs text-muted-foreground mt-1'>
                            ID: {userInfo.employeeId}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => router.push('/dashboard/profile')}
                  >
                    <IconUserCircle className='mr-2 h-4 w-4' />
                    Profile
                  </DropdownMenuItem>
                  {userInfo?.role === 'admin' && (
                    <DropdownMenuItem
                      onClick={() => router.push('/dashboard/users/roles')}
                    >
                      <IconUserCircle className='mr-2 h-4 w-4' />
                      User Roles
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem>
                    <IconBell className='mr-2 h-4 w-4' />
                    Notifications
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = '/sign-in';
                  }}
                >
                  <IconLogout className='mr-2 h-4 w-4' />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
