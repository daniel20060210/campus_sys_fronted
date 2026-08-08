/**
 * 闲置管理（二手书/闲置商品）相关 API
 */
import { get, put } from '@/utils/request'
import type { PageResponse, PageParams } from '@/types'

// ==================== 商品审核（管理端） ====================

/**
 * 待审核商品列表查询参数
 */
export interface IdleProductReviewListParams extends PageParams {
  /** 高校ID列表（可选，用于学校筛选） */
  campusIds?: number[]
}

/**
 * 待审核商品列表项
 */
export interface IdleProductReviewVO {
  /** 商品 ID */
  productId: number
  /** 子类型 1-二手书 2-其他闲置 */
  subType: number
  /** 物品名称/书名 */
  title: string
  /** 分类（其他闲置时有效） */
  category: string
  /** 售价 */
  price: number
  /** 新旧程度 1-全新 2-九成新 3-八成新 4-有使用痕迹 5-较旧 */
  conditionLevel: number
  /** 交货方式 1-自取 2-快递 */
  deliveryType: number
  /** 描述 */
  description: string
  /** 实拍图片列表 */
  imageUrls: string[]
  /** 卖家 ID */
  sellerId: number
  /** 卖家昵称 */
  sellerNickname: string
  /** 当前状态 */
  status: number
  /** 当前状态描述 */
  statusDesc: string
  /** 创建时间 */
  createdAt: string
}

/**
 * 驳回请求体
 */
export interface IdleProductRejectDTO {
  /** 驳回原因（必填，最长500字符） */
  reason: string
}

/**
 * 分页查询待人工审核的闲置商品
 */
export function getIdleProductReviewList(params: IdleProductReviewListParams) {
  return get<PageResponse<IdleProductReviewVO>>('/admin/idle/product/review/pending', { params })
}

/**
 * 人工审核通过
 */
export function approveIdleProduct(productId: number) {
  return put(`/admin/idle/product/review/${productId}/approve`)
}

/**
 * 人工审核驳回
 */
export function rejectIdleProduct(productId: number, data: IdleProductRejectDTO) {
  return put(`/admin/idle/product/review/${productId}/reject`, data)
}

// ==================== 订单退款管理（管理端） ====================

/**
 * 退款订单列表项
 */
export interface IdleOrderVO {
  /** 订单 ID */
  id: number
  /** 订单号 */
  orderNo: string
  /** 商品 ID */
  productId: number
  /** 买方用户 ID */
  buyerId: number
  /** 卖方用户 ID */
  sellerId: number
  /** 商品售价（元） */
  price: number
  /** 平台服务费（元） */
  serviceFee: number
  /** 实付总额（元） */
  actualPaid: number
  /** 订单状态 */
  status: number
  /** 订单状态描述 */
  statusDesc: string
  /** 微信支付交易单号 */
  wxPayTransactionId: string
  /** 支付时间 */
  payTime: string
  /** 发货时间 */
  shipTime: string
  /** 确认收货时间 */
  confirmTime: string
  /** 支付截止时间 */
  payExpireTime: string
  /** 自动确认收货时间 */
  autoConfirmTime: string
  /** 取消原因 */
  cancelReason: string
  /** 创建时间 */
  createdAt: string
  /** 商品标题 */
  productTitle: string
  /** 商品封面图 */
  productImage: string
  /** 对方昵称 */
  counterpartyNickname: string
  /** 对方头像 */
  counterpartyAvatarUrl: string
}

/**
 * 分页查询退款申请中的订单
 */
export function getIdleOrderRefundList(params: PageParams & { campusIds?: number[] }) {
  return get<PageResponse<IdleOrderVO>>('/admin/idle/order/refund-pending', { params })
}

/**
 * 管理员同意退款
 */
export function approveIdleOrderRefund(orderId: number) {
  return put(`/admin/idle/order/${orderId}/refund-approve`)
}

/**
 * 管理员拒绝退款
 * @param orderId 订单ID
 * @param reason 拒绝原因（可选，通过 query 传参）
 */
export function rejectIdleOrderRefund(orderId: number, reason?: string) {
  return put(`/admin/idle/order/${orderId}/refund-reject`, null, {
    params: reason ? { reason } : {},
  })
}
