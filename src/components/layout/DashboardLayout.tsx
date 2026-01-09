import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { toggleSidebar } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      {/* Mobile Header with Menu Button */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <h1 className="font-bold text-lg">سمو الأمجاد</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="md:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>
      
      <main className="md:mr-64 min-h-screen md:p-8 p-4 pt-20 md:pt-8">
        {children}
      </main>
    </div>
  );
}
