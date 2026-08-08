<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTable } from '@/composables'
import { getLivingAreaList, addLivingArea, updateLivingArea, deleteLivingArea, getAllSchools, getCampusAreaList } from '@/api'
import type { PageResponse } from '@/types'

const {
  loading,
  data,
  total,
  pageNum,
  pageSize,
  fetchData,
  handlePageChange,
  handleSizeChange,
} = useTable(getLivingAreaList, { getParams: () => searchParams.value })

const dialog = ref({ visible: false, id: 0, schoolId: undefined, campusAreaId: undefined, name: '' })
const searchParams = ref({ schoolId: undefined, campusAreaId: undefined, keyword: '' })
const schools = ref<any[]>([])
const campusAreas = ref<any[]>([])
const campusLoading = ref(false)

const loadSchools = async () => {
  try {
    const res = await getAllSchools()
    schools.value = Array.isArray(res.data) ? res.data : ((res.data as PageResponse<unknown>)?.list || [])
  } catch (error) {}
}

const loadCampusAreas = async (schoolId: number) => {
  if (!schoolId) return
  campusLoading.value = true
  try {
    const res = await getCampusAreaList({ schoolId, pageNum: 1, pageSize: 1000 })
    const list = (res.data as PageResponse<unknown>)?.list || []
    campusAreas.value = Array.isArray(list) ? list : []
  } catch (error) {
    campusAreas.value = []
  } finally {
    campusLoading.value = false
  }
}

const onSchoolChange = () => {
  const schoolId = dialog.value.schoolId
  dialog.value.campusAreaId = undefined
  campusAreas.value = []
  if (schoolId) {
    loadCampusAreas(Number(schoolId))
  }
}

const openAddDialog = () => {
  campusAreas.value = []
  dialog.value = { visible: true, id: 0, schoolId: undefined, campusAreaId: undefined, name: '' }
}

const openEditDialog = (row: any) => {
  const schoolId = row.schoolId || campusAreas.value.find((a: any) => a.id === row.campusAreaId)?.schoolId
  dialog.value = {
    visible: true,
    id: row.id,
    schoolId,
    campusAreaId: row.campusAreaId,
    name: row.areaName || row.name,
  }
  if (schoolId) loadCampusAreas(schoolId)
}

const submitDialog = async () => {
  if (!dialog.value.schoolId || !dialog.value.campusAreaId) {
    ElMessage.warning('请选择学校和校区')
    return
  }
  if (!dialog.value.name.trim()) {
    ElMessage.warning('请输入生活区名称')
    return
  }
  try {
    if (dialog.value.id) {
      await updateLivingArea(dialog.value.id, { areaName: dialog.value.name })
    } else {
      await addLivingArea({ 
        campusAreaId: dialog.value.campusAreaId, 
        areaName: dialog.value.name,
        school_id: dialog.value.schoolId
      })
    }
    ElMessage.success('操作成功')
    dialog.value.visible = false
    handleSearch()
  } catch (error) {}
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该生活区吗？', '提示', { type: 'warning' })
    await deleteLivingArea(row.id)
    ElMessage.success('删除成功')
    handleSearch()
  } catch (error) {}
}

const handleSearch = () => {
  pageNum.value = 1
  fetchData(searchParams.value)
}

loadSchools()
fetchData(searchParams.value)
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">生活区管理</h2>
      <el-button type="primary" @click="openAddDialog">添加生活区</el-button>
    </div>

    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchParams">
        <el-form-item label="学校">
          <el-select v-model="searchParams.schoolId" placeholder="请选择学校" clearable style="width: 200px">
            <el-option v-for="school in schools" :key="school.id" :label="school.name" :value="school.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="() => { searchParams = { schoolId: undefined, campusAreaId: undefined, keyword: '' }; handleSearch() }">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table v-loading="loading" :data="data" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="schoolId" label="学校ID" width="100" />
        <el-table-column prop="campusAreaId" label="校区ID" width="100" />
        <el-table-column prop="areaName" label="生活区名称">
          <template #default="{ row }">{{ row.areaName || row.name }}</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">{{ (row.createdAt || row.createTime) ? new Date(row.createdAt || row.createTime).toLocaleString() : '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination :current-page="pageNum" :page-size="pageSize" :total="total" layout="total, sizes, prev, pager, next, jumper" @current-change="handlePageChange" @size-change="handleSizeChange" />
      </div>
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.id ? '编辑生活区' : '添加生活区'" width="500px">
      <el-form label-width="80px">
        <el-form-item label="学校">
          <el-select v-model="dialog.schoolId" placeholder="请选择学校" style="width: 100%" @change="onSchoolChange">
            <el-option v-for="school in schools" :key="school.id" :label="school.name" :value="school.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="校区">
          <el-select
            v-model="dialog.campusAreaId"
            placeholder="请先选择学校"
            style="width: 100%"
            :disabled="!dialog.schoolId"
            :loading="campusLoading"
            clearable
          >
            <el-option
              v-for="area in campusAreas"
              :key="area.id"
              :label="area.areaName || area.name"
              :value="area.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="生活区名称">
          <el-input v-model="dialog.name" placeholder="请输入生活区名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitDialog">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.search-card { margin-bottom: 20px; }
.pagination-container { display: flex; justify-content: flex-end; margin-top: 20px; }
</style>
