'use client';

import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { UserCreateDialog } from '@/components/admin/user-management/user-create-dialog';
import { UserEditDialog } from '@/components/admin/user-management/user-edit-dialog';
import { listUsers, type UserProfile } from '@/lib/api/admin/users';
import { getRoleDisplayName } from '@/lib/auth/utils';
import { Search, Edit, UserPlus, MapPin, Calendar, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    // Filter users based on search and role
    let filtered = users;
    
    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.email.toLowerCase().includes(searchLower) ||
          user.username.toLowerCase().includes(searchLower) ||
          getRoleDisplayName(user.role).toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredUsers(filtered);
  }, [search, roleFilter, users]);

  const loadUsers = async () => {
    setLoading(true);
    const result = await listUsers();
    if (result.success && result.data) {
      setUsers(result.data);
      setFilteredUsers(result.data);
    }
    setLoading(false);
  };

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    setEditDialogOpen(true);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'front_desk_manager':
        return 'default';
      case 'technician':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <PageContainer>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold tracking-tight'>
              User Management
            </h1>
            <p className='text-muted-foreground'>
              Manage user accounts, roles, and locations
            </p>
          </div>
          <UserCreateDialog onUserCreated={loadUsers} />
        </div>

        {/* Stats Cards */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Administrators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {users.filter((u) => u.role === 'admin').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Front Desk Managers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {users.filter((u) => u.role === 'front_desk_manager').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Technicians
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {users.filter((u) => u.role === 'technician').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Location Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <MapPin className='h-5 w-5' />
              User Distribution by Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid gap-2'>
              {(() => {
                const locationCounts = new Map<string, number>();
                users.forEach(user => {
                  user.locations?.forEach(loc => {
                    const key = `${loc.location_name} (${loc.location_code})`;
                    locationCounts.set(key, (locationCounts.get(key) || 0) + 1);
                  });
                });
                return Array.from(locationCounts.entries())
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([location, count]) => (
                    <div key={location} className='flex items-center justify-between py-1'>
                      <span className='text-sm text-muted-foreground'>{location}</span>
                      <Badge variant='outline'>{count} users</Badge>
                    </div>
                  ));
              })()}
              {users.length > 0 && Array.from(new Map(users.flatMap(u => u.locations || []).map(loc => [`${loc.location_name} (${loc.location_code})`, 1]))).length === 0 && (
                <p className='text-sm text-muted-foreground'>No location data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Search and Table */}
        <Card>
          <CardHeader>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
              <CardTitle>All Users</CardTitle>
              <div className='flex flex-col gap-2 sm:flex-row sm:gap-4'>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className='w-full sm:w-48'>
                    <Filter className='mr-2 h-4 w-4' />
                    <SelectValue placeholder='Filter by role' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Roles</SelectItem>
                    <SelectItem value='admin'>Administrators</SelectItem>
                    <SelectItem value='front_desk_manager'>Front Desk Managers</SelectItem>
                    <SelectItem value='technician'>Technicians</SelectItem>
                  </SelectContent>
                </Select>
                <div className='relative w-full sm:w-64'>
                  <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                  <Input
                    placeholder='Search users...'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className='pl-8'
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className='rounded-md border overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className='hidden md:table-cell'>
                      Locations
                    </TableHead>
                    <TableHead className='hidden md:table-cell'>
                      Created
                    </TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className='space-y-2'>
                            <Skeleton className='h-4 w-32' />
                            <Skeleton className='h-3 w-48' />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Skeleton className='h-6 w-24' />
                        </TableCell>
                        <TableCell className='hidden md:table-cell'>
                          <Skeleton className='h-4 w-20' />
                        </TableCell>
                        <TableCell className='hidden md:table-cell'>
                          <Skeleton className='h-4 w-24' />
                        </TableCell>
                        <TableCell>
                          <Skeleton className='h-8 w-16 ml-auto' />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className='text-center text-muted-foreground py-8'
                      >
                        {search ? 'No users found matching your search' : 'No users yet'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell>
                          <div>
                            <div className='font-medium'>{user.username}</div>
                            <div className='text-sm text-muted-foreground'>
                              {user.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {getRoleDisplayName(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell className='hidden md:table-cell'>
                          {user.locations && user.locations.length > 0 ? (
                            <div className='flex flex-wrap gap-1'>
                              {user.locations.map((loc) => (
                                <Badge
                                  key={loc.location_id}
                                  variant='outline'
                                  className='text-xs'
                                >
                                  <MapPin className='mr-1 h-3 w-3' />
                                  {loc.location_code}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className='text-muted-foreground text-sm'>
                              No locations
                            </span>
                          )}
                        </TableCell>
                        <TableCell className='hidden md:table-cell'>
                          <div className='flex items-center text-sm text-muted-foreground'>
                            <Calendar className='mr-1 h-3 w-3' />
                            {formatDistanceToNow(new Date(user.created_at), {
                              addSuffix: true
                            })}
                          </div>
                        </TableCell>
                        <TableCell className='text-right'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className='h-4 w-4' />
                            <span className='ml-2 hidden sm:inline'>Edit</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <UserEditDialog
        user={editingUser}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onUserUpdated={loadUsers}
      />
    </PageContainer>
  );
}
