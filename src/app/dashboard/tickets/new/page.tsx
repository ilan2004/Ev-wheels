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
import {
  FormFileUpload,
  FileUploadConfig
} from '@/components/forms/form-file-upload';
import CaptureControls from '@/components/media/capture-controls';
import { CustomerPicker } from '@/components/customers/customer-picker';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';
import { useRequireAuth } from '@/lib/auth/use-require-auth';

const schema = z.object({
  customer_id: z.string().min(1, 'Please select a customer'),
  symptom: z.string().min(1, 'Symptom is required'),
  description: z.string().optional(),
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

  const [photoProgresses, setPhotoProgresses] = useState<
    Record<string, number>
  >({});
  const [audioProgresses, setAudioProgresses] = useState<
    Record<string, number>
  >({});

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customer_id: '',
      symptom: '',
      description: '',
      vehicle_make: '',
      vehicle_model: '',
      vehicle_reg_no: '',
      vehicle_year: undefined,
      photos: [],
      audio: []
    }
  });

  const photoUploadConfig: FileUploadConfig = useMemo(
    () => ({
      acceptedTypes: ['image/*'],
      maxFiles: 8,
      multiple: true,
      maxSize: 10 * 1024 * 1024,
      progresses: photoProgresses
    }),
    [photoProgresses]
  );

  const audioUploadConfig: FileUploadConfig = useMemo(
    () => ({
      acceptedTypes: ['audio/*'],
      maxFiles: 3,
      multiple: true,
      maxSize: 15 * 1024 * 1024,
      progresses: audioProgresses
    }),
    [audioProgresses]
  );

  const createdTicketId = React.useRef<string | null>(null);

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const res = await serviceTicketsApi.createServiceTicket({
        customer_id: values.customer_id,
        symptom: values.symptom,
        description: values.description || null,
        vehicle_make: values.vehicle_make || null,
        vehicle_model: values.vehicle_model || null,
        vehicle_reg_no: values.vehicle_reg_no || null,
        vehicle_year: values.vehicle_year ? Number(values.vehicle_year) : null
      });
      if (!res.success || !res.data)
        throw new Error(res.error || 'Failed to create job card');
      const newTicketId = res.data.id;
      createdTicketId.current = newTicketId;
      toast.success(`Job card ${res.data.ticket_number || ''} created`);

      // If user added files in the form, upload them now before navigating
      const photos = (values.photos as unknown as File[]) || [];
      const audio = (values.audio as unknown as File[]) || [];

      if (photos.length > 0) {
        const up = await serviceTicketsApi.uploadAttachments({
          ticketId: newTicketId,
          files: photos,
          type: 'photo',
          onProgress: (file, progress) =>
            setPhotoProgresses((p) => ({ ...p, [file.name]: progress }))
        });
        if (!up.success) throw new Error(up.error || 'Failed to upload photos');
      }

      if (audio.length > 0) {
        const upa = await serviceTicketsApi.uploadAttachments({
          ticketId: newTicketId,
          files: audio,
          type: 'audio',
          onProgress: (file, progress) =>
            setAudioProgresses((p) => ({ ...p, [file.name]: progress }))
        });
        if (!upa.success)
          throw new Error(upa.error || 'Failed to upload audio');
      }

      // Navigate to detail page after uploads
      router.push(`/dashboard/job-cards/${newTicketId}`);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Failed to create job card');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageContainer>
      <div className='flex flex-col gap-6'>
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
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Media Attachments</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-6'>
                    <div className='space-y-2'>
                      <FormFileUpload
                        control={form.control}
                        name={'photos' as any}
                        label='Photos'
                        description='Upload intake photos (up to 8, 10MB each)'
                        config={photoUploadConfig}
                        className=''
                      />
                      <CaptureControls
                        onPhotos={(files) => {
                          const current =
                            (form.getValues('photos') as unknown as File[]) ||
                            [];
                          form.setValue('photos' as any, [
                            ...current,
                            ...files
                          ]);
                        }}
                      />
                    </div>

                    <div className='space-y-2'>
                      <FormFileUpload
                        control={form.control}
                        name={'audio' as any}
                        label='Voice Notes'
                        description='Upload short voice notes (up to 3, 15MB each)'
                        config={audioUploadConfig}
                        className=''
                      />
                      <CaptureControls
                        onAudio={(files) => {
                          const current =
                            (form.getValues('audio') as unknown as File[]) ||
                            [];
                          form.setValue('audio' as any, [...current, ...files]);
                        }}
                      />
                    </div>
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
                  <Button type='submit' disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Ticket'}
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
              <CardContent className='text-muted-foreground space-y-2 text-sm'>
                <p>
                  Photos and audio uploads will start after the ticket is
                  created. You can add more later from the ticket page.
                </p>
                <p>
                  Customer creation will be added as a quick action in a later
                  iteration.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
