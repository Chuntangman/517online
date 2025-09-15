<template>
  <div class="map-wrapper">
    <!-- 3D切换按钮 - 左上角 -->
    <div class="mode-toggle-button" @click="toggleMapMode" :title="mapMode === '2D' ? '切换到3D地形' : '切换到2D平面'">
      <svg v-if="mapMode === '2D'" class="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <!-- 3D立体图标 -->
        <path d="M12 2L2 7v10l10 5 10-5V7L12 2z"/>
        <path d="M2 7l10 5 10-5"/>
        <path d="M12 12v10"/>
      </svg>
      <svg v-else class="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <!-- 2D平面图标 -->
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M9 9h6v6H9z"/>
      </svg>
      <span class="mode-text">{{ mapMode === '2D' ? '3D' : '2D' }}</span>
    </div>
    
    <!-- 地图样式选择器 - 右上角 -->
    <div class="map-controls">
      <div class="style-selector">
        <label>地图样式:</label>
        <select v-model="currentStyle" @change="changeMapStyle">
          <option value="normal">标准</option>
          <option value="dark">幻影黑</option>
          <option value="light">月光银</option>
          <option value="whitesmoke">远山黛</option>
          <option value="fresh">草色青</option>
          <option value="grey">雅士灰</option>
          <option value="graffiti">涂鸦</option>
          <option value="macaron">马卡龙</option>
          <option value="blue">靛青蓝</option>
          <option value="darkblue">极夜蓝</option>
          <option value="wine">酱籽</option>
        </select>
      </div>
    </div>
    
    <div id="container"></div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, nextTick, ref, watch } from 'vue'
import axios from 'axios'

// 当前地图样式
const currentStyle = ref('fresh')
// 地图模式 (2D/3D)
const mapMode = ref('2D')
// 地图实例
const mapInstance = ref(null)
// 地图初始化状态
const isMapInitialized = ref(false)
// 容器观察器
const resizeObserver = ref(null)
// 全局AMap实例缓存
let globalAMapInstance = null
// 当前路线曲线实例
const currentRouteCurve = ref(null)
// 当前路线标记点数组
const currentRouteMarkers = ref([])

// 跳转到指定位置
const jumpToLocation = (longitude, latitude, markerType = 'waystation') => {
  console.log('Map.vue - jumpToLocation 被调用:', { longitude, latitude, markerType })
  
  if (!mapInstance.value) {
    console.error('Map.vue - 地图实例未初始化，无法跳转到指定位置')
    return false
  }
  
  if (!longitude || !latitude || isNaN(longitude) || isNaN(latitude)) {
    console.error('Map.vue - 经纬度参数无效:', { longitude, latitude })
    return false
  }
  
  try {
    // 创建位置对象
    const position = new AMap.LngLat(longitude, latitude)
    
    // 平滑移动到目标位置
    mapInstance.value.setZoomAndCenter(15, position, true)
    console.log('Map.vue - 地图跳转成功，目标位置:', { longitude, latitude })
    
    // 根据标记类型创建不同的动画图标内容
    let animatedContent, offset
    
    if (markerType === 'destination') {
      // 目标点标记
      animatedContent = `
        <div class="custom-marker destination-marker highlight-marker">
          <img 
            src="/Map_Marker.png" 
            style="width: 32px; height: 32px;"
            onerror="this.src='https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png'"
          />
        </div>
      `
      offset = new AMap.Pixel(-16, -16)
    } else {
      // 驿站标记（默认）
      animatedContent = `
        <div class="custom-marker waystation-marker highlight-marker">
          <img 
            src="/marker-icon.png" 
            style="width: 30px; height: 34px;"
            onerror="this.src='https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png'"
          />
        </div>
      `
      offset = new AMap.Pixel(-15, -34)
    }

    // 添加临时标记
    const marker = new AMap.Marker({
      position: position,
      content: animatedContent,
      offset: offset
    })
    
    // 将标记添加到地图
    marker.setMap(mapInstance.value)
    
    // 3秒后移除标记
    setTimeout(() => {
      marker.setMap(null)
    }, 3000)
    
    return true
  } catch (error) {
    console.error('Map.vue - 地图跳转失败:', error)
    return false
  }
}

// 更新驿站地图标记点
const updateMarkers = (filteredStations) => {
  if (!mapInstance.value || !filteredStations) {
    console.warn('地图实例未初始化或数据为空，无法更新标记点')
    return
  }
  
  console.log('正在更新地图标记点，驿站数量:', filteredStations.length)
  
  // 清除所有现有标记点
  markers.value.forEach(marker => {
    marker.setMap(null)
  })
  markers.value = []

  // 添加筛选后的标记点
  filteredStations.forEach(station => {
    if (!station.longitude || !station.latitude) return

    const position = new AMap.LngLat(station.longitude, station.latitude)
    const marker = new AMap.Marker({
      position: position,
      content: createMarkerContent(),
      offset: new AMap.Pixel(-15, -34)
    })

    // 添加事件监听
    marker.on('mouseover', () => {
      hoverTimer.value = setTimeout(() => {
        showInfoWindow(marker, station)
      }, 1000)
    })

    marker.on('mouseout', () => {
      if (hoverTimer.value) {
        clearTimeout(hoverTimer.value)
        hoverTimer.value = null
      }
    })

    marker.on('click', () => {
      showInfoWindow(marker, station)
    })

    marker.setMap(mapInstance.value)
    markers.value.push(marker)
  })
}

