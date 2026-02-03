-- Allow users to insert their own transactions (for checkout)
CREATE POLICY "Users can insert own transactions" 
ON public.transactions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to insert/update their own subscriptions
CREATE POLICY "Users can insert own subscriptions" 
ON public.subscriptions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" 
ON public.subscriptions 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);