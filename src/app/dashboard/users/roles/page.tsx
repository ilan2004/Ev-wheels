'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AdminOnly } from '@/components/auth/role-guard';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

const ROLES = ['admin', 'manager', 'technician'] as const;

type Role = (typeof ROLES)[number];

type ProfileRow = { user_id: string; username: string; email: string };

type RoleRow = { user_id: string; role: Role };

export default function ManageRolesPage() {
  return (
    <AdminOnly showError>
      <Content />
    </AdminOnly>
  );
}

function Content() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [roles, setRoles] = useState<Record<string, Role>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: profs, error: pErr }, { data: rRows, error: rErr }] =
          await Promise.all([
            supabase
              .from('profiles')
              .select('user_id, username, email')
              .order('username', { ascending: true }),
            supabase.from('app_roles').select('user_id, role')
          ]);
        if (pErr) throw pErr;
        if (rErr) throw rErr;
        setProfiles((profs || []) as ProfileRow[]);
        const map: Record<string, Role> = {};
        (rRows || []).forEach((r: any) => {
          if (ROLES.includes(r.role)) map[r.user_id] = r.role as Role;
        });
        setRoles(map);
      } catch (e: any) {
        setError(e?.message || 'Failed to load users and roles');
      }
    })();
  }, []);

  const rows = useMemo(() => {
    return profiles.map((p) => ({
      ...p,
      role: roles[p.user_id] || 'technician'
    }));
  }, [profiles, roles]);

  const setUserRole = async (user_id: string, role: Role) => {
    setSaving((s) => ({ ...s, [user_id]: true }));
    setError(null);
    try {
      const { error } = await supabase
        .from('app_roles')
        .upsert({ user_id, role }, { onConflict: 'user_id' });
      if (error) throw error;
      setRoles((r) => ({ ...r, [user_id]: role }));
    } catch (e: any) {
      setError(e?.message || 'Failed to update role');
    } finally {
      setSaving((s) => ({ ...s, [user_id]: false }));
    }
  };

  return (
    <div className='space-y-4 p-6'>
      <h1 className='text-2xl font-semibold'>Manage User Roles</h1>
      {error && <div className='text-sm text-red-600'>{error}</div>}
      <div className='rounded border'>
        <table className='w-full text-sm'>
          <thead className='bg-muted'>
            <tr>
              <th className='p-2 text-left'>Username</th>
              <th className='p-2 text-left'>Email</th>
              <th className='p-2 text-left'>Role</th>
              <th className='p-2 text-left'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.user_id} className='border-t'>
                <td className='p-2'>{r.username}</td>
                <td className='p-2'>{r.email}</td>
                <td className='p-2'>
                  <select
                    className='bg-background h-8 rounded border px-2'
                    value={r.role}
                    onChange={(e) =>
                      setRoles((rs) => ({
                        ...rs,
                        [r.user_id]: e.target.value as Role
                      }))
                    }
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </td>
                <td className='p-2'>
                  <Button
                    size='sm'
                    disabled={saving[r.user_id]}
                    onClick={() =>
                      setUserRole(
                        r.user_id,
                        (roles[r.user_id] || 'technician') as Role
                      )
                    }
                  >
                    {saving[r.user_id] ? 'Saving...' : 'Save'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
