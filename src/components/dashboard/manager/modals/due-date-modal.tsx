"use client";

import React from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export function DueDateModal({ open, ticketId, initialDue, onClose, onSaved }: { open: boolean; ticketId?: string; initialDue?: string; onClose: () => void; onSaved: () => void }) {
  const [loading, setLoading] = React.useState(false);
  const [due, setDue] = React.useState<string | ''>(initialDue || '');

  React.useEffect(() => {
    if (open) setDue(initialDue || '');
  }, [open, initialDue]);

  const save = async () => {
    if (!ticketId) return;
    setLoading(true);
    try {
      const iso = due ? new Date(due).toISOString() : null;
      const { error } = await supabase
        .from('service_tickets')
        .update({ due_date: iso })
        .eq('id', ticketId);
      if (error) throw error;
      onSaved();
      onClose();
    } catch (e) {
      console.error('due date save failed', e);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg border p-4 w-full max-w-sm">
        <div className="font-semibold mb-2">Set Due Date</div>
        <div className="space-y-2">
          <input type="date" className="w-full border rounded h-9 px-2 bg-background" value={due ? new Date(due).toISOString().slice(0,10) : ''} onChange={(e) => setDue(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 mt-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
        </div>
      </div>
    </div>
  );
}

