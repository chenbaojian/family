<template>
  <div class="member-edit">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <el-button @click="$router.back()">
            <el-icon><ArrowLeft /></el-icon>返回
          </el-button>
          <span>{{ isEdit ? '编辑成员' : '添加成员' }}</span>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" :label-width="isMobile ? '80px' : '100px'">
        <el-row :gutter="isMobile ? 0 : 20">
          <el-col :span="isMobile ? 24 : 12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="form.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="isMobile ? 24 : 12">
            <el-form-item label="性别" prop="gender">
              <el-radio-group v-model="form.gender">
                <el-radio value="male">男</el-radio>
                <el-radio value="female">女</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="isMobile ? 0 : 20">
          <el-col :span="isMobile ? 24 : 12">
            <el-form-item label="出生日期" prop="birth_date">
              <el-date-picker v-model="form.birth_date" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="isMobile ? 24 : 12">
            <el-form-item label="离世日期">
              <el-date-picker v-model="form.death_date" type="date" placeholder="选择日期（在世不填）" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="isMobile ? 0 : 20">
          <el-col :span="isMobile ? 24 : 12">
            <el-form-item label="代数" prop="generation">
              <el-input-number v-model="form.generation" :min="1" :max="20" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="isMobile ? 24 : 12">
            <el-form-item label="出生地点">
              <el-input v-model="form.birth_place" placeholder="请输入出生地点" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="isMobile ? 0 : 20">
          <el-col :span="isMobile ? 24 : 12">
            <el-form-item label="居住地点">
              <el-input v-model="form.residence" placeholder="请输入居住地点" />
            </el-form-item>
          </el-col>
          <el-col :span="isMobile ? 24 : 12">
            <el-form-item label="学历">
              <el-input v-model="form.education" placeholder="请输入学历" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="isMobile ? 0 : 20">
          <el-col :span="isMobile ? 24 : 12">
            <el-form-item label="手机号">
              <el-input v-model="form.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
          <el-col :span="isMobile ? 24 : 12">
            <el-form-item label="邮箱">
              <el-input v-model="form.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="isMobile ? 0 : 20">
          <el-col :span="isMobile ? 24 : 12">
            <el-form-item label="配偶姓名">
              <el-input v-model="form.spouse_name" placeholder="请输入配偶姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="isMobile ? 24 : 12">
            <el-form-item label="职业">
              <el-input v-model="form.occupation" placeholder="请输入职业" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">亲属关系</el-divider>

        <el-row :gutter="isMobile ? 0 : 20">
          <el-col :span="isMobile ? 24 : 8">
            <el-form-item label="父亲">
              <el-select v-model="form.father_id" placeholder="选择父亲" clearable filterable style="width: 100%">
                <el-option v-for="m in maleMembers" :key="m.id" :label="m.name" :value="m.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="isMobile ? 24 : 8">
            <el-form-item label="母亲">
              <el-select v-model="form.mother_id" placeholder="选择母亲" clearable filterable style="width: 100%">
                <el-option v-for="m in femaleMembers" :key="m.id" :label="m.name" :value="m.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="isMobile ? 24 : 8">
            <el-form-item label="配偶成员">
              <el-select v-model="form.spouse_id" placeholder="选择配偶" clearable filterable style="width: 100%">
                <el-option v-for="m in allMembers" :key="m.id" :label="m.name" :value="m.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">详细信息</el-divider>

        <el-form-item label="社会贡献">
          <el-input v-model="form.contribution" type="textarea" :rows="3" placeholder="请输入社会贡献" />
        </el-form-item>

        <el-form-item label="个人简介">
          <el-input v-model="form.biography" type="textarea" :rows="3" placeholder="请输入个人简介" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            {{ isEdit ? '保存修改' : '添加成员' }}
          </el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useMemberStore } from '@/store/member'

const router = useRouter()
const memberStore = useMemberStore()

const formRef = ref(null)
const loading = ref(false)
const submitting = ref(false)
const isMobile = ref(false)

function checkMobile() {
  isMobile.value = window.innerWidth <= 768
}
checkMobile()
window.addEventListener('resize', checkMobile)

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

const isEdit = computed(() => !!router.currentRoute.value.params.id)

const form = reactive({
  name: '',
  gender: 'male',
  birth_date: '',
  death_date: '',
  generation: 1,
  birth_place: '',
  residence: '',
  phone: '',
  email: '',
  spouse_name: '',
  spouse_id: '',
  father_id: '',
  mother_id: '',
  education: '',
  occupation: '',
  contribution: '',
  biography: ''
})

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  birth_date: [{ required: true, message: '请选择出生日期', trigger: 'change' }],
  generation: [{ required: true, message: '请输入代数', trigger: 'change' }]
}

const allMembers = computed(() => memberStore.members)
const maleMembers = computed(() => memberStore.members.filter(m => m.gender === 'male'))
const femaleMembers = computed(() => memberStore.members.filter(m => m.gender === 'female'))

onMounted(async () => {
  await memberStore.fetchMembers()
  if (isEdit.value) {
    await loadMember()
  }
})

async function loadMember() {
  const id = router.currentRoute.value.params.id
  loading.value = true
  try {
    const res = await memberStore.fetchMemberById(id)
    if (res.success) {
      // 直接赋值，保留 null 值
      form.name = res.data.name || ''
      form.gender = res.data.gender || 'male'
      form.birth_date = res.data.birth_date || ''
      form.death_date = res.data.death_date || ''
      form.generation = res.data.generation || 1
      form.birth_place = res.data.birth_place || ''
      form.residence = res.data.residence || ''
      form.phone = res.data.phone || ''
      form.email = res.data.email || ''
      form.spouse_name = res.data.spouse_name || ''
      form.spouse_id = res.data.spouse_id || null
      form.father_id = res.data.father_id || null
      form.mother_id = res.data.mother_id || null
      form.education = res.data.education || ''
      form.occupation = res.data.occupation || ''
      form.contribution = res.data.contribution || ''
      form.biography = res.data.biography || ''
    }
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    // 构建提交数据，确保所有字段都包含
    const data = {
      name: form.name,
      gender: form.gender,
      birth_date: form.birth_date,
      death_date: form.death_date || null,
      generation: form.generation,
      birth_place: form.birth_place || null,
      residence: form.residence || null,
      phone: form.phone || null,
      email: form.email || null,
      spouse_name: form.spouse_name || null,
      spouse_id: form.spouse_id || null,
      father_id: form.father_id || null,
      mother_id: form.mother_id || null,
      education: form.education || null,
      occupation: form.occupation || null,
      contribution: form.contribution || null,
      biography: form.biography || null
    }

    console.log('提交数据:', data)

    let res
    if (isEdit.value) {
      res = await memberStore.editMember(router.currentRoute.value.params.id, data)
    } else {
      res = await memberStore.addMember(data)
    }

    console.log('响应结果:', res)

    if (res.success) {
      ElMessage.success(isEdit.value ? '修改成功' : '添加成功')
      router.push('/members')
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.member-edit {
  height: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 20px;
}
</style>