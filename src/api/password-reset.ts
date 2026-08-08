/**
 * 重置密码申请（超管）
 */
import { post, put } from '@/utils/request'
import type {
  PageResponse,
  PasswordResetRequestQueryParams,
  PasswordResetRequestVO,
  RejectPasswordResetRequestDTO,
  ResetPasswordByRequestDTO,
} from '@/types'

/**
 * 分页查询重置密码申请
 */
export function getPasswordResetRequestPage(params: PasswordResetRequestQueryParams) {
  return post<PageResponse<PasswordResetRequestVO>>('/password-reset/page', params)
}

/**
 * 执行重置密码
 */
export function resetPasswordByRequest(requestId: number, data: ResetPasswordByRequestDTO) {
  return put<boolean>(`/password-reset/${requestId}/reset`, data)
}

/**
 * 驳回申请
 */
export function rejectPasswordResetRequest(requestId: number, data: RejectPasswordResetRequestDTO) {
  return put<boolean>(`/password-reset/${requestId}/reject`, data)
}

