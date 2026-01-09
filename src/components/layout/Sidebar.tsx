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
        "fixed right-0 top-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground border-l border-sidebar-border transition-transform duration-300 ease-in-out",
        "md:translate-x-0",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Header with Close Button */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-sidebar-border">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 bg-sidebar-primary rounded-xl flex items-center justify-center">
                <Calculator className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg">سمو الأمجاد</h1>
                <p className="text-xs text-sidebar-foreground/60">
                  {role === 'admin' ? 'مدير النظام' : 'محاسب'}
                </p>
              </div>
            </div>
            <button
              onClick={closeSidebar}
              className="md:hidden text-sidebar-foreground/70 hover:text-sidebar-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {filteredNavItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={closeSidebar}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User & Logout */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="px-4 py-3 mb-3 rounded-xl bg-sidebar-accent/50">
              <p className="text-sm font-medium truncate">{user?.email}</p>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10"
              onClick={signOut}
            >
              <LogOut className="w-5 h-5" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
