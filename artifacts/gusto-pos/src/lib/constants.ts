export const ML_PER_OZ = 29.5735;
export const OZ_PER_ML = 1 / ML_PER_OZ;

export const CONVERSION = {
  mlToOz: (ml: number): number => ml * OZ_PER_ML,
  ozToMl: (oz: number): number => oz * ML_PER_OZ,
} as const;
