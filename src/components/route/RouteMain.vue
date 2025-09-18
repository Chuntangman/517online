<template>
  <div class="route-page">
    <!-- 主内容区域 -->
    <main class="main-content">
      <!-- 左侧地图容器 -->
      <div class="map-container">
        <Map ref="mapRef" :current-weather-text="currentWeatherText" />
        <!-- 天气组件 - 左下角 -->
        <div class="weather-container">
          <Weather 
            :longitude="currentLongitude"
            :latitude="currentLatitude"
            ref="weatherRef"
          />
        </div>
      </div>
      
      <!-- 右侧功能面板 -->
      <div class="content-right">
        <!-- 导航栏 -->
        <RouteNavigation 
          :mapRef="mapRef"
          :filteredWaystations="filteredWaystations"
          @tab-changed="handleTabChanged"
          @sub-nav-clicked="handleSubNavClick"
          ref="navigationRef"
        />

        <!-- 面板内容区 -->
        <div class="panel-content">
          <!-- 路线规划部分 -->
          <RoutePlanning 
            v-show="activeTab === '路线规划'"
            @route-generated="handleRouteGenerated"
            @route-selected="handleRouteSelected"
            @trajectory-playback="handleTrajectoryPlayback"
            @start-point-changed="handleStartPointChanged"
            @end-point-changed="handleEndPointChanged"
          />

          <!-- 热门路线展示 -->
          <PopularRoutes 
            v-show="activeTab === '热门路线'"
            @route-selected="handleRouteSelected"
            @route-visualize="handleRouteVisualize"
            @route-navigate-with-markers="handleRouteNavigateWithMarkers"
            @trajectory-playback="handleTrajectoryPlayback"
          />

          <!-- 驿站服务展示 -->
          <WaystationService 
            v-show="activeTab === '驿站服务'"
            :mapRef="mapRef"
            :activeTab="activeTab"
            @station-selected="handleStationSelected"
            @filters-changed="handleFiltersChanged"
            ref="waystationRef"
          />

          <!-- 常用地点展示 -->
          <CyclingGuide 
            v-show="activeTab === '常用地点'"
            @destination-selected="handleDestinationSelected"
            @destinations-filtered="handleDestinationsFiltered"
          />

          <!-- 地区信息展示 -->
          <RegionContent 
            v-show="activeTab === '地区'"
            :activeTab="activeTab"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, nextTick } from 'vue'
import Map from '@/components/Map.vue'
import Weather from '@/components/Weather.vue'
import RouteNavigation from './RouteNavigation.vue'
import RoutePlanning from './RoutePlanning.vue'
import PopularRoutes from './PopularRoutes.vue'
import WaystationService from './WaystationService.vue'
import CyclingGuide from './CyclingGuide.vue'
import RegionContent from './RegionContent.vue'
import { useNavigation } from '@/composables/useNavigation.js'
import { useWaystation } from '@/composables/useWaystation.js'
// 移除了 regions 的导入，因为现在通过导航栏处理地区选择

// 使用组合式函数
const { activeTab } = useNavigation()
const { fetchWaystations, filteredWaystations } = useWaystation()

// 组件引用
const mapRef = ref(null)
const navigationRef = ref(null)
const waystationRef = ref(null)
const weatherRef = ref(null)

// 天气组件的经纬度数据 (默认使用地图初始中心点)
const currentLongitude = ref(116.397428) // 北京经度
const currentLatitude = ref(39.90923)    // 北京纬度

// 当前筛选数据状态
const currentFilteredWaystations = ref([])
const currentFilteredDestinations = ref([])

// 获取当前天气文本（只读取已有数据，不触发API调用）
const currentWeatherText = computed(() => {
  try {
    // 直接读取Weather组件已经加载的天气数据
    // weatherRef.value.currentWeather 是一个ref对象
    const weather = weatherRef.value?.currentWeather?.value?.weather
    if (weather) {
      console.log('获取到天气数据:', weather)
      return weather
    }
    
    // 备用方式：直接访问不带.value的方式
    const weatherAlt = weatherRef.value?.currentWeather?.weather
    if (weatherAlt) {
      console.log('备用方式获取到天气数据:', weatherAlt)
      return weatherAlt
    }
    
    return '获取中...'
  } catch (error) {
    console.warn('获取天气数据失败:', error)
    return '获取中...'
  }
})

// 处理标签页切换
const handleTabChanged = (tab) => {
  activeTab.value = tab
  
  // 切换地图显示模式，传递对应的筛选数据
  if (mapRef.value) {
    let filteredData = null
    if (tab === '驿站服务') {
      filteredData = currentFilteredWaystations.value
      // 如果当前有路线显示，使用专门的方法添加驿站（与路线共存）
      if (mapRef.value.hasActiveRoute()) {
        mapRef.value.addWaystationsToRoute(filteredData)
      } else {
        mapRef.value.switchMapMode(tab, filteredData)
      }
    } else if (tab === '常用地点') {
      filteredData = currentFilteredDestinations.value
      mapRef.value.switchMapMode(tab, filteredData)
    } else {
      mapRef.value.switchMapMode(tab, filteredData)
    }
  }
}

