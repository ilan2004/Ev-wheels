import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';

vi.mock('@/lib/api/customers', () => {
  const list = vi.fn(async ({ search }: { search?: string }) => ({
    success: true,
    data: [
      { id: '1', name: 'John Doe', contact: '98765', email: '', address: '', gst_number: '', created_at: '', updated_at: '' },
      { id: '2', name: 'Jane Smith', contact: '12345', email: '', address: '', gst_number: '', created_at: '', updated_at: '' },
    ].filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))
  }));
  const create = vi.fn(async (input: any) => ({ success: true, data: { id: 'new', ...input, created_at: '', updated_at: '' } }));
  return {
    customersApi: { list, create },
  };
});

import { CustomerPicker } from '@/components/customers/customer-picker';

describe('CustomerPicker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('opens popover, searches, and selects a customer', async () => {
    const onChange = vi.fn();
    render(<CustomerPicker onChange={onChange} />);

    // Open popover
    const trigger = screen.getByRole('button', { name: /select customer/i });
    fireEvent.click(trigger);

    // Type into search input (inside popover)
    const popover = await screen.findByRole('dialog');
    const input = within(popover).getByPlaceholderText(/search customer/i);
    fireEvent.change(input, { target: { value: 'john' } });

    // Wait for debounce
    await vi.advanceTimersByTimeAsync(350);

    // Should see filtered result and be able to click
    const john = await within(popover).findByText('John Doe');
    fireEvent.click(john);

    expect(onChange).toHaveBeenCalledWith('1', expect.objectContaining({ name: 'John Doe' }));
  });
});

