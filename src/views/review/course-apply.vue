<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTable } from '@/composables'
import { getCourseApplyList, reviewCourseApply } from '@/api'
import dayjs from 'dayjs'

const { loading, data, total, pageNum, pageSize, fetchData, handlePageChange, handleSizeChange } =
  useTable(getCourseApplyList)

const rejectDialogVisible = ref(false)
const rejectReason = ref('')
const currentRow = ref<any>(null)

const statusMap: Record<number, string> = { 0: '待审核', 1: '已通过', 2: '已拒绝' }

const formatTime = (time: string) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : ''

// 通过
async function handleApprove(row: any) {
  try {
    await ElMessageBox.confirm(
      `确定通过「${row.teacherName} - ${row.courseName}」的课程申请吗？通过后将自动绑定课程。`,
      '确认通过',
      { confirmButtonText: '通过', type: 'success' }
    )
    await reviewCourseApply(row.id, { approved: true })
    ElMessage.success('已通过')
    fetchData()
  } catch (err) {
    if (err !== 'cancel') ElMessage.error('操作失败')
  }
}

// 打开拒绝弹窗
function openReject(row: any) {
  currentRow.value = row
  rejectReason.value = ''
  rejectDialogVisible.value = true
}

// 确认拒绝
async function confirmReject() {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请输入拒绝原因')
    return
  }
  try {
    await reviewCourseApply(currentRow.value.id, {
      approved: false,
      rejectReason: rejectReason.value.trim()
    })
    ElMessage.success('已拒绝')
    rejectDialogVisible.value = false
    fetchData()
  } catch (err: any) {
    ElMessage.error(err.message || '操作失败')
  }
}

fetchData()
</script>

<template>
  <div class="page-container" v-loading="loading">
    <div class="page-header">
      <h2 class="page-title">课程申请审核</h2>
      <p class="page-desc">学生在小程序端为教师申请添加课程，校级管理员在此审核</p>
    </div>

    <el-card shadow="never">
      <el-table :data="data" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="teacherName" label="教师" width="140" />
        <el-table-column prop="courseName" label="申请课程" width="180" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'warning' : row.status === 1 ? 'success' : 'danger'" size="small">
              {{ statusMap[row.status] || '未知' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rejectReason" label="拒绝原因" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">{{ row.rejectReason || '-' }}</template>
        </el-table-column>
        <el-table-column label="申请时间" width="160">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 0">
              <el-button link type="success" size="small" @click="handleApprove(row)">通过</el-button>
              <el-button link type="danger" size="small" @click="openReject(row)">拒绝</el-button>
            </template>
            <span v-else style="color: var(--el-text-color-secondary); font-size: 13px">已处理</span>
          </template>
        </el-table-column>
      </el-table>

      <div style="display:flex;justify-content:flex-end;margin-top:20px">
        <el-pagination :current-page="pageNum" :page-size="pageSize" :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange" @size-change="handleSizeChange" />
      </div>
    </el-card>

    <!-- 拒绝原因弹窗 -->
    <el-dialog v-model="rejectDialogVisible" title="拒绝申请" width="450px">
      <el-form>
        <el-form-item label="申请信息">
          <span v-if="currentRow">{{ currentRow.teacherName }} - {{ currentRow.courseName }}</span>
        </el-form-item>
        <el-form-item label="拒绝原因">
          <el-input
            v-model="rejectReason"
            type="textarea"
            :rows="3"
            placeholder="请输入拒绝原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmReject">确认拒绝</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.page-container { padding: 20px; }
.page-header { margin-bottom: 20px; }
.page-title { font-size: 20px; font-weight: 600; margin: 0 0 8px 0; }
.page-desc { font-size: 13px; color: var(--el-text-color-secondary); margin: 0; }
</style>
