import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { AdminPermissionCode, LoginRequest } from '@/types'
import { adminLogin, getCurrentAdminPermissions } from '@/api'

// 后端 role: 1=超级管理员, 2=高校管理员
const ALL_PERMISSIONS: AdminPermissionCode[] = [
  'AD_PUBLISH_AUDIT','SHOP_BINDING_AUDIT_FINAL','ADMIN_ACCOUNT_MANAGE','REVIEW_AUDIT',
  'COMMENT_AUDIT','REPORT_AUDIT','TOPIC_CAMPAIGN_MANAGE','TOPIC_POST_MANAGE','CERTIFICATION_AUDIT',
  'SENSITIVE_WORD_MANAGE','SCHOOL_MANAGE','LOCATION_MANAGE','CALCULATION_MANAGE','BADGE_MANAGE',
]

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('admin_token') || '')
  const userInfo = ref<any>(JSON.parse(localStorage.getItem('admin_user') || 'null'))
  const permissionCodes = ref<AdminPermissionCode[]>(JSON.parse(localStorage.getItem('admin_permissions') || '[]'))

  async function login(data: LoginRequest) {
    const res = await adminLogin(data)
    const raw = res.data
    if (!raw?.token) throw new Error('登录失败，服务器返回数据格式错误')

    // 将后端字段映射为前端期望格式
    const normalized = {
      ...raw,
      userId: raw.adminId,
      userType: raw.role, // role 1=超管 2=高校管理员，与前端 userType 语义一致
    }

    token.value = raw.token
    userInfo.value = normalized
    localStorage.setItem('admin_token', raw.token)
    localStorage.setItem('admin_user', JSON.stringify(normalized))

    await fetchPermissions(raw.role)
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    permissionCodes.value = []
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    localStorage.removeItem('admin_permissions')
  }

  async function fetchPermissions(role?: number) {
    const r = role ?? userInfo.value?.role
    // 超级管理员(role=1)拥有全部权限，无需请求接口
    if (r === 1) {
      permissionCodes.value = ALL_PERMISSIONS
    } else {
      try {
        const res = await getCurrentAdminPermissions()
        permissionCodes.value = Array.isArray(res.data) ? res.data : []
      } catch {
        permissionCodes.value = []
      }
    }
    localStorage.setItem('admin_permissions', JSON.stringify(permissionCodes.value))
  }

  function isLoggedIn(): boolean {
    return !!token.value
  }

  function hasPermission(code: AdminPermissionCode): boolean {
    if (userInfo.value?.role === 1) return true
    return permissionCodes.value.includes(code)
  }

  function hasAnyPermission(codes: AdminPermissionCode[] = []): boolean {
    if (codes.length === 0) return true
    return codes.some((code) => hasPermission(code))
  }

  const isSuperAdmin = computed(() => userInfo.value?.role === 1)

  return { token, userInfo, permissionCodes, login, logout, fetchPermissions, isLoggedIn, hasPermission, hasAnyPermission, isSuperAdmin }
})
