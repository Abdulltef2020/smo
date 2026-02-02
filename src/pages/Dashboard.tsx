import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Users,
  DollarSign,
  ShoppingCart,
  ShoppingBag,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Stats {
  totalSales: number;
  totalPurchases: number;
  totalTax: number;
  invoiceCount: number;
  accountantCount: number;
  paidCount: number;
  pendingCount: number;
  recentInvoices: {
    id: string;
    invoice_number: string;
    invoice_type: string;
    total_amount: number;
    status: string;
    invoice_date: string;
  }[];
}

export default function Dashboard() {
  const { role, user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalSales: 0,
    totalPurchases: 0,
    totalTax: 0,
    invoiceCount: 0,
    accountantCount: 0,
    paidCount: 0,
    pendingCount: 0,
    recentInvoices: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch invoices
        let invoicesQuery = supabase.from('invoices').select('*');
        
        if (role !== 'admin') {
          invoicesQuery = invoicesQuery.eq('accountant_id', user?.id);
        }
        
        const { data: invoices } = await invoicesQuery;
        
        const saleInvoices = invoices?.filter(i => i.invoice_type === 'sale') || [];
        const purchaseInvoices = invoices?.filter(i => i.invoice_type === 'purchase') || [];
        
        const totalSales = saleInvoices.reduce((sum, i) => sum + Number(i.total_amount), 0);
        const totalPurchases = purchaseInvoices.reduce((sum, i) => sum + Number(i.total_amount), 0);
        const totalTax = invoices?.reduce((sum, i) => sum + Number(i.tax_amount), 0) || 0;
        const paidCount = invoices?.filter(i => i.status === 'paid').length || 0;
        const pendingCount = invoices?.filter(i => i.status === 'pending').length || 0;

        // Recent invoices
        const recentInvoices = invoices?.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ).slice(0, 5) || [];

        let accountantCount = 0;
        if (role === 'admin') {
          const { count } = await supabase
            .from('user_roles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'accountant');
          accountantCount = count || 0;
        }

        setStats({
          totalSales,
          totalPurchases,
          totalTax,
          invoiceCount: invoices?.length || 0,
          accountantCount,
          paidCount,
          pendingCount,
          recentInvoices,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [role, user?.id]);

  const statCards = [
    {
      title: 'إجمالي المبيعات',
      value: `${stats.totalSales.toLocaleString('ar-SA')} ر.س`,
      icon: TrendingUp,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'إجمالي المشتريات',
      value: `${stats.totalPurchases.toLocaleString('ar-SA')} ر.س`,
      icon: TrendingDown,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'صافي الربح',
      value: `${(stats.totalSales - stats.totalPurchases).toLocaleString('ar-SA')} ر.س`,
      icon: DollarSign,
      color: stats.totalSales - stats.totalPurchases >= 0 ? 'text-accent' : 'text-destructive',
      bgColor: stats.totalSales - stats.totalPurchases >= 0 ? 'bg-accent/10' : 'bg-destructive/10',
    },
    {
      title: 'إجمالي الضريبة',
      value: `${stats.totalTax.toLocaleString('ar-SA')} ر.س`,
      icon: FileText,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
  ];

  const pieData = [
    { name: 'مدفوعة', value: stats.paidCount, color: 'hsl(var(--accent))' },
    { name: 'معلقة', value: stats.pendingCount, color: 'hsl(var(--warning))' },
  ].filter(item => item.value > 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">لوحة التحكم</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              مرحباً بك في نظام سمو الأمجاد المحاسبي
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button asChild className="flex-1 sm:flex-none gap-2" variant="default">
              <Link to="/create-invoice/sale">
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">فاتورة مبيعات</span>
                <span className="sm:hidden">مبيعات</span>
              </Link>
            </Button>
            <Button asChild className="flex-1 sm:flex-none gap-2" variant="outline">
              <Link to="/create-invoice/purchase">
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">فاتورة مشتريات</span>
                <span className="sm:hidden">مشتريات</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-4 sm:w-5 h-4 sm:h-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-lg sm:text-2xl font-bold truncate ${stat.color}`}>
                  {loading ? '...' : stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Second Row */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {/* Invoice Status */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                حالة الفواتير
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-accent/10">
                      <CheckCircle className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">مدفوعة</p>
                      <p className="text-xl font-bold">{loading ? '...' : stats.paidCount}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-warning/10">
                      <Clock className="w-4 h-4 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">معلقة</p>
                      <p className="text-xl font-bold">{loading ? '...' : stats.pendingCount}</p>
                    </div>
                  </div>
                </div>
                {pieData.length > 0 && (
                  <div className="w-24 h-24" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          innerRadius={25}
                          outerRadius={40}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Admin Stats */}
          {role === 'admin' && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Users className="w-5 h-5 text-info flex-shrink-0" />
                  إحصائيات الفريق
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">عدد المحاسبين</span>
                  <span className="text-2xl font-bold text-info">{loading ? '...' : stats.accountantCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">إجمالي الفواتير</span>
                  <span className="text-2xl font-bold">{loading ? '...' : stats.invoiceCount}</span>
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/accountants">
                    <Plus className="w-4 h-4 ml-2" />
                    إدارة المحاسبين
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Recent Invoices */}
          <Card className={`border-0 shadow-lg ${role !== 'admin' ? 'md:col-span-2' : ''}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                آخر الفواتير
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">جاري التحميل...</div>
              ) : stats.recentInvoices.length === 0 ? (
                <div className="text-center py-4">
                  <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">لا توجد فواتير بعد</p>
                  <Button asChild className="mt-3" size="sm">
                    <Link to="/create-invoice/sale">إنشاء فاتورة</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.recentInvoices.map((invoice) => (
                    <Link
                      key={invoice.id}
                      to={`/invoice/${invoice.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${invoice.invoice_type === 'sale' ? 'bg-accent/10' : 'bg-warning/10'}`}>
                          {invoice.invoice_type === 'sale' ? (
                            <ShoppingCart className={`w-4 h-4 text-accent`} />
                          ) : (
                            <ShoppingBag className={`w-4 h-4 text-warning`} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium font-mono" dir="ltr">{invoice.invoice_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(invoice.invoice_date), 'dd MMM', { locale: ar })}
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className={`text-sm font-bold ${invoice.invoice_type === 'sale' ? 'text-accent' : 'text-warning'}`}>
                          {Number(invoice.total_amount).toLocaleString('ar-SA')} ر.س
                        </p>
                        <p className={`text-xs ${invoice.status === 'paid' ? 'text-accent' : 'text-warning'}`}>
                          {invoice.status === 'paid' ? 'مدفوعة' : 'معلقة'}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
