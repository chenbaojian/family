<template>
  <div class="member-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>成员列表</span>
          <el-button type="primary" @click="$router.push('/members/add')">
            <el-icon><Plus /></el-icon>添加成员
          </el-button>
        </div>
      </template>
      
      <!-- 筛选条件 -->
      <div class="filter-bar">
        <el-select v-model="filters.generation" placeholder="选择代数" clearable style="width: 120px">
          <el-option v-for="i in maxGeneration" :key="i" :label="`第${i}代`" :value="i" />
        </el-select>
        <el-select v-model="filters.gender" placeholder="性别" clearable style="width: 100px">
          <el-option label="男" value="male" />
          <el-option label="女" value="female" />
        </el-select>
        <el-select v-model="filters.isAlive" placeholder="状态" clearable style="width: 100px">
          <el-option label="在世" value="true" />
          <el-option label="已故" value="false" />
        </el-select>
        <el-input v-model="filters.search" placeholder="搜索姓名" clearable style="width: 200px" />
      </div>
      
      <!-- 成员表格 -->
      <el-table :data="filteredMembers" v-loading="loading" stripe>
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="gender" label="性别" width="80">
          <template #default="{ row }">
            {{ row.gender === 'male' ? '男' : '女' }}
          </template>
        </el-table-column>
        <el-table-column prop="generation" label="代数" width="80">
          <template #default="{ row }">
            第{{ row.generation }}代
          </template>
        </el-table-column>
        <el-table-column prop="birth_date" label="出生日期" width="120" />
        <el-table-column prop="residence" label="居住地" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.death_date ? 'info' : 'success'" size="small">
              {{ row.death_date ? '已故' : '在世' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row)">查看</el-button>
            <el-button size="small" type="primary" @click="editMember(row)" v-if="authStore.isEditor">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteMember(row)" v-if="authStore.isAdmin">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/store/auth'
import { useMemberStore } from '@/store/member'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const memberStore = useMemberStore()

const loading = ref(false)

const filters = reactive({
  generation: null,
  gender: null,
  isAlive: null,
  search: ''
})

const maxGeneration = computed(() => {
  const gens = memberStore.members.map(m => m.generation)
  return Math.max(...gens, 0)
})

const filteredMembers = computed(() => {
  return memberStore.members.filter(m => {
    if (filters.generation && m.generation !== filters.generation) return false
    if (filters.gender && m.gender !== filters.gender) return false
    if (filters.isAlive === 'true' && m.death_date) return false
    if (filters.isAlive === 'false' && !m.death_date) return false
    if (filters.search && !m.name.includes(filters.search)) return false
    return true
  })
})

onMounted(async () => {
  // 从路由参数获取搜索关键词
  if (route.query.search) {
    filters.search = route.query.search
  }
  await loadMembers()
})

async function loadMembers() {
  loading.value = true
  await memberStore.fetchMembers()
  loading.value = false
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

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}
</style>