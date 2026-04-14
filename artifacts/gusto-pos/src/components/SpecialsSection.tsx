import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Special {
  id: string;
  drinkId?: string | null;
  drinkName?: string | null;
  category?: string | null;
  specialType: string;
  discountType: string;
  discountValue: number;
  daysOfWeek?: string | null;
  startHour?: number | null;
  endHour?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  name?: string | null;
  isCurrentlyActive?: boolean;
  createdAt: string;
}

interface SpecialsSectionProps {
  specials: Special[];
  drinks: any[];
  isAdmin: boolean;
  onRefetch: () => void;
}

const DAYS = [
  { value: "0", label: "Sun" },
  { value: "1", label: "Mon" },
  { value: "2", label: "Tue" },
  { value: "3", label: "Wed" },
  { value: "4", label: "Thu" },
  { value: "5", label: "Fri" },
  { value: "6", label: "Sat" },
];

export function SpecialsSection({
  specials,
  drinks,
  isAdmin,
  onRefetch,
}: SpecialsSectionProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingSpecial, setEditingSpecial] = useState<Special | null>(null);
  const [formData, setFormData] = useState({
    drinkId: "",
    category: "",
    specialType: "manual",
    discountType: "percentage",
    discountValue: "",
    name: "",
    daysOfWeek: [] as string[],
    startHour: "",
    endHour: "",
    startDate: "",
    endDate: "",
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/specials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drinkId: formData.drinkId || undefined,
          category: formData.category || undefined,
          specialType: formData.specialType,
          discountType: formData.discountType,
          discountValue: parseFloat(formData.discountValue),
          name: formData.name || undefined,
          daysOfWeek:
            formData.daysOfWeek.length > 0
              ? formData.daysOfWeek.join(",")
              : undefined,
          startHour: formData.startHour
            ? parseInt(formData.startHour)
            : undefined,
          endHour: formData.endHour ? parseInt(formData.endHour) : undefined,
          startDate: formData.startDate
            ? new Date(formData.startDate).toISOString()
            : undefined,
          endDate: formData.endDate
            ? new Date(formData.endDate).toISOString()
            : undefined,
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/specials"] });
      toast({ title: "Special created" });
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
      const response = await fetch(`/api/specials/${editingSpecial?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drinkId: formData.drinkId || null,
          category: formData.category || null,
          specialType: formData.specialType,
          discountType: formData.discountType,
          discountValue: parseFloat(formData.discountValue),
          name: formData.name || null,
          daysOfWeek:
            formData.daysOfWeek.length > 0
              ? formData.daysOfWeek.join(",")
              : null,
          startHour: formData.startHour ? parseInt(formData.startHour) : null,
          endHour: formData.endHour ? parseInt(formData.endHour) : null,
          startDate: formData.startDate
            ? new Date(formData.startDate).toISOString()
            : null,
          endDate: formData.endDate
            ? new Date(formData.endDate).toISOString()
            : null,
          isActive: true,
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/specials"] });
      toast({ title: "Special updated" });
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
      const response = await fetch(`/api/specials/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await response.text());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/specials"] });
      toast({ title: "Special deleted" });
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
      const response = await fetch(`/api/specials/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) throw new Error(await response.text());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/specials"] });
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
    setEditingSpecial(null);
    setFormData({
      drinkId: "",
      category: "",
      specialType: "manual",
      discountType: "percentage",
      discountValue: "",
      name: "",
      daysOfWeek: [],
      startHour: "",
      endHour: "",
      startDate: "",
      endDate: "",
    });
    setShowModal(true);
  };

  const openEdit = (special: Special) => {
    setEditingSpecial(special);
    setFormData({
      drinkId: special.drinkId || "",
      category: special.category || "",
      specialType: special.specialType,
      discountType: special.discountType,
      discountValue: String(special.discountValue),
      name: special.name || "",
      daysOfWeek: special.daysOfWeek ? special.daysOfWeek.split(",") : [],
      startHour: special.startHour !== null ? String(special.startHour) : "",
      endHour: special.endHour !== null ? String(special.endHour) : "",
      startDate: special.startDate ? special.startDate.split("T")[0] : "",
      endDate: special.endDate ? special.endDate.split("T")[0] : "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSpecial(null);
  };

  const toggleDay = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day].sort(),
    }));
  };

  const handleSubmit = () => {
    if (!formData.discountValue) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Discount value required",
      });
      return;
    }
    if (editingSpecial) {
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
          <Sparkles className="text-primary" /> Specials
        </h3>
        <button
          onClick={openCreate}
          className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm"
        >
          <Plus size={16} /> Add Special
        </button>
      </div>

      {specials.length === 0 ? (
        <p className="text-muted-foreground text-sm">No specials yet</p>
      ) : (
        <div className="space-y-2">
          {specials.map((special) => (
            <div
              key={special.id}
              className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
            >
              <div>
                <span className="font-medium">
                  {special.name || special.drinkName || "Global Special"}
                </span>
                <span className="text-muted-foreground text-sm ml-2">
                  {special.discountType === "percentage"
                    ? `${special.discountValue}%`
                    : `$${special.discountValue}`}
                  {special.isCurrentlyActive && (
                    <span className="ml-2 text-green-500">Active Now</span>
                  )}
                </span>
                {special.daysOfWeek && (
                  <p className="text-xs text-muted-foreground">
                    {special.daysOfWeek
                      .split(",")
                      .map((d) => DAYS.find((day) => day.value === d)?.label)
                      .join(", ")}
                    {special.startHour !== null &&
                      ` ${special.startHour}:00 - ${special.endHour}:00`}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    toggleMutation.mutate({
                      id: special.id,
                      isActive: !special.isActive,
                    })
                  }
                >
                  {special.isActive ? (
                    <ToggleRight className="text-green-500" size={20} />
                  ) : (
                    <ToggleLeft className="text-muted-foreground" size={20} />
                  )}
                </button>
                <button
                  onClick={() => openEdit(special)}
                  className="p-1 hover:bg-white/10 rounded"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => deleteMutation.mutate(special.id)}
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
          <div className="glass p-6 rounded-3xl w-full max-w-lg border border-white/10 max-h-[90vh] overflow-y-auto">
            <button onClick={closeModal} className="absolute top-4 right-4">
              <X size={20} />
            </button>
            <h3 className="text-xl font-display mb-4">
              {editingSpecial ? "Edit" : "Create"} Special
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Special Name (e.g., Happy Hour)"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2"
              />
              <select
                value={formData.drinkId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    drinkId: e.target.value,
                    category: "",
                  })
                }
                className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2"
              >
                <option value="">All Drinks (Global)</option>
                {drinks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value,
                    drinkId: "",
                  })
                }
                className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2"
              >
                <option value="">All Categories</option>
                <option value="cocktail">Cocktails</option>
                <option value="beer">Beer</option>
                <option value="wine">Wine</option>
                <option value="shot">Shots</option>
              </select>
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
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Days of Week
                </label>
                <div className="flex gap-1 flex-wrap">
                  {DAYS.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`px-2 py-1 rounded text-xs ${formData.daysOfWeek.includes(day.value) ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">
                    Start Hour
                  </label>
                  <select
                    value={formData.startHour}
                    onChange={(e) =>
                      setFormData({ ...formData, startHour: e.target.value })
                    }
                    className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2"
                  >
                    <option value="">Any</option>
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i}:00
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">
                    End Hour
                  </label>
                  <select
                    value={formData.endHour}
                    onChange={(e) =>
                      setFormData({ ...formData, endHour: e.target.value })
                    }
                    className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2"
                  >
                    <option value="">Any</option>
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i}:00
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2"
                  />
                </div>
              </div>
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
                {editingSpecial ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
