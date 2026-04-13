import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createTab,
  closeTab,
  addOrderToTab,
  deleteOrder,
  startShift,
  closeShift,
  createDrink,
  updateDrink,
  getGetTabsQueryKey,
  getGetTabQueryKey,
  getGetShiftsQueryKey,
  getGetActiveShiftQueryKey,
  getGetDrinksQueryKey,
  useGetIngredients,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

// Tabs
export function useCreateTabMutation() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (variables: { data: Parameters<typeof createTab>[0] }) =>
      createTab(variables.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/tabs"] });
      toast({ title: "Tab opened successfully" });
    },
    onError: (err: any) =>
      toast({
        variant: "destructive",
        title: "Failed to open tab",
        description: err.message,
      }),
  });
}

export function useCloseTabMutation() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (variables: {
      id: string;
      data: Parameters<typeof closeTab>[1];
    }) => closeTab(variables.id, variables.data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: getGetTabsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetTabQueryKey(variables.id) });
      toast({ title: "Tab closed and payment recorded" });
    },
  });
}

export function useAddOrderMutation() {
  const qc = useQueryClient();
  const { toast } = useToast();
  // Get ingredients for error lookup
  const { data: ingredients } = useGetIngredients() as { data?: any[] };
  return useMutation({
    mutationFn: (variables: {
      id: string;
      data: Parameters<typeof addOrderToTab>[1];
    }) => addOrderToTab(variables.id, variables.data),
    onMutate: async (newOrder) => {
      await qc.cancelQueries({ queryKey: getGetTabQueryKey(newOrder.id) });
      const previousTab = qc.getQueryData(getGetTabQueryKey(newOrder.id));
      return { previousTab };
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: getGetTabQueryKey(variables.id) });
      qc.invalidateQueries({ queryKey: getGetTabsQueryKey() });
      toast({ title: "Item added to tab" });
    },
    onError: (err, variables, context) => {
      if (context?.previousTab) {
        qc.setQueryData(getGetTabQueryKey(variables.id), context.previousTab);
      }
      let description = (err as any).message;
      // Custom feedback for insufficient ingredient stock
      let ingredientName = null;
      let ingredientId = null;
      if (
        (err as any)?.response?.data?.error?.includes(
          "Insufficient stock for ingredient",
        )
      ) {
        ingredientId = (err as any)?.response?.data?.ingredientId;
      } else if (
        (err as any)?.error?.includes("Insufficient stock for ingredient")
      ) {
        ingredientId = (err as any)?.ingredientId;
      }
      if (ingredientId && Array.isArray(ingredients)) {
        const found = ingredients.find((i) => i.id === ingredientId);
        if (found) {
          ingredientName =
            found.name || found.ingredientName || found.nameEn || found.nameEs;
        }
      }
      if (ingredientId && ingredientName) {
        description = `Not enough stock for ingredient: ${ingredientName}. Please check inventory.`;
      } else if (ingredientId) {
        description = `Not enough stock for ingredient. Please check inventory.`;
      } else if (
        (err as any)?.response?.data?.error?.includes(
          "Insufficient stock for ingredient",
        ) ||
        (err as any)?.error?.includes("Insufficient stock for ingredient")
      ) {
        description =
          "Not enough stock for one or more ingredients. Please check inventory.";
      }
      toast({
        variant: "destructive",
        title: "Failed to add item",
        description,
      });
    },
    retry: 5,
  });
}

export function useDeleteOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (variables: {
      id: string;
      tabId: string;
      reason?: string;
      voidedByUserId?: string;
    }) =>
      fetch(`/api/orders/${variables.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: variables.reason,
          voidedByUserId: variables.voidedByUserId,
        }),
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to void order");
        return res.json();
      }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: getGetTabQueryKey(variables.tabId) });
      qc.invalidateQueries({ queryKey: getGetTabsQueryKey() });
    },
    retry: 5,
  });
}

// Shifts
export function useStartShiftMutation() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (variables: { data: Parameters<typeof startShift>[0] }) =>
      startShift(variables.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getGetActiveShiftQueryKey() });
      qc.invalidateQueries({ queryKey: getGetShiftsQueryKey() });
      toast({ title: "Shift started" });
    },
  });
}

export function useCloseShiftMutation() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (variables: {
      id: string;
      data?: Parameters<typeof closeShift>[1];
    }) => closeShift(variables.id, variables.data ?? {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getGetActiveShiftQueryKey() });
      qc.invalidateQueries({ queryKey: getGetShiftsQueryKey() });
      toast({ title: "Shift closed. End of night report ready." });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to close shift";
      if (errorMessage.includes("open tabs")) {
        // Error will be handled by the caller with the full response
        return;
      }
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    },
  });
}

// Drinks
export function useSaveDrinkMutation() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (variables: { id?: string; data: any }) =>
      variables.id
        ? updateDrink(variables.id, variables.data)
        : createDrink(variables.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getGetDrinksQueryKey() });
      toast({ title: "Drink saved" });
    },
  });
}

// Ingredients (now uses new inventory API)
export function useSaveIngredientMutation() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (variables: { id?: string; data: any }) => {
      const method = variables.id ? "PATCH" : "POST";
      const url = variables.id
        ? `/api/inventory/items/${variables.id}`
        : "/api/inventory/items";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(variables.data),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to save item: ${errText}`);
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory-items"] });
      toast({ title: "Item saved" });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Failed to save item",
        description: err.message || "Unknown error occurred",
      });
    },
  });
}
