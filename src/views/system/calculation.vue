<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { triggerShopMetricsCalculation, type ShopMetricsCalcResult } from '@/api'

const running = ref(false)
const lastResult = ref<ShopMetricsCalcResult | null>(null)

const handleTrigger = async () => {
  if (running.value) return
  running.value = true
  try {
    const res = await triggerShopMetricsCalculation()
    lastResult.value = res.data
    ElMessage.success('重算任务触发成功')
  } catch (error) {
    console.error('触发重算失败:', error)
  } finally {
    running.value = false
  }
}

const formatTime = (value?: string) => {
  if (!value) return '-'
  return dayjs(value).format('YYYY-MM-DD HH:mm:ss')
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">计算管理</h2>
    </div>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>计算任务1：店铺评分/人均消费重算</span>
        </div>
      </template>

      <p class="desc">定时任务每天凌晨执行一次；超级管理员可手动触发立即重算。</p>

      <el-button type="primary" :loading="running" @click="handleTrigger">手动触发重算</el-button>

      <el-descriptions v-if="lastResult" style="margin-top: 16px" :column="2" border>
        <el-descriptions-item label="店铺总数">{{ lastResult.totalShops }}</el-descriptions-item>
        <el-descriptions-item label="更新数量">{{ lastResult.updatedShops }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ formatTime(lastResult.startedAt) }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ formatTime(lastResult.finishedAt) }}</el-descriptions-item>
        <el-descriptions-item label="耗时" :span="2">{{ lastResult.durationMs }} ms</el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<style scoped>
.desc {
  color: var(--el-text-color-regular);
  margin-bottom: 16px;
}
</style>
