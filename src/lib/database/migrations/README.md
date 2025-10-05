# Database Migrations

This directory contains SQL migration scripts for the Ev Wheels database.

## Applying Migrations

To apply a migration to your Supabase database:

1. Open the Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to your project
3. Go to SQL Editor
4. Copy the contents of the migration file
5. Paste into the SQL Editor
6. Click "Run" to execute

## Migration Files

### add-profiles-table.sql
Creates the `profiles` table to store user profile information (username, email) linked to auth users.

**Required:** This migration must be applied for the job card creator information feature to work.

**What it does:**
- Creates the `profiles` table with user_id, username, email, timestamps
- Sets up RLS policies for secure access
- Creates a trigger to automatically create profiles when users sign up
- Adds indexes for performance

### Other Migrations
- `fix-null-updated-by.sql` - Fixes NULL values in updated_by fields
- `add-vehicle-thumbnails.sql` - Adds thumbnail support for vehicle photos
- `2025-09-27_remove_assignment.sql` - Removes deprecated assignment fields

## Troubleshooting

If you see errors like "relation 'profiles' does not exist", make sure to run the `add-profiles-table.sql` migration first.

For existing users who don't have profiles yet, you can manually create them with:

```sql
INSERT INTO profiles (user_id, email, username)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1))
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
```

