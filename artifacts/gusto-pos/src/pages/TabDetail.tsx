import React, { useState } from "react";
import { useRoute } from "wouter";
import {
  useGetTab,
  useGetDrinks,
  useGetIngredients,
} from "@workspace/api-client-react";
import {
  useAddOrderMutation,
  useDeleteOrderMutation,
  useCloseTabMutation,
} from "@/hooks/use-pos-mutations";
import { useUpdateOrderMutation } from "@/hooks/use-update-order-mutation";
const updateOrder = useUpdateOrderMutation();
import { usePosStore } from "@/store";
import { formatMoney, getTranslation } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Trash2,
  CreditCard,
  Banknote,
  Coffee,
  Wine,
  Beer,
  Info,
  X,
  Package,
  Loader2,
  Edit2,
} from "lucide-react";
import { Link } from "wouter";

const CATEGORY_ICONS: Record<string, any> = {
  cocktail: Wine,
  beer: Beer,
  wine: Wine,
  shot: Coffee,
  non_alcoholic: Coffee,
  other: Coffee,
};

export default function TabDetail() {
  const [, params] = useRoute("/tabs/:id");
  const tabId = params?.id || "";

  const { language, activeStaff } = usePosStore();
  const {
    data: tabData,
    isLoading: tabLoading,
    error: tabError,
    refetch,
  } = useGetTab(tabId);
  const { data: drinks } = useGetDrinks();
  const { data: ingredients } = useGetIngredients() as {
    data?: any[];
  };

  const addOrder = useAddOrderMutation();
  const deleteOrder = useDeleteOrderMutation();
  const closeTab = useCloseTabMutation();
  const { toast } = useToast();

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [promoCode, setPromoCode] = useState<string>("");
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [viewingRecipe, setViewingRecipe] = useState<any>(null);
  const [productSelector, setProductSelector] = useState<{
    drink: any;
    items: any[];
  } | null>(null);
  const [addQuantity, setAddQuantity] = useState<number>(1);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [deletingOrder, setDeletingOrder] = useState<any>(null);

  if (tabLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="h-12 w-12 animate-spin" />
          <p className="text-lg">Loading tab...</p>
        </div>
      </div>
    );
  }

  if (tabError || !tabData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <p className="text-lg">Failed to load tab</p>
          <Button onClick={() => refetch()}>Retry</Button>
          <Link href="/tabs">
            <Button variant="ghost">Back to Tabs</Button>
          </Link>
        </div>
      </div>
    );
  }

  const categories = [
    "all",
    ...Array.from(new Set(drinks?.map((d) => d.category) || [])),
  ];
  const filteredDrinks =
    drinks?.filter(
      (d) => activeCategory === "all" || d.category === activeCategory,
    ) || [];

  const handleAddDrink = (drink: any) => {
    if (!activeStaff) {
      toast({
        variant: "destructive",
        title: getTranslation("error", language),
        description: "Please enter PIN to switch user first.",
      });
      return;
    }

    const drinkIngredients =
      (drink as any).recipe?.map((r: any) => r.ingredientId).filter(Boolean) ||
      [];
    const matchingItems = (ingredients || []).filter(
      (item: any) =>
        drinkIngredients.includes(item.id) && item.currentStock > 0,
    );

    if (matchingItems.length > 1) {
      setProductSelector({ drink, items: matchingItems });
      return;
    }

    addOrder.mutate(
      { id: tabId, data: { drinkId: drink.id, quantity: addQuantity } },
      {
        onSuccess: () => {
          toast({
            title: getTranslation("success", language),
            description: `${language === "es" && drink.nameEs ? drink.nameEs : drink.name} added to tab.`,
          });
          setAddQuantity(1); // Reset quantity after adding
        },
        onError: (error: any) => {
          toast({
            variant: "destructive",
            title: getTranslation("error", language),
            description: error.message || "Failed to add drink to tab.",
          });
        },
      },
    );
  };

  const handleSelectProduct = (item: any) => {
    if (!productSelector) return;
    addOrder.mutate(
      {
        id: tabId,
        data: { drinkId: productSelector.drink.id, quantity: addQuantity },
      },
      {
        onSuccess: () => {
          toast({
            title: getTranslation("success", language),
            description: `${language === "es" && item.nameEs ? item.nameEs : item.name} added to tab.`,
          });
          setProductSelector(null);
          setAddQuantity(1); // Reset quantity after adding
        },
        onError: (error: any) => {
          toast({
            variant: "destructive",
            title: getTranslation("error", language),
            description: error.message || "Failed to add drink to tab.",
          });
        },
      },
    );
  };

  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      toast({
        variant: "destructive",
        title: getTranslation("error", language),
        description: "Please enter a promo code",
      });
      return;
    }

    try {
      const res = await fetch(`/api/tabs/${tabId}/apply-code`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoCode: promoCode.trim() }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to apply promo code");
      }

      const data = await res.json();
      setAppliedDiscount(data.discountMxn);
      setPromoCode("");
      await refetch();
      toast({
        title: getTranslation("success", language),
        description: getTranslation("code_applied", language),
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: getTranslation("error", language),
        description: e.message,
      });
    }
  };

  const handleCloseTab = (method: "cash" | "card") => {
    closeTab.mutate(
      { id: tabId, data: { paymentMethod: method, tipMxn: tipAmount } },
      {
        onSuccess: () => {
          window.location.href = "/tabs";
        },
        onError: (error: any) => {
          toast({
            variant: "destructive",
            title: getTranslation("error", language),
            description: error.message || "Failed to close tab.",
          });
        },
      },
    );
  };

  const handleDeleteOrder = (order: any) => {
    setDeletingOrder(order);
  };

  const confirmDeleteOrder = () => {
    if (!deletingOrder) return;
    deleteOrder.mutate(
      { id: deletingOrder.id, tabId },
      {
        onSuccess: () => {
          toast({
            title: getTranslation("success", language),
            description: "Order removed from tab.",
          });
          setDeletingOrder(null);
        },
        onError: (error: any) => {
          toast({
            variant: "destructive",
            title: getTranslation("error", language),
            description: error.message || "Failed to remove order.",
          });
        },
      },
    );
  };

  const getStockStatus = (drink: any) => {
    if (!ingredients || !drink.recipe || drink.recipe.length === 0)
      return { status: "available", message: "" };

    let minServings = Infinity;

    for (const r of drink.recipe) {
      const ing = (ingredients as any[]).find((i) => i.id === r.ingredientId);
      if (!ing) continue;

      const amount = Number(r.amountInBaseUnit || 0);
      if (amount <= 0) continue;
      const available = Number(ing.currentStock) / amount;
      if (available < minServings) minServings = available;
    }

    if (minServings <= 0 || isFinite(minServings) === false) {
      return { status: "out", message: "Out of Stock" };
    } else if (minServings < 5) {
      return { status: "low", message: `${Math.floor(minServings)} left` };
    }
    return { status: "available", message: "" };
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
            <h2 className="text-2xl font-display font-bold">
              {tabData.nickname}
            </h2>
            <p className="text-sm text-muted-foreground">
              Server: {tabData.staffUserName}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto -mx-2 px-2 space-y-4">
            {tabData.orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Package size={32} className="mb-3 opacity-20" />
                <p className="text-sm">No items yet</p>
              </div>
            ) : (
              tabData.orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between group"
                >
                  <div>
                    <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {order.quantity}x{" "}
                      {language === "es" && order.drinkNameEs
                        ? order.drinkNameEs
                        : order.drinkName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatMoney(order.unitPriceMxn)} ea
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold">
                      {formatMoney(order.totalPriceMxn)}
                    </span>
                    <button
                      onClick={() => setEditingOrder(order)}
                      disabled={deleteOrder.isPending}
                      className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteOrder(order)}
                      disabled={deleteOrder.isPending}
                      className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Edit Order Quantity Modal */}
          {editingOrder && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-background/80 backdrop-blur animate-in fade-in duration-200">
              <div className="glass p-8 rounded-3xl w-full max-w-xs relative border border-white/10 shadow-2xl">
                <button
                  onClick={() => setEditingOrder(null)}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                >
                  <X size={20} />
                </button>
                <h3 className="text-xl font-bold mb-4">Edit Quantity</h3>
                <div className="flex flex-col gap-4">
                  <label className="text-sm font-medium">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={editingOrder.quantity}
                    onChange={(e) =>
                      setEditingOrder({
                        ...editingOrder,
                        quantity: Math.max(1, Number(e.target.value)),
                      })
                    }
                    className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        updateOrder.mutate(
                          {
                            id: editingOrder.id,
                            tabId: tabData?.id || "",
                            data: { quantity: Number(editingOrder.quantity) },
                          },
                          {
                            onSuccess: () => {
                              setEditingOrder(null);
                              toast({ title: "Order quantity updated" });
                            },
                            onError: (error: any) => {
                              toast({
                                variant: "destructive",
                                title: "Error",
                                description:
                                  error.message ||
                                  "Failed to update order quantity.",
                              });
                            },
                          },
                        );
                      }}
                      disabled={updateOrder.isPending}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingOrder(null)}
                      disabled={updateOrder.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-lg text-muted-foreground">Total</span>
              <span className="text-4xl font-display font-bold text-primary">
                {formatMoney(tabData.totalMxn)}
              </span>
            </div>

            {showCloseDialog ? (
              <div className="space-y-4 pt-4 animate-in slide-in-from-bottom-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-3 block">
                    {getTranslation("promo_code", language) || "Promo Code"}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) =>
                        setPromoCode(e.target.value.toUpperCase())
                      }
                      onKeyPress={(e) => {
                        if (e.key === "Enter") applyPromoCode();
                      }}
                      placeholder={
                        getTranslation("enter_promo_code", language) ||
                        "Enter promo code"
                      }
                      className="flex-1 bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                    />
                    <button
                      onClick={applyPromoCode}
                      className="px-4 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
                    >
                      {getTranslation("apply_code", language) || "Apply"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-3 block">
                    {getTranslation("tip", language) || "Tip"}
                  </label>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[15, 18, 20].map((percent) => (
                      <button
                        key={percent}
                        onClick={() =>
                          setTipAmount(
                            Math.round(
                              ((tabData.totalMxn * percent) / 100) * 100,
                            ) / 100,
                          )
                        }
                        className={`py-2 px-3 rounded-lg font-medium text-sm transition-colors ${
                          tipAmount ===
                          Math.round(
                            ((tabData.totalMxn * percent) / 100) * 100,
                          ) /
                            100
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary border border-white/10 hover:bg-white/5"
                        }`}
                      >
                        {percent}%
                      </button>
                    ))}
                    <button
                      onClick={() => setTipAmount(0)}
                      className={`py-2 px-3 rounded-lg font-medium text-sm transition-colors ${
                        tipAmount === 0
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary border border-white/10 hover:bg-white/5"
                      }`}
                    >
                      None
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={tipAmount}
                    onChange={(e) =>
                      setTipAmount(Math.max(0, parseFloat(e.target.value) || 0))
                    }
                    className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                    placeholder="Custom tip amount"
                  />
                </div>

                <div className="pt-2 border-t border-white/10 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatMoney(tabData.totalMxn)}</span>
                  </div>
                  {appliedDiscount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span className="text-muted-foreground">
                        {getTranslation("discount", language) || "Discount"}
                      </span>
                      <span>-{formatMoney(appliedDiscount)}</span>
                    </div>
                  )}
                  {tipAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {getTranslation("tip", language) || "Tip"}
                      </span>
                      <span>{formatMoney(tipAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg">
                    <span>{getTranslation("total", language) || "Total"}</span>
                    <span className="text-primary">
                      {formatMoney(
                        Math.max(0, tabData.totalMxn - appliedDiscount) +
                          tipAmount,
                      )}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <Button
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleCloseTab("cash")}
                    disabled={closeTab.isPending}
                  >
                    <Banknote className="mr-2" size={18} />{" "}
                    {getTranslation("cash", language)}
                  </Button>
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={() => handleCloseTab("card")}
                    disabled={closeTab.isPending}
                  >
                    <CreditCard className="mr-2" size={18} />{" "}
                    {getTranslation("card", language)}
                  </Button>
                  <Button
                    variant="ghost"
                    className="col-span-2"
                    onClick={() => {
                      setShowCloseDialog(false);
                      setTipAmount(0);
                    }}
                    disabled={closeTab.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                size="lg"
                className="w-full h-14 text-lg"
                disabled={tabData.orders.length === 0}
                onClick={() => setShowCloseDialog(true)}
              >
                {getTranslation("close_tab", language)}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Menu */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-3 rounded-2xl font-medium whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                  : "glass text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              <span className="capitalize">{cat.replace("_", " ")}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-20">
          {filteredDrinks.map((drink) => {
            const Icon = CATEGORY_ICONS[drink.category] || Wine;
            const stock = getStockStatus(drink);
            const isOut = stock.status === "out";
            const isLow = stock.status === "low";

            return (
              <div
                key={drink.id}
                className={`glass p-4 rounded-3xl text-left transition-all duration-200 group border border-transparent flex flex-col h-44 relative overflow-hidden ${
                  isOut
                    ? "opacity-40 grayscale pointer-events-none"
                    : "hover:-translate-y-1 active:scale-95 hover:border-primary/30"
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
                  onClick={() => handleAddDrink(drink)}
                  disabled={!drink.isAvailable || addOrder.isPending || isOut}
                  className="flex-1 flex flex-col w-full text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-3 text-primary group-hover:scale-110 transition-transform relative">
                    <Icon size={20} />
                    {isLow && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-background animate-pulse" />
                    )}
                  </div>
                  <h4 className="font-bold text-foreground leading-tight line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                    {language === "es" && drink.nameEs
                      ? drink.nameEs
                      : drink.name}
                  </h4>

                  {stock.message && (
                    <p
                      className={`text-[10px] font-bold uppercase tracking-wider mb-auto ${isOut ? "text-destructive" : "text-amber-500"}`}
                    >
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
            <button
              onClick={() => setViewingRecipe(null)}
              className="absolute top-6 right-6 text-muted-foreground hover:text-foreground"
            >
              <X size={24} />
            </button>
            <h2 className="text-3xl font-display font-bold text-primary mb-2">
              {language === "es" && viewingRecipe.nameEs
                ? viewingRecipe.nameEs
                : viewingRecipe.name}
            </h2>
            <p className="text-muted-foreground mb-6 italic">
              {language === "es" && viewingRecipe.descriptionEs
                ? viewingRecipe.descriptionEs
                : viewingRecipe.description}
            </p>

            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-white/5 pb-2">
                Recipe
              </h3>
              {viewingRecipe.recipe.length > 0 ? (
                <div className="space-y-3">
                  {viewingRecipe.recipe.map((ing: any, idx: number) => {
                    const stockIng = (ingredients as any[])?.find(
                      (i) => i.id === ing.ingredientId,
                    );
                    const currentStock = stockIng
                      ? Number(stockIng.currentStock)
                      : 0;
                    const amount = Number(ing.amountInBaseUnit || 0);
                    const isLow = currentStock < amount * 5;

                    return (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-lg"
                      >
                        <div className="flex flex-col">
                          <span className="text-foreground font-medium">
                            {language === "es" && ing.ingredientNameEs
                              ? ing.ingredientNameEs
                              : ing.ingredientName}
                          </span>
                          {stockIng && (
                            <span
                              className={`text-[10px] font-bold uppercase ${isLow ? "text-primary" : "text-muted-foreground opacity-50"}`}
                            >
                              Stock: {currentStock.toFixed(0)}
                              {stockIng.baseUnit}
                            </span>
                          )}
                        </div>
                        <div className="text-primary font-mono font-bold">
                          {amount.toFixed(0)}
                          {stockIng?.baseUnit || ""}{" "}
                          <span className="text-muted-foreground text-sm">
                            /
                          </span>{" "}
                          {(amount / 29.57).toFixed(1)}oz
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground py-4 text-center">
                  No recipe details provided.
                </p>
              )}
            </div>

            <Button
              className="w-full mt-8 h-12"
              disabled={getStockStatus(viewingRecipe).status === "out"}
              onClick={() => {
                handleAddDrink(viewingRecipe);
                setViewingRecipe(null);
              }}
            >
              Add to Ticket
            </Button>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass p-8 rounded-3xl w-full max-w-md relative border border-white/10 shadow-2xl">
            <button
              onClick={() => setEditingOrder(null)}
              className="absolute top-6 right-6 text-muted-foreground hover:text-foreground"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-display font-bold text-primary mb-6">
              {getTranslation("edit_quantity", language) || "Edit Quantity"}
            </h2>

            <div className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  {language === "es" && editingOrder.drinkNameEs
                    ? editingOrder.drinkNameEs
                    : editingOrder.drinkName}
                </p>
                <p className="text-xl font-bold text-foreground">
                  {formatMoney(editingOrder.unitPriceMxn)} each
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-3 block">
                  Quantity
                </label>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() =>
                      setEditingOrder({
                        ...editingOrder,
                        quantity: Math.max(1, editingOrder.quantity - 1),
                      })
                    }
                    className="w-12 h-12 rounded-xl bg-secondary border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={editingOrder.quantity}
                    onChange={(e) =>
                      setEditingOrder({
                        ...editingOrder,
                        quantity: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                    className="w-24 text-center bg-secondary border border-white/10 rounded-xl px-4 py-3 text-2xl font-bold"
                    min="1"
                    max="99"
                  />
                  <button
                    onClick={() =>
                      setEditingOrder({
                        ...editingOrder,
                        quantity: Math.min(99, editingOrder.quantity + 1),
                      })
                    }
                    className="w-12 h-12 rounded-xl bg-secondary border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <p className="text-sm text-muted-foreground mb-2">Total</p>
                <p className="text-3xl font-display font-bold text-primary">
                  {formatMoney(
                    editingOrder.unitPriceMxn * editingOrder.quantity,
                  )}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-3 block">
                  {getTranslation("notes", language) || "Notes"}
                </label>
                <textarea
                  value={editingOrder.notes || ""}
                  onChange={(e) =>
                    setEditingOrder({ ...editingOrder, notes: e.target.value })
                  }
                  placeholder={
                    getTranslation("special_requests", language) ||
                    "Special requests, allergies, etc..."
                  }
                  className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4">
                <Button variant="ghost" onClick={() => setEditingOrder(null)}>
                  {getTranslation("cancel", language) || "Cancel"}
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      const res = await fetch(
                        `/api/orders/${editingOrder.id}`,
                        {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            quantity: editingOrder.quantity,
                            notes: editingOrder.notes || null,
                          }),
                        },
                      );
                      if (!res.ok) throw new Error("Failed to update order");
                      await refetch();
                      setEditingOrder(null);
                      toast({
                        title: getTranslation("success", language),
                        description: "Order updated.",
                      });
                    } catch (e: any) {
                      toast({
                        variant: "destructive",
                        title: getTranslation("error", language),
                        description: e.message,
                      });
                    }
                  }}
                >
                  {getTranslation("save", language) || "Save"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Order Confirmation Modal */}
      {deletingOrder && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass p-8 rounded-3xl w-full max-w-md relative border border-white/10 shadow-2xl">
            <button
              onClick={() => setDeletingOrder(null)}
              className="absolute top-6 right-6 text-muted-foreground hover:text-foreground"
            >
              <X size={24} />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <Trash2 size={24} className="text-destructive" />
              <h2 className="text-2xl font-display font-bold text-destructive">
                {getTranslation("remove_item", language) || "Remove Item"}
              </h2>
            </div>

            <p className="text-muted-foreground mb-6">
              Are you sure you want to remove{" "}
              <span className="font-semibold text-foreground">
                {deletingOrder.quantity}x{" "}
                {language === "es" && deletingOrder.drinkNameEs
                  ? deletingOrder.drinkNameEs
                  : deletingOrder.drinkName}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="ghost" onClick={() => setDeletingOrder(null)}>
                {getTranslation("cancel", language) || "Cancel"}
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteOrder}
                disabled={deleteOrder.isPending}
              >
                {deleteOrder.isPending ? "..." : "Remove"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Product Selector Modal */}
      {productSelector && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass p-8 rounded-3xl w-full max-w-md relative border border-white/10 shadow-2xl">
            <button
              onClick={() => setProductSelector(null)}
              className="absolute top-6 right-6 text-muted-foreground hover:text-foreground"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-display font-bold text-primary mb-2">
              {getTranslation("select_product", language) || "Select Product"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {language === "es" && productSelector.drink.nameEs
                ? productSelector.drink.nameEs
                : productSelector.drink.name}
            </p>

            <div className="space-y-3">
              {productSelector.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectProduct(item)}
                  disabled={addOrder.isPending}
                  className="w-full p-4 bg-white/5 rounded-xl border border-white/5 hover:border-primary/30 transition-colors text-left flex justify-between items-center disabled:opacity-50"
                >
                  <div>
                    <p className="font-bold">
                      {language === "es" && item.nameEs
                        ? item.nameEs
                        : item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.currentStock.toFixed(1)} {item.baseUnit}
                    </p>
                  </div>
                  <Package size={20} className="text-primary" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
