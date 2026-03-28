import React, { useState } from 'react';
import { useRoute } from 'wouter';
import { useGetTab, useGetDrinks } from '@workspace/api-client-react';
import { useAddOrderMutation, useDeleteOrderMutation, useCloseTabMutation } from '@/hooks/use-pos-mutations';
import { usePosStore } from '@/store';
import { formatMoney, getTranslation } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2, CreditCard, Banknote, Coffee, Wine, Beer } from 'lucide-react';
import { Link } from 'wouter';

const CATEGORY_ICONS: Record<string, any> = {
  cocktail: Wine,
  beer: Beer,
  wine: Wine,
  shot: Coffee,
  non_alcoholic: Coffee,
  other: Coffee
};

export default function TabDetail() {
  const [, params] = useRoute('/tabs/:id');
  const tabId = params?.id || '';
  
  const { language, activeStaff } = usePosStore();
  const { data: tabData } = useGetTab(tabId);
  const { data: drinks } = useGetDrinks();
  
  const addOrder = useAddOrderMutation();
  const deleteOrder = useDeleteOrderMutation();
  const closeTab = useCloseTabMutation();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showCloseDialog, setShowCloseDialog] = useState(false);

  if (!tabData) return null;

  const categories = ['all', ...Array.from(new Set(drinks?.map(d => d.category) || []))];
  const filteredDrinks = drinks?.filter(d => activeCategory === 'all' || d.category === activeCategory) || [];

  const handleAddDrink = (drinkId: string) => {
    if (!activeStaff) return alert('PIN required');
    addOrder.mutate({ id: tabId, data: { drinkId, quantity: 1 } });
  };

  const handleCloseTab = (method: 'cash' | 'card') => {
    closeTab.mutate({ id: tabId, data: { paymentMethod: method } }, {
      onSuccess: () => {
        window.location.href = '/tabs';
      }
    });
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 -m-4 md:-m-8 p-4 md:p-8">
      {/* Left side: Ticket */}
      <div className="w-full md:w-96 flex flex-col gap-4">
        <Link href="/tabs">
          <Button variant="ghost" className="self-start -ml-4">
            <ArrowLeft className="mr-2" size={18} />
            Back
          </Button>
        </Link>
        
        <div className="glass rounded-3xl p-6 flex-1 flex flex-col overflow-hidden">
          <div className="mb-6">
            <h2 className="text-2xl font-display font-bold">{tabData.nickname}</h2>
            <p className="text-sm text-muted-foreground">Server: {tabData.staffUserName}</p>
          </div>

          <div className="flex-1 overflow-y-auto -mx-2 px-2 space-y-4">
            {tabData.orders.map(order => (
              <div key={order.id} className="flex items-center justify-between group">
                <div>
                  <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {order.quantity}x {language === 'es' && order.drinkNameEs ? order.drinkNameEs : order.drinkName}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatMoney(order.unitPriceMxn)} ea</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold">{formatMoney(order.totalPriceMxn)}</span>
                  <button 
                    onClick={() => deleteOrder.mutate({ id: order.id, tabId })}
                    className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-lg text-muted-foreground">Total</span>
              <span className="text-4xl font-display font-bold text-primary">{formatMoney(tabData.totalMxn)}</span>
            </div>
            
            {showCloseDialog ? (
              <div className="grid grid-cols-2 gap-3 pt-4 animate-in slide-in-from-bottom-2">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleCloseTab('cash')}>
                  <Banknote className="mr-2" size={18} /> {getTranslation('cash', language)}
                </Button>
                <Button size="lg" variant="secondary" onClick={() => handleCloseTab('card')}>
                  <CreditCard className="mr-2" size={18} /> {getTranslation('card', language)}
                </Button>
                <Button variant="ghost" className="col-span-2" onClick={() => setShowCloseDialog(false)}>Cancel</Button>
              </div>
            ) : (
              <Button 
                size="lg" 
                className="w-full h-14 text-lg" 
                disabled={tabData.orders.length === 0}
                onClick={() => setShowCloseDialog(true)}
              >
                {getTranslation('close_tab', language)}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Menu */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-3 rounded-2xl font-medium whitespace-nowrap transition-all ${
                activeCategory === cat 
                  ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                  : 'glass text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              <span className="capitalize">{cat.replace('_', ' ')}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-20">
          {filteredDrinks.map(drink => {
            const Icon = CATEGORY_ICONS[drink.category] || Wine;
            return (
              <button
                key={drink.id}
                onClick={() => handleAddDrink(drink.id)}
                disabled={!drink.isAvailable || addOrder.isPending}
                className="glass p-4 rounded-3xl text-left hover:-translate-y-1 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 group border border-transparent hover:border-primary/30 flex flex-col h-40"
              >
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-3 text-primary group-hover:scale-110 transition-transform">
                  <Icon size={20} />
                </div>
                <h4 className="font-bold text-foreground leading-tight line-clamp-2 mb-auto group-hover:text-primary transition-colors">
                  {language === 'es' && drink.nameEs ? drink.nameEs : drink.name}
                </h4>
                <div className="font-display font-bold text-lg mt-2">
                  {formatMoney(drink.actualPrice || drink.suggestedPrice)}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
