'use client';

import React, { useMemo, useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { customersApi } from '@/lib/api/customers';

interface Row {
  name: string;
  contact?: string;
  email?: string;
  address?: string;
  gst_number?: string;
}

function parseCsv(text: string): Row[] {
  // very basic CSV parser (expects header: name,contact,email,address,gst_number)
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const idx = {
    name: headers.indexOf('name'),
    contact: headers.indexOf('contact'),
    email: headers.indexOf('email'),
    address: headers.indexOf('address'),
    gst_number: headers.indexOf('gst_number')
  };
  return lines
    .slice(1)
    .map((line) => {
      const cols = line.split(',');
      return {
        name: (cols[idx.name] || '').trim(),
        contact:
          idx.contact >= 0 ? (cols[idx.contact] || '').trim() : undefined,
        email: idx.email >= 0 ? (cols[idx.email] || '').trim() : undefined,
        address:
          idx.address >= 0 ? (cols[idx.address] || '').trim() : undefined,
        gst_number:
          idx.gst_number >= 0 ? (cols[idx.gst_number] || '').trim() : undefined
      } as Row;
    })
    .filter((r) => r.name);
}

export default function CustomersImportPage() {
  const [text, setText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number }>({
    success: 0,
    failed: 0
  });

  const canImport = useMemo(
    () => rows.length > 0 && !importing,
    [rows, importing]
  );

  function onParse() {
    setParsing(true);
    try {
      const parsed = parseCsv(text);
      setRows(parsed);
    } finally {
      setParsing(false);
    }
  }

  async function onImport() {
    if (rows.length === 0) return;
    setImporting(true);
    let success = 0,
      failed = 0;
    try {
      for (const r of rows) {
        const res = await customersApi.create(r as any);
        if (res.success) success++;
        else failed++;
      }
      setResult({ success, failed });
      alert(`Import completed. Success: ${success}, Failed: ${failed}`);
    } finally {
      setImporting(false);
    }
  }

  return (
    <PageContainer>
      <div className='flex flex-col gap-6'>
        <div className='flex items-center justify-between'>
          <h1 className='text-2xl font-bold tracking-tight'>
            Import Customers
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Paste CSV</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='text-muted-foreground text-sm'>
              Expected headers: name,contact,email,address,gst_number. One
              customer per line.
            </div>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className='min-h-[200px]'
              placeholder='name,contact,email,address,gst_number\nJohn Doe,9876543210,john@example.com,Main Street 1,GST123...'
            />
            <div className='flex gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={onParse}
                disabled={parsing}
              >
                Preview
              </Button>
              <Button type='button' onClick={onImport} disabled={!canImport}>
                {importing ? 'Importing...' : 'Import'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {rows.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Preview ({rows.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='overflow-x-auto rounded border'>
                <table className='w-full text-sm'>
                  <thead className='bg-muted/50 text-muted-foreground'>
                    <tr>
                      <th className='px-3 py-2 text-left'>Name</th>
                      <th className='px-3 py-2 text-left'>Contact</th>
                      <th className='px-3 py-2 text-left'>Email</th>
                      <th className='px-3 py-2 text-left'>GST</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className='border-t'>
                        <td className='px-3 py-2'>{r.name}</td>
                        <td className='px-3 py-2'>{r.contact || '-'}</td>
                        <td className='px-3 py-2'>{r.email || '-'}</td>
                        <td className='px-3 py-2'>{r.gst_number || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
