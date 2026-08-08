<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { getPenaltyList } from '@/api'

const loading = ref(false)
const penalties = ref<any[]>([])
const total = ref(0)
const filters = reactive({
  pageNum: 1,
  pageSize: 20,
  targetType: undefined as number | undefined,
  penaltyStatus: undefined as number | undefined,
})

const targetTypeMap: Record<number, string> = { 1: '用户', 2: '帖子', 3: '评论', 4: '租赁商品', 5: '闲置商品' }
const penaltyTypeMap: Record<number, string> = { 1: '警告', 2: '移除内容', 3: '禁发内容', 4: '禁发活动', 5: '停用账号' }
const penaltyStatusMap: Record<number, { label: string; type: string }> = {
  0: { label: '待执行', type: 'warning' },
  1: { label: '生效中', type: 'success' },
  2: { label: '已过期', type: 'info' },
  3: { label: '人工解除', type: 'danger' },
}

async function loadData() {
  loading.value = true
  try {
    const res = await getPenaltyList(filters)
    penalties.value = res.data?.list || []
    total.value = res.data?.total || 0
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <el-select v-model="filters.targetType" clearable placeholder="对象类型" style="width:140px">
          <el-option v-for="(label, val) in targetTypeMap" :key="val" :value="Number(val)" :label="label" />
        </el-select>
        <el-select v-model="filters.penaltyStatus" clearable placeholder="处罚状态" style="width:140px">
          <el-option v-for="(item, val) in penaltyStatusMap" :key="val" :value="Number(val)" :label="item.label" />
        </el-select>
        <el-button type="primary" @click="loadData">查询</el-button>
      </div>

      <el-table :data="penalties" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="对象类型" width="110">
          <template #default="{ row }">{{ row.targetTypeDesc || targetTypeMap[row.targetType] || '-' }}</template>
        </el-table-column>
        <el-table-column prop="targetId" label="对象ID" width="100" />
        <el-table-column prop="targetNickname" label="对象昵称" width="120" />
        <el-table-column label="处罚类型" width="120">
          <template #default="{ row }">{{ row.penaltyTypeDesc || penaltyTypeMap[row.penaltyType] || '-' }}</template>
        </el-table-column>
        <el-table-column prop="penaltyReason" label="处罚原因" min-width="180" show-overflow-tooltip />
        <el-table-column label="处罚状态" width="110">
          <template #default="{ row }">
            <el-tag :type="penaltyStatusMap[row.penaltyStatus]?.type">
              {{ row.penaltyStatusDesc || penaltyStatusMap[row.penaltyStatus]?.label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160" />
      </el-table>

      <div class="pager">
        <el-pagination background layout="total, prev, pager, next" :total="total"
          :current-page="filters.pageNum" :page-size="filters.pageSize"
          @current-change="(p: number) => { filters.pageNum = p; loadData() }" />
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.page { padding: 16px; }
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; }
.pager { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
