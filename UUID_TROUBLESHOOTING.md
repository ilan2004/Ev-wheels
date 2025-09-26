# UUID Troubleshooting Guide

## Issue Fixed ✅
The error `invalid input syntax for type uuid: "1"` has been resolved by:

1. **Enabled Mock API**: Added `USE_MOCK_API=true` to `.env.local`
2. **Updated Navigation**: Battery list now generates proper UUIDs for navigation
3. **Enhanced Mock API**: Handles both UUID and simple ID formats

## What Was The Problem?
- Your database uses UUID format (e.g., `a1b2c3d4-e5f6-4789-8abc-123456789001`)
- Your application was passing simple integers like "1", "2" 
- Supabase rejected these as invalid UUID format

## Current Solution
The app now uses mock data with UUID-compatible navigation. When you click "View Details" on any battery, it will:
1. Convert the simple ID "1" to a proper UUID format
2. Navigate to `/dashboard/batteries/a1b2c3d4-e5f6-4789-8abc-123456789001`
3. The mock API will handle this UUID and show battery details

## To Use Real Database (Future)
When ready to connect to your real Supabase database:

1. **Set environment variable**: `USE_MOCK_API=false` in `.env.local`
2. **Get real UUIDs**: Run the test script to see actual battery IDs:
   ```bash
   node test-database.js
   ```
3. **Update sample data**: Replace the SAMPLE_BATTERY_UUIDS in `uuid-utils.ts` with real UUIDs from your database

## Files Modified
- ✅ `.env.local` - Added `USE_MOCK_API=true`
- ✅ `battery-management.tsx` - Updated navigation to use UUIDs
- ✅ `batteries.ts` - Enhanced mock API to handle UUIDs
- ✅ `uuid-utils.ts` - Added UUID utility functions
- ✅ `test-database.js` - Created database testing script

## Test Your Fix
1. Start the development server: `npm run dev`
2. Go to `/dashboard/batteries`
3. Click "View Details" on any battery
4. You should see the battery details page without UUID errors

## Next Steps
Once your database has proper data:
1. Run the test script to get real UUIDs
2. Update the sample UUID mappings
3. Switch to `USE_MOCK_API=false`
4. Test with real database connection
