'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Separator } from '@/components/ui/separator';
import {
  IconUser,
  IconCar,
  IconBattery,
  IconPhoto,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconInfoCircle
} from '@tabler/icons-react';
import { toast } from 'sonner';

import { CustomerPicker } from '@/components/customers/customer-picker';
import { DynamicBatteryInput, BatteryData } from './dynamic-battery-input';
import { EnhancedMediaUpload, MediaFile } from './enhanced-media-upload';
import { serviceTicketsApi } from '@/lib/api/service-tickets';

// Form validation schema
const jobCardSchema = z.object({
  // Customer information (required)
  customer_id: z.string().min(1, 'Please select a customer'),
  
  // What is being brought
  item_types: z.object({
    vehicle: z.boolean(),
    battery: z.boolean()
  }).refine(
    data => data.vehicle || data.battery,
    { message: 'Please select at least vehicle or battery' }
  ),
  
  // Vehicle information (conditional)
  vehicle_info: z.object({
    make: z.string().optional(),
    model: z.string().optional(),
    reg_no: z.string().optional(),
    year: z.number().optional(),
    vin: z.string().optional(),
    condition_notes: z.string().optional()
  }).optional(),
  
  // Battery information (array, conditional)
  batteries: z.array(z.object({
    serial_number: z.string().min(1, 'Serial number is required'),
    brand: z.string().min(1, 'Brand is required'),
    model: z.string().optional(),
    battery_type: z.string().min(1, 'Battery type is required'),
    voltage: z.number().min(1, 'Voltage is required'),
    capacity: z.number().min(0.1, 'Capacity is required'),
    cell_type: z.string().min(1, 'Cell type is required'),
    condition_notes: z.string().optional(),
    estimated_cost: z.number().optional()
  })).optional(),
  
  // Issue description
  symptom: z.string().min(1, 'Issue description is required'),
  description: z.string().optional(),
  
  // Priority
  priority: z.number().min(1).max(3).default(3)
});

type JobCardFormData = z.infer<typeof jobCardSchema>;

