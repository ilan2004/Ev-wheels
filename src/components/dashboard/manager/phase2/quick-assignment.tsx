'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconUser,
  IconUserCheck,
  IconClock,
  IconBattery,
  IconTool,
  IconAlertTriangle,
  IconCheck,
  IconX
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

export interface Technician {
  id: string;
  name: string;
  avatar?: string;
  skills: string[];
  specializations: string[];
  current_workload: number;
  max_capacity: number;
  availability: 'available' | 'busy' | 'break' | 'offline';
  current_tickets: {
    id: string;
    ticket_number: string;
    priority: number;
    estimated_completion?: string;
  }[];
  performance: {
    completion_rate: number;
    avg_resolution_time: number;
    quality_score: number;
  };
}

export interface TicketSummary {
  id: string;
  ticket_number: string;
  symptom: string;
  priority: 1 | 2 | 3;
  customer_name: string;
  required_skills?: string[];
  estimated_hours?: number;
}

export interface QuickAssignmentProps {
  tickets?: TicketSummary[];
  technicians?: Technician[];
  onAssignment: (ticketId: string, technicianId: string) => Promise<boolean>;
  className?: string;
}

// Mock data
const MOCK_TECHNICIANS: Technician[] = [
  {
    id: 'tech1',
    name: 'Ravi Kumar',
    avatar: '/avatars/ravi.jpg',
    skills: ['charging_systems', 'battery_diagnostics', 'electrical_diagnostics'],
    specializations: ['High Voltage Systems', 'Battery Pack Repair'],
    current_workload: 3,
    max_capacity: 8,
    availability: 'available',
    current_tickets: [
      { id: 't1', ticket_number: 'TKT-001', priority: 2, estimated_completion: '2024-01-15T17:00:00Z' },
      { id: 't2', ticket_number: 'TKT-003', priority: 3 },
      { id: 't3', ticket_number: 'TKT-007', priority: 1 }
    ],
    performance: {
      completion_rate: 94,
      avg_resolution_time: 2.1,
      quality_score: 4.7
    }
  },
  {
    id: 'tech2',
    name: 'Priya Sharma',
    avatar: '/avatars/priya.jpg',
    skills: ['safety_protocols', 'battery_replacement', 'thermal_management'],
    specializations: ['Safety Systems', 'Battery Chemistry'],
    current_workload: 6,
    max_capacity: 8,
    availability: 'busy',
    current_tickets: [
      { id: 't4', ticket_number: 'TKT-002', priority: 1 },
      { id: 't5', ticket_number: 'TKT-004', priority: 2 },
      { id: 't6', ticket_number: 'TKT-008', priority: 3 },
      { id: 't7', ticket_number: 'TKT-009', priority: 2 },
      { id: 't8', ticket_number: 'TKT-011', priority: 1 },
      { id: 't9', ticket_number: 'TKT-012', priority: 3 }
    ],
    performance: {
      completion_rate: 89,
      avg_resolution_time: 2.8,
      quality_score: 4.5
    }
  },
  {
    id: 'tech3',
    name: 'Amit Patel',
    skills: ['power_electronics', 'connector_repair', 'mechanical_assembly'],
    specializations: ['Motor Controllers', 'Mechanical Systems'],
    current_workload: 1,
    max_capacity: 6,
    availability: 'available',
    current_tickets: [
      { id: 't10', ticket_number: 'TKT-013', priority: 2 }
    ],
    performance: {
      completion_rate: 96,
      avg_resolution_time: 1.9,
      quality_score: 4.8
    }
  },
  {
    id: 'tech4',
    name: 'Sarah Johnson',
    skills: ['comprehensive_diagnostics', 'troubleshooting', 'customer_service'],
    specializations: ['System Integration', 'Customer Relations'],
    current_workload: 8,
    max_capacity: 8,
    availability: 'busy',
    current_tickets: [],
    performance: {
      completion_rate: 85,
      avg_resolution_time: 3.2,
      quality_score: 4.9
    }
  }
];

const MOCK_UNASSIGNED_TICKETS: TicketSummary[] = [
  {
    id: 'ticket1',
    ticket_number: 'TKT-015',
    symptom: 'Battery not charging',
    priority: 1,
    customer_name: 'John Doe',
    required_skills: ['charging_systems', 'electrical_diagnostics'],
    estimated_hours: 2
  },
  {
    id: 'ticket2', 
    ticket_number: 'TKT-016',
    symptom: 'Reduced range performance',
    priority: 2,
    customer_name: 'Jane Smith',
    required_skills: ['battery_diagnostics', 'capacity_testing'],
    estimated_hours: 3
  }
];

