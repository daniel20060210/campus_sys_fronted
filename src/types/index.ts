/**
 * 通用类型定义
 */

// API响应类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp: number
}

// 分页响应类型
export interface PageResponse<T = any> {
  list: T[]
  total: number
  pageNum: number
  pageSize: number
}

// 分页查询参数
export interface PageParams {
  pageNum?: number
  pageSize?: number
}

// 用户类型枚举
export const UserType = {
  ADMIN: 'admin',
  USER: 'user',
} as const
export type UserType = (typeof UserType)[keyof typeof UserType]

// 认证状态枚举
export const CertificationStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const
export type CertificationStatus = (typeof CertificationStatus)[keyof typeof CertificationStatus]

// 审核状态枚举
export const AuditStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const
export type AuditStatus = (typeof AuditStatus)[keyof typeof AuditStatus]

// 店铺状态枚举
export const ShopStatus = {
  NORMAL: 'normal',
  CLOSED: 'closed',
} as const
export type ShopStatus = (typeof ShopStatus)[keyof typeof ShopStatus]

// 店铺类型枚举
export const ShopType = {
  RESTAURANT: 'restaurant',
  CAFE: 'cafe',
  SNACK: 'snack',
  SUPERMARKET: 'supermarket',
  OTHER: 'other',
} as const
export type ShopType = (typeof ShopType)[keyof typeof ShopType]

// 用户信息（前端旧版，部分页面仍在使用）
export interface User {
  id: number
  openid: string
  nickname: string
  avatar: string
  schoolId: number
  campusAreaId: number
  livingAreaId: number
  certificationStatus: CertificationStatus
  studentId: string
  realName: string
  certificationImages: string[]
  type: UserType
  createTime: number
  updateTime: number
  followCount: number
  fansCount: number
}

// 管理员视角用户 VO（与后端 UserAdminVO 对齐）
export interface UserAdminVO {
  id: number
  openId: string
  nickname: string
  avatarUrl: string
  phone: string
  campusId: number
  campusName: string
  departmentId: number
  departmentName: string
  majorId: number
  majorName: string
  enrollmentYear: number
  status: number
  isVirtual: number
  inviteCode: string
  invitedByUserId: number
  createdAt: string
  updatedAt: string
}

// 学校信息
export interface School {
  id: number
  name: string
  shortName: string
  province: string
  city: string
  logoUrl: string
}

// 校区信息
export interface CampusArea {
  id: number
  schoolId: number
  name: string
  createTime: number
  updateTime: number
}

// 生活区信息
export interface LivingArea {
  id: number
  schoolId: number
  campusAreaId: number
  name: string
  createTime: number
  updateTime: number
}

// 店铺信息
export interface Shop {
  id: number
  shopName?: string
  name: string
  shopType?: number
  type: ShopType
  coverImage?: string
  avatar: string
  description?: string
  images: string[]
  schoolId: number
  campusAreaId: number
  livingAreaIds?: number[]
  livingAreaId: number
  specificLocation?: string
  address: string
  phone: string
  businessHours: string
  avgPrice?: number
  averagePrice: number
  deliveryPlatforms: string[]
  ratingScore?: number
  status: ShopStatus
  auditStatus: AuditStatus
  rejectReason: string
  score: number
  tasteScore: number
  environmentScore: number
  serviceScore: number
  reviewCount: number
  createTime: number
  updateTime: number
}

// 评价信息
export interface Review {
  id: number
  userId: number
  shopId: number
  nickname: string
  avatar: string
  images: string[]
  content: string
  tasteScore: number
  environmentScore: number
  serviceScore: number
  averageScore: number
  likeCount: number
  commentCount: number
  isLiked: boolean
  auditStatus: AuditStatus
  createTime: number
  updateTime: number
}

// 评论信息
export interface Comment {
  id: number
  reviewId: number
  userId: number
  nickname: string
  avatar: string
  content: string
  likeCount: number
  isLiked: boolean
  auditStatus: AuditStatus
  createTime: number
  updateTime: number
}

// 敏感词
export interface SensitiveWord {
  id: number
  word: string
  createTime: number
  updateTime: number
}

// 广告信息
export interface Advertisement {
  id: number
  schoolId: number
  image: string
  linkType: string
  linkValue: string
  sortOrder: number
  status: number
  createTime: number
  updateTime: number
}

// 广告 V2 管理端类型
export interface AdminAdCreateDTO {
  schoolId?: number
  adType: 2 | 4 | 5 // 2-热搜 4-店铺推广 5-活动推广
  adName: string
  startTime: string
  endTime: string
  linkTargetId?: number
  keyword?: string
  rankPosition?: number
  title?: string
  imageUrl?: string
  displayOrder?: number
}

export interface AdminAdQueryParams {
  schoolId?: number
  adType?: number
  status?: number
  pageNum?: number
  pageSize?: number
}

