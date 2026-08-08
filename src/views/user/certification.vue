<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getCertificationList, approveCertification, rejectCertification } from '@/api'
import type { CertificationAdminVO } from '@/api/user'
import dayjs from 'dayjs'

const loading = ref(false)
const data = ref<CertificationAdminVO[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)

const searchStatus = ref<number | undefined>(0)

const fetchData = async (overridePage?: number) => {
  loading.value = true
  try {
    const res = await getCertificationList({
      page: overridePage ?? pageNum.value,
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

const handlePageChange = (page: number) => {
  pageNum.value = page
  fetchData(page)
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  pageNum.value = 1
  fetchData(1)
}

const handleSearch = () => {
  pageNum.value = 1
  fetchData(1)
}

// 审核对话框
const auditDialog = ref({
  visible: false,
  certificationId: 0,
  approved: true,
  rejectReason: '',
})

const openAuditDialog = (row: CertificationAdminVO, approved: boolean) => {
  auditDialog.value = {
    visible: true,
    certificationId: row.id,
    approved,
    rejectReason: '',
  }
}

const submitAudit = async () => {
  try {
    if (auditDialog.value.approved) {
      await approveCertification(auditDialog.value.certificationId)
    } else {
      if (!auditDialog.value.rejectReason.trim()) {
        ElMessage.warning('请填写拒绝原因')
        return
      }
      await rejectCertification(auditDialog.value.certificationId, auditDialog.value.rejectReason)
    }
    ElMessage.success(auditDialog.value.approved ? '已通过认证' : '已拒绝认证')
    auditDialog.value.visible = false
    fetchData(pageNum.value)
  } catch (error: any) {
    ElMessage.error(error?.message || '审核失败')
  }
}

const formatTime = (time: string) => {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const getStatusType = (status: number) => {
  const map: Record<number, string> = { 0: 'warning', 1: 'success', 2: 'danger' }
  return map[status] || 'info'
}

const getStatusText = (status: number) => {
  return status === 0 ? '待审核' : status === 1 ? '已通过' : status === 2 ? '已拒绝' : '未知'
}

fetchData()
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">学生认证审核</h2>
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
          <el-button @click="() => { searchStatus = undefined; handleSearch() }">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table v-loading="loading" :data="data" stripe style="width: 100%">
        <el-table-column prop="id" label="认证ID" width="80" />
        <el-table-column label="头像" width="80">
          <template #default="{ row }">
            <el-avatar :src="row.userAvatar" />
          </template>
        </el-table-column>
        <el-table-column prop="userNickname" label="昵称" width="120" />
        <el-table-column prop="realName" label="真实姓名" width="120" />
        <el-table-column prop="studentId" label="学号" width="150" />
        <el-table-column label="学生证" width="100" align="center">
          <template #default="{ row }">
            <el-image
              v-if="row.studentCardUrl"
              :src="row.studentCardUrl"
              :preview-src-list="[row.studentCardUrl]"
              fit="cover"
              style="width: 50px; height: 50px; border-radius: 4px"
            />
            <span v-else class="text-secondary">-</span>
          </template>
        </el-table-column>
        <el-table-column label="身份证" width="100" align="center">
          <template #default="{ row }">
            <el-image
              v-if="row.idCardUrl"
              :src="row.idCardUrl"
              :preview-src-list="[row.idCardUrl]"
              fit="cover"
              style="width: 50px; height: 50px; border-radius: 4px"
            />
            <span v-else class="text-secondary">-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ row.statusDesc || getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 0">
              <el-button link type="success" size="small" @click="openAuditDialog(row, true)">
                通过
              </el-button>
              <el-button link type="danger" size="small" @click="openAuditDialog(row, false)">
                拒绝
              </el-button>
            </template>
            <span v-else class="text-secondary text-sm">
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

    <el-dialog
      v-model="auditDialog.visible"
      :title="auditDialog.approved ? '通过认证' : '拒绝认证'"
      width="500px"
    >
      <el-form v-if="!auditDialog.approved" label-width="80px">
        <el-form-item label="拒绝原因" required>
          <el-input
            v-model="auditDialog.rejectReason"
            type="textarea"
            :rows="3"
            placeholder="请输入拒绝原因"
          />
        </el-form-item>
      </el-form>
      <div v-else>
        <p>确定要通过该用户的认证申请吗？</p>
      </div>
      <template #footer>
        <el-button @click="auditDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitAudit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.page-header {
  margin-bottom: 20px;
}
.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}
.search-card {
  margin-bottom: 20px;
}
.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
.text-secondary {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.text-sm {
  font-size: 12px;
}
</style>
