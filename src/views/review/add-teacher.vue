<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElTag } from 'element-plus'
import { batchAddTeachers } from '@/api'

interface TeacherItem {
  name: string
  courses: string[]
}

// 批量输入
const batchInput = ref('')
// 提交中
const submitting = ref(false)
// 结果
const result = ref<{
  totalCount: number
  successCount: number
  failCount: number
  successItems: { name: string; courses: string[] }[]
  failDetails: { name: string; reason: string }[]
} | null>(null)

// 解析输入：每行 "教师名 课程1,课程2"
// 课程分隔符：逗号、顿号、分号
const COURSE_SEP = /[,，、;]/

const parsedItems = computed<TeacherItem[]>(() => {
  if (!batchInput.value.trim()) return []
  const lines = batchInput.value.split(/\n/)
  const result: TeacherItem[] = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    // 按空格或 Tab 分割教师名和课程
    const idx = trimmed.search(/[\s\t]/)
    let name: string
    let courses: string[] = []
    if (idx > 0) {
      name = trimmed.substring(0, idx)
      courses = trimmed.substring(idx + 1)
        .split(COURSE_SEP)
        .map(c => c.trim())
        .filter(c => c.length > 0)
    } else {
      name = trimmed
    }
    result.push({ name, courses })
  }
  return result
})

// 同一教师名自动合并课程
const mergedItems = computed<TeacherItem[]>(() => {
  const map = new Map<string, Set<string>>()
  for (const item of parsedItems.value) {
    if (!map.has(item.name)) {
      map.set(item.name, new Set())
    }
    const courseSet = map.get(item.name)!
    item.courses.forEach(c => courseSet.add(c))
  }
  return Array.from(map.entries()).map(([name, courses]) => ({
    name,
    courses: Array.from(courses)
  }))
})

const teacherCount = computed(() => mergedItems.value.length)
const courseCount = computed(() =>
  mergedItems.value.reduce((sum, t) => sum + t.courses.length, 0)
)

// 清除
function clearAll() {
  batchInput.value = ''
  result.value = null
}

// 提交
async function handleSubmit() {
  if (mergedItems.value.length === 0) {
    ElMessage.warning('请至少输入一个教师姓名')
    return
  }

  submitting.value = true
  result.value = null
  try {
    const res = await batchAddTeachers(mergedItems.value)
    result.value = res.data
    if (result.value!.failCount === 0) {
      ElMessage.success(`全部 ${result.value!.successCount} 个教师添加成功`)
    } else {
      ElMessage.warning(`成功 ${result.value!.successCount} 个，失败 ${result.value!.failCount} 个`)
    }
    if (result.value!.successCount > 0) {
      batchInput.value = ''
    }
  } catch (err: any) {
    ElMessage.error(err.message || '添加失败')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">新增教师</h2>
      <p class="page-desc">批量添加本校教师及课程，学生端即可对各课程发起评分</p>
    </div>

    <el-card shadow="never">
      <!-- 输入区域 -->
      <div style="margin-bottom: 16px">
        <p style="margin: 0 0 8px 0; font-weight: 500">批量输入</p>
        <p style="margin: 0 0 8px 0; font-size: 13px; color: var(--el-text-color-secondary)">
          每行一个教师，格式：<code>教师名 课程1,课程2,课程3</code>（课程可选，不填则只加教师）
        </p>
        <el-input
          v-model="batchInput"
          type="textarea"
          :rows="10"
          placeholder="张三 高等数学,线性代数&#10;李四 大学物理,电路分析&#10;王五"
        />
      </div>

      <!-- 解析预览 -->
      <div v-if="mergedItems.length > 0" style="margin-bottom: 20px">
        <el-divider content-position="left">
          待添加：{{ teacherCount }} 位教师
          <template v-if="courseCount > 0">，{{ courseCount }} 门课程</template>
        </el-divider>
        <div class="preview-list">
          <div v-for="item in mergedItems" :key="item.name" class="preview-row">
            <el-tag type="primary" size="large" class="teacher-tag">{{ item.name }}</el-tag>
            <template v-if="item.courses.length > 0">
              <span class="course-arrow">→</span>
              <el-tag
                v-for="c in item.courses"
                :key="c"
                type="success"
                size="small"
                class="course-tag"
              >{{ c }}</el-tag>
            </template>
            <span v-else class="no-course">（仅添加教师，无课程）</span>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <el-space>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          提交添加
        </el-button>
        <el-button @click="clearAll" :disabled="!batchInput && !result">清空</el-button>
      </el-space>

      <!-- 结果展示 -->
      <div v-if="result" style="margin-top: 24px">
        <el-divider content-position="left">添加结果</el-divider>
        <el-row :gutter="24">
          <el-col :span="8">
            <el-statistic title="教师总数" :value="result.totalCount" />
          </el-col>
          <el-col :span="8">
            <el-statistic title="成功" :value="result.successCount" />
          </el-col>
          <el-col :span="8">
            <el-statistic title="失败" :value="result.failCount" />
          </el-col>
        </el-row>

        <!-- 成功明细 -->
        <div v-if="result.successItems.length > 0" style="margin-top: 16px">
          <p style="font-weight: 500; margin-bottom: 8px">成功明细：</p>
          <div v-for="item in result.successItems" :key="item.name" class="result-row">
            <el-tag type="success" size="small">{{ item.name }}</el-tag>
            <el-tag
              v-for="c in item.courses"
              :key="c"
              size="small"
              style="margin-left: 4px"
            >{{ c }}</el-tag>
            <span v-if="item.courses.length === 0" style="font-size: 12px; color: var(--el-text-color-secondary)">无课程</span>
          </div>
        </div>

        <!-- 失败明细 -->
        <el-table
          v-if="result.failDetails.length > 0"
          :data="result.failDetails"
          stripe
          size="small"
          style="margin-top: 16px"
        >
          <el-table-column prop="name" label="教师姓名" width="180" />
          <el-table-column prop="reason" label="失败原因" />
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.page-container { padding: 20px; }
.page-header { margin-bottom: 20px; }
.page-title { font-size: 20px; font-weight: 600; margin: 0 0 8px 0; }
.page-desc { font-size: 13px; color: var(--el-text-color-secondary); margin: 0; }
.preview-list { display: flex; flex-direction: column; gap: 8px; }
.preview-row { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
.teacher-tag { font-weight: 500; }
.course-arrow { margin: 0 2px; color: var(--el-text-color-secondary); }
.course-tag { margin-left: 2px; }
.no-course { font-size: 12px; color: var(--el-text-color-secondary); }
.result-row { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; margin-bottom: 4px; }
</style>
