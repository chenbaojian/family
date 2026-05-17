<template>
  <div class="family-tree-page">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>家族树</span>
          <el-button-group>
            <el-button :icon="Refresh" @click="loadTree">刷新</el-button>
            <el-button :icon="ZoomIn" @click="zoomIn">放大</el-button>
            <el-button :icon="ZoomOut" @click="zoomOut">缩小</el-button>
            <el-button :icon="FullScreen" @click="resetZoom">重置</el-button>
          </el-button-group>
        </div>
      </template>

      <div class="tree-scroll-container" ref="scrollContainer">
        <div 
          class="tree-content" 
          ref="treeContent"
          :style="{ 
            transform: `scale(${scale})`,
            transformOrigin: 'center top'
          }"
        >
          <div v-if="familyTree.length === 0 && !loading" class="empty-tree">
            <el-empty description="暂无家族成员数据">
              <el-button type="primary" @click="$router.push('/members/add')">添加始祖</el-button>
            </el-empty>
          </div>

          <div v-else class="tree-root">
            <TreeNode
              v-for="node in familyTree"
              :key="node.id"
              :node="node"
              :level="0"
              @select="handleSelect"
            />
          </div>
        </div>
      </div>
    </el-card>

    <!-- 成员详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      :title="selectedMember?.name"
      direction="rtl"
      :size="isMobile ? '100%' : '400px'"
    >
      <div v-if="selectedMember" class="member-detail">
        <div class="avatar-section">
          <el-avatar :size="80" :src="photoUrl" icon="UserFilled" />
        </div>

        <el-descriptions :column="1" border>
          <el-descriptions-item label="姓名">{{ selectedMember.name }}</el-descriptions-item>
          <el-descriptions-item label="性别">{{ selectedMember.gender === 'male' ? '男' : '女' }}</el-descriptions-item>
          <el-descriptions-item label="代数">第{{ selectedMember.generation }}代</el-descriptions-item>
          <el-descriptions-item label="出生日期">{{ selectedMember.birth_date }}</el-descriptions-item>
          <el-descriptions-item label="离世日期" v-if="selectedMember.death_date">
            {{ selectedMember.death_date }}
          </el-descriptions-item>
          <el-descriptions-item label="出生地点" v-if="selectedMember.birth_place">
            {{ selectedMember.birth_place }}
          </el-descriptions-item>
          <el-descriptions-item label="居住地" v-if="selectedMember.residence">
            {{ selectedMember.residence }}
          </el-descriptions-item>
          <el-descriptions-item label="配偶" v-if="selectedMember.spouse_name">
            {{ selectedMember.spouse_name }}
          </el-descriptions-item>
          <el-descriptions-item label="职业" v-if="selectedMember.occupation">
            {{ selectedMember.occupation }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="drawer-actions">
          <el-button type="primary" @click="viewDetail">查看详情</el-button>
          <el-button @click="drawerVisible = false">关闭</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Refresh, ZoomIn, ZoomOut, FullScreen } from '@element-plus/icons-vue'
import { useMemberStore } from '@/store/member'
import { getServerBaseURL } from '@/utils/request'
import TreeNode from '@/components/TreeNode.vue'

const router = useRouter()
const memberStore = useMemberStore()

const isMobile = ref(false)
function checkMobile() {
  isMobile.value = window.innerWidth <= 768
}
checkMobile()
window.addEventListener('resize', checkMobile)
onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

const loading = ref(false)
const familyTree = ref([])
const scale = ref(isMobile ? 0.5 : 1)
const drawerVisible = ref(false)
const selectedMember = ref(null)
const scrollContainer = ref(null)
const treeContent = ref(null)

const photoUrl = computed(() => {
  if (selectedMember.value?.photo_url) {
    return `${getServerBaseURL()}${selectedMember.value.photo_url}`
  }
  return undefined
})

onMounted(() => {
  loadTree()
})

async function loadTree() {
  loading.value = true
  try {
    const res = await memberStore.fetchFamilyTree()
    if (res?.success) {
      familyTree.value = res.data
      // 加载完成后调整滚动位置到中心
      nextTick(() => {
        centerTree()
      })
    }
  } finally {
    loading.value = false
  }
}

function centerTree() {
  if (scrollContainer.value && treeContent.value) {
    const containerWidth = scrollContainer.value.clientWidth
    const contentWidth = treeContent.value.scrollWidth * scale.value
    const scrollLeft = (contentWidth - containerWidth) / 2
    scrollContainer.value.scrollLeft = Math.max(0, scrollLeft)
  }
}

function zoomIn() {
  if (scale.value < 2) {
    scale.value = Math.min(2, scale.value + 0.1)
  }
}

function zoomOut() {
  if (scale.value > 0.3) {
    scale.value = Math.max(0.3, scale.value - 0.1)
  }
}

function resetZoom() {
  scale.value = 1
  nextTick(() => {
    centerTree()
  })
}

function handleSelect(member) {
  selectedMember.value = member
  drawerVisible.value = true
}

function viewDetail() {
  if (selectedMember.value) {
    router.push(`/members/${selectedMember.value.id}`)
  }
}
</script>

<style scoped>
.family-tree-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tree-scroll-container {
  overflow: auto;
  min-height: 500px;
  max-height: calc(100vh - 200px);
  position: relative;
}

.tree-content {
  display: inline-block;
  min-width: 100%;
  padding: 40px 80px;
  transition: transform 0.3s ease;
}

.empty-tree {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.tree-root {
  display: flex;
  justify-content: center;
  gap: 60px;
}

.member-detail {
  padding: 20px 0;
}

.avatar-section {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.drawer-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

/* 手机端响应式 */
@media screen and (max-width: 768px) {
  .card-header {
    flex-wrap: wrap;
    gap: 8px;
  }

  .card-header span {
    font-size: 16px;
  }

  .tree-scroll-container {
    min-height: 300px;
    max-height: calc(100vh - 160px);
  }

  .tree-content {
    padding: 20px 30px;
  }

  .tree-root {
    gap: 30px;
  }
}
</style>