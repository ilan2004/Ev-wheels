'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  CreateInvoiceFormData, 
  createInvoiceSchema, 
  getDefaultInvoiceFormData,
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
  IconCalendar,
  IconCreditCard
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
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CustomerPicker } from '@/components/customers/customer-picker';

interface InvoiceFormProps {
  initialData?: CreateInvoiceFormData;
  onSubmit: (data: CreateInvoiceFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  mode?: 'create' | 'edit';
}

interface LineItemRowProps {
  item: LineItemInputFormData & { subtotal: number; discountAmount: number; taxAmount: number; total: number };
  index: number;
  onUpdate: (index: number, item: LineItemInputFormData) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
  qtyDraft: string;
  onQtyChange: (index: number, value: string) => void;
  onQtyBlur: (index: number) => void;
}

function LineItemRow({ item, index, onUpdate, onRemove, canRemove, qtyDraft, onQtyChange, onQtyBlur }: LineItemRowProps) {
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
          type="text"
          placeholder="Qty"
          value={qtyDraft}
          onChange={(e) => onQtyChange(index, e.target.value)}
          onBlur={() => onQtyBlur(index)}
          className="border-0 p-1 text-sm text-right"
          inputMode="decimal"
        />
      </TableCell>
      <TableCell className="w-24">
        <Input
          type="number"
          placeholder="Price"
          value={Number.isFinite(item.unitPrice) ? item.unitPrice : ''}
          onChange={(e) => {
            const val = e.target.value;
            const num = Number(val);
            handleChange('unitPrice', Number.isNaN(num) ? 0 : num);
          }}
          className="border-0 p-1 text-sm text-right"
          min="0"
          step="any"
          inputMode="decimal"
        />
      </TableCell>
      <TableCell className="w-20">
        <Input
          type="number"
          placeholder="%"
          value={Number.isFinite(item.discount ?? 0) ? item.discount : ''}
          onChange={(e) => {
            const val = e.target.value;
            const num = Number(val);
            const safe = Number.isNaN(num) ? 0 : Math.max(0, Math.min(100, num));
            handleChange('discount', safe);
          }}
          className="border-0 p-1 text-sm text-right"
          min="0"
          max="100"
          step="any"
          inputMode="decimal"
        />
      </TableCell>
      <TableCell className="w-20">
        <Input
          type="number"
          placeholder="%"
          value={Number.isFinite(item.taxRate ?? 0) ? item.taxRate : ''}
          onChange={(e) => {
            const val = e.target.value;
            const num = Number(val);
            const safe = Number.isNaN(num) ? 0 : Math.max(0, Math.min(100, num));
            handleChange('taxRate', safe);
          }}
          className="border-0 p-1 text-sm text-right"
          min="0"
          max="100"
          step="any"
          inputMode="decimal"
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

export function InvoiceForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  loading = false,
  mode = 'create'
}: InvoiceFormProps) {
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [linkedCustomerName, setLinkedCustomerName] = useState<string | null>(null);
  
  const [items, setItems] = useState<(LineItemInputFormData & { subtotal: number; discountAmount: number; taxAmount: number; total: number })[]>([]);
  const [totals, setTotals] = useState({
    subtotal: 0,
    discountTotal: 0,
    taxTotal: 0,
    grandTotal: 0
  });
  const [qtyDrafts, setQtyDrafts] = useState<string[]>([]);

  const form = useForm<CreateInvoiceFormData>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: initialData || getDefaultInvoiceFormData(),
  });

  const { control, handleSubmit, watch, setValue } = form;
  const linkedCustomerId = watch('linkedCustomerId');
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
      setQtyDrafts(processedItems.map(i => String(i.quantity)));
    } else {
      const newItem = updateLineItemTotals({
        ...defaultLineItem,
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      });
      setItems([newItem]);
      setQtyDrafts([String(newItem.quantity)]);
    }
  }, [initialData]);

  // Recalculate totals when items, shipping, or adjustment changes
  useEffect(() => {
    const normalizedItems = items.map((it, idx) => ({
      id: it.id ?? `tmp-${idx}`,
      description: it.description,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      discount: it.discount,
      taxRate: it.taxRate,
      subtotal: it.subtotal,
      discountAmount: it.discountAmount,
      taxAmount: it.taxAmount,
      total: it.total,
    }));

    const calculatedTotals = calculateBillingTotals(normalizedItems as any, watchedShipping, watchedAdjustment);
    setTotals({
      subtotal: calculatedTotals.subtotal,
      discountTotal: calculatedTotals.discountTotal,
      taxTotal: calculatedTotals.taxTotal,
      grandTotal: calculatedTotals.grandTotal
    });
  }, [items, watchedShipping, watchedAdjustment]);

  // Sync items into react-hook-form so schema validation sees the current items
  useEffect(() => {
    const formItems: LineItemInputFormData[] = items.map(item => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      taxRate: item.taxRate
    }));
    setValue('items', formItems as any, { shouldDirty: true, shouldValidate: false });
  }, [items, setValue]);

  const updateItem = useCallback((index: number, updatedItem: LineItemInputFormData) => {
    const processedItem = updateLineItemTotals({
      ...updatedItem,
      id: items[index].id ?? `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
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
    setQtyDrafts(prev => [...prev, String(newItem.quantity)]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
    setQtyDrafts(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleFormSubmit = (data: CreateInvoiceFormData) => {
    // Convert processed items back to form data format
    const formItems: LineItemInputFormData[] = items.map(item => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      taxRate: item.taxRate
    }));

    const finalData = {
      ...data,
      items: formItems
    };
    
    try {
      onSubmit(finalData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleInvalidSubmit = (errors: any) => {
    // Extract first error message
    const firstError = (() => {
      // Prefer customer.name/dueDate errors
      if (errors?.customer?.name?.message) return String(errors.customer.name.message);
      if (errors?.dueDate?.message) return String(errors.dueDate.message);
      if (errors?.items?.message) return String(errors.items.message);
      // Look into array item errors
      if (Array.isArray(errors?.items)) {
        for (const e of errors.items) {
          if (e?.description?.message) return `Line item: ${String(e.description.message)}`;
        }
      }
      // Fallback generic
      return 'Please fix the highlighted fields and try again.';
    })();

    toast.error(firstError);
    try { window?.scrollTo?.({ top: 0, behavior: 'smooth' }); } catch {}
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={handleSubmit(handleFormSubmit, handleInvalidSubmit)} className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <IconUser className="h-5 w-5" />
                  Customer Information
                </CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={() => setCustomerPickerOpen(true)}>
                  Select from Customers
                </Button>
              </div>
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

          <Dialog open={customerPickerOpen} onOpenChange={setCustomerPickerOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Select Customer</DialogTitle>
              </DialogHeader>
              <CustomerPicker
                value={null}
                onChange={(id, c) => {
                  if (c) {
                    setValue('customer.name', c.name as any);
                    setValue('customer.phone', (c.contact || '') as any);
                    setValue('customer.address', (c.address || '') as any);
                    setValue('customer.gstNumber', (c.gst_number || '') as any);
                    setValue('linkedCustomerId', c.id as any);
                    setLinkedCustomerName(c.name);
                  }
                  setCustomerPickerOpen(false);
                }}
                allowQuickAdd
              />
            </DialogContent>
          </Dialog>

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
                        qtyDraft={qtyDrafts[index] ?? ''}
                        onQtyChange={(i, val) => {
                          setQtyDrafts(prev => {
                            const copy = [...prev];
                            copy[i] = val;
                            return copy;
                          });
                          const num = Number(val);
                          if (!Number.isNaN(num)) {
                            updateItem(i, { ...items[i], quantity: num });
                          }
                        }}
                        onQtyBlur={(i) => {
                          setQtyDrafts(prev => {
                            const copy = [...prev];
                            const val = copy[i];
                            if (val === '' || Number.isNaN(Number(val))) {
                              copy[i] = '0';
                              updateItem(i, { ...items[i], quantity: 0 });
                            }
                            return copy;
                          });
                        }}
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

          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconCreditCard className="h-5 w-5" />
                Invoice Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {linkedCustomerId && (
                <div className="flex items-center justify-between rounded border p-2 text-sm">
                  <div>
                    Linked to: <span className="font-medium">{linkedCustomerName || 'Selected customer'}</span>
                  </div>
                  <Button type="button" size="sm" variant="ghost" onClick={() => { setValue('linkedCustomerId', undefined as any); setLinkedCustomerName(null); }}>
                    Clear link
                  </Button>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date *</FormLabel>
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
                                <span>Pick a due date</span>
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
                              mode === 'create' ? date < new Date() : false
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
                mode === 'create' ? 'Create Invoice' : 'Update Invoice'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
