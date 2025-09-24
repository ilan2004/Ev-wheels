'use client';

import { User } from '@clerk/nextjs/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  IconBattery, 
  IconUsers, 
  IconClipboardList, 
  IconPrinter, 
  IconTool,
  IconAlertTriangle,
  IconCircleCheck,
  IconClock,
  IconCalendar,
  IconPlus
} from '@tabler/icons-react';
import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';

interface TechnicianDashboardProps {
  user: User;
}

export function TechnicianDashboard({ user }: TechnicianDashboardProps) {
  const userName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Technician';

  return (
    <PageContainer>
      <div className="space-y-6 w-full">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Good morning, {userName}!</h1>
          <p className="text-muted-foreground">
            Ready to get some batteries fixed today?
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 border-blue-200 text-blue-700">
            Technician
          </Badge>
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long',
              month: 'short', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>

      {/* Today's Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Assigned Tasks</CardTitle>
            <IconClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              8 in progress, 4 pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <IconCheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              Great progress!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Repairs</CardTitle>
            <IconAlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Promised for today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <IconCalendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">
              batteries repaired
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
              Common tasks for battery service
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="default" size="sm" className="w-full justify-start">
              <Link href="/dashboard/batteries/new">
                <IconBattery className="mr-2 h-4 w-4" />
                New Battery Record
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full justify-start">
              <Link href="/dashboard/invoices/quote/new">
                <IconClipboardList className="mr-2 h-4 w-4" />
                Generate Quote
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full justify-start">
              <Link href="/dashboard/invoices/labels">
                <IconPrinter className="mr-2 h-4 w-4" />
                Print Labels
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full justify-start">
              <Link href="/dashboard/customers">
                <IconUsers className="mr-2 h-4 w-4" />
                Customer Lookup
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconTool className="h-5 w-5 text-blue-600" />
              Today's Priority Tasks
            </CardTitle>
            <CardDescription>
              Focus on these repairs first
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 bg-red-50 rounded-lg border border-red-200">
                <IconAlertTriangle className="h-4 w-4 text-red-600" />
                <div className="flex-1 text-sm">
                  <div className="font-medium text-red-900">72V 39Ah - Basheer</div>
                  <div className="text-red-700">Promised delivery today</div>
                </div>
                <Badge variant="destructive" className="text-xs">Urgent</Badge>
              </div>
              
              <div className="flex items-center gap-3 p-2 bg-orange-50 rounded-lg border border-orange-200">
                <IconClock className="h-4 w-4 text-orange-600" />
                <div className="flex-1 text-sm">
                  <div className="font-medium text-orange-900">60V 26Ah - Gafoor</div>
                  <div className="text-orange-700">Due tomorrow</div>
                </div>
                <Badge variant="secondary" className="text-xs">High</Badge>
              </div>
              
              <div className="flex items-center gap-3 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                <IconBattery className="h-4 w-4 text-yellow-600" />
                <div className="flex-1 text-sm">
                  <div className="font-medium text-yellow-900">48V 30Ah - Jamsheer</div>
                  <div className="text-yellow-700">Cell balancing needed</div>
                </div>
                <Badge variant="outline" className="text-xs">Medium</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Work Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconClipboardList className="h-5 w-5" />
            Current Work Status
          </CardTitle>
          <CardDescription>
            Track your repair progress and workload
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Today's Tasks</span>
                <span className="text-sm text-muted-foreground">5 of 12 completed</span>
              </div>
              <Progress value={42} className="h-2" />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">This Week's Goal</span>
                <span className="text-sm text-muted-foreground">28 of 35 batteries</span>
              </div>
              <Progress value={80} className="h-2" />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Quality Score</span>
                <span className="text-sm text-muted-foreground">96% (Excellent)</span>
              </div>
              <Progress value={96} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Work */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconCheckCircle className="h-5 w-5 text-green-600" />
              Recently Completed
            </CardTitle>
            <CardDescription>
              Your latest successful repairs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-2 rounded-lg border border-green-200 bg-green-50">
              <IconBattery className="h-4 w-4 text-green-600" />
              <div className="flex-1 text-sm">
                <div className="font-medium text-green-900">51V 30Ah - Binu</div>
                <div className="text-green-700">Completed 2 hours ago</div>
              </div>
              <Badge variant="outline" className="text-xs text-green-700">₹3,300</Badge>
            </div>
            
            <div className="flex items-center gap-3 p-2 rounded-lg border border-green-200 bg-green-50">
              <IconBattery className="h-4 w-4 text-green-600" />
              <div className="flex-1 text-sm">
                <div className="font-medium text-green-900">72V 26Ah - Mishal</div>
                <div className="text-green-700">Completed 4 hours ago</div>
              </div>
              <Badge variant="outline" className="text-xs text-green-700">₹4,500</Badge>
            </div>
            
            <div className="flex items-center gap-3 p-2 rounded-lg border border-green-200 bg-green-50">
              <IconBattery className="h-4 w-4 text-green-600" />
              <div className="flex-1 text-sm">
                <div className="font-medium text-green-900">TVS 48V 31Ah</div>
                <div className="text-green-700">Cell balancing - 6 hours ago</div>
              </div>
              <Badge variant="outline" className="text-xs text-green-700">₹1,200</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconUsers className="h-5 w-5 text-blue-600" />
              Customer Interactions
            </CardTitle>
            <CardDescription>
              Recent customer communications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-2 rounded-lg border">
              <IconUsers className="h-4 w-4 text-blue-600" />
              <div className="flex-1 text-sm">
                <div className="font-medium">New customer: Ramees</div>
                <div className="text-muted-foreground">62.9V 30Ah battery assessment</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-2 rounded-lg border">
              <IconClipboardList className="h-4 w-4 text-purple-600" />
              <div className="flex-1 text-sm">
                <div className="font-medium">Quote sent to Dhanesh</div>
                <div className="text-muted-foreground">TVS battery repair estimate</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-2 rounded-lg border">
              <IconCheckCircle className="h-4 w-4 text-green-600" />
              <div className="flex-1 text-sm">
                <div className="font-medium">Delivery to Afzal</div>
                <div className="text-muted-foreground">60V 26Ah repair completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>
            Your work statistics for this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 rounded-lg bg-blue-50">
              <div className="text-2xl font-bold text-blue-600">134</div>
              <div className="text-sm text-blue-700">Batteries Repaired</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-50">
              <div className="text-2xl font-bold text-green-600">98%</div>
              <div className="text-sm text-green-700">Success Rate</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-purple-50">
              <div className="text-2xl font-bold text-purple-600">₹1,67,200</div>
              <div className="text-sm text-purple-700">Revenue Generated</div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </PageContainer>
  );
}
