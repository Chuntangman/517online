<template>
  <div class="trajectory-playback">
    <!-- 标题显示 -->
    <div class="demo-title">
      <h1>镜头--{{ currentTrajectoryName }}</h1>
      <h3>使用轨迹追踪能力追踪导航路径</h3>
      </div>

    <!-- 主控制按钮 - 右下角 -->
    <div class="main-control">
              <button 
        class="start-btn" 
        @click="toggleTracking"
        :disabled="!canStartTracking"
      >
        {{ isTracking ? '停止镜头追踪' : '开始镜头追踪' }}
              </button>
          </div>

    <!-- 速度选择器 - 地图正下方 -->
    <div class="speed-selector-bottom">
      <div class="speed-selector-container">
        <label class="speed-label">追踪速度:</label>
        <div class="speed-options">
            <button 
            v-for="speed in speedOptions" 
            :key="speed.value"
            class="speed-option-btn"
            :class="{ active: selectedSpeed === speed.value }"
            @click="selectedSpeed = speed.value"
          >
            {{ speed.label }}
            </button>
            </div>
          </div>
        </div>

        <!-- 错误信息显示 -->
        <div v-if="errorMessage" class="error-message">
      <p>{{ errorMessage }}</p>
          </div>

    <!-- 调试信息已移除 -->
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

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

const emit = defineEmits(['trajectory-loaded', 'playback-started', 'playback-paused', 'playback-stopped', 'playback-completed', 'map-reinitialization-needed'])

// 响应式数据
const isTracking = ref(false)
const errorMessage = ref('')
const currentTrajectoryName = ref('准备中...')
const selectedSpeed = ref('60000') // 默认中等速度60秒
const currentTrajectoryPath = ref([])

// 速度选项
const speedOptions = ref([
  { value: '30000', label: '快速 (30秒)' },
  { value: '60000', label: '中等 (60秒)' },
  { value: '90000', label: '慢速 (90秒)' }
])

// Loca实例
const locaInstance = ref(null)
// 地图相关对象
const marker = ref(null)
const trajectoryPolyline = ref(null)
const cameraTrackingActive = ref(false)

// 预设轨迹数据（保留用于兼容性）
const presetTrajectories = ref([
  {
    name: '北京三环路段',
    description: '包含多个转弯的三环路段轨迹',
    path: [
      [116.368904, 39.915119], [116.370123, 39.916234], [116.372456, 39.918123],
      [116.375234, 39.919456], [116.376789, 39.921234], [116.377123, 39.923567],
      [116.376234, 39.925789], [116.374567, 39.927123], [116.372345, 39.928456],
      [116.369876, 39.929234], [116.367234, 39.928567], [116.365789, 39.926789],
      [116.365123, 39.924456], [116.366456, 39.922123], [116.368234, 39.919876],
      [116.369567, 39.917234]
    ]
  },
  {
    name: '故宫周边游览路线',
    description: '围绕故宫的复杂游览轨迹',
    path: [
      [116.397428, 39.916023], [116.398234, 39.917456], [116.398789, 39.918234],
      [116.399456, 39.919567], [116.400123, 39.920234], [116.401567, 39.920789],
      [116.402234, 39.921456], [116.402789, 39.922123], [116.401456, 39.922567],
      [116.400123, 39.922789], [116.398789, 39.922456], [116.397456, 39.921789],
      [116.396789, 39.920456], [116.396234, 39.919123], [116.396789, 39.918234],
      [116.397234, 39.917456]
    ]
  }
])

// 计算属性
const canStartTracking = computed(() => {
  return props.mapInstance && currentTrajectoryPath.value.length > 0
})

// 方法定义
const clearError = () => {
  errorMessage.value = ''
}

// 初始化Loca库
const initLoca = async () => {
  if (!props.mapInstance) {
    console.error('地图实例未准备就绪')
    return false
  }

  try {
    // 检查是否已加载Loca
    if (!window.Loca) {
      console.log('Loca库未加载，尝试加载...')
      // 这里应该通过AMapLoader加载Loca，但由于已有地图实例，我们假设Loca已加载
      // 如果没有加载，需要重新初始化地图以包含Loca
      throw new Error('Loca库未加载，请确保地图初始化时包含Loca配置')
    }

    // 创建Loca实例
    locaInstance.value = new window.Loca.Container({
      map: props.mapInstance
    })

    console.log('Loca实例创建成功')
    return true
  } catch (error) {
    console.error('Loca初始化失败:', error)
    errorMessage.value = 'Loca库初始化失败，请确保地图支持3D模式'
    return false
  }
}

