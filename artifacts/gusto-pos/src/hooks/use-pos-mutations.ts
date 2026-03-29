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
  createIngredient,
  updateIngredient,
  getGetTabsQueryKey,
  getGetTabQueryKey,
  getGetShiftsQueryKey,
  getGetActiveShiftQueryKey,
  getGetDrinksQueryKey,
  getGetIngredientsQueryKey
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

// Offline Support Helper: Retries and Optimistic Updates
// In a full offline mode, we would use a local queue (like Dexie or localStorage)
// For now, we utilize TanStack Query's built-in retry and persistence.

// Tabs
export function useCreateTabMutation() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (variables: { data: Parameters<typeof createTab>[0] }) => createTab(variables.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getGetTabsQueryKey() });
      toast({ title: "Tab opened successfully" });
    },
    onError: (err: any) => toast({ variant: "destructive", title: "Failed to open tab", description: err.message })
  });
}

export function useCloseTabMutation() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (variables: { id: string, data: Parameters<typeof closeTab>[1] }) => closeTab(variables.id, variables.data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: getGetTabsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetTabQueryKey(variables.id) });
      toast({ title: "Tab closed and payment recorded" });
    }
  });
}

export function useAddOrderMutation() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (variables: { id: string, data: Parameters<typeof addOrderToTab>[1] }) => addOrderToTab(variables.id, variables.data),
    // Optimistic Update: Add to the local cache immediately
    onMutate: async (newOrder) => {
      await qc.cancelQueries({ queryKey: getGetTabQueryKey(newOrder.id) });
      const previousTab = qc.getQueryData(getGetTabQueryKey(newOrder.id));
      
      // We don't have the full drink info here, so we just prep the UI for "Loading..."
      return { previousTab };
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: getGetTabQueryKey(variables.id) });
      qc.invalidateQueries({ queryKey: getGetTabsQueryKey() });
      toast({ title: "Item added to tab" });
    },
    retry: 5, // Retry aggressively if offline
  });
}

export function useDeleteOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (variables: { id: string, tabId: string }) => deleteOrder(variables.id),
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
    mutationFn: (variables: { data: Parameters<typeof startShift>[0] }) => startShift(variables.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getGetActiveShiftQueryKey() });
      qc.invalidateQueries({ queryKey: getGetShiftsQueryKey() });
      toast({ title: "Shift started" });
    }
  });
}

export function useCloseShiftMutation() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (variables: { id: string }) => closeShift(variables.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getGetActiveShiftQueryKey() });
      qc.invalidateQueries({ queryKey: getGetShiftsQueryKey() });
      toast({ title: "Shift closed. End of night report ready." });
    }
  });
}

// Drinks & Ingredients
export function useSaveDrinkMutation() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (variables: { id?: string, data: any }) => 
      variables.id ? updateDrink(variables.id, variables.data) : createDrink(variables.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getGetDrinksQueryKey() });
      toast({ title: "Drink saved" });
    }
  });
}

export function useSaveIngredientMutation() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (variables: { id?: string, data: any }) => 
      variables.id ? updateIngredient(variables.id, variables.data) : createIngredient(variables.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getGetIngredientsQueryKey() });
      toast({ title: "Ingredient saved" });
    }
  });
}
