/**
 * 广告 V2 管理端 API
 */
import { get, post, put, del } from '@/utils/request'
import type { AdminAdCreateDTO, AdminAdQueryParams, AdminAdvertisementVO } from '@/types'

/**
 * 创建广告
 */
export function createAd(data: AdminAdCreateDTO) {
  return post<number>('/admin/ad/v2', data)
}

/**
 * 更新广告
 */
export function updateAd(id: number, data: Partial<AdminAdCreateDTO> & { status?: number }) {
  return put<void>(`/admin/ad/v2/${id}`, data)
}

/**
 * 审核广告申请
 */
export function auditAd(id: number, data: { passed: boolean; rejectReason?: string }) {
  return put<void>(`/admin/ad/v2/${id}/audit`, data)
}

/**
 * 分页查询广告列表
 */
export function listAds(params: AdminAdQueryParams) {
  return get<{ list: AdminAdvertisementVO[]; total: number; pageNum: number; pageSize: number }>(
    '/admin/ad/v2',
    { params }
  )
}

/**
 * 获取广告详情
 */
export function getAdById(id: number) {
  return get<AdminAdvertisementVO>(`/admin/ad/v2/${id}`)
}

/**
 * 删除广告（软删除）
 */
export function deleteAd(id: number) {
  return del<void>(`/admin/ad/v2/${id}`)
}

/**
 * 获取当前推流中的店铺ID列表
 */
export function getPromotedShopIds(schoolId?: number) {
  return get<number[]>('/admin/ad/v2/promoted-shop-ids', {
    params: schoolId != null ? { schoolId } : undefined,
  })
}
