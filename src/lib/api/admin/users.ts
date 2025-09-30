import { supabase } from '@/lib/supabase/client';
import { UserRole } from '@/lib/auth/roles';

export interface UserProfile {
  user_id: string;
  email: string;
  username: string;
  role: UserRole;
  created_at: string;
  updated_at?: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  locations?: Array<{
    location_id: string;
    location_name: string;
    location_code: string;
  }>;
}

export interface CreateUserData {
  email: string;
  password: string;
  username: string;
  role: UserRole;
  location_ids: string[];
}

export interface UpdateUserData {
  username?: string;
  role?: UserRole;
  location_ids?: string[];
}

/**
 * List all users (admin only)
 */
export async function listUsers(): Promise<{
  success: boolean;
  data?: UserProfile[];
  error?: string;
}> {
  try {
    // Send request through server API to bypass RLS when fetching other users' locations
    const {
      data: { session }
    } = await supabase.auth.getSession();

    const res = await fetch('/api/admin/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {})
      }
    });

    // If response is HTML (error overlay), throw
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      throw new Error(`Unexpected response type: ${contentType}. Body: ${text.slice(0, 120)}...`);
    }

    const data = await res.json();
    if (!res.ok || !data?.success) {
      throw new Error(data?.error || 'Failed to fetch users');
    }

    return { success: true, data: data.data as UserProfile[] };
  } catch (error: any) {
    console.error('Error listing users:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get a single user by ID (admin only)
 */
export async function getUserById(
  userId: string
): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
  try {
    const {
      data: { user: currentUser }
    } = await supabase.auth.getUser();
    if (!currentUser || currentUser.user_metadata?.role !== 'admin') {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: roleRow, error: roleError } = await supabase
      .from('app_roles')
      .select('user_id, role')
      .eq('user_id', userId)
      .single();

    if (roleError) throw roleError;

    const { data: profile } = await supabase
      .from('profiles')
      .select('username, email, created_at, updated_at')
      .eq('user_id', userId)
      .single();

    const { data: locationData } = await supabase
      .from('user_locations')
      .select(
        `
        location_id,
        locations(id, name, code)
      `
      )
      .eq('user_id', userId);

    const locations = (locationData || []).map((loc: any) => ({
      location_id: loc.locations?.id,
      location_name: loc.locations?.name,
      location_code: loc.locations?.code
    }));

    const userProfile: UserProfile = {
      user_id: roleRow.user_id,
      email: profile?.email ?? '',
      username: profile?.username ?? '',
      role: roleRow.role,
      created_at: profile?.created_at ?? '',
      updated_at: profile?.updated_at ?? undefined,
      locations
    };

    return { success: true, data: userProfile };
  } catch (error: any) {
    console.error('Error getting user:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(
  userId: string,
  newRole: UserRole
): Promise<{ success: boolean; error?: string }> {
  try {
    const {
      data: { user: currentUser }
    } = await supabase.auth.getUser();
    if (!currentUser || currentUser.user_metadata?.role !== 'admin') {
      return { success: false, error: 'Unauthorized' };
    }

    // Update in app_roles table
    const { error: roleError } = await supabase
      .from('app_roles')
      .update({ role: newRole })
      .eq('user_id', userId);

    if (roleError) throw roleError;

    // Note: Updating user_metadata requires service role key
    // This should be done via an API route with proper authentication

    return { success: true };
  } catch (error: any) {
    console.error('Error updating user role:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update user locations (admin only)
 */
export async function updateUserLocations(
  userId: string,
  locationIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const {
      data: { user: currentUser }
    } = await supabase.auth.getUser();
    if (!currentUser || currentUser.user_metadata?.role !== 'admin') {
      return { success: false, error: 'Unauthorized' };
    }

    // Delete existing location assignments
    const { error: deleteError } = await supabase
      .from('user_locations')
      .delete()
      .eq('user_id', userId);

    if (deleteError) throw deleteError;

    // Insert new location assignments
    if (locationIds.length > 0) {
      const assignments = locationIds.map((locId) => ({
        user_id: userId,
        location_id: locId
      }));

      const { error: insertError } = await supabase
        .from('user_locations')
        .insert(assignments);

      if (insertError) throw insertError;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating user locations:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update user profile (admin only)
 */
export async function updateUserProfile(
  userId: string,
  updates: { username?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const {
      data: { user: currentUser }
    } = await supabase.auth.getUser();
    if (!currentUser || currentUser.user_metadata?.role !== 'admin') {
      return { success: false, error: 'Unauthorized' };
    }

    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return { success: false, error: error.message };
  }
}

/**
 * List all locations for assignment
 */
export async function listLocations(): Promise<{
  success: boolean;
  data?: Array<{ id: string; name: string; code: string }>;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('id, name, code')
      .order('name');

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Error listing locations:', error);
    return { success: false, error: error.message };
  }
}
