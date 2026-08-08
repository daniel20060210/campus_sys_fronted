import { post } from '@/utils/request'

export interface ShopMetricsCalcResult {
  totalShops: number
  updatedShops: number
  startedAt: string
  finishedAt: string
  durationMs: number
}

export function triggerShopMetricsCalculation() {
  return post<ShopMetricsCalcResult>('/admin/calculation/shop-metrics/trigger')
}
