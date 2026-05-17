import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { title: '注册' }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/views/Home.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/family-tree'
      },
      {
        path: 'family-intro',
        name: 'FamilyIntro',
        component: () => import('@/views/FamilyIntroPage.vue'),
        meta: { title: '家族简介' }
      },
      {
        path: 'family-tree',
        name: 'FamilyTree',
        component: () => import('@/views/FamilyTree.vue'),
        meta: { title: '家族树' }
      },
      {
        path: 'members',
        name: 'MemberList',
        component: () => import('@/views/MemberList.vue'),
        meta: { title: '成员管理' }
      },
      {
        path: 'members/add',
        name: 'MemberAdd',
        component: () => import('@/views/MemberEdit.vue'),
        meta: { title: '添加成员' }
      },
      {
        path: 'members/:id',
        name: 'MemberDetail',
        component: () => import('@/views/MemberDetail.vue'),
        meta: { title: '成员详情' }
      },
      {
        path: 'members/:id/edit',
        name: 'MemberEdit',
        component: () => import('@/views/MemberEdit.vue'),
        meta: { title: '编辑成员' }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: { title: '个人中心' }
      },
      {
        path: 'admin/users',
        name: 'UserManage',
        component: () => import('@/views/UserManage.vue'),
        meta: { title: '用户管理', requiresAdmin: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 陈氏家族族谱` : '陈氏家族族谱'
  
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  
  // 需要认证的页面
  if (to.meta.requiresAuth && !token) {
    next('/login')
    return
  }
  
  // 需要管理员权限
  if (to.meta.requiresAdmin && user.role !== 'admin') {
    next('/')
    return
  }
  
  // 已登录用户访问登录/注册页
  if ((to.path === '/login' || to.path === '/register') && token) {
    next('/')
    return
  }
  
  next()
})

export default router