// 更新目标点地图标记点
const updateDestinationMarkers = (filteredDestinations) => {
  if (!mapInstance.value || !filteredDestinations) {
    console.warn('地图实例未初始化或目标点数据为空，无法更新标记点')
    return
  }
  
  console.log('正在更新目标点标记，数量:', filteredDestinations.length)
  
  // 清除现有目标点标记
  destinationMarkers.value.forEach(marker => {
    marker.setMap(null)
  })
  destinationMarkers.value = []

  // 添加筛选后的目标点标记
  filteredDestinations.forEach(destination => {
    if (!destination.longitude || !destination.latitude) return

    const position = new AMap.LngLat(destination.longitude, destination.latitude)
    const marker = new AMap.Marker({
      position: position,
      content: createDestinationMarkerContent(),
      offset: new AMap.Pixel(-16, -16)
    })

    // 添加事件监听
    marker.on('mouseover', () => {
      hoverTimer.value = setTimeout(() => {
        showDestinationInfoWindow(marker, destination)
      }, 1000)
    })

    marker.on('mouseout', () => {
      if (hoverTimer.value) {
        clearTimeout(hoverTimer.value)
        hoverTimer.value = null
      }
    })

    marker.on('click', () => {
      showDestinationInfoWindow(marker, destination)
    })

    marker.setMap(mapInstance.value)
    destinationMarkers.value.push(marker)
  })
}

// defineExpose 将在所有函数定义后调用
// 存储所有驿站数据
const waystations = ref([])
// 存储所有目标点数据
const destinations = ref([])
// 存储所有标记点实例
const markers = ref([])
// 存储目标点标记实例
const destinationMarkers = ref([])
// 信息窗体实例
const infoWindow = ref(null)
// 标记点悬浮计时器
const hoverTimer = ref(null)

// 获取驿站数据
const fetchWaystations = async () => {
  try {
    const response = await axios.get('/api/v1/waystations')
    console.log('获取到的驿站数据：', response.data)
    
    if (!response.data.data || response.data.data.length === 0) {
      console.warn('没有获取到驿站数据')
      return
    }
    
    // 检查第一条数据的结构
    const firstStation = response.data.data[0]
    console.log('第一个驿站数据示例：', {
      name: firstStation.name,
      longitude: firstStation.longitude,
      latitude: firstStation.latitude,
      // 确保经纬度是数字类型
      isValidLng: !isNaN(firstStation.longitude),
      isValidLat: !isNaN(firstStation.latitude)
    })
    
    waystations.value = response.data.data
    addMarkersToMap()
  } catch (error) {
    console.error('获取驿站数据失败：', error)
  }
}

// 获取目标点数据
const fetchDestinations = async () => {
  try {
    const response = await axios.get('/api/v1/destinations')
    console.log('获取到的目标点数据：', response.data)
    
    if (!response.data.data || response.data.data.length === 0) {
      console.warn('没有获取到目标点数据')
      return
    }
    
    destinations.value = response.data.data
    console.log('目标点数据加载成功，共', destinations.value.length, '个目标点')
  } catch (error) {
    console.error('获取目标点数据失败：', error)
  }
}

// 创建驿站标记点内容
const createMarkerContent = () => {
  const iconPath = '/marker-icon.png'
  
  // 检查图标是否存在
  const checkImage = new Image()
  checkImage.onerror = () => {
    console.error(`驿站标记点图标加载失败：${iconPath} 未找到，请确保图标文件存在于 public 目录下`)
  }
  checkImage.src = iconPath

  // 使用默认图标作为备选
  const defaultIcon = 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png'
  
  return `
    <div class="custom-marker waystation-marker">
      <img 
        src="${iconPath}" 
        style="width: 30px; height: 34px;"
        onerror="this.src='${defaultIcon}'; this.style.width='25px'; this.style.height='34px';"
      />
    </div>
  `
}

// 创建目标点标记点内容
const createDestinationMarkerContent = () => {
  const iconPath = '/Map_Marker.png'
  
  // 检查图标是否存在
  const checkImage = new Image()
  checkImage.onerror = () => {
    console.error(`目标点标记图标加载失败：${iconPath} 未找到，请确保图标文件存在于 public 目录下`)
  }
  checkImage.src = iconPath

  // 使用默认图标作为备选
  const defaultIcon = 'https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png'
  
  return `
    <div class="custom-marker destination-marker">
      <img 
        src="${iconPath}" 
        style="width: 32px; height: 32px;"
        onerror="this.src='${defaultIcon}'; this.style.width='25px'; this.style.height='34px';"
      />
    </div>
  `
}

// 创建驿站信息窗体内容
const createInfoWindowContent = (waystation) => {
  const getServiceIcon = (value) => {
    return value === 1 
      ? '<span style="color: #67C23A;">✓</span>' 
      : '<span style="color: #F56C6C;">✗</span>'
  }

  return `
    <div class="info-window">
      <h3>${waystation.name}</h3>
      <p><strong>地址：</strong>${waystation.address}</p>
      <p><strong>联系方式：</strong>${waystation.contact}</p>
      <p><strong>备注：</strong>${waystation.remarks || '无'}</p>
      <div class="services">
        <p><strong>提供服务：</strong></p>
        <ul>
          <li>住宿：${getServiceIcon(waystation.accommodation)}</li>
          <li>租车：${getServiceIcon(waystation.bike_rental)}</li>
          <li>还车：${getServiceIcon(waystation.bike_return)}</li>
          <li>维修：${getServiceIcon(waystation.maintenance)}</li>
        </ul>
      </div>
    </div>
  `
}

// 创建目标点信息窗体内容
const createDestinationInfoWindowContent = (destination) => {
  return `
    <div class="info-window">
      <h3>${destination.name}</h3>
      <p><strong>地区：</strong>${destination.region || '待补充'}</p>
      <p><strong>介绍：</strong>${destination.description || '待补充'}</p>
      ${destination.longitude && destination.latitude ? 
        `<p><strong>坐标：</strong>${destination.longitude}, ${destination.latitude}</p>` : ''
      }
      ${destination.nearest_waystation_name ? 
        `<p><strong>最近驿站：</strong>${destination.nearest_waystation_name}
         ${destination.nearest_waystation_distance ? `(${destination.nearest_waystation_distance}km)` : ''}</p>` : ''
      }
      ${destination.popular_route_name ? 
        `<p><strong>热门线路：</strong>${destination.popular_route_name}</p>` : ''
      }
    </div>
  `
}

// 显示驿站信息窗体
const showInfoWindow = (marker, waystation) => {
  if (!infoWindow.value) {
    infoWindow.value = new AMap.InfoWindow({
      offset: new AMap.Pixel(0, -40),
      closeWhenClickMap: true
    })
  }
  
  infoWindow.value.setContent(createInfoWindowContent(waystation))
  infoWindow.value.open(mapInstance.value, marker.getPosition())
}

