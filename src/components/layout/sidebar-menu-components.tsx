import React, { memo, useCallback } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { Icons } from '../icons';
import { IconAlertCircle, IconChevronRight } from '@tabler/icons-react';
import {
  getMenuItemClassName,
  getIconClassName,
  getTextClassName,
  getStatusBadgeClassName,
  getOptimizedItemStatus
} from './sidebar-helpers';
import { cn } from '@/lib/utils';

// Memoized navigation item component
export const SidebarNavigationItem = memo(({ 
  item, 
  pathname, 
  categoryKey, 
  categoryConfig 
}: {
  item: any;
  pathname: string;
  categoryKey: string;
  categoryConfig: any;
}) => {
  const Icon = item.icon && (item.icon in Icons) ? Icons[item.icon as keyof typeof Icons] : Icons.logo;
  const status = getOptimizedItemStatus(item.title);
  const isActive = pathname === item.url;
  
  // Memoize className calculations
  const menuButtonClassName = getMenuItemClassName(isActive, categoryKey);
  const iconClassName = getIconClassName(isActive, categoryKey);
  const textClassName = getTextClassName(isActive, categoryKey);
  const statusBadgeClassName = getStatusBadgeClassName(status?.urgent > 0);
  
  // Check if has sub items
  const hasSubItems = item?.items && item?.items?.length > 0;
  
  if (hasSubItems) {
    return (
      <Collapsible
        key={item.title}
        asChild
        defaultOpen={item.isActive}
        className='group/collapsible'
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              tooltip={item.title}
              isActive={isActive}
              className={menuButtonClassName}
            >
              <div className='flex items-center gap-3 flex-1'>
                {item.icon && <Icon className={iconClassName} />}
                <span className={textClassName}>{item.title}</span>
              </div>
              
              <div className='flex items-center gap-2 ml-auto'>
                {status && (
                  <div className='flex items-center gap-1'>
                    {status.urgent > 0 && (
                      <IconAlertCircle className='h-3 w-3 text-red-500' />
                    )}
                    <Badge variant='secondary' className={statusBadgeClassName}>
                      {status.count}
                    </Badge>
                  </div>
                )}
                <IconChevronRight className='h-4 w-4 text-sidebar-foreground/50 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
              </div>
            </SidebarMenuButton>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <SidebarMenuSub className={cn('ml-6 pl-4 border-l-2 border-dashed', categoryConfig.accentColor)}>
              {item.items?.map((subItem: any) => (
                <SidebarSubMenuItem 
                  key={subItem.title}
                  subItem={subItem}
                  pathname={pathname}
                  categoryKey={categoryKey}
                />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }
  
  // Single menu item without sub-items
  return (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton
        asChild
        tooltip={item.title}
        isActive={isActive}
        className={menuButtonClassName}
      >
        <Link href={item.url} className='flex items-center gap-3 flex-1'>
          <Icon className={iconClassName} />
          <span className={textClassName}>{item.title}</span>
          
          {status && (
            <div className='flex items-center gap-1 ml-auto'>
              {status.urgent > 0 && (
                <IconAlertCircle className='h-3 w-3 text-red-500' />
              )}
              <Badge variant='secondary' className={statusBadgeClassName}>
                {status.count}
              </Badge>
            </div>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
});

SidebarNavigationItem.displayName = 'SidebarNavigationItem';

// Memoized sub menu item component
export const SidebarSubMenuItem = memo(({
  subItem,
  pathname,
  categoryKey
}: {
  subItem: any;
  pathname: string;
  categoryKey: string;
}) => {
  const SubIcon = subItem.icon && (subItem.icon in Icons) ? Icons[subItem.icon as keyof typeof Icons] : Icons.dot;
  const isActive = pathname === subItem.url;
  
  const iconClassName = getIconClassName(isActive, categoryKey);
  const subItemClassName = cn(
    'transition-all duration-200',
    isActive && 'font-medium'
  );
  
  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton
        asChild
        isActive={isActive}
        className={subItemClassName}
      >
        <Link href={subItem.url} className='flex items-center gap-2'>
          <SubIcon className={cn('h-4 w-4', iconClassName)} />
          <span className='text-sm'>{subItem.title}</span>
        </Link>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
});

SidebarSubMenuItem.displayName = 'SidebarSubMenuItem';

// Memoized category group component
export const SidebarCategoryGroup = memo(({
  categoryKey,
  config,
  items,
  pathname
}: {
  categoryKey: string;
  config: any;
  items: any[];
  pathname: string;
}) => {
  const categoryLabelClassName = cn(
    'text-xs font-semibold tracking-wider uppercase mb-2 px-2',
    config.color
  );
  
  const categoryDotClassName = cn(
    'w-2 h-2 rounded-full',
    config.color.replace('text-', 'bg-')
  );
  
  return (
    <SidebarGroup key={categoryKey} className='mb-4'>
      <SidebarGroupLabel className={categoryLabelClassName}>
        <div className='flex items-center gap-2'>
          <div className={categoryDotClassName} />
          {config.label}
        </div>
      </SidebarGroupLabel>
      
      <SidebarMenu className='gap-1'>
        {items.map((item) => (
          <SidebarNavigationItem
            key={item.title}
            item={item}
            pathname={pathname}
            categoryKey={categoryKey}
            categoryConfig={config}
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
});

SidebarCategoryGroup.displayName = 'SidebarCategoryGroup';

// Memoized quick actions component
export const SidebarQuickActions = memo(() => {
  return (
    <SidebarGroup className='mb-6'>
      <SidebarGroupLabel className='text-xs font-semibold tracking-wider uppercase mb-2 px-2 text-muted-foreground'>
        <div className='flex items-center gap-2'>
          <Icons.plus className='h-3 w-3' />
          Quick Actions
        </div>
      </SidebarGroupLabel>
      
      <div className='grid grid-cols-2 gap-2 px-2'>
        <Link 
          href='/dashboard/tickets/new'
          className='flex flex-col items-center gap-1 p-2 rounded-md bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/30 transition-colors'
        >
          <Icons.filePlus className='h-4 w-4 text-blue-600 dark:text-blue-400' />
          <span className='text-xs text-blue-700 dark:text-blue-300 font-medium'>New Ticket</span>
        </Link>
        
        <Link 
          href='/dashboard/batteries/new'
          className='flex flex-col items-center gap-1 p-2 rounded-md bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-950/30 transition-colors'
        >
          <Icons.battery className='h-4 w-4 text-green-600 dark:text-green-400' />
          <span className='text-xs text-green-700 dark:text-green-300 font-medium'>Add Battery</span>
        </Link>
      </div>
    </SidebarGroup>
  );
});

SidebarQuickActions.displayName = 'SidebarQuickActions';

// Memoized role badge component
export const SidebarRoleBadge = memo(({ 
  userInfo 
}: { 
  userInfo: any 
}) => {
  const getRoleBadgeClassName = useCallback((role: string): string => {
    const baseClasses = 'text-xs font-medium';
    const roleClasses = {
      admin: 'border-red-200 text-red-700 bg-red-50 dark:border-red-800 dark:text-red-300 dark:bg-red-950/20',
      manager: 'border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:bg-blue-950/20',
      technician: 'border-green-200 text-green-700 bg-green-50 dark:border-green-800 dark:text-green-300 dark:bg-green-950/20',
      default: 'border-gray-200 text-gray-700 bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:bg-gray-950/20'
    };
    
    const roleClass = roleClasses[role as keyof typeof roleClasses] || roleClasses.default;
    return cn(baseClasses, roleClass);
  }, []);
  
  const badgeClassName = getRoleBadgeClassName(userInfo.role);
  
  return (
    <Badge variant='outline' className={badgeClassName}>
      {userInfo.roleDisplayName}
    </Badge>
  );
});

SidebarRoleBadge.displayName = 'SidebarRoleBadge';
