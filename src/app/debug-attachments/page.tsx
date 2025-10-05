'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function DebugAttachmentsPage() {
  const [ticketId, setTicketId] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!ticketId.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/debug/attachments?ticketId=${ticketId}`
      );
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
      setData({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='container mx-auto max-w-6xl p-6'>
      <h1 className='mb-6 text-3xl font-bold'>Attachment Debugger</h1>

      <Card className='mb-6'>
        <CardHeader>
          <CardTitle>Enter Ticket ID</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex gap-2'>
            <Input
              placeholder='Ticket ID (UUID)'
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              className='font-mono'
            />
            <Button onClick={fetchData} disabled={loading}>
              {loading ? 'Loading...' : 'Check'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {data && !data.error && (
        <>
          <Card className='mb-6'>
            <CardHeader>
              <CardTitle>Ticket Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <strong>Ticket ID:</strong>
                  <div className='font-mono text-xs'>{data.ticket.id}</div>
                </div>
                <div>
                  <strong>Ticket Number:</strong>
                  <div>{data.ticket.ticket_number}</div>
                </div>
                <div>
                  <strong>Status:</strong>
                  <div className='capitalize'>{data.ticket.status}</div>
                </div>
                <div>
                  <strong>Vehicle Case ID:</strong>
                  <div className='font-mono text-xs'>
                    {data.ticket.vehicle_case_id || '❌ None'}
                  </div>
                </div>
                <div>
                  <strong>Battery Case ID:</strong>
                  <div className='font-mono text-xs'>
                    {data.ticket.battery_case_id || '❌ None'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {data.vehicleCase && (
            <Card className='mb-6'>
              <CardHeader>
                <CardTitle>Vehicle Case</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-2 gap-4 text-sm'>
                  <div>
                    <strong>Case ID:</strong>
                    <div className='font-mono text-xs'>
                      {data.vehicleCase.id}
                    </div>
                  </div>
                  <div>
                    <strong>Reg No:</strong>
                    <div>{data.vehicleCase.vehicle_reg_no}</div>
                  </div>
                  <div>
                    <strong>Status:</strong>
                    <div className='capitalize'>{data.vehicleCase.status}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className='mb-6'>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
                <div className='rounded bg-blue-50 p-4 text-center'>
                  <div className='text-3xl font-bold text-blue-600'>
                    {data.summary.total_attachments}
                  </div>
                  <div className='text-sm text-gray-600'>Total Attachments</div>
                </div>
                <div className='rounded bg-green-50 p-4 text-center'>
                  <div className='text-3xl font-bold text-green-600'>
                    {data.summary.vehicle_attachments}
                  </div>
                  <div className='text-sm text-gray-600'>Vehicle Linked</div>
                </div>
                <div className='rounded bg-purple-50 p-4 text-center'>
                  <div className='text-3xl font-bold text-purple-600'>
                    {data.summary.battery_attachments}
                  </div>
                  <div className='text-sm text-gray-600'>Battery Linked</div>
                </div>
                <div className='rounded bg-yellow-50 p-4 text-center'>
                  <div className='text-3xl font-bold text-yellow-600'>
                    {data.summary.unlinked_attachments}
                  </div>
                  <div className='text-sm text-gray-600'>Unlinked</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attachments Detail</CardTitle>
            </CardHeader>
            <CardContent>
              {data.attachments.length === 0 ? (
                <div className='py-8 text-center text-gray-500'>
                  No attachments found for this ticket
                </div>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='border-b'>
                        <th className='p-2 text-left'>File Name</th>
                        <th className='p-2 text-left'>Type</th>
                        <th className='p-2 text-left'>Case Type</th>
                        <th className='p-2 text-left'>Case ID</th>
                        <th className='p-2 text-left'>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.attachments.map((att: any) => (
                        <tr key={att.id} className='border-b hover:bg-gray-50'>
                          <td className='p-2'>{att.original_name}</td>
                          <td className='p-2'>
                            <span className='rounded bg-blue-100 px-2 py-1 text-xs text-blue-700'>
                              {att.attachment_type}
                            </span>
                          </td>
                          <td className='p-2'>
                            {att.case_type ? (
                              <span className='rounded bg-green-100 px-2 py-1 text-xs text-green-700'>
                                {att.case_type}
                              </span>
                            ) : (
                              <span className='rounded bg-gray-100 px-2 py-1 text-xs text-gray-500'>
                                none
                              </span>
                            )}
                          </td>
                          <td className='p-2 font-mono text-xs'>
                            {att.case_id ? (
                              att.case_id.substring(0, 8) + '...'
                            ) : (
                              <span className='text-gray-400'>null</span>
                            )}
                          </td>
                          <td className='p-2'>
                            {!att.case_id ? (
                              <span className='text-yellow-600'>
                                ⚠ Unlinked
                              </span>
                            ) : att.case_id === data.ticket.vehicle_case_id ? (
                              <span className='text-green-600'>
                                ✓ Vehicle Match
                              </span>
                            ) : att.case_id === data.ticket.battery_case_id ? (
                              <span className='text-purple-600'>
                                ✓ Battery Match
                              </span>
                            ) : (
                              <span className='text-red-600'>✗ Mismatch</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {data?.error && (
        <Card>
          <CardHeader>
            <CardTitle className='text-red-600'>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className='overflow-x-auto rounded bg-red-50 p-4 text-sm'>
              {JSON.stringify(data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