// 显示目标点信息窗体
const showDestinationInfoWindow = (marker, destination) => {
  if (!infoWindow.value) {
    infoWindow.value = new AMap.InfoWindow({
      offset: new AMap.Pixel(0, -40),
      closeWhenClickMap: true
    })
  }
  
  infoWindow.value.setContent(createDestinationInfoWindowContent(destination))
  infoWindow.value.open(mapInstance.value, marker.getPosition())
}

// 添加标记点到地图
const addMarkersToMap = () => {
  if (!mapInstance.value) {
    console.error('地图实例未初始化')
    return
  }
  
  if (!waystations.value.length) {
    console.warn('没有驿站数据可显示')
    return
  }

  console.log('开始添加标记点，驿站数量：', waystations.value.length)

  // 清除现有标记点
  markers.value.forEach(marker => {
    marker.remove()
  })
  markers.value = []

  // 添加新标记点
  waystations.value.forEach((waystation, index) => {
    // 检查经纬度是否有效
    const lng = parseFloat(waystation.longitude)
    const lat = parseFloat(waystation.latitude)
    
    if (!lng || !lat || isNaN(lng) || isNaN(lat)) {
      console.error(`驿站 ${waystation.name || index} 的经纬度无效:`, 
        { longitude: waystation.longitude, latitude: waystation.latitude })
      return
    }

    console.log(`添加标记点 ${index + 1}:`, {
      name: waystation.name,
      position: [waystation.longitude, waystation.latitude]
    })

    const position = new AMap.LngLat(waystation.longitude, waystation.latitude)
    const marker = new AMap.Marker({
      position: position,
      content: createMarkerContent(),
      offset: new AMap.Pixel(-15, -34) // 调整偏移量以适应新的图标尺寸
    })

    // 添加事件监听
    marker.on('mouseover', () => {
      hoverTimer.value = setTimeout(() => {
        showInfoWindow(marker, waystation)
      }, 1000)
    })

    marker.on('mouseout', () => {
      if (hoverTimer.value) {
        clearTimeout(hoverTimer.value)
        hoverTimer.value = null
      }
    })

    marker.on('click', () => {
      showInfoWindow(marker, waystation)
    })

    marker.setMap(mapInstance.value)
    markers.value.push(marker)
  })
}

// 添加目标点标记到地图
const addDestinationMarkersToMap = () => {
  if (!mapInstance.value) {
    console.error('地图实例未初始化')
    return
  }
  
  if (!destinations.value.length) {
    console.warn('没有目标点数据可显示')
    return
  }

  console.log('开始添加目标点标记，数量：', destinations.value.length)

  // 清除现有目标点标记
  destinationMarkers.value.forEach(marker => {
    marker.setMap(null)
  })
  destinationMarkers.value = []

  // 添加新的目标点标记
  destinations.value.forEach((destination, index) => {
    // 检查经纬度是否有效
    const lng = parseFloat(destination.longitude)
    const lat = parseFloat(destination.latitude)
    
    if (!lng || !lat || isNaN(lng) || isNaN(lat)) {
      console.warn(`目标点 ${destination.name || index} 的经纬度无效:`, 
        { longitude: destination.longitude, latitude: destination.latitude })
      return
    }

    console.log(`添加目标点标记 ${index + 1}:`, {
      name: destination.name,
      position: [destination.longitude, destination.latitude]
    })

    const position = new AMap.LngLat(destination.longitude, destination.latitude)
    const marker = new AMap.Marker({
      position: position,
      content: createDestinationMarkerContent(),
      offset: new AMap.Pixel(-16, -16) // 调整偏移量以适应Map_Marker.png图标
    })

    // 添加事件监听
    marker.on('mouseover', () => {
      hoverTimer.value = setTimeout(() => {
        showDestinationInfoWindow(marker, destination)
      }, 1000)
    })

    marker.on('mouseout', () => {
      if (hoverTimer.value) {
        clearTimeout(hoverTimer.value)
        hoverTimer.value = null
      }
    })

    marker.on('click', () => {
      showDestinationInfoWindow(marker, destination)
    })

    marker.setMap(mapInstance.value)
    destinationMarkers.value.push(marker)
  })
}

// 清除目标点标记
const clearDestinationMarkers = () => {
  destinationMarkers.value.forEach(marker => {
    marker.setMap(null)
  })
  destinationMarkers.value = []
  console.log('已清除所有目标点标记')
}

// 配置安全密钥
window._AMapSecurityConfig = {
  securityJsCode: '256b04738eb486d0bcb6a88487921c4f'
}

// 检查容器是否准备就绪
const isContainerReady = () => {
  const container = document.getElementById('container')
  if (!container) {
    console.warn('地图容器不存在')
    return false
  }
  
  const rect = container.getBoundingClientRect()
  const isVisible = rect.width > 0 && rect.height > 0
  
  console.log('容器状态检查:', {
    exists: !!container,
    width: rect.width,
    height: rect.height,
    isVisible
  })
  
  return isVisible
}

