// Supabase API for inventory movements, with active location helpers
'use client';

import { supabase } from '@/lib/supabase/client';
import { getActiveLocationId } from '@/lib/location/session';

export type InventoryMovement = {
  id: string;
  item_id?: string | null;
  item_sku?: string | null;
  movement_type: 'issue' | 'receive' | 'transfer' | 'adjustment' | 'request';
  from_location_id?: string | null;
  to_location_id?: string | null;
  quantity: number;
  notes?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_by: string;
  created_at: string;
  approved_by?: string | null;
  approved_at?: string | null;
};

export async function listInventoryMovements(params: { limit?: number } = {}) {
  const limit = params.limit ?? 100;
  const { data, error } = await supabase
    .from('inventory_movements')
    .select('*, from_location:locations!inventory_movements_from_location_id_fkey(id,name), to_location:locations!inventory_movements_to_location_id_fkey(id,name)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as InventoryMovement[];
}

export async function requestIssue(params: { item_id?: string; item_sku?: string; quantity: number; notes?: string; locationId?: string }) {
  const loc = params.locationId ?? getActiveLocationId();
  if (!loc) throw new Error('Please select a location before creating a movement');
  const payload: Partial<InventoryMovement> = {
    item_id: params.item_id ?? null,
    item_sku: params.item_sku ?? null,
    movement_type: 'issue',
    from_location_id: loc,
    to_location_id: null,
    quantity: params.quantity,
    notes: params.notes ?? null,
    status: 'pending',
  };
  const { data, error } = await supabase
    .from('inventory_movements')
    .insert(payload as any)
    .select('*')
    .single();
  if (error) throw error;
  return data as InventoryMovement;
}

export async function requestReceive(params: { item_id?: string; item_sku?: string; quantity: number; notes?: string; locationId?: string }) {
  const loc = params.locationId ?? getActiveLocationId();
  if (!loc) throw new Error('Please select a location before creating a movement');
  const payload: Partial<InventoryMovement> = {
    item_id: params.item_id ?? null,
    item_sku: params.item_sku ?? null,
    movement_type: 'receive',
    from_location_id: null,
    to_location_id: loc,
    quantity: params.quantity,
    notes: params.notes ?? null,
    status: 'pending',
  };
  const { data, error } = await supabase
    .from('inventory_movements')
    .insert(payload as any)
    .select('*')
    .single();
  if (error) throw error;
  return data as InventoryMovement;
}

export async function requestTransfer(params: { item_id?: string; item_sku?: string; quantity: number; to_location_id: string; notes?: string; from_location_id?: string }) {
  const from = params.from_location_id ?? getActiveLocationId();
  if (!from) throw new Error('Please select a location before creating a transfer');
  const payload: Partial<InventoryMovement> = {
    item_id: params.item_id ?? null,
    item_sku: params.item_sku ?? null,
    movement_type: 'transfer',
    from_location_id: from,
    to_location_id: params.to_location_id,
    quantity: params.quantity,
    notes: params.notes ?? null,
    status: 'pending',
  };
  const { data, error } = await supabase
    .from('inventory_movements')
    .insert(payload as any)
    .select('*')
    .single();
  if (error) throw error;
  return data as InventoryMovement;
}

export async function approveMovement(id: string) {
  const { data, error } = await supabase
    .from('inventory_movements')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as InventoryMovement;
}

