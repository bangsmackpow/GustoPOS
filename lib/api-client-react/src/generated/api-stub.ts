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
    queryFn: () => customFetch("/api/auth/user").then((r: Response) => r.json() as Promise<GetCurrentAuthUserResponse>),
    ...options,
  });
}

export function useGetUsers(options?: UseQueryOptions<StaffUser[]>) {
  return useQuery<StaffUser[]>({
    queryKey: ["/api/users"],
    queryFn: () => customFetch("/api/users").then((r: Response) => r.json() as Promise<StaffUser[]>),
    ...options,
  });
}

export function useGetUser(id: string, options?: UseQueryOptions<StaffUser>) {
  return useQuery<StaffUser>({
    queryKey: ["/api/users", id],
    queryFn: () => customFetch(`/api/users/${id}`).then((r: Response) => r.json() as Promise<StaffUser>),
    enabled: !!id,
    ...options,
  });
}

export function useGetIngredients(options?: UseQueryOptions<Ingredient[]>) {
  return useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
    queryFn: () => customFetch("/api/ingredients").then((r: Response) => r.json() as Promise<Ingredient[]>),
    ...options,
  });
}

export function useGetIngredient(id: string, options?: UseQueryOptions<Ingredient>) {
  return useQuery<Ingredient>({
    queryKey: ["/api/ingredients", id],
    queryFn: () => customFetch(`/api/ingredients/${id}`).then((r: Response) => r.json() as Promise<Ingredient>),
    enabled: !!id,
    ...options,
  });
}

export function useGetDrinks(options?: UseQueryOptions<Drink[]>) {
  return useQuery<Drink[]>({
    queryKey: ["/api/drinks"],
    queryFn: () => customFetch("/api/drinks").then((r: Response) => r.json() as Promise<Drink[]>),
    ...options,
  });
}

export function useGetDrink(id: string, options?: UseQueryOptions<Drink>) {
  return useQuery<Drink>({
    queryKey: ["/api/drinks", id],
    queryFn: () => customFetch(`/api/drinks/${id}`).then((r: Response) => r.json() as Promise<Drink>),
    enabled: !!id,
    ...options,
  });
}

export function useGetTabs(params?: GetTabsParams, options?: UseQueryOptions<Tab[]>) {
  return useQuery<Tab[]>({
    queryKey: ["/api/tabs", params],
    queryFn: () => customFetch("/api/tabs").then((r: Response) => r.json() as Promise<Tab[]>),
    ...options,
  });
}

export function useGetTab(id: string, options?: UseQueryOptions<TabWithOrders>) {
  return useQuery<TabWithOrders>({
    queryKey: ["/api/tabs", id],
    queryFn: () => customFetch(`/api/tabs/${id}`).then((r: Response) => r.json() as Promise<TabWithOrders>),
    enabled: !!id,
    ...options,
  });
}

export function useGetShifts(options?: UseQueryOptions<Shift[]>) {
  return useQuery<Shift[]>({
    queryKey: ["/api/shifts"],
    queryFn: () => customFetch("/api/shifts").then((r: Response) => r.json() as Promise<Shift[]>),
    ...options,
  });
}

export function useGetActiveShift(options?: UseQueryOptions<ShiftOrNull>) {
  return useQuery<ShiftOrNull>({
    queryKey: ["/api/shifts/active"],
    queryFn: () => customFetch("/api/shifts/active").then((r: Response) => r.json() as Promise<ShiftOrNull>),
    ...options,
  });
}

export function useGetEndOfNightReport(shiftId: string, options?: UseQueryOptions<EndOfNightReport>) {
  return useQuery<EndOfNightReport>({
    queryKey: ["/api/shifts", shiftId, "report"],
    queryFn: () => customFetch(`/api/shifts/${shiftId}/report`).then((r: Response) => r.json() as Promise<EndOfNightReport>),
    enabled: !!shiftId,
    ...options,
  });
}

export function useGetSettings(options?: UseQueryOptions<AppSettings>) {
  return useQuery<AppSettings>({
    queryKey: ["/api/settings"],
    queryFn: () => customFetch("/api/settings").then((r: Response) => r.json() as Promise<AppSettings>),
    ...options,
  });
}

export function useGetTaxRates(options?: UseQueryOptions<GetTaxRatesResponse>) {
  return useQuery<GetTaxRatesResponse>({
    queryKey: ["/api/tax-rates"],
    queryFn: () => customFetch("/api/tax-rates").then((r: Response) => r.json() as Promise<GetTaxRatesResponse>),
    ...options,
  });
}

