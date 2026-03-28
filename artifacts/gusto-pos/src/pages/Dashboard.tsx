import React from 'react';
import { useGetActiveShift, useGetTabs, useGetIngredients } from '@workspace/api-client-react';
import { useStartShiftMutation, useCloseShiftMutation } from '@/hooks/use-pos-mutations';
import { usePosStore } from '@/store';
import { getTranslation } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Play, Square, AlertTriangle, Receipt, Coffee, Package } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const { language, activeStaff } = usePosStore();
  const { data: shiftData } = useGetActiveShift();
  const { data: tabs } = useGetTabs({ status: 'open' });
  const { data: ingredients } = useGetIngredients();
  const startShift = useStartShiftMutation();
  const closeShift = useCloseShiftMutation();

  const activeShift = shiftData?.shift;
  const lowStock = ingredients?.filter(i => i.currentStock <= i.minimumStock) || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display">{getTranslation('dashboard', language)}</h1>
          <p className="text-muted-foreground mt-1">Overview of your current operations</p>
        </div>
        
        {activeShift ? (
          <Button 
            variant="destructive" 
            size="lg" 
            onClick={() => closeShift.mutate({ id: activeShift.id })}
            disabled={closeShift.isPending}
          >
            <Square className="mr-2" size={20} />
            {getTranslation('close_shift', language)}
          </Button>
        ) : (
          <Button 
            size="lg" 
            onClick={() => startShift.mutate({ data: { name: `Shift ${format(new Date(), 'MMM d, h:mm a')}`, openedByUserId: activeStaff?.id || '' } })}
            disabled={!activeStaff || startShift.isPending}
          >
            <Play className="mr-2" size={20} />
            {getTranslation('start_shift', language)}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-3xl flex flex-col relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-primary/10 group-hover:text-primary/20 transition-colors">
            <Receipt size={120} />
          </div>
          <h3 className="text-muted-foreground font-medium mb-2 relative z-10">{getTranslation('open_tabs', language)}</h3>
          <p className="text-5xl font-display font-bold text-foreground relative z-10">{tabs?.length || 0}</p>
          <div className="mt-auto pt-6 relative z-10">
            {activeShift ? (
              <span className="text-sm text-primary">Shift active since {format(new Date(activeShift.startedAt), 'h:mm a')}</span>
            ) : (
              <span className="text-sm text-muted-foreground">No active shift</span>
            )}
          </div>
        </div>

        <div className="glass p-6 rounded-3xl flex flex-col md:col-span-2 relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <AlertTriangle className={lowStock.length > 0 ? "text-primary" : "text-muted-foreground"} size={20} />
              {getTranslation('low_stock', language)}
            </h3>
            <span className="px-3 py-1 bg-secondary rounded-full text-xs font-semibold">{lowStock.length} Items</span>
          </div>
          
          {lowStock.length > 0 ? (
            <div className="space-y-3 overflow-y-auto max-h-[160px] pr-2">
              {lowStock.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center">
                      <Coffee className="text-muted-foreground" size={18} />
                    </div>
                    <div>
                      <p className="font-medium">{language === 'es' ? item.nameEs || item.name : item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-destructive">{item.currentStock} {item.unit}</p>
                    <p className="text-xs text-muted-foreground">Min: {item.minimumStock}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <Package size={40} className="mb-2 opacity-50" />
              <p>{getTranslation('all_good', language)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
