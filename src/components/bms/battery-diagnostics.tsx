'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { 
  IconActivity,
  IconZap,
  IconGauge,
  IconDeviceFloppy,
  IconRefresh
} from '@tabler/icons-react';
import { DiagnosticsFormData } from '@/types/bms';

// Diagnostics form validation schema
const diagnosticsSchema = z.object({
  total_cells: z.number().min(1, 'Total cells must be greater than 0'),
  healthy_cells: z.number().min(0, 'Cannot be negative'),
  weak_cells: z.number().min(0, 'Cannot be negative'),
  dead_cells: z.number().min(0, 'Cannot be negative'),
  ir_threshold: z.number().min(0, 'Cannot be negative').default(30),
  current_capacity: z.number().min(0, 'Cannot be negative'),
  load_test_current: z.number().min(0, 'Cannot be negative'),
  load_test_duration: z.number().min(0, 'Cannot be negative'),
  efficiency_rating: z.number().min(0, 'Cannot be negative').max(100, 'Cannot exceed 100%'),
  bms_error_codes: z.string().optional().default(''),
  balancing_status: z.enum(['required', 'completed', 'not_needed']),
  test_temperature: z.number().default(25)
});

type DiagnosticsFormValues = z.infer<typeof diagnosticsSchema>;

interface BatteryDiagnosticsProps {
  batteryId: string;
  initialData?: Partial<DiagnosticsFormData>;
  onSave?: (data: DiagnosticsFormValues) => Promise<void>;
}

export function BatteryDiagnostics({ 
  batteryId, 
  initialData, 
  onSave 
}: BatteryDiagnosticsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<DiagnosticsFormValues>({
    resolver: zodResolver(diagnosticsSchema),
    defaultValues: {
      total_cells: initialData?.total_cells || 0,
      healthy_cells: initialData?.healthy_cells || 0,
      weak_cells: initialData?.weak_cells || 0,
      dead_cells: initialData?.dead_cells || 0,
      ir_threshold: initialData?.ir_threshold || 30,
      current_capacity: initialData?.current_capacity || 0,
      load_test_current: initialData?.load_test_current || 0,
      load_test_duration: initialData?.load_test_duration || 0,
      efficiency_rating: initialData?.efficiency_rating || 0,
      bms_error_codes: initialData?.bms_error_codes || '',
      balancing_status: initialData?.balancing_status || 'not_needed',
      test_temperature: initialData?.test_temperature || 25
    }
  });

  const watchedValues = form.watch();
  const totalCells = watchedValues.total_cells || 0;
  const healthyCells = watchedValues.healthy_cells || 0;
  const weakCells = watchedValues.weak_cells || 0;
  const deadCells = watchedValues.dead_cells || 0;
  const accountedCells = healthyCells + weakCells + deadCells;
  
  // Calculate health metrics
  const healthPercentage = totalCells > 0 ? Math.round((healthyCells / totalCells) * 100) : 0;
  const efficiencyRating = watchedValues.efficiency_rating || 0;

  const onSubmit = async (data: DiagnosticsFormValues) => {
    setIsLoading(true);
    try {
      if (onSave) {
        await onSave(data);
      } else {
        // Default save behavior
        console.log('Diagnostics data:', data);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('Error saving diagnostics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-yellow-500';
    if (percentage >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getEfficiencyColor = (rating: number): string => {
    if (rating >= 85) return 'text-green-600';
    if (rating >= 70) return 'text-yellow-600';
    if (rating >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Battery Diagnostics</h2>
          <p className="text-muted-foreground">
            Record technical analysis and test results
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <IconRefresh className="h-4 w-4 mr-2" />
            Run Tests
          </Button>
        </div>
      </div>

      {/* Health Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cell Health</p>
                <p className="text-2xl font-bold">{healthPercentage}%</p>
                <Progress value={healthPercentage} className={`mt-2 ${getHealthColor(healthPercentage)}`} />
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <IconActivity className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Efficiency</p>
                <p className={`text-2xl font-bold ${getEfficiencyColor(efficiencyRating)}`}>
                  {efficiencyRating}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">Load test result</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <IconGauge className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Balancing</p>
                <Badge 
                  variant={watchedValues.balancing_status === 'completed' ? 'default' : 'secondary'}
                  className="mt-1"
                >
                  {watchedValues.balancing_status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <IconZap className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cell Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconActivity className="h-5 w-5" />
                  Cell Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="total_cells"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Cells</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="healthy_cells"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Healthy</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weak_cells"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weak</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dead_cells"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dead</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {totalCells > 0 && accountedCells !== totalCells && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Cell count mismatch: {accountedCells} of {totalCells} cells accounted for
                    </p>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="ir_threshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IR Threshold (Ω)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Internal resistance threshold for flagging weak cells
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Performance Testing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconGauge className="h-5 w-5" />
                  Performance Testing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="current_capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Capacity (Ah)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>Measured capacity during testing</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="load_test_current"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Test Current (A)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.1"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="load_test_duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (min)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="efficiency_rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Efficiency Rating (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          max="100"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>Overall battery performance rating</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="test_temperature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Test Temperature (°C)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* BMS Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconZap className="h-5 w-5" />
                BMS Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="balancing_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Balancing Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="not_needed">Not Needed</SelectItem>
                          <SelectItem value="required">Required</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="bms_error_codes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BMS Error Codes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter any BMS error codes or fault descriptions..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Record any error codes or fault conditions detected
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-4">
            <Button 
              type="submit" 
              disabled={isLoading}
              size="lg"
            >
              <IconDeviceFloppy className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Diagnostics'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
