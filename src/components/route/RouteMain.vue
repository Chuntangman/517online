<template>
  <div class="route-page">
    <!-- 主内容区域 -->
    <main class="main-content">
      <!-- 左侧地图容器 -->
      <div class="map-container">
        <Map ref="mapRef" />
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
            @start-point-changed="handleStartPointChanged"
            @end-point-changed="handleEndPointChanged"
          />

          <!-- 热门路线展示 -->
          <PopularRoutes 
            v-show="activeTab === '热门路线'"
            @route-selected="handleRouteSelected"
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

          <!-- 骑行攻略展示 -->
          <CyclingGuide 
            v-show="activeTab === '骑行攻略'"
            @guide-item-clicked="handleGuideItemClick"
          />

          <!-- 地区选择和路线展示 -->
          <RegionContent 
            v-show="activeTab === '地区' || regions.includes(activeTab)"
            :activeTab="activeTab"
            @region-selected="handleRegionSelected"
            @back-to-regions="handleBackToRegions"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Map from '@/components/Map.vue'
import RouteNavigation from './RouteNavigation.vue'
import RoutePlanning from './RoutePlanning.vue'
import PopularRoutes from './PopularRoutes.vue'
import WaystationService from './WaystationService.vue'
import CyclingGuide from './CyclingGuide.vue'
import RegionContent from './RegionContent.vue'
import { useNavigation } from '@/composables/useNavigation.js'
import { useWaystation } from '@/composables/useWaystation.js'
import { regions } from '@/config/routeConfig.js'

// 使用组合式函数
const { activeTab } = useNavigation()
const { fetchWaystations, filteredWaystations } = useWaystation()

// 组件引用
const mapRef = ref(null)
const navigationRef = ref(null)
const waystationRef = ref(null)

// 处理标签页切换
const handleTabChanged = (tab) => {
  activeTab.value = tab
}

// 处理子导航点击
const handleSubNavClick = (subItem) => {
  activeTab.value = subItem
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
  // 这里可以添加路线选择后的处理逻辑
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
  
  // 同步更新地图标记点
  if (mapRef.value && activeTab.value === '驿站服务') {
    mapRef.value.updateMarkers(filtered)
  }
}

// 处理攻略项目点击
const handleGuideItemClick = (guideData) => {
  console.log('点击攻略项:', guideData)
}

// 处理地区选择
const handleRegionSelected = (region) => {
  activeTab.value = region
}

// 处理返回地区选择
const handleBackToRegions = () => {
  activeTab.value = '地区'
}

// 组件挂载时的初始化
onMounted(() => {
  console.log('RouteMain 组件已挂载')
  // 驿站数据由 WaystationService 组件自己获取
})

// 暴露给父组件的方法和数据
defineExpose({
  activeTab,
  mapRef,
  filteredWaystations
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