// 初始化地图
const initMap = async (retryCount = 0, savedCenter = null, savedZoom = null) => {
  try {
    console.log(`开始初始化地图 (尝试第 ${retryCount + 1} 次)，模式: ${mapMode.value}`)
    
    // 检查容器是否准备就绪
    if (!isContainerReady()) {
      if (retryCount < 3) {
        console.log('容器未准备就绪，500ms后重试')
        setTimeout(() => initMap(retryCount + 1, savedCenter, savedZoom), 500)
        return
      } else {
        console.error('容器准备超时，地图初始化失败')
        return
      }
    }

    // 如果地图已经初始化，先销毁
    if (mapInstance.value) {
      console.log('销毁现有地图实例')
      mapInstance.value.destroy()
      mapInstance.value = null
    }

    // 获取或加载AMap实例，避免重复加载
    let AMap = globalAMapInstance
    if (!AMap) {
      console.log('首次加载AMap API')
      AMap = await AMapLoader.load({
        key: 'b7fb4f223f6cbffc2d995a508d10f7cd',
        version: '2.1Beta' // 统一使用2.1Beta版本，同时支持2D和3D
      })
      globalAMapInstance = AMap
      console.log('AMap API加载完成并缓存')
    } else {
      console.log('使用缓存的AMap实例')
    }

    // 根据地图模式设置不同的配置
    const mapConfig = {
      dragEnable: true,      // 启用地图拖拽
      zoomEnable: true,      // 启用地图缩放
      doubleClickZoom: true, // 启用双击放大
      keyboard: true,        // 启用键盘操作
      scrollWheel: true,     // 启用鼠标滚轮缩放
      mapStyle: `amap://styles/${currentStyle.value}`,
      center: savedCenter || [116.397428, 39.90923], // 使用保存的中心点或默认中心点
      zoom: savedZoom || 11 // 使用保存的缩放级别或默认值
    }

    if (mapMode.value === '3D') {
      // 3D地形图配置
      Object.assign(mapConfig, {
        viewMode: '3D',        // 3D视图模式
        terrain: true,         // 开启地形图
        pitch: 50,            // 地图俯仰角度
        rotateEnable: true,   // 启用地图旋转交互
        pitchEnable: true,    // 启用地图倾斜交互
        rotation: -15,        // 初始地图顺时针旋转角度
        zooms: [2, 20]        // 地图显示的缩放级别范围
      })
    } else {
      // 2D平面图配置
      mapConfig.viewMode = '2D'
    }

    console.log('地图配置:', mapConfig)
    const map = new AMap.Map('container', mapConfig)

    // 等待地图完全加载
    map.on('complete', async () => {
      console.log(`地图初始化完成 (${mapMode.value}模式)`)
      isMapInitialized.value = true
      
      // 添加地图控制插件
      await addMapControls(map)
      
      // 在3D模式下添加中键拖拽支持
      if (mapMode.value === '3D') {
        setupMiddleMouseDrag(map)
      }
      
      // 获取驿站和目标点数据
      await fetchWaystations()
      await fetchDestinations()
    })

    // 保存地图实例
    mapInstance.value = map
    
    return map
  } catch (error) {
    console.error('地图加载失败：', error)
    isMapInitialized.value = false
  }
}

// 设置中键拖拽支持
const setupMiddleMouseDrag = (map) => {
  console.log('设置3D地图中键拖拽支持')
  
  const container = map.getContainer()
  let isDragging = false
  let startX = 0
  let startY = 0
  let startRotation = 0
  let startPitch = 0
  
  // 禁用默认的右键和Ctrl+左键交互
  container.addEventListener('contextmenu', (e) => {
    if (mapMode.value === '3D') {
      e.preventDefault()
    }
  })
  
  // 中键按下
  container.addEventListener('mousedown', (e) => {
    if (e.button === 1) { // 中键
      e.preventDefault()
      e.stopPropagation()
      isDragging = true
      startX = e.clientX
      startY = e.clientY
      startRotation = map.getRotation()
      startPitch = map.getPitch()
      container.style.cursor = 'grabbing'
      console.log('开始中键拖拽')
    }
  })
  
  // 防止中键点击时的默认行为（如打开新标签页）
  container.addEventListener('auxclick', (e) => {
    if (e.button === 1) {
      e.preventDefault()
      e.stopPropagation()
    }
  })
  
  // 鼠标移动
  container.addEventListener('mousemove', (e) => {
    if (isDragging && e.buttons === 4) { // 中键按下状态
      e.preventDefault()
      
      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY
      
      // 计算新的旋转角度 (水平移动控制旋转)
      const rotationSensitivity = 0.5
      const newRotation = startRotation + (deltaX * rotationSensitivity)
      
      // 计算新的俯仰角度 (垂直移动控制俯仰)
      const pitchSensitivity = 0.3
      const newPitch = Math.max(0, Math.min(83, startPitch - (deltaY * pitchSensitivity)))
      
      // 应用新的视角
      map.setRotation(newRotation)
      map.setPitch(newPitch)
    }
  })
  
  // 中键释放
  container.addEventListener('mouseup', (e) => {
    if (e.button === 1 && isDragging) {
      isDragging = false
      container.style.cursor = 'grab'
      console.log('结束中键拖拽')
    }
  })
  
  // 鼠标离开地图容器
  container.addEventListener('mouseleave', () => {
    if (isDragging) {
      isDragging = false
      container.style.cursor = 'grab'
    }
  })
  
  // 设置初始鼠标样式
  container.style.cursor = 'grab'
}

// 添加地图控制插件
const addMapControls = async (map) => {
  return new Promise((resolve) => {
    console.log('开始加载地图控制插件，当前模式:', mapMode.value)
    
    // 异步加载控制插件
    AMap.plugin(['AMap.ControlBar', 'AMap.ToolBar'], function () {
      try {
        // 地图旋转控制插件 (在3D模式下更有用)
        const controlBarConfig = {
          position: {
            right: '10px',
            top: '80px' // 调整位置避免与地图控制器重叠
          },
          showControlButton: mapMode.value === '3D', // 3D模式显示倾斜、旋转控制
          showZoomBar: false,      // 不显示缩放条（由ToolBar处理）
          showDirectionButton: true // 显示指北针
        }
        
        const controlBar = new AMap.ControlBar(controlBarConfig)
        
        // 地图缩放工具插件
        const toolBarConfig = {
          position: {
            right: '10px',
            top: mapMode.value === '3D' ? '140px' : '110px' // 根据ControlBar调整位置
          },
          ruler: false,        // 不显示标尺
          noIpLocate: true,    // 不显示定位按钮
          locate: false,       // 不显示定位按钮
          liteStyle: true,     // 使用精简样式
          direction: false,    // 不显示方向按钮（由ControlBar处理）
          autoPosition: false  // 不自动定位
        }
        
        const toolBar = new AMap.ToolBar(toolBarConfig)
        
        // 添加控件到地图
        map.addControl(controlBar)
        map.addControl(toolBar)
        
        console.log(`地图控制插件加载完成 (${mapMode.value}模式)`)
        console.log('- ControlBar 3D控制:', mapMode.value === '3D' ? '启用' : '禁用')
        console.log('- ToolBar 缩放控制: 启用')
        
        resolve()
        
      } catch (error) {
        console.error('地图控制插件加载失败:', error)
        resolve() // 即使失败也继续执行
      }
    })
  })
}