export function useGetTaxConfig(options?: UseQueryOptions<GetTaxConfigResponse>) {
  return useQuery<GetTaxConfigResponse>({
    queryKey: ["/api/tax-rates/config"],
    queryFn: () => customFetch("/api/tax-rates/config").then((r: Response) => r.json() as Promise<GetTaxConfigResponse>),
    ...options,
  });
}

export function useGetTaxRateByCategory(category: string, options?: UseQueryOptions<TaxRate>) {
  return useQuery<TaxRate>({
    queryKey: ["/api/tax-rates/category", category],
    queryFn: () => customFetch(`/api/tax-rates/category/${category}`).then((r: Response) => r.json() as Promise<TaxRate>),
    enabled: !!category,
    ...options,
  });
}

export function useGetPromoCodeByCode(code: string, options?: UseQueryOptions<PromoCode>) {
  return useQuery<PromoCode>({
    queryKey: ["/api/promo-codes", code],
    queryFn: () => customFetch(`/api/promo-codes/${code}`).then((r: Response) => r.json() as Promise<PromoCode>),
    enabled: !!code,
    ...options,
  });
}

export function useGetStaffShifts(shiftId: string, options?: UseQueryOptions<StaffShift[]>) {
  return useQuery<StaffShift[]>({
    queryKey: ["/api/shifts", shiftId, "staff"],
    queryFn: () => customFetch(`/api/shifts/${shiftId}/staff`).then((r: Response) => r.json() as Promise<StaffShift[]>),
    enabled: !!shiftId,
    ...options,
  });
}

export function useGetStaffPerformance(shiftId: string, options?: UseQueryOptions<StaffPerformance[]>) {
  return useQuery<StaffPerformance[]>({
    queryKey: ["/api/shifts", shiftId, "performance"],
    queryFn: () => customFetch(`/api/shifts/${shiftId}/performance`).then((r: Response) => r.json() as Promise<StaffPerformance[]>),
    enabled: !!shiftId,
    ...options,
  });
}

export function useGetRushes(options?: UseQueryOptions<Rush[]>) {
  return useQuery<Rush[]>({
    queryKey: ["/api/rushes"],
    queryFn: () => customFetch("/api/rushes").then((r: Response) => r.json() as Promise<Rush[]>),
    ...options,
  });
}

export function useListBackups(options?: UseQueryOptions<BackupListResponse>) {
  return useQuery<BackupListResponse>({
    queryKey: ["/api/admin/backups"],
    queryFn: () => customFetch("/api/admin/backups").then((r: Response) => r.json() as Promise<BackupListResponse>),
    ...options,
  });
}

export function useGetBackupSettings(options?: UseQueryOptions<BackupSettings>) {
  return useQuery<BackupSettings>({
    queryKey: ["/api/admin/backup-settings"],
    queryFn: () => customFetch("/api/admin/backup-settings").then((r: Response) => r.json() as Promise<BackupSettings>),
    ...options,
  });
}

// ============ MUTATIONS ============

export function useCreateTab() {
  return useMutation({
    mutationFn: (data: CreateTabBody) =>
      customFetch("/api/tabs", { method: "POST", body: JSON.stringify(data) }).then((r: Response) => r.json() as Promise<Tab>),
  });
}

export function useCloseTab() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CloseTabBody }) =>
      customFetch(`/api/tabs/${id}/close`, { method: "POST", body: JSON.stringify(data) }).then((r: Response) => r.json() as Promise<Tab>),
  });
}

export function useAddOrderToTab() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateOrderBody }) =>
      customFetch(`/api/tabs/${id}/orders`, { method: "POST", body: JSON.stringify(data) }).then((r: Response) => r.json() as Promise<Order>),
  });
}

export function useUpdateOrder() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrderBody }) =>
      customFetch(`/api/orders/${id}`, { method: "PATCH", body: JSON.stringify(data) }).then((r: Response) => r.json() as Promise<Order>),
  });
}

export function useDeleteOrder() {
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      customFetch(`/api/orders/${id}`, { method: "DELETE" }).then((r: Response) => r.json() as Promise<SuccessResponse>),
  });
}

export function useDeleteTabOrder() {
  return useMutation({
    mutationFn: ({ tabId, orderId }: { tabId: string; orderId: string }) =>
      customFetch(`/api/tabs/${tabId}/orders/${orderId}`, { method: "DELETE" }).then((r: Response) => r.json() as Promise<SuccessResponse>),
  });
}

