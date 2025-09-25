'use client';

import React from 'react';
import { UserRole, Permission } from '@/lib/auth/roles';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ShieldAlert } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  roles?: UserRole[];
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  showError?: boolean;
}

/**
 * Component that conditionally renders children based on user role or permissions
 */
export function RoleGuard({
  children,
  roles,
  permissions,
  requireAll = false,
  fallback = null,
  showError = false,
}: RoleGuardProps) {
  const { role, isLoaded, hasRole } = useAuth();

  // Show loading state while user data is being loaded
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // If no role is assigned
  if (!hasRole) {
    if (showError) {
      return (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            You don&apos;t have a role assigned. Please contact your administrator.
          </AlertDescription>
        </Alert>
      );
    }
    return fallback;
  }

  // Check role-based access
  if (roles && roles.length > 0) {
    const hasRequiredRole = roles.includes(role!);
    if (!hasRequiredRole) {
      if (showError) {
        return (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              You don&apos;t have permission to access this content.
            </AlertDescription>
          </Alert>
        );
      }
      return fallback;
    }
  }

  // Check permission-based access
  if (permissions && permissions.length > 0) {
    // This will be handled by child components using permission checks
    return <PermissionGuard permissions={permissions} requireAll={requireAll} fallback={fallback} showError={showError}>{children}</PermissionGuard>;
  }

  return <>{children}</>;
}

interface PermissionGuardProps {
  children: React.ReactNode;
  permissions: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  showError?: boolean;
}

/**
 * Component that conditionally renders children based on user permissions
 */
function PermissionGuard({
  children,
  permissions,
  requireAll = false,
  fallback = null,
  showError = false,
}: PermissionGuardProps) {
  const { hasAnyPermission, hasPermission } = useAuth();
  const hasPermissions = hasAnyPermission(permissions);
  
  // For requireAll, check each permission using the non-hook function
  if (requireAll) {
    const allPermissions = permissions.every((permission) => hasPermission(permission));
    if (!allPermissions) {
      if (showError) {
        return (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              You don&apos;t have all the required permissions to access this content.
            </AlertDescription>
          </Alert>
        );
      }
      return fallback;
    }
  } else {
    if (!hasPermissions) {
      if (showError) {
        return (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              You don&apos;t have permission to access this content.
            </AlertDescription>
          </Alert>
        );
      }
      return fallback;
    }
  }

  return <>{children}</>;
}

/**
 * Component for admin-only content
 */
export function AdminOnly({ 
  children, 
  fallback = null, 
  showError = false 
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
  showError?: boolean; 
}) {
  return (
    <RoleGuard 
      roles={[UserRole.ADMIN]} 
      fallback={fallback} 
      showError={showError}
    >
      {children}
    </RoleGuard>
  );
}

/**
 * Component for technician-accessible content
 */
export function TechnicianAccess({ 
  children, 
  fallback = null, 
  showError = false 
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
  showError?: boolean; 
}) {
  return (
    <RoleGuard 
      roles={[UserRole.ADMIN, UserRole.TECHNICIAN]} 
      fallback={fallback} 
      showError={showError}
    >
      {children}
    </RoleGuard>
  );
}

/**
 * Component that shows content based on user role
 */
export function RoleBasedContent({
  adminContent,
  technicianContent,
  fallback = null,
}: {
  adminContent?: React.ReactNode;
  technicianContent?: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { role, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  switch (role) {
    case UserRole.ADMIN:
      return <>{adminContent || fallback}</>;
    case UserRole.TECHNICIAN:
      return <>{technicianContent || fallback}</>;
    default:
      return <>{fallback}</>;
  }
}
