import React, { useState } from 'react';
import { useGetShifts, useGetEndOfNightReport } from '@workspace/api-client-react';
import { usePosStore } from '@/store';
import { formatMoney, getTranslation } from '@/lib/utils';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Reports() {
  const { language } = usePosStore();
  const { data: shifts } = useGetShifts();
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const { data: report } = useGetEndOfNightReport(selectedShiftId || '', { query: { enabled: !!selectedShiftId } as any });

  const closedShifts = shifts?.filter(s => s.status === 'closed') || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-display">{getTranslation('reports', language)}</h1>
          <p className="text-muted-foreground mt-1">End of night shift summaries</p>
        </div>
        
        <select 
          className="bg-card border border-white/10 rounded-xl px-4 py-3 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary"
          value={selectedShiftId || ''}
          onChange={(e) => setSelectedShiftId(e.target.value)}
        >
          <option value="">Select a shift...</option>
          {closedShifts.map(shift => (
            <option key={shift.id} value={shift.id}>
              {shift.name} ({format(new Date(shift.startedAt), 'MMM d')})
            </option>
          ))}
        </select>
      </div>

      {report ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass p-6 rounded-3xl">
              <p className="text-muted-foreground text-sm mb-1">Total Sales (MXN)</p>
              <p className="text-3xl font-display font-bold text-primary">{formatMoney(report.totalSalesMxn)}</p>
            </div>
            <div className="glass p-6 rounded-3xl">
              <p className="text-muted-foreground text-sm mb-1">Total USD Value</p>
              <p className="text-3xl font-display font-bold">${report.totalSalesUsd.toFixed(2)}</p>
            </div>
            <div className="glass p-6 rounded-3xl">
              <p className="text-muted-foreground text-sm mb-1">Tabs Closed</p>
              <p className="text-3xl font-display font-bold">{report.totalTabsClosed}</p>
            </div>
            <div className="glass p-6 rounded-3xl">
              <p className="text-muted-foreground text-sm mb-1">Cash / Card Split</p>
              <div className="flex gap-2 mt-2">
                <div className="flex-1 bg-emerald-500/20 rounded-lg p-2 text-center text-emerald-400 font-medium">
                  {((report.cashSalesMxn / report.totalSalesMxn) * 100 || 0).toFixed(0)}%
                </div>
                <div className="flex-1 bg-blue-500/20 rounded-lg p-2 text-center text-blue-400 font-medium">
                  {((report.cardSalesMxn / report.totalSalesMxn) * 100 || 0).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass p-6 rounded-3xl">
              <h3 className="text-xl font-display mb-6">Sales by Staff</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.salesByStaff} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="staffUserName" stroke="#888" tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                    <RechartsTooltip 
                      cursor={{ fill: '#ffffff05' }}
                      contentStyle={{ backgroundColor: '#1f1813', borderColor: '#ffffff10', borderRadius: '12px' }}
                    />
                    <Bar dataKey="totalSalesMxn" radius={[6, 6, 0, 0]}>
                      {report.salesByStaff.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#f59e0b' : '#d97706'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass p-6 rounded-3xl">
              <h3 className="text-xl font-display mb-6">Top Sellers</h3>
              <div className="space-y-4">
                {report.topSellers.slice(0, 5).map((drink, i) => (
                  <div key={drink.drinkId} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-muted-foreground">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-medium">{drink.drinkName}</p>
                        <p className="text-xs text-muted-foreground">{drink.quantitySold} sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{formatMoney(drink.totalSalesMxn)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : selectedShiftId ? (
        <div className="py-20 text-center text-muted-foreground">Loading report data...</div>
      ) : (
        <div className="py-20 text-center glass rounded-3xl text-muted-foreground">
          Select a closed shift above to view the end of night breakdown.
        </div>
      )}
    </div>
  );
}
