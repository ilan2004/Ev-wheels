'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { InvoiceForm } from './invoice-form';
import { CreateInvoiceFormData } from '@/lib/billing/schemas';
import { billingRepository } from '@/lib/billing/repository';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { IconArrowLeft, IconDownload } from '@tabler/icons-react';
import { toast } from 'sonner';

export function CreateInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<
    CreateInvoiceFormData | undefined
  >();
  const [createdInvoice, setCreatedInvoice] = useState<string | null>(null);

  // Check if we're converting from a quote
  useEffect(() => {
    const fromQuoteId = searchParams.get('fromQuote');
    if (fromQuoteId) {
      loadQuoteData(fromQuoteId);
    }
  }, [searchParams]);

  const loadQuoteData = async (quoteId: string) => {
    try {
      const quote = await billingRepository.getQuote(quoteId);
      if (quote) {
        // Convert quote data to invoice form data
        setInitialData({
          customer: quote.customer,
          items: quote.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            taxRate: item.taxRate
          })),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          notes: quote.notes,
          terms: quote.terms || 'Payment due within 30 days of invoice date.',
          shippingAmount: quote.totals.shippingAmount || 0,
          adjustmentAmount: quote.totals.adjustmentAmount || 0,
          sourceQuoteId: quoteId
        });
        toast.success('Quote data loaded for invoice creation');
      }
    } catch (error) {
      toast.error('Failed to load quote data');
    }
  };

  const handleSubmit = async (data: CreateInvoiceFormData) => {
    if (!user) {
      toast.error('You must be logged in to create an invoice');
      return;
    }

    const id = toast.loading('Creating invoice...');

    try {
      setLoading(true);
      const invoice = await billingRepository.createInvoice(data, user.id);
      setCreatedInvoice(invoice.id);
      toast.success('Invoice created successfully!', { id, duration: 3000 });
      // Offer quick navigation
      router.push(`/dashboard/invoices/${invoice.id}`);
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice. Please try again.', { id });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/invoices');
  };

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6'>
        {/* Header */}
        <div className='flex items-center gap-4'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => router.back()}
            className='h-8 w-8 p-0'
          >
            <IconArrowLeft className='h-4 w-4' />
          </Button>
          <div>
            <h1 className='text-2xl font-semibold tracking-tight'>
              Create Invoice
            </h1>
            <p className='text-muted-foreground'>
              {initialData?.sourceQuoteId
                ? 'Create an invoice from the selected quote.'
                : 'Create a new invoice for your customer.'}
            </p>
          </div>
        </div>

        {/* Invoice Form */}
        <InvoiceForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          mode='create'
        />
      </div>
    </PageContainer>
  );
}
