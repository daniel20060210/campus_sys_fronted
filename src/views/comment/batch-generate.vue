<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { post } from '@/utils/request'

const showGuide = ref(false)
const count = ref<number | undefined>(undefined)
const loading = ref(false)
const result = ref<{ scheduledCount: number; firstAt: string; lastAt: string } | null>(null)

const handleSubmit = async () => {
  if (!count.value || count.value < 1 || count.value > 100) {
    ElMessage.warning('请输入 1-100 之间的数量')
    return
  }
  loading.value = true
  result.value = null
  try {
    const res = await post<any>('/ai/virtual-comment/trigger', { count: count.value })
    result.value = res.data
    ElMessage.success(`已安排 ${res.data.scheduledCount} 条评论任务`)
  } catch (e: any) {
    ElMessage.error(e?.message || '触发失败')
  } finally {
    loading.value = false
  }
}

const fmt = (dt: string) => dt ? dt.replace('T', ' ').substring(0, 16) : '-'
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">批量生成评论</h2>
      <el-button link type="primary" @click="showGuide = true">使用说明</el-button>
    </div>

    <el-card shadow="never">
      <el-form label-width="100px">
        <el-form-item label="生成数量">
          <el-input-number
            v-model="count"
            :min="1"
            :max="100"
            placeholder="请输入数量（1-100）"
            style="width: 200px"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSubmit">立即触发</el-button>
        </el-form-item>
      </el-form>

      <el-alert v-if="result" type="success" :closable="false" style="margin-top: 12px">
        <div>已安排 <b>{{ result.scheduledCount }}</b> 条评论任务</div>
        <div style="margin-top: 4px; font-size: 13px; color: #666">
          执行时间：{{ fmt(result.firstAt) }} ~ {{ fmt(result.lastAt) }}
        </div>
      </el-alert>
    </el-card>

    <!-- 使用说明弹窗 -->
    <el-dialog v-model="showGuide" title="使用说明" width="520px">
      <div class="guide">
        <h4>这个功能是做什么的？</h4>
        <p>触发后，系统会安排本校的虚拟用户在今天 <b>08:00 - 23:00</b> 的时间窗口内，随机选取本校帖子，由 AI 自动生成并发布评论。</p>

        <h4>输入的数字代表什么？</h4>
        <p>你输入的数字是希望安排的评论任务数量（最多 100）。实际执行数量取决于本校可用虚拟用户数，若虚拟用户不足则按实际数量安排。</p>

        <h4>评论什么时候发出？</h4>
        <p>任务会被均匀分散在剩余时间窗口内随机执行，不会集中在同一时刻，模拟真实用户行为。触发后页面会显示第一条和最后一条任务的预计执行时间。</p>

        <h4>评论内容是什么？</h4>
        <p>AI 会根据帖子的标题和正文内容自动生成贴合语境的评论，每条评论内容不同。</p>

        <h4>除了评论还会发生什么？</h4>
        <p>每个虚拟用户在发评论时，有 <b>1/3 的概率</b>同时对该帖子点赞，有 <b>1/3 的概率</b>收藏该帖子，有 <b>1/3 的概率</b>关注帖子作者。</p>

        <h4>注意事项</h4>
        <ul>
          <li>每天 23:00 后触发会报错，需等到次日 08:00 后再操作。</li>
          <li>本校必须已有虚拟用户，否则无法触发（请先在「批量注册用户」中创建）。</li>
          <li>本校必须有状态正常且未过期的帖子，否则任务执行时会跳过。</li>
        </ul>
      </div>
      <template #footer>
        <el-button type="primary" @click="showGuide = false">知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}
.guide h4 {
  margin: 16px 0 6px;
  font-size: 14px;
  font-weight: 600;
}
.guide h4:first-child {
  margin-top: 0;
}
.guide p, .guide li {
  font-size: 13px;
  color: #555;
  line-height: 1.7;
  margin: 0;
}
.guide ul {
  padding-left: 18px;
  margin: 0;
}
</style>
