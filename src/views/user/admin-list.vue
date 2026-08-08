<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTable } from '@/composables'
import { getAdminPage, createAdmin, updateAdminStatus, getAllSchools } from '@/api'
import dayjs from 'dayjs'

interface AdminRow {
  id: number
  username: string
  role: number
  campusId: number
  campusName: string
  status: number
  lastLoginAt: string
  createdAt: string
}

const userInfo = JSON.parse(localStorage.getItem('admin_user') || '{}')
const isSuperAdmin = Number(userInfo?.userType) === 1

const formatTime = (t: string) => {
  if (!t) return '-'
  return dayjs(t).format('YYYY-MM-DD HH:mm')
}

// 学校列表
const schools = ref<any[]>([])
const loadSchools = async () => {
  try {
    const res = await getAllSchools()
    schools.value = res.data || []
  } catch (error) {
    console.error('加载学校列表失败:', error)
  }
}
loadSchools()

const searchParams = ref({
  campusId: undefined as number | undefined,
  status: undefined as number | undefined,
})

const {
  loading,
  data,
  total,
  pageNum,
  pageSize,
  fetchData,
  handlePageChange,
  handleSizeChange,
} = useTable<AdminRow>(getAdminPage, { getParams: () => searchParams.value })

const handleSearch = () => {
  pageNum.value = 1
  fetchData(searchParams.value)
}

const handleReset = () => {
  searchParams.value = { campusId: undefined, status: undefined }
  handleSearch()
}

// 封号
const handleBan = async (row: AdminRow) => {
  try {
    await ElMessageBox.confirm(
      `确定封禁管理员「${row.username}」吗？封号后该账号将无法登录。`,
      '封号确认',
      { type: 'warning' }
    )
    await updateAdminStatus(row.id, 1)
    ElMessage.success('已封号')
    fetchData(searchParams.value)
  } catch {
    // 取消或失败
  }
}

// 解封
const handleUnban = async (row: AdminRow) => {
  try {
    await ElMessageBox.confirm(
      `确定解封管理员「${row.username}」吗？`,
      '解封确认',
      { type: 'success' }
    )
    await updateAdminStatus(row.id, 0)
    ElMessage.success('已解封')
    fetchData(searchParams.value)
  } catch {
    // 取消或失败
  }
}

// 新增
const addDialogVisible = ref(false)
const addForm = ref({ username: '', password: '', campusId: undefined as number | undefined })
const addLoading = ref(false)

const openAddDialog = () => {
  addForm.value = { username: '', password: '', campusId: undefined }
  addDialogVisible.value = true
}

const submitAdd = async () => {
  if (!addForm.value.username.trim() || !addForm.value.password.trim()) {
    ElMessage.warning('账号和密码为必填项')
    return
  }
  if (!addForm.value.campusId) {
    ElMessage.warning('请选择管辖学校')
    return
  }
  addLoading.value = true
  try {
    await createAdmin({
      username: addForm.value.username,
      password: addForm.value.password,
      campusId: addForm.value.campusId,
    })
    ElMessage.success('新增成功')
    addDialogVisible.value = false
    fetchData(searchParams.value)
  } catch (error: any) {
    ElMessage.error(error?.message || '新增失败')
  } finally {
    addLoading.value = false
  }
}

// 初始加载
fetchData(searchParams.value)
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">校级管理员列表</h2>
      <el-button v-if="isSuperAdmin" type="primary" @click="openAddDialog">+ 新增校级管理员</el-button>
    </div>

    <el-card class="search-card" shadow="never">
      <el-form :inline="true">
        <el-form-item label="学校">
          <el-select
            v-model="searchParams.campusId"
            placeholder="全部学校"
            clearable
            style="width: 200px"
          >
            <el-option label="全部学校" :value="undefined" />
            <el-option
              v-for="school in schools"
              :key="school.id"
              :label="`${school.name} (ID: ${school.id})`"
              :value="school.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchParams.status"
            placeholder="全部状态"
            clearable
            style="width: 120px"
          >
            <el-option label="正常" :value="0" />
            <el-option label="已禁用" :value="1" />
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
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="账号" width="140" />
        <el-table-column prop="campusName" label="管辖学校" min-width="180" />
        <el-table-column label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="row.role === 1 ? 'danger' : 'primary'" size="small">
              {{ row.role === 1 ? '超级管理员' : '校级管理员' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="账号状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'success' : 'danger'" size="small">
              {{ row.status === 0 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最后登录" width="180">
          <template #default="{ row }">{{ formatTime(row.lastLoginAt) }}</template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 0"
              link
              type="danger"
              size="small"
              @click="handleBan(row)"
            >
              封号
            </el-button>
            <el-button
              v-else
              link
              type="success"
              size="small"
              @click="handleUnban(row)"
            >
              解封
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

    <!-- 新增管理员弹窗 -->
    <el-dialog v-model="addDialogVisible" title="新增校级管理员" width="480px" :close-on-click-modal="false">
      <el-form :model="addForm" label-width="90px">
        <el-form-item label="登录账号" required>
          <el-input v-model="addForm.username" placeholder="请输入登录账号" />
        </el-form-item>
        <el-form-item label="初始密码" required>
          <el-input
            v-model="addForm.password"
            placeholder="8-16位数字或字母"
            show-password
          />
        </el-form-item>
        <el-form-item label="管辖学校" required>
          <el-select
            v-model="addForm.campusId"
            placeholder="请选择管辖学校"
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="school in schools"
              :key="school.id"
              :label="`${school.name} (ID: ${school.id})`"
              :value="school.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="addLoading" @click="submitAdd">确认新增</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.page-title { font-size: 20px; font-weight: 600; margin: 0; }
.search-card { margin-bottom: 20px; }
.pagination-container { display: flex; justify-content: flex-end; margin-top: 20px; }
</style>
