"use client";

import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { customersApi } from '@/lib/api/customers';
import type { Customer } from '@/lib/types/customers';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  contact: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  gst_number: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function CustomerQuickAdd({
  open,
  onOpenChange,
  onCreated,
  presetName,
}: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: (c: Customer) => void; presetName?: string }) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: presetName || '', contact: '', email: '', address: '', gst_number: '' },
  });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      form.reset({ name: presetName || '', contact: '', email: '', address: '', gst_number: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, presetName]);

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const res = await customersApi.create(values);
      if (res.success && res.data) {
        onCreated(res.data);
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Customer</DialogTitle>
          <DialogDescription>Quickly add a new customer.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField name="name" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl><Input placeholder="Full name" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField name="contact" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl><Input placeholder="Phone" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="email" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input placeholder="Email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField name="address" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl><Textarea placeholder="Address" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="gst_number" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>GST Number</FormLabel>
                <FormControl><Input placeholder="GST / Tax ID" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

