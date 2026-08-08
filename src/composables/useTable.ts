/**
 * 表格分页处理组合函数
 */
import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import { ElMessage } from 'element-plus'

export interface TableParams {
  pageNum: number
  pageSize: number
}

export interface UseTableOptions {
  /** 获取额外查询参数（用于分页切换时保留搜索条件） */
  getParams?: () => Record<string, any>
}

export function useTable<T = any>(
  fetchFn: (params: TableParams & Record<string, any>) => Promise<any>,
  options?: UseTableOptions
) {
  const loading = ref(false)
  const data = ref<T[]>([]) as Ref<T[]>
  const total = ref(0)
  const pageNum = ref(1)
  const pageSize = ref(20)

  // 分页信息
  const pagination = computed(() => ({
    pageNum: pageNum.value,
    pageSize: pageSize.value,
    total: total.value,
  }))

  /**
   * 获取数据
   */
  const fetchData = async (params?: Record<string, any>) => {
    loading.value = true
    try {
      const mergedParams = {
        pageNum: pageNum.value,
        pageSize: pageSize.value,
        ...options?.getParams?.(),
        ...params,
      }
      console.log('[useTable] 请求参数:', mergedParams)
      const res = await fetchFn(mergedParams)
      console.log('[useTable] 完整响应:', res)
      
      // res 是 ApiResponse 格式：{ code, message, data: { list, total } }
      if (!res || typeof res !== 'object') {
        console.error('[useTable] 响应数据格式错误:', res)
        ElMessage.error('数据格式错误')
        return
      }
      
      const pageData = res.data || {}
      console.log('[useTable] 分页数据:', pageData)
      
      if (!pageData) {
        console.warn('[useTable] 返回数据为空')
        data.value = []
        total.value = 0
        return
      }
      
      data.value = pageData.list || []
      total.value = pageData.total || 0
      console.log('[useTable] 处理后数据:', { data: data.value, total: total.value })
    } catch (error) {
      console.error('[useTable] 获取数据失败:', error)
      data.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  /**
   * 页码变化
   */
  const handlePageChange = (page: number) => {
    pageNum.value = page
    fetchData()
  }

  /**
   * 每页数量变化
   */
  const handleSizeChange = (size: number) => {
    pageSize.value = size
    pageNum.value = 1
    fetchData()
  }

  /**
   * 重置分页
   */
  const resetPagination = () => {
    pageNum.value = 1
    pageSize.value = 20
  }

  /**
   * 刷新数据
   */
  const refresh = () => {
    fetchData()
  }

  return {
    loading,
    data,
    total,
    pageNum,
    pageSize,
    pagination,
    fetchData,
    handlePageChange,
    handleSizeChange,
    resetPagination,
    refresh,
  }
}
