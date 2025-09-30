'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
import { listLocations } from '@/lib/api/admin/users';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Loader2, Plus, UserPlus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface UserCreateDialogProps {
  onUserCreated?: () => void;
  trigger?: React.ReactNode;
}

export function UserCreateDialog({
  onUserCreated,
  trigger
}: UserCreateDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<
    Array<{ id: string; name: string; code: string }>
  >([]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    role: UserRole.TECHNICIAN as string,
    location_ids: [] as string[]
  });

  // Load locations
  useEffect(() => {
    if (open) {
      loadLocations();
    }
  }, [open]);

  const loadLocations = async () => {
    const result = await listLocations();
    if (result.success && result.data) {
      setLocations(result.data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate
      if (!formData.email || !formData.password || !formData.username) {
        toast.error('Please fill all required fields');
        return;
      }

      if (formData.password.length < 8) {
        toast.error('Password must be at least 8 characters');
        return;
      }

      if (formData.location_ids.length === 0) {
        toast.error('Please select at least one location');
        return;
      }

      // Get current session access token for Authorization header
      const {
        data: { session }
      } = await supabase.auth.getSession();

      // Call API with bearer token
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {})
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create user');
      }

      toast.success('User created successfully');
      setOpen(false);
      
      // Reset form
      setFormData({
        email: '',
        password: '',
        username: '',
        role: UserRole.TECHNICIAN,
        location_ids: []
      });

      onUserCreated?.();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const toggleLocation = (locationId: string) => {
    setFormData((prev) => ({
      ...prev,
      location_ids: prev.location_ids.includes(locationId)
        ? prev.location_ids.filter((id) => id !== locationId)
        : [...prev.location_ids, locationId]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <UserPlus className='mr-2 h-4 w-4' />
            Create User
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='sm:max-w-[500px]'>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system. They will receive login credentials.
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 py-4'>
            {/* Email */}
            <div className='grid gap-2'>
              <Label htmlFor='email'>
                Email <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='email'
                type='email'
                placeholder='user@example.com'
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            {/* Username */}
            <div className='grid gap-2'>
              <Label htmlFor='username'>
                Username <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='username'
                type='text'
                placeholder='johndoe'
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                required
              />
            </div>

            {/* Password */}
            <div className='grid gap-2'>
              <Label htmlFor='password'>
                Password <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='password'
                type='password'
                placeholder='Min 8 characters'
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                minLength={8}
              />
              <p className='text-xs text-muted-foreground'>
                Must be at least 8 characters long
              </p>
            </div>

            {/* Role */}
            <div className='grid gap-2'>
              <Label htmlFor='role'>
                Role <span className='text-red-500'>*</span>
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
              >
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
              <Label>
                Locations <span className='text-red-500'>*</span>
              </Label>
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
                        id={`loc-${location.id}`}
                        checked={formData.location_ids.includes(location.id)}
                        onCheckedChange={() => toggleLocation(location.id)}
                      />
                      <Label
                        htmlFor={`loc-${location.id}`}
                        className='text-sm font-normal cursor-pointer'
                      >
                        {location.name} ({location.code})
                      </Label>
                    </div>
                  ))
                )}
              </div>
              <p className='text-xs text-muted-foreground'>
                Select at least one location for this user
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={loading}>
              {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Create User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
