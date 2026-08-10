<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getSchoolChangeList, approveSchoolChange, rejectSchoolChange } from '@/api'
import type { SchoolChangeRequest } from '@/api/user'
import { resolveBackendUrl } from '@/utils/backend-url'
import dayjs from 'dayjs'

const formatTime = (t?: string) => (t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-')

const statusMap: Record<number, { text: string; type: string }> = {
  0: { text: '待审核', type: 'warning' },
  1: { text: '已通过', type: 'success' },
  2: { text: '已拒绝', type: 'danger' },
}

const loading = ref(false)
const data = ref<SchoolChangeRequest[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(20)

const searchStatus = ref<0 | 1 | 2 | undefined>(undefined)

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getSchoolChangeList({
      page: pageNum.value,
      size: pageSize.value,
      status: searchStatus.value,
    })
    const pageData = res.data
    data.value = pageData?.list || []
    total.value = pageData?.total || 0
  } catch (error: any) {
    ElMessage.error(error?.message || '加载失败')
    data.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pageNum.value = 1
  fetchData()
}

const handleReset = () => {
  searchStatus.value = undefined
  pageNum.value = 1
  fetchData()
}

const handlePageChange = (page: number) => {
  pageNum.value = page
  fetchData()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  pageNum.value = 1
  fetchData()
}

// 证件预览
const previewVisible = ref(false)
const previewRow = ref<SchoolChangeRequest | null>(null)
const openPreview = (row: SchoolChangeRequest) => {
  previewRow.value = row
  previewVisible.value = true
}

// 通过
const approvingId = ref<number | null>(null)

const handleApprove = async (row: SchoolChangeRequest) => {
  if (approvingId.value !== null) return
  approvingId.value = row.appealId
  try {
    await ElMessageBox.confirm(
      `确认通过「${row.userNickname}」的学校/专业修改申请吗？`,
      '通过确认',
      { type: 'success' }
    )
    await approveSchoolChange(row.appealId)
    ElMessage.success('已通过申请')
    await fetchData()
  } catch (error: any) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error?.message || '通过申请失败')
    }
  } finally {
    approvingId.value = null
  }
}

// 拒绝
const rejectDialogVisible = ref(false)
const rejectingRow = ref<SchoolChangeRequest | null>(null)
const rejectReason = ref('')
const rejectLoading = ref(false)

const openRejectDialog = (row: SchoolChangeRequest) => {
  if (approvingId.value !== null || rejectLoading.value) return
  rejectingRow.value = row
  rejectReason.value = ''
  rejectDialogVisible.value = true
}

const submitReject = async () => {
  if (rejectLoading.value) return
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请填写拒绝原因')
    return
  }
  if (!rejectingRow.value) return
  rejectLoading.value = true
  try {
    await rejectSchoolChange(rejectingRow.value.appealId, rejectReason.value)
    ElMessage.success('已拒绝申请')
    rejectDialogVisible.value = false
    fetchData()
  } catch (error: any) {
    ElMessage.error(error?.message || '拒绝失败')
  } finally {
    rejectLoading.value = false
  }
}

