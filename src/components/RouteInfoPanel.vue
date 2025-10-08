<template>
  <div 
    class="route-info-panel" 
    :class="{ 'collapsed': isCollapsed, 'dragging': isDragging, 'resizing': isResizing }"
    :style="panelStyle"
    ref="panelRef"
  >
    <!-- 面板头部 -->
    <div 
      class="panel-header" 
      @mousedown="startDrag"
      @dblclick="togglePanel"
    >
      <div class="panel-title">
        <svg class="drag-handle" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M9 11H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-2"/>
          <path d="M13 11V7a4 4 0 0 0-8 0v4"/>
        </svg>
        <span>{{ routeData?.route?.name || '热门路线' }}</span>
        <div class="panel-controls">
          <button class="control-btn minimize-btn" @click.stop="togglePanel" :title="isCollapsed ? '展开面板' : '收起面板'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline :points="isCollapsed ? '6,9 12,15 18,9' : '18,15 12,9 6,15'"/>
            </svg>
          </button>
          <button class="control-btn reset-btn" @click.stop="resetPosition" title="重置位置和大小">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
              <path d="M3 21v-5h5"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 调整大小手柄 -->
    <div 
      v-show="!isCollapsed"
      class="resize-handles"
    >
      <!-- 四个角的调整手柄 -->
      <div class="resize-handle corner nw" @mousedown="startResize('nw')" title="调整大小"></div>
      <div class="resize-handle corner ne" @mousedown="startResize('ne')" title="调整大小"></div>
      <div class="resize-handle corner sw" @mousedown="startResize('sw')" title="调整大小"></div>
      <div class="resize-handle corner se" @mousedown="startResize('se')" title="调整大小"></div>
      
      <!-- 四个边的调整手柄 -->
      <div class="resize-handle edge n" @mousedown="startResize('n')" title="调整高度"></div>
      <div class="resize-handle edge s" @mousedown="startResize('s')" title="调整高度"></div>
      <div class="resize-handle edge w" @mousedown="startResize('w')" title="调整宽度"></div>
      <div class="resize-handle edge e" @mousedown="startResize('e')" title="调整宽度"></div>
    </div>

    <!-- 面板内容 -->
    <div v-show="!isCollapsed" class="panel-content" :class="{ 'content-hidden': isCollapsed }">
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
        
        <!-- 高程信息显示 -->
        <div v-if="navigationInfo.elevationStats" class="elevation-info">
          <h5>高程信息</h5>
          <div class="elevation-stats">
            <div class="elevation-row">
              <div class="elevation-stat">
                <span class="elevation-label">最高海拔:</span>
                <span class="elevation-value">{{ navigationInfo.elevationStats.maxElevation }}m</span>
              </div>
              <div class="elevation-stat">
                <span class="elevation-label">最低海拔:</span>
                <span class="elevation-value">{{ navigationInfo.elevationStats.minElevation }}m</span>
              </div>
            </div>
            <div class="elevation-row">
              <div class="elevation-stat">
                <span class="elevation-label">平均海拔:</span>
                <span class="elevation-value">{{ navigationInfo.elevationStats.averageElevation }}m</span>
              </div>
              <div class="elevation-stat">
                <span class="elevation-label">高程差:</span>
                <span class="elevation-value">{{ navigationInfo.elevationStats.elevationRange }}m</span>
              </div>
            </div>
            <div class="elevation-row">
              <div class="elevation-stat">
                <span class="elevation-label">累计爬升:</span>
                <span class="elevation-value climb">+{{ navigationInfo.elevationStats.totalAscent }}m</span>
              </div>
              <div class="elevation-stat">
                <span class="elevation-label">累计下降:</span>
                <span class="elevation-value descent">-{{ navigationInfo.elevationStats.totalDescent }}m</span>
              </div>
            </div>
          </div>
          
          <!-- 高程折线图 -->
          <div class="elevation-chart-section">
            <ElevationChart 
              :elevation-data="navigationInfo.elevationData || []"
              :loading="elevationLoading"
            />
          </div>
        </div>
        
        <!-- 高程加载状态 -->
        <div v-else-if="elevationLoading" class="elevation-loading">
          <h5>高程信息</h5>
          <div class="loading-content">
            <svg class="loading-spinner" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" opacity="0.25"/>
              <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor"/>
            </svg>
            <span class="loading-text">正在获取高程数据...</span>
          </div>
          <div class="loading-hint">
            <span class="hint-text">🏔️ 正在分析路线海拔信息，请稍候</span>
          </div>
        </div>
      </div>

      <!-- 途径点信息 -->
      <div v-if="routeData?.waypoints?.length" class="waypoints-info">
        <h4>途径地点 ({{ routeData.waypoints.length }})</h4>
        <div class="waypoints-list">
          <!-- 起点 -->
          <div v-if="routeData.waypoints[0]" class="waypoint-container">
            <div class="waypoint-item start" @click="handleWaypointClick(0)">
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
              <!-- 导航按钮 -->
              <div v-if="routeData.waypoints.length > 1" class="waypoint-actions">
                <button 
                  class="nav-btn" 
                  @click.stop="navigateToNext(0)"
                  :title="`导航到${routeData.waypoints[1]?.name || '下一点'}`"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
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
            <div class="waypoint-item via" @click="handleWaypointClick(index + 1)">
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
              <!-- 导航按钮 -->
              <div class="waypoint-actions">
                <button 
                  v-if="index > 0"
                  class="nav-btn prev" 
                  @click.stop="navigateToPrev(index + 1)"
                  :title="`导航到${routeData.waypoints[index]?.name || '上一点'}`"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </button>
                <button 
                  v-if="index + 2 < routeData.waypoints.length"
                  class="nav-btn next" 
                  @click.stop="navigateToNext(index + 1)"
                  :title="`导航到${routeData.waypoints[index + 2]?.name || '下一点'}`"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
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
            <div class="waypoint-item end" @click="handleWaypointClick(routeData.waypoints.length - 1)">
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
              <!-- 导航按钮 -->
              <div v-if="routeData.waypoints.length > 1" class="waypoint-actions">
                <button 
                  class="nav-btn prev" 
                  @click.stop="navigateToPrev(routeData.waypoints.length - 1)"
                  :title="`从${routeData.waypoints[routeData.waypoints.length - 2]?.name || '上一点'}导航到此`"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </button>
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
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import ElevationChart from './ElevationChart.vue'

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
  elevationLoading: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['clear-route', 'waypoint-navigate', 'waypoint-click'])

