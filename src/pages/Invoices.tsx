import { useEffect, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, FileText, Eye, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_type: string;
  customer_id: string | null;
  accountant_id: string;
  total_amount: number;
  status: string;
  invoice_date: string;
  created_at: string;
  customers: { name: string } | null;
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'sale' | 'purchase'>('all');
  const { toast } = useToast();
  const { role, user } = useAuth();

  const fetchInvoices = async () => {
    try {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          customers(name)
        `)
        .order('created_at', { ascending: false });

      if (role !== 'admin') {
        query = query.eq('accountant_id', user?.id);
      }

      if (filter !== 'all') {
        query = query.eq('invoice_type', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في جلب الفواتير',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [filter, role, user?.id]);

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

  const getTypeBadge = (type: string) => {
    return type === 'sale' ? (
      <Badge className="bg-accent/20 text-accent border-accent/30">مبيعات</Badge>
    ) : (
      <Badge className="bg-warning/20 text-warning border-warning/30">مشتريات</Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">الفواتير</h1>
            <p className="text-muted-foreground mt-2">عرض جميع الفواتير</p>
          </div>
          <div className="flex gap-4">
            <Select value={filter} onValueChange={(value: 'all' | 'sale' | 'purchase') => setFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="تصفية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="sale">مبيعات</SelectItem>
                <SelectItem value="purchase">مشتريات</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              قائمة الفواتير
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد فواتير حتى الآن
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الفاتورة</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>العميل</TableHead>
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
                      <TableCell>{getTypeBadge(invoice.invoice_type)}</TableCell>
                      <TableCell>{invoice.customers?.name || '-'}</TableCell>
                      <TableCell className="font-semibold">
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