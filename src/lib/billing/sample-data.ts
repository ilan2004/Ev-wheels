import { Quote, Invoice, QuoteStatus, InvoiceStatus, PaymentMethod } from '@/types/billing';
import { billingRepository } from './repository';
import { addDays, subDays } from 'date-fns';

export const sampleQuotes: Quote[] = [
  {
    id: '1',
    number: 'Q-2024-0001',
    status: QuoteStatus.DRAFT,
    customer: {
      name: 'Tesla Service Center',
      email: 'service@tesla.com',
      phone: '+1-555-0123',
      address: '123 Innovation Drive\nPalo Alto, CA 94301',
      gstNumber: 'GST123456789'
    },
    items: [
      {
        id: 'item1',
        description: 'Battery Diagnostics and Testing',
        quantity: 1,
        unitPrice: 250.00,
        discount: 10,
        taxRate: 18,
        subtotal: 250.00,
        discountAmount: 25.00,
        taxAmount: 40.50,
        total: 265.50
      },
      {
        id: 'item2',
        description: 'Cell Replacement Service',
        quantity: 2,
        unitPrice: 450.00,
        discount: 5,
        taxRate: 18,
        subtotal: 900.00,
        discountAmount: 45.00,
        taxAmount: 153.90,
        total: 1008.90
      }
    ],
    totals: {
      subtotal: 1150.00,
      discountTotal: 70.00,
      taxTotal: 194.40,
      grandTotal: 1274.40
    },
    currency: 'USD',
    notes: 'Urgent repair needed for fleet vehicle',
    terms: 'Payment due within 30 days of acceptance.',
    validUntil: addDays(new Date(), 30),
    createdBy: 'admin-user-1',
    createdAt: subDays(new Date(), 2),
    updatedAt: subDays(new Date(), 1)
  },
  {
    id: '2',
    number: 'Q-2024-0002',
    status: QuoteStatus.SENT,
    customer: {
      name: 'Uber Technologies',
      email: 'fleet@uber.com',
      phone: '+1-555-0456',
      address: '1455 Market Street\nSan Francisco, CA 94103'
    },
    items: [
      {
        id: 'item3',
        description: 'Comprehensive Battery Health Check',
        quantity: 5,
        unitPrice: 200.00,
        discount: 15,
        taxRate: 18,
        subtotal: 1000.00,
        discountAmount: 150.00,
        taxAmount: 153.00,
        total: 1003.00
      }
    ],
    totals: {
      subtotal: 1000.00,
      discountTotal: 150.00,
      taxTotal: 153.00,
      grandTotal: 1003.00
    },
    currency: 'USD',
    notes: 'Fleet maintenance contract renewal',
    terms: 'Net 30 payment terms. Bulk discount applied.',
    validUntil: addDays(new Date(), 15),
    createdBy: 'admin-user-1',
    createdAt: subDays(new Date(), 5),
    updatedAt: subDays(new Date(), 3)
  },
  {
    id: '3',
    number: 'Q-2024-0003',
    status: QuoteStatus.EXPIRED,
    customer: {
      name: 'GreenCab Solutions',
      email: 'maintenance@greencab.com',
      phone: '+1-555-0789',
      address: '456 Eco Drive\nAustin, TX 78701'
    },
    items: [
      {
        id: 'item4',
        description: 'Emergency Battery Replacement',
        quantity: 1,
        unitPrice: 800.00,
        discount: 0,
        taxRate: 18,
        subtotal: 800.00,
        discountAmount: 0.00,
        taxAmount: 144.00,
        total: 944.00
      }
    ],
    totals: {
      subtotal: 800.00,
      discountTotal: 0.00,
      taxTotal: 144.00,
      grandTotal: 944.00
    },
    currency: 'USD',
    notes: 'Customer requested quote but never responded',
    terms: 'Payment due upon completion.',
    validUntil: subDays(new Date(), 5),
    createdBy: 'admin-user-1',
    createdAt: subDays(new Date(), 25),
    updatedAt: subDays(new Date(), 20)
  }
];

