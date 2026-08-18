<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import dayjs from 'dayjs'
import * as echarts from 'echarts'
import {
  User,
  ChatLineRound,
  Refresh,
  Tickets,
  Money,
} from '@element-plus/icons-vue'
import { getStatistics } from '@/api'
import { useSchoolFilterStore } from '@/stores'
import type {
  StatisticsDashboard,
  StatisticsGranularity,
  StatisticsTrendPoint,
} from '@/types'

const loading = ref(false)
const schoolFilterStore = useSchoolFilterStore()
const dateRange = ref<[Date, Date] | null>([
  dayjs().subtract(29, 'day').startOf('day').toDate(),
  dayjs().endOf('day').toDate(),
])
const granularity = ref<StatisticsGranularity>('day')

function createEmptyStatistics(): StatisticsDashboard {
  return {
    userCount: 0,
    shopCount: 0,
    reviewCount: 0,
    commentCount: 0,
    postCount: 0,
    transactionTotal: 0,
    pendingCertificationCount: 0,
    pendingShopAuditCount: 0,
    pendingReviewAuditCount: 0,
    pendingCommentAuditCount: 0,
    userModule: { totalUsers: 0, newUsers: 0, activeUsers: 0, trend: [] },
    postModule: { totalPosts: 0, newPosts: 0, trend: [] },
    commentModule: { totalComments: 0, newComments: 0, trend: [] },
    transactionModule: { totalAmount: 0, rangeAmount: 0, trend: [] },
  }
}

const statistics = ref<StatisticsDashboard>(createEmptyStatistics())

const userTrendChartRef = ref<HTMLElement | null>(null)
const postTrendChartRef = ref<HTMLElement | null>(null)
const commentTrendChartRef = ref<HTMLElement | null>(null)
const transactionTrendChartRef = ref<HTMLElement | null>(null)
const mergedTrendChartRef = ref<HTMLElement | null>(null)

let userTrendChart: echarts.ECharts | null = null
let postTrendChart: echarts.ECharts | null = null
let commentTrendChart: echarts.ECharts | null = null
let transactionTrendChart: echarts.ECharts | null = null
let mergedTrendChart: echarts.ECharts | null = null

const mergedTrend = computed(() => {
  const userTrend = withMockFallback(statistics.value.userModule?.trend || [])
  const postTrend = withMockFallback(statistics.value.postModule?.trend || [])
  const commentTrend = withMockFallback(statistics.value.commentModule?.trend || [])
  const transactionTrend = withMockFallback(statistics.value.transactionModule?.trend || [])
  const maxSize = Math.max(userTrend.length, postTrend.length, commentTrend.length, transactionTrend.length)
  const rows: Array<{
    label: string
    userCount: number
    postCount: number
    commentCount: number
    transactionAmount: number
  }> = []

  for (let i = 0; i < maxSize; i++) {
    rows.push({
      label: userTrend[i]?.label || postTrend[i]?.label || commentTrend[i]?.label || transactionTrend[i]?.label || '-',
      userCount: userTrend[i]?.value || 0,
      postCount: postTrend[i]?.value || 0,
      commentCount: commentTrend[i]?.value || 0,
      transactionAmount: transactionTrend[i]?.value || 0,
    })
  }

  return rows
})

function normalizeTrend(trend?: StatisticsTrendPoint[]) {
  return trend || []
}

function withMockFallback(trend: StatisticsTrendPoint[]) {
  return trend
}

function buildSingleLineOption(title: string, trend: StatisticsTrendPoint[], color: string) {
  return {
    title: { text: title, left: 'left', textStyle: { fontSize: 13, fontWeight: 500 } },
    tooltip: { trigger: 'axis' },
    grid: { left: 36, right: 16, top: 40, bottom: 24, containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: trend.map((item) => item.label) },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      {
        name: title,
        type: 'line',
        smooth: true,
        showSymbol: false,
        areaStyle: { opacity: 0.08 },
        lineStyle: { width: 2 },
        color,
        data: trend.map((item) => item.value),
      },
    ],
  }
}

