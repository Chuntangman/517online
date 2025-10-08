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

    <!-- 路线详情弹窗 -->
    <div v-if="showRouteDetail" class="route-detail-modal" @click="closeRouteDetail">
      <div class="route-detail-content" @click.stop>
        <div class="route-detail-header">
          <h3>{{ selectedRouteDetail?.route?.name || '路线详情' }}</h3>
          <button class="close-button" @click="closeRouteDetail">×</button>
        </div>
        
        <div class="route-detail-body">
          <!-- 路线基本信息 -->
          <div class="route-basic-info">
            <div class="info-item">
              <span class="label">地区:</span>
              <span class="value">{{ selectedRouteDetail?.route?.region || '暂无' }}</span>
            </div>
            <div class="info-item">
              <span class="label">总距离:</span>
              <span class="value">{{ selectedRouteDetail?.route?.distance_km ? selectedRouteDetail.route.distance_km + 'km' : '暂无' }}</span>
            </div>
            <div class="info-item">
              <span class="label">预计天数:</span>
              <span class="value">{{ selectedRouteDetail?.route?.estimated_days ? selectedRouteDetail.route.estimated_days + '天' : '暂无' }}</span>
            </div>
            <div class="info-item">
              <span class="label">路况:</span>
              <span class="value">{{ selectedRouteDetail?.route?.road_condition || '暂无' }}</span>
            </div>
            <div v-if="selectedRouteDetail?.route?.remarks" class="info-item">
              <span class="label">备注:</span>
              <span class="value">{{ selectedRouteDetail.route.remarks }}</span>
            </div>
            <div v-if="selectedRouteDetail?.route?.precautions" class="info-item">
              <span class="label">注意事项:</span>
              <span class="value">{{ selectedRouteDetail.route.precautions }}</span>
            </div>
          </div>

          <!-- 途径点列表 -->
          <div class="waypoints-section">
            <h4>途径地点</h4>
            <div v-if="waypointsLoading" class="waypoints-loading">
              <p>正在加载途径点信息...</p>
            </div>
            <div v-else-if="waypointsError" class="waypoints-error">
              <p>加载途径点失败: {{ waypointsError }}</p>
            </div>
            <div v-else-if="!selectedRouteDetail?.waypoints || selectedRouteDetail.waypoints.length === 0" class="waypoints-empty">
              <p>暂无途径点信息</p>
            </div>
            <div v-else class="waypoints-list">
              <div 
                v-for="(waypoint, index) in selectedRouteDetail.waypoints" 
                :key="waypoint.id"
                class="waypoint-item"
                :class="{ 
                  'start-point': index === 0, 
                  'end-point': index === selectedRouteDetail.waypoints.length - 1 
                }"
              >
                <div class="waypoint-index">
                  <span v-if="index === 0" class="point-label start">起</span>
                  <span v-else-if="index === selectedRouteDetail.waypoints.length - 1" class="point-label end">终</span>
                  <span v-else class="point-label via">{{ index }}</span>
                </div>
                <div class="waypoint-info">
                  <div class="waypoint-name">{{ waypoint.name }}</div>
                  <div class="waypoint-details">
                    <span v-if="waypoint.region && waypoint.region !== '暂无'">{{ waypoint.region }}</span>
                    <span v-if="waypoint.description && waypoint.description !== '暂无'" class="description">{{ waypoint.description }}</span>
                    <span v-if="waypoint.nearest_waystation_name && waypoint.nearest_waystation_name !== '暂无'" class="nearest-station">
                      最近驿站: {{ waypoint.nearest_waystation_name }}
                      <span v-if="waypoint.nearest_waystation_distance">({{ waypoint.nearest_waystation_distance }}km)</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="route-actions">
            <button 
              class="action-button view-on-map" 
              @click="viewRouteOnMap"
              :disabled="!canShowOnMap"
            >
              在地图上查看路线
            </button>
            <button 
              class="action-button close-detail" 
              @click="closeRouteDetail"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import axios from 'axios'
import { usePopularRoutes } from '@/composables/usePopularRoutes.js'
import simplifiedAnalytics from '@/utils/simplifiedAnalytics'

// 使用相对路径，由 Nginx 代理到后端
const API_BASE_URL = '/api/v1'

// 发射事件到父组件
const emit = defineEmits(['route-selected', 'route-visualize', 'route-navigate-with-markers', 'clear-previous-displays'])