// 切换地图样式
const changeMapStyle = () => {
  if (mapInstance.value) {
    mapInstance.value.setMapStyle(`amap://styles/${currentStyle.value}`)
  }
}

// 切换地图视图模式 (2D/3D)
const toggleMapMode = async () => {
  // 切换模式
  const newMode = mapMode.value === '2D' ? '3D' : '2D'
  console.log('切换地图模式:', mapMode.value, '→', newMode)
  
  if (!mapInstance.value) {
    console.warn('地图实例不存在，无法切换模式')
    return
  }
  
  try {
    // 保存当前的中心点和缩放级别
    const center = mapInstance.value.getCenter()
    const zoom = mapInstance.value.getZoom()
    
    console.log('保存当前地图状态:', { center, zoom })
    
    // 更新模式
    mapMode.value = newMode
    
    // 销毁现有地图实例
    mapInstance.value.destroy()
    mapInstance.value = null
    isMapInitialized.value = false
    
    // 等待DOM更新
    await nextTick()
    
    // 重新初始化地图
    await initMap(0, center, zoom)
    
    // 如果切换到3D模式，确保中键拖拽功能正常
    if (newMode === '3D' && mapInstance.value) {
      setupMiddleMouseDrag(mapInstance.value)
    }
    
  } catch (error) {
    console.error('切换地图模式失败:', error)
    // 如果切换失败，恢复到原来的状态
    mapMode.value = mapMode.value === '2D' ? '3D' : '2D'
    await nextTick()
    await initMap()
  }
}

// 设置容器尺寸监听
const setupResizeObserver = () => {
  const container = document.getElementById('container')
  if (!container || !window.ResizeObserver) return

  resizeObserver.value = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect
      console.log('容器尺寸变化:', { width, height })
      
      // 如果容器变成可见且地图未初始化，重新初始化
      if (width > 0 && height > 0 && !isMapInitialized.value) {
        console.log('容器变为可见，重新初始化地图')
        nextTick(() => {
          initMap()
        })
      }
      
      // 如果地图已存在，调整尺寸
      if (mapInstance.value && isMapInitialized.value) {
        setTimeout(() => {
          mapInstance.value.getSize()
          mapInstance.value.setFitView()
        }, 100)
      }
    }
  })
  
  resizeObserver.value.observe(container)
}

// 强制重新初始化地图（暴露给父组件调用）
const reinitializeMap = async () => {
  console.log('强制重新初始化地图')
  isMapInitialized.value = false
  
  await nextTick()
  await initMap()
}

// 切换地图显示模式
const switchMapMode = (mode, filteredData = null) => {
  console.log('切换地图显示模式:', mode, '筛选数据长度:', filteredData?.length)
  
  if (mode === '驿站服务') {
    // 显示驿站标记，保留已有的路线（如果有的话）
    if (filteredData) {
      updateMarkers(filteredData)
    } else {
      addMarkersToMap()
    }
    clearDestinationMarkers()
  } else if (mode === '常用地点') {
    // 显示目标点标记，清除驿站标记，保留路线
    if (filteredData) {
      updateDestinationMarkers(filteredData)
    } else {
      addDestinationMarkersToMap()
    }
    // 清除驿站标记
    markers.value.forEach(marker => marker.setMap(null))
    markers.value = []
  } else if (mode === '热门路线') {
    // 热门路线模式：清除驿站和目标点标记，只显示路线
    markers.value.forEach(marker => marker.setMap(null))
    markers.value = []
    clearDestinationMarkers()
    // 注意：不清除路线曲线和路线标记，让用户可以继续查看路线
  } else {
    // 其他模式默认显示驿站标记
    addMarkersToMap()
    clearDestinationMarkers()
  }
}

// 绘制路线贝塞尔曲线
const drawRouteCurve = (waypoints) => {
  if (!mapInstance.value || !waypoints || waypoints.length < 2) {
    console.warn('无法绘制路线：地图未初始化或途径点不足')
    return false
  }

  // 清除现有路线
  clearRouteCurve()

  try {
    // 过滤出有效的经纬度点
    const validPoints = waypoints.filter(wp => 
      wp.longitude && wp.latitude && 
      !isNaN(wp.longitude) && !isNaN(wp.latitude)
    )

    if (validPoints.length < 2) {
      console.warn('有效途径点不足，无法绘制路线')
      return false
    }

    console.log('开始绘制路线，有效途径点数量:', validPoints.length)

    // 构建贝塞尔曲线路径
    const path = buildBezierPath(validPoints)

    // 创建贝塞尔曲线
    const bezierCurve = new AMap.BezierCurve({
      path: path,
      strokeWeight: 6,           // 线条宽度
      strokeColor: "#4CAF50",    // 线条颜色（绿色）
      isOutline: true,           // 显示描边
      outlineColor: "#ffffff",   // 描边颜色（白色）
      borderWeight: 2,           // 描边宽度
      strokeOpacity: 0.8,        // 线条透明度
      strokeStyle: "solid"       // 线条样式
    })

    // 将曲线添加到地图
    mapInstance.value.add(bezierCurve)
    currentRouteCurve.value = bezierCurve

    // 调整地图视角以显示完整路线
    adjustMapViewForRoute(validPoints)

    // 添加途径点标记
    addRouteWaypointMarkers(validPoints)

    console.log('路线曲线绘制成功')
    return true

  } catch (error) {
    console.error('绘制路线曲线失败:', error)
    return false
  }
}

