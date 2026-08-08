<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTable } from '@/composables'
import {
  deleteTopicPost,
  getTopicCampaigns,
  getTopicPosts,
  operateTopicPost,
  type TopicPostOperatePayload,
} from '@/api/topic'

const searchParams = ref<{ campaignId?: number; auditStatus?: number; keyword?: string }>({})
const {
  loading,
  data,
  total,
  pageNum,
  pageSize,
  fetchData,
  handlePageChange,
  handleSizeChange,
} = useTable(getTopicPosts, {
  getParams: () => ({ ...searchParams.value }),
})

const campaignOptions = ref<Array<{ id: number; title: string }>>([])

const loadCampaignOptions = async () => {
  try {
    const res = await getTopicCampaigns({ pageNum: 1, pageSize: 200 })
    campaignOptions.value = Array.isArray(res.data?.list) ? res.data.list.map((item: any) => ({
      id: Number(item.id),
      title: item.title || `专题#${item.id}`,
    })) : []
  } catch {
    campaignOptions.value = []
  }
}

const getAuditStatusText = (status: number) => {
  if (Number(status) === 0) return '待审核'
  if (Number(status) === 1) return '已通过'
  if (Number(status) === 2) return '已拒绝'
  return `状态${status}`
}

const getAuditStatusType = (status: number) => {
  if (Number(status) === 1) return 'success'
  if (Number(status) === 2) return 'danger'
  return 'warning'
}

const getVisibilityText = (status: number) => {
  if (Number(status) === 1) return '可见'
  if (Number(status) === 2) return '隐藏'
  if (Number(status) === 3) return '已移除'
  return `状态${status}`
}

const getVisibilityType = (status: number) => {
  if (Number(status) === 1) return 'success'
  if (Number(status) === 2) return 'warning'
  return 'info'
}

const handleSearch = () => {
  pageNum.value = 1
  fetchData()
}

const handleReset = () => {
  searchParams.value = {}
  pageNum.value = 1
  fetchData()
}

const handleOperate = async (row: any, payload: TopicPostOperatePayload, successText: string) => {
  await operateTopicPost(row.id, payload)
  ElMessage.success(successText)
  fetchData()
}

const toggleTop = async (row: any) => {
  await handleOperate(row, { isTop: Number(row.isTop) === 1 ? 0 : 1 }, Number(row.isTop) === 1 ? '已取消置顶' : '已设为置顶')
}

const toggleFeatured = async (row: any) => {
  await handleOperate(row, { isFeatured: Number(row.isFeatured) === 1 ? 0 : 1 }, Number(row.isFeatured) === 1 ? '已取消精选' : '已设为精选')
}

const toggleVisibility = async (row: any) => {
  const hidden = Number(row.visibilityStatus) === 2
  if (hidden) {
    await handleOperate(row, { visibilityStatus: 1, governanceStatus: 0 }, '帖子已恢复可见')
    return
  }
  await handleOperate(row, { visibilityStatus: 2, governanceStatus: 2 }, '帖子已隐藏')
}

const handleDelete = async (row: any) => {
  await ElMessageBox.confirm('确定删除该帖子吗？删除后不可恢复。', '删除确认', { type: 'warning' })
  await deleteTopicPost(row.id)
  ElMessage.success('帖子删除成功')
  fetchData()
}

const campaignTitleMap = () => {
  const map: Record<number, string> = {}
  campaignOptions.value.forEach((item) => {
    map[item.id] = item.title
  })
  return map
}

const getCampaignTitle = (campaignId: number) => {
  return campaignTitleMap()[Number(campaignId)] || `专题#${campaignId}`
}

loadCampaignOptions()
fetchData()
</script>

<template>
  <div class="page-container" v-loading="loading">
    <div class="page-header">
      <h2 class="page-title">专题帖子运营</h2>
    </div>

    <el-card shadow="never">
      <div class="toolbar">
        <el-select v-model="searchParams.campaignId" clearable filterable placeholder="专题" style="width: 220px">
          <el-option v-for="item in campaignOptions" :key="item.id" :label="item.title" :value="item.id" />
        </el-select>
        <el-select v-model="searchParams.auditStatus" clearable placeholder="审核状态" style="width: 140px">
          <el-option :value="0" label="待审核" />
          <el-option :value="1" label="已通过" />
          <el-option :value="2" label="已拒绝" />
        </el-select>
        <el-input v-model="searchParams.keyword" clearable placeholder="标题/内容关键词" style="width: 240px" />
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <el-table :data="data" stripe>
        <el-table-column prop="id" label="ID" width="90" />
        <el-table-column label="专题" width="180" show-overflow-tooltip>
          <template #default="{ row }">
            {{ getCampaignTitle(row.campaignId) }}
          </template>
        </el-table-column>
        <el-table-column prop="userNickname" label="发布用户" width="150">
          <template #default="{ row }">{{ row.userNickname || `用户#${row.userId}` }}</template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
        <el-table-column prop="content" label="内容" min-width="240" show-overflow-tooltip />
        <el-table-column label="审核" width="100">
          <template #default="{ row }">
            <el-tag :type="getAuditStatusType(row.auditStatus)" effect="light">{{ getAuditStatusText(row.auditStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="可见性" width="100">
          <template #default="{ row }">
            <el-tag :type="getVisibilityType(row.visibilityStatus)" effect="light">{{ getVisibilityText(row.visibilityStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="互动" width="120">
          <template #default="{ row }">
            👍 {{ row.likeCount || 0 }} / 💬 {{ row.commentCount || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="发布时间" width="180" />
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="toggleTop(row)">{{ Number(row.isTop) === 1 ? '取消置顶' : '置顶' }}</el-button>
            <el-button link type="success" @click="toggleFeatured(row)">{{ Number(row.isFeatured) === 1 ? '取消精选' : '设为精选' }}</el-button>
            <el-button link type="warning" @click="toggleVisibility(row)">{{ Number(row.visibilityStatus) === 2 ? '恢复' : '隐藏' }}</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :current-page="pageNum"
          :page-size="pageSize"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>

