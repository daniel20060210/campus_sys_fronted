<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTable } from '@/composables'
import { getSensitiveWordList, addSensitiveWord, updateSensitiveWord, deleteSensitiveWord } from '@/api'

const {
  loading,
  data,
  total,
  pageNum,
  pageSize,
  fetchData,
  handlePageChange,
  handleSizeChange,
} = useTable(getSensitiveWordList, { getParams: () => ({ keyword: searchKeyword.value }) })

const dialog = ref({ visible: false, id: 0, word: '', wordType: 1 as number, isActive: 1 as number })
const searchKeyword = ref('')

const openAddDialog = () => {
  dialog.value = { visible: true, id: 0, word: '', wordType: 1, isActive: 1 }
}

const openEditDialog = (row: any) => {
  dialog.value = {
    visible: true,
    id: row.id,
    word: row.word,
    wordType: row.wordType ?? 1,
    isActive: row.isActive ?? 1,
  }
}

const submitDialog = async () => {
  if (!dialog.value.word.trim()) {
    ElMessage.warning('请输入敏感词')
    return
  }
  try {
    if (dialog.value.id) {
      await updateSensitiveWord(dialog.value.id, {
        wordType: dialog.value.wordType,
        isActive: dialog.value.isActive,
      })
    } else {
      await addSensitiveWord({ word: dialog.value.word, wordType: dialog.value.wordType })
    }
    ElMessage.success('操作成功')
    dialog.value.visible = false
    handleSearch()
  } catch (error) {}
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该敏感词吗？', '提示', { type: 'warning' })
    await deleteSensitiveWord(row.id)
    ElMessage.success('删除成功')
    handleSearch()
  } catch (error) {}
}

const handleSearch = () => {
  pageNum.value = 1
  fetchData({ keyword: searchKeyword.value })
}

fetchData()
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">敏感词管理</h2>
      <el-button type="primary" @click="openAddDialog">添加敏感词</el-button>
    </div>

    <el-card class="search-card" shadow="never">
      <el-form :inline="true">
        <el-form-item label="关键词">
          <el-input v-model="searchKeyword" placeholder="请输入敏感词" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table v-loading="loading" :data="data" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="word" label="敏感词" />
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

    <el-dialog v-model="dialog.visible" :title="dialog.id ? '编辑敏感词' : '添加敏感词'" width="500px">
      <el-form label-width="80px">
        <el-form-item label="敏感词">
          <el-input v-model="dialog.word" placeholder="请输入敏感词" :disabled="!!dialog.id" />
          <div v-if="dialog.id" class="form-tip">敏感词内容不可修改，可调整类型和状态</div>
        </el-form-item>
        <el-form-item label="词类型">
          <el-select v-model="dialog.wordType" placeholder="请选择" style="width: 100%">
            <el-option label="高危（直接拦截）" :value="1" />
            <el-option label="可疑（需审核）" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="dialog.id" label="状态">
          <el-select v-model="dialog.isActive" placeholder="请选择" style="width: 100%">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
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
.form-tip { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 4px; }
</style>
