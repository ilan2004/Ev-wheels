// Billing System Types for E-Wheels

export enum QuoteStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  EXPIRED = 'expired'
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  VOID = 'void'
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  UPI = 'upi',
  CHEQUE = 'cheque'
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number; // percentage (0-100)
  taxRate?: number; // percentage (0-100)
  subtotal: number; // calculated: quantity * unitPrice
  discountAmount: number; // calculated: subtotal * (discount/100)
  taxAmount: number; // calculated: (subtotal - discountAmount) * (taxRate/100)
  total: number; // calculated: subtotal - discountAmount + taxAmount
}

export interface CustomerInfo {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
}

export interface BillingTotals {
  subtotal: number; // sum of all line item subtotals
  discountTotal: number; // sum of all discount amounts
  taxTotal: number; // sum of all tax amounts
  shippingAmount?: number; // optional shipping/handling
  adjustmentAmount?: number; // final adjustments
  grandTotal: number; // final total amount
}

export interface Quote {
  id: string;
  number: string; // Q-YYYY-#### format
  status: QuoteStatus;
  
  // Customer information
  customer: CustomerInfo;
  
  // Financial details
  items: LineItem[];
  totals: BillingTotals;
  currency: string; // default 'USD'
  
  // Terms and conditions
  notes?: string;
  terms?: string;
  validUntil?: Date; // quote expiration
  
  // Metadata
  createdBy: string; // user ID
  createdAt: Date;
  updatedAt: Date;
  
  // Optional relationships
  convertedToInvoiceId?: string;
}

export interface Invoice {
  id: string;
  number: string; // INV-YYYY-#### format
  status: InvoiceStatus;
  
  // Customer information
  customer: CustomerInfo;
  
  // Financial details
  items: LineItem[];
  totals: BillingTotals;
  currency: string; // default 'USD'
  balanceDue: number; // remaining amount after payments
  
  // Payment terms
  dueDate: Date;
  notes?: string;
  terms?: string;
  
  // Metadata
  createdBy: string; // user ID
  createdAt: Date;
  updatedAt: Date;
  
  // Optional relationships
  sourceQuoteId?: string; // if converted from quote
  payments?: Payment[];
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string; // transaction ID, cheque number, etc.
  notes?: string;
  receivedAt: Date;
  createdBy: string; // user ID
  createdAt: Date;
}

// Form types for UI
export interface CreateQuoteInput {
  customer: CustomerInfo;
  items: Omit<LineItem, 'id' | 'subtotal' | 'discountAmount' | 'taxAmount' | 'total'>[];
  notes?: string;
  terms?: string;
  validUntil?: Date;
  shippingAmount?: number;
  adjustmentAmount?: number;
}

export interface CreateInvoiceInput {
  customer: CustomerInfo;
  items: Omit<LineItem, 'id' | 'subtotal' | 'discountAmount' | 'taxAmount' | 'total'>[];
  dueDate: Date;
  notes?: string;
  terms?: string;
  shippingAmount?: number;
  adjustmentAmount?: number;
  sourceQuoteId?: string;
}

export interface UpdateQuoteInput extends Partial<CreateQuoteInput> {
  status?: QuoteStatus;
}

export interface UpdateInvoiceInput extends Partial<CreateInvoiceInput> {
  status?: InvoiceStatus;
}

export interface CreatePaymentInput {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  receivedAt?: Date;
}

// Filter and search types
export interface QuoteFilters {
  status?: QuoteStatus[];
  customerName?: string;
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
}

export interface InvoiceFilters {
  status?: InvoiceStatus[];
  customerName?: string;
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
  overdue?: boolean;
}

// Configuration types
export interface BillingConfig {
  currency: string;
  currencySymbol: string;
  currencyLocale: string;
  taxRate: number; // default tax percentage
  quoteValidityDays: number; // default quote expiration days
  invoiceDueDays: number; // default invoice due days
  quoteNumberPrefix: string; // e.g., 'Q'
  invoiceNumberPrefix: string; // e.g., 'INV'
  resetNumberingYearly: boolean;
  companyInfo: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    taxId?: string;
  };
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface QuoteListResponse extends PaginatedResponse<Quote> {}
export interface InvoiceListResponse extends PaginatedResponse<Invoice> {}
