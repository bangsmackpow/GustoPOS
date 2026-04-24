import { useQuery, useMutation } from "@tanstack/react-query";
import { customFetch } from "../custom-fetch.js";
import type {
  HealthStatus,
  GetCurrentAuthUserResponse,
  StaffUser,
  Ingredient,
  Drink,
  Tab,
  TabWithOrders,
  Shift,
  ShiftOrNull,
  AppSettings,
  Rush,
  BackupListResponse,
  BackupResponse,
  BackupSettings,
  SuccessResponse,
  EndOfNightReport,
  GetTabsParams,
  GetRushesParams,
  TaxRate,
  GetTaxRatesResponse,
  GetTaxConfigResponse,
  StaffShift,
  StaffPerformance,
  PromoCode,
  CreateTabBody,
  CreateOrderBody,
  CreateUserBody,
  UpdateUserBody,
  CreateDrinkBody,
  UpdateDrinkBody,
  CreateIngredientBody,
  UpdateIngredientBody,
  UpdateOrderBody,
  UpdateTabBody,
  CloseTabBody,
  CloseShiftBody,
  StartShiftBody,
  ModifyIngredientBody,
  ClockInBody,
  ClockOutBody,
  CreateRushBody,
  UpdateSettingsBody,
  UpdateTaxRateBody,
  ApplyPromoCodeBody,
  ApplyPromoCodeResponse,
  Order,
} from "./api.schemas";
import type { UseQueryOptions, UseMutationOptions } from "@tanstack/react-query";

// ============ USE HOOKS ============
// NOTE: customFetch<T>() returns parsed JSON data directly (type T), NOT a raw Response.
// Do NOT chain .then((r) => r.json()) — that was the bug causing the login redirect loop.

export function useHealthCheck(options?: UseQueryOptions<HealthStatus>) {
  return useQuery<HealthStatus>({
    queryKey: ["/api/healthz"],
    queryFn: () => Promise.resolve({ status: "ok" }),
    ...options,
  });
}

export function useGetCurrentAuthUser(options?: UseQueryOptions<GetCurrentAuthUserResponse>) {
  return useQuery<GetCurrentAuthUserResponse>({
    queryKey: ["/api/auth/user"],
    queryFn: () => customFetch<GetCurrentAuthUserResponse>("/api/auth/user"),
    ...options,
  });
}

export function useGetUsers(options?: UseQueryOptions<StaffUser[]>) {
  return useQuery<StaffUser[]>({
    queryKey: ["/api/users"],
    queryFn: () => customFetch<StaffUser[]>("/api/users"),
    ...options,
  });
}

export function useGetUser(id: string, options?: UseQueryOptions<StaffUser>) {
  return useQuery<StaffUser>({
    queryKey: ["/api/users", id],
    queryFn: () => customFetch<StaffUser>(`/api/users/${id}`),
    enabled: !!id,
    ...options,
  });
}

export function useGetIngredients(options?: UseQueryOptions<Ingredient[]>) {
  return useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
    queryFn: () => customFetch<Ingredient[]>("/api/ingredients"),
    ...options,
  });
}

export function useGetIngredient(id: string, options?: UseQueryOptions<Ingredient>) {
  return useQuery<Ingredient>({
    queryKey: ["/api/ingredients", id],
    queryFn: () => customFetch<Ingredient>(`/api/ingredients/${id}`),
    enabled: !!id,
    ...options,
  });
}

export function useGetDrinks(options?: UseQueryOptions<Drink[]>) {
  return useQuery<Drink[]>({
    queryKey: ["/api/drinks"],
    queryFn: () => customFetch<Drink[]>("/api/drinks"),
    ...options,
  });
}

export function useGetDrink(id: string, options?: UseQueryOptions<Drink>) {
  return useQuery<Drink>({
    queryKey: ["/api/drinks", id],
    queryFn: () => customFetch<Drink>(`/api/drinks/${id}`),
    enabled: !!id,
    ...options,
  });
}

export function useGetTabs(params?: GetTabsParams, options?: UseQueryOptions<Tab[]>) {
  return useQuery<Tab[]>({
    queryKey: ["/api/tabs", params],
    queryFn: () => customFetch<Tab[]>("/api/tabs"),
    ...options,
  });
}

