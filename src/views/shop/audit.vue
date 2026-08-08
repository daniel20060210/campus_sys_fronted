<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useTable } from '@/composables'
import {
  getShopApplications,
  getShopApplicationDetail,
  approveShopApplication,
  rejectShopApplication,
  getShopChangeProposals,
  getShopChangeProposalDetail,
  approveShopChangeProposal,
  rejectShopChangeProposal,
  getLivingAreaList,
  getCampusAreaList,
} from '@/api'
import dayjs from 'dayjs'

const mode = ref<'application' | 'proposal'>('application')
const searchParams = ref<{ status?: number; keyword?: string }>({})

const fetchAuditList = (params: Record<string, any>) => {
  if (mode.value === 'proposal') {
    return getShopChangeProposals(params)
  }
  return getShopApplications(params)
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
} = useTable(fetchAuditList, {
  getParams: () => ({ ...searchParams.value }),
})

const auditDialog = ref({ visible: false, recordId: 0, approved: true, rejectReason: '' })
const detailDialog = ref({ visible: false, loading: false })
const detailRecord = ref<any>(null)
const livingAreaMap = ref<Record<number, string>>({})
const campusAreaMap = ref<Record<number, string>>({})

const openAuditDialog = (row: any, approved: boolean) => {
  auditDialog.value = { visible: true, recordId: row.id, approved, rejectReason: '' }
}

const submitAudit = async () => {
  try {
    if (auditDialog.value.approved) {
      if (mode.value === 'proposal') {
        await approveShopChangeProposal(auditDialog.value.recordId)
      } else {
        await approveShopApplication(auditDialog.value.recordId)
      }
    } else {
      if (mode.value === 'proposal') {
        await rejectShopChangeProposal(auditDialog.value.recordId, {
          rejectReason: auditDialog.value.rejectReason,
        })
      } else {
        await rejectShopApplication(auditDialog.value.recordId, {
          rejectReason: auditDialog.value.rejectReason,
        })
      }
    }
    ElMessage.success('审核成功')
    auditDialog.value.visible = false
    fetchData()
  } catch (error) {
    console.error('审核失败:', error)
  }
}

const formatTime = (time: number) => dayjs(time).format('YYYY-MM-DD HH:mm')

