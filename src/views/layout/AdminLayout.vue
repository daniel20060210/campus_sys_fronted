<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { Fold, Expand, User, SwitchButton } from '@element-plus/icons-vue'
import { useUserStore, useSchoolFilterStore, useConfigStore } from '@/stores'
import { getAllSchools } from '@/api'
import type { AdminPermissionCode } from '@/types'
import type { School } from '@/types'
import DarkToggle from '@/components/DarkToggle.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const schoolFilterStore = useSchoolFilterStore()
const configStore = useConfigStore()
const uiConfig = configStore.config
const isCollapse = ref(false)

const userInfo = JSON.parse(localStorage.getItem('admin_user') || '{}')
const isSuperAdmin = computed(() => Number(userInfo?.userType) === 1)

const schools = ref<School[]>([])

async function loadSchoolOptions() {
  if (!isSuperAdmin.value) return
  try {
    const res = await getAllSchools()
    schools.value = res.data || []
    if (schoolFilterStore.selectedSchoolIds.length === 0) {
      schoolFilterStore.setSchoolIds(schools.value.map((s: School) => s.id as number))
    }
  } catch (e) {
    console.error('加载学校列表失败:', e)
  }
}

onMounted(loadSchoolOptions)

const activeMenu = computed(() => {
  const segments = route.path.split('/').filter(Boolean)
  return segments.length > 1 ? `/${segments[0]}/${segments[1]}` : route.path
})

interface MenuItem {
  path: string
  title: string
  icon?: string
  permissionCodes?: AdminPermissionCode[]
  requireSuperAdmin?: boolean
  requireCampusAdmin?: boolean
  children?: MenuItem[]
}

const menuItems: MenuItem[] = [
  { path: '/statistics', title: '数据看板', icon: 'DataAnalysis' },
  {
    path: '/user',
    title: '用户管理',
    icon: 'User',
    children: [
      { path: '/user/list', title: '用户列表' },
      { path: '/user/admin-list', title: '校级管理员列表', requireSuperAdmin: true },
      { path: '/user/batch-register', title: '批量注册用户' },
      { path: '/user/school-change', title: '学校/专业修改申请' },
      { path: '/user/department-major', title: '院系专业管理' },
    ],
  },
  {
    path: '/comment',
    title: '评论管理',
    icon: 'ChatLineRound',
    children: [{ path: '/comment/audit', title: '评论列表', permissionCodes: ['COMMENT_AUDIT'] }, { path: '/comment/batch-generate', title: '批量生成评论' }],
  },
  {
    path: '/post',
    title: '帖子管理',
    icon: 'Document',
    children: [
      { path: '/post/list', title: '帖子列表' },
      { path: '/post/batch-generate', title: '帖子批量生成' },
    ],
  },
  {
    path: '/review',
    title: '评价管理',
    icon: 'Edit',
    children: [
      { path: '/review/list', title: '评价列表' },
      { path: '/review/audit', title: '评价审核', permissionCodes: ['REVIEW_AUDIT'] },
      { path: '/review/add-teacher', title: '新增教师', requireCampusAdmin: true },
      { path: '/review/course-apply', title: '课程申请审核', requireCampusAdmin: true },
    ],
  },
  {
    path: '/dispute',
    title: '纠纷处理',
    icon: 'ScaleToOriginal',
    children: [{ path: '/dispute/list', title: '纠纷列表' }],
  },
  {
    path: '/governance',
    title: '举报治理',
    icon: 'Warning',
    children: [
      { path: '/governance/reports', title: '举报中心', permissionCodes: ['REPORT_AUDIT'] },
      { path: '/governance/penalties', title: '处罚记录', permissionCodes: ['REPORT_AUDIT'] },
    ],
  },
  {
    path: '/activity',
    title: '限时活动',
    icon: 'Opportunity',
    children: [
      { path: '/activity/pre-sale', title: '图书预售' },
      { path: '/activity/invite-reward', title: '邀请有奖', requireSuperAdmin: true },
    ],
  },
  {
    path: '/ai',
    title: 'AI助手',
    icon: 'MagicStick',
    children: [{ path: '/ai/index', title: 'AI助手' }],
  },
  {
    path: '/system',
    title: '系统配置',
    icon: 'Setting',
    children: [{ path: '/system/settings', title: '系统配置' }],
  },
]

const filteredMenuItems = computed(() => {
  const filterMenu = (items: MenuItem[]): MenuItem[] => {
    const result: MenuItem[] = []

    for (const item of items) {
      if (item.requireSuperAdmin && !userStore.isSuperAdmin) continue
      if (item.requireCampusAdmin && userStore.isSuperAdmin) continue
      const selfVisible = userStore.hasAnyPermission(item.permissionCodes || [])
      if (!selfVisible) continue

      const children = item.children ? filterMenu(item.children) : undefined
      if (item.children && (!children || children.length === 0)) continue

      result.push({ ...item, children })
    }

    return result
  }

  return filterMenu(menuItems)
})

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    userStore.logout()
    router.push('/login')
  })
}

const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}
</script>

