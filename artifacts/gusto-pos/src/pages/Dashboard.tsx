import React from 'react';
import { useGetActiveShift, useGetTabs, useGetIngredients } from '@workspace/api-client-react';
import { useStartShiftMutation, useCloseShiftMutation } from '@/hooks/use-pos-mutations';
import { usePosStore } from '@/store';
import { getTranslation, formatMoney } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Square, 
  Receipt, 
  AlertTriangle, 
  Package, 
  TrendingUp, 
  Users, 
  Anchor, 
  Calendar,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'wouter';

// Mock local events data for Puerto Vallarta
const LOCAL_EVENTS = [
  { id: 1, title: 'Cruise Ship Arrival: Carnival Panorama', time: '8:00 AM - 6:00 PM', impact: 'high', icon: Anchor, type: 'Cruise' },
  { id: 2, title: 'Malecón Art Walk', time: '6:00 PM - 10:00 PM', impact: 'medium', icon: Users, type: 'Festival' },
  { id: 3, title: 'Live Music: Los Muertos Beach', time: 'Tonight 9:00 PM', impact: 'medium', icon: Zap, type: 'Music' },
  { id: 4, title: 'Local Farmers Market', time: 'Saturday 9:00 AM', impact: 'low', icon: Calendar, type: 'Market' },
];

export default function Dashboard() {
  const { language, activeStaff } = usePosStore();
  const { data: activeShift } = useGetActiveShift();
  const { data: tabs } = useGetTabs({ status: 'open' });
  const { data: ingredients } = useGetIngredients();
  
  const startShift = useStartShiftMutation();
  const closeShift = useCloseShiftMutation();

  const lowStock = ingredients?.filter(i => i.currentStock <= i.minimumStock) || [];
  const openTabsCount = tabs?.length || 0;
  const totalSales = tabs?.reduce((sum, tab) => sum + Number(tab.totalMxn), 0) || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold">
            {getTranslation('dashboard', language)}
          </h1>
          <p className="text-muted-foreground">
            {activeStaff ? `Welcome back, ${activeStaff.firstName}` : 'Please switch staff member to begin'}
          </p>
        </div>
        
        {activeShift ? (
          <Button 
            variant="destructive" 
            size="lg" 
            className="rounded-2xl h-14 px-8 shadow-lg shadow-destructive/20"
            onClick={() => closeShift.mutate({ id: activeShift.id })}
            disabled={closeShift.isPending}
          >
            <Square className="mr-2" size={20} />
            {getTranslation('close_shift', language)}
          </Button>
        ) : (
          <Button 
            size="lg" 
            className="rounded-2xl h-14 px-8 shadow-lg shadow-primary/20"
            onClick={() => startShift.mutate({ data: { name: `Shift ${format(new Date(), 'MMM d, h:mm a')}`, openedByUserId: activeStaff?.id || '' } })}
            disabled={!activeStaff || startShift.isPending}
          >
            <Play className="mr-2" size={20} />
            {getTranslation('start_shift', language)}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="glass p-6 rounded-3xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
            <Receipt size={24} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{getTranslation('open_tabs', language)}</p>
            <p className="text-2xl font-bold">{openTabsCount}</p>
          </div>
        </div>

        <div className="glass p-6 rounded-3xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Running Sales</p>
            <p className="text-2xl font-bold">{formatMoney(totalSales)}</p>
          </div>
        </div>

        <div className="glass p-6 rounded-3xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Low Stock</p>
            <p className="text-2xl font-bold">{lowStock.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Local Events Section (The "News" Feed) */}
        <div className="space-y-4">
          <h3 className="text-xl font-display font-bold flex items-center gap-2">
            <Zap size={20} className="text-primary" /> Puerto Vallarta Rushes
          </h3>
          <div className="glass rounded-3xl overflow-hidden divide-y divide-white/5 border border-white/5">
            {LOCAL_EVENTS.map(event => (
              <div key={event.id} className="p-5 hover:bg-white/5 transition-colors flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  event.impact === 'high' ? 'bg-primary/20 text-primary' : 
                  event.impact === 'medium' ? 'bg-blue-500/20 text-blue-400' : 
                  'bg-secondary text-muted-foreground'
                }`}>
                  <event.icon size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm">{event.title}</h4>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      event.impact === 'high' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                    }`}>
                      {event.impact} impact
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <span className="opacity-60">{event.type}</span> • {event.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Alerts */}
        <div className="space-y-4">
          <h3 className="text-xl font-display font-bold flex items-center gap-2">
            <Package size={20} className="text-primary" /> {getTranslation('low_stock', language)}
          </h3>
          <div className="glass rounded-3xl p-6 border border-white/5 min-h-[300px]">
            {lowStock.length > 0 ? (
              <div className="space-y-4">
                {lowStock.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-3 rounded-2xl bg-white/5 border border-white/5">
                    <span className="font-medium">{language === 'es' && item.nameEs ? item.nameEs : item.name}</span>
                    <span className="text-primary font-bold">{item.currentStock} {item.unit} left</span>
                  </div>
                ))}
                <Link href="/inventory">
                  <Button variant="link" className="w-full text-primary">Manage Inventory →</Button>
                </Link>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-12 text-muted-foreground italic">
                <Package size={48} className="mb-4 opacity-20" />
                <p>{getTranslation('all_good', language)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
