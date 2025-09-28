// Enhanced Manager Dashboard Components - Phase 2
export { EnhancedTicketCreation } from './enhanced-ticket-creation';
export { SmartMediaUpload } from './smart-media-upload';
export { QuickAssignment } from './quick-assignment';

// Export symptom templates and utilities
export {
  SYMPTOM_TEMPLATES,
  getSymptomsByCategory,
  getSymptomById,
  suggestPriorityFromDescription,
  suggestTechniciansForSymptom,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  type SymptomTemplate
} from './symptom-templates';

// Types
export type { EnhancedTicketCreationProps } from './enhanced-ticket-creation';
export type { SmartMediaUploadProps, MediaFile } from './smart-media-upload';
export type { QuickAssignmentProps, TicketSummary, Technician } from './quick-assignment';
