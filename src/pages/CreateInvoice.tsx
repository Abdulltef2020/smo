import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Loader2, Plus, Trash2, ShoppingCart, ShoppingBag } from 'lucide-react';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Customer {
  id: string;
  name: string;
}

export default function CreateInvoice() {
  const { type } = useParams<{ type: 'sale' | 'purchase' }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [customerId, setCustomerId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [taxRate, setTaxRate] = useState(15);
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: crypto.randomUUID(), description: '', quantity: 1, unit_price: 0, total_price: 0 },
  ]);

  useEffect(() => {
    const fetchCustomers = async () => {
      const { data } = await supabase.from('customers').select('id, name');
      setCustomers(data || []);
    };
    fetchCustomers();
  }, []);

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unit_price') {
            updated.total_price = updated.quantity * updated.unit_price;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), description: '', quantity: 1, unit_price: 0, total_price: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.some((item) => !item.description || item.unit_price <= 0)) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء جميع بيانات العناصر',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: `INV-${Date.now()}`,
          invoice_type: type as string,
          customer_id: customerId || null,
          accountant_id: user?.id as string,
          subtotal,
          tax_amount: taxAmount,
          total_amount: total,
          notes: notes || null,
          status: 'paid',
          invoice_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const invoiceItems = items.map((item) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) throw itemsError;

      toast({
        title: 'تم بنجاح',
        description: 'تم إنشاء الفاتورة بنجاح',
      });

      navigate(`/invoice/${invoice.id}`);
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast({
        title: 'خطأ في إنشاء الفاتورة',
        description: error.message.includes('row-level security') 
          ? 'لا تملك صلاحية لإضافة فاتورة. يرجى التأكد من إعدادات RLS في Supabase.'
          : error.message || 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isSale = type === 'sale';

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
            {isSale ? (
              <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-accent" />
            ) : (
              <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-warning" />
            )}
            <span className="truncate">{isSale ? 'فاتورة مبيعات جديدة' : 'فاتورة مشتريات جديدة'}</span>
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg sm:text-xl">بيانات الفاتورة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">العميل</Label>
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="اختر العميل" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">نسبة الضريبة (%)</Label>
                  <Input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    min={0}
                    max={100}
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">ملاحظات</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات إضافية..."
                  className="text-sm min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg sm:text-xl">عناصر الفاتورة</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-8 text-xs sm:text-sm">
                <Plus className="w-4 h-4 ml-1 sm:ml-2" />
                إضافة عنصر
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="flex flex-col gap-3 p-3 sm:p-4 bg-muted/50 rounded-lg relative">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-end">
                      <div className="sm:col-span-5 space-y-2">
                        <Label className="text-xs sm:text-sm">الوصف</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          placeholder="وصف العنصر"
                          required
                          className="text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-3 sm:col-span-6 gap-2 sm:gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs sm:text-sm">الكمية</Label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                            min={1}
                            required
                            className="text-sm px-2"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs sm:text-sm">السعر</Label>
                          <Input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => updateItem(item.id, 'unit_price', Number(e.target.value))}
                            min={0}
                            step="0.01"
                            required
                            className="text-sm px-2"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs sm:text-sm">الإجمالي</Label>
                          <div className="h-10 flex items-center font-medium text-xs sm:text-sm truncate">
                            {item.total_price.toLocaleString('ar-SA')}
                          </div>
                        </div>
                      </div>
                      <div className="sm:col-span-1 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive h-8 w-8"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 mt-6 space-y-2">
                <div className="flex justify-between text-sm sm:text-base">
                  <span>المجموع الفرعي:</span>
                  <span>{subtotal.toLocaleString('ar-SA')} ر.س</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span>الضريبة ({taxRate}%):</span>
                  <span>{taxAmount.toLocaleString('ar-SA')} ر.س</span>
                </div>
                <div className="flex justify-between text-lg sm:text-xl font-bold text-primary">
                  <span>الإجمالي:</span>
                  <span>{total.toLocaleString('ar-SA')} ر.س</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 sm:gap-4 justify-end">
            <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1 sm:flex-none">
              إلغاء
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 sm:flex-none">
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                'إنشاء الفاتورة'
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
