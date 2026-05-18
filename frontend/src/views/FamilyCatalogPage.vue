<template>
  <div class="family-catalog-page">
    <!-- 管理栏 -->
    <div class="catalog-toolbar" v-if="authStore.isEditor || authStore.isAdmin">
      <el-button type="primary" size="small" @click="showAddDialog">
        <el-icon><Plus /></el-icon>
        <span class="btn-text">上传族谱</span>
      </el-button>
      <el-button size="small" @click="showEditDialog(currentCatalog)" v-if="currentCatalog && authStore.isEditor">
        <el-icon><Edit /></el-icon>
        <span class="btn-text">编辑</span>
      </el-button>
      <el-button type="danger" size="small" @click="handleDelete(currentCatalog)" v-if="currentCatalog && authStore.isAdmin">
        <el-icon><Delete /></el-icon>
        <span class="btn-text">删除</span>
      </el-button>
    </div>

    <div v-if="loading" style="text-align:center;padding:30px;">
      <el-icon class="is-loading" :size="24"><Loading /></el-icon>
    </div>

    <!-- 无数据时 -->
    <div v-else-if="catalogs.length === 0" class="empty-state">
      <el-empty description="暂无族谱目录" />
      <el-button v-if="authStore.isEditor" type="primary" @click="showAddDialog">上传族谱PDF</el-button>
    </div>

    <!-- 有数据时：直接展示PDF -->
    <div v-else class="catalog-content">
      <!-- 多个目录时显示切换栏 -->
      <div class="catalog-tabs" v-if="catalogs.length > 1">
        <div
          class="catalog-tab"
          v-for="item in catalogs"
          :key="item.id"
          :class="{ active: currentCatalog?.id === item.id }"
          @click="switchCatalog(item)"
        >
          {{ item.title }}
        </div>
      </div>

      <!-- 当前目录标题和描述 -->
      <div class="catalog-header" v-if="currentCatalog">
        <h3>{{ currentCatalog.title }}</h3>
        <p v-if="currentCatalog.description" class="catalog-desc">{{ currentCatalog.description }}</p>
      </div>

      <!-- PDF内嵌展示 -->
      <div class="pdf-viewer" v-if="currentCatalog">
        <vue-pdf-embed :source="pdfSource" />
      </div>
    </div>

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
import { getServerBaseURL } from '@/utils/request'
import { getCatalogs, createCatalog, updateCatalog, deleteCatalog } from '@/api/familyCatalog'

const authStore = useAuthStore()

const loading = ref(false)
const saving = ref(false)
const catalogs = ref([])
const currentCatalog = ref(null)
const editDialogVisible = ref(false)
const isEditing = ref(false)
const uploadRef = ref(null)

const editForm = ref({
  id: '',
  title: '',
  description: '',
  pdfFile: null
})

// PDF源地址
const pdfSource = computed(() => {
  if (!currentCatalog.value?.pdf_url) return ''
  return getServerBaseURL() + currentCatalog.value.pdf_url
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
      // 默认选中第一个
      if (catalogs.value.length > 0) {
        currentCatalog.value = catalogs.value[0]
      }
    }
  } catch (error) {
    console.error('获取族谱目录失败:', error)
  } finally {
    loading.value = false
  }
}

function switchCatalog(item) {
  currentCatalog.value = item
}

function showAddDialog() {
  isEditing.value = false
  editForm.value = { id: '', title: '', description: '', pdfFile: null }
  editDialogVisible.value = true
}

function showEditDialog(item) {
  if (!item) return
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
  if (!item) return
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
</script>

<style scoped>
.family-catalog-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.catalog-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.btn-text {
  margin-left: 4px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.catalog-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.catalog-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.catalog-tab {
  padding: 6px 16px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  transition: all 0.2s;
  background: #fff;
}

.catalog-tab:hover {
  border-color: #409eff;
  color: #409eff;
}

.catalog-tab.active {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
}

.catalog-header {
  margin-bottom: 12px;
}

.catalog-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.catalog-desc {
  margin: 4px 0 0;
  font-size: 14px;
  color: #606266;
}

.pdf-viewer {
  flex: 1;
  overflow: auto;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fff;
  padding: 8px;
  min-height: 500px;
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

  .catalog-toolbar {
    margin-bottom: 8px;
  }

  .catalog-header h3 {
    font-size: 16px;
  }

  .pdf-viewer {
    min-height: 400px;
  }
}
</style>