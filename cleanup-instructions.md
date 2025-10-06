# Database Cleanup Instructions

## Overview
This guide will help you clean up all existing data from your Supabase database to prepare it for production deployment to your client.

## Method 1: Using Supabase Dashboard (Recommended)

### Steps:
1. **Go to your Supabase Dashboard**
   - Navigate to your project at [supabase.com](https://supabase.com)
   - Go to the SQL Editor

2. **Execute the cleanup script**
   - Open the file `cleanup-database.sql` in a text editor
   - Copy the entire contents
   - Paste it into the Supabase SQL Editor
   - Click "Run" to execute

3. **Verify cleanup**
   - The script includes verification queries at the end
   - All tables should show `record_count = 0`

## Method 2: Using Supabase CLI

### Prerequisites:
- Supabase CLI installed
- Logged in to your Supabase account

### Steps:
```powershell
# Navigate to your project directory
cd "E:\All Softwares\Ev"

# Execute the cleanup script
supabase db reset --db-url "your_database_url"

# Or run the SQL file directly
psql "your_database_url" -f cleanup-database.sql
```

## Method 3: Manual Cleanup via Dashboard

If you prefer to do it step by step:

### 1. Delete Data in Order:
Go to your Supabase Dashboard > Table Editor and delete all records from these tables **in this order**:

1. `service_ticket_history`
2. `vehicle_status_history`  
3. `battery_status_history`
4. `customers_audit`
5. `ticket_attachments`
6. `vehicle_cases`
7. `service_tickets`
8. `technical_diagnostics`
9. `repair_estimates`
10. `battery_records`
11. `customers`
12. `user_locations`
13. `locations`
14. `profiles`

### 2. Clear Storage (if applicable):
- Go to Storage in your Supabase Dashboard
- Delete all files from any storage buckets you've created

## Verification

After cleanup, run these queries in the SQL Editor to verify:

```sql
SELECT 'customers' as table_name, COUNT(*) as record_count FROM public.customers
UNION ALL
SELECT 'battery_records', COUNT(*) FROM public.battery_records
UNION ALL
SELECT 'service_tickets', COUNT(*) FROM public.service_tickets
UNION ALL
SELECT 'profiles', COUNT(*) FROM public.profiles;
```

**All counts should be 0**

## What This Cleanup Preserves

✅ **Keeps intact:**
- All table schemas
- All database functions and triggers
- All RLS policies
- All indexes
- Auth system configuration

❌ **Removes:**
- All customer records
- All battery service records
- All service tickets and job cards
- All user profiles (but not auth.users)
- All location data
- All uploaded attachments metadata

## Final Steps for Production

1. **Create your first admin user:**
   - Your client can sign up through your application
   - The first user will need to create locations and set up their team

2. **Test the application:**
   - Verify login works
   - Create a test customer
   - Create a test battery record
   - Ensure all features work as expected

3. **Configure production settings:**
   - Update any environment variables
   - Set appropriate RLS policies if needed
   - Configure email templates in Supabase Auth

## Support

If you encounter any issues during cleanup:
1. Check the Supabase logs in the Dashboard
2. Ensure you're running the script with proper permissions
3. The script is designed to be safe and idempotent - you can run it multiple times

Your database will be completely clean and ready for production use! 🚀
