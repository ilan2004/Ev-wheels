'use client';

import React from 'react';
import { useSidebarData } from '@/hooks/use-sidebar-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SidebarDataDebug() {
  const { data, isLoading, isError, error } = useSidebarData();

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Sidebar Data Debug</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}
          </div>
          <div>
            <strong>Error:</strong> {isError ? 'Yes' : 'No'}
          </div>
          {error && (
            <div>
              <strong>Error Message:</strong> {error.message}
            </div>
          )}
          <div>
            <strong>Raw Data:</strong>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
          
          {data && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
              <div className="p-4 bg-blue-50 rounded">
                <h3 className="font-semibold text-blue-800">Tasks</h3>
                <p className="text-2xl font-bold text-blue-600">{data.totalTasks}</p>
                <p className="text-sm text-blue-600">Total Tasks</p>
              </div>
              
              <div className="p-4 bg-green-50 rounded">
                <h3 className="font-semibold text-green-800">Completed</h3>
                <p className="text-2xl font-bold text-green-600">{data.completedTasks}</p>
                <p className="text-sm text-green-600">Done This Month</p>
              </div>
              
              <div className="p-4 bg-amber-50 rounded">
                <h3 className="font-semibold text-amber-800">Urgent</h3>
                <p className="text-2xl font-bold text-amber-600">{data.urgentTasks}</p>
                <p className="text-sm text-amber-600">Needs Attention</p>
              </div>
              
              <div className="p-4 bg-red-50 rounded">
                <h3 className="font-semibold text-red-800">Job Cards</h3>
                <p className="text-lg font-bold text-red-600">{data.jobCards.total}</p>
                <p className="text-sm text-red-600">Total: {data.jobCards.total}, Urgent: {data.jobCards.urgent}</p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded">
                <h3 className="font-semibold text-purple-800">Batteries</h3>
                <p className="text-lg font-bold text-purple-600">{data.batteries.total}</p>
                <p className="text-sm text-purple-600">Total: {data.batteries.total}, Urgent: {data.batteries.urgent}</p>
              </div>
              
              <div className="p-4 bg-teal-50 rounded">
                <h3 className="font-semibold text-teal-800">Vehicles</h3>
                <p className="text-lg font-bold text-teal-600">{data.vehicles.total}</p>
                <p className="text-sm text-teal-600">Total: {data.vehicles.total}, Overdue: {data.vehicles.overdue}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
