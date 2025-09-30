import {
  Quote,
  Invoice,
  Payment,
  CreateQuoteInput,
  CreateInvoiceInput,
  UpdateQuoteInput,
  UpdateInvoiceInput,
  CreatePaymentInput,
  QuoteStatus,
  InvoiceStatus,
  QuoteFilters,
  InvoiceFilters,
  PaginatedResponse
} from '@/types/billing';
import {
  generateQuoteNumber,
  generateInvoiceNumber,
  DEFAULT_QUOTE_CONFIG,
  DEFAULT_INVOICE_CONFIG
} from './numbering';
import {
  updateLineItemTotals,
  calculateBillingTotals,
  calculateBalanceDue
} from './calculations';
import { generateLineItemId } from './calculations';

/**
 * Abstract repository interface for quotes and invoices
 * This interface can be implemented with different storage backends
 */
export interface BillingRepository {
  // Quotes
  createQuote(input: CreateQuoteInput, createdBy: string): Promise<Quote>;
  getQuote(id: string): Promise<Quote | null>;
  listQuotes(
    filters?: QuoteFilters,
    page?: number,
    pageSize?: number
  ): Promise<PaginatedResponse<Quote>>;
  updateQuote(id: string, input: UpdateQuoteInput): Promise<Quote>;
  deleteQuote(id: string): Promise<void>;

  // Invoices
  createInvoice(input: CreateInvoiceInput, createdBy: string): Promise<Invoice>;
  getInvoice(id: string): Promise<Invoice | null>;
  listInvoices(
    filters?: InvoiceFilters,
    page?: number,
    pageSize?: number
  ): Promise<PaginatedResponse<Invoice>>;
  updateInvoice(id: string, input: UpdateInvoiceInput): Promise<Invoice>;
  deleteInvoice(id: string): Promise<void>;

  // Payments
  addPayment(input: CreatePaymentInput, createdBy: string): Promise<Payment>;
  getPaymentsByInvoiceId(invoiceId: string): Promise<Payment[]>;

  // Utilities
  convertQuoteToInvoice(
    quoteId: string,
    dueDate: Date,
    createdBy: string
  ): Promise<Invoice>;
  getAllQuoteNumbers(): Promise<string[]>;
  getAllInvoiceNumbers(): Promise<string[]>;
}

/**
 * In-memory implementation for MVP/development
 * In production, this would be replaced with Supabase or other database implementation
 */
export class InMemoryBillingRepository implements BillingRepository {
  private quotes: Map<string, Quote> = new Map();
  private invoices: Map<string, Invoice> = new Map();
  private payments: Map<string, Payment> = new Map();

  // Helper function to generate unique IDs
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  // Helper function to apply filters
  private filterQuotes(quotes: Quote[], filters?: QuoteFilters): Quote[] {
    if (!filters) return quotes;

    return quotes.filter((quote) => {
      if (filters.status && !filters.status.includes(quote.status))
        return false;
      if (
        filters.customerName &&
        !quote.customer.name
          .toLowerCase()
          .includes(filters.customerName.toLowerCase())
      )
        return false;
      if (filters.dateFrom && quote.createdAt < filters.dateFrom) return false;
      if (filters.dateTo && quote.createdAt > filters.dateTo) return false;
      if (filters.amountMin && quote.totals.grandTotal < filters.amountMin)
        return false;
      if (filters.amountMax && quote.totals.grandTotal > filters.amountMax)
        return false;
      return true;
    });
  }

  private filterInvoices(
    invoices: Invoice[],
    filters?: InvoiceFilters
  ): Invoice[] {
    if (!filters) return invoices;

    return invoices.filter((invoice) => {
      if (filters.status && !filters.status.includes(invoice.status))
        return false;
      if (
        filters.customerName &&
        !invoice.customer.name
          .toLowerCase()
          .includes(filters.customerName.toLowerCase())
      )
        return false;
      if (filters.dateFrom && invoice.createdAt < filters.dateFrom)
        return false;
      if (filters.dateTo && invoice.createdAt > filters.dateTo) return false;
      if (filters.amountMin && invoice.totals.grandTotal < filters.amountMin)
        return false;
      if (filters.amountMax && invoice.totals.grandTotal > filters.amountMax)
        return false;
      if (filters.overdue !== undefined) {
        const isOverdue = invoice.dueDate < new Date();
        if (filters.overdue !== isOverdue) return false;
      }
      return true;
    });
  }

