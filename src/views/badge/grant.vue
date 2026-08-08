<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getBadgeDefinitions,
  getUserBadges,
  getShopBadges,
  grantUserBadge,
  revokeUserBadge,
  grantShopBadge,
  revokeShopBadge,
  getUserList,
  getShopList,
  type BadgeDefinition,
  type BadgeRecord,
} from '@/api'
import type { User, Shop } from '@/types'

const activeTab = ref('user')

// ---- 徽章定义列表（用于选择） ----
const allDefinitions = ref<BadgeDefinition[]>([])
async function loadDefinitions() {
  const res = await getBadgeDefinitions()
  allDefinitions.value = ((res as any)?.data || []).filter((d: BadgeDefinition) => d.isActive === 1)
}
loadDefinitions()

// =================== 用户徽章 ===================

// 搜索用户
const userSearchLoading = ref(false)
const userOptions = ref<User[]>([])
const selectedUserId = ref<number | null>(null)
const selectedUserLabel = ref('')

async function searchUsers(keyword: string) {
  if (!keyword) { userOptions.value = []; return }
  userSearchLoading.value = true
  try {
    const res = await getUserList({ keyword, pageNum: 1, pageSize: 10 })
    userOptions.value = (res as any)?.data?.list || []
  } finally {
    userSearchLoading.value = false
  }
}

function onUserSelect(userId: number | undefined | null) {
  if (!userId) { userBadges.value = []; selectedUserLabel.value = ''; return }
  const user = userOptions.value.find(u => u.id === userId)
  if (user) selectedUserLabel.value = `${user.nickname}（ID: ${user.id}）`
  loadUserBadges(userId)
}

// 用户徽章列表
const userBadges = ref<BadgeRecord[]>([])
const userBadgesLoading = ref(false)
const userGrantForm = ref({ badgeId: null as number | null, remark: '' })

async function loadUserBadges(userId: number) {
  userBadgesLoading.value = true
  try {
    const res = await getUserBadges(userId)
    userBadges.value = (res as any)?.data || []
  } finally {
    userBadgesLoading.value = false
  }
}

async function handleGrantUser() {
  if (!selectedUserId.value) return ElMessage.warning('请先搜索并选择用户')
  if (!userGrantForm.value.badgeId) return ElMessage.warning('请选择徽章')
  try {
    await grantUserBadge({
      targetId: selectedUserId.value,
      badgeId: userGrantForm.value.badgeId,
      remark: userGrantForm.value.remark,
    })
    ElMessage.success('发放成功')
    userGrantForm.value = { badgeId: null, remark: '' }
    loadUserBadges(selectedUserId.value)
  } catch (e: any) {
    ElMessage.error(e?.message || '发放失败')
  }
}

async function handleRevokeUser(record: BadgeRecord) {
  if (!selectedUserId.value) return
  try {
    await ElMessageBox.confirm(`确定撤销【${selectedUserLabel.value}】的【${record.badgeName || record.badgeCode}】徽章吗？`, '警告', { type: 'warning' })
    await revokeUserBadge({ targetId: selectedUserId.value, badgeId: record.badgeId })
    ElMessage.success('撤销成功')
    loadUserBadges(selectedUserId.value)
  } catch {
    // 取消操作，忽略
  }
}

// =================== 商家徽章 ===================

// 搜索商家
const shopSearchLoading = ref(false)
const shopOptions = ref<Shop[]>([])
const selectedShopId = ref<number | null>(null)
const selectedShopLabel = ref('')

async function searchShops(keyword: string) {
  if (!keyword) { shopOptions.value = []; return }
  shopSearchLoading.value = true
  try {
    const res = await getShopList({ keyword, pageNum: 1, pageSize: 10 })
    shopOptions.value = (res as any)?.data?.list || []
  } finally {
    shopSearchLoading.value = false
  }
}

function onShopSelect(shopId: number | undefined | null) {
  if (!shopId) { shopBadges.value = []; selectedShopLabel.value = ''; return }
  const shop = shopOptions.value.find(s => s.id === shopId)
  if (shop) selectedShopLabel.value = `${shop.shopName || shop.name}（ID: ${shop.id}）`
  loadShopBadges(shopId)
}

// 商家徽章列表
const shopBadges = ref<BadgeRecord[]>([])
const shopBadgesLoading = ref(false)
const shopGrantForm = ref({ badgeId: null as number | null, remark: '' })

async function loadShopBadges(shopId: number) {
  shopBadgesLoading.value = true
  try {
    const res = await getShopBadges(shopId)
    shopBadges.value = (res as any)?.data || []
  } finally {
    shopBadgesLoading.value = false
  }
}

async function handleGrantShop() {
  if (!selectedShopId.value) return ElMessage.warning('请先搜索并选择商家')
  if (!shopGrantForm.value.badgeId) return ElMessage.warning('请选择徽章')
  try {
    await grantShopBadge({
      targetId: selectedShopId.value,
      badgeId: shopGrantForm.value.badgeId,
      remark: shopGrantForm.value.remark,
    })
    ElMessage.success('发放成功')
    shopGrantForm.value = { badgeId: null, remark: '' }
    loadShopBadges(selectedShopId.value)
  } catch (e: any) {
    ElMessage.error(e?.message || '发放失败')
  }
}

async function handleRevokeShop(record: BadgeRecord) {
  if (!selectedShopId.value) return
  try {
    await ElMessageBox.confirm(`确定撤销【${selectedShopLabel.value}】的【${record.badgeName || record.badgeCode}】徽章吗？`, '警告', { type: 'warning' })
    await revokeShopBadge({ targetId: selectedShopId.value, badgeId: record.badgeId })
    ElMessage.success('撤销成功')
    loadShopBadges(selectedShopId.value)
  } catch {
    // 取消操作，忽略
  }
}

