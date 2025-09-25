'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Invoice } from '@/types/billing';
import { billingRepository } from '@/lib/billing/repository';
import { InvoiceDetailView } from './invoice-detail-view';
import { InvoiceEditPage } from './invoice-edit-page';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { IconArrowLeft } from '@tabler/icons-react';
import { toast } from 'sonner';

interface InvoiceDetailPageProps {
  id: string;
}

export function InvoiceDetailPage({ id }: InvoiceDetailPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const mode = searchParams.get('mode'); // 'edit' mode

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const data = await billingRepository.getInvoice(id);
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
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/dashboard/invoices/${id}?mode=edit`);
  };

  const handleAddPayment = () => {
    router.push(`/dashboard/invoices/${id}/payment`);
  };

  const handleSendInvoice = () => {
    toast.info('Send invoice feature coming soon!');
  };

  const handlePrint = () => {
    // This will be handled by the InvoiceDetailView component
  };

  const handleDownloadPDF = () => {
    // This will be handled by the InvoiceDetailView component  
  };

  const handleDuplicate = () => {
    if (invoice) {
      // Convert invoice to form data and redirect to create page
      const params = new URLSearchParams({
        duplicate: 'true',
        sourceId: invoice.id
      });
      router.push(`/dashboard/invoices/new?${params.toString()}`);
    }
  };

  // If in edit mode and we have an invoice, show the edit component
  if (!loading && invoice && mode === 'edit') {
    return <InvoiceEditPage invoiceId={id} />;
  }

  if (loading) {
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

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/invoices')}
            className="h-8 w-8 p-0"
          >
            <IconArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Invoice Details
            </h1>
            <p className="text-muted-foreground">
              View and manage your invoice details.
            </p>
          </div>
        </div>

        {/* Invoice Detail View */}
        <InvoiceDetailView
          invoice={invoice}
          onEdit={handleEdit}
          onAddPayment={handleAddPayment}
          onSendInvoice={handleSendInvoice}
          onPrint={handlePrint}
          onDownloadPDF={handleDownloadPDF}
          onDuplicate={handleDuplicate}
        />
      </div>
    </PageContainer>
  );
}
