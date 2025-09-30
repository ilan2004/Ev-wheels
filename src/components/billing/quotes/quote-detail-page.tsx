'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Quote } from '@/types/billing';
import { QuoteForm } from './quote-form';
import {
  CreateQuoteFormData,
  UpdateQuoteFormData,
  quoteToInvoiceFormData
} from '@/lib/billing/schemas';
import { billingRepository } from '@/lib/billing/repository';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  IconArrowLeft,
  IconEdit,
  IconReceipt,
  IconPrinter,
  IconDownload,
  IconTrash,
  IconUser,
  IconCalendar,
  IconFileText
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/billing/calculations';
import { toast } from 'sonner';

interface QuoteDetailPageProps {
  id: string;
}

function QuoteViewMode({
  quote,
  onEdit,
  onConvertToInvoice
}: {
  quote: Quote;
  onEdit: () => void;
  onConvertToInvoice: () => void;
}) {
  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'secondary',
      sent: 'default',
      expired: 'destructive'
    } as const;

    return (
      <Badge
        variant={variants[status as keyof typeof variants] || 'secondary'}
        className='capitalize'
      >
        {status}
      </Badge>
    );
  };

  return (
    <div className='space-y-6'>
      {/* Quote Header */}
      <Card>
        <CardHeader>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <CardTitle className='flex items-center gap-2'>
                <IconFileText className='h-5 w-5' />
                Quote {quote.number}
              </CardTitle>
              <div className='mt-2 flex items-center gap-2'>
                {getStatusBadge(quote.status)}
                <span className='text-muted-foreground text-sm'>
                  Created {format(quote.createdAt, 'MMM dd, yyyy')}
                </span>
              </div>
            </div>
            <div className='flex flex-col gap-2 sm:flex-row'>
              <Button variant='outline' size='sm' onClick={onEdit}>
                <IconEdit className='mr-2 h-4 w-4' />
                Edit Quote
              </Button>
              <Button variant='outline' size='sm'>
                <IconPrinter className='mr-2 h-4 w-4' />
                Print
              </Button>
              <Button onClick={onConvertToInvoice}>
                <IconReceipt className='mr-2 h-4 w-4' />
                Convert to Invoice
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <IconUser className='h-5 w-5' />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4 md:grid-cols-2'>
          <div>
            <Label className='text-sm font-medium'>Name</Label>
            <p className='text-muted-foreground text-sm'>
              {quote.customer.name}
            </p>
          </div>
          {quote.customer.email && (
            <div>
              <Label className='text-sm font-medium'>Email</Label>
              <p className='text-muted-foreground text-sm'>
                {quote.customer.email}
              </p>
            </div>
          )}
          {quote.customer.phone && (
            <div>
              <Label className='text-sm font-medium'>Phone</Label>
              <p className='text-muted-foreground text-sm'>
                {quote.customer.phone}
              </p>
            </div>
          )}
          {quote.customer.gstNumber && (
            <div>
              <Label className='text-sm font-medium'>GST Number</Label>
              <p className='text-muted-foreground text-sm'>
                {quote.customer.gstNumber}
              </p>
            </div>
          )}
          {quote.customer.address && (
            <div className='md:col-span-2'>
              <Label className='text-sm font-medium'>Address</Label>
              <p className='text-muted-foreground text-sm whitespace-pre-wrap'>
                {quote.customer.address}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className='text-right'>Qty</TableHead>
                  <TableHead className='text-right'>Unit Price</TableHead>
                  <TableHead className='text-right'>Discount</TableHead>
                  <TableHead className='text-right'>Tax</TableHead>
                  <TableHead className='text-right'>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quote.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className='font-medium'>
                      {item.description}
                    </TableCell>
                    <TableCell className='text-right'>
                      {item.quantity}
                    </TableCell>
                    <TableCell className='text-right'>
                      {formatCurrency(item.unitPrice)}
                    </TableCell>
                    <TableCell className='text-right'>
                      {item.discount ? `${item.discount}%` : '-'}
                    </TableCell>
                    <TableCell className='text-right'>
                      {item.taxRate ? `${item.taxRate}%` : '-'}
                    </TableCell>
                    <TableCell className='text-right'>
                      {formatCurrency(item.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Totals */}
          <div className='mt-6 flex justify-end'>
            <div className='w-full max-w-sm space-y-2'>
              <div className='flex justify-between text-sm'>
                <span>Subtotal:</span>
                <span>{formatCurrency(quote.totals.subtotal)}</span>
              </div>
              {quote.totals.discountTotal > 0 && (
                <div className='text-muted-foreground flex justify-between text-sm'>
                  <span>Discount:</span>
                  <span>-{formatCurrency(quote.totals.discountTotal)}</span>
                </div>
              )}
              <div className='flex justify-between text-sm'>
                <span>Tax:</span>
                <span>{formatCurrency(quote.totals.taxTotal)}</span>
              </div>
              {quote.totals.shippingAmount && (
                <div className='flex justify-between text-sm'>
                  <span>Shipping:</span>
                  <span>{formatCurrency(quote.totals.shippingAmount)}</span>
                </div>
              )}
              {quote.totals.adjustmentAmount && (
                <div className='flex justify-between text-sm'>
                  <span>Adjustment:</span>
                  <span>{formatCurrency(quote.totals.adjustmentAmount)}</span>
                </div>
              )}
              <Separator />
              <div className='flex justify-between font-semibold'>
                <span>Grand Total:</span>
                <span>{formatCurrency(quote.totals.grandTotal)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quote Details */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <IconCalendar className='h-5 w-5' />
            Quote Details
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {quote.validUntil && (
            <div>
              <Label className='text-sm font-medium'>Valid Until</Label>
              <p className='text-muted-foreground text-sm'>
                {format(quote.validUntil, 'PPP')}
              </p>
            </div>
          )}
          {quote.notes && (
            <div>
              <Label className='text-sm font-medium'>Notes</Label>
              <p className='text-muted-foreground text-sm whitespace-pre-wrap'>
                {quote.notes}
              </p>
            </div>
          )}
          {quote.terms && (
            <div>
              <Label className='text-sm font-medium'>Terms & Conditions</Label>
              <p className='text-muted-foreground text-sm whitespace-pre-wrap'>
                {quote.terms}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function QuoteDetailPage({ id }: QuoteDetailPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Check if we're in edit mode from URL params
  useEffect(() => {
    const mode = searchParams.get('mode');
    setEditMode(mode === 'edit');
  }, [searchParams]);

  useEffect(() => {
    loadQuote();
  }, [id]);

  const loadQuote = async () => {
    try {
      setLoading(true);
      const data = await billingRepository.getQuote(id);
      if (!data) {
        toast.error('Quote not found');
        router.push('/dashboard/quotes');
        return;
      }
      setQuote(data);
    } catch (error) {
      toast.error('Failed to load quote');
      router.push('/dashboard/quotes');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data: UpdateQuoteFormData) => {
    if (!user || !quote) return;

    try {
      setSaving(true);
      const updated = await billingRepository.updateQuote(quote.id, data);
      setQuote(updated);
      setEditMode(false);
      toast.success('Quote updated successfully');
      // Update URL to remove edit mode
      router.replace(`/dashboard/quotes/${id}`);
    } catch (error) {
      toast.error('Failed to update quote');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    setEditMode(true);
    // Update URL to show edit mode
    router.replace(`/dashboard/quotes/${id}?mode=edit`);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    // Update URL to remove edit mode
    router.replace(`/dashboard/quotes/${id}`);
  };

  const handleConvertToInvoice = () => {
    if (!quote) return;
    // Navigate to create invoice page with quote data
    router.push(`/dashboard/invoices/new?fromQuote=${quote.id}`);
  };

  if (loading) {
    return (
      <PageContainer>
        <div className='flex items-center justify-center py-8'>
          <div className='text-center'>
            <div className='border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2'></div>
            <p className='text-muted-foreground'>Loading quote...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!quote) {
    return (
      <PageContainer>
        <div className='py-8 text-center'>
          <p className='text-muted-foreground'>Quote not found.</p>
          <Button
            className='mt-4'
            onClick={() => router.push('/dashboard/quotes')}
          >
            Back to Quotes
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6'>
        {/* Header */}
        <div className='flex items-center gap-4'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => router.push('/dashboard/quotes')}
            className='h-8 w-8 p-0'
          >
            <IconArrowLeft className='h-4 w-4' />
          </Button>
          <div>
            <h1 className='text-2xl font-semibold tracking-tight'>
              {editMode ? 'Edit Quote' : 'Quote Details'}
            </h1>
            <p className='text-muted-foreground'>
              {editMode
                ? 'Update your quote information'
                : 'View and manage your quote'}
            </p>
          </div>
        </div>

        {/* Content */}
        {editMode ? (
          <QuoteForm
            initialData={{
              customer: quote.customer,
              items: quote.items.map((item) => ({
                id: item.id,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: item.discount,
                taxRate: item.taxRate
              })),
              notes: quote.notes,
              terms: quote.terms,
              validUntil: quote.validUntil,
              shippingAmount: quote.totals.shippingAmount || 0,
              adjustmentAmount: quote.totals.adjustmentAmount || 0
            }}
            onSubmit={handleUpdate}
            onCancel={handleCancelEdit}
            loading={saving}
            mode='edit'
          />
        ) : (
          <QuoteViewMode
            quote={quote}
            onEdit={handleEdit}
            onConvertToInvoice={handleConvertToInvoice}
          />
        )}
      </div>
    </PageContainer>
  );
}
