// Shim file to re-export all @workspace/api-zod types properly
// This fixes esbuild bundler issues with "export declare const"

import * as generated from "./generated/api";

export const HealthCheckResponse = generated.HealthCheckResponse;
export const GetCurrentAuthUserResponse = generated.GetCurrentAuthUserResponse;
export const CreateDrinkBody = generated.CreateDrinkBody;
export const UpdateDrinkBody = generated.UpdateDrinkBody;
export const CreateIngredientBody = generated.CreateIngredientBody;
export const UpdateIngredientBody = generated.UpdateIngredientBody;
export const CreateTabBody = generated.CreateTabBody;
export const UpdateTabBody = generated.UpdateTabBody;
export const AddOrderToTabBody = generated.AddOrderToTabBody;
export const UpdateOrderBody = generated.UpdateOrderBody;
export const CloseTabBody = generated.CloseTabBody;
export const CloseTabResponse = generated.CloseTabResponse;
export const CreateUserBody = generated.CreateUserBody;
export const UpdateUserBody = generated.UpdateUserBody;
export const UpdateSettingsBody = generated.UpdateSettingsBody;
export const GetPromoCodeByCodeParams = generated.GetPromoCodeByCodeParams;
export const GetPromoCodeByCodeResponse = generated.GetPromoCodeByCodeResponse;
export const ApplyPromoCodeToTabParams = generated.ApplyPromoCodeToTabParams;
export const ApplyPromoCodeToTabBody = generated.ApplyPromoCodeToTabBody;
export const ApplyPromoCodeToTabResponse = generated.ApplyPromoCodeToTabResponse;
export const ClockInStaffBody = generated.ClockInStaffBody;
export const ClockOutStaffBody = generated.ClockOutStaffBody;
export const UpdateTaxRateBody = generated.UpdateTaxRateBody;
export const PostRushesBody = generated.PostRushesBody;
export const CloseShiftResponse = generated.CloseShiftResponse;
export const ModifyOrderIngredientBody = generated.ModifyOrderIngredientBody;
export const StartShiftBody = generated.StartShiftBody;
export const GetTaxRatesResponse = generated.GetTaxRatesResponse;
export const GetTaxConfigResponse = generated.GetTaxConfigResponse;
export const UpdateTaxRateResponse = generated.UpdateTaxRateResponse;
export const GetStaffShiftsResponse = generated.GetStaffShiftsResponse;
export const ClockInStaffResponse = generated.ClockInStaffResponse;
export const ClockOutStaffResponse = generated.ClockOutStaffResponse;
export const GetStaffPerformanceResponse = generated.GetStaffPerformanceResponse;

// Also re-export any remaining exports from generated
export default generated;