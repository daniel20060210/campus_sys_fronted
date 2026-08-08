<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { get, del } from '@/utils/request'
import dayjs from 'dayjs'

const loading = ref(false)
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(20)
const data = ref<any[]>([])
const searchParams = ref({ campusName: '', status: undefined as number | undefined })

const fetchData = async () => {
  loading.value = true
  try {
    const res = await get('/admin/post/list', {
      params: { page: pageNum.value, size: pageSize.value, ...searchParams.value },
    })
    data.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)

const handlePageChange = (page: number) => { pageNum.value = page; fetchData() }
const handleSizeChange = (size: number) => { pageSize.value = size; pageNum.value = 1; fetchData() }

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除帖子「${row.title}」吗？`, '提示', { type: 'warning' })
    await del(`/admin/post/${row.id}`)
    ElMessage.success('删除成功')
    fetchData()
  } catch {}
}

const detailDialog = ref({ visible: false, row: null as any })
const openDetail = (row: any) => { detailDialog.value = { visible: true, row } }
const formatTime = (t: any) => t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-'

const statusMap: Record<number, string> = { 1: '正常', 2: '已关闭', 3: '违规删除' }
</script>

<template>
  <div class="page-container" v-loading="loading">
    <div class="page-header">
      <h2 class="page-title">帖子列表</h2>
    </div>

    <el-card shadow="never" style="margin-bottom:16px">
      <el-form :inline="true">
        <el-form-item label="学校">
          <el-input v-model="searchParams.campusName" placeholder="学校名称" clearable style="width:160px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchParams.status" placeholder="全部" clearable style="width:120px">
            <el-option label="正常" :value="1" />
            <el-option label="已关闭" :value="2" />
            <el-option label="违规删除" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="() => { pageNum = 1; fetchData() }">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table :data="data" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip />
        <el-table-column prop="nickname" label="作者" width="120" />
        <el-table-column prop="targetCampusName" label="学校" width="140" />
        <el-table-column prop="viewCount" label="浏览量" width="90" />
        <el-table-column prop="likeCount" label="点赞数" width="90" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">{{ statusMap[row.status] || row.status }}</template>
        </el-table-column>
        <el-table-column label="发布时间" width="170">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDetail(row)">查看详情</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container">
        <el-pagination :current-page="pageNum" :page-size="pageSize" :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange" @size-change="handleSizeChange" />
      </div>
    </el-card>

    <el-dialog v-model="detailDialog.visible" title="帖子详情" width="600px">
      <template v-if="detailDialog.row">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="帖子ID">{{ detailDialog.row.id }}</el-descriptions-item>
          <el-descriptions-item label="作者">{{ detailDialog.row.nickname }}</el-descriptions-item>
          <el-descriptions-item label="学校">{{ detailDialog.row.targetCampusName }}</el-descriptions-item>
          <el-descriptions-item label="发布时间">{{ formatTime(detailDialog.row.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="浏览量">{{ detailDialog.row.viewCount }}</el-descriptions-item>
          <el-descriptions-item label="点赞数">{{ detailDialog.row.likeCount }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ statusMap[detailDialog.row.status] }}</el-descriptions-item>
          <el-descriptions-item label="是否置顶">{{ detailDialog.row.isTop ? '是' : '否' }}</el-descriptions-item>
          <el-descriptions-item label="标题" :span="2">{{ detailDialog.row.title }}</el-descriptions-item>
          <el-descriptions-item label="内容" :span="2">{{ detailDialog.row.content }}</el-descriptions-item>
        </el-descriptions>
      </template>
      <template #footer>
        <el-button @click="detailDialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.pagination-container { display: flex; justify-content: flex-end; margin-top: 20px; }
</style>