// 切换镜头追踪
const toggleTracking = async () => {
  console.log('切换镜头追踪状态，当前速度:', selectedSpeed.value)
  if (isTracking.value) {
    stopCameraTracking()
  } else {
    await startCameraTracking()
  }
}

// 保持原有方法名的兼容性
const toggleCameraTracking = toggleTracking

// 开始镜头追踪
const startCameraTracking = async () => {
  console.log('开始镜头追踪')
    clearError()
  
  if (!props.mapInstance) {
    errorMessage.value = '地图实例未准备就绪'
    return
  }

  if (currentTrajectoryPath.value.length === 0) {
    errorMessage.value = '没有可用的轨迹数据'
        return
      }

  try {
    // 按照官方示例重新创建3D地图
    console.log('重新创建3D地图以匹配官方示例...')
    
    // 销毁现有地图
    if (props.mapInstance && typeof props.mapInstance.destroy === 'function') {
      props.mapInstance.destroy()
    }
    
    // 按照官方示例的配置创建新的3D地图，优化轨迹线显示
    const newMapConfig = {
      terrain: true,
      viewMode: '3D',
      zoom: 13.5,
      center: currentTrajectoryPath.value[0], // 使用轨迹起点
      pitch: 45,
      rotation: -90,
      showLabel: true,
      mapStyle: 'amap://styles/509934ebf66e54cbfe10ccae0056c462',
      showBuildingBlock: false,
      dragEnable: false,
      zoomEnable: false,
      // 优化3D地形显示设置，提高轨迹线可见性
      terrainExaggeration: 0.5,  // 降低地形夸张系数，减少遮挡
      showTerrain: true,
      skyColor: '#87CEEB',  // 设置天空颜色，增强对比度
      // 添加更多优化选项
      showIndoorMap: false,  // 关闭室内地图
      defaultCursor: 'default',
      // 优化瓦片加载策略（使用AMap支持的配置项）
      preloadMode: true,  // 启用预加载模式
      expandZoomRange: true  // 扩展缩放范围的瓦片加载
    }
    
    console.log('新地图配置:', newMapConfig)
    
    // 确保容器存在且可用
    const container = document.getElementById('container')
    if (!container) {
      throw new Error('地图容器不存在')
    }
    console.log('地图容器状态:', container)
    
    const new3DMap = new AMap.Map('container', newMapConfig)
    console.log('新3D地图对象创建完成:', new3DMap)
    console.log('新3D地图的容器ID:', new3DMap.getContainer().id)
    console.log('新3D地图实例类型:', typeof new3DMap)
    
    // 等待地图完全加载
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('地图加载超时'))
      }, 15000) // 增加超时时间以支持瓦片预加载
      
      new3DMap.on('complete', () => {
        clearTimeout(timeout)
        console.log('3D地图创建完成')
        resolve()
      })
    })
    
    // 完整预加载轨迹范围的瓦片
    console.log('🚀 开始预加载轨迹区域瓦片...')
    await preloadTrajectoryTiles(new3DMap, (progress) => {
      console.log(`预加载进度: ${progress}%`)
    })
    console.log('✅ 瓦片预加载完成，准备开始动画')
    
    // 额外等待确保瓦片完全加载
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    console.log('🎬 初始化轨迹回放组件...')
    
    // 更新地图实例引用
    Object.defineProperty(props, 'mapInstance', {
      value: new3DMap,
      writable: true,
      configurable: true
    })
    
    // 创建局部变量确保run函数能正确访问
    const mapInstance = new3DMap
    
    // 创建Loca实例
    locaInstance.value = new window.Loca.Container({
      map: new3DMap
    })
    
    // 创建标记和轨迹线（确保使用新的3D地图实例）
    console.log('🎯 开始创建标记和轨迹线...')
    createTrackMarker(new3DMap)
    drawTrajectoryPath(new3DMap)
    
    console.log('✅ 轨迹组件创建完成')
    
    console.log('🚀 开始轨迹回放动画！')
    
    
    // 按照官方示例启动动画
    await startTrajectoryAnimation(new3DMap)

    isTracking.value = true
    emit('playback-started')
    
  } catch (error) {
    console.error('开始镜头追踪失败:', error)
    errorMessage.value = `开始镜头追踪失败: ${error.message}`
  }
}

