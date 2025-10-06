# Improved Job Card Creation System

This document outlines the enhanced job card creation system that supports the variability in what customers bring to the service center: vehicles, batteries, or both.

## Overview

The new system addresses the real-world scenario where customers might bring:
1. **Vehicle only** - Electric scooter/bike needing service
2. **Battery only** - Individual battery packs for repair
3. **Both vehicle and batteries** - Vehicle with additional batteries

## Key Features

### 1. Multi-Step Form Interface
- **Step 1**: Customer Information (unchanged from existing system)
- **Step 2**: Item Type Selection - Choose what customer is bringing
- **Step 3**: Item Details - Dynamic forms based on selection
- **Step 4**: Issue Description - Problem description and priority
- **Step 5**: Media Upload & Review - Categorized media with final review

### 2. Dynamic Battery Input
- Add multiple batteries with complete specifications
- Each battery has: serial number, brand, model, type, voltage, capacity, cell type
- Individual condition notes and estimated costs
- Drag-and-drop reordering
- Visual battery counter and validation

### 3. Enhanced Media Upload
- **Tabbed interface**: Vehicle, Battery, General
- **Required vehicle photos**: Front, Rear, Left, Right views
- **Battery-specific uploads**: Separate sections for each battery
- **Voice recording**: Category-specific audio notes
- **Smart categorization**: Files tagged by item type
- **Live preview**: Thumbnails with metadata

### 4. Smart Validation
- Step-by-step completion tracking
- Conditional field validation based on item selection
- Progress indicators and helpful tips
- Form can't proceed without required information

## File Structure

```
src/components/job-cards/
├── improved-job-card-form.tsx       # Main form component
├── dynamic-battery-input.tsx        # Multi-battery input component
└── enhanced-media-upload.tsx        # Categorized media upload

src/app/dashboard/tickets/
└── new-improved/page.tsx            # New improved form page
```

## Component Architecture

### ImprovedJobCardForm
- Main orchestrating component
- Handles multi-step navigation
- Manages form state and validation
- Submits data to existing service ticket API

### DynamicBatteryInput
- Reusable component for battery array management
- Uses react-hook-form's useFieldArray
- Animated add/remove with framer-motion
- Comprehensive battery specifications

### EnhancedMediaUpload
- Three-tab interface (Vehicle/Battery/General)
- Required photo tracking for vehicles
- Battery-specific upload sections
- Audio recording with category tagging
- File preview with management actions

## Usage Examples

### Scenario 1: Vehicle Only
1. Select customer
2. Check "Vehicle" option
3. Fill vehicle details (make, model, reg number)
4. Describe issue
5. Upload required vehicle photos (4) and optional media
6. Submit

### Scenario 2: Battery Only
1. Select customer
2. Check "Battery" option
3. Add one or more batteries with specifications
4. Describe battery issues
5. Upload battery-specific photos and audio
6. Submit

### Scenario 3: Vehicle + Batteries
1. Select customer
2. Check both "Vehicle" and "Battery" options
3. Fill vehicle details AND add batteries
4. Describe combined issues
5. Upload categorized media for both vehicle and batteries
6. Submit

## Testing Scenarios

### Test Case 1: Vehicle-Only Job Card
```
Customer: John Doe
Vehicle: TVS iQube 2023, KL-07-AB-1234
Issue: "Charging issues, not reaching full charge"
Media: 4 required vehicle photos + 2 additional photos
Expected: Job card created with vehicle info, all photos attached
```

### Test Case 2: Battery-Only Job Card
```
Customer: Jane Smith
Batteries: 2 batteries
  - Battery 1: Serial ABC123, TVS, 48V, 20Ah, Li-Ion
  - Battery 2: Serial DEF456, TVS, 48V, 15Ah, Li-Ion
Issue: "Both batteries not holding charge"
Media: Battery photos for each + voice notes
Expected: Job card created with battery details, categorized media
```

### Test Case 3: Combined Job Card
```
Customer: Mike Johnson
Vehicle: Bajaj Chetak 2022, KL-08-CD-5678
Batteries: 1 spare battery (Serial GHI789)
Issue: "Vehicle battery weak, spare battery also needs testing"
Media: Vehicle photos + battery photos + general audio notes
Expected: Job card with both vehicle and battery info, properly categorized media
```

## API Integration

The system integrates with the existing service ticket API:

1. **Create Service Ticket**: Uses existing `serviceTicketsApi.createServiceTicket()`
2. **Upload Attachments**: Uses existing `serviceTicketsApi.uploadAttachments()`
3. **Media Categorization**: Files are tagged with `category` and `batteryIndex`

## Migration Notes

### Backward Compatibility
- Existing job card creation flow remains unchanged at `/dashboard/tickets/new`
- New improved flow is available at `/dashboard/tickets/new-improved`
- Both use the same backend APIs and database schema
- Existing job cards continue to work normally

### Database Considerations
The current database schema already supports the enhanced functionality:
- `service_tickets` table handles the main ticket
- `ticket_attachments` table supports `case_type` and `case_id` for categorization
- Battery information can be stored as structured data in ticket fields

### Future Enhancements (Optional)
For full multi-battery support in the database:
1. Create `ticket_batteries` table to normalize battery data
2. Update triage logic to create multiple battery records
3. Enhance reporting to aggregate battery-specific metrics

## User Experience Improvements

### Visual Feedback
- Step completion indicators
- Real-time validation messages
- File upload progress and status
- Smart field population and hints

### Accessibility
- Keyboard navigation between steps
- Screen reader friendly labels
- Color-blind friendly status indicators
- Clear error messages and guidance

### Mobile Responsiveness
- Touch-friendly interface elements
- Optimized photo capture on mobile
- Responsive grid layouts
- Gesture-friendly drag interactions

## Benefits

1. **Handles Real-World Scenarios**: Supports all customer intake patterns
2. **Better Organization**: Categorized media and structured data collection
3. **Improved UX**: Step-by-step guidance with clear progress
4. **Data Quality**: Comprehensive validation and required field enforcement
5. **Future-Proof**: Extensible architecture for additional item types
6. **Technician Efficiency**: Better organized information for service work

## Getting Started

1. Navigate to `/dashboard/tickets/new-improved` to try the enhanced form
2. Test with different scenarios to see the adaptive interface
3. Upload categorized media to verify proper organization
4. Check job card details to confirm all data is captured correctly

The improved system maintains all existing functionality while dramatically enhancing the ability to handle diverse customer needs efficiently and accurately.
