'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  IconUsers,
  IconUserPlus,
  IconMapPin,
  IconShield,
  IconSettings,
  IconEye,
  IconEdit,
  IconTrash,
  IconBriefcase,
  IconChartBar,
} from '@tabler/icons-react';
import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { UserCreateDialog } from '@/components/admin/user-management/user-create-dialog';
import { listUsers, type UserProfile } from '@/lib/api/admin/users';
import { Skeleton } from '@/components/ui/skeleton';

interface AdminDashboardProps {
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    emailAddresses: { id: string; emailAddress: string }[];
    imageUrl: string;
    publicMetadata: Record<string, any>;
  };
}

// Mock locations data (replace with real API call)
const LOCATIONS = [
  { id: 'kochi', name: 'Kochi', address: 'Marine Drive, Kochi' },
  { id: 'trivandrum', name: 'Trivandrum', address: 'Technopark, Trivandrum' },
  { id: 'calicut', name: 'Calicut', address: 'Beach Road, Calicut' },
];

const ROLE_COLORS = {
  admin: 'bg-red-50 text-red-700',
  front_desk_manager: 'bg-blue-50 text-blue-700',
  technician: 'bg-green-50 text-green-700',
  manager: 'bg-purple-50 text-purple-700',
};

const ROLE_ICONS = {
  admin: IconShield,
  front_desk_manager: IconBriefcase,
  technician: IconSettings,
  manager: IconChartBar,
};

const ROLE_LABELS = {
  admin: 'Administrator',
  front_desk_manager: 'Front Desk Manager',
  technician: 'Technician',
  manager: 'Manager',
};

