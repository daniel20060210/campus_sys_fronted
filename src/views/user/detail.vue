<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getUserDetail } from '@/api'
import type { UserAdminVO } from '@/types'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()

const userId = Number(route.params.id)
const loading = ref(false)
const user = ref<UserAdminVO | null>(null)

const fetchDetail = async () => {
  if (!userId) {
    ElMessage.error('用户ID无效')
    router.back()
    return
  }
  loading.value = true
  try {
    const res = await getUserDetail(userId)
    user.value = res.data || null
  } catch (error: any) {
    ElMessage.error(error?.message || '获取用户详情失败')
    router.back()
  } finally {
    loading.value = false
  }
}

onMounted(fetchDetail)

const formatTime = (time: string) => {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="page-container" v-loading="loading">
    <div class="page-header">
      <div class="header-left">
        <el-button @click="goBack" :icon="'ArrowLeft'">返回</el-button>
        <h2 class="page-title">用户详情</h2>
      </div>
    </div>

    <el-card v-if="user" shadow="never">
      <el-descriptions title="基本信息" :column="2" border>
        <el-descriptions-item label="用户ID">{{ user.id }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ user.nickname }}</el-descriptions-item>
        <el-descriptions-item label="OpenId">{{ user.openId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ user.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="头像">
          <el-avatar :src="user.avatarUrl" :size="60" />
        </el-descriptions-item>
        <el-descriptions-item label="用户类型">
          <el-tag :type="user.isVirtual === 1 ? 'warning' : 'info'" size="small">
            {{ user.isVirtual === 1 ? '虚拟用户' : '普通用户' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="user.status === 0 ? 'success' : 'danger'" size="small">
            {{ user.status === 0 ? '正常' : '已禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ formatTime(user.createdAt) }}</el-descriptions-item>
      </el-descriptions>

      <el-descriptions title="学校/院系信息" :column="2" border style="margin-top: 20px">
        <el-descriptions-item label="所属学校">{{ user.campusName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="学校ID">{{ user.campusId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="院系">{{ user.departmentName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="专业">{{ user.majorName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="入学年份">{{ user.enrollmentYear || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-descriptions title="其他信息" :column="2" border style="margin-top: 20px">
        <el-descriptions-item label="邀请码">{{ user.inviteCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="邀请人ID">{{ user.invitedByUserId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatTime(user.updatedAt) }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-empty v-else-if="!loading" description="用户不存在" />
  </div>
</template>

<style lang="scss" scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}
</style>