// 处理子导航点击
const handleSubNavClick = (subItem) => {
  // 这个函数现在由RouteNavigation组件控制是否调用
  // 只有非地区选择时才会调用到这里
  // 地区选择已经在RouteNavigation中被过滤掉，不会到达这里
  console.log('切换到面板:', subItem)
  activeTab.value = subItem
  
  // 切换地图显示模式，传递对应的筛选数据
  if (mapRef.value) {
    let filteredData = null
    if (subItem === '驿站服务') {
      filteredData = currentFilteredWaystations.value
      // 如果当前有路线显示，使用专门的方法添加驿站（与路线共存）
      if (mapRef.value.hasActiveRoute()) {
        mapRef.value.addWaystationsToRoute(filteredData)
      } else {
        mapRef.value.switchMapMode(subItem, filteredData)
      }
    } else if (subItem === '常用地点') {
      filteredData = currentFilteredDestinations.value
      mapRef.value.switchMapMode(subItem, filteredData)
    } else {
      mapRef.value.switchMapMode(subItem, filteredData)
    }
  }
}

// 处理路线生成
const handleRouteGenerated = (routeData) => {
  console.log('路线生成成功:', routeData)
  // 这里可以添加路线生成后的处理逻辑
}

// 处理起点变化
const handleStartPointChanged = (startPoint) => {
  console.log('起点变化:', startPoint)
}

// 处理终点变化
const handleEndPointChanged = (endPoint) => {
  console.log('终点变化:', endPoint)
}

// 处理路线选择
const handleRouteSelected = (route) => {
  console.log('选择路线:', route)
  
  // 构建路线数据用于显示路线信息面板
  const routeData = {
    route: {
      id: route.id,
      name: route.title,
      region: route.region,
      distance_km: parseInt(route.distance) || 0,
      estimated_days: parseInt(route.duration) || 0,
      road_condition: route.roadCondition,
      remarks: route.remarks,
      precautions: route.precautions
    },
    waypoints: route.waypoints || []
  }
  
  console.log('显示路线信息面板，路线数据:', routeData)
  
  // 显示路线信息面板（这会触发高程数据获取）
  if (mapRef.value && mapRef.value.showRouteInfoPanel) {
    mapRef.value.showRouteInfoPanel(routeData)
  }
}

// 处理路线可视化
const handleRouteVisualize = (routeData) => {
  console.log('开始可视化路线:', routeData)
  
  if (!mapRef.value) {
    console.error('地图引用不存在，无法可视化路线')
    return
  }
  
  if (!routeData.waypoints || routeData.waypoints.length < 2) {
    console.warn('路线途径点不足，无法可视化')
    return
  }
  
  try {
    // 在显示路线前，先切换到热门路线模式（清除驿站和目标点标记）
    if (mapRef.value) {
      mapRef.value.switchMapMode('热门路线')
    }
    
    // 调用地图组件的绘制路线功能
    const success = mapRef.value.drawRouteCurve(routeData.waypoints)
    
    if (success) {
      console.log('路线可视化成功')
      
      // 更新天气位置到路线起点
      const startPoint = routeData.waypoints[0]
      if (startPoint && startPoint.longitude && startPoint.latitude) {
        updateWeatherLocation(startPoint.longitude, startPoint.latitude)
        console.log('已更新天气位置到路线起点:', startPoint.name)
      }
    } else {
      console.error('路线可视化失败')
    }
    
  } catch (error) {
    console.error('路线可视化过程中发生错误:', error)
  }
}

