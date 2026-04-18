import { useState } from "react";
import { X, DollarSign, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePosStore } from "@/store";

interface CashboxVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (expectedCashMxn: number) => void;
  isLoading?: boolean;
}

export function CashboxVerificationModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: CashboxVerificationModalProps) {
  const [expectedCash, setExpectedCash] = useState("");
  const { language } = usePosStore();

  if (!isOpen) return null;

  const handleConfirm = () => {
    const value = parseFloat(expectedCash);
    if (isNaN(value) || value < 0) {
      alert(
        language === "es"
          ? "Por favor ingresa una cantidad válida"
          : "Please enter a valid amount",
      );
      return;
    }
    onConfirm(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirm();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-3xl p-8 max-w-md w-full mx-4 border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
              <DollarSign size={20} />
            </div>
            <h2 className="text-xl font-semibold text-white">
              {language === "es" ? "Verificar Caja" : "Verify Cashbox"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Description */}
        <p className="text-white/70 text-sm mb-6">
          {language === "es"
            ? "Ingresa la cantidad inicial de efectivo en la caja para empezar el turno."
            : "Enter the starting amount of cash in the register to start the shift."}
        </p>

        {/* Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white/80 mb-2">
            {language === "es"
              ? "Efectivo esperado (MXN)"
              : "Expected Cash (MXN)"}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">
              $
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={expectedCash}
              onChange={(e) => setExpectedCash(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="0.00"
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-8 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-amber-400/50 focus:bg-white/15 transition-colors"
              autoFocus
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={onClose}
            disabled={isLoading}
          >
            {language === "es" ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white"
            onClick={handleConfirm}
            disabled={isLoading || !expectedCash}
          >
            <Check size={16} className="mr-2" />
            {language === "es" ? "Confirmar" : "Confirm"}
          </Button>
        </div>
      </div>
    </div>
  );
}
