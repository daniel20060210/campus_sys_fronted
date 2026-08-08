import { post } from '@/utils/request'

// POST /upload/image — 上传单张图片，返回访问 URL
export function uploadImage(file: File): Promise<{ code: number; data: { url: string } }> {
  const form = new FormData()
  form.append('file', file)
  return post<{ url: string }>('/upload/image', form, { headers: { 'Content-Type': 'multipart/form-data' } })
}

// POST /admin/post/virtual-publish — 以随机虚拟用户身份发布帖子（仅高校管理员）
export function virtualPublishPost(data: {
  title: string
  content: string
  contact?: string
  imageUrls?: string[]
}) {
  return post('/admin/post/virtual-publish', data)
}

// POST /admin/post/batch-virtual-publish — 批量以随机虚拟用户身份发布帖子（仅高校管理员）
export interface BatchPublishResult {
  title: string
  success: boolean
  postId?: number
  virtualUserId?: number
  errorMsg?: string
}

export function batchVirtualPublishPost(data: {
  posts: {
    title: string
    content: string
    contact?: string
    imageUrls?: string[]
  }[]
}): Promise<{ code: number; data: { successCount: number; failCount: number; results: BatchPublishResult[] } }> {
  return post('/admin/post/batch-virtual-publish', data)
}
