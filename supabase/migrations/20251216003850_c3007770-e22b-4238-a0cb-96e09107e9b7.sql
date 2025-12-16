-- Add explicit restrictive policies for INSERT, UPDATE, DELETE on user_roles
-- This makes the security model clear: only service roles can modify roles

CREATE POLICY "No direct insert into user_roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "No direct update to user_roles" 
ON public.user_roles 
FOR UPDATE 
USING (false)
WITH CHECK (false);

CREATE POLICY "No direct delete from user_roles" 
ON public.user_roles 
FOR DELETE 
USING (false);