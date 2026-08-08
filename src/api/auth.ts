import { get, post, put } from '@/utils/request'
import type { AdminPermissionCode, LoginRequest } from '@/types'

export function adminLogin(data: LoginRequest) {
  return post<any>('/admin/login', data)
}

export function adminLogout() {
  return post('/admin/logout')
}

export function getAdminInfo() {
  return get('/admin/me')
}

export function getCurrentAdminPermissions() {
  return get<AdminPermissionCode[]>('/admin/permissions/current')
}

export function getAdminPermissions(adminId: number) {
  return get<AdminPermissionCode[]>(`/admin/permissions/admin/${adminId}`)
}

export function assignAdminPermissions(adminId: number, permissionCodes: AdminPermissionCode[]) {
  return put<boolean>(`/admin/permissions/admin/${adminId}`, { permissionCodes })
}

export interface AdminOperationLogQueryParams {
  pageNum?: number
  pageSize?: number
  operatorId?: number
  permissionCode?: AdminPermissionCode
  moduleName?: string
  resultStatus?: 0 | 1
  startTime?: string
  endTime?: string
}

export function getAdminOperationLogs(params: AdminOperationLogQueryParams) {
  return get('/admin/audit-logs/page', { params })
}

export interface AdminPageParams { pageNum?: number; pageSize?: number; role?: number; campusId?: number; status?: number }
export interface CreateAdminParams { username: string; password: string; campusId: number }

export function getAdminPage(params: AdminPageParams) { return get('/admin/page', { params }) }
export function createAdmin(data: CreateAdminParams) { return post('/admin', data) }
export function updateAdminStatus(id: number, status: number) { return put(`/admin/${id}/status`, null, { params: { status } }) }
export function updateAdminPassword(data: { oldPassword: string; newPassword: string }) { return put('/admin/password', data) }
export function updateAiApiKey(apiKey: string) { return put('/ai/config/api-key', { apiKey }) }
export function getAiApiKey() { return get<string>('/ai/config/api-key') }
