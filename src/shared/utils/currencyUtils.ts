/**
 * Utilidades de formateo para campos de moneda y valores en Pesos (COP)
 */

/**
 * Formatea un número o string numérico agregando separadores de miles (ej: 10000 -> "10.000")
 */
export const formatCurrencyInput = (val?: number | string | null): string => {
  if (val === undefined || val === null || val === '') return '';
  const numStr = String(val).replace(/\D/g, '');
  if (!numStr) return '';
  return Number(numStr).toLocaleString('es-CO');
};

/**
 * Convierte un texto con separadores de miles a un valor numérico limpio
 * Ej: "10.000" -> 10000
 */
export const parseCurrencyInput = (val: string): number | undefined => {
  const clean = val.replace(/\D/g, '');
  return clean !== '' ? Number(clean) : undefined;
};
