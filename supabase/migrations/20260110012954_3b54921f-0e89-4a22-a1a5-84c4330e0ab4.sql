-- إزالة جميع سياسات RLS من جدول customers
DROP POLICY IF EXISTS "Admins and accountants can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Admins and accountants can update customers" ON public.customers;
DROP POLICY IF EXISTS "Admins and accountants can view customers" ON public.customers;
DROP POLICY IF EXISTS "Admins can delete customers" ON public.customers;

-- إزالة جميع سياسات RLS من جدول invoice_items
DROP POLICY IF EXISTS "Accountants can insert invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Accountants can update own invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Accountants can view own invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Admins can delete invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Admins can view all invoice items" ON public.invoice_items;

-- إزالة جميع سياسات RLS من جدول invoices
DROP POLICY IF EXISTS "Accountants can insert own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Accountants can update own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Accountants can view own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins can delete invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins can update all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins can view all invoices" ON public.invoices;

-- إزالة جميع سياسات RLS من جدول profiles
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins or first user can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- إزالة جميع سياسات RLS من جدول user_roles
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins or first user can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;

-- إنشاء سياسات مفتوحة للجميع (للتطوير فقط)
CREATE POLICY "Allow all for development" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for development" ON public.invoice_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for development" ON public.invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for development" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for development" ON public.user_roles FOR ALL USING (true) WITH CHECK (true);