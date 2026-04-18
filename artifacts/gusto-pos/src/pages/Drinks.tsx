import React, { useState } from "react";
import { useSearchParams } from "wouter";
import { useGetDrinks, useGetIngredients } from "@workspace/api-client-react";
import { useSaveDrinkMutation } from "@/hooks/use-pos-mutations";
import { usePosStore } from "@/store";
import { formatMoney, getTranslation } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Edit2,
  X,
  Package,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Search,
  Menu,
  Copy as CopyIcon,
  ChefHat,
  Wine,
  ChevronRight,
  ChevronLeft,
  Star,
  Check,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const OZ_TO_ML = 44.36;

const DRINK_CATEGORIES = [
  { value: "all", label: "All", labelEs: "Todos" },
  { value: "shot", label: "Shot", labelEs: "Shot" },
  {
    value: "shot_specialty",
    label: "Shot (Specialty)",
    labelEs: "Shot (Especial)",
  },
  { value: "cocktail", label: "Cocktail", labelEs: "Córtel" },
  {
    value: "cocktail_specialty",
    label: "Cocktail (Specialty)",
    labelEs: "Córtel (Especial)",
  },
  { value: "beer", label: "Beer", labelEs: "Cerveza" },
  { value: "beverage", label: "Beverage", labelEs: "Bebida" },
  { value: "wine", label: "Wine", labelEs: "Vino" },
  { value: "other", label: "Other", labelEs: "Otro" },
];

const _SPIRIT_SUBTYPES = [
  { value: "tequila", label: "Tequila" },
  { value: "mezcal", label: "Mezcal" },
  { value: "vodka", label: "Vodka" },
  { value: "gin", label: "Gin" },
  { value: "whiskey", label: "Whiskey" },
  { value: "rum", label: "Rum/Ron" },
  { value: "misc", label: "Misc" },
];