// 简化的轨迹范围预加载（设置地图边界来触发瓦片加载）
const preloadTrajectoryTiles = async (mapInstance, progressCallback = null) => {
  console.log('🚀 开始轨迹范围预加载...')
  
  if (!currentTrajectoryPath.value || currentTrajectoryPath.value.length === 0) {
    console.warn('没有轨迹路径数据，跳过预加载')
    return
  }
  
  try {
    const totalPoints = currentTrajectoryPath.value.length
    console.log(`📍 轨迹包含 ${totalPoints} 个途径点`)
    
    // 计算轨迹边界
    const bounds = calculateTrajectoryBounds(currentTrajectoryPath.value)
    console.log('轨迹边界范围:', bounds)
    
    if (progressCallback) progressCallback(30)
    
    // 创建边界对象并设置给地图，这会触发相应区域的瓦片加载
    const boundingBox = new AMap.Bounds(
      [bounds.minLng, bounds.minLat],
      [bounds.maxLng, bounds.maxLat]
    )
    
    // 使用setBounds来预加载轨迹范围的瓦片
    mapInstance.setBounds(boundingBox, false, [50, 50, 50, 50])
    
    if (progressCallback) progressCallback(60)
    
    // 等待瓦片加载
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    if (progressCallback) progressCallback(90)
    
    // 恢复到轨迹起点
    const startPoint = currentTrajectoryPath.value[0]
    mapInstance.setZoomAndCenter(13.5, startPoint, false)
    
    await new Promise(resolve => setTimeout(resolve, 500))
    
    console.log('✅ 轨迹范围预加载完成')
    if (progressCallback) progressCallback(100)
    
  } catch (error) {
    console.error('❌ 预加载过程中出错:', error)
    if (progressCallback) progressCallback(100)
  }
}

// 计算轨迹边界
const calculateTrajectoryBounds = (trajectory) => {
  let minLng = Infinity, maxLng = -Infinity
  let minLat = Infinity, maxLat = -Infinity
  
  trajectory.forEach(point => {
    const lng = Array.isArray(point) ? point[0] : point.longitude || point.lng
    const lat = Array.isArray(point) ? point[1] : point.latitude || point.lat
    
    if (lng < minLng) minLng = lng
    if (lng > maxLng) maxLng = lng
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
  })
  
  // 添加更大的边界缓冲区，确保完整覆盖轨迹周围区域
  const lngRange = maxLng - minLng
  const latRange = maxLat - minLat
  
  // 动态缓冲区：轨迹越长，缓冲区相对越小；轨迹越短，缓冲区相对越大
  const baseLngBuffer = Math.max(lngRange * 0.15, 0.005) // 至少500米缓冲
  const baseLatBuffer = Math.max(latRange * 0.15, 0.005) // 至少500米缓冲
  
  return {
    minLng: minLng - baseLngBuffer,
    maxLng: maxLng + baseLngBuffer,
    minLat: minLat - baseLatBuffer,
    maxLat: maxLat + baseLatBuffer
  }
}

// 获取轨迹关键点（用于预加载）
const getKeyTrajectoryPoints = (trajectory, count) => {
  if (trajectory.length <= count) {
    return trajectory.map(point => 
      Array.isArray(point) ? [point[0], point[1]] : [point.longitude || point.lng, point.latitude || point.lat]
    )
  }
  
  const keyPoints = []
  const step = Math.floor(trajectory.length / count)
  
  for (let i = 0; i < count; i++) {
    const index = i * step
    const point = trajectory[index]
    keyPoints.push(
      Array.isArray(point) ? [point[0], point[1]] : [point.longitude || point.lng, point.latitude || point.lat]
    )
  }
  
  // 确保包含终点
  const lastPoint = trajectory[trajectory.length - 1]
  keyPoints.push(
    Array.isArray(lastPoint) ? [lastPoint[0], lastPoint[1]] : [lastPoint.longitude || lastPoint.lng, lastPoint.latitude || lastPoint.lat]
  )
  
  return keyPoints
}

// 生成点周围的瓦片预加载点（用于更全面的瓦片覆盖）
const generateSurroundingPoints = (centerPoint, radius) => {
  const [centerLng, centerLat] = centerPoint
  const surroundingPoints = []
  
  // 生成8个方向的点（东、西、南、北、东南、东北、西南、西北）
  const directions = [
    [1, 0],    // 东
    [-1, 0],   // 西
    [0, 1],    // 北
    [0, -1],   // 南
    [1, 1],    // 东北
    [1, -1],   // 东南
    [-1, 1],   // 西北
    [-1, -1]   // 西南
  ]
  
  directions.forEach(([lngOffset, latOffset]) => {
    surroundingPoints.push([
      centerLng + lngOffset * radius,
      centerLat + latOffset * radius
    ])
  })
  
  return surroundingPoints
}

