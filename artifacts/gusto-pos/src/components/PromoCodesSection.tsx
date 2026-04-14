import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Tag,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PromoCode {
  id: string;
  code: string;
  description?: string | null;
  discountType: string;
  discountValue: number;
  maxUses?: number | null;
  currentUses: number;
  expiresAt?: string | null;
  isActive: boolean;
  createdAt: string;
}

interface PromoCodesSectionProps {
  promoCodes: PromoCode[];
  isAdmin: boolean;
  onRefetch: () => void;
}

export function PromoCodesSection({
  promoCodes,
  isAdmin,
  onRefetch,
}: PromoCodesSectionProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    maxUses: "",
    expiresAt: "",
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formData.code,
          description: formData.description || undefined,
          discountType: formData.discountType,
          discountValue: parseFloat(formData.discountValue),
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
          expiresAt: formData.expiresAt
            ? new Date(formData.expiresAt).toISOString()
            : undefined,
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promo-codes"] });
      toast({ title: "Promo code created" });
      closeModal();
      onRefetch();
    },
    onError: (err: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/promo-codes/${editingCode?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formData.code,
          description: formData.description || undefined,
          discountType: formData.discountType,
          discountValue: parseFloat(formData.discountValue),
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
          expiresAt: formData.expiresAt
            ? new Date(formData.expiresAt).toISOString()
            : undefined,
          isActive: true,
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promo-codes"] });
      toast({ title: "Promo code updated" });
      closeModal();
      onRefetch();
    },
    onError: (err: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/promo-codes/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(await response.text());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promo-codes"] });
      toast({ title: "Promo code deleted" });
      onRefetch();
    },
    onError: (err: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await fetch(`/api/promo-codes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) throw new Error(await response.text());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promo-codes"] });
      onRefetch();
    },
    onError: (err: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    },
  });

  const openCreate = () => {
    setEditingCode(null);
    setFormData({
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: "",
      maxUses: "",
      expiresAt: "",
    });
    setShowModal(true);
  };

  const openEdit = (code: PromoCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      description: code.description || "",
      discountType: code.discountType,
      discountValue: String(code.discountValue),
      maxUses: code.maxUses ? String(code.maxUses) : "",
      expiresAt: code.expiresAt ? code.expiresAt.split("T")[0] : "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCode(null);
  };

  const handleSubmit = () => {
    if (!formData.code || !formData.discountValue) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Code and discount value required",
      });
      return;
    }
    if (editingCode) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-display flex items-center gap-2">
          <Tag className="text-primary" /> Promo Codes
        </h3>
        <button
          onClick={openCreate}
          className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm"
        >
          <Plus size={16} /> Add Code
        </button>
      </div>

      {promoCodes.length === 0 ? (
        <p className="text-muted-foreground text-sm">No promo codes yet</p>
      ) : (
        <div className="space-y-2">
          {promoCodes.map((code) => (
            <div
              key={code.id}
              className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
            >
              <div>
                <span className="font-medium">{code.code}</span>
                <span className="text-muted-foreground text-sm ml-2">
                  {code.discountType === "percentage"
                    ? `${code.discountValue}%`
                    : `$${code.discountValue}`}
                  {code.maxUses &&
                    ` (${code.currentUses}/${code.maxUses} used)`}
                </span>
                {code.description && (
                  <p className="text-xs text-muted-foreground">
                    {code.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    toggleMutation.mutate({
                      id: code.id,
                      isActive: !code.isActive,
                    })
                  }
                >
                  {code.isActive ? (
                    <ToggleRight className="text-green-500" size={20} />
                  ) : (
                    <ToggleLeft className="text-muted-foreground" size={20} />
                  )}
                </button>
                <button
                  onClick={() => openEdit(code)}
                  className="p-1 hover:bg-white/10 rounded"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => deleteMutation.mutate(code.id)}
                  className="p-1 hover:bg-white/10 rounded text-destructive"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass p-6 rounded-3xl w-full max-w-md border border-white/10">
            <button onClick={closeModal} className="absolute top-4 right-4">
              <X size={20} />
            </button>
            <h3 className="text-xl font-display mb-4">
              {editingCode ? "Edit" : "Create"} Promo Code
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Code (e.g., SAVE20)"
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2"
              />
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setFormData({ ...formData, discountType: "percentage" })
                  }
                  className={`flex-1 py-2 rounded-xl text-sm ${formData.discountType === "percentage" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                >
                  Percentage
                </button>
                <button
                  onClick={() =>
                    setFormData({ ...formData, discountType: "fixed_amount" })
                  }
                  className={`flex-1 py-2 rounded-xl text-sm ${formData.discountType === "fixed_amount" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                >
                  Fixed Amount
                </button>
              </div>
              <input
                type="number"
                placeholder={
                  formData.discountType === "percentage"
                    ? "Discount %"
                    : "Discount $"
                }
                value={formData.discountValue}
                onChange={(e) =>
                  setFormData({ ...formData, discountValue: e.target.value })
                }
                className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2"
              />
              <input
                type="number"
                placeholder="Max uses (optional)"
                value={formData.maxUses}
                onChange={(e) =>
                  setFormData({ ...formData, maxUses: e.target.value })
                }
                className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2"
              />
              <input
                type="date"
                placeholder="Expires (optional)"
                value={formData.expiresAt}
                onChange={(e) =>
                  setFormData({ ...formData, expiresAt: e.target.value })
                }
                className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={closeModal}
                className="flex-1 py-2 rounded-xl bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground"
              >
                {editingCode ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
