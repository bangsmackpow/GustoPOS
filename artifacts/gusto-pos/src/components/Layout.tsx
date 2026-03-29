import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  ReceiptText, 
  Wine, 
  Beer,
  Coffee,
  GlassWater,
  Martini,
  Microwave,
  IceCream,
  ChefHat,
  Utensils,
  Pizza,
  PackageSearch, 
  BarChart3, 
  Settings,
  LogOut,
  User,
  Globe
} from 'lucide-react';
import { usePosStore } from '@/store';
import { getTranslation } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useGetCurrentAuthUser, useGetActiveShift, useGetSettings } from '@workspace/api-client-react';
import { PinPad } from './PinPad';

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, labelEn: 'Dashboard', labelEs: 'Panel' },
  { path: '/tabs', icon: ReceiptText, labelEn: 'Tabs', labelEs: 'Cuentas' },
  { path: '/drinks', icon: Wine, labelEn: 'Menu', labelEs: 'Menú' },
  { path: '/inventory', icon: PackageSearch, labelEn: 'Inventory', labelEs: 'Inventario' },
  { path: '/reports', icon: BarChart3, labelEn: 'Reports', labelEs: 'Reportes' },
  { path: '/settings', icon: Settings, labelEn: 'Settings', labelEs: 'Ajustes' },
];

const ICON_MAP: Record<string, any> = {
  Wine, Beer, Coffee, GlassWater, Martini, Microwave, IceCream, ChefHat, Utensils, Pizza
};

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { language, setLanguage, activeStaff, setActiveStaff } = usePosStore();
  const { data: auth, isLoading } = useGetCurrentAuthUser();
  const { data: shiftData } = useGetActiveShift();
  const { data: settings } = useGetSettings();
  const [showPin, setShowPin] = useState(false);
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout');
      queryClient.setQueryData(['/api/auth/user'], { isAuthenticated: false });
      setActiveStaff(null);
      setLocation('/login');
    } catch (err) {
      console.error('Logout failed', err);
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    if (!isLoading && auth && !auth.isAuthenticated && location !== '/login') {
      setLocation('/login');
    }
  }, [auth, isLoading, location, setLocation]);

  if (isLoading && location !== '/login') {
    return <div className="h-screen w-screen flex items-center justify-center bg-background">Loading...</div>;
  }

  if (location === '/login') {
    return <>{children}</>;
  }

  const BarIcon = ICON_MAP[settings?.barIcon || 'Wine'] || Wine;
  const activeShift = shiftData?.shift;

  return (
    <div className="flex h-screen bg-background overflow-hidden text-foreground">
      {/* Sidebar */}
      <aside className="w-24 lg:w-64 glass flex flex-col border-r border-white/5 z-20">
        <div className="h-24 flex items-center justify-center lg:justify-start lg:px-8 border-b border-white/5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-amber-300 flex items-center justify-center shadow-lg shadow-primary/20">
            <BarIcon className="text-primary-foreground w-7 h-7" />
          </div>
          <span className="ml-4 font-display font-bold text-xl hidden lg:block tracking-tight">
            {settings?.barName || 'Gusto'}<span className="text-primary">POS</span>
          </span>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}>
                <button className={`w-full flex items-center justify-center lg:justify-start px-0 lg:px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                }`}>
                  <Icon size={20} className={isActive ? 'scale-110' : 'group-hover:scale-110 transition-transform'} />
                  <span className="ml-3 font-medium hidden lg:block">
                    {language === 'en' ? item.labelEn : item.labelEs}
                  </span>
                  {isActive && <motion.div layoutId="activeNav" className="absolute left-0 w-1 h-6 bg-white rounded-full hidden lg:block" />}
                </button>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          <button 
            onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
            className="w-full flex items-center justify-center lg:justify-start px-0 lg:px-4 py-3 rounded-xl text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
          >
            <Globe size={20} />
            <span className="ml-3 font-medium hidden lg:block uppercase">{language}</span>
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center lg:justify-start px-0 lg:px-4 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut size={20} />
            <span className="ml-3 font-medium hidden lg:block">{getTranslation('logout', language)}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-24 glass border-b border-white/5 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                {activeShift ? getTranslation('active_shift', language) : getTranslation('no_active_shift', language)}
              </h2>
              <p className="text-lg font-display font-bold">
                {activeShift ? activeShift.name : '—'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowPin(true)}
              className="flex items-center gap-3 glass px-4 py-2 rounded-2xl hover:bg-white/10 transition-all border border-white/5 active:scale-95"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none">{activeStaff ? `${activeStaff.firstName} ${activeStaff.lastName}` : 'Switch Staff'}</p>
                <p className="text-[10px] text-muted-foreground uppercase mt-1 tracking-tighter">
                  {activeStaff ? getTranslation(activeStaff.role as any, language) : 'Tap to Login'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                <User size={20} />
              </div>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-[url('/images/pattern.png')] bg-repeat bg-[length:100px_100px] bg-fixed">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {showPin && <PinPad onClose={() => setShowPin(false)} />}
    </div>
  );
}
