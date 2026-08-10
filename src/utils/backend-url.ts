/**
 * 管理端统一后端前缀。
 *
 * - 未配置 VITE_BACKEND_PREFIX：API 和图片使用相对路径，开发环境交给 Vite 代理。
 * - 配置 VITE_BACKEND_PREFIX：API、图片等后端资源统一切换到该地址。
 * - 支持完整地址（https://api.example.com）和同源路径前缀（/backend）。
 */
const normalizeBackendPrefix = (value?: string) => {
  const prefix = String(value || '').trim().replace(/\/+$/, '')
  const isAbsoluteUrl = /^https?:\/\//i.test(prefix)
  const isRootRelativePath = /^\/(?!\/)/.test(prefix)
  if (prefix && !isAbsoluteUrl && !isRootRelativePath) {
    throw new Error('VITE_BACKEND_PREFIX 必须是 http(s) 地址或以 / 开头的同源路径')
  }
  return prefix
}

export const BACKEND_PREFIX = normalizeBackendPrefix(import.meta.env.VITE_BACKEND_PREFIX)
export const API_BASE_URL = `${BACKEND_PREFIX}/api/v1`

/** 将后端返回的相对资源路径转换为可直接访问的完整地址。 */
export const resolveBackendUrl = (value?: string | null) => {
  const url = String(value || '').trim()
  if (!url || /^(?:https?:)?\/\//i.test(url) || /^(?:data|blob):/i.test(url)) {
    return url
  }
  return `${BACKEND_PREFIX}${url.startsWith('/') ? url : `/${url}`}`
}
