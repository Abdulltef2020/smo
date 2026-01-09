-- Allow first user to create their own admin role (only if no admins exist)
CREATE OR REPLACE FUNCTION public.is_first_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT NOT EXISTS (
        SELECT 1 FROM public.user_roles WHERE role = 'admin'
    )
$$;

-- Drop existing insert policy for user_roles
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;

-- Create new policy that allows first user OR admins to insert roles
CREATE POLICY "Admins or first user can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) 
    OR (is_first_user() AND auth.uid() = user_id AND role = 'admin'::app_role)
);

-- Also allow first user to insert their own profile
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

CREATE POLICY "Admins or first user can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) 
    OR (is_first_user() AND auth.uid() = user_id)
);