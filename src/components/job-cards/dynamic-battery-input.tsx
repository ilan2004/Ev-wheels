'use client';

import React from 'react';
import { useFieldArray, Control } from 'react-hook-form';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { 
  IconPlus, 
  IconTrash, 
  IconBattery,
  IconGripVertical 
} from '@tabler/icons-react';
// Removed framer-motion to fix hydration issues

// Battery types and cell types from the existing battery form
export const BATTERY_TYPES = [
  { value: 'lithium_ion', label: 'Lithium-Ion' },
  { value: 'lfp', label: 'LFP (LiFePO4)' },
  { value: 'nmc', label: 'NMC' },
  { value: 'other', label: 'Other' }
] as const;

export const CELL_TYPES = [
  { value: 'cylindrical_18650', label: '18650' },
  { value: 'cylindrical_21700', label: '21700' },
  { value: 'prismatic', label: 'Prismatic' },
  { value: 'pouch', label: 'Pouch' }
] as const;

export const COMMON_BRANDS = [
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

export interface BatteryData {
  id?: string; // For existing batteries
  serial_number: string;
  brand: string;
  model?: string;
  battery_type: string;
  voltage: number;
  capacity: number;
  cell_type: string;
  condition_notes?: string;
  estimated_cost?: number;
}

interface DynamicBatteryInputProps {
  control: Control<any>;
  name: string;
  disabled?: boolean;
  className?: string;
}

export function DynamicBatteryInput({
  control,
  name,
  disabled = false,
  className = ''
}: DynamicBatteryInputProps) {
  const { fields, append, remove, move } = useFieldArray({
    control,
    name
  });

  const addBattery = () => {
    append({
      serial_number: '',
      brand: '',
      model: '',
      battery_type: 'lithium_ion',
      voltage: 48,
      capacity: 20,
      cell_type: 'cylindrical_18650',
      condition_notes: '',
      estimated_cost: undefined
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconBattery className="h-5 w-5" />
          <h3 className="text-lg font-medium">Battery Information</h3>
          <Badge variant="outline" className="ml-auto">
            {fields.length} {fields.length === 1 ? 'battery' : 'batteries'}
          </Badge>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addBattery}
          disabled={disabled}
          className="flex items-center gap-2"
        >
          <IconPlus className="h-4 w-4" />
          Add Battery
        </Button>
      </div>

      {fields.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconBattery className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-center">
              No batteries added yet.
              <br />
              Click "Add Battery" to include battery details.
            </p>
          </CardContent>
        </Card>
      )}

      {fields.map((field, index) => (
        <div key={field.id}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <IconGripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                    Battery #{index + 1}
                  </CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    disabled={disabled}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <IconTrash className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Serial Number and Brand */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={control}
                    name={`${name}.${index}.serial_number`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Serial Number *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter serial number"
                            {...field}
                            disabled={disabled}
                            className="font-mono"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name={`${name}.${index}.brand`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={disabled}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select brand" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {COMMON_BRANDS.map((brand) => (
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

                {/* Model and Battery Type */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={control}
                    name={`${name}.${index}.model`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Battery model (optional)"
                            {...field}
                            disabled={disabled}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name={`${name}.${index}.battery_type`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Battery Type *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={disabled}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select battery type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {BATTERY_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Voltage, Capacity, and Cell Type */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <FormField
                    control={control}
                    name={`${name}.${index}.voltage`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Voltage (V) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="48"
                            {...field}
                            disabled={disabled}
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
                    control={control}
                    name={`${name}.${index}.capacity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacity (Ah) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="20.0"
                            {...field}
                            disabled={disabled}
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
                    control={control}
                    name={`${name}.${index}.cell_type`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cell Type *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={disabled}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Cell type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CELL_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Condition Notes */}
                <FormField
                  control={control}
                  name={`${name}.${index}.condition_notes`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condition & Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the battery condition, customer complaints, or visible issues..."
                          className="min-h-[80px]"
                          {...field}
                          disabled={disabled}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Estimated Cost */}
                <FormField
                  control={control}
                  name={`${name}.${index}.estimated_cost`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Cost (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Optional initial estimate"
                          {...field}
                          disabled={disabled}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? Number(e.target.value)
                                : undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
        </div>
      ))}

      {fields.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-sm text-blue-900">
            <strong>💡 Tips:</strong>
          </p>
          <ul className="mt-1 text-xs text-blue-800 space-y-1">
            <li>• Serial numbers are usually found on battery labels</li>
            <li>• Each battery will be tracked individually in the system</li>
            <li>• You can drag to reorder batteries if needed</li>
            <li>• Photos can be uploaded separately for each battery</li>
          </ul>
        </div>
      )}
    </div>
  );
}