  // Helper function for pagination
  private paginate<T>(
    items: T[],
    page: number = 1,
    pageSize: number = 10
  ): PaginatedResponse<T> {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const data = items.slice(startIndex, endIndex);

    return {
      data,
      total: items.length,
      page,
      pageSize,
      totalPages: Math.ceil(items.length / pageSize)
    };
  }

  // Quote operations
  async createQuote(
    input: CreateQuoteInput,
    createdBy: string
  ): Promise<Quote> {
    const id = this.generateId();
    const now = new Date();

    // Process line items with calculations
    const processedItems = input.items.map((item) =>
      updateLineItemTotals({
        id: generateLineItemId(),
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        taxRate: item.taxRate || 18
      })
    );

    // Calculate totals
    const totals = calculateBillingTotals(
      processedItems,
      input.shippingAmount || 0,
      input.adjustmentAmount || 0
    );

    // Generate quote number
    const existingNumbers = await this.getAllQuoteNumbers();
    const number = generateQuoteNumber(DEFAULT_QUOTE_CONFIG, existingNumbers);

    const quote: Quote = {
      id,
      number,
      status: QuoteStatus.DRAFT,
      customer: { ...input.customer },
      items: processedItems,
      totals,
      currency: 'USD',
      notes: input.notes,
      terms: input.terms,
      validUntil: input.validUntil,
      createdBy,
      createdAt: now,
      updatedAt: now
    };

    this.quotes.set(id, quote);
    return quote;
  }

  async getQuote(id: string): Promise<Quote | null> {
    return this.quotes.get(id) || null;
  }

