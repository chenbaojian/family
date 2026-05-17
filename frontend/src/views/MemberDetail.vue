<template>
  <div class="member-detail">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <el-button @click="$router.back()">
            <el-icon><ArrowLeft /></el-icon>返回
          </el-button>
          <div class="header-actions">
            <el-button type="primary" @click="editMember" v-if="authStore.isEditor">
              <el-icon><Edit /></el-icon>编辑
            </el-button>
            <el-button type="danger" @click="deleteMember" v-if="authStore.isAdmin">
              <el-icon><Delete /></el-icon>删除
            </el-button>
          </div>
        </div>
      </template>

      <div class="detail-content" v-if="member">
        <!-- 顶部区域：基本信息 + 右上角头像 -->
        <div class="top-section">
          <!-- 左侧基本信息 -->
          <div class="info-main">
            <div class="name-header">
              <el-avatar :size="40" icon="UserFilled" class="name-avatar" />
              <h2>{{ member.name }}</h2>
            </div>
            <p class="generation-tag">第 {{ member.generation }} 代</p>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="性别">{{ member.gender === 'male' ? '男' : '女' }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="member.death_date ? 'info' : 'success'">{{ member.death_date ? '已故' : '在世' }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="出生日期">{{ member.birth_date }}</el-descriptions-item>
              <el-descriptions-item label="离世日期">{{ member.death_date || '-' }}</el-descriptions-item>
              <el-descriptions-item label="出生地点">{{ member.birth_place || '-' }}</el-descriptions-item>
              <el-descriptions-item label="居住地点">{{ member.residence || '-' }}</el-descriptions-item>
              <el-descriptions-item label="配偶">{{ member.spouse_name || '-' }}</el-descriptions-item>
              <el-descriptions-item label="学历">{{ member.education || '-' }}</el-descriptions-item>
              <el-descriptions-item label="职业">{{ member.occupation || '-' }}</el-descriptions-item>
              <el-descriptions-item label="手机号">{{ member.phone || '-' }}</el-descriptions-item>
              <el-descriptions-item label="邮箱">{{ member.email || '-' }}</el-descriptions-item>
            </el-descriptions>
          </div>
          
          <!-- 右上角头像区域 - 矩形卡片形式 -->
          <div class="photo-section">
            <div class="photo-card" @click="handlePhotoClick" v-if="authStore.isEditor">
              <div class="photo-image">
                <img v-if="photoUrl" :src="photoUrl" alt="个人照片" />
                <el-icon v-else class="no-photo-icon"><UserFilled /></el-icon>
              </div>
              <div class="photo-overlay">
                <el-icon><Camera /></el-icon>
                <span>点击上传照片</span>
              </div>
            </div>
            <div class="photo-card" v-else>
              <div class="photo-image">
                <img v-if="photoUrl" :src="photoUrl" alt="个人照片" />
                <el-icon v-else class="no-photo-icon"><UserFilled /></el-icon>
              </div>
            </div>
            <!-- 隐藏的文件上传 -->
            <input 
              type="file" 
              ref="fileInput" 
              accept="image/*" 
              style="display: none" 
              @change="handleFileChange"
            />
          </div>
        </div>

        <!-- 详细信息 -->
        <div class="extra-info">
          <el-divider content-position="left">社会贡献</el-divider>
          <p>{{ member.contribution || '暂无记录' }}</p>

          <el-divider content-position="left">个人简介</el-divider>
          <p>{{ member.biography || '暂无记录' }}</p>
        </div>

        <!-- 亲属关系 -->
        <div class="relatives-section">
          <el-divider content-position="left">亲属关系</el-divider>
          <div class="relatives-grid" v-if="relatives">
            <div class="relative-item" v-if="relatives.father">
              <span class="label">父亲</span>
              <el-link @click="goToMember(relatives.father.id)">{{ relatives.father.name }}</el-link>
            </div>
            <div class="relative-item" v-if="relatives.mother">
              <span class="label">母亲</span>
              <el-link @click="goToMember(relatives.mother.id)">{{ relatives.mother.name }}</el-link>
            </div>
            <div class="relative-item" v-if="relatives.spouse">
              <span class="label">配偶</span>
              <el-link @click="goToMember(relatives.spouse.id)">{{ relatives.spouse.name }}</el-link>
            </div>
            <div class="relative-item" v-if="relatives.children.length > 0">
              <span class="label">子女</span>
              <div class="children-list">
                <el-link v-for="child in relatives.children" :key="child.id" @click="goToMember(child.id)">
                  {{ child.name }}
                </el-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/store/auth'
import { useMemberStore } from '@/store/member'
import { getRelatives, uploadPhoto } from '@/api/member'
import { getServerBaseURL } from '@/utils/request'

const router = useRouter()
const authStore = useAuthStore()
const memberStore = useMemberStore()

const loading = ref(false)
const uploading = ref(false)
const member = ref(null)
const relatives = ref(null)
const fileInput = ref(null)

const photoUrl = computed(() => {
  if (member.value?.photo_url) {
    return `${getServerBaseURL()}${member.value.photo_url}`
  }
  return undefined
})

onMounted(async () => {
  await loadMember()
})

async function loadMember() {
  const id = router.currentRoute.value.params.id
  loading.value = true
  try {
    const res = await memberStore.fetchMemberById(id)
    if (res.success) {
      member.value = res.data
      await loadRelatives(id)
    }
  } finally {
    loading.value = false
  }
}

async function loadRelatives(id) {
  const res = await getRelatives(id)
  if (res.success) {
    relatives.value = res.data
  }
}

function goToMember(id) {
  router.push(`/members/${id}`)
}

function editMember() {
  router.push(`/members/${member.value.id}/edit`)
}

async function deleteMember() {
  try {
    await ElMessageBox.confirm(`确定要删除成员"${member.value.name}"吗？`, '删除确认', {
      type: 'warning'
    })
    const res = await memberStore.removeMember(member.value.id)
    if (res.success) {
      ElMessage.success('删除成功')
      router.push('/members')
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (e) {
    // 用户取消
  }
}

// 点击头像触发上传
function handlePhotoClick() {
  fileInput.value?.click()
}

// 处理文件选择
async function handleFileChange(event) {
  const file = event.target.files[0]
  if (!file) return
  
  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }
  
  // 验证文件大小（最大5MB）
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过5MB')
    return
  }
  
  uploading.value = true
  try {
    const res = await uploadPhoto(member.value.id, file)
    if (res.success) {
      ElMessage.success('照片上传成功')
      // 更新本地照片URL
      member.value.photo_url = res.data.photoUrl
    } else {
      ElMessage.error(res.message || '上传失败')
    }
  } catch (error) {
    ElMessage.error('上传失败')
  } finally {
    uploading.value = false
    // 清空文件输入
    event.target.value = ''
  }
}
</script>

<style scoped>
.member-detail {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.detail-content {
  padding: 20px;
}

/* 顶部区域：基本信息 + 右上角头像 */
.top-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 30px;
  margin-bottom: 30px;
}

/* 左侧基本信息区域 */
.info-main {
  flex: 1;
  min-width: 0;
}

.name-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.name-avatar {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
}

.info-main h2 {
  margin: 0;
  color: #303133;
}

.generation-tag {
  color: #909399;
  margin-bottom: 20px;
}

/* 右上角头像区域 - 矩形卡片 */
.photo-section {
  flex-shrink: 0;
  align-self: flex-start;
}

.photo-card {
  width: 200px;
  height: 240px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  background: #f5f7fa;
  position: relative;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s;
}

.photo-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.photo-image {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.photo-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-photo-icon {
  font-size: 80px;
  color: #c0c4cc;
}

.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #fff;
  opacity: 0;
  transition: opacity 0.3s;
}

.photo-card:hover .photo-overlay {
  opacity: 1;
}

.photo-overlay .el-icon {
  font-size: 32px;
  margin-bottom: 10px;
}

.photo-overlay span {
  font-size: 14px;
}

.extra-info p {
  color: #606266;
  line-height: 1.8;
}

.relatives-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.relative-item {
  display: flex;
  gap: 10px;
}

.relative-item .label {
  color: #909399;
  width: 60px;
}

.children-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>