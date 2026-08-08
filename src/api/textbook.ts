import { download, get, post } from '@/utils/request'

export interface TextbookOption {
  id: number
  title: string
  author?: string
  isbn?: string
}

export function getTextbookOptions(title = '') {
  return get<{ list: TextbookOption[] }>('/textbook/page', {
    params: { pageNum: 1, pageSize: 20, title: title || undefined },
  })
}

export function importTextbooks(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return post<string>('/course-textbook/import', formData)
}

export async function downloadTextbookImportTemplate() {
  const response = await download('/course-textbook/import/template')
  if (response.data.type.includes('application/json')) {
    let message = '导入模板下载失败'
    try {
      const error = JSON.parse(await response.data.text())
      message = error.message || message
    } catch {}
    throw new Error(message)
  }

  const disposition = response.headers['content-disposition']
  const encodedFileName = disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1]

  let fileName = '教材导入模板.xlsx'
  if (encodedFileName) {
    try {
      fileName = decodeURIComponent(encodedFileName)
    } catch {
      // 服务端文件名解码失败时使用默认名称
    }
  }

  return { blob: response.data, fileName }
}
