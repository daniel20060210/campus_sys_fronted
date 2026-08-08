<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAdminDisputeList } from '@/api'
import dayjs from 'dayjs'

const router = useRouter()
const loading = ref(false)

const orderTypeMap: Record<number, string> = { 1: '租赁', 2: '闲置', 3: '代课' }
const disputeTypeMap: Record<number, string> = { 1: '退款申诉', 2: '毁损申诉', 3: '代课违约申诉' }
const statusMap: Record<number, { label: string; type: string }> = {
  0: { label: '处理中', type: 'warning' },
  1: { label: '待超管终裁', type: 'danger' },
  2: { label: '已裁决', type: 'success' },
  3: { label: '已关闭', type: 'info' },
}

const data = ref<any[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getAdminDisputeList({ pageNum: pageNum.value, pageSize: pageSize.value })
    data.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => { pageNum.value = page; fetchData() }
const handleSizeChange = (size: number) => { pageSize.value = size; pageNum.value = 1; fetchData() }

const goToChat = (row: any) => router.push({ path: '/dispute/chat', query: { id: row.id } })

const formatTime = (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm')

onMounted(fetchData)
</script>

<template>
  <div class="page-container" v-loading="loading">
    <div class="page-header">
      <h2 class="page-title">纠纷列表</h2>
    </div>

    <el-card shadow="never">
      <el-table :data="data" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="orderId" label="订单ID" width="100" />
        <el-table-column label="订单类型" width="90">
          <template #default="{ row }">{{ orderTypeMap[row.orderType] }}</template>
        </el-table-column>
        <el-table-column label="纠纷类型" width="120">
          <template #default="{ row }">{{ disputeTypeMap[row.disputeType] }}</template>
        </el-table-column>
        <el-table-column prop="buyerNickname" label="买方" width="110" />
        <el-table-column prop="sellerNickname" label="卖方" width="110" />
        <el-table-column prop="description" label="申诉描述" min-width="180" show-overflow-tooltip />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.type">{{ statusMap[row.status]?.label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="160">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="goToChat(row)">进入</el-button>
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
.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
