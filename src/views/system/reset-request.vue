<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import dayjs from 'dayjs'
import {
  getPasswordResetRequestPage,
  rejectPasswordResetRequest,
  resetPasswordByRequest,
} from '@/api'
import { useUserStore } from '@/stores'
import type { PasswordResetRequestVO } from '@/types'

const userStore = useUserStore()
const isSuperAdmin = computed(() => Number(userStore.userInfo?.userType) === 1)

const loading = ref(false)
const list = ref<PasswordResetRequestVO[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(20)

const query = reactive<{
  keyword?: string
  applicantType?: number
  status?: number
}>({
  keyword: '',
  applicantType: undefined,
  status: undefined,
})

const statusMap: Record<number, string> = {
  0: '待处理',
  1: '已重置',
  2: '已驳回',
}

const applicantTypeMap: Record<number, string> = {
  1: '校级管理员',
  3: '商家',
}

const statusTagTypeMap: Record<number, '' | 'success' | 'warning' | 'danger' | 'info'> = {
  0: 'warning',
  1: 'success',
  2: 'danger',
}

const resetDialogVisible = ref(false)
const resetSubmitting = ref(false)
const currentRow = ref<PasswordResetRequestVO | null>(null)
const resetFormRef = ref<FormInstance>()
const resetForm = reactive({
  newPassword: '',
  confirmPassword: '',
  processRemark: '',
})

const validateConfirmPassword = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!value) {
    callback(new Error('请再次输入新密码'))
    return
  }
  if (value !== resetForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
    return
  }
  callback()
}

const resetFormRules: FormRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, max: 32, message: '密码长度需在 8-32 位之间', trigger: 'blur' },
  ],
  confirmPassword: [{ validator: validateConfirmPassword, trigger: 'blur' }],
}

const getStatus = (row: PasswordResetRequestVO) => Number(row.status ?? -1)
const getApplicantType = (row: PasswordResetRequestVO) => Number(row.applicantType ?? -1)
const getApplicantName = (row: PasswordResetRequestVO) => row.applicantNickname || `用户${row.applicantId || '-'}`

const formatTime = (value: string | number | undefined) => {
  if (!value) return '-'
  if (typeof value === 'number') {
    return dayjs(value).format('YYYY-MM-DD HH:mm:ss')
  }
  return value
}

const canHandle = (row: PasswordResetRequestVO) => isSuperAdmin.value && getStatus(row) === 0
const INVALID_REQUEST_ID_MSG = '申请ID无效'

const getValidRequestId = (id: unknown): number | null => {
  const parsedId = Number(id)
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return null
  }
  return parsedId
}

