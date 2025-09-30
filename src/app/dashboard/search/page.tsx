'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  globalSearch,
  type GlobalSearchResults
} from '@/lib/api/global-search';

export default function GlobalSearchPage() {
  const [q, setQ] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<GlobalSearchResults>(
    {
      tickets: [],
      batteries: [],
      customers: []
    } as unknown as GlobalSearchResults
  );
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handle = setTimeout(async () => {
      if (!q.trim()) {
        setResults({
          tickets: [],
          batteries: [],
          customers: []
        } as unknown as GlobalSearchResults);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      const res = await globalSearch(q);
      if (res.success && res.data) setResults(res.data);
      else setError(res.error || 'Search failed');
      setLoading(false);
    }, 300);
    return () => clearTimeout(handle);
  }, [q]);

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-tight'>Global Search</h1>
        <p className='text-muted-foreground'>
          Find job cards, batteries, and customers
        </p>
      </div>

      <div className='max-w-xl'>
        <Input
          placeholder='Search by job card number, vehicle reg no, battery serial, brand, or customer name/contact'
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {loading && (
        <div className='text-muted-foreground text-sm'>Searching…</div>
      )}
      {error && <div className='text-destructive text-sm'>{error}</div>}

      {!loading && !error && (
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          <Card>
            <CardHeader>
              <CardTitle>
                Job Cards
                <Badge variant='secondary'>{results.tickets.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.tickets.length === 0 ? (
                <div className='text-muted-foreground text-sm'>
                  No job cards found
                </div>
              ) : (
                <div className='space-y-2'>
                  {results.tickets.map((t) => (
                    <Link
                      key={t.id}
                      className='block text-sm underline'
                      href={`/dashboard/job-cards/${t.id}`}
                    >
                      {t.ticket_number}{' '}
                      <span className='text-muted-foreground'>
                        • {t.status}
                      </span>
                      {t.vehicle_reg_no ? (
                        <span className='text-muted-foreground'>
                          {' '}
                          • {t.vehicle_reg_no}
                        </span>
                      ) : null}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Batteries{' '}
                <Badge variant='secondary'>{results.batteries.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.batteries.length === 0 ? (
                <div className='text-muted-foreground text-sm'>
                  No batteries found
                </div>
              ) : (
                <div className='space-y-2'>
                  {results.batteries.map((b) => (
                    <Link
                      key={b.id}
                      className='block text-sm underline'
                      href={`/dashboard/batteries/${b.id}`}
                    >
                      {b.serial_number}{' '}
                      <span className='text-muted-foreground'>• {b.brand}</span>
                      <span className='text-muted-foreground'>
                        {' '}
                        • {b.status}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Customers{' '}
                <Badge variant='secondary'>{results.customers.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.customers.length === 0 ? (
                <div className='text-muted-foreground text-sm'>
                  No customers found
                </div>
              ) : (
                <div className='space-y-2'>
                  {results.customers.map((c) => (
                    <div key={c.id} className='text-sm'>
                      <div className='font-medium'>{c.name}</div>
                      <div className='text-muted-foreground'>
                        {c.contact || '-'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
