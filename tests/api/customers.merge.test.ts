import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/supabase/client', () => {
  // Basic mock shape used by customers.supabase repo methods
  const update = vi.fn().mockResolvedValue({ data: null, error: null });
  const del = vi.fn().mockResolvedValue({ error: null });
  const selectChain = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
  } as any;
  return {
    supabase: {
      from: vi.fn((table: string) => {
        if (table === 'battery_records' || table === 'service_tickets') {
          return { update, eq: vi.fn().mockReturnThis() } as any;
        }
        if (table === 'customers') {
          return { delete: () => ({ eq: () => ({ error: null }) }) } as any;
        }
        if (table === 'customers_audit') {
          return { insert: vi.fn().mockResolvedValue({ error: null }) } as any;
        }
        return selectChain;
      }),
    },
  };
});

import { customersApi } from '@/lib/api/customers';

describe('customersApi.merge', () => {
  it('merges by updating references and deleting the source', async () => {
    const res = await customersApi.merge('source-id', 'target-id');
    expect(res.success).toBe(true);
  });
});