const parseJSON = (value: any) => {
  if (!value) return null
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const ensureLivingAreaMap = async () => {
  if (Object.keys(livingAreaMap.value).length === 0) {
    const res = await getLivingAreaList({ pageNum: 1, pageSize: 500 })
    const list = res.data?.list || []
    const map: Record<number, string> = {}
    list.forEach((item: any) => {
      map[item.id] = item.areaName || item.name || `#${item.id}`
    })
    livingAreaMap.value = map
  }
  if (Object.keys(campusAreaMap.value).length === 0) {
    const res = await getCampusAreaList({ pageNum: 1, pageSize: 500 })
    const list = res.data?.list || []
    const map: Record<number, string> = {}
    list.forEach((item: any) => {
      map[item.id] = item.areaName || item.name || `#${item.id}`
    })
    campusAreaMap.value = map
  }
}

const getLivingAreaText = (ids?: number[]) => {
  if (!ids || ids.length === 0) return '-'
  return ids.map((id) => livingAreaMap.value[id] || `#${id}`).join('、')
}

const getCampusAreaText = (id?: number) => {
  if (!id) return '-'
  return campusAreaMap.value[id] || `#${id}`
}

const getDetailImages = (record: any): string[] => {
  if (!record) return []
  if (mode.value === 'proposal') {
    const proposalData = parseJSON(record.proposalData) || {}
    const proposalImages = Array.isArray(proposalData.images) ? proposalData.images : []
    const coverImage = proposalData.coverImage ? [proposalData.coverImage] : []
    return [...new Set([...coverImage, ...proposalImages])]
  }
  return Array.isArray(record.images) ? record.images : []
}

const getDetailImageItems = (record: any): Array<{ imageUrl: string; imageType: number }> => {
  if (!record) return []
  if (mode.value === 'proposal') {
    const proposalData = parseJSON(record.proposalData) || {}
    return Array.isArray(proposalData.imageItems) ? proposalData.imageItems : []
  }
  return Array.isArray(record.imageItems) ? record.imageItems : []
}

const getDetailImagesByType = (record: any, imageType: number): string[] => {
  const items = getDetailImageItems(record)
  if (items.length === 0) {
    const all = getDetailImages(record)
    if (imageType === 3 && all.length > 0) return [all[0] as string]
    if (imageType === 1) return all
    return []
  }
  return items
    .filter((item) => Number(item?.imageType) === imageType)
    .map((item) => item?.imageUrl)
    .filter(Boolean)
}

const getDeliveryPlatformsText = (record: any): string => {
  if (!record) return '-'
  if (mode.value === 'proposal') {
    const proposalData = parseJSON(record.proposalData) || {}
    const platforms = proposalData.deliveryPlatforms
    if (!Array.isArray(platforms) || platforms.length === 0) return '-'
    return platforms
      .map((p: any) => p?.platformName || p?.platformLink)
      .filter(Boolean)
      .join('、') || '-'
  }
  const parsed = parseJSON(record.deliveryPlatforms)
  if (!Array.isArray(parsed) || parsed.length === 0) return '-'
  return parsed
    .map((p: any) => p?.platformName || p?.platformLink)
    .filter(Boolean)
    .join('、') || '-'
}

const openDetailDialog = async (row: any) => {
  detailDialog.value.visible = true
  detailDialog.value.loading = true
  detailRecord.value = null
  try {
    await ensureLivingAreaMap()
    const res = mode.value === 'proposal'
      ? await getShopChangeProposalDetail(row.id)
      : await getShopApplicationDetail(row.id)
    detailRecord.value = res.data
  } finally {
    detailDialog.value.loading = false
  }
}

const handleModeChange = async (value: 'application' | 'proposal') => {
  mode.value = value
  pageNum.value = 1
  await fetchData()
}

const handleSearch = async () => {
  pageNum.value = 1
  await fetchData()
}

const resetSearch = async () => {
  searchParams.value = {}
  pageNum.value = 1
  await fetchData()
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="page-container" v-loading="loading">
    <div class="page-header">
      <h2 class="page-title">店铺审核</h2>
    </div>

    <el-card shadow="never">
      <el-space wrap style="margin-bottom: 16px; width: 100%; justify-content: space-between;">
        <el-radio-group :model-value="mode" @update:model-value="handleModeChange">
          <el-radio-button label="application">店铺申请</el-radio-button>
          <el-radio-button label="proposal">信息纠错提案</el-radio-button>
        </el-radio-group>
        <el-space>
          <el-select v-model="searchParams.status" placeholder="状态" clearable style="width: 120px">
            <el-option label="待审核" :value="0" />
            <el-option label="已通过" :value="1" />
            <el-option label="已拒绝" :value="2" />
          </el-select>
          <el-input v-model="searchParams.keyword" placeholder="店铺名/关键词" clearable style="width: 220px" />
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-space>
      </el-space>

      <el-table v-loading="loading" :data="data" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="shopName" label="店铺名称" width="200">
          <template #default="{ row }">{{ row.shopName || row.name }}</template>
        </el-table-column>
        <el-table-column prop="avgPrice" label="人均消费" width="100">
          <template #default="{ row }">{{ row.avgPrice ?? row.averagePrice ?? '-' }}</template>
        </el-table-column>
        <el-table-column v-if="mode === 'proposal'" prop="reason" label="提案说明" min-width="220" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="申请时间" width="180">
          <template #default="{ row }">{{ formatTime(row.createdAt || row.createTime) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'warning' : row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 0 ? '待审核' : row.status === 1 ? '已通过' : '已拒绝' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDetailDialog(row)">查看详情</el-button>
            <template v-if="row.status === 0">
              <el-button link type="success" size="small" @click="openAuditDialog(row, true)">通过</el-button>
              <el-button link type="warning" size="small" @click="openAuditDialog(row, false)">拒绝</el-button>
            </template>
            <template v-else>
              <span style="color:#999">已处理</span>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination :current-page="pageNum" :page-size="pageSize" :total="total" layout="total, sizes, prev, pager, next, jumper" @current-change="handlePageChange" @size-change="handleSizeChange" />
      </div>
    </el-card>

    <el-dialog v-model="auditDialog.visible" :title="auditDialog.approved ? '通过审核' : '拒绝审核'" width="500px">
      <el-form v-if="!auditDialog.approved" label-width="80px">
        <el-form-item label="拒绝原因">
          <el-input v-model="auditDialog.rejectReason" type="textarea" :rows="3" placeholder="请输入拒绝原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitAudit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialog.visible" :title="mode === 'proposal' ? '纠错提案详情' : '店铺申请详情'" width="760px">
      <div v-loading="detailDialog.loading">
        <el-descriptions v-if="detailRecord" :column="2" border>
          <el-descriptions-item label="店铺名称">{{ detailRecord.shopName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="店铺类型">{{ detailRecord.shopTypeDesc || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ detailRecord.contactPerson || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ detailRecord.contactPhone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="具体位置" :span="2">{{ detailRecord.specificLocation || '-' }}</el-descriptions-item>
          <el-descriptions-item label="详细地址" :span="2">{{ detailRecord.address || '-' }}</el-descriptions-item>
          <el-descriptions-item label="生活区" :span="2">
            {{ getLivingAreaText(mode === 'proposal' ? (parseJSON(detailRecord.proposalData)?.livingAreaIds || []) : detailRecord.livingAreaIds) }}
          </el-descriptions-item>
          <el-descriptions-item label="所属校区" :span="2">
            {{ getCampusAreaText(mode === 'proposal' ? (parseJSON(detailRecord.proposalData)?.campusAreaId) : detailRecord.campusAreaId) }}
          </el-descriptions-item>
          <el-descriptions-item label="营业时间">{{ mode === 'proposal' ? (parseJSON(detailRecord.proposalData)?.businessHours || '-') : (detailRecord.businessHours || '-') }}</el-descriptions-item>
          <el-descriptions-item label="人均消费">{{ mode === 'proposal' ? (parseJSON(detailRecord.proposalData)?.avgPrice ?? '-') : (detailRecord.avgPrice ?? '-') }}</el-descriptions-item>
          <el-descriptions-item label="外卖平台" :span="2">{{ getDeliveryPlatformsText(detailRecord) }}</el-descriptions-item>
          <el-descriptions-item label="说明" :span="2">
            {{ mode === 'proposal' ? (detailRecord.reason || '-') : (detailRecord.description || '-') }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="detailRecord.status === 0 ? 'warning' : detailRecord.status === 1 ? 'success' : 'danger'">
              {{ detailRecord.status === 0 ? '待审核' : detailRecord.status === 1 ? '已通过' : '已拒绝' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatTime(detailRecord.createdAt || detailRecord.createTime) }}</el-descriptions-item>
          <el-descriptions-item label="拒绝原因" :span="2">{{ detailRecord.rejectReason || '-' }}</el-descriptions-item>
          <el-descriptions-item label="封面图" :span="2">
            <el-space wrap>
              <el-image
                v-for="(img, idx) in getDetailImagesByType(detailRecord, 3)"
                :key="'cover-' + idx"
                :src="img"
                style="width: 88px; height: 88px; border-radius: 6px"
                fit="cover"
                :preview-src-list="getDetailImagesByType(detailRecord, 3)"
                preview-teleported
              />
              <span v-if="getDetailImagesByType(detailRecord, 3).length === 0">-</span>
            </el-space>
          </el-descriptions-item>
          <el-descriptions-item label="菜单图" :span="2">
            <el-space wrap>
              <el-image
                v-for="(img, idx) in getDetailImagesByType(detailRecord, 1)"
                :key="'menu-' + idx"
                :src="img"
                style="width: 88px; height: 88px; border-radius: 6px"
                fit="cover"
                :preview-src-list="getDetailImagesByType(detailRecord, 1)"
                preview-teleported
              />
              <span v-if="getDetailImagesByType(detailRecord, 1).length === 0">-</span>
            </el-space>
          </el-descriptions-item>
          <el-descriptions-item label="菜品图" :span="2">
            <el-space wrap>
              <el-image
                v-for="(img, idx) in getDetailImagesByType(detailRecord, 2)"
                :key="'dish-' + idx"
                :src="img"
                style="width: 88px; height: 88px; border-radius: 6px"
                fit="cover"
                :preview-src-list="getDetailImagesByType(detailRecord, 2)"
                preview-teleported
              />
              <span v-if="getDetailImagesByType(detailRecord, 2).length === 0">-</span>
            </el-space>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailDialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