export function AdminDashboard({ user }: AdminDashboardProps) {
  const userName = user.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : 'Administrator';

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    byRole: {} as Record<string, number>,
    byLocation: {} as Record<string, number>,
  });
  const [usersByLocation, setUsersByLocation] = useState<Record<string, UserProfile[]>>({});

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  // Load users data
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const result = await listUsers();
        if (result.success && result.data) {
          setUsers(result.data);
          
          // Calculate statistics
          const byRole: Record<string, number> = {};
          const byLocation: Record<string, number> = {};
          
          // Group users by location using location_name as key
          const locationGroups: Record<string, UserProfile[]> = {};
          
          result.data.forEach(user => {
            // Count by role
            byRole[user.role] = (byRole[user.role] || 0) + 1;
            
            // Count and group by location
            if (user.locations && user.locations.length > 0) {
              user.locations.forEach(loc => {
                // Use location_name as the key instead of location_id
                const locationKey = loc.location_name || loc.location_id || 'unassigned';
                byLocation[locationKey] = (byLocation[locationKey] || 0) + 1;
                
                // Add user to location group
                if (!locationGroups[locationKey]) {
                  locationGroups[locationKey] = [];
                }
                locationGroups[locationKey].push(user);
              });
            } else {
              byLocation['unassigned'] = (byLocation['unassigned'] || 0) + 1;
              
              // Add user to unassigned group
              if (!locationGroups['unassigned']) {
                locationGroups['unassigned'] = [];
              }
              locationGroups['unassigned'].push(user);
            }
          });
          
          setUsersByLocation(locationGroups);
          
          setUserStats({
            totalUsers: result.data.length,
            byRole,
            byLocation,
          });
        }
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const getLocationName = (locationKey: string) => {
    // If it's unassigned
    if (locationKey === 'unassigned') return 'Unassigned';
    
    // The locationKey should now be the actual location name from DB
    // Just return it as is
    return locationKey;
  };
  
  const getLocationAddress = (locationKey: string) => {
    // For now, return null - we can add address lookup later if needed
    if (locationKey === 'unassigned') return null;
    return null;
  };

  if (loading) {
    return (
      <PageContainer>
        <div className='space-y-6'>
          <div className='space-y-2'>
            <Skeleton className='h-8 w-64' />
            <Skeleton className='h-4 w-96' />
          </div>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className='h-24' />
            ))}
          </div>
          <Skeleton className='h-96' />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='space-y-6'>
        {/* Simple Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-semibold'>User Management</h1>
            <p className='text-sm text-muted-foreground mt-1'>
              Manage users, roles, and locations
            </p>
          </div>
          
          <div className='flex gap-2'>
            <UserCreateDialog
              trigger={
                <Button>
                  <IconUserPlus className='h-4 w-4 mr-2' />
                  Create User
                </Button>
              }
              onUserCreated={() => window.location.reload()}
            />
            <Button asChild variant='outline'>
              <Link href='/dashboard/admin/users'>
                View All
              </Link>
            </Button>
          </div>
        </div>

        {/* Simple Stats */}
        <div className='grid gap-4 md:grid-cols-4'>
          <Card>
            <CardContent className='p-4'>
              <div className='text-sm text-muted-foreground'>Total Users</div>
              <div className='text-2xl font-semibold mt-1'>{userStats.totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4'>
              <div className='text-sm text-muted-foreground'>Administrators</div>
              <div className='text-2xl font-semibold mt-1'>{userStats.byRole.admin || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4'>
              <div className='text-sm text-muted-foreground'>Technicians</div>
              <div className='text-2xl font-semibold mt-1'>{userStats.byRole.technician || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4'>
              <div className='text-sm text-muted-foreground'>Locations</div>
              <div className='text-2xl font-semibold mt-1'>{Object.keys(userStats.byLocation).length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Users by Location - Full Width */}
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Users by Location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {Object.entries(usersByLocation).length > 0 ? (
                Object.entries(usersByLocation).map(([location, locationUsers]) => {
                  const locationName = getLocationName(location);
                  const locationAddress = getLocationAddress(location);
                  
                  return (
                    <div key={location} className='border rounded p-3'>
                      <div className='flex items-center justify-between mb-3'>
                        <div>
                          <div className='font-medium flex items-center gap-2'>
                            <IconMapPin className='h-4 w-4 text-gray-500' />
                            {locationName}
                          </div>
                          {locationAddress && (
                            <div className='text-xs text-muted-foreground ml-6'>
                              {locationAddress}
                            </div>
                          )}
                        </div>
                        <Badge variant='secondary'>{locationUsers.length}</Badge>
                      </div>
                      <div className='space-y-2 ml-6'>
                        {locationUsers.map((user) => (
                          <div key={user.user_id} className='flex items-center justify-between text-sm py-1'>
                            <div className='flex items-center gap-2'>
                              <div className='h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium'>
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                              <span>{user.username}</span>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded ${ROLE_COLORS[user.role as keyof typeof ROLE_COLORS]}`}>
                              {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] || user.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className='text-center py-8 text-muted-foreground'>
                  No users assigned to any location yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Users Table */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-base'>Recent Users</CardTitle>
              <Button asChild variant='ghost' size='sm'>
                <Link href='/dashboard/admin/users'>View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {users.length > 0 ? (
              <div className='space-y-3'>
                {users.slice(0, 5).map((user) => (
                  <div key={user.user_id} className='flex items-center justify-between p-3 border rounded hover:bg-gray-50'>
                    <div className='flex items-center gap-3 flex-1 min-w-0'>
                      <div className='h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center font-medium'>
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='font-medium truncate'>{user.username}</div>
                        <div className='text-sm text-muted-foreground truncate'>{user.email}</div>
                        <div className='flex gap-2 mt-1'>
                          <span className={`text-xs px-2 py-0.5 rounded ${ROLE_COLORS[user.role as keyof typeof ROLE_COLORS]}`}>
                            {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] || user.role}
                          </span>
                          {user.locations && user.locations.length > 0 && (
                            <span className='text-xs text-muted-foreground'>
                              {user.locations[0].location_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className='flex gap-1'>
                      <Button size='sm' variant='ghost'>
                        <IconEdit className='h-4 w-4' />
                      </Button>
                      <Button size='sm' variant='ghost'>
                        <IconTrash className='h-4 w-4 text-red-600' />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-12'>
                <p className='text-muted-foreground mb-4'>No users yet</p>
                <UserCreateDialog
                  trigger={<Button size='sm'>Create User</Button>}
                  onUserCreated={() => window.location.reload()}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
