'use client';

import React, { useEffect, useMemo, useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { customersApi, type Customer } from '@/lib/api/customers';

function normalize(s?: string | null) {
  return (s || '').trim().toLowerCase();
}

export default function CustomersDuplicatesPage() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [merging, setMerging] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // Fetch a reasonable set for client-side grouping
      const res = await customersApi.list({
        search: debouncedSearch,
        limit: 500,
        offset: 0
      });
      if (res.success && res.data) setRows(res.data);
      setLoading(false);
    };
    load();
  }, [debouncedSearch]);

  const groups = useMemo(() => {
    const byKey: Record<string, Customer[]> = {};
    for (const c of rows) {
      const kPhone = normalize(c.contact);
      const kEmail = normalize(c.email);
      const kName = normalize(c.name);
      const key = kPhone || kEmail || kName; // prioritize phone/email
      if (!key) continue;
      byKey[key] = byKey[key] || [];
      byKey[key].push(c);
    }
    return Object.values(byKey).filter((g) => g.length > 1);
  }, [rows]);

  async function mergeAllInto(target: Customer, sources: Customer[]) {
    setMerging(target.id);
    try {
      for (const s of sources) {
        if (s.id === target.id) continue;
        const res = await customersApi.merge(s.id, target.id);
        if (!res.success) throw new Error(res.error || 'Merge failed');
      }
      // Refresh
      const res = await customersApi.list({ search, limit: 500, offset: 0 });
      if (res.success && res.data) setRows(res.data);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Merge failed');
    } finally {
      setMerging(null);
    }
  }

  return (
    <PageContainer>
      <div className='flex flex-col gap-6'>
        <div className='flex items-center justify-between'>
          <h1 className='text-2xl font-bold tracking-tight'>
            Duplicate Customers
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Find Duplicates</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
              <Input
                placeholder='Filter by name/phone/email (optional)'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className='text-muted-foreground text-sm'>
              Heuristic: groups by normalized phone/email/name; shows groups
              with 2+ entries. Review before merging.
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div>Loading...</div>
        ) : groups.length === 0 ? (
          <div className='text-muted-foreground text-sm'>
            No duplicates found.
          </div>
        ) : (
          <div className='space-y-6'>
            {groups.map((g, idx) => {
              const target = g[0];
              const sources = g.slice(1);
              return (
                <Card key={`g-${idx}`}>
                  <CardHeader>
                    <CardTitle className='text-base'>Group {idx + 1}</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <div className='text-sm'>
                      Target (kept):{' '}
                      <span className='font-medium'>{target.name}</span>{' '}
                      {target.contact ? `(${target.contact})` : ''}
                    </div>
                    <div className='text-sm'>To merge into target:</div>
                    <div className='divide-y rounded border'>
                      {sources.map((s) => (
                        <div
                          key={s.id}
                          className='flex items-center justify-between p-2 text-sm'
                        >
                          <div>
                            <div className='font-medium'>{s.name}</div>
                            <div className='text-muted-foreground text-xs'>
                              {s.contact || s.email || s.address || '-'}
                            </div>
                          </div>
                          <div>
                            <Button
                              size='sm'
                              variant='outline'
                              disabled={merging === target.id}
                              onClick={async () => mergeAllInto(target, [s])}
                            >
                              Merge
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className='flex justify-end'>
                      <Button
                        onClick={() => mergeAllInto(target, sources)}
                        disabled={merging === target.id}
                      >
                        {merging === target.id
                          ? 'Merging...'
                          : 'Merge All Into Target'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
