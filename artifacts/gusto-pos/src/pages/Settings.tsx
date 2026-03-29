import React, { useState, useEffect } from 'react';
import { useGetSettings, useUpdateSettings } from '@workspace/api-client-react';
import { usePosStore } from '@/store';
import { getTranslation } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Save, Mail, Server } from 'lucide-react';

export default function Settings() {
  const { language } = usePosStore();
  const { data: settings } = useGetSettings();
  const updateSettings = useUpdateSettings();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    barName: '',
    usdToMxnRate: 0,
    cadToMxnRate: 0,
    defaultMarkupFactor: 0,
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    smtpFromEmail: '',
    inventoryAlertEmail: ''
  });

  useEffect(() => {
    if (settings && !formData.barName) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        barName: settings.barName,
        usdToMxnRate: settings.usdToMxnRate,
        cadToMxnRate: settings.cadToMxnRate,
        defaultMarkupFactor: settings.defaultMarkupFactor,
        smtpHost: settings.smtpHost || '',
        smtpPort: settings.smtpPort || 587,
        smtpUser: settings.smtpUser || '',
        smtpPassword: settings.smtpPassword || '',
        smtpFromEmail: settings.smtpFromEmail || '',
        inventoryAlertEmail: settings.inventoryAlertEmail || ''
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
    <div className="max-w-3xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-4xl font-display">{getTranslation('settings', language)}</h1>
        <p className="text-muted-foreground mt-1">Configure global POS behavior, rates, and notifications</p>
      </div>

      <div className="glass rounded-3xl p-8 space-y-10">
        <section>
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
        </section>

        <section>
          <h3 className="text-xl font-medium mb-4 pb-2 border-b border-white/5 text-primary flex items-center gap-2">
            <Mail size={20} /> Notifications
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Inventory Alert Recipient</label>
              <input 
                type="email"
                placeholder="manager@example.com"
                className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground" 
                value={formData.inventoryAlertEmail} 
                onChange={e => setFormData({...formData, inventoryAlertEmail: e.target.value})} 
              />
              <p className="text-xs text-muted-foreground mt-2">Email address to receive low stock alerts</p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-medium mb-4 pb-2 border-b border-white/5 text-primary flex items-center gap-2">
            <Server size={20} /> SMTP Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-muted-foreground mb-2">SMTP Host</label>
              <input 
                placeholder="mail.smtp2go.com"
                className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground" 
                value={formData.smtpHost} 
                onChange={e => setFormData({...formData, smtpHost: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">SMTP Port</label>
              <input 
                type="number"
                placeholder="587"
                className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground" 
                value={formData.smtpPort} 
                onChange={e => setFormData({...formData, smtpPort: parseInt(e.target.value) || 0})} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">From Email</label>
              <input 
                type="email"
                placeholder="pos@yourbar.com"
                className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground" 
                value={formData.smtpFromEmail} 
                onChange={e => setFormData({...formData, smtpFromEmail: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">SMTP Username</label>
              <input 
                className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground" 
                value={formData.smtpUser} 
                onChange={e => setFormData({...formData, smtpUser: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">SMTP Password</label>
              <input 
                type="password"
                className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground" 
                value={formData.smtpPassword} 
                onChange={e => setFormData({...formData, smtpPassword: e.target.value})} 
              />
            </div>
          </div>
        </section>

        <section>
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
        </section>

        <div className="pt-4 flex justify-end">
          <Button size="lg" onClick={handleSave} disabled={updateSettings.isPending}>
            <Save className="mr-2" size={20} /> Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
