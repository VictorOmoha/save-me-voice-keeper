-- Tighten RLS for orders table: restrict INSERT/UPDATE to owner and set user_id automatically

-- Ensure table exists and RLS is enabled (idempotent where possible)
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;

-- Drop overly-permissive policies if they exist
DROP POLICY IF EXISTS "insert_orders_any" ON public.orders;
DROP POLICY IF EXISTS "update_orders_any" ON public.orders;

-- Create strict INSERT policy: user can only insert their own orders
CREATE POLICY IF NOT EXISTS "insert_own_orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Create strict UPDATE policy: user can only update their own orders and keep ownership
CREATE POLICY IF NOT EXISTS "update_own_orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Keep existing SELECT policy as-is (select_own_orders), but ensure it's present
DROP POLICY IF EXISTS "select_own_orders" ON public.orders;
CREATE POLICY "select_own_orders"
ON public.orders
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Add a trigger to automatically set user_id on insert if not provided
-- Uses existing SECURITY DEFINER function public.set_user_id()
DROP TRIGGER IF EXISTS set_orders_user_id ON public.orders;
CREATE TRIGGER set_orders_user_id
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_user_id();