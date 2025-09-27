"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerForm } from '@/components/customers/customer-form';
import { customersApi } from '@/lib/api/customers';
import { toast } from 'sonner';

export default function NewCustomerPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function onSubmit(values: any) {
    setSaving(true);
    try {
      const res = await customersApi.create(values);
      if (!res.success || !res.data) throw new Error(res.error || 'Failed to create customer');
      toast.success('Customer created');
      router.push(`/dashboard/customers/${res.data.id}`);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Failed to create customer');
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight">Add Customer</h1>
        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerForm onSubmit={onSubmit} submitting={saving} />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

