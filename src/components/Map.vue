<template>
  <div class="map-wrapper">
    <div class="style-selector">
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
    <div id="container"></div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import axios from 'axios'

// 当前地图样式
const currentStyle = ref('whitesmoke')
// 地图实例
const mapInstance = ref(null)

// 跳转到指定位置
const jumpToLocation = (longitude, latitude) => {
  if (!mapInstance.value) return
  
  // 创建位置对象
  const position = new AMap.LngLat(longitude, latitude)
  
  // 平滑移动到目标位置
  mapInstance.value.setZoomAndCenter(15, position, true)
  
  // 创建带动画的图标内容
  const animatedContent = `
    <div class="custom-marker highlight-marker">
      <img 
        src="/marker-icon.png" 
        style="width: 30px; height: 34px;"
        onerror="this.src='https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png'"
      />
    </div>
  `

  // 添加临时标记
  const marker = new AMap.Marker({
    position: position,
    content: animatedContent,
    offset: new AMap.Pixel(-15, -34)
  })
  
  // 将标记添加到地图
  marker.setMap(mapInstance.value)
  
  // 3秒后移除标记
  setTimeout(() => {
    marker.setMap(null)
  }, 3000)
}

// 更新地图标记点
const updateMarkers = (filteredStations) => {
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

// 暴露方法给父组件
defineExpose({
  jumpToLocation,
  updateMarkers
})
// 存储所有驿站数据
const waystations = ref([])
// 存储所有标记点实例
const markers = ref([])
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

// 创建标记点内容
const createMarkerContent = () => {
  const iconPath = '/marker-icon.png'
  
  // 检查图标是否存在
  const checkImage = new Image()
  checkImage.onerror = () => {
    console.error(`标记点图标加载失败：${iconPath} 未找到，请确保图标文件存在于 public 目录下`)
  }
  checkImage.src = iconPath

  // 使用默认图标作为备选
  const defaultIcon = 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png'
  
  return `
    <div class="custom-marker">
      <img 
        src="${iconPath}" 
        style="width: 30px; height: 34px;"
        onerror="this.src='${defaultIcon}'; this.style.width='25px'; this.style.height='34px';"
      />
    </div>
  `
}

// 创建信息窗体内容
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

// 显示信息窗体
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

// 配置安全密钥
window._AMapSecurityConfig = {
  securityJsCode: '256b04738eb486d0bcb6a88487921c4f'
}

// 初始化地图
const initMap = async () => {
  try {
    const AMap = await AMapLoader.load({
      key: 'b7fb4f223f6cbffc2d995a508d10f7cd',
      version: '2.0'
    })

    const map = new AMap.Map('container', {
      viewMode: '2D',
      zoom: 11,
      center: [116.397428, 39.90923], // 默认中心点，后续可以调整
      mapStyle: `amap://styles/${currentStyle.value}`,
      dragEnable: true,      // 启用地图拖拽
      zoomEnable: true,      // 启用地图缩放
      doubleClickZoom: true, // 启用双击放大
      keyboard: true,        // 启用键盘操作
      scrollWheel: true      // 启用鼠标滚轮缩放
    })

    // 保存地图实例
    mapInstance.value = map
    
    // 获取驿站数据并添加标记点
    await fetchWaystations()
    
    return map
  } catch (error) {
    console.error('地图加载失败：', error)
  }
}

// 切换地图样式
const changeMapStyle = () => {
  if (mapInstance.value) {
    mapInstance.value.setMapStyle(`amap://styles/${currentStyle.value}`)
  }
}

// 组件挂载后初始化地图
onMounted(() => {
  // 为独立地图页面添加特殊类名
  if (window.location.pathname === '/map') {
    document.body.classList.add('map-body')
    document.getElementById('app').classList.add('map-page')
  }

  // 动态加载高德地图 API
  const script = document.createElement('script')
  script.src = 'https://webapi.amap.com/loader.js'
  script.async = true
  script.onload = () => {
    initMap()
  }
  document.head.appendChild(script)

  // 组件卸载时移除类名
  return () => {
    document.body.classList.remove('map-body')
    document.getElementById('app').classList.remove('map-page')
  }
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

/* 样式选择器 */
.style-selector {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 100;
  background: white;
  padding: 5px;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.style-selector select {
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: white;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  outline: none;
  min-width: 120px;
}

.style-selector select:hover {
  border-color: #c0c4cc;
}

.style-selector select:focus {
  border-color: #409eff;
}

/* 自定义标记点样式 */
.custom-marker {
  position: relative;
}

/* 信息窗体样式 */
:deep(.amap-info-content) {
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  max-width: 300px;
}

.info-window {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
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