// 构建贝塞尔曲线路径
const buildBezierPath = (points) => {
  if (points.length === 2) {
    // 两点之间的简单路径，添加轻微弧度
    const startPoint = [points[0].longitude, points[0].latitude]
    const endPoint = [points[1].longitude, points[1].latitude]
    
    // 计算中点并添加轻微偏移作为控制点
    const midPoint = [
      (startPoint[0] + endPoint[0]) / 2,
      (startPoint[1] + endPoint[1]) / 2
    ]
    
    // 添加垂直于连线的轻微偏移（很小的弧度）
    const dx = endPoint[0] - startPoint[0]
    const dy = endPoint[1] - startPoint[1]
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    // 控制弧度大小，距离越远弧度越明显，但总体保持很小
    const arcFactor = Math.min(distance * 0.1, 0.005) // 最大0.005度的偏移
    
    const controlPoint = [
      midPoint[0] + dy * arcFactor, // 垂直方向的偏移
      midPoint[1] - dx * arcFactor
    ]
    
    return [
      [startPoint],
      [controlPoint, endPoint]
    ]
  }

  const path = []

  for (let i = 0; i < points.length; i++) {
    const currentPoint = [points[i].longitude, points[i].latitude]

    if (i === 0) {
      // 起点
      path.push([currentPoint])
    } else if (i === points.length - 1) {
      // 终点，使用很轻微的控制点
      const prevPoint = [points[i - 1].longitude, points[i - 1].latitude]
      const controlPoint = [
        prevPoint[0] + (currentPoint[0] - prevPoint[0]) * 0.8, // 减少控制点距离
        prevPoint[1] + (currentPoint[1] - prevPoint[1]) * 0.8
      ]
      path.push([controlPoint, currentPoint])
    } else {
      // 中间点，使用更温和的控制点算法
      const prevPoint = [points[i - 1].longitude, points[i - 1].latitude]
      const nextPoint = [points[i + 1].longitude, points[i + 1].latitude]
      
      // 使用更小的控制点偏移，减少弧度
      const factor1 = 0.9 // 前控制点更接近前一个点
      const factor2 = 0.1 // 后控制点更接近当前点
      
      const controlPoint1 = [
        prevPoint[0] + (currentPoint[0] - prevPoint[0]) * factor1,
        prevPoint[1] + (currentPoint[1] - prevPoint[1]) * factor1
      ]
      const controlPoint2 = [
        currentPoint[0] + (nextPoint[0] - currentPoint[0]) * factor2,
        currentPoint[1] + (nextPoint[1] - currentPoint[1]) * factor2
      ]
      
      path.push([controlPoint1, controlPoint2, currentPoint])
    }
  }

  return path
}

// 调整地图视角以显示完整路线
const adjustMapViewForRoute = (points) => {
  if (!mapInstance.value || !points || points.length === 0) return

  try {
    // 计算边界
    let minLng = points[0].longitude
    let maxLng = points[0].longitude
    let minLat = points[0].latitude
    let maxLat = points[0].latitude

    points.forEach(point => {
      minLng = Math.min(minLng, point.longitude)
      maxLng = Math.max(maxLng, point.longitude)
      minLat = Math.min(minLat, point.latitude)
      maxLat = Math.max(maxLat, point.latitude)
    })

    // 添加边距
    const padding = 0.01 // 约1km的边距
    minLng -= padding
    maxLng += padding
    minLat -= padding
    maxLat += padding

    // 创建边界
    const bounds = new AMap.Bounds([minLng, minLat], [maxLng, maxLat])
    
    // 调整地图视角
    mapInstance.value.setBounds(bounds, false, [20, 20, 20, 20])

    console.log('地图视角已调整以显示完整路线')
  } catch (error) {
    console.error('调整地图视角失败:', error)
  }
}

// 添加路线途径点标记
const addRouteWaypointMarkers = (points) => {
  if (!mapInstance.value || !points) return

  points.forEach((point, index) => {
    const position = new AMap.LngLat(point.longitude, point.latitude)
    
    // 根据位置确定标记样式，使用常用地点风格
    let markerContent
    if (index === 0) {
      // 起点 - 使用绿色地点标记风格
      markerContent = `
        <div class="destination-route-marker start-point">
          <div class="marker-pin">
            <div class="marker-icon">🏁</div>
          </div>
          <div class="marker-label">起点</div>
        </div>
      `
    } else if (index === points.length - 1) {
      // 终点 - 使用红色地点标记风格
      markerContent = `
        <div class="destination-route-marker end-point">
          <div class="marker-pin">
            <div class="marker-icon">🏆</div>
          </div>
          <div class="marker-label">终点</div>
        </div>
      `
    } else {
      // 途径点 - 使用蓝色地点标记风格
      markerContent = `
        <div class="destination-route-marker way-point">
          <div class="marker-pin">
            <div class="marker-icon">📍</div>
          </div>
          <div class="marker-label">${point.name.length > 6 ? point.name.substring(0, 6) + '...' : point.name}</div>
        </div>
      `
    }

    const marker = new AMap.Marker({
      position: position,
      content: markerContent,
      offset: new AMap.Pixel(-20, -50) // 调整偏移量以适应新的标记样式
    })

    // 添加点击事件显示详情
    marker.on('click', () => {
      showRouteWaypointInfo(marker, point, index, points.length)
    })

    marker.setMap(mapInstance.value)
    // 将标记点保存到路线标记数组中
    currentRouteMarkers.value.push(marker)
  })
}