// 简化的瓦片就绪检查
const waitForTilesReady = async (mapInstance) => {
  console.log('⏳ 检查地图就绪状态...')
  
  return new Promise((resolve) => {
    let checkCount = 0
    const maxChecks = 3 // 最多检查3次，每次1秒
    
    const checkTileStatus = () => {
      checkCount++
      console.log(`🔍 第${checkCount}次检查地图状态...`)
      
      // 检查地图是否完全加载
      if (mapInstance && typeof mapInstance.getStatus === 'function') {
        const status = mapInstance.getStatus()
        
        if (status && status.loaded) {
          console.log('✅ 地图已就绪！')
          resolve()
          return
        }
      }
      
      // 如果达到最大检查次数，强制继续
      if (checkCount >= maxChecks) {
        console.log('⏰ 检查完成，继续执行...')
        resolve()
        return
      }
      
      // 继续等待
      setTimeout(checkTileStatus, 1000)
    }
    
    // 开始检查
    checkTileStatus()
  })
}


// 按照官方示例的简化轨迹动画
const startTrajectoryAnimation = async (mapInstance) => {
  console.log('🎬 开始轨迹动画...')
  
  // 按照官方示例设置全局变量
  window.movingDraw = true
  window.trajectoryAnimationFinished = false
  
    // 使用Loca原生机制的平滑轨迹绘制
  let animationStartTime = Date.now()
  let lastUpdateTime = animationStartTime
  let currentPathIndex = 0
  
  const smoothRun = () => {
    if (!window.trajectoryAnimationFinished && trajectoryPolyline.value && marker.value && isTracking.value) {
      try {
        const now = Date.now()
        const elapsed = now - animationStartTime
        const progress = Math.min(elapsed / duration, 1)
        
        // 减少更新频率到每100ms一次，降低CPU消耗
        if (now - lastUpdateTime >= 100) {
          lastUpdateTime = now
          
          // 计算当前应该显示的路径长度
          const totalPoints = currentTrajectoryPath.value.length
          const targetIndex = Math.floor(progress * totalPoints)
          
          if (targetIndex > currentPathIndex) {
            currentPathIndex = targetIndex
            
            // 获取当前应该显示的路径段
            const pathToShow = currentTrajectoryPath.value.slice(0, currentPathIndex + 1).map(point => {
              if (Array.isArray(point) && point.length >= 2) {
                return [point[0], point[1], 100]
              }
              return point
            })
            
            // 更新轨迹线（平滑显示）
            if (pathToShow.length >= 2) {
              trajectoryPolyline.value.setPath(pathToShow)
            }
            
            // 更新标记位置到最新点
            const currentPoint = pathToShow[pathToShow.length - 1]
            marker.value.setPosition(currentPoint)
            
            // 简化日志输出
            if (currentPathIndex % 3 === 0) {  // 每3个点输出一次
              console.log(`🎬 轨迹进度: ${(progress * 100).toFixed(0)}%`)
            }
          }
        }
      } catch (error) {
        console.warn('轨迹绘制错误:', error.message)
      }
    }
    
    if (!window.trajectoryAnimationFinished && isTracking.value) {
      requestAnimationFrame(smoothRun)
    }
  }
  
  // 启动Loca动画
  locaInstance.value.animate.start()
  
  // 启动优化后的平滑轨迹绘制
  smoothRun()
  
  console.log('✅ 轨迹绘制系统已启动')
  
  // 启动动态瓦片加载
  startDynamicTileLoading()
  
  // 开始镜头追踪
  startViewControlTracking()
  
  console.log('🎉 轨迹回放动画启动完成！')
}

