import { useQuery, useQueryClient } from "@tanstack/react-query";

const API_BASE = "/api/inventory";

// ─── Inventory Items ─────────────────────────────────────────────────────────

export function useGetInventoryItems() {
  return useQuery({
    queryKey: ["inventory-items"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/items`);
      if (!res.ok) throw new Error("Failed to fetch inventory items");
      return res.json();
    },
  });
}

export function useGetInventoryLowStock() {
  return useQuery({
    queryKey: ["inventory-low-stock"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/low-stock`);
      if (!res.ok) throw new Error("Failed to fetch low stock");
      return res.json();
    },
  });
}

export function useGetInventoryItem(id: string) {
  return useQuery({
    queryKey: ["inventory-item", id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/items/${id}`);
      if (!res.ok) throw new Error("Failed to fetch item");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useSaveInventoryItem() {
  const qc = useQueryClient();
  return {
    mutate: async (item: any, options?: { onSuccess?: () => void }) => {
      const method = item.id ? "PATCH" : "POST";
      const url = item.id
        ? `${API_BASE}/items/${item.id}`
        : `${API_BASE}/items`;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!res.ok) throw new Error("Failed to save item");
      const data = await res.json();
      qc.invalidateQueries({ queryKey: ["inventory-items"] });
      qc.invalidateQueries({ queryKey: ["inventory-low-stock"] });
      options?.onSuccess?.();
      return data;
    },
  };
}

export function useDeleteInventoryItem() {
  const qc = useQueryClient();
  return {
    mutate: async (id: string) => {
      const res = await fetch(`${API_BASE}/items/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete item");
      qc.invalidateQueries({ queryKey: ["inventory-items"] });
    },
  };
}

export function useWeighInventoryItem() {
  const qc = useQueryClient();
  return {
    mutate: async (id: string, weightG: number, countedByUserId: string) => {
      const res = await fetch(`${API_BASE}/items/${id}/weigh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weightG, countedByUserId }),
      });
      if (!res.ok) throw new Error("Failed to weigh item");
      const data = await res.json();
      qc.invalidateQueries({ queryKey: ["inventory-items"] });
      return data;
    },
  };
}

export function useGetInventoryCounts(itemId: string) {
  return useQuery({
    queryKey: ["inventory-counts", itemId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/items/${itemId}/counts`);
      if (!res.ok) throw new Error("Failed to fetch counts");
      return res.json();
    },
    enabled: !!itemId,
  });
}
