'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { BatteryType, CellType, BatteryFormData } from '@/types/bms';
import { CustomerPicker } from '@/components/customers/customer-picker';
import {
  IconDeviceFloppy,
  IconX,
  IconUser,
  IconBattery
} from '@tabler/icons-react';
import { batteryApi } from '@/lib/api/batteries';

// Form validation schema
const batteryFormSchema = z.object({
  serial_number: z.string().min(1, 'Serial number is required'),
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().optional(),
  battery_type: z.nativeEnum(BatteryType),
  voltage: z.number().min(1, 'Voltage must be greater than 0'),
  capacity: z.number().min(1, 'Capacity must be greater than 0'),
  cell_type: z.nativeEnum(CellType),
  customer_id: z.string().min(1, 'Please select a customer'),
  repair_notes: z.string().min(1, 'Initial repair notes are required'),
  estimated_cost: z.number().optional()
});

type BatteryFormValues = z.infer<typeof batteryFormSchema>;

interface BatteryFormProps {
  initialData?: Partial<BatteryFormData>;
  isEditing?: boolean;
}

// Customers loaded from Supabase

const commonBrands = [
  'E-Wheels',
  'TVS',
  'PURE',
  'Okinawa',
  'Ampere',
  'Ather',
  'Hero Electric',
  'Bajaj',
  'Komaki',
  'Other'
];

export function BatteryForm({
  initialData,
  isEditing = false
}: BatteryFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<BatteryFormValues>({
    resolver: zodResolver(batteryFormSchema),
    defaultValues: {
      serial_number: initialData?.serial_number || '',
      brand: initialData?.brand || '',
      model: initialData?.model || '',
      battery_type: initialData?.battery_type || BatteryType.LITHIUM_ION,
      voltage: initialData?.voltage || 48,
      capacity: initialData?.capacity || 20,
      cell_type: initialData?.cell_type || CellType.CYLINDRICAL_18650,
      customer_id: initialData?.customer_id || '',
      repair_notes: initialData?.repair_notes || '',
      estimated_cost: initialData?.estimated_cost || undefined
    }
  });

  const onSubmit = async (data: BatteryFormValues) => {
    setIsLoading(true);
    try {
      const res = await batteryApi.createBattery(data);
      if (!res.success)
        throw new Error(res.error || 'Failed to create battery');
      // Navigate back to batteries list
      router.push('/dashboard/batteries');
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onCancel = () => {
    router.push('/dashboard/batteries');
  };

  return (
    <div className='grid grid-cols-1 gap-6 xl:grid-cols-3'>
      {/* Main Form */}
      <div className='order-2 xl:order-1 xl:col-span-2'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Battery Information */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <IconBattery className='h-5 w-5' />
                  Battery Information
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='serial_number'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Serial Number *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Enter serial number'
                            {...field}
                            className='font-mono'
                          />
                        </FormControl>
                        <FormDescription>
                          Unique battery identifier
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='brand'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select brand' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {commonBrands.map((brand) => (
                              <SelectItem key={brand} value={brand}>
                                {brand}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='model'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Battery model (optional)'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='battery_type'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Battery Type *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select battery type' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={BatteryType.LITHIUM_ION}>
                              Lithium-Ion
                            </SelectItem>
                            <SelectItem value={BatteryType.LFP}>
                              LFP (LiFePO4)
                            </SelectItem>
                            <SelectItem value={BatteryType.NMC}>NMC</SelectItem>
                            <SelectItem value={BatteryType.OTHER}>
                              Other
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                  <FormField
                    control={form.control}
                    name='voltage'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Voltage (V) *</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            placeholder='48'
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='capacity'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacity (Ah) *</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            step='0.1'
                            placeholder='20.0'
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='cell_type'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cell Type *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Cell type' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={CellType.CYLINDRICAL_18650}>
                              18650
                            </SelectItem>
                            <SelectItem value={CellType.CYLINDRICAL_21700}>
                              21700
                            </SelectItem>
                            <SelectItem value={CellType.PRISMATIC}>
                              Prismatic
                            </SelectItem>
                            <SelectItem value={CellType.POUCH}>
                              Pouch
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <IconUser className='h-5 w-5' />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                      <FormDescription>
                        Select or quickly add the customer who owns this battery
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Service Information */}
            <Card>
              <CardHeader>
                <CardTitle>Service Information</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <FormField
                  control={form.control}
                  name='repair_notes'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Repair Notes *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='Describe the initial condition, customer complaints, or visible issues...'
                          className='min-h-[100px]'
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Document the initial condition and any customer
                        complaints
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='estimated_cost'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Cost (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          placeholder='Optional initial estimate'
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? Number(e.target.value)
                                : undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Rough estimate based on initial assessment (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className='flex justify-end gap-4'>
              <Button type='button' variant='outline' onClick={onCancel}>
                <IconX className='mr-2 h-4 w-4' />
                Cancel
              </Button>
              <Button type='submit' disabled={isLoading}>
                <IconDeviceFloppy className='mr-2 h-4 w-4' />
                {isLoading
                  ? 'Saving...'
                  : isEditing
                    ? 'Update Battery'
                    : 'Add Battery'}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Sidebar Information */}
      <div className='order-1 space-y-6 xl:order-2'>
        <Card>
          <CardHeader>
            <CardTitle>Quick Tips</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4 text-sm'>
            <div>
              <h4 className='mb-2 font-medium'>Serial Number</h4>
              <p className='text-muted-foreground'>
                Usually found on a label on the battery. Include all characters
                and numbers.
              </p>
            </div>

            <div>
              <h4 className='mb-2 font-medium'>Battery Types</h4>
              <ul className='text-muted-foreground space-y-1'>
                <li>
                  • <strong>Li-Ion</strong>: General lithium-ion
                </li>
                <li>
                  • <strong>LFP</strong>: Lithium Iron Phosphate
                </li>
                <li>
                  • <strong>NMC</strong>: Nickel Manganese Cobalt
                </li>
              </ul>
            </div>

            <div>
              <h4 className='mb-2 font-medium'>Cell Types</h4>
              <ul className='text-muted-foreground space-y-1'>
                <li>
                  • <strong>18650</strong>: Standard cylindrical
                </li>
                <li>
                  • <strong>21700</strong>: Larger cylindrical
                </li>
                <li>
                  • <strong>Prismatic</strong>: Rectangular hard case
                </li>
                <li>
                  • <strong>Pouch</strong>: Flexible packaging
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent className='text-sm'>
            <p className='text-muted-foreground mb-3'>
              After adding the battery, you can:
            </p>
            <ul className='text-muted-foreground space-y-2'>
              <li>• Run initial diagnostics</li>
              <li>• Update repair status</li>
              <li>• Generate QR code label</li>
              <li>• Create detailed estimate</li>
              <li>• Track repair progress</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