// 动态瓦片加载 - 在移动过程中预加载前方瓦片
const startDynamicTileLoading = () => {
  let lastCheckTime = Date.now()
  let lastCenter = null
  
  const checkAndLoadTiles = () => {
    if (!window.trajectoryAnimationFinished && isTracking.value && props.mapInstance) {
      const now = Date.now()
      
      // 每2秒检查一次
      if (now - lastCheckTime > 2000) {
        const currentCenter = props.mapInstance.getCenter()
        
        // 如果位置发生了显著变化，预加载前方区域
        if (!lastCenter || 
            Math.abs(currentCenter.lng - lastCenter.lng) > 0.01 || 
            Math.abs(currentCenter.lat - lastCenter.lat) > 0.01) {
          
          console.log('🔄 动态预加载前方瓦片')
          
          // 计算移动方向并预加载前方区域
          let bounds
          if (lastCenter) {
            const deltaLng = currentCenter.lng - lastCenter.lng
            const deltaLat = currentCenter.lat - lastCenter.lat
            
            // 基于移动方向扩展预加载区域
            const expandLng = Math.abs(deltaLng) * 2 + 0.01
            const expandLat = Math.abs(deltaLat) * 2 + 0.01
            
            bounds = new AMap.Bounds(
              [currentCenter.lng - expandLng, currentCenter.lat - expandLat],
              [currentCenter.lng + expandLng, currentCenter.lat + expandLat]
            )
          } else {
            // 首次加载，使用标准区域
            bounds = new AMap.Bounds(
              [currentCenter.lng - 0.015, currentCenter.lat - 0.015],
              [currentCenter.lng + 0.015, currentCenter.lat + 0.015]
            )
          }
          
          // 触发瓦片加载（静默方式）
          try {
            const currentZoom = props.mapInstance.getZoom()
            const currentCenter = props.mapInstance.getCenter()
            props.mapInstance.setBounds(bounds, false, [20, 20, 20, 20])
            // 恢复原始视角
            setTimeout(() => {
              props.mapInstance.setZoomAndCenter(currentZoom, currentCenter, false)
            }, 100)
          } catch (error) {
            // 静默处理错误，不影响用户体验
          }
          
          lastCenter = currentCenter
          lastCheckTime = now
        }
      }
    }
    
    // 继续检查
    if (!window.trajectoryAnimationFinished && isTracking.value) {
      setTimeout(checkAndLoadTiles, 1000)
    }
  }
  
  // 启动检查
  setTimeout(checkAndLoadTiles, 1000)
  console.log('🔄 动态瓦片加载已启动')
}

// 停止镜头追踪
const stopCameraTracking = () => {
  console.log('停止镜头追踪')
  
  // 停止路径绘制动画
  if (window.trajectoryAnimationFinished !== undefined) {
    window.trajectoryAnimationFinished = true
  }
  
  // 停止视角追踪
  if (locaInstance.value && locaInstance.value.viewControl) {
    try {
      // 检查stop方法是否存在
      if (typeof locaInstance.value.viewControl.stop === 'function') {
        locaInstance.value.viewControl.stop()
        console.log('视角追踪已停止')
      } else {
        console.log('viewControl.stop方法不可用，跳过停止操作')
      }
    } catch (error) {
      console.log('停止视角控制失败，继续执行清理:', error.message)
    }
  }

  // 清除标记
  if (marker.value) {
    marker.value.setMap(null)
    marker.value = null
  }
  
  // 清除轨迹线
  if (trajectoryPolyline.value) {
    trajectoryPolyline.value.setMap(null)
    trajectoryPolyline.value = null
  }
  
  // 需要重新初始化原始地图以恢复正常功能
  // 由于我们重新创建了3D地图，停止时需要通知父组件重新初始化地图
  console.log('镜头追踪停止，需要重新初始化地图')
  emit('map-reinitialization-needed')

  isTracking.value = false
  cameraTrackingActive.value = false
  emit('playback-stopped')
}

// 创建轨迹标记（按照官方示例）
const createTrackMarker = (targetMap = null) => {
  if (marker.value) {
    marker.value.setMap(null)
  }

  // 使用传入的地图实例或默认地图实例
  const mapToUse = targetMap || props.mapInstance

  // 标记初始位置在轨迹起点，随镜头移动到终点
  const startPosition = currentTrajectoryPath.value[0]
  
  // 智能处理标记位置：根据原始数据格式决定高度处理
  let markerPosition = startPosition
  if (Array.isArray(startPosition)) {
    if (startPosition.length === 2) {
      // 2D数据，保持2D格式让地图自动处理高度
      markerPosition = [startPosition[0], startPosition[1]]
    } else if (startPosition.length >= 3) {
      // 3D数据，保持原有高度
      markerPosition = [startPosition[0], startPosition[1], startPosition[2]]
    }
  }
  
  console.log('标记初始位置（起点）:', markerPosition)
  
  marker.value = new AMap.Marker({
    position: markerPosition,
    content: '<div style="width: 20px; height: 20px; background: #FF0000; border-radius: 50%; border: 3px solid #FFFFFF; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
    anchor: 'center',
    zIndex: 3000,  // 确保标记在轨迹线之上
    map: mapToUse
  })
  
  console.log('🚩 标记创建完成')
}