// 使用热门路线组合式函数
const { 
  filteredRoutes, 
  loading, 
  error, 
  selectedRegion, 
  fetchPopularRoutes, 
  getRouteDetails 
} = usePopularRoutes()

// 路线详情弹窗状态
const showRouteDetail = ref(false)
const selectedRouteDetail = ref(null)
const waypointsLoading = ref(false)
const waypointsError = ref(null)

// 检查是否可以在地图上显示
const canShowOnMap = computed(() => {
  return selectedRouteDetail.value?.waypoints?.some(wp => 
    wp.longitude && wp.latitude && 
    !isNaN(wp.longitude) && !isNaN(wp.latitude)
  )
})


// 处理路线卡片点击
const handleRouteClick = async (route) => {
  console.log('点击路线:', route)
  
  // 记录热门路线点击行为
  try {
    await simplifiedAnalytics.trackPopularRouteClick({
      route_id: route.id,
      route_name: route.title,
      route_region: route.region,
      route_distance: route.distance,
      route_duration: route.duration,
      click_source: 'popular_routes'
    })
  } catch (error) {
    console.warn('记录热门路线点击失败:', error)
  }
  
  // 显示详情弹窗
  showRouteDetail.value = true
  selectedRouteDetail.value = { route: null, waypoints: [] }
  waypointsLoading.value = true
  waypointsError.value = null
  
  try {
    // 获取路线途径点详情
    const response = await axios.get(`${API_BASE_URL}/routes/${route.id}/waypoints`)
    if (response.data.success) {
      selectedRouteDetail.value = response.data.data
      console.log('获取途径点详情成功:', response.data.data)
    } else {
      throw new Error(response.data.message || '获取途径点详情失败')
    }
  } catch (error) {
    console.error('获取途径点详情失败:', error)
    waypointsError.value = error.message || '获取途径点详情失败'
    // 如果失败，至少显示基本路线信息
    selectedRouteDetail.value = { 
      route: {
        id: route.id,
        name: route.title,
        region: route.region,
        distance_km: parseInt(route.distance),
        estimated_days: parseInt(route.duration),
        road_condition: route.roadCondition,
        remarks: route.remarks,
        precautions: route.precautions
      }, 
      waypoints: [] 
    }
  } finally {
    waypointsLoading.value = false
  }
}

// 关闭路线详情
const closeRouteDetail = () => {
  showRouteDetail.value = false
  selectedRouteDetail.value = null
  waypointsError.value = null
}

// 在地图上查看路线
const viewRouteOnMap = () => {
  console.log('=== 点击了在地图上查看路线按钮 ===')
  console.log('selectedRouteDetail.value:', selectedRouteDetail.value)
  console.log('canShowOnMap.value:', canShowOnMap.value)
  
  if (!canShowOnMap.value) {
    console.warn('该路线无法在地图上显示，缺少有效的经纬度信息')
    console.warn('selectedRouteDetail.value?.waypoints:', selectedRouteDetail.value?.waypoints)
    return
  }
  
  // 首先清除之前的轨迹回放（如果有的话）
  console.log('清除之前的轨迹回放...')
  emit('clear-previous-displays')
  
  console.log('使用导航功能显示路线:', selectedRouteDetail.value)
  
  // 获取有效的途径点
  const validWaypoints = selectedRouteDetail.value.waypoints.filter(wp => {
    const hasLng = wp.longitude !== null && wp.longitude !== undefined && wp.longitude !== '';
    const hasLat = wp.latitude !== null && wp.latitude !== undefined && wp.latitude !== '';
    const validLng = hasLng && !isNaN(parseFloat(wp.longitude));
    const validLat = hasLat && !isNaN(parseFloat(wp.latitude));
    return validLng && validLat;
  })
  
  if (validWaypoints.length < 2) {
    console.warn('有效途径点不足，无法使用导航功能')
    return
  }
  
  // 验证路线数据完整性
  if (!selectedRouteDetail.value.route) {
    console.error('路线数据不完整，无法进行导航')
    alert('路线数据不完整，请重新选择路线')
    return
  }
  
  // 发射使用导航功能的事件到父组件
  const routeData = {
    route: selectedRouteDetail.value.route,
    waypoints: selectedRouteDetail.value.waypoints,
    validWaypoints: validWaypoints,
    startPoint: validWaypoints[0],
    endPoint: validWaypoints[validWaypoints.length - 1]
  }
  
  console.log('=== 发射 route-navigate-with-markers 事件 ===')
  console.log('事件数据:', routeData)
  
  emit('route-navigate-with-markers', routeData)
  
  // 保留原有的route-selected事件以保持兼容性
  emit('route-selected', {
    id: selectedRouteDetail.value.route?.id,
    title: selectedRouteDetail.value.route?.name || '未知路线',
    region: selectedRouteDetail.value.route?.region || '未知',
    distance: selectedRouteDetail.value.route?.distance_km ? `${selectedRouteDetail.value.route.distance_km}km` : '未知',
    duration: selectedRouteDetail.value.route?.estimated_days ? `${selectedRouteDetail.value.route.estimated_days}天` : '未知',
    roadCondition: selectedRouteDetail.value.route?.road_condition || '未知',
    waypoints: selectedRouteDetail.value.waypoints
  })
  
  // 关闭弹窗
  closeRouteDetail()
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

/* 路线详情弹窗样式 */
.route-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.route-detail-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  animation: modalShow 0.3s ease;
}

