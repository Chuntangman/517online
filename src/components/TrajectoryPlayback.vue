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
      defaultCursor: 'default'
    }
    
    console.log('新地图配置:', newMapConfig)
    const new3DMap = new AMap.Map('container', newMapConfig)
    console.log('新3D地图对象创建完成:', new3DMap)
    console.log('新3D地图的容器ID:', new3DMap.getContainer().id)
    
    // 等待地图完全加载
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('地图加载超时'))
      }, 10000)
      
      new3DMap.on('complete', () => {
        clearTimeout(timeout)
        console.log('3D地图创建完成')
        resolve()
      })
    })
    
    // 更新地图实例引用
    const originalMapInstance = props.mapInstance
    Object.defineProperty(props, 'mapInstance', {
      value: new3DMap,
      writable: true,
      configurable: true
    })
    
    // 初始化Loca（使用新的地图实例）
    if (!locaInstance.value) {
      locaInstance.value = new window.Loca.Container({
        map: new3DMap
      })
      console.log('Loca实例创建成功（使用新3D地图）')
    }

    // 创建轨迹标记（按照官方示例），绑定到新的3D地图
    createTrackMarker(new3DMap)

    // 绘制轨迹线（按照官方示例），绑定到新的3D地图
    drawTrajectoryPath(new3DMap)

    // 按照官方示例启动动画循环
    window.movingDraw = true
    window.trajectoryAnimationFinished = false
    
    // 用于限制日志频率的计数器
    let debugCounter = 0
    
    const run = () => {
      if (!window.trajectoryAnimationFinished && trajectoryPolyline.value && isTracking.value) {
        const center = props.mapInstance.getCenter().toArray()
        const lastPath = trajectoryPolyline.value.getPath()
        
        // 每10次循环输出一次调试信息，避免控制台被淹没
        if (debugCounter % 10 === 0) {
          console.log('=== run() 动画循环调试 (第', debugCounter, '次) ===')
          console.log('地图中心点:', center)
          console.log('当前轨迹线路径长度:', lastPath.length)
          console.log('当前轨迹线路径:', lastPath.slice(0, 3), '...(显示前3个点)')
        }
        
        // 智能处理新的路径点：根据轨迹数据格式决定是否添加高度
        let centerWith3D = center
        if (center.length >= 2) {
          // 检查原始轨迹数据是否包含高度信息
          const hasOriginal3D = currentTrajectoryPath.value.some(point => 
            Array.isArray(point) && point.length >= 3
          )
          
          if (hasOriginal3D) {
            // 原始数据包含3D信息，为新点添加适当高度
            centerWith3D = [center[0], center[1], 50] // 使用较低高度以贴近地面
          } else {
            // 原始数据是2D，保持2D格式让地图自动处理高度
            centerWith3D = [center[0], center[1]]
          }
        }
        
        if (debugCounter % 10 === 0) {
          console.log('处理后的中心点:', centerWith3D)
        }
        
        lastPath.push(centerWith3D)
        if (lastPath.length === 1) {
          lastPath.push(centerWith3D)
        }
        
        trajectoryPolyline.value.setPath(lastPath)
        
        // 验证路径是否设置成功
        const verifyPath = trajectoryPolyline.value.getPath()
        if (debugCounter % 10 === 0) {
          console.log('更新后轨迹线路径长度:', lastPath.length)
          console.log('验证：轨迹线路径设置后长度:', verifyPath.length)
        }
        
        if (marker.value) {
          // 智能处理标记位置更新
          const markerCenter = center.length >= 2 
            ? (currentTrajectoryPath.value.some(point => Array.isArray(point) && point.length >= 3)
                ? [center[0], center[1], 50] // 3D数据使用适当高度
                : [center[0], center[1]])    // 2D数据保持2D格式
            : center
          marker.value.setPosition(markerCenter)
          
          if (debugCounter % 10 === 0) {
            console.log('标记位置已更新:', markerCenter)
          }
        }
        
        if (debugCounter % 10 === 0) {
          console.log('=== run() 循环结束 ===')
        }
        
        debugCounter++
      }
      
      if (!window.trajectoryAnimationFinished && isTracking.value) {
        requestAnimationFrame(run)
      }
    }
    
    // 启动Loca动画（按照官方示例）
    locaInstance.value.animate.start()
    
    console.log('轨迹线已正确绑定到新3D地图')
    
    // 在Loca动画启动后再开始run循环（确保正确的时序）
    setTimeout(() => {
      run()
      console.log('run循环已启动')
    }, 100)
    
    // 验证轨迹线是否在地图上可见，并尝试备用方案
    setTimeout(() => {
      if (trajectoryPolyline.value) {
        console.log('=== 轨迹线可见性检查 ===')
        console.log('轨迹线实例:', trajectoryPolyline.value)
        console.log('轨迹线当前路径:', trajectoryPolyline.value.getPath())
        console.log('轨迹线是否可见:', trajectoryPolyline.value.getVisible ? trajectoryPolyline.value.getVisible() : '未知')
        console.log('轨迹线zIndex:', trajectoryPolyline.value.getzIndex ? trajectoryPolyline.value.getzIndex() : '未知')
        
        // 如果轨迹线路径为空或只有一个点，尝试强制设置初始路径
        const currentPath = trajectoryPolyline.value.getPath()
        if (!currentPath || currentPath.length <= 1) {
          console.warn('轨迹线路径异常，尝试强制设置初始路径')
          const startPoint = currentTrajectoryPath.value[0]
          if (startPoint) {
            const forcePath = Array.isArray(startPoint) && startPoint.length === 2
              ? [[startPoint[0], startPoint[1]], [startPoint[0], startPoint[1]]]
              : [startPoint, startPoint]
            trajectoryPolyline.value.setPath(forcePath)
            console.log('已强制设置轨迹线初始路径:', forcePath)
          }
        }
        
        // 尝试强制显示轨迹线
        if (trajectoryPolyline.value.show) {
          trajectoryPolyline.value.show()
          console.log('已调用轨迹线show()方法')
        }
      }
    }, 2000)

    // 开始镜头追踪动画
    startViewControlTracking()

    isTracking.value = true
    emit('playback-started')
    
  } catch (error) {
    console.error('开始镜头追踪失败:', error)
    errorMessage.value = `开始镜头追踪失败: ${error.message}`
  }
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
      locaInstance.value.viewControl.stop()
  } catch (error) {
      console.warn('停止视角控制失败:', error)
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

  // 修正：标记初始位置应该在轨迹起点，而不是终点
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
    content: '<div class="amap-ani"></div>',
    anchor: 'bottom-center',
    map: mapToUse
  })
  
  console.log('创建轨迹标记，初始位置（起点）:', startPosition)
  console.log('标记已绑定到地图实例:', targetMap ? '新3D地图' : '原地图')
  console.log('targetMap参数:', targetMap)
  console.log('mapToUse对象:', mapToUse)
  console.log('props.mapInstance对象:', props.mapInstance)
  console.log('是否使用了targetMap:', targetMap !== null)
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
  console.log('绘制轨迹线到地图实例:', mapToUse)
  
  // 按照官方示例创建轨迹线，初始路径为起始点的重复
  const startPoint = currentTrajectoryPath.value[0]
  console.log('=== 创建轨迹线调试 ===')
  console.log('起始点:', startPoint)
  console.log('起始点类型:', typeof startPoint, '是否数组:', Array.isArray(startPoint))
  console.log('地图实例:', mapToUse)
  console.log('地图实例类型:', typeof mapToUse)
  
  // 根据官方示例，轨迹线应该从起始点开始，逐渐绘制整条路径
  // 但初始化时只设置起始点的重复点，后续通过动画添加路径点
  const pathWith3D = [startPoint, startPoint].map(point => {
    if (Array.isArray(point)) {
      if (point.length === 2) {
        // 2D数据：[经度, 纬度] - 不添加高度，让高德地图自动处理
        console.log('检测到2D轨迹点，使用地面高度:', point)
        return [point[0], point[1]] // 保持原始2D格式
      } else if (point.length >= 3) {
        // 3D数据：[经度, 纬度, 高度] - 保持原有高度
        console.log('检测到3D轨迹点，保持原有高度:', point)
        return [point[0], point[1], point[2]]
      }
    }
    return point
  })
  
  console.log('轨迹线初始化路径（仅起始点）:', pathWith3D)
  console.log('完整轨迹路径将通过动画逐步添加，总点数:', currentTrajectoryPath.value.length)
  
  console.log('处理后的路径点:', pathWith3D)
  
  // 根据数据类型优化轨迹线配置
  const is2DData = pathWith3D.every(point => Array.isArray(point) && point.length === 2)
  
  trajectoryPolyline.value = new AMap.Polyline({
    path: pathWith3D,
    isOutline: true,
    outlineColor: '#FFFFFF', // 白色描边增强对比度
    borderWeight: is2DData ? 8 : 6, // 增加描边宽度
    strokeColor: '#00FF00',  // 使用更亮的纯绿色，增强可见性
    strokeOpacity: 1,
    strokeWeight: is2DData ? 30 : 25, // 进一步增加线条宽度
    strokeStyle: 'solid',
    lineJoin: 'round',
    lineCap: 'round',
    zIndex: 2000, // 使用更高的层级确保在所有元素之上
    geodesic: false,  // 关闭大地线模式，使用直线连接
    showDir: false,   // 暂时关闭方向箭头，避免干扰
    cursor: 'pointer',
    visible: true,    // 明确设置为可见
    bubble: true,     // 启用事件冒泡
    map: mapToUse
  })
  
  console.log(`轨迹线配置 - 数据类型: ${is2DData ? '2D' : '3D'}, 线宽: ${is2DData ? 30 : 25}, 层级: 2000`)
  
  console.log('轨迹线对象创建成功:', trajectoryPolyline.value)
  console.log('轨迹线初始路径:', trajectoryPolyline.value.getPath())
  console.log('轨迹线已绑定到地图实例:', targetMap ? '新3D地图' : '原地图')
  console.log('轨迹线 targetMap参数:', targetMap)
  console.log('轨迹线 mapToUse对象:', mapToUse)
  console.log('轨迹线 props.mapInstance对象:', props.mapInstance)
  console.log('轨迹线是否使用了targetMap:', targetMap !== null)
  
  // 强制确保轨迹线可见
  if (trajectoryPolyline.value) {
    // 多种方式尝试让轨迹线可见
    trajectoryPolyline.value.show()
    trajectoryPolyline.value.setOptions({
      visible: true,
      zIndex: 2000
    })
    
    // 强制触发地图重绘
    if (mapToUse && mapToUse.setLayers) {
      setTimeout(() => {
        mapToUse.getSize()  // 触发地图重新计算
        console.log('已触发地图重绘')
      }, 50)
    }
    
    console.log('已强制设置轨迹线可见性')
  }
}

