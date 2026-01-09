import { useState, useEffect } from 'react';
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
import { Plus, Loader2, Trash2, Users, ShieldAlert } from 'lucide-react';

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
      setAccountants(profiles || []);
    } catch (error) {
      console.error('Error fetching accountants:', error);
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
      // الخطوة 1: إنشاء الحساب في Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // الخطوة 2: محاولة إضافة الدور مباشرة (أحياناً يكون أسهل في الصلاحيات)
        const { error: roleError } = await supabase.from('user_roles').insert({
          user_id: authData.user.id,
          role: 'accountant',
        });

        // الخطوة 3: محاولة إضافة البروفايل
        const { error: profileError } = await supabase.from('profiles').insert({
          user_id: authData.user.id,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone || null,
        });

        if (roleError || profileError) {
          console.warn('RLS restriction detected, but user was created in Auth.');
          toast({
            title: 'تم إنشاء الحساب جزئياً',
            description: 'تم إنشاء حساب الدخول، ولكن قاعدة البيانات تمنع تحديث البيانات الإضافية حالياً بسبب قيود RLS.',
            variant: 'default',
          });
        } else {
          toast({
            title: 'تم بنجاح',
            description: 'تم إضافة المحاسب بنجاح',
          });
        }

        setFormData({ full_name: '', email: '', phone: '', password: '' });
        setIsDialogOpen(false);
        fetchAccountants();
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: 'خطأ في الإضافة',
        description: error.message || 'فشلت العملية بسبب قيود الأمان في قاعدة البيانات.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">المحاسبين</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">إدارة المحاسبين في النظام</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 w-full sm:w-auto">
                <Plus className="w-4 h-4" />
                إضافة محاسب
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md w-full mx-4 sm:mx-0">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">إضافة محاسب جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">الاسم الكامل</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">البريد الإلكتروني</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    dir="ltr"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">رقم الهاتف</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    dir="ltr"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">كلمة المرور</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    dir="ltr"
                    className="text-sm"
                  />
                </div>
                <Button type="submit" className="w-full text-sm" disabled={isSubmitting}>
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
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Users className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">قائمة المحاسبين</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : accountants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm sm:text-base flex flex-col items-center gap-2">
                <ShieldAlert className="w-8 h-8 text-muted-foreground/50" />
                <p>لا يوجد محاسبين أو قاعدة البيانات مقفلة (RLS)</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:-mx-6 md:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">الاسم</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden sm:table-cell">البريد الإلكتروني</TableHead>
                      <TableHead className="text-xs sm:text-sm">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accountants.map((accountant) => (
                      <TableRow key={accountant.id} className="text-xs sm:text-sm">
                        <TableCell className="font-medium">{accountant.full_name}</TableCell>
                        <TableCell dir="ltr" className="hidden sm:table-cell">{accountant.email}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(accountant.user_id)}
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
