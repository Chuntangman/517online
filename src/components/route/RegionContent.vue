<template>
  <div class="region-content">
    <div class="region-info">
      <h2>地区筛选</h2>
      <p v-if="selectedRegion === '全部'">
        当前显示所有地区的数据
      </p>
      <p v-else>
        当前显示 <strong>{{ selectedRegion }}</strong> 地区的数据
      </p>
      <div class="region-stats" v-if="regionStats">
        <div class="stat-item">
          <span class="stat-label">路线数量:</span>
          <span class="stat-value">{{ regionStats.routes || 0 }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">驿站数量:</span>
          <span class="stat-value">{{ regionStats.waystations || 0 }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">目标点数量:</span>
          <span class="stat-value">{{ regionStats.destinations || 0 }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRegions } from '@/composables/useRegions.js'

// 接收父组件传递的参数
const props = defineProps({
  activeTab: String
})

// 使用地区管理
const { selectedRegion } = useRegions()

// 地区统计数据
const regionStats = ref({
  routes: 0,
  waystations: 0,
  destinations: 0
})

// 获取地区统计数据的函数
const fetchRegionStats = async () => {
  try {
    // 调用真实的API获取统计数据
    const region = selectedRegion.value === '全部' ? '' : selectedRegion.value
    const response = await fetch(`/api/v1/routes/region-statistics?region=${encodeURIComponent(region)}`)
    
    if (!response.ok) {
      throw new Error('获取统计数据失败')
    }
    
    const result = await response.json()
    
    if (result.success && result.data) {
      regionStats.value = {
        routes: result.data.routes || 0,
        waystations: result.data.waystations || 0,
        destinations: result.data.destinations || 0
      }
      console.log('地区统计数据获取成功:', result.data)
    } else {
      throw new Error(result.message || '数据格式错误')
    }
  } catch (error) {
    console.error('获取地区统计数据失败:', error)
    // 失败时显示0值而不是随机数据
    regionStats.value = {
      routes: 0,
      waystations: 0,
      destinations: 0
    }
  }
}

// 组件挂载时获取统计数据
onMounted(() => {
  fetchRegionStats()
})

// 监听地区变化，重新获取统计数据
watch(selectedRegion, (newRegion, oldRegion) => {
  if (newRegion !== oldRegion) {
    console.log('地区变化，重新获取统计数据:', newRegion)
    fetchRegionStats()
  }
}, { immediate: false })
</script>

<style scoped>
.region-content {
  padding: 20px 0;
}

.region-info {
  text-align: center;
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.region-info h2 {
  color: #2c3e50;
  font-size: 24px;
  margin-bottom: 15px;
}

.region-info p {
  color: #6c757d;
  font-size: 16px;
  margin-bottom: 20px;
}

.region-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 20px;
  margin-top: 25px;
}

.stat-item {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-label {
  display: block;
  color: #6c757d;
  font-size: 14px;
  margin-bottom: 8px;
}

.stat-value {
  display: block;
  color: #2c3e50;
  font-size: 20px;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .region-info {
    padding: 20px;
  }
  
  .region-stats {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .stat-item {
    padding: 12px;
  }
  
  .stat-value {
    font-size: 18px;
  }
}
</style>
