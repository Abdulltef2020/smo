import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ShoppingBag, Plus, Eye, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  total_amount: number;
  status: string;
  invoice_date: string;
  customers: { name: string } | null;
}

export default function Purchases() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { role, user } = useAuth();

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        let query = supabase
          .from('invoices')
          .select(`
            *,
            customers(name)
          `)
          .eq('invoice_type', 'purchase')
          .order('created_at', { ascending: false });

        if (role !== 'admin') {
          query = query.eq('accountant_id', user?.id);
        }

        const { data, error } = await query;

        if (error) throw error;
        setInvoices(data || []);
      } catch (error) {
        console.error('Error fetching purchases:', error);
        toast({
          title: 'خطأ',
          description: 'حدث خطأ في جلب فواتير المشتريات',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [role, user?.id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-accent text-accent-foreground">مدفوعة</Badge>;
      case 'pending':
        return <Badge variant="secondary">معلقة</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">ملغاة</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const totalPurchases = invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-warning" />
              فواتير المشتريات
            </h1>
            <p className="text-muted-foreground mt-2">
              إجمالي المشتريات: <span className="font-bold text-warning">{totalPurchases.toLocaleString('ar-SA')} ر.س</span>
            </p>
          </div>
          <Button asChild className="gap-2">
            <Link to="/create-invoice/purchase">
              <Plus className="w-4 h-4" />
              فاتورة مشتريات جديدة
            </Link>
          </Button>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>قائمة فواتير المشتريات</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد فواتير مشتريات حتى الآن
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الفاتورة</TableHead>
                    <TableHead>المورد</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono" dir="ltr">{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.customers?.name || '-'}</TableCell>
                      <TableCell className="font-semibold text-warning">
                        {Number(invoice.total_amount).toLocaleString('ar-SA')} ر.س
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>
                        {format(new Date(invoice.invoice_date), 'dd MMM yyyy', { locale: ar })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/invoice/${invoice.id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/invoice/${invoice.id}/print`}>
                              <Printer className="w-4 h-4" />
                            </Link>
                          </Button>
                        </div>
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