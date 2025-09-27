"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerForm } from '@/components/customers/customer-form';
import { customersApi } from '@/lib/api/customers';
import { toast } from 'sonner';

export default function EditCustomerPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initial, setInitial] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const res = await customersApi.getById(id);
      if (res.success && res.data) setInitial(res.data);
      setLoading(false);
    };
    if (id) load();
  }, [id]);

  async function onSubmit(values: any) {
    setSaving(true);
    try {
      const res = await customersApi.update(id, values);
      if (!res.success || !res.data) throw new Error(res.error || 'Failed to update customer');
      toast.success('Customer updated');
      router.push(`/dashboard/customers/${id}`);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Failed to update customer');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;
  if (!initial) return <div className="p-6">Customer not found</div>;

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight">Edit Customer</h1>
        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerForm initial={initial} isEditing onSubmit={onSubmit} submitting={saving} />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

