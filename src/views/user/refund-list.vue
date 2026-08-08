<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const route = useRoute()
const userId = ref<number>(Number(route.query.userId))

// 后端暂无用户退款记录查询接口，当前使用 mock 数据占位
const mockRefunds = [
  { id: 1, orderNo: 'ORD20260101001', amount: 25.00, status: 2, refundTime: 1708000000000, reason: '商品质量问题' },
  { id: 2, orderNo: 'ORD20260115002', amount: 18.50, status: 2, refundTime: 1707000000000, reason: '配送超时' },
  { id: 3, orderNo: 'ORD20260220003', amount: 30.00, status: 1, refundTime: 1706000000000, reason: '不想要了' },
  { id: 4, orderNo: 'ORD20260305004', amount: 15.00, status: 2, refundTime: 1705000000000, reason: '商家缺货' },
]

const loading = ref(false)
const data = ref<any[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)

const fetchData = () => {
  loading.value = true
  setTimeout(() => {
    data.value = mockRefunds
    total.value = mockRefunds.length
    loading.value = false
  }, 300)
}

onMounted(() => {
  fetchData()
})

const handlePageChange = (page: number) => {
  pageNum.value = page
  fetchData()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  pageNum.value = 1
  fetchData()
}

const formatTime = (time: number) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

const getStatusText = (status: number) => {
  const map: Record<number, string> = {
    0: '待处理',
    1: '处理中',
    2: '已退款',
    3: '已拒绝',
  }
  return map[status] || '-'
}

const getStatusType = (status: number) => {
  const map: Record<number, string> = {
    0: 'warning',
    1: 'primary',
    2: 'success',
    3: 'danger',
  }
  return map[status] || 'info'
}

const goBack = () => {
  history.back()
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <el-button @click="goBack" :icon="ArrowLeft">返回</el-button>
        <span class="page-title">用户退款记录</span>
      </div>
    </div>

    <el-card class="search-card">
      <div class="user-info">
        <span class="label">用户ID：</span>
        <span class="value">{{ userId }}</span>
      </div>
    </el-card>

    <el-card>
      <el-table :data="data" v-loading="loading" stripe>
        <el-table-column prop="orderNo" label="订单号" width="180" />
        <el-table-column prop="amount" label="退款金额" width="120">
          <template #default="{ row }">
            ¥{{ row.amount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="退款原因" min-width="150" />
        <el-table-column prop="refundTime" label="退款时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.refundTime) }}
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          :current-page="pageNum"
          :page-size="pageSize"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.page-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
}

.search-card {
  margin-bottom: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;

  .label {
    color: var(--el-text-color-regular);
  }

  .value {
    font-weight: 500;
  }
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>