// 响应式数据
const isCollapsed = ref(false)
const waypointsExpanded = ref(false)

// 拖拽和调整大小相关状态
const panelRef = ref(null)
const isDragging = ref(false)
const isResizing = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const resizeDirection = ref('')

// 面板位置和大小状态
const panelPosition = ref({
  x: 20,
  y: 20,
  width: 480,
  height: 600
})

// 默认配置
const defaultConfig = {
  x: 20,
  y: 20,
  width: 480,
  height: 600,
  minWidth: 360,
  minHeight: 400,
  maxWidth: 800,
  maxHeight: 900
}

// 计算面板样式
const panelStyle = computed(() => ({
  left: `${panelPosition.value.x}px`,
  top: `${panelPosition.value.y}px`,
  width: `${panelPosition.value.width}px`,
  height: isCollapsed.value ? '68px' : `${panelPosition.value.height}px`,
  position: 'fixed',
  zIndex: isDragging.value || isResizing.value ? 1100 : 1000
}))


// 拖拽功能
const startDrag = (event) => {
  if (event.target.closest('.control-btn')) {
    return // 如果点击的是控制按钮，不开始拖拽
  }
  
  isDragging.value = true
  dragStartX.value = event.clientX - panelPosition.value.x
  dragStartY.value = event.clientY - panelPosition.value.y
  
  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', stopDrag)
  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'grabbing'
  
  event.preventDefault()
}

const handleDrag = (event) => {
  if (!isDragging.value) return
  
  const newX = event.clientX - dragStartX.value
  const newY = event.clientY - dragStartY.value
  
  // 边界检查
  const maxX = window.innerWidth - panelPosition.value.width
  const maxY = window.innerHeight - (isCollapsed.value ? 68 : panelPosition.value.height)
  
  panelPosition.value.x = Math.max(0, Math.min(newX, maxX))
  panelPosition.value.y = Math.max(0, Math.min(newY, maxY))
}

const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.body.style.userSelect = ''
  document.body.style.cursor = ''
}

