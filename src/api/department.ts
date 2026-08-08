import { get, post, put, del } from '@/utils/request'
import type { Department, Major, BatchOperationResult } from '@/types'

// ==================== 院系 ====================

/** 按高校查询院系列表 */
export function getDepartmentList(campusId: number) {
  return get<Department[]>('/department/list', { params: { campusId } })
}

/** 单个新增院系 */
export function addDepartment(data: { name: string }) {
  return post('/department', data)
}

/** 编辑院系 */
export function updateDepartment(id: number, data: { name: string }) {
  return put(`/department/${id}`, data)
}

/** 删除院系 */
export function deleteDepartment(id: number) {
  return del(`/department/${id}`)
}

/** 批量新增院系 */
export function batchAddDepartments(names: string[]) {
  return post<BatchOperationResult>('/department/batch', { names })
}

// ==================== 专业 ====================

/** 按院系查询专业列表 */
export function getMajorList(departmentId: number) {
  return get<Major[]>('/major/list', { params: { departmentId } })
}

/** 单个新增专业 */
export function addMajor(data: { name: string; departmentId: number }) {
  return post('/major', data)
}

/** 编辑专业 */
export function updateMajor(id: number, data: { name: string }) {
  return put(`/major/${id}`, data)
}

/** 删除专业 */
export function deleteMajor(id: number) {
  return del(`/major/${id}`)
}

/** 批量新增专业 */
export function batchAddMajors(departmentId: number, names: string[]) {
  return post<BatchOperationResult>('/major/batch', { departmentId, names })
}