  async listQuotes(
    filters?: QuoteFilters,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<Quote>> {
    const allQuotes = Array.from(this.quotes.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
    const filtered = this.filterQuotes(allQuotes, filters);
    return this.paginate(filtered, page, pageSize);
  }

  async updateQuote(id: string, input: UpdateQuoteInput): Promise<Quote> {
    const existing = this.quotes.get(id);
    if (!existing) {
      throw new Error(`Quote with id ${id} not found`);
    }

    const now = new Date();
    let updatedItems = existing.items;
    let updatedTotals = existing.totals;

    // Recalculate if items changed
    if (input.items) {
      updatedItems = input.items.map((item) =>
        updateLineItemTotals({
          id: (item as any).id || generateLineItemId(),
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          taxRate: item.taxRate || 18
        })
      );

      updatedTotals = calculateBillingTotals(
        updatedItems,
        input.shippingAmount !== undefined
          ? input.shippingAmount
          : existing.totals.shippingAmount || 0,
        input.adjustmentAmount !== undefined
          ? input.adjustmentAmount
          : existing.totals.adjustmentAmount || 0
      );
    }

    const updated: Quote = {
      ...existing,
      ...input,
      items: updatedItems,
      totals: updatedTotals,
      customer: input.customer ? { ...input.customer } : existing.customer,
      updatedAt: now
    };

    this.quotes.set(id, updated);
    return updated;
  }

  async deleteQuote(id: string): Promise<void> {
    if (!this.quotes.has(id)) {
      throw new Error(`Quote with id ${id} not found`);
    }
    this.quotes.delete(id);
  }

  // Invoice operations
  async createInvoice(
    input: CreateInvoiceInput,
    createdBy: string
  ): Promise<Invoice> {
    const id = this.generateId();
    const now = new Date();

    // Process line items with calculations
    const processedItems = input.items.map((item) =>
      updateLineItemTotals({
        id: generateLineItemId(),
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        taxRate: item.taxRate || 18
      })
    );

    // Calculate totals
    const totals = calculateBillingTotals(
      processedItems,
      input.shippingAmount || 0,
      input.adjustmentAmount || 0
    );

    // Generate invoice number
    const existingNumbers = await this.getAllInvoiceNumbers();
    const number = generateInvoiceNumber(
      DEFAULT_INVOICE_CONFIG,
      existingNumbers
    );

    const invoice: Invoice = {
      id,
      number,
      status: InvoiceStatus.DRAFT,
      customer: { ...input.customer },
      items: processedItems,
      totals,
      currency: 'INR',
      balanceDue: totals.grandTotal,
      dueDate: input.dueDate,
      notes: input.notes,
      terms: input.terms,
      createdBy,
      createdAt: now,
      updatedAt: now,
      sourceQuoteId: input.sourceQuoteId,
      payments: []
    };

    this.invoices.set(id, invoice);
    return invoice;
  }

  async getInvoice(id: string): Promise<Invoice | null> {
    const invoice = this.invoices.get(id);
    if (!invoice) return null;

    // Load payments
    const payments = await this.getPaymentsByInvoiceId(id);
    return { ...invoice, payments };
  }

  async listInvoices(
    filters?: InvoiceFilters,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<Invoice>> {
    const allInvoices = Array.from(this.invoices.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
    const filtered = this.filterInvoices(allInvoices, filters);
    return this.paginate(filtered, page, pageSize);
  }

  async updateInvoice(id: string, input: UpdateInvoiceInput): Promise<Invoice> {
    const existing = this.invoices.get(id);
    if (!existing) {
      throw new Error(`Invoice with id ${id} not found`);
    }

    const now = new Date();
    let updatedItems = existing.items;
    let updatedTotals = existing.totals;
    let updatedBalanceDue = existing.balanceDue;

    // Recalculate if items changed
    if (input.items) {
      updatedItems = input.items.map((item) =>
        updateLineItemTotals({
          id: (item as any).id || generateLineItemId(),
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          taxRate: item.taxRate || 18
        })
      );

      updatedTotals = calculateBillingTotals(
        updatedItems,
        input.shippingAmount !== undefined
          ? input.shippingAmount
          : existing.totals.shippingAmount || 0,
        input.adjustmentAmount !== undefined
          ? input.adjustmentAmount
          : existing.totals.adjustmentAmount || 0
      );

      // Recalculate balance due
      const payments = await this.getPaymentsByInvoiceId(id);
      const paymentsTotal = payments.reduce(
        (sum, payment) => sum + payment.amount,
        0
      );
      updatedBalanceDue = calculateBalanceDue(
        updatedTotals.grandTotal,
        paymentsTotal
      );
    }

    const updated: Invoice = {
      ...existing,
      ...input,
      items: updatedItems,
      totals: updatedTotals,
      balanceDue: updatedBalanceDue,
      customer: input.customer ? { ...input.customer } : existing.customer,
      updatedAt: now
    };

    this.invoices.set(id, updated);
    return updated;
  }

  async deleteInvoice(id: string): Promise<void> {
    if (!this.invoices.has(id)) {
      throw new Error(`Invoice with id ${id} not found`);
    }

    // Delete associated payments
    const paymentsToDelete = Array.from(this.payments.values()).filter(
      (p) => p.invoiceId === id
    );
    paymentsToDelete.forEach((payment) => this.payments.delete(payment.id));

    this.invoices.delete(id);
  }

  // Payment operations
  async addPayment(
    input: CreatePaymentInput,
    createdBy: string
  ): Promise<Payment> {
    const invoice = await this.getInvoice(input.invoiceId);
    if (!invoice) {
      throw new Error(`Invoice with id ${input.invoiceId} not found`);
    }

    const id = this.generateId();
    const now = new Date();

    const payment: Payment = {
      id,
      invoiceId: input.invoiceId,
      amount: input.amount,
      method: input.method,
      reference: input.reference,
      notes: input.notes,
      receivedAt: input.receivedAt || now,
      createdBy,
      createdAt: now
    };

    this.payments.set(id, payment);

    // Update invoice balance
    const existingPayments = await this.getPaymentsByInvoiceId(input.invoiceId);
    const totalPayments =
      existingPayments.reduce((sum, p) => sum + p.amount, 0) + input.amount;
    const newBalance = calculateBalanceDue(
      invoice.totals.grandTotal,
      totalPayments
    );

    // Update invoice status if fully paid
    let newStatus = invoice.status;
    if (newBalance === 0) {
      newStatus = InvoiceStatus.PAID;
    } else if (totalPayments > 0 && newBalance > 0) {
      // Could add PARTIAL status here if desired
    }

    await this.updateInvoice(input.invoiceId, {
      status: newStatus
    });

    return payment;
  }

  async getPaymentsByInvoiceId(invoiceId: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      (payment) => payment.invoiceId === invoiceId
    );
  }

  // Utility operations
  async convertQuoteToInvoice(
    quoteId: string,
    dueDate: Date,
    createdBy: string
  ): Promise<Invoice> {
    const quote = await this.getQuote(quoteId);
    if (!quote) {
      throw new Error(`Quote with id ${quoteId} not found`);
    }

    const invoiceInput: CreateInvoiceInput = {
      customer: quote.customer,
      items: quote.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        taxRate: item.taxRate
      })),
      dueDate,
      notes: quote.notes,
      terms: quote.terms,
      shippingAmount: quote.totals.shippingAmount,
      adjustmentAmount: quote.totals.adjustmentAmount,
      sourceQuoteId: quoteId
    };

    const invoice = await this.createInvoice(invoiceInput, createdBy);

    // Update quote to mark as converted
    await this.updateQuote(quoteId, {
      convertedToInvoiceId: invoice.id
    } as any);

    return invoice;
  }

