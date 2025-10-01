<template>
  <div class="cycling-navigation">
    <!-- 导航控制面板 -->
    <div class="navigation-panel" :class="{ 'collapsed': isPanelCollapsed }">
      <!-- 面板头部 -->
      <div class="panel-header">
        <h3 class="panel-title">
          <svg class="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10,9 9,9 8,9"/>
          </svg>
          骑行导航
        </h3>
        <button 
          class="collapse-btn" 
          @click="togglePanel"
          :title="isPanelCollapsed ? '展开面板' : '收起面板'"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline :points="isPanelCollapsed ? '9,18 15,12 9,6' : '15,18 9,12 15,6'"/>
          </svg>
        </button>
      </div>

      <!-- 面板内容 -->
      <div class="panel-content" v-show="!isPanelCollapsed">
        <!-- 路线规划表单 -->
        <div class="route-form">
          <div class="search-mode-selector">
            <label class="mode-label">搜索模式:</label>
            <div class="mode-buttons">
              <button 
                class="mode-btn" 
                :class="{ active: searchMode === 'coordinates' }"
                @click="setSearchMode('coordinates')"
              >
                经纬度
              </button>
              <button 
                class="mode-btn" 
                :class="{ active: searchMode === 'keyword' }"
                @click="setSearchMode('keyword')"
              >
                地点名称
              </button>
            </div>
          </div>

          <!-- 经纬度模式 -->
          <div v-if="searchMode === 'coordinates'" class="coordinates-mode">
            <div class="input-group">
              <label>起点坐标:</label>
              <div class="coordinate-inputs">
                <input 
                  v-model="startCoordinates.lng" 
                  type="number" 
                  step="any"
                  placeholder="经度" 
                  class="coordinate-input"
                />
                <input 
                  v-model="startCoordinates.lat" 
                  type="number" 
                  step="any"
                  placeholder="纬度" 
                  class="coordinate-input"
                />
              </div>
            </div>
            <div class="input-group">
              <label>终点坐标:</label>
              <div class="coordinate-inputs">
                <input 
                  v-model="endCoordinates.lng" 
                  type="number" 
                  step="any"
                  placeholder="经度" 
                  class="coordinate-input"
                />
                <input 
                  v-model="endCoordinates.lat" 
                  type="number" 
                  step="any"
                  placeholder="纬度" 
                  class="coordinate-input"
                />
              </div>
            </div>
          </div>

          <!-- 地点名称模式 -->
          <div v-if="searchMode === 'keyword'" class="keyword-mode">
            <div class="input-group">
              <label>起点:</label>
              <div class="location-input-group">
                <input 
                  v-model="startKeyword" 
                  type="text" 
                  placeholder="输入起点地名" 
                  class="location-input"
                />
                <input 
                  v-model="startCity" 
                  type="text" 
                  placeholder="城市" 
                  class="city-input"
                />
              </div>
            </div>
            <div class="input-group">
              <label>终点:</label>
              <div class="location-input-group">
                <input 
                  v-model="endKeyword" 
                  type="text" 
                  placeholder="输入终点地名" 
                  class="location-input"
                />
                <input 
                  v-model="endCity" 
                  type="text" 
                  placeholder="城市" 
                  class="city-input"
                />
              </div>
            </div>
          </div>

          <!-- 路线策略选择 -->
          <div class="input-group">
            <label>路线策略:</label>
            <select v-model="routePolicy" class="policy-select">
              <option value="0">推荐路线及最快路线综合 (默认)</option>
              <option value="1">推荐路线 (平衡距离与路况)</option>
              <option value="2">最快路线 (优先速度)</option>
            </select>
            <div class="policy-hint">
              <span class="hint-text">{{ getPolicyDescription(routePolicy) }}</span>
            </div>
          </div>

          <!-- 高程采样模式选择 -->
          <div class="input-group">
            <label>高程精度:</label>
            <div class="sampling-mode-selector">
              <label class="sampling-option">
                <input 
                  type="radio" 
                  :value="true" 
                  v-model="enableSmartSampling"
                  name="samplingMode"
                />
                <span class="radio-custom"></span>
                <span class="option-text">智能采样 (推荐)</span>
              </label>
              <label class="sampling-option">
                <input 
                  type="radio" 
                  :value="false" 
                  v-model="enableSmartSampling"
                  name="samplingMode"
                />
                <span class="radio-custom"></span>
                <span class="option-text">均匀采样</span>
              </label>
            </div>
            <div class="sampling-hint">
              <span class="hint-text">
                {{ enableSmartSampling 
                  ? '智能识别地形特征点，更准确反映山峰谷底变化' 
                  : '等间距选择采样点，处理速度更快' 
                }}
              </span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="action-buttons">
            <button 
              class="search-btn" 
              @click="searchRoute"
              :disabled="isSearching || !canSearch"
              :class="{ loading: isSearching }"
            >
              <svg v-if="isSearching" class="loading-icon" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor"/>
              </svg>
              <svg v-else class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              {{ isSearching ? '规划中...' : '开始导航' }}
            </button>
            <button 
              class="clear-btn" 
              @click="clearRoute"
              :disabled="!hasActiveRoute"
            >
              <svg class="clear-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              清除路线
            </button>
          </div>
        </div>

        <!-- 路线信息显示 -->
        <div v-if="routeInfo" class="route-info">
          <div class="info-header">
            <h4>路线信息</h4>
            <span class="route-status success">
              {{ routeInfo.isSegmentNavigation ? '分段规划成功' : '规划成功' }}
            </span>
          </div>
          <div class="info-content">
            <div class="info-item">
              <span class="info-label">总距离:</span>
              <span class="info-value">{{ formatDistance(routeInfo.distance) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">预计时间:</span>
              <span class="info-value">{{ formatTime(routeInfo.time) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">路线策略:</span>
              <span class="info-value">{{ getPolicyName(routePolicy) }}</span>
            </div>
            <div v-if="routeInfo.isSegmentNavigation && routeInfo.segmentInfo" class="info-item">
              <span class="info-label">路线段数:</span>
              <span class="info-value segment-count">{{ routeInfo.segmentInfo.totalSegments }}段</span>
            </div>
          </div>
          
          <!-- 分段信息详情 -->
          <div v-if="routeInfo.isSegmentNavigation && routeInfo.segmentInfo" class="segment-details">
            <h5>🛣️ 分段详情</h5>
            <div class="segment-list">
              <div 
                v-for="(segment, index) in routeInfo.segmentInfo.segments" 
                :key="index"
                class="segment-item"
              >
                <div class="segment-header">
                  <span class="segment-number">第{{ index + 1 }}段</span>
                  <div class="segment-stats">
                    <span class="segment-distance">{{ formatDistance(segment.distance) }}</span>
                    <span class="segment-time">{{ formatTime(segment.time) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 高程信息显示 -->
          <div v-if="elevationStats" class="elevation-info">
            <h5>🏔️ 高程信息</h5>
            <div class="elevation-stats">
              <div class="elevation-row">
                <div class="elevation-stat">
                  <span class="elevation-label">最高海拔:</span>
                  <span class="elevation-value">{{ elevationStats.maxElevation }}m</span>
                </div>
                <div class="elevation-stat">
                  <span class="elevation-label">最低海拔:</span>
                  <span class="elevation-value">{{ elevationStats.minElevation }}m</span>
                </div>
              </div>
              <div class="elevation-row">
                <div class="elevation-stat">
                  <span class="elevation-label">平均海拔:</span>
                  <span class="elevation-value">{{ elevationStats.averageElevation }}m</span>
                </div>
                <div class="elevation-stat">
                  <span class="elevation-label">高程差:</span>
                  <span class="elevation-value">{{ elevationStats.elevationRange }}m</span>
                </div>
              </div>
              <div class="elevation-row">
                <div class="elevation-stat">
                  <span class="elevation-label">累计爬升:</span>
                  <span class="elevation-value climb">+{{ elevationStats.totalAscent }}m</span>
                </div>
                <div class="elevation-stat">
                  <span class="elevation-label">累计下降:</span>
                  <span class="elevation-value descent">-{{ elevationStats.totalDescent }}m</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 高程加载状态 -->
          <div v-if="elevationLoading" class="elevation-loading">
            <div class="loading-content">
              <svg class="loading-icon" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor"/>
              </svg>
              <span>正在获取高程数据...</span>
            </div>
          </div>
        </div>

        <!-- 分段导航进度显示 -->
        <div v-if="isSegmentSearching" class="segment-progress">
          <div class="progress-header">
            <h5>分段导航规划中</h5>
            <span class="progress-text">{{ segmentProgress.current }}/{{ segmentProgress.total }}</span>
          </div>
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: segmentProgress.total > 0 ? (segmentProgress.current / segmentProgress.total * 100) + '%' : '0%' }"
            ></div>
          </div>
          <div class="progress-hint">
            <span class="hint-text">🚴‍♂️ 正在规划第{{ segmentProgress.current }}段路线，请稍候...</span>
          </div>
        </div>

        <!-- 错误信息显示 -->
        <div v-if="errorMessage" class="error-message" :class="{ 'warning': errorMessage.includes('注意') }">
          <div class="error-header">
            <svg v-if="errorMessage.includes('注意')" class="warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <svg v-else class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span>{{ errorMessage.includes('注意') ? '提示信息' : '规划失败' }}</span>
          </div>
          <p class="error-text">{{ errorMessage }}</p>
        </div>
      </div>

      <!-- 详细路线指引面板 -->
      <div v-if="routeSteps && routeSteps.length" class="route-steps" :class="{ 'collapsed': isStepsCollapsed }">
        <div class="steps-header" @click="toggleSteps">
          <h4>路线指引 ({{ routeSteps.length }}步)</h4>
          <svg class="toggle-icon" :class="{ 'rotated': !isStepsCollapsed }" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="6,9 12,15 18,9"/>
          </svg>
        </div>
        <div v-show="!isStepsCollapsed" class="steps-content">
          <div 
            v-for="(step, index) in routeSteps" 
            :key="index" 
            class="step-item"
            @click="highlightStep(step, index)"
          >
            <div class="step-number">{{ index + 1 }}</div>
            <div class="step-content">
              <div class="step-instruction">{{ step.instruction }}</div>
              <div class="step-details">
                <span class="step-distance">{{ formatDistance(step.distance) }}</span>
                <span class="step-time">{{ formatTime(step.time) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useElevation } from '@/composables/useElevation'
import simplifiedAnalytics from '@/utils/simplifiedAnalytics'

// 定义 props 和 emits
const props = defineProps({
  mapInstance: {
    type: Object,
    default: null
  },
  visible: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['route-planned', 'route-cleared', 'step-highlighted', 'elevation-loading-changed'])

// 响应式数据
const isPanelCollapsed = ref(false)
const isStepsCollapsed = ref(true)
const searchMode = ref('coordinates') // 'coordinates' | 'keyword'
const isSearching = ref(false)
const hasActiveRoute = ref(false)

// 经纬度模式数据
const startCoordinates = ref({ lng: 116.397933, lat: 39.844818 })
const endCoordinates = ref({ lng: 116.440655, lat: 39.878694 })

// 地点名称模式数据
const startKeyword = ref('临泓路6号院')
const startCity = ref('北京')
const endKeyword = ref('龙潭公园')
const endCity = ref('北京')

// 路线策略
const routePolicy = ref('0') // '0': 推荐路线, '1': 最短距离

// 高程采样模式
const enableSmartSampling = ref(true) // 默认启用智能采样

// 路线信息
const routeInfo = ref(null)
const routeSteps = ref([])
const errorMessage = ref('')

// 途径点数据
const waypointsData = ref([])

// 分段导航相关数据
const segmentRoutes = ref([]) // 存储每段路线结果
const segmentCache = ref(new Map()) // 缓存已计算的路段
const isSegmentSearching = ref(false) // 分段搜索状态
const segmentProgress = ref({ current: 0, total: 0 }) // 分段搜索进度

// 高程数据相关
const { 
  isLoading: elevationLoading, 
  error: elevationError, 
  getElevationForRoute, 
  calculateElevationStats, 
  clearElevationData 
} = useElevation()
const elevationStats = ref(null)
const elevationData = ref([]) // 保存原始高程数据用于图表
const showElevationData = ref(false)

// 高德地图骑行导航实例
const ridingInstance = ref(null)
const routePolylines = ref([]) // 改为数组存储多段路线
const waypointMarkers = ref([]) // 存储途径点标记

// 计算属性
const canSearch = computed(() => {
  if (searchMode.value === 'coordinates') {
    return startCoordinates.value.lng && startCoordinates.value.lat && 
           endCoordinates.value.lng && endCoordinates.value.lat
  } else {
    return startKeyword.value.trim() && endKeyword.value.trim()
  }
})

// 方法定义
const togglePanel = () => {
  isPanelCollapsed.value = !isPanelCollapsed.value
}

const toggleSteps = () => {
  isStepsCollapsed.value = !isStepsCollapsed.value
}

const setSearchMode = (mode) => {
  searchMode.value = mode
  clearError()
}

const clearError = () => {
  errorMessage.value = ''
}

const formatDistance = (distance) => {
  if (!distance) return '0m'
  if (distance >= 1000) {
    return `${(distance / 1000).toFixed(1)}km`
  }
  return `${Math.round(distance)}m`
}

const formatTime = (time) => {
  if (!time) return '0分钟'
  const hours = Math.floor(time / 3600)
  const minutes = Math.floor((time % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  }
  return `${minutes}分钟`
}

const getPolicyName = (policy) => {
  const policies = {
    '0': '推荐路线及最快路线综合',
    '1': '推荐路线',
    '2': '最快路线'
  }
  return policies[policy] || '推荐路线及最快路线综合'
}

const getPolicyDescription = (policy) => {
  const descriptions = {
    '0': '综合考虑路线距离、路况和通行速度，提供平衡的骑行方案',
    '1': '优先选择适合骑行的道路，平衡距离与路况条件',
    '2': '以最短时间为目标，优先选择通行速度较快的路线'
  }
  return descriptions[policy] || descriptions['0']
}

// 初始化骑行导航
const initRiding = () => {
  if (!props.mapInstance || !window.AMap) {
    console.warn('地图实例或AMap未准备就绪')
    return
  }

  try {
    // 创建骑行导航实例
    ridingInstance.value = new AMap.Riding({
      policy: parseInt(routePolicy.value),
      hideMarkers: true, // 隐藏默认标记，使用自定义标记
      isOutline: true,
      outlineColor: '#ffffff',
      autoFitView: false // 手动控制视图
    })

    console.log('骑行导航初始化成功')
  } catch (error) {
    console.error('骑行导航初始化失败:', error)
    errorMessage.value = '导航功能初始化失败'
  }
}

// 生成缓存键
const generateCacheKey = (point1, point2, policy) => {
  const p1 = Array.isArray(point1) ? point1.join(',') : `${point1.keyword}-${point1.city}`
  const p2 = Array.isArray(point2) ? point2.join(',') : `${point2.keyword}-${point2.city}`
  return `${p1}_${p2}_${policy}`
}

// 分段导航搜索
const searchSegmentRoute = (startPoint, endPoint, policy) => {
  return new Promise((resolve, reject) => {
    const cacheKey = generateCacheKey(startPoint, endPoint, policy)
    
    // 检查缓存
    if (segmentCache.value.has(cacheKey)) {
      console.log('使用缓存的路段结果:', cacheKey)
      resolve(segmentCache.value.get(cacheKey))
      return
    }
    
    // 创建临时导航实例进行搜索
    const tempRiding = new AMap.Riding({
      policy: parseInt(policy),
      hideMarkers: true,
      isOutline: true,
      outlineColor: '#ffffff',
      autoFitView: false
    })
    
    tempRiding.search(startPoint, endPoint, (status, result) => {
      if (status === 'complete' && result.routes && result.routes.length > 0) {
        const routeData = result.routes[0]
        // 缓存结果
        segmentCache.value.set(cacheKey, routeData)
        resolve(routeData)
      } else {
        reject(new Error(`路段导航失败: ${JSON.stringify(result)}`))
      }
    })
  })
}

// 搜索路线（支持途径点分段导航）
const searchRoute = async () => {
  if (!ridingInstance.value) {
    initRiding()
    if (!ridingInstance.value) {
      errorMessage.value = '导航功能未准备就绪'
      return
    }
  }

  isSearching.value = true
  clearError()
  
  try {
    let allPoints = [] // 包含起点、途径点、终点的完整点列表
    
    if (searchMode.value === 'coordinates') {
      // 经纬度模式
      const startPoint = [parseFloat(startCoordinates.value.lng), parseFloat(startCoordinates.value.lat)]
      const endPoint = [parseFloat(endCoordinates.value.lng), parseFloat(endCoordinates.value.lat)]
      
      allPoints.push(startPoint)
      
      // 处理途径点（经纬度格式）
      if (waypointsData.value && waypointsData.value.length > 0) {
        console.log('🔍 处理经纬度模式途径点:', waypointsData.value)
        console.log('🔍 waypointsData长度:', waypointsData.value.length)
        
        // ⚠️ 注意：waypointsData 已经是由RouteMain过滤后的中间途径点，不包含起点和终点
        // 所以这里不需要再次slice，直接使用所有数据
        console.log('🎯 处理所有途径点（已过滤起终点）:', waypointsData.value)
        
        const validWaypoints = waypointsData.value
          .filter((wp, index) => {
            const hasCoords = wp && wp.longitude && wp.latitude && 
                           !isNaN(parseFloat(wp.longitude)) && !isNaN(parseFloat(wp.latitude))
            console.log(`途径点${index + 1}验证:`, { wp, hasCoords })
            return hasCoords
          })
          .map((wp, index) => {
            const coords = [parseFloat(wp.longitude), parseFloat(wp.latitude)]
            console.log(`途径点${index + 1}坐标:`, coords)
            return coords
          })
        
        allPoints.push(...validWaypoints)
        console.log('✅ 有效途径点坐标:', validWaypoints)
        console.log('📍 当前allPoints:', allPoints)
      }
      
      allPoints.push(endPoint)
    } else {
      // 地点名称模式
      const startPoint = {
        keyword: startKeyword.value.trim(),
        city: startCity.value.trim() || '北京'
      }
      const endPoint = {
        keyword: endKeyword.value.trim(),
        city: endCity.value.trim() || '北京'
      }
      
      allPoints.push(startPoint)
      
      // 处理途径点（关键字格式）
      if (waypointsData.value && waypointsData.value.length > 0) {
        console.log('🔍 处理关键字模式途径点:', waypointsData.value)
        console.log('🔍 waypointsData长度:', waypointsData.value.length)
        
        // ⚠️ 注意：waypointsData 已经是由RouteMain过滤后的中间途径点，不包含起点和终点
        // 所以这里不需要再次slice，直接使用所有数据
        console.log('🎯 处理所有途径点（已过滤起终点）:', waypointsData.value)
        
        const validWaypoints = waypointsData.value
          .filter((wp, index) => {
            const hasName = wp && wp.name && typeof wp.name === 'string' && wp.name.trim()
            console.log(`途径点${index + 1}验证:`, { wp, hasName })
            return hasName
          })
          .map((wp, index) => {
            const waypoint = {
              keyword: wp.name.trim(),
              city: (wp.region && wp.region.trim()) || '北京'
            }
            console.log(`途径点${index + 1}关键字:`, waypoint)
            return waypoint
          })
        
        allPoints.push(...validWaypoints)
        console.log('✅ 有效途径点关键字:', validWaypoints)
        console.log('📍 当前allPoints:', allPoints)
      }
      
      allPoints.push(endPoint)
    }

    console.log('完整点列表:', allPoints)

    // 如果只有起点和终点，使用传统方式
    if (allPoints.length === 2) {
      console.log('只有起终点，使用传统导航')
      ridingInstance.value.setPolicy(parseInt(routePolicy.value))
      ridingInstance.value.search(allPoints[0], allPoints[1], (status, result) => {
        isSearching.value = false
        if (status === 'complete' && result.routes && result.routes.length > 0) {
          handleRouteSuccess(result)
        } else {
          handleRouteError(result)
        }
      })
      return
    }

    // 有途径点，使用分段导航
    console.log('检测到途径点，开始分段导航规划')
    await searchWithWaypoints(allPoints)

  } catch (error) {
    isSearching.value = false
    console.error('路线搜索失败:', error)
    errorMessage.value = '路线搜索失败: ' + error.message
  }
}

// 分段导航主方法
const searchWithWaypoints = async (allPoints) => {
  try {
    isSegmentSearching.value = true
    segmentRoutes.value = []
    
    const segments = allPoints.length - 1
    segmentProgress.value = { current: 0, total: segments }
    
    console.log(`开始分段导航，共${segments}段`)
    
    // 逐段搜索路线
    for (let i = 0; i < segments; i++) {
      const startPoint = allPoints[i]
      const endPoint = allPoints[i + 1]
      
      console.log(`搜索第${i + 1}段: `, { startPoint, endPoint })
      segmentProgress.value.current = i + 1
      
      try {
        const segmentRoute = await searchSegmentRoute(startPoint, endPoint, routePolicy.value)
        segmentRoutes.value.push({
          index: i,
          startPoint,
          endPoint,
          route: segmentRoute
        })
        console.log(`第${i + 1}段搜索成功`)
      } catch (error) {
        console.error(`第${i + 1}段搜索失败:`, error)
        throw new Error(`第${i + 1}段路线规划失败: ${error.message}`)
      }
    }
    
    // 合并所有路段结果
    const mergedResult = mergeSegmentRoutes(segmentRoutes.value)
    console.log('分段导航完成，合并结果:', mergedResult)
    
    // 处理合并后的结果
    handleRouteSuccess(mergedResult, true) // 第二个参数表示这是分段导航结果
    
  } catch (error) {
    console.error('分段导航失败:', error)
    errorMessage.value = error.message || '分段导航失败'
  } finally {
    isSearching.value = false
    isSegmentSearching.value = false
    segmentProgress.value = { current: 0, total: 0 }
  }
}

// 合并路段结果
const mergeSegmentRoutes = (segments) => {
  if (segments.length === 0) {
    throw new Error('没有有效的路段数据')
  }
  
  let totalDistance = 0
  let totalTime = 0
  let allRides = []
  let allPath = []
  
  segments.forEach((segment, index) => {
    const route = segment.route
    totalDistance += route.distance || 0
    totalTime += route.time || 0
    
    if (route.rides && route.rides.length > 0) {
      // 为每个路段的rides添加段索引信息
      const segmentRides = route.rides.map(ride => ({
        ...ride,
        segmentIndex: index,
        segmentName: `第${index + 1}段`
      }))
      allRides.push(...segmentRides)
    }
    
    // 合并路径，避免重复点
    if (route.rides && route.rides.length > 0) {
      route.rides.forEach(ride => {
        if (ride.path && ride.path.length > 0) {
          // 如果不是第一段，跳过第一个点避免重复
          const pathToAdd = index === 0 ? ride.path : ride.path.slice(1)
          allPath.push(...pathToAdd)
        }
      })
    }
  })
  
  // 构造合并后的结果
  const mergedRoute = {
    distance: totalDistance,
    time: totalTime,
    rides: allRides,
    path: allPath,
    // 添加分段信息
    segmentInfo: {
      totalSegments: segments.length,
      segments: segments.map(seg => ({
        index: seg.index,
        distance: seg.route.distance,
        time: seg.route.time,
        ridesCount: seg.route.rides?.length || 0
      }))
    }
  }
  
  return {
    info: '分段导航规划成功',
    routes: [mergedRoute],
    origin: segments[0].route.origin || null,
    destination: segments[segments.length - 1].route.destination || null
  }
}

// 处理路线搜索成功
const handleRouteSuccess = async (result, isSegmentNavigation = false) => {
  const route = result.routes[0]
  
  // 保存路线信息
  routeInfo.value = {
    distance: route.distance,
    time: route.time,
    isSegmentNavigation,
    segmentInfo: route.segmentInfo || null
  }

  // 解析路线步骤
  routeSteps.value = parseRouteSteps(route)
  
  // 绘制路线（支持分段）
  if (isSegmentNavigation) {
    drawSegmentRoutes(route)
  } else {
    drawRoute(route)
  }
  
  // 获取高程数据
  await fetchElevationData(route)
  
  hasActiveRoute.value = true
  isStepsCollapsed.value = false

  // 记录导航路线规划行为
  try {
    await simplifiedAnalytics.trackRouteNavigation({
      start_point: searchMode.value === 'coordinates' 
        ? `${startCoordinates.value.lng},${startCoordinates.value.lat}`
        : `${startKeyword.value},${startCity.value}`,
      end_point: searchMode.value === 'coordinates'
        ? `${endCoordinates.value.lng},${endCoordinates.value.lat}`
        : `${endKeyword.value},${endCity.value}`,
      waypoints: waypointsData.value,
      route_policy: routePolicy.value,
      search_mode: searchMode.value,
      distance: formatDistance(route.distance),
      duration: formatTime(route.time),
      smart_sampling_enabled: enableSmartSampling.value,
      is_segment_navigation: isSegmentNavigation,
      segment_count: route.segmentInfo?.totalSegments || 0
    })
  } catch (error) {
    console.warn('记录导航行为失败:', error)
  }

  // 发送事件（包含高程数据）
  emit('route-planned', {
    route: route,
    info: routeInfo.value,
    steps: routeSteps.value,
    elevationStats: elevationStats.value,
    elevationData: elevationData.value, // 添加原始高程数据
    isSegmentNavigation,
    segmentRoutes: isSegmentNavigation ? segmentRoutes.value : null
  })

  console.log('路线规划成功:', routeInfo.value)
  if (elevationStats.value) {
    console.log('高程统计:', elevationStats.value)
  }
  if (isSegmentNavigation) {
    console.log('分段导航信息:', route.segmentInfo)
  }
}

// 处理路线搜索失败
const handleRouteError = (result) => {
  console.error('路线搜索失败:', result)
  errorMessage.value = '未找到合适的骑行路线，请检查起终点是否正确'
  hasActiveRoute.value = false
}

// 获取路线高程数据
const fetchElevationData = async (route) => {
  try {
    console.log('开始获取路线高程数据')
    showElevationData.value = true
    
    // 发出高程加载开始事件
    emit('elevation-loading-changed', true)
    
    // 提取路线坐标
    const coordinates = extractRouteCoordinates(route)
    
    console.log(`提取到 ${coordinates.length} 个GCJ-02坐标点`)
    
    // 获取高程数据（自动进行坐标转换）
    const elevationResults = await getElevationForRoute(coordinates, 18, enableSmartSampling.value)
    
    if (elevationResults && elevationResults.length > 0) {
      // 保存原始高程数据
      elevationData.value = elevationResults
      // 计算高程统计信息
      elevationStats.value = calculateElevationStats(elevationResults)
      console.log('高程数据获取成功:', elevationStats.value)
    } else {
      console.warn('未获取到有效的高程数据')
      elevationData.value = []
      elevationStats.value = null
    }
    
  } catch (error) {
    console.error('获取高程数据失败:', error)
    // 设置错误信息，让用户知道高程数据获取失败
    if (error.message && error.message.includes('坐标数据不足')) {
      errorMessage.value = '路线数据异常：' + error.message
    } else {
      errorMessage.value = '高程数据获取失败：' + error.message
    }
    elevationData.value = []
    elevationStats.value = null
  } finally {
    // 发出高程加载结束事件
    emit('elevation-loading-changed', false)
  }
}

// 从路线中提取坐标点
const extractRouteCoordinates = (route) => {
  const coordinates = []
  
  try {
    // 方法1: 从route.path获取（如果可用）
    if (route.path && Array.isArray(route.path) && route.path.length > 0) {
      route.path.forEach(point => {
        if (point && point.lng && point.lat) {
          coordinates.push({ lng: point.lng, lat: point.lat })
        } else if (Array.isArray(point) && point.length >= 2) {
          coordinates.push({ lng: point[0], lat: point[1] })
        }
      })
      console.log(`从route.path提取到 ${coordinates.length} 个坐标`)
      return coordinates
    }
    
    // 方法2: 从route.rides.path获取
    if (route.rides && Array.isArray(route.rides)) {
      route.rides.forEach(ride => {
        if (ride.path && Array.isArray(ride.path)) {
          ride.path.forEach(point => {
            if (point && point.lng && point.lat) {
              coordinates.push({ lng: point.lng, lat: point.lat })
            } else if (Array.isArray(point) && point.length >= 2) {
              coordinates.push({ lng: point[0], lat: point[1] })
            }
          })
        }
      })
      console.log(`从route.rides.path提取到 ${coordinates.length} 个坐标`)
    }
    
    // 验证是否获取到足够的坐标点
    if (coordinates.length < 2) {
      throw new Error(`路线坐标数据不足，仅获取到 ${coordinates.length} 个坐标点，无法进行高程分析`)
    }
    
  } catch (error) {
    console.error('提取路线坐标失败:', error)
    throw error // 重新抛出错误，让上层处理
  }
  
  return coordinates
}


// 解析路线步骤
const parseRouteSteps = (route) => {
  const steps = []
  
  if (route.rides && route.rides.length > 0) {
    route.rides.forEach((ride, index) => {
      steps.push({
        instruction: ride.instruction || `第${index + 1}段路程`,
        distance: ride.distance || 0,
        time: ride.time || 0,
        path: ride.path || []
      })
    })
  }
  
  return steps
}

// 绘制分段路线
const drawSegmentRoutes = (route) => {
  if (!props.mapInstance) return

  // 清除现有路线
  clearRouteDisplay()

  try {
    // 解析路线路径
    const path = parseRouteToPath(route)
    
    if (path.length === 0) {
      console.warn('路线路径为空')
      return
    }

    // 创建途径点标记（包括起点和终点）
    console.log('🎯 开始绘制途径点标记')
    console.log('waypointsData:', waypointsData.value)
    console.log('waypointsData长度:', waypointsData.value?.length)
    
    if (waypointsData.value && waypointsData.value.length > 0) {
      // 添加起点标记（真正的起点是路线的第一个坐标点）
      if (path.length > 0) {
        console.log('📍 添加起点标记:', path[0])
        const startMarker = new AMap.Marker({
          position: path[0], // 使用路线的第一个坐标点作为起点
          icon: 'https://webapi.amap.com/theme/v1.3/markers/n/start.png',
          anchor: 'bottom-center',
          map: props.mapInstance,
          title: '起点' // waypointsData现在不包含起点信息
        })
        waypointMarkers.value.push(startMarker)
      }

      // 添加中间途径点标记（序号从1开始：起点-1-2-3-终点）
      console.log('🔢 开始添加中间途径点标记')
      // ⚠️ 注意：waypointsData 现在只包含中间途径点，不包含起点和终点
      for (let i = 0; i < waypointsData.value.length; i++) {
        const waypoint = waypointsData.value[i]
        console.log(`处理途径点 ${i + 1}:`, waypoint)
        
        if (waypoint && waypoint.longitude && waypoint.latitude) {
          // 途径点序号：第1个途径点标记为1，第2个标记为2，以此类推
          const markerNumber = i + 1 // 从1开始编号
          const position = [parseFloat(waypoint.longitude), parseFloat(waypoint.latitude)]
          
          console.log(`✅ 创建途径点${markerNumber}标记:`, {
            position,
            name: waypoint.name,
            coordinates: `${waypoint.longitude}, ${waypoint.latitude}`
          })
          
          const marker = new AMap.Marker({
            position: position,
            icon: `https://webapi.amap.com/theme/v1.3/markers/n/mark_b${markerNumber}.png`,
            anchor: 'bottom-center',
            map: props.mapInstance,
            title: waypoint.name || `途径点${markerNumber}`
          })
          waypointMarkers.value.push(marker)
        } else {
          console.warn(`❌ 途径点${i + 1}缺少坐标信息:`, waypoint)
        }
      }

      // 添加终点标记（真正的终点是路线的最后一个坐标点）
      if (path.length > 0) {
        console.log('🏁 添加终点标记:', path[path.length - 1])
        const endMarker = new AMap.Marker({
          position: path[path.length - 1], // 使用路线的最后一个坐标点作为终点
          icon: 'https://webapi.amap.com/theme/v1.3/markers/n/end.png',
          anchor: 'bottom-center',
          map: props.mapInstance,
          title: '终点' // waypointsData现在不包含终点信息
        })
        waypointMarkers.value.push(endMarker)
      }
      
      console.log(`📊 标记创建完成，共创建 ${waypointMarkers.value.length} 个标记`)
    } else {
      console.warn('⚠️ 没有途径点数据或数据为空')
    }

    // 创建分段路线折线（不同颜色）
    const segmentColors = ['#1890ff', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1', '#13c2c2']
    
    if (route.segmentInfo && segmentRoutes.value.length > 0) {
      segmentRoutes.value.forEach((segment, index) => {
        const segmentPath = parseRouteToPath(segment.route)
        if (segmentPath.length > 0) {
          const polyline = new AMap.Polyline({
            path: segmentPath,
            isOutline: true,
            outlineColor: '#ffffff',
            borderWeight: 2,
            strokeWeight: 6,
            strokeColor: segmentColors[index % segmentColors.length],
            strokeOpacity: 0.9,
            lineJoin: 'round',
            lineCap: 'round'
          })
          
          props.mapInstance.add(polyline)
          routePolylines.value.push(polyline)
        }
      })
    } else {
      // 如果没有分段信息，绘制整条路线
      const polyline = new AMap.Polyline({
        path: path,
        isOutline: true,
        outlineColor: '#ffffff',
        borderWeight: 2,
        strokeWeight: 6,
        strokeColor: '#1890ff',
        strokeOpacity: 0.9,
        lineJoin: 'round',
        lineCap: 'round'
      })
      
      props.mapInstance.add(polyline)
      routePolylines.value.push(polyline)
    }

    // 调整地图视野
    const allMarkers = [...waypointMarkers.value, ...routePolylines.value]
    if (allMarkers.length > 0) {
      props.mapInstance.setFitView(allMarkers, false, [20, 20, 20, 20])
    }

  } catch (error) {
    console.error('绘制分段路线失败:', error)
    errorMessage.value = '路线绘制失败'
  }
}

// 绘制路线（传统方式）
const drawRoute = (route) => {
  if (!props.mapInstance) return

  // 清除现有路线
  clearRouteDisplay()

  try {
    // 解析路线路径
    const path = parseRouteToPath(route)
    
    if (path.length === 0) {
      console.warn('路线路径为空')
      return
    }

    // 创建起点标记
    const startMarker = new AMap.Marker({
      position: path[0],
      icon: 'https://webapi.amap.com/theme/v1.3/markers/n/start.png',
      anchor: 'bottom-center',
      map: props.mapInstance
    })
    waypointMarkers.value.push(startMarker)

    // 创建终点标记
    const endMarker = new AMap.Marker({
      position: path[path.length - 1],
      icon: 'https://webapi.amap.com/theme/v1.3/markers/n/end.png',
      anchor: 'bottom-center',
      map: props.mapInstance
    })
    waypointMarkers.value.push(endMarker)

    // 创建路线折线
    const polyline = new AMap.Polyline({
      path: path,
      isOutline: true,
      outlineColor: '#ffffff',
      borderWeight: 2,
      strokeWeight: 6,
      strokeColor: '#1890ff',
      strokeOpacity: 0.9,
      lineJoin: 'round',
      lineCap: 'round'
    })

    // 添加到地图
    props.mapInstance.add(polyline)
    routePolylines.value.push(polyline)

    // 调整地图视野
    props.mapInstance.setFitView([...waypointMarkers.value, ...routePolylines.value], false, [20, 20, 20, 20])

  } catch (error) {
    console.error('绘制路线失败:', error)
    errorMessage.value = '路线绘制失败'
  }
}

// 解析路线数据为路径
const parseRouteToPath = (route) => {
  const path = []
  
  if (route.rides && route.rides.length > 0) {
    route.rides.forEach(ride => {
      if (ride.path && ride.path.length > 0) {
        ride.path.forEach(point => {
          path.push(point)
        })
      }
    })
  }
  
  return path
}

// 清除路线显示
const clearRouteDisplay = () => {
  // 清除所有路线折线
  routePolylines.value.forEach(polyline => {
    if (polyline && props.mapInstance) {
      props.mapInstance.remove(polyline)
    }
  })
  routePolylines.value = []
  
  // 清除所有标记
  waypointMarkers.value.forEach(marker => {
    if (marker) {
      marker.setMap(null)
    }
  })
  waypointMarkers.value = []
}

// 清除路线
const clearRoute = () => {
  clearRouteDisplay()
  
  routeInfo.value = null
  routeSteps.value = []
  errorMessage.value = ''
  hasActiveRoute.value = false
  isStepsCollapsed.value = true
  waypointsData.value = [] // 清除途径点数据
  
  // 清除分段导航数据
  segmentRoutes.value = []
  segmentCache.value.clear()
  isSegmentSearching.value = false
  segmentProgress.value = { current: 0, total: 0 }
  
  // 清除高程数据
  clearElevationData()
  elevationData.value = []
  elevationStats.value = null
  showElevationData.value = false

  emit('route-cleared')
  console.log('路线已清除')
}

// 高亮显示路线步骤
const highlightStep = (step, index) => {
  if (!step.path || step.path.length === 0) return

  // 这里可以实现步骤高亮显示逻辑
  // 比如在地图上高亮显示该步骤的路径
  emit('step-highlighted', { step, index })
  
  console.log(`高亮显示第${index + 1}步:`, step.instruction)
}

// 监听地图实例变化
watch(() => props.mapInstance, (newInstance) => {
  if (newInstance) {
    initRiding()
  }
}, { immediate: true })

// 监听路线策略变化
watch(routePolicy, () => {
  if (ridingInstance.value) {
    ridingInstance.value.setPolicy(parseInt(routePolicy.value))
  }
})

// 组件挂载
onMounted(() => {
  console.log('CyclingNavigation 组件已挂载')
})

// 组件卸载
onUnmounted(() => {
  clearRoute()
  console.log('CyclingNavigation 组件已卸载')
})

// 设置途径点数据
const setWaypoints = (waypoints) => {
  console.log('设置途径点数据:', waypoints)
  waypointsData.value = waypoints || []
}

// 清除途径点数据
const clearWaypoints = () => {
  waypointsData.value = []
}

const updatePolicy = (policy) => {
  routePolicy.value = policy
  console.log('CyclingNavigation 策略已更新为:', policy)
}

const searchRouteWithCoordinates = (startCoords, endCoords) => {
  console.log('CyclingNavigation 使用坐标搜索路线:', { startCoords, endCoords })
  startCoordinates.value = { lng: startCoords[0], lat: startCoords[1] }
  endCoordinates.value = { lng: endCoords[0], lat: endCoords[1] }
  searchMode.value = 'coordinates'
  searchRoute()
}

// 暴露方法给父组件
defineExpose({
  searchRoute,
  clearRoute,
  setStartPoint: (lng, lat) => {
    startCoordinates.value = { lng, lat }
    searchMode.value = 'coordinates'
  },
  setEndPoint: (lng, lat) => {
    endCoordinates.value = { lng, lat }
    searchMode.value = 'coordinates'
  },
  setStartKeyword: (keyword, city = '北京') => {
    startKeyword.value = keyword
    startCity.value = city
    searchMode.value = 'keyword'
  },
  setEndKeyword: (keyword, city = '北京') => {
    endKeyword.value = keyword
    endCity.value = city
    searchMode.value = 'keyword'
  },
  setWaypoints,
  clearWaypoints,
  updatePolicy,
  searchRouteWithCoordinates
})
</script>

<style scoped>
.cycling-navigation {
  position: relative;
  width: 100%;
  height: 100%;
}

.navigation-panel {
  position: fixed;
  top: 10px;
  right: 10px;
  width: 320px;
  max-height: 90vh;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 1000;
  overflow: hidden;
  transition: all 0.3s ease;
}

.navigation-panel.collapsed {
  width: 60px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px 12px 0 0;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
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
  max-height: calc(90vh - 80px);
  overflow-y: auto;
}

.route-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-mode-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mode-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.mode-buttons {
  display: flex;
  gap: 8px;
}

.mode-btn {
  flex: 1;
  padding: 8px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  background: white;
  color: #666;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.mode-btn.active {
  border-color: #667eea;
  background: #667eea;
  color: white;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.coordinate-inputs {
  display: flex;
  gap: 8px;
}

.coordinate-input {
  flex: 1;
  padding: 10px 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.coordinate-input:focus {
  outline: none;
  border-color: #667eea;
}

.location-input-group {
  display: flex;
  gap: 8px;
}

.location-input {
  flex: 2;
  padding: 10px 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.city-input {
  flex: 1;
  padding: 10px 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.location-input:focus,
.city-input:focus {
  outline: none;
  border-color: #667eea;
}

.policy-select {
  padding: 10px 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.policy-select:focus {
  outline: none;
  border-color: #667eea;
}

.policy-hint,
.sampling-hint {
  margin-top: 6px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #667eea;
  transition: all 0.3s ease;
}

.hint-text {
  font-size: 12px;
  color: #495057;
  line-height: 1.4;
  display: block;
}

/* 采样模式选择器样式 */
.sampling-mode-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.sampling-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.sampling-option:hover {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.sampling-option input[type="radio"] {
  display: none;
}

.radio-custom {
  width: 16px;
  height: 16px;
  border: 2px solid #e1e5e9;
  border-radius: 50%;
  position: relative;
  transition: all 0.2s ease;
}

.sampling-option input[type="radio"]:checked + .radio-custom {
  border-color: #667eea;
  background: #667eea;
}

.sampling-option input[type="radio"]:checked + .radio-custom::after {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: white;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.option-text {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.sampling-option input[type="radio"]:checked ~ .option-text {
  color: #667eea;
}

.action-buttons {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.search-btn,
.clear-btn {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.search-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.search-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.search-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.search-btn.loading {
  opacity: 0.8;
}

.clear-btn {
  background: #f8f9fa;
  color: #666;
  border: 2px solid #e1e5e9;
}

.clear-btn:hover:not(:disabled) {
  background: #e9ecef;
  border-color: #ced4da;
}

.clear-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search-icon,
.clear-icon {
  width: 16px;
  height: 16px;
  stroke-width: 2;
}

.loading-icon {
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.route-info {
  margin-top: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #28a745;
}

.info-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.info-header h4 {
  margin: 0;
  color: #333;
  font-size: 16px;
}

.route-status.success {
  background: #28a745;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  color: #666;
  font-size: 14px;
}

.info-value {
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

.info-value.segment-count {
  color: #4CAF50;
  background: rgba(76, 175, 80, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

/* 分段详情样式 */
.segment-details {
  margin-top: 16px;
  padding: 12px;
  background: linear-gradient(135deg, #f0f8ff 0%, #f8f9fa 100%);
  border-radius: 8px;
  border: 1px solid #bbdefb;
}

.segment-details h5 {
  margin: 0 0 12px 0;
  color: #2c3e50;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.segment-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.segment-item {
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 6px;
  border: 1px solid rgba(33, 150, 243, 0.2);
  transition: all 0.2s ease;
}

.segment-item:hover {
  background: rgba(33, 150, 243, 0.05);
  border-color: rgba(33, 150, 243, 0.3);
}

.segment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.segment-number {
  font-size: 12px;
  color: #2196F3;
  font-weight: 600;
  background: rgba(33, 150, 243, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}

.segment-stats {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: #666;
}

.segment-distance,
.segment-time {
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 4px;
}

.error-message {
  margin-top: 20px;
  padding: 16px;
  background: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 8px;
  border-left: 4px solid #e53e3e;
}

.error-message.warning {
  background: #fffbeb;
  border: 1px solid #fed7aa;
  border-left: 4px solid #f59e0b;
}

.error-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #e53e3e;
  font-weight: 600;
}

.error-message.warning .error-header {
  color: #f59e0b;
}

.error-icon,
.warning-icon {
  width: 18px;
  height: 18px;
  stroke-width: 2;
}

.warning-icon {
  color: #f59e0b;
}

.error-text {
  margin: 0;
  color: #c53030;
  font-size: 14px;
  line-height: 1.4;
}

.error-message.warning .error-text {
  color: #92400e;
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

.elevation-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.elevation-row {
  display: flex;
  gap: 8px;
}

.elevation-stat {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
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

/* 高程加载状态 */
.elevation-loading {
  margin-top: 16px;
  padding: 12px;
  background: linear-gradient(135deg, #f0f8ff 0%, #f8f9fa 100%);
  border-radius: 8px;
  border: 1px solid #bbdefb;
}

.loading-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #2196F3;
  font-size: 13px;
}

.elevation-loading .loading-icon {
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
}

/* 分段导航进度样式 */
.segment-progress {
  margin-top: 20px;
  padding: 16px;
  background: linear-gradient(135deg, #e8f5e9 0%, #f8f9fa 100%);
  border-radius: 8px;
  border: 1px solid #c8e6c9;
  border-left: 4px solid #4CAF50;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-header h5 {
  margin: 0;
  color: #2c3e50;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.progress-text {
  font-size: 12px;
  color: #4CAF50;
  font-weight: 600;
  background: rgba(76, 175, 80, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #45a049);
  border-radius: 4px;
  transition: width 0.3s ease;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-hint {
  padding: 8px 12px;
  background: rgba(76, 175, 80, 0.05);
  border-radius: 6px;
  border-left: 3px solid #4CAF50;
}

.progress-hint .hint-text {
  font-size: 12px;
  color: #2c3e50;
  line-height: 1.4;
  display: block;
}

.route-steps {
  margin-top: 16px;
  border-top: 1px solid #e1e5e9;
}

.steps-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.steps-header:hover {
  background: rgba(102, 126, 234, 0.05);
}

.steps-header h4 {
  margin: 0;
  color: #333;
  font-size: 15px;
}

.toggle-icon {
  width: 18px;
  height: 18px;
  stroke-width: 2;
  color: #666;
  transition: transform 0.2s ease;
}

.toggle-icon.rotated {
  transform: rotate(180deg);
}

.steps-content {
  max-height: 300px;
  overflow-y: auto;
  border-top: 1px solid #f0f0f0;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 20px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid #f8f9fa;
}

.step-item:hover {
  background: rgba(102, 126, 234, 0.05);
}

.step-item:last-child {
  border-bottom: none;
}

.step-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #667eea;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-instruction {
  color: #333;
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 4px;
}

.step-details {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
}

.step-distance,
.step-time {
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .navigation-panel {
    width: calc(100vw - 20px);
    max-width: 350px;
  }

  .navigation-panel.collapsed {
    width: 50px;
  }

  .coordinate-inputs,
  .location-input-group {
    flex-direction: column;
  }

  .action-buttons {
    flex-direction: column;
  }
}

/* 滚动条样式 */
.panel-content::-webkit-scrollbar,
.steps-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track,
.steps-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb,
.steps-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover,
.steps-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
