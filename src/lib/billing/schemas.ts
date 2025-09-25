import { z } from 'zod';
import { QuoteStatus, InvoiceStatus, PaymentMethod } from '@/types/billing';

// Base schemas
const customerInfoSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(255),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  gstNumber: z.string().optional()
});

const lineItemInputSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, 'Description is required').max(500),
  quantity: z.number().min(0.001, 'Quantity must be greater than 0').max(99999),
  unitPrice: z.number().min(0, 'Unit price cannot be negative').max(9999999),
  discount: z.number().min(0, 'Discount cannot be negative').max(100, 'Discount cannot exceed 100%').optional(),
  taxRate: z.number().min(0, 'Tax rate cannot be negative').max(100, 'Tax rate cannot exceed 100%').optional()
});

// Quote schemas
export const createQuoteSchema = z.object({
  customer: customerInfoSchema,
  items: z.array(lineItemInputSchema).min(1, 'At least one line item is required'),
  notes: z.string().optional(),
  terms: z.string().optional(),
  validUntil: z.date().optional(),
  shippingAmount: z.number().min(0, 'Shipping amount cannot be negative').optional(),
  adjustmentAmount: z.number().optional()
});

export const updateQuoteSchema = createQuoteSchema.partial().extend({
  status: z.nativeEnum(QuoteStatus).optional()
});

// Invoice schemas
export const createInvoiceSchema = z.object({
  customer: customerInfoSchema,
  items: z.array(lineItemInputSchema).min(1, 'At least one line item is required'),
  dueDate: z.date().refine(
    (date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day
      return date >= today;
    },
    { message: 'Due date cannot be in the past' }
  ),
  notes: z.string().optional(),
  terms: z.string().optional(),
  shippingAmount: z.number().min(0, 'Shipping amount cannot be negative').optional(),
  adjustmentAmount: z.number().optional(),
  sourceQuoteId: z.string().optional()
});

export const updateInvoiceSchema = createInvoiceSchema.partial().extend({
  status: z.nativeEnum(InvoiceStatus).optional(),
  dueDate: z.date().optional() // Allow past dates when updating
});

// Payment schemas
export const createPaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  amount: z.number().min(0.01, 'Payment amount must be greater than 0').max(9999999),
  method: z.nativeEnum(PaymentMethod),
  reference: z.string().optional(),
  notes: z.string().optional(),
  receivedAt: z.date().optional()
});

// Filter schemas for forms
export const quoteFiltersSchema = z.object({
  status: z.array(z.nativeEnum(QuoteStatus)).optional(),
  customerName: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  amountMin: z.number().min(0).optional(),
  amountMax: z.number().min(0).optional()
});

export const invoiceFiltersSchema = z.object({
  status: z.array(z.nativeEnum(InvoiceStatus)).optional(),
  customerName: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  amountMin: z.number().min(0).optional(),
  amountMax: z.number().min(0).optional(),
  overdue: z.boolean().optional()
});

// Form input types derived from schemas
export type CreateQuoteFormData = z.infer<typeof createQuoteSchema>;
export type UpdateQuoteFormData = z.infer<typeof updateQuoteSchema>;
export type CreateInvoiceFormData = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceFormData = z.infer<typeof updateInvoiceSchema>;
export type CreatePaymentFormData = z.infer<typeof createPaymentSchema>;
export type QuoteFiltersFormData = z.infer<typeof quoteFiltersSchema>;
export type InvoiceFiltersFormData = z.infer<typeof invoiceFiltersSchema>;
export type LineItemInputFormData = z.infer<typeof lineItemInputSchema>;
export type CustomerInfoFormData = z.infer<typeof customerInfoSchema>;

// Validation helpers
export function validateLineItems(items: unknown[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (items.length === 0) {
    errors.push('At least one line item is required');
    return { valid: false, errors };
  }
  
  for (let i = 0; i < items.length; i++) {
    try {
      lineItemInputSchema.parse(items[i]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          errors.push(`Line item ${i + 1}: ${err.message}`);
        });
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}

export function validateCustomerInfo(customer: unknown): { valid: boolean; errors: string[] } {
  try {
    customerInfoSchema.parse(customer);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        valid: false, 
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { valid: false, errors: ['Invalid customer information'] };
  }
}

// Form default values
export const defaultCustomerInfo: CustomerInfoFormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  gstNumber: ''
};

export const defaultLineItem: LineItemInputFormData = {
  description: '',
  quantity: 1,
  unitPrice: 0,
  discount: 0,
  taxRate: 18
};

export const getDefaultQuoteFormData = (): CreateQuoteFormData => ({
  customer: defaultCustomerInfo,
  items: [defaultLineItem],
  notes: '',
  terms: 'Payment due within 30 days of acceptance.',
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  shippingAmount: 0,
  adjustmentAmount: 0
});

export const getDefaultInvoiceFormData = (): CreateInvoiceFormData => ({
  customer: defaultCustomerInfo,
  items: [defaultLineItem],
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  notes: '',
  terms: 'Payment due within 30 days of invoice date.',
  shippingAmount: 0,
  adjustmentAmount: 0
});

// Conversion helpers
export function quoteToInvoiceFormData(quote: any): CreateInvoiceFormData {
  return {
    customer: quote.customer,
    items: quote.items.map((item: any) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      taxRate: item.taxRate
    })),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    notes: quote.notes,
    terms: quote.terms || 'Payment due within 30 days of invoice date.',
    shippingAmount: quote.totals.shippingAmount || 0,
    adjustmentAmount: quote.totals.adjustmentAmount || 0,
    sourceQuoteId: quote.id
  };
}
