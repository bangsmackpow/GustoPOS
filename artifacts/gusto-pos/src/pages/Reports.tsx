import React, { useState } from 'react';
import { useGetShifts, useGetEndOfNightReport } from '@workspace/api-client-react';
import { usePosStore } from '@/store';
import { formatMoney, getTranslation } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp, Users, Package, ArrowRight, Download, BarChart3, PieChart } from 'lucide-react';
import { format } from 'date-fns';

export default function Reports() {
  const { language } = usePosStore();
  const { data: shifts } = useGetShifts();
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: report, isLoading } = useGetEndOfNightReport(selectedShiftId || '', { query: { enabled: !!selectedShiftId } as any });

  const closedShifts = shifts?.filter(s => s.status === 'closed') || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-display font-bold">{getTranslation('reports', language)}</h1>
          <p className="text-muted-foreground mt-1">Nightly summaries and performance analytics</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2" size={18} /> Export Data
        </Button>
      </div>

      {/* Shift Selector */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Calendar size={16} /> Recent Closed Shifts
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {closedShifts.map(shift => (
            <button
              key={shift.id}
              onClick={() => setSelectedShiftId(shift.id)}
              className={`flex-shrink-0 p-4 rounded-2xl border transition-all text-left min-w-[200px] ${
                selectedShiftId === shift.id 
                  ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20' 
                  : 'glass border-white/5 text-muted-foreground hover:border-white/20'
              }`}
            >
              <div className="font-bold">{shift.name}</div>
              <div className="text-xs opacity-70 mt-1">{format(new Date(shift.startedAt), 'MMM d, h:mm a')}</div>
            </button>
          ))}
          {closedShifts.length === 0 && (
            <div className="text-muted-foreground italic py-4">No closed shifts available for reporting.</div>
          )}
        </div>
      </div>

      {selectedShiftId && report ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Main Stats */}
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass p-8 rounded-3xl border border-white/5 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <TrendingUp size={24} />
                  </div>
                  <span className="text-xs font-bold text-emerald-400 uppercase bg-emerald-400/10 px-2 py-1 rounded">Growth +12%</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-4xl font-display font-bold">{formatMoney(report.cashSalesMxn + report.cardSalesMxn)}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase uppercase">Cash</p>
                    <p className="font-bold">{formatMoney(report.cashSalesMxn)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Card</p>
                    <p className="font-bold">{formatMoney(report.cardSalesMxn)}</p>
                  </div>
                </div>
              </div>

              <div className="glass p-8 rounded-3xl border border-white/5 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Service Velocity</p>
                  <p className="text-4xl font-display font-bold">{report.totalTabsClosed} <span className="text-lg font-sans text-muted-foreground font-normal">tabs</span></p>
                </div>
                <p className="text-xs text-muted-foreground pt-4 border-t border-white/5">
                  Average check: {formatMoney((report.cashSalesMxn + report.cardSalesMxn) / (report.totalTabsClosed || 1))}
                </p>
              </div>
            </div>

            {/* Sales by Staff Breakdown */}
            <section className="glass rounded-3xl p-8">
              <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                <PieChart size={20} className="text-primary" /> {getTranslation('sales', language)} by {getTranslation('staff', language)}
              </h3>
              <div className="space-y-4">
                {report.salesByStaff.map((staff: any) => (
                  <div key={staff.staffUserId} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{staff.staffName}</span>
                      <span className="font-bold">{formatMoney(staff.totalSales)}</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${(staff.totalSales / (report.cashSalesMxn + report.cardSalesMxn || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Side Column: Top Sellers & Inventory */}
          <div className="space-y-8">
            <section className="glass rounded-3xl p-6 border border-white/5">
              <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-primary" /> {getTranslation('top_sellers', language)}
              </h3>
              <div className="space-y-4">
                {report.topSellers.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
                      #{idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{language === 'es' && item.drinkNameEs ? item.drinkNameEs : item.drinkName}</p>
                      <p className="text-[10px] text-muted-foreground">{item.count} sold</p>
                    </div>
                    <p className="text-sm font-bold text-primary">{formatMoney(item.totalRevenue)}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="glass rounded-3xl p-6 border border-white/5">
              <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
                <Package size={18} className="text-primary" /> {getTranslation('inventory_used', language)}
              </h3>
              <div className="space-y-3">
                {report.inventoryUsed.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                    <span className="text-muted-foreground">{language === 'es' && item.ingredientNameEs ? item.ingredientNameEs : item.ingredientName}</span>
                    <span className="font-mono font-bold text-primary">{item.amountUsed}{item.unit}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      ) : selectedShiftId && isLoading ? (
        <div className="py-20 text-center glass rounded-3xl animate-pulse">Loading report data...</div>
      ) : (
        <div className="py-20 text-center glass rounded-3xl text-muted-foreground border-2 border-dashed border-white/5">
          <BarChart3 size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-display">Select a closed shift above to view the end of night breakdown.</p>
        </div>
      )}
    </div>
  );
}