@keyframes modalShow {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.route-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e9ecef;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.route-detail-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 20px;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  color: #6c757d;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #dc3545;
}

.route-detail-body {
  padding: 24px;
  max-height: calc(80vh - 80px);
  overflow-y: auto;
}

/* 路线基本信息 */
.route-basic-info {
  margin-bottom: 24px;
}

.info-item {
  display: flex;
  margin-bottom: 12px;
  align-items: flex-start;
}

.info-item .label {
  font-weight: 600;
  color: #495057;
  min-width: 80px;
  margin-right: 12px;
}

.info-item .value {
  color: #2c3e50;
  flex: 1;
  line-height: 1.5;
}

/* 途径点部分 */
.waypoints-section {
  margin-bottom: 24px;
}

.waypoints-section h4 {
  margin: 0 0 16px 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
  padding-bottom: 8px;
  border-bottom: 2px solid #4CAF50;
}

.waypoints-loading,
.waypoints-error,
.waypoints-empty {
  text-align: center;
  padding: 20px;
  color: #6c757d;
}

.waypoints-error {
  color: #dc3545;
}

.waypoints-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.waypoint-item {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #6c757d;
  transition: all 0.2s ease;
}

.waypoint-item.start-point {
  border-left-color: #28a745;
  background: linear-gradient(135deg, #e8f5e9 0%, #f8f9fa 100%);
}

.waypoint-item.end-point {
  border-left-color: #dc3545;
  background: linear-gradient(135deg, #ffebee 0%, #f8f9fa 100%);
}

.waypoint-index {
  margin-right: 16px;
  flex-shrink: 0;
}

.point-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-weight: 600;
  font-size: 14px;
  color: white;
}

.point-label.start {
  background: #28a745;
}

.point-label.end {
  background: #dc3545;
}

.point-label.via {
  background: #6c757d;
}

.waypoint-info {
  flex: 1;
}

.waypoint-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
  font-size: 16px;
}

.waypoint-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
  color: #6c757d;
}

.waypoint-details span {
  line-height: 1.4;
}

.waypoint-details .description {
  color: #495057;
  font-style: italic;
}

.waypoint-details .nearest-station {
  color: #28a745;
  font-weight: 500;
}

/* 操作按钮 */
.route-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid #e9ecef;
}

.action-button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.action-button.view-on-map {
  background: #4CAF50;
  color: white;
}

.action-button.view-on-map:hover:not(:disabled) {
  background: #45a049;
  transform: translateY(-1px);
}

.action-button.view-on-map:disabled {
  background: #ccc;
  cursor: not-allowed;
}


.action-button.close-detail {
  background: #6c757d;
  color: white;
}

.action-button.close-detail:hover {
  background: #5a6268;
  transform: translateY(-1px);
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
  
  .route-detail-content {
    width: 95%;
    max-height: 90vh;
  }
  
  .route-detail-header {
    padding: 16px 20px;
  }
  
  .route-detail-body {
    padding: 20px;
  }
  
  .waypoint-item {
    flex-direction: column;
    gap: 12px;
  }
  
  .waypoint-index {
    margin-right: 0;
    align-self: flex-start;
  }
  
  .route-actions {
    flex-direction: column;
  }
  
  .action-button {
    width: 100%;
  }
}
</style>
