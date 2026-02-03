# Complete Database Setup for New Supabase Project

Since you're using a new Supabase project, you need to run all migrations in order.

## Quick Setup Instructions

### Option 1: Run All Migrations at Once (Recommended)

1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy and paste ALL the migration files in order (I'll provide them below)
4. Click "Run"

### Option 2: Run Migrations One by One

Run each migration file in this order:

1. `20251224183238_5b1730b1-f091-41d1-b387-8ede4ee1fccc.sql` - Base tables (items, customers, invoices)
2. `20251224183837_585c9198-cfb0-40cf-a263-3787ee6419e7.sql`
3. `20251224191606_001a09d1-c1ed-4c98-a971-9b04a0aab14e.sql` - Rental tables
4. `20251224193958_bfbaca35-c84f-4544-92f7-5a8e425e71d1.sql`
5. `20251225070520_cc9d9eb4-1517-4de6-8d0a-eed4a3f8c388.sql`
6. `20251225085800_2ed25017-8ac3-4d22-961a-cb8a93bca351.sql`
7. `20251225095426_391965d0-6d79-44c3-ac24-cba00f5d4766.sql`
8. `20251225140030_18d4c9f4-2898-47fb-86ac-3b51a1671a26.sql`
9. `20251225144815_214d2726-0107-474c-906e-30f139800c73.sql`
10. `20251225150031_5a1f7e87-f4a8-49cd-b859-ef9e83e9ee82.sql`
11. `20251225165029_2c4efcbf-643d-4e31-8d31-6ae959e5d555.sql`
12. `20251225165829_91371a75-4043-4fbd-a1b8-5b3b4cca46c3.sql`
13. `20251226183103_e75d1611-a6a2-4235-a1f5-7f5ef66712a2.sql`
14. `20251229134043_694e570e-e89c-4c15-8ca7-4212429002be.sql`
15. `20260111143000_gst_eway_common_inventory.sql` - GST features (our new one)

## Easiest Method: Use Supabase CLI with Local Files

Since you have all migration files locally, the easiest way is:

```bash
# In your project directory
cd e:/qorb-main/qorb-main

# Link to your new Supabase project
npx supabase link --project-ref YOUR_PROJECT_REF

# Push all migrations
npx supabase db push
```

**To get your PROJECT_REF:**
- Go to Supabase Dashboard → Settings → General
- Copy the "Reference ID"

## Alternative: Manual SQL Execution

If the CLI doesn't work, I can help you combine all the SQL files into one big script to run in the SQL Editor.

Would you like me to:
1. Help you link the project and use CLI (recommended)
2. Create a combined SQL script to paste in SQL Editor