// 开始视角控制追踪（按照官方示例）
const startViewControlTracking = () => {
  if (!locaInstance.value) {
    console.error('Loca实例不存在')
    return
  }
  
  try {
    // 按照官方示例添加镜头追踪
    if (locaInstance.value.viewControl && locaInstance.value.viewControl.addTrackAnimate) {
      const duration = parseInt(selectedSpeed.value)
      
      // 重置轨迹线（按照官方示例在点击时重置）
      if (trajectoryPolyline.value && currentTrajectoryPath.value.length > 0) {
        const startPoint = currentTrajectoryPath.value[0]
        console.log('重置轨迹线路径到起始点:', startPoint)
        trajectoryPolyline.value.setPath([startPoint, startPoint])
        console.log('轨迹线路径重置完成，当前路径:', trajectoryPolyline.value.getPath())
      }
      
      console.log('=== 启动Loca镜头追踪 ===')
      console.log('轨迹路径:', currentTrajectoryPath.value)
      console.log('动画时长:', duration, 'ms')
      console.log('Loca实例:', locaInstance.value)
      console.log('viewControl对象:', locaInstance.value.viewControl)
      
      locaInstance.value.viewControl.addTrackAnimate({
        path: currentTrajectoryPath.value, // 镜头轨迹，二维数组，支持海拔
        duration: duration, // 时长
        timing: [[0, 0.3], [1, 0.7]], // 速率控制器
        rotationSpeed: 10, // 每秒旋转多少度
      }, () => {
        window.trajectoryAnimationFinished = true
        cameraTrackingActive.value = false
        console.log('镜头追踪完成')
        emit('playback-completed')
        
        // 自动停止追踪
        setTimeout(() => {
          if (isTracking.value) {
            stopCameraTracking()
          }
        }, 1000)
      })

      cameraTrackingActive.value = true
      console.log('镜头追踪已启动，时长:', duration, 'ms')
      console.log('镜头追踪状态:', cameraTrackingActive.value)
    } else {
      console.error('viewControl.addTrackAnimate 方法不可用')
      errorMessage.value = 'Loca视角控制功能不可用，请确保使用最新版本的高德地图API'
    }
    
  } catch (error) {
    console.error('启动视角追踪失败:', error)
    errorMessage.value = `启动视角追踪失败: ${error.message}`
  }
}