<template>
  <div class="admin-layout">
    <aside class="sidebar" :class="{ collapsed: isCollapse, 'sidebar-light': uiConfig.navTheme === 'light' }">
      <div v-if="uiConfig.sidebarLogo" class="logo">
        <span v-show="!isCollapse">CampusX 管理后台</span>
        <span v-show="isCollapse">CX</span>
      </div>

      <div class="sidebar-menu">
      <el-menu :default-active="activeMenu" :collapse="isCollapse" :unique-opened="true" router>
        <template v-for="item in filteredMenuItems" :key="item.path">
          <el-sub-menu v-if="item.children?.length" :index="item.path">
            <template #title>
              <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
              <span>{{ item.title }}</span>
            </template>
            <el-menu-item v-for="child in item.children" :key="child.path" :index="child.path">
              {{ child.title }}
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item v-else :index="item.path">
            <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
            <template #title>{{ item.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>
      </div>
    </aside>

    <div class="main-container">
      <header class="header" :class="{ 'header-fixed': uiConfig.fixedHeader }">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="toggleSidebar">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb v-if="uiConfig.showBreadcrumb" separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="route.meta?.title">{{ route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <el-select
            v-if="isSuperAdmin"
            v-model="schoolFilterStore.selectedSchoolIds"
            placeholder="全部学校"
            clearable
            multiple
            collapse-tags
            collapse-tags-tooltip
            style="width: 220px; margin-right: 12px"
          >
            <el-option v-for="school in schools" :key="school.id" :label="school.name" :value="school.id" />
          </el-select>
          <DarkToggle style="margin-right: 12px" />
          <el-dropdown @command="handleLogout">
            <div class="user-info">
              <el-icon><User /></el-icon>
              <span>{{ userStore.userInfo?.nickname || (userStore.userInfo?.role === 1 ? '超级管理员' : '校级管理员') }}</span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item :icon="SwitchButton" command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <main class="main-content" :class="{ 'main-content-fixed': uiConfig.fixedHeader }">
        <RouterView v-slot="{ Component }">
          <transition :name="uiConfig.pageAnimation ? 'fade-slide' : ''" mode="out-in">
            <component :is="Component" />
          </transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.admin-layout { display: flex; width: 100%; height: 100%; }
.sidebar { width: 200px; height: 100%; background: #304156; transition: width .3s; display: flex; flex-direction: column; overflow: hidden; }
.sidebar.collapsed { width: 64px; }
.sidebar.sidebar-light { background: #fff; border-right: 1px solid #e4e7ed; }
.logo { display: flex; align-items: center; justify-content: center; height: 60px; padding: 0 16px; background: #2b3a4a; color: #fff; font-size: 18px; font-weight: 500; flex-shrink: 0; }
.logo span { white-space: nowrap; }
.sidebar-light .logo { background: #f5f7fa; color: var(--el-text-color-primary); }
:deep(.el-menu) { border-right: none; background: #304156; }
.sidebar-light :deep(.el-menu) { background: #fff; }
.sidebar-menu { flex: 1; overflow-y: auto; overflow-x: hidden; }
.sidebar-menu::-webkit-scrollbar { width: 4px; }
.sidebar-menu::-webkit-scrollbar-thumb { background: #4a6070; border-radius: 2px; }
.sidebar-menu::-webkit-scrollbar-track { background: transparent; }
:deep(.el-menu .el-menu-item), :deep(.el-menu .el-sub-menu__title) { color: #bfcbd9; }
:deep(.el-menu .el-menu-item:hover), :deep(.el-menu .el-sub-menu__title:hover) { background: #263445; color: #fff; }
:deep(.el-menu .el-menu-item.is-active) { color: #409eff; background: #1f2d3d; }
:deep(.el-sub-menu .el-menu-item) { background: #1f2d3d; }
:deep(.el-sub-menu .el-menu-item:hover) { background: #001528; }
.sidebar-light :deep(.el-menu .el-menu-item),
.sidebar-light :deep(.el-menu .el-sub-menu__title) { color: var(--el-text-color-primary); }
.sidebar-light :deep(.el-menu .el-menu-item:hover),
.sidebar-light :deep(.el-menu .el-sub-menu__title:hover) { background: #f5f7fa; color: var(--el-color-primary); }
.sidebar-light :deep(.el-menu .el-menu-item.is-active) { color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.sidebar-light :deep(.el-sub-menu .el-menu-item) { background: #fafafa; }
.sidebar-light :deep(.el-sub-menu .el-menu-item:hover) { background: #f0f2f5; }
.main-container { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.header { display: flex; align-items: center; justify-content: space-between; height: 60px; padding: 0 20px; background: #fff; border-bottom: 1px solid #e4e7ed; z-index: 100; }
.header-fixed { position: sticky; top: 0; }
.header-left { display: flex; align-items: center; }
.collapse-btn { font-size: 20px; margin-right: 20px; cursor: pointer; color: var(--el-text-color-regular); }
.header-right { display: flex; align-items: center; }
.header-right .user-info { display: flex; align-items: center; cursor: pointer; color: var(--el-text-color-regular); font-size: 14px; }
.header-right .el-icon { margin-right: 8px; }
.main-content { flex: 1; overflow: auto; background: #f0f2f5; }
.main-content-fixed { overflow: auto; }

.fade-slide-enter-active,
.fade-slide-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateY(8px); }
.fade-slide-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
