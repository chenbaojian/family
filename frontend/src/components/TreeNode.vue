<template>
  <div class="tree-node" ref="nodeRef">
    <!-- 节点内容（包含配偶） -->
    <div class="node-group">
      <!-- 主节点 -->
      <div class="node-content" :class="nodeGenderClass" @click="$emit('select', node)">
        <span v-if="node.sibling_order_label" class="sibling-order-badge">
          {{ node.sibling_order_label }}
        </span>
        <el-avatar :size="50" :src="photoUrl" icon="UserFilled" />
        <div class="node-info">
          <span class="name">{{ node.name }}</span>
          <span class="generation">第{{ node.generation }}代</span>
        </div>
      </div>

      <!-- 配偶节点 -->
      <template v-if="node.spouse">
        <div class="spouse-connector"></div>
        <div class="node-content spouse" :class="spouseGenderClass" @click="$emit('select', node.spouse)">
          <el-avatar :size="50" :src="spousePhotoUrl" icon="UserFilled" />
          <div class="node-info">
            <span class="name">{{ node.spouse.name }}</span>
            <span class="generation">第{{ node.spouse.generation }}代</span>
          </div>
        </div>
      </template>
    </div>

    <!-- 子节点 -->
    <div v-if="hasChildren" class="children-container">
      <!-- 垂直连接线 -->
      <div class="vertical-line"></div>

      <!-- 子节点区域 -->
      <div class="children-area" ref="childrenArea">
        <!-- 水平连接线 -->
        <div class="horizontal-line" v-if="node.children.length > 1"></div>
        <div class="children-nodes">
          <TreeNode
            v-for="child in node.children"
            :key="child.id"
            :node="child"
            :level="level + 1"
            @select="$emit('select', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, nextTick } from 'vue'
import { getServerBaseURL } from '@/utils/request'

const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  level: {
    type: Number,
    default: 0
  }
})

defineEmits(['select'])

const nodeRef = ref(null)
const childrenArea = ref(null)

const photoUrl = computed(() => {
  if (props.node.photo_url) {
    return `${getServerBaseURL()}${props.node.photo_url}`
  }
  return undefined
})

const spousePhotoUrl = computed(() => {
  if (props.node.spouse?.photo_url) {
    return `${getServerBaseURL()}${props.node.spouse.photo_url}`
  }
  return undefined
})

// 根据性别返回样式类
const nodeGenderClass = computed(() => {
  return props.node.gender === 'female' ? 'female-node' : 'male-node'
})

const spouseGenderClass = computed(() => {
  return props.node.spouse?.gender === 'female' ? 'female-node' : 'male-node'
})

const hasChildren = computed(() => {
  return props.node.children && props.node.children.length > 0
})

// 动态计算水平线宽度
onMounted(() => {
  nextTick(() => {
    updateHorizontalLine()
  })
})

function updateHorizontalLine() {
  if (childrenArea.value && props.node.children?.length > 1) {
    const line = childrenArea.value.querySelector('.horizontal-line')
    const nodes = childrenArea.value.querySelector('.children-nodes')
    if (line && nodes) {
      const firstNode = nodes.firstElementChild
      const lastNode = nodes.lastElementChild
      if (firstNode && lastNode) {
        const firstCenter = firstNode.offsetLeft + firstNode.offsetWidth / 2
        const lastCenter = lastNode.offsetLeft + lastNode.offsetWidth / 2
        const width = Math.abs(lastCenter - firstCenter)
        const left = Math.min(firstCenter, lastCenter)
        line.style.width = `${width}px`
        line.style.left = `${left}px`
      }
    }
  }
}
</script>

<style scoped>
.tree-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

/* 节点组（包含主节点和配偶） */
.node-group {
  display: flex;
  align-items: center;
  justify-content: center;
}

.node-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 80px;
  position: relative;
  z-index: 2;
}

.node-content:hover {
  transform: translateY(-2px);
}

/* 排位标识 */
.sibling-order-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 4px;
  line-height: 1.4;
  white-space: nowrap;
  z-index: 3;
}

/* 男性排位标识 - 蓝色系 */
.male-node .sibling-order-badge {
  background: rgba(64, 158, 255, 0.15);
  color: #409eff;
  border: 1px solid rgba(64, 158, 255, 0.3);
}

/* 女性排位标识 - 红色系 */
.female-node .sibling-order-badge {
  background: rgba(245, 108, 108, 0.15);
  color: #f56c6c;
  border: 1px solid rgba(245, 108, 108, 0.3);
}

/* 男性节点样式 - 蓝色 */
.node-content.male-node {
  border: 2px solid #409eff;
  background: linear-gradient(135deg, #fff 0%, #f0f7ff 100%);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.node-content.male-node:hover {
  border-color: #66b1ff;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.4);
}

/* 女性节点样式 - 红色 */
.node-content.female-node {
  border: 2px solid #f56c6c;
  background: linear-gradient(135deg, #fff 0%, #fef0f0 100%);
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.2);
}

.node-content.female-node:hover {
  border-color: #f78989;
  box-shadow: 0 4px 16px rgba(245, 108, 108, 0.4);
}

/* 配偶连接线 */
.spouse-connector {
  width: 30px;
  height: 2px;
  background: linear-gradient(to right, #409eff, #f56c6c);
  margin: 0 5px;
}

.node-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 8px;
}

.name {
  font-weight: bold;
  color: #303133;
  font-size: 14px;
}

.generation {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

/* 子节点容器 */
.children-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 垂直连接线 */
.vertical-line {
  width: 2px;
  height: 30px;
  background: linear-gradient(to bottom, #409eff, #c0d9ff);
}

/* 子节点区域 */
.children-area {
  position: relative;
  padding-top: 0;
}

/* 水平连接线 */
.horizontal-line {
  position: absolute;
  top: 0;
  height: 2px;
  background: #c0d9ff;
  z-index: 1;
}

.children-nodes {
  display: flex;
  justify-content: center;
  gap: 50px;
  padding-top: 30px;
  position: relative;
}
</style>