// 绘制轨迹路径（按照官方示例）
const drawTrajectoryPath = (targetMap = null) => {
  if (trajectoryPolyline.value) {
    trajectoryPolyline.value.setMap(null)
  }

  // 检查轨迹路径是否有效
  if (!currentTrajectoryPath.value || currentTrajectoryPath.value.length === 0) {
    console.error('轨迹路径为空，无法绘制')
    return
  }
  
  // 使用传入的地图实例或默认地图实例
  const mapToUse = targetMap || props.mapInstance
  
  // 轨迹线从起点开始绘制
  const startPoint = currentTrajectoryPath.value[0]
  console.log('🎨 创建轨迹线，起始点:', startPoint)
  
  // 轨迹线初始时只显示起点，通过run函数逐步绘制
  // 对于3D地图，确保所有点都有高度信息
  const pathWith3D = [startPoint, startPoint].map(point => {
    if (Array.isArray(point)) {
      if (point.length === 2) {
        // 2D数据：为3D地图添加高度
        return [point[0], point[1], 100]  // 添加100米高度确保在3D地图中可见
      } else if (point.length >= 3) {
        // 3D数据：保持原有高度，但确保不为0
        return [point[0], point[1], Math.max(point[2], 50)]
      }
    }
    return point
  })
  
  console.log('🗺️ 轨迹线初始化为起点，将通过动画逐步绘制')
  
  // 根据数据类型优化轨迹线配置
  const is2DData = pathWith3D.every(point => Array.isArray(point) && point.length === 2)
  
  trajectoryPolyline.value = new AMap.Polyline({
    path: pathWith3D,
    isOutline: true,
    outlineColor: '#FFFFFF',
    borderWeight: 3,
    strokeColor: '#FF4444',  // 使用更显眼的红色
    strokeOpacity: 0.9,
    strokeWeight: 20,        // 增加线宽，更容易看到
    strokeStyle: 'solid',
    lineJoin: 'round',
    lineCap: 'round',
    zIndex: 2000,            // 提高层级确保在最上层
    showDir: true,           // 显示方向箭头
    visible: true,
    map: mapToUse
  })
  
  console.log('✅ 轨迹线创建成功')
  
    // 确保轨迹线可见
    if (trajectoryPolyline.value) {
      trajectoryPolyline.value.show()
      try {
        trajectoryPolyline.value.setOptions({
          visible: true,
          zIndex: 2000
        })
      } catch (error) {
        // 备用方案
        if (trajectoryPolyline.value.setzIndex) {
          trajectoryPolyline.value.setzIndex(2000)
        }
      }
    }
}

// 按照官方示例的简化视角控制追踪
const startViewControlTracking = () => {
  if (!locaInstance.value) {
    console.error('Loca实例不存在')
    return
  }
  
  try {
    const duration = parseInt(selectedSpeed.value)
    
    // 重置轨迹线（按照官方示例）
    if (trajectoryPolyline.value && currentTrajectoryPath.value.length > 0) {
      const startPoint = currentTrajectoryPath.value[0]
      trajectoryPolyline.value.setPath([startPoint, startPoint])
    }
    
    console.log('🎬 启动镜头追踪，时长:', duration, 'ms，路径点数:', currentTrajectoryPath.value.length)
    
    // 确保路径格式正确（Loca可能需要特定格式）
    const locaPath = currentTrajectoryPath.value.map(point => {
      if (Array.isArray(point)) {
        if (point.length === 2) {
          return [point[0], point[1], 100]  // 为2D点添加高度
        } else if (point.length >= 3) {
          return [point[0], point[1], Math.max(point[2], 50)]  // 确保高度不为0
        }
      }
      return point
    })
    
    
    // 简化的Loca动画配置，与轨迹绘制解耦
    
    // 按照官方示例直接调用
    locaInstance.value.viewControl.addTrackAnimate({
      path: locaPath,  // 使用处理后的路径
      duration: duration,
      timing: [[0, 0.3], [1, 0.7]],
      rotationSpeed: 10,
    }, () => {
      window.trajectoryAnimationFinished = true
      cameraTrackingActive.value = false
      console.log('镜头追踪完成')
      emit('playback-completed')
      
      setTimeout(() => {
        if (isTracking.value) {
          stopCameraTracking()
        }
      }, 1000)
    })

    cameraTrackingActive.value = true
    console.log('✅ 镜头追踪已启动')
    
  } catch (error) {
    console.error('启动视角追踪失败:', error)
    errorMessage.value = `启动视角追踪失败: ${error.message}`
    window.trajectoryAnimationFinished = false
  }
}

