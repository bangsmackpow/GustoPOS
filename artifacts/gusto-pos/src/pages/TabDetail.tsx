import React, { useState } from 'react';
import { useRoute } from 'wouter';
import { useGetTab, useGetDrinks, useGetIngredients } from '@workspace/api-client-react';
import { useAddOrderMutation, useDeleteOrderMutation, useCloseTabMutation } from '@/hooks/use-pos-mutations';
import { usePosStore } from '@/store';
import { formatMoney, getTranslation } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2, CreditCard, Banknote, Coffee, Wine, Beer, Info, X } from 'lucide-react';
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
  const { data: ingredients } = useGetIngredients();
  
  const addOrder = useAddOrderMutation();
  const deleteOrder = useDeleteOrderMutation();
  const closeTab = useCloseTabMutation();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [viewingRecipe, setViewingRecipe] = useState<any>(null);

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

  // Helper to calculate stock availability for a drink
  const getStockStatus = (drink: any) => {
    if (!ingredients || !drink.recipe || drink.recipe.length === 0) return { status: 'available', message: '' };
    
    let minServings = Infinity;
    // Note: missingIngredient tracking not currently used but structure preserved for future enhancement

    for (const r of drink.recipe) {
      const ing = ingredients.find(i => i.id === r.ingredientId);
      if (!ing) continue;
      
      const available = Number(ing.currentStock) / Number(r.amountInMl);
      if (available < minServings) minServings = available;
      // missingIngredient tracking could be added here if needed
    }

    if (minServings <= 0 || isFinite(minServings) === false) {
      return { status: 'out', message: 'Out of Stock' };
    } else if (minServings < 5) {
      return { status: 'low', message: `${Math.floor(minServings)} left` };
    }
    return { status: 'available', message: '' };
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
            const stock = getStockStatus(drink);
            const isOut = stock.status === 'out';
            const isLow = stock.status === 'low';

            return (
              <div 
                key={drink.id}
                className={`glass p-4 rounded-3xl text-left transition-all duration-200 group border border-transparent flex flex-col h-44 relative overflow-hidden ${
                  isOut ? 'opacity-40 grayscale pointer-events-none' : 'hover:-translate-y-1 active:scale-95 hover:border-primary/30'
                }`}
              >
                <button 
                  className="absolute top-3 right-3 text-muted-foreground hover:text-primary z-10 p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewingRecipe(drink);
                  }}
                >
                  <Info size={18} />
                </button>

                <button
                  onClick={() => handleAddDrink(drink.id)}
                  disabled={!drink.isAvailable || addOrder.isPending || isOut}
                  className="flex-1 flex flex-col w-full text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-3 text-primary group-hover:scale-110 transition-transform relative">
                    <Icon size={20} />
                    {isLow && <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-background animate-pulse" />}
                  </div>
                  <h4 className="font-bold text-foreground leading-tight line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                    {language === 'es' && drink.nameEs ? drink.nameEs : drink.name}
                  </h4>
                  
                  {stock.message && (
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-auto ${isOut ? 'text-destructive' : 'text-amber-500'}`}>
                      {stock.message}
                    </p>
                  )}

                  <div className="font-display font-bold text-lg mt-auto pt-2">
                    {formatMoney(drink.actualPrice || drink.suggestedPrice)}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recipe Modal */}
      {viewingRecipe && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass p-8 rounded-3xl w-full max-w-md relative border border-white/10 shadow-2xl">
            <button onClick={() => setViewingRecipe(null)} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground">
              <X size={24} />
            </button>
            <h2 className="text-3xl font-display font-bold text-primary mb-2">
              {language === 'es' && viewingRecipe.nameEs ? viewingRecipe.nameEs : viewingRecipe.name}
            </h2>
            <p className="text-muted-foreground mb-6 italic">
              {language === 'es' && viewingRecipe.descriptionEs ? viewingRecipe.descriptionEs : viewingRecipe.description}
            </p>
            
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-white/5 pb-2">Recipe</h3>
              {viewingRecipe.recipe.length > 0 ? (
                <div className="space-y-3">
                  {viewingRecipe.recipe.map((ing: any, idx: number) => {
                    const stockIng = ingredients?.find(i => i.id === ing.ingredientId);
                    const currentStock = stockIng ? Number(stockIng.currentStock) : 0;
                    const isLow = currentStock < (Number(ing.amountInMl) * 5);

                    return (
                      <div key={idx} className="flex justify-between items-center text-lg">
                        <div className="flex flex-col">
                          <span className="text-foreground font-medium">
                            {language === 'es' && ing.ingredientNameEs ? ing.ingredientNameEs : ing.ingredientName}
                          </span>
                          {stockIng && (
                            <span className={`text-[10px] font-bold uppercase ${isLow ? 'text-primary' : 'text-muted-foreground opacity-50'}`}>
                              Stock: {stockIng.currentStock}{stockIng.unit}
                            </span>
                          )}
                        </div>
                        <div className="text-primary font-mono font-bold">
                          {ing.amountInMl}ml <span className="text-muted-foreground text-sm">/</span> {(ing.amountInMl / 29.57).toFixed(1)}oz
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground py-4 text-center">No recipe details provided.</p>
              )}
            </div>

            <Button 
              className="w-full mt-8 h-12" 
              disabled={getStockStatus(viewingRecipe).status === 'out'}
              onClick={() => {
                handleAddDrink(viewingRecipe.id);
                setViewingRecipe(null);
              }}
            >
              Add to Ticket
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
