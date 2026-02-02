import { ReactNode, useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AIAssistantButton } from '@/components/ai/AIAssistantButton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { toggleSidebar } = useSidebar();
  const { role, user } = useAuth();
  const [aiContext, setAiContext] = useState<Record<string, unknown>>({});

  useEffect(() => {
    const fetchContext = async () => {
      try {
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

        setAiContext({
          totalSales,
          totalPurchases,
          netProfit: totalSales - totalPurchases,
          totalTax,
          invoiceCount: invoices?.length || 0,
          paidCount: invoices?.filter(i => i.status === 'paid').length || 0,
          pendingCount: invoices?.filter(i => i.status === 'pending').length || 0,
          userRole: role,
        });
      } catch (error) {
        console.error('Error fetching AI context:', error);
      }
    };

    fetchContext();
  }, [role, user?.id]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      {/* Mobile Header with Menu Button */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-20 bg-background border-b border-border h-16">
        <div className="flex items-center justify-between px-4 h-full">
          <h1 className="font-bold text-base sm:text-lg truncate">سمو الأمجاد</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="md:hidden flex-shrink-0"
            aria-label="فتح القائمة"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="md:mr-64 min-h-screen pt-16 md:pt-0 md:p-8 p-4 sm:p-6">
        {children}
      </main>

      {/* AI Assistant */}
      <AIAssistantButton context={aiContext} />
    </div>
  );
}