export default function Drinks() {
  const { language } = usePosStore();
  const { data: drinks } = useGetDrinks();
  const { data: ingredients } = useGetIngredients();
  const saveDrink = useSaveDrinkMutation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [editingDrink, setEditingDrink] = useState<any>(null);
  const [deleteDrinkId, setDeleteDrinkId] = useState<string | null>(null);
  const [deleteDrinkName, setDeleteDrinkName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filterSidebarCollapsed, setFilterSidebarCollapsed] = useState(false);

  const activeCategory = searchParams.get("category") || "all";
  const onMenuOnly = searchParams.get("onMenu") === "true";
  const search = searchParams.get("search") || "";

  const setActiveCategory = (cat: string) => {
    if (cat === "all") {
      searchParams.delete("category");
    } else {
      searchParams.set("category", cat);
    }
    setSearchParams(searchParams);
  };

  const toggleOnMenu = () => {
    if (onMenuOnly) {
      searchParams.delete("onMenu");
    } else {
      searchParams.set("onMenu", "true");
    }
    setSearchParams(searchParams);
  };

  const setSearch = (val: string) => {
    if (!val) {
      searchParams.delete("search");
    } else {
      searchParams.set("search", val);
    }
    setSearchParams(searchParams);
  };

  const drinkSortColumn = searchParams.get("sort") || "name";
  const drinkSortDirection =
    (searchParams.get("dir") as "asc" | "desc") || "asc";

  const handleDrinkSort = (column: string) => {
    const newDir =
      drinkSortColumn === column && drinkSortDirection === "asc"
        ? "desc"
        : "asc";
    searchParams.set("sort", column);
    searchParams.set("dir", newDir);
    setSearchParams(searchParams);
  };

  const DrinkSortIcon = ({ column }: { column: string }) => {
    if (drinkSortColumn !== column)
      return <ArrowUpDown size={14} className="ml-1 opacity-40" />;
    return drinkSortDirection === "asc" ? (
      <ArrowUp size={14} className="ml-1" />
    ) : (
      <ArrowDown size={14} className="ml-1" />
    );
  };

  const getCategoryCount = (cat: string) => {
    if (cat === "all") return drinks?.length || 0;
    return drinks?.filter((d: any) => d.category === cat).length || 0;
  };

  const handleDeleteDrink = async () => {
    if (!deleteDrinkId) return;
    try {
      const res = await fetch(`/api/drinks/${deleteDrinkId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to delete drink");
      toast({
        title: getTranslation("success", language),
        description: `Drink "${deleteDrinkName}" deleted.`,
      });
      setDeleteDrinkId(null);
      setDeleteDrinkName("");
      qc.invalidateQueries();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: getTranslation("error", language),
        description: error.message || "Failed to delete drink.",
      });
    }
  };

  const handleMenuToggle = async (drink: any) => {
    const newVal = !drink.isOnMenu;

    // Block enabling menu without recipe (unless it's inventory_single which has auto-recipe)
    if (
      newVal &&
      (!drink.recipe || drink.recipe.length === 0) &&
      drink.sourceType !== "inventory_single"
    ) {
      toast({
        variant: "destructive",
        title: getTranslation("error", language),
        description:
          "Add at least one ingredient to the recipe before enabling menu",
      });
      return;
    }

    qc.setQueryData(["drinks"], (old: any) => {
      if (!old) return old;
      return old.map((d: any) =>
        d.id === drink.id ? { ...d, isOnMenu: newVal } : d,
      );
    });
    try {
      const res = await fetch(`/api/drinks/${drink.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnMenu: newVal }),
      });
      if (!res.ok) throw new Error("Failed to update");
    } catch (e: any) {
      qc.setQueryData(["drinks"], (old: any) => {
        if (!old) return old;
        return old.map((d: any) =>
          d.id === drink.id ? { ...d, isOnMenu: !newVal } : d,
        );
      });
      toast({
        variant: "destructive",
        title: getTranslation("error", language),
        description: e.message,
      });
    }
  };

  const filteredDrinks = drinks?.filter((d: any) => {
    const matchesCategory =
      activeCategory === "all" || d.category === activeCategory;
    const matchesOnMenu = !onMenuOnly || d.isOnMenu;
    const matchesSearch =
      !search || d.name.toLowerCase().includes(search.toLowerCase());

    // For Shot and Cocktail categories, require default ingredient
    const needsDefault = d.category === "shot" || d.category === "cocktail";
    const hasDefault = d.recipe?.some((r: any) => r.isDefault);
    const showWithoutDefault = !needsDefault || hasDefault;

    return (
      matchesCategory && matchesOnMenu && matchesSearch && showWithoutDefault
    );
  });

  const sortedDrinks = [...(filteredDrinks || [])].sort((a: any, b: any) => {
    const aVal = a[drinkSortColumn];
    const bVal = b[drinkSortColumn];
    if (typeof aVal === "string") {
      return drinkSortDirection === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    return drinkSortDirection === "asc"
      ? Number(aVal) - Number(bVal)
      : Number(bVal) - Number(aVal);
  });

  const sidebarContent = (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          className="w-full bg-secondary/50 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground"
          placeholder={getTranslation("search_drinks", language)}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Category Filters */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          {getTranslation("category", language)}
        </h4>
        <div className="space-y-1">
          {DRINK_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.value;
            const count = getCategoryCount(cat.value);
            return (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-primary/20 text-primary font-medium"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-2">
                  <ChevronRight
                    size={12}
                    className={`transition-transform ${isActive ? "rotate-90" : ""}`}
                  />
                  {language === "es" ? cat.labelEs : cat.label}
                </span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-md ${isActive ? "bg-primary/30" : "bg-white/5"}`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Filters */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          {getTranslation("filter", language)}
        </h4>
        <button
          onClick={toggleOnMenu}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
            onMenuOnly
              ? "bg-primary/20 text-primary font-medium"
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
          }`}
        >
          <span>{getTranslation("on_menu_filter", language)}</span>
          <div
            className={`w-8 h-4 rounded-full transition-colors ${onMenuOnly ? "bg-primary" : "bg-white/10"}`}
          >
            <div
              className={`w-3 h-3 rounded-full bg-white mt-0.5 transition-transform ${onMenuOnly ? "translate-x-4" : "translate-x-0.5"}`}
            />
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-full">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-white/5 p-4 overflow-y-auto shrink-0 transition-all duration-300 ${
          filterSidebarCollapsed ? "w-16" : "w-70"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <span
            className={`font-display font-bold text-lg transition-opacity duration-300 ${
              filterSidebarCollapsed ? "hidden" : ""
            }`}
          >
            {getTranslation("menu", language)}
          </span>
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
        <div className={filterSidebarCollapsed ? "hidden" : ""}>
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="w-70 h-full bg-background border-r border-white/5 p-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-bold">
                {getTranslation("filter", language)}
              </h3>
              <button onClick={() => setSidebarOpen(false)}>
                <X size={20} />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div className="flex items-center gap-3">
              <button
                className="md:hidden p-2 rounded-lg bg-secondary/50 border border-white/10"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={18} />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-display">
                    {getTranslation("menu", language)}
                  </h1>
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-base font-semibold align-middle">
                    {sortedDrinks.length}
                  </span>
                </div>
                <p className="text-muted-foreground mt-1">
                  {getTranslation("manage_drinks", language)}
                </p>
              </div>
            </div>
            <Button
              onClick={() =>
                setEditingDrink({
                  name: "",
                  category: "cocktail",
                  actualPrice: null,
                  recipe: [],
                  isAvailable: true,
                  isOnMenu: false,
                  sourceType: "standard",
                })
              }
            >
              <Plus className="mr-2" size={18} />{" "}
              {getTranslation("new_drink", language)}
            </Button>
          </div>

          <div className="glass rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              {sortedDrinks && sortedDrinks.length > 0 ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-muted-foreground text-sm">
                      <th className="p-4 font-medium w-12">
                        {getTranslation("on_menu", language)}
                      </th>
                      <th
                        className="p-4 font-medium cursor-pointer select-none"
                        onClick={() => handleDrinkSort("name")}
                      >
                        <span className="flex items-center">
                          {getTranslation("name", language)}
                          <DrinkSortIcon column="name" />
                        </span>
                      </th>
                      <th
                        className="p-4 font-medium cursor-pointer select-none"
                        onClick={() => handleDrinkSort("category")}
                      >
                        <span className="flex items-center">
                          {getTranslation("category", language)}
                          <DrinkSortIcon column="category" />
                        </span>
                      </th>
                      <th
                        className="p-4 font-medium cursor-pointer select-none"
                        onClick={() => handleDrinkSort("costPerDrink")}
                      >
                        <span className="flex items-center">
                          {getTranslation("cost", language)}
                          <DrinkSortIcon column="costPerDrink" />
                        </span>
                      </th>
                      <th
                        className="p-4 font-medium cursor-pointer select-none"
                        onClick={() => handleDrinkSort("actualPrice")}
                      >
                        <span className="flex items-center">
                          {getTranslation("price", language)}
                          <DrinkSortIcon column="actualPrice" />
                        </span>
                      </th>
                      <th className="p-4 font-medium">
                        <div className="flex flex-col">
                          <span>{getTranslation("margin", language)}</span>
                          <span className="text-xs text-muted-foreground font-normal">
                            $ / %
                          </span>
                        </div>
                      </th>
                      <th className="p-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {sortedDrinks.map((drink) => {
                      const finalPrice =
                        drink.actualPrice || drink.suggestedPrice;
                      const marginDollars = finalPrice - drink.costPerDrink;
                      const marginPercent =
                        ((finalPrice - drink.costPerDrink) /
                          (finalPrice || 1)) *
                        100;

                      // Color code margin: green (>40%), yellow (20-40%), red (<20%)
                      const marginColor =
                        marginPercent >= 40
                          ? "text-emerald-400"
                          : marginPercent >= 20
                            ? "text-yellow-400"
                            : "text-red-400";

                      return (
                        <tr
                          key={drink.id}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleMenuToggle(drink)}
                              className={`w-6 h-6 rounded-md flex items-center justify-center transition-all border-2 ${
                                drink.isOnMenu
                                  ? "bg-primary border-primary text-primary-foreground"
                                  : "bg-transparent border-white/30 hover:border-primary/60"
                              }`}
                            >
                              {drink.isOnMenu && (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </button>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {drink.sourceType === "inventory_single" ? (
                                <Wine size={14} className="text-primary" />
                              ) : (
                                <ChefHat
                                  size={14}
                                  className="text-muted-foreground"
                                />
                              )}
                              <span className="font-medium">{drink.name}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">
                              {drink.recipe
                                ?.map((r: any) => r.ingredientName)
                                .join(", ")}
                            </div>
                          </td>
                          <td className="p-4 text-muted-foreground capitalize">
                            {drink.category}
                          </td>
                          <td className="p-4 text-destructive">
                            {formatMoney(drink.costPerDrink)}
                          </td>
                          <td className="p-4 text-emerald-400 font-bold">
                            {formatMoney(finalPrice)}
                          </td>
                          <td className={`p-4 font-medium ${marginColor}`}>
                            <div className="flex flex-col">
                              <span>{formatMoney(marginDollars)}</span>
                              <span className="text-xs text-muted-foreground">
                                {marginPercent.toFixed(0)}% Margin
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setDeleteDrinkId(drink.id);
                                  setDeleteDrinkName(drink.name);
                                }}
                              >
                                <Trash2
                                  size={16}
                                  className="text-destructive"
                                />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingDrink(drink)}
                              >
                                <Edit2 size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title={
                                  getTranslation("clone", language) || "Clone"
                                }
                                onClick={() => {
                                  // Clone: open modal with copied drink (no id, name prefixed)
                                  const { name, ...rest } = drink;
                                  setEditingDrink({
                                    ...rest,
                                    name: `Copy of ${name}`,
                                    id: undefined,
                                  });
                                }}
                              >
                                <CopyIcon size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12 text-muted-foreground italic bg-white/5 rounded-3xl border border-white/5">
                  <Package size={48} className="mx-auto mb-4 opacity-20" />
                  <p>
                    {getTranslation("no_drinks_found", language).replace(
                      "{search}",
                      search || getTranslation("all", language),
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit / New Drink Modal */}
      {editingDrink && (
        <DrinkModal
          drink={editingDrink}
          ingredients={ingredients || []}
          language={language}
          onClose={() => setEditingDrink(null)}
          isSaving={saveDrink.isPending}
          onSave={(data) => {
            const { costPerDrink: _c, suggestedPrice: _s, ...rest } = data;

            // Convert OZ back to ML for storage before sending to API
            const convertedRecipe = (rest.recipe || []).map((r: any) => {
              const ing = ingredients?.find(
                (i: any) => i.id === r.ingredientId,
              );
              let amount = r.amountInBaseUnit || 0;
              if (ing && ing.baseUnit === "ml") {
                amount = amount * OZ_TO_ML;
              }
              return {
                ingredientId: r.ingredientId,
                amountInBaseUnit: amount,
                isDefault: r.isDefault || false,
                defaultCost: r.defaultCost || 0,
              };
            });

            const saveData = {
              ...rest,
              // nameEs removed
              recipe: convertedRecipe,
            };
            saveDrink.mutate(
              { id: editingDrink.id, data: saveData },
              { onSuccess: () => setEditingDrink(null) },
            );
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteDrinkId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass p-8 rounded-3xl w-full max-w-md relative border border-white/10">
            <button
              onClick={() => setDeleteDrinkId(null)}
              className="absolute top-6 right-6 text-muted-foreground hover:text-foreground"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-display mb-4 flex items-center gap-2">
              <Trash2 className="text-destructive" />{" "}
              {getTranslation("delete_drink", language)}
            </h2>
            <p className="text-muted-foreground mb-6">
              {getTranslation("delete_drink_confirm", language).replace(
                "{name}",
                deleteDrinkName,
              )}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteDrinkId(null)}>
                {getTranslation("cancel", language)}
              </Button>
              <Button variant="destructive" onClick={handleDeleteDrink}>
                {getTranslation("delete", language)}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DrinkModal({
  drink,
  ingredients,
  language,
  onClose,
  onSave,
  isSaving,
}: {
  drink: any;
  ingredients: any[];
  language: "en" | "es";
  onClose: () => void;
  onSave: (data: any) => void;
  isSaving: boolean;
}) {
  const { toast } = useToast();
  // On initialization, convert DB ML values to OZ for display
  const [editing, setEditing] = useState(() => {
    const displayRecipe = (drink.recipe || []).map((r: any) => {
      const ing = ingredients.find((i: any) => i.id === r.ingredientId);
      let amount = r.amountInBaseUnit || 0;
      if (ing && ing.baseUnit === "ml" && amount > 5) {
        // Threshold to avoid double conversion of already converted small values if any
        amount = parseFloat((amount / OZ_TO_ML).toFixed(2));
      }
      return { ...r, amountInBaseUnit: amount };
    });
    return { ...drink, recipe: displayRecipe };
  });

  const handleSave = () => {
    if (!editing.name.trim()) {
      toast({
        variant: "destructive",
        title: getTranslation("error", language),
        description: "Name is required",
      });
      return;
    }
    if (editing.actualPrice != null && editing.actualPrice <= 0) {
      toast({
        variant: "destructive",
        title: getTranslation("error", language),
        description: getTranslation("price_greater_zero", language),
      });
      return;
    }
    // Require recipe for non-inventory_single drinks
    if (
      editing.sourceType !== "inventory_single" &&
      (!editing.recipe || editing.recipe.length === 0)
    ) {
      toast({
        variant: "destructive",
        title: getTranslation("error", language),
        description: "Add at least one ingredient to the recipe",
      });
      return;
    }
    onSave(editing);
  };

  const recipeTypes = [
    "spirit",
    "mixer",
    "juice",
    "sour",
    "sweet",
    "bitter",
    "garnish",
    "other",
  ];

  const getIngredientsFiltered = (typeFilter: string, subtype: string) => {
    const lowerType = typeFilter?.toLowerCase() || "";
    return ingredients
      .filter(
        (ing: any) =>
          (ing.type && ing.type.toLowerCase() === lowerType) ||
          (typeFilter === "other" && !ing.type),
      )
      .filter(
        (ing: any) =>
          !subtype ||
          (ing.subtype &&
            ing.subtype.toLowerCase() === subtype.toLowerCase()) ||
          (!ing.subtype && subtype === "other"),
      );
  };

  const subtypeOptionsByType: Record<string, string[]> = {
    spirit: [
      "tequila",
      "mezcal",
      "whiskey",
      "vodka",
      "gin",
      "rum",
      "brandy",
      " liqueur",
      "other",
    ],
    mixer: ["soda", "tonic", "water", "energy", "beer", "other"],
    juice: ["lime", "lemon", "orange", "grapefruit", "cranberry", "other"],
    sour: ["lime", "lemon", "other"],
    sweet: ["simple", "agave", "honey", "other"],
    bitter: ["angostura", "campari", "other"],
    garnish: ["salt", "lime", "cherry", "olive", "other"],
    other: [],
  };

  const updateRecipeItem = (idx: number, updates: any) => {
    const newRecipe = [...(editing.recipe || [])];
    newRecipe[idx] = { ...newRecipe[idx], ...updates };

    if (updates.type) {
      newRecipe[idx].subtype = "";
      newRecipe[idx].ingredientId = "";
      newRecipe[idx].ingredientName = "";
    }
    if (updates.subtype) {
      newRecipe[idx].ingredientId = "";
      newRecipe[idx].ingredientName = "";
    }
    if (updates.ingredientId) {
      const ing = ingredients.find((i: any) => i.id === updates.ingredientId);
      if (ing) {
        newRecipe[idx].ingredientName = ing.name;
        newRecipe[idx].amountInBaseUnit = ing.servingSize || 1.5;
        // Auto-set as default if it's the first spirit ingredient
        if (
          ing.type === "spirit" &&
          !newRecipe.some((r: any, i: number) => r.isDefault && i !== idx)
        ) {
          newRecipe[idx].isDefault = true;
          newRecipe[idx].defaultCost = ing.orderCost || 0;
        }
      }
    }

    setEditing({ ...editing, recipe: newRecipe });
  };

  const setDefaultIngredient = (idx: number) => {
    const newRecipe = [...(editing.recipe || [])];
    newRecipe.forEach((r: any, i: number) => {
      newRecipe[i] = { ...r, isDefault: i === idx };
      if (i === idx) {
        const ing = ingredients.find((ing: any) => ing.id === r.ingredientId);
        newRecipe[i].defaultCost = ing?.orderCost || 0;
      }
    });
    setEditing({ ...editing, recipe: newRecipe });
  };

  const addRecipeItem = () => {
    setEditing({
      ...editing,
      recipe: [
        ...(editing.recipe || []),
        {
          subtype: "",
          ingredientId: "",
          ingredientName: "",
          amountInBaseUnit: 0,
        },
      ],
    });
  };

  const removeRecipeItem = (idx: number) => {
    setEditing({
      ...editing,
      recipe: editing.recipe.filter((_: any, i: number) => i !== idx),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="glass p-8 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative border border-white/10">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-muted-foreground hover:text-foreground"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-display mb-6">
          {editing.id
            ? getTranslation("edit_drink", language)
            : getTranslation("new_drink", language)}
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              {getTranslation("name_label", language)}
            </label>
            <input
              className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              {getTranslation("drink_category", language)}
            </label>
            <select
              className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
              value={editing.category || "cocktail"}
              onChange={(e) =>
                setEditing({ ...editing, category: e.target.value })
              }
            >
              <option value="shot">{getTranslation("shot", language)}</option>
              <option value="shot_specialty">
                {language === "es" ? "Shot (Especial)" : "Shot (Specialty)"}
              </option>
              <option value="cocktail">
                {getTranslation("cocktail", language)}
              </option>
              <option value="cocktail_specialty">
                {language === "es"
                  ? "Córtel (Especial)"
                  : "Cocktail (Specialty)"}
              </option>
              <option value="beer">{getTranslation("beer", language)}</option>
              <option value="beverage">
                {language === "es" ? "Bebida" : "Beverage"}
              </option>
              <option value="other">{getTranslation("other", language)}</option>
            </select>
          </div>
          <div className="space-y-2 col-span-2">
            <label className="text-sm font-medium text-muted-foreground">
              {getTranslation("actual_price_label", language)}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <input
                type="number"
                className="w-full bg-secondary border border-white/10 rounded-xl pl-8 pr-4 py-3 text-lg font-bold text-emerald-400"
                value={editing.actualPrice ?? ""}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    actualPrice: e.target.value
                      ? parseFloat(e.target.value)
                      : null,
                  })
                }
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-medium text-lg flex items-center gap-2 mb-4">
            {getTranslation("recipe_ingredients", language)}
            {editing.sourceType === "inventory_single" && (
              <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {getTranslation("pooled", language) || "Linked to Inventory"}
              </span>
            )}
          </h3>

          {editing.sourceType === "inventory_single" ? (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 italic text-sm text-muted-foreground">
              {getTranslation("pooled_recipe_notice", language) ||
                "This drink is a direct pour from inventory. Recipe is managed automatically via serving sizes."}
              <div className="mt-2 flex gap-4">
                {(editing.recipe || []).map((r: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 not-italic text-foreground"
                  >
                    <Wine size={14} className="text-primary" />
                    <span>{r.ingredientName}</span>
                    <span className="font-bold">{r.amountInBaseUnit} oz</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-4">
                {(editing.recipe || []).map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-2 p-3 rounded-xl bg-white/5 border border-white/5 animate-in fade-in slide-in-from-left-2"
                  >
                    <div className="flex gap-2 items-center">
                      <select
                        className="w-24 bg-secondary border border-white/10 rounded-xl px-2 py-2 text-foreground text-sm font-medium"
                        value={item.type || ""}
                        onChange={(e) =>
                          updateRecipeItem(idx, { type: e.target.value })
                        }
                      >
                        <option value="">
                          {getTranslation("type", language)}
                        </option>
                        {recipeTypes.map((t) => (
                          <option key={t} value={t}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                          </option>
                        ))}
                      </select>

                      <select
                        className="flex-1 bg-secondary border border-white/10 rounded-xl px-3 py-2 text-foreground text-sm"
                        value={item.subtype || ""}
                        onChange={(e) =>
                          updateRecipeItem(idx, { subtype: e.target.value })
                        }
                        disabled={!item.type}
                      >
                        <option value="">
                          {getTranslation("select_subtype", language)}
                        </option>
                        {(
                          subtypeOptionsByType[item.type] ||
                          subtypeOptionsByType["other"]
                        ).map((sub) => (
                          <option key={sub} value={sub}>
                            {getTranslation(sub, language) || sub}
                          </option>
                        ))}
                      </select>

                      <select
                        className="flex-1 bg-secondary border border-white/10 rounded-xl px-3 py-2 text-foreground text-sm"
                        value={item.ingredientId || ""}
                        onChange={(e) =>
                          updateRecipeItem(idx, {
                            ingredientId: e.target.value,
                          })
                        }
                        disabled={!item.subtype}
                      >
                        <option value="">
                          {getTranslation("select_ingredient", language)}
                        </option>
                        {getIngredientsFiltered(item.type, item.subtype).map(
                          (ing: any) => (
                            <option key={ing.id} value={ing.id}>
                              {language === "es" && ing.nameEs
                                ? ing.nameEs
                                : ing.name}
                            </option>
                          ),
                        )}
                      </select>

                      <div className="relative w-28">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          className="w-full bg-secondary border border-white/10 rounded-xl pl-3 pr-8 py-2 text-foreground text-sm"
                          value={item.amountInBaseUnit || 0}
                          onChange={(e) =>
                            updateRecipeItem(idx, {
                              amountInBaseUnit: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground uppercase font-bold">
                          oz
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setDefaultIngredient(idx)}
                        className={`shrink-0 p-2 rounded-lg transition-colors ${
                          item.isDefault
                            ? "bg-amber-500/20 text-amber-400"
                            : "text-muted-foreground hover:text-amber-400 hover:bg-white/5"
                        }`}
                        title={
                          item.isDefault
                            ? "Default ingredient"
                            : "Set as default"
                        }
                      >
                        {item.isDefault ? (
                          <Check size={16} />
                        ) : (
                          <Star size={16} />
                        )}
                      </button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => removeRecipeItem(idx)}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                className="w-full border-dashed border-white/20 hover:bg-white/5 h-12"
                onClick={addRecipeItem}
              >
                <Plus size={16} className="mr-2" />{" "}
                {getTranslation("add_ingredient", language)}
              </Button>
            </>
          )}
        </div>

        <div className="bg-primary/5 rounded-2xl p-6 mb-8 border border-primary/10 grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              {getTranslation("estimated_cost_label", language)}
            </span>
            <div className="text-2xl font-display text-destructive">
              {formatMoney(editing.costPerDrink || 0)}
            </div>
          </div>
          <div className="space-y-1 text-right">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              {getTranslation("analytics", language) || "Analytics"}
            </span>
            <div className="flex flex-col items-end">
              <span
                className={`text-xl font-bold ${editing.actualPrice && editing.costPerDrink && editing.actualPrice > editing.costPerDrink ? "text-emerald-400" : "text-red-400"}`}
              >
                {editing.actualPrice && editing.costPerDrink
                  ? `${(((editing.actualPrice - editing.costPerDrink) / editing.costPerDrink) * 100).toFixed(0)}% Markup`
                  : "--% Markup"}
              </span>
              <span className="text-xs text-muted-foreground">
                {editing.actualPrice && editing.costPerDrink
                  ? `${(((editing.actualPrice - editing.costPerDrink) / editing.actualPrice) * 100).toFixed(0)}% Margin`
                  : "--% Margin"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
          <Button variant="ghost" onClick={onClose}>
            {getTranslation("cancel", language)}
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="px-8">
            {getTranslation("save", language)}
          </Button>
        </div>
      </div>
    </div>
  );
}