export interface AdminAdvertisementVO {
  id: number
  schoolId: number
  adType: number
  adName: string
  title?: string
  imageUrl?: string
  keyword?: string
  linkType?: number
  linkTargetId?: number
  targetName?: string
  targetShopId?: number
  targetShopName?: string
  targetImageUrl?: string
  targetStartTime?: string
  targetEndTime?: string
  linkUrl?: string
  rankPosition?: number
  startTime: string
  endTime: string
  displayOrder?: number
  impressionCount?: number
  clickCount?: number
  status: number
  rejectReason?: string
  auditTime?: string
  auditorId?: number
  createdAt: string
  updatedAt: string
}

// 热门搜索
export interface HotSearch {
  id: number
  keyword: string
  searchCount: number
  createTime: number
  updateTime: number
}

// 搜索历史
export interface SearchHistory {
  id: number
  userId: number
  keyword: string
  createTime: number
}

// 推荐结果
export interface RecommendResult {
  shopId: number
  shopName: string
  shopAvatar: string
  score: number
  reason: string
}

// 登录请求
export interface LoginRequest {
  username: string
  password: string
}

// 登录响应
export interface LoginResponse {
  token: string
  userId: number
  schoolId: number
  nickname: string
  avatarUrl: string
  userType: number
  certificationStatus: number
  isNewUser: boolean
  tokenExpireTime: number
}

export interface PasswordResetRequestQueryParams extends PageParams {
  keyword?: string
  applicantType?: number
  status?: number
}

export interface PasswordResetRequestVO {
  id: number
  applicantId?: number
  applicantNickname?: string
  applicantType?: number
  applicantPhone?: string
  reason?: string
  status?: number
  handlerId?: number
  handlerName?: string
  rejectReason?: string
  createdAt?: string | number
  processedAt?: string | number
}

export interface ResetPasswordByRequestDTO {
  newPassword: string
  processRemark?: string
}

export interface RejectPasswordResetRequestDTO {
  rejectReason: string
}

export type AdminPermissionCode =
  | 'AD_PUBLISH_AUDIT'
  | 'SHOP_BINDING_AUDIT_FINAL'
  | 'ADMIN_ACCOUNT_MANAGE'
  | 'REVIEW_AUDIT'
  | 'COMMENT_AUDIT'
  | 'REPORT_AUDIT'
  | 'TOPIC_CAMPAIGN_MANAGE'
  | 'TOPIC_POST_MANAGE'
  | 'CERTIFICATION_AUDIT'
  | 'SENSITIVE_WORD_MANAGE'
  | 'SCHOOL_MANAGE'
  | 'LOCATION_MANAGE'
  | 'CALCULATION_MANAGE'
  | 'BADGE_MANAGE'

// 统计数据
export type StatisticsGranularity = 'day' | 'week' | 'month'

export interface StatisticsTrendPoint {
  label: string
  value: number
}

export interface StatisticsRankingItem {
  id: number
  name: string
  score: number
  reviewCount: number
}

export interface UserModuleStats {
  totalUsers: number
  newUsers: number
  activeUsers: number
  trend: StatisticsTrendPoint[]
}

export interface PostModuleStats {
  totalPosts: number
  newPosts: number
  trend: StatisticsTrendPoint[]
}

export interface CommentModuleStats {
  totalComments: number
  newComments: number
  trend: StatisticsTrendPoint[]
}

export interface TransactionModuleStats {
  totalAmount: number
  rangeAmount: number
  trend: StatisticsTrendPoint[]
}

export interface StatisticsDashboard {
  userCount: number
  shopCount: number
  reviewCount: number
  commentCount: number
  postCount: number
  transactionTotal: number
  pendingCertificationCount: number
  pendingShopAuditCount: number
  pendingReviewAuditCount: number
  pendingCommentAuditCount: number
  startTime?: string
  endTime?: string
  selectedSchoolId?: number
  granularity?: StatisticsGranularity
  userModule?: UserModuleStats
  postModule?: PostModuleStats
  commentModule?: CommentModuleStats
  transactionModule?: TransactionModuleStats
}

export type Statistics = StatisticsDashboard

// ==================== 院系/专业 ====================

/** 院系信息 */
export interface Department {
  id: number
  campusId: number
  name: string
  createdAt: string
  updatedAt: string
}

/** 专业信息 */
export interface Major {
  id: number
  campusId: number
  departmentId: number
  name: string
  createdAt: string
  updatedAt: string
}

/** 批量操作失败明细 */
export interface BatchItemFailDetail {
  name: string
  reason: string
}

/** 批量操作结果 */
export interface BatchOperationResult {
  totalCount: number
  successCount: number
  failCount: number
  successItems: string[]
  failDetails: BatchItemFailDetail[]
}
