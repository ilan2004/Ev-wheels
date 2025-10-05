# Activity API Fix - Server-Side Location Scoping

## Problem
The `/api/activity` route was failing with the error:
```
Error: Attempted to call scopeQuery() from the server but scopeQuery is on the client.
```

## Root Cause
The `scopeQuery()` function in `src/lib/location/scope.ts` is marked with `'use client'` because it uses `localStorage` to retrieve the active location ID. This function cannot be called from server-side API routes, which don't have access to browser APIs like `localStorage`.

## Solution
Created a new server-side compatible version of the location scoping utilities:

### New File: `src/lib/location/scope.server.ts`
- **`scopeQueryServer()`**: Server-side version of `scopeQuery()` that:
  - Bypasses scoping for Admin and Front Desk users
  - Accepts an optional explicit `locationId` parameter
  - Relies on Supabase RLS (Row Level Security) policies for automatic filtering based on authenticated user
  - Does NOT use `localStorage` or any client-side APIs

- **`withLocationIdServer()`**: Server-side version of `withLocationId()` for insert operations

### Updated File: `src/app/api/activity/route.ts`
Changed imports and function calls:
```typescript
// Before
import { scopeQuery } from '@/lib/location/scope';
ticketHistoryQuery = scopeQuery('service_ticket_history', ticketHistoryQuery, { isAdmin, isFrontDesk });

// After  
import { scopeQueryServer } from '@/lib/location/scope.server';
ticketHistoryQuery = scopeQueryServer('service_ticket_history', ticketHistoryQuery, { isAdmin, isFrontDesk });
```

## How It Works

### Client-Side (Components, Pages)
- Use `scopeQuery()` from `@/lib/location/scope`
- Reads active location from `localStorage`
- Filters queries based on user's selected location

### Server-Side (API Routes)
- Use `scopeQueryServer()` from `@/lib/location/scope.server`
- Relies on Supabase RLS policies for automatic user-based filtering
- Admin/Front Desk users bypass all location filtering
- Optional: Pass explicit `locationId` if available

## Scoped Tables
Both client and server versions scope the same tables:
- `customers`
- `battery_records`
- `service_tickets`
- `vehicle_cases`
- `service_ticket_history`
- `quotes`
- `invoices`
- `payments`

## Testing
1. Start the dev server: `npm run dev`
2. Navigate to the dashboard (should trigger activity API call)
3. Check browser console and server logs - no more errors
4. Verify that activity feed shows appropriate data based on user role

## Future Considerations
If other API routes have similar issues:
1. Check if they import from `@/lib/location/scope`
2. If they're server-side routes, switch to `@/lib/location/scope.server`
3. Ensure admin/front desk role checks are in place
4. Consider if explicit `locationId` needs to be passed

## Related Files
- `src/lib/location/scope.ts` (client-side)
- `src/lib/location/scope.server.ts` (server-side) ✨ NEW
- `src/app/api/activity/route.ts` (updated)
- `src/lib/location/admin-check.ts` (role checking utilities)

