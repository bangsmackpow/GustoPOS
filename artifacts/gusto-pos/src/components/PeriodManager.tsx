import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CalendarDays, Save, Play, Loader2, X } from "lucide-react";
import { format } from "date-fns";

export function PeriodManager() {
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPeriods();
  }, []);

  const fetchPeriods = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/periods");
      if (!res.ok) throw new Error("Failed to load periods");
      const data = await res.json();
      setPeriods(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePeriod = async () => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create period");
      }
      await fetchPeriods();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClosePeriod = async (id: string) => {
    if (!confirm("Are you sure you want to close this accounting period? This will calculate all COGS and lock totals.")) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/periods/${id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closedByUserId: "system" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to close period");
      }
      await fetchPeriods();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-primary opacity-50" size={32} />
      </div>
    );
  }

  const openPeriod = periods.find(p => p.status === "open");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CalendarDays className="text-blue-400" /> Accounting Periods
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Manage daily, weekly or custom accounting period windows.</p>
        </div>
        {!openPeriod && (
          <Button onClick={handleCreatePeriod} disabled={actionLoading}>
            <Play size={16} className="mr-2" /> Start New Period
          </Button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError(null)}><X size={16} /></Button>
        </div>
      )}

      <div className="glass rounded-3xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 border-b border-white/5">
              <tr>
                <th className="p-4 font-medium text-muted-foreground">Period Name</th>
                <th className="p-4 font-medium text-muted-foreground">Type</th>
                <th className="p-4 font-medium text-muted-foreground">Status</th>
                <th className="p-4 font-medium text-muted-foreground">Date Start</th>
                <th className="p-4 font-medium text-muted-foreground">Total Sales</th>
                <th className="p-4 font-medium text-muted-foreground">COGS</th>
                <th className="p-4 font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {periods.map(period => (
                <tr key={period.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-medium">{period.name}</td>
                  <td className="p-4 capitalize text-muted-foreground">{period.periodType}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${period.status === "open" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : "bg-white/10 text-muted-foreground"}`}>
                      {period.status}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {format(new Date(period.startDate * 1000), "MMM d, yyyy h:mm a")}
                  </td>
                  <td className="p-4 font-medium text-green-400">
                    ${(period.totalSalesMxn || 0).toFixed(2)}
                  </td>
                  <td className="p-4 font-medium text-red-400">
                    ${(period.cogsMxn || 0).toFixed(2)}
                  </td>
                  <td className="p-4 text-right">
                    {period.status === "open" ? (
                      <Button variant="outline" size="sm" onClick={() => handleClosePeriod(period.id)} disabled={actionLoading}>
                        <Save size={14} className="mr-2" /> Close Period
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Closed</span>
                    )}
                  </td>
                </tr>
              ))}
              {periods.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No periods have been tracked yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
