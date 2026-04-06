import React, { useState } from 'react';
import { useGetIngredients } from '@workspace/api-client-react';
import { useSaveIngredientMutation } from '@/hooks/use-pos-mutations';
import { usePosStore } from '@/store';
import { formatMoney, getTranslation } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, X, AlertTriangle, Database, Upload, Check, FileSpreadsheet } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import Papa from 'papaparse';

export default function Inventory() {
  const { language } = usePosStore();
  const { data: ingredients } = useGetIngredients();
  const saveIngredient = useSaveIngredientMutation();
  const { toast } = useToast();
  const qc = useQueryClient();
  
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importPreview, setImportPreview] = useState<any[]>([]);

  const handleSeedStarter = async () => {
    if (!confirm("This will add 50+ Puerto Vallarta drinks and ingredients. Continue?")) return;
    
    setIsSeeding(true);
    try {
      const res = await fetch('/api/seed-starter', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        toast({ title: "Success", description: "Starter data seeded" });
        qc.invalidateQueries();
      } else {
        toast({ variant: "destructive", title: "Error", description: data.error });
      }
    } catch {
      toast({ variant: "destructive", title: "Connection Error" });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<any>) => {
        const rows = results.data.map((row: any) => ({
          name: row.Name || row.name || row.Producto,
          category: row.Category || row.category || row.Categoría || 'spirits',
          unit: row.Unit || row.unit || row.Unidad || 'ml',
          unitSize: parseFloat(row.Size || row.size || row.Tamaño) || 750,
          costPerUnit: parseFloat(String(row.Cost || row.cost || row.Costo).replace(/[^0-9.]/g, '')) || 0,
          currentStock: parseFloat(row.Stock || row.stock || row.Inventario) || 0,
          minimumStock: parseFloat(row.Min || row.min || row.Mínimo) || 0,
        }));
        setImportPreview(rows);
        toast({ title: "File Parsed", description: `Found ${rows.length} items` });
      },
      error: () => {
        toast({ variant: "destructive", title: "Error", description: "Could not parse CSV file" });
      }
    });
  };

  const parseMarkdownTable = () => {
    const lines = importText.trim().split('\n');
    if (lines.length < 3) return;

    const dataLines = lines.filter(line => line.includes('|') && !line.includes('---'));
    if (dataLines.length < 2) return;

    const headers = dataLines[0].split('|').map(h => h.trim().toLowerCase()).filter(h => h);
    const rows = dataLines.slice(1).map(line => {
      const cleanValues = line.trim().startsWith('|') ? line.trim().split('|').slice(1, -1).map(v => v.trim()) : line.trim().split('|').map(v => v.trim());
      
      const item: any = {};
      headers.forEach((header, idx) => {
        const val = cleanValues[idx];
        if (header.includes('name')) item.name = val;
        if (header.includes('category')) item.category = val;
        if (header.includes('unit') && !header.includes('size')) item.unit = val;
        if (header.includes('size')) item.unitSize = parseFloat(val) || 0;
        if (header.includes('cost')) item.costPerUnit = parseFloat(val.replace(/[^0-9.]/g, '')) || 0;
        if (header.includes('stock')) item.currentStock = parseFloat(val) || 0;
        if (header.includes('min')) item.minimumStock = parseFloat(val) || 0;
      });
      return item;
    });

    setImportPreview(rows);
  };

  const handleBulkImport = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch('/api/admin/bulk-ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: importPreview })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Import Successful", description: `Added ${importPreview.length} items` });
        setShowImport(false);
        setImportText('');
        setImportPreview([]);
        qc.invalidateQueries();
      }
    } catch {
      toast({ variant: "destructive", title: "Import Failed" });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-display">{getTranslation('inventory', language)}</h1>
          <p className="text-muted-foreground mt-1">Manage stock and ingredient costs</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => setShowImport(true)}>
            <Upload className="mr-2" size={18} /> Bulk Import
          </Button>
          <Button variant="outline" onClick={handleSeedStarter} disabled={isSeeding}>
            <Database className="mr-2" size={18} /> {isSeeding ? 'Seeding...' : 'Seed Starter Data'}
          </Button>
          <Button onClick={() => setEditingItem({ name: '', category: 'spirits', unit: 'ml', unitSize: 750, costPerUnit: 0, currentStock: 0, minimumStock: 0 })}>
            <Plus className="mr-2" size={18} /> Add Item
          </Button>
        </div>
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

      {/* Bulk Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass p-8 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative border border-white/10">
            <button onClick={() => setShowImport(false)} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-display mb-2 flex items-center gap-2">
              <FileSpreadsheet className="text-primary" /> Bulk Import (CSV or Markdown)
            </h2>
            <p className="text-muted-foreground mb-6 text-sm">Upload a CSV file or paste a Markdown table below. Headers: Name, Category, Unit, Size, Cost, Stock, Min</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
              <div className="flex flex-col gap-4">
                <div className="p-6 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 transition-colors relative">
                  <input 
                    type="file" 
                    accept=".csv" 
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload size={32} className="text-primary mb-2" />
                  <p className="font-medium">Click to upload CSV</p>
                  <p className="text-xs text-muted-foreground mt-1">Exported from Excel or Sheets</p>
                </div>

                <div className="relative flex-1 flex flex-col">
                  <div className="absolute top-3 right-3 text-[10px] uppercase font-bold text-muted-foreground">Or paste Markdown</div>
                  <textarea 
                    className="flex-1 bg-secondary/50 border border-white/10 rounded-2xl p-4 text-sm font-mono focus:ring-2 focus:ring-primary/50 outline-none resize-none pt-8"
                    placeholder="| Name | Category | Unit | Size | Cost | Stock | Min |"
                    value={importText}
                    onChange={e => setImportText(e.target.value)}
                  />
                </div>
                
                <Button onClick={parseMarkdownTable} variant="secondary" className="w-full h-12">
                  <Check className="mr-2" size={18} /> Parse Markdown
                </Button>
              </div>

              <div className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-white/5 font-bold text-sm bg-white/5 flex justify-between items-center">
                  <span>Preview ({importPreview.length} items)</span>
                  {importPreview.length > 0 && <span className="text-emerald-400 text-[10px] uppercase tracking-widest">Ready to save</span>}
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {importPreview.map((item, idx) => (
                    <div key={idx} className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs flex justify-between">
                      <div>
                        <div className="font-bold text-foreground">{item.name}</div>
                        <div className="text-muted-foreground capitalize">{item.category} • {item.unitSize}{item.unit}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-primary font-bold">{formatMoney(item.costPerUnit)}</div>
                        <div className="text-muted-foreground">Stock: {item.currentStock}</div>
                      </div>
                    </div>
                  ))}
                  {importPreview.length === 0 && (
                    <div className="h-full flex items-center justify-center text-muted-foreground italic text-sm py-20">
                      Upload CSV or paste table to preview
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-white/10">
              <Button variant="ghost" onClick={() => { setShowImport(false); setImportPreview([]); }}>Cancel</Button>
              <Button 
                onClick={handleBulkImport}
                disabled={importPreview.length === 0 || isSeeding}
                className="px-12 bg-primary hover:bg-primary/90 text-primary-foreground h-12 shadow-lg shadow-primary/20"
              >
                {isSeeding ? 'Importing...' : 'Save All to Inventory'}
              </Button>
            </div>
          </div>
        </div>
      )}

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
                <input className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground" value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Category</label>
                <select className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground" value={editingItem.category} onChange={e => setEditingItem({...editingItem, category: e.target.value})}>
                  <option value="spirits">Spirits</option>
                  <option value="wine">Wine</option>
                  <option value="beer">Beer</option>
                  <option value="mixer">Mixer</option>
                  <option value="garnish">Garnish</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Cost per Unit (MXN)</label>
                <input type="number" className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground" value={editingItem.costPerUnit} onChange={e => setEditingItem({...editingItem, costPerUnit: parseFloat(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Unit (e.g. ml, oz)</label>
                <input className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground" value={editingItem.unit} onChange={e => setEditingItem({...editingItem, unit: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Unit Size (e.g. 750)</label>
                <input type="number" className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground" value={editingItem.unitSize} onChange={e => setEditingItem({...editingItem, unitSize: parseFloat(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Current Stock</label>
                <input type="number" className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground" value={editingItem.currentStock} onChange={e => setEditingItem({...editingItem, currentStock: parseFloat(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Minimum Stock Alert</label>
                <input type="number" className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground" value={editingItem.minimumStock} onChange={e => setEditingItem({...editingItem, minimumStock: parseFloat(e.target.value)})} />
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
