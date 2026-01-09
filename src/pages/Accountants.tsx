import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2, Trash2, Users } from 'lucide-react';

interface Accountant {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
  total_sales: number;
  total_purchases: number;
}

export default function Accountants() {
  const [accountants, setAccountants] = useState<Accountant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
  });

  const fetchAccountants = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles!inner(role)
        `)
        .eq('user_roles.role', 'accountant');

      if (error) throw error;

      // Fetch invoice totals for each accountant
      const accountantsWithTotals = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: invoices } = await supabase
            .from('invoices')
            .select('invoice_type, total_amount')
            .eq('accountant_id', profile.user_id);

          const total_sales = invoices?.filter(i => i.invoice_type === 'sale')
            .reduce((sum, i) => sum + Number(i.total_amount), 0) || 0;
          
          const total_purchases = invoices?.filter(i => i.invoice_type === 'purchase')
            .reduce((sum, i) => sum + Number(i.total_amount), 0) || 0;

          return {
            ...profile,
            total_sales,
            total_purchases,
          };
        })
      );

      setAccountants(accountantsWithTotals);
    } catch (error) {
      console.error('Error fetching accountants:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في جلب بيانات المحاسبين',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountants();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create profile
        const { error: profileError } = await supabase.from('profiles').insert({
          user_id: authData.user.id,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone || null,
        });

        if (profileError) throw profileError;

        // Assign role
        const { error: roleError } = await supabase.from('user_roles').insert({
          user_id: authData.user.id,
          role: 'accountant',
        });

        if (roleError) throw roleError;

        toast({
          title: 'تم بنجاح',
          description: 'تم إضافة المحاسب بنجاح',
        });

        setFormData({ full_name: '', email: '', phone: '', password: '' });
        setIsDialogOpen(false);
        fetchAccountants();
      }
    } catch (error: any) {
      console.error('Error creating accountant:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ في إضافة المحاسب',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المحاسب؟')) return;

    try {
      // Delete role first
      await supabase.from('user_roles').delete().eq('user_id', userId);
      // Delete profile
      await supabase.from('profiles').delete().eq('user_id', userId);
      
      toast({
        title: 'تم الحذف',
        description: 'تم حذف المحاسب بنجاح',
      });
      
      fetchAccountants();
    } catch (error) {
      console.error('Error deleting accountant:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في حذف المحاسب',
        variant: 'destructive',
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">المحاسبين</h1>
            <p className="text-muted-foreground mt-2">إدارة المحاسبين في النظام</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                إضافة محاسب
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>إضافة محاسب جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>الاسم الكامل</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>رقم الهاتف</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>كلمة المرور</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    dir="ltr"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري الإضافة...
                    </>
                  ) : (
                    'إضافة المحاسب'
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              قائمة المحاسبين
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : accountants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا يوجد محاسبين حتى الآن
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>الهاتف</TableHead>
                    <TableHead>إجمالي المبيعات</TableHead>
                    <TableHead>إجمالي المشتريات</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accountants.map((accountant) => (
                    <TableRow key={accountant.id}>
                      <TableCell className="font-medium">{accountant.full_name}</TableCell>
                      <TableCell dir="ltr">{accountant.email}</TableCell>
                      <TableCell dir="ltr">{accountant.phone || '-'}</TableCell>
                      <TableCell className="text-accent font-semibold">
                        {accountant.total_sales.toLocaleString('ar-SA')} ر.س
                      </TableCell>
                      <TableCell className="text-warning font-semibold">
                        {accountant.total_purchases.toLocaleString('ar-SA')} ر.س
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(accountant.user_id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}