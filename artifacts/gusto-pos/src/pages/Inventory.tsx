import React, { useState, useMemo } from "react";
import { useSearchParams, Link } from "wouter";
import {
  useGetInventoryItems,
  useGetTrashCount,
  useClearTrash,
} from "@/hooks/use-inventory";
import { useSaveIngredientMutation } from "@/hooks/use-pos-mutations";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { usePosStore } from "@/store";
import { formatMoney, getTranslation } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  X,
  AlertTriangle,
  Trash2,
  Search,
  Menu,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Settings,
  ClipboardList,
  BarChart3,
} from "lucide-react";
import { InventoryAuditModal } from "@/components/InventoryAuditModal";
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
  const [showTrash, setShowTrash] = useState(false);
  const { data: items } = useGetInventoryItems(showTrash);
  const { data: trashCount } = useGetTrashCount();
  const clearTrash = useClearTrash();
  const { data: auth } = useGetCurrentAuthUser();
  const isAdmin = auth?.user?.role === "admin";
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
  const [filterSidebarCollapsed, setFilterSidebarCollapsed] = useState(false);
  const [expandedParents, setExpandedParents] = useState<Set<string>>(
    new Set(),
  );
  const [servingSizeUnit, setServingSizeUnit] = useState<"ml" | "oz">("ml");
  const [showAddInventory, setShowAddInventory] = useState<any>(null);
  const [addInvFull, setAddInvFull] = useState(0);
  const [addInvPartial, setAddInvPartial] = useState(0);
  const [addInvCost, setAddInvCost] = useState(0);
  const [showAuditItem, setShowAuditItem] = useState<any>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return prev.direction === "asc" ? { key, direction: "desc" } : null;
      }
      return { key, direction: "asc" };
    });
  };

  const toggleParent = (id: string) => {
    const next = new Set(expandedParents);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedParents(next);
  };
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
      // If it's a variation (has parent), don't show it in the main list unless its parent is expanded
      // Actually, we filter at the parent level first.
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

  // Grouping Logic with sorting
  const sortedItems = useMemo(() => {
    const items = filteredItems.filter((i: any) => !i.parentItemId);
    if (!sortConfig) return items;
    return [...items].sort((a: any, b: any) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredItems, sortConfig]);
  const topLevelItems = sortedItems;

  const getVariations = (parentId: string) => {
    return (items || []).filter((i: any) => i.parentItemId === parentId);
  };

  const getPooledStock = (item: any) => {
    const baseUnitAmount = item.baseUnitAmount || 750;
    const currentBulk = item.currentBulk || 0;
    const currentPartial = item.currentPartial || 0;

    // Use bottleSizeMl for parent (the standard bottle size)
    const bottleSize = item.bottleSizeMl || baseUnitAmount;

    if (item.type !== "spirit" && item.type !== "mixer") {
      return currentBulk * bottleSize + currentPartial;
    }

    const variations = getVariations(item.id);
    if (variations.length === 0) {
      return currentBulk * bottleSize + currentPartial;
    }

    let total = currentBulk * bottleSize + currentPartial;
    variations.forEach((v: any) => {
      // Use each variation's own bottle size
      const vBottleSize = v.bottleSizeMl || v.baseUnitAmount || 750;
      const vBase = (v.currentBulk || 0) * vBottleSize;
      const vPartial = v.currentPartial || 0;
      total += vBase + vPartial;
    });
    return total;
  };

  const getContainerDisplay = (item: any) => {
    const size = item.bottleSizeMl || item.baseUnitAmount || 0;

    // If trackingMode is explicitly set, use it
    if (item.trackingMode === "pool") {
      return `${size}ml`;
    }
    if (item.trackingMode === "collection") {
      return `${item.unitsPerCase || size}`;
    }

    // Default: use type/subtype logic
    const isPool =
      item.type === "spirit" ||
      (item.type === "mixer" && item.subtype === "bulk") ||
      (item.type === "ingredient" && item.subtype === "liquid");

    return isPool ? `${size}ml` : `${item.unitsPerCase || size}`;
  };

  const getPartialDisplay = (item: any) => {
    const containerWeight = item.containerWeightG;
    const fullWeight = item.fullBottleWeightG;
    const density = item.density || 0.94;
    const size = item.bottleSizeMl || item.baseUnitAmount || 750;

    // Valid weights: both > 0
    const hasValidWeights = containerWeight > 0 && fullWeight > 0;

    const isPool =
      item.trackingMode === "pool" ||
      (item.trackingMode === "auto" &&
        (item.type === "spirit" || item.type === "mixer"));

    // If has valid weights, show exact liquid weight in grams
    if (hasValidWeights && item.currentPartial > 0) {
      const liquidWeight = item.currentPartial - containerWeight;
      return liquidWeight > 0 ? `${liquidWeight.toFixed(0)}g` : "0g";
    }

    // Estimate: partialWeight / density (no valid weights) - show ~Xml
    if (!hasValidWeights && item.currentPartial > 0) {
      const estimatedMl = item.currentPartial / density;
      return `~${estimatedMl.toFixed(0)}ml`;
    }

    // For collection items, show units
    if (!isPool && item.currentPartial > 0) {
      return `${item.currentPartial}`;
    }

    return "0";
  };

  const getStockDisplay = (item: any) => {
    const {
      currentBulk,
      currentPartial,
      baseUnitAmount,
      containerWeightG,
      fullBottleWeightG,
      density,
    } = item;
    const unitSize = baseUnitAmount || 750;
    const isPool =
      item.trackingMode === "pool" ||
      (item.trackingMode === "auto" &&
        (item.type === "spirit" || item.type === "mixer"));

    if (!isPool) {
      const totalUnits = currentBulk * unitSize + currentPartial;
      return `${totalUnits.toFixed(0)} units`;
    }

    const fullBottles = currentBulk;

    if (currentPartial <= 0) {
      return `${fullBottles} full`;
    }

    const hasWeights = containerWeightG > 0 && fullBottleWeightG > 0;
    const d = density || 0.94;

    if (hasWeights) {
      const liquidWeight = fullBottleWeightG - containerWeightG;
      const expectedMl = Math.round(liquidWeight / d);
      return `${fullBottles} full + ${expectedMl}ml`;
    } else {
      const estimatedMl = Math.round(currentPartial / d);
      return `${fullBottles} full + ~${estimatedMl}ml`;
    }
  };

  const _handleCellSave = async (id: string, field: string, value: any) => {
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
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to delete");
      }
      qc.invalidateQueries({ queryKey: ["/api/inventory/items"] });
      setShowDeleteModal(null);
      setDeletePassword("");
      toast({
        title: getTranslation("success", language),
        description: "Item moved to trash",
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
        className={`fixed md:static inset-y-0 left-0 z-40 bg-secondary/50 border-r border-white/10 flex flex-col transition-all duration-300 ${
          filterSidebarCollapsed ? "w-16" : "w-[280px]"
        } ${showMobileMenu ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className={filterSidebarCollapsed ? "hidden" : ""}>
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
          <button
            onClick={() => setFilterSidebarCollapsed(!filterSidebarCollapsed)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title={
              filterSidebarCollapsed ? "Expand filters" : "Collapse filters"
            }
          >
            <ChevronLeft
              size={18}
              className={`transition-transform duration-300 ${
                filterSidebarCollapsed ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* Search */}
        <div
          className={`p-4 border-b border-white/10 ${filterSidebarCollapsed ? "hidden" : ""}`}
        >
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
        <div
          className={`flex-1 overflow-y-auto p-4 ${filterSidebarCollapsed ? "hidden" : ""}`}
        >
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
          <div className={`mt-8 ${filterSidebarCollapsed ? "hidden" : ""}`}>
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

            <button
              onClick={() => setShowTrash(!showTrash)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${showTrash ? "bg-destructive/20 text-destructive font-bold" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}
            >
              <Trash2
                size={14}
                className={
                  showTrash ? "text-destructive" : "text-muted-foreground"
                }
              />
              {showTrash ? "View Active Inventory" : "Trash Folder"}
              {trashCount?.count > 0 && (
                <span className="ml-auto text-xs bg-destructive/20 px-2 py-0.5 rounded-full">
                  {trashCount.count}
                </span>
              )}
            </button>

            {showTrash && isAdmin && trashCount?.count > 0 && (
              <button
                onClick={() => {
                  console.log(
                    "[Clear Trash] Clicked, count:",
                    trashCount.count,
                  );
                  if (
                    confirm(
                      `Delete ${trashCount.count} permanently? This cannot be undone.`,
                    )
                  ) {
                    console.log("[Clear Trash] Confirmed, calling mutate");
                    clearTrash.mutate(undefined, {
                      onSuccess: (data) => {
                        console.log("[Clear Trash] Success:", data);
                        toast({
                          title: getTranslation("success", language),
                          description: `${trashCount.count} items permanently deleted`,
                        });
                      },
                      onError: (e: any) => {
                        console.error("[Clear Trash] Error:", e);
                        toast({
                          variant: "destructive",
                          title: getTranslation("error", language),
                          description: e.message || "Failed to clear trash",
                        });
                      },
                    });
                  }
                }}
                disabled={clearTrash.isPending}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-destructive hover:bg-destructive/20"
              >
                <Trash2 size={14} />
                {clearTrash.isPending ? "Clearing..." : "Clear Trash"}
              </button>
            )}
          </div>
          <Link
            href="/inventory/variance"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-muted-foreground hover:bg-white/5 hover:text-foreground"
          >
            <BarChart3 size={14} />
            {language === "es" ? "Análisis de Variación" : "Variance Analysis"}
          </Link>{" "}
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
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          filterSidebarCollapsed ? "md:ml-0" : ""
        }`}
      >
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
                trackingMode: "auto",
                baseUnit: "ml",
                baseUnitAmount: 750,
                bottleSizeMl: 750,
                servingSize: 44.36,
                currentStock: 0,
                orderCost: 0,
                lowStockThreshold: 1,
                unitsPerCase: 24,
                fullBottleWeightG: null,
                containerWeightG: null,
                density: 0.94,
                isOnMenu: false,
                sellSingleServing: false,
                singleServingPrice: null,
              })
            }
          >
            <Plus size={18} className="mr-2" />
            {getTranslation("add_item", language)}
          </Button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto px-4 md:px-6 pb-6">
          <div className="glass rounded-2xl overflow-hidden min-w-[800px]">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-muted-foreground text-sm">
                  <th className="p-3 font-medium w-10 sticky left-0 bg-background z-20">
                    Menu
                  </th>
                  <th
                    className="p-3 font-medium w-24 min-w-[96px] sticky left-10 bg-background z-10 cursor-pointer hover:bg-white/5"
                    onClick={() => handleSort("name")}
                  >
                    Name{" "}
                    {sortConfig?.key === "name" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="p-3 font-medium w-20 cursor-pointer hover:bg-white/5"
                    onClick={() => handleSort("baseUnitAmount")}
                  >
                    Bottle{" "}
                    {sortConfig?.key === "baseUnitAmount" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="p-3 font-medium w-24 cursor-pointer hover:bg-white/5"
                    onClick={() => handleSort("type")}
                  >
                    Type{" "}
                    {sortConfig?.key === "type" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="p-3 font-medium w-24 cursor-pointer hover:bg-white/5"
                    onClick={() => handleSort("currentStock")}
                  >
                    Stock{" "}
                    {sortConfig?.key === "currentStock" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="p-3 font-medium w-20 cursor-pointer hover:bg-white/5"
                    onClick={() => handleSort("servingSize")}
                  >
                    Servings{" "}
                    {sortConfig?.key === "servingSize" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="p-3 font-medium w-16 cursor-pointer hover:bg-white/5"
                    onClick={() => handleSort("orderCost")}
                  >
                    Avg ${" "}
                    {sortConfig?.key === "orderCost" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="p-3 font-medium w-20 cursor-pointer hover:bg-white/5"
                    onClick={() => handleSort("markupFactor")}
                  >
                    Cost/Srv{" "}
                    {sortConfig?.key === "markupFactor" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="p-3 font-medium w-16 cursor-pointer hover:bg-white/5"
                    onClick={() => handleSort("density")}
                  >
                    Weight{" "}
                    {sortConfig?.key === "density" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="p-3 font-medium w-16 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {topLevelItems.map((item: any) => {
                  const variations = getVariations(item.id);
                  const hasVariations = variations.length > 0;
                  const isExpanded = expandedParents.has(item.id);
                  const pooledStock = getPooledStock(item);

                  const isLayoutA =
                    item.type === "spirit" ||
                    (item.type === "mixer" && item.subtype === "bulk");
                  const isLayoutB =
                    item.type === "beer" ||
                    (item.type === "mixer" && item.subtype === "prepackaged");

                  // Get serving size for this item (1 for collection, ml for pool)
                  const servingSize = isLayoutA
                    ? item.servingSize || 44.36
                    : isLayoutB
                      ? item.servingSize || 1
                      : item.servingSize || 1;

                  // Convert stock to servings and compare with threshold
                  const servingsRemaining = pooledStock / servingSize;
                  const threshold = item.lowStockThreshold || 1;
                  const isLow = servingsRemaining <= threshold;

                  return (
                    <React.Fragment key={item.id}>
                      <tr
                        className={`hover:bg-white/5 transition-colors ${hasVariations ? "bg-white/5" : ""}`}
                      >
                        <td className="p-3 sticky left-0 bg-background z-10">
                          <button
                            onClick={() => handleMenuToggle(item)}
                            className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${item.isOnMenu ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-white/5 border-white/10 text-muted-foreground"}`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${item.isOnMenu ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground"}`}
                            />
                            {item.isOnMenu
                              ? language === "es"
                                ? "ACTIVO"
                                : "ACTIVE"
                              : language === "es"
                                ? "INACTIVO"
                                : "INACTIVE"}
                          </button>
                        </td>
                        <td className="p-3 w-32 min-w-[128px] sticky left-10 bg-background z-10">
                          <div className="flex items-center gap-2">
                            {hasVariations && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleParent(item.id);
                                }}
                                className="p-1 hover:bg-white/10 rounded transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronDown size={14} />
                                ) : (
                                  <ChevronRight size={14} />
                                )}
                              </button>
                            )}
                            <div
                              className="cursor-pointer hover:text-primary truncate flex items-center gap-2"
                              onClick={() => setEditingItem(item)}
                            >
                              <span className="font-bold">
                                {language === "es" && item.nameEs
                                  ? item.nameEs
                                  : item.name}
                              </span>
                              {(item.bottleSizeMl || item.unitsPerCase) && (
                                <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                                  {getContainerDisplay(item)}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm text-muted-foreground">
                            {item.bottleSizeMl || item.unitsPerCase ? (
                              <span className="font-mono">
                                {getContainerDisplay(item)}
                              </span>
                            ) : item.baseUnitAmount ? (
                              <span className="font-mono">
                                {item.baseUnitAmount}
                                {item.baseUnit}
                              </span>
                            ) : (
                              <span className="opacity-40">—</span>
                            )}
                            {item.fullBottleWeightG && (
                              <span className="text-[10px] block text-muted-foreground/60">
                                {item.fullBottleWeightG.toFixed(0)}g full
                              </span>
                            )}
                          </div>
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
                            <div className="flex flex-col">
                              <span>
                                {isLow && (
                                  <AlertTriangle
                                    size={12}
                                    className="inline mr-1"
                                  />
                                )}
                                {getStockDisplay(item)}
                              </span>
                              {hasVariations && (
                                <span className="text-[10px] text-muted-foreground uppercase">
                                  Pooled Total ({variations.length + 1})
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="font-mono text-sm">
                            {pooledStock > 0 && item.servingSize > 0
                              ? (pooledStock / item.servingSize).toFixed(1)
                              : "0"}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-mono text-sm">
                            {item.orderCost > 0 && item.baseUnitAmount > 0
                              ? formatMoney(
                                  item.orderCost / item.baseUnitAmount,
                                )
                              : "—"}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-mono text-sm text-emerald-400">
                            {item.orderCost > 0 && item.baseUnitAmount > 0
                              ? formatMoney(
                                  (item.orderCost / item.baseUnitAmount) *
                                    item.servingSize,
                                )
                              : "—"}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="text-xs text-muted-foreground">
                            {item.containerWeightG ? (
                              <span className="font-mono block">
                                {item.containerWeightG.toFixed(0)}g container
                              </span>
                            ) : (
                              <span className="opacity-40 text-[10px]">
                                {language === "es"
                                  ? "Sin datos de peso"
                                  : "No weight data"}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setShowAddInventory(item);
                                setAddInvFull(0);
                                setAddInvPartial(0);
                                setAddInvCost(0);
                              }}
                              className="p-2 hover:bg-white/10 rounded-xl transition-colors text-primary hover:text-primary"
                              title="Add Inventory"
                            >
                              <Plus size={18} />
                            </button>
                            <button
                              onClick={() => setShowAuditItem(item)}
                              className="p-2 hover:bg-white/10 rounded-xl transition-colors text-yellow-500 hover:text-yellow-400"
                              title="Audit"
                            >
                              <ClipboardList size={18} />
                            </button>
                            <button
                              onClick={() => setEditingItem(item)}
                              className="p-2 hover:bg-white/10 rounded-xl transition-colors text-muted-foreground hover:text-foreground"
                              title={getTranslation("edit", language)}
                            >
                              <Settings size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded &&
                        variations.map((v: any) => (
                          <tr
                            key={v.id}
                            className="bg-white/[0.02] border-l-4 border-primary/30"
                          >
                            <td className="p-3 opacity-20 pl-10" />
                            <td className="p-3 pl-10 flex items-center gap-3">
                              <div className="w-4 h-px bg-white/20" />
                              <div
                                className="cursor-pointer hover:text-primary truncate flex items-center gap-2"
                                onClick={() => setEditingItem(v)}
                              >
                                <span className="text-sm">{v.name}</span>
                                {(v.bottleSizeMl || v.unitsPerCase) && (
                                  <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                                    {getContainerDisplay(v)}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="text-[10px] uppercase opacity-40">
                                Variation
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="font-mono text-xs opacity-70">
                                {getStockDisplay(v)}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="font-mono text-xs opacity-50">
                                {v.currentStock > 0 && v.servingSize > 0
                                  ? (v.currentStock / v.servingSize).toFixed(1)
                                  : "0"}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="font-mono text-xs">
                                {v.orderCost > 0 && v.baseUnitAmount > 0
                                  ? formatMoney(v.orderCost / v.baseUnitAmount)
                                  : "—"}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="font-mono text-xs opacity-50">
                                {v.orderCost > 0 && v.baseUnitAmount > 0
                                  ? formatMoney(
                                      (v.orderCost / v.baseUnitAmount) *
                                        v.servingSize,
                                    )
                                  : "—"}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="text-[10px] text-muted-foreground opacity-50">
                                {v.glassWeightG
                                  ? `${v.glassWeightG.toFixed(0)}g glass`
                                  : v.density
                                    ? `${v.density} density`
                                    : "—"}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setShowAddInventory(v);
                                    setAddInvFull(0);
                                    setAddInvPartial(0);
                                    setAddInvCost(0);
                                  }}
                                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-primary hover:text-primary"
                                  title="Add Inventory"
                                >
                                  <Plus size={14} />
                                </button>
                                <button
                                  onClick={() => setEditingItem(v)}
                                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                                >
                                  <Settings size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </React.Fragment>
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

              // Determine if this is pool (weight-based) or collection (unit-based)
              const isPool =
                editingItem.trackingMode === "pool" ||
                (editingItem.trackingMode === "auto" &&
                  (editingItem.type === "spirit" ||
                    editingItem.type === "mixer"));

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
                  {/* Row 1: Name & Type */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[10px]">
                      {getTranslation("item_name", language)}
                    </label>
                    <input
                      className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary/50 transition-colors"
                      value={editingItem.name || ""}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[10px]">
                      {getTranslation("type", language)}
                    </label>
                    <select
                      className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary/50 transition-colors appearance-none"
                      value={editingItem.type || "spirit"}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          type: e.target.value,
                          subtype: "",
                        })
                      }
                    >
                      {Object.keys(TYPE_LABELS).map((t) => (
                        <option key={t} value={t}>
                          {language === "es"
                            ? TYPE_LABELS[t].es
                            : TYPE_LABELS[t].en}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Row 2: Subtype & Density */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[10px]">
                      {getTranslation("subtype", language)}
                    </label>
                    <select
                      className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary/50 transition-colors appearance-none"
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

                  {/* Tracking Mode */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[10px]">
                      Tracking Mode
                    </label>
                    <select
                      className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary/50 transition-colors appearance-none"
                      value={editingItem.trackingMode || "auto"}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          trackingMode: e.target.value,
                        })
                      }
                    >
                      <option value="auto">Auto (based on type)</option>
                      <option value="pool">Pool - Weight based (ml)</option>
                      <option value="collection">
                        Collection - Unit based
                      </option>
                    </select>
                  </div>

                  {/* Row 3: Bottle Size & Full Weight */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[10px]">
                      {getTranslation("bottle_size_ml", language)}
                    </label>
                    <input
                      type="number"
                      className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary/50 transition-colors"
                      value={
                        editingItem.bottleSizeMl ||
                        editingItem.baseUnitAmount ||
                        ""
                      }
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setEditingItem({
                          ...editingItem,
                          bottleSizeMl: val,
                          baseUnitAmount: val,
                          baseUnit: "ml",
                        });
                      }}
                    />
                  </div>

                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[10px]">
                      {getTranslation("full_bottle_weight_label", language)}
                    </label>
                    <input
                      type="number"
                      disabled={!isPool}
                      className={`w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-colors ${
                        !isPool ? "opacity-40" : "text-foreground"
                      }`}
                      value={editingItem.fullBottleWeightG || ""}
                      onChange={(e) => {
                        if (!isPool) return;
                        const fullWeight = parseFloat(e.target.value) || 0;
                        const bottleSize =
                          editingItem.bottleSizeMl ||
                          editingItem.baseUnitAmount ||
                          750;
                        const density = editingItem.density || 0.94;
                        const liquidWeight = bottleSize * density;
                        const containerWeight = fullWeight - liquidWeight;
                        setEditingItem({
                          ...editingItem,
                          fullBottleWeightG: fullWeight,
                          containerWeightG:
                            containerWeight > 0 ? containerWeight : null,
                        });
                      }}
                    />
                    {editingItem.containerWeightG && (
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                          Container: {editingItem.containerWeightG.toFixed(0)}g
                        </span>
                        <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-widest">
                          Liquid:{" "}
                          {(
                            editingItem.fullBottleWeightG -
                            editingItem.containerWeightG
                          ).toFixed(0)}
                          g
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Row 4: Serving Size (oz for pool, units for collection) */}
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[10px]">
                        Serving Size
                      </label>
                      <div className="flex bg-secondary/50 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => setServingSizeUnit("ml")}
                          className={`px-2 py-0.5 text-[10px] rounded-md transition-colors ${
                            servingSizeUnit === "ml"
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          ml
                        </button>
                        <button
                          type="button"
                          onClick={() => setServingSizeUnit("oz")}
                          className={`px-2 py-0.5 text-[10px] rounded-md transition-colors ${
                            servingSizeUnit === "oz"
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {editingItem.trackingMode === "collection" ||
                          (editingItem.trackingMode === "auto" &&
                            editingItem.type !== "spirit" &&
                            editingItem.type !== "mixer")
                            ? "units"
                            : "fl oz"}
                        </button>
                      </div>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary/50 transition-colors"
                      value={
                        servingSizeUnit === "oz" && editingItem.servingSize
                          ? (editingItem.servingSize / 29.5735).toFixed(2)
                          : editingItem.servingSize || ""
                      }
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setEditingItem({
                          ...editingItem,
                          servingSize:
                            servingSizeUnit === "oz" ? val * 29.5735 : val,
                        });
                      }}
                    />
                  </div>

                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[10px]">
                      {getTranslation("order_cost", language)}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary/50 transition-colors"
                      value={editingItem.orderCost || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          orderCost: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  {/* Row 5: Alcohol Density (col 1) - only for pool items */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[10px]">
                      Alcohol Density{" "}
                      <span className="text-xs text-muted-foreground/60">
                        (spirit default: 0.94)
                      </span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      disabled={!isPool}
                      className={`w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-colors ${
                        !isPool ? "opacity-40" : "text-foreground"
                      }`}
                      value={editingItem.density || 0.94}
                      onChange={(e) =>
                        isPool
                          ? setEditingItem({
                              ...editingItem,
                              density: parseFloat(e.target.value) || 0.94,
                            })
                          : null
                      }
                    />
                  </div>

                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[10px]">
                      Avg Cost{" "}
                      <span className="text-xs text-muted-foreground/60">
                        ($/serving)
                      </span>
                    </label>
                    <div className="w-full bg-secondary/20 border border-white/5 rounded-xl px-4 py-3 text-muted-foreground">
                      {editingItem.orderCost &&
                      editingItem.servingSize &&
                      editingItem.bottleSizeMl
                        ? `$${((editingItem.orderCost / editingItem.bottleSizeMl) * editingItem.servingSize).toFixed(2)}`
                        : "—"}
                    </div>
                  </div>

                  {/* Row 6: Low Stock Alert */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-bold text-primary uppercase tracking-widest text-[10px]">
                      {getTranslation("low_stock_alert_label", language)}
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary/50 transition-colors"
                      value={editingItem.lowStockThreshold || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          lowStockThreshold: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <div className="flex flex-col space-y-2">
                    {/* Empty cell for grid alignment */}
                  </div>

                  {/* Weighing Section (If applicable) */}
                  {isLayoutA && (
                    <div className="col-span-2 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-6">
                      <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-[10px]">
                        <Settings size={14} />
                        {getTranslation("weigh_bottle", language)}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground uppercase font-bold">
                            Full Bottles
                          </label>
                          <input
                            type="number"
                            min="0"
                            className="w-full bg-secondary/50 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/30"
                            value={fullBottleCount}
                            onChange={(e) => {
                              const count = parseInt(e.target.value) || 0;
                              setFullBottleCount(count);
                              const size = editingItem.bottleSizeMl || 750;
                              const partial =
                                (editingItem.currentStock || 0) % size;
                              setEditingItem({
                                ...editingItem,
                                currentStock: count * size + partial,
                              });
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground uppercase font-bold">
                            {getTranslation("current_bottle_weight", language)}
                          </label>
                          <input
                            type="number"
                            className="w-full bg-secondary/50 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/30"
                            value={partialBottleWeight}
                            onChange={(e) => {
                              const weight = parseFloat(e.target.value) || 0;
                              setPartialBottleWeight(weight);
                              // Only calculate if we have valid container AND full weights
                              if (
                                editingItem.fullBottleWeightG &&
                                editingItem.containerWeightG
                              ) {
                                const size = editingItem.bottleSizeMl || 750;
                                const den = editingItem.density || 0.94;
                                const glass = editingItem.containerWeightG;
                                const liquid = Math.max(0, weight - glass);
                                const partialMl = liquid / den;
                                const fulls = Math.floor(
                                  (editingItem.currentStock || 0) / size,
                                );
                                setEditingItem({
                                  ...editingItem,
                                  currentStock: fulls * size + partialMl,
                                });
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Toggles & Single Serving */}
                  <div className="col-span-2 flex flex-col md:flex-row gap-6 pt-4 border-t border-white/5">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div
                        className={`w-10 h-6 rounded-full transition-colors relative ${editingItem.isOnMenu ? "bg-emerald-500/50" : "bg-white/10"}`}
                      >
                        <div
                          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${editingItem.isOnMenu ? "translate-x-4" : ""}`}
                        />
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={editingItem.isOnMenu}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              isOnMenu: e.target.checked,
                            })
                          }
                        />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                        {getTranslation("on_menu_label", language)}
                      </span>
                    </label>

                    <div className="flex-1 flex items-center gap-3 group">
                      <div className="flex items-center bg-secondary/50 rounded-lg px-3 py-2 border border-white/10 transition-all">
                        <span className="text-[10px] text-muted-foreground mr-3 font-bold uppercase whitespace-nowrap tracking-wider">
                          Single Serving Price
                        </span>
                        <div className="bg-white/5 rounded px-2 py-1 flex items-center border border-white/5 focus-within:border-primary/30">
                          <span className="text-xs text-primary/60 mr-1">
                            $
                          </span>
                          <input
                            type="number"
                            className="bg-transparent border-none outline-none text-sm w-20 text-right text-primary font-mono"
                            placeholder="0.00"
                            value={editingItem.singleServingPrice || ""}
                            onChange={(e) => {
                              const price = parseFloat(e.target.value) || 0;
                              setEditingItem({
                                ...editingItem,
                                singleServingPrice: price,
                                sellSingleServing: price > 0,
                              });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Current Inventory Display (Read-only - use Audit to update) */}
                  {editingItem.id && (
                    <div className="col-span-2 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-amber-400 uppercase tracking-widest">
                          Current Inventory
                        </span>
                        <button
                          onClick={() => {
                            setShowAuditItem(editingItem);
                            setEditingItem(null);
                          }}
                          className="text-xs text-primary hover:underline"
                        >
                          {language === "es" ? "Auditar" : "Audit"} →
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">
                            {isPool ? "Sealed (Full)" : "Unopened Cases"}
                          </span>
                          <span className="text-lg font-bold">
                            {editingItem.currentBulk || 0}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">
                            {isPool ? "Open (Partial)" : "Loose Units"}
                          </span>
                          <span className="text-lg font-bold">
                            {isPool
                              ? editingItem.currentPartial
                                ? `${(editingItem.currentPartial - (editingItem.containerWeightG || 0)).toFixed(0)}g`
                                : "0g"
                              : editingItem.currentPartial || 0}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">
                            Total
                          </span>
                          <span className="text-lg font-bold text-primary">
                            {(editingItem.currentStock || 0).toFixed(0)}{" "}
                            {isPool ? "ml" : "units"}
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2 italic">
                        {language === "es"
                          ? "Usa Auditar para actualizar el inventario"
                          : "Use Audit to update inventory counts"}
                      </p>
                    </div>
                  )}

                  {/* Calculated Stats Summary (for new items or when editing) */}
                  <div className="col-span-2 grid grid-cols-3 gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-primary/60 uppercase font-bold tracking-widest">
                        {getTranslation("current_stock", language)}
                      </span>
                      <span className="text-sm font-bold">
                        {(editingItem.currentStock || 0).toFixed(0)}{" "}
                        {isPool ? "ml" : "units"}
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] text-primary/60 uppercase font-bold tracking-widest">
                        Servings
                      </span>
                      <span className="text-sm font-bold text-center">
                        {editingItem.servingSize > 0
                          ? (
                              (editingItem.currentStock || 0) /
                              editingItem.servingSize
                            ).toFixed(1)
                          : "0.0"}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] text-primary/60 uppercase font-bold tracking-widest">
                        Cost/Srv
                      </span>
                      <span className="text-sm font-bold text-emerald-400">
                        {editingItem.servingSize > 0 &&
                        (editingItem.bottleSizeMl ||
                          editingItem.baseUnitAmount) > 0
                          ? formatMoney(
                              (editingItem.orderCost || 0) /
                                ((editingItem.bottleSizeMl ||
                                  editingItem.baseUnitAmount ||
                                  750) /
                                  editingItem.servingSize),
                            )
                          : formatMoney(0)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
            <div className="flex justify-between items-center mt-6">
              <div className="flex gap-3">
                {!editingItem.id && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingItem({
                        ...editingItem,
                        id: undefined,
                        parentItemId: editingItem.id,
                        name: editingItem.name,
                        currentStock: 0,
                        isDeleted: false,
                      });
                    }}
                  >
                    <Plus size={18} className="mr-2" />
                    Add Variation
                  </Button>
                )}
                {editingItem.id && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setShowDeleteModal(editingItem);
                      setEditingItem(null);
                    }}
                  >
                    <Trash2 size={18} className="mr-2" />
                    {getTranslation("delete", language)}
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
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
                            queryKey: ["inventory-items"],
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

      {/* Add Inventory Modal */}
      {showAddInventory &&
        (() => {
          const isCollection =
            showAddInventory.trackingMode === "collection" ||
            (showAddInventory.trackingMode === "auto" &&
              (showAddInventory.type === "beer" ||
                showAddInventory.type === "merch" ||
                showAddInventory.type === "misc"));

          const servingSize = isCollection
            ? 1
            : showAddInventory.servingSize || 44.36;
          const bottleSizeMl = showAddInventory.bottleSizeMl || 750;
          const unitsPerCase = showAddInventory.unitsPerCase || 1;
          const baseUnitAmount = showAddInventory.baseUnitAmount || 750;

          // Calculate added values based on type
          let totalAdded: number;
          let servingsAdded: number;
          let displayUnit: string;
          let fullLabel: string;
          let partialLabel: string;

          if (isCollection) {
            // Collection: cases + loose units
            totalAdded = addInvFull * unitsPerCase + addInvPartial;
            servingsAdded = totalAdded; // 1 serving = 1 unit
            displayUnit = "units";
            fullLabel = "Full Cases";
            partialLabel = "Loose Units";
          } else {
            // Pool: bottles + partial grams
            totalAdded = addInvFull * bottleSizeMl + addInvPartial;
            servingsAdded = totalAdded / servingSize;
            displayUnit = "ml";
            fullLabel = "Full Bottles";
            partialLabel = "Partial (grams)";
          }

          // Cost calculations - simple cost of new inventory only (not lifetime weighted)
          const totalCost = addInvCost * addInvFull;
          const costPerServing =
            servingsAdded > 0 ? totalCost / servingsAdded : 0;

          // Current stock for display
          const currentStock = showAddInventory.currentStock || 0;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
              <div className="glass p-6 rounded-3xl w-full max-w-md relative">
                <button
                  onClick={() => setShowAddInventory(null)}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                >
                  <X size={24} />
                </button>
                <h2 className="text-2xl font-display mb-2">Add Inventory</h2>
                <p className="text-sm text-muted-foreground mb-2">
                  {showAddInventory.name} (
                  {isCollection ? unitsPerCase : bottleSizeMl}
                  {isCollection ? " units" : "ml"})
                </p>

                {/* Current Inventory Display (Read-only) */}
                <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Current Inventory
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Full:</span>{" "}
                      <span className="font-mono">
                        {showAddInventory.currentBulk || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        {isCollection ? "Loose:" : "Partial:"}
                      </span>{" "}
                      <span className="font-mono">
                        {isCollection
                          ? showAddInventory.currentPartial || 0
                          : `${(showAddInventory.currentPartial || 0).toFixed(0)}g`}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total:</span>{" "}
                      <span className="font-mono">
                        {currentStock.toFixed(0)} {displayUnit}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-2">
                      <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[10px]">
                        {fullLabel}
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary/50 transition-colors"
                        value={addInvFull || ""}
                        onChange={(e) =>
                          setAddInvFull(parseInt(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="flex flex-col space-y-2">
                      <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[10px]">
                        {partialLabel}
                      </label>
                      <input
                        type="number"
                        step={isCollection ? "1" : "0.1"}
                        min="0"
                        placeholder={
                          isCollection ? "Loose units" : "Weight in grams"
                        }
                        className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary/50 transition-colors"
                        value={addInvPartial || ""}
                        onChange={(e) =>
                          setAddInvPartial(parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[10px]">
                      Unit Cost{" "}
                      <span className="text-xs text-muted-foreground/60">
                        ($ per {isCollection ? "case" : "full bottle"})
                      </span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary/50 transition-colors"
                      value={addInvCost || ""}
                      onChange={(e) =>
                        setAddInvCost(parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>

                  {(addInvFull > 0 || addInvPartial > 0) && (
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {isCollection ? "Units added:" : "Servings added:"}
                        </span>
                        <span className="font-mono">
                          {servingsAdded.toFixed(1)} {displayUnit}
                        </span>
                      </div>
                      {addInvCost > 0 && (
                        <>
                          <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                            <span className="text-muted-foreground">
                              Total cost:
                            </span>
                            <span className="font-mono text-emerald-400">
                              ${totalCost.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Cost per {isCollection ? "unit" : "serving"}:
                            </span>
                            <span className="font-mono">
                              ${costPerServing.toFixed(2)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <Button
                    className="w-full"
                    onClick={() => {
                      if (!addInvFull && !addInvPartial && !addInvCost) {
                        toast({
                          variant: "destructive",
                          title: "Error",
                          description: "Enter quantity or cost",
                        });
                        return;
                      }

                      // Calculate new stock values
                      const oldCurrentBulk = showAddInventory.currentBulk || 0;
                      const oldCurrentPartial =
                        showAddInventory.currentPartial || 0;
                      const newCurrentBulk = oldCurrentBulk + addInvFull;
                      const newCurrentPartial =
                        oldCurrentPartial + addInvPartial;
                      const newCurrentStock = currentStock + totalAdded;

                      // Save to API
                      saveIngredient.mutate(
                        {
                          id: showAddInventory.id,
                          data: {
                            currentBulk: newCurrentBulk,
                            currentPartial: newCurrentPartial,
                            currentStock: newCurrentStock,
                            orderCost: costPerServing,
                          },
                        },
                        {
                          onSuccess: () => {
                            qc.invalidateQueries({
                              queryKey: ["inventory-items"],
                            });
                            setShowAddInventory(null);
                            setAddInvFull(0);
                            setAddInvPartial(0);
                            setAddInvCost(0);
                            toast({
                              title: "Success",
                              description: "Inventory added",
                            });
                          },
                          onError: (err: any) => {
                            toast({
                              variant: "destructive",
                              title: "Error",
                              description:
                                err.message || "Failed to add inventory",
                            });
                          },
                        },
                      );
                    }}
                  >
                    <Plus size={16} className="mr-2" /> Add Inventory
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Audit Modal */}
      {showAuditItem && (
        <InventoryAuditModal
          item={showAuditItem}
          isOpen={true}
          onClose={() => setShowAuditItem(null)}
        />
      )}

      {/* Empty state at bottom of component */}
    </div>
  );
}
