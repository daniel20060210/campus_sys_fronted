<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTable } from '@/composables/useTable'
import { getShopList, getShopDetail, updateShop, deleteShop, uploadShopImage, getLivingAreaList, getCampusAreaList, createAd, getShopActivities, getPromotedShopIds } from '@/api'
import dayjs from 'dayjs'
import type { UploadRequestOptions } from 'element-plus'

const {
  loading,
  data,
  total,
  pageNum,
  pageSize,
  fetchData,
  handlePageChange,
  handleSizeChange,
} = useTable(getShopList, { getParams: () => searchParams.value })

const searchParams = ref({
  keyword: '',
  shopType: undefined,
  status: undefined,
  auditStatus: undefined,
})

const handleSearch = () => {
  pageNum.value = 1
  fetchData(searchParams.value)
}

const handleReset = () => {
  searchParams.value = {
    keyword: '',
    shopType: undefined,
    status: undefined,
    auditStatus: undefined,
  }
  handleSearch()
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该店铺吗？', '提示', { type: 'warning' })
    await deleteShop(row.id)
    ElMessage.success('删除成功')
    fetchData(searchParams.value)
  } catch (error) {}
}

// ==================== 推流标记 ====================
const promotedShopIds = ref<number[]>([])

const loadPromotedIds = async () => {
  try {
    const res = await getPromotedShopIds()
    if (res.code === 200 && Array.isArray(res.data)) {
      promotedShopIds.value = res.data
    }
  } catch {
    promotedShopIds.value = []
  }
}

// ==================== 店铺推流 ====================
const shopAdVisible = ref(false)
const shopAdSaving = ref(false)
const shopAdForm = reactive({
  shopId: 0 as number,
  shopName: '',
  adName: '',
  startTime: '' as string,
  endTime: '' as string,
})

const openShopAdDialog = (row: any) => {
  shopAdForm.shopId = row.id
  shopAdForm.shopName = row.shopName || row.name || ''
  shopAdForm.adName = `${shopAdForm.shopName}-推流`
  const now = new Date()
  shopAdForm.startTime = dayjs(now).format('YYYY-MM-DD HH:mm:ss')
  shopAdForm.endTime = dayjs(now).add(30, 'day').format('YYYY-MM-DD HH:mm:ss')
  shopAdVisible.value = true
}

const submitShopAd = async () => {
  if (!shopAdForm.adName?.trim()) {
    ElMessage.warning('广告名称不能为空')
    return
  }
  if (!shopAdForm.startTime || !shopAdForm.endTime) {
    ElMessage.warning('请选择投放时间')
    return
  }
  if (new Date(shopAdForm.endTime) <= new Date(shopAdForm.startTime)) {
    ElMessage.warning('结束时间必须晚于开始时间')
    return
  }
  try {
    await ElMessageBox.confirm(`确认将「${shopAdForm.shopName}」设为推流店铺并提交吗？`, '二次确认', { type: 'warning' })
  } catch {
    return
  }
  shopAdSaving.value = true
  try {
    await createAd({
      adType: 4,
      adName: shopAdForm.adName.trim(),
      startTime: shopAdForm.startTime,
      endTime: shopAdForm.endTime,
      linkTargetId: shopAdForm.shopId,
      title: shopAdForm.shopName,
    })
    ElMessage.success('设为推流店铺成功')
    shopAdVisible.value = false
    loadPromotedIds()
    fetchData(searchParams.value)
  } catch (error: any) {
    ElMessage.error(error?.message || '操作失败')
  } finally {
    shopAdSaving.value = false
  }
}

// ==================== 活动推流 ====================
const activities = ref<any[]>([])
const activitiesLoading = ref(false)
const activityListVisible = ref(false)
const activityListShopId = ref<number>(0)
const activityListShopName = ref('')
const activityListSchoolId = ref<number | undefined>(undefined)
const activityAdVisible = ref(false)
const activityAdSaving = ref(false)
const activityAdForm = reactive({
  activityId: 0 as number,
  activityTitle: '',
  shopId: 0 as number,
  schoolId: undefined as number | undefined,
  adName: '',
  startTime: '' as string,
  endTime: '' as string,
})