export function useStartShift() {
  return useMutation({
    mutationFn: (data: StartShiftBody) =>
      customFetch("/api/shifts", { method: "POST", body: JSON.stringify(data) }).then((r: Response) => r.json() as Promise<Shift>),
  });
}

export function useCloseShift() {
  return useMutation({
    mutationFn: ({ shiftId, data }: { shiftId: string; data: CloseShiftBody }) =>
      customFetch(`/api/shifts/${shiftId}/close`, { method: "POST", body: JSON.stringify(data) }).then((r: Response) => r.json() as Promise<Shift>),
  });
}

export function useCreateDrink() {
  return useMutation({
    mutationFn: (data: CreateDrinkBody) =>
      customFetch("/api/drinks", { method: "POST", body: JSON.stringify(data) }).then((r: Response) => r.json() as Promise<Drink>),
  });
}

export function useUpdateDrink() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDrinkBody }) =>
      customFetch(`/api/drinks/${id}`, { method: "PATCH", body: JSON.stringify(data) }).then((r: Response) => r.json() as Promise<Drink>),
  });
}

export function useDeleteDrink() {
  return useMutation({
    mutationFn: (id: string) =>
      customFetch(`/api/drinks/${id}`, { method: "DELETE" }).then((r: Response) => r.json() as Promise<SuccessResponse>),
  });
}

export function useCreateIngredient() {
  return useMutation({
    mutationFn: (data: CreateIngredientBody) =>
      customFetch("/api/ingredients", { method: "POST", body: JSON.stringify(data) }).then((r: Response) => r.json() as Promise<Ingredient>),
  });
}

export function useUpdateIngredient() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIngredientBody }) =>
      customFetch(`/api/ingredients/${id}`, { method: "PATCH", body: JSON.stringify(data) }).then((r: Response) => r.json() as Promise<Ingredient>),
  });
}

export function useDeleteIngredient() {
  return useMutation({
    mutationFn: (id: string) =>
      customFetch(`/api/ingredients/${id}`, { method: "DELETE" }).then((r: Response) => r.json() as Promise<SuccessResponse>),
  });
}

export function useModifyOrderIngredient() {
  return useMutation({
    mutationFn: ({ tabId, orderId, data }: { tabId: string; orderId: string; data: ModifyIngredientBody }) =>
      customFetch(`/api/tabs/${tabId}/orders/${orderId}`, { method: "PATCH", body: JSON.stringify(data) }).then((r: Response) => r.json() as Promise<Order>),
  });
}

export function useClockInStaff() {
  return useMutation({
    mutationFn: (data: ClockInBody) =>
      customFetch("/api/shifts/clock-in", { method: "POST", body: JSON.stringify(data) }).then((r: Response) => r.json() as Promise<StaffShift>),
  });
}

export function useClockOutStaff() {
  return useMutation({
    mutationFn: (data: ClockOutBody) =>
      customFetch("/api/shifts/clock-out", { method: "POST", body: JSON.stringify(data) }).then((r: Response) => r.json() as Promise<StaffShift>),
  });
}

export function useApplyPromoCodeToTab() {
  return useMutation({
    mutationFn: ({ tabId, data }: { tabId: string; data: ApplyPromoCodeBody }) =>
      customFetch(`/api/tabs/${tabId}/apply-code`, { method: "PATCH", body: JSON.stringify(data) }).then((r: Response) => r.json() as Promise<ApplyPromoCodeResponse>),
  });
}

export function useCreateUser() {
  return useMutation({
    mutationFn: (data: CreateUserBody) =>
      customFetch("/api/users", { method: "POST", body: JSON.stringify(data) }).then((r: Response) => r.json() as Promise<StaffUser>),
  });
}

export function useUpdateUser() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserBody }) =>
      customFetch(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }).then((r: Response) => r.json() as Promise<StaffUser>),
  });
}

export function useDeleteUser() {
  return useMutation({
    mutationFn: (id: string) =>
      customFetch(`/api/users/${id}`, { method: "DELETE" }).then((r: Response) => r.json() as Promise<SuccessResponse>),
  });
}

export function useUpdateSettings() {
  return useMutation({
    mutationFn: (data: UpdateSettingsBody) =>
      customFetch("/api/settings", { method: "PATCH", body: JSON.stringify(data) }).then((r: Response) => r.json() as Promise<AppSettings>),
  });
}

export function useUpdateTab() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTabBody }) =>
      customFetch(`/api/tabs/${id}`, { method: "PATCH", body: JSON.stringify(data) }).then((r: Response) => r.json() as Promise<Tab>),
  });
}

