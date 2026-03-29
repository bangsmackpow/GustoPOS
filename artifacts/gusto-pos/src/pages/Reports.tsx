import React, { useState } from 'react';
import { useGetShifts, useGetEndOfNightReport, useStartShiftMutation, useCloseShiftMutation } from '@workspace/api-client-react';
import { usePosStore } from '@/store';
import { getTranslation } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Play, 
  StopCircle, 
  ReceiptText, 
  Wine, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle,
  History,
  ArrowRight,
  Package
} from 'lucide-react';
import { format } from 'date-fns';

export default function Reports() {
  const { language, activeStaff } = usePosStore();
  const { data: shifts, isLoading: loadingShifts } = useGetShifts();
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  
  // Find currently active shift
  const activeShift = shifts?.find(s => s.status === 'active');
  
  const { data: report, isLoading: loadingReport } = useGetEndOfNightReport(
    selectedShiftId || activeShift?.id || '',
    { query: { enabled: !!(selectedShiftId || activeShift?.id) } }
  );

  const startShift = useStartShiftMutation();
  const closeShift = useCloseShiftMutation();

  const handleStartShift = () => {
    if (!activeStaff) return;
    const name = `Shift ${format(new Date(), 'MMM d, p')}`;
    startShift.mutate({ data: { name, openedByUserId: activeStaff.id } });
  };

  const handleCloseShift = () => {
    if (!activeShift) return;
    if (!confirm(getTranslation('confirm_close_shift', language))) return;
    closeShift.mutate({ id: activeShift.id });
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center bg-secondary/30 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-md">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight">{getTranslation('reports', language)}</h1>
          <p className="text-muted-foreground mt-1">Operational Insights & Nightly Summaries</p>
        </div>
        
        <div className="flex gap-3">
          {activeShift ? (
            <Button variant="destructive" className="h-14 px-8 rounded-2xl gap-2 shadow-lg shadow-destructive/20" onClick={handleCloseShift}>
              <StopCircle size={20} /> {getTranslation('close_shift', language)}
            </Button>
          ) : (
            <Button className="h-14 px-8 rounded-2xl gap-2 shadow-lg shadow-primary/20" onClick={handleStartShift}>
              <Play size={20} /> {getTranslation('start_shift', language)}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: History */}
        <div className="lg:col-span-4 space-y-6">
          <section className="glass rounded-[2rem] p-6 border border-white/5">
            <h3 className="text-lg font-medium text-primary flex items-center gap-2 mb-6">
              <History size={20} /> {getTranslation('shift_history', language)}
            </h3>
            
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {shifts?.map(shift => (
                <button
                  key={shift.id}
                  onClick={() => setSelectedShiftId(shift.id)}
                  className={`w-full text-left p-4 rounded-2xl transition-all border ${
                    (selectedShiftId === shift.id || (!selectedShiftId && activeShift?.id === shift.id))
                      ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20' 
                      : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="font-bold">{shift.name}</div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                      shift.status === 'active' ? 'bg-emerald-500 text-white animate-pulse' : 'bg-secondary/50 text-muted-foreground'
                    }`}>
                      {shift.status}
                    </span>
                  </div>
                  <div className="text-[10px] mt-2 opacity-70">
                    {format(new Date(shift.startedAt), 'MMM d, h:mm a')}
                  </div>
                </button>
              ))}
              {loadingShifts && <div className="text-center py-10 text-muted-foreground">Loading shifts...</div>}
            </div>
          </section>
        </div>

        {/* Right Column: Report Details */}
        <div className="lg:col-span-8">
          {report ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary mb-4">
                    <DollarSign size={20} />
                  </div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Total Sales</p>
                  <p className="text-3xl font-display font-bold mt-1">
                    ${report.totalSalesMxn.toLocaleString()} <span className="text-xs font-sans text-muted-foreground ml-1">MXN</span>
                  </p>
                </div>
                
                <div className="glass p-6 rounded-3xl border border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                    <ReceiptText size={20} />
                  </div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Tabs Closed</p>
                  <p className="text-3xl font-display font-bold mt-1">{report.totalTabsClosed}</p>
                </div>

                <div className="glass p-6 rounded-3xl border border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                    <TrendingUp size={20} />
                  </div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Avg Tab</p>
                  <p className="text-3xl font-display font-bold mt-1">
                    ${(report.totalTabsClosed > 0 ? (report.totalSalesMxn / report.totalTabsClosed) : 0).toFixed(0)}
                  </p>
                </div>
              </div>

              {/* Profit Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="glass rounded-3xl p-6 border border-white/5">
                  <h3 className="text-lg font-medium text-emerald-400 flex items-center gap-2 mb-6">
                    <TrendingUp size={20} /> Top Profit Drivers
                  </h3>
                  <div className="space-y-4">
                    {report.salesByDrink.slice(0, 5).map((drink, i) => (
                      <div key={drink.drinkId} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-muted-foreground/50 w-4">#{i+1}</span>
                          <div>
                            <p className="text-sm font-medium">{language === 'en' ? drink.drinkName : (drink.drinkNameEs || drink.drinkName)}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">{drink.quantitySold} units sold</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-400">+${drink.profitMxn.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">Profit</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="glass rounded-3xl p-6 border border-white/5">
                  <h3 className="text-lg font-medium text-amber-400 flex items-center gap-2 mb-6">
                    <Wine size={20} /> Most Common Items
                  </h3>
                  <div className="space-y-4">
                    {report.topSellers.slice(0, 5).map((drink, i) => (
                      <div key={drink.drinkId} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-muted-foreground/50 w-4">#{i+1}</span>
                          <div>
                            <p className="text-sm font-medium">{language === 'en' ? drink.drinkName : (drink.drinkNameEs || drink.drinkName)}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">${drink.totalSalesMxn.toLocaleString()} Total Sales</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-amber-400">{drink.quantitySold} qty</p>
                          <p className="text-[10px] text-muted-foreground uppercase">Volume</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Inventory Summary */}
              <section className="glass rounded-3xl p-6 border border-white/5">
                <h3 className="text-lg font-medium text-primary flex items-center gap-2 mb-6">
                  <Package size={20} /> Inventory Velocity
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                  {report.inventoryUsed.map(item => (
                    <div key={item.ingredientId} className="flex items-center justify-between pb-2 border-b border-white/5">
                      <div>
                        <p className="text-sm font-medium">{item.ingredientName}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Current: {item.currentStock} {item.unit}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">-{item.amountUsed.toFixed(0)} {item.unit}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Usage</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Low Stock Alerts */}
              {report.lowStockAlerts.length > 0 && (
                <section className="bg-destructive/10 rounded-3xl p-6 border border-destructive/20">
                  <h3 className="text-lg font-medium text-destructive flex items-center gap-2 mb-4">
                    <AlertTriangle size={20} /> Low Stock Warnings
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {report.lowStockAlerts.map(item => (
                      <div key={item.ingredientId} className="p-3 bg-destructive/5 rounded-2xl border border-destructive/10">
                        <p className="text-xs font-bold truncate">{item.ingredientName}</p>
                        <p className="text-lg font-display font-bold text-destructive">{item.currentStock}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{item.unit} left</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className="h-[400px] flex flex-col items-center justify-center text-center glass rounded-3xl border border-white/5">
              <BarChart3 size={48} className="text-muted-foreground mb-4 opacity-20" />
              <p className="text-muted-foreground font-medium">Select a shift from the history to view its performance report.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