const fetchList = async () => {
  if (!isSuperAdmin.value) {
    list.value = []
    total.value = 0
    return
  }

  loading.value = true
  try {
    const res = await getPasswordResetRequestPage({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      keyword: query.keyword?.trim() || undefined,
      applicantType: query.applicantType,
      status: query.status,
    })
    list.value = res.data?.list || []
    total.value = Number(res.data?.total || 0)
  } catch (error: any) {
    ElMessage.error(error?.message || '加载重置密码申请失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pageNum.value = 1
  fetchList()
}

const handleResetSearch = () => {
  query.keyword = ''
  query.applicantType = undefined
  query.status = undefined
  pageNum.value = 1
  fetchList()
}

const handlePageChange = (value: number) => {
  pageNum.value = value
  fetchList()
}

const handleSizeChange = (value: number) => {
  pageSize.value = value
  pageNum.value = 1
  fetchList()
}

const openResetDialog = (row: PasswordResetRequestVO) => {
  currentRow.value = row
  resetForm.newPassword = ''
  resetForm.confirmPassword = ''
  resetForm.processRemark = ''
  resetDialogVisible.value = true
}

const submitReset = async () => {
  const requestId = getValidRequestId(currentRow.value?.id)
  if (requestId === null) {
    ElMessage.error(INVALID_REQUEST_ID_MSG)
    return
  }

  const valid = await resetFormRef.value?.validate().catch(() => false)
  if (!valid) return

  try {
    await ElMessageBox.confirm('确认将该申请标记为“已重置”并提交新密码吗？', '重置确认', {
      type: 'warning',
      confirmButtonText: '确认重置',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }

  resetSubmitting.value = true
  try {
    await resetPasswordByRequest(requestId, {
      newPassword: resetForm.newPassword,
      processRemark: resetForm.processRemark?.trim() || undefined,
    })
    ElMessage.success('密码重置成功')
    resetDialogVisible.value = false
    fetchList()
  } catch (error: any) {
    ElMessage.error(error?.message || '密码重置失败')
  } finally {
    resetSubmitting.value = false
  }
}

const handleReject = async (row: PasswordResetRequestVO) => {
  const requestId = getValidRequestId(row.id)
  if (requestId === null) {
    ElMessage.error(INVALID_REQUEST_ID_MSG)
    return
  }

  try {
    const promptRes = (await ElMessageBox.prompt('请输入驳回原因', '驳回申请', {
      inputType: 'textarea',
      inputValidator: (value: string) => {
        if (!value || !value.trim()) {
          return '请输入驳回原因'
        }
        return true
      },
      confirmButtonText: '确认驳回',
      cancelButtonText: '取消',
      type: 'warning',
    })) as { value: string }

    await rejectPasswordResetRequest(requestId, { rejectReason: promptRes.value.trim() })
    ElMessage.success('申请已驳回')
    fetchList()
  } catch {
    // 用户取消时无需提示
  }
}

fetchList()
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">重置密码申请</h2>
      <div class="page-subtitle">仅超级管理员可处理校级管理员/商家的重置密码申请</div>
    </div>

    <el-card v-if="!isSuperAdmin" shadow="never">
      <el-empty description="仅超级管理员可访问该页面" />
    </el-card>

    <template v-else>
      <el-card class="search-card" shadow="never">
        <el-form :inline="true" :model="query">
          <el-form-item label="关键词">
            <el-input v-model="query.keyword" placeholder="申请人昵称/ID" clearable />
          </el-form-item>
          <el-form-item label="申请人类型">
            <el-select v-model="query.applicantType" placeholder="全部" clearable style="width: 140px">
              <el-option label="校级管理员" :value="1" />
              <el-option label="商家" :value="3" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="query.status" placeholder="全部" clearable style="width: 140px">
              <el-option label="待处理" :value="0" />
              <el-option label="已重置" :value="1" />
              <el-option label="已驳回" :value="2" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleResetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-card shadow="never">
        <el-table v-loading="loading" :data="list" stripe>
          <el-table-column prop="id" label="申请ID" width="100" />
          <el-table-column label="申请人" min-width="180">
            <template #default="{ row }">
              {{ getApplicantName(row) }}（ID: {{ row.applicantId || '-' }}）
            </template>
          </el-table-column>
          <el-table-column label="申请人类型" width="110">
            <template #default="{ row }">
              {{ applicantTypeMap[getApplicantType(row)] || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="reason" label="申请原因" min-width="220" show-overflow-tooltip />
          <el-table-column label="申请时间" min-width="170">
            <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="处理时间" min-width="170">
            <template #default="{ row }">{{ formatTime(row.processedAt) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="statusTagTypeMap[getStatus(row)] || 'info'">
                {{ statusMap[getStatus(row)] || '未知' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="处理说明" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.rejectReason || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" :disabled="!canHandle(row)" @click="openResetDialog(row)">
                重置密码
              </el-button>
              <el-button type="danger" link size="small" :disabled="!canHandle(row)" @click="handleReject(row)">
                驳回
              </el-button>
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
    </template>

    <el-dialog v-model="resetDialogVisible" title="重置密码" width="520px" :close-on-click-modal="false">
      <el-form ref="resetFormRef" :model="resetForm" :rules="resetFormRules" label-width="100px">
        <el-form-item label="申请人">
          <span>{{ currentRow?.applicantNickname || '-' }}（ID: {{ currentRow?.applicantId || '-' }}）</span>
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="resetForm.newPassword" type="password" show-password placeholder="请输入新密码" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="resetForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
        </el-form-item>
        <el-form-item label="处理备注">
          <el-input
            v-model="resetForm.processRemark"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
            placeholder="可选，记录处理说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="resetSubmitting" @click="submitReset">确认重置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-header {
  margin-bottom: 20px;
}

.page-title {
  margin-bottom: 8px;
  font-size: 20px;
  font-weight: 600;
}

.page-subtitle {
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.search-card {
  margin-bottom: 16px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>

