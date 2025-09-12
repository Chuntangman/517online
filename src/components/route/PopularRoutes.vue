<template>
  <div class="route-cards">
    <div 
      v-for="route in hotRoutes" 
      :key="route.id"
      class="route-card"
      @click="handleRouteClick(route)"
    >
      <div class="route-card-header">
        <span class="route-card-title">{{ route.title }}</span>
        <span 
          class="difficulty-badge"
          :class="`difficulty-${route.difficulty}`"
        >
          {{ route.difficultyLabel }}
        </span>
      </div>
      <div class="route-card-stats">
        <span>总距离: {{ route.distance }}</span>
        <span>预计时间: {{ route.duration }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoutePlanning } from '@/composables/useRoutePlanning.js'

// 发射事件到父组件
const emit = defineEmits(['route-selected'])

// 使用路线规划组合式函数
const { hotRoutes, getRouteDetails } = useRoutePlanning()

// 处理路线卡片点击
const handleRouteClick = (route) => {
  const routeDetails = getRouteDetails(route.id)
  emit('route-selected', routeDetails)
  console.log('选择路线:', routeDetails)
}

// 暴露给父组件的数据
defineExpose({
  hotRoutes
})
</script>

<style scoped>
/* 热门路线卡片 */
.route-cards {
  display: grid;
  gap: 15px;
  margin-top: 20px;
}

.route-card {
  background: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
}

.route-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.route-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  flex-wrap: wrap;
  gap: 10px;
}

.route-card-title {
  font-weight: 500;
  color: #2c3e50;
  font-size: 16px;
}

.route-card-stats {
  display: flex;
  gap: 15px;
  font-size: 13px;
  color: #6c757d;
  flex-wrap: wrap;
}

.difficulty-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.difficulty-easy {
  background: #e8f5e9;
  color: #4CAF50;
}

.difficulty-medium {
  background: #fff3e0;
  color: #ff9800;
}

.difficulty-hard {
  background: #ffebee;
  color: #f44336;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .route-card-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .route-card-stats {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
