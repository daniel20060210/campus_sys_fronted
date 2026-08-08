<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTable } from '@/composables'
import {
  createTopicCampaign,
  getTopicCampaignDetail,
  getTopicCampaigns,
  updateTopicCampaign,
  updateTopicCampaignStatus,
  type TopicCampaignSavePayload,
} from '@/api/topic'
import { getShopList, uploadShopImage } from '@/api/shop'
import type { UploadRequestOptions } from 'element-plus'

type TopicStatus = 0 | 1 | 2 | 3

const statusOptions = [
  { label: '草稿', value: 0 },
  { label: '进行中', value: 1 },
  { label: '已结束', value: 2 },
  { label: '已下线', value: 3 },
]

const searchParams = ref<{ status?: number; keyword?: string }>({})
const {
  loading,
  data,
  total,
  pageNum,
  pageSize,
  fetchData,
  handlePageChange,
  handleSizeChange,
} = useTable(getTopicCampaigns, {
  getParams: () => ({ ...searchParams.value }),
})

const dialogVisible = ref(false)
const submitting = ref(false)
const editingId = ref<number | null>(null)
const shopOptions = ref<Array<{ id: number; shopName?: string; name?: string }>>([])

const form = reactive<{
  title: string
  subtitle: string
  coverImage: string
  description: string
  rulesText: string
  startTime: string | null
  endTime: string | null
  status: TopicStatus
  sortOrder: number
  shopIds: number[]
}>({
  title: '',
  subtitle: '',
  coverImage: '',
  description: '',
  rulesText: '',
  startTime: null,
  endTime: null,
  status: 0,
  sortOrder: 0,
  shopIds: [],
})

const resetForm = () => {
  form.title = ''
  form.subtitle = ''
  form.coverImage = ''
  form.description = ''
  form.rulesText = ''
  form.startTime = null
  form.endTime = null
  form.status = 0
  form.sortOrder = 0
  form.shopIds = []
}

const getStatusText = (status: number) => {
  return statusOptions.find((item) => item.value === Number(status))?.label || `状态${status}`
}

