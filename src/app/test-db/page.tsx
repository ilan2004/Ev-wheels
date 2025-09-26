'use client';

import { useEffect, useState } from 'react';
import { testDatabaseConnection, getTestBattery } from '@/lib/api/test-connection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestDatabasePage() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [testBattery, setTestBattery] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDatabaseTest = async () => {
    setLoading(true);
    try {
      const result = await testDatabaseConnection();
      setIsConnected(result);
      
      if (result) {
        const battery = await getTestBattery();
        setTestBattery(battery);
      }
    } catch (error) {
      console.error('Test failed:', error);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDatabaseTest();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Database Connection Test</h1>
        <p className="text-muted-foreground">
          This page tests the connection to your Supabase database and verifies the BMS schema.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span>Testing database connection...</span>
            </div>
          )}
          
          {!loading && isConnected === true && (
            <div className="text-green-600 flex items-center gap-2">
              <span className="text-2xl">✅</span>
              <span className="font-semibold">Database connected successfully!</span>
            </div>
          )}
          
          {!loading && isConnected === false && (
            <div className="text-red-600 flex items-center gap-2">
              <span className="text-2xl">❌</span>
              <span className="font-semibold">Database connection failed!</span>
            </div>
          )}
          
          {!loading && isConnected === null && (
            <div className="text-gray-600">
              Connection status unknown
            </div>
          )}
          
          <div className="mt-4">
            <Button onClick={runDatabaseTest} disabled={loading}>
              {loading ? 'Testing...' : 'Test Again'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {testBattery && (
        <Card>
          <CardHeader>
            <CardTitle>Sample Battery Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div><strong>ID:</strong> {testBattery.id}</div>
              <div><strong>Serial Number:</strong> {testBattery.serial_number}</div>
              <div><strong>Brand:</strong> {testBattery.brand}</div>
              <div><strong>Voltage:</strong> {testBattery.voltage}V</div>
              <div><strong>Capacity:</strong> {testBattery.capacity}Ah</div>
              <div><strong>Status:</strong> {testBattery.status}</div>
              {testBattery.customer && (
                <div><strong>Customer:</strong> {testBattery.customer.name}</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          {isConnected ? (
            <div className="space-y-2">
              <p>✅ Your database is properly set up!</p>
              <p>🚀 You can now navigate to the battery details page to test the full functionality:</p>
              <div className="mt-4">
                <Button asChild>
                  <a href="/dashboard/batteries">Go to Batteries</a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p>❌ Your database schema needs to be set up.</p>
              <p>📝 Please run the SQL schema in your Supabase dashboard:</p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Go to your Supabase project dashboard</li>
                <li>Navigate to SQL Editor</li>
                <li>Copy the contents of <code>src/lib/database/bms-schema.sql</code></li>
                <li>Paste and execute the SQL</li>
                <li>Refresh this page to test again</li>
              </ol>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
