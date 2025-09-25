'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Invoice, InvoiceStatus, Payment, PaymentMethod } from '@/types/billing';
import { formatCurrency, formatDueDateStatus, isOverdue } from '@/lib/billing/calculations';
import { EVInvoiceTemplate } from './ev-invoice-template';
import { InvoicePreviewModal } from './invoice-preview-modal';
import { downloadInvoiceAsPDF, printInvoice } from '@/lib/invoice-download';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  IconEdit, 
  IconCreditCard, 
  IconPrinter,
  IconDownload,
  IconDotsVertical,
  IconSend,
  IconCopy,
  IconEye,
  IconAlertTriangle,
  IconCalendar,
  IconMail,
  IconPhone,
  IconMapPin,
  IconFileText
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface InvoiceDetailViewProps {
  invoice: Invoice;
  onEdit?: () => void;
  onAddPayment?: () => void;
  onSendInvoice?: () => void;
  onPrint?: () => void;
  onDownloadPDF?: () => void;
  onDuplicate?: () => void;
}

function getStatusBadge(status: InvoiceStatus) {
  const variants = {
    [InvoiceStatus.DRAFT]: 'secondary',
    [InvoiceStatus.SENT]: 'default', 
    [InvoiceStatus.PAID]: 'success',
    [InvoiceStatus.VOID]: 'destructive'
  } as const;
  
  return (
    <Badge variant={variants[status] || 'secondary'} className="capitalize">
      {status}
    </Badge>
  );
}

function getPaymentMethodBadge(method: PaymentMethod) {
  const variants = {
    [PaymentMethod.CASH]: 'default',
    [PaymentMethod.CHECK]: 'secondary',
    [PaymentMethod.BANK_TRANSFER]: 'outline',
    [PaymentMethod.CREDIT_CARD]: 'default',
    [PaymentMethod.OTHER]: 'secondary'
  } as const;
  
  return (
    <Badge variant={variants[method] || 'secondary'} className="capitalize">
      {method.replace('_', ' ')}
    </Badge>
  );
}

