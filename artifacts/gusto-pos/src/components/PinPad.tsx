import React, { useState } from "react";
import { motion } from "framer-motion";
import { Delete, X, Lock } from "lucide-react";
import { Button } from "./ui/button";
import { useGetUsers } from "@workspace/api-client-react";
import { usePosStore } from "@/store";
import { getTranslation } from "@/lib/utils";

export function PinPad({
  onClose,
  onLogin,
  lockScreen = false,
}: {
  onClose: () => void;
  onLogin?: () => void;
  lockScreen?: boolean;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: users } = useGetUsers();
  const { setActiveStaff, language } = usePosStore();

  const handleNumber = (num: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + num);
      setError(false);
    }
  };

  const handleBackspace = () => setPin((prev) => prev.slice(0, -1));

  const handleSubmit = React.useCallback(async () => {
    if (pin.length !== 4) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/pin-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (data.ok) {
        const matchedUser = users?.find((u) => u.id === data.user.id);
        if (matchedUser) {
          setActiveStaff(matchedUser);
        }
        if (onLogin) {
          onLogin();
        } else {
          onClose();
        }
      } else {
        setError(true);
        setPin("");
      }
    } catch {
      setError(true);
      setPin("");
    } finally {
      setIsSubmitting(false);
    }
  }, [users, pin, setActiveStaff, onLogin, onClose]);

  React.useEffect(() => {
    if (pin.length === 4 && !isSubmitting) {
      handleSubmit();
    }
  }, [pin, handleSubmit, isSubmitting]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass rounded-3xl p-8 max-w-sm w-full relative"
      >
        {!lockScreen && (
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={24} />
          </button>
        )}

        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
              <Lock size={32} />
            </div>
          </div>
          <h2 className="text-2xl font-display text-primary">
            {lockScreen
              ? getTranslation("pos_locked", language)
              : getTranslation("pin_prompt", language)}
          </h2>
          <p className="text-muted-foreground text-sm mt-2">
            {lockScreen
              ? getTranslation("enter_pin_unlock", language)
              : "Enter 4-digit code"}
          </p>
        </div>

        <div className="flex justify-center gap-4 mb-8 h-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                i < pin.length
                  ? "bg-primary shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                  : "bg-secondary"
              } ${error ? "bg-destructive shadow-none" : ""}`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <Button
              key={num}
              variant="secondary"
              size="lg"
              className="h-16 text-2xl font-display rounded-2xl bg-secondary/50 hover:bg-primary hover:text-primary-foreground border border-white/5"
              onClick={() => handleNumber(num.toString())}
            >
              {num}
            </Button>
          ))}
          <div />
          <Button
            variant="secondary"
            size="lg"
            className="h-16 text-2xl font-display rounded-2xl bg-secondary/50 hover:bg-primary hover:text-primary-foreground border border-white/5"
            onClick={() => handleNumber("0")}
          >
            0
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="h-16 text-2xl rounded-2xl bg-secondary/50 hover:bg-destructive hover:text-destructive-foreground border border-white/5"
            onClick={handleBackspace}
          >
            <Delete size={24} />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
