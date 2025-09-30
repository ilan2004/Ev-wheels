'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { UserRole } from '@/lib/auth/roles';
import { getRoleDisplayName } from '@/lib/auth/utils';
import {
  listLocations,
  updateUserRole,
  updateUserLocations,
  type UserProfile
} from '@/lib/api/admin/users';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface UserEditDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated?: () => void;
}

export function UserEditDialog({
  user,
  open,
  onOpenChange,
  onUserUpdated
}: UserEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<
    Array<{ id: string; name: string; code: string }>
  >([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);

  // Initialize form when dialog opens or user changes
  useEffect(() => {
    if (open && user) {
      setSelectedRole(user.role);
      setSelectedLocationIds(
        user.locations?.map((l) => l.location_id) || []
      );
      loadLocations();
    }
  }, [open, user]);

  const loadLocations = async () => {
    const result = await listLocations();
    if (result.success && result.data) {
      setLocations(result.data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      // Update role if changed
      if (selectedRole !== user.role) {
        const roleResult = await updateUserRole(
          user.user_id,
          selectedRole as UserRole
        );
        if (!roleResult.success) {
          throw new Error(roleResult.error || 'Failed to update role');
        }
      }

      // Update locations if changed
      const currentLocationIds = user.locations?.map((l) => l.location_id) || [];
      const locationsChanged =
        selectedLocationIds.length !== currentLocationIds.length ||
        selectedLocationIds.some((id) => !currentLocationIds.includes(id));

      if (locationsChanged) {
        const locationResult = await updateUserLocations(
          user.user_id,
          selectedLocationIds
        );
        if (!locationResult.success) {
          throw new Error(
            locationResult.error || 'Failed to update locations'
          );
        }
      }

      toast.success('User updated successfully');
      onOpenChange(false);
      onUserUpdated?.();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const toggleLocation = (locationId: string) => {
    setSelectedLocationIds((prev) =>
      prev.includes(locationId)
        ? prev.filter((id) => id !== locationId)
        : [...prev, locationId]
    );
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update role and location assignments for {user.username} (
              {user.email})
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 py-4'>
            {/* Role */}
            <div className='grid gap-2'>
              <Label htmlFor='role'>Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.ADMIN}>
                    {getRoleDisplayName(UserRole.ADMIN)}
                  </SelectItem>
                  <SelectItem value={UserRole.FRONT_DESK_MANAGER}>
                    {getRoleDisplayName(UserRole.FRONT_DESK_MANAGER)}
                  </SelectItem>
                  <SelectItem value={UserRole.TECHNICIAN}>
                    {getRoleDisplayName(UserRole.TECHNICIAN)}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Locations */}
            <div className='grid gap-2'>
              <Label>Locations</Label>
              <div className='rounded-md border p-3 max-h-[200px] overflow-y-auto space-y-2'>
                {locations.length === 0 ? (
                  <p className='text-sm text-muted-foreground'>
                    Loading locations...
                  </p>
                ) : (
                  locations.map((location) => (
                    <div
                      key={location.id}
                      className='flex items-center space-x-2'
                    >
                      <Checkbox
                        id={`edit-loc-${location.id}`}
                        checked={selectedLocationIds.includes(location.id)}
                        onCheckedChange={() => toggleLocation(location.id)}
                      />
                      <Label
                        htmlFor={`edit-loc-${location.id}`}
                        className='text-sm font-normal cursor-pointer'
                      >
                        {location.name} ({location.code})
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={loading}>
              {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
