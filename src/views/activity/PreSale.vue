<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { QuestionFilled } from '@element-plus/icons-vue'
import { get, post, put } from '@/utils/request'
import {
  downloadTextbookImportTemplate,
  getTextbookOptions,
  importTextbooks,
  type TextbookOption,
} from '@/api/textbook'
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
const textbookImportLoading = ref(false)
const templateDownloadLoading = ref(false)
const textbookSearchLoading = ref(false)
const textbookOptions = ref<TextbookOption[]>([])
let textbookSearchRequestId = 0
let textbookSearchTimer: ReturnType<typeof setTimeout> | undefined

const fetchTextbookOptions = async (title = '') => {
  const requestId = ++textbookSearchRequestId
  textbookSearchLoading.value = true
  try {
    const res = await getTextbookOptions(title.trim())
    if (requestId === textbookSearchRequestId) {
      textbookOptions.value = res.data?.list || []
    }
  } catch (e: any) {
    if (requestId === textbookSearchRequestId) {
      textbookOptions.value = []
      ElMessage.error(e?.message || '加载教材失败')
    }
  } finally {
    if (requestId === textbookSearchRequestId) textbookSearchLoading.value = false
  }
}

const handleTextbookSearch = (title: string) => {
  if (textbookSearchTimer) clearTimeout(textbookSearchTimer)
  textbookSearchTimer = setTimeout(() => fetchTextbookOptions(title), 250)
}

const handleTextbookImport = async (file: File) => {
  if (!/\.(xlsx|xls)$/i.test(file.name)) {
    ElMessage.warning('仅支持 .xlsx / .xls 格式')
    return false
  }

  textbookImportLoading.value = true
  try {
    const res = await importTextbooks(file)
    ElMessage.success(res.data || '导入任务已提交，正在后台处理')
  } catch (e: any) {
    ElMessage.error(e?.message || '教材导入失败')
  } finally {
    textbookImportLoading.value = false
  }
  return false
}

const handleTemplateDownload = async () => {
  templateDownloadLoading.value = true
  try {
    const { blob, fileName } = await downloadTextbookImportTemplate()
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(objectUrl)
    ElMessage.success('导入模板下载成功')
  } catch (e: any) {
    ElMessage.error(e?.message || '导入模板下载失败')
  } finally {
    templateDownloadLoading.value = false
  }
}

const openCreate = () => {
  if (textbookSearchTimer) clearTimeout(textbookSearchTimer)
  dialog.value = { visible: true, id: null }
  form.value = { textbookId: '', price: '', stock: 0, startTime: '', endTime: '', remark: '', coverImage: '' }
  textbookOptions.value = []
  fetchTextbookOptions()
}

const openEdit = (row: any) => {
  if (textbookSearchTimer) clearTimeout(textbookSearchTimer)
  textbookSearchRequestId++
  textbookSearchLoading.value = false
  dialog.value = { visible: true, id: row.id }
  form.value = {
    textbookId: row.textbookId,
    price: row.price,
    stock: row.stock,
    startTime: row.startTime ? dayjs(row.startTime).format('YYYY-MM-DD HH:mm:ss') : '',
    endTime: row.endTime ? dayjs(row.endTime).format('YYYY-MM-DD HH:mm:ss') : '',
    remark: row.remark || '',
    coverImage: row.coverImage || '',
  }
  textbookOptions.value = row.bookName
    ? [{ id: row.textbookId, title: row.bookName, author: row.author, isbn: row.isbn }]
    : []
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
    ElMessage.warning('教材名称、预售价、开始时间必填')
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
      <div style="display:flex;align-items:center;gap:8px">
        <div style="display:flex;align-items:center;gap:4px">
          <el-button :loading="templateDownloadLoading" @click="handleTemplateDownload">下载导入模板</el-button>
          <el-tooltip placement="bottom" effect="dark">
            <template #content>
              <div style="max-width:360px;line-height:1.7">
                <div>每一行表示一条“教材 + 课程”绑定信息。</div>
                <div>推荐直接使用下载的模板：保留第一行表头，删除或覆盖第二行示例数据，再向下填写。</div>
                <div>也可以自己新建 Excel，但第一行必须使用与模板完全一致的表头，真实数据从第二行开始。</div>
                <div>表头中带 * 的字段为必填：书名、专业、课程名称、年级（1-4）、学期（1=上学期，2=下学期）。</div>
                <div>“专业”请填写当前学校后台已有的专业名称，必须完全一致，否则该行会导入失败。</div>
              </div>
            </template>
            <el-icon :size="17" color="#909399" style="cursor:help">
              <QuestionFilled />
            </el-icon>
          </el-tooltip>
        </div>
        <el-upload
          :show-file-list="false"
          :before-upload="handleTextbookImport"
          :disabled="textbookImportLoading"
          accept=".xlsx,.xls"
        >
          <el-button type="primary" plain :loading="textbookImportLoading">批量导入教材</el-button>
        </el-upload>
        <el-button type="primary" @click="openCreate">新建预售</el-button>
      </div>
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
        <el-table-column prop="bookName" label="教材名称" min-width="160" show-overflow-tooltip />
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
        <el-form-item label="教材名称">
          <el-select
            v-model="form.textbookId"
            filterable
            remote
            clearable
            reserve-keyword
            :remote-method="handleTextbookSearch"
            :loading="textbookSearchLoading"
            :disabled="!!dialog.id"
            placeholder="请输入教材名称搜索"
            no-match-text="未找到匹配教材"
            style="width:100%"
          >
            <el-option
              v-for="item in textbookOptions"
              :key="item.id"
              :label="item.title"
              :value="item.id"
            >
              <div style="display:flex;justify-content:space-between;gap:16px">
                <span>{{ item.title }}</span>
                <span style="color:#909399;font-size:12px">
                  {{ item.author || item.isbn || `ID: ${item.id}` }}
                </span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="预售价(元)">
          <el-input v-model="form.price" placeholder="如：59.00" />
        </el-form-item>
        <el-form-item label="库存">
          <el-input-number v-model="form.stock" :min="0" placeholder="0表示不限" style="width:100%" />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker v-model="form.startTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker v-model="form.endTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" placeholder="不填则手动结束" />
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
