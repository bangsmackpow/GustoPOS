import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateOrder,
  getGetTabQueryKey,
  getGetTabsQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export function useUpdateOrderMutation() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (variables: {
      id: string;
      tabId: string;
      data: { quantity?: number; notes?: string };
    }) => updateOrder(variables.id, variables.data),
    onSuccess: (order, variables) => {
      qc.invalidateQueries({ queryKey: getGetTabQueryKey(variables.tabId) });
      qc.invalidateQueries({ queryKey: getGetTabsQueryKey() });
      toast({ title: "Order updated" });
    },
    onError: (err: any) =>
      toast({
        variant: "destructive",
        title: "Failed to update order",
        description: err.message,
      }),
  });
}