// 调整大小功能
const startResize = (direction) => {
  isResizing.value = true
  resizeDirection.value = direction
  
  const startX = event.clientX
  const startY = event.clientY
  const startWidth = panelPosition.value.width
  const startHeight = panelPosition.value.height
  const startLeft = panelPosition.value.x
  const startTop = panelPosition.value.y
  
  const handleResize = (event) => {
    if (!isResizing.value) return
    
    const deltaX = event.clientX - startX
    const deltaY = event.clientY - startY
    
    let newWidth = startWidth
    let newHeight = startHeight
    let newX = startLeft
    let newY = startTop
    
    // 根据调整方向计算新的尺寸和位置
    if (direction.includes('e')) {
      newWidth = Math.max(defaultConfig.minWidth, Math.min(defaultConfig.maxWidth, startWidth + deltaX))
    }
    if (direction.includes('w')) {
      newWidth = Math.max(defaultConfig.minWidth, Math.min(defaultConfig.maxWidth, startWidth - deltaX))
      newX = startLeft + (startWidth - newWidth)
    }
    if (direction.includes('s')) {
      newHeight = Math.max(defaultConfig.minHeight, Math.min(defaultConfig.maxHeight, startHeight + deltaY))
    }
    if (direction.includes('n')) {
      newHeight = Math.max(defaultConfig.minHeight, Math.min(defaultConfig.maxHeight, startHeight - deltaY))
      newY = startTop + (startHeight - newHeight)
    }
    
    // 边界检查
    if (newX < 0) {
      newWidth += newX
      newX = 0
    }
    if (newY < 0) {
      newHeight += newY
      newY = 0
    }
    if (newX + newWidth > window.innerWidth) {
      newWidth = window.innerWidth - newX
    }
    if (newY + newHeight > window.innerHeight) {
      newHeight = window.innerHeight - newY
    }
    
    panelPosition.value.width = newWidth
    panelPosition.value.height = newHeight
    panelPosition.value.x = newX
    panelPosition.value.y = newY
  }
  
  const stopResize = () => {
    isResizing.value = false
    resizeDirection.value = ''
    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', stopResize)
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
  }
  
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.userSelect = 'none'
  
  event.preventDefault()
  event.stopPropagation()
}

// 重置位置和大小
const resetPosition = () => {
  panelPosition.value = { ...defaultConfig }
}

// 智能定位（避免超出屏幕）
const adjustPosition = () => {
  const maxX = window.innerWidth - panelPosition.value.width
  const currentHeight = isCollapsed.value ? 68 : panelPosition.value.height
  const maxY = window.innerHeight - currentHeight
  
  if (panelPosition.value.x > maxX) {
    panelPosition.value.x = Math.max(0, maxX)
  }
  if (panelPosition.value.y > maxY) {
    panelPosition.value.y = Math.max(0, maxY)
  }
}

