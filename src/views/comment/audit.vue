<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCommentAuditList, deleteComment } from '@/api'
import dayjs from 'dayjs'

interface CommentItem {
  id: number
  nickname: string
  avatarUrl: string
  content: string
  createdAt: string
}

interface PostGroup {
  postId: number
  postTitle: string
  publisherCampusName: string
  comments: CommentItem[]
  total: number
}

const loading = ref(false)
const postGroups = ref<PostGroup[]>([])
const totalRecords = ref(0)
const page = ref(1)
const size = ref(10)
const activeNames = ref<number[]>([])

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getCommentAuditList({ page: page.value, size: size.value })
    postGroups.value = res.data.list
    totalRecords.value = res.data.total
    activeNames.value = postGroups.value.map((g: PostGroup) => g.postId)
  } finally {
    loading.value = false
  }
}

const handleDelete = async (commentId: number) => {
  try {
    await ElMessageBox.confirm('确定要删除该评论吗？', '提示', { type: 'warning' })
    await deleteComment(commentId)
    ElMessage.success('删除成功')
    fetchData()
  } catch (error) {}
}

const formatTime = (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm')

const handlePageChange = (p: number) => { page.value = p; fetchData() }
const handleSizeChange = (s: number) => { size.value = s; page.value = 1; fetchData() }

onMounted(fetchData)
</script>

<template>
  <div class="page-container" v-loading="loading">
    <div class="page-header">
      <h2 class="page-title">评论列表</h2>
    </div>

    <el-collapse v-model="activeNames" class="post-collapse">
      <el-collapse-item v-for="group in postGroups" :key="group.postId" :name="group.postId">
        <template #title>
          <div class="post-header">
            <span class="post-title">{{ group.postTitle }}</span>
            <span class="post-stats">
              <el-tag type="info" size="small">评论数: {{ group.total }}</el-tag>
              <el-tag type="info" size="small" class="ml-2">{{ group.publisherCampusName }}</el-tag>
            </span>
          </div>
        </template>

        <el-table :data="group.comments" stripe style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="nickname" label="用户" width="180">
            <template #default="{ row }">
              <div class="flex items-center">
                <el-avatar :src="row.avatarUrl" size="small" class="mr-2" />
                <span>{{ row.nickname }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="content" label="评论内容" min-width="200" show-overflow-tooltip />
          <el-table-column prop="createdAt" label="发布时间" width="160">
            <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="danger" size="small" @click="handleDelete(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-collapse-item>
    </el-collapse>

    <div class="pagination-container">
      <el-pagination
        :current-page="page"
        :page-size="size"
        :total="totalRecords"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.page-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.post-collapse {
  border: none;
  :deep(.el-collapse-item__header) {
    padding: 12px 16px;
    background-color: #f5f7fa;
    border-radius: 4px;
    margin-bottom: 12px;
  }
  :deep(.el-collapse-item__arrow) {
    font-size: 18px;
  }
  :deep(.el-collapse-item__wrap) {
    border: none;
  }
  :deep(.el-collapse-item__content) {
    padding-bottom: 0;
  }
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.post-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.post-stats {
  display: flex;
  align-items: center;
}

.like-count {
  color: #f56c6c;
  font-weight: 500;
}

.ml-2 {
  margin-left: 8px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.mr-2 {
  margin-right: 8px;
}

.mr-4 {
  margin-right: 16px;
}
</style>