'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { SectionHeader } from '@/components/layout/section-header';
import { serviceTicketsApi } from '@/lib/api/service-tickets';
import { UnifiedMediaUploader } from '@/components/job-cards/unified-media-uploader';
import { CustomerPicker } from '@/components/customers/customer-picker';
import { toast } from 'sonner';
import { ToastManager } from '@/lib/toast-utils';
import PageContainer from '@/components/layout/page-container';
import { useRequireAuth } from '@/lib/auth/use-require-auth';
import { IconCar, IconBattery } from '@tabler/icons-react';
import { DynamicBatteryInputClient } from '@/components/job-cards/dynamic-battery-input-client';

const schema = z.object({
  // What customer is bringing
  item_types: z.object({
    vehicle: z.boolean(),
    battery: z.boolean()
  }).refine(
    data => data.vehicle || data.battery,
    { message: 'Please select at least vehicle or battery' }
  ),
  
  customer_id: z.string().min(1, 'Please select a customer'),
  symptom: z.string().min(1, 'Symptom is required'),
  description: z.string().optional(),
  
  // Vehicle information (conditional)
  vehicle_make: z.string().optional(),
  vehicle_model: z.string().optional(),
  vehicle_reg_no: z.string().optional(),
  vehicle_year: z
    .string()
    .optional()
    .refine(
      (val) =>
        val === undefined ||
        val.trim() === '' ||
        (Number.isFinite(Number(val)) &&
          Number(val) > 1900 &&
          Number(val) < 2100),
      {
        message: 'Enter a valid year'
      }
    ),
    
  // Battery information (array, conditional)
  batteries: z.array(z.object({
    serial_number: z.string().min(1, 'Serial number is required'),
    brand: z.string().min(1, 'Brand is required'),
    model: z.string().optional(),
    battery_type: z.string().min(1, 'Battery type is required'),
    voltage: z.number().min(1, 'Voltage is required'),
    capacity: z.number().min(0.1, 'Capacity is required'),
    cell_type: z.string().min(1, 'Cell type is required'),
    condition_notes: z.string().optional()
  })).optional(),
  
  // For upload widgets (not validated here)
  photos: z.any().optional(),
  audio: z.any().optional()
});

type FormValues = z.input<typeof schema>;