// 加载轨迹数据（内部方法）
const loadTrajectoryData = (trajectoryPath, name = '轨迹追踪') => {
  console.log('📍 加载轨迹:', name, '包含', trajectoryPath.length, '个轨迹点')
  
  if (!trajectoryPath || trajectoryPath.length < 2) {
    console.error('轨迹数据不足，至少需要2个点。当前点数:', trajectoryPath?.length || 0)
    errorMessage.value = '轨迹数据不足，至少需要2个点'
    return false
  }

  currentTrajectoryPath.value = trajectoryPath
  currentTrajectoryName.value = name
  
  emit('trajectory-loaded', {
    path: trajectoryPath,
    name: name
  })
  
  console.log('✅ 轨迹数据加载成功，总点数:', trajectoryPath.length)
  return true
}

// 清除轨迹（内部方法）
const clearTrajectory = () => {
  // 清除标记
  if (marker.value) {
    marker.value.setMap(null)
    marker.value = null
  }
  
  // 清除轨迹线
  if (trajectoryPolyline.value) {
    trajectoryPolyline.value.setMap(null)
    trajectoryPolyline.value = null
  }
  
  // 停止Loca动画
  if (locaInstance.value) {
    try {
      locaInstance.value.animate.stop()
    } catch (error) {
      console.warn('停止Loca动画失败:', error)
    }
  }
  
  // 重置状态
  isTracking.value = false
  cameraTrackingActive.value = false
  currentTrajectoryPath.value = []
  currentTrajectoryName.value = '准备中...'
}

// 停止计时器（兼容性函数）
const stopElapsedTimer = () => {
  // 镜头追踪模式不需要计时器，这是一个兼容性函数
  console.log('stopElapsedTimer 被调用（镜头追踪模式）')
}

// 兼容性方法（保持原有接口不变）
const startAnimation = () => {
  return startCameraTracking()
}

const pauseAnimation = () => {
  console.log('镜头追踪模式不支持暂停功能')
}

const resumeAnimation = () => {
  console.log('镜头追踪模式不支持继续功能')
}

const stopAnimation = () => {
  return stopCameraTracking()
}

const loadTrajectory = () => {
  // 兼容性方法，实际加载由外部调用 setAndLoadCustomTrajectory 完成
  console.log('请使用 setAndLoadCustomTrajectory 方法加载轨迹')
}


// 监听地图实例变化
watch(() => props.mapInstance, (newInstance) => {
  if (!newInstance) {
    clearTrajectory()
  }
})

// 监听速度选择变化
watch(selectedSpeed, (newSpeed) => {
  console.log('速度设置已更改为:', newSpeed)
  // 如果正在追踪，提示用户重新开始以应用新速度
  if (isTracking.value) {
    console.log('速度更改将在下次开始追踪时生效')
  }
})

// 组件挂载
onMounted(() => {
  console.log('=== TrajectoryPlayback 轨迹回放组件已挂载 ===')
  console.log('地图实例:', props.mapInstance)
  console.log('是否可见:', props.visible)
  console.log('DOM元素检查:', document.querySelector('.trajectory-playback'))
  console.log('标题元素检查:', document.querySelector('.demo-title'))
  console.log('速度选择器检查:', document.querySelector('.speed-selector-bottom'))
  console.log('主控制按钮检查:', document.querySelector('.main-control'))
})

// 组件卸载
onUnmounted(() => {
  clearTrajectory()
  stopElapsedTimer()
  console.log('TrajectoryPlayback 组件已卸载')
})

