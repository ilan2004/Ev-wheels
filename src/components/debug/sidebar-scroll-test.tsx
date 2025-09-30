'use client';

import React from 'react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from '@/components/ui/sidebar';
import { IconBattery } from '@tabler/icons-react';

export default function SidebarScrollTest() {
  // Create many dummy items to test scrolling
  const testItems = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    title: `Test Item ${i + 1}`,
    icon: IconBattery
  }));

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Scroll Test Items</SidebarGroupLabel>
      <SidebarMenu>
        {testItems.map((item) => (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton>
              <item.icon className='h-4 w-4' />
              <span>{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
