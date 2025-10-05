# Debugging Attachments Flow - Testing Guide

## Overview
This guide will help you debug why images uploaded in job cards are not appearing in the vehicle/battery sections.

## Step-by-Step Testing Process

### 1. Create a New Job Card with Images

1. Go to `/dashboard/tickets/new`
2. Fill in the customer and symptom details
3. Upload the required vehicle photos (4 photos: front, back, left, right)
4. Optionally upload additional photos
5. Click "Save Ticket"
6. **Note the Job Card ID** (you'll see it in the URL or the ticket number)

### 2. Check the Debug Endpoint

After creating the job card, open your browser's developer console and run:

```javascript
fetch('/api/debug/attachments?ticketId=YOUR_TICKET_ID_HERE')
  .then(r => r.json())
  .then(data => console.table(data.attachments))
```

Replace `YOUR_TICKET_ID_HERE` with the actual ticket ID.

**Expected Output:**
- You should see all uploaded attachments
- `case_type` should be `null` at this point
- `case_id` should be `null` at this point

### 3. Triage the Job Card

1. Go to the job card detail page: `/dashboard/job-cards/[id]`
2. Scroll down to "Triage & Actions"
3. Select "Route To: Vehicle" (or Battery or Both)
4. Optionally add a note
5. Click "Apply Triage"
6. **Open the browser console** - you should see logs like:
   ```
   [Triage] Linking attachments to vehicle case: { ticketId: '...', vehicle_case_id: '...' }
   [Triage] Successfully linked X attachments to vehicle
   ```

### 4. Check Attachments After Triage

Run the debug endpoint again:

```javascript
fetch('/api/debug/attachments?ticketId=YOUR_TICKET_ID_HERE')
  .then(r => r.json())
  .then(data => {
    console.log('Summary:', data.summary);
    console.table(data.attachments);
  })
```

**Expected Output:**
- `summary.vehicle_attachments` should show the count of images
- Each attachment should now have:
  - `case_type: 'vehicle'`
  - `case_id: '<vehicle_case_id>'` (matching the vehicle case ID)

### 5. Check Vehicle Detail Page

1. Navigate to the vehicle detail page: `/dashboard/vehicles/[vehicle_case_id]`
2. Click on the "Attachments" tab
3. **Open the browser console** - you should see logs like:
   ```
   [Vehicle Attachments] Loading for: { vehicleId: '...', ticketId: '...' }
   [listVehicleAttachments] Querying with: { ticketId: '...', vehicleCaseId: '...', case_type: 'vehicle' }
   [listVehicleAttachments] Query result: { success: true, count: X, error: undefined }
   [Vehicle Attachments] Found: X attachments
   ```

## Troubleshooting Scenarios

### Scenario A: Attachments not linked after triage
**Symptoms:**
- Debug endpoint shows `case_type: null` after triage
- Console shows: `[Triage] Successfully linked 0 attachments to vehicle`

**Possible Causes:**
1. Row Level Security (RLS) is blocking the update
2. Attachments were already linked (case_id was not null)

**Fix:**
Check RLS policies on `ticket_attachments` table. Run this in Supabase SQL editor:
```sql
SELECT id, original_name, case_type, case_id, ticket_id 
FROM ticket_attachments 
WHERE ticket_id = 'YOUR_TICKET_ID';
```

### Scenario B: Query returns no results
**Symptoms:**
- Console shows: `[listVehicleAttachments] Query result: { success: true, count: 0 }`
- Attachments exist but with different case_id

**Possible Causes:**
1. Mismatch between `vehicle_case_id` in ticket and the actual vehicle case
2. Attachments linked to wrong case_id

**Fix:**
Run the debug endpoint and compare:
- `ticket.vehicle_case_id` with `vehicleCase.id`
- `attachments[].case_id` with the vehicle case ID

### Scenario C: RLS blocking reads
**Symptoms:**
- Console shows: `[listVehicleAttachments] Query result: { success: false, error: '...' }`

**Possible Causes:**
- User doesn't have permission to read attachments
- Location-based RLS is filtering out results

**Fix:**
Check RLS policies allow SELECT on `ticket_attachments`. Temporarily disable RLS to test:
```sql
ALTER TABLE ticket_attachments DISABLE ROW LEVEL SECURITY;
```
Then re-enable after testing:
```sql
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;
```

## Quick Check Queries

Run these in Supabase SQL editor to inspect data:

### Check ticket and its cases:
```sql
SELECT 
  t.id,
  t.ticket_number,
  t.status,
  t.vehicle_case_id,
  t.battery_case_id,
  vc.vehicle_reg_no,
  br.serial_number
FROM service_tickets t
LEFT JOIN vehicle_cases vc ON t.vehicle_case_id = vc.id
LEFT JOIN battery_records br ON t.battery_case_id = br.id
WHERE t.id = 'YOUR_TICKET_ID';
```

### Check attachments:
```sql
SELECT 
  id,
  original_name,
  attachment_type,
  case_type,
  case_id,
  uploaded_at
FROM ticket_attachments
WHERE ticket_id = 'YOUR_TICKET_ID'
ORDER BY uploaded_at DESC;
```

### Check if attachments match vehicle case:
```sql
SELECT 
  ta.id,
  ta.original_name,
  ta.case_type,
  ta.case_id,
  t.vehicle_case_id,
  CASE 
    WHEN ta.case_id = t.vehicle_case_id THEN '✓ Match'
    WHEN ta.case_id IS NULL THEN '⚠ Not linked'
    ELSE '✗ Mismatch'
  END as status
FROM ticket_attachments ta
JOIN service_tickets t ON ta.ticket_id = t.id
WHERE t.id = 'YOUR_TICKET_ID';
```

## Expected Console Output

When everything works correctly, you should see this sequence in the browser console:

1. **During Triage:**
   ```
   [Triage] Linking attachments to vehicle case: { ticketId: 'xxx', vehicle_case_id: 'yyy' }
   [Triage] Successfully linked 4 attachments to vehicle
   ```

2. **When Loading Vehicle Page:**
   ```
   [Vehicle Attachments] Loading for: { vehicleId: 'yyy', ticketId: 'xxx' }
   [listVehicleAttachments] Querying with: { ticketId: 'xxx', vehicleCaseId: 'yyy', case_type: 'vehicle' }
   [listVehicleAttachments] Query result: { success: true, count: 4, error: undefined }
   [Vehicle Attachments] Found: 4 attachments
   ```

## Next Steps

Once you run through these tests, share:
1. The console output from each step
2. The results from the debug endpoint
3. Any SQL query results

This will help identify exactly where the flow is breaking!

