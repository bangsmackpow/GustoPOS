import React, { useState } from 'react';
import { useGetTabs } from '@workspace/api-client-react';
import { useCreateTabMutation } from '@/hooks/use-pos-mutations';
import { usePosStore } from '@/store';
import { getTranslation, formatMoney } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus, Users, Clock, Receipt } from 'lucide-react';
import { Link } from 'wouter';
import { formatDistanceToNow } from 'date-fns';

export default function Tabs() {
  const { language, activeStaff } = usePosStore();
  const { data: tabs } = useGetTabs({ status: 'open' });
  const createTab = useCreateTabMutation();
  const [newTabName, setNewTabName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = () => {
    if (!activeStaff) return alert('Please enter PIN to switch user first.');
    if (!newTabName.trim()) return;
    createTab.mutate({
      data: {
        nickname: newTabName,
        staffUserId: activeStaff.id,
        currency: 'MXN'
      }
    }, {
      onSuccess: () => {
        setNewTabName('');
        setIsCreating(false);
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-display">{getTranslation('tabs', language)}</h1>
          <p className="text-muted-foreground mt-1">Manage open tables and customers</p>
        </div>
        
        {!isCreating ? (
          <Button size="lg" onClick={() => setIsCreating(true)}>
            <Plus className="mr-2" size={20} />
            {getTranslation('new_tab', language)}
          </Button>
        ) : (
          <div className="flex items-center gap-3 glass p-2 rounded-2xl">
            <input 
              autoFocus
              className="bg-transparent border-none outline-none px-4 text-foreground placeholder:text-muted-foreground w-48"
              placeholder="Table # or Name"
              value={newTabName}
              onChange={e => setNewTabName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            <Button size="sm" onClick={handleCreate} disabled={createTab.isPending}>Add</Button>
            <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tabs?.map(tab => (
          <Link key={tab.id} href={`/tabs/${tab.id}`}>
            <div className="glass p-6 rounded-3xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group border-2 border-transparent hover:border-primary/30">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-display font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{tab.nickname}</h3>
                <div className="bg-secondary px-3 py-1 rounded-full flex items-center gap-2 text-xs font-medium">
                  <Users size={12} className="text-muted-foreground" />
                  {tab.staffUserName?.split(' ')[0]}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <span className="text-muted-foreground text-sm">{getTranslation('total', language)}</span>
                  <span className="text-2xl font-bold text-foreground">{formatMoney(tab.totalMxn, 'MXN')}</span>
                </div>
                
                <div className="h-px bg-white/5 w-full" />
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock size={14} />
                  Opened {formatDistanceToNow(new Date(tab.openedAt))} ago
                </div>
              </div>
            </div>
          </Link>
        ))}
        {tabs?.length === 0 && !isCreating && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground">
            <Receipt size={48} className="mb-4 opacity-20" />
            <p className="text-lg">No open tabs</p>
          </div>
        )}
      </div>
    </div>
  );
}
