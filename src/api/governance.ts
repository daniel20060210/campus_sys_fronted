import { get, put } from '@/utils/request'

export function getReportStats() {
  return get('/report/stats')
}

export function getReportCases(params?: Record<string, any>) {
  return get('/report/campus/pending', { params })
}

export function getReportDetail(id: number) {
  return get(`/report/${id}`)
}

// action: 'CONFIRM' | 'REJECT'
export function handleReport(id: number, data: { action: string; handleRemark?: string; syncAction?: boolean }) {
  return put(`/report/${id}/handle`, data)
}

export function getPenaltyList(params?: Record<string, any>) {
  return get('/penalty/page', { params })
}