  async getAllQuoteNumbers(): Promise<string[]> {
    return Array.from(this.quotes.values()).map((quote) => quote.number);
  }

  async getAllInvoiceNumbers(): Promise<string[]> {
    return Array.from(this.invoices.values()).map((invoice) => invoice.number);
  }

  // Development/testing utilities
  seed(
    quotes: Quote[] = [],
    invoices: Invoice[] = [],
    payments: Payment[] = []
  ): void {
    this.quotes.clear();
    this.invoices.clear();
    this.payments.clear();

    quotes.forEach((quote) => this.quotes.set(quote.id, quote));
    invoices.forEach((invoice) => this.invoices.set(invoice.id, invoice));
    payments.forEach((payment) => this.payments.set(payment.id, payment));
  }

  clear(): void {
    this.quotes.clear();
    this.invoices.clear();
    this.payments.clear();
  }

  getStats() {
    return {
      quotes: this.quotes.size,
      invoices: this.invoices.size,
      payments: this.payments.size
    };
  }
}

// Global instance for the application
// Switch to Supabase-backed repository if env is present
let instance: BillingRepository | null = null;

function createBillingRepository(): BillingRepository {
  const hasSupabase = Boolean(
    typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      : process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log('Creating billing repository. Has Supabase config:', hasSupabase);

  if (hasSupabase) {
    try {
      // Import Supabase repository synchronously
      const { SupabaseBillingRepository } = require('./repository.supabase');
      console.log('✅ Using Supabase billing repository');
      return new SupabaseBillingRepository();
    } catch (e) {
      console.warn(
        '⚠️  Failed to initialize Supabase repository, falling back to in-memory. Error:',
        e
      );
      return new InMemoryBillingRepository();
    }
  } else {
    console.log(
      'ℹ️  Using in-memory billing repository (no Supabase config found)'
    );
    return new InMemoryBillingRepository();
  }
}

// Lazy initialization function that ensures we get the right repository
function getBillingRepositoryInstance(): BillingRepository {
  if (!instance) {
    instance = createBillingRepository();
  }
  return instance;
}

// Export the repository instance
export const billingRepository = getBillingRepositoryInstance();
export const getBillingRepository = () => getBillingRepositoryInstance();