// 方法
const togglePanel = () => {
  isCollapsed.value = !isCollapsed.value
  
  // 展开时调整位置以确保不超出屏幕
  if (!isCollapsed.value) {
    nextTick(() => {
      adjustPosition()
    })
  }
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


// 处理途径点点击
const handleWaypointClick = (index) => {
  console.log('点击途径点:', index, props.routeData?.waypoints?.[index])
  emit('waypoint-click', {
    index,
    waypoint: props.routeData?.waypoints?.[index]
  })
}

// 导航到下一个途径点
const navigateToNext = (currentIndex) => {
  const nextIndex = currentIndex + 1
  if (nextIndex < props.routeData?.waypoints?.length) {
    const startWaypoint = props.routeData.waypoints[currentIndex]
    const endWaypoint = props.routeData.waypoints[nextIndex]
    
    console.log('导航到下一点:', { currentIndex, nextIndex, startWaypoint, endWaypoint })
    
    emit('waypoint-navigate', {
      type: 'next',
      startIndex: currentIndex,
      endIndex: nextIndex,
      startWaypoint,
      endWaypoint,
      direction: 'forward'
    })
  }
}

// 导航到上一个途径点
const navigateToPrev = (currentIndex) => {
  const prevIndex = currentIndex - 1
  if (prevIndex >= 0) {
    const startWaypoint = props.routeData.waypoints[prevIndex]
    const endWaypoint = props.routeData.waypoints[currentIndex]
    
    console.log('导航到上一点:', { currentIndex, prevIndex, startWaypoint, endWaypoint })
    
    emit('waypoint-navigate', {
      type: 'prev',
      startIndex: prevIndex,
      endIndex: currentIndex,
      startWaypoint,
      endWaypoint,
      direction: 'backward'
    })
  }
}

// 窗口大小变化处理
const handleWindowResize = () => {
  adjustPosition()
}

// 生命周期钩子
onMounted(() => {
  window.addEventListener('resize', handleWindowResize)
  
  // 初始位置调整
  nextTick(() => {
    adjustPosition()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleWindowResize)
  
  // 清理事件监听器
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.body.style.userSelect = ''
  document.body.style.cursor = ''
})

// 暴露方法
defineExpose({
  togglePanel,
  isCollapsed,
  resetPosition,
  panelPosition
})
</script>

<style scoped>
.route-info-panel {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 16px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(12px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  overflow: hidden;
  transition: box-shadow 0.3s ease, transform 0.2s ease, height 0.3s ease;
  user-select: none;
  min-width: 360px;
  min-height: 400px;
}

.route-info-panel:hover {
  box-shadow: 0 16px 64px rgba(0, 0, 0, 0.2);
}

.route-info-panel.dragging {
  box-shadow: 0 20px 80px rgba(0, 0, 0, 0.25);
  transform: rotate(1deg);
  z-index: 1100 !important;
}

.route-info-panel.resizing {
  box-shadow: 0 16px 64px rgba(76, 175, 80, 0.3);
  border-color: rgba(76, 175, 80, 0.5);
}

.route-info-panel.collapsed {
  min-height: 68px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.route-info-panel.collapsed:hover {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.16);
}

/* 收起状态下的特殊样式 */
.route-info-panel.collapsed .panel-header {
  border-radius: 14px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  cursor: grab;
  border-radius: 14px 14px 0 0;
  position: relative;
  transition: all 0.2s ease;
}

.panel-header:active {
  cursor: grabbing;
}

.panel-header:hover {
  background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
}

.panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
  font-size: 16px;
  font-weight: 600;
}

.drag-handle {
  width: 20px;
  height: 20px;
  stroke-width: 2;
  opacity: 0.9;
  transition: opacity 0.2s ease;
}

.panel-header:hover .drag-handle {
  opacity: 1;
}

.panel-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.control-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  color: white;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}

.control-btn:active {
  transform: scale(0.95);
}

.control-btn svg {
  width: 16px;
  height: 16px;
  stroke-width: 2;
}

.minimize-btn svg {
  transition: transform 0.3s ease;
}

.reset-btn:hover {
  background: rgba(255, 193, 7, 0.3);
}

/* 调整大小手柄 */
.resize-handles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.resize-handle {
  position: absolute;
  pointer-events: auto;
  transition: all 0.2s ease;
}

/* 角落调整手柄 */
.resize-handle.corner {
  width: 12px;
  height: 12px;
  background: rgba(76, 175, 80, 0.8);
  border: 2px solid rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  opacity: 0;
  transition: all 0.2s ease;
}

.route-info-panel:hover .resize-handle.corner {
  opacity: 1;
}

.resize-handle.corner:hover {
  background: rgba(76, 175, 80, 1);
  transform: scale(1.2);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.4);
}

.resize-handle.nw {
  top: -6px;
  left: -6px;
  cursor: nw-resize;
}

.resize-handle.ne {
  top: -6px;
  right: -6px;
  cursor: ne-resize;
}

.resize-handle.sw {
  bottom: -6px;
  left: -6px;
  cursor: sw-resize;
}

.resize-handle.se {
  bottom: -6px;
  right: -6px;
  cursor: se-resize;
}

/* 边缘调整手柄 */
.resize-handle.edge {
  background: rgba(76, 175, 80, 0.6);
  opacity: 0;
  transition: all 0.2s ease;
}

.route-info-panel:hover .resize-handle.edge {
  opacity: 1;
}

.resize-handle.edge:hover {
  background: rgba(76, 175, 80, 0.8);
}

.resize-handle.n {
  top: -3px;
  left: 20px;
  right: 20px;
  height: 6px;
  cursor: n-resize;
  border-radius: 3px;
}

.resize-handle.s {
  bottom: -3px;
  left: 20px;
  right: 20px;
  height: 6px;
  cursor: s-resize;
  border-radius: 3px;
}

.resize-handle.w {
  left: -3px;
  top: 20px;
  bottom: 20px;
  width: 6px;
  cursor: w-resize;
  border-radius: 3px;
}

.resize-handle.e {
  right: -3px;
  top: 20px;
  bottom: 20px;
  width: 6px;
  cursor: e-resize;
  border-radius: 3px;
}

.panel-content {
  padding: 24px;
  height: calc(100% - 68px);
  overflow-y: auto;
  overflow-x: hidden;
  transition: opacity 0.3s ease, transform 0.3s ease;
  opacity: 1;
  transform: translateY(0);
}

