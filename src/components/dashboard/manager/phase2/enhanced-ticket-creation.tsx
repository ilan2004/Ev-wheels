'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  IconUser,
  IconBattery,
  IconAlertTriangle,
  IconBrain,
  IconClock,
  IconUserSearch,
  IconRobot,
  IconCheck
} from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';

import { SmartMediaUpload } from './smart-media-upload';
import {
  SYMPTOM_TEMPLATES,
  getSymptomsByCategory,
  getSymptomById,
  suggestPriorityFromDescription,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  type SymptomTemplate
} from './symptom-templates';
import { serviceTicketsApi } from '@/lib/api/service-tickets';
import { toast } from 'sonner';

const schema = z.object({
  customer_id: z.string().min(1, 'Please select a customer'),
  symptom_template_id: z.string().optional(),
  symptom: z.string().min(1, 'Symptom description is required'),
  description: z.string().optional(),
  priority: z.number().min(1).max(3),
  vehicle_make: z.string().optional(),
  vehicle_model: z.string().optional(),
  vehicle_reg_no: z.string().optional(),
  vehicle_year: z.number().optional(),
  assigned_to: z.string().optional(),
  due_date: z.string().optional(),
  estimated_hours: z.number().optional()
});

type FormValues = z.infer<typeof schema>;

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  recent_vehicles?: {
    make: string;
    model: string;
    reg_no: string;
    year?: number;
  }[];
  service_history_count?: number;
}

interface Technician {
  id: string;
  name: string;
  avatar?: string;
  skills: string[];
  current_workload: number;
  max_capacity: number;
  availability: 'available' | 'busy' | 'break';
}

export interface EnhancedTicketCreationProps {
  onTicketCreated?: (ticketId: string) => void;
  className?: string;
}

// Mock data - would be fetched from API in real implementation
const MOCK_CUSTOMERS: Customer[] = [
  {
    id: '1',
    name: 'John Doe',
    phone: '+91 9876543210',
    email: 'john@example.com',
    recent_vehicles: [
      { make: 'TVS', model: 'iQube', reg_no: 'KL-07-AB-1234', year: 2023 }
    ],
    service_history_count: 3
  },
  {
    id: '2',
    name: 'Jane Smith',
    phone: '+91 9876543211',
    email: 'jane@example.com',
    recent_vehicles: [
      { make: 'Bajaj', model: 'Chetak', reg_no: 'KL-08-CD-5678', year: 2022 }
    ],
    service_history_count: 1
  }
];

const MOCK_TECHNICIANS: Technician[] = [
  {
    id: 'tech1',
    name: 'Ravi Kumar',
    skills: ['charging_systems', 'battery_diagnostics', 'electrical_diagnostics'],
    current_workload: 3,
    max_capacity: 8,
    availability: 'available'
  },
  {
    id: 'tech2', 
    name: 'Priya Sharma',
    skills: ['safety_protocols', 'battery_replacement', 'thermal_management'],
    current_workload: 6,
    max_capacity: 8,
    availability: 'busy'
  }
];

