'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { IconBell, IconClock, IconAlertTriangle } from '@tabler/icons-react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { toast } from 'sonner';
import { useLocationContext } from '@/lib/location/context';

interface NotificationItem {
  id: string;
  ticket_number?: string | null;
  created_at: string;
  symptom?: string | null;
}

export function NotificationsBell() {
  const { activeLocationId } = useLocationContext();
  const [unseen, setUnseen] = React.useState(0);
  const [items, setItems] = React.useState<NotificationItem[]>([]);

  React.useEffect(() => {
    const channel = supabase
      .channel('tech-dashboard-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'service_tickets',
          ...(activeLocationId ? { filter: `location_id=eq.${activeLocationId}` } : {})
        },
        (payload) => {
          const row = payload.new as any;
          const item: NotificationItem = {
            id: row.id,
            ticket_number: row.ticket_number,
            created_at: row.created_at,
            symptom: row.symptom
          };
          setItems((prev) => [item, ...prev].slice(0, 10));
          setUnseen((c) => c + 1);
          const title = row.ticket_number ? `New Job ${row.ticket_number}` : 'New Job';
          toast(title, {
            description: row.symptom || 'A new service ticket was created.',
            action: {
              label: 'Open',
              onClick: () => (window.location.href = `/dashboard/tickets/${row.id}`)
            }
          } as any);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeLocationId]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label='Notifications'
          className='relative inline-flex h-10 w-10 items-center justify-center rounded-md border bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
        >
          <IconBell className='h-5 w-5' />
          {unseen > 0 && (
            <Badge className='absolute -right-1 -top-1 h-5 min-w-[1.25rem] px-1 text-[10px]' variant='destructive'>
              {unseen > 9 ? '9+' : unseen}
            </Badge>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-80'>
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <div className='p-3 text-sm text-muted-foreground'>No new notifications</div>
        ) : (
          <div className='max-h-96 overflow-auto'>
            {items.map((n) => (
              <DropdownMenuItem key={n.id} asChild>
                <Link
                  href={`/dashboard/tickets/${n.id}`}
                  className='flex w-full items-start gap-3'
                  onClick={() => setUnseen(0)}
                >
                  <div className='mt-0.5'>
                    {n.ticket_number ? (
                      <IconClock className='h-4 w-4 text-blue-600' />
                    ) : (
                      <IconAlertTriangle className='h-4 w-4 text-amber-600' />
                    )}
                  </div>
                  <div className='min-w-0'>
                    <div className='truncate text-sm font-medium'>
                      {n.ticket_number || 'New Job'}
                    </div>
                    {n.symptom && (
                      <div className='truncate text-xs text-muted-foreground'>{n.symptom}</div>
                    )}
                    <div className='text-xs text-muted-foreground'>
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>
                </Link>
              </DropdownMenuItem>
            ))}
          </div>
        )}
        {items.length > 0 && (
          <div className='p-2'>
            <Button
              variant='outline'
              className='w-full'
              onClick={() => setUnseen(0)}
            >
              Mark all as seen
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