.panel-content.content-hidden {
  opacity: 0;
  transform: translateY(-10px);
  pointer-events: none;
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


/* 高程信息样式 */
.elevation-info {
  margin-top: 16px;
  padding: 12px;
  background: linear-gradient(135deg, #e8f5e9 0%, #f8f9fa 100%);
  border-radius: 8px;
  border: 1px solid #c8e6c9;
}

.elevation-info h5 {
  margin: 0 0 12px 0;
  color: #2c3e50;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.elevation-info h5::before {
  content: '🏔️';
  font-size: 16px;
}

.elevation-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.elevation-row {
  display: flex;
  gap: 12px;
}

.elevation-stat {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 6px;
  border: 1px solid rgba(76, 175, 80, 0.2);
}

.elevation-label {
  font-size: 11px;
  color: #666;
  font-weight: 500;
}

.elevation-value {
  font-size: 12px;
  color: #2c3e50;
  font-weight: 600;
}

.elevation-value.climb {
  color: #f44336;
}

.elevation-value.descent {
  color: #4CAF50;
}

/* 高程图表区域 */
.elevation-chart-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(76, 175, 80, 0.2);
}

/* 高程加载状态样式 */
.elevation-loading {
  margin-top: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #f0f8ff 0%, #f8f9fa 100%);
  border-radius: 8px;
  border: 1px solid #bbdefb;
  text-align: center;
}

.elevation-loading h5 {
  margin: 0 0 12px 0;
  color: #2c3e50;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.loading-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 12px;
  color: #2196F3;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 14px;
  font-weight: 500;
  color: #2196F3;
}

.loading-hint {
  padding: 8px 12px;
  background: rgba(33, 150, 243, 0.1);
  border-radius: 6px;
  border-left: 3px solid #2196F3;
}

.loading-hint .hint-text {
  font-size: 12px;
  color: #1976D2;
  line-height: 1.4;
  display: block;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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
  cursor: pointer;
  position: relative;
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

/* 途径点导航按钮样式 */
.waypoint-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-left: auto;
  opacity: 0;
  transition: all 0.2s ease;
}

.waypoint-item:hover .waypoint-actions {
  opacity: 1;
}

.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: rgba(76, 175, 80, 0.1);
  color: #4CAF50;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
}

.nav-btn:hover {
  background: #4CAF50;
  color: white;
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.nav-btn.prev {
  background: rgba(255, 152, 0, 0.1);
  color: #FF9800;
}

.nav-btn.prev:hover {
  background: #FF9800;
  color: white;
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
}

.nav-btn.next {
  background: rgba(33, 150, 243, 0.1);
  color: #2196F3;
}

.nav-btn.next:hover {
  background: #2196F3;
  color: white;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
}

.nav-btn svg {
  width: 12px;
  height: 12px;
  stroke-width: 2;
}

.nav-btn:active {
  transform: scale(0.95);
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
    min-width: 320px;
    max-width: calc(100vw - 20px);
  }
  
  .panel-header {
    padding: 12px 16px;
  }
  
  .panel-title {
    font-size: 14px;
  }
  
  .drag-handle {
    width: 18px;
    height: 18px;
  }
  
  .control-btn {
    padding: 6px;
  }
  
  .control-btn svg {
    width: 14px;
    height: 14px;
  }
  
  .panel-content {
    padding: 16px;
    height: calc(100% - 56px);
  }
  
  .info-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .nav-stats {
    flex-direction: column;
    gap: 8px;
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
  
  /* 移动端调整手柄优化 */
  .resize-handle.corner {
    width: 16px;
    height: 16px;
  }
  
  .resize-handle.edge {
    opacity: 0.3;
  }
  
  .route-info-panel:hover .resize-handle.edge {
    opacity: 0.6;
  }
}

@media (max-width: 480px) {
  .route-info-panel {
    min-width: 280px;
    max-width: calc(100vw - 16px);
  }
  
  .panel-header {
    padding: 10px 12px;
  }
  
  .panel-title {
    font-size: 13px;
    gap: 8px;
  }
  
  .panel-content {
    padding: 12px;
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
  
  /* 超小屏幕调整手柄 */
  .resize-handle.corner {
    width: 20px;
    height: 20px;
  }
  
  .resize-handle.edge {
    opacity: 0.5;
  }
}
</style>