// 暴露方法给父组件
defineExpose({
  loadTrajectory,
  startAnimation,
  pauseAnimation,
  resumeAnimation,
  stopAnimation,
  clearTrajectory,
  setPresetTrajectory: (index) => {
    console.log('设置预设轨迹:', index)
    if (presetTrajectories.value[index]) {
      const trajectory = presetTrajectories.value[index]
      loadTrajectoryData(trajectory.path, trajectory.name)
    }
  },
  setCustomTrajectory: (path) => {
    console.log('TrajectoryPlayback: 设置自定义轨迹', path)
    loadTrajectoryData(path, '自定义轨迹')
  },
  // 新增方法：设置并自动加载自定义轨迹
  setAndLoadCustomTrajectory: async (path, name = '自定义轨迹') => {
    console.log('TrajectoryPlayback: 设置并加载自定义轨迹', path)
    
    // 先清除现有轨迹
    clearTrajectory()
    
    // 等待一下让状态更新
    await nextTick()
    
    // 加载轨迹数据
    const success = loadTrajectoryData(path, name)
    
    if (success) {
    console.log('TrajectoryPlayback: 自定义轨迹加载完成')
    }
    
    return success
  }
})
</script>

<style scoped>
.trajectory-playback {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* 让地图交互穿透 */
  z-index: 1500; /* 确保在地图控件之上 */
}

.trajectory-playback > * {
  pointer-events: auto; /* 恢复子元素的交互 */
}

/* 标题样式 */
.demo-title {
  position: absolute;
  top: 50px;
  left: 50px;
  z-index: 1600; /* 提高层级，确保在嵌套环境中可见 */
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.demo-title h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
}

.demo-title h3 {
  font-weight: normal;
  margin-top: 5px;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.85);
}

/* 主控制按钮 - 右下角 */
.main-control {
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 1600; /* 提高层级，确保在嵌套环境中可见 */
}

/* 速度选择器 - 地图正下方 */
.speed-selector-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1600; /* 提高层级，确保在嵌套环境中可见 */
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
}

.speed-selector-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.speed-label {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  white-space: nowrap;
}

.speed-options {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.speed-option-btn {
  padding: 10px 20px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  background: white;
  color: #6c757d;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  min-width: 100px;
}

.speed-option-btn:hover {
  border-color: #1A66FF;
  color: #1A66FF;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(26, 102, 255, 0.2);
}

.speed-option-btn.active {
  background: #1A66FF;
  border-color: #1A66FF;
  color: white;
  box-shadow: 0 4px 12px rgba(26, 102, 255, 0.3);
}

.speed-option-btn.active:hover {
  background: #0056d6;
  border-color: #0056d6;
}

.start-btn {
  padding: 12px 24px;
  height: 48px;
  background-color: #1A66FF;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(26, 102, 255, 0.3);
  min-width: 160px;
}

.start-btn:hover:not(:disabled) {
  background-color: #0056d6;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(26, 102, 255, 0.4);
}

.start-btn:active {
  transform: translateY(0);
}

.start-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 轨迹标记样式 */
:global(.amap-ani) {
  width: 44px;
  height: 52px;
  background: url('https://a.amap.com/Loca/static/loca-v2/demos/images/track_marker.png');
  background-size: 44px 52px;
}

/* 错误信息样式 */
.error-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.95);
  padding: 20px 30px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 0, 0, 0.2);
  z-index: 1001;
  max-width: 400px;
  text-align: center;
}

.error-message p {
  margin: 0;
  color: #e53e3e;
  font-size: 14px;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .demo-title {
    top: 20px;
    left: 20px;
  }
  
  .demo-title h1 {
    font-size: 22px;
  }
  
  .demo-title h3 {
    font-size: 14px;
  }
  
  .main-control {
    bottom: 15px;
    right: 15px;
  }
  
  .start-btn {
    padding: 10px 16px;
    height: 44px;
  font-size: 14px;
    min-width: 120px;
  }

  /* 移动端速度选择器优化 */
  .speed-selector-container {
    padding: 12px 16px;
    gap: 12px;
  flex-direction: column;
  align-items: center;
  }
  
  .speed-label {
    font-size: 14px;
  }
  
  .speed-options {
    gap: 8px;
  width: 100%;
    justify-content: center;
  }
  
  .speed-option-btn {
    padding: 8px 12px;
    font-size: 12px;
    min-width: 80px;
    flex: 1;
    max-width: 100px;
}

.error-message {
    max-width: calc(100vw - 40px);
    padding: 16px 20px;
  }
}

@media (max-width: 480px) {
  /* 超小屏设备优化 */
  .speed-selector-container {
    padding: 10px 12px;
  gap: 8px;
  }
  
  .speed-label {
  font-size: 13px;
  }
  
  .speed-option-btn {
    padding: 6px 10px;
    font-size: 11px;
    min-width: 70px;
  }
  
  .start-btn {
    padding: 8px 12px;
    height: 40px;
    font-size: 13px;
    min-width: 100px;
  }
}
</style>

