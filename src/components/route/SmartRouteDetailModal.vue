<template>
  <div class="smart-route-detail-modal" @click="handleModalClick">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ route?.name || '路线详情' }}</h3>
        <button class="close-button" @click="closeModal">×</button>
      </div>
      
      <div class="modal-body">
        <!-- 匹配度评分展示 -->
        <div class="match-score-section" v-if="route?.match_scores">
          <h4>智能匹配评分</h4>
          <div class="score-breakdown">
            <div class="score-item">
              <span class="score-label">总匹配度</span>
              <div class="score-bar">
                <div class="score-fill" :style="{ width: route.match_score * 10 + '%' }"></div>
                <span class="score-value">{{ route.match_score }}/10</span>
              </div>
            </div>
            <div class="score-details">
              <div class="detail-score">
                <span>风景评分: {{ route.match_scores.scenery_score }}</span>
              </div>
              <div class="detail-score">
                <span>天气评分: {{ route.match_scores.weather_score }}</span>
              </div>
              <div class="detail-score">
                <span>难易度评分: {{ route.match_scores.difficulty_score }}</span>
              </div>
              <div class="detail-score">
                <span>骑行匹配度: {{ route.match_scores.cycling_score }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 路线基本信息 -->
        <div class="route-basic-info">
          <h4>基本信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">地区:</span>
              <span class="value">{{ route?.region || '暂无' }}</span>
            </div>
            <div class="info-item">
              <span class="label">总距离:</span>
              <span class="value">{{ route?.distance_km ? route.distance_km + 'km' : '暂无' }}</span>
            </div>
            <div class="info-item">
              <span class="label">预计天数:</span>
              <span class="value">{{ route?.estimated_days ? route.estimated_days + '天' : '暂无' }}</span>
            </div>
            <div class="info-item">
              <span class="label">路况:</span>
              <span class="value">{{ route?.road_condition || '暂无' }}</span>
            </div>
            <div class="info-item">
              <span class="label">风景评分:</span>
              <span class="value scenic-score">{{ route?.scenery_score || '暂无' }}/10</span>
            </div>
            <div class="info-item">
              <span class="label">路况难度:</span>
              <span class="value difficulty-score">{{ route?.road_difficulty_score || '暂无' }}/10</span>
            </div>
            <div v-if="route?.remarks" class="info-item full-width">
              <span class="label">备注:</span>
              <span class="value">{{ route.remarks }}</span>
            </div>
            <div v-if="route?.precautions" class="info-item full-width">
              <span class="label">注意事项:</span>
              <span class="value">{{ route.precautions }}</span>
            </div>
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
          <div v-else-if="!waypoints || waypoints.length === 0" class="waypoints-empty">
            <p>暂无途径点信息</p>
          </div>
          <div v-else class="waypoints-list">
            <div 
              v-for="(waypoint, index) in waypoints" 
              :key="waypoint.id"
              class="waypoint-item"
              :class="{ 
                'start-point': index === 0, 
                'end-point': index === waypoints.length - 1 
              }"
            >
              <div class="waypoint-index">
                <span v-if="index === 0" class="point-label start">起</span>
                <span v-else-if="index === waypoints.length - 1" class="point-label end">终</span>
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
        <div class="modal-actions">
          <button 
            class="action-button view-on-map" 
            @click="viewRouteOnMap"
            :disabled="!canShowOnMap"
          >
            在地图上查看路线
          </button>
          <button 
            class="action-button trajectory-playback" 
            @click="startTrajectoryPlayback"
            :disabled="!canPlayTrajectory"
          >
            <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
            轨迹回放
          </button>
          <button 
            class="action-button close-modal" 
            @click="closeModal"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:3000/api/v1'

