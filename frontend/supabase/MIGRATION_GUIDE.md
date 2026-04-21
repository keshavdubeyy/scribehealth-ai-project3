# Supabase Migration Guide

This guide explains how to complete the migration from the custom Java/Go/Node backend to a **Supabase-complete** serverless architecture.

## 1. Phase 1: Database Schema
Ensure you have run the updated `frontend/supabase/schema.sql` in your Supabase SQL Editor. 
This adds the critical `profiles`, `organizations`, and `invites` tables required for identity management.

## 2. Phase 2: User Migration (Supabase Auth)
Since passwords in Supabase Auth use the `auth.users` system, you must migrate your doctors and admins there.

### A. Manual Migration (Small Teams)
1. Go to **Authentication → Users → Add User**.
2. Enter the email and a temporary password for each doctor/admin.
3. Once the user is created, copy their **User ID**.
4. Go to **Table Editor → profiles**.
5. Insert a row for that user:
   - `email`: same as Auth
   - `name`: Full Name
   - `role`: `DOCTOR` or `ADMIN`
   - `organization_id`: Copy from your `organizations` table.

### B. Bulk Migration Script
If you have many users, use the script below in a local Node env:

```javascript
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(URL, SERVICE_ROLE_KEY)

async function migrateUser(user) {
  // 1. Create User in Supabase Auth
  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: 'TemporaryPassword123!',
    email_confirm: true,
    user_metadata: { name: user.name }
  })

  if (error) return console.error(error)

  // 2. Create entry in profiles table
  await supabase.from('profiles').insert({
    email: user.email,
    name:  user.name,
    role:  user.role,
    organization_id: user.orgId
  })
}
```

## 3. Phase 3: Update Environment Variables
Ensure your `.env.local` or Vercel environment has:
- `SUPABASE_SERVICE_ROLE_KEY`: Required for server-side auth/admin tasks.
- `NEXT_PUBLIC_API_BASE`: This is now **deprecated** and can be removed once all components are tested.

---
**Status**: The Dashboard, Doctors Gallery, User Management, and Audit Logs are now fully migrated to the Supabase-native codebase.
