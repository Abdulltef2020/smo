-- إنشاء نوع الأدوار
CREATE TYPE public.app_role AS ENUM ('admin', 'accountant');

-- جدول أدوار المستخدمين
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- جدول الملفات الشخصية
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول العملاء
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول الفواتير
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    invoice_type TEXT NOT NULL CHECK (invoice_type IN ('sale', 'purchase')),
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    accountant_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول عناصر الفواتير
CREATE TABLE public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- دالة للتحقق من الدور
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- دالة للتحقق من كون المستخدم مدير أو محاسب
CREATE OR REPLACE FUNCTION public.is_admin_or_accountant(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role IN ('admin', 'accountant')
    )
$$;

-- سياسات user_roles
CREATE POLICY "Admins can view all roles" ON public.user_roles
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles" ON public.user_roles
    FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" ON public.user_roles
    FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own role" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- سياسات profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert profiles" ON public.profiles
    FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete profiles" ON public.profiles
    FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- سياسات customers
CREATE POLICY "Admins and accountants can view customers" ON public.customers
    FOR SELECT USING (public.is_admin_or_accountant(auth.uid()));

CREATE POLICY "Admins and accountants can insert customers" ON public.customers
    FOR INSERT WITH CHECK (public.is_admin_or_accountant(auth.uid()));

CREATE POLICY "Admins and accountants can update customers" ON public.customers
    FOR UPDATE USING (public.is_admin_or_accountant(auth.uid()));

CREATE POLICY "Admins can delete customers" ON public.customers
    FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- سياسات invoices
CREATE POLICY "Admins can view all invoices" ON public.invoices
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Accountants can view own invoices" ON public.invoices
    FOR SELECT USING (auth.uid() = accountant_id);

CREATE POLICY "Accountants can insert own invoices" ON public.invoices
    FOR INSERT WITH CHECK (auth.uid() = accountant_id AND public.has_role(auth.uid(), 'accountant'));

CREATE POLICY "Accountants can update own invoices" ON public.invoices
    FOR UPDATE USING (auth.uid() = accountant_id);

CREATE POLICY "Admins can update all invoices" ON public.invoices
    FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete invoices" ON public.invoices
    FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- سياسات invoice_items
CREATE POLICY "Admins can view all invoice items" ON public.invoice_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.invoices 
            WHERE id = invoice_id 
            AND public.has_role(auth.uid(), 'admin')
        )
    );

CREATE POLICY "Accountants can view own invoice items" ON public.invoice_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.invoices 
            WHERE id = invoice_id 
            AND accountant_id = auth.uid()
        )
    );

CREATE POLICY "Accountants can insert invoice items" ON public.invoice_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.invoices 
            WHERE id = invoice_id 
            AND accountant_id = auth.uid()
        )
    );

CREATE POLICY "Accountants can update own invoice items" ON public.invoice_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.invoices 
            WHERE id = invoice_id 
            AND accountant_id = auth.uid()
        )
    );

CREATE POLICY "Admins can delete invoice items" ON public.invoice_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.invoices 
            WHERE id = invoice_id 
            AND public.has_role(auth.uid(), 'admin')
        )
    );

-- دالة تحديث updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- triggers للتحديث التلقائي
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- دالة لتوليد رقم الفاتورة
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
    prefix TEXT;
    next_num INTEGER;
BEGIN
    IF NEW.invoice_type = 'sale' THEN
        prefix := 'INV-S-';
    ELSE
        prefix := 'INV-P-';
    END IF;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 7) AS INTEGER)), 0) + 1
    INTO next_num
    FROM public.invoices
    WHERE invoice_type = NEW.invoice_type;
    
    NEW.invoice_number := prefix || LPAD(next_num::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER generate_invoice_number_trigger
    BEFORE INSERT ON public.invoices
    FOR EACH ROW
    WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
    EXECUTE FUNCTION public.generate_invoice_number();