function buildMergedLineOption() {
  return {
    tooltip: { trigger: 'axis' },
    legend: { top: 8, data: ['用户新增', '帖子新增', '评论新增', '交易金额'] },
    grid: { left: 36, right: 16, top: 44, bottom: 24, containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: mergedTrend.value.map((item) => item.label) },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      { name: '用户新增', type: 'line', smooth: true, showSymbol: false, data: mergedTrend.value.map((item) => item.userCount) },
      { name: '帖子新增', type: 'line', smooth: true, showSymbol: false, data: mergedTrend.value.map((item) => item.postCount) },
      { name: '评论新增', type: 'line', smooth: true, showSymbol: false, data: mergedTrend.value.map((item) => item.commentCount) },
      { name: '交易金额', type: 'line', smooth: true, showSymbol: false, data: mergedTrend.value.map((item) => item.transactionAmount) },
    ],
  }
}

function renderTrendCharts() {
  if (userTrendChartRef.value) {
    userTrendChart = userTrendChart || echarts.init(userTrendChartRef.value)
    userTrendChart.setOption(buildSingleLineOption('新增用户趋势', withMockFallback(statistics.value.userModule?.trend || []), '#409eff'))
  }
  if (postTrendChartRef.value) {
    postTrendChart = postTrendChart || echarts.init(postTrendChartRef.value)
    postTrendChart.setOption(buildSingleLineOption('新增帖子趋势', withMockFallback(statistics.value.postModule?.trend || []), '#67c23a'))
  }
  if (commentTrendChartRef.value) {
    commentTrendChart = commentTrendChart || echarts.init(commentTrendChartRef.value)
    commentTrendChart.setOption(buildSingleLineOption('新增评论趋势', withMockFallback(statistics.value.commentModule?.trend || []), '#e6a23c'))
  }
  if (transactionTrendChartRef.value) {
    transactionTrendChart = transactionTrendChart || echarts.init(transactionTrendChartRef.value)
    transactionTrendChart.setOption(buildSingleLineOption('交易金额趋势', withMockFallback(statistics.value.transactionModule?.trend || []), '#f56c6c'))
  }
  if (mergedTrendChartRef.value) {
    mergedTrendChart = mergedTrendChart || echarts.init(mergedTrendChartRef.value)
    mergedTrendChart.setOption(buildMergedLineOption())
  }
}

function resizeCharts() {
  userTrendChart?.resize()
  postTrendChart?.resize()
  commentTrendChart?.resize()
  transactionTrendChart?.resize()
  mergedTrendChart?.resize()
}

function disposeCharts() {
  userTrendChart?.dispose()
  postTrendChart?.dispose()
  commentTrendChart?.dispose()
  transactionTrendChart?.dispose()
  mergedTrendChart?.dispose()

  userTrendChart = null
  postTrendChart = null
  commentTrendChart = null
  transactionTrendChart = null
  mergedTrendChart = null
}

async function fetchStatistics() {
  loading.value = true
  try {
    const params: {
      schoolIds?: number[]
      startTime?: number
      endTime?: number
      granularity: StatisticsGranularity
    } = { granularity: granularity.value }

    if (dateRange.value && dateRange.value.length === 2) {
      params.startTime = dayjs(dateRange.value[0]).startOf('day').valueOf()
      params.endTime = dayjs(dateRange.value[1]).endOf('day').valueOf()
    }

    if (schoolFilterStore.selectedSchoolIds.length > 0) {
      params.schoolIds = schoolFilterStore.selectedSchoolIds
    }

    const res = await getStatistics(params)
    const data = res.data || {}
    const empty = createEmptyStatistics()
    statistics.value = {
      ...empty,
      ...data,
      userModule: {
        totalUsers: data.userModule?.totalUsers ?? 0,
        newUsers: data.userModule?.newUsers ?? 0,
        activeUsers: data.userModule?.activeUsers ?? 0,
        trend: normalizeTrend(data.userModule?.trend),
      },
      postModule: {
        totalPosts: data.postModule?.totalPosts ?? 0,
        newPosts: data.postModule?.newPosts ?? 0,
        trend: normalizeTrend(data.postModule?.trend),
      },
      commentModule: {
        totalComments: data.commentModule?.totalComments ?? 0,
        newComments: data.commentModule?.newComments ?? 0,
        trend: normalizeTrend(data.commentModule?.trend),
      },
      transactionModule: {
        totalAmount: data.transactionModule?.totalAmount ?? 0,
        rangeAmount: data.transactionModule?.rangeAmount ?? 0,
        trend: normalizeTrend(data.transactionModule?.trend),
      },
    }
    await nextTick()
    renderTrendCharts()
  } catch (error) {
    console.error('获取统计数据失败:', error)
  } finally {
    loading.value = false
  }
}

async function handleSearch() {
  await fetchStatistics()
}

