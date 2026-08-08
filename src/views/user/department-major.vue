<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Edit, Delete } from '@element-plus/icons-vue'
import {
  getDepartmentList,
  getMajorList,
  batchAddDepartments,
  batchAddMajors,
  updateDepartment,
  deleteDepartment,
  updateMajor,
  deleteMajor,
  getAllSchools
} from '@/api'
import type { Department, Major, BatchOperationResult, School } from '@/types'

// ==================== 学校筛选 ====================

const userInfo = JSON.parse(localStorage.getItem('admin_user') || '{}')
const isSuperAdmin = computed(() => Number(userInfo?.userType) === 1)
const adminCampusId = computed(() => userInfo?.campusId as number | undefined)

const schools = ref<School[]>([])
const selectedCampusId = ref<number | undefined>(isSuperAdmin.value ? undefined : adminCampusId.value)

const effectiveCampusId = computed(() =>
  isSuperAdmin.value ? selectedCampusId.value : adminCampusId.value
)

// ==================== 院系列表 ====================

const deptLoading = ref(false)
const departments = ref<Department[]>([])
const deptSearchKeyword = ref('')
const expandedDeptId = ref<number | null>(null)
const majorMap = ref<Record<number, Major[]>>({})
const majorLoading = ref(false)

// 前端过滤院系
const filteredDepartments = computed(() => {
  if (!deptSearchKeyword.value.trim()) return departments.value
  const kw = deptSearchKeyword.value.trim().toLowerCase()
  return departments.value.filter(d => d.name.toLowerCase().includes(kw))
})

const loadDepartments = async () => {
  if (!effectiveCampusId.value) {
    departments.value = []
    return
  }
  deptLoading.value = true
  try {
    const res = await getDepartmentList(effectiveCampusId.value)
    departments.value = res.data || []
  } catch (e: any) {
    ElMessage.error(e?.message || '加载院系失败')
  } finally {
    deptLoading.value = false
  }
}

// 展开院系行时异步加载专业
const onExpandChange = async (row: Department, expandedRows: Department[]) => {
  const isExpanded = expandedRows.some(r => r.id === row.id)
  if (isExpanded && !majorMap.value[row.id]) {
    await loadMajorsForDept(row.id)
  }
}

const loadMajorsForDept = async (deptId: number) => {
  majorLoading.value = true
  try {
    const res = await getMajorList(deptId)
    majorMap.value[deptId] = res.data || []
  } catch (e: any) {
    ElMessage.error(e?.message || '加载专业失败')
  } finally {
    majorLoading.value = false
  }
}

// ==================== 院系编辑/删除 ====================

const deptDialog = ref({ visible: false, id: 0, name: '' })

const openEditDept = (row: Department) => {
  deptDialog.value = { visible: true, id: row.id, name: row.name }
}

const submitDeptEdit = async () => {
  if (!deptDialog.value.name.trim()) {
    ElMessage.warning('院系名称不能为空')
    return
  }
  try {
    await updateDepartment(deptDialog.value.id, { name: deptDialog.value.name.trim() })
    ElMessage.success('院系修改成功')
    deptDialog.value.visible = false
    await loadDepartments()
  } catch (e: any) {
    ElMessage.error(e?.message || '修改失败')
  }
}

