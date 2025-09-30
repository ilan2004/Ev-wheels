// Common EV Battery Service Issues - Symptom Templates
// Helps managers create tickets faster with pre-defined symptoms, priorities, and technician suggestions

export interface SymptomTemplate {
  id: string;
  category: 'charging' | 'performance' | 'safety' | 'physical' | 'electrical';
  symptom: string;
  description: string;
  suggestedPriority: 1 | 2 | 3; // 1=High, 2=Medium, 3=Low
  estimatedDuration: number; // in hours
  requiredSkills: string[];
  commonCauses: string[];
  urgencyKeywords: string[]; // Keywords that might increase priority
}

export const SYMPTOM_TEMPLATES: SymptomTemplate[] = [
  // CHARGING ISSUES (Most Common)
  {
    id: 'charging-not-starting',
    category: 'charging',
    symptom: 'Battery not charging / charging not starting',
    description: 'Battery does not begin charging when connected to charger',
    suggestedPriority: 2,
    estimatedDuration: 2,
    requiredSkills: ['charging_systems', 'diagnostics'],
    commonCauses: [
      'Faulty charger port',
      'BMS issue',
      'Connection problem',
      'Charger compatibility'
    ],
    urgencyKeywords: ['emergency', 'urgent', 'stranded', 'completely dead']
  },
  {
    id: 'slow-charging',
    category: 'charging',
    symptom: 'Very slow charging / charging takes too long',
    description: 'Battery charging significantly slower than normal',
    suggestedPriority: 3,
    estimatedDuration: 1.5,
    requiredSkills: ['charging_systems', 'battery_diagnostics'],
    commonCauses: [
      'Degraded cells',
      'Temperature issues',
      'Charger problems',
      'BMS calibration'
    ],
    urgencyKeywords: ['urgent', 'daily_commute', 'work_vehicle']
  },
  {
    id: 'charging-stops',
    category: 'charging',
    symptom: 'Charging stops midway / interrupts frequently',
    description: 'Charging process stops unexpectedly before completion',
    suggestedPriority: 2,
    estimatedDuration: 2.5,
    requiredSkills: ['charging_systems', 'electrical_diagnostics'],
    commonCauses: [
      'Overheating',
      'BMS protection',
      'Loose connections',
      'Cell imbalance'
    ],
    urgencyKeywords: ['frequent', 'every_time', 'always']
  },

  // PERFORMANCE ISSUES
  {
    id: 'reduced-range',
    category: 'performance',
    symptom: 'Significant reduction in driving range',
    description: 'Battery provides much less range than before or expected',
    suggestedPriority: 2,
    estimatedDuration: 3,
    requiredSkills: ['battery_diagnostics', 'capacity_testing'],
    commonCauses: [
      'Cell degradation',
      'Imbalanced cells',
      'BMS calibration',
      'Temperature effects'
    ],
    urgencyKeywords: ['sudden', 'drastic', 'half', 'emergency']
  },
  {
    id: 'rapid-discharge',
    category: 'performance',
    symptom: 'Battery drains very quickly / rapid power loss',
    description: 'Battery loses charge much faster than normal during use',
    suggestedPriority: 1,
    estimatedDuration: 2,
    requiredSkills: ['electrical_diagnostics', 'parasitic_drain'],
    commonCauses: [
      'Parasitic drain',
      'Faulty cells',
      'Short circuit',
      'BMS malfunction'
    ],
    urgencyKeywords: ['emergency', 'minutes', 'dangerous', 'stranded']
  },
  {
    id: 'inconsistent-performance',
    category: 'performance',
    symptom: 'Power delivery inconsistent / jerky performance',
    description: 'Battery power output varies unexpectedly during operation',
    suggestedPriority: 2,
    estimatedDuration: 2.5,
    requiredSkills: ['power_electronics', 'electrical_diagnostics'],
    commonCauses: [
      'Cell voltage variance',
      'Connection issues',
      'BMS problems',
      'Temperature variation'
    ],
    urgencyKeywords: ['safety', 'dangerous', 'traffic', 'accident']
  },

  // SAFETY ISSUES (High Priority)
  {
    id: 'overheating',
    category: 'safety',
    symptom: 'Battery overheating / excessive heat generation',
    description: 'Battery becomes unusually hot during charging or operation',
    suggestedPriority: 1,
    estimatedDuration: 1,
    requiredSkills: ['thermal_management', 'safety_protocols'],
    commonCauses: [
      'Thermal runaway risk',
      'Cooling system failure',
      'Overcharging',
      'Cell damage'
    ],
    urgencyKeywords: ['hot', 'burning', 'smoke', 'smell', 'emergency']
  },
  {
    id: 'swelling',
    category: 'safety',
    symptom: 'Battery swelling / physical expansion',
    description: 'Battery pack shows signs of physical swelling or expansion',
    suggestedPriority: 1,
    estimatedDuration: 0.5,
    requiredSkills: ['safety_protocols', 'battery_replacement'],
    commonCauses: [
      'Gas buildup',
      'Cell failure',
      'Overcharging',
      'Age-related degradation'
    ],
    urgencyKeywords: ['bulging', 'expanded', 'safety', 'immediate']
  },
  {
    id: 'unusual-smell',
    category: 'safety',
    symptom: 'Strange smell / chemical odor from battery',
    description: 'Unusual or chemical-like smell coming from battery area',
    suggestedPriority: 1,
    estimatedDuration: 1,
    requiredSkills: ['safety_protocols', 'hazmat_handling'],
    commonCauses: [
      'Electrolyte leakage',
      'Cell venting',
      'Thermal issues',
      'Chemical reaction'
    ],
    urgencyKeywords: ['smell', 'gas', 'chemical', 'burning', 'emergency']
  },

  // PHYSICAL ISSUES
  {
    id: 'physical-damage',
    category: 'physical',
    symptom: 'Visible physical damage to battery pack',
    description: 'Cracks, dents, or other visible damage to battery housing',
    suggestedPriority: 1,
    estimatedDuration: 4,
    requiredSkills: ['structural_repair', 'safety_protocols'],
    commonCauses: [
      'Impact damage',
      'Accident',
      'Corrosion',
      'Mounting failure'
    ],
    urgencyKeywords: ['accident', 'crash', 'damaged', 'broken', 'safety']
  },
  {
    id: 'connector-issues',
    category: 'physical',
    symptom: 'Loose or damaged charging port / connectors',
    description: 'Physical issues with charging port or battery connectors',
    suggestedPriority: 2,
    estimatedDuration: 1.5,
    requiredSkills: ['connector_repair', 'mechanical_assembly'],
    commonCauses: [
      'Wear and tear',
      'Corrosion',
      'Loose mounting',
      'Foreign objects'
    ],
    urgencyKeywords: ['loose', 'sparking', 'dangerous']
  },

  // ELECTRICAL ISSUES
  {
    id: 'voltage-issues',
    category: 'electrical',
    symptom: 'Voltage irregularities / electrical faults',
    description: 'Abnormal voltage readings or electrical behavior',
    suggestedPriority: 2,
    estimatedDuration: 3,
    requiredSkills: ['electrical_diagnostics', 'multimeter_testing'],
    commonCauses: [
      'Cell imbalance',
      'BMS failure',
      'Wiring issues',
      'Sensor problems'
    ],
    urgencyKeywords: ['sparking', 'electrical', 'dangerous', 'short_circuit']
  },
  {
    id: 'bms-error',
    category: 'electrical',
    symptom: 'Battery Management System (BMS) error codes',
    description: 'BMS showing error codes or warning indicators',
    suggestedPriority: 2,
    estimatedDuration: 2,
    requiredSkills: ['bms_diagnostics', 'software_troubleshooting'],
    commonCauses: [
      'Software glitch',
      'Sensor failure',
      'Communication error',
      'Calibration needed'
    ],
    urgencyKeywords: ['error', 'warning', 'fault', 'system_failure']
  },

  // GENERAL / OTHER
  {
    id: 'general-malfunction',
    category: 'electrical',
    symptom: 'General malfunction / multiple issues',
    description:
      'Battery experiencing multiple problems or general malfunction',
    suggestedPriority: 2,
    estimatedDuration: 4,
    requiredSkills: ['comprehensive_diagnostics', 'troubleshooting'],
    commonCauses: [
      'Multiple component failure',
      'Age-related issues',
      'System integration problems'
    ],
    urgencyKeywords: ['multiple', 'everything', 'complete_failure', 'emergency']
  }
];

