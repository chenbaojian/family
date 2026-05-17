<template>
  <div class="user-manage">
    <el-card>
      <template #header>
        <span>用户管理</span>
      </template>

      <el-table :data="users" v-loading="loading" stripe>
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="phone" label="手机号" width="150" />
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : row.role === 'editor' ? 'warning' : 'info'" size="small">
              {{ roleText(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : row.status === 'pending' ? 'warning' : 'danger'" size="small">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="180" />
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-select v-model="row.role" size="small" placeholder="角色" @change="updateUser(row, 'role', row.role)" style="width: 80px">
              <el-option label="管理员" value="admin" />
              <el-option label="编辑者" value="editor" />
              <el-option label="查看者" value="viewer" />
            </el-select>
            <el-select v-model="row.status" size="small" placeholder="状态" @change="updateUser(row, 'status', row.status)" style="width: 80px">
              <el-option label="激活" value="active" />
              <el-option label="待审" value="pending" />
              <el-option label="禁用" value="disabled" />
            </el-select>
            <el-button
              type="danger"
              size="small"
              :disabled="row.role === 'admin'"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAllUsers, updateUserStatus, deleteUser } from '@/api/auth'

const users = ref([])
const loading = ref(false)

const roleText = (role) => {
  const roles = { admin: '管理员', editor: '编辑者', viewer: '查看者' }
  return roles[role] || role
}

const statusText = (status) => {
  const statuses = { active: '已激活', pending: '待审核', disabled: '已禁用' }
  return statuses[status] || status
}

onMounted(async () => {
  await loadUsers()
})

async function loadUsers() {
  loading.value = true
  try {
    const res = await getAllUsers()
    if (res.success) {
      users.value = res.data
    }
  } finally {
    loading.value = false
  }
}

async function updateUser(user, field, value) {
  try {
    const res = await updateUserStatus(user.id, { [field]: value })
    if (res.success) {
      ElMessage.success('更新成功')
    } else {
      ElMessage.error(res.message || '更新失败')
      await loadUsers()
    }
  } catch (error) {
    ElMessage.error('更新失败')
    await loadUsers()
  }
}

async function handleDelete(user) {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.username}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const res = await deleteUser(user.id)
    if (res.success) {
      ElMessage.success('删除成功')
      await loadUsers()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}
</script>

<style scoped>
.user-manage {
  height: 100%;
}
</style>