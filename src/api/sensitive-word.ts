/**
 * 敏感词管理相关API
 * 与后端 AdminSensitiveWordController 对接
 */
import { get, post, put, del, patch } from '@/utils/request'
import type { PageResponse, PageParams, SensitiveWord } from '@/types'

/**
 * 敏感词列表（后端路径为 /list，非 /page）
 */
export interface SensitiveWordListParams extends PageParams {
  keyword?: string
  /** 词类型：1-高危 2-可疑 */
  wordType?: number
  category?: string
  /** 是否启用：0-禁用 1-启用 */
  isActive?: number
}

export function getSensitiveWordList(params: SensitiveWordListParams) {
  return get<PageResponse<SensitiveWord>>('/admin/sensitive-word/list', { params })
}

/**
 * 添加敏感词（后端要求 wordType 必填：1-高危 2-可疑）
 */
export interface AddSensitiveWordParams {
  word: string
  /** 词类型：1-高危（直接拦截） 2-可疑（需审核），默认 1 */
  wordType?: number
  category?: string
  remark?: string
}

export function addSensitiveWord(data: AddSensitiveWordParams) {
  return post('/admin/sensitive-word', {
    word: data.word,
    wordType: data.wordType ?? 1,
    category: data.category,
    remark: data.remark,
  })
}

/**
 * 更新敏感词（后端 PUT 无路径 id，body 传 id、wordType、category、isActive、remark，不支持修改 word）
 */
export interface UpdateSensitiveWordParams {
  id: number
  wordType?: number
  category?: string
  isActive?: number
  remark?: string
}

export function updateSensitiveWord(id: number, data: Partial<UpdateSensitiveWordParams>) {
  return put('/admin/sensitive-word', { id, ...data })
}

/**
 * 删除敏感词
 */
export function deleteSensitiveWord(id: number) {
  return del(`/admin/sensitive-word/${id}`)
}

/**
 * 批量删除敏感词（后端 DELETE /batch，body 为 id 数组）
 */
export function batchDeleteSensitiveWords(ids: number[]) {
  return del('/admin/sensitive-word/batch', { data: ids })
}

/**
 * 启用/禁用敏感词（后端 PATCH /{id}/toggle?isActive=0|1）
 */
export function toggleSensitiveWord(id: number, isActive: 0 | 1) {
  return patch(`/admin/sensitive-word/${id}/toggle`, null, {
    params: { isActive },
  })
}

/**
 * 重新加载敏感词库到缓存
 */
export function reloadSensitiveWords() {
  return post('/admin/sensitive-word/reload')
}

/**
 * 清空敏感词缓存
 */
export function clearSensitiveWordCache() {
  return post('/admin/sensitive-word/clear-cache')
}
