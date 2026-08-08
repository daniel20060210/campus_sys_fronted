import axios from 'axios'
import type { ApiResponse } from '@/types'

const instance = axios.create({ baseURL: '/api/v1' })

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  return config
})

instance.interceptors.response.use(
  (res) => {
    if (res.config.responseType === 'blob') return res
    const data: ApiResponse = res.data
    if (data.code !== 200 && data.code !== 0) {
      const msg = data.code === 1502 ? '此功能仅限校级管理员操作，超级管理员请切换至对应学校账号'
                : data.code === 1503 ? '此功能仅限超级管理员操作'
                : (data.message || '请求失败')
      return Promise.reject(new Error(msg))
    }
    return res
  },
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      localStorage.removeItem('admin_permissions')
      window.location.href = '/login'
    }
    const msg = err.response?.data?.message || err.message || '请求失败'
    return Promise.reject(new Error(msg))
  },
)

type RequestConfig = { params?: Record<string, any>; headers?: Record<string, string>; data?: any }

export const get = <T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> =>
  instance.get(url, config).then((r) => r.data)

export const post = <T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> =>
  instance.post(url, data, config).then((r) => r.data)

export const put = <T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> =>
  instance.put(url, data, config).then((r) => r.data)

export const del = <T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> =>
  instance.delete(url, config).then((r) => r.data)

export const patch = <T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> =>
  instance.patch(url, data, config).then((r) => r.data)

export const download = (url: string, config?: RequestConfig) =>
  instance.get<Blob>(url, { ...config, responseType: 'blob' })

export default { get, post, put, delete: del, patch, download }
