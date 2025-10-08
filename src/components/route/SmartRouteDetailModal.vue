<template>
  <div class="smart-route-detail-modal" @click="handleModalClick">
    <div class="modal-content" @click.stop ref="modalContentRef">
      <div class="modal-header" @mousedown="startDrag" @touchstart="startDrag">
        <h3>{{ route?.name || '路线详情' }}</h3>
        <div class="header-controls">
          <span class="drag-hint">可拖动</span>
          <button class="close-button" @click="closeModal">×</button>
        </div>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import simplifiedAnalytics from '@/utils/simplifiedAnalytics'

// 使用相对路径，由 Nginx 代理到后端
const API_BASE_URL = '/api/v1'

// Props
const props = defineProps({
  route: {
    type: Object,
    required: true
  },
  smartParams: {
    type: Object,
    default: () => ({})
  },
  difficultyText: {
    type: String,
    default: 'medium'
  },
  weatherScore: {
    type: Number,
    default: 6
  },
  matchedRoutesCount: {
    type: Number,
    default: 0
  }
})

// Emits
const emit = defineEmits(['close', 'route-selected', 'route-navigate-with-markers', 'clear-previous-displays'])

// 状态管理
const waypoints = ref([])
const waypointsLoading = ref(false)
const waypointsError = ref(null)

// 拖动相关状态
const modalContentRef = ref(null)
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const modalPosition = ref({ x: 0, y: 0 })

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

// 拖动功能
const startDrag = (event) => {
  if (event.target.classList.contains('close-button')) {
    return // 不在关闭按钮上启动拖动
  }
  
  isDragging.value = true
  
  const clientX = event.type === 'touchstart' ? event.touches[0].clientX : event.clientX
  const clientY = event.type === 'touchstart' ? event.touches[0].clientY : event.clientY
  
  const rect = modalContentRef.value.getBoundingClientRect()
  dragOffset.value = {
    x: clientX - rect.left,
    y: clientY - rect.top
  }
  
  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', handleDrag)
  document.addEventListener('touchend', stopDrag)
  
  event.preventDefault()
}

const handleDrag = (event) => {
  if (!isDragging.value) return
  
  const clientX = event.type === 'touchmove' ? event.touches[0].clientX : event.clientX
  const clientY = event.type === 'touchmove' ? event.touches[0].clientY : event.clientY
  
  // 获取父容器（右侧面板）的边界
  const parentContainer = modalContentRef.value.closest('.content-right')
  if (!parentContainer) return
  
  const parentRect = parentContainer.getBoundingClientRect()
  const modalRect = modalContentRef.value.getBoundingClientRect()
  
  // 计算新位置，确保不超出父容器边界
  let newX = clientX - parentRect.left - dragOffset.value.x
  let newY = clientY - parentRect.top - dragOffset.value.y
  
  // 边界检查
  const maxX = parentRect.width - modalRect.width
  const maxY = parentRect.height - modalRect.height
  
  newX = Math.max(0, Math.min(newX, maxX))
  newY = Math.max(0, Math.min(newY, maxY))
  
  modalPosition.value = { x: newX, y: newY }
  
  event.preventDefault()
}

const stopDrag = () => {
  isDragging.value = false
  
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', handleDrag)
  document.removeEventListener('touchend', stopDrag)
}

// 在地图上查看路线
const viewRouteOnMap = async () => {
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
  
  // 记录用户选择了智能匹配的路线（包含完整的匹配参数）
  try {
    // 将中文难度转换为英文
    const difficultyMap = {
      '简单': 'easy',
      '中等': 'medium', 
      '困难': 'hard'
    }
    
    const trackData = {
      preferred_difficulty: difficultyMap[props.difficultyText] || 'medium',
      scenery_preference: props.smartParams?.sceneryPriority ? parseInt(props.smartParams.sceneryPriority) : 7,
      preferred_days_min: props.smartParams?.days ? parseInt(props.smartParams.days) : 3,
      preferred_days_max: props.smartParams?.days ? parseInt(props.smartParams.days) : 3,
      weather_preference: props.weatherScore >= 7 ? 'good' : props.weatherScore >= 4 ? 'fair' : 'poor',
      matched_routes_count: props.matchedRoutesCount || 1, // 智能匹配返回的路线总数
      selected_route_id: props.route?.id,
      selected_route_name: props.route?.name
    }
    
    console.log('📊 智能匹配路线选择记录:', trackData)
    
    await simplifiedAnalytics.trackSmartRouteMatch(trackData)
  } catch (error) {
    console.warn('记录路线选择失败:', error)
  }
  
  // 首先清除之前的轨迹回放（如果有的话）
  console.log('清除之前的轨迹回放...')
  emit('clear-previous-displays')
  
  // 发射使用导航功能的事件到父组件
  const routeData = {
    route: props.route,
    waypoints: waypoints.value,
    validWaypoints: validWaypoints,
    startPoint: validWaypoints[0],
    endPoint: validWaypoints[validWaypoints.length - 1]
  }
  
  console.log('=== 发射 route-navigate-with-markers 事件 ===')
  console.log('事件数据:', routeData)
  
  emit('route-navigate-with-markers', routeData)
  
  // 保留原有的route-selected事件以保持兼容性
  emit('route-selected', {
    id: props.route?.id,
    title: props.route?.name || '未知路线',
    region: props.route?.region || '未知',
    distance: props.route?.distance_km ? `${props.route.distance_km}km` : '未知',
    duration: props.route?.estimated_days ? `${props.route.estimated_days}天` : '未知',
    roadCondition: props.route?.road_condition || '未知',
    waypoints: waypoints.value
  })
  
  closeModal()
}