// 显示路线途径点信息（常用地点风格）
const showRouteWaypointInfo = (marker, point, index, totalPoints) => {
  if (!infoWindow.value) {
    infoWindow.value = new AMap.InfoWindow({
      offset: new AMap.Pixel(0, -50),
      closeWhenClickMap: true
    })
  }

  let pointType = '途径点'
  let typeIcon = '📍'
  let typeColor = '#1976d2'
  
  if (index === 0) {
    pointType = '起点'
    typeIcon = '🏁'
    typeColor = '#4CAF50'
  } else if (index === totalPoints - 1) {
    pointType = '终点'
    typeIcon = '🏆'
    typeColor = '#f44336'
  }
  
  const content = `
    <div class="destination-info-window">
      <div class="info-header">
        <span class="point-type-icon">${typeIcon}</span>
        <div class="header-text">
          <h3>${point.name}</h3>
          <span class="point-type-badge" style="background-color: ${typeColor}">${pointType}</span>
        </div>
      </div>
      
      <div class="info-content">
        <div class="info-section">
          <div class="info-item">
            <span class="info-label">🌍 地区</span>
            <span class="info-value">${point.region || '待补充'}</span>
          </div>
          
          ${point.description && point.description !== '暂无' ? 
            `<div class="info-item">
              <span class="info-label">📝 介绍</span>
              <span class="info-value description-text">${point.description}</span>
            </div>` : ''
          }
          
          ${point.longitude && point.latitude ? 
            `<div class="info-item">
              <span class="info-label">📍 坐标</span>
              <span class="info-value coordinates">${point.longitude}, ${point.latitude}</span>
            </div>` : ''
          }
          
          ${point.nearest_waystation_name && point.nearest_waystation_name !== '暂无' ? 
            `<div class="info-item">
              <span class="info-label">🏨 最近驿站</span>
              <span class="info-value">${point.nearest_waystation_name}
               ${point.nearest_waystation_distance ? `<span class="distance">(${point.nearest_waystation_distance}km)</span>` : ''}</span>
            </div>` : ''
          }
          
          ${point.popular_route_name && point.popular_route_name !== '暂无' ? 
            `<div class="info-item">
              <span class="info-label">🚴 热门线路</span>
              <span class="info-value">${point.popular_route_name}</span>
            </div>` : ''
          }
        </div>
        
        <div class="info-actions">
          <button class="info-action-btn" onclick="window.openDestinationDetail && window.openDestinationDetail(${point.id})">
            查看详情
          </button>
        </div>
      </div>
    </div>
  `
  
  infoWindow.value.setContent(content)
  infoWindow.value.open(mapInstance.value, marker.getPosition())
}

// 清除路线曲线和相关标记
const clearRouteCurve = () => {
  // 清除路线曲线
  if (currentRouteCurve.value && mapInstance.value) {
    mapInstance.value.remove(currentRouteCurve.value)
    currentRouteCurve.value = null
    console.log('已清除路线曲线')
  }
  
  // 清除路线标记点
  if (currentRouteMarkers.value.length > 0 && mapInstance.value) {
    currentRouteMarkers.value.forEach(marker => {
      marker.setMap(null)
    })
    currentRouteMarkers.value = []
    console.log('已清除路线标记点')
  }
}

// 组件挂载后初始化地图
onMounted(async () => {
  console.log('Map组件挂载')
  
  // 为独立地图页面添加特殊类名
  if (window.location.pathname === '/map') {
    document.body.classList.add('map-body')
    document.getElementById('app').classList.add('map-page')
  }

  // 等待DOM更新
  await nextTick()

  // 动态加载高德地图 API
  const existingScript = document.querySelector('script[src="https://webapi.amap.com/loader.js"]')
  
  if (existingScript) {
    // 如果脚本已存在，直接初始化
    console.log('高德地图API已加载，直接初始化')
    try {
      await initMap()
      setupResizeObserver()
    } catch (error) {
      console.error('地图初始化失败:', error)
    }
  } else {
    // 加载新脚本
    console.log('加载高德地图API')
    const script = document.createElement('script')
    script.src = 'https://webapi.amap.com/loader.js'
    script.async = true
    script.onload = async () => {
      console.log('高德地图API加载完成')
      try {
        await initMap()
        setupResizeObserver()
      } catch (error) {
        console.error('地图初始化失败:', error)
      }
    }
    script.onerror = () => {
      console.error('高德地图API加载失败')
    }
    document.head.appendChild(script)
  }
})

// 组件卸载时的清理
onUnmounted(() => {
  console.log('Map组件卸载')
  
  // 销毁地图实例
  if (mapInstance.value) {
    mapInstance.value.destroy()
    mapInstance.value = null
  }
  
  // 停止尺寸监听
  if (resizeObserver.value) {
    resizeObserver.value.disconnect()
    resizeObserver.value = null
  }
  
  // 清理计时器
  if (hoverTimer.value) {
    clearTimeout(hoverTimer.value)
    hoverTimer.value = null
  }
  
  // 移除特殊类名
  document.body.classList.remove('map-body')
  const appElement = document.getElementById('app')
  if (appElement) {
    appElement.classList.remove('map-page')
  }
  
  // 重置状态
  isMapInitialized.value = false
  
  // 注意：不清理 globalAMapInstance，让其他组件实例可以复用
})

// 检查是否有活动路线
const hasActiveRoute = () => {
  return currentRouteCurve.value !== null
}

// 添加驿站标记（与现有路线共存）
const addWaystationsToRoute = (filteredData = null) => {
  console.log('添加驿站标记到现有路线')
  if (filteredData) {
    updateMarkers(filteredData)
  } else {
    addMarkersToMap()
  }
}

// 暴露方法给父组件
defineExpose({
  jumpToLocation,
  updateMarkers,
  updateDestinationMarkers,
  reinitializeMap,
  isMapInitialized,
  switchMapMode,
  addDestinationMarkersToMap,
  clearDestinationMarkers,
  drawRouteCurve,
  clearRouteCurve,
  addWaystationsToRoute,
  hasActiveRoute
})
</script>

<style>
/* 基础样式 */
.map-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

/* 标记点动画 */
@keyframes markerHighlight {
  0% {
    transform: scale(1);
    filter: brightness(100%);
  }
  50% {
    transform: scale(1.2);
    filter: brightness(120%);
  }
  100% {
    transform: scale(1);
    filter: brightness(100%);
  }
}

.highlight-marker {
  animation: markerHighlight 1s ease infinite;
  transform-origin: center bottom;
}

/* 3D模式切换按钮 */
.mode-toggle-button {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  border: none;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
  user-select: none;
}

