import React, { useState } from "react";
import { useSearchParams } from "wouter";
import { useGetInventoryItems } from "@/hooks/use-inventory";
import { useSaveIngredientMutation } from "@/hooks/use-pos-mutations";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { usePosStore } from "@/store";
import { formatMoney, getTranslation } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Edit2,
  X,
  AlertTriangle,
  Check,
  Trash2,
  Search,
  Menu,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const SUBTYPES: Record<
  string,
  { value: string; label: string; labelEs: string }[]
> = {
  spirit: [
    { value: "tequila", label: "Tequila", labelEs: "Tequila" },
    { value: "mezcal", label: "Mezcal", labelEs: "Mezcal" },
    { value: "whiskey", label: "Whiskey", labelEs: "Whiskey" },
    { value: "gin", label: "Gin", labelEs: "Ginebra" },
    { value: "rum", label: "Rum/Ron", labelEs: "Ron" },
    { value: "vino", label: "Vino", labelEs: "Vino" },
    { value: "vodka", label: "Vodka", labelEs: "Vodka" },
    { value: "misc", label: "Misc", labelEs: "Misc" },
  ],
  beer: [
    { value: "national", label: "National", labelEs: "Nacional" },
    { value: "import", label: "Import", labelEs: "Importada" },
    { value: "zero", label: "Zero Beer", labelEs: "Cero" },
    { value: "cuagamos", label: "Cuagamos", labelEs: "Caguamas" },
    { value: "seltzer", label: "Seltzer", labelEs: "Seltzer" },
    { value: "cider", label: "Cider", labelEs: "Sidra" },
  ],
  mixer: [
    { value: "bulk", label: "Bulk", labelEs: "A Granel" },
    { value: "prepackaged", label: "Prepackaged", labelEs: "Preenvasado" },
  ],
  ingredient: [
    { value: "liquid", label: "Liquid", labelEs: "Líquido" },
    { value: "weighted", label: "Weighted", labelEs: "Pesado" },
  ],
  merch: [],
  misc: [],
};

const TYPE_LABELS: Record<string, { en: string; es: string }> = {
  spirit: { en: "Spirits", es: "Licores" },
  beer: { en: "Beer", es: "Cerveza" },
  mixer: { en: "Mixers", es: "Mezcladores" },
  ingredient: { en: "Ingredients", es: "Ingredientes" },
  merch: { en: "Merch", es: "Mercancía" },
  misc: { en: "Misc", es: "Misceláneos" },
};

