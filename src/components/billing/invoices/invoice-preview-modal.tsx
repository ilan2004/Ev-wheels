'use client';

import { useState } from 'react';
import { Invoice } from '@/types/billing';
import { EVInvoiceTemplate } from './ev-invoice-template';
import { downloadInvoiceAsPDF } from '@/lib/invoice-download';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { IconDownload, IconPrinter, IconX, IconEye } from '@tabler/icons-react';
import { toast } from 'sonner';

interface InvoicePreviewModalProps {
  invoice: Invoice | null;
  open: boolean;
  onClose: () => void;
}

export function InvoicePreviewModal({
  invoice,
  open,
  onClose
}: InvoicePreviewModalProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!invoice) return;

    try {
      setDownloading(true);
      const previewElement = document.getElementById('invoice-preview-content');
      if (previewElement) {
        await downloadInvoiceAsPDF(invoice, previewElement.innerHTML);
        toast.success('Invoice ready for download!');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='max-h-[90vh] max-w-6xl overflow-auto'>
        <DialogHeader>
          <div className='flex items-center justify-between'>
            <DialogTitle className='flex items-center gap-2'>
              <IconEye className='h-5 w-5' />
              Preview Invoice {invoice.number}
            </DialogTitle>
            <div className='flex items-center gap-2'>
              <Button
                onClick={handleDownload}
                disabled={downloading}
                size='sm'
                className='gap-2'
              >
                {downloading ? (
                  <>
                    <div className='h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current' />
                    Generating...
                  </>
                ) : (
                  <>
                    <IconDownload className='h-4 w-4' />
                    Download PDF
                  </>
                )}
              </Button>
              <Button onClick={onClose} variant='outline' size='sm'>
                <IconX className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className='mt-4'>
          {/* Preview Content */}
          <div
            id='invoice-preview-content'
            className='max-h-[70vh] overflow-auto rounded-lg border bg-white'
            style={{ minHeight: '600px' }}
          >
            <EVInvoiceTemplate invoice={invoice} />
          </div>
        </div>

        {/* Footer Actions */}
        <div className='flex items-center justify-between border-t pt-4'>
          <div className='text-muted-foreground text-sm'>
            Preview your invoice before downloading or printing
          </div>
          <div className='flex gap-2'>
            <Button variant='outline' onClick={onClose}>
              Close Preview
            </Button>
            <Button onClick={handleDownload} disabled={downloading}>
              {downloading ? (
                <>
                  <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current' />
                  Generating PDF...
                </>
              ) : (
                <>
                  <IconDownload className='mr-2 h-4 w-4' />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