// Utility functions for working with symptom templates

export const getSymptomsByCategory = (
  category: SymptomTemplate['category']
) => {
  return SYMPTOM_TEMPLATES.filter((template) => template.category === category);
};

export const getSymptomById = (id: string) => {
  return SYMPTOM_TEMPLATES.find((template) => template.id === id);
};

export const suggestPriorityFromDescription = (
  description: string
): 1 | 2 | 3 => {
  const lowerDesc = description.toLowerCase();

  // High priority keywords
  const highPriorityKeywords = [
    'emergency',
    'urgent',
    'immediate',
    'dangerous',
    'safety',
    'smoke',
    'fire',
    'overheating',
    'swelling',
    'sparking',
    'smell',
    'burning',
    'stranded'
  ];

  // Medium priority keywords
  const mediumPriorityKeywords = [
    'frequent',
    'daily',
    'work',
    'commute',
    'important',
    'soon',
    'problem'
  ];

  if (highPriorityKeywords.some((keyword) => lowerDesc.includes(keyword))) {
    return 1; // High priority
  }

  if (mediumPriorityKeywords.some((keyword) => lowerDesc.includes(keyword))) {
    return 2; // Medium priority
  }

  return 3; // Default to low priority
};

export const suggestTechniciansForSymptom = (
  symptomId: string,
  availableTechnicians: any[]
) => {
  const symptom = getSymptomById(symptomId);
  if (!symptom) return [];

  return availableTechnicians.filter((tech) =>
    symptom.requiredSkills.some(
      (skill) =>
        tech.skills?.includes(skill) || tech.specializations?.includes(skill)
    )
  );
};

export const CATEGORY_LABELS = {
  charging: 'Charging Issues',
  performance: 'Performance Issues',
  safety: 'Safety Concerns',
  physical: 'Physical Damage',
  electrical: 'Electrical Problems'
} as const;

export const PRIORITY_LABELS = {
  1: 'High Priority',
  2: 'Medium Priority',
  3: 'Low Priority'
} as const;

export const PRIORITY_COLORS = {
  1: 'destructive',
  2: 'secondary',
  3: 'outline'
} as const;
