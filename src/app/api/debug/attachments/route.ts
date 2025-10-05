import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ticketId = searchParams.get('ticketId');

    if (!ticketId) {
      return NextResponse.json({ error: 'ticketId required' }, { status: 400 });
    }

    // Get the ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from('service_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (ticketError) {
      return NextResponse.json({ error: ticketError.message }, { status: 500 });
    }

    // Get all attachments for this ticket
    const { data: attachments, error: attError } = await supabase
      .from('ticket_attachments')
      .select('*')
      .eq('ticket_id', ticketId);

    if (attError) {
      return NextResponse.json({ error: attError.message }, { status: 500 });
    }

    // Get vehicle case if exists
    let vehicleCase = null;
    if (ticket.vehicle_case_id) {
      const { data: vc } = await supabase
        .from('vehicle_cases')
        .select('*')
        .eq('id', ticket.vehicle_case_id)
        .single();
      vehicleCase = vc;
    }

    // Get battery case if exists
    let batteryCase = null;
    if (ticket.battery_case_id) {
      const { data: bc } = await supabase
        .from('battery_records')
        .select('*')
        .eq('id', ticket.battery_case_id)
        .single();
      batteryCase = bc;
    }

    return NextResponse.json({
      ticket: {
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        status: ticket.status,
        vehicle_case_id: ticket.vehicle_case_id,
        battery_case_id: ticket.battery_case_id
      },
      vehicleCase: vehicleCase
        ? {
            id: vehicleCase.id,
            status: vehicleCase.status,
            vehicle_reg_no: vehicleCase.vehicle_reg_no
          }
        : null,
      batteryCase: batteryCase
        ? {
            id: batteryCase.id,
            serial_number: batteryCase.serial_number
          }
        : null,
      attachments:
        attachments?.map((a) => ({
          id: a.id,
          original_name: a.original_name,
          attachment_type: a.attachment_type,
          case_type: a.case_type,
          case_id: a.case_id,
          uploaded_at: a.uploaded_at
        })) || [],
      summary: {
        total_attachments: attachments?.length || 0,
        vehicle_attachments:
          attachments?.filter(
            (a) =>
              a.case_type === 'vehicle' && a.case_id === ticket.vehicle_case_id
          ).length || 0,
        battery_attachments:
          attachments?.filter(
            (a) =>
              a.case_type === 'battery' && a.case_id === ticket.battery_case_id
          ).length || 0,
        unlinked_attachments: attachments?.filter((a) => !a.case_id).length || 0
      }
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
