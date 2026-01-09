import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Users,
  DollarSign,
} from 'lucide-react';

interface Stats {
  totalSales: number;
  totalPurchases: number;
  invoiceCount: number;
  accountantCount: number;
}

export default function Dashboard() {
  const { role, user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalSales: 0,
    totalPurchases: 0,
    invoiceCount: 0,
    accountantCount: 0,
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
        
        const totalSales = invoices?.filter(i => i.invoice_type === 'sale')
          .reduce((sum, i) => sum + Number(i.total_amount), 0) || 0;
        
        const totalPurchases = invoices?.filter(i => i.invoice_type === 'purchase')
          .reduce((sum, i) => sum + Number(i.total_amount), 0) || 0;

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
          invoiceCount: invoices?.length || 0,
          accountantCount,
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
      title: 'عدد الفواتير',
      value: stats.invoiceCount.toLocaleString('ar-SA'),
      icon: FileText,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    ...(role === 'admin' ? [{
      title: 'عدد المحاسبين',
      value: stats.accountantCount.toLocaleString('ar-SA'),
      icon: Users,
      color: 'text-info',
      bgColor: 'bg-info/10',
    }] : []),
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground">لوحة التحكم</h1>
          <p className="text-muted-foreground mt-2">
            مرحباً بك في نظام المحاسبة
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-accent" />
                صافي الربح
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">
                {loading ? '...' : `${(stats.totalSales - stats.totalPurchases).toLocaleString('ar-SA')} ر.س`}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                الفرق بين المبيعات والمشتريات
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}