export function useGetTab(id: string, options?: UseQueryOptions<TabWithOrders>) {
  return useQuery<TabWithOrders>({
    queryKey: ["/api/tabs", id],
    queryFn: () => customFetch<TabWithOrders>(`/api/tabs/${id}`),
    enabled: !!id,
    ...options,
  });
}

export function useGetShifts(options?: UseQueryOptions<Shift[]>) {
  return useQuery<Shift[]>({
    queryKey: ["/api/shifts"],
    queryFn: () => customFetch<Shift[]>("/api/shifts"),
    ...options,
  });
}

export function useGetActiveShift(options?: UseQueryOptions<ShiftOrNull>) {
  return useQuery<ShiftOrNull>({
    queryKey: ["/api/shifts/active"],
    queryFn: () => customFetch<ShiftOrNull>("/api/shifts/active"),
    ...options,
  });
}

export function useGetEndOfNightReport(shiftId: string, options?: UseQueryOptions<EndOfNightReport>) {
  return useQuery<EndOfNightReport>({
    queryKey: ["/api/shifts", shiftId, "report"],
    queryFn: () => customFetch<EndOfNightReport>(`/api/shifts/${shiftId}/report`),
    enabled: !!shiftId,
    ...options,
  });
}

export function useGetSettings(options?: UseQueryOptions<AppSettings>) {
  return useQuery<AppSettings>({
    queryKey: ["/api/settings"],
    queryFn: () => customFetch<AppSettings>("/api/settings"),
    ...options,
  });
}

export function useGetTaxRates(options?: UseQueryOptions<GetTaxRatesResponse>) {
  return useQuery<GetTaxRatesResponse>({
    queryKey: ["/api/tax-rates"],
    queryFn: () => customFetch<GetTaxRatesResponse>("/api/tax-rates"),
    ...options,
  });
}

export function useGetTaxConfig(options?: UseQueryOptions<GetTaxConfigResponse>) {
  return useQuery<GetTaxConfigResponse>({
    queryKey: ["/api/tax-rates/config"],
    queryFn: () => customFetch<GetTaxConfigResponse>("/api/tax-rates/config"),
    ...options,
  });
}

export function useGetTaxRateByCategory(category: string, options?: UseQueryOptions<TaxRate>) {
  return useQuery<TaxRate>({
    queryKey: ["/api/tax-rates/category", category],
    queryFn: () => customFetch<TaxRate>(`/api/tax-rates/category/${category}`),
    enabled: !!category,
    ...options,
  });
}

export function useGetPromoCodeByCode(code: string, options?: UseQueryOptions<PromoCode>) {
  return useQuery<PromoCode>({
    queryKey: ["/api/promo-codes", code],
    queryFn: () => customFetch<PromoCode>(`/api/promo-codes/${code}`),
    enabled: !!code,
    ...options,
  });
}

export function useGetStaffShifts(shiftId: string, options?: UseQueryOptions<StaffShift[]>) {
  return useQuery<StaffShift[]>({
    queryKey: ["/api/shifts", shiftId, "staff"],
    queryFn: () => customFetch<StaffShift[]>(`/api/shifts/${shiftId}/staff`),
    enabled: !!shiftId,
    ...options,
  });
}

export function useGetStaffPerformance(shiftId: string, options?: UseQueryOptions<StaffPerformance[]>) {
  return useQuery<StaffPerformance[]>({
    queryKey: ["/api/shifts", shiftId, "performance"],
    queryFn: () => customFetch<StaffPerformance[]>(`/api/shifts/${shiftId}/performance`),
    enabled: !!shiftId,
    ...options,
  });
}

export function useGetRushes(options?: UseQueryOptions<Rush[]>) {
  return useQuery<Rush[]>({
    queryKey: ["/api/rushes"],
    queryFn: () => customFetch<Rush[]>("/api/rushes"),
    ...options,
  });
}

export function useListBackups(options?: UseQueryOptions<BackupListResponse>) {
  return useQuery<BackupListResponse>({
    queryKey: ["/api/admin/backups"],
    queryFn: () => customFetch<BackupListResponse>("/api/admin/backups"),
    ...options,
  });
}

