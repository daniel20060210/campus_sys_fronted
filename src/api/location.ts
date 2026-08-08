/**
 * 校区/生活区管理 API
 * 注意：后端暂未实现校区/生活区管理接口，所有方法返回空数据占位，待后端实现后替换。
 */
import type { ApiResponse, PageResponse, CampusArea, LivingArea } from '@/types'

const empty = <T>(data: T): Promise<ApiResponse<T>> =>
  Promise.resolve({ code: 0, message: 'success', data, timestamp: Date.now() })

const emptyPage = <T>(): Promise<ApiResponse<PageResponse<T>>> =>
  empty({ list: [], total: 0, pageNum: 1, pageSize: 10 })

export interface CampusAreaListParams { schoolId?: number; pageNum?: number; pageSize?: number }
export interface LivingAreaListParams { campusAreaId?: number; pageNum?: number; pageSize?: number }
export interface AddCampusAreaParams { schoolId: number; areaName: string; displayOrder?: number }
export interface AddLivingAreaParams { school_id: number; campusAreaId: number; areaName: string; displayOrder?: number }

export const getCampusAreaList = (_params?: CampusAreaListParams) => emptyPage<CampusArea>()
export const getCampusAreaDetail = (_id: number) => empty<CampusArea | null>(null)
export const addCampusArea = (_data: AddCampusAreaParams) => empty<null>(null)
export const updateCampusArea = (_id: number, _data: any) => empty<null>(null)
export const deleteCampusArea = (_id: number) => empty<null>(null)

export const getLivingAreaList = (_params?: LivingAreaListParams) => emptyPage<LivingArea>()
export const getLivingAreaDetail = (_id: number) => empty<LivingArea | null>(null)
export const addLivingArea = (_data: AddLivingAreaParams) => empty<null>(null)
export const updateLivingArea = (_id: number, _data: any) => empty<null>(null)
export const deleteLivingArea = (_id: number) => empty<null>(null)
