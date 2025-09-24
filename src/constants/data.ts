import { NavItem } from '@/types';
import { Permission } from '@/lib/auth/roles';

export type Product = {
  photo_url: string;
  name: string;
  description: string;
  created_at: string;
  price: number;
  id: number;
  category: string;
  updated_at: string;
};

// E-Wheels specific navigation items with permission-based access
export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: [],
    permissions: [Permission.VIEW_BATTERIES, Permission.VIEW_CUSTOMERS]
  },
  {
    title: 'Batteries',
    url: '/dashboard/batteries',
    icon: 'battery',
    shortcut: ['b', 'b'],
    isActive: false,
    items: [
      {
        title: 'All Batteries',
        url: '/dashboard/batteries',
        icon: 'list',
        permissions: [Permission.VIEW_BATTERIES]
      },
      {
        title: 'Add Battery',
        url: '/dashboard/batteries/new',
        icon: 'plus',
        permissions: [Permission.CREATE_BATTERY_RECORD]
      },
      {
        title: 'Battery Status',
        url: '/dashboard/batteries/status',
        icon: 'activity',
        permissions: [Permission.UPDATE_BATTERY_STATUS]
      }
    ],
    permissions: [Permission.VIEW_BATTERIES]
  },
  {
    title: 'Customers',
    url: '/dashboard/customers',
    icon: 'users',
    shortcut: ['c', 'c'],
    isActive: false,
    items: [
      {
        title: 'All Customers',
        url: '/dashboard/customers',
        icon: 'list',
        permissions: [Permission.VIEW_CUSTOMERS]
      },
      {
        title: 'Add Customer',
        url: '/dashboard/customers/new',
        icon: 'userPlus',
        permissions: [Permission.CREATE_CUSTOMER]
      }
    ],
    permissions: [Permission.VIEW_CUSTOMERS]
  },
  {
    title: 'Inventory',
    url: '/dashboard/inventory',
    icon: 'package',
    shortcut: ['i', 'i'],
    isActive: false,
    items: [
      {
        title: 'Stock Overview',
        url: '/dashboard/inventory',
        icon: 'list',
        permissions: [Permission.VIEW_INVENTORY]
      },
      {
        title: 'Add Item',
        url: '/dashboard/inventory/new',
        icon: 'plus',
        permissions: [Permission.CREATE_INVENTORY_ITEM]
      },
      {
        title: 'Stock Alerts',
        url: '/dashboard/inventory/alerts',
        icon: 'alertTriangle',
        permissions: [Permission.VIEW_INVENTORY]
      }
    ],
    permissions: [Permission.VIEW_INVENTORY]
  },
  {
    title: 'Invoices & Quotes',
    url: '/dashboard/invoices',
    icon: 'fileText',
    shortcut: ['q', 'q'],
    isActive: false,
    items: [
      {
        title: 'All Invoices',
        url: '/dashboard/invoices',
        icon: 'list',
        permissions: [Permission.GENERATE_INVOICE, Permission.GENERATE_QUOTATION]
      },
      {
        title: 'Create Quote',
        url: '/dashboard/invoices/quote/new',
        icon: 'filePlus',
        permissions: [Permission.GENERATE_QUOTATION]
      },
      {
        title: 'Create Invoice',
        url: '/dashboard/invoices/invoice/new',
        icon: 'receipt',
        permissions: [Permission.GENERATE_INVOICE]
      },
      {
        title: 'Print Labels',
        url: '/dashboard/invoices/labels',
        icon: 'printer',
        permissions: [Permission.PRINT_LABELS]
      }
    ],
    permissions: [Permission.GENERATE_INVOICE, Permission.GENERATE_QUOTATION]
  },
  {
    title: 'Reports',
    url: '/dashboard/reports',
    icon: 'barChart3',
    shortcut: ['r', 'r'],
    isActive: false,
    items: [
      {
        title: 'Financial Reports',
        url: '/dashboard/reports/financial',
        icon: 'trendingUp',
        permissions: [Permission.VIEW_FINANCIAL_REPORTS]
      },
      {
        title: 'Battery Reports',
        url: '/dashboard/reports/batteries',
        icon: 'pieChart',
        permissions: [Permission.VIEW_FINANCIAL_REPORTS]
      },
      {
        title: 'Export Data',
        url: '/dashboard/reports/export',
        icon: 'download',
        permissions: [Permission.EXPORT_DATA]
      }
    ],
    permissions: [Permission.VIEW_FINANCIAL_REPORTS]
  },
  {
    title: 'User Management',
    url: '/dashboard/users',
    icon: 'userCog',
    shortcut: ['u', 'u'],
    isActive: false,
    items: [
      {
        title: 'All Users',
        url: '/dashboard/users',
        icon: 'list',
        permissions: [Permission.VIEW_USERS]
      },
      {
        title: 'Add User',
        url: '/dashboard/users/new',
        icon: 'userPlus',
        permissions: [Permission.CREATE_USER]
      },
      {
        title: 'Role Management',
        url: '/dashboard/users/roles',
        icon: 'shield',
        permissions: [Permission.UPDATE_USER_ROLES]
      }
    ],
    permissions: [Permission.VIEW_USERS]
  },
  {
    title: 'Settings',
    url: '/dashboard/settings',
    icon: 'settings',
    shortcut: ['s', 's'],
    isActive: false,
    items: [
      {
        title: 'General Settings',
        url: '/dashboard/settings',
        icon: 'cog',
        permissions: [Permission.MANAGE_SETTINGS]
      },
      {
        title: 'System Logs',
        url: '/dashboard/settings/logs',
        icon: 'fileText',
        permissions: [Permission.VIEW_SYSTEM_LOGS]
      }
    ],
    permissions: [Permission.MANAGE_SETTINGS]
  },
  {
    title: 'Profile',
    url: '/dashboard/profile',
    icon: 'user',
    shortcut: ['p', 'p'],
    isActive: false,
    items: [] // No child items
  }
];

export interface SaleUser {
  id: number;
  name: string;
  email: string;
  amount: string;
  image: string;
  initials: string;
}

export const recentSalesData: SaleUser[] = [
  {
    id: 1,
    name: 'Olivia Martin',
    email: 'olivia.martin@email.com',
    amount: '+$1,999.00',
    image: 'https://api.slingacademy.com/public/sample-users/1.png',
    initials: 'OM'
  },
  {
    id: 2,
    name: 'Jackson Lee',
    email: 'jackson.lee@email.com',
    amount: '+$39.00',
    image: 'https://api.slingacademy.com/public/sample-users/2.png',
    initials: 'JL'
  },
  {
    id: 3,
    name: 'Isabella Nguyen',
    email: 'isabella.nguyen@email.com',
    amount: '+$299.00',
    image: 'https://api.slingacademy.com/public/sample-users/3.png',
    initials: 'IN'
  },
  {
    id: 4,
    name: 'William Kim',
    email: 'will@email.com',
    amount: '+$99.00',
    image: 'https://api.slingacademy.com/public/sample-users/4.png',
    initials: 'WK'
  },
  {
    id: 5,
    name: 'Sofia Davis',
    email: 'sofia.davis@email.com',
    amount: '+$39.00',
    image: 'https://api.slingacademy.com/public/sample-users/5.png',
    initials: 'SD'
  }
];