const loadActivities = async (shopId: number) => {
  activities.value = []
  if (!shopId) return
  activitiesLoading.value = true
  try {
    const res = await getShopActivities(shopId, { pageNum: 1, pageSize: 50 })
    activities.value = res.data?.list || []
  } catch {
    activities.value = []
  } finally {
    activitiesLoading.value = false
  }
}

const openActivityListDialog = async (row: any) => {
  activityListShopId.value = row.id
  activityListShopName.value = row.shopName || row.name || ''
  activityListSchoolId.value = row.schoolId
  activityListVisible.value = true
  await loadActivities(row.id)
}

const openActivityAdDialog = (activity: any, shopId: number, schoolId?: number) => {
  activityAdForm.activityId = activity.id
  activityAdForm.activityTitle = activity.title || ''
  activityAdForm.shopId = shopId
  activityAdForm.schoolId = schoolId ?? activityListSchoolId.value ?? detailForm.schoolId
  activityAdForm.adName = `${activityAdForm.activityTitle}-推流`
  const now = new Date()
  activityAdForm.startTime = dayjs(now).format('YYYY-MM-DD HH:mm:ss')
  activityAdForm.endTime = dayjs(now).add(30, 'day').format('YYYY-MM-DD HH:mm:ss')
  activityAdVisible.value = true
}

const submitActivityAd = async () => {
  if (!activityAdForm.adName?.trim()) {
    ElMessage.warning('广告名称不能为空')
    return
  }
  if (!activityAdForm.startTime || !activityAdForm.endTime) {
    ElMessage.warning('请选择投放时间')
    return
  }
  if (new Date(activityAdForm.endTime) <= new Date(activityAdForm.startTime)) {
    ElMessage.warning('结束时间必须晚于开始时间')
    return
  }
  try {
    await ElMessageBox.confirm(`确认将活动「${activityAdForm.activityTitle}」设为推流活动并提交吗？`, '二次确认', { type: 'warning' })
  } catch {
    return
  }
  activityAdSaving.value = true
  try {
    const payload: any = {
      adType: 5,
      adName: activityAdForm.adName.trim(),
      startTime: activityAdForm.startTime,
      endTime: activityAdForm.endTime,
      linkTargetId: activityAdForm.activityId,
      title: activityAdForm.activityTitle,
    }
    if (activityAdForm.schoolId != null) {
      payload.schoolId = activityAdForm.schoolId
    }
    await createAd(payload)
    ElMessage.success('设为推流活动成功')
    activityAdVisible.value = false
    loadActivities(activityAdForm.shopId)
    if (activityListVisible.value && activityListShopId.value === activityAdForm.shopId) {
      loadActivities(activityListShopId.value)
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '操作失败')
  } finally {
    activityAdSaving.value = false
  }
}

const detailVisible = ref(false)
const detailLoading = ref(false)
const detailSaving = ref(false)
const isEditing = ref(false)
const livingAreas = ref<Array<{ id: number; areaName: string }>>([])
const campusAreas = ref<Array<{ id: number; areaName: string }>>([])

const detailForm = reactive<any>({
  id: undefined,
  schoolId: undefined as number | undefined,
  shopName: '',
  shopType: 1,
  campusAreaId: undefined as number | undefined,
  coverImage: '',
  description: '',
  livingAreaIds: [] as number[],
  specificLocation: '',
  address: '',
  businessHours: '',
  phone: '',
  avgPrice: undefined as number | undefined,
  menuImages: [] as string[],
  dishImages: [] as string[],
  status: 1,
  deliveryPlatforms: [] as Array<{ platformName: string; platformLink: string }>,
})

const PLATFORM_OPTIONS = ['美团外卖', '饥了么', '京东外卖']

const addPlatform = () => {
  if (detailForm.deliveryPlatforms.length < 3) {
    detailForm.deliveryPlatforms.push({ platformName: '', platformLink: '' })
  }
}

const removePlatform = (idx: number | string) => {
  detailForm.deliveryPlatforms.splice(Number(idx), 1)
}

const formatTime = (time: number | string) => dayjs(time).format('YYYY-MM-DD HH:mm')