// 初始化弹窗位置到父容器中心
const initializeModalPosition = () => {
  if (!modalContentRef.value) return
  
  // 获取父容器（右侧面板）的尺寸
  const parentContainer = modalContentRef.value.closest('.content-right')
  if (!parentContainer) return
  
  // 获取遮罩层的内边距
  const modalOverlay = modalContentRef.value.closest('.smart-route-detail-modal')
  const overlayStyle = window.getComputedStyle(modalOverlay)
  const paddingLeft = parseInt(overlayStyle.paddingLeft) || 30
  const paddingTop = parseInt(overlayStyle.paddingTop) || 30
  const paddingRight = parseInt(overlayStyle.paddingRight) || 30
  const paddingBottom = parseInt(overlayStyle.paddingBottom) || 30
  
  // 计算可用空间
  const availableWidth = parentContainer.clientWidth - paddingLeft - paddingRight
  const availableHeight = parentContainer.clientHeight - paddingTop - paddingBottom
  const modalWidth = modalContentRef.value.offsetWidth
  const modalHeight = modalContentRef.value.offsetHeight
  
  // 计算居中位置（相对于遮罩层的内容区域）
  const centerX = Math.max(0, (availableWidth - modalWidth) / 2)
  const centerY = Math.max(0, (availableHeight - modalHeight) / 2)
  
  modalPosition.value = {
    x: centerX,
    y: centerY
  }
  
  console.log('弹窗初始化位置:', {
    parentSize: { width: parentContainer.clientWidth, height: parentContainer.clientHeight },
    modalSize: { width: modalWidth, height: modalHeight },
    position: modalPosition.value
  })
}

// 组件挂载时获取途径点并初始化位置
onMounted(async () => {
  await fetchWaypoints()
  
  // 延迟初始化位置，确保DOM完全渲染
  setTimeout(() => {
    initializeModalPosition()
  }, 100)
})

// 组件卸载时清理事件监听器
onUnmounted(() => {
  stopDrag()
})
</script>

<style scoped>
/* 弹窗遮罩 - 改为相对于父容器定位 */
.smart-route-detail-modal {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(2px);
  animation: modalShow 0.3s ease;
  padding: 30px;
  box-sizing: border-box;
  overflow: hidden;
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
  border-radius: 12px;
  width: calc(100% - 60px);
  max-width: 700px;
  min-width: 600px;
  height: calc(100% - 60px);
  max-height: 650px;
  min-height: 450px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  animation: modalContentShow 0.3s ease;
  display: flex;
  flex-direction: column;
  position: absolute;
  top: v-bind('modalPosition.y + "px"');
  left: v-bind('modalPosition.x + "px"');
  /* 防止内容溢出 */
  contain: layout style;
  border: 1px solid rgba(0, 0, 0, 0.1);
  z-index: 10000;
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
  padding: 16px 20px;
  border-bottom: 1px solid #e9ecef;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  flex-shrink: 0;
  cursor: move;
  user-select: none;
}

.modal-header:active {
  cursor: grabbing;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.drag-hint {
  font-size: 12px;
  opacity: 0.8;
  font-weight: 400;
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
  padding: 20px;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
  /* 自定义滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: #4CAF50 #f1f1f1;
}

/* Webkit 浏览器滚动条样式 */
.modal-body::-webkit-scrollbar {
  width: 6px;
}

.modal-body::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #4CAF50;
  border-radius: 3px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: #45a049;
}

/* 匹配度评分部分 */
.match-score-section {
  margin-bottom: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
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
  margin-bottom: 16px;
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
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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
  margin-bottom: 16px;
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


.action-button.close-modal {
  background: #6c757d;
  color: white;
}

.action-button.close-modal:hover {
  background: #5a6268;
  transform: translateY(-1px);
}

/* 响应式设计 - 针对面板内显示优化 */

/* 面板内弹窗的基础适配 */
@media (max-width: 800px) {
  .modal-content {
    width: calc(100% - 40px);
    max-width: none;
    min-width: 400px;
    height: calc(100% - 40px);
  }
  
  .smart-route-detail-modal {
    padding: 20px;
  }
}

/* 更小面板的适配 */
@media (max-width: 600px) {
  .modal-content {
    width: calc(100% - 20px);
    max-width: none;
    min-width: 350px;
    height: calc(100% - 20px);
  }
  
  .smart-route-detail-modal {
    padding: 10px;
  }
  
  .modal-header {
    padding: 12px 16px;
  }
  
  .modal-header h3 {
    font-size: 16px;
  }
  
  .drag-hint {
    display: none;
  }
  
  .modal-body {
    padding: 16px;
  }
  
  .match-score-section {
    padding: 12px;
    margin-bottom: 12px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .info-item {
    padding: 8px;
    flex-direction: column;
    align-items: flex-start;
  }
  
  .info-item .label {
    margin-bottom: 4px;
    margin-right: 0;
    min-width: auto;
  }
  
  .score-details {
    grid-template-columns: 1fr;
  }
  
  .waypoint-item {
    padding: 10px;
    flex-direction: column;
    gap: 6px;
  }
  
  .waypoint-index {
    margin-right: 0;
    align-self: flex-start;
  }
  
  .modal-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .action-button {
    width: 100%;
    justify-content: center;
    padding: 10px 12px;
    font-size: 13px;
  }
}

/* 更大面板时的优化 */
@media (min-width: 601px) {
  .info-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .score-details {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 超大弹窗时的优化 */
@media (min-width: 801px) {
  .info-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .score-details {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
