// Check if current user is an admin for API layer (non-hook version)
import { supabase } from '@/lib/supabase/client';
import { UserRole } from '@/lib/auth/roles';

/**
 * Check if the current user is an admin by reading their user_metadata.
 * This is a non-hook version suitable for use in API layer.
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getUser();
    const role = data?.user?.user_metadata?.role;
    return role === UserRole.ADMIN;
  } catch {
    return false;
  }
}

/**
 * Get the current user's role from Supabase.
 * Returns null if not authenticated or role is not set.
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return (data?.user?.user_metadata?.role as UserRole) || null;
  } catch {
    return null;
  }
}
