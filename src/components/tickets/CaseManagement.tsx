'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { serviceTicketsApi } from '@/lib/api/service-tickets';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const triageTemplates = [
  'Check fault codes',
  'Test ride recommended',
  'Battery diagnostics needed',
  'Visual inspection complete',
  'Customer complaint verified',
  'Parts required for repair'
];

const triageSchema = z.object({
  routeTo: z.enum(['vehicle', 'battery', 'both']),
  note: z.string().optional()
});

interface CaseManagementProps {
  ticket: any;
  linkedCasesDetails: {
    vehicleCase?: any;
    batteryCase?: any;
  };
  ticketId: string;
  onRefresh?: () => void;
}

export function CaseManagement({
  ticket,
  linkedCasesDetails,
  ticketId,
  onRefresh
}: CaseManagementProps) {
  const hasLinkedCases = ticket.battery_case_id || ticket.vehicle_case_id;
  const hasVehicleCase = ticket.vehicle_case_id;
  const hasBatteryCase = ticket.battery_case_id;

  // Determine default route based on what cases don't exist yet
  const getDefaultRoute = () => {
    if (!hasVehicleCase && !hasBatteryCase) return 'vehicle';
    if (!hasVehicleCase) return 'vehicle';
    if (!hasBatteryCase) return 'battery';
    return 'vehicle'; // fallback
  };

  const triageForm = useForm({
    resolver: zodResolver(triageSchema),
    defaultValues: {
      routeTo: getDefaultRoute() as 'vehicle' | 'battery' | 'both',
      note: ''
    }
  });

  const onTriageSubmit = async (values: z.infer<typeof triageSchema>) => {
    const res = await serviceTicketsApi.triageTicket({
      ticketId,
      routeTo: values.routeTo,
      note: values.note || ''
    });

    if (res.success) {
      toast.success('Ticket triaged successfully');
      triageForm.reset();
      onRefresh?.();
    } else {
      toast.error(res.error || 'Failed to triage ticket');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Case Management & Actions</CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Linked Cases Section */}
        <div className='space-y-4'>
          <h3 className='text-lg font-medium'>Linked Cases</h3>

          {!hasLinkedCases ? (
            <div className='space-y-3'>
              <div className='text-muted-foreground text-sm'>
                No linked cases yet. Use the Triage & Actions section below to
                create cases.
              </div>
            </div>
          ) : (
            <div className='space-y-4'>
              <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                {/* Vehicle Case */}
                {linkedCasesDetails.vehicleCase ? (
                  <div className='rounded-lg border p-4'>
                    <div className='mb-3 flex items-center gap-2'>
                      <h4 className='text-sm font-medium'>Vehicle Case</h4>
                      <Badge
                        variant={
                          linkedCasesDetails.vehicleCase.status === 'completed'
                            ? 'default'
                            : 'secondary'
                        }
                        className='text-xs'
                      >
                        {linkedCasesDetails.vehicleCase.status.replace(
                          '_',
                          ' '
                        )}
                      </Badge>
                    </div>
                    <div className='text-muted-foreground mb-3 space-y-1 text-xs'>
                      <div>
                        Reg:{' '}
                        {linkedCasesDetails.vehicleCase.vehicle_reg_no || 'N/A'}
                      </div>
                      <div>
                        {linkedCasesDetails.vehicleCase.vehicle_make}{' '}
                        {linkedCasesDetails.vehicleCase.vehicle_model}
                      </div>
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      className='w-full'
                      asChild
                    >
                      <Link
                        href={`/dashboard/vehicles/${linkedCasesDetails.vehicleCase.id}`}
                      >
                        View Vehicle Case
                      </Link>
                    </Button>
                  </div>
                ) : hasVehicleCase ? (
                  <div className='rounded-lg border p-4'>
                    <h4 className='mb-2 text-sm font-medium'>Vehicle Case</h4>
                    <div className='text-muted-foreground mb-3 text-xs'>
                      Loading details...
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      className='w-full'
                      asChild
                    >
                      <Link
                        href={`/dashboard/vehicles/${ticket.vehicle_case_id}`}
                      >
                        View Vehicle Case
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className='rounded-lg border border-dashed p-4 text-center'>
                    <div className='text-muted-foreground mb-3 text-sm'>
                      No vehicle case
                    </div>
                    <div className='text-muted-foreground text-xs'>
                      Use Triage & Actions below to create
                    </div>
                  </div>
                )}

                {/* Battery Case */}
                {linkedCasesDetails.batteryCase ? (
                  <div className='rounded-lg border p-4'>
                    <div className='mb-3 flex items-center gap-2'>
                      <h4 className='text-sm font-medium'>Battery Case</h4>
                      <Badge
                        variant={
                          linkedCasesDetails.batteryCase.status === 'completed'
                            ? 'default'
                            : 'secondary'
                        }
                        className='text-xs'
                      >
                        {linkedCasesDetails.batteryCase.status.replace(
                          '_',
                          ' '
                        )}
                      </Badge>
                    </div>
                    <div className='text-muted-foreground mb-3 space-y-1 text-xs'>
                      <div>
                        Serial: {linkedCasesDetails.batteryCase.serial_number}
                      </div>
                      <div>Brand: {linkedCasesDetails.batteryCase.brand}</div>
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      className='w-full'
                      asChild
                    >
                      <Link
                        href={`/dashboard/batteries/${linkedCasesDetails.batteryCase.id}`}
                      >
                        View Battery Case
                      </Link>
                    </Button>
                  </div>
                ) : hasBatteryCase ? (
                  <div className='rounded-lg border p-4'>
                    <h4 className='mb-2 text-sm font-medium'>Battery Case</h4>
                    <div className='text-muted-foreground mb-3 text-xs'>
                      Loading details...
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      className='w-full'
                      asChild
                    >
                      <Link
                        href={`/dashboard/batteries/${ticket.battery_case_id}`}
                      >
                        View Battery Case
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className='rounded-lg border border-dashed p-4 text-center'>
                    <div className='text-muted-foreground mb-3 text-sm'>
                      No battery case
                    </div>
                    <div className='text-muted-foreground text-xs'>
                      Use Triage & Actions below to create
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className='border-t' />

        {/* Triage & Actions Section */}
        <div className='space-y-4'>
          <h3 className='text-lg font-medium'>Triage & Actions</h3>
          <div className='text-muted-foreground text-sm'>
            Use this section to formally triage the ticket and create the
            necessary cases.
          </div>

          {/* Triage templates */}
          <div>
            <div className='mb-2 text-sm font-medium'>Quick Note Templates</div>
            <div className='flex flex-wrap gap-2'>
              {triageTemplates.map((tmpl) => (
                <button
                  key={tmpl}
                  type='button'
                  className='bg-muted hover:bg-secondary rounded px-2 py-1 text-xs'
                  onClick={() => {
                    const curr = triageForm.getValues('note') || '';
                    const sep = curr ? '\n' : '';
                    triageForm.setValue('note', `${curr}${sep}${tmpl}`);
                  }}
                >
                  {tmpl}
                </button>
              ))}
            </div>
          </div>

          {/* Triage Form */}
          <div>
            <div className='mb-3 text-sm font-medium'>
              {!hasLinkedCases
                ? 'Create Cases & Route Ticket'
                : hasVehicleCase && hasBatteryCase
                  ? 'All Cases Created'
                  : 'Create Additional Cases'}
            </div>

            {hasVehicleCase && hasBatteryCase ? (
              <div className='rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700'>
                ✅ Both vehicle and battery cases have been created. This ticket
                has been fully triaged.
              </div>
            ) : (
              <Form {...triageForm}>
                <form
                  onSubmit={triageForm.handleSubmit(onTriageSubmit)}
                  className='space-y-4'
                >
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                    <FormField
                      name='routeTo'
                      control={triageForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Route To</FormLabel>
                          <FormControl>
                            <select
                              className='w-full rounded border px-2 py-2'
                              {...field}
                            >
                              {!hasVehicleCase && (
                                <option value='vehicle'>Vehicle</option>
                              )}
                              {!hasBatteryCase && (
                                <option value='battery'>Battery</option>
                              )}
                              {!hasVehicleCase && !hasBatteryCase && (
                                <option value='both'>Both</option>
                              )}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name='note'
                      control={triageForm.control}
                      render={({ field }) => (
                        <FormItem className='md:col-span-2'>
                          <FormLabel>Triage Note</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder='Add notes about your triage decision...'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className='flex justify-end'>
                    <Button type='submit'>
                      {!hasLinkedCases
                        ? 'Create Cases & Apply Triage'
                        : 'Create Additional Case'}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
