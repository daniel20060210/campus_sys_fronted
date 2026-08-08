<script setup lang="ts">
/**
 * 闲置商品审核页面
 * 高校管理员审核本校待人工审核的闲置商品（二手书 + 其他闲置）
 */
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useTable } from '@/composables'
import { useSchoolFilterStore } from '@/stores'
import {
  getIdleProductReviewList,
  approveIdleProduct,
  rejectIdleProduct,
} from '@/api'
import type { IdleProductRejectDTO } from '@/api'
import dayjs from 'dayjs'

const schoolFilterStore = useSchoolFilterStore()

const fetchReviewList = (params: Record<string, any>) => {
  const apiParams: any = { pageNum: params.pageNum, pageSize: params.pageSize }
  if (schoolFilterStore.selectedSchoolIds.length > 0) {
    apiParams.campusIds = schoolFilterStore.selectedSchoolIds
  }
  return getIdleProductReviewList(apiParams)
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
} = useTable(fetchReviewList)

// 监听学校筛选变化
watch(() => schoolFilterStore.selectedSchoolIds, () => {
  pageNum.value = 1
  fetchData()
}, { deep: true })

// 审核对话框
const auditDialog = ref({
  visible: false,
  productId: 0,
  approved: true,
  reason: '',
})

// 详情对话框
const detailDialog = ref({ visible: false })
const detailRecord = ref<any>(null)

const subTypeText = (subType: number) => {
  return subType === 1 ? '二手书' : '其他闲置'
}

const conditionLevelText = (level: number) => {
  const map: Record<number, string> = {
    1: '全新',
    2: '九成新',
    3: '八成新',
    4: '有使用痕迹',
    5: '较旧',
  }
  return map[level] || '-'
}

const deliveryTypeText = (type: number) => {
  return type === 1 ? '自取' : '快递'
}

const statusTagType = (status: number) => {
  if (status === 5) return 'warning'  // 待人工审核
  if (status === 1) return 'success'  // 上架中
  if (status === 4) return 'danger'   // 审核驳回
  return 'info'
}

const formatTime = (time: string) => {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const openAuditDialog = (row: any, approved: boolean) => {
  auditDialog.value = {
    visible: true,
    productId: row.productId,
    approved,
    reason: '',
  }
}

const submitAudit = async () => {
  try {
    if (auditDialog.value.approved) {
      await approveIdleProduct(auditDialog.value.productId)
    } else {
      const rejectData: IdleProductRejectDTO = { reason: auditDialog.value.reason }
      await rejectIdleProduct(auditDialog.value.productId, rejectData)
    }
    ElMessage.success('审核成功')
    auditDialog.value.visible = false
    fetchData()
  } catch (error) {
    console.error('审核失败:', error)
  }
}

const openDetailDialog = (row: any) => {
  detailRecord.value = row
  detailDialog.value.visible = true
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="page-container" v-loading="loading">
    <div class="page-header">
      <h2 class="page-title">闲置商品审核</h2>
    </div>

    <el-card shadow="never">
      <el-table v-loading="loading" :data="data" stripe style="width: 100%">
        <el-table-column prop="productId" label="商品ID" width="80" />
        <el-table-column prop="subType" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.subType === 1 ? '' : 'info'" size="small">
              {{ subTypeText(row.subType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="price" label="售价" width="100">
          <template #default="{ row }">¥{{ row.price }}</template>
        </el-table-column>
        <el-table-column prop="conditionLevel" label="新旧程度" width="110">
          <template #default="{ row }">{{ conditionLevelText(row.conditionLevel) }}</template>
        </el-table-column>
        <el-table-column prop="deliveryType" label="交货方式" width="100">
          <template #default="{ row }">{{ deliveryTypeText(row.deliveryType) }}</template>
        </el-table-column>
        <el-table-column prop="sellerNickname" label="卖家" width="120" />
        <el-table-column prop="status" label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">
              {{ row.statusDesc }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="发布时间" width="170">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDetailDialog(row)">查看详情</el-button>
            <template v-if="row.status === 5">
              <el-button link type="success" size="small" @click="openAuditDialog(row, true)">通过</el-button>
              <el-button link type="warning" size="small" @click="openAuditDialog(row, false)">驳回</el-button>
            </template>
            <template v-else>
              <span style="color:#999">已处理</span>
            </template>
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

    <!-- 审核对话框 -->
    <el-dialog v-model="auditDialog.visible" :title="auditDialog.approved ? '通过审核' : '驳回审核'" width="500px">
      <el-form v-if="!auditDialog.approved" label-width="80px">
        <el-form-item label="驳回原因" required>
          <el-input
            v-model="auditDialog.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入驳回原因（最长500字符）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitAudit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailDialog.visible" title="商品详情" width="760px">
      <el-descriptions v-if="detailRecord" :column="2" border>
        <el-descriptions-item label="商品ID">{{ detailRecord.productId }}</el-descriptions-item>
        <el-descriptions-item label="类型">
          <el-tag :type="detailRecord.subType === 1 ? '' : 'info'" size="small">
            {{ subTypeText(detailRecord.subType) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="名称" :span="2">{{ detailRecord.title }}</el-descriptions-item>
        <el-descriptions-item v-if="detailRecord.category" label="分类">{{ detailRecord.category }}</el-descriptions-item>
        <el-descriptions-item label="售价">¥{{ detailRecord.price }}</el-descriptions-item>
        <el-descriptions-item label="新旧程度">{{ conditionLevelText(detailRecord.conditionLevel) }}</el-descriptions-item>
        <el-descriptions-item label="交货方式">{{ deliveryTypeText(detailRecord.deliveryType) }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ detailRecord.description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="卖家">{{ detailRecord.sellerNickname }}（ID: {{ detailRecord.sellerId }}）</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTagType(detailRecord.status)" size="small">{{ detailRecord.statusDesc }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="发布时间">{{ formatTime(detailRecord.createdAt) }}</el-descriptions-item>
        <el-descriptions-item v-if="detailRecord.imageUrls && detailRecord.imageUrls.length > 0" label="商品图片" :span="2">
          <el-space wrap>
            <el-image
              v-for="(img, idx) in detailRecord.imageUrls"
              :key="idx"
              :src="img"
              style="width: 100px; height: 100px; border-radius: 6px"
              fit="cover"
              :preview-src-list="detailRecord.imageUrls"
              preview-teleported
            />
          </el-space>
        </el-descriptions-item>
        <el-descriptions-item v-else label="商品图片" :span="2">-</el-descriptions-item>
      </el-descriptions>
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
