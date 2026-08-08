import { get, post, put, del } from '@/utils/request'

export interface RewardTier {
  id: number
  level: string
  description: string
  sort: number
  quantity: number
  winningCodes: string[]
  winnerUserIds: (number | null)[]
}

export interface InviteRewardActivity {
  id: number
  name: string
  description: string
  coverImage: string
  startTime: string
  endTime: string
  status: 0 | 1 | 2
  createdBy: number
  createdAt: string
  tiers: RewardTier[]
  totalInviters: number
  totalInvitees: number
  rewardBudget: number
  rewardUsed: number
}

export interface InviteeRecord {
  id: number
  code: string
  source: number
  createdAt: string
  userId: number
  nickname: string
  avatarUrl: string
}

function mapActivity(raw: any): InviteRewardActivity {
  return {
    id: raw.id,
    name: raw.title,
    description: raw.description || '',
    coverImage: raw.coverImage || '',
    startTime: raw.startTime,
    endTime: raw.endTime,
    status: raw.status,
    createdBy: raw.createdBy,
    createdAt: raw.createdAt,
    tiers: (raw.prizes || []).map((p: any): RewardTier => ({
      id: p.id,
      level: p.level,
      description: p.description || '',
      sort: p.sort,
      quantity: p.quantity ?? 1,
      winningCodes: p.winningCodes || [],
      winnerUserIds: p.winnerUserIds || [],
    })),
    totalInviters: 0,
    totalInvitees: 0,
    rewardBudget: 0,
    rewardUsed: 0,
  }
}

export async function getInviteRewardActivities() {
  const res = await get<any>('/lottery/admin/activities', { params: { pageNum: 1, pageSize: 100 } })
  const list = (res.data?.list || []).map(mapActivity)
  return { data: { list, total: res.data?.total || 0 } }
}

export async function getInviteRewardActivity(id: number) {
  const res = await get<any>(`/lottery/admin/activities/${id}`)
  return { data: mapActivity(res.data) }
}

export interface CreateActivityParams {
  name: string
  description?: string
  coverImage?: string
  startTime: string
  endTime: string
  prizes: { level: string; description?: string; sort: number; quantity?: number }[]
}

export async function createInviteRewardActivity(data: CreateActivityParams) {
  const res = await post<any>('/lottery/admin/activities', {
    title: data.name,
    description: data.description,
    coverImage: data.coverImage,
    startTime: data.startTime,
    endTime: data.endTime,
    prizes: data.prizes,
  })
  return { data: mapActivity(res.data) }
}

export interface UpdateActivityParams extends CreateActivityParams {}

export async function updateInviteRewardActivity(id: number, data: UpdateActivityParams) {
  const res = await put<any>(`/lottery/admin/activities/${id}`, {
    title: data.name,
    description: data.description,
    coverImage: data.coverImage,
    startTime: data.startTime,
    endTime: data.endTime,
    prizes: data.prizes,
  })
  return { data: mapActivity(res.data) }
}

export async function deleteInviteRewardActivity(id: number) {
  await post(`/lottery/admin/activities/${id}/close`)
  return { data: true }
}

export async function closeActivity(id: number) {
  return post(`/lottery/admin/activities/${id}/close`)
}

export async function drawActivity(id: number) {
  return post(`/lottery/admin/activities/${id}/draw`)
}

export async function getRewardTiers(activityId: number) {
  const res = await get<any>(`/lottery/admin/activities/${activityId}`)
  const list = (res.data?.prizes || []).map((p: any): RewardTier => ({
    id: p.id,
    level: p.level,
    description: p.description || '',
    sort: p.sort,
    quantity: p.quantity ?? 1,
    winningCodes: p.winningCodes || [],
    winnerUserIds: p.winnerUserIds || [],
  }))
  return { data: { list, total: list.length } }
}

export interface CreateTierParams {
  level: string
  description?: string
  sort: number
  quantity?: number
}

export async function createRewardTier(activityId: number, data: CreateTierParams) {
  const res = await post<any>(`/lottery/admin/activities/${activityId}/prizes`, data)
  return { data: res.data }
}

export interface UpdateTierParams extends CreateTierParams {}

export async function updateRewardTier(tierId: number, data: UpdateTierParams) {
  const res = await put<any>(`/lottery/admin/prizes/${tierId}`, data)
  return { data: res.data }
}

export async function deleteRewardTier(tierId: number) {
  await del(`/lottery/admin/prizes/${tierId}`)
  return { data: true }
}

export async function assignWinningCode(prizeId: number, winningCodes: string[]) {
  const res = await put<any>(`/lottery/admin/prizes/${prizeId}/winning-code`, { winningCodes })
  return { data: res.data }
}

export interface InviteeRecordParams {
  activityId: number
  pageNum?: number
  pageSize?: number
}

export async function getInviteeRecords(params: InviteeRecordParams) {
  const res = await get<any>('/lottery/admin/tickets', { params })
  const list: InviteeRecord[] = (res.data?.list || []).map((t: any) => ({
    id: t.id,
    code: t.code,
    source: t.source,
    createdAt: t.createdAt,
    userId: t.userId,
    nickname: t.nickname,
    avatarUrl: t.avatarUrl,
  }))
  return { data: { list, total: res.data?.total || 0 } }
}
