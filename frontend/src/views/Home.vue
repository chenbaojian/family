<template>
  <el-container class="home-container">
    <!-- 顶部导航 -->
    <el-header>
      <div class="header-left">
        <h1>陈氏家族族谱</h1>
      </div>
      <div class="header-center">
        <el-input v-model="searchKeyword" placeholder="搜索成员..." prefix-icon="Search" clearable @keyup.enter="handleSearch" />
      </div>
      <div class="header-right">
        <el-dropdown @command="handleCommand">
          <span class="user-dropdown">
            <el-avatar :size="32" icon="UserFilled" />
            <span class="username">{{ authStore.user?.username }}</span>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人中心</el-dropdown-item>
              <el-dropdown-item command="users" v-if="authStore.isAdmin">用户管理</el-dropdown-item>
              <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <!-- 主体内容 -->
    <el-container>
      <!-- 左侧菜单 -->
      <el-aside :width="isMobile ? '0px' : '200px'" :class="{ 'mobile-hidden': isMobile }">
        <el-menu :default-active="activeMenu" router v-if="!isMobile">
          <el-menu-item index="/family-intro">
            <el-icon><Document /></el-icon>
            <span>家族简介</span>
          </el-menu-item>
          <el-menu-item index="/family-tree">
            <el-icon><Share /></el-icon>
            <span>家族树</span>
          </el-menu-item>
          <el-menu-item index="/members">
            <el-icon><User /></el-icon>
            <span>成员管理</span>
          </el-menu-item>
        </el-menu>

        <!-- 统计信息 -->
        <div class="stats-panel" v-if="statistics && !isMobile">
          <h4>统计概览</h4>
          <div class="stat-item">
            <span class="label">总人数</span>
            <span class="value">{{ statistics.total }}</span>
          </div>
          <div class="stat-item">
            <span class="label">在世</span>
            <span class="value">{{ statistics.alive }}</span>
          </div>
          <div class="stat-item">
            <span class="label">已故</span>
            <span class="value">{{ statistics.deceased }}</span>
          </div>
          <div class="stat-item">
            <span class="label">代数</span>
            <span class="value">{{ statistics.byGeneration?.length || 0 }}</span>
          </div>
        </div>
      </el-aside>

      <!-- 主内容区 - 子路由内容将在此渲染 -->
      <el-main>
        <!-- 手机端底部导航 -->
        <div class="mobile-nav" v-if="isMobile">
          <el-menu :default-active="activeMenu" router mode="horizontal">
            <el-menu-item index="/family-intro">
              <el-icon><Document /></el-icon>
            </el-menu-item>
            <el-menu-item index="/family-tree">
              <el-icon><Share /></el-icon>
            </el-menu-item>
            <el-menu-item index="/members">
              <el-icon><User /></el-icon>
            </el-menu-item>
          </el-menu>
        </div>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/store/auth'
import { useMemberStore } from '@/store/member'
import { searchMembers } from '@/api/tree'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const memberStore = useMemberStore()

const searchKeyword = ref('')
const statistics = ref(null)
const isMobile = ref(false)

const activeMenu = computed(() => route.path)

// 检测屏幕宽度
function checkMobile() {
  isMobile.value = window.innerWidth <= 768
}

onMounted(async () => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  await loadStatistics()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

async function loadStatistics() {
  const res = await memberStore.fetchStatistics()
  if (res?.success) {
    statistics.value = res.data
  }
}

async function handleSearch() {
  if (!searchKeyword.value.trim()) return
  const res = await searchMembers(searchKeyword.value)
  if (res.success && res.data.length > 0) {
    if (res.data.length === 1) {
      router.push(`/members/${res.data[0].id}`)
    } else {
      router.push({ path: '/members', query: { search: searchKeyword.value } })
    }
  } else {
    ElMessage.info('未找到匹配的成员')
  }
}

function handleCommand(command) {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'users':
      router.push('/admin/users')
      break
    case 'logout':
      authStore.logout()
      router.push('/login')
      ElMessage.success('已退出登录')
      break
  }
}
</script>

<style scoped>
.home-container {
  height: 100vh;
}

.el-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0 20px;
  height: 60px;
}

.header-left h1 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 0 20px;
}

.header-center .el-input {
  max-width: 300px;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.username {
  color: #303133;
}

.el-aside {
  background: #fff;
  border-right: 1px solid #e4e7ed;
  transition: width 0.3s;
}

.mobile-hidden {
  overflow: hidden;
}

.stats-panel {
  padding: 20px;
  border-top: 1px solid #e4e7ed;
}

.stats-panel h4 {
  margin: 0 0 15px;
  color: #303133;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.stat-item .label {
  color: #909399;
}

.stat-item .value {
  color: #303133;
  font-weight: bold;
}

.el-main {
  background: #f5f7fa;
  padding: 20px;
  overflow: auto;
}

/* 手机端底部导航 */
.mobile-nav {
  margin-bottom: 15px;
}

.mobile-nav .el-menu {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.mobile-nav .el-menu-item {
  flex: 1;
  justify-content: center;
}

/* 手机端响应式 */
@media screen and (max-width: 768px) {
  .el-header {
    padding: 0 12px;
    height: 50px !important;
  }

  .header-left h1 {
    font-size: 15px;
    white-space: nowrap;
  }

  .header-center {
    padding: 0 8px;
  }

  .header-center .el-input {
    max-width: 140px;
  }

  .username {
    display: none;
  }

  .el-main {
    padding: 10px;
  }

  .mobile-nav .el-menu-item {
    font-size: 13px;
    padding: 0 8px;
  }
}
</style>