const normalizeImages = (detail: any): string[] => {
  if (Array.isArray(detail.images) && detail.images.length > 0) {
    return [...new Set<string>((detail.images as string[]).filter(Boolean))]
  }
  if (detail.coverImage) {
    return [detail.coverImage]
  }
  return []
}

const extractTypedImages = (detail: any, imageType: number): string[] => {
  const items = Array.isArray(detail?.imageItems) ? detail.imageItems : []
  const typed = (items as any[])
    .filter((item: any) => Number(item?.imageType) === imageType)
    .map((item: any) => String(item?.imageUrl || ''))
    .filter(Boolean)
  return [...new Set<string>(typed)]
}

const ensureCampusAreas = async () => {
  if (campusAreas.value.length === 0) {
    const res = await getCampusAreaList({ pageNum: 1, pageSize: 500 })
    const list = res.data?.list || []
    campusAreas.value = list.map((item: any) => ({
      id: item.id,
      areaName: item.areaName || item.name || `校区${item.id}`,
    }))
  }
}

const loadLivingAreasByCampus = async (campusAreaId?: number) => {
  if (!campusAreaId) {
    livingAreas.value = []
    return
  }
  const res = await getLivingAreaList({ pageNum: 1, pageSize: 500, campusAreaId })
  const list = res.data?.list || []
  livingAreas.value = list.map((item: any) => ({
    id: item.id,
    areaName: item.areaName || item.name || `生活区${item.id}`,
  }))
}

const handleCampusAreaChange = async (val: number | undefined) => {
  detailForm.livingAreaIds = []
  await loadLivingAreasByCampus(val)
}

const openDetailDialog = async (row: any) => {
  detailVisible.value = true
  isEditing.value = false
  detailLoading.value = true
  try {
    await ensureCampusAreas()
    const res = await getShopDetail(row.id)
    const detail: any = res.data || {}
    Object.assign(detailForm, {
      id: detail.id,
      schoolId: detail.schoolId ?? undefined,
      shopName: detail.shopName || detail.name || '',
      shopType: detail.shopType || 1,
      campusAreaId: detail.campusAreaId || undefined,
      coverImage: detail.coverImage || '',
      description: detail.description || '',
      livingAreaIds: Array.isArray(detail.livingAreaIds) ? detail.livingAreaIds : [],
      specificLocation: detail.specificLocation || '',
      address: detail.address || '',
      businessHours: detail.businessHours || '',
      phone: detail.phone || '',
      avgPrice: detail.avgPrice,
      menuImages: extractTypedImages(detail, 1),
      dishImages: extractTypedImages(detail, 2),
      status: detail.status ?? 1,
      deliveryPlatforms: Array.isArray(detail.deliveryPlatforms)
        ? detail.deliveryPlatforms.map((p: any) => ({ platformName: p.platformName || '', platformLink: p.platformLink || '' }))
        : [],
    })
    if (detailForm.campusAreaId) {
      await loadLivingAreasByCampus(detailForm.campusAreaId)
    }
    if (detailForm.menuImages.length === 0 && detailForm.dishImages.length === 0) {
      detailForm.menuImages = normalizeImages(detail)
    }
    await loadActivities(detail.id)
  } catch (error) {
    console.error('加载店铺详情失败:', error)
    ElMessage.error('加载店铺详情失败')
    detailVisible.value = false
  } finally {
    detailLoading.value = false
  }
}

const uploadCover = async (options: UploadRequestOptions) => {
  try {
    const file = options.file as File
    const res = await uploadShopImage(file)
    detailForm.coverImage = res.data || ''
    options.onSuccess?.(res)
  } catch (error: any) {
    options.onError?.(error)
    ElMessage.error('封面上传失败')
  }
}

const uploadMenu = async (options: UploadRequestOptions) => {
  try {
    if (detailForm.menuImages.length >= 6) {
      ElMessage.warning('菜单图最多上传6张')
      return
    }
    const file = options.file as File
    const res = await uploadShopImage(file)
    const imageUrl = res.data || ''
    if (imageUrl && !detailForm.menuImages.includes(imageUrl)) {
      detailForm.menuImages.push(imageUrl)
    }
    options.onSuccess?.(res)
  } catch (error: any) {
    options.onError?.(error)
    ElMessage.error('图片上传失败')
  }
}

