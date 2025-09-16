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
              <option value="0">推荐路线</option>
              <option value="1">最短距离</option>
            </select>
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
            <span class="route-status success">规划成功</span>
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
          </div>
        </div>

        <!-- 错误信息显示 -->
        <div v-if="errorMessage" class="error-message">
          <div class="error-header">
            <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span>规划失败</span>
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

const emit = defineEmits(['route-planned', 'route-cleared', 'step-highlighted'])

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

// 路线信息
const routeInfo = ref(null)
const routeSteps = ref([])
const errorMessage = ref('')

// 高德地图骑行导航实例
const ridingInstance = ref(null)
const routePolyline = ref(null)
const startMarker = ref(null)
const endMarker = ref(null)

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
    '0': '推荐路线',
    '1': '最短距离'
  }
  return policies[policy] || '推荐路线'
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

// 搜索路线
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
    let startPoint, endPoint

    if (searchMode.value === 'coordinates') {
      // 经纬度模式
      startPoint = [parseFloat(startCoordinates.value.lng), parseFloat(startCoordinates.value.lat)]
      endPoint = [parseFloat(endCoordinates.value.lng), parseFloat(endCoordinates.value.lat)]
    } else {
      // 地点名称模式
      startPoint = {
        keyword: startKeyword.value.trim(),
        city: startCity.value.trim() || '北京'
      }
      endPoint = {
        keyword: endKeyword.value.trim(),
        city: endCity.value.trim() || '北京'
      }
    }

    // 更新路线策略
    ridingInstance.value.setPolicy(parseInt(routePolicy.value))

    // 执行路线搜索
    ridingInstance.value.search(startPoint, endPoint, (status, result) => {
      isSearching.value = false

      if (status === 'complete' && result.routes && result.routes.length > 0) {
        handleRouteSuccess(result)
      } else {
        handleRouteError(result)
      }
    })

  } catch (error) {
    isSearching.value = false
    console.error('路线搜索失败:', error)
    errorMessage.value = '路线搜索失败: ' + error.message
  }
}

// 处理路线搜索成功
const handleRouteSuccess = (result) => {
  const route = result.routes[0]
  
  // 保存路线信息
  routeInfo.value = {
    distance: route.distance,
    time: route.time
  }

  // 解析路线步骤
  routeSteps.value = parseRouteSteps(route)
  
  // 绘制路线
  drawRoute(route)
  
  hasActiveRoute.value = true
  isStepsCollapsed.value = false

  // 发送事件
  emit('route-planned', {
    route: route,
    info: routeInfo.value,
    steps: routeSteps.value
  })

  console.log('路线规划成功:', routeInfo.value)
}

// 处理路线搜索失败
const handleRouteError = (result) => {
  console.error('路线搜索失败:', result)
  errorMessage.value = '未找到合适的骑行路线，请检查起终点是否正确'
  hasActiveRoute.value = false
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

// 绘制路线
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
    startMarker.value = new AMap.Marker({
      position: path[0],
      icon: 'https://webapi.amap.com/theme/v1.3/markers/n/start.png',
      anchor: 'bottom-center',
      map: props.mapInstance
    })

    // 创建终点标记
    endMarker.value = new AMap.Marker({
      position: path[path.length - 1],
      icon: 'https://webapi.amap.com/theme/v1.3/markers/n/end.png',
      anchor: 'bottom-center',
      map: props.mapInstance
    })

    // 创建路线折线
    routePolyline.value = new AMap.Polyline({
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
    props.mapInstance.add(routePolyline.value)

    // 调整地图视野
    props.mapInstance.setFitView([startMarker.value, endMarker.value, routePolyline.value], false, [20, 20, 20, 20])

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
  if (routePolyline.value) {
    props.mapInstance.remove(routePolyline.value)
    routePolyline.value = null
  }
  
  if (startMarker.value) {
    startMarker.value.setMap(null)
    startMarker.value = null
  }
  
  if (endMarker.value) {
    endMarker.value.setMap(null)
    endMarker.value = null
  }
}

// 清除路线
const clearRoute = () => {
  clearRouteDisplay()
  
  routeInfo.value = null
  routeSteps.value = []
  errorMessage.value = ''
  hasActiveRoute.value = false
  isStepsCollapsed.value = true

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
  }
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

.error-message {
  margin-top: 20px;
  padding: 16px;
  background: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 8px;
  border-left: 4px solid #e53e3e;
}

.error-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #e53e3e;
  font-weight: 600;
}

.error-icon {
  width: 18px;
  height: 18px;
  stroke-width: 2;
}

.error-text {
  margin: 0;
  color: #c53030;
  font-size: 14px;
  line-height: 1.4;
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