// 处理使用导航功能显示路线（新方法）
const handleRouteNavigateWithMarkers = (routeData) => {
  console.log('=== RouteMain 接收到 route-navigate-with-markers 事件 ===')
  console.log('接收到路线数据:', routeData)
  console.log('mapRef.value:', mapRef.value)
  
  if (!mapRef.value) {
    console.error('地图引用未准备就绪')
    return
  }
  
  try {
    const { startPoint, endPoint, waypoints, route } = routeData
    
    if (!startPoint || !endPoint) {
      console.error('起点或终点数据不足')
      console.error('startPoint:', startPoint, 'endPoint:', endPoint)
      return
    }
    
    if (!route) {
      console.error('路线信息不存在')
      return
    }
    
    // 1. 首先确保隐藏所有导航面板，防止闪现
    if (mapRef.value.hideAllNavigationPanels) {
      mapRef.value.hideAllNavigationPanels()
    }
    
    // 2. 显示路线信息面板
    if (mapRef.value.showRouteInfoPanel) {
      mapRef.value.showRouteInfoPanel(routeData)
    }
    
    // 3. 提取途径点名称，匹配常用地点数据并显示
    const waypointNames = waypoints.map(wp => wp.name).filter(name => name && name.trim())
    console.log('途径点名称列表:', waypointNames)
    
    if (waypointNames.length > 0 && mapRef.value.showDestinationsByNames) {
      mapRef.value.showDestinationsByNames(waypointNames)
    }
    
    // 4. 设置导航起点和终点
    const startLng = parseFloat(startPoint.longitude)
    const startLat = parseFloat(startPoint.latitude)
    const endLng = parseFloat(endPoint.longitude)
    const endLat = parseFloat(endPoint.latitude)
    
    // 验证坐标有效性
    if (isNaN(startLng) || isNaN(startLat) || isNaN(endLng) || isNaN(endLat)) {
      console.error('坐标数据无效:', { startLng, startLat, endLng, endLat })
      alert('坐标数据无效，无法进行导航')
      return
    }
    
    console.log('设置导航起点:', startLng, startLat)
    console.log('设置导航终点:', endLng, endLat)
    
    // 5. 调用地图的导航功能（确保在隐藏状态下进行）
    if (mapRef.value.setNavigationStart && mapRef.value.setNavigationEnd && mapRef.value.startNavigation) {
      mapRef.value.setNavigationStart(startLng, startLat)
      mapRef.value.setNavigationEnd(endLng, endLat)
      
      // 6. 设置途径点数据（如果有的话）
      if (waypoints && waypoints.length > 2 && mapRef.value.setNavigationWaypoints) {
        // 过滤掉起点和终点，只保留中间的途径点
        const intermediateWaypoints = waypoints.slice(1, -1)
        console.log('设置中间途径点:', intermediateWaypoints)
        mapRef.value.setNavigationWaypoints(intermediateWaypoints)
      }
      
      // 延迟执行导航规划，确保面板状态、起终点和途径点设置完成
      setTimeout(() => {
        mapRef.value.startNavigation()
      }, 100)
    } else {
      console.error('地图导航方法不存在')
    }
    
    // 7. 更新天气位置到路线起点
    updateWeatherLocation(startLng, startLat)
    console.log('已更新天气位置到路线起点:', startPoint.name)
    
  } catch (error) {
    console.error('使用导航功能显示路线失败:', error)
    alert('导航功能启动失败: ' + error.message)
  }
}

// 处理轨迹回放
const handleTrajectoryPlayback = (trajectoryData) => {
  console.log('=== RouteMain 处理轨迹回放 ===')
  console.log('接收到轨迹数据:', trajectoryData)
  
  if (!mapRef.value) {
    console.error('地图引用未准备就绪')
    return
  }
  
  try {
    const { trajectoryPath, name } = trajectoryData
    
    if (!trajectoryPath || trajectoryPath.length < 2) {
      console.error('轨迹数据不足，无法进行回放。轨迹点数量:', trajectoryPath?.length || 0)
      alert('轨迹数据不足，无法进行回放')
      return
    }
    
    console.log('开始轨迹回放，轨迹点数量:', trajectoryPath.length)
    console.log('轨迹名称:', name)
    console.log('轨迹路径详情:', trajectoryPath)
    
    // 直接调用地图的轨迹回放方法，不显示控制面板
    if (mapRef.value.directTrajectoryPlayback) {
      mapRef.value.directTrajectoryPlayback(trajectoryPath, name)
    } else {
      console.error('directTrajectoryPlayback 方法不存在')
      alert('轨迹回放功能不可用')
    }
    
    console.log('轨迹回放启动流程完成')
    
  } catch (error) {
    console.error('轨迹回放失败:', error)
    alert('轨迹回放失败: ' + error.message)
  }
}

// 处理驿站选择
const handleStationSelected = (station) => {
  console.log('选择驿站:', station)
  
  // 调用地图组件的跳转功能
  if (mapRef.value && station.longitude && station.latitude) {
    console.log('正在跳转到驿站位置:', station.name, station.longitude, station.latitude)
    try {
      mapRef.value.jumpToLocation(station.longitude, station.latitude)
      console.log('地图跳转成功')
      
      // 更新天气位置
      updateWeatherLocation(station.longitude, station.latitude)
      console.log('已更新天气位置到驿站坐标')
    } catch (error) {
      console.error('地图跳转失败:', error)
    }
  } else {
    console.warn('无法跳转到驿站位置:', {
      hasMapRef: !!mapRef.value,
      longitude: station.longitude,
      latitude: station.latitude,
      stationName: station.name
    })
  }
}