export function EnhancedTicketCreation({
  onTicketCreated,
  className = ''
}: EnhancedTicketCreationProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [technicians, setTechnicians] = useState<Technician[]>(MOCK_TECHNICIANS);
  const [selectedTemplate, setSelectedTemplate] = useState<SymptomTemplate | null>(null);
  const [suggestedTechnicians, setSuggestedTechnicians] = useState<Technician[]>([]);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customer_id: '',
      symptom: '',
      description: '',
      priority: 3,
      vehicle_make: '',
      vehicle_model: '',
      vehicle_reg_no: '',
      estimated_hours: 2
    }
  });

  // Watch form values for smart suggestions
  const watchedValues = form.watch();
  
  // Auto-suggest priority based on description
  useEffect(() => {
    if (watchedValues.symptom || watchedValues.description) {
      const text = `${watchedValues.symptom} ${watchedValues.description}`.toLowerCase();
      const suggestedPriority = suggestPriorityFromDescription(text);
      
      // Only update if different from current and user hasn't manually set it
      if (suggestedPriority !== watchedValues.priority) {
        form.setValue('priority', suggestedPriority);
      }
    }
  }, [watchedValues.symptom, watchedValues.description, form]);

  // Auto-fill vehicle details from customer history
  const handleCustomerSelect = useCallback((customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer?.recent_vehicles?.[0]) {
      const vehicle = customer.recent_vehicles[0];
      form.setValue('vehicle_make', vehicle.make);
      form.setValue('vehicle_model', vehicle.model);
      form.setValue('vehicle_reg_no', vehicle.reg_no);
      form.setValue('vehicle_year', vehicle.year);
    }
    setCustomerSearchOpen(false);
  }, [customers, form]);

  // Handle symptom template selection
  const handleTemplateSelect = useCallback((templateId: string) => {
    const template = getSymptomById(templateId);
    if (template) {
      setSelectedTemplate(template);
      form.setValue('symptom_template_id', templateId);
      form.setValue('symptom', template.symptom);
      form.setValue('description', template.description);
      form.setValue('priority', template.suggestedPriority);
      form.setValue('estimated_hours', template.estimatedDuration);
      
      // Suggest technicians based on required skills
      const suggested = technicians.filter(tech =>
        template.requiredSkills.some(skill => tech.skills.includes(skill))
      ).sort((a, b) => a.current_workload - b.current_workload);
      
      setSuggestedTechnicians(suggested);
      
      // Auto-assign to best available technician
      if (suggested.length > 0 && suggested[0].availability === 'available') {
        form.setValue('assigned_to', suggested[0].id);
      }
    }
  }, [form, technicians]);

  // Auto-suggest due date based on priority and workload
  const calculateSuggestedDueDate = useCallback(() => {
    const priority = watchedValues.priority;
    const estimatedHours = watchedValues.estimated_hours || 2;
    
    const daysToAdd = priority === 1 ? 1 : priority === 2 ? 3 : 7;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysToAdd);
    dueDate.setHours(17, 0, 0, 0); // Set to 5 PM
    
    return dueDate.toISOString().split('T')[0];
  }, [watchedValues.priority, watchedValues.estimated_hours]);

  // Submit handler
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Create the ticket
      const ticketData = {
        customer_id: values.customer_id,
        symptom: values.symptom,
        description: values.description || null,
        priority: values.priority,
        vehicle_make: values.vehicle_make || null,
        vehicle_model: values.vehicle_model || null,
        vehicle_reg_no: values.vehicle_reg_no || null,
        vehicle_year: values.vehicle_year || null,
        assigned_to: values.assigned_to || null,
        due_date: values.due_date || calculateSuggestedDueDate(),
        estimated_hours: values.estimated_hours || null
      };

      const result = await serviceTicketsApi.createServiceTicket(ticketData);
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create ticket');
      }

      const ticketId = result.data.id;
      
      // Upload media files if any
      if (mediaFiles.length > 0) {
        const photos = mediaFiles.filter(f => f.type === 'photo').map(f => f.file);
        const audio = mediaFiles.filter(f => f.type === 'audio').map(f => f.file);
        
        if (photos.length > 0) {
          await serviceTicketsApi.uploadAttachments({
            ticketId,
            files: photos,
            type: 'photo',
            onProgress: () => {} // Progress handled by SmartMediaUpload
          });
        }
        
        if (audio.length > 0) {
          await serviceTicketsApi.uploadAttachments({
            ticketId,
            files: audio,
            type: 'audio',
            onProgress: () => {}
          });
        }
      }

      toast.success(
        `Ticket ${result.data.ticket_number} created successfully!`,
        { description: selectedTemplate ? `Using template: ${selectedTemplate.symptom}` : undefined }
      );

      if (onTicketCreated) {
        onTicketCreated(ticketId);
      } else {
        router.push(`/dashboard/tickets/${ticketId}`);
      }

    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create ticket'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`space-y-6 ${className}`}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Customer & Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconUser className="h-5 w-5" />
                Customer & Vehicle Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Customer Selection */}
              <FormField
                control={form.control}
                name="customer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer *</FormLabel>
                    <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                          >
                            {field.value
                              ? customers.find(c => c.id === field.value)?.name
                              : "Search customer..."}
                            <IconUserSearch className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search customer..." />
                          <CommandList>
                            <CommandEmpty>No customer found.</CommandEmpty>
                            <CommandGroup>
                              {customers.map((customer) => (
                                <CommandItem
                                  key={customer.id}
                                  value={customer.name}
                                  onSelect={() => {
                                    form.setValue('customer_id', customer.id);
                                    handleCustomerSelect(customer.id);
                                  }}
                                >
                                  <div className="flex flex-col">
                                    <div className="font-medium">{customer.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {customer.phone} • {customer.service_history_count} previous services
                                    </div>
                                    {customer.recent_vehicles?.[0] && (
                                      <div className="text-xs text-muted-foreground">
                                        Last: {customer.recent_vehicles[0].make} {customer.recent_vehicles[0].model}
                                      </div>
                                    )}
                                  </div>
                                  {field.value === customer.id && (
                                    <IconCheck className="ml-auto h-4 w-4" />
                                  )}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Vehicle Details - Auto-filled */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="vehicle_make"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Make</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., TVS, Bajaj" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vehicle_model"
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
                <FormField
                  control={form.control}
                  name="vehicle_reg_no"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration No.</FormLabel>
                      <FormControl>
                        <Input placeholder="KL-xx-xxxx" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Symptom Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconBattery className="h-5 w-5" />
                Issue Description
                <Badge variant="secondary" className="ml-auto">
                  <IconBrain className="h-3 w-3 mr-1" />
                  AI Assisted
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Quick Templates */}
              <div>
                <Label>Common Issues (Quick Templates)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {Object.entries(CATEGORY_LABELS).map(([category, label]) => {
                    const templates = getSymptomsByCategory(category as any);
                    return (
                      <div key={category}>
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          {label}
                        </div>
                        <div className="space-y-1">
                          {templates.slice(0, 2).map((template) => (
                            <Button
                              key={template.id}
                              type="button"
                              variant={selectedTemplate?.id === template.id ? "default" : "outline"}
                              size="sm"
                              className="w-full text-left justify-start h-auto p-2"
                              onClick={() => handleTemplateSelect(template.id)}
                            >
                              <div>
                                <div className="text-sm">{template.symptom}</div>
                                <div className="text-xs opacity-75">
                                  {PRIORITY_LABELS[template.suggestedPriority]} • {template.estimatedDuration}h
                                </div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Description */}
              <FormField
                control={form.control}
                name="symptom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Summary *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the battery issue..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
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
                        placeholder="Any additional information, customer comments, etc."
                        className="min-h-[60px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Priority & Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconAlertTriangle className="h-5 w-5" />
                Priority & Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
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
                              <Badge variant="destructive" className="text-xs">P1</Badge>
                              High Priority
                            </div>
                          </SelectItem>
                          <SelectItem value="2">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">P2</Badge>
                              Medium Priority
                            </div>
                          </SelectItem>
                          <SelectItem value="3">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">P3</Badge>
                              Low Priority
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estimated_hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Hours</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.5"
                          min="0.5"
                          max="40"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Suggested Technicians */}
              {suggestedTechnicians.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">
                    <IconRobot className="h-4 w-4 inline mr-1" />
                    Suggested Technicians
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {suggestedTechnicians.slice(0, 4).map((tech) => (
                      <Card
                        key={tech.id}
                        className={`cursor-pointer transition-colors ${
                          watchedValues.assigned_to === tech.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:border-muted-foreground/50'
                        }`}
                        onClick={() => form.setValue('assigned_to', tech.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">{tech.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {tech.current_workload}/{tech.max_capacity} tickets
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge 
                                variant={
                                  tech.availability === 'available' ? 'secondary' :
                                  tech.availability === 'busy' ? 'destructive' : 'outline'
                                }
                                className="text-xs"
                              >
                                {tech.availability}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Media Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Media & Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              <SmartMediaUpload
                onFilesChange={setMediaFiles}
                maxFiles={8}
                maxSizePerFile={15}
                enableVoiceToText={true}
                enableAutoCompression={true}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Ticket'}
            </Button>
          </div>
        </form>
      </Form>
    </motion.div>
  );
}