.mode-toggle-button:hover {
  background: rgba(64, 158, 255, 0.1);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.mode-toggle-button:active {
  transform: translateY(0);
}

.mode-icon {
  width: 20px;
  height: 20px;
  stroke-width: 2;
  color: #606266;
  transition: color 0.2s ease;
}

.mode-toggle-button:hover .mode-icon {
  color: #409eff;
}

.mode-text {
  font-size: 12px;
  font-weight: 600;
  color: #606266;
  transition: color 0.2s ease;
}

.mode-toggle-button:hover .mode-text {
  color: #409eff;
}

/* 地图控制器容器 */
.map-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 样式选择器 */
.style-selector,
.terrain-selector {
  background: white;
  padding: 8px 12px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 160px;
}

.style-selector label,
.terrain-selector label {
  font-size: 12px;
  color: #606266;
  font-weight: 500;
  white-space: nowrap;
}

.style-selector select,
.terrain-selector select {
  padding: 6px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: white;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  outline: none;
  flex: 1;
  min-width: 0;
}

.style-selector select:hover,
.terrain-selector select:hover {
  border-color: #c0c4cc;
}

.style-selector select:focus,
.terrain-selector select:focus {
  border-color: #409eff;
}

/* 地图控制插件样式优化 */
:deep(.amap-controlbar) {
  background: rgba(255, 255, 255, 0.9) !important;
  border-radius: 6px !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
  backdrop-filter: blur(10px);
}

:deep(.amap-toolbar) {
  background: rgba(255, 255, 255, 0.9) !important;
  border-radius: 6px !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
  backdrop-filter: blur(10px);
}

:deep(.amap-controlbar .amap-controlbar-btn),
:deep(.amap-toolbar .amap-btn) {
  background: transparent !important;
  border: none !important;
  transition: all 0.2s ease !important;
}

:deep(.amap-controlbar .amap-controlbar-btn:hover),
:deep(.amap-toolbar .amap-btn:hover) {
  background: rgba(64, 158, 255, 0.1) !important;
  transform: scale(1.05);
}

/* 响应式设计 */
@media (max-width: 768px) {
  /* 3D切换按钮移动端优化 */
  .mode-toggle-button {
    top: 5px;
    left: 5px;
    padding: 10px;
    border-radius: 6px;
  }
  
  .mode-icon {
    width: 18px;
    height: 18px;
  }
  
  .mode-text {
    font-size: 11px;
  }
  
  .map-controls {
    flex-direction: row;
    flex-wrap: wrap;
    top: 5px;
    right: 5px;
    justify-content: flex-end;
  }
  
  .style-selector {
    min-width: 140px;
    padding: 6px 10px;
  }
  
  .style-selector label {
    font-size: 11px;
  }
  
  .style-selector select {
    font-size: 12px;
    padding: 4px 6px;
  }
  
  /* 移动端优化控制插件位置 */
  :deep(.amap-controlbar) {
    right: 5px !important;
    top: 70px !important;
  }
  
  :deep(.amap-toolbar) {
    right: 5px !important;
    top: 130px !important;
  }
}

/* 自定义标记点样式 */
.custom-marker {
  position: relative;
}

.waystation-marker {
  z-index: 100;
}

.destination-marker {
  z-index: 200;
}

.destination-marker img {
  border-radius: 50%;
  border: 2px solid #ff6b6b;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
}

.waystation-marker img {
  border-radius: 4px;
  border: 2px solid #4CAF50;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

/* 常用地点风格的路线标记 */
.destination-route-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 300;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
}

.destination-route-marker:hover {
  transform: translateY(-2px);
}

.marker-pin {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  border: 3px solid #ffffff;
  margin-bottom: 8px;
}

.marker-pin::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  background: inherit;
  border-radius: 50%;
  bottom: -4px;
  right: -4px;
  box-shadow: inherit;
}

.destination-route-marker.start-point .marker-pin {
  background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%);
}

.destination-route-marker.end-point .marker-pin {
  background: linear-gradient(135deg, #f44336 0%, #EF5350 100%);
}

.destination-route-marker.way-point .marker-pin {
  background: linear-gradient(135deg, #2196F3 0%, #42A5F5 100%);
}

.marker-icon {
  transform: rotate(45deg);
  font-size: 18px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

.marker-label {
  background: rgba(255, 255, 255, 0.95);
  color: #333;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.1);
  white-space: nowrap;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.destination-route-marker.start-point .marker-label {
  color: #4CAF50;
}

.destination-route-marker.end-point .marker-label {
  color: #f44336;
}

.destination-route-marker.way-point .marker-label {
  color: #2196F3;
}

/* 信息窗体样式 */
:deep(.amap-info-content) {
  padding: 0;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  max-width: 350px;
  overflow: hidden;
}

/* 常用地点风格的信息窗口 */
.destination-info-window {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.info-header {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #e9ecef;
}

.point-type-icon {
  font-size: 24px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.header-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.header-text h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
}

.point-type-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  color: white;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-content {
  padding: 16px 20px;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #f8f9fa;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 14px;
  min-width: 80px;
  color: #6c757d;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.info-value {
  flex: 1;
  color: #2c3e50;
  font-size: 14px;
  line-height: 1.4;
  word-break: break-word;
}

.description-text {
  font-style: italic;
  color: #495057;
}

.coordinates {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 4px;
  color: #6c757d;
}

.distance {
  color: #28a745;
  font-weight: 500;
  font-size: 13px;
}

.info-actions {
  padding-top: 12px;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: center;
}

.info-action-btn {
  background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);
}

.info-action-btn:hover {
  background: linear-gradient(135deg, #45a049 0%, #5cb85c 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

/* 保留原有简单信息窗口的样式 */
.info-window {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  padding: 15px;
}

.info-window h3 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.info-window p {
  margin: 8px 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.4;
}

.info-window strong {
  color: #303133;
  font-weight: 600;
}

.info-window .services {
  margin-top: 10px;
}

.info-window .services ul {
  list-style: none;
  padding: 0;
  margin: 5px 0 0 0;
}

.info-window .services li {
  display: inline-block;
  margin-right: 15px;
  color: #606266;
  font-size: 14px;
}

.info-window .services li:last-child {
  margin-right: 0;
}

#container {
  width: 100%;
  height: 100%;
}

/* 地图容器样式 */
:deep(.amap-container) {
  width: 100% !important;
  height: 100% !important;
}

/* 独立地图页面样式 */
:global(.map-page) .map-wrapper,
:global(.map-page) #container,
:global(.map-page) :deep(.amap-container) {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  margin: 0 !important;
  padding: 0 !important;
}
</style>
