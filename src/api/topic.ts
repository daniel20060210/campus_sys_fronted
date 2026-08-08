import { del, get, post, put } from '@/utils/request'
import type { PageParams, PageResponse } from '@/types'

export interface TopicCampaignListParams extends PageParams {
  status?: number
  keyword?: string
}

export interface AdminTopicCampaign {
  id: number
  schoolId: number
  title: string
  subtitle?: string
  coverImage?: string
  description?: string
  rulesText?: string
  status: number
  sortOrder: number
  viewCount: number
  postCount: number
  startTime?: string
  endTime?: string
  createdAt?: string
}

export interface TopicCampaignSavePayload {
  title: string
  subtitle?: string
  coverImage?: string
  description?: string
  rulesText?: string
  startTime?: string | null
  endTime?: string | null
  status: number
  sortOrder?: number
  shopIds?: number[]
}

export function getTopicCampaigns(params: TopicCampaignListParams) {
  return get<PageResponse<AdminTopicCampaign>>('/admin/topic/campaigns', { params })
}

export function getTopicCampaignDetail(campaignId: number) {
  return get<any>(`/admin/topic/campaigns/${campaignId}`)
}

export function createTopicCampaign(data: TopicCampaignSavePayload) {
  return post<number>('/admin/topic/campaigns', data)
}

export function updateTopicCampaign(campaignId: number, data: TopicCampaignSavePayload) {
  return put<boolean>(`/admin/topic/campaigns/${campaignId}`, data)
}

export function updateTopicCampaignStatus(campaignId: number, status: number) {
  return put<boolean>(`/admin/topic/campaigns/${campaignId}/status`, { status })
}

export function updateTopicCampaignShops(campaignId: number, shopIds: number[]) {
  return put<boolean>(`/admin/topic/campaigns/${campaignId}/shops`, { shopIds })
}

export interface TopicPostListParams extends PageParams {
  campaignId?: number
  auditStatus?: number
  keyword?: string
}

export interface AdminTopicPost {
  id: number
  schoolId: number
  campaignId: number
  userId: number
  userNickname?: string
  userAvatar?: string
  shopId?: number
  shopName?: string
  title?: string
  content: string
  imageUrls?: string[]
  auditStatus: number
  rejectReason?: string
  likeCount: number
  commentCount: number
  viewCount: number
  isTop: number
  isFeatured: number
  governanceStatus: number
  visibilityStatus: number
  isMasked: number
  createdAt?: string
}

export interface TopicPostOperatePayload {
  isTop?: number
  isFeatured?: number
  visibilityStatus?: number
  governanceStatus?: number
}

export function getTopicPosts(params: TopicPostListParams) {
  return get<PageResponse<AdminTopicPost>>('/admin/topic/posts', { params })
}

export function operateTopicPost(postId: number, data: TopicPostOperatePayload) {
  return put<boolean>(`/admin/topic/posts/${postId}/operate`, data)
}

export function deleteTopicPost(postId: number) {
  return del<boolean>(`/admin/topic/posts/${postId}`)
}

