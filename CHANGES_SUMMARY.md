# Changes Summary - Debugging Attachment Flow

## Problem
Images uploaded in job cards are not appearing in the vehicle/battery sections after triaging.

## Changes Made

### 1. Added Debug Logging

#### File: `src/lib/api/service-tickets.supabase.ts`
- **Lines 407-426**: Added console logging to the `triageTicket` function to track:
  - When attachments are being linked
  - How many attachments were successfully linked
  - Any errors during the linking process

- **Lines 583-603**: Added console logging to `listVehicleAttachments` function to track:
  - Query parameters being used
  - Query results (success/failure, count)
  - Any errors during the query

#### File: `src/app/dashboard/vehicles/[id]/page.tsx`
- **Lines 66-80**: Added console logging when loading vehicle attachments to track:
  - Vehicle ID and Ticket ID being queried
  - API response details
  - Number of attachments found

### 2. Created Debug Endpoint

#### File: `src/app/api/debug/attachments/route.ts` (NEW)
A diagnostic API endpoint that returns:
- Ticket details (ID, status, linked cases)
- Vehicle case details (if exists)
- Battery case details (if exists)
- All attachments for the ticket with their linking status
- Summary statistics:
  - Total attachments
  - Vehicle-linked attachments
  - Battery-linked attachments
  - Unlinked attachments

**Usage:**
```
GET /api/debug/attachments?ticketId=YOUR_TICKET_ID
```

### 3. Created Testing Documentation

#### File: `DEBUGGING_ATTACHMENTS.md` (NEW)
Comprehensive guide including:
- Step-by-step testing process
- Expected console output at each stage
- Troubleshooting scenarios with fixes
- SQL queries for direct database inspection
- Common issues and their solutions

## How to Use

### Step 1: Start your dev server
```bash
npm run dev
```

### Step 2: Follow the Testing Guide
Open `DEBUGGING_ATTACHMENTS.md` and follow the step-by-step process:
1. Create a job card with images
2. Check the debug endpoint
3. Triage the ticket
4. Check attachments after triage
5. Visit the vehicle detail page

### Step 3: Monitor Console Output
Keep your browser's developer console open throughout the process. You should see detailed logs showing:
- When attachments are uploaded
- When triage links attachments to cases
- When the vehicle page queries for attachments
- Any errors or issues

### Step 4: Use Debug Endpoint
After each step, call the debug endpoint to inspect the database state:
```javascript
fetch('/api/debug/attachments?ticketId=YOUR_TICKET_ID')
  .then(r => r.json())
  .then(console.log)
```

## Expected Behavior

### Before Triage:
- Attachments uploaded to ticket
- `case_type` = `null`
- `case_id` = `null`

### After Triage to Vehicle:
- Attachments updated
- `case_type` = `'vehicle'`
- `case_id` = `<vehicle_case_id>`

### On Vehicle Detail Page:
- Query filters by `ticket_id`, `case_type='vehicle'`, and `case_id=<vehicle_case_id>`
- Should return all linked attachments
- Display them in the Attachments tab

## Potential Issues to Check

### 1. Row Level Security (RLS)
If attachments aren't being linked, RLS might be blocking the UPDATE operation.
- Check if the current user has UPDATE permission on `ticket_attachments`
- Check if location-based RLS is interfering

### 2. Query Mismatch
If attachments exist but aren't showing:
- Verify `ticket.vehicle_case_id` matches `vehicleCase.id`
- Verify `attachment.case_id` matches `ticket.vehicle_case_id`
- Check for typos or UUID mismatches

### 3. Missing Triage Step
Attachments only get linked during triage. If you:
- Create a job card with images
- Directly visit `/dashboard/vehicles/[id]`
- Without triaging first
Then attachments won't be visible because they're not linked yet.

## Build Status
✅ All changes compile successfully with no errors.

## Next Steps

1. Run the dev server: `npm run dev`
2. Follow the testing guide in `DEBUGGING_ATTACHMENTS.md`
3. Share the console logs and debug endpoint output
4. Based on the logs, we can identify the exact issue

The debugging infrastructure is now in place to help identify where the attachment flow is breaking!

