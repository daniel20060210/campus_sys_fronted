<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTable } from '@/composables'
import { getUserList, updateUserStatus, getAllSchools } from '@/api'
import type { UserAdminVO } from '@/types'
import dayjs from 'dayjs'

const userInfo = JSON.parse(localStorage.getItem('admin_user') || '{}')
const currentSchoolId = userInfo?.schoolId
const userType = userInfo?.userType

const isSuperAdmin = Number(userType) === 1

const router = useRouter()

const goRefundList = (userId: number) => {
  router.push({ path: '/user/refund-list', query: { userId } })
}

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

const {
  loading,
  data,
  total,
  pageNum,
  pageSize,
  fetchData,
  handlePageChange,
  handleSizeChange,
} = useTable<UserAdminVO>(getUserList, { getParams: () => searchParams.value })

const searchParams = ref<{
  nickname?: string
  campusId?: number
  isVirtual?: number
  status?: number
}>({
  nickname: '',
  campusId: undefined,
  isVirtual: undefined,
  status: undefined,
})

if (!isSuperAdmin && currentSchoolId) {
  searchParams.value.campusId = currentSchoolId
}

const handleSearch = () => {
  pageNum.value = 1
  fetchData(searchParams.value)
}

const handleReset = () => {
  searchParams.value = {
    nickname: '',
    campusId: isSuperAdmin ? undefined : currentSchoolId,
    isVirtual: undefined,
    status: undefined,
  }
  handleSearch()
}

// 封号
const handleBan = async (row: UserAdminVO) => {
  try {
    await ElMessageBox.confirm(
      `确定封禁用户「${row.nickname}」吗？封号后该用户将无法登录。`,
      '封号确认',
      { type: 'warning' }
    )
    await updateUserStatus(row.id, 1)
    ElMessage.success('已封号')
    fetchData(searchParams.value)
  } catch {
    // 取消或失败
  }
}

// 解封
const handleUnban = async (row: UserAdminVO) => {
  try {
    await ElMessageBox.confirm(
      `确定解封用户「${row.nickname}」吗？`,
      '解封确认',
      { type: 'success' }
    )
    await updateUserStatus(row.id, 0)
    ElMessage.success('已解封')
    fetchData(searchParams.value)
  } catch {
    // 取消或失败
  }
}

const formatTime = (time: string) => {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

// 用户类型标签
const getUserTypeTag = (isVirtual: number) => {
  return isVirtual === 1 ? '虚拟用户' : '普通用户'
}
const getUserTypeType = (isVirtual: number) => {
  return isVirtual === 1 ? 'warning' : 'info'
}

// 初始加载
fetchData(searchParams.value)
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">用户列表</h2>
      <div v-if="currentSchoolId" class="page-subtitle">
        {{ isSuperAdmin ? '超级管理员' : `当前登录学校：${userInfo.schoolName || `ID: ${currentSchoolId}`}` }}
      </div>
    </div>

    <!-- 搜索表单 -->
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchParams">
        <el-form-item label="昵称">
          <el-input
            v-model="searchParams.nickname"
            placeholder="请输入用户昵称"
            clearable
          />
        </el-form-item>
        <el-form-item label="学校" v-if="isSuperAdmin">
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
        <el-form-item label="用户类型">
          <el-select
            v-model="searchParams.isVirtual"
            placeholder="全部类型"
            clearable
            style="width: 160px"
          >
            <el-option label="普通用户" :value="0" />
            <el-option label="虚拟用户" :value="1" />
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

    <!-- 用户列表 -->
    <el-card shadow="never">
      <el-table
        v-loading="loading"
        :data="data"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="头像" width="80">
          <template #default="{ row }">
            <el-avatar :src="row.avatarUrl" />
          </template>
        </el-table-column>
        <el-table-column prop="nickname" label="昵称" width="120" />
        <el-table-column label="用户类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getUserTypeType(row.isVirtual)" size="small">
              {{ getUserTypeTag(row.isVirtual) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="campusName" label="所属学校" min-width="140" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column label="退款次数" width="100">
          <template #default="{ row }">
            <span class="link-text" @click="goRefundList(row.id)">查看</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'success' : 'danger'" size="small">
              {{ row.status === 0 ? '正常' : '已禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="router.push({ path: `/user/detail/${row.id}` })">
              查看详情
            </el-button>
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
  </div>
</template>

<style lang="scss" scoped>
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
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.link-text {
  color: var(--el-color-primary);
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
}
</style>
