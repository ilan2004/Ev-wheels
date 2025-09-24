'use client';

import { useUser } from '@clerk/nextjs';
import { UserRole, Permission } from '@/lib/auth/roles';
import { 
  getUserRole, 
  userHasPermission, 
  userHasAnyPermission,
  userCanAccessNavigation,
  formatUserInfo,
  NAVIGATION_PERMISSIONS
} from '@/lib/auth/utils';
import { useMemo } from 'react';

/**
 * Hook to get current user role and permission checking functions
 */
export function useAuth() {
  const { user, isLoaded, isSignedIn } = useUser();

  const userInfo = useMemo(() => {
    if (!user) return null;
    return formatUserInfo(user);
  }, [user]);

  const role = useMemo(() => getUserRole(user), [user]);

  const hasPermission = useMemo(() => {
    return (permission: Permission) => userHasPermission(user, permission);
  }, [user]);

  const hasAnyPermission = useMemo(() => {
    return (permissions: Permission[]) => userHasAnyPermission(user, permissions);
  }, [user]);

  const canAccessNavigation = useMemo(() => {
    return (navigationKey: keyof typeof NAVIGATION_PERMISSIONS) => 
      userCanAccessNavigation(user, navigationKey);
  }, [user]);

  const isAdmin = role === UserRole.ADMIN;
  const isTechnician = role === UserRole.TECHNICIAN;

  return {
    user,
    userInfo,
    role,
    isLoaded,
    isSignedIn,
    isAdmin,
    isTechnician,
    hasPermission,
    hasAnyPermission,
    canAccessNavigation,
    hasRole: Boolean(role),
  };
}

/**
 * Hook to check if user has specific permission
 */
export function usePermission(permission: Permission) {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
}

/**
 * Hook to check if user has any of the specified permissions
 */
export function useAnyPermission(permissions: Permission[]) {
  const { hasAnyPermission } = useAuth();
  return hasAnyPermission(permissions);
}

/**
 * Hook to check if user can access navigation item
 */
export function useNavigationAccess(navigationKey: keyof typeof NAVIGATION_PERMISSIONS) {
  const { canAccessNavigation } = useAuth();
  return canAccessNavigation(navigationKey);
}

/**
 * Hook for role-specific redirects and guards
 */
export function useRoleGuard() {
  const { isAdmin, isTechnician, hasRole, isLoaded } = useAuth();

  const requireAdmin = () => {
    if (isLoaded && !isAdmin) {
      throw new Error('Admin access required');
    }
    return isAdmin;
  };

  const requireTechnician = () => {
    if (isLoaded && !isTechnician) {
      throw new Error('Technician access required');
    }
    return isTechnician;
  };

  const requireRole = () => {
    if (isLoaded && !hasRole) {
      throw new Error('Role assignment required');
    }
    return hasRole;
  };

  return {
    requireAdmin,
    requireTechnician,
    requireRole,
    isAdmin,
    isTechnician,
    hasRole,
  };
}
