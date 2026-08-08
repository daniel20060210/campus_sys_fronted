<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

interface Message {
  id: number
  senderId: number
  senderName: string
  senderRole: 'complainant' | 'respondent' | 'admin'
  content: string
  timestamp: number
}

const route = useRoute()
const router = useRouter()
const disputeId = Number(route.query.id)

interface Dispute {
  id: number
  orderNo: string
  complainantName: string
  respondentName: string
  amount: number
  reason: string
}

const dispute = ref<Dispute | null>(null)
const messages = ref<Message[]>([])
const newMessage = ref('')
const messagesContainer = ref<HTMLElement | null>(null)

const mockDisputes: Record<number, Dispute> = {
  1: { id: 1, orderNo: 'ORD20240401001', complainantName: '林晓雨', respondentName: '王记烤肉店', amount: 45.5, reason: '商家少送了一份主食，沟通后拒绝补偿' },
  2: { id: 2, orderNo: 'ORD20240402003', complainantName: '王浩然', respondentName: '陈大壮', amount: 28.0, reason: '买家拒绝收货并申请退款，但商品已正常发出' },
  3: { id: 3, orderNo: 'ORD20240403007', complainantName: '张思远', respondentName: '校园便利铺', amount: 62.0, reason: '收到商品与描述不符，要求全额退款' },
  4: { id: 4, orderNo: 'ORD20240404012', complainantName: '陈佳丽', respondentName: '刘子墨', amount: 15.0, reason: '外卖配送途中餐品洒漏，要求赔偿' },
  5: { id: 5, orderNo: 'ORD20240405018', complainantName: '赵敏捷', respondentName: '美味快餐店', amount: 33.0, reason: '餐品中发现异物，商家不承认责任' },
  6: { id: 6, orderNo: 'ORD20240406022', complainantName: '孙小红', respondentName: '周大伟', amount: 88.0, reason: '二手交易买家收货后反映商品有隐性损坏' },
  7: { id: 7, orderNo: 'ORD20240407031', complainantName: '吴晨曦', respondentName: '宿舍零食铺', amount: 19.9, reason: '订单显示已送达但实际未收到' },
  8: { id: 8, orderNo: 'ORD20240408045', complainantName: '郑雨桐', respondentName: '李晓华', amount: 120.0, reason: '预付定金后商家失联，无法完成交易' },
}

const mockMessages: Message[] = [
  { id: 1, senderId: 101, senderName: '林晓雨', senderRole: 'complainant', content: '您好，我订单里少了一份主食，已经和商家沟通但他们拒绝补偿。', timestamp: 1745000000000 },
  { id: 2, senderId: 201, senderName: '王记烤肉店', senderRole: 'respondent', content: '您好，我们这边核查了订单，确实是按单配餐的，可能是出餐时漏装了。', timestamp: 1745000600000 },
  { id: 3, senderId: 101, senderName: '林晓雨', senderRole: 'complainant', content: '那请问怎么处理呢？我花了45块钱结果没吃到主食。', timestamp: 1745001200000 },
  { id: 4, senderId: 1, senderName: '校级管理员', senderRole: 'admin', content: '您好，我是校级管理员，已收到纠纷反馈，正在核实情况。', timestamp: 1745001800000 },
  { id: 5, senderId: 201, senderName: '王记烤肉店', senderRole: 'respondent', content: '校级管理员您好，我们可以给用户补发一份，但用户已经申请了全额退款，这个我们需要讨论一下。', timestamp: 1745002400000 },
]

onMounted(() => {
  if (!disputeId || !mockDisputes[disputeId]) {
    ElMessage.error('无效的纠纷ID')
    return
  }
  dispute.value = mockDisputes[disputeId]
  messages.value = [...mockMessages]
  scrollToBottom()
})

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const sendMessage = () => {
  if (!newMessage.value.trim()) return
  
  const msg: Message = {
    id: Date.now(),
    senderId: 1,
    senderName: '校级管理员',
    senderRole: 'admin',
    content: newMessage.value.trim(),
    timestamp: Date.now()
  }
  
  messages.value.push(msg)
  newMessage.value = ''
  scrollToBottom()
}

const formatTime = (time: number) => dayjs(time).format('HH:mm')

const getSenderLabel = (role: string) => {
  switch (role) {
    case 'complainant': return '投诉方'
    case 'respondent': return '被投诉方'
    case 'admin': return '校级管理员'
    default: return ''
  }
}
</script>

<template>
  <div class="chat-container">
    <div class="chat-header" v-if="dispute">
      <div class="dispute-info">
        <el-button type="primary" link @click="router.push('/dispute/list')">
          <el-icon><ArrowLeft /></el-icon>
          返回列表
        </el-button>
        <h3>纠纷聊天室</h3>
        <el-tag size="small">订单号: {{ dispute.orderNo }}</el-tag>
      </div>
      <div class="dispute-detail">
        <span>投诉方: {{ dispute.complainantName }}</span>
        <span>被投诉方: {{ dispute.respondentName }}</span>
        <span>涉及金额: ¥{{ dispute.amount.toFixed(2) }}</span>
      </div>
    </div>

    <div class="messages-container" ref="messagesContainer">
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="message-item"
        :class="{ 'is-mine': msg.senderRole === 'admin' }"
      >
        <div class="message-header">
          <span class="sender-name">{{ msg.senderName }}</span>
          <el-tag
            :type="msg.senderRole === 'admin' ? 'danger' : msg.senderRole === 'complainant' ? 'warning' : 'success'"
            size="small"
          >
            {{ getSenderLabel(msg.senderRole) }}
          </el-tag>
          <span class="message-time">{{ formatTime(msg.timestamp) }}</span>
        </div>
        <div class="message-content">{{ msg.content }}</div>
      </div>
    </div>

    <div class="input-container">
      <el-input
        v-model="newMessage"
        placeholder="请输入消息..."
        @keyup.enter="sendMessage"
      />
      <el-button type="primary" @click="sendMessage">发送</el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  background: var(--el-bg-color);
  border-radius: 8px;
}

.chat-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color);
  
  .dispute-info {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
    
    h3 {
      margin: 0;
      color: var(--el-text-color-primary);
    }
  }
  
  .dispute-detail {
    display: flex;
    gap: 20px;
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  
  .message-item {
    margin-bottom: 20px;
    
    &.is-mine {
      .message-content {
        background: var(--el-fill-color-light);
        border-color: var(--el-border-color-light);
      }
    }
    
    .message-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
      
      .sender-name {
        font-weight: 500;
        color: var(--el-text-color-primary);
      }
      
      .message-time {
        color: var(--el-text-color-placeholder);
        font-size: 12px;
        margin-left: auto;
      }
    }
    
    .message-content {
      padding: 10px 14px;
      background: var(--el-fill-color-light);
      border-radius: 8px;
      border: 1px solid var(--el-border-color-light);
      line-height: 1.5;
      color: var(--el-text-color-primary);
    }
  }
}

.input-container {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--el-border-color);
  
  :deep(.el-input) {
    flex: 1;
  }
}
</style>
