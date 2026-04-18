import { useState, useMemo } from "react";
import { X, AlertCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePosStore } from "@/store";
import { getTranslation, formatMoney } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Ingredient {
  id: string;
  name: string;
  type: string;
  subtype: string | null;
  orderCost: number;
  currentStock: number;
  reservedStock: number;
  baseUnitAmount: number;
}

interface IngredientSubstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeItem: {
    ingredientId: string;
    ingredientName: string;
    amount: number;
    index: number;
  };
  currentIngredient: Ingredient;
  availableIngredients: Ingredient[];
  orderQuantity: number;
  onSubstitute: (
    recipeLineIndex: number,
    newIngredientId: string,
    notes: string,
  ) => Promise<void>;
  isLoading?: boolean;
}

export function IngredientSubstitutionModal({
  isOpen,
  onClose,
  recipeItem,
  currentIngredient,
  availableIngredients,
  orderQuantity,
  onSubstitute,
  isLoading = false,
}: IngredientSubstitutionModalProps) {
  const { language } = usePosStore();
  const { toast } = useToast();
  const [selectedIngredient, setSelectedIngredient] =
    useState<Ingredient | null>(null);
  const [notes, setNotes] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "subtype" | "type">(
    "subtype",
  );

  // Filter ingredients based on mode
  const filteredIngredients = useMemo(() => {
    return availableIngredients.filter((ing) => {
      if (ing.id === currentIngredient.id) return false; // Exclude current

      if (filterMode === "subtype") {
        return ing.subtype === currentIngredient.subtype;
      } else if (filterMode === "type") {
        return ing.type === currentIngredient.type;
      }
      return true; // "all" mode
    });
  }, [availableIngredients, currentIngredient, filterMode]);

  // Calculate price impact
  const oldCost =
    Number(currentIngredient.orderCost) * recipeItem.amount * orderQuantity;
  const newCost = selectedIngredient
    ? Number(selectedIngredient.orderCost) * recipeItem.amount * orderQuantity
    : 0;
  const priceDifference = newCost - oldCost;

  // Check stock availability
  const selectedIngAvailable = selectedIngredient
    ? Number(selectedIngredient.currentStock) +
      Number(selectedIngredient.reservedStock)
    : 0;
  const neededStock = recipeItem.amount * orderQuantity;
  const hasEnoughStock = selectedIngAvailable >= neededStock;

  const handleSubstitute = async () => {
    if (!selectedIngredient) {
      toast({
        variant: "destructive",
        title: getTranslation("error", language),
        description: "Please select an ingredient",
      });
      return;
    }

    if (!hasEnoughStock) {
      toast({
        variant: "destructive",
        title: getTranslation("error", language),
        description: `Insufficient stock. Need ${neededStock}, have ${selectedIngAvailable}`,
      });
      return;
    }

    try {
      await onSubstitute(recipeItem.index, selectedIngredient.id, notes);
      toast({
        title: getTranslation("success", language),
        description: `Substituted with ${selectedIngredient.name}`,
      });
      onClose();
      setSelectedIngredient(null);
      setNotes("");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: getTranslation("error", language),
        description: err.message || "Failed to substitute ingredient",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="glass p-8 rounded-3xl w-full max-w-2xl relative border border-white/10 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-display mb-6 flex items-center gap-2">
          {language === "es"
            ? "Sustituir Ingrediente"
            : "Substitute Ingredient"}
        </h2>

        {/* Current Ingredient */}
        <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-xs font-medium text-white/60 mb-2">
            {language === "es" ? "Ingrediente Actual" : "Current Ingredient"}
          </p>
          <p className="font-medium text-lg">{currentIngredient.name}</p>
          <p className="text-sm text-white/60 mt-2">
            {language === "es" ? "Cantidad requerida: " : "Amount needed: "}
            {neededStock} {currentIngredient.type}
          </p>
          <p className="text-sm text-white/60">
            {language === "es" ? "Costo unitario: " : "Unit cost: "}
            {formatMoney(Number(currentIngredient.orderCost))}
          </p>
        </div>

        {/* Filter Mode Selection */}
        <div className="mb-6">
          <p className="text-sm font-medium text-white/80 mb-3">
            {language === "es" ? "Buscar por" : "Search by"}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterMode("subtype")}
              className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                filterMode === "subtype"
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {language === "es" ? "Subtipo" : "Subtype"}
            </button>
            <button
              onClick={() => setFilterMode("type")}
              className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                filterMode === "type"
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {language === "es" ? "Tipo" : "Type"}
            </button>
            <button
              onClick={() => setFilterMode("all")}
              className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                filterMode === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {language === "es" ? "Todos" : "All"}
            </button>
          </div>
        </div>

        {/* Available Ingredients List */}
        <div className="mb-6">
          <p className="text-sm font-medium text-white/80 mb-3">
            {language === "es"
              ? "Ingredientes Disponibles"
              : "Available Ingredients"}
          </p>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredIngredients.length > 0 ? (
              filteredIngredients.map((ing) => {
                const available =
                  Number(ing.currentStock) + Number(ing.reservedStock);
                const canUse = available >= neededStock;

                return (
                  <button
                    key={ing.id}
                    onClick={() => setSelectedIngredient(ing)}
                    disabled={!canUse}
                    className={`w-full p-3 rounded-xl border transition-all text-left ${
                      selectedIngredient?.id === ing.id
                        ? "bg-primary/30 border-primary"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    } ${!canUse ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-white">{ing.name}</p>
                        <p className="text-xs text-white/60 mt-1">
                          {language === "es" ? "Disponible: " : "Available: "}
                          {available}/{neededStock} {ing.type}
                          {!canUse && (
                            <span className="ml-2 text-red-400">
                              {language === "es"
                                ? "(Insuficiente stock)"
                                : "(Insufficient stock)"}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatMoney(Number(ing.orderCost))}
                        </p>
                        {priceDifference !== 0 &&
                          selectedIngredient?.id === ing.id && (
                            <p
                              className={`text-xs mt-1 ${
                                priceDifference > 0
                                  ? "text-red-400"
                                  : "text-green-400"
                              }`}
                            >
                              {priceDifference > 0 ? "+" : ""}
                              {formatMoney(priceDifference)}
                            </p>
                          )}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-6 text-center text-white/60">
                <AlertCircle className="mx-auto mb-2" size={24} />
                <p className="text-sm">
                  {language === "es"
                    ? "No hay ingredientes disponibles con estos criterios"
                    : "No ingredients available with these criteria"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Selected Ingredient Summary */}
        {selectedIngredient && (
          <div className="mb-6 p-4 rounded-xl bg-primary/20 border border-primary/30">
            <p className="text-sm font-medium text-primary mb-2">
              {language === "es" ? "Resumen del Cambio" : "Change Summary"}
            </p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">
                  {language === "es" ? "Costo Anterior" : "Old Cost"}:
                </span>
                <span className="text-white">{formatMoney(oldCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">
                  {language === "es" ? "Costo Nuevo" : "New Cost"}:
                </span>
                <span className="text-white">{formatMoney(newCost)}</span>
              </div>
              <div className="border-t border-white/10 pt-1 mt-1 flex justify-between font-medium">
                <span className="text-white/60">
                  {language === "es" ? "Diferencia" : "Difference"}:
                </span>
                <span
                  className={
                    priceDifference > 0 ? "text-red-400" : "text-green-400"
                  }
                >
                  {priceDifference > 0 ? "+" : ""}
                  {formatMoney(priceDifference)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white/80 mb-2">
            {language === "es" ? "Notas (Opcional)" : "Notes (Optional)"}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              language === "es"
                ? "Razón del cambio, preferencias del cliente, etc."
                : "Reason for change, customer preference, etc."
            }
            className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-white/40 focus:outline-none focus:border-primary/50 focus:bg-white/15 transition-colors resize-none"
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {language === "es" ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            onClick={handleSubstitute}
            disabled={!selectedIngredient || !hasEnoughStock || isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
          >
            {isLoading
              ? language === "es"
                ? "Sustituyendo..."
                : "Substituting..."
              : language === "es"
                ? "Confirmar Cambio"
                : "Confirm Change"}
          </Button>
        </div>
      </div>
    </div>
  );
}
