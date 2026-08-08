import { get, post, put, del, patch } from '@/utils/request'

export interface BadgeDefinition {
  id: number
  code: string
  name: string
  description: string
  badgeType: number // 1=用户徽章 2=商家徽章
  tier: number // 1-5
  icon: string
  renderConfig: string
  issuanceType: number // 1=自动 2=手动 3=两者
  ruleType: string
  ruleThreshold: number
  isActive: number // 0=停用 1=启用
  priority: number
  createTime: string
  updateTime: string
}

export interface BadgeDefinitionSaveDTO {
  code: string
  name: string
  description?: string
  badgeType: number
  tier: number
  icon?: string
  renderConfig?: string
  issuanceType: number
  ruleType?: string
  ruleThreshold?: number
  isActive?: number
  priority?: number
}

export interface BadgeRecord {
  badgeId: number
  badgeName: string
  badgeCode: string
  tier: number
  icon: string
  grantType: string   // "auto" | "manual"
  remark: string
  grantTime: string
}

export interface BadgeGrantDTO {
  targetId: number
  badgeId: number
  remark?: string
}

export interface BadgeRevokeDTO {
  targetId: number
  badgeId: number
}

// 徽章定义 CRUD
export function getBadgeDefinitions() {
  return get<BadgeDefinition[]>('/admin/badges/definitions')
}

export function getBadgeDefinition(id: number) {
  return get<BadgeDefinition>(`/admin/badges/definitions/${id}`)
}

export function createBadgeDefinition(data: BadgeDefinitionSaveDTO) {
  return post('/admin/badges/definitions', data)
}

export function updateBadgeDefinition(id: number, data: BadgeDefinitionSaveDTO) {
  return put(`/admin/badges/definitions/${id}`, data)
}

export function setBadgeDefinitionActive(id: number, value: 0 | 1) {
  return patch(`/admin/badges/definitions/${id}/active`, null, { params: { value } })
}

export function deleteBadgeDefinition(id: number) {
  return del(`/admin/badges/definitions/${id}`)
}

// 用户徽章发放/撤销
export function grantUserBadge(data: BadgeGrantDTO) {
  return post('/admin/badges/user/grant', data)
}

export function revokeUserBadge(data: BadgeRevokeDTO) {
  return post('/admin/badges/user/revoke', data)
}

export function getUserBadges(userId: number) {
  return get<BadgeRecord[]>(`/admin/badges/user/${userId}`)
}

// 商家徽章发放/撤销
export function grantShopBadge(data: BadgeGrantDTO) {
  return post('/admin/badges/shop/grant', data)
}

export function revokeShopBadge(data: BadgeRevokeDTO) {
  return post('/admin/badges/shop/revoke', data)
}

export function getShopBadges(shopId: number) {
  return get<BadgeRecord[]>(`/admin/badges/shop/${shopId}`)
}

export function recalculateAllBadges() {
  return post('/admin/badges/recalculate-all')
}
