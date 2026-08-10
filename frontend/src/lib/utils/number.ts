/**
 * Number & Decimal Math Utilities
 */

/**
 * Calculates BMI (Body Mass Index) given weight (kg) and height (cm)
 * Formula: weight (kg) / (height (m) ^ 2)
 */
export function calculateBMI(weightKg: number, heightCm: number): number | null {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) {
    return null;
  }
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Number(bmi.toFixed(2));
}

/**
 * Calculates percentage safely
 */
export function calculatePercentage(part: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Number(((part / total) * 100).toFixed(1));
}

/**
 * Rounds a number to a specific number of decimal places
 */
export function roundTo(val: number, decimals: number = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}
