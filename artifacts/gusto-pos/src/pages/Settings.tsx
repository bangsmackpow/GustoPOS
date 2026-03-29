import React, { useState, useEffect } from 'react';
import { useGetSettings, useUpdateSettings } from '@workspace/api-client-react';
import { usePosStore } from '@/store';
import { getTranslation } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

export default function Settings() {
  const { language } = usePosStore();
  const { data: settings } = useGetSettings();
  const updateSettings = useUpdateSettings();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    barName: '',
    usdToMxnRate: 0,
    cadToMxnRate: 0,
    defaultMarkupFactor: 0
  });

  useEffect(() => {
    if (settings && !formData.barName) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        barName: settings.barName,
        usdToMxnRate: settings.usdToMxnRate,
        cadToMxnRate: settings.cadToMxnRate,
        defaultMarkupFactor: settings.defaultMarkupFactor
      });
    }
  }, [settings, formData.barName]);

  const handleSave = () => {
    updateSettings.mutate({ data: formData }, {
      onSuccess: () => toast({ title: "Settings saved successfully" }),
      onError: (err: any) => toast({ variant: "destructive", title: "Failed to save", description: err.message })
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-display">{getTranslation('settings', language)}</h1>
        <p className="text-muted-foreground mt-1">Configure global POS behavior and rates</p>
      </div>

      <div className="glass rounded-3xl p-8 space-y-8">
        <div>
          <h3 className="text-xl font-medium mb-4 pb-2 border-b border-white/5 text-primary">General</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Bar Name</label>
              <input 
                className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground" 
                value={formData.barName} 
                onChange={e => setFormData({...formData, barName: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Default Markup Factor</label>
              <input 
                type="number" 
                step="0.1"
                className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground" 
                value={formData.defaultMarkupFactor} 
                onChange={e => setFormData({...formData, defaultMarkupFactor: parseFloat(e.target.value)})} 
              />
              <p className="text-xs text-muted-foreground mt-2">Used when creating new drinks (e.g. 3.0 means 3x cost)</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-medium mb-4 pb-2 border-b border-white/5 text-primary">Exchange Rates</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">1 USD = X MXN</label>
              <input 
                type="number" 
                step="0.01"
                className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground" 
                value={formData.usdToMxnRate} 
                onChange={e => setFormData({...formData, usdToMxnRate: parseFloat(e.target.value)})} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">1 CAD = X MXN</label>
              <input 
                type="number" 
                step="0.01"
                className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground" 
                value={formData.cadToMxnRate} 
                onChange={e => setFormData({...formData, cadToMxnRate: parseFloat(e.target.value)})} 
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button size="lg" onClick={handleSave} disabled={updateSettings.isPending}>
            <Save className="mr-2" size={20} /> Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