// ---- 工具 ----
function userBadgeOptions() {
  return allDefinitions.value.filter(d => d.badgeType === 1)
}
function shopBadgeOptions() {
  return allDefinitions.value.filter(d => d.badgeType === 2)
}
function grantTypeLabel(type: string) {
  return type === 'manual' ? '手动' : '自动'
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2>徽章发放管理</h2>
    </div>

    <el-tabs v-model="activeTab">
      <!-- 用户徽章 -->
      <el-tab-pane label="用户徽章" name="user">
        <el-card shadow="never" style="margin-bottom: 16px">
          <!-- 搜索用户 -->
          <el-form inline>
            <el-form-item label="搜索用户">
              <el-select
                v-model="selectedUserId"
                filterable
                remote
                clearable
                :remote-method="searchUsers"
                :loading="userSearchLoading"
                placeholder="输入昵称/姓名搜索"
                style="width: 280px"
                @change="onUserSelect"
              >
                <el-option
                  v-for="u in userOptions"
                  :key="u.id"
                  :label="`${u.nickname}（ID: ${u.id}）`"
                  :value="u.id"
                >
                  <span style="font-weight:500">{{ u.nickname }}</span>
                  <span style="color:#999;font-size:12px;margin-left:8px">ID: {{ u.id }}</span>
                  <span v-if="u.realName" style="color:#aaa;font-size:12px;margin-left:4px">/ {{ u.realName }}</span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-form>

          <template v-if="selectedUserId">
            <el-divider content-position="left">手动发放给：{{ selectedUserLabel }}</el-divider>
            <el-form inline>
              <el-form-item label="选择徽章">
                <el-select v-model="userGrantForm.badgeId" placeholder="请选择" style="width: 220px" clearable>
                  <el-option
                    v-for="d in userBadgeOptions()"
                    :key="d.id"
                    :label="`[T${d.tier}] ${d.name}`"
                    :value="d.id"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="备注">
                <el-input v-model="userGrantForm.remark" placeholder="发放原因（可选）" style="width: 180px" />
              </el-form-item>
              <el-form-item>
                <el-button type="success" @click="handleGrantUser">发放</el-button>
              </el-form-item>
            </el-form>
          </template>
        </el-card>

        <el-card shadow="never">
          <template #header>
            当前持有徽章
            <span v-if="selectedUserLabel" style="font-size:13px;color:#888;margin-left:8px">{{ selectedUserLabel }}</span>
          </template>
          <el-table :data="userBadges" v-loading="userBadgesLoading" stripe border empty-text="请先搜索并选择用户">
            <el-table-column prop="badgeId" label="徽章ID" width="80" />
            <el-table-column prop="badgeName" label="徽章名称" width="140" />
            <el-table-column prop="badgeCode" label="编码" width="160" />
            <el-table-column label="发放方式" width="90">
              <template #default="{ row }">{{ grantTypeLabel(row.grantType) }}</template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
            <el-table-column prop="grantTime" label="发放时间" width="175" />
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button link type="danger" size="small" @click="handleRevokeUser(row)">撤销</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 商家徽章 -->
      <el-tab-pane label="商家徽章" name="shop">
        <el-card shadow="never" style="margin-bottom: 16px">
          <!-- 搜索商家 -->
          <el-form inline>
            <el-form-item label="搜索商家">
              <el-select
                v-model="selectedShopId"
                filterable
                remote
                clearable
                :remote-method="searchShops"
                :loading="shopSearchLoading"
                placeholder="输入店名搜索"
                style="width: 280px"
                @change="onShopSelect"
              >
                <el-option
                  v-for="s in shopOptions"
                  :key="s.id"
                  :label="`${s.shopName || s.name}（ID: ${s.id}）`"
                  :value="s.id"
                >
                  <span style="font-weight:500">{{ s.shopName || s.name }}</span>
                  <span style="color:#999;font-size:12px;margin-left:8px">ID: {{ s.id }}</span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-form>

          <template v-if="selectedShopId">
            <el-divider content-position="left">手动发放给：{{ selectedShopLabel }}</el-divider>
            <el-form inline>
              <el-form-item label="选择徽章">
                <el-select v-model="shopGrantForm.badgeId" placeholder="请选择" style="width: 220px" clearable>
                  <el-option
                    v-for="d in shopBadgeOptions()"
                    :key="d.id"
                    :label="`[T${d.tier}] ${d.name}`"
                    :value="d.id"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="备注">
                <el-input v-model="shopGrantForm.remark" placeholder="发放原因（可选）" style="width: 180px" />
              </el-form-item>
              <el-form-item>
                <el-button type="success" @click="handleGrantShop">发放</el-button>
              </el-form-item>
            </el-form>
          </template>
        </el-card>

        <el-card shadow="never">
          <template #header>
            当前持有徽章
            <span v-if="selectedShopLabel" style="font-size:13px;color:#888;margin-left:8px">{{ selectedShopLabel }}</span>
          </template>
          <el-table :data="shopBadges" v-loading="shopBadgesLoading" stripe border empty-text="请先搜索并选择商家">
            <el-table-column prop="badgeId" label="徽章ID" width="80" />
            <el-table-column prop="badgeName" label="徽章名称" width="140" />
            <el-table-column prop="badgeCode" label="编码" width="160" />
            <el-table-column label="发放方式" width="90">
              <template #default="{ row }">{{ grantTypeLabel(row.grantType) }}</template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
            <el-table-column prop="grantTime" label="发放时间" width="175" />
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button link type="danger" size="small" @click="handleRevokeShop(row)">撤销</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.page-container {
  padding: 20px;
}
.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}
.page-header h2 {
  margin: 0;
  font-size: 20px;
}
</style>