// 处理筛选变化
const handleFiltersChanged = (filtered) => {
  console.log('筛选结果变化:', filtered.length, '个驿站')
  
  // 保存当前筛选状态
  currentFilteredWaystations.value = filtered
  
  // 同步更新地图标记点
  if (mapRef.value && activeTab.value === '驿站服务') {
    mapRef.value.updateMarkers(filtered)
  }
}

// 处理常用地点选择
const handleDestinationSelected = (destination) => {
  console.log('选择常用地点:', destination)
  
  // 如果有经纬度信息，可以跳转到地图位置
  if (mapRef.value && destination.longitude && destination.latitude) {
    console.log('正在跳转到地点位置:', destination.name, destination.longitude, destination.latitude)
    try {
      // 使用目标点标记类型进行跳转
      mapRef.value.jumpToLocation(destination.longitude, destination.latitude, 'destination')
      console.log('地图跳转成功')
      
      // 更新天气位置
      updateWeatherLocation(destination.longitude, destination.latitude)
      console.log('已更新天气位置到地点坐标')
    } catch (error) {
      console.error('地图跳转失败:', error)
    }
  }
}

// 处理目标点筛选变化
const handleDestinationsFiltered = (filteredDestinations) => {
  console.log('目标点筛选结果变化:', filteredDestinations.length, '个地点')
  
  // 保存当前筛选状态
  currentFilteredDestinations.value = filteredDestinations
  
  // 同步更新地图标记点
  if (mapRef.value && activeTab.value === '常用地点') {
    mapRef.value.updateDestinationMarkers(filteredDestinations)
  }
}

// 地区选择现在通过导航栏处理，移除相关处理函数

// 检查并重新初始化地图
const checkAndReinitializeMap = async () => {
  console.log('检查地图状态')
  
  if (!mapRef.value) {
    console.warn('地图引用不存在')
    return
  }
  
  // 等待DOM更新
  await nextTick()
  
  // 检查地图是否已初始化
  if (!mapRef.value.isMapInitialized) {
    console.log('地图未初始化，正在重新初始化...')
    try {
      await mapRef.value.reinitializeMap()
      console.log('地图重新初始化成功')
    } catch (error) {
      console.error('地图重新初始化失败:', error)
    }
  } else {
    console.log('地图已正常初始化')
  }
}

// 组件挂载时的初始化
onMounted(async () => {
  console.log('RouteMain 组件已挂载')
  
  // 延迟检查地图状态，确保DOM完全渲染
  setTimeout(checkAndReinitializeMap, 100)
})

// 路由激活时的处理（当从其他路由切换回来时）
onActivated(async () => {
  console.log('RouteMain 组件被激活（路由切换回来）')
  
  // 延迟检查地图状态，确保容器尺寸正确
  setTimeout(checkAndReinitializeMap, 300)
})

// 更新天气位置（预留接口，供后续经纬度获取逻辑调用）
const updateWeatherLocation = (longitude, latitude) => {
  console.log('更新天气位置:', { longitude, latitude })
  currentLongitude.value = longitude
  currentLatitude.value = latitude
  
  // 只更新坐标，不立即调用API获取天气（避免API调用限制）
  // Weather组件会在适当的时候自动更新天气信息
  // 如果需要立即更新天气，可以手动调用：
  // if (weatherRef.value) {
  //   weatherRef.value.getWeatherInfo(longitude, latitude)
  // }
}

// 暴露给父组件的方法和数据
defineExpose({
  activeTab,
  mapRef,
  filteredWaystations,
  weatherRef,
  updateWeatherLocation,
  currentLongitude,
  currentLatitude
})
</script>

<style scoped>
/* route页面容器 */
.route-page {
  width: 100vw !important;
  min-height: 100vh !important;
  position: relative;
}

/* 主内容区域布局 */
.main-content {
  min-height: 100vh;
  background-color: transparent;
  display: flex;
  padding: 20px;
  gap: 20px;
  position: relative;
}

/* 左侧地图容器 */
.map-container {
  flex: 0 0 60%;
  height: calc(100vh - 40px);
  background-color: rgba(255, 255, 255, 0.95);
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.05),
    0 8px 32px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
}

/* 天气组件容器 */
.weather-container {
  position: absolute;
  bottom: 20px;
  left: 20px;
  z-index: 300;
  pointer-events: auto;
}

/* 右侧功能面板 */
.content-right {
  flex: 0 0 40%;
  height: calc(100vh - 40px);
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.05),
    0 8px 32px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
}

/* 功能面板内容区 */
.panel-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  border-radius: 0 0 16px 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
    padding: 10px;
  }
  
  .map-container {
    flex: none;
    height: 50vh;
    margin-bottom: 10px;
  }
  
  .content-right {
    flex: none;
    height: auto;
    min-height: 50vh;
  }
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
  background: #4CAF50;
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: #45a049;
}
</style>
