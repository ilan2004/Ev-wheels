import { supabase } from '@/lib/supabase/client';
import {
  BillingRepository,
  InMemoryBillingRepository
} from '@/lib/billing/repository';
import { withLocationId } from '@/lib/location/scope';
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
  updateLineItemTotals,
  calculateBillingTotals,
  calculateBalanceDue
} from '@/lib/billing/calculations';
import { generateLineItemId } from '@/lib/billing/calculations';
import {
  generateQuoteNumber,
  generateInvoiceNumber,
  DEFAULT_QUOTE_CONFIG,
  DEFAULT_INVOICE_CONFIG
} from '@/lib/billing/numbering';

// Helper to map DB rows to typed Invoice with Dates (guards against invalid dates)
function mapInvoiceRow(row: any): Invoice {
  const parseDate = (value: any): Date | undefined => {
    if (!value) return undefined;
    const d = new Date(value);
    return isNaN(d.getTime()) ? undefined : d;
  };

  return {
    id: row.id,
    number: row.number,
    status: row.status as InvoiceStatus,
    customer: row.customer,
    items: row.items || [], // this will be replaced by joined items when needed
    totals: row.totals,
    currency: row.currency || 'USD',
    balanceDue: row.balance_due ?? row.balanceDue ?? 0,
    dueDate: parseDate(row.due_date ?? row.dueDate) as Date,
    notes: row.notes ?? undefined,
    terms: row.terms ?? undefined,
    createdBy: row.created_by ?? row.createdBy,
    createdAt: parseDate(row.created_at ?? row.createdAt) as Date,
    updatedAt: parseDate(row.updated_at ?? row.updatedAt) as Date,
    sourceQuoteId: row.source_quote_id ?? row.sourceQuoteId ?? undefined,
    payments: row.payments || []
  };
}

export class SupabaseBillingRepository implements BillingRepository {
  // Quotes
  async createQuote(
    input: CreateQuoteInput,
    createdBy: string
  ): Promise<Quote> {
    // Calculate items & totals
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

    const totals = calculateBillingTotals(
      processedItems,
      input.shippingAmount || 0,
      input.adjustmentAmount || 0
    );

    // Generate number from existing
    const { data: existing, error: exErr } = await supabase
      .from('quotes')
      .select('number');
    if (exErr) throw exErr;

    const number = generateQuoteNumber(
      DEFAULT_QUOTE_CONFIG,
      (existing || []).map((e) => e.number)
    );

    const now = new Date().toISOString();

    const quotePayload = withLocationId('quotes', {
      number,
      status: QuoteStatus.DRAFT,
      customer: input.customer,
      totals,
      currency: 'USD',
      notes: input.notes,
      terms: input.terms,
      valid_until: input.validUntil
        ? new Date(input.validUntil).toISOString()
        : null,
      created_by: createdBy,
      created_at: now,
      updated_at: now
    });

    const { data, error } = await supabase
      .from('quotes')
      .insert(quotePayload as any)
      .select('id')
      .single();
    if (error) throw error;

    const quoteId = data.id;

    const itemsPayload = processedItems.map((it) => ({
      quote_id: quoteId,
      line_id: it.id,
      description: it.description,
      quantity: it.quantity,
      unit_price: it.unitPrice,
      discount: it.discount || 0,
      tax_rate: it.taxRate || 0,
      subtotal: it.subtotal,
      discount_amount: it.discountAmount,
      tax_amount: it.taxAmount,
      total: it.total
    }));
    const { error: itemsErr } = await supabase
      .from('quote_items')
      .insert(itemsPayload);
    if (itemsErr) throw itemsErr;

    return {
      id: quoteId,
      number,
      status: QuoteStatus.DRAFT,
      customer: input.customer,
      items: processedItems,
      totals,
      currency: 'USD',
      notes: input.notes,
      terms: input.terms,
      validUntil: input.validUntil,
      createdBy,
      createdAt: new Date(now),
      updatedAt: new Date(now)
    };
  }

