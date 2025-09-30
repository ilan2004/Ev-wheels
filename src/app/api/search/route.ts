import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

function getAnonClient(authHeader?: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, anonKey, {
    global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

async function getRequestUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  const anon = getAnonClient(authHeader);
  const { data } = await anon.auth.getUser();
  return data?.user || null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    if (!q) return NextResponse.json({ success: true, data: { tickets: [], batteries: [], customers: [] } });

    const user = await getRequestUser(request);
    const role = (user?.user_metadata as any)?.role;

    const like = `%${q}%`;

    // If Admin or Front Desk Manager, search with service role (bypass RLS)
    const client = role === 'admin' || role === 'front_desk_manager' ? getAdminClient() : getAnonClient(request.headers.get('authorization') || undefined);

    const [ticketsRes, batteriesRes, customersRes] = await Promise.all([
      client
        .from('service_tickets')
        .select('id, ticket_number, status, vehicle_reg_no, created_at')
        .or(`ticket_number.ilike.${like},vehicle_reg_no.ilike.${like},description.ilike.${like},symptom.ilike.${like}`)
        .order('created_at', { ascending: false })
        .limit(20),
      client
        .from('battery_records')
        .select('id, serial_number, brand, status')
        .or(`serial_number.ilike.${like},brand.ilike.${like}`)
        .order('updated_at', { ascending: false })
        .limit(20),
      client
        .from('customers')
        .select('id, name, contact')
        .or(`name.ilike.${like},contact.ilike.${like}`)
        .order('name', { ascending: true })
        .limit(20)
    ]);

    if (ticketsRes.error) throw ticketsRes.error;
    if (batteriesRes.error) throw batteriesRes.error;
    if (customersRes.error) throw customersRes.error;

    return NextResponse.json({
      success: true,
      data: {
        tickets: ticketsRes.data || [],
        batteries: batteriesRes.data || [],
        customers: customersRes.data || []
      }
    });
  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Search failed' }, { status: 500 });
  }
}

