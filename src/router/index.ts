/**
 * 路由配置
 */
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores'
import type { AdminPermissionCode } from '@/types'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('@/views/layout/AdminLayout.vue'),
    redirect: '/statistics',
    meta: { requiresAuth: true },
    children: [
      {
        path: '/statistics',
        name: 'Statistics',
        component: () => import('@/views/statistics/index.vue'),
        meta: { title: '数据看板', icon: 'DataAnalysis' },
      },
      {
        path: '/user',
        name: 'User',
        redirect: '/user/list',
        meta: { title: '用户管理', icon: 'User' },
        children: [
          {
            path: '/user/list',
            name: 'UserList',
            component: () => import('@/views/user/list.vue'),
            meta: { title: '用户列表' },
          },
          {
            path: '/user/admin-list',
            name: 'AdminList',
            component: () => import('@/views/user/admin-list.vue'),
            meta: { title: '校级管理员列表', requireSuperAdmin: true },
          },
          {
            path: '/user/batch-register',
            name: 'UserBatchRegister',
            component: () => import('@/views/user/batch-register.vue'),
            meta: { title: '批量注册用户' },
          },
          {
            path: '/user/school-change',
            name: 'UserSchoolChange',
            component: () => import('@/views/user/school-change.vue'),
            meta: { title: '学校/专业修改申请' },
          },
          {
            path: '/user/refund-list',
            name: 'UserRefundList',
            component: () => import('@/views/user/refund-list.vue'),
            meta: { title: '用户退款记录' },
          },
          {
            path: '/user/department-major',
            name: 'UserDepartmentMajor',
            component: () => import('@/views/user/department-major.vue'),
            meta: { title: '院系专业管理' },
          },
        ],
      },
      {
        path: '/shop',
        name: 'Shop',
        redirect: '/shop/list',
        meta: { title: '店铺管理', icon: 'Shop' },
        children: [
          {
            path: '/shop/list',
            name: 'ShopList',
            component: () => import('@/views/shop/list.vue'),
            meta: { title: '店铺列表' },
          },
        ],
      },
      {
        path: '/review',
        name: 'Review',
        redirect: '/review/list',
        meta: { title: '评价管理', icon: 'Edit' },
        children: [
          {
            path: '/review/list',
            name: 'ReviewList',
            component: () => import('@/views/review/list.vue'),
            meta: { title: '评价列表' },
          },
          {
            path: '/review/audit',
            name: 'ReviewAudit',
            component: () => import('@/views/review/audit.vue'),
            meta: { title: '评价审核', permissionCodes: ['REVIEW_AUDIT'] },
          },
          {
            path: '/review/add-teacher',
            name: 'ReviewAddTeacher',
            component: () => import('@/views/review/add-teacher.vue'),
            meta: { title: '新增教师', requireCampusAdmin: true },
          },
          {
            path: '/review/course-apply',
            name: 'ReviewCourseApply',
            component: () => import('@/views/review/course-apply.vue'),
            meta: { title: '课程申请审核', requireCampusAdmin: true },
          },
        ],
      },
      {
        path: '/comment',
        name: 'Comment',
        redirect: '/comment/audit',
        meta: { title: '评论管理', icon: 'ChatLineRound' },
        children: [
          {
            path: '/comment/audit',
            name: 'CommentAudit',
            component: () => import('@/views/comment/audit.vue'),
            meta: { title: '评论列表', permissionCodes: ['COMMENT_AUDIT'] },
          },
          {
            path: '/comment/batch-generate',
            name: 'CommentBatchGenerate',
            component: () => import('@/views/comment/batch-generate.vue'),
            meta: { title: '批量生成评论' },
          },
        ],
      },
      {
        path: '/post',
        name: 'Post',
        redirect: '/post/list',
        meta: { title: '帖子管理', icon: 'Document' },
        children: [
          {
            path: '/post/list',
            name: 'PostList',
            component: () => import('@/views/post/list.vue'),
            meta: { title: '帖子列表' },
          },
          {
            path: '/post/batch-generate',
            name: 'PostBatchGenerate',
            component: () => import('@/views/post/batch-generate.vue'),
            meta: { title: '帖子批量生成' },
          },
        ],
      },
      {
        path: '/dispute',
        name: 'Dispute',
        redirect: '/dispute/list',
        meta: { title: '纠纷处理', icon: 'ScaleToOriginal' },
        children: [
          {
            path: '/dispute/list',
            name: 'DisputeList',
            component: () => import('@/views/dispute/list.vue'),
            meta: { title: '纠纷列表' },
          },
          {
            path: '/dispute/chat',
            name: 'DisputeChat',
            component: () => import('@/views/dispute/chat.vue'),
            meta: { title: '纠纷聊天室' },
          },
        ],
      },
      {
        path: '/governance',
        name: 'Governance',
        redirect: '/governance/reports',
        meta: { title: '举报治理', icon: 'Warning' },
        children: [
          {
            path: '/governance/reports',
            name: 'GovernanceReports',
            component: () => import('@/views/governance/reports.vue'),
            meta: { title: '举报中心', permissionCodes: ['REPORT_AUDIT'] },
          },
          {
            path: '/governance/penalties',
            name: 'GovernancePenalties',
            component: () => import('@/views/governance/penalties.vue'),
            meta: { title: '处罚记录', permissionCodes: ['REPORT_AUDIT'] },
          },
        ],
      },
      {
        path: '/topic',
        name: 'Topic',
        redirect: '/topic/campaigns',
        meta: { title: '校园专题', icon: 'ChatDotRound' },
        children: [
          {
            path: '/topic/campaigns',
            name: 'TopicCampaigns',
            component: () => import('@/views/topic/campaigns.vue'),
            meta: { title: '专题管理', permissionCodes: ['TOPIC_CAMPAIGN_MANAGE'] },
          },
          {
            path: '/topic/posts',
            name: 'TopicPosts',
            component: () => import('@/views/topic/posts.vue'),
            meta: { title: '帖子运营', permissionCodes: ['TOPIC_POST_MANAGE'] },
          },
        ],
      },
      {
        path: '/activity',
        name: 'Activity',
        redirect: '/activity/pre-sale',
        meta: { title: '限时活动', icon: 'Opportunity' },
        children: [
          {
            path: '/activity/pre-sale',
            name: 'ActivityPreSale',
            component: () => import('@/views/activity/PreSale.vue'),
            meta: { title: '图书预售' },
          },
          {
            path: '/activity/invite-reward',
            name: 'ActivityInviteReward',
            component: () => import('@/views/activity/InviteReward.vue'),
            meta: { title: '邀请有奖', requireSuperAdmin: true },
          },
        ],
      },
      {
        path: '/ai',
        name: 'Ai',
        redirect: '/ai/index',
        meta: { title: 'AI助手', icon: 'MagicStick' },
        children: [
          {
            path: '/ai/index',
            name: 'AiIndex',
            component: () => import('@/views/ai/index.vue'),
            meta: { title: 'AI助手' },
          },
        ],
      },
      {
        path: '/system',
        name: 'System',
        redirect: '/system/settings',
        meta: { title: '系统配置', icon: 'Setting' },
        children: [
          {
            path: '/system/settings',
            name: 'SystemSettings',
            component: () => import('@/views/system/settings.vue'),
            meta: { title: '系统配置' },
          },
        ],
      },
      {
        path: '/merchant',
        name: 'Merchant',
        redirect: '/merchant/bindings',
        meta: { title: '商家管理', icon: 'Shop' },
        children: [
          {
            path: '/merchant/bindings',
            name: 'MerchantBindings',
            component: () => import('@/views/merchant/bindings.vue'),
            meta: { title: '商家绑定审核', permissionCodes: ['SHOP_BINDING_AUDIT_FINAL'] },
          },
        ],
      },
      {
        path: '/badge',
        name: 'Badge',
        redirect: '/badge/definitions',
        meta: { title: '徽章管理', icon: 'Medal' },
        children: [
          {
            path: '/badge/definitions',
            name: 'BadgeDefinitions',
            component: () => import('@/views/badge/definitions.vue'),
            meta: { title: '徽章定义', permissionCodes: ['BADGE_MANAGE'] },
          },
          {
            path: '/badge/grant',
            name: 'BadgeGrant',
            component: () => import('@/views/badge/grant.vue'),
            meta: { title: '发放管理', permissionCodes: ['BADGE_MANAGE'] },
          },
        ],
      },
      {
        path: '/advertisement',
        name: 'Advertisement',
        redirect: '/advertisement/list',
        meta: { title: '广告管理', icon: 'Promotion' },
        children: [
          {
            path: '/advertisement/list',
            name: 'AdvertisementList',
            component: () => import('@/views/advertisement/index.vue'),
            meta: { title: '广告管理', permissionCodes: ['AD_PUBLISH_AUDIT'] },
          },
        ],
      },
      {
        path: '/idle',
        name: 'Idle',
        redirect: '/idle/product-review',
        meta: { title: '闲置管理', icon: 'Goods' },
        children: [
          {
            path: '/idle/product-review',
            name: 'IdleProductReview',
            component: () => import('@/views/idle/product-review.vue'),
            meta: { title: '商品审核' },
          },
          {
            path: '/idle/order-refund',
            name: 'IdleOrderRefund',
            component: () => import('@/views/idle/order-refund.vue'),
            meta: { title: '退款处理' },
          },
        ],
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫
router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore()

  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - CampusX 管理后台`
  }

  // 已登录用户访问登录页，跳转到首页
  if (to.name === 'Login' && userStore.isLoggedIn()) {
    next({ name: 'Statistics' })
    return
  }

  // 检查是否需要登录
  if (to.meta.requiresAuth !== false && !userStore.isLoggedIn()) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  if (userStore.isLoggedIn() && userStore.permissionCodes.length === 0) {
    await userStore.fetchPermissions()
  }

  const requiredPermissionCodes = (to.meta.permissionCodes as AdminPermissionCode[] | undefined) || []
  if (requiredPermissionCodes.length > 0 && !userStore.hasAnyPermission(requiredPermissionCodes)) {
    next({ name: 'Statistics' })
    return
  }

  if (to.meta.requireSuperAdmin && !userStore.isSuperAdmin) {
    next({ name: 'Statistics' })
    return
  }

  if (to.meta.requireCampusAdmin && userStore.isSuperAdmin) {
    next({ name: 'Statistics' })
    return
  }

  next()
})

export default router
