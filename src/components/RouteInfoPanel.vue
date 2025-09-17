<template>
  <div class="route-info-panel" :class="{ 'collapsed': isCollapsed }">
    <!-- 面板头部 -->
    <div class="panel-header" @click="togglePanel">
      <div class="panel-title">
        <svg class="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M9 11H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-2"/>
          <path d="M13 11V7a4 4 0 0 0-8 0v4"/>
        </svg>
        <span>{{ routeData?.route?.name || '热门路线' }}</span>
      </div>
      <button class="collapse-btn" :title="isCollapsed ? '展开面板' : '收起面板'">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polyline :points="isCollapsed ? '6,9 12,15 18,9' : '18,15 12,9 6,15'"/>
        </svg>
      </button>
    </div>

    <!-- 面板内容 -->
    <div v-show="!isCollapsed" class="panel-content">
      <!-- 路线基本信息 -->
      <div v-if="routeData?.route" class="route-basic-info">
        <h4>路线信息</h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">地区:</span>
            <span class="value">{{ routeData.route.region || '未知' }}</span>
          </div>
          <div class="info-item">
            <span class="label">当前天气:</span>
            <span class="value">
              <span class="weather-text">{{ currentWeatherText }}</span>
            </span>
          </div>
          <div class="info-item">
            <span class="label">预计天数:</span>
            <span class="value">{{ formatDays(routeData.route.estimated_days) }}</span>
          </div>
          <div class="info-item">
            <span class="label">路况:</span>
            <span class="value">{{ routeData.route.road_condition || '良好' }}</span>
          </div>
        </div>
        
        <div v-if="routeData.route.remarks" class="route-remarks">
          <h5>备注</h5>
          <p>{{ routeData.route.remarks }}</p>
        </div>
      </div>

      <!-- 导航信息 -->
      <div v-if="navigationInfo" class="navigation-info">
        <h4>导航信息</h4>
        
        <!-- 路线策略选择器 -->
        <div class="policy-selector">
          <label class="policy-label">路线策略:</label>
          <select v-model="selectedPolicy" class="policy-select" @change="onPolicyChange">
            <option value="0">推荐路线及最快路线综合</option>
            <option value="1">推荐路线 (平衡距离与路况)</option>
            <option value="2">最快路线 (优先速度)</option>
          </select>
          <div class="policy-description">
            <span class="description-text">{{ getPolicyDescription(selectedPolicy) }}</span>
          </div>
        </div>
        
        <div class="nav-stats">
          <div class="nav-stat-item success">
            <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
            </svg>
            <div class="stat-content">
              <span class="stat-label">规划距离</span>
              <span class="stat-value">{{ formatDistance(navigationInfo.distance) }}</span>
            </div>
          </div>
          <div class="nav-stat-item info">
            <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
            <div class="stat-content">
              <span class="stat-label">预计时间</span>
              <span class="stat-value">{{ formatTime(navigationInfo.time) }}</span>
            </div>
          </div>
        </div>
        
        <div class="navigation-status">
          <span class="status-badge success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
            导航规划成功
          </span>
        </div>
      </div>

      <!-- 途径点信息 -->
      <div v-if="routeData?.waypoints?.length" class="waypoints-info">
        <h4>途径地点 ({{ routeData.waypoints.length }})</h4>
        <div class="waypoints-list">
          <!-- 起点 -->
          <div v-if="routeData.waypoints[0]" class="waypoint-container">
            <div class="waypoint-item start">
              <span class="waypoint-label">起</span>
              <div class="waypoint-details">
                <div class="waypoint-name">{{ routeData.waypoints[0].name || '起点' }}</div>
                <div v-if="routeData.waypoints[0].description" class="waypoint-description">
                  {{ routeData.waypoints[0].description }}
                </div>
                <div v-if="routeData.waypoints[0].address" class="waypoint-address">
                  <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span>{{ routeData.waypoints[0].address }}</span>
                </div>
                <div v-if="routeData.waypoints[0].estimated_time" class="waypoint-time">
                  <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                  <span>停留时间: {{ routeData.waypoints[0].estimated_time }}</span>
                </div>
              </div>
            </div>
            <!-- 起点到下一点的距离 -->
            <div 
              v-if="routeData.waypoints.length > 1 && calculateDistance(routeData.waypoints[0], routeData.waypoints[1])" 
              class="distance-info"
            >
              <div class="distance-line"></div>
              <span class="distance-text">
                {{ calculateDistance(routeData.waypoints[0], routeData.waypoints[1]) }}
              </span>
            </div>
          </div>

          <!-- 中间点展开按钮 -->
          <div v-if="routeData.waypoints.length > 2" class="waypoint-expand-btn-container">
            <button 
              class="waypoint-expand-btn"
              @click="toggleWaypoints"
              :class="{ 'expanded': waypointsExpanded }"
            >
              <svg class="expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline :points="waypointsExpanded ? '6,9 12,15 18,9' : '9,18 15,12 9,6'"/>
              </svg>
              <span class="expand-text">
                {{ waypointsExpanded ? '收起' : `${routeData.waypoints.length - 2}个中间点` }}
              </span>
              <svg class="expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline :points="waypointsExpanded ? '18,15 12,9 6,15' : '15,18 9,12 15,6'"/>
              </svg>
            </button>
          </div>

          <!-- 中间途径点（展开时显示） -->
          <div 
            v-for="(waypoint, index) in routeData.waypoints.slice(1, -1)" 
            :key="waypoint.id || (index + 1)"
            v-show="waypointsExpanded"
            class="waypoint-container"
          >
            <div class="waypoint-item via">
              <span class="waypoint-label">{{ index + 1 }}</span>
              <div class="waypoint-details">
                <div class="waypoint-name">{{ waypoint.name || `地点${index + 2}` }}</div>
                <div v-if="waypoint.description" class="waypoint-description">
                  {{ waypoint.description }}
                </div>
                <div v-if="waypoint.address" class="waypoint-address">
                  <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span>{{ waypoint.address }}</span>
                </div>
                <div v-if="waypoint.estimated_time" class="waypoint-time">
                  <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                  <span>停留时间: {{ waypoint.estimated_time }}</span>
                </div>
              </div>
            </div>
            <!-- 中间点到下一点的距离 -->
            <div 
              v-if="calculateDistance(waypoint, routeData.waypoints[index + 2])" 
              class="distance-info"
            >
              <div class="distance-line"></div>
              <span class="distance-text">
                {{ calculateDistance(waypoint, routeData.waypoints[index + 2]) }}
              </span>
            </div>
          </div>

          <!-- 终点前的距离线（当中间点收起时） -->
          <div 
            v-if="!waypointsExpanded && routeData.waypoints.length > 2" 
            class="distance-info"
          >
            <div class="distance-line dotted"></div>
          </div>

          <!-- 终点 -->
          <div v-if="routeData.waypoints[routeData.waypoints.length - 1]" class="waypoint-container">
            <div class="waypoint-item end">
              <span class="waypoint-label">终</span>
              <div class="waypoint-details">
                <div class="waypoint-name">{{ routeData.waypoints[routeData.waypoints.length - 1].name || '终点' }}</div>
                <div v-if="routeData.waypoints[routeData.waypoints.length - 1].description" class="waypoint-description">
                  {{ routeData.waypoints[routeData.waypoints.length - 1].description }}
                </div>
                <div v-if="routeData.waypoints[routeData.waypoints.length - 1].address" class="waypoint-address">
                  <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span>{{ routeData.waypoints[routeData.waypoints.length - 1].address }}</span>
                </div>
                <div v-if="routeData.waypoints[routeData.waypoints.length - 1].estimated_time" class="waypoint-time">
                  <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                  <span>停留时间: {{ routeData.waypoints[routeData.waypoints.length - 1].estimated_time }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="panel-actions">
        <button class="action-btn secondary" @click="$emit('clear-route')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          清除路线
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Props
const props = defineProps({
  routeData: {
    type: Object,
    default: null
  },
  navigationInfo: {
    type: Object,
    default: null
  },
  visible: {
    type: Boolean,
    default: true
  },
  currentWeatherText: {
    type: String,
    default: '获取中...'
  },
  currentPolicy: {
    type: String,
    default: '0'
  }
})

// Emits
const emit = defineEmits(['clear-route', 'policy-change'])

// 响应式数据
const isCollapsed = ref(false)
const waypointsExpanded = ref(false)
const selectedPolicy = ref(props.currentPolicy)


// 方法
const togglePanel = () => {
  isCollapsed.value = !isCollapsed.value
}

const formatDistance = (distance) => {
  if (!distance) return '未知'
  if (typeof distance === 'string') {
    return distance.includes('km') ? distance : `${distance}km`
  }
  if (distance >= 1000) {
    return `${(distance / 1000).toFixed(1)}km`
  }
  return `${Math.round(distance)}m`
}

const formatTime = (time) => {
  if (!time) return '未知'
  if (typeof time === 'string') return time
  
  const hours = Math.floor(time / 3600)
  const minutes = Math.floor((time % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  }
  return `${minutes}分钟`
}

const formatDays = (days) => {
  if (!days) return '未知'
  return typeof days === 'string' ? days : `${days}天`
}

const getWaypointClass = (index) => {
  if (index === 0) return 'start'
  if (index === props.routeData?.waypoints?.length - 1) return 'end'
  return 'via'
}

const getWaypointLabel = (index) => {
  if (index === 0) return '起'
  if (index === props.routeData?.waypoints?.length - 1) return '终'
  return index.toString()
}

const calculateDistance = (waypoint1, waypoint2) => {
  // 只使用导航距离（单位：km）
  if (waypoint1.navigation_distance_km) {
    const distance = parseFloat(waypoint1.navigation_distance_km)
    return isNaN(distance) ? null : `${distance}km`
  }
  
  // 如果没有导航距离，不显示距离
  return null
}

const toggleWaypoints = () => {
  waypointsExpanded.value = !waypointsExpanded.value
}

const getPolicyDescription = (policy) => {
  const descriptions = {
    '0': '综合考虑路线距离、路况和通行速度，提供平衡的骑行方案',
    '1': '优先选择适合骑行的道路，平衡距离与路况条件',
    '2': '以最短时间为目标，优先选择通行速度较快的路线'
  }
  return descriptions[policy] || descriptions['0']
}

const onPolicyChange = () => {
  console.log('RouteInfoPanel 策略变更:', selectedPolicy.value)
  emit('policy-change', selectedPolicy.value)
}

const updatePolicy = (policy) => {
  selectedPolicy.value = policy
}


// 暴露方法
defineExpose({
  togglePanel,
  isCollapsed,
  updatePolicy
})
</script>

<style scoped>
.route-info-panel {
  position: fixed;
  top: 10px;
  left: 10px;
  width: 420px;
  max-height: 85vh;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 1000;
  overflow: hidden;
  transition: all 0.3s ease;
}

.route-info-panel.collapsed {
  height: auto;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  cursor: pointer;
  border-radius: 12px 12px 0 0;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  font-size: 16px;
  font-weight: 600;
}

.title-icon {
  width: 20px;
  height: 20px;
  stroke-width: 2;
}

.collapse-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 6px;
  padding: 6px;
  cursor: pointer;
  color: white;
  transition: all 0.2s ease;
}

.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.collapse-btn svg {
  width: 16px;
  height: 16px;
  stroke-width: 2;
}

.panel-content {
  padding: 20px;
  max-height: calc(85vh - 80px);
  overflow-y: auto;
}

/* 路线基本信息 */
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
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item .label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.info-item .value {
  font-size: 14px;
  color: #2c3e50;
  font-weight: 600;
}

.weather-text {
  color: #2c3e50;
  font-weight: 600;
}

.route-remarks {
  margin-top: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.route-remarks h5 {
  margin: 0 0 8px 0;
  color: #495057;
  font-size: 14px;
}

.route-remarks p {
  margin: 0;
  color: #6c757d;
  font-size: 13px;
  line-height: 1.4;
}

/* 导航信息 */
.navigation-info {
  margin-bottom: 24px;
}

.navigation-info h4 {
  margin: 0 0 16px 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
  padding-bottom: 8px;
  border-bottom: 2px solid #2196F3;
}

/* 策略选择器 */
.policy-selector {
  margin-bottom: 16px;
  padding: 12px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.policy-label {
  display: block;
  font-size: 13px;
  color: #495057;
  font-weight: 600;
  margin-bottom: 8px;
}

.policy-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 13px;
  color: #495057;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 8px center;
  background-repeat: no-repeat;
  background-size: 16px;
  padding-right: 32px;
}

.policy-select:focus {
  outline: none;
  border-color: #2196F3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
}

.policy-select:hover {
  border-color: #adb5bd;
}

.policy-description {
  margin-top: 8px;
  padding: 8px 10px;
  background: rgba(33, 150, 243, 0.05);
  border-radius: 6px;
  border-left: 3px solid #2196F3;
}

.description-text {
  font-size: 11px;
  color: #495057;
  line-height: 1.4;
  display: block;
}

.nav-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.nav-stat-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.nav-stat-item.success {
  background: linear-gradient(135deg, #e8f5e9 0%, #f8f9fa 100%);
  border: 1px solid #c8e6c9;
}

.nav-stat-item.info {
  background: linear-gradient(135deg, #e3f2fd 0%, #f8f9fa 100%);
  border: 1px solid #bbdefb;
}

.stat-icon {
  width: 20px;
  height: 20px;
  stroke-width: 2;
}

.nav-stat-item.success .stat-icon {
  color: #4CAF50;
}

.nav-stat-item.info .stat-icon {
  color: #2196F3;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 11px;
  color: #666;
  font-weight: 500;
}

.stat-value {
  font-size: 14px;
  color: #2c3e50;
  font-weight: 600;
}

.navigation-status {
  display: flex;
  justify-content: center;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.success {
  background: #e8f5e9;
  color: #4CAF50;
  border: 1px solid #c8e6c9;
}

.status-badge svg {
  width: 14px;
  height: 14px;
  stroke-width: 2;
}

/* 途径点信息 */
.waypoints-info {
  margin-bottom: 24px;
}

.waypoints-info h4 {
  margin: 0 0 16px 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
  padding-bottom: 8px;
  border-bottom: 2px solid #FF9800;
}

.waypoints-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.waypoint-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.waypoint-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.waypoint-item.start {
  background: linear-gradient(135deg, #e8f5e9 0%, #f8f9fa 100%);
  border-left: 4px solid #4CAF50;
}

.waypoint-item.end {
  background: linear-gradient(135deg, #ffebee 0%, #f8f9fa 100%);
  border-left: 4px solid #f44336;
}

.waypoint-item.via {
  background: linear-gradient(135deg, #fff3e0 0%, #f8f9fa 100%);
  border-left: 4px solid #FF9800;
}

.waypoint-item.via:hover {
  background: linear-gradient(135deg, #fff3e0 0%, #f0f0f0 100%);
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.2);
}

.waypoint-expand-btn-container {
  display: flex;
  justify-content: center;
  margin: 8px 0;
}

.waypoint-expand-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #fff3e0 0%, #f8f9fa 100%);
  border: 2px solid #FF9800;
  border-radius: 20px;
  color: #FF9800;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.waypoint-expand-btn:hover {
  background: linear-gradient(135deg, #FF9800 0%, #f57c00 100%);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
}

.waypoint-expand-btn.expanded {
  background: linear-gradient(135deg, #e8f5e9 0%, #f8f9fa 100%);
  border-color: #4CAF50;
  color: #4CAF50;
}

.waypoint-expand-btn.expanded:hover {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  border-color: #4CAF50;
  color: white;
}

.expand-icon {
  width: 14px;
  height: 14px;
  stroke-width: 2;
  transition: transform 0.3s ease;
}

.waypoint-expand-btn.expanded .expand-icon {
  transform: rotate(180deg);
}

.expand-text {
  font-weight: 600;
  white-space: nowrap;
}

.distance-line.dotted {
  background: linear-gradient(90deg, transparent 0%, #bbb 20%, transparent 40%, #bbb 60%, transparent 80%, #bbb 100%);
  background-size: 10px 2px;
}

.waypoint-label {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-weight: 600;
  font-size: 12px;
  color: white;
  flex-shrink: 0;
  margin-top: 2px;
}

.waypoint-item.start .waypoint-label {
  background: #4CAF50;
}

.waypoint-item.end .waypoint-label {
  background: #f44336;
}

.waypoint-item.via .waypoint-label {
  background: #FF9800;
}

.waypoint-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.waypoint-name {
  font-size: 14px;
  color: #2c3e50;
  font-weight: 600;
  line-height: 1.3;
  margin-bottom: 6px;
}

.waypoint-description {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
  background: rgba(0, 0, 0, 0.02);
  padding: 6px 8px;
  border-radius: 4px;
}

.waypoint-address,
.waypoint-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #888;
  padding: 4px 0;
}

.info-icon {
  width: 14px;
  height: 14px;
  stroke-width: 2;
  flex-shrink: 0;
}

.distance-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  margin: 4px 0;
}

.distance-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, #ddd 0%, #bbb 50%, #ddd 100%);
  border-radius: 1px;
  position: relative;
}

.distance-line::after {
  content: '';
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid #bbb;
  border-top: 3px solid transparent;
  border-bottom: 3px solid transparent;
}

.distance-text {
  font-size: 11px;
  color: #666;
  background: #f8f9fa;
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid #e9ecef;
  font-weight: 500;
  white-space: nowrap;
}

/* 操作按钮 */
.panel-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid #e9ecef;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn svg {
  width: 16px;
  height: 16px;
  stroke-width: 2;
}

.action-btn.primary {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
}

.action-btn.primary:hover {
  background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
  transform: translateY(-1px);
}

.action-btn.secondary {
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #e9ecef;
}

.action-btn.secondary:hover {
  background: #e9ecef;
  color: #495057;
}

/* 滚动条样式 */
.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .route-info-panel {
    width: calc(100vw - 20px);
    left: 10px;
    right: 10px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .nav-stats {
    flex-direction: column;
  }
  
  .waypoint-item {
    padding: 10px;
  }
  
  .waypoint-details {
    gap: 2px;
  }
  
  .waypoint-expand-btn {
    padding: 6px 12px;
    font-size: 12px;
  }
  
  .expand-icon {
    width: 12px;
    height: 12px;
  }
  
  .distance-info {
    padding: 0 16px;
  }
}

@media (max-width: 480px) {
  .route-info-panel {
    width: calc(100vw - 16px);
    left: 8px;
    right: 8px;
  }
  
  .waypoint-name {
    font-size: 13px;
  }
  
  .waypoint-description {
    font-size: 11px;
  }
  
  .distance-text {
    font-size: 10px;
    padding: 1px 6px;
  }
}
</style>