const getStatusTagType = (status: number) => {
  const value = Number(status)
  if (value === 1) return 'success'
  if (value === 2) return 'warning'
  if (value === 3) return 'info'
  return ''
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

const loadShopOptions = async () => {
  try {
    const res = await getShopList({ pageNum: 1, pageSize: 200, status: 1 })
    shopOptions.value = Array.isArray(res.data?.list) ? res.data.list : []
  } catch {
    shopOptions.value = []
  }
}

const handleCoverUpload = async (options: UploadRequestOptions) => {
  try {
    const file = options.file as File
    const res = await uploadShopImage(file)
    if (res.code === 200 && res.data) {
      form.coverImage = res.data
      ElMessage.success('封面上传成功')
      options.onSuccess?.(res)
      return
    }
    throw new Error(res.message || '封面上传失败')
  } catch (error: any) {
    options.onError?.(error)
    ElMessage.error(error?.message || '封面上传失败')
  }
}

const clearCoverImage = () => {
  form.coverImage = ''
}

const openCreateDialog = async () => {
  editingId.value = null
  resetForm()
  await loadShopOptions()
  dialogVisible.value = true
}

const openEditDialog = async (row: any) => {
  editingId.value = row.id
  resetForm()
  await loadShopOptions()
  const res = await getTopicCampaignDetail(row.id)
  const detail = res.data || {}
  form.title = detail.title || ''
  form.subtitle = detail.subtitle || ''
  form.coverImage = detail.coverImage || ''
  form.description = detail.description || ''
  form.rulesText = detail.rulesText || ''
  form.startTime = detail.startTime || null
  form.endTime = detail.endTime || null
  form.status = Number(detail.status ?? 0) as TopicStatus
  form.sortOrder = Number(detail.sortOrder ?? 0)
  form.shopIds = Array.isArray(detail.shops) ? detail.shops.map((item: any) => Number(item.shopId)).filter(Boolean) : []
  dialogVisible.value = true
}

const buildPayload = (): TopicCampaignSavePayload => {
  return {
    title: form.title.trim(),
    subtitle: form.subtitle.trim() || undefined,
    coverImage: form.coverImage.trim() || undefined,
    description: form.description.trim() || undefined,
    rulesText: form.rulesText.trim() || undefined,
    startTime: form.startTime,
    endTime: form.endTime,
    status: Number(form.status),
    sortOrder: Number(form.sortOrder || 0),
    shopIds: form.shopIds,
  }
}

const submitCampaign = async () => {
  if (!form.title.trim()) {
    ElMessage.warning('专题标题不能为空')
    return
  }
  submitting.value = true
  try {
    const payload = buildPayload()
    if (editingId.value) {
      await updateTopicCampaign(editingId.value, payload)
      ElMessage.success('专题更新成功')
    } else {
      await createTopicCampaign(payload)
      ElMessage.success('专题创建成功')
    }
    dialogVisible.value = false
    fetchData()
  } finally {
    submitting.value = false
  }
}

const changeStatus = async (row: any, status: TopicStatus, label: string) => {
  if (Number(row.status) === status) return
  await ElMessageBox.confirm(`确定将专题「${row.title}」设为${label}吗？`, '确认状态变更', { type: 'warning' })
  await updateTopicCampaignStatus(row.id, status)
  ElMessage.success('状态更新成功')
  fetchData()
}

fetchData()
</script>

<template>
  <div class="page-container" v-loading="loading">
    <div class="page-header">
      <h2 class="page-title">校园专题管理</h2>
      <el-button type="primary" @click="openCreateDialog">新建专题</el-button>
    </div>

    <el-card shadow="never">
      <div class="toolbar">
        <el-select v-model="searchParams.status" clearable placeholder="状态" style="width: 140px">
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-input v-model="searchParams.keyword" placeholder="标题/副标题关键词" style="width: 260px" clearable />
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <el-table :data="data" stripe>
        <el-table-column prop="id" label="ID" width="90" />
        <el-table-column prop="title" label="专题标题" min-width="220" show-overflow-tooltip />
        <el-table-column prop="subtitle" label="副标题" min-width="220" show-overflow-tooltip />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" effect="light">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="postCount" label="帖子数" width="90" />
        <el-table-column prop="sortOrder" label="排序" width="90" />
        <el-table-column prop="startTime" label="开始时间" width="180" />
        <el-table-column prop="endTime" label="结束时间" width="180" />
        <el-table-column label="操作" width="360" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button v-if="Number(row.status) !== 1" link type="success" @click="changeStatus(row, 1, '进行中')">进行中</el-button>
            <el-button v-if="Number(row.status) !== 2" link type="warning" @click="changeStatus(row, 2, '已结束')">结束</el-button>
            <el-button v-if="Number(row.status) !== 3" link @click="changeStatus(row, 3, '已下线')">下线</el-button>
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

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑专题' : '新建专题'"
      width="760px"
      :close-on-click-modal="false"
    >
      <el-form label-width="100px">
        <el-form-item label="专题标题" required>
          <el-input v-model="form.title" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="副标题">
          <el-input v-model="form.subtitle" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="封面图">
          <div class="cover-upload-block">
            <div class="cover-upload-row">
              <el-upload
                :show-file-list="false"
                :http-request="handleCoverUpload"
                accept="image/*"
              >
                <el-button type="primary" plain>{{ form.coverImage ? '重新上传' : '上传封面' }}</el-button>
              </el-upload>
              <el-button v-if="form.coverImage" link type="danger" @click="clearCoverImage">移除</el-button>
            </div>
            <el-image
              v-if="form.coverImage"
              :src="form.coverImage"
              fit="cover"
              class="cover-preview"
              :preview-src-list="[form.coverImage]"
              preview-teleported
            />
          </div>
        </el-form-item>
        <el-form-item label="专题描述">
          <el-input v-model="form.description" type="textarea" :rows="3" maxlength="2000" show-word-limit />
        </el-form-item>
        <el-form-item label="活动规则">
          <el-input v-model="form.rulesText" type="textarea" :rows="3" maxlength="2000" show-word-limit />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="开始时间">
              <el-date-picker
                v-model="form.startTime"
                type="datetime"
                value-format="YYYY-MM-DD HH:mm:ss"
                placeholder="选择开始时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间">
              <el-date-picker
                v-model="form.endTime"
                type="datetime"
                value-format="YYYY-MM-DD HH:mm:ss"
                placeholder="选择结束时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="form.status" style="width: 100%">
                <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="form.sortOrder" :min="0" :max="9999" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="关联店铺">
          <el-select v-model="form.shopIds" multiple filterable clearable placeholder="选择专题推荐店铺" style="width: 100%">
            <el-option
              v-for="shop in shopOptions"
              :key="shop.id"
              :label="shop.shopName || shop.name || `店铺#${shop.id}`"
              :value="shop.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitCampaign">保存</el-button>
      </template>
    </el-dialog>
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

.cover-upload-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cover-upload-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cover-preview {
  width: 220px;
  height: 120px;
  border-radius: 8px;
  border: 1px solid #f2d4d2;
}
</style>

