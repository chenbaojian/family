<template>
  <div class="member-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>成员列表</span>
          <el-button type="primary" size="small" @click="$router.push('/members/add')">
            <el-icon><Plus /></el-icon>
            <span class="btn-text">添加成员</span>
          </el-button>
        </div>
      </template>
      
      <!-- 筛选条件 -->
      <div class="filter-bar">
        <el-select v-model="filters.generation" placeholder="代数" clearable style="width: 100px" @change="handleFilterChange">
          <el-option v-for="i in maxGeneration" :key="i" :label="`第${i}代`" :value="i" />
        </el-select>
        <el-select v-model="filters.gender" placeholder="性别" clearable style="width: 80px" @change="handleFilterChange">
          <el-option label="男" value="male" />
          <el-option label="女" value="female" />
        </el-select>
        <el-select v-model="filters.isAlive" placeholder="状态" clearable style="width: 80px" @change="handleFilterChange">
          <el-option label="在世" value="true" />
          <el-option label="已故" value="false" />
        </el-select>
        <el-input v-model="filters.search" placeholder="搜索姓名" clearable style="width: 140px" @clear="handleFilterChange" @keyup.enter="handleFilterChange" />
      </div>
      
      <!-- PC端：表格 -->
      <el-table :data="memberStore.members" v-loading="loading" stripe class="pc-table" style="width: 100%">
        <el-table-column prop="name" label="姓名" width="110" />
        <el-table-column prop="gender" label="性别" width="80">
          <template #default="{ row }">
            {{ row.gender === 'male' ? '男' : '女' }}
          </template>
        </el-table-column>
        <el-table-column prop="generation" label="代数" width="90">
          <template #default="{ row }">
            第{{ row.generation }}代
          </template>
        </el-table-column>
        <el-table-column prop="birth_date" label="出生日期" width="130">
          <template #default="{ row }">
            {{ formatDate(row.birth_date) }}
          </template>
        </el-table-column>
        <el-table-column prop="residence" label="居住地" min-width="120" show-overflow-tooltip />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.death_date ? 'info' : 'success'" size="small">
              {{ row.death_date ? '已故' : '在世' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" link @click="viewDetail(row)">查看</el-button>
            <el-button size="small" link type="primary" @click="editMember(row)" v-if="authStore.isEditor">编辑</el-button>
            <el-button size="small" link type="danger" @click="deleteMember(row)" v-if="authStore.isAdmin">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 手机端：卡片列表 -->
      <div class="mobile-list" v-if="isMobile">
        <div v-if="loading" style="text-align:center;padding:30px;">
          <el-icon class="is-loading" :size="24"><Loading /></el-icon>
        </div>
        <div v-else-if="memberStore.members.length === 0" style="text-align:center;padding:30px;color:#909399;">
          暂无数据
        </div>
        <div v-else class="member-card" v-for="member in memberStore.members" :key="member.id" @click="viewDetail(member)">
          <div class="card-top">
            <div class="card-name">
              <span class="name">{{ member.name }}</span>
              <el-tag :type="member.death_date ? 'info' : 'success'" size="small">
                {{ member.death_date ? '已故' : '在世' }}
              </el-tag>
            </div>
            <span class="card-gen">第{{ member.generation }}代</span>
          </div>
          <div class="card-info">
            <span>{{ member.gender === 'male' ? '男' : '女' }}</span>
            <span>{{ member.birth_date }}</span>
            <span v-if="member.residence">{{ member.residence }}</span>
          </div>
          <div class="card-actions" v-if="authStore.isEditor || authStore.isAdmin">
            <el-button size="small" type="primary" @click.stop="editMember(member)" v-if="authStore.isEditor">编辑</el-button>
            <el-button size="small" type="danger" @click.stop="deleteMember(member)" v-if="authStore.isAdmin">删除</el-button>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrap" v-if="memberStore.pagination.total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="currentPageSize"
          :page-sizes="[10, 20, 50]"
          :total="memberStore.pagination.total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { useAuthStore } from '@/store/auth'
import { useMemberStore } from '@/store/member'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const memberStore = useMemberStore()

const loading = ref(false)
const isMobile = ref(false)

function checkMobile() {
  isMobile.value = window.innerWidth <= 768
}

checkMobile()
window.addEventListener('resize', checkMobile)
onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

const filters = reactive({
  generation: null,
  gender: null,
  isAlive: null,
  search: ''
})

const currentPage = ref(1)
const currentPageSize = ref(10)

const maxGeneration = 20

onMounted(async () => {
  if (route.query.search) {
    filters.search = route.query.search
  }
  await loadMembers()
})

async function loadMembers() {
  loading.value = true
  const params = {
    page: currentPage.value,
    pageSize: currentPageSize.value
  }
  if (filters.generation) params.generation = filters.generation
  if (filters.gender) params.gender = filters.gender
  if (filters.isAlive) params.isAlive = filters.isAlive
  if (filters.search) params.search = filters.search

  await memberStore.fetchMembers(params)
  loading.value = false
}

function handleFilterChange() {
  currentPage.value = 1
  loadMembers()
}

function handlePageChange(page) {
  currentPage.value = page
  loadMembers()
}

function handleSizeChange(size) {
  currentPageSize.value = size
  currentPage.value = 1
  loadMembers()
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return dateStr.split('T')[0].split(' ')[0].substring(0, 10)
}

function viewDetail(member) {
  router.push(`/members/${member.id}`)
}

function editMember(member) {
  router.push(`/members/${member.id}/edit`)
}

async function deleteMember(member) {
  try {
    await ElMessageBox.confirm(`确定要删除成员"${member.name}"吗？`, '删除确认', {
      type: 'warning'
    })
    const res = await memberStore.removeMember(member.id)
    if (res.success) {
      ElMessage.success('删除成功')
      await loadMembers()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (e) {
    // 用户取消
  }
}
</script>

<style scoped>
.member-list {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-text {
  margin-left: 4px;
}

.filter-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

/* PC端表格默认显示，手机端隐藏 */
.pc-table {
  display: table;
}

.mobile-list {
  display: none;
}

/* 手机端卡片样式 */
@media screen and (max-width: 768px) {
  .pc-table {
    display: none;
  }

  .mobile-list {
    display: block;
  }

  .filter-bar {
    gap: 6px;
  }

  .filter-bar .el-select,
  .filter-bar .el-input {
    width: auto !important;
    flex: 1;
    min-width: 70px;
  }

  .btn-text {
    display: none;
  }

  .member-card {
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 10px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .member-card:hover {
    border-color: #409eff;
  }

  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .card-name {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .card-name .name {
    font-weight: bold;
    color: #303133;
    font-size: 15px;
  }

  .card-gen {
    color: #909399;
    font-size: 13px;
  }

  .card-info {
    display: flex;
    gap: 12px;
    color: #606266;
    font-size: 13px;
  }

  .card-actions {
    display: flex;
    gap: 8px;
    margin-top: 10px;
  }

  .pagination-wrap :deep(.el-pagination) {
    flex-wrap: wrap;
    justify-content: center;
  }

  .pagination-wrap :deep(.el-pagination__sizes) {
    display: none;
  }
}
</style>
