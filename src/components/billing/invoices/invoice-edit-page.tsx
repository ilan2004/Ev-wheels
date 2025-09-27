'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { InvoiceForm } from './invoice-form';
import { UpdateInvoiceFormData, CreateInvoiceFormData } from '@/lib/billing/schemas';
import { billingRepository } from '@/lib/billing/repository';
import { Invoice } from '@/types/billing';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { IconArrowLeft } from '@tabler/icons-react';
import { toast } from 'sonner';

interface InvoiceEditPageProps {
  invoiceId: string;
}

export function InvoiceEditPage({ invoiceId }: InvoiceEditPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    loadInvoice();
  }, [invoiceId]);

  const loadInvoice = async () => {
    try {
      setInitialLoading(true);
      const data = await billingRepository.getInvoice(invoiceId);
      if (!data) {
        toast.error('Invoice not found');
        router.push('/dashboard/invoices');
        return;
      }
      setInvoice(data);
    } catch (error) {
      toast.error('Failed to load invoice');
      router.push('/dashboard/invoices');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (data: UpdateInvoiceFormData) => {
    if (!user) {
      toast.error('You must be logged in to update an invoice');
      return;
    }

    try {
      setLoading(true);
      await billingRepository.updateInvoice(invoiceId, data);
      toast.success('Invoice updated successfully');
      router.push(`/dashboard/invoices/${invoiceId}`);
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('Failed to update invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/dashboard/invoices/${invoiceId}`);
  };

  if (initialLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading invoice...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!invoice) {
    return (
      <PageContainer>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Invoice not found.</p>
          <Button className="mt-4" onClick={() => router.push('/dashboard/invoices')}>
            Back to Invoices
          </Button>
        </div>
      </PageContainer>
    );
  }

  // Convert invoice to form data
  const initialData: CreateInvoiceFormData = {
    customer: invoice.customer,
    items: invoice.items.map(item => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      taxRate: item.taxRate
    })),
    dueDate: invoice.dueDate,
    notes: invoice.notes,
    terms: invoice.terms,
    shippingAmount: invoice.totals.shippingAmount || 0,
    adjustmentAmount: invoice.totals.adjustmentAmount || 0
  };

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="h-8 w-8 p-0"
          >
            <IconArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Edit Invoice {invoice.number}
            </h1>
            <p className="text-muted-foreground">
              Make changes to your invoice details.
            </p>
          </div>
        </div>

        {/* Invoice Form */}
        <InvoiceForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          mode="edit"
        />
      </div>
    </PageContainer>
  );
}