async function handleReset() {
  dateRange.value = [
    dayjs().subtract(29, 'day').startOf('day').toDate(),
    dayjs().endOf('day').toDate(),
  ]
  schoolFilterStore.setSchoolIds([])
  granularity.value = 'day'
  await fetchStatistics()
}

onMounted(async () => {
  await fetchStatistics()
  window.addEventListener('resize', resizeCharts)
  watch(() => schoolFilterStore.selectedSchoolIds, fetchStatistics, { deep: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts)
  disposeCharts()
})
</script>

<template>
  <div class="page-container" v-loading="loading">
    <div class="page-header">
      <h2 class="page-title">数据看板</h2>
      <el-button type="primary" link @click="fetchStatistics">
        <el-icon class="mr-1"><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

    <el-card class="filter-card" shadow="never">
      <el-form :inline="true">
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            unlink-panels
          />
        </el-form-item>

        <el-form-item label="统计粒度">
          <el-select v-model="granularity" style="width: 140px">
            <el-option label="按天" value="day" />
            <el-option label="按周" value="week" />
            <el-option label="按月" value="month" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon user-icon"><el-icon :size="32"><User /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.userCount }}</div>
              <div class="stat-label">用户总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon post-icon"><el-icon :size="32"><Tickets /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.postCount }}</div>
              <div class="stat-label">帖子总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon comment-icon"><el-icon :size="32"><ChatLineRound /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.commentCount }}</div>
              <div class="stat-label">评论总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon transaction-icon"><el-icon :size="32"><Money /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.transactionTotal }}</div>
              <div class="stat-label">交易总额</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="module-row">
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div class="module-header">用户模块</div>
          </template>
          <div class="module-metrics">
            <span>新增用户：{{ statistics.userModule?.newUsers || 0 }}</span>
            <span>活跃用户：{{ statistics.userModule?.activeUsers || 0 }}</span>
          </div>
          <div ref="userTrendChartRef" class="chart-box"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div class="module-header">帖子模块</div>
          </template>
          <div class="module-metrics">
            <span>新增帖子：{{ statistics.postModule?.newPosts || 0 }}</span>
          </div>
          <div ref="postTrendChartRef" class="chart-box"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="module-row">
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div class="module-header">评论模块</div>
          </template>
          <div class="module-metrics">
            <span>新增评论：{{ statistics.commentModule?.newComments || 0 }}</span>
          </div>
          <div ref="commentTrendChartRef" class="chart-box"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div class="module-header">交易模块</div>
          </template>
          <div class="module-metrics">
            <span>期间交易额：{{ statistics.transactionModule?.rangeAmount || 0 }}</span>
            <span>累计总额：{{ statistics.transactionModule?.totalAmount || 0 }}</span>
          </div>
          <div ref="transactionTrendChartRef" class="chart-box"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="module-row">
      <template #header>
        <div class="module-header">综合趋势对照图</div>
      </template>
      <div ref="mergedTrendChartRef" class="chart-box chart-box-lg"></div>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-title {
  margin: 0;
}

.mr-1 {
  margin-right: 4px;
}

.filter-card {
  margin-bottom: 16px;
}

.stats-row,
.module-row {
  margin-bottom: 16px;
}

.module-header {
  font-weight: 600;
}

.module-metrics {
  display: flex;
  gap: 16px;
  color: var(--el-text-color-regular);
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.chart-box {
  width: 100%;
  height: 260px;
}

.chart-box-lg {
  height: 340px;
}

.stat-card {
  .stat-content {
    display: flex;
    align-items: center;
  }

  .stat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    border-radius: 8px;
    background: #ecf5ff;
    color: #409eff;
    margin-right: 16px;

    &.user-icon {
      background: #ecf5ff;
      color: #409eff;
    }

    &.shop-icon {
      background: #f0f9ff;
      color: #67c23a;
    }

    &.review-icon {
      background: #fef0f0;
      color: #f56c6c;
    }

    &.comment-icon {
      background: #fdf6ec;
      color: #e6a23c;
    }

    &.post-icon {
      background: #f0f9eb;
      color: #67c23a;
    }

    &.transaction-icon {
      background: #fef0f0;
      color: #f56c6c;
    }
  }

  .stat-info {
    flex: 1;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    line-height: 1.2;
  }

  .stat-label {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin-top: 4px;
  }

  &.warning {
    .stat-icon {
      background: #fdf6ec;
      color: #e6a23c;
    }
  }

  &.clickable {
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }
}

.stat-link {
  text-decoration: none;
  color: inherit;
  display: block;
}
</style>
