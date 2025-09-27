"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { customersApi } from '@/lib/api/customers';
import type { Customer } from '@/lib/types/customers';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import { CustomerQuickAdd } from './customer-quick-add';

export interface CustomerPickerProps {
  value?: string | null;
  onChange?: (id: string | null, customer?: Customer | null) => void;
  allowQuickAdd?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CustomerPicker({
  value,
  onChange,
  allowQuickAdd = true,
  placeholder = 'Search customer by name, phone, or email',
  disabled,
  className,
}: CustomerPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<Customer[]>([]);
  const [selected, setSelected] = React.useState<Customer | null>(null);
  const [quickAddOpen, setQuickAddOpen] = React.useState(false);

  const load = React.useCallback(async (q: string) => {
    setLoading(true);
    const res = await customersApi.list({ search: q, limit: 10 });
    if (res.success && res.data) setResults(res.data);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    // initial load
    load('');
  }, [load]);

  React.useEffect(() => {
    const t = setTimeout(() => load(query), 250);
    return () => clearTimeout(t);
  }, [query, load]);

  const handlePick = (c: Customer) => {
    setSelected(c);
    onChange?.(c.id, c);
    setOpen(false);
  };

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" disabled={disabled} className="justify-between w-full">
            <span className="truncate">{selected?.name || (value ? results.find(r => r.id === value)?.name : '') || 'Select customer'}</span>
            <IconSearch className="ml-2 h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[320px] p-3 space-y-3">
          <Input
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <div className="max-h-64 overflow-auto border rounded">
            {loading ? (
              <div className="p-3 text-sm text-muted-foreground">Searching...</div>
            ) : results.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground">No customers found</div>
            ) : (
              results.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="w-full text-left p-3 border-b hover:bg-muted/50 focus:bg-muted/50 focus:outline-none"
                  onClick={() => handlePick(c)}
                >
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.contact || c.email || c.address || ''}</div>
                </button>
              ))
            )}
          </div>
          {allowQuickAdd && (
            <Button type="button" variant="secondary" className="w-full" onClick={() => setQuickAddOpen(true)}>
              <IconPlus className="h-4 w-4 mr-2" />
              Add new customer
            </Button>
          )}
        </PopoverContent>
      </Popover>

      <CustomerQuickAdd
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        onCreated={(c) => {
          // Optimistically add to results and select
          setResults((prev) => [c, ...prev]);
          handlePick(c);
        }}
        presetName={query}
      />
    </div>
  );
}

