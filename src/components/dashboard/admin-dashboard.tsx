'use client';

import { User } from '@clerk/nextjs/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  IconBattery, 
  IconUsers, 
  IconPackage, 
  IconReceipt, 
  IconTrendingUp,
  IconSettings,
  IconShield,
  IconAlertTriangle,
  IconPlus,
  IconCalendar,
  IconClock
} from '@tabler/icons-react';
import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';

interface AdminDashboardProps {
  user: User;
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const userName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Administrator';

  return (
    <PageContainer>
      <div className="space-y-6 w-full">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {userName}!</h1>
          <p className="text-muted-foreground">
            Here's what's happening at E-Wheels today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-3 py-1">
            Administrator
          </Badge>
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long',
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batteries</CardTitle>
            <IconBattery className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245</div>
            <p className="text-xs text-muted-foreground">
              +12 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">
              +7 new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹2,45,890</div>
            <p className="text-xs text-muted-foreground">
              +15.2% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Repairs</CardTitle>
            <IconClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              8 urgent repairs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconPlus className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Frequently used admin functions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/batteries/new" className="justify-start">
                  <IconBattery className="mr-2 h-4 w-4" />
                  Add Battery Record
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/customers/new" className="justify-start">
                  <IconUsers className="mr-2 h-4 w-4" />
                  Add Customer
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/users/new" className="justify-start">
                  <IconShield className="mr-2 h-4 w-4" />
                  Add User
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/invoices/quote/new" className="justify-start">
                  <IconReceipt className="mr-2 h-4 w-4" />
                  Generate Quote
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconAlertTriangle className="h-5 w-5 text-orange-500" />
              System Alerts
            </CardTitle>
            <CardDescription>
              Items requiring your attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-2 bg-orange-50 rounded-lg border border-orange-200">
              <IconPackage className="h-4 w-4 text-orange-600" />
              <div className="text-sm">
                <div className="font-medium text-orange-900">Low Stock Alert</div>
                <div className="text-orange-700">5 items below minimum threshold</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 bg-red-50 rounded-lg border border-red-200">
              <IconClock className="h-4 w-4 text-red-600" />
              <div className="text-sm">
                <div className="font-medium text-red-900">Overdue Repairs</div>
                <div className="text-red-700">3 batteries past promised delivery</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
              <IconUsers className="h-4 w-4 text-blue-600" />
              <div className="text-sm">
                <div className="font-medium text-blue-900">New User Request</div>
                <div className="text-blue-700">2 pending role assignments</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Sections */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconBattery className="h-5 w-5 text-green-600" />
              Battery Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Manage battery records, repairs, and status tracking
            </div>
            <Button asChild size="sm" className="w-full">
              <Link href="/dashboard/batteries">
                View All Batteries
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconTrendingUp className="h-5 w-5 text-blue-600" />
              Reports & Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Financial reports, performance metrics, and insights
            </div>
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link href="/dashboard/reports">
                View Reports
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconSettings className="h-5 w-5 text-gray-600" />
              System Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              User management, system configuration, and logs
            </div>
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link href="/dashboard/settings">
                Manage Settings
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCalendar className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest system activities and changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-2 rounded-lg border">
              <IconBattery className="h-4 w-4 text-green-600" />
              <div className="flex-1 text-sm">
                <div className="font-medium">New battery record created</div>
                <div className="text-muted-foreground">72V 39Ah battery for customer Basheer - 2 hours ago</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-lg border">
              <IconUsers className="h-4 w-4 text-blue-600" />
              <div className="flex-1 text-sm">
                <div className="font-medium">New customer registered</div>
                <div className="text-muted-foreground">Anand (9846161043) - 4 hours ago</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-lg border">
              <IconReceipt className="h-4 w-4 text-purple-600" />
              <div className="flex-1 text-sm">
                <div className="font-medium">Invoice generated</div>
                <div className="text-muted-foreground">₹4,500 for battery replacement - 6 hours ago</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </PageContainer>
  );
}
