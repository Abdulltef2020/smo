import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { 
  BarChart3, 
  Loader2, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  FileText,
  Printer
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns';
import { ar } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ReportData {
  totalSales: number;
  totalPurchases: number;
  netProfit: number;
  invoiceCount: number;
  byAccountant: {
    name: string;
    sales: number;
    purchases: number;
  }[];
  byMonth: {
    month: string;
    sales: number;
    purchases: number;
  }[];
}

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [dateRange, setDateRange] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { toast } = useToast();

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'quarter':
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case 'year':
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'custom':
        return { 
          start: startDate ? new Date(startDate) : startOfMonth(now), 
          end: endDate ? new Date(endDate) : endOfMonth(now) 
        };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();

      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .gte('invoice_date', format(start, 'yyyy-MM-dd'))
        .lte('invoice_date', format(end, 'yyyy-MM-dd'));

      if (error) throw error;

      const totalSales = invoices?.filter(i => i.invoice_type === 'sale')
        .reduce((sum, i) => sum + Number(i.total_amount), 0) || 0;
      
      const totalPurchases = invoices?.filter(i => i.invoice_type === 'purchase')
        .reduce((sum, i) => sum + Number(i.total_amount), 0) || 0;

      // Group by accountant
      const accountantMap = new Map<string, { sales: number; purchases: number }>();
      invoices?.forEach(inv => {
        const name = inv.accountant_id || 'غير معروف';
        const existing = accountantMap.get(name) || { sales: 0, purchases: 0 };
        if (inv.invoice_type === 'sale') {
          existing.sales += Number(inv.total_amount);
        } else {
          existing.purchases += Number(inv.total_amount);
        }
        accountantMap.set(name, existing);
      });

      const byAccountant = Array.from(accountantMap.entries()).map(([name, data]) => ({
        name,
        ...data,
      }));

      // Group by month
      const monthMap = new Map<string, { sales: number; purchases: number }>();
      invoices?.forEach(inv => {
        const month = format(new Date(inv.invoice_date), 'yyyy-MM');
        const existing = monthMap.get(month) || { sales: 0, purchases: 0 };
        if (inv.invoice_type === 'sale') {
          existing.sales += Number(inv.total_amount);
        } else {
          existing.purchases += Number(inv.total_amount);
        }
        monthMap.set(month, existing);
      });

      const byMonth = Array.from(monthMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, data]) => ({
          month: format(new Date(month + '-01'), 'MMM yyyy', { locale: ar }),
          ...data,
        }));

      setReportData({
        totalSales,
        totalPurchases,
        netProfit: totalSales - totalPurchases,
        invoiceCount: invoices?.length || 0,
        byAccountant,
        byMonth,
      });
    } catch (error) {
      console.error('Error fetching report:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في جلب التقرير',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [dateRange, startDate, endDate]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-between no-print">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-primary" />
              التقارير
            </h1>
            <p className="text-muted-foreground mt-2">تقارير مالية تفصيلية</p>
          </div>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            طباعة التقرير
          </Button>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-lg no-print">
          <CardContent className="pt-6">
            <div className="flex gap-4 items-end flex-wrap">
              <div className="space-y-2">
                <Label>الفترة</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">الشهر الحالي</SelectItem>
                    <SelectItem value="quarter">آخر 3 أشهر</SelectItem>
                    <SelectItem value="year">السنة الحالية</SelectItem>
                    <SelectItem value="custom">فترة مخصصة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {dateRange === 'custom' && (
                <>
                  <div className="space-y-2">
                    <Label>من تاريخ</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>إلى تاريخ</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : reportData && (
          <>
            {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card className="border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    إجمالي المبيعات
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-accent/10">
                    <TrendingUp className="w-5 h-5 text-accent" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">
                    {reportData.totalSales.toLocaleString('ar-SA')} ر.س
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    إجمالي المشتريات
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-warning/10">
                    <TrendingDown className="w-5 h-5 text-warning" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-warning">
                    {reportData.totalPurchases.toLocaleString('ar-SA')} ر.س
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    صافي الربح
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${reportData.netProfit >= 0 ? 'text-accent' : 'text-destructive'}`}>
                    {reportData.netProfit.toLocaleString('ar-SA')} ر.س
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    عدد الفواتير
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-info/10">
                    <FileText className="w-5 h-5 text-info" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-info">
                    {reportData.invoiceCount.toLocaleString('ar-SA')}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            {reportData.byMonth.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>المبيعات والمشتريات حسب الشهر</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.byMonth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => value.toLocaleString('ar-SA') + ' ر.س'}
                        />
                        <Legend />
                        <Bar dataKey="sales" name="المبيعات" fill="hsl(var(--accent))" />
                        <Bar dataKey="purchases" name="المشتريات" fill="hsl(var(--warning))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Accountants Table */}
            {reportData.byAccountant.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>تقرير المحاسبين</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المحاسب</TableHead>
                        <TableHead>إجمالي المبيعات</TableHead>
                        <TableHead>إجمالي المشتريات</TableHead>
                        <TableHead>صافي الربح</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.byAccountant.map((acc, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{acc.name}</TableCell>
                          <TableCell className="text-accent font-semibold">
                            {acc.sales.toLocaleString('ar-SA')} ر.س
                          </TableCell>
                          <TableCell className="text-warning font-semibold">
                            {acc.purchases.toLocaleString('ar-SA')} ر.س
                          </TableCell>
                          <TableCell className={`font-semibold ${acc.sales - acc.purchases >= 0 ? 'text-accent' : 'text-destructive'}`}>
                            {(acc.sales - acc.purchases).toLocaleString('ar-SA')} ر.س
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}