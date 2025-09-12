<template>
  <!-- 地区选择界面 -->
  <div class="region-selection" v-show="activeTab === '地区'">
    <div class="region-header">
      <h2>选择骑行地区</h2>
      <p>选择您感兴趣的骑行地区，探索当地精彩路线</p>
    </div>
    <div class="region-grid">
      <div 
        v-for="region in regions" 
        :key="region"
        class="region-card"
        @click="handleRegionClick(region)"
      >
        <div class="region-card-header">
          <h3>{{ region }}</h3>
        </div>
        <div class="region-card-content">
          <p>探索{{ region }}的精彩骑行路线</p>
          <span class="region-card-arrow">→</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 具体地区路线展示 -->
  <div class="region-routes" v-show="regions.includes(activeTab)">
    <div class="region-header">
      <button class="back-button" @click="handleBackClick">← 返回地区选择</button>
      <h2>{{ activeTab }} 骑行路线</h2>
      <p>探索{{ activeTab }}的精彩骑行路线</p>
    </div>
    <div class="route-cards">
      <div class="route-card">
        <div class="route-card-header">
          <span class="route-card-title">{{ activeTab }}经典环线</span>
          <span class="difficulty-badge difficulty-medium">推荐路线</span>
        </div>
        <div class="route-card-stats">
          <span>风景优美</span>
          <span>适合骑行</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { regions } from '@/config/routeConfig.js'

// 接收父组件传递的参数
const props = defineProps({
  activeTab: String
})

// 发射事件到父组件
const emit = defineEmits(['region-selected', 'back-to-regions'])

// 处理地区卡片点击
const handleRegionClick = (region) => {
  emit('region-selected', region)
}

// 处理返回按钮点击
const handleBackClick = () => {
  emit('back-to-regions')
}

// 暴露给父组件的数据
defineExpose({
  regions
})
</script>

<style scoped>
/* 地区选择界面样式 */
.region-selection {
  padding: 20px 0;
}

.region-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.region-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.region-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(76, 175, 80, 0.15);
  border-color: #4CAF50;
}

.region-card-header h3 {
  color: #2c3e50;
  margin: 0 0 10px 0;
  font-size: 18px;
}

.region-card-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.region-card-content p {
  color: #6c757d;
  margin: 0;
  font-size: 14px;
}

.region-card-arrow {
  color: #4CAF50;
  font-size: 20px;
  font-weight: bold;
  transition: transform 0.3s ease;
}

.region-card:hover .region-card-arrow {
  transform: translateX(5px);
}

/* 地区路线展示样式 */
.region-routes {
  padding: 20px 0;
}

.region-header {
  text-align: center;
  margin-bottom: 30px;
  position: relative;
}

.region-header h2 {
  color: #2c3e50;
  font-size: 24px;
  margin-bottom: 10px;
}

.region-header p {
  color: #6c757d;
  font-size: 16px;
}

.back-button {
  position: absolute;
  left: 0;
  top: 0;
  background: #4CAF50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.back-button:hover {
  background: #45a049;
  transform: translateX(-2px);
}

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
  .region-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .region-card-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .region-header {
    padding: 0 50px;
  }
  
  .back-button {
    position: static;
    margin-bottom: 20px;
  }
  
  .route-card-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
