<script setup lang="ts">
import { ref } from 'vue'
import dayjs from 'dayjs'
import { getAdminOperationLogs } from '@/api'
import { useTable } from '@/composables'

const searchParams = ref<{
  operatorId?: number
  permissionCode?: 'AD_PUBLISH_AUDIT' | 'SHOP_BINDING_AUDIT_FINAL' | 'ADMIN_ACCOUNT_MANAGE'
  moduleName?: string
  resultStatus?: 0 | 1
}>({
  operatorId: undefined,
  permissionCode: undefined,
  moduleName: '',
  resultStatus: undefined,
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
} = useTable(getAdminOperationLogs, {
  getParams: () => ({
    operatorId: searchParams.value.operatorId,
    permissionCode: searchParams.value.permissionCode,
    moduleName: searchParams.value.moduleName || undefined,
    resultStatus: searchParams.value.resultStatus,
  }),
})

const handleSearch = () => {
  pageNum.value = 1
  fetchData()
}

const handleReset = () => {
  searchParams.value = {
    operatorId: undefined,
    permissionCode: undefined,
    moduleName: '',
    resultStatus: undefined,
  }
  handleSearch()
}

const formatTime = (value?: string) => {
  if (!value) return '-'
  return dayjs(value).format('YYYY-MM-DD HH:mm:ss')
}

fetchData()
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">操作审计</h2>
    </div>

    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchParams">
        <el-form-item label="操作人ID">
          <el-input-number v-model="searchParams.operatorId" :min="1" :controls="false" placeholder="操作人ID" />
        </el-form-item>
        <el-form-item label="能力点">
          <el-select v-model="searchParams.permissionCode" clearable placeholder="全部能力点" style="width: 220px">
            <el-option label="广告投放终审" value="AD_PUBLISH_AUDIT" />
            <el-option label="商家绑定终审" value="SHOP_BINDING_AUDIT_FINAL" />
            <el-option label="管理员账号管理" value="ADMIN_ACCOUNT_MANAGE" />
          </el-select>
        </el-form-item>
        <el-form-item label="模块">
          <el-input v-model="searchParams.moduleName" placeholder="模块关键词" clearable />
        </el-form-item>
        <el-form-item label="结果">
          <el-select v-model="searchParams.resultStatus" clearable placeholder="全部结果" style="width: 140px">
            <el-option label="成功" :value="1" />
            <el-option label="失败" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table v-loading="loading" :data="data" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="operatorId" label="操作人" width="90" />
        <el-table-column prop="permissionCode" label="能力点" min-width="180" />
        <el-table-column prop="moduleName" label="模块" width="120" />
        <el-table-column prop="actionName" label="动作" width="120" />
        <el-table-column label="结果" width="90">
          <template #default="{ row }">
            <el-tag :type="row.resultStatus === 1 ? 'success' : 'danger'">
              {{ row.resultStatus === 1 ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="requestPath" label="请求路径" min-width="240" show-overflow-tooltip />
        <el-table-column prop="ipAddress" label="IP" width="130" />
        <el-table-column label="时间" width="180">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column prop="errorMsg" label="错误信息" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">{{ row.errorMsg || '-' }}</template>
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

<style scoped>
.page-header {
  margin-bottom: 20px;
}

.page-title {
  margin-bottom: 8px;
  font-size: 20px;
  font-weight: 600;
}

.search-card {
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