export function useGetBackupSettings(options?: UseQueryOptions<BackupSettings>) {
  return useQuery<BackupSettings>({
    queryKey: ["/api/admin/backup-settings"],
    queryFn: () => customFetch<BackupSettings>("/api/admin/backup-settings"),
    ...options,
  });
}

// ============ MUTATIONS ============

export function useCreateTab() {
  return useMutation({
    mutationFn: (data: CreateTabBody) =>
      customFetch<Tab>("/api/tabs", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useCloseTab() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CloseTabBody }) =>
      customFetch<Tab>(`/api/tabs/${id}/close`, { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useAddOrderToTab() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateOrderBody }) =>
      customFetch<Order>(`/api/tabs/${id}/orders`, { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useUpdateOrder() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrderBody }) =>
      customFetch<Order>(`/api/orders/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  });
}

export function useDeleteOrder() {
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      customFetch<SuccessResponse>(`/api/orders/${id}`, { method: "DELETE" }),
  });
}

export function useDeleteTabOrder() {
  return useMutation({
    mutationFn: ({ tabId, orderId }: { tabId: string; orderId: string }) =>
      customFetch<SuccessResponse>(`/api/tabs/${tabId}/orders/${orderId}`, { method: "DELETE" }),
  });
}

export function useStartShift() {
  return useMutation({
    mutationFn: (data: StartShiftBody) =>
      customFetch<Shift>("/api/shifts", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useCloseShift() {
  return useMutation({
    mutationFn: ({ shiftId, data }: { shiftId: string; data: CloseShiftBody }) =>
      customFetch<Shift>(`/api/shifts/${shiftId}/close`, { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useCreateDrink() {
  return useMutation({
    mutationFn: (data: CreateDrinkBody) =>
      customFetch<Drink>("/api/drinks", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useUpdateDrink() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDrinkBody }) =>
      customFetch<Drink>(`/api/drinks/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  });
}

export function useDeleteDrink() {
  return useMutation({
    mutationFn: (id: string) =>
      customFetch<SuccessResponse>(`/api/drinks/${id}`, { method: "DELETE" }),
  });
}

export function useCreateIngredient() {
  return useMutation({
    mutationFn: (data: CreateIngredientBody) =>
      customFetch<Ingredient>("/api/ingredients", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useUpdateIngredient() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIngredientBody }) =>
      customFetch<Ingredient>(`/api/ingredients/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  });
}

export function useDeleteIngredient() {
  return useMutation({
    mutationFn: (id: string) =>
      customFetch<SuccessResponse>(`/api/ingredients/${id}`, { method: "DELETE" }),
  });
}

export function useModifyOrderIngredient() {
  return useMutation({
    mutationFn: ({ tabId, orderId, data }: { tabId: string; orderId: string; data: ModifyIngredientBody }) =>
      customFetch<Order>(`/api/tabs/${tabId}/orders/${orderId}`, { method: "PATCH", body: JSON.stringify(data) }),
  });
}

export function useClockInStaff() {
  return useMutation({
    mutationFn: (data: ClockInBody) =>
      customFetch<StaffShift>("/api/shifts/clock-in", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useClockOutStaff() {
  return useMutation({
    mutationFn: (data: ClockOutBody) =>
      customFetch<StaffShift>("/api/shifts/clock-out", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useApplyPromoCodeToTab() {
  return useMutation({
    mutationFn: ({ tabId, data }: { tabId: string; data: ApplyPromoCodeBody }) =>
      customFetch<ApplyPromoCodeResponse>(`/api/tabs/${tabId}/apply-code`, { method: "PATCH", body: JSON.stringify(data) }),
  });
}

export function useCreateUser() {
  return useMutation({
    mutationFn: (data: CreateUserBody) =>
      customFetch<StaffUser>("/api/users", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useUpdateUser() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserBody }) =>
      customFetch<StaffUser>(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  });
}

export function useDeleteUser() {
  return useMutation({
    mutationFn: (id: string) =>
      customFetch<SuccessResponse>(`/api/users/${id}`, { method: "DELETE" }),
  });
}

export function useUpdateSettings() {
  return useMutation({
    mutationFn: (data: UpdateSettingsBody) =>
      customFetch<AppSettings>("/api/settings", { method: "PATCH", body: JSON.stringify(data) }),
  });
}

export function useUpdateTab() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTabBody }) =>
      customFetch<Tab>(`/api/tabs/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  });
}