const handleDeleteDept = async (row: Department) => {
  try {
    await ElMessageBox.confirm(`确定要删除院系「${row.name}」吗？删除后其下专业也将不可用。`, '删除确认', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteDepartment(row.id)
    ElMessage.success('院系已删除')
    delete majorMap.value[row.id]
    await loadDepartments()
  } catch (e: any) {
    if (e !== 'cancel' && e?.message) ElMessage.error(e.message)
  }
}

// ==================== 专业编辑/删除 ====================

const majorDialog = ref({ visible: false, id: 0, name: '', deptId: 0 })

const openEditMajor = (major: Major, deptId: number) => {
  majorDialog.value = { visible: true, id: major.id, name: major.name, deptId }
}

const submitMajorEdit = async () => {
  if (!majorDialog.value.name.trim()) {
    ElMessage.warning('专业名称不能为空')
    return
  }
  try {
    await updateMajor(majorDialog.value.id, { name: majorDialog.value.name.trim() })
    ElMessage.success('专业修改成功')
    majorDialog.value.visible = false
    // 刷新该院系下的专业
    await loadMajorsForDept(majorDialog.value.deptId)
  } catch (e: any) {
    ElMessage.error(e?.message || '修改失败')
  }
}

const handleDeleteMajor = async (major: Major, deptId: number) => {
  try {
    await ElMessageBox.confirm(`确定要删除专业「${major.name}」吗？`, '删除确认', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteMajor(major.id)
    ElMessage.success('专业已删除')
    await loadMajorsForDept(deptId)
  } catch (e: any) {
    if (e !== 'cancel' && e?.message) ElMessage.error(e.message)
  }
}

// ==================== 批量新增院系 ====================

const deptTextarea = ref('')
const deptSubmitting = ref(false)
const deptResult = ref<BatchOperationResult | null>(null)

const handleBatchAddDept = async () => {
  const names = deptTextarea.value.split('\n').map(s => s.trim()).filter(Boolean)
  if (names.length === 0) { ElMessage.warning('请输入院系名称'); return }
  deptSubmitting.value = true
  try {
    const res = await batchAddDepartments(names)
    deptResult.value = res.data
    ElMessage.success(`成功 ${res.data.successCount} 个` + (res.data.failCount > 0 ? `，失败 ${res.data.failCount} 个` : ''))
    deptTextarea.value = ''
    await loadDepartments()
  } catch (e: any) {
    ElMessage.error(e?.message || '批量新增失败')
  } finally { deptSubmitting.value = false }
}

// ==================== 批量新增专业 ====================

const majorDeptId = ref<number | undefined>(undefined)
const majorTextarea = ref('')
const majorSubmitting = ref(false)
const majorResult = ref<BatchOperationResult | null>(null)

const handleBatchAddMajor = async () => {
  if (!majorDeptId.value) { ElMessage.warning('请选择目标院系'); return }
  const names = majorTextarea.value.split('\n').map(s => s.trim()).filter(Boolean)
  if (names.length === 0) { ElMessage.warning('请输入专业名称'); return }
  majorSubmitting.value = true
  try {
    const res = await batchAddMajors(majorDeptId.value, names)
    majorResult.value = res.data
    ElMessage.success(`成功 ${res.data.successCount} 个` + (res.data.failCount > 0 ? `，失败 ${res.data.failCount} 个` : ''))
    majorTextarea.value = ''
    await loadMajorsForDept(majorDeptId.value)
  } catch (e: any) {
    ElMessage.error(e?.message || '批量新增失败')
  } finally { majorSubmitting.value = false }
}

// 院系选项
const deptOptions = computed(() => departments.value.map(d => ({ label: d.name, value: d.id })))

// ==================== 加载学校列表 ====================

const loadSchools = async () => {
  if (!isSuperAdmin.value) return
  try {
    const res = await getAllSchools()
    schools.value = res.data || []
  } catch (e) { console.error('加载学校列表失败:', e) }
}

// ==================== 监听 ====================

watch(selectedCampusId, () => {
  majorMap.value = {}
  expandedDeptId.value = null
  deptResult.value = null
  majorResult.value = null
  deptSearchKeyword.value = ''
  loadDepartments()
})

onMounted(() => {
  loadSchools()
  if (effectiveCampusId.value) loadDepartments()
})
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">院系专业管理</span>
    </div>

    <div class="dp-layout">
      <!-- ==================== 左栏：批量新增 ==================== -->
      <div class="dp-left">
        <el-card>
          <template #header><span>批量新增院系</span></template>
          <el-form label-position="top">
            <el-form-item label="院系名称（一行一个）">
              <el-input v-model="deptTextarea" type="textarea" :rows="4" placeholder="计算机科学与技术学院&#10;软件学院&#10;电子工程学院" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="deptSubmitting" :icon="Plus" @click="handleBatchAddDept">批量新增</el-button>
            </el-form-item>
          </el-form>
          <div v-if="deptResult" class="batch-result">
            <el-alert :type="deptResult.failCount === 0 ? 'success' : 'warning'" :closable="false" show-icon>
              <template #title>成功 {{ deptResult.successCount }} 个，失败 {{ deptResult.failCount }} 个</template>
            </el-alert>
            <div v-if="deptResult.successItems?.length" class="result-detail">
              <el-tag v-for="name in deptResult.successItems" :key="name" type="success" size="small" style="margin: 2px">{{ name }}</el-tag>
            </div>
            <div v-if="deptResult.failDetails?.length" class="result-detail">
              <div v-for="item in deptResult.failDetails" :key="item.name" style="margin: 2px 0">
                <el-tag type="danger" size="small">{{ item.name }}</el-tag>
                <span style="margin-left: 8px; color: #999; font-size: 13px">{{ item.reason }}</span>
              </div>
            </div>
          </div>
        </el-card>

        <el-card style="margin-top: 12px">
          <template #header><span>批量新增专业</span></template>
          <el-form label-position="top">
            <el-form-item label="选择目标院系">
              <el-select v-model="majorDeptId" placeholder="请选择院系" clearable style="width: 100%">
                <el-option v-for="opt in deptOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="专业名称（一行一个）">
              <el-input v-model="majorTextarea" type="textarea" :rows="4" placeholder="软件工程&#10;计算机科学与技术&#10;数据科学与大数据技术" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="majorSubmitting" :icon="Plus" @click="handleBatchAddMajor">批量新增</el-button>
            </el-form-item>
          </el-form>
          <div v-if="majorResult" class="batch-result">
            <el-alert :type="majorResult.failCount === 0 ? 'success' : 'warning'" :closable="false" show-icon>
              <template #title>成功 {{ majorResult.successCount }} 个，失败 {{ majorResult.failCount }} 个</template>
            </el-alert>
            <div v-if="majorResult.successItems?.length" class="result-detail">
              <el-tag v-for="name in majorResult.successItems" :key="name" type="success" size="small" style="margin: 2px">{{ name }}</el-tag>
            </div>
            <div v-if="majorResult.failDetails?.length" class="result-detail">
              <div v-for="item in majorResult.failDetails" :key="item.name" style="margin: 2px 0">
                <el-tag type="danger" size="small">{{ item.name }}</el-tag>
                <span style="margin-left: 8px; color: #999; font-size: 13px">{{ item.reason }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- ==================== 右栏：院系列表 ==================== -->
      <div class="dp-right">
        <el-card>
          <template #header>
            <div class="card-header-inline">
              <span>院系列表</span>
              <el-select
                v-if="isSuperAdmin"
                v-model="selectedCampusId"
                placeholder="请选择学校"
                clearable
                style="width: 200px"
              >
                <el-option v-for="s in schools" :key="s.id" :label="s.name" :value="s.id" />
              </el-select>
            </div>
          </template>

          <!-- 搜索框 -->
          <div v-if="effectiveCampusId" class="search-bar">
            <el-input
              v-model="deptSearchKeyword"
              placeholder="搜索院系名称..."
              :prefix-icon="Search"
              clearable
              style="width: 260px"
            />
          </div>

          <el-empty v-if="!effectiveCampusId" description="请先选择学校" />
          <el-table
            v-else
            v-loading="deptLoading"
            :data="filteredDepartments"
            row-key="id"
            border
            style="width: 100%"
            @expand-change="onExpandChange"
          >
            <el-table-column type="expand">
              <template #default="{ row }">
                <div class="expand-inner">
                  <el-table
                    v-loading="majorLoading"
                    :data="majorMap[row.id] || []"
                    border
                    size="small"
                  >
                    <el-table-column prop="name" label="专业名称" />
                    <el-table-column prop="createdAt" label="创建时间" width="180" />
                    <el-table-column label="操作" width="140" align="center" fixed="right">
                      <template #default="{ row: majorRow }">
                        <el-button type="primary" link size="small" :icon="Edit" @click="openEditMajor(majorRow, row.id)">编辑</el-button>
                        <el-button type="danger" link size="small" :icon="Delete" @click="handleDeleteMajor(majorRow, row.id)">删除</el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                  <el-empty v-if="majorMap[row.id]?.length === 0" description="暂无专业，请在左侧批量新增" :image-size="60" />
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="院系名称" min-width="160" />
            <el-table-column prop="createdAt" label="创建时间" width="180" />
            <el-table-column label="操作" width="140" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" :icon="Edit" @click="openEditDept(row)">编辑</el-button>
                <el-button type="danger" link size="small" :icon="Delete" @click="handleDeleteDept(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
    </div>

    <!-- ==================== 院系编辑弹窗 ==================== -->
    <el-dialog v-model="deptDialog.visible" title="编辑院系" width="420px" :close-on-click-modal="false">
      <el-form label-position="top">
        <el-form-item label="院系名称">
          <el-input v-model="deptDialog.name" placeholder="请输入院系名称" maxlength="50" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="deptDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitDeptEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- ==================== 专业编辑弹窗 ==================== -->
    <el-dialog v-model="majorDialog.visible" title="编辑专业" width="420px" :close-on-click-modal="false">
      <el-form label-position="top">
        <el-form-item label="专业名称">
          <el-input v-model="majorDialog.name" placeholder="请输入专业名称" maxlength="50" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="majorDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitMajorEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.dp-layout { display: flex; gap: 20px; align-items: flex-start; }
.dp-left { flex: 1; min-width: 0; max-width: 440px; }
.dp-right { flex: 1; min-width: 0; }

.card-header-inline { display: flex; align-items: center; justify-content: space-between; }

.search-bar { margin-bottom: 12px; }

.expand-inner { padding: 8px 24px; }

.batch-result { margin-top: 12px; }
.result-detail { margin-top: 10px; }
.success-title { color: #67c23a; font-size: 13px; margin: 0 0 4px; }
.fail-title { color: #f56c6c; font-size: 13px; margin: 0 0 4px; }

@media (max-width: 900px) {
  .dp-layout { flex-direction: column; }
}
</style>
