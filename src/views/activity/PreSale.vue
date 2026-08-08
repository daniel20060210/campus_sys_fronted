<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { get, post, put } from '@/utils/request'
import { useUserStore } from '@/stores'
import dayjs from 'dayjs'

const userStore = useUserStore()
const isSuperAdmin = userStore.userInfo?.role === 1

const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const filterStatus = ref<number | undefined>(undefined)

const fetchData = async () => {
  if (isSuperAdmin) return
  loading.value = true
  try {
    const res = await get('/admin/presale', { params: { pageNum: pageNum.value, pageSize: pageSize.value, status: filterStatus.value } })
    list.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)

// 新增/编辑弹窗
const dialog = ref({ visible: false, id: 0 as number | null })
const form = ref({ textbookId: '', price: '', stock: 0, startTime: '', endTime: '', remark: '', coverImage: '' })
const formLoading = ref(false)
const uploadLoading = ref(false)

const openCreate = () => {
  dialog.value = { visible: true, id: null }
  form.value = { textbookId: '', price: '', stock: 0, startTime: '', endTime: '', remark: '', coverImage: '' }
}

const openEdit = (row: any) => {
  dialog.value = { visible: true, id: row.id }
  form.value = {
    textbookId: row.textbookId,
    price: row.price,
    stock: row.stock,
    startTime: row.startTime ? dayjs(row.startTime).format('YYYY-MM-DDTHH:mm:ss') : '',
    endTime: row.endTime ? dayjs(row.endTime).format('YYYY-MM-DDTHH:mm:ss') : '',
    remark: row.remark || '',
    coverImage: row.coverImage || '',
  }
}

const handleUpload = async (file: File) => {
  uploadLoading.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    const res = await import('@/utils/request').then(m => m.post<{ url: string }>('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } }))
    form.value.coverImage = res.data.url
  } catch (e: any) {
    ElMessage.error(e?.message || '上传失败')
  } finally {
    uploadLoading.value = false
  }
  return false
}

const submitForm = async () => {
  if (!form.value.textbookId || !form.value.price || !form.value.startTime) {
    ElMessage.warning('教材ID、预售价、开始时间必填')
    return
  }
  formLoading.value = true
  try {
    const payload = {
      textbookId: Number(form.value.textbookId),
      price: form.value.price,
      stock: form.value.stock,
      startTime: form.value.startTime,
      endTime: form.value.endTime || null,
      remark: form.value.remark,
      coverImage: form.value.coverImage || null,
    }
    if (dialog.value.id) {
      await put(`/admin/presale/${dialog.value.id}`, payload)
    } else {
      await post('/admin/presale', payload)
    }
    ElMessage.success('操作成功')
    dialog.value.visible = false
    fetchData()
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败')
  } finally {
    formLoading.value = false
  }
}

const handleEnd = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定手动结束该预售活动吗？', '提示', { type: 'warning' })
    await post(`/admin/presale/${row.id}/end`)
    ElMessage.success('已结束')
    fetchData()
  } catch {}
}

const fmt = (t: any) => t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-'
const statusMap: Record<number, { label: string; type: string }> = {
  1: { label: '进行中', type: 'success' },
  2: { label: '已结束', type: 'info' },
}
</script>

<template>
  <div class="page-container">
    <el-alert v-if="isSuperAdmin" type="warning" :closable="false" show-icon
      title="图书预售由各校校级管理员管理，超级管理员无法直接操作" style="margin-bottom:16px" />
    <template v-else>
    <div class="page-header">
      <h2 class="page-title">图书预售</h2>
      <el-button type="primary" @click="openCreate">新建预售</el-button>
    </div>

    <el-card shadow="never" style="margin-bottom:16px">
      <el-form :inline="true">
        <el-form-item label="状态">
          <el-select v-model="filterStatus" placeholder="全部" clearable style="width:120px">
            <el-option label="进行中" :value="1" />
            <el-option label="已结束" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="() => { pageNum = 1; fetchData() }">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table v-loading="loading" :data="list" stripe style="width:100%">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="textbookId" label="教材ID" width="100" />
        <el-table-column prop="price" label="预售价" width="100">
          <template #default="{ row }">¥{{ row.price }}</template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="80">
          <template #default="{ row }">{{ row.stock === 0 ? '不限' : row.stock }}</template>
        </el-table-column>
        <el-table-column prop="orderedCount" label="已下单" width="80" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.type">{{ statusMap[row.status]?.label || row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="开始时间" width="160">
          <template #default="{ row }">{{ fmt(row.startTime) }}</template>
        </el-table-column>
        <el-table-column label="结束时间" width="160">
          <template #default="{ row }">{{ fmt(row.endTime) }}</template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button v-if="row.status === 1" link type="danger" size="small" @click="handleEnd(row)">结束</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="display:flex;justify-content:flex-end;margin-top:16px">
        <el-pagination :current-page="pageNum" :page-size="pageSize" :total="total"
          layout="total, prev, pager, next"
          @current-change="(p: number) => { pageNum = p; fetchData() }" />
      </div>
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.id ? '编辑预售' : '新建预售'" width="480px">
      <el-form label-width="90px">
        <el-form-item label="教材ID">
          <el-input v-model="form.textbookId" placeholder="请输入教材ID" :disabled="!!dialog.id" />
        </el-form-item>
        <el-form-item label="预售价(元)">
          <el-input v-model="form.price" placeholder="如：59.00" />
        </el-form-item>
        <el-form-item label="库存">
          <el-input-number v-model="form.stock" :min="0" placeholder="0表示不限" style="width:100%" />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker v-model="form.startTime" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" style="width:100%" />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker v-model="form.endTime" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" style="width:100%" placeholder="不填则手动结束" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="封面图片">
          <el-upload
            :show-file-list="false"
            :before-upload="handleUpload"
            accept="image/*"
          >
            <img v-if="form.coverImage" :src="form.coverImage" style="width:120px;height:80px;object-fit:cover;border-radius:4px;cursor:pointer" />
            <el-button v-else :loading="uploadLoading" size="small">点击上传</el-button>
          </el-upload>
          <el-button v-if="form.coverImage" link type="danger" size="small" @click="form.coverImage = ''" style="margin-left:8px">删除</el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="formLoading" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
    </template>
  </div>
</template>
