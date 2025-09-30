'use client';

import { Invoice, InvoiceStatus } from '@/types/billing';
import {
  formatCurrency,
  formatDueDateStatus,
  isOverdue
} from '@/lib/billing/calculations';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface EVInvoiceTemplateProps {
  invoice: Invoice;
  companyInfo?: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    logo?: string;
    taxId?: string;
  };
}

export function EVInvoiceTemplate({
  invoice,
  companyInfo = {
    name: 'EV Solutions Ltd.',
    address: '123 Electric Avenue\nGreen Valley, CA 90210\nUnited States',
    phone: '+1 (555) 123-4567',
    email: 'billing@evsolutions.com',
    website: 'www.evsolutions.com',
    taxId: 'TAX123456789'
  }
}: EVInvoiceTemplateProps) {
  const overdue =
    isOverdue(invoice.dueDate) && invoice.status !== InvoiceStatus.PAID;
  const dueDateStatus = formatDueDateStatus(invoice.dueDate);
  const paymentsTotal =
    invoice.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;

  return (
    <div
      className='mx-auto max-w-4xl bg-white text-gray-900 print:shadow-none'
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* Modern Header with EV Theme */}
      <div className='relative overflow-hidden'>
        {/* Background Pattern */}
        <div className='absolute inset-0 bg-gradient-to-r from-green-50 to-blue-50 opacity-50'></div>
        <div className='absolute top-0 right-0 -mt-32 -mr-32 h-64 w-64 rounded-full bg-gradient-to-bl from-green-100 to-transparent opacity-30'></div>
        <div className='absolute bottom-0 left-0 -mb-24 -ml-24 h-48 w-48 rounded-full bg-gradient-to-tr from-blue-100 to-transparent opacity-30'></div>

        <div className='relative p-8 pb-6'>
          <div className='flex items-start justify-between'>
            <div className='space-y-4'>
              {/* Company Logo/Icon */}
              <div className='flex items-center space-x-3'>
                {companyInfo.logo ? (
                  <img
                    src={companyInfo.logo}
                    alt={companyInfo.name}
                    className='h-16 w-auto'
                  />
                ) : (
                  <div className='flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-blue-600'>
                    <svg
                      className='h-10 w-10 text-white'
                      fill='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path d='M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11C5.84 5 5.28 5.42 5.08 6.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.04 3H5.81l1.04-3zM19 16c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-14 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z' />
                      <circle cx='7' cy='15' r='1' />
                      <circle cx='17' cy='15' r='1' />
                    </svg>
                  </div>
                )}
                <div>
                  <h1 className='text-3xl font-bold text-gray-800'>
                    {companyInfo.name}
                  </h1>
                  <p className='text-sm font-medium text-green-600'>
                    Electric Vehicle Solutions
                  </p>
                </div>
              </div>

              {/* Company Details */}
              <div className='max-w-xs space-y-1 text-sm text-gray-600'>
                {companyInfo.address && (
                  <div className='whitespace-pre-line'>
                    {companyInfo.address}
                  </div>
                )}
                <div className='space-y-1 pt-2'>
                  {companyInfo.phone && <div>📞 {companyInfo.phone}</div>}
                  {companyInfo.email && <div>✉️ {companyInfo.email}</div>}
                  {companyInfo.website && <div>🌐 {companyInfo.website}</div>}
                  {companyInfo.taxId && (
                    <div>🏢 Tax ID: {companyInfo.taxId}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <div className='space-y-3 text-right'>
              <div className='rounded-lg border bg-white/80 p-4 shadow-sm backdrop-blur-sm'>
                <h2 className='mb-2 text-4xl font-bold text-gray-800'>
                  INVOICE
                </h2>
                <div className='text-xl font-semibold text-green-600'>
                  #{invoice.number}
                </div>

                <div className='mt-4 space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Date:</span>
                    <span className='font-medium'>
                      {format(invoice.createdAt, 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Due Date:</span>
                    <span
                      className={cn(
                        'font-medium',
                        overdue ? 'text-red-600' : 'text-gray-800'
                      )}
                    >
                      {format(invoice.dueDate, 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-gray-600'>Status:</span>
                    <div
                      className={cn(
                        'rounded px-2 py-1 text-xs font-medium',
                        invoice.status === InvoiceStatus.PAID &&
                          'bg-green-100 text-green-800',
                        invoice.status === InvoiceStatus.SENT &&
                          'bg-blue-100 text-blue-800',
                        invoice.status === InvoiceStatus.DRAFT &&
                          'bg-gray-100 text-gray-800',
                        invoice.status === InvoiceStatus.VOID &&
                          'bg-red-100 text-red-800'
                      )}
                    >
                      {invoice.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>

              {overdue && (
                <div className='rounded-lg border border-red-200 bg-red-50 p-3'>
                  <div className='text-sm font-medium text-red-600'>
                    ⚠️ {dueDateStatus.message}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className='h-1 bg-gradient-to-r from-green-500 via-blue-500 to-green-500'></div>

      <div className='space-y-8 p-8'>
        {/* Bill To Section */}
        <div className='grid gap-8 md:grid-cols-2'>
          <div>
            <h3 className='mb-4 border-b-2 border-green-200 pb-2 text-lg font-semibold text-gray-800'>
              🏢 Bill To:
            </h3>
            <div className='space-y-2 rounded-lg bg-gray-50 p-4'>
              <div className='text-lg font-semibold text-gray-800'>
                {invoice.customer.name}
              </div>
              {invoice.customer.phone && (
                <div className='text-sm text-gray-600'>
                  📞 {invoice.customer.phone}
                </div>
              )}
              {invoice.customer.address && (
                <div className='mt-3 text-sm whitespace-pre-line text-gray-600'>
                  📍 {invoice.customer.address}
                </div>
              )}
              {invoice.customer.gstNumber && (
                <div className='border-t border-gray-200 pt-2 text-sm text-gray-600'>
                  <span className='font-medium'>GST/Tax ID:</span>{' '}
                  {invoice.customer.gstNumber}
                </div>
              )}
            </div>
          </div>

          {/* Payment Summary */}
          <div>
            <h3 className='mb-4 border-b-2 border-blue-200 pb-2 text-lg font-semibold text-gray-800'>
              💰 Payment Summary
            </h3>
            <div className='space-y-3 rounded-lg bg-gradient-to-br from-green-50 to-blue-50 p-4'>
              <div className='flex items-center justify-between'>
                <span className='text-gray-600'>Total Amount:</span>
                <span className='text-xl font-bold text-gray-800'>
                  {formatCurrency(invoice.totals.grandTotal)}
                </span>
              </div>
              {paymentsTotal > 0 && (
                <div className='flex items-center justify-between text-green-600'>
                  <span>Paid:</span>
                  <span className='font-semibold'>
                    -{formatCurrency(paymentsTotal)}
                  </span>
                </div>
              )}
              <div className='flex items-center justify-between border-t border-gray-200 pt-2'>
                <span className='font-semibold'>Amount Due:</span>
                <span
                  className={cn(
                    'text-xl font-bold',
                    invoice.balanceDue > 0 ? 'text-red-600' : 'text-green-600'
                  )}
                >
                  {formatCurrency(invoice.balanceDue)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div>
          <h3 className='mb-4 border-b-2 border-green-200 pb-2 text-lg font-semibold text-gray-800'>
            🔋 Items & Services
          </h3>

          <div className='overflow-hidden rounded-lg border border-gray-200 bg-white'>
            <table className='w-full'>
              <thead>
                <tr className='bg-gradient-to-r from-green-500 to-blue-600 text-white'>
                  <th className='px-4 py-3 text-left font-semibold'>
                    Description
                  </th>
                  <th className='w-20 px-4 py-3 text-center font-semibold'>
                    Qty
                  </th>
                  <th className='w-28 px-4 py-3 text-right font-semibold'>
                    Unit Price
                  </th>
                  {invoice.items.some((item) => (item.discount ?? 0) > 0) && (
                    <th className='w-20 px-4 py-3 text-center font-semibold'>
                      Disc %
                    </th>
                  )}
                  <th className='w-20 px-4 py-3 text-center font-semibold'>
                    Tax %
                  </th>
                  <th className='w-28 px-4 py-3 text-right font-semibold'>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr
                    key={item.id || index}
                    className={cn(
                      'border-b border-gray-100',
                      index % 2 === 0 ? 'bg-gray-50/30' : 'bg-white'
                    )}
                  >
                    <td className='px-4 py-4'>
                      <div className='font-medium text-gray-800'>
                        {item.description}
                      </div>
                      {/* Add EV-specific details if available */}
                      <div className='mt-1 text-xs text-gray-500'>
                        {item.description.toLowerCase().includes('battery') &&
                          '🔋 '}
                        {item.description.toLowerCase().includes('charger') &&
                          '⚡ '}
                        {item.description.toLowerCase().includes('motor') &&
                          '⚙️ '}
                      </div>
                    </td>
                    <td className='px-4 py-4 text-center font-medium'>
                      {item.quantity}
                    </td>
                    <td className='px-4 py-4 text-right'>
                      {formatCurrency(item.unitPrice)}
                    </td>
                    {invoice.items.some((item) => (item.discount ?? 0) > 0) && (
                      <td className='px-4 py-4 text-center'>
                        {(item.discount ?? 0) > 0 ? `${item.discount}%` : '-'}
                      </td>
                    )}
                    <td className='px-4 py-4 text-center'>
                      {(item.taxRate ?? 0) > 0 ? `${item.taxRate}%` : '-'}
                    </td>
                    <td className='px-4 py-4 text-right font-semibold'>
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Section */}
        <div className='flex justify-end'>
          <div className='w-full max-w-md'>
            <div className='space-y-3 rounded-lg bg-gray-50 p-6'>
              <div className='flex justify-between text-sm'>
                <span className='text-gray-600'>Subtotal:</span>
                <span className='font-medium'>
                  {formatCurrency(invoice.totals.subtotal)}
                </span>
              </div>

              {invoice.totals.discountTotal > 0 && (
                <div className='flex justify-between text-sm text-green-600'>
                  <span>Total Discount:</span>
                  <span>-{formatCurrency(invoice.totals.discountTotal)}</span>
                </div>
              )}

              <div className='flex justify-between text-sm'>
                <span className='text-gray-600'>Tax:</span>
                <span className='font-medium'>
                  {formatCurrency(invoice.totals.taxTotal)}
                </span>
              </div>

              {invoice.totals.shippingAmount &&
                invoice.totals.shippingAmount > 0 && (
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-600'>Shipping:</span>
                    <span className='font-medium'>
                      {formatCurrency(invoice.totals.shippingAmount)}
                    </span>
                  </div>
                )}

              {invoice.totals.adjustmentAmount &&
                invoice.totals.adjustmentAmount !== 0 && (
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-600'>Adjustment:</span>
                    <span className='font-medium'>
                      {formatCurrency(invoice.totals.adjustmentAmount)}
                    </span>
                  </div>
                )}

              <div className='border-t-2 border-gray-300 pt-3'>
                <div className='flex justify-between text-lg font-bold'>
                  <span>Grand Total:</span>
                  <span>{formatCurrency(invoice.totals.grandTotal)}</span>
                </div>
              </div>

              {paymentsTotal > 0 && (
                <>
                  <div className='flex justify-between pt-2 text-sm text-green-600'>
                    <span>Payments Received:</span>
                    <span className='font-semibold'>
                      -{formatCurrency(paymentsTotal)}
                    </span>
                  </div>
                  <div className='border-t border-gray-300 pt-3'>
                    <div className='flex justify-between text-lg font-bold'>
                      <span>Balance Due:</span>
                      <span
                        className={cn(
                          invoice.balanceDue > 0
                            ? 'text-red-600'
                            : 'text-green-600'
                        )}
                      >
                        {formatCurrency(invoice.balanceDue)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Notes and Terms */}
        {(invoice.notes || invoice.terms) && (
          <div className='grid gap-6 border-t border-gray-200 pt-6 md:grid-cols-2'>
            {invoice.notes && (
              <div>
                <h4 className='mb-3 flex items-center font-semibold text-gray-800'>
                  📝 Notes:
                </h4>
                <div className='rounded-lg bg-blue-50 p-4 text-sm whitespace-pre-line text-gray-700'>
                  {invoice.notes}
                </div>
              </div>
            )}

            {invoice.terms && (
              <div>
                <h4 className='mb-3 flex items-center font-semibold text-gray-800'>
                  📋 Terms & Conditions:
                </h4>
                <div className='rounded-lg bg-green-50 p-4 text-sm whitespace-pre-line text-gray-700'>
                  {invoice.terms}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className='border-gradient-to-r border-t-2 from-green-500 to-blue-500 pt-8'>
          <div className='space-y-4 text-center'>
            <div className='rounded-lg bg-gradient-to-r from-green-500 to-blue-600 p-6 text-white'>
              <h3 className='mb-2 text-xl font-bold'>
                ⚡ Thank You for Choosing Electric!
              </h3>
              <p className='text-green-100'>
                Together, we&apos;re driving towards a sustainable future with
                clean energy solutions.
              </p>
            </div>

            <div className='space-y-2 text-sm text-gray-600'>
              {invoice.balanceDue > 0 && (
                <p className='font-semibold text-red-600'>
                  Payment is due by {format(invoice.dueDate, 'MMMM dd, yyyy')}
                </p>
              )}

              <div className='flex justify-center space-x-6 text-xs'>
                <span>🌱 Carbon Neutral Billing</span>
                <span>♻️ 100% Renewable Energy</span>
                <span>🔋 EV Certified Solutions</span>
              </div>

              <p className='pt-2 text-xs'>
                This invoice was generated electronically and is valid without
                signature.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
