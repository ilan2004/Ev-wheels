"use client";

import React, { useEffect, useMemo, useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SectionHeader } from '@/components/layout/section-header';
import { RoleGuard } from '@/components/auth/role-guard';
import { Permission } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocationContext } from '@/lib/location/context';
import { listInventoryMovements, requestIssue, requestReceive, requestTransfer, approveMovement } from '@/lib/api/inventory.movements.supabase';

export default function InventoryMovementsPage() {
  return (
    <RoleGuard permissions={[Permission.VIEW_INVENTORY]} showError>
      <Content />
    </RoleGuard>
  );
}

function Content() {
  const { locations, activeLocationId, isAdmin } = useLocationContext();
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Forms state
  const [sku, setSku] = useState('');
  const [qty, setQty] = useState<number>(1);
  const [toLoc, setToLoc] = useState('');
  const [overrideLoc, setOverrideLoc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectableLocations = useMemo(() => locations.filter((l) => l.id), [locations]);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listInventoryMovements({ limit: 50 });
      setMovements(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load movements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const ensureLoc = (): string | undefined => {
    if (activeLocationId) return activeLocationId;
    if (isAdmin && overrideLoc) return overrideLoc;
    return undefined;
  };

  const onIssue = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const loc = ensureLoc();
      if (!loc) throw new Error('Select a location (Admin can choose override)');
      await requestIssue({ item_sku: sku || undefined, quantity: qty, locationId: loc });
      setSku(''); setQty(1);
      await refresh();
    } catch (e: any) {
      setError(e?.message || 'Failed to request issue');
    } finally {
      setSubmitting(false);
    }
  };

  const onReceive = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const loc = ensureLoc();
      if (!loc) throw new Error('Select a location (Admin can choose override)');
      await requestReceive({ item_sku: sku || undefined, quantity: qty, locationId: loc });
      setSku(''); setQty(1);
      await refresh();
    } catch (e: any) {
      setError(e?.message || 'Failed to request receive');
    } finally {
      setSubmitting(false);
    }
  };

  const onTransfer = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const from = ensureLoc();
      if (!from) throw new Error('Select a location (Admin can choose override)');
      if (!toLoc) throw new Error('Select a target location');
      if (toLoc === from) throw new Error('Target location must differ');
      await requestTransfer({ item_sku: sku || undefined, quantity: qty, to_location_id: toLoc, from_location_id: from });
      setSku(''); setQty(1); setToLoc('');
      await refresh();
    } catch (e: any) {
      setError(e?.message || 'Failed to request transfer');
    } finally {
      setSubmitting(false);
    }
  };

  const onApprove = async (id: string) => {
    setSubmitting(true);
    setError(null);
    try {
      await approveMovement(id);
      await refresh();
    } catch (e: any) {
      setError(e?.message || 'Failed to approve');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <div className="mb-4"><Breadcrumbs /></div>
      <div className="space-y-6">
        <SectionHeader
          title="Inventory Movements"
          description="Request issue/receive/transfer and approve as admin."
        />

        {isAdmin && !activeLocationId && (
          <div className="rounded border p-3 text-sm">
            <div className="mb-2 font-medium">Admin: Select a location for new requests</div>
            <select className="border rounded h-9 px-2 bg-background" value={overrideLoc} onChange={(e) => setOverrideLoc(e.target.value)}>
              <option value="">Select location</option>
              {selectableLocations.map((l) => (
                <option key={l.id} value={l.id!}>{l.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded border p-4 space-y-2">
            <div className="font-semibold">Issue</div>
            <Input placeholder="Item SKU (optional)" value={sku} onChange={(e) => setSku(e.target.value)} />
            <Input type="number" min={1} value={qty} onChange={(e) => setQty(parseInt(e.target.value || '1', 10))} />
            <Button disabled={submitting} onClick={onIssue}>Request Issue</Button>
          </div>
          <div className="rounded border p-4 space-y-2">
            <div className="font-semibold">Receive</div>
            <Input placeholder="Item SKU (optional)" value={sku} onChange={(e) => setSku(e.target.value)} />
            <Input type="number" min={1} value={qty} onChange={(e) => setQty(parseInt(e.target.value || '1', 10))} />
            <Button disabled={submitting} onClick={onReceive}>Request Receive</Button>
          </div>
          <div className="rounded border p-4 space-y-2">
            <div className="font-semibold">Transfer</div>
            <Input placeholder="Item SKU (optional)" value={sku} onChange={(e) => setSku(e.target.value)} />
            <Input type="number" min={1} value={qty} onChange={(e) => setQty(parseInt(e.target.value || '1', 10))} />
            <select className="border rounded h-9 px-2 bg-background" value={toLoc} onChange={(e) => setToLoc(e.target.value)}>
              <option value="">Select destination</option>
              {selectableLocations.map((l) => (
                <option key={l.id} value={l.id!}>{l.name}</option>
              ))}
            </select>
            <Button disabled={submitting} onClick={onTransfer}>Request Transfer</Button>
          </div>
        </div>

        <div className="rounded border p-4">
          <div className="font-semibold mb-2">Recent Movements</div>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">From</th>
                    <th className="text-left p-2">To</th>
                    <th className="text-left p-2">Qty</th>
                    <th className="text-left p-2">SKU</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id} className="border-t">
                      <td className="p-2 capitalize">{m.movement_type}</td>
                      <td className="p-2">{m.from_location?.name || '-'}</td>
                      <td className="p-2">{m.to_location?.name || '-'}</td>
                      <td className="p-2">{m.quantity}</td>
                      <td className="p-2">{m.item_sku || '-'}</td>
                      <td className="p-2 capitalize">{m.status}</td>
                      <td className="p-2">
                        {m.status === 'pending' && (
                          <Button size="sm" variant="secondary" disabled={submitting} onClick={() => onApprove(m.id)}>Approve (Admin)</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

