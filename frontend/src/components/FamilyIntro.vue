<template>
  <el-card class="family-intro-card" v-loading="loading">
    <template #header>
      <div class="card-header">
        <span class="title">{{ intro.title }}</span>
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
    
    <div class="intro-content" v-html="formattedContent"></div>
    
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
            :rows="10" 
            placeholder="请输入家族简介内容，支持换行"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getFamilyIntro, updateFamilyIntro } from '@/api/familyIntro'

const props = defineProps({
  canEdit: {
    type: Boolean,
    default: false
  }
})

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

// 格式化内容，将换行符转换为 <br>
const formattedContent = computed(() => {
  if (!intro.value.content) return ''
  return intro.value.content.replace(/\n/g, '<br>')
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
.family-intro-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header .title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.intro-content {
  line-height: 1.8;
  color: #606266;
  white-space: pre-wrap;
}
</style>