import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  ReceiptText, 
  Wine, 
  PackageSearch, 
  BarChart3, 
  Settings,
  LogOut,
  User,
  Globe
} from 'lucide-react';
import { usePosStore } from '@/store';
import { getTranslation } from '@/lib/utils';
import { useGetCurrentAuthUser, useGetActiveShift } from '@workspace/api-client-react';
import { PinPad } from './PinPad';

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, labelEn: 'Dashboard', labelEs: 'Panel' },
  { path: '/tabs', icon: ReceiptText, labelEn: 'Tabs', labelEs: 'Cuentas' },
  { path: '/drinks', icon: Wine, labelEn: 'Menu', labelEs: 'Menú' },
  { path: '/inventory', icon: PackageSearch, labelEn: 'Inventory', labelEs: 'Inventario' },
  { path: '/reports', icon: BarChart3, labelEn: 'Reports', labelEs: 'Reportes' },
  { path: '/settings', icon: Settings, labelEn: 'Settings', labelEs: 'Ajustes' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { language, setLanguage, activeStaff } = usePosStore();
  const { data: auth, isLoading } = useGetCurrentAuthUser();
  const { data: shiftData } = useGetActiveShift();
  const [showPin, setShowPin] = useState(false);

  // If not authenticated via OIDC, redirect to Login page
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

  return (
    <div className="flex h-screen bg-background overflow-hidden text-foreground">
      {/* Sidebar */}
      <aside className="w-24 lg:w-64 glass flex flex-col border-r border-white/5 z-20">
        <div className="h-24 flex items-center justify-center lg:justify-start lg:px-8 border-b border-white/5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-amber-300 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <Wine className="text-primary-foreground" size={24} />
          </div>
          <span className="ml-3 font-display font-bold text-xl hidden lg:block tracking-wide">
            Gusto<span className="text-primary">POS</span>
          </span>
        </div>
        
        <nav className="flex-1 py-8 flex flex-col gap-2 px-3">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.path || (item.path !== '/' && location.startsWith(item.path));
            return (
              <Link key={item.path} href={item.path} className="block">
                <div className={`
                  relative flex items-center justify-center lg:justify-start px-0 lg:px-4 py-4 rounded-2xl transition-all duration-300 group
                  ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}
                `}>
                  {isActive && (
                    <motion.div 
                      layoutId="activeNav"
                      className="absolute inset-0 bg-primary/10 rounded-2xl border border-primary/20"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <item.icon size={22} className="relative z-10" />
                  <span className="ml-3 font-medium hidden lg:block relative z-10">
                    {language === 'en' ? item.labelEn : item.labelEs}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 flex flex-col gap-4">
          <button 
            onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
            className="flex items-center justify-center lg:justify-start px-0 lg:px-4 py-3 rounded-xl text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
          >
            <Globe size={20} />
            <span className="ml-3 font-medium hidden lg:block uppercase text-sm tracking-widest">{language}</span>
          </button>
          <button 
            onClick={() => window.location.href = '/api/logout'}
            className="flex items-center justify-center lg:justify-start px-0 lg:px-4 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut size={20} />
            <span className="ml-3 font-medium hidden lg:block">{getTranslation('logout', language)}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-24 glass border-b border-white/5 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            {shiftData?.shift ? (
              <div className="flex items-center gap-3 bg-secondary/50 px-4 py-2 rounded-full border border-white/5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium text-emerald-500">{getTranslation('active_shift', language)}: {shiftData.shift.name}</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-secondary/50 px-4 py-2 rounded-full border border-white/5">
                <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">{getTranslation('no_active_shift', language)}</span>
              </div>
            )}
          </div>

          <div 
            className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity bg-secondary/30 px-5 py-2.5 rounded-2xl border border-white/5"
            onClick={() => setShowPin(true)}
          >
            <div className="text-right">
              <p className="text-sm font-medium text-foreground leading-none">
                {activeStaff ? `${activeStaff.firstName} ${activeStaff.lastName}` : getTranslation('switch_user', language)}
              </p>
              <p className="text-xs text-primary mt-1 capitalize tracking-wider">
                {activeStaff?.role.replace('_', ' ') || 'PIN Required'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center border border-white/10">
              <User size={18} className={activeStaff ? "text-primary" : "text-muted-foreground"} />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 relative z-0">
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
        </div>
      </main>

      {showPin && <PinPad onClose={() => setShowPin(false)} />}
    </div>
  );
}
