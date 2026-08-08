<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTable } from '@/composables/useTable'
import { listAds, createAd, updateAd, deleteAd, auditAd, getShopList, getShopActivities, uploadShopImage } from '@/api'
import { useUserStore } from '@/stores'
import dayjs from 'dayjs'
import type { AdminAdvertisementVO } from '@/types'
import type { UploadRequestOptions } from 'element-plus'

const userStore = useUserStore()
const canManageAds = computed(() => userStore.hasPermission('AD_PUBLISH_AUDIT'))

const AD_TYPE_MAP: Record<number, string> = {
  2: '热搜广告',
  4: '店铺推广',
  5: '活动推广',
}

const STATUS_MAP: Record<number, string> = {
  0: '待审核',
  1: '投放中',
  2: '已暂停',
  3: '已结束',
  4: '已拒绝',
}

const {
  loading,
  data,
  total,
  pageNum,
  pageSize,
  fetchData,
  handlePageChange,
  handleSizeChange,
} = useTable(listAds, {
  getParams: () => ({
    adType: filterAdType.value || undefined,
    status: filterStatus.value || undefined,
  }),
})

const filterAdType = ref<number | ''>('')
const filterStatus = ref<number | ''>('')

const handleSearch = () => {
  pageNum.value = 1
  fetchData()
}

const handleReset = () => {
  filterAdType.value = ''
  filterStatus.value = ''
  handleSearch()
}

const formatTime = (time: string | number | null) =>
  time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'

const getStatusTagType = (status?: number) => {
  if (status === 1) return 'success'
  if (status === 0) return 'warning'
  if (status === 4) return 'danger'
  return 'info'
}

const getTargetLabel = (adType?: number) => {
  if (adType === 4) return '店铺'
  if (adType === 5) return '活动'
  return '热搜关键词'
}

// 添加/编辑广告弹窗
const dialogVisible = ref(false)
const dialogTitle = ref('添加广告')
const dialogSaving = ref(false)
const editingId = ref<number | null>(null)
const shopLoading = ref(false)
const activityLoading = ref(false)
const shopOptions = ref<Array<{ id: number; name: string }>>([])
const activityOptions = ref<Array<{ id: number; title: string; coverImage?: string; startTime?: string; endTime?: string }>>([])
const selectedActivityInfo = ref<{ title?: string; coverImage?: string; startTime?: string; endTime?: string } | null>(null)
const resolvedPromotionImage = computed(() => {
  const customImage = form.imageUrl?.trim()
  if (customImage) return customImage
  if (form.adType === 5) {
    return selectedActivityInfo.value?.coverImage || ''
  }
  return ''
})

const form = reactive<{
  adType: 2 | 4 | 5
  shopId: number | null
  adName: string
  linkTargetId: number | null
  title: string
  imageUrl: string
  keyword: string
  rankPosition: number | null
  startTime: string
  endTime: string
  displayOrder: number
  status: number
}>({
  adType: 2,
  shopId: null,
  adName: '',
  linkTargetId: null,
  title: '',
  imageUrl: '',
  keyword: '',
  rankPosition: null,
  startTime: '',
  endTime: '',
  displayOrder: 0,
  status: 1,
})

