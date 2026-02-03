-- Step 1: Mark all but the most recent active subscription per user as cancelled
WITH ranked AS (
  SELECT id, user_id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM public.subscriptions
  WHERE status = 'active'
)
UPDATE public.subscriptions SET status = 'cancelled', updated_at = now()
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Step 2: Create unique partial index to prevent future duplicate active subscriptions
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_user_active_unique 
ON public.subscriptions(user_id) 
WHERE status = 'active';