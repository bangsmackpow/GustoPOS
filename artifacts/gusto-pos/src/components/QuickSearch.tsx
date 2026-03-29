import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { 
  Search, 
  X, 
  ReceiptText, 
  Wine, 
  Info,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { useGetDrinks, useGetTabs } from '@workspace/api-client-react';
import { usePosStore } from '@/store';
import { getTranslation } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export function QuickSearch({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [search, setSearch] = useState('');
  const [, setLocation] = useLocation();
  const { language } = usePosStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: drinks } = useGetDrinks();
  const { data: tabs } = useGetTabs({ status: 'open' });

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSearch('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose(); // Toggle logic would be handled by parent, but this is a simple closer
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const filteredDrinks = drinks?.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.nameEs?.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 5);

  const filteredTabs = tabs?.filter(t => 
    t.nickname.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 5);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-md" 
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="w-full max-w-2xl bg-secondary/50 border border-white/10 rounded-3xl shadow-2xl overflow-hidden glass z-10"
        >
          <div className="p-6 border-b border-white/10 flex items-center gap-4">
            <Search className="text-primary" size={24} />
            <input 
              ref={inputRef}
              className="flex-1 bg-transparent border-none text-xl outline-none placeholder:text-muted-foreground"
              placeholder={language === 'en' ? "Search drinks, tabs, recipes..." : "Buscar bebidas, cuentas, recetas..."}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar space-y-6">
            {/* Tabs Section */}
            {filteredTabs && filteredTabs.length > 0 && (
              <div>
                <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3 px-2 flex items-center gap-2">
                  <ReceiptText size={12} /> {getTranslation('tabs', language)}
                </h3>
                <div className="space-y-1">
                  {filteredTabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => { setLocation(`/tabs/${tab.id}`); onClose(); }}
                      className="w-full flex items-center justify-between p-4 hover:bg-primary/10 rounded-2xl transition-all group border border-transparent hover:border-primary/20"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold">
                          {tab.nickname.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-left">
                          <p className="font-medium">{tab.nickname}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            ${tab.totalMxn.toLocaleString()} MXN • {tab.openedAt ? new Date(tab.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </p>
                        </div>
                      </div>
                      <ArrowRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors translate-x-[-10px] group-hover:translate-x-0 opacity-0 group-hover:opacity-100 duration-200" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Drinks Section */}
            {filteredDrinks && filteredDrinks.length > 0 && (
              <div>
                <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3 px-2 flex items-center gap-2">
                  <Wine size={12} /> {getTranslation('drinks', language)}
                </h3>
                <div className="space-y-1">
                  {filteredDrinks.map(drink => (
                    <div
                      key={drink.id}
                      className="w-full flex items-center justify-between p-4 hover:bg-white/5 rounded-2xl transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
                          <Wine size={20} />
                        </div>
                        <div className="text-left">
                          <p className="font-medium">{language === 'en' ? drink.name : (drink.nameEs || drink.name)}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{drink.category}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-9 gap-2 text-xs text-primary hover:bg-primary/10 rounded-xl"
                          onClick={() => { setLocation('/drinks'); onClose(); }}
                        >
                          <Info size={14} /> Recipe
                        </Button>
                        <Button 
                          size="sm" 
                          className="h-9 gap-2 text-xs rounded-xl"
                          onClick={() => { setLocation('/tabs'); onClose(); }}
                        >
                          Add to Tab
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {search && filteredDrinks?.length === 0 && filteredTabs?.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p className="italic">No results found for "{search}"</p>
              </div>
            )}

            {!search && (
              <div className="text-center py-12 text-muted-foreground">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4 opacity-50">
                  <TrendingUp size={24} />
                </div>
                <p className="text-sm">Start typing to search for anything...</p>
                <p className="text-[10px] uppercase tracking-widest mt-2 opacity-50">Press ESC to close</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
