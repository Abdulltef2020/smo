import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Loader2, Printer, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_type: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  notes: string | null;
  status: string;
  invoice_date: string;
  created_at: string;
  customers: { name: string; phone: string | null; address: string | null } | null;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export default function InvoiceView() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { role } = useAuth();

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('invoices')
          .select(`
            *,
            customers(name, phone, address)
          `)
          .eq('id', id)
          .single();

        if (invoiceError) throw invoiceError;
        setInvoice(invoiceData);

        const { data: itemsData, error: itemsError } = await supabase
          .from('invoice_items')
          .select('*')
          .eq('invoice_id', id);

        if (itemsError) throw itemsError;
        setItems(itemsData || []);
      } catch (error) {
        console.error('Error fetching invoice:', error);
        toast({
          title: 'خطأ',
          description: 'حدث خطأ في جلب بيانات الفاتورة',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchInvoice();
  }, [id]);

  const updateStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setInvoice((prev) => prev ? { ...prev, status: newStatus } : null);
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث حالة الفاتورة',
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في تحديث الحالة',
        variant: 'destructive',
      });
    }
  };

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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">الفاتورة غير موجودة</p>
          <Button asChild className="mt-4">
            <Link to="/invoices">العودة للفواتير</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/invoices">
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                فاتورة {invoice.invoice_number}
              </h1>
              <p className="text-muted-foreground mt-1">
                {invoice.invoice_type === 'sale' ? 'فاتورة مبيعات' : 'فاتورة مشتريات'}
              </p>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            {(role === 'admin' || invoice.status !== 'cancelled') && (
              <Select value={invoice.status} onValueChange={updateStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">معلقة</SelectItem>
                  <SelectItem value="paid">مدفوعة</SelectItem>
                  <SelectItem value="cancelled">ملغاة</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Button asChild>
              <Link to={`/invoice/${id}/print`} className="gap-2">
                <Printer className="w-4 h-4" />
                طباعة
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>معلومات الفاتورة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">رقم الفاتورة</span>
                <span className="font-mono" dir="ltr">{invoice.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">التاريخ</span>
                <span>{format(new Date(invoice.invoice_date), 'dd MMMM yyyy', { locale: ar })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الحالة</span>
                {getStatusBadge(invoice.status)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>معلومات العميل</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">الاسم</span>
                <span>{invoice.customers?.name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الهاتف</span>
                <span dir="ltr">{invoice.customers?.phone || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">العنوان</span>
                <span>{invoice.customers?.address || '-'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>عناصر الفاتورة</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الوصف</TableHead>
                  <TableHead>الكمية</TableHead>
                  <TableHead>سعر الوحدة</TableHead>
                  <TableHead>الإجمالي</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{Number(item.quantity)}</TableCell>
                    <TableCell>{Number(item.unit_price).toLocaleString('ar-SA')} ر.س</TableCell>
                    <TableCell className="font-semibold">
                      {Number(item.total_price).toLocaleString('ar-SA')} ر.س
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="border-t mt-6 pt-4 space-y-2 max-w-xs mr-auto">
              <div className="flex justify-between">
                <span>المجموع الفرعي:</span>
                <span>{Number(invoice.subtotal).toLocaleString('ar-SA')} ر.س</span>
              </div>
              <div className="flex justify-between">
                <span>الضريبة:</span>
                <span>{Number(invoice.tax_amount).toLocaleString('ar-SA')} ر.س</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-primary border-t pt-2">
                <span>الإجمالي:</span>
                <span>{Number(invoice.total_amount).toLocaleString('ar-SA')} ر.س</span>
              </div>
            </div>

            {invoice.notes && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">ملاحظات:</p>
                <p className="text-muted-foreground">{invoice.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}