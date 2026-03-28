import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  createTab, 
  updateTab, 
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

// Tabs
export function useCreateTabMutation() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: createTab,
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
    mutationFn: ({ id, data }: Parameters<typeof closeTab>[0] & { data: Parameters<typeof closeTab>[1] }) => closeTab(id, data),
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
    mutationFn: ({ id, data }: Parameters<typeof addOrderToTab>[0] & { data: Parameters<typeof addOrderToTab>[1] }) => addOrderToTab(id, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: getGetTabQueryKey(variables.id) });
      qc.invalidateQueries({ queryKey: getGetTabsQueryKey() });
      toast({ title: "Item added to tab" });
    }
  });
}

export function useDeleteOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string, tabId: string }) => deleteOrder(id),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: getGetTabQueryKey(variables.tabId) });
      qc.invalidateQueries({ queryKey: getGetTabsQueryKey() });
    }
  });
}

// Shifts
export function useStartShiftMutation() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: startShift,
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
    mutationFn: closeShift,
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
    mutationFn: ({ id, data }: { id?: string, data: any }) => 
      id ? updateDrink(id, data) : createDrink(data),
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
    mutationFn: ({ id, data }: { id?: string, data: any }) => 
      id ? updateIngredient(id, data) : createIngredient(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getGetIngredientsQueryKey() });
      toast({ title: "Ingredient saved" });
    }
  });
}
