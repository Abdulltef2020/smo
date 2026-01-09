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
    </div>
  );
}
