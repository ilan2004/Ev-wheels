# Mandatory 4-Side Vehicle Photos - Implementation Guide

## 🎯 Overview

Implemented a **mandatory 4-side vehicle photo requirement** for creating job cards with vehicle intake type. Users must upload photos of the front, rear, left, and right sides of the vehicle before they can submit the job card form.

---

## 📋 Requirements

When creating a new job card with **intake type = "vehicle"**:
- ✅ **Front View Photo** - Required
- ✅ **Rear View Photo** - Required
- ✅ **Left Side Photo** - Required
- ✅ **Right Side Photo** - Required

The submit button is **disabled** until all 4 photos are uploaded.

---

## 🆕 New Component

### **MandatoryVehiclePhotos**
**Location:** `src/components/job-cards/mandatory-vehicle-photos.tsx`

A dedicated component for capturing the 4 mandatory vehicle side photos with:
- Individual upload slots for each side
- Real-time progress tracking (X / 4 completed)
- Visual indicators (green border when uploaded)
- Replace/Remove functionality per photo
- Drag & drop support for each slot
- Image previews
- Validation and error handling

---

## 🎨 UI Features

### **Visual Progress**
```
┌─────────────────────────────────────┐
│ Required Vehicle Photos   [2 / 4]   │
│ ████████████░░░░░░░░░░░░░░░░░░░     │  ← Progress bar (50%)
└─────────────────────────────────────┘
```

### **Photo Grid Layout**
```
┌──────────────┬──────────────┐
│  Front View  │  Rear View   │  ← Row 1
│  [Required]  │  [Required]  │
│    ✓ ✅      │    📷        │
└──────────────┴──────────────┘

┌──────────────┬──────────────┐
│  Left Side   │  Right Side  │  ← Row 2
│  [Required]  │  [Required]  │
│    📷        │    📷        │
└──────────────┴──────────────┘
```

### **Status Indicators**

#### Before Upload:
- Gray dashed border
- Camera icon
- "Upload photo" text
- Description of what to capture

#### After Upload:
- **Green solid border** ✅
- Photo preview
- Green checkmark icon
- Hover overlay with Replace/Remove buttons

### **Alerts**

#### Incomplete (Red Alert):
```
⚠️ Action Required: Please upload photos of all 4 sides 
   of the vehicle. This is mandatory to create a job card.
```

#### Complete (Green Alert):
```
✅ All photos captured! You can now proceed to submit 
   the job card.
```

---

## 🔒 Validation Logic

### **Submit Button State**
```typescript
// Button is disabled when:
disabled={isSubmitting || (isVehicleIntake && !mandatoryPhotosComplete)}

// Where:
// - isVehicleIntake = intake_type === 'vehicle'
// - mandatoryPhotosComplete = 4 photos uploaded
```

