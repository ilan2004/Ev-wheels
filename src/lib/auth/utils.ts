import { User } from '@clerk/nextjs/server';
import { UserRole, Permission, hasPermission, hasAnyPermission, NAVIGATION_PERMISSIONS } from './roles';

// Extend the Clerk User type to include our custom metadata
export interface EVWheelsUser extends User {
  publicMetadata: {
    role: UserRole;
    employeeId?: string;
    department?: string;
    hireDate?: string;
  };
}

/**
 * Get user role from Clerk user metadata
 */
export function getUserRole(user: User | null): UserRole | null {
  if (!user) return null;
  
  const role = user.publicMetadata?.role as UserRole;
  return role && Object.values(UserRole).includes(role) ? role : null;
}

/**
 * Check if user has a specific permission
 */
export function userHasPermission(user: User | null, permission: Permission): boolean {
  const role = getUserRole(user);
  if (!role) return false;
  
  return hasPermission(role, permission);
}

/**
 * Check if user has any of the specified permissions
 */
export function userHasAnyPermission(user: User | null, permissions: Permission[]): boolean {
  const role = getUserRole(user);
  if (!role) return false;
  
  return hasAnyPermission(role, permissions);
}

/**
 * Check if user can access a specific navigation item
 */
export function userCanAccessNavigation(user: User | null, navigationKey: keyof typeof NAVIGATION_PERMISSIONS): boolean {
  const permissions = NAVIGATION_PERMISSIONS[navigationKey];
  return userHasAnyPermission(user, permissions);
}

/**
 * Get user display name
 */
export function getUserDisplayName(user: User): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.firstName) return user.firstName;
  if (user.lastName) return user.lastName;
  if (user.username) return user.username;
  return user.emailAddresses?.[0]?.emailAddress || 'Unknown User';
}

/**
 * Get user role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return 'Administrator';
    case UserRole.TECHNICIAN:
      return 'Technician';
    default:
      return 'Unknown Role';
  }
}

/**
 * Format user info for display
 */
export function formatUserInfo(user: User): {
  displayName: string;
  role: UserRole | null;
  roleDisplayName: string;
  employeeId?: string;
  email: string;
} {
  const role = getUserRole(user);
  const employeeId = user.publicMetadata?.employeeId as string;
  
  return {
    displayName: getUserDisplayName(user),
    role,
    roleDisplayName: role ? getRoleDisplayName(role) : 'No Role Assigned',
    employeeId,
    email: user.emailAddresses?.[0]?.emailAddress || ''
  };
}

/**
 * Default role for new users
 */
export const DEFAULT_USER_ROLE = UserRole.TECHNICIAN;

/**
 * Check if a role is valid
 */
export function isValidRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole);
}

/**
 * Navigation routes that require authentication
 */
export const PROTECTED_ROUTES = [
  '/dashboard',
  '/batteries',
  '/customers',
  '/inventory',
  '/invoices',
  '/reports',
  '/users',
  '/settings'
];

/**
 * Routes that are only accessible by admins
 */
export const ADMIN_ONLY_ROUTES = [
  '/users',
  '/settings',
  '/reports'
];

/**
 * Check if route requires admin access
 */
export function isAdminOnlyRoute(pathname: string): boolean {
  return ADMIN_ONLY_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Check if route is protected
 */
export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}