export function InvoiceDetailView({ 
  invoice,
  onEdit,
  onAddPayment,
  onSendInvoice,
  onPrint,
  onDownloadPDF,
  onDuplicate
}: InvoiceDetailViewProps) {
  const templateRef = useRef<HTMLDivElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const overdue = isOverdue(invoice.dueDate) && invoice.status !== InvoiceStatus.PAID;
  const dueDateStatus = formatDueDateStatus(invoice.dueDate);
  const paymentsTotal = invoice.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handlePrint = async () => {
    if (templateRef.current) {
      try {
        await downloadInvoiceAsPDF(invoice, templateRef.current.innerHTML);
        toast.success('Invoice opened for printing/download');
      } catch (error) {
        toast.error('Failed to generate printable invoice');
      }
    }
  };

  const handleDownloadPDF = async () => {
    if (templateRef.current) {
      try {
        await downloadInvoiceAsPDF(invoice, templateRef.current.innerHTML);
        toast.success('Invoice ready for download');
      } catch (error) {
        toast.error('Failed to generate PDF');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h2 className="text-2xl font-semibold tracking-tight">
              Invoice {invoice.number}
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <IconCalendar className="h-4 w-4" />
              Created on {format(invoice.createdAt, 'PPP')}
              {overdue && (
                <>
                  <IconAlertTriangle className="h-4 w-4 text-destructive ml-2" />
                  <span className="text-destructive font-medium">Overdue</span>
                </>
              )}
            </div>
          </div>
          {getStatusBadge(invoice.status)}
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handlePreview} variant="outline" size="sm">
            <IconEye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          
          {invoice.status !== InvoiceStatus.PAID && (
            <Button onClick={onAddPayment} size="sm">
              <IconCreditCard className="mr-2 h-4 w-4" />
              Add Payment
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconDotsVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onEdit}>
                <IconEdit className="mr-2 h-4 w-4" />
                Edit Invoice
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <IconCopy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSendInvoice}>
                <IconSend className="mr-2 h-4 w-4" />
                Send Invoice
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrint}>
                <IconPrinter className="mr-2 h-4 w-4" />
                Print
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadPDF}>
                <IconDownload className="mr-2 h-4 w-4" />
                Download PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Invoice Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconEye className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="font-medium text-lg">{invoice.customer.name}</div>
                {invoice.customer.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <IconMail className="h-4 w-4" />
                    {invoice.customer.email}
                  </div>
                )}
                {invoice.customer.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <IconPhone className="h-4 w-4" />
                    {invoice.customer.phone}
                  </div>
                )}
                {invoice.customer.address && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground mt-2">
                    <IconMapPin className="h-4 w-4 mt-0.5" />
                    <div className="whitespace-pre-line">{invoice.customer.address}</div>
                  </div>
                )}
                {invoice.customer.gstNumber && (
                  <div className="text-sm text-muted-foreground">
                    GST: {invoice.customer.gstNumber}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconFileText className="h-5 w-5" />
                Line Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right w-20">Qty</TableHead>
                      <TableHead className="text-right w-24">Unit Price</TableHead>
                      <TableHead className="text-right w-20">Discount</TableHead>
                      <TableHead className="text-right w-20">Tax</TableHead>
                      <TableHead className="text-right w-24">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.items.map((item, index) => (
                      <TableRow key={item.id || index}>
                        <TableCell className="font-medium">{item.description}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell className="text-right">
                          {item.discount > 0 ? `${item.discount}%` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.taxRate > 0 ? `${item.taxRate}%` : '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              <div className="mt-6 flex justify-end">
                <div className="w-full max-w-sm space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(invoice.totals.subtotal)}</span>
                  </div>
                  {invoice.totals.discountTotal > 0 && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Discount:</span>
                      <span>-{formatCurrency(invoice.totals.discountTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Tax:</span>
                    <span>{formatCurrency(invoice.totals.taxTotal)}</span>
                  </div>
                  {invoice.totals.shippingAmount && invoice.totals.shippingAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Shipping:</span>
                      <span>{formatCurrency(invoice.totals.shippingAmount)}</span>
                    </div>
                  )}
                  {invoice.totals.adjustmentAmount && invoice.totals.adjustmentAmount !== 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Adjustment:</span>
                      <span>{formatCurrency(invoice.totals.adjustmentAmount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Grand Total:</span>
                    <span>{formatCurrency(invoice.totals.grandTotal)}</span>
                  </div>
                  {paymentsTotal > 0 && (
                    <>
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Payments:</span>
                        <span>-{formatCurrency(paymentsTotal)}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Balance Due:</span>
                        <span className={cn(
                          invoice.balanceDue > 0 ? 'text-orange-600' : 'text-green-600'
                        )}>
                          {formatCurrency(invoice.balanceDue)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes and Terms */}
          {(invoice.notes || invoice.terms) && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {invoice.notes && (
                  <div>
                    <h4 className="font-medium text-sm">Notes</h4>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                      {invoice.notes}
                    </p>
                  </div>
                )}
                {invoice.terms && (
                  <div>
                    <h4 className="font-medium text-sm">Terms & Conditions</h4>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                      {invoice.terms}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <div>{getStatusBadge(invoice.status)}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due Date:</span>
                  <div className={cn(
                    "text-right",
                    overdue && "text-destructive font-medium"
                  )}>
                    {format(invoice.dueDate, 'PPP')}
                    <div className="text-xs">
                      {dueDateStatus.message}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-medium">{formatCurrency(invoice.totals.grandTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(paymentsTotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Balance:</span>
                  <span className={cn(
                    "font-medium",
                    invoice.balanceDue > 0 ? "text-orange-600" : "text-green-600"
                  )}>
                    {formatCurrency(invoice.balanceDue)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          {invoice.payments && invoice.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invoice.payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formatCurrency(payment.amount)}</span>
                          {getPaymentMethodBadge(payment.method)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(payment.receivedAt, 'PPP')}
                        </div>
                        {payment.reference && (
                          <div className="text-xs text-muted-foreground">
                            Ref: {payment.reference}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Hidden EV Invoice Template for PDF Generation */}
      <div ref={templateRef} className="hidden">
        <EVInvoiceTemplate invoice={invoice} />
      </div>

      {/* Preview Modal */}
      <InvoicePreviewModal
        invoice={invoice}
        open={showPreview}
        onClose={() => setShowPreview(false)}
      />
    </div>
  );
}