const uploadDish = async (options: UploadRequestOptions) => {
  try {
    if (detailForm.dishImages.length >= 8) {
      ElMessage.warning('菜品图最多上传8张')
      return
    }
    const file = options.file as File
    const res = await uploadShopImage(file)
    const imageUrl = res.data || ''
    if (imageUrl && !detailForm.dishImages.includes(imageUrl)) {
      detailForm.dishImages.push(imageUrl)
    }
    options.onSuccess?.(res)
  } catch (error: any) {
    options.onError?.(error)
    ElMessage.error('图片上传失败')
  }
}

const removeMenuImage = (index: number) => {
  detailForm.menuImages.splice(index, 1)
}

const removeDishImage = (index: number) => {
  detailForm.dishImages.splice(index, 1)
}

const saveDetail = async () => {
  if (!detailForm.shopName?.trim()) {
    ElMessage.warning('店铺名称不能为空')
    return
  }
  if (!detailForm.campusAreaId) {
    ElMessage.warning('请选择关联校区')
    return
  }
  if (detailForm.shopType === 1 && (!Array.isArray(detailForm.livingAreaIds) || detailForm.livingAreaIds.length === 0)) {
    ElMessage.warning('校内堂食需至少关联一个生活区')
    return
  }

  const avgPriceRaw = detailForm.avgPrice
  if (avgPriceRaw !== undefined && avgPriceRaw !== null && avgPriceRaw !== '') {
    const avgPriceText = String(avgPriceRaw).trim()
    if (/[eE]/.test(avgPriceText) || !/^\d+(\.\d{1,2})?$/.test(avgPriceText)) {
      ElMessage.warning('人均消费格式不正确，禁止科学计数法，最多2位小数')
      return
    }
    const avgPriceNum = Number(avgPriceText)
    if (!Number.isFinite(avgPriceNum) || avgPriceNum < 0 || avgPriceNum > 1000) {
      ElMessage.warning('人均消费需在0-1000之间')
      return
    }
    detailForm.avgPrice = avgPriceNum
  }

  detailSaving.value = true
  try {
    const menuImages = [...new Set<string>(((detailForm.menuImages || []) as string[]).filter(Boolean))]
    const dishImages = [...new Set<string>(((detailForm.dishImages || []) as string[]).filter(Boolean))]
    const imageItems = [
      ...(detailForm.coverImage ? [{ imageUrl: detailForm.coverImage, imageType: 3 }] : []),
      ...menuImages.map((imageUrl: string) => ({ imageUrl, imageType: 1 })),
      ...dishImages.map((imageUrl: string) => ({ imageUrl, imageType: 2 })),
    ]
    const images = [detailForm.coverImage, ...menuImages, ...dishImages].filter(Boolean)
    const payload = {
      shopName: detailForm.shopName,
      shopType: detailForm.shopType,
      campusAreaId: detailForm.campusAreaId || undefined,
      coverImage: detailForm.coverImage || menuImages[0] || dishImages[0] || undefined,
      description: detailForm.description || undefined,
      livingAreaIds: detailForm.shopType === 1 ? detailForm.livingAreaIds : [],
      specificLocation: detailForm.specificLocation || undefined,
      address: detailForm.address || undefined,
      businessHours: detailForm.businessHours || undefined,
      phone: detailForm.phone || undefined,
      avgPrice: detailForm.avgPrice,
      images,
      imageItems,
      status: detailForm.status,
      deliveryPlatforms: detailForm.shopType === 3 && detailForm.deliveryPlatforms.length > 0
        ? detailForm.deliveryPlatforms
            .filter((p: any) => p.platformName)
            .map((p: any) => ({ platformName: p.platformName, platformLink: p.platformLink || undefined }))
        : (detailForm.shopType === 3 ? [] : undefined),
    }
    await updateShop(detailForm.id, payload)
    ElMessage.success('保存成功')
    isEditing.value = false
    await fetchData(searchParams.value)
  } catch (error) {
    console.error('保存店铺失败:', error)
    ElMessage.error('保存失败，请重试')
  } finally {
    detailSaving.value = false
  }
}

