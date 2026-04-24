import React, { useState, useMemo } from "react";
import { useRoute, Link } from "wouter";
import {
  useGetTab,
  useGetDrinks,
  useGetIngredients,
} from "@workspace/api-client-react";
import {
  useAddOrderMutation,
  useDeleteOrderMutation,
  useCloseTabMutation,
  useModifyOrderIngredientMutation,
} from "@/hooks/use-pos-mutations";
import { useUpdateOrderMutation } from "@/hooks/use-update-order-mutation";
import { usePosStore } from "@/store";
import { formatMoney, getTranslation } from "@/lib/utils";
import { ML_PER_OZ } from "@/lib/constants";
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
  Loader2,
  Edit2,
  ShoppingBag,
  Plus,
  Minus,
  Users,
  Tag,
} from "lucide-react";
import { DiscountModal } from "@/components/DiscountModal";
import { IngredientSubstitutionModal } from "@/components/IngredientSubstitutionModal";

const CATEGORY_ICONS: Record<string, any> = {
  cocktail: Wine,
  beer: Beer,
  wine: Wine,
  shot: Coffee,
  non_alcoholic: Coffee,
  other: Coffee,
};

export default function TabDetail() {
  const _updateOrder = useUpdateOrderMutation();
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
  const { data: ingredients } = useGetIngredients();

  const addOrder = useAddOrderMutation();
  const deleteOrder = useDeleteOrderMutation();
  const closeTab = useCloseTabMutation();
  const modifyIngredient = useModifyOrderIngredientMutation();
  const { toast } = useToast();

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [promoCode, setPromoCode] = useState<string>("");
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [viewingRecipe, setViewingRecipe] = useState<any>(null);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [deletingOrder, setDeletingOrder] = useState<any>(null);
  const [voidReason, setVoidReason] = useState<string>("");
  const [managerPin, setManagerPin] = useState("");
  const [managerId, setManagerId] = useState("");
  const [selectedQuantities, setSelectedQuantities] = useState<
    Record<string, number>
  >({});
  const [splitMode, setSplitMode] = useState<"single" | "split">("single");
  const [splitCount, setSplitCount] = useState<number>(2);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "cash" | "card" | null
  >(null);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [discountingOrder, setDiscountingOrder] = useState<any>(null);
  const [substitutingOrder, setSubstitutingOrder] = useState<any>(null);
  const [showSubstitutionModal, setShowSubstitutionModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showBrandSelect, setShowBrandSelect] = useState(false);
  const [selectedDrink, setSelectedDrink] = useState<any>(null);
  const [brandQuantity, setBrandQuantity] = useState(1);
  const [selectedSubtype, setSelectedSubtype] = useState<string | null>(null);
  const [selectedLiquor, setSelectedLiquor] = useState<string | null>(null);
  const [selectedMixer, setSelectedMixer] = useState<string | null>(null);

  const getSelectedQuantity = (drinkId: string) =>
    selectedQuantities[drinkId] || 1;

  const updateSelectedQuantity = (drinkId: string, delta: number) => {
    setSelectedQuantities((prev) => {
      const current = prev[drinkId] || 1;
      const newQty = Math.max(1, Math.min(20, current + delta));
      return { ...prev, [drinkId]: newQty };
    });
  };

  const getGrandTotal = () => {
    return Math.max(0, (tabData?.totalMxn || 0) - appliedDiscount) + tipAmount;
  };

  const getSplitAmount = () => {
    return getGrandTotal() / splitCount;
  };

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

  const _drinkIngredients =
    drinks?.length === 0
      ? []
      : (drinks?.[0] as any)?.recipe
          ?.map((r: any) => r.ingredientId)
          .filter(Boolean) || [];

  const categories = [
    "all",
    ...Array.from(new Set(drinks?.map((d) => d.category) || [])),
  ];

  const HOUSE_FALLBACK_IDS = [
    "shot-tequila", "shot-mezcal", "shot-vodka", "shot-gin",
    "shot-whiskey", "shot-rum", "shot-misc",
    "cocktail-tonic", "cocktail-soda", "cocktail-soft", "cocktail-juice"
  ];

  const filteredDrinks = drinks?.filter((d: any) => {
    if (d.isHidden || !d.isOnMenu) return false;
    if (activeCategory !== "all" && d.category !== activeCategory) return false;

    // Show all drinks that make it through category/menu filters.
    // Out of stock or missing recipes will be visually disabled instead of silently vanishing.
    return true;
  }) || [];

  const handleAddDrink = (drink: any, quantity?: number) => {
    if (!activeStaff) {
      toast({
        variant: "destructive",
        title: getTranslation("error", language),
        description: "Please enter PIN to switch user first.",
      });
      return;
    }

    // For Shot and Cocktail (non-specialty) categories, show brand selection
    if (drink.category === "shot" || drink.category === "cocktail") {
      setSelectedDrink(drink);
      setBrandQuantity(quantity || getSelectedQuantity(drink.id));
      setShowBrandSelect(true);
      return;
    }

    const qty = quantity || getSelectedQuantity(drink.id);
    addOrder.mutate(
      { id: tabId, data: { drinkId: drink.id, quantity: qty } },
      {
        onSuccess: () => {
          toast({
            title: getTranslation("success", language),
            description: `${qty}x ${drink.name} added to tab.`,
          });
          setSelectedQuantities((prev) => ({ ...prev, [drink.id]: 1 }));
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

  // Get unique subtypes from available spirits
  const getAvailableSubtypes = () => {
    if (!ingredients) return [];
    const subtypes = new Set<string>();
    ingredients
      .filter((i: any) => i.type === "spirit" && i.isOnMenu === 1)
      .forEach((i: any) => {
        if (i.subtype) subtypes.add(i.subtype);
      });
    return Array.from(subtypes).sort();
  };

  // Get spirits filtered by selected subtype
  const getLiquorsBySubtype = (subtype: string | null) => {
    if (!ingredients || !subtype) return [];
    return ingredients.filter(
      (i: any) =>
        i.type === "spirit" &&
        i.subtype?.toLowerCase() === subtype.toLowerCase() &&
        i.isOnMenu === 1
    );
  };

  // Get mixer for cocktail (fixed by drinkMixerSubtype)
  const getMixerForCocktail = () => {
    if (!selectedDrink?.drinkMixerSubtype || !ingredients) return null;
    const mixers = ingredients.filter(
      (i: any) =>
        i.type === "mixer" &&
        i.subtype === selectedDrink.drinkMixerSubtype &&
        i.isOnMenu === 1
    );
    return mixers[0] || null; // Return first available mixer
  };

  // Calculate dynamic price
  const calculatePrice = () => {
    if (!ingredients) return 0;
    if (selectedDrink?.drinkSubtype) {
      // Shot: just liquor price
      const liquor = ingredients.find((i: any) => i.id === selectedLiquor);
      return liquor?.menuPricePerServing || 0;
    }
    if (selectedDrink?.drinkMixerSubtype) {
      // Cocktail: liquor + mixer
      const liquor = ingredients.find((i: any) => i.id === selectedLiquor);
      const mixer = getMixerForCocktail();
      return (liquor?.menuPricePerServing || 0) + (mixer?.menuPricePerServing || 0);
    }
    return 0;
  };

  const handleAddBrand = () => {
    if (!selectedDrink || !activeStaff || !selectedLiquor) return;

    const liquor = ingredients?.find((i: any) => i.id === selectedLiquor);
    const mixer = getMixerForCocktail();
    const totalPrice = calculatePrice();

    // Create order data with dynamic price
    const orderData: any = {
      drinkId: selectedDrink.id,
      quantity: brandQuantity,
      unitPriceMxn: totalPrice,
      notes: liquor ? `${liquor.name}${mixer ? ` + ${mixer.name}` : ""}` : undefined,
    };

    addOrder.mutate(
      {
        id: tabId,
        data: orderData,
      },
      {
        onSuccess: () => {
          toast({
            title: getTranslation("success", language),
            description: `${brandQuantity}x ${selectedDrink.name} (${liquor?.name}${mixer ? ` + ${mixer.name}` : ""}) added to tab.`,
          });
          setShowBrandSelect(false);
          setSelectedDrink(null);
          setBrandQuantity(1);
          setSelectedSubtype(null);
          setSelectedLiquor(null);
          setSelectedMixer(null);
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
    const grandTotal = getGrandTotal();

    if (splitMode === "split" && splitCount > 1) {
      const amountPerPerson = Math.round((grandTotal / splitCount) * 100) / 100;
      const tipPerPerson = Math.round((tipAmount / splitCount) * 100) / 100;
      const payments = Array(splitCount)
        .fill(null)
        .map(() => ({
          amountMxn: amountPerPerson,
          tipMxn: tipPerPerson,
          paymentMethod: method,
        }));

      closeTab.mutate(
        { id: tabId, data: { paymentMethod: method, payments } },
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
    } else {
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
    }
  };

  const handleDeleteOrder = (order: any) => {
    setDeletingOrder(order);
  };

  const confirmDeleteOrder = () => {
    if (!deletingOrder) return;
    deleteOrder.mutate(
      {
        id: deletingOrder.id,
        tabId,
        reason: voidReason,
        voidedByUserId: activeStaff?.id,
        managerUserId: activeStaff?.id,
        managerPin: managerPin,
      },
      {
        onSuccess: () => {
          toast({
            title: getTranslation("success", language),
            description: "Order removed from tab.",
          });
          setDeletingOrder(null);
          setVoidReason("");
          setManagerPin("");
          setManagerId("");
        },
        onError: (error: any) => {
          toast({
            variant: "destructive",
            title: getTranslation("error", language),
            description: error?.message || "Failed to void order",
          });
        },
      },
    );
  };

  const getStockStatus = (drink: any) => {
    // Handle drinks with recipes
    if (drink.recipe && drink.recipe.length > 0 && ingredients) {
      let minServingsAvailable = Infinity;
      let hasAnyIngredient = false;

      for (const recipeItem of drink.recipe) {
        if (!recipeItem.ingredientId) continue;

        const ingredient = ingredients.find(
          (i: any) => i.id === recipeItem.ingredientId,
        );
        if (!ingredient) {
          // Ingredient not found - mark as needs setup
          hasAnyIngredient = false;
          break;
        }
        hasAnyIngredient = true;

        const availableStock = Number(ingredient.currentStock) || 0;
        const amountNeeded = Number(recipeItem.amountInBaseUnit) || 0;

        if (amountNeeded <= 0) continue;

        const servingsAvailable = availableStock / amountNeeded;
        minServingsAvailable = Math.min(minServingsAvailable, servingsAvailable);
      }

      // If no valid ingredient found in recipe, or all missing
      if (!hasAnyIngredient) {
        // Try finding house default by subtype as fallback
        const shotIdToSubtype: Record<string, string> = {
          "shot-tequila": "tequila", "shot-mezcal": "mezcal", "shot-vodka": "vodka",
          "shot-gin": "gin", "shot-whiskey": "whiskey", "shot-rum": "rum", "shot-misc": "misc",
        };
        const subtype = shotIdToSubtype[drink.id];
        if (subtype) {
          const houseIngredient = ingredients.find(
            (i: any) => i.subtype?.toLowerCase() === subtype.toLowerCase() && i.isHouseDefault,
          );
          if (houseIngredient && houseIngredient.servingSize) {
            const availableStock = Number(houseIngredient.currentStock) || 0;
            const amountNeeded = houseIngredient.servingSize;
            const servingsAvailable = availableStock / amountNeeded;
            if (servingsAvailable <= 0) return { status: "out", message: "OUT" };
            if (servingsAvailable < 5) return { status: "low", message: `${Math.floor(servingsAvailable)} left` };
            if (servingsAvailable < 15) return { status: "medium", message: `${Math.floor(servingsAvailable)} left` };
            return { status: "available", message: "" };
          }
        }
        return { status: "out", message: "SETUP" };
      }

      if (minServingsAvailable === Infinity || minServingsAvailable <= 0) {
        return { status: "out", message: "OUT" };
      } else if (minServingsAvailable < 5) {
        return { status: "low", message: `${Math.floor(minServingsAvailable)} left` };
      } else if (minServingsAvailable < 15) {
        return { status: "medium", message: `${Math.floor(minServingsAvailable)} left` };
      }

      return { status: "available", message: "" };
    }

    // Handle shots/cocktails without recipes - check for house default ingredient
    if (drink.category === "shot" || drink.category === "cocktail") {
      const shotIdToSubtype: Record<string, string> = {
        "shot-tequila": "tequila", "shot-mezcal": "mezcal", "shot-vodka": "vodka",
        "shot-gin": "gin", "shot-whiskey": "whiskey", "shot-rum": "rum", "shot-misc": "misc",
      };
      const cocktailIdToMixer: Record<string, string> = {
        "cocktail-tonic": "tonic",
        "cocktail-soda": "club_soda",
        "cocktail-soft": "soft_drink",
        "cocktail-juice": "juice",
      };
      const subtype = shotIdToSubtype[drink.id];
      const mixerSubtype = cocktailIdToMixer[drink.id];

      // For cocktails, check if mixer is available
      if (mixerSubtype && ingredients) {
        const mixerIngredients = ingredients.filter(
          (i: any) => i.type === "mixer" && i.subtype === mixerSubtype && i.isOnMenu === 1
        );
        if (mixerIngredients.length === 0) {
          return { status: "out", message: "SETUP" };
        }
        // For cocktails, also need at least one spirit available
        const spiritIngredients = ingredients.filter(
          (i: any) => i.type === "spirit" && i.isOnMenu === 1
        );
        if (spiritIngredients.length === 0) {
          return { status: "out", message: "SETUP" };
        }
        return { status: "available", message: "" };
      }

      if (subtype && ingredients) {
        const houseIngredient = ingredients.find(
          (i: any) => i.subtype?.toLowerCase() === subtype.toLowerCase() && i.isHouseDefault,
        );
        if (houseIngredient && houseIngredient.servingSize) {
          const availableStock = Number(houseIngredient.currentStock) || 0;
          const amountNeeded = houseIngredient.servingSize;
          const servingsAvailable = availableStock / amountNeeded;

          if (servingsAvailable <= 0) return { status: "out", message: "OUT" };
          if (servingsAvailable < 5) return { status: "low", message: `${Math.floor(servingsAvailable)} left` };
          if (servingsAvailable < 15) return { status: "medium", message: `${Math.floor(servingsAvailable)} left` };
          return { status: "available", message: "" };
        }
      }
      return { status: "out", message: "SETUP" };
    }

    // Other drinks (beer, etc.) - if no recipe, show available
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
                <ShoppingBag size={32} className="mb-3 opacity-20" />
                <p className="text-sm">No items yet</p>
              </div>
            ) : (
              tabData.orders.map((order) => (
                <div
                  key={order.id}
                  className={`flex items-center justify-between group ${order.voided ? "opacity-40 line-through" : ""}`}
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
                      {order.voided && order.voidReason && (
                        <span className="ml-2 text-destructive">
                          (Voided: {order.voidReason.replace(/_/g, " ")})
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold">
                      {formatMoney(order.totalPriceMxn)}
                      {order.discountMxn && order.discountMxn > 0 && (
                        <span className="text-xs text-green-400 ml-1 block">
                          (-{formatMoney(order.discountMxn)})
                        </span>
                      )}
                    </span>
                    {!order.voided && (
                      <>
                        <button
                          onClick={() => {
                            setDiscountingOrder(order);
                            setShowDiscountModal(true);
                          }}
                          className="w-8 h-8 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Apply Discount"
                        >
                          <Tag size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setSubstitutingOrder(order);
                            setShowSubstitutionModal(true);
                          }}
                          className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Modify Ingredients"
                        >
                          <Coffee size={14} />
                        </button>
                        <button
                          onClick={() => setEditingOrder(order)}
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
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

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
                      {formatMoney(getGrandTotal())}
                    </span>
                  </div>
                </div>

                {splitMode === "split" && (
                  <div className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">
                        Split {splitCount} ways
                      </span>
                      <button
                        onClick={() => setSplitMode("single")}
                        className="text-xs text-primary hover:underline"
                      >
                        Cancel split
                      </button>
                    </div>
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={() => setSplitCount((c) => Math.max(2, c - 1))}
                        disabled={splitCount <= 2}
                        className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center disabled:opacity-30"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="text-2xl font-bold w-12 text-center">
                        {splitCount}
                      </span>
                      <button
                        onClick={() =>
                          setSplitCount((c) => Math.min(10, c + 1))
                        }
                        disabled={splitCount >= 10}
                        className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center disabled:opacity-30"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <p className="text-center text-primary font-bold text-xl mt-3">
                      {formatMoney(getSplitAmount())} each
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-4">
                  {!showPaymentConfirmation ? (
                    <>
                      <Button
                        size="lg"
                        className={
                          selectedPaymentMethod === "cash"
                            ? "bg-emerald-600 ring-2 ring-white text-white"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        }
                        onClick={() => setSelectedPaymentMethod("cash")}
                      >
                        <Banknote className="mr-2" size={18} />
                        {splitMode === "split"
                          ? `${formatMoney(getSplitAmount())} Cash`
                          : getTranslation("cash", language)}
                      </Button>
                      <Button
                        size="lg"
                        variant="secondary"
                        className={
                          selectedPaymentMethod === "card"
                            ? "ring-2 ring-primary"
                            : ""
                        }
                        onClick={() => setSelectedPaymentMethod("card")}
                      >
                        <CreditCard className="mr-2" size={18} />
                        {splitMode === "split"
                          ? `${formatMoney(getSplitAmount())} Card`
                          : getTranslation("card", language)}
                      </Button>

                      {selectedPaymentMethod && (
                        <Button
                          size="lg"
                          className="col-span-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                          onClick={() => setShowPaymentConfirmation(true)}
                        >
                          {language === "es"
                            ? "Confirmar Pago"
                            : "Confirm Payment"}
                        </Button>
                      )}

                      {splitMode === "single" && (
                        <Button
                          variant="outline"
                          className="col-span-2"
                          onClick={() => {
                            setSplitMode("split");
                            setSplitCount(2);
                          }}
                        >
                          <Users className="mr-2" size={18} />
                          Split Bill
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        className="col-span-2"
                        onClick={() => {
                          setShowCloseDialog(false);
                          setTipAmount(0);
                          setSplitMode("single");
                          setSelectedPaymentMethod(null);
                          setShowPaymentConfirmation(false);
                        }}
                        disabled={closeTab.isPending}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="col-span-2 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {language === "es"
                              ? "Método de pago"
                              : "Payment Method"}
                          </span>
                          <span className="font-bold capitalize">
                            {selectedPaymentMethod}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {language === "es" ? "Subtotal" : "Subtotal"}
                          </span>
                          <span>{formatMoney(tabData.totalMxn)}</span>
                        </div>
                        {appliedDiscount > 0 && (
                          <div className="flex justify-between text-sm text-emerald-400">
                            <span>
                              {language === "es" ? "Descuento" : "Discount"}
                            </span>
                            <span>-{formatMoney(appliedDiscount)}</span>
                          </div>
                        )}
                        {tipAmount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {language === "es" ? "Propina" : "Tip"}
                            </span>
                            <span>{formatMoney(tipAmount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-lg pt-2 border-t border-white/10">
                          <span>{language === "es" ? "Total" : "Total"}</span>
                          <span className="text-primary">
                            {formatMoney(getGrandTotal())}
                          </span>
                        </div>
                      </div>

                      <Button
                        size="lg"
                        className="col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => {
                          if (selectedPaymentMethod) {
                            handleCloseTab(selectedPaymentMethod);
                          }
                        }}
                        disabled={closeTab.isPending}
                      >
                        {closeTab.isPending
                          ? language === "es"
                            ? "Procesando..."
                            : "Processing..."
                          : language === "es"
                            ? `Pagar ${formatMoney(getGrandTotal())}`
                            : `Pay ${formatMoney(getGrandTotal())}`}
                      </Button>

                      <Button
                        variant="outline"
                        className="col-span-2"
                        onClick={() => setShowPaymentConfirmation(false)}
                        disabled={closeTab.isPending}
                      >
                        {language === "es" ? "Atrás" : "Back"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <Button
                size="lg"
                className="w-full h-14 text-lg"
                disabled={tabData.orders.length === 0}
                onClick={() => {
                  setSplitMode("single");
                  setShowCloseDialog(true);
                  setSelectedPaymentMethod(null);
                  setShowPaymentConfirmation(false);
                }}
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
            const selectedQty = getSelectedQuantity(drink.id);

            return (
              <div
                key={drink.id}
                className={`glass p-4 rounded-3xl text-left transition-all duration-200 group border flex flex-col relative overflow-hidden min-h-[220px] ${
                  isOut
                    ? "opacity-70 grayscale-[50%] border-destructive/20"
                    : "hover:-translate-y-1 active:scale-95 border-transparent hover:border-primary/30"
                }`}
              >
                <button
                  className="absolute top-3 right-3 text-muted-foreground hover:text-primary z-10 p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewingRecipe(drink);
                  }}
                  title="View recipe"
                >
                  <Info size={18} />
                </button>

                <div className="flex-1 flex flex-col w-full">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-3 text-primary group-hover:scale-110 transition-transform relative">
                    <Icon size={20} />
                    {isLow && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-background animate-pulse" />
                    )}
                  </div>
                  <h4 className="font-bold text-foreground leading-tight line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                    {drink.name}
                  </h4>

                  {stock.message && (
                    <p
                      className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isOut ? "text-destructive" : stock.status === "medium" ? "text-amber-400" : "text-amber-500"}`}
                    >
                      {stock.message}
                    </p>
                  )}

                  <div className="font-display font-bold text-lg mt-auto pt-2">
                    {formatMoney(drink.actualPrice || drink.suggestedPrice)}
                  </div>
                </div>

                {/* Quantity Selector - Redesigned to be permanently visible */}
                {!isOut ? (
                  <div className="mt-4 flex items-center justify-between bg-secondary/50 rounded-xl p-1 shadow-inner">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateSelectedQuantity(drink.id, -1);
                      }}
                      disabled={selectedQty <= 1}
                      className="w-8 h-8 rounded-lg bg-background flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-30 border border-white/5"
                    >
                      <Minus size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddDrink(drink);
                      }}
                      disabled={addOrder.isPending}
                      className="flex-1 mx-2 h-8 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-1 shadow-sm"
                    >
                      <Plus size={14} />
                      <span>{selectedQty}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateSelectedQuantity(drink.id, 1);
                      }}
                      disabled={selectedQty >= 20}
                      className="w-8 h-8 rounded-lg bg-background flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-30 border border-white/5"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 w-full py-2 bg-destructive/10 text-destructive text-xs font-bold uppercase tracking-wider rounded-xl text-center border border-destructive/20">
                    {stock.message === "SETUP" ? "Setup Needed" : "Out of Stock"}
                  </div>
                )}
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
                    const amount = Number(ing.amountInBaseUnit || 0);

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
                        </div>
                        <div className="text-primary font-mono font-bold">
                          {amount.toFixed(0)}ml
                          <span className="text-muted-foreground text-sm">
                            {" "}
                            /{" "}
                          </span>
                          {(amount / ML_PER_OZ).toFixed(1)}oz
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

            <div className="flex items-center gap-3 mt-8">
              <button
                onClick={() => updateSelectedQuantity(viewingRecipe.id, -1)}
                disabled={getSelectedQuantity(viewingRecipe.id) <= 1}
                className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center hover:bg-white/20 transition-colors disabled:opacity-30"
              >
                <Minus size={20} />
              </button>
              <Button
                className="flex-1 h-12"
                disabled={getStockStatus(viewingRecipe).status === "out"}
                onClick={() => {
                  handleAddDrink(viewingRecipe);
                  setViewingRecipe(null);
                }}
              >
                Add {getSelectedQuantity(viewingRecipe.id)} to Ticket
              </Button>
              <button
                onClick={() => updateSelectedQuantity(viewingRecipe.id, 1)}
                disabled={getSelectedQuantity(viewingRecipe.id) >= 20}
                className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center hover:bg-white/20 transition-colors disabled:opacity-30"
              >
                <Plus size={20} />
              </button>
            </div>
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
              onClick={() => {
                setDeletingOrder(null);
                setVoidReason("");
              }}
              className="absolute top-6 right-6 text-muted-foreground hover:text-foreground"
            >
              <X size={24} />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <Trash2 size={24} className="text-destructive" />
              <h2 className="text-2xl font-display font-bold text-destructive">
                {getTranslation("remove_item", language) || "Void Item"}
              </h2>
            </div>

            <p className="text-muted-foreground mb-4">
              Are you sure you want to void{" "}
              <span className="font-semibold text-foreground">
                {deletingOrder.quantity}x{" "}
                {language === "es" && deletingOrder.drinkNameEs
                  ? deletingOrder.drinkNameEs
                  : deletingOrder.drinkName}
              </span>
              ?
            </p>

            <div className="mb-6">
              <label className="text-sm font-medium mb-2 block">
                Reason for void:
              </label>
              <select
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="w-full p-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none"
              >
                <option value="">Select a reason...</option>
                <option value="customer_changed_mind">
                  {language === "es"
                    ? "Cliente cambió de opinión"
                    : "Customer changed mind"}
                </option>
                <option value="wrong_order">
                  {language === "es" ? "Pedido incorrecto" : "Wrong order"}
                </option>
                <option value="spilled">
                  {language === "es" ? "Derramado/Servido" : "Spilled"}
                </option>
                <option value="comp">
                  {language === "es" ? "Cortesía" : "Comp"}
                </option>
                <option value="other">
                  {language === "es" ? "Otro" : "Other"}
                </option>
              </select>
            </div>

            <div className="mb-6">
              <label className="text-sm font-medium mb-2 block">
                Manager PIN:
              </label>
              <input
                type="password"
                value={managerPin}
                onChange={(e) => setManagerPin(e.target.value)}
                placeholder="Enter manager PIN"
                className="w-full p-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none"
                maxLength={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Required to void an order
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setDeletingOrder(null);
                  setVoidReason("");
                  setManagerPin("");
                }}
              >
                {getTranslation("cancel", language) || "Cancel"}
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteOrder}
                disabled={deleteOrder.isPending || !voidReason}
              >
                {deleteOrder.isPending ? "..." : "Void Order"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDiscountModal && discountingOrder && (
        <DiscountModal
          orderId={discountingOrder.id}
          drinkName={discountingOrder.drinkName}
          currentPrice={
            discountingOrder.unitPriceMxn * discountingOrder.quantity
          }
          currentDiscount={discountingOrder.discountMxn || 0}
          isOpen={true}
          onClose={() => {
            setShowDiscountModal(false);
            setDiscountingOrder(null);
          }}
          onSuccess={() => {
            refetch();
            setShowDiscountModal(false);
            setDiscountingOrder(null);
          }}
        />
      )}

      {showSubstitutionModal &&
        substitutingOrder &&
        drinks &&
        ingredients &&
        (() => {
          const drink = drinks.find(
            (d: any) => d.id === substitutingOrder.drinkId,
          );
          if (!drink || !drink.recipe || drink.recipe.length === 0) {
            return null;
          }

          return (
            <IngredientSubstitutionModal
              isOpen={true}
              onClose={() => {
                setShowSubstitutionModal(false);
                setSubstitutingOrder(null);
              }}
              recipeItem={
                drink.recipe[0]
                  ? {
                      ingredientId: drink.recipe[0].ingredientId || "",
                      ingredientName:
                        drink.recipe[0].ingredientName ||
                        drink.recipe[0].ingredientId ||
                        "Unknown",
                      amount: Number(drink.recipe[0].amountInBaseUnit || 1),
                      index: 0,
                    }
                  : {
                      ingredientId: "",
                      ingredientName: "Unknown",
                      amount: 0,
                      index: 0,
                    }
              }
              currentIngredient={
                (ingredients.find(
                  (i: any) => i.id === drink.recipe[0]?.ingredientId,
                ) as any) || {
                  id: "",
                  name: "Unknown",
                  type: "",
                  subtype: null,
                  orderCost: 0,
                  currentStock: 0,
                  reservedStock: 0,
                  baseUnitAmount: 1,
                }
              }
              availableIngredients={ingredients as any}
              orderQuantity={substitutingOrder.quantity}
              onSubstitute={async (recipeLineIndex, newIngredientId, notes) => {
                await modifyIngredient.mutateAsync({
                  tabId: tabId,
                  orderId: substitutingOrder.id,
                  data: {
                    recipeLineIndex,
                    newIngredientId,
                    notes: notes || undefined,
                  },
                });
                refetch();
                setShowSubstitutionModal(false);
                setSubstitutingOrder(null);
              }}
              isLoading={modifyIngredient.isPending}
            />
          );
        })()}

      {/* Brand Selection Modal for Shot/Cocktail */}
      {showBrandSelect && selectedDrink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm">
          <div className="glass p-6 rounded-3xl w-full max-w-md border border-white/10 max-h-[80vh] overflow-y-auto relative">
            <button
              onClick={() => {
                setShowBrandSelect(false);
                setSelectedDrink(null);
                setSelectedSubtype(null);
                setSelectedLiquor(null);
                setSelectedMixer(null);
              }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X size={24} />
            </button>
            <h2 className="text-xl font-display font-bold mb-2">
              {selectedDrink.name}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Configure your {selectedDrink.category}
            </p>

            {/* Quantity selector */}
            <div className="flex items-center justify-between mb-4 p-3 bg-secondary/50 rounded-xl">
              <span className="font-medium">Quantity:</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setBrandQuantity(Math.max(1, brandQuantity - 1))
                  }
                  className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center"
                >
                  -
                </button>
                <span className="font-bold text-lg w-8 text-center">
                  {brandQuantity}
                </span>
                <button
                  onClick={() =>
                    setBrandQuantity(Math.min(20, brandQuantity + 1))
                  }
                  className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            {/* SHOT: Single dropdown for subtype spirits */}
            {selectedDrink.drinkSubtype && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Select Brand
                  </label>
                  <select
                    value={selectedLiquor || ""}
                    onChange={(e) => setSelectedLiquor(e.target.value || null)}
                    className="w-full p-3 rounded-xl bg-secondary border border-white/10 focus:border-primary focus:outline-none"
                  >
                    <option value="">Choose a brand...</option>
                    {getLiquorsBySubtype(selectedDrink.drinkSubtype).map((ing: any) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} {ing.isHouseDefault ? "★" : ""} - {formatMoney(ing.menuPricePerServing || 0)}
                      </option>
                    ))}
                  </select>
                </div>

                {getLiquorsBySubtype(selectedDrink.drinkSubtype).length === 0 && (
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
                    <p className="text-sm text-destructive">
                      No inventory available for {selectedDrink.drinkSubtype}. Please audit this category.
                    </p>
                  </div>
                )}

                {/* Total Price Display */}
                {selectedLiquor && (
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total per serving:</span>
                      <span className="text-xl font-bold text-primary">
                        {formatMoney(calculatePrice())}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/10">
                      <span className="text-sm text-muted-foreground">Total for {brandQuantity}:</span>
                      <span className="text-2xl font-bold text-emerald-400">
                        {formatMoney(calculatePrice() * brandQuantity)}
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleAddBrand}
                  disabled={!selectedLiquor || getLiquorsBySubtype(selectedDrink.drinkSubtype).length === 0}
                  className="w-full"
                >
                  Add to Tab
                </Button>
              </div>
            )}

            {/* COCKTAIL: Two dropdowns - subtype then brand */}
            {selectedDrink.drinkMixerSubtype && (
              <div className="space-y-4">
                {/* Step 1: Select Subtype */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    1. Select Spirit Type
                  </label>
                  <select
                    value={selectedSubtype || ""}
                    onChange={(e) => {
                      setSelectedSubtype(e.target.value || null);
                      setSelectedLiquor(null); // Reset liquor when subtype changes
                    }}
                    className="w-full p-3 rounded-xl bg-secondary border border-white/10 focus:border-primary focus:outline-none"
                  >
                    <option value="">Choose spirit type...</option>
                    {getAvailableSubtypes().map((subtype) => (
                      <option key={subtype} value={subtype}>
                        {subtype.charAt(0).toUpperCase() + subtype.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Step 2: Select Brand (only if subtype selected) */}
                {selectedSubtype && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      2. Select Brand
                    </label>
                    <select
                      value={selectedLiquor || ""}
                      onChange={(e) => setSelectedLiquor(e.target.value || null)}
                      className="w-full p-3 rounded-xl bg-secondary border border-white/10 focus:border-primary focus:outline-none"
                    >
                      <option value="">Choose a brand...</option>
                      {getLiquorsBySubtype(selectedSubtype).map((ing: any) => (
                        <option key={ing.id} value={ing.id}>
                          {ing.name} {ing.isHouseDefault ? "★" : ""} - {formatMoney(ing.menuPricePerServing || 0)}
                        </option>
                      ))}
                    </select>
                    {getLiquorsBySubtype(selectedSubtype).length === 0 && (
                      <p className="text-xs text-destructive mt-1">
                        No brands available for this type.
                      </p>
                    )}
                  </div>
                )}

                {/* Mixer Display */}
                <div className="p-3 rounded-xl bg-secondary/50 border border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Mixer:</span>
                    <span className="font-medium">
                      {getMixerForCocktail()?.name || "No mixer available"}
                    </span>
                  </div>
                  {getMixerForCocktail() && (
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-muted-foreground">Mixer price:</span>
                      <span className="text-xs">{formatMoney(getMixerForCocktail()?.menuPricePerServing || 0)}</span>
                    </div>
                  )}
                </div>

                {/* No inventory message */}
                {getAvailableSubtypes().length === 0 && (
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
                    <p className="text-sm text-destructive">
                      No spirits available in inventory. Please audit your spirits.
                    </p>
                  </div>
                )}

                {/* Total Price Display */}
                {selectedLiquor && (
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <div className="text-sm text-muted-foreground mb-2">Price breakdown:</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>{ingredients?.find((i: any) => i.id === selectedLiquor)?.name}</span>
                        <span>{formatMoney(ingredients?.find((i: any) => i.id === selectedLiquor)?.menuPricePerServing || 0)}</span>
                      </div>
                      {getMixerForCocktail() && (
                        <div className="flex justify-between">
                          <span>{getMixerForCocktail()?.name}</span>
                          <span>{formatMoney(getMixerForCocktail()?.menuPricePerServing || 0)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/10">
                      <span className="font-medium">Total per serving:</span>
                      <span className="text-xl font-bold text-primary">
                        {formatMoney(calculatePrice())}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/10">
                      <span className="text-sm text-muted-foreground">Total for {brandQuantity}:</span>
                      <span className="text-2xl font-bold text-emerald-400">
                        {formatMoney(calculatePrice() * brandQuantity)}
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleAddBrand}
                  disabled={!selectedLiquor || !selectedSubtype}
                  className="w-full"
                >
                  Add to Tab
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