### **Photo Validation**
- ✅ Must be image file (image/*)
- ✅ Max 10MB per file
- ✅ One photo per side (can replace)
- ✅ All 4 sides required before submit

---

## 📱 User Experience

### **Step-by-Step Flow**

#### 1. User Selects "Vehicle" Intake Type
- Mandatory photo component appears
- Shows 4 empty upload slots
- Progress bar shows 0 / 4
- Submit button is disabled

#### 2. User Uploads Photos
For each side:
- Click "Choose File" or drag & drop
- Photo validates (type, size)
- Preview appears immediately
- Green border confirms upload
- Progress updates (1 / 4, 2 / 4, etc.)

#### 3. User Completes All 4 Photos
- Progress shows 4 / 4
- Green success alert appears
- Submit button becomes enabled
- User can proceed with form

#### 4. User Can Replace/Remove Photos
- Hover over uploaded photo
- Black overlay appears
- "Replace" or "Remove" buttons available
- Can fix mistakes before submitting

---

## 💡 Photography Guidelines

Built-in tips shown to users:

**Tips in Component:**
> Take photos in good lighting. Show the full vehicle from each angle. 
> Capture any visible damage or unique features. Max 10MB per photo.

**Side-Specific Descriptions:**

| Side | Description |
|------|-------------|
| **Front** | Clear view of the front including headlights and bumper |
| **Rear** | Clear view of the back including tail lights and number plate |
| **Left** | Full left side profile view |
| **Right** | Full right side profile view |

---

## 🔄 Integration with Job Card Creation

### **File Upload Flow**

1. **Mandatory Photos** are collected separately
2. **Optional Media** via EnhancedMediaUploader
3. On form submit:
   - Create ticket in database
   - Upload mandatory photos first
   - Then upload optional media
   - Navigate to ticket detail page

### **Code Example**
```typescript
// Collect mandatory photos
const mandatoryPhotos = Object.values(mandatoryVehiclePhotos);

// Combine with optional photos
const allPhotos = [
  ...mandatoryPhotos,
  ...photoCategories.flatMap((cat) => collectedFiles[cat] || [])
];

// Upload all at once
await serviceTicketsApi.uploadAttachments({
  ticketId: newTicketId,
  files: allPhotos,
  type: 'photo'
});
```

---

## 📊 Sidebar Progress Indicator

The right sidebar shows real-time status:

### **Incomplete State**
```
┌─────────────────────────────┐
│ 🚗 Required: 4 Vehicle Photos│
│                              │
│ You must upload photos of    │
│ all 4 sides (Front, Rear,    │
│ Left, Right) before          │
│ submitting.                  │
│                              │
│   2 / 4                      │
└─────────────────────────────┘
```

### **Complete State**
```
┌─────────────────────────────┐
│ 🚗 Required: 4 Vehicle Photos│
│                              │
│ You must upload photos of    │
│ all 4 sides (Front, Rear,    │
│ Left, Right) before          │
│ submitting.                  │
│                              │
│   4 / 4  ✓ Complete         │
└─────────────────────────────┘
```

---

## 🎨 Component Props

### **MandatoryVehiclePhotos**

```typescript
interface MandatoryVehiclePhotosProps {
  onPhotosChange: (photos: Record<string, File>) => void;
  className?: string;
}

// Usage:
<MandatoryVehiclePhotos
  onPhotosChange={setMandatoryVehiclePhotos}
/>

// Photos object structure:
{
  'front': File,    // Front view photo
  'rear': File,     // Rear view photo
  'left': File,     // Left side photo
  'right': File     // Right side photo
}
```

---

## 🔧 Technical Implementation

### **State Management**
```typescript
// Track mandatory photos
const [mandatoryVehiclePhotos, setMandatoryVehiclePhotos] = useState<
  Record<string, File>
>({});

// Calculate completion
const mandatoryPhotosCount = Object.keys(mandatoryVehiclePhotos).length;
const mandatoryPhotosComplete = mandatoryPhotosCount === 4;

// Check intake type
const intakeType = form.watch('intake_type');
const isVehicleIntake = intakeType === 'vehicle';
```

### **Conditional Rendering**
```typescript
{/* Only show for vehicle intake */}
{isVehicleIntake && (
  <MandatoryVehiclePhotos
    onPhotosChange={setMandatoryVehiclePhotos}
  />
)}
```

### **Submit Validation**
```typescript
<Button
  type='submit'
  disabled={
    isSubmitting || 
    (isVehicleIntake && !mandatoryPhotosComplete)
  }
>
  {isSubmitting ? 'Saving...' : 'Save Ticket'}
</Button>
```

---

## 🎭 User Scenarios

### **Scenario 1: Happy Path**
1. User opens new job card form
2. Selects customer and symptoms
3. Chooses "Vehicle" intake type
4. Sees mandatory photo section
5. Uploads front photo → 1/4 ✅
6. Uploads rear photo → 2/4 ✅
7. Uploads left photo → 3/4 ✅
8. Uploads right photo → 4/4 ✅
9. Green alert: "All photos captured!"
10. Adds optional media if needed
11. Clicks "Save Ticket" (now enabled)
12. Photos upload → success ✅

### **Scenario 2: Missing Photos**
1. User fills form
2. Uploads only 2 vehicle photos
3. Tries to submit
4. Submit button is disabled (grayed out)
5. Red alert shows: "Action Required"
6. Progress shows 2/4
7. User must upload remaining photos
8. Once 4/4, submit becomes available

### **Scenario 3: Replace Photo**
1. User uploads wrong photo for "Front"
2. Hovers over front photo
3. Black overlay appears
4. Clicks "Replace"
5. Selects correct photo
6. Preview updates immediately
7. Still shows 4/4 complete

### **Scenario 4: Battery Intake**
1. User selects "Battery" intake type
2. Mandatory photo section **does not appear**
3. Only optional media uploader shows
4. Submit button enabled without photos
5. (Battery intake doesn't require 4-side photos)

---

## 🚀 Benefits

### **For Technicians**
- ✅ Clear guidance on what photos to take
- ✅ Visual confirmation of completion
- ✅ Can't forget required photos
- ✅ Easy to replace/fix mistakes

### **For Quality Control**
- ✅ Ensures consistent documentation
- ✅ All vehicles have complete visual records
- ✅ Reduces missing documentation
- ✅ Better insurance/dispute handling

### **For Management**
- ✅ Standardized intake process
- ✅ Complete audit trail
- ✅ Professional documentation
- ✅ Reduced errors

---

## 📝 File Structure

```
src/
├── components/
│   └── job-cards/
│       ├── enhanced-media-uploader.tsx      ← Optional media
│       └── mandatory-vehicle-photos.tsx     ← NEW: 4-side photos
│
└── app/
    └── dashboard/
        └── tickets/
            └── new/
                └── page.tsx                  ← Updated with validation
