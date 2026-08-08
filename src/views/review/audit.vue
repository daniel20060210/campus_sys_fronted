<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTable } from '@/composables'
import { getReviewAuditList, deleteReview } from '@/api'
import dayjs from 'dayjs'

const searchParams = ref<{ teacherName?: string; keyword?: string }>({})

const { loading, data, total, pageNum, pageSize, fetchData, handlePageChange, handleSizeChange } =
  useTable(getReviewAuditList, { getParams: () => ({ ...searchParams.value }) })

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该评价吗？', '提示', { type: 'warning' })
    await deleteReview(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败')
  }
}

const handleSearch = () => { pageNum.value = 1; fetchData() }
const resetSearch = () => { searchParams.value = {}; pageNum.value = 1; fetchData() }

fetchData()

const formatTime = (time: string) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : ''
</script>

<template>
  <div class="page-container" v-loading="loading">
    <div class="page-header">
      <h2 class="page-title">评价审核</h2>
    </div>

    <el-card shadow="never">
      <el-space wrap style="margin-bottom: 16px;">
        <el-input v-model="searchParams.teacherName" placeholder="教师姓名" clearable style="width: 160px" />
        <el-input v-model="searchParams.keyword" placeholder="评价内容关键词" clearable style="width: 200px" />
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </el-space>

      <el-table :data="data" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="用户" width="180">
          <template #default="{ row }">
            <div style="display:flex;align-items:center;gap:8px">
              <el-avatar :src="row.userAvatar" size="small" />
              <span>{{ row.userNickname || '未知用户' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="teacherName" label="教师" width="120" />
        <el-table-column prop="courseName" label="课程" width="140" />
        <el-table-column prop="content" label="评价内容" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">{{ row.content || '(无内容)' }}</template>
        </el-table-column>
        <el-table-column label="评分" width="160">
          <template #default="{ row }">
            <el-rate :model-value="row.score" disabled show-score text-color="#ff9900" />
          </template>
        </el-table-column>
        <el-table-column label="发布时间" width="160">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="display:flex;justify-content:flex-end;margin-top:20px">
        <el-pagination :current-page="pageNum" :page-size="pageSize" :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange" @size-change="handleSizeChange" />
      </div>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.page-container { padding: 20px; }
.page-header { margin-bottom: 20px; }
.page-title { font-size: 20px; font-weight: 600; margin: 0; }
</style>
