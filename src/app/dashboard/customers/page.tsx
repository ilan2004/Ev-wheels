'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { customersApi, type Customer } from '@/lib/api/customers';
import { Badge } from '@/components/ui/badge';

export default function CustomersListPage() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const offset = (page - 1) * pageSize;
      const res = await customersApi.list({
        search: debouncedSearch,
        limit: pageSize,
        offset
      });
      if (res.success && res.data) setRows(res.data);
      setLoading(false);
    };
    load();
  }, [debouncedSearch, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  return (
    <PageContainer>
      <div className='flex flex-col gap-6'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <h1 className='text-2xl font-bold tracking-tight'>Customers</h1>
          <div className='flex gap-2 overflow-x-auto'>
            <Button asChild variant='outline'>
              <Link href='/dashboard/customers/duplicates'>Duplicates</Link>
            </Button>
            <Button asChild variant='outline'>
              <Link href='/dashboard/customers/import'>Import</Link>
            </Button>
            <Button asChild>
              <Link href='/dashboard/customers/new'>Add Customer</Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className='py-6'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
              <Input
                placeholder='Search by name, phone, email'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div
          className='overflow-x-auto rounded-md border'
          role='region'
          aria-label='Customers table'
        >
          <table className='w-full text-sm'>
            <thead className='bg-muted/50 text-muted-foreground'>
              <tr>
                <th className='px-2 py-2 text-left sm:px-3'>Name</th>
                <th className='px-2 py-2 text-left sm:px-3'>Contact</th>
                <th className='hidden px-2 py-2 text-left sm:px-3 md:table-cell'>
                  Email
                </th>
                <th className='hidden px-2 py-2 text-left sm:px-3 md:table-cell'>
                  Created
                </th>
                <th className='px-2 py-2 text-left sm:px-3'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className='px-2 py-6 sm:px-3' colSpan={5}>
                    Loading...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className='px-2 py-6 sm:px-3' colSpan={5}>
                    No customers found.
                  </td>
                </tr>
              ) : (
                rows.map((c) => (
                  <tr key={c.id} className='border-t'>
                    <td className='px-2 py-2 sm:px-3'>
                      <Link
                        className='text-primary underline'
                        href={`/dashboard/customers/${c.id}`}
                      >
                        {c.name}
                      </Link>
                      {c.gst_number && (
                        <div className='text-muted-foreground mt-0.5 text-xs'>
                          GST: {c.gst_number}
                        </div>
                      )}
                    </td>
                    <td className='px-2 py-2 sm:px-3'>{c.contact || '-'}</td>
                    <td className='hidden px-2 py-2 sm:px-3 md:table-cell'>
                      {c.email || '-'}
                    </td>
                    <td className='hidden px-2 py-2 sm:px-3 md:table-cell'>
                      {new Date(c.created_at).toLocaleString()}
                    </td>
                    <td className='px-2 py-2 sm:px-3'>
                      <div className='flex gap-2'>
                        <Button asChild variant='outline' size='sm'>
                          <Link href={`/dashboard/customers/${c.id}`}>
                            View
                          </Link>
                        </Button>
                        <Button asChild variant='outline' size='sm'>
                          <Link href={`/dashboard/customers/${c.id}/edit`}>
                            Edit
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='text-muted-foreground text-xs'>Page {page}</div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                const header = [
                  'name',
                  'contact',
                  'email',
                  'address',
                  'gst_number'
                ];
                const lines = rows.map((r) =>
                  [
                    r.name,
                    r.contact || '',
                    r.email || '',
                    r.address || '',
                    r.gst_number || ''
                  ]
                    .map((v) => String(v).replace(/,/g, ' '))
                    .join(',')
                );
                const csv = [header.join(','), ...lines].join('\n');
                const blob = new Blob([csv], {
                  type: 'text/csv;charset=utf-8;'
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `customers_page${page}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Export CSV
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              Prev
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setPage((p) => p + 1)}
              disabled={loading || rows.length < pageSize}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