```

---

## 🧪 Testing Checklist

- ✅ TypeScript compilation (no errors)
- ✅ Component renders correctly
- ✅ Upload works for each side
- ✅ Progress updates correctly (X/4)
- ✅ Submit disabled until 4/4
- ✅ Submit enabled when complete
- ✅ Replace functionality works
- ✅ Remove functionality works
- ✅ Drag & drop works
- ✅ File validation (type, size)
- ✅ Preview generation works
- ✅ Alerts show/hide correctly
- ✅ Only appears for vehicle intake
- ✅ Photos upload to correct ticket
- ✅ Responsive on mobile

---

## 🎨 Visual Examples

### **Empty State**
```
┌──────────────────────────────┐
│ Camera Icon                   │
│ Upload photo                  │
│ "Clear view of the front..."  │
│ [Choose File]                 │
└──────────────────────────────┘
```

### **With Photo**
```
┌──────────────────────────────┐
│ [Front View]  [Required] ✅   │
│ [Photo Preview Image]         │
│ (hover for Replace/Remove)    │
└──────────────────────────────┘
```

### **Progress Indicator**
```
Progress Bar: ████████████░░░░ 75% (3/4)
```

---

## ⚙️ Configuration

### **Vehicle Sides Array**
```typescript
const VEHICLE_SIDES: VehicleSide[] = [
  {
    id: 'front',
    label: 'Front View',
    description: 'Clear view of the front including headlights and bumper',
    required: true
  },
  {
    id: 'rear',
    label: 'Rear View',
    description: 'Clear view of the back including tail lights and number plate',
    required: true
  },
  {
    id: 'left',
    label: 'Left Side',
    description: 'Full left side profile view',
    required: true
  },
  {
    id: 'right',
    label: 'Right Side',
    description: 'Full right side profile view',
    required: true
  }
];
```

To add more sides or make some optional, modify this array.

---

## 🔄 Future Enhancements

Potential improvements:

1. **Camera Integration**
   - Direct camera capture on mobile
   - No need to choose from gallery

2. **Photo Quality Validation**
   - Check for blur
   - Ensure proper lighting
   - Validate vehicle is in frame

3. **AI Suggestions**
   - Auto-detect which side is shown
   - Suggest correct slot

4. **Template Photos**
   - Show example photos
   - "This is what we need" guide

5. **Bulk Upload**
   - Upload 4 photos at once
   - Auto-assign to correct slots

---

## ✅ Summary

Successfully implemented mandatory 4-side vehicle photo requirement:

- ✨ **New Component**: MandatoryVehiclePhotos with beautiful UI
- 🔒 **Validation**: Submit disabled until 4/4 photos uploaded
- 📊 **Progress Tracking**: Real-time X/4 counter and progress bar
- 🎨 **Visual Feedback**: Green borders, alerts, status indicators
- 📱 **User-Friendly**: Clear guidance and easy photo management
- 🚀 **Production Ready**: Tested and integrated

**Result**: Technicians cannot create a vehicle job card without uploading all 4 required vehicle side photos!

---

**Last Updated**: 2025-10-01  
**Version**: 1.0.0  
**Status**: ✅ Production Ready

