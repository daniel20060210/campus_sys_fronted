/**
 * 店铺管理相关API
 */
import { get, post, put, del } from '@/utils/request'
import type { PageResponse, PageParams, Shop } from '@/types'

/**
 * 店铺列表
 */
export interface ShopListParams extends PageParams {
  keyword?: string
  /** 1-校内堂食 2-校外堂食 3-外卖 */
  shopType?: number
  /** 营业状态：0-休息中 1-营业中 2-已关闭 */
  status?: number
}

export function getShopList(params: ShopListParams) {
  return get<PageResponse<Shop>>('/admin/shops/page', { params })
}

/**
 * 店铺详情
 */
export function getShopDetail(id: number) {
  return get<Shop>(`/admin/shops/${id}`)
}

/**
 * 更新店铺信息
 */
export function updateShop(id: number, data: any) {
  return put(`/admin/shops/${id}`, data)
}

/**
 * 删除店铺
 */
export function deleteShop(id: number) {
  return del(`/admin/shops/${id}`)
}

/**
 * 店铺申请列表
 */
export interface ShopApplicationListParams extends PageParams {
  status?: number
  shopType?: number
  keyword?: string
}

export function getShopApplications(params: ShopApplicationListParams) {
  return get<PageResponse<any>>('/admin/shops/applications/page', { params })
}

/**
 * 店铺申请详情
 */
export function getShopApplicationDetail(id: number) {
  return get<any>(`/admin/shops/applications/${id}`)
}

/**
 * 通过店铺申请
 */
export function approveShopApplication(id: number) {
  return put(`/admin/shops/applications/${id}/approve`)
}

/**
 * 拒绝店铺申请（后端使用 @RequestParam，需通过 query 传参）
 */
export function rejectShopApplication(id: number, data: { rejectReason: string; rejectNote?: string }) {
  return put(`/admin/shops/applications/${id}/reject`, null, {
    params: { rejectReason: data.rejectReason, rejectNote: data.rejectNote },
  })
}

/**
 * 店铺变更提案列表
 */
export interface ShopProposalListParams extends PageParams {
  status?: number
  keyword?: string
}

export function getShopChangeProposals(params: ShopProposalListParams) {
  return get<PageResponse<any>>('/admin/shops/proposals/page', { params })
}

/**
 * 店铺变更提案详情
 */
export function getShopChangeProposalDetail(id: number) {
  return get<any>(`/admin/shops/proposals/${id}`)
}

/**
 * 通过店铺变更提案
 */
export function approveShopChangeProposal(id: number) {
  return put(`/admin/shops/proposals/${id}/approve`)
}

/**
 * 拒绝店铺变更提案
 */
export function rejectShopChangeProposal(id: number, data: { rejectReason: string; rejectNote?: string }) {
  return put(`/admin/shops/proposals/${id}/reject`, null, {
    params: { rejectReason: data.rejectReason, rejectNote: data.rejectNote },
  })
}

/**
 * 上传店铺图片
 */
export function uploadShopImage(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return post<string>('/shop/load-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// ==================== 商家店铺绑定申请审核 ====================

/**
 * 商家绑定申请列表查询参数
 */
export interface MerchantBindingListParams extends PageParams {
  /** 0-待审核 1-已通过 2-已拒绝 */
  status?: number
  keyword?: string
}

/**
 * 分页查询商家绑定申请
 */
export function getMerchantBindings(params: MerchantBindingListParams) {
  return get<PageResponse<any>>('/admin/shops/merchant-bindings/page', { params })
}

/**
 * 通过商家绑定申请
 */
export function approveMerchantBinding(id: number) {
  return put(`/admin/shops/merchant-bindings/${id}/approve`)
}

/**
 * 拒绝商家绑定申请
 */
export function rejectMerchantBinding(id: number, rejectReason: string) {
  return put(`/admin/shops/merchant-bindings/${id}/reject`, null, {
    params: { rejectReason },
  })
}

// ==================== 店铺活动（用于活动推流） ====================

/**
 * 获取店铺活动列表（公开接口，用于管理端活动推流选择）
 */
export function getShopActivities(shopId: number, params?: { pageNum?: number; pageSize?: number }) {
  return get<{ list: ShopActivityItem[]; total: number }>('/shop-public/activities', {
    params: { shopId, ...params },
  })
}

export interface ShopActivityItem {
  id: number
  title: string
  coverImage?: string
  startTime: string
  endTime: string
  status: number
  viewCount?: number
  createdAt: string
}
