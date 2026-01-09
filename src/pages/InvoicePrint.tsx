import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  customers: { name: string; phone: string | null; address: string | null } | null;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export default function InvoicePrint() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const { data: invoiceData } = await supabase
          .from('invoices')
          .select(`
            *,
            customers(name, phone, address)
          `)
          .eq('id', id)
          .single();

        setInvoice(invoiceData);

        const { data: itemsData } = await supabase
          .from('invoice_items')
          .select('*')
          .eq('invoice_id', id);

        setItems(itemsData || []);
      } catch (error) {
        console.error('Error fetching invoice:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchInvoice();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-muted-foreground">الفاتورة غير موجودة</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Print Button - Hidden when printing */}
      <div className="no-print mb-6 flex justify-end">
        <Button onClick={handlePrint} className="gap-2">
          طباعة الفاتورة
        </Button>
      </div>

      {/* Invoice Content */}
      <div className="max-w-4xl mx-auto bg-card p-8 rounded-lg shadow-lg">
        {/* Header */}
        <div className="flex justify-between items-start border-b pb-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <Calculator className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">نظام المحاسبة</h1>
              <p className="text-muted-foreground text-sm">فاتورة رسمية</p>
            </div>
          </div>
          <div className="text-left">
            <p className="text-2xl font-bold text-primary" dir="ltr">{invoice.invoice_number}</p>
            <p className="text-muted-foreground">
              {format(new Date(invoice.invoice_date), 'dd MMMM yyyy', { locale: ar })}
            </p>
            <p className="mt-2">
              {invoice.invoice_type === 'sale' ? (
                <span className="text-accent font-semibold">فاتورة مبيعات</span>
              ) : (
                <span className="text-warning font-semibold">فاتورة مشتريات</span>
              )}
            </p>
          </div>
        </div>

        {/* Customer & Company Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-lg mb-3 text-primary">معلومات العميل</h3>
            <div className="space-y-1 text-muted-foreground">
              <p><strong className="text-foreground">الاسم:</strong> {invoice.customers?.name || '-'}</p>
              <p><strong className="text-foreground">الهاتف:</strong> <span dir="ltr">{invoice.customers?.phone || '-'}</span></p>
              <p><strong className="text-foreground">العنوان:</strong> {invoice.customers?.address || '-'}</p>
            </div>
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-lg mb-3 text-primary">معلومات الفاتورة</h3>
            <div className="space-y-1 text-muted-foreground">
              <p><strong className="text-foreground">الحالة:</strong> {
                invoice.status === 'paid' ? 'مدفوعة' : 
                invoice.status === 'pending' ? 'معلقة' : 'ملغاة'
              }</p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="border p-3 text-right">#</th>
                <th className="border p-3 text-right">الوصف</th>
                <th className="border p-3 text-center">الكمية</th>
                <th className="border p-3 text-left">سعر الوحدة</th>
                <th className="border p-3 text-left">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id}>
                  <td className="border p-3">{index + 1}</td>
                  <td className="border p-3">{item.description}</td>
                  <td className="border p-3 text-center">{Number(item.quantity)}</td>
                  <td className="border p-3 text-left">{Number(item.unit_price).toLocaleString('ar-SA')} ر.س</td>
                  <td className="border p-3 text-left font-semibold">{Number(item.total_price).toLocaleString('ar-SA')} ر.س</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-72 space-y-2">
            <div className="flex justify-between py-2">
              <span>المجموع الفرعي:</span>
              <span>{Number(invoice.subtotal).toLocaleString('ar-SA')} ر.س</span>
            </div>
            <div className="flex justify-between py-2">
              <span>الضريبة:</span>
              <span>{Number(invoice.tax_amount).toLocaleString('ar-SA')} ر.س</span>
            </div>
            <div className="flex justify-between py-3 border-t-2 border-primary text-xl font-bold text-primary">
              <span>الإجمالي:</span>
              <span>{Number(invoice.total_amount).toLocaleString('ar-SA')} ر.س</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-8 p-4 bg-muted rounded-lg">
            <p className="font-semibold mb-2">ملاحظات:</p>
            <p className="text-muted-foreground">{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t text-center text-muted-foreground text-sm">
          <p>شكراً لتعاملكم معنا</p>
          <p className="mt-1">نظام المحاسبة - جميع الحقوق محفوظة</p>
        </div>
      </div>
    </div>
  );
}