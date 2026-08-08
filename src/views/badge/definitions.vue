<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getBadgeDefinitions,
  createBadgeDefinition,
  updateBadgeDefinition,
  setBadgeDefinitionActive,
  deleteBadgeDefinition,
  recalculateAllBadges,
  type BadgeDefinition,
  type BadgeDefinitionSaveDTO,
} from '@/api'

// ---- 列表 ----
const loading = ref(false)
const tableData = ref<BadgeDefinition[]>([])
const filterType = ref<number | ''>('')

async function fetchData() {
  loading.value = true
  try {
    const res = await getBadgeDefinitions()
    tableData.value = (res as any)?.data || []
  } finally {
    loading.value = false
  }
}

const filteredData = computed(() => {
  if (filterType.value === '') return tableData.value
  return tableData.value.filter(d => d.badgeType === filterType.value)
})

// ---- Dialog ----
const dialogVisible = ref(false)
const dialogTitle = ref('')
const editingId = ref<number | null>(null)

const formRef = ref()
const form = reactive<BadgeDefinitionSaveDTO>({
  code: '',
  name: '',
  description: '',
  badgeType: 1,
  tier: 1,
  icon: '',
  renderConfig: '',
  issuanceType: 1,
  ruleType: '',
  ruleThreshold: 0,
  isActive: 1,
  priority: 0,
})

const rules = {
  code: [{ required: true, message: '请输入唯一编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入徽章名称', trigger: 'blur' }],
  badgeType: [{ required: true, message: '请选择徽章类型', trigger: 'change' }],
  issuanceType: [{ required: true, message: '请选择发放方式', trigger: 'change' }],
}

function openAddDialog() {
  editingId.value = null
  dialogTitle.value = '新增徽章定义'
  Object.assign(form, {
    code: '', name: '', description: '', badgeType: 1, tier: 1,
    icon: '', renderConfig: '', issuanceType: 1,
    ruleType: '', ruleThreshold: 0, isActive: 1, priority: 0,
  })
  dialogVisible.value = true
}

function openEditDialog(row: BadgeDefinition) {
  editingId.value = row.id
  dialogTitle.value = '编辑徽章定义'
  Object.assign(form, {
    code: row.code,
    name: row.name,
    description: row.description,
    badgeType: row.badgeType,
    tier: row.tier,
    icon: row.icon,
    renderConfig: row.renderConfig,
    issuanceType: row.issuanceType,
    ruleType: row.ruleType,
    ruleThreshold: row.ruleThreshold,
    isActive: row.isActive,
    priority: row.priority,
  })
  dialogVisible.value = true
}

