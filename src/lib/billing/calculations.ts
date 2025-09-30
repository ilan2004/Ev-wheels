import { LineItem, BillingTotals } from '@/types/billing';

/**
 * Default billing configuration
 */
export const DEFAULT_BILLING_CONFIG = {
  currency: 'INR',
  currencySymbol: '₹',
  currencyLocale: 'en-IN',
  taxRate: 18, // 18% default tax rate
  precision: 2 // decimal places for currency
};

/**
 * Round a number to specified decimal places
 */
export function roundToDecimalPlaces(
  value: number,
  places: number = 2
): number {
  return Math.round(value * Math.pow(10, places)) / Math.pow(10, places);
}

/**
 * Calculate line item totals with proper rounding
 */
export function calculateLineItemTotals(
  quantity: number,
  unitPrice: number,
  discount: number = 0,
  taxRate: number = DEFAULT_BILLING_CONFIG.taxRate
): Pick<LineItem, 'subtotal' | 'discountAmount' | 'taxAmount' | 'total'> {
  // Basic validation
  if (quantity < 0 || unitPrice < 0) {
    throw new Error('Quantity and unit price must be non-negative');
  }
  if (discount < 0 || discount > 100) {
    throw new Error('Discount must be between 0 and 100 percent');
  }
  if (taxRate < 0 || taxRate > 100) {
    throw new Error('Tax rate must be between 0 and 100 percent');
  }

  const subtotal = roundToDecimalPlaces(quantity * unitPrice);
  const discountAmount = roundToDecimalPlaces(subtotal * (discount / 100));
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = roundToDecimalPlaces(taxableAmount * (taxRate / 100));
  const total = roundToDecimalPlaces(taxableAmount + taxAmount);

  return {
    subtotal,
    discountAmount,
    taxAmount,
    total
  };
}

/**
 * Update a line item with calculated totals
 */
export function updateLineItemTotals(
  item: Omit<LineItem, 'subtotal' | 'discountAmount' | 'taxAmount' | 'total'>
): LineItem {
  const totals = calculateLineItemTotals(
    item.quantity,
    item.unitPrice,
    item.discount,
    item.taxRate
  );

  return {
    ...item,
    ...totals
  };
}

/**
 * Calculate billing totals from line items
 */
export function calculateBillingTotals(
  items: LineItem[],
  shippingAmount: number = 0,
  adjustmentAmount: number = 0
): BillingTotals {
  const subtotal = roundToDecimalPlaces(
    items.reduce((sum, item) => sum + item.subtotal, 0)
  );

  const discountTotal = roundToDecimalPlaces(
    items.reduce((sum, item) => sum + item.discountAmount, 0)
  );

  const taxTotal = roundToDecimalPlaces(
    items.reduce((sum, item) => sum + item.taxAmount, 0)
  );

  const grandTotal = roundToDecimalPlaces(
    subtotal - discountTotal + taxTotal + shippingAmount + adjustmentAmount
  );

  return {
    subtotal,
    discountTotal,
    taxTotal,
    shippingAmount: shippingAmount > 0 ? shippingAmount : undefined,
    adjustmentAmount: adjustmentAmount !== 0 ? adjustmentAmount : undefined,
    grandTotal
  };
}

/**
 * Format currency amount
 */
export function formatCurrency(
  amount: number,
  currency: string = DEFAULT_BILLING_CONFIG.currency,
  locale: string = DEFAULT_BILLING_CONFIG.currencyLocale
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Parse currency string to number
 */
export function parseCurrency(currencyString: string): number {
  // Remove currency symbols and formatting, then parse
  const cleanString = currencyString
    .replace(/[^\d.-]/g, '') // Keep only digits, dots, and minus signs
    .trim();

  const parsed = parseFloat(cleanString);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return roundToDecimalPlaces((value / total) * 100);
}

/**
 * Apply discount to amount
 */
export function applyDiscount(amount: number, discountPercent: number): number {
  if (discountPercent < 0 || discountPercent > 100) {
    throw new Error('Discount percentage must be between 0 and 100');
  }
  return roundToDecimalPlaces(amount * (1 - discountPercent / 100));
}

/**
 * Calculate tax amount
 */
export function calculateTax(amount: number, taxRate: number): number {
  if (taxRate < 0) {
    throw new Error('Tax rate must be non-negative');
  }
  return roundToDecimalPlaces(amount * (taxRate / 100));
}

/**
 * Check if two currency amounts are equal (handles floating point precision issues)
 */
export function currencyEquals(
  amount1: number,
  amount2: number,
  precision: number = 2
): boolean {
  const factor = Math.pow(10, precision);
  return Math.round(amount1 * factor) === Math.round(amount2 * factor);
}

/**
 * Validate line item input data
 */
export function validateLineItem(
  description: string,
  quantity: number,
  unitPrice: number,
  discount?: number,
  taxRate?: number
): string[] {
  const errors: string[] = [];

  if (!description || description.trim().length === 0) {
    errors.push('Description is required');
  }

  if (quantity <= 0) {
    errors.push('Quantity must be greater than 0');
  }

  if (unitPrice < 0) {
    errors.push('Unit price cannot be negative');
  }

  if (discount !== undefined && (discount < 0 || discount > 100)) {
    errors.push('Discount must be between 0 and 100 percent');
  }

  if (taxRate !== undefined && (taxRate < 0 || taxRate > 100)) {
    errors.push('Tax rate must be between 0 and 100 percent');
  }

  return errors;
}

/**
 * Generate a unique line item ID
 */
export function generateLineItemId(): string {
  return `line-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a new empty line item with default values
 */
export function createEmptyLineItem(
  taxRate: number = DEFAULT_BILLING_CONFIG.taxRate
): LineItem {
  return {
    id: generateLineItemId(),
    description: '',
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    taxRate,
    subtotal: 0,
    discountAmount: 0,
    taxAmount: 0,
    total: 0
  };
}

/**
 * Calculate invoice balance due after payments
 */
export function calculateBalanceDue(
  invoiceTotal: number,
  paymentsTotal: number
): number {
  const balance = invoiceTotal - paymentsTotal;
  return roundToDecimalPlaces(Math.max(0, balance)); // Ensure non-negative
}

/**
 * Check if invoice is overdue
 */
export function isOverdue(
  dueDate: Date,
  currentDate: Date = new Date()
): boolean {
  return dueDate < currentDate;
}

/**
 * Calculate days until/past due date
 */
export function getDaysDifference(
  dueDate: Date,
  currentDate: Date = new Date()
): number {
  const timeDiff = dueDate.getTime() - currentDate.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

/**
 * Format due date status
 */
export function formatDueDateStatus(
  dueDate: Date,
  currentDate: Date = new Date()
): {
  status: 'overdue' | 'due-soon' | 'due-later';
  message: string;
  days: number;
} {
  const days = getDaysDifference(dueDate, currentDate);

  if (days < 0) {
    return {
      status: 'overdue',
      message: `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`,
      days: Math.abs(days)
    };
  } else if (days <= 7) {
    return {
      status: 'due-soon',
      message:
        days === 0 ? 'Due today' : `Due in ${days} day${days === 1 ? '' : 's'}`,
      days
    };
  } else {
    return {
      status: 'due-later',
      message: `Due in ${days} day${days === 1 ? '' : 's'}`,
      days
    };
  }
}
