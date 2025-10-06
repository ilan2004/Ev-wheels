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
import {
  Collapsible,
  CollapsibleContent
} from '@/components/ui/collapsible';
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
import { ToastManager } from '@/lib/toast-utils';
import { Loader2, Plus, UserPlus, MapPin } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

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
  const [creatingLocation, setCreatingLocation] = useState(false);
  const [showNewLocationForm, setShowNewLocationForm] = useState(false);
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
  const [newLocationData, setNewLocationData] = useState({
    name: ''
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

  const createNewLocation = async () => {
    if (!newLocationData.name.trim()) {
      ToastManager.error('Location name is required');
      return;
    }

    setCreatingLocation(true);
    const loadingToastId = ToastManager.loading(`Creating location ${newLocationData.name}...`);

    try {
      // Generate a code from the location name (uppercase, no spaces)
      const generatedCode = newLocationData.name.trim().toUpperCase().replace(/\s+/g, '_').substring(0, 20);
      
      const { data, error } = await supabase
        .from('locations')
        .insert({
          name: newLocationData.name.trim(),
          code: generatedCode,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique violation
          // Try with a timestamp suffix if the code already exists
          const timestampSuffix = Date.now().toString().slice(-4);
          const { data: retryData, error: retryError } = await supabase
            .from('locations')
            .insert({
              name: newLocationData.name.trim(),
              code: `${generatedCode}_${timestampSuffix}`,
              is_active: true
            })
            .select()
            .single();
          
          if (retryError) {
            throw new Error('Failed to create location. Please try a different name.');
          }
          
          // Use retry data if successful
          const newLocation = { id: retryData.id, name: retryData.name, code: retryData.code };
          setLocations(prev => [...prev, newLocation].sort((a, b) => a.name.localeCompare(b.name)));
          setFormData(prev => ({ ...prev, location_ids: [...prev.location_ids, retryData.id] }));
        } else {
          throw error;
        }
      } else {
        // Add new location to the list
        const newLocation = { id: data.id, name: data.name, code: data.code };
        setLocations(prev => [...prev, newLocation].sort((a, b) => a.name.localeCompare(b.name)));
        
        // Auto-select the new location
        setFormData(prev => ({ ...prev, location_ids: [...prev.location_ids, data.id] }));
      }

      // Reset form and close
      setNewLocationData({ name: '' });
      setShowNewLocationForm(false);

      ToastManager.dismiss(loadingToastId);
      ToastManager.success(`Location "${newLocationData.name}" created successfully!`);
    } catch (error: any) {
      console.error('Error creating location:', error);
      ToastManager.dismiss(loadingToastId);
      ToastManager.error('Failed to create location', error.message);
    } finally {
      setCreatingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Create loading toast
    const loadingToastId = ToastManager.loading(
      `Creating user ${formData.username}...`
    );

    try {
      // Validate
      if (!formData.email || !formData.password || !formData.username) {
        ToastManager.error('Please fill all required fields');
        return;
      }

      if (formData.password.length < 8) {
        ToastManager.error('Password must be at least 8 characters');
        return;
      }

      if (formData.location_ids.length === 0) {
        ToastManager.error('Please select at least one location');
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

      // Dismiss loading toast and show success
      ToastManager.dismiss(loadingToastId);
      ToastManager.users.success(`User ${formData.username} created successfully`);
      setOpen(false);
      
      // Reset form
      setFormData({
        email: '',
        password: '',
        username: '',
        role: UserRole.TECHNICIAN,
        location_ids: []
      });
      setNewLocationData({ name: '' });
      setShowNewLocationForm(false);

      onUserCreated?.();
    } catch (error: any) {
      console.error('Error creating user:', error);
      // Dismiss loading toast and show error
      ToastManager.dismiss(loadingToastId);
      ToastManager.users.error('Failed to create user', error.message);
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
      <DialogContent className='sm:max-w-[500px] max-h-[85vh] flex flex-col overflow-hidden'>
        <DialogHeader className='flex-shrink-0 pb-4'>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Add a new user to the system. They will receive login credentials.
          </DialogDescription>
        </DialogHeader>
        
        <div className='flex-1 overflow-y-auto min-h-0 pr-2 -mr-2'>
          <form onSubmit={handleSubmit} className='space-y-4'>
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
              <div className='flex items-center justify-between'>
                <Label>
                  Locations <span className='text-red-500'>*</span>
                </Label>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => setShowNewLocationForm(!showNewLocationForm)}
                  className='h-8 px-2 py-1 text-xs'
                >
                  <Plus className='mr-1 h-3 w-3' />
                  New Location
                </Button>
              </div>

              {/* New Location Form - Collapsible */}
              <Collapsible open={showNewLocationForm} onOpenChange={setShowNewLocationForm}>
                <CollapsibleContent className='space-y-3'>
                  <div className='rounded-md border p-3 bg-muted/30 space-y-3'>
                    <div className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
                      <MapPin className='h-4 w-4' />
                      Create New Location
                    </div>
                    
                    <div className='grid gap-2'>
                      <Label htmlFor='new-location-name' className='text-sm'>
                        Location Name <span className='text-red-500'>*</span>
                      </Label>
                      <Input
                        id='new-location-name'
                        placeholder='e.g. Main Workshop, Kochi Branch, etc.'
                        value={newLocationData.name}
                        onChange={(e) => setNewLocationData(prev => ({ ...prev, name: e.target.value }))}
                        className='h-9'
                        autoFocus
                      />
                      <p className='text-xs text-muted-foreground'>
                        A unique code will be generated automatically
                      </p>
                    </div>

                    <div className='flex gap-2'>
                      <Button
                        type='button'
                        size='sm'
                        onClick={createNewLocation}
                        disabled={creatingLocation || !newLocationData.name.trim()}
                        className='h-8 px-3'
                      >
                        {creatingLocation ? (
                          <Loader2 className='mr-1 h-3 w-3 animate-spin' />
                        ) : (
                          <Plus className='mr-1 h-3 w-3' />
                        )}
                        Create Location
                      </Button>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => {
                          setNewLocationData({ name: '' });
                          setShowNewLocationForm(false);
                        }}
                        className='h-8 px-3'
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                </CollapsibleContent>
              </Collapsible>

              {/* Existing Locations List */}
              <div className='rounded-md border p-3 max-h-[120px] overflow-y-auto space-y-2'>
                {locations.length === 0 ? (
                  <div className='text-center py-3 space-y-2'>
                    <p className='text-sm text-muted-foreground'>
                      {loading ? 'Loading locations...' : 'No locations available'}
                    </p>
                    {!loading && (
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => setShowNewLocationForm(true)}
                        className='h-8 px-3'
                      >
                        <Plus className='mr-1 h-3 w-3' />
                        Create Your First Location
                      </Button>
                    )}
                  </div>
                ) : (
                  locations.map((location) => (
                    <div
                      key={location.id}
                      className='flex items-center space-x-2 p-1 hover:bg-muted/50 rounded'
                    >
                      <Checkbox
                        id={`loc-${location.id}`}
                        checked={formData.location_ids.includes(location.id)}
                        onCheckedChange={() => toggleLocation(location.id)}
                      />
                      <Label
                        htmlFor={`loc-${location.id}`}
                        className='text-sm font-normal cursor-pointer flex-1'
                      >
                        <div className='flex items-center gap-2'>
                          <MapPin className='h-3 w-3 text-muted-foreground' />
                          <span className='font-medium'>{location.name}</span>
                          <span className='text-muted-foreground'>({location.code})</span>
                        </div>
                      </Label>
                    </div>
                  ))
                )}
              </div>
              <p className='text-xs text-muted-foreground'>
                Select at least one location for this user
              </p>
            </div>
          </form>
        </div>
        
        <DialogFooter className='flex-shrink-0 border-t pt-4 mt-2'>
          <Button
            type='button'
            variant='outline'
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            type='submit' 
            disabled={loading}
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(e as any);
            }}
          >
            {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Create User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
