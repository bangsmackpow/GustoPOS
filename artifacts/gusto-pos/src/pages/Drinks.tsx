import React, { useState } from 'react';
import { useGetDrinks, useGetIngredients } from '@workspace/api-client-react';
import { useSaveDrinkMutation } from '@/hooks/use-pos-mutations';
import { usePosStore } from '@/store';
import { formatMoney, getTranslation } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, X, Info, Upload, FileSpreadsheet, Check } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import Papa from 'papaparse';

const ML_PER_OZ = 29.5735;

export default function Drinks() {
  const { language } = usePosStore();
  const { data: drinks } = useGetDrinks();
  const { data: ingredients } = useGetIngredients();
  const saveDrink = useSaveDrinkMutation();
  const { toast } = useToast();
  const qc = useQueryClient();
  
  const [editingDrink, setEditingDrink] = useState<any>(null);
  const [unitMode, setUnitMode] = useState<'ml' | 'oz'>('ml');
  const [showImport, setShowImport] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Expected headers: Name, Category, Price, Ingredients (comma separated: "Tequila:60, Lime:30")
        const rows = results.data.map((row: any) => {
          const recipeStr = row.Ingredients || row.ingredients || '';
          const recipeParts = recipeStr.split(',').filter((p: string) => p.includes(':'));
          const recipe = recipeParts.map((p: string) => {
            const [name, amount] = p.split(':').map(s => s.trim());
            return { ingredientName: name, amountInMl: parseFloat(amount) || 0 };
          });

          return {
            name: row.Name || row.name || '',
            category: row.Category || row.category || 'cocktail',
            actualPrice: parseFloat(String(row.Price || row.price || '').replace(/[^0-9.]/g, '')) || null,
            recipe
          };
        }).filter((r: any) => r.name);

        setImportPreview(rows);
        toast({ title: "File Parsed", description: `Found ${rows.length} drinks` });
      },
      error: () => {
        toast({ variant: "destructive", title: "Error", description: "Could not parse CSV file" });
      }
    });
  };

  const handleBulkImport = async () => {
    try {
      const res = await fetch('/api/admin/bulk-drinks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drinks: importPreview })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Import Successful", description: `Added ${importPreview.length} drinks` });
        setShowImport(false);
        setImportPreview([]);
        qc.invalidateQueries();
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Import Failed" });
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-display">{getTranslation('menu', language)}</h1>
          <p className="text-muted-foreground mt-1">Manage drinks, recipes and pricing</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowImport(true)}>
            <Upload className="mr-2" size={18} /> Bulk Import
          </Button>
          <Button onClick={() => setEditingDrink({ name: '', category: 'cocktail', markupFactor: 3, upcharge: 0, recipe: [], isAvailable: true })}>
            <Plus className="mr-2" size={18} /> New Drink
          </Button>
        </div>
      </div>

      <div className="glass rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-muted-foreground text-sm">
                <th className="p-4 font-medium">{getTranslation('name', language)}</th>
                <th className="p-4 font-medium">{getTranslation('category', language)}</th>
                <th className="p-4 font-medium">{getTranslation('cost', language)}</th>
                <th className="p-4 font-medium">{getTranslation('price', language)}</th>
                <th className="p-4 font-medium">Margin</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {drinks?.map(drink => {
                const finalPrice = drink.actualPrice || drink.suggestedPrice;
                const margin = ((finalPrice - drink.costPerDrink) / (finalPrice || 1)) * 100;
                return (
                  <tr key={drink.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium">
                      <div>{language === 'es' && drink.nameEs ? drink.nameEs : drink.name}</div>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">
                        {drink.recipe.map((r: any) => r.ingredientName).join(', ')}
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground capitalize">{drink.category.replace('_', ' ')}</td>
                    <td className="p-4 text-destructive">{formatMoney(drink.costPerDrink)}</td>
                    <td className="p-4 text-emerald-400 font-bold">{formatMoney(finalPrice)}</td>
                    <td className="p-4 text-muted-foreground">{margin.toFixed(0)}%</td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="icon" onClick={() => setEditingDrink(drink)}>
                        <Edit2 size={16} />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass p-8 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative border border-white/10">
            <button onClick={() => setShowImport(false)} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-display mb-2 flex items-center gap-2">
              <FileSpreadsheet className="text-primary" /> Recipe Bulk Import
            </h2>
            <p className="text-muted-foreground mb-6 text-sm">Upload a CSV with headers: Name, Category, Price, Ingredients (Format: "Ingredient:Amount, ...")</p>
            
            <div className="flex-1 overflow-hidden flex flex-col gap-6">
              <div className="p-10 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 transition-colors relative">
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload size={48} className="text-primary mb-4" />
                <p className="text-lg font-medium">Select your Recipes CSV</p>
                <p className="text-sm text-muted-foreground mt-2">Example: Margarita, cocktail, 140, "Tequila:60, Lime:30, Agave:15"</p>
              </div>

              <div className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden flex flex-col flex-1">
                <div className="p-4 border-b border-white/5 font-bold text-sm bg-white/5 flex justify-between items-center">
                  <span>Preview ({importPreview.length} drinks)</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {importPreview.map((item, idx) => (
                    <div key={idx} className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs flex justify-between items-center">
                      <div className="flex-1">
                        <div className="font-bold text-foreground text-sm">{item.name}</div>
                        <div className="text-muted-foreground">{item.category} • {item.recipe.length} ingredients</div>
                      </div>
                      <div className="flex-1 px-4 text-muted-foreground italic truncate">
                        {item.recipe.map((r: any) => `${r.ingredientName} (${r.amountInMl}ml)`).join(', ')}
                      </div>
                      <div className="text-right font-bold text-emerald-400">
                        {formatMoney(item.actualPrice || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-white/10">
              <Button variant="ghost" onClick={() => { setShowImport(false); setImportPreview([]); }}>Cancel</Button>
              <Button 
                onClick={handleBulkImport}
                disabled={importPreview.length === 0}
                className="px-12 bg-primary hover:bg-primary/90 text-primary-foreground h-12 shadow-lg shadow-primary/20"
              >
                Save Recipes to Menu
              </Button>
            </div>
          </div>
        </div>
      )}

      {editingDrink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass p-8 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative border border-white/10">
            <button onClick={() => setEditingDrink(null)} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-display mb-6">{editingDrink.id ? 'Edit Drink' : 'New Drink'}</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Name (EN)</label>
                <input className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground" value={editingDrink.name} onChange={e => setEditingDrink({...editingDrink, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Nombre (ES)</label>
                <input className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground" value={editingDrink.nameEs || ''} onChange={e => setEditingDrink({...editingDrink, nameEs: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Category</label>
                <select className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground" value={editingDrink.category} onChange={e => setEditingDrink({...editingDrink, category: e.target.value})}>
                  <option value="cocktail">Cocktail</option>
                  <option value="beer">Beer</option>
                  <option value="wine">Wine</option>
                  <option value="shot">Shot</option>
                  <option value="non_alcoholic">Non Alcoholic</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Actual Selling Price (MXN)</label>
                <input type="number" className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground" value={editingDrink.actualPrice || ''} onChange={e => setEditingDrink({...editingDrink, actualPrice: e.target.value ? parseFloat(e.target.value) : null})} placeholder={editingDrink.suggestedPrice?.toFixed(2)} />
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-lg flex items-center gap-2">
                  <Info size={18} className="text-primary" /> Recipe & Ingredients
                </h3>
                <div className="flex bg-secondary p-1 rounded-lg text-xs">
                  <button onClick={() => setUnitMode('ml')} className={`px-3 py-1 rounded ${unitMode === 'ml' ? 'bg-primary text-primary-foreground' : ''}`}>ml</button>
                  <button onClick={() => setUnitMode('oz')} className={`px-3 py-1 rounded ${unitMode === 'oz' ? 'bg-primary text-primary-foreground' : ''}`}>oz</button>
                </div>
              </div>
              
              <div className="space-y-3 mb-4">
                {editingDrink.recipe?.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-3 items-center animate-in fade-in slide-in-from-left-2">
                    <select 
                      className="flex-1 bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground text-sm"
                      value={item.ingredientId}
                      onChange={e => {
                        const newRecipe = [...editingDrink.recipe];
                        newRecipe[idx].ingredientId = e.target.value;
                        setEditingDrink({...editingDrink, recipe: newRecipe});
                      }}
                    >
                      <option value="">Select ingredient...</option>
                      {ingredients?.map(ing => <option key={ing.id} value={ing.id}>{language === 'es' && ing.nameEs ? ing.nameEs : ing.name}</option>)}
                    </select>
                    
                    <div className="relative w-32">
                      <input 
                        type="number" 
                        step="0.1"
                        className="w-full bg-secondary border border-white/10 rounded-xl pl-4 pr-10 py-3 text-foreground text-sm" 
                        value={unitMode === 'ml' ? item.amountInMl : (item.amountInMl / ML_PER_OZ).toFixed(2)}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          const newRecipe = [...editingDrink.recipe];
                          newRecipe[idx].amountInMl = unitMode === 'ml' ? val : val * ML_PER_OZ;
                          setEditingDrink({...editingDrink, recipe: newRecipe});
                        }}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground uppercase font-bold">{unitMode}</span>
                    </div>

                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => {
                      const newRecipe = editingDrink.recipe.filter((_:any, i:number) => i !== idx);
                      setEditingDrink({...editingDrink, recipe: newRecipe});
                    }}><X size={18}/></Button>
                  </div>
                ))}
              </div>
              
              <Button variant="outline" className="w-full border-dashed border-white/20 hover:bg-white/5 h-12" onClick={() => setEditingDrink({...editingDrink, recipe: [...(editingDrink.recipe||[]), { ingredientId: '', amountInMl: 0 }]})}>
                <Plus size={16} className="mr-2" /> Add Ingredient
              </Button>
            </div>

            <div className="bg-primary/5 rounded-2xl p-4 mb-8 border border-primary/10">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Estimated Cost:</span>
                <span className="font-bold text-primary">{formatMoney(editingDrink.costPerDrink || 0)}</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="text-muted-foreground">Markup (x{editingDrink.markupFactor}):</span>
                <span className="font-bold">{formatMoney((editingDrink.costPerDrink || 0) * editingDrink.markupFactor)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
              <Button variant="ghost" onClick={() => setEditingDrink(null)}>{getTranslation('cancel', language)}</Button>
              <Button 
                onClick={() => saveDrink.mutate({ id: editingDrink.id, data: editingDrink }, { onSuccess: () => setEditingDrink(null) })}
                disabled={saveDrink.isPending}
                className="px-8"
              >
                {getTranslation('save', language)}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
