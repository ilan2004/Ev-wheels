'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { customersApi, type Customer } from '@/lib/api/customers';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const router = useRouter();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [batteries, setBatteries] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const c = await customersApi.getById(id);
      if (c.success) setCustomer(c.data || null);
      // Load recent activity (tickets and batteries)
      const [tRes, bRes] = await Promise.all([
        supabase
          .from('service_tickets')
          .select('id, ticket_number, status, created_at, vehicle_reg_no')
          .eq('customer_id', id)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('battery_records')
          .select('id, serial_number, brand, status, received_date')
          .eq('customer_id', id)
          .order('received_date', { ascending: false })
          .limit(10)
      ]);
      if (!tRes.error) setTickets(tRes.data || []);
      if (!bRes.error) setBatteries(bRes.data || []);
      setLoading(false);
    };
    if (id) load();
  }, [id]);

  if (loading) return <div className='p-6'>Loading...</div>;
  if (!customer) return <div className='p-6'>Customer not found</div>;

  return (
    <PageContainer>
      <div className='flex flex-col gap-6'>
        <div className='flex items-center justify-between'>
          <h1 className='text-2xl font-bold tracking-tight'>{customer.name}</h1>
          <div className='flex gap-2'>
            <Button asChild variant='outline'>
              <Link href={`/dashboard/customers/${id}/edit`}>Edit</Link>
            </Button>
            <Button
              variant='outline'
              onClick={() => router.push('/dashboard/customers')}
            >
              Back
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className='grid grid-cols-1 gap-4 text-sm md:grid-cols-3'>
            <div>
              <div className='text-muted-foreground'>Phone</div>
              <div>{customer.contact || '-'}</div>
            </div>
            <div>
              <div className='text-muted-foreground'>Email</div>
              <div>{customer.email || '-'}</div>
            </div>
            <div>
              <div className='text-muted-foreground'>GST</div>
              <div>{customer.gst_number || '-'}</div>
            </div>
            <div className='md:col-span-3'>
              <div className='text-muted-foreground'>Address</div>
              <div className='whitespace-pre-wrap'>
                {customer.address || '-'}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className='grid grid-cols-1 gap-6 xl:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle>Recent Job Cards</CardTitle>
            </CardHeader>
            <CardContent>
              {tickets.length === 0 ? (
                <div className='text-muted-foreground text-sm'>
                  No job cards found.
                </div>
              ) : (
                <div className='overflow-x-auto rounded border'>
                  <table className='w-full text-sm'>
                    <thead className='bg-muted/50 text-muted-foreground'>
                      <tr>
                        <th className='px-3 py-2 text-left'>Ticket</th>
                        <th className='px-3 py-2 text-left'>Vehicle</th>
                        <th className='px-3 py-2 text-left'>Status</th>
                        <th className='px-3 py-2 text-left'>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((t) => (
                        <tr key={t.id} className='border-t'>
                          <td className='px-3 py-2'>
                            <Link
                              className='text-primary underline'
                              href={`/dashboard/job-cards/${t.id}`}
                            >
                              {t.ticket_number}
                            </Link>
                          </td>
                          <td className='px-3 py-2'>
                            {t.vehicle_reg_no || '-'}
                          </td>
                          <td className='px-3 py-2'>{t.status}</td>
                          <td className='px-3 py-2'>
                            {new Date(t.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Batteries</CardTitle>
            </CardHeader>
            <CardContent>
              {batteries.length === 0 ? (
                <div className='text-muted-foreground text-sm'>
                  No battery records found.
                </div>
              ) : (
                <div className='overflow-x-auto rounded border'>
                  <table className='w-full text-sm'>
                    <thead className='bg-muted/50 text-muted-foreground'>
                      <tr>
                        <th className='px-3 py-2 text-left'>Serial</th>
                        <th className='px-3 py-2 text-left'>Brand</th>
                        <th className='px-3 py-2 text-left'>Status</th>
                        <th className='px-3 py-2 text-left'>Received</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batteries.map((b) => (
                        <tr key={b.id} className='border-t'>
                          <td className='px-3 py-2'>
                            <Link
                              className='text-primary underline'
                              href={`/dashboard/batteries/${b.id}`}
                            >
                              {b.serial_number}
                            </Link>
                          </td>
                          <td className='px-3 py-2'>{b.brand || '-'}</td>
                          <td className='px-3 py-2'>{b.status}</td>
                          <td className='px-3 py-2'>
                            {b.received_date
                              ? new Date(b.received_date).toLocaleDateString()
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