export default function Inventory() {
  const { language } = usePosStore();
  const { data: items } = useGetInventoryItems();
  const { data: auth } = useGetCurrentAuthUser();
  const _isAdmin = (auth as any)?.role === "admin";
  const saveIngredient = useSaveIngredientMutation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [editingItem, setEditingItem] = useState<any>(null);
  const [partialBottleWeight, setPartialBottleWeight] = useState<number | "">(
    "",
  );
  const [fullBottleCount, setFullBottleCount] = useState<number>(0);
  const [_showWeightModal, _setShowWeightModal] = useState<any>(null);
  const [_weightInput, _setWeightInput] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState<any>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const [search, setSearch] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: string;
  } | null>(null);

  const activeType = searchParams.get("type") || "all";

  const setActiveType = (type: string) => {
    setSearchParams((prev) => {
      if (type === "all") {
        prev.delete("type");
        prev.delete("subtype");
      } else {
        prev.set("type", type);
      }
      return prev;
    });
  };

  const getTypeCount = (type: string | null) => {
    if (!type) return 0;
    if (type === "all") return items?.length || 0;
    return items?.filter((i: any) => i.type === type).length || 0;
  };

  const getItemCount = () => items?.length || 0;
  const getLowStockCount = () =>
    items?.filter((i: any) => i.currentStock <= (i.lowStockThreshold || 1))
      .length || 0;

  const filteredItems =
    items?.filter((item: any) => {
      const matchesType = activeType === "all" || item.type === activeType;
      const matchesSubtype =
        !searchParams.get("subtype") ||
        item.subtype === searchParams.get("subtype");
      const matchesSearch =
        !search ||
        (item.name && item.name.toLowerCase().includes(search.toLowerCase())) ||
        (item.nameEs &&
          item.nameEs.toLowerCase().includes(search.toLowerCase()));
      return matchesType && matchesSubtype && matchesSearch;
    }) || [];

  const handleCellSave = async (id: string, field: string, value: any) => {
    const item = items?.find((i: any) => i.id === id);
    if (!item) return;

    qc.setQueryData(["inventory-items"], (old: any) => {
      if (!old) return old;
      return old.map((i: any) => (i.id === id ? { ...i, [field]: value } : i));
    });

    try {
      const res = await fetch(`/api/inventory/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error("Failed to update");
    } catch (e: any) {
      qc.setQueryData(["inventory-items"], (old: any) => {
        if (!old) return old;
        return old.map((i: any) =>
          i.id === id ? { ...i, [field]: item[field] } : i,
        );
      });
      toast({
        variant: "destructive",
        title: getTranslation("error", language),
        description: e.message,
      });
    }
    setEditingCell(null);
  };

  const handleMenuToggle = (item: any) => {
    const newVal = !item.isOnMenu;
    qc.setQueryData(["inventory-items"], (old: any) => {
      if (!old) return old;
      return old.map((i: any) =>
        i.id === item.id ? { ...i, isOnMenu: newVal } : i,
      );
    });
    fetch(`/api/inventory/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isOnMenu: newVal }),
    }).catch(() => {
      qc.setQueryData(["inventory-items"], (old: any) => {
        if (!old) return old;
        return old.map((i: any) =>
          i.id === item.id ? { ...i, isOnMenu: !newVal } : i,
        );
      });
    });
  };

  const handleDeleteItem = async () => {
    if (!showDeleteModal) return;
    try {
      const res = await fetch(`/api/inventory/items/${showDeleteModal.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      if (!res.ok) throw new Error("Failed to delete");
      qc.invalidateQueries({ queryKey: ["/api/inventory/items"] });
      setShowDeleteModal(null);
      setDeletePassword("");
      toast({
        title: getTranslation("success", language),
        description: "Item deleted",
      });
    } catch (e: any) {
      setDeleteError(e.message);
    }
  };

  const getSubtypeLabel = (type: string, subtype: string | null) => {
    if (!subtype) return "";
    const subtypes = SUBTYPES[type] || [];
    const s = subtypes.find((st) => st.value === subtype);
    if (!s) return subtype;
    return language === "es" ? s.labelEs : s.label;
  };

  const typeLabel = (type: string) => {
    const t = TYPE_LABELS[type];
    if (!t) return type;
    return language === "es" ? t.es : t.en;
  };

  return (
    <div className="flex h-full">
      {/* Mobile Menu Toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-secondary rounded-lg"
        onClick={() => setShowMobileMenu(!showMobileMenu)}
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <div
        className={`fixed md:static inset-y-0 left-0 z-40 w-[280px] bg-secondary/50 border-r border-white/10 flex flex-col transition-transform duration-300 ${showMobileMenu ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-display">
            {getTranslation("inventory", language)}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {getTranslation("items_count", language).replace(
              "{count}",
              String(getItemCount()),
            )}{" "}
            •{" "}
            {getTranslation("low_stock_count", language).replace(
              "{count}",
              String(getLowStockCount()),
            )}
          </p>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder={getTranslation("search_inventory", language)}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-secondary border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Type Filters */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            {getTranslation("types_label", language)}
          </div>
          <div className="space-y-1">
            <button
              onClick={() => {
                setActiveType("all");
                setShowMobileMenu(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${activeType === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}
            >
              <span>{getTranslation("all_items", language)}</span>
              <span className="text-xs opacity-60">{getItemCount()}</span>
            </button>
            {(
              [
                "spirit",
                "beer",
                "mixer",
                "ingredient",
                "merch",
                "misc",
              ] as const
            ).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setActiveType(type);
                  setShowMobileMenu(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${activeType === type ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}
              >
                <span>{typeLabel(type)}</span>
                <span className="text-xs opacity-60">{getTypeCount(type)}</span>
              </button>
            ))}
          </div>

          {/* Subtype Filters */}
          {activeType !== "all" &&
            activeType !== "merch" &&
            activeType !== "misc" &&
            SUBTYPES[activeType] &&
            SUBTYPES[activeType].length > 0 && (
              <div className="mt-8">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Subtypes
                </div>
                <div className="space-y-1">
                  {SUBTYPES[activeType].map((subtype) => (
                    <button
                      key={subtype.value}
                      onClick={() => {
                        setSearchParams((prev: any) => {
                          const newParams = new URLSearchParams(prev);
                          newParams.set("subtype", subtype.value);
                          return newParams;
                        });
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${searchParams.get("subtype") === subtype.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}
                    >
                      <span>
                        {language === "es" ? subtype.labelEs : subtype.label}
                      </span>
                      <span className="text-xs opacity-60">
                        {items?.filter(
                          (i: any) =>
                            i.type === activeType &&
                            i.subtype === subtype.value,
                        ).length || 0}
                      </span>
                    </button>
                  ))}
                </div>
                {searchParams.get("subtype") && (
                  <button
                    onClick={() => {
                      setSearchParams((prev: any) => {
                        const newParams = new URLSearchParams(prev);
                        newParams.delete("subtype");
                        return newParams;
                      });
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  >
                    <span>Clear Subtype Filter</span>
                  </button>
                )}
              </div>
            )}

          {/* Quick Filters */}
          <div className="mt-8">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Quick Filters
            </div>
            <label className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-white/5 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-white/30"
              />
              <AlertTriangle size={14} className="text-primary" />
              Low Stock ({getLowStockCount()})
            </label>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {showMobileMenu && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setShowMobileMenu(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="p-4 md:p-6 flex justify-between items-center gap-4">
          <div className="hidden md:block">
            <h2 className="text-xl font-display">
              {activeType === "all"
                ? getTranslation("all_items_header", language)
                : typeLabel(activeType)}
            </h2>
            <p className="text-sm text-muted-foreground">
              {getTranslation("items_count_header", language).replace(
                "{count}",
                String(filteredItems.length),
              )}
            </p>
          </div>
          <Button
            onClick={() =>
              setEditingItem({
                name: "",
                nameEs: "",
                type: "spirit",
                subtype: "",
                baseUnit: "ml",
                baseUnitAmount: 750,
                bottleSizeMl: 750,
                servingSize: 44.36,
                pourSize: 1.5,
                currentStock: 0,
                orderCost: 0,
                lowStockThreshold: 1,
                unitsPerCase: 24,
                tareWeightG: null,
                fullBottleWeightG: null,
                glassWeightG: null,
                density: 0.94,
                isOnMenu: false,
              })
            }
          >
            <Plus size={18} className="mr-2" />
            {getTranslation("add_item", language)}
          </Button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-4 md:px-6 pb-6">
          <div className="glass rounded-2xl overflow-hidden min-w-[800px]">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-muted-foreground text-sm">
                  <th className="p-3 font-medium w-10">Menu</th>
                  <th className="p-3 font-medium w-32 min-w-[128px]">Name</th>
                  <th className="p-3 font-medium w-24">Type</th>
                  <th className="p-3 font-medium w-24">Stock</th>
                  <th className="p-3 font-medium w-20">Servings</th>
                  <th className="p-3 font-medium w-20">Cost/Srv</th>
                  <th className="p-3 font-medium w-16 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredItems.map((item: any) => {
                  const isLayoutA =
                    item.type === "spirit" ||
                    (item.type === "mixer" && item.subtype === "bulk");
                  const isLayoutB =
                    item.type === "beer" ||
                    (item.type === "mixer" && item.subtype === "prepackaged");

                  let isLow = false;
                  if (isLayoutA) {
                    isLow =
                      (item.currentStock || 0) <=
                      (item.lowStockThreshold || 1) *
                        (item.baseUnitAmount || 750);
                  } else if (isLayoutB) {
                    isLow =
                      (item.currentStock || 0) <=
                      (item.lowStockThreshold || 1) * (item.unitsPerCase || 24);
                  } else {
                    isLow =
                      (item.currentStock || 0) <= (item.lowStockThreshold || 1);
                  }

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleMenuToggle(item)}
                          className={`w-6 h-6 rounded-md flex items-center justify-center transition-all border-2 ${item.isOnMenu ? "bg-primary border-primary text-primary-foreground" : "bg-transparent border-white/30 hover:border-primary/60"}`}
                        >
                          {item.isOnMenu && <Check size={14} strokeWidth={3} />}
                        </button>
                      </td>
                      <td className="p-3 w-32 min-w-[128px]">
                        {editingCell?.id === item.id &&
                        editingCell?.field === "name" ? (
                          <input
                            autoFocus
                            defaultValue={item.name}
                            className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-1.5 text-sm"
                            onBlur={(e) =>
                              handleCellSave(item.id, "name", e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter")
                                handleCellSave(
                                  item.id,
                                  "name",
                                  (e.target as HTMLInputElement).value,
                                );
                              if (e.key === "Escape") setEditingCell(null);
                            }}
                          />
                        ) : (
                          <div
                            className="cursor-pointer hover:text-primary truncate"
                            onClick={() =>
                              setEditingCell({ id: item.id, field: "name" })
                            }
                            title={
                              language === "es" && item.nameEs
                                ? item.nameEs
                                : item.name
                            }
                          >
                            <div className="truncate">
                              {language === "es" && item.nameEs
                                ? item.nameEs
                                : item.name}
                            </div>
                            {item.nameEs && item.nameEs !== item.name && (
                              <div className="text-xs text-muted-foreground truncate">
                                {item.name}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="text-sm text-muted-foreground capitalize">
                          {typeLabel(item.type)}
                          {item.subtype && (
                            <span className="text-xs block text-muted-foreground/60">
                              {getSubtypeLabel(item.type, item.subtype)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div
                          className={`cursor-pointer hover:text-primary font-medium ${isLow ? "text-primary" : "text-foreground"}`}
                          onClick={() => setEditingItem(item)}
                        >
                          {isLow && (
                            <AlertTriangle size={12} className="inline mr-1" />
                          )}
                          {(() => {
                            if (isLayoutA) {
                              const bottleSize = item.baseUnitAmount || 750;
                              const fullBottles = Math.floor(
                                item.currentStock / bottleSize,
                              );
                              const partialMl = item.currentStock % bottleSize;
                              return (
                                <span className="text-sm">
                                  {fullBottles}{" "}
                                  {getTranslation("bottles", language)}
                                  {partialMl > 0 && (
                                    <span className="text-xs text-muted-foreground ml-1">
                                      ({partialMl.toFixed(0)}ml)
                                    </span>
                                  )}
                                </span>
                              );
                            }
                            if (isLayoutB) {
                              const caseSize = item.unitsPerCase || 24;
                              const fullCases = (
                                item.currentStock / caseSize
                              ).toFixed(1);
                              return (
                                <span className="text-sm">
                                  {fullCases}{" "}
                                  {getTranslation("cases", language)}
                                </span>
                              );
                            }
                            return (
                              <span className="text-sm">
                                {item.currentStock?.toFixed(1)}{" "}
                                <span className="text-xs text-muted-foreground">
                                  {item.baseUnit}
                                </span>
                              </span>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="p-3">
                        {(() => {
                          const servings =
                            (item.currentStock || 0) / (item.servingSize || 1);
                          return (
                            <div className="text-sm font-bold text-foreground">
                              {servings.toFixed(1)}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="p-3">
                        {(() => {
                          let costPerSrv = 0;
                          if (isLayoutB) {
                            costPerSrv =
                              (item.orderCost || 0) / (item.unitsPerCase || 24);
                          } else {
                            const servingsPerContainer =
                              (item.baseUnitAmount || 1) /
                              (item.servingSize || 1);
                            costPerSrv =
                              (item.orderCost || 0) /
                              (servingsPerContainer || 1);
                          }
                          return (
                            <div className="text-sm text-primary">
                              {formatMoney(costPerSrv)}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingItem(item)}
                        >
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
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass p-6 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative border border-white/10">
            <button
              onClick={() => setEditingItem(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-display mb-6">
              {editingItem.id
                ? getTranslation("edit_item", language)
                : getTranslation("new_item", language)}
            </h2>
            {(() => {
              const isLayoutA =
                editingItem.type === "spirit" ||
                (editingItem.type === "mixer" &&
                  editingItem.subtype === "bulk");
              const isLayoutB =
                editingItem.type === "beer" ||
                (editingItem.type === "mixer" &&
                  editingItem.subtype === "prepackaged");

              return (
                <div className="grid grid-cols-2 gap-4">
                  {/* Common Fields */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      {getTranslation("type", language)}
                    </label>
                    <select
                      className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                      value={editingItem.type || "spirit"}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          type: e.target.value,
                          subtype: "",
                        })
                      }
                    >
                      <option value="spirit">
                        {getTranslation("spirit", language)}
                      </option>
                      <option value="beer">
                        {getTranslation("beer", language)}
                      </option>
                      <option value="mixer">
                        {getTranslation("mixer", language)}
                      </option>
                      <option value="ingredient">
                        {getTranslation("ingredient", language)}
                      </option>
                      <option value="merch">
                        {getTranslation("merch", language)}
                      </option>
                      <option value="misc">
                        {getTranslation("misc", language)}
                      </option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      {getTranslation("subtype", language)}
                    </label>
                    <select
                      className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                      value={editingItem.subtype || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          subtype: e.target.value,
                        })
                      }
                    >
                      <option value="">—</option>
                      {(SUBTYPES[editingItem.type] || []).map((st) => (
                        <option key={st.value} value={st.value}>
                          {language === "es" ? st.labelEs : st.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      {getTranslation("item_name", language)}
                    </label>
                    <input
                      className="max-w-md bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                      value={editingItem.name || ""}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, name: e.target.value })
                      }
                    />
                  </div>

                  {/* Alcohol Density - only for spirits */}
                  {isLayoutA && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Alcohol Density
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                        value={editingItem.alcoholDensity ?? ""}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            alcoholDensity: parseFloat(e.target.value) || 0.955,
                          })
                        }
                      />
                    </div>
                  )}

                  {/* Layout A: Spirit / Bulk Mixer */}
                  {isLayoutA && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          {getTranslation("bottle_size_ml", language)}
                        </label>
                        <input
                          type="number"
                          className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                          value={
                            editingItem.bottleSizeMl ||
                            editingItem.baseUnitAmount ||
                            750
                          }
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              bottleSizeMl: parseFloat(e.target.value) || 750,
                              baseUnitAmount: parseFloat(e.target.value) || 750,
                              baseUnit: "ml",
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          {getTranslation("full_bottle_weight_label", language)}
                        </label>
                        <input
                          type="number"
                          className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                          value={editingItem.fullBottleWeightG || ""}
                          onChange={(e) => {
                            const fullWeight = parseFloat(e.target.value) || 0;
                            const bottleSize =
                              editingItem.bottleSizeMl ||
                              editingItem.baseUnitAmount ||
                              750;
                            const density = editingItem.density || 0.94;
                            const liquidWeight = bottleSize * density;
                            const glassWeight = fullWeight - liquidWeight;
                            setEditingItem({
                              ...editingItem,
                              fullBottleWeightG: fullWeight,
                              glassWeightG:
                                glassWeight > 0 ? glassWeight : null,
                            });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          {getTranslation("pour_size", language)}
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                          value={editingItem.pourSize || 1.5}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              pourSize: parseFloat(e.target.value) || 1.5,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          {getTranslation("order_cost", language)}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                          value={editingItem.orderCost || 0}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              orderCost: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                      </div>

                      <div className="col-span-2 mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
                        <h4 className="text-sm font-semibold mb-3 text-primary">
                          {getTranslation("weigh_bottle", language)}
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">
                              {language === "es"
                                ? "Botellas Completas"
                                : "Full Bottles"}
                            </label>
                            <input
                              type="number"
                              min="0"
                              className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-foreground text-sm"
                              value={fullBottleCount}
                              onChange={(e) => {
                                const count = Math.max(
                                  0,
                                  parseInt(e.target.value) || 0,
                                );
                                setFullBottleCount(count);
                                const bottleSize =
                                  editingItem.bottleSizeMl ||
                                  editingItem.baseUnitAmount ||
                                  750;
                                const partialMl = editingItem.currentStock
                                  ? editingItem.currentStock % bottleSize
                                  : 0;
                                setEditingItem({
                                  ...editingItem,
                                  currentStock: count * bottleSize + partialMl,
                                });
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">
                              {getTranslation(
                                "current_bottle_weight",
                                language,
                              )}
                            </label>
                            <input
                              type="number"
                              className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-foreground text-sm"
                              value={partialBottleWeight}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setPartialBottleWeight(isNaN(val) ? "" : val);
                                if (
                                  !isNaN(val) &&
                                  editingItem.fullBottleWeightG
                                ) {
                                  const bottleSize =
                                    editingItem.bottleSizeMl ||
                                    editingItem.baseUnitAmount ||
                                    750;
                                  const density = editingItem.density || 0.94;
                                  const glassWeight =
                                    editingItem.glassWeightG ??
                                    editingItem.fullBottleWeightG -
                                      bottleSize * density;
                                  const currentLiquidWeight = val - glassWeight;
                                  const remainingMl = Math.max(
                                    0,
                                    currentLiquidWeight / density,
                                  );
                                  const fullBottles = Math.floor(
                                    (editingItem.currentStock || 0) /
                                      bottleSize,
                                  );
                                  setEditingItem({
                                    ...editingItem,
                                    currentStock:
                                      fullBottles * bottleSize + remainingMl,
                                  });
                                }
                              }}
                            />
                          </div>
                          {partialBottleWeight !== "" &&
                            editingItem.fullBottleWeightG && (
                              <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">
                                  {getTranslation("calculate", language)}
                                </label>
                                {(() => {
                                  const bottleSize =
                                    editingItem.bottleSizeMl ||
                                    editingItem.baseUnitAmount ||
                                    750;
                                  const density = editingItem.density || 0.94;
                                  const glassWeight =
                                    editingItem.glassWeightG ??
                                    editingItem.fullBottleWeightG -
                                      bottleSize * density;
                                  const currentLiquidWeight =
                                    partialBottleWeight - glassWeight;
                                  const remainingMl = Math.max(
                                    0,
                                    currentLiquidWeight / density,
                                  );
                                  const usedMl = bottleSize - remainingMl;
                                  const pourMl =
                                    (editingItem.pourSize || 1.5) * 29.5735;
                                  const usedPours = usedMl / pourMl;
                                  const remainingPours = remainingMl / pourMl;
                                  return (
                                    <div className="space-y-1 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                          {getTranslation(
                                            "remaining_pours",
                                            language,
                                          )}
                                        </span>
                                        <span className="font-bold text-emerald-400">
                                          {remainingPours.toFixed(1)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                          {getTranslation(
                                            "used_pours",
                                            language,
                                          )}
                                        </span>
                                        <span className="font-bold text-destructive">
                                          {usedPours.toFixed(1)}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          {getTranslation("low_stock_alert_label", language)}
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                          value={editingItem.lowStockThreshold || 1}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              lowStockThreshold:
                                parseFloat(e.target.value) || 1,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2 flex items-center pt-8">
                        <input
                          type="checkbox"
                          className="w-5 h-5 mr-3 rounded border-white/20 bg-secondary text-primary"
                          checked={editingItem.isOnMenu || false}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              isOnMenu: e.target.checked,
                            })
                          }
                        />
                        <label className="text-sm font-medium text-muted-foreground cursor-pointer">
                          {getTranslation("on_menu_label", language)}
                        </label>
                      </div>

                      <div className="col-span-2 grid grid-cols-3 gap-4 p-4 rounded-xl bg-primary/10 border border-primary/20 mt-2">
                        <div className="flex flex-col">
                          <span className="text-xs text-primary/70">
                            {getTranslation("stock_ml", language)}
                          </span>
                          <span className="text-lg font-bold">
                            {(editingItem.currentStock || 0).toFixed(0)} ml
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-primary/70">
                            {getTranslation("servings_remaining", language)}
                          </span>
                          <span className="text-lg font-bold">
                            {(
                              (editingItem.currentStock || 0) /
                              ((editingItem.pourSize || 1.5) * 29.5735)
                            ).toFixed(1)}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-primary/70">
                            {getTranslation("cost_per_serving", language)}
                          </span>
                          <span className="text-lg font-bold">
                            {formatMoney(
                              (editingItem.orderCost || 0) /
                                ((editingItem.bottleSizeMl ||
                                  editingItem.baseUnitAmount ||
                                  750) /
                                  ((editingItem.pourSize || 1.5) * 29.5735) ||
                                  1),
                            )}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Layout B: Beer / Packaged Mixer */}
                  {isLayoutB && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          {getTranslation("stock", language)}
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                          value={
                            (editingItem.currentStock || 0) /
                            (editingItem.unitsPerCase || 24)
                          }
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              currentStock:
                                (parseFloat(e.target.value) || 0) *
                                (editingItem.unitsPerCase || 24),
                              baseUnit: "unit",
                              servingSize: 1,
                              baseUnitAmount: 1,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          {getTranslation("units_per_case", language)}
                        </label>
                        <input
                          type="number"
                          className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                          value={editingItem.unitsPerCase || 24}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              unitsPerCase: parseInt(e.target.value) || 24,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          {getTranslation("order_cost", language)}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                          value={editingItem.orderCost || 0}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              orderCost: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          {getTranslation("low_stock_alert_label", language)}
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                          value={editingItem.lowStockThreshold || 1}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              lowStockThreshold:
                                parseFloat(e.target.value) || 1,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2 flex items-center pt-8">
                        <input
                          type="checkbox"
                          className="w-5 h-5 mr-3 rounded border-white/20 bg-secondary text-primary"
                          checked={editingItem.isOnMenu || false}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              isOnMenu: e.target.checked,
                            })
                          }
                        />
                        <label
                          className="text-sm font-medium text-muted-foreground cursor-pointer"
                          onClick={() =>
                            setEditingItem({
                              ...editingItem,
                              isOnMenu: !editingItem.isOnMenu,
                            })
                          }
                        >
                          {getTranslation("on_menu_label", language)}
                        </label>
                      </div>

                      <div className="col-span-2 grid grid-cols-2 gap-4 p-4 rounded-xl bg-primary/10 border border-primary/20 mt-2">
                        <div className="flex flex-col">
                          <span className="text-xs text-primary/70">
                            {getTranslation("stock_units", language)}
                          </span>
                          <span className="text-lg font-bold">
                            {(editingItem.currentStock || 0).toFixed(0)}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-primary/70">
                            {getTranslation("cost_per_unit", language)}
                          </span>
                          <span className="text-lg font-bold">
                            {formatMoney(
                              (editingItem.orderCost || 0) /
                                (editingItem.unitsPerCase || 24),
                            )}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Fallback Layout C: Generic (Ingredient, Merch, Misc) */}
                  {!isLayoutA && !isLayoutB && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          {getTranslation("current_stock", language)}
                        </label>
                        <input
                          type="number"
                          step="1"
                          className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                          value={editingItem.currentStock || 0}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              currentStock: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          {getTranslation("order_cost", language)}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                          value={editingItem.orderCost || 0}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              orderCost: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          {getTranslation("low_stock_alert_label", language)}
                        </label>
                        <input
                          type="number"
                          step="1"
                          className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                          value={editingItem.lowStockThreshold || 1}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              lowStockThreshold:
                                parseFloat(e.target.value) || 1,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2 flex items-center pt-8">
                        <input
                          type="checkbox"
                          className="w-5 h-5 mr-3 rounded border-white/20 bg-secondary text-primary"
                          checked={editingItem.isOnMenu || false}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              isOnMenu: e.target.checked,
                            })
                          }
                        />
                        <label
                          className="text-sm font-medium text-muted-foreground cursor-pointer"
                          onClick={() =>
                            setEditingItem({
                              ...editingItem,
                              isOnMenu: !editingItem.isOnMenu,
                            })
                          }
                        >
                          {getTranslation("on_menu_label", language)}
                        </label>
                      </div>
                    </>
                  )}
                </div>
              );
            })()}
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingItem(null);
                  setFullBottleCount(0);
                  setPartialBottleWeight("");
                }}
              >
                {getTranslation("cancel", language)}
              </Button>
              <Button
                onClick={() => {
                  saveIngredient.mutate(
                    { id: editingItem.id, data: editingItem },
                    {
                      onSuccess: () => {
                        setEditingItem(null);
                        setFullBottleCount(0);
                        setPartialBottleWeight("");
                        qc.invalidateQueries({
                          queryKey: ["/api/inventory/items"],
                        });
                      },
                    },
                  );
                }}
                disabled={saveIngredient.isPending}
              >
                {getTranslation("save", language)}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass p-6 rounded-3xl w-full max-w-md relative border border-white/10">
            <button
              onClick={() => setShowDeleteModal(null)}
              className="absolute top-4 right-4 text-muted-foreground"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-display mb-4 flex items-center gap-2">
              <Trash2 className="text-destructive" /> Delete Item
            </h2>
            <p className="text-muted-foreground mb-4">
              Are you sure you want to delete &quot;{showDeleteModal.name}
              &quot;? This cannot be undone.
            </p>
            <div className="space-y-2 mb-4">
              <input
                type="password"
                placeholder="Enter password to confirm"
                className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
              {deleteError && (
                <p className="text-destructive text-sm">{deleteError}</p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteItem}
                disabled={!deletePassword}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