const openAddDialog = () => {
  if (!canManageAds.value) {
    ElMessage.warning('当前账号没有广告管理权限')
    return
  }
  editingId.value = null
  dialogTitle.value = '添加广告'
  const now = new Date()
  const start = dayjs(now)
  Object.assign(form, {
    adType: 2,
    shopId: null,
    adName: '',
    linkTargetId: null,
    title: '',
    imageUrl: '',
    keyword: '',
    rankPosition: 1,
    startTime: start.format('YYYY-MM-DD HH:mm:ss'),
    endTime: start.add(24, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    displayOrder: 0,
    status: 1,
  })
  activityOptions.value = []
  selectedActivityInfo.value = null
  dialogVisible.value = true
}

const ensureShopOption = (id?: number | null, name?: string) => {
  if (!id) return
  if (!shopOptions.value.some((s) => s.id === id)) {
    shopOptions.value.unshift({ id, name: name || `店铺 #${id}` })
  }
}

const ensureActivityOption = (id?: number | null, title?: string) => {
  if (!id) return
  if (!activityOptions.value.some((a) => a.id === id)) {
    activityOptions.value.unshift({ id, title: title || `当前活动 #${id}` })
  }
}

const loadShopOptions = async (keyword?: string) => {
  shopLoading.value = true
  try {
    const res = await getShopList({ keyword: keyword || undefined, pageNum: 1, pageSize: 100 })
    if (res.code === 200 && Array.isArray(res.data?.list)) {
      shopOptions.value = res.data.list.map((s: any) => ({ id: s.id, name: s.shopName || s.name || `店铺 #${s.id}` }))
    }
  } finally {
    shopLoading.value = false
  }
}

const loadActivityOptions = async (shopId: number) => {
  activityLoading.value = true
  try {
    const res = await getShopActivities(shopId, { pageNum: 1, pageSize: 100 })
    if (res.code === 200 && Array.isArray(res.data?.list)) {
      activityOptions.value = res.data.list.map((a) => ({
        id: a.id,
        title: `${a.id} - ${a.title}`,
        coverImage: a.coverImage,
        startTime: a.startTime,
        endTime: a.endTime,
      }))
    } else {
      activityOptions.value = []
    }
  } catch {
    activityOptions.value = []
  } finally {
    activityLoading.value = false
  }
}

const onShopChange = async (shopId: number | null) => {
  if (!shopId) {
    if (form.adType === 5) {
      activityOptions.value = []
      form.linkTargetId = null
      selectedActivityInfo.value = null
    }
    return
  }
  if (form.adType === 4) {
    form.linkTargetId = shopId
    return
  }
  if (form.adType === 5) {
    await loadActivityOptions(shopId)
    if (!activityOptions.value.some((a) => a.id === form.linkTargetId)) {
      form.linkTargetId = null
    }
    selectedActivityInfo.value = activityOptions.value.find((a) => a.id === form.linkTargetId) || null
  }
}

const onActivityChange = (activityId: number | null) => {
  selectedActivityInfo.value = activityOptions.value.find((a) => a.id === activityId) || null
  if (form.adType === 5 && !form.imageUrl?.trim() && selectedActivityInfo.value?.coverImage) {
    form.imageUrl = selectedActivityInfo.value.coverImage
  }
}

const handleImageUpload = async (options: UploadRequestOptions) => {
  try {
    const file = options.file as File
    const res = await uploadShopImage(file)
    if (res.code === 200 && res.data) {
      form.imageUrl = res.data
      ElMessage.success('图片上传成功')
      options.onSuccess?.(res)
      return
    }
    throw new Error(res.message || '图片上传失败')
  } catch (error: any) {
    options.onError?.(error)
    ElMessage.error(error?.message || '图片上传失败')
  }
}

const openEditDialog = async (row: AdminAdvertisementVO) => {
  if (!canManageAds.value) {
    ElMessage.warning('当前账号没有广告管理权限')
    return
  }
  editingId.value = row.id
  dialogTitle.value = '编辑广告'
  Object.assign(form, {
    adType: (row.adType || 2) as 2 | 4 | 5,
    shopId: row.adType === 4 ? row.linkTargetId ?? null : (row.targetShopId ?? null),
    adName: row.adName || '',
    linkTargetId: row.linkTargetId ?? null,
    title: row.title || '',
    imageUrl: row.imageUrl || '',
    keyword: row.keyword || '',
    rankPosition: row.rankPosition ?? 1,
    startTime: row.startTime ? dayjs(row.startTime).format('YYYY-MM-DD HH:mm:ss') : '',
    endTime: row.endTime ? dayjs(row.endTime).format('YYYY-MM-DD HH:mm:ss') : '',
    displayOrder: row.displayOrder ?? 0,
    status: row.status ?? 1,
  })

  if (form.adType === 4) {
    ensureShopOption(form.shopId, row.targetShopName || row.targetName || row.title)
  }
  if (form.adType === 5) {
    ensureShopOption(form.shopId, row.targetShopName)
    ensureActivityOption(form.linkTargetId, row.targetName)
    selectedActivityInfo.value = {
      title: row.targetName || row.title,
      coverImage: row.targetImageUrl,
      startTime: row.targetStartTime,
      endTime: row.targetEndTime,
    }
    if (!form.imageUrl?.trim() && selectedActivityInfo.value.coverImage) {
      form.imageUrl = selectedActivityInfo.value.coverImage
    }
  }

  if (form.shopId && form.adType === 5) {
    await loadActivityOptions(form.shopId)
    ensureActivityOption(form.linkTargetId, row.targetName)
    onActivityChange(form.linkTargetId)
  }

  dialogVisible.value = true
}

watch(
  () => form.adType,
  (type) => {
    if (type === 2) {
      form.shopId = null
      activityOptions.value = []
      selectedActivityInfo.value = null
      return
    }
    if (type === 4) {
      activityOptions.value = []
      form.linkTargetId = form.shopId
      selectedActivityInfo.value = null
      return
    }
    if (type === 5 && form.shopId) {
      loadActivityOptions(form.shopId)
    }
  }
)

const submitDialog = async () => {
  if (!canManageAds.value) {
    ElMessage.warning('当前账号没有广告管理权限')
    return
  }
  if (!form.adName?.trim()) {
    ElMessage.warning('广告名称不能为空')
    return
  }
  if (!form.startTime) {
    ElMessage.warning('请选择投放开始时间')
    return
  }
  if (!form.endTime || !dayjs(form.endTime).isAfter(dayjs(form.startTime))) {
    ElMessage.warning('结束时间必须晚于开始时间')
    return
  }
  if (form.adType === 2) {
    if (!form.keyword?.trim()) {
      ElMessage.warning('关键词不能为空')
      return
    }
    if (form.rankPosition == null || form.rankPosition < 1 || form.rankPosition > 10) {
      ElMessage.warning('排名位置需为 1-10 之间的整数')
      return
    }
  } else {
    if (!editingId.value) {
      if (form.shopId == null || form.shopId < 1) {
        ElMessage.warning('请选择店铺')
        return
      }
      if (form.adType === 4) {
        form.linkTargetId = form.shopId
      }
    }
    if (form.linkTargetId == null || form.linkTargetId < 1) {
      ElMessage.warning(form.adType === 4 ? '请选择店铺' : '请选择活动')
      return
    }
    if (!form.title?.trim()) {
      ElMessage.warning('推广标题不能为空')
      return
    }
    if (form.adType === 5 && !form.imageUrl?.trim() && selectedActivityInfo.value?.coverImage) {
      form.imageUrl = selectedActivityInfo.value.coverImage
    }
    if (!form.imageUrl?.trim()) {
      ElMessage.warning('推广图片不能为空')
      return
    }
  }
  if (form.displayOrder < 0) {
    ElMessage.warning('排序值不能小于 0')
    return
  }
  try {
    await ElMessageBox.confirm(
      editingId.value ? '确认保存修改吗？' : '确认添加该广告吗？',
      '二次确认',
      { type: 'warning' }
    )
  } catch {
    return
  }
  dialogSaving.value = true
  try {
    const basePayload: any = {
      adName: form.adName.trim(),
      startTime: form.startTime,
      endTime: form.endTime,
      displayOrder: form.displayOrder,
    }
    if (form.adType === 2) {
      basePayload.keyword = form.keyword.trim()
      basePayload.rankPosition = form.rankPosition!
    } else {
      if (!editingId.value) {
        basePayload.linkTargetId = form.linkTargetId!
      }
      basePayload.title = form.title.trim()
      basePayload.imageUrl = form.imageUrl.trim()
    }

    if (editingId.value) {
      await updateAd(editingId.value, { ...basePayload, status: form.status })
      ElMessage.success('修改成功')
    } else {
      await createAd({
        adType: form.adType,
        ...basePayload,
      })
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    fetchData()
  } catch (error: any) {
    ElMessage.error(error?.message || '操作失败')
  } finally {
    dialogSaving.value = false
  }
}

const handleDelete = async (row: AdminAdvertisementVO) => {
  if (!canManageAds.value) {
    ElMessage.warning('当前账号没有广告管理权限')
    return
  }
  try {
    await ElMessageBox.confirm('确定要删除该广告吗？删除后不可恢复。', '提示', {
      type: 'warning',
    })
    await deleteAd(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch {}
}

const handleApprove = async (row: AdminAdvertisementVO) => {
  if (!canManageAds.value) {
    ElMessage.warning('当前账号没有广告管理权限')
    return
  }
  try {
    await ElMessageBox.confirm('确认通过该推广广告申请并开始投放吗？', '审核确认', { type: 'warning' })
    await auditAd(row.id, { passed: true })
    ElMessage.success('审核通过')
    fetchData()
  } catch {}
}

const handleReject = async (row: AdminAdvertisementVO) => {
  if (!canManageAds.value) {
    ElMessage.warning('当前账号没有广告管理权限')
    return
  }
  try {
    const promptResult: any = await ElMessageBox.prompt('请输入拒绝原因（可选）', '审核拒绝', {
      inputPlaceholder: '如：素材不合规、时间配置不合理',
      confirmButtonText: '拒绝',
      cancelButtonText: '取消',
      type: 'warning',
    })
    const reason = String(promptResult?.value ?? '').trim()
    await auditAd(row.id, { passed: false, rejectReason: reason || undefined })
    ElMessage.success('已拒绝该申请')
    fetchData()
  } catch {}
}

onMounted(() => {
  loadShopOptions()
})

fetchData()
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">广告管理</h2>
      <el-button v-if="canManageAds" type="primary" @click="openAddDialog">添加广告</el-button>
    </div>

    <el-card class="search-card" shadow="never">
      <el-form :inline="true">
        <el-form-item label="广告类型">
          <el-select v-model="filterAdType" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="(label, val) in AD_TYPE_MAP" :key="val" :label="label" :value="Number(val)" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterStatus" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="(label, val) in STATUS_MAP" :key="val" :label="label" :value="Number(val)" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table v-loading="loading" :data="data" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="adType" label="类型" width="100">
          <template #default="{ row }">{{ AD_TYPE_MAP[row.adType] ?? '-' }}</template>
        </el-table-column>
        <el-table-column prop="adName" label="广告名称" min-width="140" />
        <el-table-column label="关联目标" width="180">
          <template #default="{ row }">
            <div class="target-cell">
              <el-tag size="small" type="info">{{ getTargetLabel(row.adType) }}</el-tag>
              <span class="target-name">
                {{ row.adType === 2 ? (row.keyword || '-') : (row.targetName || '-') }}
              </span>
              <span class="target-id" v-if="row.adType !== 2">
                {{ row.linkTargetId ? `ID ${row.linkTargetId}` : '-' }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="素材预览" min-width="220">
          <template #default="{ row }">
            <div v-if="row.adType !== 2" class="material-cell">
              <el-image
                v-if="row.imageUrl"
                :src="row.imageUrl"
                fit="cover"
                class="material-image"
                :preview-src-list="[row.imageUrl]"
                preview-teleported
              />
              <div class="material-info">
                <div class="material-title">{{ row.title || '-' }}</div>
                <div class="material-sub">广告名：{{ row.adName || '-' }}</div>
              </div>
            </div>
            <div v-else class="material-sub">关键词：{{ row.keyword || '-' }}（排名 {{ row.rankPosition || '-' }}）</div>
          </template>
        </el-table-column>
        <el-table-column prop="keyword" label="关键词" width="120">
          <template #default="{ row }">{{ row.keyword ?? '-' }}</template>
        </el-table-column>
        <el-table-column prop="rankPosition" label="排名" width="80">
          <template #default="{ row }">{{ row.rankPosition ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="投放时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.startTime) }} ~ {{ formatTime(row.endTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="审核状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">{{ STATUS_MAP[row.status] ?? '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审核信息" min-width="220">
          <template #default="{ row }">
            <div class="audit-cell">
              <div>审核时间：{{ formatTime(row.auditTime) }}</div>
              <div>审核人ID：{{ row.auditorId || '-' }}</div>
              <div v-if="row.status === 4">拒绝原因：{{ row.rejectReason || '-' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="canManageAds && (row.adType === 2 || row.adType === 4 || row.adType === 5)"
              link
              type="primary"
              size="small"
              @click="openEditDialog(row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="canManageAds && row.status === 0 && (row.adType === 4 || row.adType === 5)"
              link
              type="success"
              size="small"
              @click="handleApprove(row)"
            >
              通过
            </el-button>
            <el-button
              v-if="canManageAds && row.status === 0 && (row.adType === 4 || row.adType === 5)"
              link
              type="warning"
              size="small"
              @click="handleReject(row)"
            >
              拒绝
            </el-button>
            <el-button v-if="canManageAds" link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
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

    <!-- 添加/编辑广告弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="480px" destroy-on-close>
      <el-form label-width="100px">
        <el-form-item label="广告类型">
          <el-select v-model="form.adType" style="width: 100%" :disabled="editingId !== null">
            <el-option :value="2" label="热搜广告" />
            <el-option :value="4" label="店铺推广" />
            <el-option :value="5" label="活动推广" />
          </el-select>
          <div v-if="editingId === null" class="form-tip">新增时可直接创建任意类型广告</div>
        </el-form-item>
        <el-form-item label="广告名称" required>
          <el-input v-model="form.adName" placeholder="内部使用，便于管理" />
        </el-form-item>
        <el-form-item v-if="form.adType === 2" label="关键词" required>
          <el-input v-model="form.keyword" placeholder="热搜展示内容" />
        </el-form-item>
        <el-form-item v-if="form.adType === 2" label="排名位置" required>
          <el-input-number v-model="form.rankPosition" :min="1" :max="10" placeholder="1-10" style="width: 100%" />
          <div class="form-tip">插入该位置，不改变原有热搜顺序</div>
        </el-form-item>
        <el-form-item v-if="form.adType !== 2" label="店铺" required>
          <el-select
            v-model="form.shopId"
            filterable
            clearable
            placeholder="请选择店铺"
            style="width: 100%"
            :loading="shopLoading"
            :disabled="editingId !== null"
            @change="onShopChange"
          >
            <el-option
              v-for="shop in shopOptions"
              :key="shop.id"
              :label="`${shop.id} - ${shop.name}`"
              :value="shop.id"
            />
          </el-select>
          <div v-if="editingId !== null" class="form-tip">编辑素材时不可修改店铺</div>
          <div v-if="editingId !== null && form.shopId" class="form-tip form-strong">当前店铺：{{ shopOptions.find(s => s.id === form.shopId)?.name || '-' }}</div>
        </el-form-item>
        <el-form-item v-if="form.adType === 5" label="活动" required>
          <el-select
            v-model="form.linkTargetId"
            filterable
            clearable
            placeholder="请选择活动"
            style="width: 100%"
            :disabled="editingId !== null || !form.shopId"
            :loading="activityLoading"
            @change="onActivityChange"
          >
            <el-option
              v-for="activity in activityOptions"
              :key="activity.id"
              :label="activity.title"
              :value="activity.id"
            />
          </el-select>
          <div class="form-tip" v-if="!form.shopId">请先选择店铺，再选择活动</div>
          <div class="form-tip" v-if="editingId !== null">编辑素材时不可修改活动ID</div>
        </el-form-item>
        <el-form-item v-if="form.adType === 5 && selectedActivityInfo" label="活动信息">
          <div class="activity-preview">
            <el-image
              v-if="selectedActivityInfo.coverImage"
              :src="selectedActivityInfo.coverImage"
              fit="cover"
              class="activity-preview-image"
              :preview-src-list="[selectedActivityInfo.coverImage]"
              preview-teleported
            />
            <div class="activity-preview-info">
              <div class="activity-preview-title">{{ selectedActivityInfo.title || '-' }}</div>
              <div class="activity-preview-time">
                {{ formatTime(selectedActivityInfo.startTime || null) }} ~ {{ formatTime(selectedActivityInfo.endTime || null) }}
              </div>
            </div>
          </div>
        </el-form-item>
        <el-form-item v-if="editingId !== null && form.adType !== 2" label="关联ID">
          <el-input :model-value="String(form.linkTargetId || '')" disabled />
        </el-form-item>
        <el-form-item v-if="form.adType !== 2" label="推广标题" required>
          <el-input v-model="form.title" placeholder="前台展示标题" />
        </el-form-item>
        <el-form-item v-if="form.adType !== 2" label="推广图片" required>
          <div class="image-upload-row">
            <el-input v-model="form.imageUrl" placeholder="不填则默认使用活动封面图" />
            <el-upload
              :show-file-list="false"
              :http-request="handleImageUpload"
              accept="image/*"
            >
              <el-button type="primary" plain>上传图片</el-button>
            </el-upload>
          </div>
          <div v-if="form.adType === 5" class="form-tip">活动推广默认使用所选活动封面，也可手动覆盖</div>
          <el-image
            v-if="resolvedPromotionImage"
            :src="resolvedPromotionImage"
            fit="cover"
            style="width: 120px; height: 72px; margin-top: 8px; border-radius: 6px"
          />
        </el-form-item>
        <el-form-item label="投放开始" required>
          <el-date-picker
            v-model="form.startTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="选择开始时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="投放结束" required>
          <el-date-picker
            v-model="form.endTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="选择结束时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="排序值">
          <el-input-number v-model="form.displayOrder" :min="0" :max="9999" placeholder="越小越靠前" style="width: 100%" />
        </el-form-item>
        <el-form-item v-if="editingId !== null" label="状态">
          <el-select v-model="form.status" style="width: 100%">
            <el-option v-for="(label, val) in STATUS_MAP" :key="val" :label="label" :value="Number(val)" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="dialogSaving" @click="submitDialog">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.form-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.form-strong {
  color: var(--el-text-color-regular);
  font-weight: 600;
}

.image-upload-row {
  display: flex;
  gap: 8px;
  width: 100%;
}

.target-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.target-id {
  color: var(--el-text-color-regular);
  font-size: 12px;
}

.target-name {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
}

.material-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.material-image {
  width: 56px;
  height: 40px;
  border-radius: 6px;
  border: 1px solid #ebeef5;
  flex-shrink: 0;
}

.material-info {
  min-width: 0;
}

.material-title {
  color: var(--el-text-color-primary);
  font-weight: 600;
  font-size: 13px;
  line-height: 1.4;
}

.material-sub {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.4;
}

.audit-cell {
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1.6;
}

.activity-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fafafa;
}

.activity-preview-image {
  width: 64px;
  height: 64px;
  border-radius: 6px;
  flex-shrink: 0;
}

.activity-preview-info {
  min-width: 0;
}

.activity-preview-title {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  margin-bottom: 4px;
}

.activity-preview-time {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.4;
}
</style>
