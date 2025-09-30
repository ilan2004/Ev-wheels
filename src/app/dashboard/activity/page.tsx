'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, UserPlus, FilePlus2, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import type { ActivityItem } from '@/app/api/activity/route';

export default function ActivityPage() {
  const [activities, setActivities] = React.useState<ActivityItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/activity?limit=50');
        const data = await res.json();
        
        if (data.success) {
          setActivities(data.data);
        } else {
          setError(data.error || 'Failed to fetch activities');
        }
      } catch (err) {
        setError('Failed to fetch activities');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'ticket_status':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'customer_created':
        return <UserPlus className="h-4 w-4 text-blue-500" />;
      case 'ticket_created':
        return <FilePlus2 className="h-4 w-4 text-purple-500" />;
      case 'payment_received':
        return (
          <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
          </div>
        );
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return then.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const renderActivityContent = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'ticket_status':
        return (
          <div className="flex items-center gap-2 flex-wrap">
            <Link 
              href={`/dashboard/job-cards/${activity.metadata?.ticket_id}`}
              className="font-medium hover:underline"
            >
              {activity.metadata?.ticket_number}
            </Link>
            <span className="text-muted-foreground">status changed to</span>
            <Badge variant="outline" className="text-xs">
              {activity.metadata?.new_status}
            </Badge>
          </div>
        );
      
      case 'customer_created':
        return (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">New customer registered:</span>
            <Link 
              href={`/dashboard/customers/${activity.metadata?.customer_id}`}
              className="font-medium hover:underline"
            >
              {activity.description}
            </Link>
          </div>
        );
      
      case 'ticket_created':
        return (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">New job card:</span>
            <Link 
              href={`/dashboard/job-cards/${activity.metadata?.ticket_id}`}
              className="font-medium hover:underline"
            >
              {activity.description}
            </Link>
          </div>
        );
      
      default:
        return (
          <div>
            <div className="font-medium">{activity.title}</div>
            <div className="text-muted-foreground text-sm">{activity.description}</div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Activity Feed</h1>
          <p className="text-muted-foreground">Recent activity across all operations</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-muted-foreground text-sm">Loading activities...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Activity Feed</h1>
          <p className="text-muted-foreground">Recent activity across all operations</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activity Feed</h1>
        <p className="text-muted-foreground">
          Recent activity across all operations ({activities.length} items)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-muted-foreground text-sm py-8 text-center">
              No recent activity found
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div 
                  key={activity.id} 
                  className="flex items-start gap-3 text-sm pb-4 border-b last:border-b-0 last:pb-0"
                >
                  <div className="mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    {renderActivityContent(activity)}
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatTimeAgo(activity.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