export function useUpdateTaxRate() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaxRateBody }) =>
      customFetch<TaxRate>(`/api/tax-rates/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  });
}

export function usePostRushes() {
  return useMutation({
    mutationFn: (data: CreateRushBody) =>
      customFetch<Rush>("/api/rushes", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useDeleteRushesId() {
  return useMutation({
    mutationFn: (id: string) =>
      customFetch<SuccessResponse>(`/api/rushes/${id}`, { method: "DELETE" }),
  });
}

export function useCreateManualBackup() {
  return useMutation({
    mutationFn: () =>
      customFetch<BackupResponse>("/api/admin/backups", { method: "POST" }),
  });
}

export function useRestoreBackup() {
  return useMutation({
    mutationFn: (id: string) =>
      customFetch<SuccessResponse>(`/api/admin/backups/${id}/restore`, { method: "POST" }),
  });
}

export function useDeleteBackup() {
  return useMutation({
    mutationFn: (id: string) =>
      customFetch<SuccessResponse>(`/api/admin/backups/${id}`, { method: "DELETE" }),
  });
}

export function useBackupOnShiftClose() {
  return useMutation({
    mutationFn: (shiftId: string) =>
      customFetch<SuccessResponse>(`/api/shifts/${shiftId}/backup`, { method: "POST" }),
  });
}

export function useStartAutoBackup() {
  return useMutation({
    mutationFn: () =>
      customFetch<SuccessResponse>("/api/admin/auto-backup/start", { method: "POST" }),
  });
}

export function useResetDatabase() {
  return useMutation({
    mutationFn: () =>
      customFetch<SuccessResponse>("/api/admin/reset", { method: "POST" }),
  });
}

// ============ QUERY KEY HELPERS ============
export const getGetTabsQueryKey = () => ["/api/tabs"];
export const getGetTabQueryKey = (id: string) => ["/api/tabs", id];
export const getGetShiftsQueryKey = () => ["/api/shifts"];
export const getGetActiveShiftQueryKey = () => ["/api/shifts/active"];
export const getGetDrinksQueryKey = () => ["/api/drinks"];
export const getGetIngredientsQueryKey = () => ["/api/ingredients"];
export const getGetUsersQueryKey = () => ["/api/users"];
export const getGetSettingsQueryKey = () => ["/api/settings"];
export const getGetRushesQueryKey = () => ["/api/rushes"];
export const getHealthCheckQueryKey = () => ["/api/healthz"];

// Raw function exports
export const createTab = (data: CreateTabBody) =>
  customFetch<Tab>("/api/tabs", { method: "POST", body: JSON.stringify(data) });
export const closeTab = (id: string, data: CloseTabBody) =>
  customFetch<Tab>(`/api/tabs/${id}/close`, { method: "POST", body: JSON.stringify(data) });
export const addOrderToTab = (tabId: string, data: CreateOrderBody) =>
  customFetch<Order>(`/api/tabs/${tabId}/orders`, { method: "POST", body: JSON.stringify(data) });
export const updateOrder = (id: string, data: UpdateOrderBody) =>
  customFetch<Order>(`/api/orders/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteOrder = (id: string) =>
  customFetch<SuccessResponse>(`/api/orders/${id}`, { method: "DELETE" });
export const startShift = (data: StartShiftBody) =>
  customFetch<Shift>("/api/shifts", { method: "POST", body: JSON.stringify(data) });
export const closeShift = (shiftId: string, data: CloseShiftBody) =>
  customFetch<Shift>(`/api/shifts/${shiftId}/close`, { method: "POST", body: JSON.stringify(data) });
export const createDrink = (data: CreateDrinkBody) =>
  customFetch<Drink>("/api/drinks", { method: "POST", body: JSON.stringify(data) });
export const updateDrink = (id: string, data: UpdateDrinkBody) =>
  customFetch<Drink>(`/api/drinks/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteDrink = (id: string) =>
  customFetch<SuccessResponse>(`/api/drinks/${id}`, { method: "DELETE" });
export const modifyOrderIngredient = (tabId: string, orderId: string, data: ModifyIngredientBody) =>
  customFetch<Order>(`/api/tabs/${tabId}/orders/${orderId}`, { method: "PATCH", body: JSON.stringify(data) });
