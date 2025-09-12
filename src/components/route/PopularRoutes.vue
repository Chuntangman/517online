<template>
  <div class="popular-routes-section">
    <!-- 地区提示 -->
    <div class="region-info">
      <p v-if="selectedRegion === '全部'">
        显示所有地区的热门路线
      </p>
      <p v-else>
        显示 <strong>{{ selectedRegion }}</strong> 地区的热门路线
      </p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <p>正在加载热门路线...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <p>加载失败: {{ error }}</p>
      <button @click="fetchPopularRoutes" class="retry-button">重试</button>
    </div>

    <!-- 空状态 -->
    <div v-else-if="filteredRoutes.length === 0" class="empty-state">
      <p>该地区暂无热门路线</p>
      <p class="empty-hint">试试选择其他地区</p>
    </div>

    <!-- 路线卡片列表 -->
    <div v-else class="route-cards">
      <div 
        v-for="route in filteredRoutes" 
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
          <span v-if="route.region">地区: {{ route.region }}</span>
        </div>
        <div v-if="route.roadCondition" class="route-card-extra">
          <span class="road-condition">路况: {{ route.roadCondition }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { usePopularRoutes } from '@/composables/usePopularRoutes.js'

// 发射事件到父组件
const emit = defineEmits(['route-selected'])

// 使用热门路线组合式函数
const { 
  filteredRoutes, 
  loading, 
  error, 
  selectedRegion, 
  fetchPopularRoutes, 
  getRouteDetails 
} = usePopularRoutes()

// 处理路线卡片点击
const handleRouteClick = (route) => {
  const routeDetails = getRouteDetails(route.id)
  emit('route-selected', routeDetails)
  console.log('选择路线:', routeDetails)
}

// 暴露给父组件的数据
defineExpose({
  filteredRoutes
})
</script>

<style scoped>
.popular-routes-section {
  padding: 20px 0;
}

/* 地区信息 */
.region-info {
  text-align: center;
  margin-bottom: 20px;
  padding: 15px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
}

.region-info p {
  margin: 0;
  color: #6c757d;
  font-size: 14px;
}

/* 状态样式 */
.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
}

.error-state {
  color: #dc3545;
}

.retry-button {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.retry-button:hover {
  background: #0056b3;
}

.empty-hint {
  font-size: 12px;
  margin-top: 5px;
}

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
  margin-bottom: 8px;
}

.route-card-extra {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e9ecef;
}

.road-condition {
  font-size: 12px;
  color: #28a745;
  background: #e8f5e9;
  padding: 2px 6px;
  border-radius: 3px;
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
