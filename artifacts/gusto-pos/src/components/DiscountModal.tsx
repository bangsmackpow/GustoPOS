import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Percent, DollarSign, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DiscountModalProps {
  orderId: string;
  drinkName: string;
  currentPrice: number;
  currentDiscount: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PRESET_DISCOUNTS = [
  { label: "$2 off", type: "fixed_amount" as const, value: 2 },
  { label: "$5 off", type: "fixed_amount" as const, value: 5 },
  { label: "$10 off", type: "fixed_amount" as const, value: 10 },
  { label: "10%", type: "percentage" as const, value: 10 },
  { label: "15%", type: "percentage" as const, value: 15 },
  { label: "20%", type: "percentage" as const, value: 20 },
];

export function DiscountModal({
  orderId,
  drinkName,
  currentPrice,
  currentDiscount,
  isOpen,
  onClose,
  onSuccess,
}: DiscountModalProps) {
  const [discountType, setDiscountType] = useState<
    "percentage" | "fixed_amount"
  >("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const applyDiscountMutation = useMutation({
    mutationFn: async () => {
      const value = parseFloat(discountValue);
      if (isNaN(value) || value <= 0) {
        throw new Error("Please enter a valid discount value");
      }

      const response = await fetch(`/api/orders/${orderId}/discount`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discountType,
          discountValue: value,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to apply discount");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tabs"] });
      toast({
        title: "Discount Applied",
        description:
          data.message ||
          `Discount of $${data.discountMxn?.toFixed(2)} applied`,
      });
      onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const handleApply = async () => {
    setIsSubmitting(true);
    await applyDiscountMutation.mutateAsync();
    setIsSubmitting(false);
  };

  const calculatePreview = () => {
    const value = parseFloat(discountValue);
    if (isNaN(value) || value <= 0) return currentPrice;

    let discount = 0;
    if (discountType === "percentage") {
      discount = (currentPrice * value) / 100;
    } else {
      discount = value;
    }

    return Math.max(0, currentPrice - discount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="glass p-6 rounded-3xl w-full max-w-md border border-white/10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-display mb-1">Apply Discount</h2>
        <p className="text-sm text-muted-foreground mb-4">{drinkName}</p>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setDiscountType("percentage")}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              discountType === "percentage"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <Percent size={16} /> Percentage
          </button>
          <button
            type="button"
            onClick={() => setDiscountType("fixed_amount")}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              discountType === "fixed_amount"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <DollarSign size={16} /> Fixed Amount
          </button>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex gap-2 flex-wrap">
            {PRESET_DISCOUNTS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setDiscountType(preset.type);
                  setDiscountValue(String(preset.value));
                }}
                className="px-3 py-1.5 rounded-lg text-sm bg-secondary hover:bg-secondary/80 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              Custom {discountType === "percentage" ? "(%)" : "($)"}
            </label>
            <input
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder={discountType === "percentage" ? "15" : "5"}
              className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2 text-foreground"
              min="0"
              step={discountType === "percentage" ? "1" : "0.01"}
            />
          </div>
        </div>

        {discountValue && parseFloat(discountValue) > 0 && (
          <div className="bg-white/5 rounded-xl p-4 mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Original Price:</span>
              <span>${currentPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Current Discount:</span>
              <span className="text-green-400">
                -${currentDiscount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">New Discount:</span>
              <span className="text-green-400">
                -$
                {Math.min(
                  currentPrice,
                  discountType === "percentage"
                    ? (currentPrice * parseFloat(discountValue)) / 100
                    : parseFloat(discountValue),
                ).toFixed(2)}
              </span>
            </div>
            <div className="border-t border-white/10 mt-2 pt-2 flex justify-between font-medium">
              <span>New Price:</span>
              <span className="text-primary">
                ${calculatePreview().toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-medium bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={
              !discountValue || parseFloat(discountValue) <= 0 || isSubmitting
            }
            className="flex-1 py-3 rounded-xl font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              "Applying..."
            ) : (
              <>
                <Check size={18} /> Apply
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
