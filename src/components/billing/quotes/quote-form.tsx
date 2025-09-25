'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  CreateQuoteFormData, 
  createQuoteSchema, 
  getDefaultQuoteFormData,
  LineItemInputFormData,
  defaultLineItem
} from '@/lib/billing/schemas';
import { 
  updateLineItemTotals, 
  calculateBillingTotals, 
  formatCurrency,
  DEFAULT_BILLING_CONFIG
} from '@/lib/billing/calculations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  IconPlus, 
  IconTrash, 
  IconCalculator,
  IconUser,
  IconFileText,
  IconCalendar
} from '@tabler/icons-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface QuoteFormProps {
  initialData?: CreateQuoteFormData;
  onSubmit: (data: CreateQuoteFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  mode?: 'create' | 'edit';
}

type ProcessedLineItem = LineItemInputFormData & {
  id: string; // Ensure id is always a string
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
};

interface LineItemRowProps {
  item: ProcessedLineItem;
  index: number;
  onUpdate: (index: number, item: LineItemInputFormData) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

function LineItemRow({ item, index, onUpdate, onRemove, canRemove }: LineItemRowProps) {
  const handleChange = (field: keyof LineItemInputFormData, value: string | number) => {
    const updatedItem = { ...item, [field]: value };
    onUpdate(index, updatedItem);
  };

  return (
    <TableRow>
      <TableCell className="w-full min-w-[200px]">
        <Input
          placeholder="Description"
          value={item.description}
          onChange={(e) => handleChange('description', e.target.value)}
          className="border-0 p-1 text-sm"
        />
      </TableCell>
      <TableCell className="w-20">
        <Input
          type="number"
          placeholder="Qty"
          value={item.quantity || ''}
          onChange={(e) => handleChange('quantity', parseFloat(e.target.value) || 0)}
          className="border-0 p-1 text-sm text-right"
          min="0"
          step="0.01"
        />
      </TableCell>
      <TableCell className="w-24">
        <Input
          type="number"
          placeholder="Price"
          value={item.unitPrice || ''}
          onChange={(e) => handleChange('unitPrice', parseFloat(e.target.value) || 0)}
          className="border-0 p-1 text-sm text-right"
          min="0"
          step="0.01"
        />
      </TableCell>
      <TableCell className="w-20">
        <Input
          type="number"
          placeholder="%"
          value={item.discount || ''}
          onChange={(e) => handleChange('discount', parseFloat(e.target.value) || 0)}
          className="border-0 p-1 text-sm text-right"
          min="0"
          max="100"
          step="0.01"
        />
      </TableCell>
      <TableCell className="w-20">
        <Input
          type="number"
          placeholder="%"
          value={item.taxRate || ''}
          onChange={(e) => handleChange('taxRate', parseFloat(e.target.value) || 0)}
          className="border-0 p-1 text-sm text-right"
          min="0"
          max="100"
          step="0.01"
        />
      </TableCell>
      <TableCell className="w-24 text-right">
        <span className="text-sm font-medium">
          {formatCurrency(item.total)}
        </span>
      </TableCell>
      <TableCell className="w-10">
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
          >
            <IconTrash className="h-3 w-3" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

export function QuoteForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  loading = false,
  mode = 'create'
}: QuoteFormProps) {
const [items, setItems] = useState<ProcessedLineItem[]>([]);
  const [totals, setTotals] = useState({
    subtotal: 0,
    discountTotal: 0,
    taxTotal: 0,
    grandTotal: 0
  });

  const form = useForm<CreateQuoteFormData>({
    resolver: zodResolver(createQuoteSchema),
    defaultValues: initialData || getDefaultQuoteFormData(),
  });

  const { control, handleSubmit, watch, setValue } = form;
  const watchedShipping = watch('shippingAmount') || 0;
  const watchedAdjustment = watch('adjustmentAmount') || 0;

  // Initialize items
  useEffect(() => {
    if (initialData?.items) {
      const processedItems = initialData.items.map(item => updateLineItemTotals({
        ...item,
        id: item.id || `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      }));
      setItems(processedItems);
    } else {
      const newItem = updateLineItemTotals({
        ...defaultLineItem,
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      });
      setItems([newItem]);
    }
  }, [initialData]);

  // Recalculate totals when items, shipping, or adjustment changes
  useEffect(() => {
    const calculatedTotals = calculateBillingTotals(items, watchedShipping, watchedAdjustment);
    setTotals({
      subtotal: calculatedTotals.subtotal,
      discountTotal: calculatedTotals.discountTotal,
      taxTotal: calculatedTotals.taxTotal,
      grandTotal: calculatedTotals.grandTotal
    });
  }, [items, watchedShipping, watchedAdjustment]);

  const updateItem = useCallback((index: number, updatedItem: LineItemInputFormData) => {
    const processedItem = updateLineItemTotals({
      ...updatedItem,
      id: items[index].id
    });
    
    setItems(prev => {
      const newItems = [...prev];
      newItems[index] = processedItem;
      return newItems;
    });
  }, [items]);

  const addItem = useCallback(() => {
    const newItem = updateLineItemTotals({
      ...defaultLineItem,
      taxRate: DEFAULT_BILLING_CONFIG.taxRate,
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    });
    setItems(prev => [...prev, newItem]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleFormSubmit = (data: CreateQuoteFormData) => {
    // Convert processed items back to form data format
    const formItems: LineItemInputFormData[] = items.map(item => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      taxRate: item.taxRate
    }));

    onSubmit({
      ...data,
      items: formItems
    });
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconUser className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={control}
                  name="customer.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter customer name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="customer.email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="customer@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={control}
                  name="customer.phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="customer.gstNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GST Number</FormLabel>
                      <FormControl>
                        <Input placeholder="GST/Tax ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={control}
                name="customer.address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Customer address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <IconFileText className="h-5 w-5" />
                  Line Items
                </CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <IconPlus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Description</TableHead>
                      <TableHead className="w-20 text-right">Qty</TableHead>
                      <TableHead className="w-24 text-right">Unit Price</TableHead>
                      <TableHead className="w-20 text-right">Disc %</TableHead>
                      <TableHead className="w-20 text-right">Tax %</TableHead>
                      <TableHead className="w-24 text-right">Total</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <LineItemRow
                        key={item.id}
                        item={item}
                        index={index}
                        onUpdate={updateItem}
                        onRemove={removeItem}
                        canRemove={items.length > 1}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totals Summary */}
              <div className="mt-6 flex justify-end">
                <div className="w-full max-w-sm space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(totals.subtotal)}</span>
                  </div>
                  {totals.discountTotal > 0 && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Discount:</span>
                      <span>-{formatCurrency(totals.discountTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Tax:</span>
                    <span>{formatCurrency(totals.taxTotal)}</span>
                  </div>
                  
                  {/* Shipping and Adjustments */}
                  <div className="grid gap-2 md:grid-cols-2">
                    <FormField
                      control={control}
                      name="shippingAmount"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-sm">Shipping:</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                className="h-8 w-20 text-right text-sm"
                                step="0.01"
                                min="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="adjustmentAmount"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-sm">Adjustment:</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                className="h-8 w-20 text-right text-sm"
                                step="0.01"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Grand Total:</span>
                    <span>{formatCurrency(totals.grandTotal)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quote Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconCalendar className="h-5 w-5" />
                Quote Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={control}
                  name="validUntil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid Until</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <IconCalendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date()
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-end">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <IconCalculator className="h-3 w-3" />
                    Total: {formatCurrency(totals.grandTotal)}
                  </Badge>
                </div>
              </div>
              
              <FormField
                control={control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Internal notes or special instructions"
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={control}
                name="terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terms & Conditions</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Payment terms and conditions"
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || items.length === 0}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current" />
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                mode === 'create' ? 'Create Quote' : 'Update Quote'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