// 初始加载
fetchData()
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">学校 / 专业修改申请</h2>
    </div>

    <el-card class="search-card" shadow="never">
      <el-form :inline="true">
        <el-form-item label="审核状态">
          <el-select v-model="searchStatus" placeholder="全部" clearable style="width: 120px">
            <el-option label="待审核" :value="0" />
            <el-option label="已通过" :value="1" />
            <el-option label="已拒绝" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table :data="data" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="appealId" label="ID" width="70" />
        <el-table-column label="申请用户" width="140">
          <template #default="{ row }">
            <div class="user-name">{{ row.userNickname }}</div>
            <div class="text-secondary">ID: {{ row.userId }}</div>
          </template>
        </el-table-column>
        <el-table-column label="原学校 / 专业" min-width="170">
          <template #default="{ row }">
            <div>{{ row.currentCampusName }}</div>
            <div class="text-secondary">{{ row.currentMajorName || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="" width="36" align="center">
          <template #default>
            <el-icon color="#c0c4cc" style="vertical-align: middle"><Right /></el-icon>
          </template>
        </el-table-column>
        <el-table-column label="申请变更为" min-width="170">
          <template #default="{ row }">
            <div class="text-primary">{{ row.targetCampusName }}</div>
            <div class="text-secondary">{{ row.targetMajorName || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="证件材料" width="100" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openPreview(row)">查看证件</el-button>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="申诉原因" min-width="180" show-overflow-tooltip />
        <el-table-column label="申请时间" width="150">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.type" size="small">
              {{ statusMap[row.status]?.text || row.statusDesc }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="拒绝原因" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.rejectReason" class="text-danger">{{ row.rejectReason }}</span>
            <span v-else class="text-secondary">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 0">
              <el-button
                link
                type="success"
                size="small"
                :loading="approvingId === row.appealId"
                :disabled="approvingId !== null && approvingId !== row.appealId"
                @click="handleApprove(row)"
              >通过</el-button>
              <el-button
                link
                type="danger"
                size="small"
                :disabled="approvingId !== null"
                @click="openRejectDialog(row)"
              >拒绝</el-button>
            </template>
            <span v-else class="text-secondary text-sm">
              审核人: {{ row.reviewerName || '-' }}
              <br />
              {{ formatTime(row.reviewedAt) }}
            </span>
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

    <!-- 证件预览弹窗 -->
    <el-dialog v-model="previewVisible" title="证件材料" width="520px" :close-on-click-modal="false">
      <div v-if="previewRow" class="cert-preview">
        <div class="appeal-reason">
          <div class="cert-label">申诉原因</div>
          <div class="reason-content">{{ previewRow.reason || '-' }}</div>
        </div>
        <div class="cert-item">
          <div class="cert-label">学生证照片</div>
          <el-image
            :src="resolveBackendUrl(previewRow.studentCardUrl)"
            fit="contain"
            class="cert-img"
            :preview-src-list="[resolveBackendUrl(previewRow.studentCardUrl)]"
            preview-teleported
          />
        </div>
        <div class="cert-item">
          <div class="cert-label">身份证照片</div>
          <el-image
            :src="resolveBackendUrl(previewRow.idCardUrl)"
            fit="contain"
            class="cert-img"
            :preview-src-list="[resolveBackendUrl(previewRow.idCardUrl)]"
            preview-teleported
          />
        </div>
      </div>
      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
        <template v-if="previewRow?.status === 0">
          <el-button
            type="danger"
            :disabled="approvingId !== null"
            @click="previewVisible = false; openRejectDialog(previewRow)"
          >拒绝</el-button>
          <el-button
            type="success"
            :loading="approvingId === previewRow.appealId"
            :disabled="approvingId !== null && approvingId !== previewRow.appealId"
            @click="previewVisible = false; handleApprove(previewRow)"
          >通过</el-button>
        </template>
      </template>
    </el-dialog>

    <!-- 拒绝弹窗 -->
    <el-dialog v-model="rejectDialogVisible" title="拒绝申请" width="440px" :close-on-click-modal="false">
      <div class="reject-user-info">
        申请人：{{ rejectingRow?.userNickname }}（ID: {{ rejectingRow?.userId }}）
      </div>
      <el-form label-width="80px">
        <el-form-item label="拒绝原因" required>
          <el-input
            v-model="rejectReason"
            type="textarea"
            :rows="3"
            placeholder="请填写拒绝原因，将反馈给用户"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="rejectLoading" @click="submitReject">确认拒绝</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.page-header { margin-bottom: 20px; }
.page-title { font-size: 20px; font-weight: 600; margin: 0; }
.search-card { margin-bottom: 20px; }
.pagination-container { display: flex; justify-content: flex-end; margin-top: 20px; }
.user-name { font-weight: 500; }
.text-secondary { color: var(--el-text-color-secondary); font-size: 12px; }
.text-primary { color: #409eff; font-weight: 500; }
.text-danger { color: #f56c6c; font-size: 12px; }
.text-sm { font-size: 12px; }
.reject-user-info { margin-bottom: 16px; color: var(--el-text-color-regular); }
.appeal-reason {
  .cert-label {
    font-size: 13px;
    color: var(--el-text-color-regular);
    margin-bottom: 8px;
    font-weight: 500;
  }
  .reason-content {
    padding: 10px 12px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
    background: var(--el-fill-color-light);
    border-radius: 6px;
  }
}
.cert-preview {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.cert-item {
  .cert-label {
    font-size: 13px;
    color: var(--el-text-color-regular);
    margin-bottom: 8px;
    font-weight: 500;
  }
  .cert-img {
    width: 100%;
    height: 200px;
    border-radius: 6px;
    border: 1px solid #e4e7ed;
    cursor: zoom-in;
  }
}
</style>
