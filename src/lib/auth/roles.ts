export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  TECHNICIAN = 'technician'
}

export enum Permission {
  // Battery Management
  VIEW_BATTERIES = 'view_batteries',
  CREATE_BATTERY_RECORD = 'create_battery_record',
  UPDATE_BATTERY_STATUS = 'update_battery_status',
  DELETE_BATTERY_RECORD = 'delete_battery_record',
  
  // Customer Management
  VIEW_CUSTOMERS = 'view_customers',
  CREATE_CUSTOMER = 'create_customer',
  UPDATE_CUSTOMER = 'update_customer',
  DELETE_CUSTOMER = 'delete_customer',
  
  // Inventory Management
  VIEW_INVENTORY = 'view_inventory',
  UPDATE_INVENTORY = 'update_inventory',
  CREATE_INVENTORY_ITEM = 'create_inventory_item',
  DELETE_INVENTORY_ITEM = 'delete_inventory_item',
  
  // Financial Management
  VIEW_PRICING = 'view_pricing',
  UPDATE_PRICING = 'update_pricing',
  GENERATE_INVOICE = 'generate_invoice',
  GENERATE_QUOTATION = 'generate_quotation',
  VIEW_FINANCIAL_REPORTS = 'view_financial_reports',
  
  // User Management
  VIEW_USERS = 'view_users',
  CREATE_USER = 'create_user',
  UPDATE_USER_ROLES = 'update_user_roles',
  DELETE_USER = 'delete_user',
  
  // System Management
  VIEW_SYSTEM_LOGS = 'view_system_logs',
  MANAGE_SETTINGS = 'manage_settings',
  EXPORT_DATA = 'export_data',
  
  // QR Code and Printing
  PRINT_LABELS = 'print_labels',
  GENERATE_QR_CODES = 'generate_qr_codes'
}

// Role-based permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // Full access to all permissions
    Permission.VIEW_BATTERIES,
    Permission.CREATE_BATTERY_RECORD,
    Permission.UPDATE_BATTERY_STATUS,
    Permission.DELETE_BATTERY_RECORD,
    Permission.VIEW_CUSTOMERS,
    Permission.CREATE_CUSTOMER,
    Permission.UPDATE_CUSTOMER,
    Permission.DELETE_CUSTOMER,
    Permission.VIEW_INVENTORY,
    Permission.UPDATE_INVENTORY,
    Permission.CREATE_INVENTORY_ITEM,
    Permission.DELETE_INVENTORY_ITEM,
    Permission.VIEW_PRICING,
    Permission.UPDATE_PRICING,
    Permission.GENERATE_INVOICE,
    Permission.GENERATE_QUOTATION,
    Permission.VIEW_FINANCIAL_REPORTS,
    Permission.VIEW_USERS,
    Permission.CREATE_USER,
    Permission.UPDATE_USER_ROLES,
    Permission.DELETE_USER,
    Permission.VIEW_SYSTEM_LOGS,
    Permission.MANAGE_SETTINGS,
    Permission.EXPORT_DATA,
    Permission.PRINT_LABELS,
    Permission.GENERATE_QR_CODES
  ],
  [UserRole.MANAGER]: [
    // Managers: full access within their location(s), inventory read-only
    Permission.VIEW_BATTERIES,
    Permission.CREATE_BATTERY_RECORD,
    Permission.UPDATE_BATTERY_STATUS,
    Permission.VIEW_CUSTOMERS,
    Permission.CREATE_CUSTOMER,
    Permission.UPDATE_CUSTOMER,
    Permission.VIEW_INVENTORY,
    Permission.VIEW_PRICING,
    Permission.GENERATE_QUOTATION,
    Permission.PRINT_LABELS,
    Permission.GENERATE_QR_CODES
  ],
  [UserRole.TECHNICIAN]: [
    // Limited access for technicians
    Permission.VIEW_BATTERIES,
    Permission.CREATE_BATTERY_RECORD,
    Permission.UPDATE_BATTERY_STATUS,
    Permission.VIEW_CUSTOMERS,
    Permission.VIEW_INVENTORY,
    Permission.UPDATE_INVENTORY,
    Permission.VIEW_PRICING,
    Permission.PRINT_LABELS,
    Permission.GENERATE_QR_CODES
  ]
};

// Helper functions for role and permission checking
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
}

export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

export function isAdmin(userRole: UserRole): boolean {
  return userRole === UserRole.ADMIN;
}

export function isTechnician(userRole: UserRole): boolean {
  return userRole === UserRole.TECHNICIAN;
}

export function isManager(userRole: UserRole): boolean {
  return userRole === UserRole.MANAGER;
}

// Navigation permissions
export const NAVIGATION_PERMISSIONS = {
  dashboard: [Permission.VIEW_BATTERIES, Permission.VIEW_CUSTOMERS],
  batteries: [Permission.VIEW_BATTERIES],
  customers: [Permission.VIEW_CUSTOMERS],
  inventory: [Permission.VIEW_INVENTORY],
  invoices: [Permission.GENERATE_INVOICE],
  quotes: [Permission.GENERATE_QUOTATION],
  reports: [Permission.VIEW_FINANCIAL_REPORTS],
  users: [Permission.VIEW_USERS],
  settings: [Permission.MANAGE_SETTINGS]
} as const;
