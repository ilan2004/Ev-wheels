'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { UserRole, Permission } from '@/lib/auth/roles';
import {
  getUserRole,
  userHasPermission,
  userHasAnyPermission,
  userCanAccessNavigation,
  formatUserInfo,
  NAVIGATION_PERMISSIONS
} from '@/lib/auth/utils';

export function useAuth() {
  const [user, setUser] = useState<any | null>(null);
  const [isLoaded, setLoaded] = useState(false);
  const [isSignedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(user);
      setSignedIn(!!user);
      setLoaded(true);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setSignedIn(!!session?.user);
      setLoaded(true);
    });
    return () => sub.subscription?.unsubscribe?.();
  }, []);

  const userInfo = useMemo(() => {
    if (!user) return null;
    return formatUserInfo({
      emailAddresses: [{ emailAddress: (user.email ?? user?.email_addresses?.[0]?.email) || '' }],
      firstName: user.user_metadata?.firstName ?? null,
      lastName: user.user_metadata?.lastName ?? null,
      publicMetadata: { role: user.user_metadata?.role },
      username: null,
    } as any);
  }, [user]);

  const role = useMemo(() => getUserRole({ publicMetadata: { role: user?.user_metadata?.role } } as any) || UserRole.TECHNICIAN, [user]);

  const hasPermission = useMemo(() => {
    return (permission: Permission) => userHasPermission({ publicMetadata: { role } } as any, permission);
  }, [role]);

  const hasAnyPermission = useMemo(() => {
    return (permissions: Permission[]) => userHasAnyPermission({ publicMetadata: { role } } as any, permissions);
  }, [role]);

  const canAccessNavigation = useMemo(() => {
    return (navigationKey: keyof typeof NAVIGATION_PERMISSIONS) =>
      userCanAccessNavigation({ publicMetadata: { role } } as any, navigationKey);
  }, [role]);

  const isAdmin = role === UserRole.ADMIN;
  const isTechnician = role === UserRole.TECHNICIAN;
  const isManager = role === UserRole.MANAGER;

  return {
    user,
    userInfo,
    role,
    isLoaded,
    isSignedIn,
    isAdmin,
    isTechnician,
    isManager,
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
  const { isAdmin, isTechnician, isManager, hasRole, isLoaded } = useAuth();

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

  const requireManager = () => {
    if (isLoaded && !isManager) {
      throw new Error('Manager access required');
    }
    return isManager;
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
    requireManager,
    requireRole,
    isAdmin,
    isTechnician,
    isManager,
    hasRole,
  };
}