onMounted(() => {
  loadPromotedIds()
})

fetchData(searchParams.value)
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">店铺列表</h2>
    </div>

    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchParams">
        <el-form-item label="关键词">
          <el-input v-model="searchParams.keyword" placeholder="请输入店铺名称" clearable />
        </el-form-item>
        <el-form-item label="店铺类型">
          <el-select v-model="searchParams.shopType" placeholder="请选择" clearable>
            <el-option label="校内堂食" :value="1" />
            <el-option label="校外堂食" :value="2" />
            <el-option label="外卖" :value="3" />
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
        <el-table-column label="封面" width="80">
          <template #default="{ row }">
            <el-avatar shape="square" :src="row.coverImage || row.avatar" />
          </template>
        </el-table-column>
        <el-table-column prop="shopName" label="店铺名称" width="180">
          <template #default="{ row }">{{ row.shopName || row.name }}</template>
        </el-table-column>
        <el-table-column prop="shopTypeDesc" label="类型" width="100">
          <template #default="{ row }">{{ row.shopTypeDesc || row.type }}</template>
        </el-table-column>
        <el-table-column prop="avgPrice" label="人均价格" width="100">
          <template #default="{ row }">{{ row.avgPrice ?? row.averagePrice ?? '-' }}</template>
        </el-table-column>
        <el-table-column prop="ratingScore" label="评分" width="80">
          <template #default="{ row }">{{ row.ratingScore ?? row.score ?? '-' }}</template>
        </el-table-column>
        <el-table-column prop="reviewCount" label="评价数" width="80" />
        <el-table-column label="推流状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="promotedShopIds.includes(row.id)" type="success" size="small">已推流</el-tag>
            <span v-else style="color: var(--el-text-color-secondary)">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">{{ row.createTime ? formatTime(row.createTime) : '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="340" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDetailDialog(row)">查看详情</el-button>
            <el-button link type="primary" size="small" @click="openActivityListDialog(row)">查看活动</el-button>
            <el-button link type="success" size="small" @click="openShopAdDialog(row)">设为推流店铺</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
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

    <el-dialog v-model="detailVisible" width="860px" title="店铺详情" destroy-on-close>
      <div v-loading="detailLoading">
        <el-form v-if="!detailLoading" label-width="100px">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="店铺名称">
                <el-input v-model="detailForm.shopName" :disabled="!isEditing" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="店铺类型">
                <el-select v-model="detailForm.shopType" :disabled="!isEditing" style="width: 100%">
                  <el-option label="校内堂食" :value="1" />
                  <el-option label="校外堂食" :value="2" />
                  <el-option label="外卖" :value="3" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="人均价格">
                <el-input-number v-model="detailForm.avgPrice" :disabled="!isEditing" :min="0" :max="1000" :precision="2" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="营业状态">
                <el-select v-model="detailForm.status" :disabled="!isEditing" style="width: 100%">
                  <el-option label="休息中" :value="0" />
                  <el-option label="营业中" :value="1" />
                  <el-option label="已关闭" :value="2" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="联系电话">
            <el-input v-model="detailForm.phone" :disabled="!isEditing" />
          </el-form-item>

          <el-form-item label="营业时间">
            <el-input v-model="detailForm.businessHours" :disabled="!isEditing" />
          </el-form-item>

          <el-form-item label="具体位置">
            <el-input v-model="detailForm.specificLocation" :disabled="!isEditing" />
          </el-form-item>

          <el-form-item label="详细地址">
            <el-input v-model="detailForm.address" :disabled="!isEditing" />
          </el-form-item>

          <el-form-item label="关联校区">
            <el-select v-model="detailForm.campusAreaId" :disabled="!isEditing" style="width: 100%" placeholder="请选择校区" clearable @change="handleCampusAreaChange">
              <el-option
                v-for="area in campusAreas"
                :key="area.id"
                :label="area.areaName"
                :value="area.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="关联生活区" v-if="detailForm.shopType === 1">
            <el-select v-model="detailForm.livingAreaIds" multiple :disabled="!isEditing || !detailForm.campusAreaId" style="width: 100%" :placeholder="detailForm.campusAreaId ? '请选择生活区' : '请先选择校区'">
              <el-option
                v-for="area in livingAreas"
                :key="area.id"
                :label="area.areaName"
                :value="area.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="封面图">
            <div class="image-row">
              <el-image v-if="detailForm.coverImage" :src="detailForm.coverImage" fit="cover" class="img-item" :preview-src-list="detailForm.coverImage ? [detailForm.coverImage] : []" />
              <el-upload
                v-if="isEditing"
                :show-file-list="false"
                :http-request="uploadCover"
                accept="image/*"
              >
                <el-button type="primary" plain>上传封面</el-button>
              </el-upload>
            </div>
          </el-form-item>

          <el-form-item label="菜单图">
            <div class="image-grid">
              <div class="image-cell" v-for="(img, idx) in detailForm.menuImages" :key="img + idx">
                <el-image :src="img" fit="cover" class="img-item" :preview-src-list="detailForm.menuImages" />
                <el-button v-if="isEditing" type="danger" text class="remove-btn" @click="removeMenuImage(Number(idx))">删除</el-button>
              </div>
              <el-upload
                v-if="isEditing && detailForm.menuImages.length < 6"
                :show-file-list="false"
                :http-request="uploadMenu"
                accept="image/*"
              >
                <el-button plain>上传菜单图</el-button>
              </el-upload>
            </div>
          </el-form-item>

          <el-form-item label="菜品图">
            <div class="image-grid">
              <div class="image-cell" v-for="(img, idx) in detailForm.dishImages" :key="img + idx">
                <el-image :src="img" fit="cover" class="img-item" :preview-src-list="detailForm.dishImages" />
                <el-button v-if="isEditing" type="danger" text class="remove-btn" @click="removeDishImage(Number(idx))">删除</el-button>
              </div>
              <el-upload
                v-if="isEditing && detailForm.dishImages.length < 8"
                :show-file-list="false"
                :http-request="uploadDish"
                accept="image/*"
              >
                <el-button plain>上传菜品图</el-button>
              </el-upload>
            </div>
          </el-form-item>

          <el-form-item label="店铺简介">
            <el-input v-model="detailForm.description" :disabled="!isEditing" type="textarea" :rows="4" />
          </el-form-item>

          <!-- 店铺活动（活动推流） -->
          <el-form-item label="店铺活动">
            <div v-loading="activitiesLoading" class="activities-section">
              <el-table v-if="activities.length > 0" :data="activities" size="small" max-height="200">
                <el-table-column prop="title" label="活动标题" min-width="120" />
                <el-table-column label="开始时间" width="150">
                  <template #default="{ row }">{{ row.startTime ? formatTime(row.startTime) : '-' }}</template>
                </el-table-column>
                <el-table-column label="结束时间" width="150">
                  <template #default="{ row }">{{ row.endTime ? formatTime(row.endTime) : '-' }}</template>
                </el-table-column>
                <el-table-column label="操作" width="120" fixed="right">
                  <template #default="{ row }">
                    <el-button link type="success" size="small" @click="openActivityAdDialog(row, detailForm.id, detailForm.schoolId)">设为推流活动</el-button>
                  </template>
                </el-table-column>
              </el-table>
              <div v-else-if="!activitiesLoading" class="no-activities">暂无活动</div>
            </div>
          </el-form-item>

          <!-- 外卖平台（外卖类型时显示） -->
          <el-form-item label="外卖平台" v-if="detailForm.shopType === 3">
            <div class="platform-list">
              <div
                v-for="(p, idx) in detailForm.deliveryPlatforms"
                :key="idx"
                class="platform-row"
              >
                <el-select
                  v-model="p.platformName"
                  :disabled="!isEditing"
                  placeholder="选择平台"
                  style="width: 160px"
                >
                  <el-option v-for="opt in PLATFORM_OPTIONS" :key="opt" :label="opt" :value="opt" />
                </el-select>
                <el-input
                  v-model="p.platformLink"
                  :disabled="!isEditing"
                  placeholder="店铺链接（选填）"
                  style="flex: 1"
                />
                <el-button
                  v-if="isEditing"
                  type="danger"
                  text
                  @click="removePlatform(idx)"
                >删除</el-button>
              </div>
              <el-button
                v-if="isEditing && detailForm.deliveryPlatforms.length < 3"
                type="primary"
                plain
                size="small"
                @click="addPlatform"
              >+ 添加平台</el-button>
              <span v-if="!isEditing && detailForm.deliveryPlatforms.length === 0" class="no-platform">暂无平台信息</span>
            </div>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button v-if="!isEditing" type="primary" @click="isEditing = true">编辑</el-button>
        <el-button v-else type="primary" :loading="detailSaving" @click="saveDetail">保存</el-button>
      </template>
    </el-dialog>

    <!-- 店铺推流确认弹窗 -->
    <el-dialog v-model="shopAdVisible" title="设为推流店铺" width="480px" destroy-on-close>
      <p class="confirm-tip">确定将「{{ shopAdForm.shopName }}」设为推流店铺吗？</p>
      <el-form label-width="100px">
        <el-form-item label="广告名称" required>
          <el-input v-model="shopAdForm.adName" placeholder="请输入广告名称" />
        </el-form-item>
        <el-form-item label="投放开始" required>
          <el-date-picker v-model="shopAdForm.startTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="选择开始时间" style="width: 100%" />
        </el-form-item>
        <el-form-item label="投放结束" required>
          <el-date-picker v-model="shopAdForm.endTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="选择结束时间" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shopAdVisible = false">取消</el-button>
        <el-button type="primary" :loading="shopAdSaving" @click="submitShopAd">确认</el-button>
      </template>
    </el-dialog>

    <!-- 店铺活动列表弹窗（独立入口） -->
    <el-dialog v-model="activityListVisible" :title="`店铺活动 - ${activityListShopName}`" width="640px" destroy-on-close>
      <div v-loading="activitiesLoading" class="activities-section">
        <el-table v-if="activities.length > 0" :data="activities" size="small" max-height="320">
          <el-table-column prop="title" label="活动标题" min-width="120" />
          <el-table-column label="开始时间" width="150">
            <template #default="{ row }">{{ row.startTime ? formatTime(row.startTime) : '-' }}</template>
          </el-table-column>
          <el-table-column label="结束时间" width="150">
            <template #default="{ row }">{{ row.endTime ? formatTime(row.endTime) : '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button link type="success" size="small" @click="openActivityAdDialog(row, activityListShopId, activityListSchoolId)">设为推流活动</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div v-else-if="!activitiesLoading" class="no-activities">暂无活动</div>
      </div>
    </el-dialog>

    <!-- 活动推流确认弹窗 -->
    <el-dialog v-model="activityAdVisible" title="设为推流活动" width="480px" destroy-on-close>
      <p class="confirm-tip">确定将活动「{{ activityAdForm.activityTitle }}」设为推流活动吗？</p>
      <el-form label-width="100px">
        <el-form-item label="广告名称" required>
          <el-input v-model="activityAdForm.adName" placeholder="请输入广告名称" />
        </el-form-item>
        <el-form-item label="投放开始" required>
          <el-date-picker v-model="activityAdForm.startTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="选择开始时间" style="width: 100%" />
        </el-form-item>
        <el-form-item label="投放结束" required>
          <el-date-picker v-model="activityAdForm.endTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="选择结束时间" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="activityAdVisible = false">取消</el-button>
        <el-button type="primary" :loading="activityAdSaving" @click="submitActivityAd">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.search-card { margin-bottom: 20px; }
.pagination-container { display: flex; justify-content: flex-end; margin-top: 20px; }

.image-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.image-grid {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.image-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.img-item {
  width: 88px;
  height: 88px;
  border-radius: 6px;
}

.remove-btn {
  padding: 0;
}

.platform-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.platform-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.no-platform {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.activities-section {
  min-height: 60px;
}

.no-activities {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  padding: 12px 0;
}

.confirm-tip {
  margin: 0 0 16px;
  color: var(--el-text-color-regular);
}
</style>
