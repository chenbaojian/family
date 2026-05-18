<template>
  <div class="family-catalog-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>族谱目录</span>
          <el-button
            v-if="authStore.isEditor"
            type="primary"
            size="small"
            @click="showAddDialog"
          >
            <el-icon><Plus /></el-icon>
            <span class="btn-text">上传族谱</span>
          </el-button>
        </div>
      </template>

      <div v-if="loading" style="text-align:center;padding:30px;">
        <el-icon class="is-loading" :size="24"><Loading /></el-icon>
      </div>

      <el-empty v-else-if="catalogs.length === 0" description="暂无族谱目录" />

      <!-- 目录列表 -->
      <div v-else class="catalog-list">
        <div
          class="catalog-item"
          v-for="item in catalogs"
          :key="item.id"
          @click="viewPdf(item)"
        >
          <div class="catalog-icon">
            <el-icon :size="40" color="#409EFF"><Document /></el-icon>
          </div>
          <div class="catalog-info">
            <div class="catalog-title">{{ item.title }}</div>
            <div class="catalog-desc" v-if="item.description">{{ item.description }}</div>
            <div class="catalog-meta">
              <span>{{ formatDate(item.created_at) }}</span>
            </div>
          </div>
          <div class="catalog-actions" v-if="authStore.isEditor || authStore.isAdmin">
            <el-button size="small" link type="primary" @click.stop="showEditDialog(item)" v-if="authStore.isEditor">编辑</el-button>
            <el-button size="small" link type="danger" @click.stop="handleDelete(item)" v-if="authStore.isAdmin">删除</el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- PDF查看对话框 -->
    <el-dialog
      v-model="pdfDialogVisible"
      :title="currentPdf.title"
      width="90%"
      top="2vh"
      destroy-on-close
      class="pdf-dialog"
    >
      <div class="pdf-viewer" v-if="currentPdf.pdf_url">
        <vue-pdf-embed :source="pdfSource" />
      </div>
    </el-dialog>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="isEditing ? '编辑族谱' : '上传族谱'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="标题" required>
          <el-input v-model="editForm.title" placeholder="请输入族谱标题" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述信息"
          />
        </el-form-item>
        <el-form-item label="PDF文件" :required="!isEditing">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            accept=".pdf"
          >
            <el-button type="primary" size="small">选择PDF文件</el-button>
            <template #tip>
              <div class="upload-tip">仅支持PDF格式，最大50MB</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import VuePdfEmbed from 'vue-pdf-embed'
import { useAuthStore } from '@/store/auth'
import { getCatalogs, createCatalog, updateCatalog, deleteCatalog } from '@/api/familyCatalog'

const authStore = useAuthStore()

const loading = ref(false)
const saving = ref(false)
const catalogs = ref([])
const pdfDialogVisible = ref(false)
const editDialogVisible = ref(false)
const isEditing = ref(false)
const uploadRef = ref(null)

const currentPdf = ref({ title: '', pdf_url: '' })

const editForm = ref({
  id: '',
  title: '',
  description: '',
  pdfFile: null
})

// PDF源地址
const pdfSource = computed(() => {
  if (!currentPdf.value.pdf_url) return ''
  // 使用后端API地址拼接
  const baseUrl = window.location.origin
  return baseUrl + currentPdf.value.pdf_url
})

onMounted(() => {
  fetchCatalogs()
})

async function fetchCatalogs() {
  loading.value = true
  try {
    const res = await getCatalogs()
    if (res.success) {
      catalogs.value = res.data
    }
  } catch (error) {
    console.error('获取族谱目录失败:', error)
  } finally {
    loading.value = false
  }
}

function viewPdf(item) {
  currentPdf.value = item
  pdfDialogVisible.value = true
}

function showAddDialog() {
  isEditing.value = false
  editForm.value = { id: '', title: '', description: '', pdfFile: null }
  editDialogVisible.value = true
}

function showEditDialog(item) {
  isEditing.value = true
  editForm.value = {
    id: item.id,
    title: item.title,
    description: item.description || '',
    pdfFile: null
  }
  editDialogVisible.value = true
}

function handleFileChange(file) {
  editForm.value.pdfFile = file.raw
}

function handleFileRemove() {
  editForm.value.pdfFile = null
}

async function handleSubmit() {
  if (!editForm.value.title) {
    ElMessage.warning('标题不能为空')
    return
  }
  if (!isEditing.value && !editForm.value.pdfFile) {
    ElMessage.warning('请上传PDF文件')
    return
  }

  saving.value = true
  try {
    const res = isEditing.value
      ? await updateCatalog(editForm.value.id, editForm.value)
      : await createCatalog(editForm.value)

    if (res.success) {
      ElMessage.success(isEditing.value ? '更新成功' : '上传成功')
      editDialogVisible.value = false
      await fetchCatalogs()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete(item) {
  try {
    await ElMessageBox.confirm(`确定要删除"${item.title}"吗？`, '删除确认', {
      type: 'warning'
    })
    const res = await deleteCatalog(item.id)
    if (res.success) {
      ElMessage.success('删除成功')
      await fetchCatalogs()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (e) {
    // 用户取消
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return dateStr.split('T')[0].split(' ')[0].substring(0, 10)
}
</script>

<style scoped>
.family-catalog-page {
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

.catalog-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.catalog-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.catalog-item:hover {
  border-color: #409eff;
  background: #f5f7fa;
}

.catalog-icon {
  flex-shrink: 0;
}

.catalog-info {
  flex: 1;
  min-width: 0;
}

.catalog-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.catalog-desc {
  font-size: 13px;
  color: #606266;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.catalog-meta {
  font-size: 12px;
  color: #909399;
}

.catalog-actions {
  flex-shrink: 0;
  display: flex;
  gap: 8px;
}

.pdf-viewer {
  height: 75vh;
  overflow: auto;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
}

/* 手机端响应式 */
@media screen and (max-width: 768px) {
  .btn-text {
    display: none;
  }

  .catalog-item {
    padding: 12px;
    gap: 10px;
  }

  .catalog-icon {
    display: none;
  }

  .catalog-title {
    font-size: 15px;
  }

  .pdf-dialog :deep(.el-dialog) {
    width: 95% !important;
    margin-top: 1vh !important;
  }

  .pdf-viewer {
    height: 80vh;
  }
}
</style>