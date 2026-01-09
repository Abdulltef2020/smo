import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  FileText,
  ShoppingCart,
  ShoppingBag,
  BarChart3,
  LogOut,
  Calculator,
  UserCircle,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: 'لوحة التحكم', href: '/dashboard', icon: LayoutDashboard },
  { label: 'المحاسبين', href: '/accountants', icon: Users, adminOnly: true },
  { label: 'العملاء', href: '/customers', icon: UserCircle },
  { label: 'فواتير المبيعات', href: '/sales', icon: ShoppingCart },
  { label: 'فواتير المشتريات', href: '/purchases', icon: ShoppingBag },
  { label: 'جميع الفواتير', href: '/invoices', icon: FileText },
  { label: 'التقارير', href: '/reports', icon: BarChart3, adminOnly: true },
];

export function Sidebar() {
  const location = useLocation();
  const { role, signOut, user } = useAuth();
  const { isOpen, closeSidebar } = useSidebar();

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || role === 'admin'
  );

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={closeSidebar}
        />
      )}
      
      <aside className={cn(
        "fixed right-0 top-0 z-40 h-screen w-64 max-w-[85vw] bg-sidebar text-sidebar-foreground border-l border-sidebar-border transition-transform duration-300 ease-in-out overflow-y-auto",
        "md:translate-x-0 md:max-w-none",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Header with Close Button */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-6 border-b border-sidebar-border flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="w-9 sm:w-10 h-9 sm:h-10 bg-sidebar-primary rounded-xl flex items-center justify-center flex-shrink-0">
                <Calculator className="w-4 sm:w-5 h-4 sm:h-5 text-sidebar-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-base sm:text-lg truncate">سمو الأمجاد</h1>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  {role === 'admin' ? 'مدير النظام' : 'محاسب'}
                </p>
              </div>
            </div>
            <button
              onClick={closeSidebar}
              className="md:hidden text-sidebar-foreground/70 hover:text-sidebar-foreground flex-shrink-0 ml-2"
              aria-label="إغلاق القائمة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 sm:px-4 py-4 sm:py-6 space-y-1 sm:space-y-2 overflow-y-auto">
            {filteredNavItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={closeSidebar}
                  className={cn(
                    'flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 text-sm sm:text-base',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <item.icon className="w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0" />
                  <span className="font-medium truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User & Logout */}
          <div className="p-3 sm:p-4 border-t border-sidebar-border flex-shrink-0">
            <div className="px-3 sm:px-4 py-2.5 sm:py-3 mb-2 sm:mb-3 rounded-xl bg-sidebar-accent/50">
              <p className="text-xs sm:text-sm font-medium truncate">{user?.email}</p>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 sm:gap-3 text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 text-sm sm:text-base"
              onClick={signOut}
            >
              <LogOut className="w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0" />
              <span className="truncate">تسجيل الخروج</span>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