async function submitDialog() {
  await formRef.value?.validate()
  try {
    if (editingId.value) {
      await updateBadgeDefinition(editingId.value, { ...form })
      ElMessage.success('修改成功')
    } else {
      await createBadgeDefinition({ ...form })
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    fetchData()
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败')
  }
}

// ---- 启用/停用 ----
async function handleToggleActive(row: BadgeDefinition) {
  const newVal = row.isActive === 1 ? 0 : 1
  const label = newVal === 1 ? '启用' : '停用'
  try {
    await ElMessageBox.confirm(`确定要${label}该徽章吗？`, '提示', { type: 'warning' })
    await setBadgeDefinitionActive(row.id, newVal as 0 | 1)
    ElMessage.success(`${label}成功`)
    fetchData()
  } catch {
    // 取消操作，忽略
  }
}

// ---- 删除 ----
async function handleDelete(row: BadgeDefinition) {
  try {
    await ElMessageBox.confirm(`确定要删除徽章【${row.name}】吗？`, '警告', { type: 'warning' })
    await deleteBadgeDefinition(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch {
    // 取消操作，忽略
  }
}

// ---- 工具函数 ----
function badgeTypeLabel(type: number) {
  return type === 1 ? '用户徽章' : '商家徽章'
}
function issuanceTypeLabel(type: number) {
  const map: Record<number, string> = { 1: '自动发放', 2: '手动发放', 3: '两者皆可' }
  return map[type] || type
}

import { computed } from 'vue'

// ---- 重算所有徽章 ----
const recalcLoading = ref(false)
async function handleRecalculateAll() {
  try {
    await ElMessageBox.confirm(
      '将对所有用户和商家重新计算自动徽章，数据量大时可能耗时较长，确定继续？',
      '确认重算',
      { type: 'warning' }
    )
    recalcLoading.value = true
    await recalculateAllBadges()
    ElMessage.success('重算已完成！')
    fetchData()
  } catch {
    // 取消操作，忽略
  } finally {
    recalcLoading.value = false
  }
}

fetchData()
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2>徽章定义管理</h2>
      <div>
        <el-button :loading="recalcLoading" @click="handleRecalculateAll">重算所有徽章</el-button>
        <el-button type="primary" @click="openAddDialog">新增徽章</el-button>
      </div>
    </div>

    <!-- 筛选 -->
    <el-card class="search-card" shadow="never">
      <el-form inline>
        <el-form-item label="徽章类型">
          <el-select v-model="filterType" placeholder="全部" clearable style="width: 140px">
            <el-option label="用户徽章" :value="1" />
            <el-option label="商家徽章" :value="2" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格 -->
    <el-card shadow="never">
      <el-table :data="filteredData" v-loading="loading" stripe border>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="code" label="编码" width="160" />
        <el-table-column prop="name" label="名称" width="130" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.badgeType === 1 ? 'primary' : 'warning'" size="small">
              {{ badgeTypeLabel(row.badgeType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="tier" label="等级" width="70" align="center" />
        <el-table-column label="发放方式" width="110">
          <template #default="{ row }">{{ issuanceTypeLabel(row.issuanceType) }}</template>
        </el-table-column>
        <el-table-column prop="ruleType" label="规则类型" width="200" />
        <el-table-column prop="ruleThreshold" label="阈值" width="80" align="center" />
        <el-table-column prop="priority" label="优先级" width="80" align="center" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isActive === 1 ? 'success' : 'info'" size="small">
              {{ row.isActive === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="160" show-overflow-tooltip />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-button
              link
              :type="row.isActive === 1 ? 'warning' : 'success'"
              size="small"
              @click="handleToggleActive(row)"
            >
              {{ row.isActive === 1 ? '停用' : '启用' }}
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑 Dialog -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="640px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="唯一编码" prop="code">
              <el-input v-model="form.code" placeholder="如 user_rookie" :disabled="!!editingId" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="徽章名称" prop="name">
              <el-input v-model="form.name" placeholder="如 新手上路" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="徽章类型" prop="badgeType">
              <el-select v-model="form.badgeType" style="width: 100%">
                <el-option label="用户徽章" :value="1" />
                <el-option label="商家徽章" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="等级 (tier)" prop="tier">
              <el-input-number v-model="form.tier" :min="1" :max="5" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="发放方式" prop="issuanceType">
              <el-select v-model="form.issuanceType" style="width: 100%">
                <el-option label="自动发放" :value="1" />
                <el-option label="手动发放" :value="2" />
                <el-option label="两者皆可" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级">
              <el-input-number v-model="form.priority" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="规则类型">
              <el-select v-model="form.ruleType" placeholder="无规则/手动" clearable style="width: 100%">
                <el-option label="评价数量" value="review_count" />
                <el-option label="评价获赞数" value="review_like_received" />
                <el-option label="店铺均分≥阈值" value="shop_avg_rating_gte" />
                <el-option label="店铺评价数≥阈值" value="shop_review_count_gte" />
                <el-option label="店铺获赞数≥阈值" value="shop_like_count_gte" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="规则阈值">
              <el-input-number v-model="form.ruleThreshold" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="图标 URL">
          <el-input v-model="form.icon" placeholder="图标地址或名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="徽章描述" />
        </el-form-item>
        <el-form-item label="渲染配置">
          <el-input
            v-model="form.renderConfig"
            type="textarea"
            :rows="3"
            placeholder='JSON 格式，如 {"color":"#FFD700","style":"gold"}'
          />
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="form.isActive" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitDialog">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-container {
  padding: 20px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.page-header h2 {
  margin: 0;
  font-size: 20px;
}
.search-card {
  margin-bottom: 16px;
}
</style>
