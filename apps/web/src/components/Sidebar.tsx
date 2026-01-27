'use client';

import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  Car, 
  Ticket, 
  Users, 
  MapPin, 
  Grid3x3, 
  Activity,
  Clock,
  LogOut,
  Menu,
  X,
  DollarSign,
  Calculator,
  Wallet
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    label: 'Clientes',
    href: '/dashboard/customers',
    icon: Users,
  },
  {
    label: 'Vehículos',
    href: '/dashboard/vehicles',
    icon: Car,
  },
  {
    label: 'Historial de Tickets',
    href: '/dashboard/tickets',
    icon: Ticket,
  },
  {
    label: 'Vehículos Activos',
    href: '/dashboard/tickets/active',
    icon: Clock,
  },
  {
    label: 'Caja',
    href: '/cash',
    icon: Wallet,
  },
  {
    label: 'Zonas',
    href: '/dashboard/zones',
    icon: MapPin,
  },
  {
    label: 'Puestos',
    href: '/dashboard/spots',
    icon: Grid3x3,
  },
  {
    label: 'Ocupación',
    href: '/dashboard/occupancy',
    icon: Activity,
  },
  {
    label: 'Motor de Tarifas',
    href: '/dashboard/pricing',
    icon: DollarSign,
  },
  {
    label: 'Simulador',
    href: '/dashboard/pricing/simulator',
    icon: Calculator,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const NavContent = () => (
    <>
      {/* Logo/Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <span className="text-white font-bold text-xl">P</span>
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">Parking</h2>
            <p className="text-slate-400 text-xs">Sistema de Gestión</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <button
              key={item.href}
              onClick={() => {
                router.push(item.href);
                setIsMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                active
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
              {item.badge && (
                <span className="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer/Logout */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-red-900/50 hover:text-red-400 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-800 border-r border-slate-700 h-screen sticky top-0">
        <NavContent />
      </aside>

      {/* Sidebar - Mobile */}
      <aside
        className={`lg:hidden fixed left-0 top-0 z-40 flex flex-col w-64 bg-slate-800 border-r border-slate-700 h-screen transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <NavContent />
      </aside>
    </>
  );
}
