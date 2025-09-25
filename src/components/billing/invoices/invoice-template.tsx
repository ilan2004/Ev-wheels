'use client';

import { Invoice, InvoiceStatus } from '@/types/billing';
import { formatCurrency, formatDueDateStatus, isOverdue } from '@/lib/billing/calculations';
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
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface InvoiceTemplateProps {
  invoice: Invoice;
  companyInfo?: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    logo?: string;
  };
}

function getStatusBadge(status: InvoiceStatus) {
  const variants = {
    [InvoiceStatus.DRAFT]: 'secondary',
    [InvoiceStatus.SENT]: 'default', 
    [InvoiceStatus.PAID]: 'secondary',
    [InvoiceStatus.VOID]: 'destructive'
  } as const;
  
  return (
    <Badge variant={variants[status] || 'secondary'} className="capitalize">
      {status}
    </Badge>
  );
}

export function InvoiceTemplate({ 
  invoice, 
  companyInfo = {
    name: 'Your Company Name',
    address: 'Your Company Address\nCity, State, ZIP',
    phone: '(555) 123-4567',
    email: 'billing@yourcompany.com',
    website: 'www.yourcompany.com'
  }
}: InvoiceTemplateProps) {
  const overdue = isOverdue(invoice.dueDate) && invoice.status !== InvoiceStatus.PAID;
  const dueDateStatus = formatDueDateStatus(invoice.dueDate);
  const paymentsTotal = invoice.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white text-black print:p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="space-y-2">
          {companyInfo.logo && (
            <img 
              src={companyInfo.logo} 
              alt={companyInfo.name} 
              className="h-16 w-auto mb-4"
            />
          )}
          <h1 className="text-2xl font-bold text-gray-800">{companyInfo.name}</h1>
          {companyInfo.address && (
            <div className="text-sm text-gray-600 whitespace-pre-line">
              {companyInfo.address}
            </div>
          )}
          <div className="text-sm text-gray-600 space-y-1">
            {companyInfo.phone && <div>Phone: {companyInfo.phone}</div>}
            {companyInfo.email && <div>Email: {companyInfo.email}</div>}
            {companyInfo.website && <div>Web: {companyInfo.website}</div>}
          </div>
        </div>

        <div className="text-right space-y-2">
          <h2 className="text-3xl font-bold text-gray-800">INVOICE</h2>
          <div className="text-lg font-semibold">#{invoice.number}</div>
          <div className="space-y-1 text-sm">
            <div><span className="font-medium">Date:</span> {format(invoice.createdAt, 'MMM dd, yyyy')}</div>
            <div><span className="font-medium">Due Date:</span> {format(invoice.dueDate, 'MMM dd, yyyy')}</div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              {getStatusBadge(invoice.status)}
            </div>
          </div>
        </div>
      </div>

      <Separator className="mb-8" />

      {/* Bill To */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Bill To:</h3>
          <div className="space-y-1">
            <div className="font-medium text-lg">{invoice.customer.name}</div>
            {invoice.customer.email && (
              <div className="text-sm text-gray-600">{invoice.customer.email}</div>
            )}
            {invoice.customer.phone && (
              <div className="text-sm text-gray-600">{invoice.customer.phone}</div>
            )}
            {invoice.customer.address && (
              <div className="text-sm text-gray-600 whitespace-pre-line mt-2">
                {invoice.customer.address}
              </div>
            )}
            {invoice.customer.gstNumber && (
              <div className="text-sm text-gray-600 mt-2">
                <span className="font-medium">GST:</span> {invoice.customer.gstNumber}
              </div>
            )}
          </div>
        </div>

        {/* Invoice Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Amount Due:</span>
              <span className={cn(
                "font-medium",
                invoice.balanceDue > 0 ? "text-red-600" : "text-green-600"
              )}>
                {formatCurrency(invoice.balanceDue)}
              </span>
            </div>
            {overdue && (
              <div className="flex justify-between text-red-600">
                <span>Status:</span>
                <span className="font-medium">{dueDateStatus.message}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Items</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-800">Description</TableHead>
                <TableHead className="text-right font-semibold text-gray-800 w-20">Qty</TableHead>
                <TableHead className="text-right font-semibold text-gray-800 w-24">Unit Price</TableHead>
                {invoice.items.some(item => (item.discount ?? 0) > 0) && (
                  <TableHead className="text-right font-semibold text-gray-800 w-20">Disc %</TableHead>
                )}
                <TableHead className="text-right font-semibold text-gray-800 w-20">Tax %</TableHead>
                <TableHead className="text-right font-semibold text-gray-800 w-24">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item, index) => (
                <TableRow key={item.id || index}>
                  <TableCell className="font-medium py-3">{item.description}</TableCell>
                  <TableCell className="text-right py-3">{item.quantity}</TableCell>
                  <TableCell className="text-right py-3">{formatCurrency(item.unitPrice)}</TableCell>
                  {invoice.items.some(item => (item.discount ?? 0) > 0) && (
                    <TableCell className="text-right py-3">
                      {(item.discount ?? 0) > 0 ? `${item.discount}%` : '-' }
                    </TableCell>
                  )}
                  <TableCell className="text-right py-3">
                    {(item.taxRate ?? 0) > 0 ? `${item.taxRate}%` : '-' }
                  </TableCell>
                  <TableCell className="text-right py-3 font-medium">
                    {formatCurrency(item.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-full max-w-sm space-y-2">
          <div className="flex justify-between py-2 border-b">
            <span className="font-medium">Subtotal:</span>
            <span>{formatCurrency(invoice.totals.subtotal)}</span>
          </div>
          {invoice.totals.discountTotal > 0 && (
            <div className="flex justify-between py-2 text-gray-600">
              <span>Discount:</span>
              <span>-{formatCurrency(invoice.totals.discountTotal)}</span>
            </div>
          )}
          <div className="flex justify-between py-2">
            <span className="font-medium">Tax:</span>
            <span>{formatCurrency(invoice.totals.taxTotal)}</span>
          </div>
          {invoice.totals.shippingAmount && invoice.totals.shippingAmount > 0 && (
            <div className="flex justify-between py-2">
              <span>Shipping:</span>
              <span>{formatCurrency(invoice.totals.shippingAmount)}</span>
            </div>
          )}
          {invoice.totals.adjustmentAmount && invoice.totals.adjustmentAmount !== 0 && (
            <div className="flex justify-between py-2">
              <span>Adjustment:</span>
              <span>{formatCurrency(invoice.totals.adjustmentAmount)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-t-2 border-gray-300 font-bold text-lg">
            <span>Total:</span>
            <span>{formatCurrency(invoice.totals.grandTotal)}</span>
          </div>
          {paymentsTotal > 0 && (
            <>
              <div className="flex justify-between py-2 text-green-600">
                <span>Payments Received:</span>
                <span>-{formatCurrency(paymentsTotal)}</span>
              </div>
              <div className="flex justify-between py-2 border-t font-bold text-lg">
                <span>Balance Due:</span>
                <span className={cn(
                  invoice.balanceDue > 0 ? 'text-red-600' : 'text-green-600'
                )}>
                  {formatCurrency(invoice.balanceDue)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Notes and Terms */}
      {(invoice.notes || invoice.terms) && (
        <div className="space-y-4 mb-8">
          <Separator />
          {invoice.notes && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Notes:</h4>
              <p className="text-sm text-gray-600 whitespace-pre-line">
                {invoice.notes}
              </p>
            </div>
          )}
          {invoice.terms && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Terms & Conditions:</h4>
              <p className="text-sm text-gray-600 whitespace-pre-line">
                {invoice.terms}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="border-t pt-4 text-center text-sm text-gray-500">
        <p>Thank you for your business!</p>
        {invoice.balanceDue > 0 && (
          <p className="mt-2 font-medium">
            Payment is due by {format(invoice.dueDate, 'MMMM dd, yyyy')}
          </p>
        )}
      </div>
    </div>
  );
}
