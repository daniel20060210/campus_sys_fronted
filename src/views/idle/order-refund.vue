<script setup lang="ts">
/**
 * 闲置订单退款处理页面
 * 管理员审核退款申请中的闲置订单，可同意或拒绝退款
 */
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useTable } from '@/composables'
import { useSchoolFilterStore } from '@/stores'
import {
  getIdleOrderRefundList,
  approveIdleOrderRefund,
  rejectIdleOrderRefund,
} from '@/api'
import dayjs from 'dayjs'

const schoolFilterStore = useSchoolFilterStore()

const fetchRefundList = (params: Record<string, any>) => {
  const apiParams: any = { pageNum: params.pageNum, pageSize: params.pageSize }
  if (schoolFilterStore.selectedSchoolIds.length > 0) {
    apiParams.campusIds = schoolFilterStore.selectedSchoolIds
  }
  return getIdleOrderRefundList(apiParams)
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
} = useTable(fetchRefundList)

// 监听学校筛选变化
watch(() => schoolFilterStore.selectedSchoolIds, () => {
  pageNum.value = 1
  fetchData()
}, { deep: true })

// 退款处理对话框
const refundDialog = ref({
  visible: false,
  orderId: 0,
  approved: true,
  reason: '',
})

// 详情对话框
const detailDialog = ref({ visible: false })
const detailRecord = ref<any>(null)

const orderStatusTagType = (status: number) => {
  // 5 = 退款申请中
  if (status === 5) return 'warning'
  return 'info'
}

const formatTime = (time: string) => {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const openRefundDialog = (row: any, approved: boolean) => {
  refundDialog.value = {
    visible: true,
    orderId: row.id,
    approved,
    reason: '',
  }
}

const submitRefund = async () => {
  try {
    if (refundDialog.value.approved) {
      await approveIdleOrderRefund(refundDialog.value.orderId)
    } else {
      const reason = refundDialog.value.reason || undefined
      await rejectIdleOrderRefund(refundDialog.value.orderId, reason)
    }
    ElMessage.success('操作成功')
    refundDialog.value.visible = false
    fetchData()
  } catch (error) {
    console.error('退款处理失败:', error)
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
      <h2 class="page-title">退款处理</h2>
    </div>

    <el-card shadow="never">
      <el-table v-loading="loading" :data="data" stripe style="width: 100%">
        <el-table-column prop="id" label="订单ID" width="80" />
        <el-table-column prop="orderNo" label="订单号" width="200" show-overflow-tooltip />
        <el-table-column prop="productTitle" label="商品" min-width="160" show-overflow-tooltip />
        <el-table-column label="商品图片" width="80">
          <template #default="{ row }">
            <el-image
              v-if="row.productImage"
              :src="row.productImage"
              style="width: 48px; height: 48px; border-radius: 4px"
              fit="cover"
              preview-teleported
            />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="售价" width="90">
          <template #default="{ row }">¥{{ row.price }}</template>
        </el-table-column>
        <el-table-column prop="actualPaid" label="实付金额" width="100">
          <template #default="{ row }">¥{{ row.actualPaid }}</template>
        </el-table-column>
        <el-table-column prop="buyerId" label="买家ID" width="80" />
        <el-table-column prop="sellerId" label="卖家ID" width="80" />
        <el-table-column prop="counterpartyNickname" label="对方昵称" width="120" />
        <el-table-column prop="status" label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="orderStatusTagType(row.status)" size="small">
              {{ row.statusDesc }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="payTime" label="支付时间" width="170">
          <template #default="{ row }">{{ formatTime(row.payTime) }}</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="170">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDetailDialog(row)">查看详情</el-button>
            <el-button link type="success" size="small" @click="openRefundDialog(row, true)">同意退款</el-button>
            <el-button link type="warning" size="small" @click="openRefundDialog(row, false)">拒绝退款</el-button>
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

    <!-- 退款处理对话框 -->
    <el-dialog v-model="refundDialog.visible" :title="refundDialog.approved ? '确认同意退款' : '拒绝退款'" width="500px">
      <p v-if="refundDialog.approved" style="margin-bottom: 16px;">确定同意该退款申请吗？退款将全额返回买家。</p>
      <el-form v-if="!refundDialog.approved" label-width="80px">
        <el-form-item label="拒绝原因">
          <el-input
            v-model="refundDialog.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入拒绝原因（可选）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="refundDialog.visible = false">取消</el-button>
        <el-button :type="refundDialog.approved ? 'success' : 'warning'" @click="submitRefund">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailDialog.visible" title="订单详情" width="760px">
      <el-descriptions v-if="detailRecord" :column="2" border>
        <el-descriptions-item label="订单ID">{{ detailRecord.id }}</el-descriptions-item>
        <el-descriptions-item label="订单号">{{ detailRecord.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="商品">{{ detailRecord.productTitle || '-' }}</el-descriptions-item>
        <el-descriptions-item label="商品ID">{{ detailRecord.productId }}</el-descriptions-item>
        <el-descriptions-item label="售价">¥{{ detailRecord.price }}</el-descriptions-item>
        <el-descriptions-item label="服务费">¥{{ detailRecord.serviceFee ?? 0 }}</el-descriptions-item>
        <el-descriptions-item label="实付金额">¥{{ detailRecord.actualPaid }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="orderStatusTagType(detailRecord.status)" size="small">{{ detailRecord.statusDesc }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="买家ID">{{ detailRecord.buyerId }}</el-descriptions-item>
        <el-descriptions-item label="卖家ID">{{ detailRecord.sellerId }}</el-descriptions-item>
        <el-descriptions-item label="对方昵称">{{ detailRecord.counterpartyNickname || '-' }}</el-descriptions-item>
        <el-descriptions-item label="对方头像">
          <el-image
            v-if="detailRecord.counterpartyAvatarUrl"
            :src="detailRecord.counterpartyAvatarUrl"
            style="width: 48px; height: 48px; border-radius: 50%"
            fit="cover"
          />
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="微信交易号" :span="2">{{ detailRecord.wxPayTransactionId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ formatTime(detailRecord.payTime) }}</el-descriptions-item>
        <el-descriptions-item label="发货时间">{{ formatTime(detailRecord.shipTime) }}</el-descriptions-item>
        <el-descriptions-item label="确认收货时间">{{ formatTime(detailRecord.confirmTime) }}</el-descriptions-item>
        <el-descriptions-item label="支付截止时间">{{ formatTime(detailRecord.payExpireTime) }}</el-descriptions-item>
        <el-descriptions-item label="自动确认收货">{{ formatTime(detailRecord.autoConfirmTime) }}</el-descriptions-item>
        <el-descriptions-item label="取消原因">{{ detailRecord.cancelReason || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatTime(detailRecord.createdAt) }}</el-descriptions-item>
        <el-descriptions-item v-if="detailRecord.productImage" label="商品图片" :span="2">
          <el-image
            :src="detailRecord.productImage"
            style="width: 100px; height: 100px; border-radius: 6px"
            fit="cover"
            preview-teleported
          />
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