interface ImprovedJobCardFormProps {
  onSubmit?: (data: JobCardFormData, mediaFiles: MediaFile[]) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

export function ImprovedJobCardForm({
  onSubmit,
  onCancel,
  className = ''
}: ImprovedJobCardFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  
  const form = useForm<JobCardFormData>({
    resolver: zodResolver(jobCardSchema),
    defaultValues: {
      customer_id: '',
      item_types: {
        vehicle: false,
        battery: false
      },
      vehicle_info: {
        make: '',
        model: '',
        reg_no: '',
        year: undefined,
        vin: '',
        condition_notes: ''
      },
      batteries: [],
      symptom: '',
      description: '',
      priority: 3
    }
  });

  // Watch form values for conditional rendering
  const watchedValues = form.watch();
  const hasVehicle = watchedValues.item_types?.vehicle;
  const hasBattery = watchedValues.item_types?.battery;
  const batteryCount = watchedValues.batteries?.length || 0;

  // Validation for step completion
  const isStep1Complete = !!watchedValues.customer_id;
  const isStep2Complete = hasVehicle || hasBattery;
  const isStep3Complete = 
    (!hasVehicle || (hasVehicle && watchedValues.vehicle_info?.make)) &&
    (!hasBattery || (hasBattery && batteryCount > 0));
  const isStep4Complete = !!watchedValues.symptom;

  // Handle item type changes
  const handleItemTypeChange = useCallback((type: 'vehicle' | 'battery', checked: boolean) => {
    const currentTypes = form.getValues('item_types');
    form.setValue('item_types', {
      ...currentTypes,
      [type]: checked
    });

    // Clear related fields when unchecking
    if (!checked) {
      if (type === 'vehicle') {
        form.setValue('vehicle_info', {
          make: '',
          model: '',
          reg_no: '',
          year: undefined,
          vin: '',
          condition_notes: ''
        });
      } else if (type === 'battery') {
        form.setValue('batteries', []);
      }
    } else {
      // Auto-add one battery when checking battery option
      if (type === 'battery' && batteryCount === 0) {
        const newBattery = {
          serial_number: '',
          brand: '',
          model: '',
          battery_type: 'lithium_ion',
          voltage: 48,
          capacity: 20,
          cell_type: 'cylindrical_18650',
          condition_notes: '',
          estimated_cost: undefined
        };
        form.setValue('batteries', [newBattery]);
      }
    }
  }, [form, batteryCount]);

  // Handle form submission
  const handleSubmit = async (data: JobCardFormData) => {
    setIsSubmitting(true);
    
    try {
      if (onSubmit) {
        await onSubmit(data, mediaFiles);
      } else {
        // Default submission logic
        await defaultSubmit(data, mediaFiles);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create job card');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Default submission implementation
  const defaultSubmit = async (data: JobCardFormData, mediaFiles: MediaFile[]) => {
    // Create service ticket
    const ticketData = {
      customer_id: data.customer_id,
      symptom: data.symptom,
      description: data.description || null,
      priority: data.priority,
      vehicle_make: hasVehicle ? data.vehicle_info?.make || null : null,
      vehicle_model: hasVehicle ? data.vehicle_info?.model || null : null,
      vehicle_reg_no: hasVehicle ? data.vehicle_info?.reg_no || null : null,
      vehicle_year: hasVehicle && data.vehicle_info?.year ? data.vehicle_info.year : null
    };

    const result = await serviceTicketsApi.createServiceTicket(ticketData);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create job card');
    }

    const ticketId = result.data.id;
    const ticketNumber = result.data.ticket_number;

    // Upload media files
    if (mediaFiles.length > 0) {
      const photos = mediaFiles
        .filter((f) => f.type === 'photo')
        .map((f) => f.file);
      const audio = mediaFiles
        .filter((f) => f.type === 'audio')
        .map((f) => f.file);

      if (photos.length > 0) {
        await serviceTicketsApi.uploadAttachments({
          ticketId,
          files: photos,
          type: 'photo'
        });
      }

      if (audio.length > 0) {
        await serviceTicketsApi.uploadAttachments({
          ticketId,
          files: audio,
          type: 'audio'
        });
      }
    }

    toast.success(`Job card ${ticketNumber} created successfully!`);
    router.push(`/dashboard/job-cards/${ticketId}`);
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4, 5].map((step) => (
        <React.Fragment key={step}>
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
              currentStep >= step
                ? 'bg-primary border-primary text-primary-foreground'
                : currentStep === step
                ? 'border-primary text-primary'
                : 'border-muted text-muted-foreground'
            }`}
          >
            {currentStep > step ? (
              <IconCheck className="w-4 h-4" />
            ) : (
              <span className="text-sm font-medium">{step}</span>
            )}
          </div>
          {step < 5 && (
            <div
              className={`w-12 h-0.5 mx-2 transition-colors ${
                currentStep > step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return 'Customer Information';
      case 2: return 'What\'s Being Brought?';
      case 3: return 'Item Details';
      case 4: return 'Issue Description';
      case 5: return 'Media & Review';
      default: return '';
    }
  };

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          {renderStepIndicator()}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconInfoCircle className="h-5 w-5" />
                Step {currentStep}: {getStepTitle(currentStep)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {/* Step 1: Customer Information */}
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="customer_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <IconUser className="h-4 w-4" />
                            Customer *
                          </FormLabel>
                          <FormControl>
                            <CustomerPicker
                              value={field.value || null}
                              onChange={(id) => field.onChange(id || '')}
                              allowQuickAdd
                              placeholder="Search or add customer"
                            />
                          </FormControl>
                          <FormDescription>
                            Select the customer who is bringing items for service
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}

                {/* Step 2: Item Type Selection */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div>
                      <h3 className="text-lg font-medium mb-4">What is the customer bringing?</h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Select all that apply. Customers might bring a vehicle, just batteries, or both.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className={`cursor-pointer transition-colors ${hasVehicle ? 'border-primary bg-primary/5' : ''}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                id="vehicle"
                                checked={hasVehicle}
                                onCheckedChange={(checked) => 
                                  handleItemTypeChange('vehicle', checked as boolean)
                                }
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <IconCar className="h-5 w-5" />
                                  <label htmlFor="vehicle" className="font-medium cursor-pointer">
                                    Vehicle
                                  </label>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Electric scooter, bike, or car needing service
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className={`cursor-pointer transition-colors ${hasBattery ? 'border-primary bg-primary/5' : ''}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                id="battery"
                                checked={hasBattery}
                                onCheckedChange={(checked) => 
                                  handleItemTypeChange('battery', checked as boolean)
                                }
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <IconBattery className="h-5 w-5" />
                                  <label htmlFor="battery" className="font-medium cursor-pointer">
                                    Battery/Batteries
                                  </label>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Individual battery packs for repair or maintenance
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {!hasVehicle && !hasBattery && (
                        <p className="text-sm text-destructive mt-4">
                          Please select at least one option above.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Item Details */}
                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {hasVehicle && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <IconCar className="h-5 w-5" />
                            Vehicle Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <FormField
                              control={form.control}
                              name="vehicle_info.make"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Vehicle Make *</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., TVS, Bajaj, Ather" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="vehicle_info.model"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Vehicle Model</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., iQube, Chetak" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <FormField
                              control={form.control}
                              name="vehicle_info.reg_no"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Registration Number</FormLabel>
                                  <FormControl>
                                    <Input placeholder="KL-xx-xxxx" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="vehicle_info.year"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Year</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder="2023"
                                      {...field}
                                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="vehicle_info.condition_notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Vehicle Condition Notes</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Any visible damage, wear, or observations about the vehicle..."
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    )}

                    {hasBattery && (
                      <DynamicBatteryInput
                        control={form.control}
                        name="batteries"
                      />
                    )}
                  </motion.div>
                )}

                {/* Step 4: Issue Description */}
                {currentStep === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="symptom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Issue Description *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe the main issue or complaint reported by the customer..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Summarize the primary problem or reason for service
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Details</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any additional information, customer comments, or context..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority Level</FormLabel>
                          <Select
                            value={String(field.value)}
                            onValueChange={(value) => field.onChange(Number(value))}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="destructive">P1</Badge>
                                  High Priority - Urgent
                                </div>
                              </SelectItem>
                              <SelectItem value="2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary">P2</Badge>
                                  Medium Priority - Standard
                                </div>
                              </SelectItem>
                              <SelectItem value="3">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">P3</Badge>
                                  Low Priority - When Convenient
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}

                {/* Step 5: Media Upload & Review */}
                {currentStep === 5 && (
                  <motion.div
                    key="step5"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <EnhancedMediaUpload
                      onFilesChange={setMediaFiles}
                      showBatteryOptions={hasBattery}
                      batteryCount={batteryCount}
                    />

                    <Separator />

                    {/* Summary Review */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Review & Submit</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium">Items for Service:</h4>
                          <div className="flex gap-2">
                            {hasVehicle && (
                              <Badge variant="secondary">
                                <IconCar className="w-3 h-3 mr-1" />
                                Vehicle
                              </Badge>
                            )}
                            {hasBattery && (
                              <Badge variant="secondary">
                                <IconBattery className="w-3 h-3 mr-1" />
                                {batteryCount} {batteryCount === 1 ? 'Battery' : 'Batteries'}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium">Media Files:</h4>
                          <div className="text-sm text-muted-foreground">
                            {mediaFiles.length === 0 ? 'No files uploaded' : (
                              <div className="flex gap-4">
                                <span>{mediaFiles.filter(f => f.type === 'photo').length} photos</span>
                                <span>{mediaFiles.filter(f => f.type === 'audio').length} audio</span>
                                <span>{mediaFiles.filter(f => f.type === 'document').length} documents</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Previous
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel || (() => router.back())}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              
              {currentStep < 5 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={
                    (currentStep === 1 && !isStep1Complete) ||
                    (currentStep === 2 && !isStep2Complete) ||
                    (currentStep === 3 && !isStep3Complete) ||
                    (currentStep === 4 && !isStep4Complete)
                  }
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting || !form.formState.isValid}
                >
                  {isSubmitting ? 'Creating...' : 'Create Job Card'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