export default function NewServiceTicketPage() {
  // Require an authenticated session to create tickets
  // Redirects to /login if not signed in
  useRequireAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [mandatoryPhotos, setMandatoryPhotos] = useState<Record<string, File>>(
    {}
  );
  const [optionalFiles, setOptionalFiles] = useState<Record<string, File[]>>(
    {}
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      item_types: {
        vehicle: true,
        battery: false
      },
      customer_id: '',
      symptom: '',
      description: '',
      vehicle_make: '',
      vehicle_model: '',
      vehicle_reg_no: '',
      vehicle_year: undefined,
      batteries: [],
      photos: [],
      audio: []
    }
  });

  const createdTicketId = React.useRef<string | null>(null);

  // Track what customer is bringing
  const watchedValues = form.watch();
  const hasVehicle = watchedValues.item_types?.vehicle || false;
  const hasBattery = watchedValues.item_types?.battery || false;
  const batteryCount = watchedValues.batteries?.length || 0;
  
  
  // Track completion for UI feedback
  const mandatoryPhotosCount = Object.keys(mandatoryPhotos).length;
  const mandatoryPhotosComplete = hasVehicle
    ? mandatoryPhotosCount === 4
    : true;
  const totalOptionalFiles = Object.values(optionalFiles).flat().length;

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    let loadingToastId: string | number | null = null;
    
    try {
      // Step 1: Create the service ticket
      loadingToastId = ToastManager.jobCard.creating();
      
      const res = await serviceTicketsApi.createServiceTicket({
        customer_id: values.customer_id,
        symptom: values.symptom,
        description: values.description || null,
        vehicle_make: hasVehicle ? values.vehicle_make || null : null,
        vehicle_model: hasVehicle ? values.vehicle_model || null : null,
        vehicle_reg_no: hasVehicle ? values.vehicle_reg_no || null : null,
        vehicle_year: hasVehicle && values.vehicle_year ? Number(values.vehicle_year) : null
      });
      if (!res.success || !res.data)
        throw new Error(res.error || 'Failed to create job card');
      const newTicketId = res.data.id;
      createdTicketId.current = newTicketId;
      ToastManager.success(loadingToastId, `Job card ${res.data.ticket_number || ''} created successfully`);

      // Step 2: Create battery records if batteries are provided
      let batteryIds: string[] = [];
      if (hasBattery && values.batteries && values.batteries.length > 0) {
        // Update the existing toast to show battery creation progress
        toast.loading('⏳ Creating battery records...', { 
          id: loadingToastId,
          dismissible: true
        });
        
        // Validate and clean battery data
        const cleanedBatteries = values.batteries.map(battery => ({
          serial_number: battery.serial_number.trim(),
          brand: battery.brand.trim(),
          model: battery.model?.trim() || '',
          battery_type: battery.battery_type,
          voltage: Number(battery.voltage),
          capacity: Number(battery.capacity),
          cell_type: battery.cell_type,
          condition_notes: battery.condition_notes?.trim() || ''
        }));
        
        const batteryRes = await serviceTicketsApi.createBatteryRecords({
          ticketId: newTicketId,
          customerId: values.customer_id,
          batteries: cleanedBatteries
        });
        if (!batteryRes.success) {
          throw new Error(batteryRes.error || 'Failed to create battery records');
        }
        batteryIds = batteryRes.data || [];
        
        // Step 3: Link batteries to the ticket and auto-triage
        if (batteryIds.length > 0) {
          const linkRes = await serviceTicketsApi.linkBatteriesToTicket({
            ticketId: newTicketId,
            batteryIds,
            autoTriage: true
          });
          if (!linkRes.success) {
            console.warn('Failed to link batteries:', linkRes.error);
          }
        }
        
        ToastManager.success(loadingToastId, `${batteryIds.length} battery record(s) created successfully`);
      }

      // Step 4: Upload files with proper case linking
      const mandatoryPhotoFiles = Object.values(mandatoryPhotos);
      const optionalPhotoFiles = optionalFiles['additional'] || [];
      const voiceFiles = optionalFiles['voice'] || [];

      // Combine all photos
      const allPhotos = [...mandatoryPhotoFiles, ...optionalPhotoFiles];
      const allAudio = voiceFiles;

      if (allPhotos.length > 0) {
        // Update toast to show photo upload progress
        loadingToastId = ToastManager.file.uploading();
        // For photos, link to battery case if battery-only, otherwise general ticket
        const uploadParams: any = {
          ticketId: newTicketId,
          files: allPhotos,
          type: 'photo' as const
        };
        
        // Link photos to battery case if battery-only workflow
        if (hasBattery && !hasVehicle && batteryIds.length > 0) {
          uploadParams.caseType = 'battery';
          uploadParams.caseId = batteryIds[0]; // Link to primary battery
        }
        
        const up = await serviceTicketsApi.uploadAttachments(uploadParams);
        if (!up.success) throw new Error(up.error || 'Failed to upload photos');
      }

      if (allAudio.length > 0) {
        // Update toast to show audio upload progress (or continue from photo upload)
        if (!loadingToastId) {
          loadingToastId = ToastManager.file.uploading();
        } else {
          toast.loading('⏳ Uploading audio files...', { 
            id: loadingToastId,
            dismissible: true
          });
        }
        // For audio, also link to battery case if battery-only
        const uploadParams: any = {
          ticketId: newTicketId,
          files: allAudio,
          type: 'audio' as const
        };
        
        if (hasBattery && !hasVehicle && batteryIds.length > 0) {
          uploadParams.caseType = 'battery';
          uploadParams.caseId = batteryIds[0];
        }
        
        const upa = await serviceTicketsApi.uploadAttachments(uploadParams);
        if (!upa.success)
          throw new Error(upa.error || 'Failed to upload audio');
      }

      // Final success notification
      if (loadingToastId) {
        ToastManager.success(loadingToastId, 'Job card created successfully! Redirecting...');
      } else {
        ToastManager.success('Job card created successfully! Redirecting...');
      }

      // Navigate to detail page after uploads
      router.push(`/dashboard/job-cards/${newTicketId}`);
    } catch (e) {
      console.error(e);
      if (loadingToastId) {
        ToastManager.error(loadingToastId, e instanceof Error ? e.message : 'Failed to create job card');
      } else {
        ToastManager.error(e instanceof Error ? e.message : 'Failed to create job card');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageContainer>
      <div className='flex flex-col gap-6' suppressHydrationWarning={true}>
        <SectionHeader
          title='Create Job Card'
          description='Log a customer issue and attach intake media.'
        />

        <div className='grid grid-cols-1 gap-6 xl:grid-cols-3'>
          <div className='order-2 xl:order-1 xl:col-span-2'>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-6'
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Customer & Symptom</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                      <FormField
                        control={form.control}
                        name='customer_id'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Customer *</FormLabel>
                            <FormControl>
                              <CustomerPicker
                                value={field.value || null}
                                onChange={(id) => field.onChange(id || '')}
                                allowQuickAdd
                                placeholder='Search or add customer'
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name='symptom'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Symptom *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder='Describe the issue reported by customer'
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* What is customer bringing? */}
                    <div className='space-y-3'>
                      <h3 className='text-sm font-medium'>What is the customer bringing?</h3>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                        <div className={`transition-colors border rounded-lg p-3 ${
                          hasVehicle ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}>
                          <label className='flex items-center space-x-3 cursor-pointer'>
                            <Checkbox
                              checked={hasVehicle}
                              onCheckedChange={(checked) => {
                                form.setValue('item_types.vehicle', checked as boolean);
                                // Clear vehicle fields when unchecking
                                if (!checked) {
                                  form.setValue('vehicle_make', '');
                                  form.setValue('vehicle_model', '');
                                  form.setValue('vehicle_reg_no', '');
                                  form.setValue('vehicle_year', undefined);
                                }
                              }}
                            />
                            <div className='flex-1'>
                              <div className='flex items-center gap-2'>
                                <IconCar className='h-4 w-4' />
                                <span className='font-medium'>Vehicle</span>
                              </div>
                              <p className='text-xs text-muted-foreground'>
                                Electric scooter, bike, or car
                              </p>
                            </div>
                          </label>
                        </div>

                        <div className={`transition-colors border rounded-lg p-3 ${
                          hasBattery ? 'border-green-500 bg-green-50' : 'border-gray-200'
                        }`}>
                          <label className='flex items-center space-x-3 cursor-pointer'>
                            <Checkbox
                              checked={hasBattery}
                              onCheckedChange={(checked) => {
                                form.setValue('item_types.battery', checked as boolean);
                                // Clear batteries when unchecking
                                if (!checked) {
                                  form.setValue('batteries', []);
                                } else {
                                  // Auto-add first battery when checking
                                  if (batteryCount === 0) {
                                    form.setValue('batteries', [{
                                      serial_number: '',
                                      brand: '',
                                      model: '',
                                      battery_type: 'lithium_ion',
                                      voltage: 48,
                                      capacity: 20,
                                      cell_type: 'cylindrical_18650',
                                      condition_notes: ''
                                    }]);
                                  }
                                }
                              }}
                            />
                            <div className='flex-1'>
                              <div className='flex items-center gap-2'>
                                <IconBattery className='h-4 w-4' />
                                <span className='font-medium'>Battery/Batteries</span>
                              </div>
                              <p className='text-xs text-muted-foreground'>
                                Individual battery packs
                              </p>
                            </div>
                          </label>
                        </div>
                      </div>
                      
                      <div className='flex gap-2'>
                        {hasVehicle && (
                          <Badge variant='secondary'>
                            <IconCar className='w-3 h-3 mr-1' />
                            Vehicle
                          </Badge>
                        )}
                        {hasBattery && (
                          <Badge variant='secondary'>
                            <IconBattery className='w-3 h-3 mr-1' />
                            {batteryCount > 0 ? `${batteryCount} Batteries` : 'Batteries'}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Vehicle Details - Only show if vehicle is selected */}
                    {hasVehicle && (
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                      <FormField
                        control={form.control}
                        name='vehicle_make'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vehicle Make</FormLabel>
                            <FormControl>
                              <Input
                                placeholder='e.g., TVS, Bajaj'
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='vehicle_model'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vehicle Model</FormLabel>
                            <FormControl>
                              <Input
                                placeholder='Model (optional)'
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='vehicle_reg_no'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reg No</FormLabel>
                            <FormControl>
                              <Input placeholder='KL-xx-xxxx' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    )}
                  </CardContent>
                </Card>

                {/* Battery Information - Only show if battery is selected */}
                {hasBattery && (
                  <DynamicBatteryInputClient
                    control={form.control}
                    name="batteries"
                  />
                )}

                {/* Enhanced Media Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle>Media Upload</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <UnifiedMediaUploader
                      intakeType={hasVehicle ? 'vehicle' : 'battery'}
                      onMandatoryPhotosChange={setMandatoryPhotos}
                      onOptionalFilesChange={setOptionalFiles}
                    />
                  </CardContent>
                </Card>

                <div className='flex items-center justify-end gap-3'>
                  <Button
                    type='button'
                    variant='secondary'
                    onClick={() => router.push('/dashboard')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type='submit'
                    disabled={
                      isSubmitting ||
                      (hasVehicle && !mandatoryPhotosComplete) ||
                      (!hasVehicle && !hasBattery)
                    }
                  >
                    {isSubmitting ? 'Saving...' : 'Save Ticket'}
                    {mandatoryPhotosCount + totalOptionalFiles > 0 && (
                      <span className='ml-1 text-xs opacity-75'>
                        ({mandatoryPhotosCount + totalOptionalFiles} file
                        {mandatoryPhotosCount + totalOptionalFiles !== 1
                          ? 's'
                          : ''}
                        )
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
          <div className='order-1 xl:order-2'>
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className='text-muted-foreground space-y-3 text-sm'>
                <div className='rounded-lg border border-blue-200 bg-blue-50 p-3'>
                  <p className='mb-2 text-sm font-semibold text-blue-900'>
                    📸 Media Upload
                  </p>
                  <div className='space-y-1.5 text-xs text-blue-800'>
                    {hasVehicle && (
                      <>
                        <p>
                          • <strong>Vehicle:</strong> 4 required photos (Front,
                          Rear, Left, Right)
                        </p>
                        <div className='mt-1 border-t border-blue-200 pt-1'>
                          <div className='flex items-center justify-between'>
                            <span>Required Photos:</span>
                            <span className='font-bold'>
                              {mandatoryPhotosCount} / 4{' '}
                              {mandatoryPhotosComplete && '✓'}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                    {hasBattery && (
                      <>
                        <p>
                          • <strong>Batteries:</strong> Photos and specifications
                        </p>
                        {batteryCount > 0 && (
                          <div className='mt-1 border-t border-blue-200 pt-1'>
                            <div className='flex items-center justify-between'>
                              <span>Batteries Added:</span>
                              <span className='font-bold'>{batteryCount}</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    {totalOptionalFiles > 0 && (
                      <div className='mt-2 border-t border-blue-200 pt-2'>
                        <div className='flex items-center justify-between'>
                          <span>Media Files:</span>
                          <span className='font-bold'>{totalOptionalFiles}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <p className='text-xs'>
                  <strong>💡 Enhanced Interface:</strong> Select what the customer
                  is bringing (vehicle/battery/both), then add details and media
                  accordingly.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
