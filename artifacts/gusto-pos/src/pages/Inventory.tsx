import React, { useState } from 'react';
import { useGetIngredients } from '@workspace/api-client-react';
import { useSaveIngredientMutation } from '@/hooks/use-pos-mutations';
import { usePosStore } from '@/store';
import { formatMoney, getTranslation } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, X, AlertTriangle } from 'lucide-react';

export default function Inventory() {
  const { language } = usePosStore();
  const { data: ingredients } = useGetIngredients();
  const saveIngredient = useSaveIngredientMutation();
  
  const [editingItem, setEditingItem] = useState<any>(null);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-display">{getTranslation('inventory', language)}</h1>
          <p className="text-muted-foreground mt-1">Manage stock and ingredient costs</p>
        </div>
        <Button onClick={() => setEditingItem({ name: '', category: 'spirits', unit: 'ml', unitSize: 750, costPerUnit: 0, currentStock: 0, minimumStock: 0 })}>
          <Plus className="mr-2" size={18} /> Add Item
        </Button>
      </div>

      <div className="glass rounded-3xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 text-muted-foreground text-sm">
              <th className="p-4 font-medium">{getTranslation('name', language)}</th>
              <th className="p-4 font-medium">{getTranslation('category', language)}</th>
              <th className="p-4 font-medium">Cost / Unit</th>
              <th className="p-4 font-medium">Stock</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {ingredients?.map(item => {
              const isLow = item.currentStock <= item.minimumStock;
              return (
                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-medium">
                    <div className="flex items-center gap-2">
                      {isLow && <AlertTriangle size={14} className="text-primary" />}
                      {language === 'es' && item.nameEs ? item.nameEs : item.name}
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground capitalize">{item.category}</td>
                  <td className="p-4">{formatMoney(item.costPerUnit)} / {item.unitSize}{item.unit}</td>
                  <td className={`p-4 font-bold ${isLow ? 'text-primary' : 'text-emerald-400'}`}>
                    {item.currentStock} {item.unit}
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="icon" onClick={() => setEditingItem(item)}>
                      <Edit2 size={16} />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass p-8 rounded-3xl w-full max-w-xl relative">
            <button onClick={() => setEditingItem(null)} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-display mb-6">{editingItem.id ? 'Edit Item' : 'New Item'}</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <input className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3" value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Category</label>
                <select className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3" value={editingItem.category} onChange={e => setEditingItem({...editingItem, category: e.target.value})}>
                  <option value="spirits">Spirits</option>
                  <option value="wine">Wine</option>
                  <option value="beer">Beer</option>
                  <option value="mixer">Mixer</option>
                  <option value="garnish">Garnish</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Cost per Unit (MXN)</label>
                <input type="number" className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3" value={editingItem.costPerUnit} onChange={e => setEditingItem({...editingItem, costPerUnit: parseFloat(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Unit (e.g. ml, oz)</label>
                <input className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3" value={editingItem.unit} onChange={e => setEditingItem({...editingItem, unit: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Unit Size (e.g. 750)</label>
                <input type="number" className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3" value={editingItem.unitSize} onChange={e => setEditingItem({...editingItem, unitSize: parseFloat(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Current Stock</label>
                <input type="number" className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3" value={editingItem.currentStock} onChange={e => setEditingItem({...editingItem, currentStock: parseFloat(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Minimum Stock Alert</label>
                <input type="number" className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3" value={editingItem.minimumStock} onChange={e => setEditingItem({...editingItem, minimumStock: parseFloat(e.target.value)})} />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
              <Button variant="ghost" onClick={() => setEditingItem(null)}>Cancel</Button>
              <Button 
                onClick={() => saveIngredient.mutate({ id: editingItem.id, data: editingItem }, { onSuccess: () => setEditingItem(null) })}
                disabled={saveIngredient.isPending}
              >
                Save Item
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