export const sampleInvoices: Invoice[] = [
  {
    id: '1',
    number: 'INV-2024-0001',
    status: InvoiceStatus.PAID,
    customer: {
      name: 'Lyft Inc.',
      email: 'billing@lyft.com',
      phone: '+1-555-0321',
      address: '185 Berry Street\nSan Francisco, CA 94107',
      gstNumber: 'GST987654321'
    },
    items: [
      {
        id: 'item5',
        description: 'Monthly Battery Maintenance Service',
        quantity: 10,
        unitPrice: 150.00,
        discount: 10,
        taxRate: 18,
        subtotal: 1500.00,
        discountAmount: 150.00,
        taxAmount: 243.00,
        total: 1593.00
      }
    ],
    totals: {
      subtotal: 1500.00,
      discountTotal: 150.00,
      taxTotal: 243.00,
      grandTotal: 1593.00
    },
    currency: 'USD',
    balanceDue: 0.00,
    dueDate: subDays(new Date(), 15),
    notes: 'Monthly service contract - December 2024',
    terms: 'Net 30. Thank you for your business!',
    createdBy: 'admin-user-1',
    createdAt: subDays(new Date(), 45),
    updatedAt: subDays(new Date(), 20),
    payments: [
      {
        id: 'pay1',
        invoiceId: '1',
        amount: 1593.00,
        method: PaymentMethod.BANK_TRANSFER,
        reference: 'TXN-ABC123456',
        notes: 'Payment via ACH transfer',
        receivedAt: subDays(new Date(), 20),
        createdBy: 'admin-user-1',
        createdAt: subDays(new Date(), 20)
      }
    ]
  },
  {
    id: '2',
    number: 'INV-2024-0002',
    status: InvoiceStatus.SENT,
    customer: {
      name: 'DoorDash Fleet Services',
      email: 'fleet@doordash.com',
      phone: '+1-555-0654',
      address: '303 2nd Street\nSan Francisco, CA 94107'
    },
    items: [
      {
        id: 'item6',
        description: 'Battery Replacement - Model S',
        quantity: 1,
        unitPrice: 1200.00,
        discount: 5,
        taxRate: 18,
        subtotal: 1200.00,
        discountAmount: 60.00,
        taxAmount: 205.20,
        total: 1345.20
      },
      {
        id: 'item7',
        description: 'Installation and Configuration',
        quantity: 1,
        unitPrice: 300.00,
        discount: 0,
        taxRate: 18,
        subtotal: 300.00,
        discountAmount: 0.00,
        taxAmount: 54.00,
        total: 354.00
      }
    ],
    totals: {
      subtotal: 1500.00,
      discountTotal: 60.00,
      taxTotal: 259.20,
      grandTotal: 1699.20
    },
    currency: 'USD',
    balanceDue: 1699.20,
    dueDate: addDays(new Date(), 15),
    notes: 'Replacement battery with 2-year warranty',
    terms: 'Net 30. Late fees apply after due date.',
    createdBy: 'admin-user-1',
    createdAt: subDays(new Date(), 10),
    updatedAt: subDays(new Date(), 5),
    payments: []
  },
  {
    id: '3',
    number: 'INV-2024-0003',
    status: InvoiceStatus.SENT,
    customer: {
      name: 'Amazon Delivery Services',
      email: 'logistics@amazon.com',
      phone: '+1-555-0987',
      address: '410 Terry Avenue North\nSeattle, WA 98109'
    },
    items: [
      {
        id: 'item8',
        description: 'Emergency Diagnostic Service',
        quantity: 1,
        unitPrice: 180.00,
        discount: 0,
        taxRate: 18,
        subtotal: 180.00,
        discountAmount: 0.00,
        taxAmount: 32.40,
        total: 212.40
      }
    ],
    totals: {
      subtotal: 180.00,
      discountTotal: 0.00,
      taxTotal: 32.40,
      shippingAmount: 25.00,
      grandTotal: 237.40
    },
    currency: 'USD',
    balanceDue: 237.40,
    dueDate: subDays(new Date(), 5), // Overdue
    notes: 'Emergency call-out service - Sunday premium rate',
    terms: 'Payment due immediately. Rush service charges apply.',
    createdBy: 'admin-user-1',
    createdAt: subDays(new Date(), 35),
    updatedAt: subDays(new Date(), 30),
    payments: []
  }
];

/**
 * Seed the repository with sample data for testing
 */
export function seedSampleData() {
  console.log('Seeding sample billing data...');
  (billingRepository as any).seed(sampleQuotes, sampleInvoices, []);
  console.log('Sample data seeded successfully!');
  console.log(`- ${sampleQuotes.length} quotes`);
  console.log(`- ${sampleInvoices.length} invoices`);
}

/**
 * Clear all data from the repository
 */
export function clearAllData() {
  console.log('Clearing all billing data...');
  (billingRepository as any).clear();
  console.log('All data cleared successfully!');
}

/**
 * Get current repository statistics
 */
export function getRepositoryStats() {
  return (billingRepository as any).getStats();
}