  async getQuote(id: string): Promise<Quote | null> {
    const { data: quote, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    const { data: items, error: itemsErr } = await supabase
      .from('quote_items')
      .select('*')
      .eq('quote_id', id)
      .order('id');
    if (itemsErr) throw itemsErr;

    return {
      id: quote.id,
      number: quote.number,
      status: quote.status as QuoteStatus,
      customer: quote.customer,
      items: (items || []).map((r: any) => ({
        id: r.line_id,
        description: r.description,
        quantity: r.quantity,
        unitPrice: r.unit_price,
        discount: r.discount,
        taxRate: r.tax_rate,
        subtotal: r.subtotal,
        discountAmount: r.discount_amount,
        taxAmount: r.tax_amount,
        total: r.total
      })),
      totals: quote.totals,
      currency: quote.currency,
      notes: quote.notes ?? undefined,
      terms: quote.terms ?? undefined,
      validUntil: quote.valid_until ? new Date(quote.valid_until) : undefined,
      createdBy: quote.created_by,
      createdAt: new Date(quote.created_at),
      updatedAt: new Date(quote.updated_at),
      convertedToInvoiceId: quote.converted_to_invoice_id ?? undefined
    };
  }

  async listQuotes(
    filters?: QuoteFilters,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<Quote>> {
    let query = supabase
      .from('quotes')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });
    const locId = (
      await import('@/lib/location/session')
    ).getActiveLocationId();
    if (locId) query = (query as any).eq('location_id', locId);

    if (filters?.status?.length) query = query.in('status', filters.status);
    if (filters?.customerName)
      query = query.ilike('customer->>name', `%${filters.customerName}%`);
    if (filters?.dateFrom)
      query = query.gte('created_at', filters.dateFrom.toISOString());
    if (filters?.dateTo)
      query = query.lte('created_at', filters.dateTo.toISOString());
    if (typeof filters?.amountMin === 'number')
      query = query.gte('totals->>grandTotal', String(filters.amountMin));
    if (typeof filters?.amountMax === 'number')
      query = query.lte('totals->>grandTotal', String(filters.amountMax));

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await query.range(from, to);
    if (error) throw error;

    const quotes: Quote[] = (data || []).map((q: any) => ({
      id: q.id,
      number: q.number,
      status: q.status as QuoteStatus,
      customer: q.customer,
      items: [],
      totals: q.totals,
      currency: q.currency,
      notes: q.notes ?? undefined,
      terms: q.terms ?? undefined,
      validUntil: q.valid_until ? new Date(q.valid_until) : undefined,
      createdBy: q.created_by,
      createdAt: new Date(q.created_at),
      updatedAt: new Date(q.updated_at)
    }));

    return {
      data: quotes,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  }

  async updateQuote(id: string, input: UpdateQuoteInput): Promise<Quote> {
    // fetch existing
    const existing = await this.getQuote(id);
    if (!existing) throw new Error(`Quote with id ${id} not found`);

    // Recalculate items if provided
    let items = existing.items;
    let totals = existing.totals;
    if (input.items) {
      items = input.items.map((it) =>
        updateLineItemTotals({
          id: (it as any).id || generateLineItemId(),
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          discount: it.discount || 0,
          taxRate: it.taxRate || 18
        })
      );
      totals = calculateBillingTotals(
        items,
        input.shippingAmount ?? existing.totals.shippingAmount ?? 0,
        input.adjustmentAmount ?? existing.totals.adjustmentAmount ?? 0
      );

      // Replace items
      await supabase.from('quote_items').delete().eq('quote_id', id);
      const itemsPayload = items.map((it) => ({
        quote_id: id,
        line_id: it.id,
        description: it.description,
        quantity: it.quantity,
        unit_price: it.unitPrice,
        discount: it.discount || 0,
        tax_rate: it.taxRate || 0,
        subtotal: it.subtotal,
        discount_amount: it.discountAmount,
        tax_amount: it.taxAmount,
        total: it.total
      }));
      const { error: itemsErr } = await supabase
        .from('quote_items')
        .insert(itemsPayload);
      if (itemsErr) throw itemsErr;
    }

    const { data, error } = await supabase
      .from('quotes')
      .update({
        customer: input.customer ?? existing.customer,
        totals,
        notes: input.notes ?? existing.notes ?? null,
        terms: input.terms ?? existing.terms ?? null,
        valid_until:
          (input.validUntil ?? existing.validUntil)?.toISOString?.() ?? null,
        status: input.status ?? existing.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;

    return (await this.getQuote(id))!;
  }

  async deleteQuote(id: string): Promise<void> {
    const { error: itemsErr } = await supabase
      .from('quote_items')
      .delete()
      .eq('quote_id', id);
    if (itemsErr) throw itemsErr;
    const { error } = await supabase.from('quotes').delete().eq('id', id);
    if (error) throw error;
  }

  // Invoices
  async createInvoice(
    input: CreateInvoiceInput,
    createdBy: string
  ): Promise<Invoice> {
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

    const totals = calculateBillingTotals(
      processedItems,
      input.shippingAmount || 0,
      input.adjustmentAmount || 0
    );

    // Generate number from existing numbers
    const { data: existing, error: exErr } = await supabase
      .from('invoices')
      .select('number');
    if (exErr) throw exErr;

    const number = generateInvoiceNumber(
      DEFAULT_INVOICE_CONFIG,
      (existing || []).map((e) => e.number)
    );

    const now = new Date().toISOString();

    const invoicePayload = withLocationId('invoices', {
      number,
      status: InvoiceStatus.DRAFT,
      customer: input.customer,
      totals,
      currency: 'INR',
      balance_due: totals.grandTotal,
      due_date: input.dueDate.toISOString(),
      notes: input.notes ?? null,
      terms: input.terms ?? null,
      created_by: createdBy,
      created_at: now,
      updated_at: now,
      source_quote_id: input.sourceQuoteId ?? null
    });

    const { data, error } = await supabase
      .from('invoices')
      .insert(invoicePayload as any)
      .select('id')
      .single();
    if (error) throw error;

    const invoiceId = data.id;

    const itemsPayload = processedItems.map((it) => ({
      invoice_id: invoiceId,
      line_id: it.id,
      description: it.description,
      quantity: it.quantity,
      unit_price: it.unitPrice,
      discount: it.discount || 0,
      tax_rate: it.taxRate || 0,
      subtotal: it.subtotal,
      discount_amount: it.discountAmount,
      tax_amount: it.taxAmount,
      total: it.total
    }));
    const { error: itemsErr } = await supabase
      .from('invoice_items')
      .insert(itemsPayload);
    if (itemsErr) throw itemsErr;

    return {
      id: invoiceId,
      number,
      status: InvoiceStatus.DRAFT,
      customer: input.customer,
      items: processedItems,
      totals,
      currency: 'INR',
      balanceDue: totals.grandTotal,
      dueDate: input.dueDate,
      notes: input.notes,
      terms: input.terms,
      createdBy,
      createdAt: new Date(now),
      updatedAt: new Date(now),
      sourceQuoteId: input.sourceQuoteId,
      payments: []
    };
  }

  async getInvoice(id: string): Promise<Invoice | null> {
    const { data: inv, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    const { data: items, error: itemsErr } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', id)
      .order('id');
    if (itemsErr) throw itemsErr;

    const { data: pay, error: payErr } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', id)
      .order('received_at', { ascending: false });
    if (payErr) throw payErr;

    const invoice: Invoice = mapInvoiceRow(inv);
    invoice.items = (items || []).map((r: any) => ({
      id: r.line_id,
      description: r.description,
      quantity: r.quantity,
      unitPrice: r.unit_price,
      discount: r.discount,
      taxRate: r.tax_rate,
      subtotal: r.subtotal,
      discountAmount: r.discount_amount,
      taxAmount: r.tax_amount,
      total: r.total
    }));
    invoice.payments = (pay || []).map((p: any) => ({
      id: p.id,
      invoiceId: p.invoice_id,
      amount: p.amount,
      method: p.method,
      reference: p.reference ?? undefined,
      notes: p.notes ?? undefined,
      receivedAt: new Date(p.received_at),
      createdBy: p.created_by,
      createdAt: new Date(p.created_at)
    }));
    return invoice;
  }

  async listInvoices(
    filters?: InvoiceFilters,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<Invoice>> {
    let query = supabase
      .from('invoices')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });
    const locId = (
      await import('@/lib/location/session')
    ).getActiveLocationId();
    if (locId) query = (query as any).eq('location_id', locId);

    if (filters?.status?.length) query = query.in('status', filters.status);
    if (filters?.customerName)
      query = query.ilike('customer->>name', `%${filters.customerName}%`);
    if (filters?.dateFrom)
      query = query.gte('created_at', filters.dateFrom.toISOString());
    if (filters?.dateTo)
      query = query.lte('created_at', filters.dateTo.toISOString());
    if (typeof filters?.amountMin === 'number')
      query = query.gte('totals->>grandTotal', String(filters.amountMin));
    if (typeof filters?.amountMax === 'number')
      query = query.lte('totals->>grandTotal', String(filters.amountMax));
    if (typeof filters?.overdue === 'boolean') {
      if (filters.overdue)
        query = query.lt('due_date', new Date().toISOString());
      else query = query.gte('due_date', new Date().toISOString());
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await query.range(from, to);
    if (error) throw error;

    const invoices: Invoice[] = (data || []).map(mapInvoiceRow);
    return {
      data: invoices,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  }

  async updateInvoice(id: string, input: UpdateInvoiceInput): Promise<Invoice> {
    const existing = await this.getInvoice(id);
    if (!existing) throw new Error(`Invoice with id ${id} not found`);

    let items = existing.items;
    let totals = existing.totals;
    let balanceDue = existing.balanceDue;
    if (input.items) {
      items = input.items.map((it) =>
        updateLineItemTotals({
          id: (it as any).id || generateLineItemId(),
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          discount: it.discount || 0,
          taxRate: it.taxRate || 18
        })
      );
      totals = calculateBillingTotals(
        items,
        input.shippingAmount ?? existing.totals.shippingAmount ?? 0,
        input.adjustmentAmount ?? existing.totals.adjustmentAmount ?? 0
      );
      const paymentsTotal = (existing.payments || []).reduce(
        (s, p) => s + p.amount,
        0
      );
      balanceDue = calculateBalanceDue(totals.grandTotal, paymentsTotal);

      await supabase.from('invoice_items').delete().eq('invoice_id', id);
      const itemsPayload = items.map((it) => ({
        invoice_id: id,
        line_id: it.id,
        description: it.description,
        quantity: it.quantity,
        unit_price: it.unitPrice,
        discount: it.discount || 0,
        tax_rate: it.taxRate || 0,
        subtotal: it.subtotal,
        discount_amount: it.discountAmount,
        tax_amount: it.taxAmount,
        total: it.total
      }));
      const { error: itemsErr } = await supabase
        .from('invoice_items')
        .insert(itemsPayload);
      if (itemsErr) throw itemsErr;
    }

    const { error } = await supabase
      .from('invoices')
      .update({
        customer: input.customer ?? existing.customer,
        totals,
        balance_due: balanceDue,
        notes: input.notes ?? existing.notes ?? null,
        terms: input.terms ?? existing.terms ?? null,
        status: input.status ?? existing.status,
        due_date: (input.dueDate ?? existing.dueDate).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    if (error) throw error;

    return (await this.getInvoice(id))!;
  }

  async deleteInvoice(id: string): Promise<void> {
    await supabase.from('payments').delete().eq('invoice_id', id);
    await supabase.from('invoice_items').delete().eq('invoice_id', id);
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) throw error;
  }

  // Payments
  async addPayment(
    input: CreatePaymentInput,
    createdBy: string
  ): Promise<Payment> {
    const now = new Date();
    const received = input.receivedAt ?? now;

    const paymentPayload = withLocationId('payments', {
      invoice_id: input.invoiceId,
      amount: input.amount,
      method: input.method,
      reference: input.reference ?? null,
      notes: input.notes ?? null,
      received_at: received.toISOString(),
      created_by: createdBy,
      created_at: now.toISOString()
    });

    const { data, error } = await supabase
      .from('payments')
      .insert(paymentPayload as any)
      .select('*')
      .single();
    if (error) throw error;

    // Update invoice balance/status
    const invoice = await this.getInvoice(input.invoiceId);
    if (!invoice) throw new Error('Invoice not found after payment');
    const payments = await this.getPaymentsByInvoiceId(input.invoiceId);
    const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
    const newBalance = calculateBalanceDue(
      invoice.totals.grandTotal,
      totalPaid
    );

    await this.updateInvoice(input.invoiceId, {
      status: newBalance === 0 ? InvoiceStatus.PAID : invoice.status
    });

    return {
      id: data.id,
      invoiceId: data.invoice_id,
      amount: data.amount,
      method: data.method,
      reference: data.reference ?? undefined,
      notes: data.notes ?? undefined,
      receivedAt: new Date(data.received_at),
      createdBy: data.created_by,
      createdAt: new Date(data.created_at)
    };
  }

  async getPaymentsByInvoiceId(invoiceId: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('received_at', { ascending: false });
    if (error) throw error;

    return (data || []).map((p: any) => ({
      id: p.id,
      invoiceId: p.invoice_id,
      amount: p.amount,
      method: p.method,
      reference: p.reference ?? undefined,
      notes: p.notes ?? undefined,
      receivedAt: new Date(p.received_at),
      createdBy: p.created_by,
      createdAt: new Date(p.created_at)
    }));
  }

  // Utilities
  async convertQuoteToInvoice(
    quoteId: string,
    dueDate: Date,
    createdBy: string
  ): Promise<Invoice> {
    const quote = await this.getQuote(quoteId);
    if (!quote) throw new Error('Quote not found');

    const invoice = await this.createInvoice(
      {
        customer: quote.customer,
        items: quote.items.map((it) => ({
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          discount: it.discount,
          taxRate: it.taxRate
        })),
        dueDate,
        notes: quote.notes,
        terms: quote.terms,
        shippingAmount: quote.totals.shippingAmount,
        adjustmentAmount: quote.totals.adjustmentAmount,
        sourceQuoteId: quoteId
      },
      createdBy
    );

    await this.updateQuote(quoteId, { status: QuoteStatus.SENT });
    return invoice;
  }

  async getAllQuoteNumbers(): Promise<string[]> {
    const { data, error } = await supabase.from('quotes').select('number');
    if (error) throw error;
    return (data || []).map((r: any) => r.number);
  }

  async getAllInvoiceNumbers(): Promise<string[]> {
    const { data, error } = await supabase.from('invoices').select('number');
    if (error) throw error;
    return (data || []).map((r: any) => r.number);
  }
}
