import React, { useState, useEffect } from 'react';
import { 
  useGetSettings, 
  useUpdateSettings, 
  useGetUsers, 
  useUpdateUser, 
  useCreateUser,
  useGetRushes,
  usePostRushes,
  useDeleteRushesId
} from '@workspace/api-client-react';
import { usePosStore } from '@/store';
import { getTranslation } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Save, Mail, Server, Users, Plus, Edit2, X, Check, Wine, Beer, Coffee, GlassWater, Martini, Microwave, IceCream, ChefHat, Utensils, Pizza, Zap, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const BRAND_ICONS = [
  { name: 'Wine', icon: Wine },
  { name: 'Beer', icon: Beer },
  { name: 'Coffee', icon: Coffee },
  { name: 'GlassWater', icon: GlassWater },
  { name: 'Martini', icon: Martini },
  { name: 'Microwave', icon: Microwave },
  { name: 'IceCream', icon: IceCream },
  { name: 'ChefHat', icon: ChefHat },
  { name: 'Utensils', icon: Utensils },
  { name: 'Pizza', icon: Pizza },
];

export default function Settings() {
  const { language, setLanguage } = usePosStore();
  const { data: settings } = useGetSettings();
  const { data: users, refetch: refetchUsers } = useGetUsers();
  const { data: rushes, refetch: refetchRushes } = useGetRushes();
  
  const updateSettings = useUpdateSettings();
  const updateUser = useUpdateUser();
  const createUser = useCreateUser();
  const createRush = usePostRushes();
  const deleteRush = useDeleteRushesId();
  
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    barName: '',
    barIcon: 'Wine',
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

  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [showAddRush, setShowAddRush] = useState(false);
  const [newRush, setNewRush] = useState({
    title: '',
    type: 'cruise' as const,
    impact: 'medium' as const,
    startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    description: ''
  });

  useEffect(() => {
    if (settings && !formData.barName) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        barName: settings.barName,
        barIcon: settings.barIcon || 'Wine',
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

  const handleSaveSettings = () => {
    updateSettings.mutate({ data: formData }, {
      onSuccess: () => toast({ title: getTranslation('save', language), description: "Settings updated" }),
      onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message })
    });
  };

  const handleSaveStaff = () => {
    const mutation = editingStaff.id ? updateUser : createUser;
    const variables = editingStaff.id 
      ? { id: editingStaff.id, data: editingStaff }
      : { data: editingStaff };

    mutation.mutate(variables as any, {
      onSuccess: () => {
        toast({ title: "Success", description: "Staff member saved" });
        setEditingStaff(null);
        refetchUsers();
      },
      onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message })
    });
  };

  const handleAddRush = () => {
    createRush.mutate({ 
      data: {
        ...newRush,
        startTime: new Date(newRush.startTime).toISOString()
      } 
    }, {
      onSuccess: () => {
        toast({ title: "Rush added" });
        setShowAddRush(false);
        setNewRush({ title: '', type: 'cruise', impact: 'medium', startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"), description: '' });
        refetchRushes();
      }
    });
  };

  const handleDeleteRush = (id: string) => {
    if (!confirm("Remove this event?")) return;
    deleteRush.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Rush removed" });
        refetchRushes();
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-display">{getTranslation('settings', language)}</h1>
          <p className="text-muted-foreground mt-1">POS Configuration & Operations</p>
        </div>
        <div className="flex bg-secondary/50 p-1 rounded-xl border border-white/5">
          <Button 
            variant={language === 'en' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setLanguage('en')}
            className="rounded-lg"
          >
            English
          </Button>
          <Button 
            variant={language === 'es' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setLanguage('es')}
            className="rounded-lg"
          >
            Español
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Staff & Rushes */}
        <div className="lg:col-span-8 space-y-8">
          {/* Rushes Management */}
          <section className="glass rounded-3xl p-6">
            <div className="flex justify-between items-center mb-6 pb-2 border-b border-white/5">
              <h3 className="text-xl font-medium text-primary flex items-center gap-2">
                <Zap size={20} /> Puerto Vallarta Rushes
              </h3>
              <Button size="sm" variant="outline" onClick={() => setShowAddRush(true)}>
                <Plus size={16} className="mr-1" /> Add Event
              </Button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {rushes?.map(rush => (
                <div key={rush.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      rush.impact === 'high' ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
                    }`}>
                      <Calendar size={20} />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{rush.title}</div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-1">
                        <span className="uppercase font-bold text-primary">{rush.type}</span>
                        <span>•</span>
                        <span>{format(new Date(rush.startTime), 'MMM d, h:mm a')}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleDeleteRush(rush.id)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
              {rushes?.length === 0 && (
                <div className="text-center py-10 text-muted-foreground italic text-sm">No upcoming rushes scheduled.</div>
              )}
            </div>
          </section>

          {/* Staff Management */}
          <section className="glass rounded-3xl p-6">
            <div className="flex justify-between items-center mb-6 pb-2 border-b border-white/5">
              <h3 className="text-xl font-medium text-primary flex items-center gap-2">
                <Users size={20} /> {getTranslation('staff_mgmt', language)}
              </h3>
              <Button size="sm" variant="outline" onClick={() => setEditingStaff({ firstName: '', lastName: '', role: 'bartender', language: 'es', pin: '', isActive: true })}>
                <Plus size={16} className="mr-1" /> {getTranslation('add_staff', language)}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {users?.map(user => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-primary/30 transition-all">
                  <div>
                    <div className="font-medium">{user.firstName} {user.lastName}</div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-1 uppercase font-bold tracking-wider">
                      <span className="bg-secondary px-2 py-0.5 rounded">{getTranslation(user.role as any, language)}</span>
                      <span>PIN: {user.pin}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setEditingStaff(user)}>
                    <Edit2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          </section>

          {/* Branding & Config */}
          <section className="glass rounded-3xl p-8 space-y-8">
            <h3 className="text-xl font-medium text-primary border-b border-white/5 pb-2">Branding & Store</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-4 text-center">Select Bar Icon</label>
                <div className="flex flex-wrap justify-center gap-3">
                  {BRAND_ICONS.map(({ name, icon: Icon }) => (
                    <button
                      key={name}
                      onClick={() => setFormData({...formData, barIcon: name})}
                      className={`p-4 rounded-2xl flex items-center justify-center transition-all ${
                        formData.barIcon === name 
                          ? 'bg-primary text-primary-foreground shadow-lg' 
                          : 'bg-secondary/50 text-muted-foreground hover:bg-secondary border border-white/5'
                      }`}
                    >
                      <Icon size={24} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Bar Name</label>
                  <input 
                    className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground" 
                    value={formData.barName} 
                    onChange={e => setFormData({...formData, barName: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">{getTranslation('exchange_rates', language)} (USD → MXN)</label>
                  <input 
                    type="number" step="0.01"
                    className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground" 
                    value={formData.usdToMxnRate || ''} 
                    onChange={e => setFormData({...formData, usdToMxnRate: parseFloat(e.target.value) || 0})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">CAD → MXN</label>
                  <input 
                    type="number" step="0.01"
                    className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground" 
                    value={formData.cadToMxnRate || ''} 
                    onChange={e => setFormData({...formData, cadToMxnRate: parseFloat(e.target.value) || 0})} 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Default Markup Factor</label>
                  <input 
                    type="number" step="0.1"
                    className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground" 
                    value={formData.defaultMarkupFactor || ''} 
                    onChange={e => setFormData({...formData, defaultMarkupFactor: parseFloat(e.target.value) || 0})} 
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveSettings} disabled={updateSettings.isPending}>
                <Save className="mr-2" size={18} /> Save Branding & Config
              </Button>
            </div>
          </section>
        </div>

        {/* Right Column: SMTP */}
        <div className="lg:col-span-4">
          <section className="glass rounded-3xl p-6 space-y-6 sticky top-8">
            <h3 className="text-lg font-medium text-primary flex items-center gap-2 border-b border-white/5 pb-2">
              <Mail size={18} /> Notifications & SMTP
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2 text-xs uppercase">Alert Recipient</label>
                <input type="email" className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2 text-foreground text-sm" value={formData.inventoryAlertEmail || ''} onChange={e => setFormData({...formData, inventoryAlertEmail: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2 text-xs uppercase">Host</label>
                <input className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2 text-foreground text-sm" value={formData.smtpHost || ''} onChange={e => setFormData({...formData, smtpHost: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2 text-xs uppercase">Port</label>
                  <input type="number" className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2 text-foreground text-sm" value={formData.smtpPort || ''} onChange={e => setFormData({...formData, smtpPort: parseInt(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2 text-xs uppercase">User</label>
                  <input className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2 text-foreground text-sm" value={formData.smtpUser || ''} onChange={e => setFormData({...formData, smtpUser: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2 text-xs uppercase">Password</label>
                <input type="password" className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2 text-foreground text-sm" value={formData.smtpPassword || ''} onChange={e => setFormData({...formData, smtpPassword: e.target.value})} />
              </div>
            </div>
            <Button className="w-full" onClick={handleSaveSettings}>Save Notification Setup</Button>
          </section>
        </div>
      </div>

      {/* Rush Add Modal */}
      {showAddRush && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass p-8 rounded-3xl w-full max-w-md relative">
            <button onClick={() => setShowAddRush(false)} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-display mb-6">Schedule a Rush</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Event Title</label>
                <input className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground" placeholder="e.g. Carnival Panorama Arrival" value={newRush.title} onChange={e => setNewRush({...newRush, title: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <select className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground" value={newRush.type} onChange={e => setNewRush({...newRush, type: e.target.value as any})}>
                    <option value="cruise">Cruise Ship</option>
                    <option value="festival">Festival</option>
                    <option value="music">Live Music</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Impact</label>
                  <select className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground" value={newRush.impact} onChange={e => setNewRush({...newRush, impact: e.target.value as any})}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Start Time</label>
                <input type="datetime-local" className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground" value={newRush.startTime} onChange={e => setNewRush({...newRush, startTime: e.target.value})} />
              </div>
              <Button className="w-full h-14 mt-4" onClick={handleAddRush} disabled={createRush.isPending}>
                Schedule Event
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Edit Modal (existing) */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass p-8 rounded-3xl w-full max-w-md relative">
            <button onClick={() => setEditingStaff(null)} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-display mb-6">{editingStaff.id ? 'Edit Staff' : 'New Staff'}</h2>
            
            <div className="space-y-4 mb-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{getTranslation('first_name', language)}</label>
                  <input className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground" value={editingStaff.firstName || ''} onChange={e => setEditingStaff({...editingStaff, firstName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{getTranslation('last_name', language)}</label>
                  <input className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground" value={editingStaff.lastName || ''} onChange={e => setEditingStaff({...editingStaff, lastName: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <input type="email" className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground" value={editingStaff.email || ''} onChange={e => setEditingStaff({...editingStaff, email: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{getTranslation('role', language)}</label>
                  <select className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground" value={editingStaff.role} onChange={e => setEditingStaff({...editingStaff, role: e.target.value})}>
                    <option value="manager">{getTranslation('manager', language)}</option>
                    <option value="bartender">{getTranslation('bartender', language)}</option>
                    <option value="server">{getTranslation('server', language)}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{getTranslation('pin', language)} (4 digits)</label>
                  <input className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground font-mono" maxLength={4} value={editingStaff.pin || ''} onChange={e => setEditingStaff({...editingStaff, pin: e.target.value})} />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="is-active" checked={editingStaff.isActive} onChange={e => setEditingStaff({...editingStaff, isActive: e.target.checked})} className="w-4 h-4 rounded border-white/10 bg-secondary" />
                <label htmlFor="is-active" className="text-sm font-medium text-muted-foreground">{getTranslation('active', language)}</label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
              <Button variant="ghost" onClick={() => setEditingStaff(null)}>{getTranslation('cancel', language)}</Button>
              <Button onClick={handleSaveStaff} disabled={updateUser.isPending || createUser.isPending}>
                {getTranslation('save', language)}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