export function QuickAssignment({
  tickets = MOCK_UNASSIGNED_TICKETS,
  technicians = MOCK_TECHNICIANS,
  onAssignment,
  className = ''
}: QuickAssignmentProps) {
  const [selectedTicket, setSelectedTicket] = useState<TicketSummary | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [draggedTicket, setDraggedTicket] = useState<TicketSummary | null>(null);

  // Calculate technician suitability for a ticket
  const calculateSuitability = useCallback((tech: Technician, ticket: TicketSummary) => {
    let score = 0;
    let reasons: string[] = [];

    // Skill match (40% weight)
    if (ticket.required_skills) {
      const matchedSkills = tech.skills.filter(skill => 
        ticket.required_skills!.includes(skill)
      ).length;
      const skillScore = (matchedSkills / ticket.required_skills.length) * 40;
      score += skillScore;
      if (matchedSkills > 0) {
        reasons.push(`${matchedSkills}/${ticket.required_skills.length} required skills`);
      }
    }

    // Workload (30% weight) - lower workload is better
    const workloadScore = ((tech.max_capacity - tech.current_workload) / tech.max_capacity) * 30;
    score += workloadScore;

    // Availability (20% weight)
    const availabilityScore = tech.availability === 'available' ? 20 : 
                            tech.availability === 'busy' ? 10 : 0;
    score += availabilityScore;

    // Performance (10% weight)
    const performanceScore = (tech.performance.completion_rate / 100) * 10;
    score += performanceScore;

    // Priority matching - high priority tickets need available techs
    if (ticket.priority === 1 && tech.availability !== 'available') {
      score *= 0.7; // Penalty for assigning high priority to busy techs
      reasons.push('High priority needs immediate attention');
    }

    return {
      score: Math.round(score),
      reasons,
      recommendation: score >= 60 ? 'excellent' : score >= 40 ? 'good' : score >= 20 ? 'fair' : 'poor'
    };
  }, []);

  // Handle assignment
  const handleAssign = useCallback(async (ticketId: string, technicianId: string) => {
    setIsAssigning(true);
    try {
      const success = await onAssignment(ticketId, technicianId);
      if (success) {
        const ticket = tickets.find(t => t.id === ticketId);
        const tech = technicians.find(t => t.id === technicianId);
        toast.success(
          `Assigned ${ticket?.ticket_number} to ${tech?.name}`,
          { description: 'Technician will be notified automatically' }
        );
        setSelectedTicket(null);
      } else {
        toast.error('Failed to assign ticket');
      }
    } catch (error) {
      toast.error('Assignment failed');
    } finally {
      setIsAssigning(false);
    }
  }, [onAssignment, tickets, technicians]);

  // Drag and drop handlers
  const handleDragStart = useCallback((ticket: TicketSummary) => {
    setDraggedTicket(ticket);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedTicket(null);
  }, []);

  const handleDrop = useCallback(async (technicianId: string) => {
    if (draggedTicket) {
      await handleAssign(draggedTicket.id, technicianId);
    }
  }, [draggedTicket, handleAssign]);

  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* Unassigned Tickets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Unassigned Tickets</h3>
            <p className="text-sm text-muted-foreground">
              Drag tickets to technician cards or click to assign
            </p>
          </div>
          <Badge variant="destructive">{tickets.length} unassigned</Badge>
        </div>
        
        <div className="grid gap-3">
          {tickets.map((ticket) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={`cursor-grab border-l-4 transition-all ${
                  ticket.priority === 1 ? 'border-l-red-500' :
                  ticket.priority === 2 ? 'border-l-amber-500' : 'border-l-blue-500'
                } ${selectedTicket?.id === ticket.id ? 'ring-2 ring-primary' : ''}`}
                draggable
                onDragStart={() => handleDragStart(ticket)}
                onDragEnd={handleDragEnd}
                onClick={() => setSelectedTicket(ticket)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{ticket.ticket_number}</span>
                        <Badge
                          variant={
                            ticket.priority === 1 ? 'destructive' :
                            ticket.priority === 2 ? 'secondary' : 'outline'
                          }
                          className="text-xs"
                        >
                          P{ticket.priority}
                        </Badge>
                        {ticket.estimated_hours && (
                          <Badge variant="outline" className="text-xs">
                            <IconClock className="h-3 w-3 mr-1" />
                            {ticket.estimated_hours}h
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {ticket.symptom}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Customer: {ticket.customer_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {ticket.required_skills && (
                        <IconTool className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Technician Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Available Technicians</h3>
          <div className="text-sm text-muted-foreground">
            Click technician or drop ticket to assign
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {technicians.map((tech) => {
            const suitability = selectedTicket ? calculateSuitability(tech, selectedTicket) : null;
            const workloadPercentage = (tech.current_workload / tech.max_capacity) * 100;
            const isOverloaded = workloadPercentage > 75;
            const isAtCapacity = tech.current_workload >= tech.max_capacity;
            
            return (
              <motion.div
                key={tech.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card
                  className={`h-full transition-all duration-200 ${
                    tech.availability === 'available' ? 'border-green-200 bg-green-50/20' :
                    tech.availability === 'busy' ? 'border-amber-200 bg-amber-50/20' :
                    tech.availability === 'break' ? 'border-blue-200 bg-blue-50/20' :
                    'border-gray-200 bg-gray-50/20'
                  } ${
                    suitability?.recommendation === 'excellent' ? 'ring-2 ring-green-200' :
                    suitability?.recommendation === 'good' ? 'ring-1 ring-blue-200' : ''
                  } ${
                    draggedTicket ? 'cursor-pointer hover:border-primary' : ''
                  }`}
                  onClick={() => selectedTicket && handleAssign(selectedTicket.id, tech.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(tech.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={tech.avatar} alt={tech.name} />
                        <AvatarFallback>
                          {tech.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{tech.name}</div>
                        <div className="flex items-center gap-1">
                          <Badge
                            variant={
                              tech.availability === 'available' ? 'secondary' :
                              tech.availability === 'busy' ? 'destructive' :
                              tech.availability === 'break' ? 'outline' : 'secondary'
                            }
                            className="text-xs"
                          >
                            {tech.availability}
                          </Badge>
                          {isAtCapacity && (
                            <IconAlertTriangle className="h-3 w-3 text-red-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {/* Workload */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Workload</span>
                        <span className={isOverloaded ? 'text-red-600 font-medium' : ''}>
                          {tech.current_workload}/{tech.max_capacity}
                        </span>
                      </div>
                      <Progress
                        value={workloadPercentage}
                        className={`h-2 ${
                          isAtCapacity ? '[&>div]:bg-red-500' :
                          isOverloaded ? '[&>div]:bg-amber-500' :
                          '[&>div]:bg-green-500'
                        }`}
                      />
                    </div>

                    {/* Skills */}
                    <div>
                      <div className="text-sm font-medium mb-1">Specializations</div>
                      <div className="flex flex-wrap gap-1">
                        {tech.specializations.slice(0, 2).map((spec) => (
                          <Badge key={spec} variant="outline" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Performance */}
                    <div>
                      <div className="text-sm font-medium mb-1">Performance</div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="font-medium">{tech.performance.completion_rate}%</div>
                          <div className="text-muted-foreground">Complete</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{tech.performance.avg_resolution_time}h</div>
                          <div className="text-muted-foreground">Avg Time</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{tech.performance.quality_score}/5</div>
                          <div className="text-muted-foreground">Quality</div>
                        </div>
                      </div>
                    </div>

                    {/* Current Tickets */}
                    {tech.current_tickets.length > 0 && (
                      <div>
                        <div className="text-sm font-medium mb-1">Current Work</div>
                        <div className="space-y-1">
                          {tech.current_tickets.slice(0, 2).map((ticket) => (
                            <div key={ticket.id} className="flex items-center justify-between text-xs">
                              <span>{ticket.ticket_number}</span>
                              <Badge
                                variant={
                                  ticket.priority === 1 ? 'destructive' :
                                  ticket.priority === 2 ? 'secondary' : 'outline'
                                }
                                className="text-xs"
                              >
                                P{ticket.priority}
                              </Badge>
                            </div>
                          ))}
                          {tech.current_tickets.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{tech.current_tickets.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Suitability Score */}
                    {suitability && (
                      <div className="border-t pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Match Score</span>
                          <Badge
                            variant={
                              suitability.recommendation === 'excellent' ? 'default' :
                              suitability.recommendation === 'good' ? 'secondary' :
                              suitability.recommendation === 'fair' ? 'outline' : 'destructive'
                            }
                          >
                            {suitability.score}/100
                          </Badge>
                        </div>
                        {suitability.reasons.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {suitability.reasons.slice(0, 2).map((reason, i) => (
                              <div key={i}>• {reason}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Assignment Button */}
                    {selectedTicket && (
                      <Button
                        className="w-full"
                        size="sm"
                        disabled={isAssigning || isAtCapacity}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAssign(selectedTicket.id, tech.id);
                        }}
                        variant={
                          suitability?.recommendation === 'excellent' ? 'default' :
                          suitability?.recommendation === 'good' ? 'secondary' : 'outline'
                        }
                      >
                        {isAssigning ? 'Assigning...' : 'Assign Here'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Assignment Details Modal/Panel */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 w-80 z-50"
          >
            <Card className="border-2 border-primary">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Assign Ticket</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTicket(null)}
                  >
                    <IconX className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="font-medium">{selectedTicket.ticket_number}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedTicket.symptom}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Customer: {selectedTicket.customer_name}
                    </div>
                  </div>
                  <div className="text-sm">
                    Click on a technician card above to assign this ticket, or drag this panel to a technician.
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        selectedTicket.priority === 1 ? 'destructive' :
                        selectedTicket.priority === 2 ? 'secondary' : 'outline'
                      }
                    >
                      Priority {selectedTicket.priority}
                    </Badge>
                    {selectedTicket.estimated_hours && (
                      <Badge variant="outline">
                        {selectedTicket.estimated_hours}h estimated
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