// Props
const props = defineProps({
  route: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['close', 'route-selected', 'trajectory-playback'])

// 状态管理
const waypoints = ref([])
const waypointsLoading = ref(false)
const waypointsError = ref(null)

// 检查是否可以在地图上显示
const canShowOnMap = computed(() => {
  if (!waypoints.value || waypoints.value.length === 0) {
    return false
  }
  
  const hasValidWaypoints = waypoints.value.some(wp => {
    const hasLng = wp.longitude !== null && wp.longitude !== undefined && wp.longitude !== '';
    const hasLat = wp.latitude !== null && wp.latitude !== undefined && wp.latitude !== '';
    const validLng = hasLng && !isNaN(parseFloat(wp.longitude));
    const validLat = hasLat && !isNaN(parseFloat(wp.latitude));
    
    return validLng && validLat;
  })
  
  return hasValidWaypoints
})

// 检查是否可以进行轨迹回放
const canPlayTrajectory = computed(() => {
  if (!waypoints.value || waypoints.value.length < 2) {
    return false
  }
  
  // 检查是否有足够的有效经纬度点
  const validPoints = waypoints.value.filter(wp => {
    const hasLng = wp.longitude !== null && wp.longitude !== undefined && wp.longitude !== '';
    const hasLat = wp.latitude !== null && wp.latitude !== undefined && wp.latitude !== '';
    const validLng = hasLng && !isNaN(parseFloat(wp.longitude));
    const validLat = hasLat && !isNaN(parseFloat(wp.latitude));
    return validLng && validLat;
  })
  
  return validPoints.length >= 2
})

// 获取途径点详情
const fetchWaypoints = async () => {
  if (!props.route?.id) return
  
  waypointsLoading.value = true
  waypointsError.value = null
  
  try {
    const response = await axios.get(`${API_BASE_URL}/routes/${props.route.id}/waypoints`)
    if (response.data.success) {
      waypoints.value = response.data.data.waypoints || []
    } else {
      throw new Error(response.data.message || '获取途径点详情失败')
    }
  } catch (error) {
    waypointsError.value = error.message || '获取途径点详情失败'
    waypoints.value = []
  } finally {
    waypointsLoading.value = false
  }
}

// 关闭弹窗
const closeModal = () => {
  emit('close')
}

// 处理弹窗背景点击
const handleModalClick = (event) => {
  // 点击背景关闭弹窗
  if (event.target === event.currentTarget) {
    closeModal()
  }
}

// 在地图上查看路线
const viewRouteOnMap = () => {
  if (!canShowOnMap.value) {
    alert('该路线缺少有效的经纬度信息，无法在地图上显示')
    return
  }
  
  // 获取有效的途径点
  const validWaypoints = waypoints.value.filter(wp => {
    const hasLng = wp.longitude !== null && wp.longitude !== undefined && wp.longitude !== '';
    const hasLat = wp.latitude !== null && wp.latitude !== undefined && wp.latitude !== '';
    const validLng = hasLng && !isNaN(parseFloat(wp.longitude));
    const validLat = hasLat && !isNaN(parseFloat(wp.latitude));
    
    return validLng && validLat;
  })
  
  if (validWaypoints.length < 2) {
    alert(`有效途径点不足（需要至少2个，当前${validWaypoints.length}个），无法使用导航功能`)
    return
  }
  
  // 验证路线数据完整性
  if (!props.route) {
    alert('路线数据不完整，请重新选择路线')
    return
  }
  
  // 发射路线选择事件
  const routeData = {
    route: props.route,
    waypoints: waypoints.value,
    validWaypoints: validWaypoints,
    startPoint: validWaypoints[0],
    endPoint: validWaypoints[validWaypoints.length - 1]
  }
  
  emit('route-selected', routeData)
  closeModal()
}

// 开始轨迹回放
const startTrajectoryPlayback = () => {
  if (!canPlayTrajectory.value) {
    alert('轨迹回放失败：有效途径点不足（需要至少2个点）')
    return
  }
  
  // 提取有效的轨迹点
  const validWaypoints = waypoints.value.filter(wp => {
    const hasLng = wp.longitude !== null && wp.longitude !== undefined && wp.longitude !== '';
    const hasLat = wp.latitude !== null && wp.latitude !== undefined && wp.latitude !== '';
    const validLng = hasLng && !isNaN(parseFloat(wp.longitude));
    const validLat = hasLat && !isNaN(parseFloat(wp.latitude));
    return validLng && validLat;
  })
  
  // 转换为轨迹回放需要的格式
  const trajectoryPath = validWaypoints.map(wp => {
    const lng = parseFloat(wp.longitude);
    const lat = parseFloat(wp.latitude);
    return [lng, lat];
  })
  
  // 发射轨迹回放事件
  const trajectoryData = {
    route: props.route,
    waypoints: waypoints.value,
    trajectoryPath: trajectoryPath,
    name: props.route?.name || '智能匹配路线轨迹'
  }
  
  emit('trajectory-playback', trajectoryData)
  closeModal()
}

// 组件挂载时获取途径点
onMounted(() => {
  fetchWaypoints()
})
</script>

<style scoped>
/* 弹窗遮罩 */
.smart-route-detail-modal {
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
  animation: modalShow 0.3s ease;
}

@keyframes modalShow {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 弹窗内容 */
.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 900px;
  max-height: 85vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  animation: modalContentShow 0.3s ease;
}

@keyframes modalContentShow {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 弹窗头部 */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e9ecef;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

/* 弹窗主体 */
.modal-body {
  padding: 24px;
  max-height: calc(85vh - 80px);
  overflow-y: auto;
}

/* 匹配度评分部分 */
.match-score-section {
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  border: 2px solid #4CAF50;
}

.match-score-section h4 {
  margin: 0 0 16px 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
}

.score-breakdown .score-item {
  margin-bottom: 16px;
}

.score-label {
  display: block;
  font-weight: 600;
  color: #495057;
  margin-bottom: 8px;
}

.score-bar {
  position: relative;
  height: 24px;
  background: #e9ecef;
  border-radius: 12px;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #45a049);
  border-radius: 12px;
  transition: width 0.6s ease;
}

.score-value {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
}

.score-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
  margin-top: 12px;
}

.detail-score {
  padding: 8px 12px;
  background: rgba(76, 175, 80, 0.1);
  border-radius: 6px;
  font-size: 13px;
  color: #2c3e50;
}

/* 基本信息部分 */
.route-basic-info {
  margin-bottom: 24px;
}

.route-basic-info h4 {
  margin: 0 0 16px 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
  padding-bottom: 8px;
  border-bottom: 2px solid #4CAF50;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.info-item.full-width {
  grid-column: 1 / -1;
  flex-direction: column;
  align-items: flex-start;
}

.info-item .label {
  font-weight: 600;
  color: #495057;
  min-width: 80px;
  margin-right: 8px;
}

.info-item.full-width .label {
  margin-bottom: 4px;
}

.info-item .value {
  color: #2c3e50;
  flex: 1;
  line-height: 1.5;
}

.value.scenic-score {
  color: #4CAF50;
  font-weight: 600;
}

.value.difficulty-score {
  color: #ff9800;
  font-weight: 600;
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

.waypoint-details .description {
  color: #495057;
  font-style: italic;
}

.waypoint-details .nearest-station {
  color: #28a745;
  font-weight: 500;
}

/* 操作按钮 */
.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid #e9ecef;
}

.action-button {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
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

.action-button.trajectory-playback {
  background: #ff6b6b;
  color: white;
}

.action-button.trajectory-playback:hover:not(:disabled) {
  background: #ee5a52;
  transform: translateY(-1px);
}

.action-button.trajectory-playback:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.action-icon {
  width: 16px;
  height: 16px;
  stroke-width: 2;
}

.action-button.close-modal {
  background: #6c757d;
  color: white;
}

.action-button.close-modal:hover {
  background: #5a6268;
  transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    max-height: 90vh;
  }
  
  .modal-header {
    padding: 16px 20px;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .score-details {
    grid-template-columns: 1fr;
  }
  
  .waypoint-item {
    flex-direction: column;
    gap: 12px;
  }
  
  .waypoint-index {
    margin-right: 0;
    align-self: flex-start;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .action-button {
    width: 100%;
    justify-content: center;
  }
}
</style>
