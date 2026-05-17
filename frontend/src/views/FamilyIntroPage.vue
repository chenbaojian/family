<template>
  <div class="family-intro-page">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>{{ intro.title }}</span>
          <el-button 
            v-if="canEdit" 
            type="primary" 
            size="small" 
            @click="showEditDialog"
          >
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
        </div>
      </template>
      
      <div class="intro-content" v-if="intro.content">
        <p v-for="(line, index) in contentLines" :key="index">{{ line }}</p>
      </div>
      <el-empty v-else description="暂无家族简介" />
    </el-card>
    
    <!-- 编辑对话框 -->
    <el-dialog 
      v-model="editDialogVisible" 
      title="编辑家族简介" 
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="editForm.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input 
            v-model="editForm.content" 
            type="textarea" 
            :rows="12" 
            placeholder="请输入家族简介内容，支持换行"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getFamilyIntro, updateFamilyIntro } from '@/api/familyIntro'
import { useAuthStore } from '@/store/auth'

const authStore = useAuthStore()

const loading = ref(false)
const saving = ref(false)
const editDialogVisible = ref(false)

const intro = ref({
  title: '家族简介',
  content: ''
})

const editForm = ref({
  title: '',
  content: ''
})

// 判断是否有编辑权限
const canEdit = computed(() => {
  return authStore.isEditor
})

// 将内容按行分割
const contentLines = computed(() => {
  if (!intro.value.content) return []
  return intro.value.content.split('\n').filter(line => line.trim())
})

onMounted(() => {
  fetchIntro()
})

async function fetchIntro() {
  loading.value = true
  try {
    const res = await getFamilyIntro()
    if (res.success && res.data) {
      intro.value = res.data
    }
  } catch (error) {
    console.error('获取家族简介失败:', error)
  } finally {
    loading.value = false
  }
}

function showEditDialog() {
  editForm.value = {
    title: intro.value.title,
    content: intro.value.content
  }
  editDialogVisible.value = true
}

async function handleSave() {
  if (!editForm.value.title || !editForm.value.content) {
    ElMessage.warning('标题和内容不能为空')
    return
  }

  saving.value = true
  try {
    const res = await updateFamilyIntro(editForm.value)
    if (res.success) {
      ElMessage.success('保存成功')
      intro.value = { ...editForm.value }
      editDialogVisible.value = false
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.family-intro-page {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header span {
  font-size: 18px;
  font-weight: bold;
}

.intro-content {
  line-height: 2;
  font-size: 15px;
  color: #303133;
}

.intro-content p {
  text-indent: 2em;
  margin-bottom: 10px;
}
</style>