/**
 * ESG 포집량 — 컨트롤러 `oil_level` 기반 (실시간 모니터링)
 * 0 → 유증 0kg, 1 → 유증 50kg
 */
export const ESG_OIL_LEVEL_FULL_KG = 50;

export interface PowerpackEsgMetrics {
  oilCollectedKg: number;
  wasteOilCollectedKg: number;
  totalCollectedKg: number;
}

export function computeEsgFromOilLevel(oilLevel: number): PowerpackEsgMetrics {
  const oilCollectedKg = oilLevel === 1 ? ESG_OIL_LEVEL_FULL_KG : 0;
  const wasteOilCollectedKg = oilCollectedKg * 2;
  const totalCollectedKg = oilCollectedKg + wasteOilCollectedKg;
  return { oilCollectedKg, wasteOilCollectedKg, totalCollectedKg };
}
