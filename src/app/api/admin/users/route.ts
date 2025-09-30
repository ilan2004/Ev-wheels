import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Admin client with service role key for user management
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Get the current user from the incoming request using the Authorization header
async function getRequestUser(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase public env vars');
  }

  const authHeader = req.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authHeader }
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const { data, error } = await authClient.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

/**
 * POST /api/admin/users
 * Create a new user (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, username, role: requestedRole, location_ids } = body;

    // Validate required fields
    if (!email || !password || !username || !requestedRole) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify current user is admin
    const currentUser = await getRequestUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const currentRole = (currentUser.user_metadata as any)?.role;
    if (currentRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get admin client
    const adminClient = getAdminClient();

    // Create auth user
    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role: requestedRole,
          username
        }
      });

    if (authError) {
      console.error('Auth user creation error:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // Create profile
    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert(
        { user_id: userId, username, email },
        { onConflict: 'user_id' }
      );

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Rollback: delete auth user
      await adminClient.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    // Create app_roles entry
    const { error: roleError } = await adminClient
      .from('app_roles')
      .upsert({ user_id: userId, role: requestedRole }, { onConflict: 'user_id' });

    if (roleError) {
      console.error('Role creation error:', roleError);
      // Rollback
      await adminClient.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Failed to assign role' },
        { status: 500 }
      );
    }

    // Assign locations
    if (location_ids && location_ids.length > 0) {
      const locationAssignments = location_ids.map((locId: string) => ({
        user_id: userId,
        location_id: locId
      }));

      const { error: locationError } = await adminClient
        .from('user_locations')
        .insert(locationAssignments);

      if (locationError) {
        console.error('Location assignment error:', locationError);
        // Non-critical error, user is created but without locations
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        user_id: userId,
        email,
        username,
        role: requestedRole
      }
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/users
 * List all users (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify current user is admin
    const currentUser = await getRequestUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const currentRole = (currentUser.user_metadata as any)?.role;
    if (currentRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adminClient = getAdminClient();

    // Get all users
    const { data: roleRows, error: usersError } = await adminClient
      .from('app_roles')
      .select('user_id, role');

    if (usersError) throw usersError;

    // Build profiles with separate fetches
    const userProfiles = await Promise.all(
      (roleRows || []).map(async (u: any) => {
        const { data: profile } = await adminClient
          .from('profiles')
          .select('username, email, created_at, updated_at')
          .eq('user_id', u.user_id)
          .single();

        const { data: locationData } = await adminClient
          .from('user_locations')
          .select(
            `
            location_id,
            locations(id, name, code)
          `
          )
          .eq('user_id', u.user_id);

        const locations = (locationData || []).map((loc: any) => ({
          location_id: loc.locations?.id,
          location_name: loc.locations?.name,
          location_code: loc.locations?.code
        }));

        return {
          user_id: u.user_id,
          email: profile?.email ?? '',
          username: profile?.username ?? '',
          role: u.role,
          created_at: profile?.created_at ?? null,
          updated_at: profile?.updated_at ?? null,
          locations
        };
      })
    );

    return NextResponse.json({ success: true, data: userProfiles });
  } catch (error: any) {
    console.error('Error listing users:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
