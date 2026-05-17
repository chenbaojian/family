<template>
  <div class="member-card" @click="$emit('click')">
    <el-avatar :size="60" :src="photoUrl" icon="UserFilled" />
    <div class="card-info">
      <h4>{{ member.name }}</h4>
      <p>{{ member.gender === 'male' ? '男' : '女' }}</p>
      <el-tag :type="member.death_date ? 'info' : 'success'" size="small">
        {{ member.death_date ? '已故' : '在世' }}
      </el-tag>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getServerBaseURL } from '@/utils/request'

const props = defineProps({
  member: {
    type: Object,
    required: true
  }
})

defineEmits(['click'])

const photoUrl = computed(() => {
  if (props.member.photo_url) {
    return `${getServerBaseURL()}${props.member.photo_url}`
  }
  return undefined
})
</script>

<style scoped>
.member-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background: #fff;
}

.member-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.2);
}

.card-info h4 {
  margin: 0;
  color: #303133;
}

.card-info p {
  margin: 5px 0;
  color: #909399;
  font-size: 14px;
}
</style>