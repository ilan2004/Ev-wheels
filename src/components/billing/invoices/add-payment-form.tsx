'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreatePaymentFormData,
  createPaymentSchema
} from '@/lib/billing/schemas';
import { PaymentMethod } from '@/types/billing';
import { formatCurrency } from '@/lib/billing/calculations';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  IconCalendar,
  IconCreditCard,
  IconCheck,
  IconX
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AddPaymentFormProps {
  invoiceId: string;
  balanceDue: number;
  onSubmit: (data: CreatePaymentFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function AddPaymentForm({
  invoiceId,
  balanceDue,
  onSubmit,
  onCancel,
  loading = false
}: AddPaymentFormProps) {
  const form = useForm<CreatePaymentFormData>({
    resolver: zodResolver(createPaymentSchema),
    defaultValues: {
      invoiceId,
      amount: balanceDue,
      method: PaymentMethod.BANK_TRANSFER,
      reference: '',
      notes: '',
      receivedAt: new Date()
    }
  });

  const { control, handleSubmit, watch, setValue } = form;
  const watchedAmount = watch('amount');

  const paymentMethods = [
    { value: PaymentMethod.CASH, label: 'Cash' },
    { value: PaymentMethod.CARD, label: 'Card' },
    { value: PaymentMethod.BANK_TRANSFER, label: 'Bank Transfer' },
    { value: PaymentMethod.UPI, label: 'UPI' },
    { value: PaymentMethod.CHEQUE, label: 'Cheque' }
  ];

  const handleFullPayment = () => {
    setValue('amount', balanceDue);
  };

  const handleFormSubmit = (data: CreatePaymentFormData) => {
    onSubmit(data);
  };

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <IconCreditCard className='h-5 w-5' />
            Add Payment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={handleSubmit(handleFormSubmit)}
              className='space-y-4'
            >
              {/* Payment Summary */}
              <div className='bg-muted/50 grid gap-4 rounded-lg p-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground text-sm'>
                    Balance Due:
                  </span>
                  <span className='font-medium'>
                    {formatCurrency(balanceDue)}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground text-sm'>
                    Payment Amount:
                  </span>
                  <span className='font-medium text-green-600'>
                    {formatCurrency(watchedAmount || 0)}
                  </span>
                </div>
                <div className='flex items-center justify-between border-t pt-2'>
                  <span className='text-sm font-medium'>
                    Remaining Balance:
                  </span>
                  <span
                    className={cn(
                      'font-medium',
                      balanceDue - (watchedAmount || 0) > 0
                        ? 'text-orange-600'
                        : 'text-green-600'
                    )}
                  >
                    {formatCurrency(balanceDue - (watchedAmount || 0))}
                  </span>
                </div>
              </div>

              {/* Payment Amount */}
              <div className='grid gap-4 md:grid-cols-2'>
                <FormField
                  control={control}
                  name='amount'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Amount *</FormLabel>
                      <div className='flex gap-2'>
                        <FormControl>
                          <Input
                            type='number'
                            placeholder='0.00'
                            step='0.01'
                            min='0.01'
                            max={balanceDue}
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={handleFullPayment}
                          className='whitespace-nowrap'
                        >
                          Full Payment
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name='method'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select payment method' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {paymentMethods.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Date and Reference */}
              <div className='grid gap-4 md:grid-cols-2'>
                <FormField
                  control={control}
                  name='receivedAt'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant='outline'
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <IconCalendar className='ml-auto h-4 w-4 opacity-50' />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0' align='start'>
                          <Calendar
                            mode='single'
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name='reference'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Check #, Transaction ID, etc.'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Notes */}
              <FormField
                control={control}
                name='notes'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Additional notes about this payment'
                        className='min-h-[80px]'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Form Actions */}
              <div className='flex flex-col gap-2 pt-4 sm:flex-row sm:justify-end'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={onCancel}
                  disabled={loading}
                  className='w-full sm:w-auto'
                >
                  <IconX className='mr-2 h-4 w-4' />
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={loading || !watchedAmount || watchedAmount <= 0}
                  className='w-full sm:w-auto'
                >
                  {loading ? (
                    <>
                      <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current' />
                      Adding Payment...
                    </>
                  ) : (
                    <>
                      <IconCheck className='mr-2 h-4 w-4' />
                      Add Payment
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