// 加载轨迹数据（内部方法）
const loadTrajectoryData = (trajectoryPath, name = '轨迹追踪') => {
  console.log('=== 加载轨迹数据调试 ===')
  console.log('轨迹数据:', trajectoryPath)
  console.log('轨迹名称:', name)
  console.log('轨迹数据类型:', typeof trajectoryPath)
  console.log('是否为数组:', Array.isArray(trajectoryPath))
  
  if (!trajectoryPath || trajectoryPath.length < 2) {
    console.error('轨迹数据不足，至少需要2个点。当前点数:', trajectoryPath?.length || 0)
    errorMessage.value = '轨迹数据不足，至少需要2个点'
    return false
  }

  // 验证每个轨迹点的格式
  console.log('验证轨迹点格式:')
  trajectoryPath.forEach((point, index) => {
    console.log(`轨迹点 ${index}:`, point, '类型:', typeof point, '是否数组:', Array.isArray(point))
    if (Array.isArray(point) && point.length >= 2) {
      console.log(`  经度: ${point[0]} (${typeof point[0]}), 纬度: ${point[1]} (${typeof point[1]})`)
      console.log(`  坐标有效性: 经度=${!isNaN(point[0])}, 纬度=${!isNaN(point[1])}`)
    }
  })

  currentTrajectoryPath.value = trajectoryPath
  currentTrajectoryName.value = name
  
  emit('trajectory-loaded', {
    path: trajectoryPath,
    name: name
  })
  
  console.log('轨迹数据加载成功，总点数:', trajectoryPath.length)
  console.log('起始点:', trajectoryPath[0])
  console.log('终点:', trajectoryPath[trajectoryPath.length - 1])
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