export function useUpdateTaxRate() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaxRateBody }) =>
      customFetch(`/api/tax-rates/${id}`, { method: "PATCH", body: JSON.stringify(data) }).then((r: Response) => r.json() as Promise<TaxRate>),
  });
}

export function usePostRushes() {
  return useMutation({
    mutationFn: (data: CreateRushBody) =>
      customFetch("/api/rushes", { method: "POST", body: JSON.stringify(data) }).then((r: Response) => r.json() as Promise<Rush>),
  });
}

export function useDeleteRushesId() {
  return useMutation({
    mutationFn: (id: string) =>
      customFetch(`/api/rushes/${id}`, { method: "DELETE" }).then((r: Response) => r.json() as Promise<SuccessResponse>),
  });
}

export function useCreateManualBackup() {
  return useMutation({
    mutationFn: () =>
      customFetch("/api/admin/backups", { method: "POST" }).then((r: Response) => r.json() as Promise<BackupResponse>),
  });
}

export function useRestoreBackup() {
  return useMutation({
    mutationFn: (id: string) =>
      customFetch(`/api/admin/backups/${id}/restore`, { method: "POST" }).then((r: Response) => r.json() as Promise<SuccessResponse>),
  });
}

export function useDeleteBackup() {
  return useMutation({
    mutationFn: (id: string) =>
      customFetch(`/api/admin/backups/${id}`, { method: "DELETE" }).then((r: Response) => r.json() as Promise<SuccessResponse>),
  });
}

export function useBackupOnShiftClose() {
  return useMutation({
    mutationFn: (shiftId: string) =>
      customFetch(`/api/shifts/${shiftId}/backup`, { method: "POST" }).then((r: Response) => r.json() as Promise<SuccessResponse>),
  });
}

export function useStartAutoBackup() {
  return useMutation({
    mutationFn: () =>
      customFetch("/api/admin/auto-backup/start", { method: "POST" }).then((r: Response) => r.json() as Promise<SuccessResponse>),
  });
}

export function useResetDatabase() {
  return useMutation({
    mutationFn: () =>
      customFetch("/api/admin/reset", { method: "POST" }).then((r: Response) => r.json() as Promise<SuccessResponse>),
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
  customFetch("/api/tabs", { method: "POST", body: JSON.stringify(data) }).then((r: Response) => r.json() as Promise<Tab>);
export const closeTab = (id: string, data: CloseTabBody) =>
  customFetch(`/api/tabs/${id}/close`, { method: "POST", body: JSON.stringify(data) }).then((r: Response) => r.json() as Promise<Tab>);
export const addOrderToTab = (tabId: string, data: CreateOrderBody) =>
  customFetch(`/api/tabs/${tabId}/orders`, { method: "POST", body: JSON.stringify(data) }).then((r: Response) => r.json() as Promise<Order>);
export const updateOrder = (id: string, data: UpdateOrderBody) =>
  customFetch(`/api/orders/${id}`, { method: "PATCH", body: JSON.stringify(data) }).then((r: Response) => r.json() as Promise<Order>);
export const deleteOrder = (id: string) =>
  customFetch(`/api/orders/${id}`, { method: "DELETE" }).then((r: Response) => r.json() as Promise<SuccessResponse>);
export const startShift = (data: StartShiftBody) =>
  customFetch("/api/shifts", { method: "POST", body: JSON.stringify(data) }).then((r: Response) => r.json() as Promise<Shift>);
export const closeShift = (shiftId: string, data: CloseShiftBody) =>
  customFetch(`/api/shifts/${shiftId}/close`, { method: "POST", body: JSON.stringify(data) }).then((r: Response) => r.json() as Promise<Shift>);
export const createDrink = (data: CreateDrinkBody) =>
  customFetch("/api/drinks", { method: "POST", body: JSON.stringify(data) }).then((r: Response) => r.json() as Promise<Drink>);
export const updateDrink = (id: string, data: UpdateDrinkBody) =>
  customFetch(`/api/drinks/${id}`, { method: "PATCH", body: JSON.stringify(data) }).then((r: Response) => r.json() as Promise<Drink>);
export const deleteDrink = (id: string) =>
  customFetch(`/api/drinks/${id}`, { method: "DELETE" }).then((r: Response) => r.json() as Promise<SuccessResponse>);
export const modifyOrderIngredient = (tabId: string, orderId: string, data: ModifyIngredientBody) =>
  customFetch(`/api/tabs/${tabId}/orders/${orderId}`, { method: "PATCH", body: JSON.stringify(data) }).then((r: Response) => r.json() as Promise<Order>);
