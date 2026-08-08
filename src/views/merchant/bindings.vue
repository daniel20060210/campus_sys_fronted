<template>
  <div class="merchant-bindings-page">
    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="never">
      <el-row :gutter="16" align="middle">
        <el-col :span="6">
          <el-select v-model="status" placeholder="审核状态" clearable>
            <el-option label="待审核" :value="0" />
            <el-option label="已通过" :value="1" />
            <el-option label="已拒绝" :value="2" />
          </el-select>
        </el-col>
        <el-col :span="10">
          <el-input
            v-model="keyword"
            placeholder="搜索商家用户名/店铺名称"
            prefix-icon="Search"
            clearable
          />
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 数据表格 -->
    <el-table v-loading="loading" :data="list" stripe style="width: 100%">
      <el-table-column label="店铺" min-width="180">
        <template #default="{ row }">
          <div class="shop-cell">
            <el-image
              v-if="row.coverImage"
              :src="row.coverImage"
              style="width: 42px; height: 42px; border-radius: 4px; object-fit: cover; flex-shrink: 0"
            />
            <div v-else class="no-img">
              <el-icon><Shop /></el-icon>
            </div>
            <div class="cell-text">
              <div class="cell-main">{{ row.shopName || `店铺 #${row.shopId}` }}</div>
              <div class="cell-sub">{{ row.shopTypeDesc }}</div>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="申请商家" min-width="140">
        <template #default="{ row }">
          <div class="cell-text">
            <div class="cell-main">{{ row.merchantNickname || row.merchantUsername || `用户 #${row.merchantId}` }}</div>
            <div class="cell-sub" v-if="row.merchantUsername">@{{ row.merchantUsername }}</div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="申请说明" prop="applyReason" min-width="160" show-overflow-tooltip>
        <template #default="{ row }">
          <span v-if="row.applyReason">{{ row.applyReason }}</span>
          <span v-else style="color: #c0c4cc">未填写</span>
        </template>
      </el-table-column>

      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)">{{ row.statusDesc }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="拒绝原因" prop="rejectReason" min-width="140" show-overflow-tooltip>
        <template #default="{ row }">
          <span v-if="row.rejectReason" style="color: #f56c6c">{{ row.rejectReason }}</span>
          <span v-else>—</span>
        </template>
      </el-table-column>

      <el-table-column label="申请时间" width="155">
        <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
      </el-table-column>

      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <template v-if="row.status === 0 && canFinalAuditBinding()">
            <el-button type="success" size="small" link @click="handleApprove(row)">通过</el-button>
            <el-button type="danger" size="small" link @click="openRejectDialog(row)">拒绝</el-button>
          </template>
          <span v-else style="color: #c0c4cc; font-size: 12px">已处理</span>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrap" v-if="total > 0">
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, sizes, prev, pager, next"
        :page-sizes="[10, 20, 50]"
        @current-change="loadData"
        @size-change="handleSizeChange"
      />
    </div>

    <!-- 拒绝对话框 -->
    <el-dialog v-model="rejectDialogVisible" title="拒绝绑定申请" width="420px" :close-on-click-modal="false">
      <el-form ref="rejectFormRef" :model="rejectForm" :rules="rejectRules" label-width="80px">
        <el-form-item label="拒绝原因" prop="rejectReason">
          <el-input
            v-model="rejectForm.rejectReason"
            type="textarea"
            :rows="3"
            placeholder="请输入拒绝原因"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="actionLoading" @click="handleReject">确认拒绝</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Shop } from '@element-plus/icons-vue'
import { getMerchantBindings, approveMerchantBinding, rejectMerchantBinding } from '@/api/shop'
import { useUserStore } from '@/stores'

const userStore = useUserStore()
const canFinalAuditBinding = () => userStore.hasPermission('SHOP_BINDING_AUDIT_FINAL')

const loading = ref(false)
const actionLoading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const status = ref<number | undefined>(undefined)
const keyword = ref('')

const rejectDialogVisible = ref(false)
const rejectFormRef = ref()
const rejectForm = reactive({ rejectReason: '' })
const rejectRules = {
  rejectReason: [{ required: true, message: '请输入拒绝原因', trigger: 'blur' }]
}
let currentRow: any = null

onMounted(() => loadData())

const loadData = async () => {
  loading.value = true
  try {
    const params: any = { pageNum: pageNum.value, pageSize: pageSize.value }
    if (status.value !== undefined && status.value !== null) params.status = status.value
    if (keyword.value) params.keyword = keyword.value

    const res = await getMerchantBindings(params)
    list.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pageNum.value = 1
  loadData()
}

const handleReset = () => {
  status.value = undefined
  keyword.value = ''
  pageNum.value = 1
  loadData()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  pageNum.value = 1
  loadData()
}

const handleApprove = async (row: any) => {
  if (!canFinalAuditBinding()) {
    ElMessage.warning('当前账号没有商家绑定终审权限')
    return
  }
  await ElMessageBox.confirm(
    `确认通过「${row.shopName || '未知店铺'}」的商家绑定申请？`,
    '审核确认',
    { confirmButtonText: '确认通过', cancelButtonText: '取消', type: 'warning' }
  )
  actionLoading.value = true
  try {
    await approveMerchantBinding(row.id)
    ElMessage.success('已通过该申请')
    loadData()
  } finally {
    actionLoading.value = false
  }
}

const openRejectDialog = (row: any) => {
  if (!canFinalAuditBinding()) {
    ElMessage.warning('当前账号没有商家绑定终审权限')
    return
  }
  currentRow = row
  rejectForm.rejectReason = ''
  rejectDialogVisible.value = true
}

const handleReject = async () => {
  await rejectFormRef.value.validate()
  actionLoading.value = true
  try {
    await rejectMerchantBinding(currentRow.id, rejectForm.rejectReason)
    ElMessage.success('已拒绝该申请')
    rejectDialogVisible.value = false
    loadData()
  } finally {
    actionLoading.value = false
  }
}

const statusTagType = (s: number) => {
  return ({ 0: 'warning', 1: 'success', 2: 'danger' } as any)[s] || 'info'
}

const formatDate = (d: string) => {
  if (!d) return ''
  return new Date(d).toLocaleString('zh-CN', { hour12: false }).slice(0, 16)
}
</script>

<style scoped>
.merchant-bindings-page {
  padding: 0;
}

.search-card {
  margin-bottom: 16px;
}

.shop-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.no-img {
  width: 42px;
  height: 42px;
  background: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  flex-shrink: 0;
}

.cell-text .cell-main {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.cell-text .cell-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

.pagination-wrap {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
