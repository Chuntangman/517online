<template>
  <div class="trajectory-playback">
    <!-- 轨迹回放控制面板 -->
    <div class="playback-panel" :class="{ 'collapsed': isPanelCollapsed }">
      <!-- 面板头部 -->
      <div class="panel-header">
        <h3 class="panel-title">
          <svg class="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polygon points="5,3 19,12 5,21"/>
          </svg>
          轨迹回放
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
        <!-- 轨迹数据输入 -->
        <div class="trajectory-form">
          <div class="input-group">
            <label>轨迹数据输入方式:</label>
            <div class="input-mode-buttons">
              <button 
                class="mode-btn" 
                :class="{ active: inputMode === 'preset' }"
                @click="setInputMode('preset')"
              >
                预设轨迹
              </button>
              <button 
                class="mode-btn" 
                :class="{ active: inputMode === 'custom' }"
                @click="setInputMode('custom')"
              >
                自定义轨迹
              </button>
            </div>
          </div>

          <!-- 预设轨迹选择 -->
          <div v-if="inputMode === 'preset'" class="preset-trajectories">
            <div class="input-group">
              <label>选择预设轨迹:</label>
              <select v-model="selectedPreset" class="trajectory-select">
                <option value="">请选择轨迹</option>
                <option 
                  v-for="(trajectory, index) in presetTrajectories" 
                  :key="index"
                  :value="index"
                >
                  {{ trajectory.name }}
                </option>
              </select>
            </div>
            <div v-if="selectedPreset !== ''" class="trajectory-info">
              <div class="info-item">
                <span class="info-label">轨迹名称:</span>
                <span class="info-value">{{ presetTrajectories[selectedPreset].name }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">描述:</span>
                <span class="info-value">{{ presetTrajectories[selectedPreset].description }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">轨迹点数:</span>
                <span class="info-value">{{ presetTrajectories[selectedPreset].path.length }}个点</span>
              </div>
            </div>
          </div>

          <!-- 自定义轨迹输入 -->
          <div v-if="inputMode === 'custom'" class="custom-trajectory">
            <div class="input-group">
              <label>轨迹点数据 (经纬度数组):</label>
              <textarea 
                v-model="customTrajectoryText"
                placeholder="请输入轨迹点数据，格式：[[经度,纬度],[经度,纬度],...]&#10;例如：[[116.478935,39.997761],[116.478939,39.997825]]"
                class="trajectory-textarea"
                rows="6"
              ></textarea>
            </div>
            <div class="input-group">
              <button class="validate-btn" @click="validateCustomTrajectory">
                验证轨迹数据
              </button>
            </div>
          </div>

          <!-- 回放参数设置 -->
          <div class="playback-settings">
            <div class="input-group">
              <label>回放速度设置:</label>
              <div class="speed-controls">
                <input 
                  v-model="playbackSettings.duration" 
                  type="range" 
                  min="100" 
                  max="2000" 
                  step="100"
                  class="speed-slider"
                />
                <span class="speed-label">{{ playbackSettings.duration }}ms/段</span>
              </div>
            </div>
            <div class="input-group">
              <label class="checkbox-label">
                <input 
                  v-model="playbackSettings.autoRotation" 
                  type="checkbox" 
                  class="setting-checkbox"
                />
                自动旋转方向
              </label>
            </div>
            <div class="input-group">
              <label class="checkbox-label">
                <input 
                  v-model="playbackSettings.showTrack" 
                  type="checkbox" 
                  class="setting-checkbox"
                />
                显示已走轨迹
              </label>
            </div>
          </div>

          <!-- 控制按钮 -->
          <div class="control-buttons">
            <button 
              class="control-btn start-btn" 
              @click="loadTrajectory"
              :disabled="!canLoadTrajectory"
            >
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20l-5.5-6"/>
                <path d="M18 2v20"/>
              </svg>
              加载轨迹
            </button>
            <button 
              class="control-btn play-btn" 
              @click="startAnimation"
              :disabled="!trajectoryLoaded || isPlaying"
            >
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
              开始回放
            </button>
          </div>

          <div class="control-buttons">
            <button 
              class="control-btn pause-btn" 
              @click="pauseAnimation"
              :disabled="!isPlaying || isPaused"
            >
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
              </svg>
              暂停
            </button>
            <button 
              class="control-btn resume-btn" 
              @click="resumeAnimation"
              :disabled="!isPaused"
            >
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
              继续
            </button>
            <button 
              class="control-btn stop-btn" 
              @click="stopAnimation"
              :disabled="!trajectoryLoaded"
            >
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="3" width="18" height="18"/>
              </svg>
              停止
            </button>
          </div>
        </div>

        <!-- 回放状态显示 -->
        <div v-if="playbackStatus" class="status-display">
          <div class="status-header">
            <h4>回放状态</h4>
            <span class="status-indicator" :class="playbackStatus.state">
              {{ getStatusText(playbackStatus.state) }}
            </span>
          </div>
          <div class="status-content">
            <div class="status-item">
              <span class="status-label">当前进度:</span>
              <span class="status-value">
                {{ playbackStatus.currentPoint }}/{{ playbackStatus.totalPoints }}
              </span>
            </div>
            <div class="status-item">
              <span class="status-label">回放时长:</span>
              <span class="status-value">{{ formatDuration(playbackStatus.elapsed) }}</span>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: playbackStatus.progress + '%' }"
              ></div>
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
            <span>错误信息</span>
          </div>
          <p class="error-text">{{ errorMessage }}</p>
        </div>
      </div>
    </div>
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

const emit = defineEmits(['trajectory-loaded', 'playback-started', 'playback-paused', 'playback-stopped', 'playback-completed'])

// 响应式数据
const isPanelCollapsed = ref(false)
const inputMode = ref('preset') // 'preset' | 'custom'
const selectedPreset = ref('')
const customTrajectoryText = ref('')
const trajectoryLoaded = ref(false)
const isPlaying = ref(false)
const isPaused = ref(false)
const errorMessage = ref('')

// 回放设置
const playbackSettings = ref({
  duration: 500, // 每段的时长（毫秒）
  autoRotation: true, // 自动旋转
  showTrack: true // 显示已走轨迹
})

// 回放状态
const playbackStatus = ref(null)

// 地图相关对象
const marker = ref(null)
const trajectoryPolyline = ref(null)
const passedPolyline = ref(null)
const currentTrajectoryPath = ref([])

// 预设轨迹数据
const presetTrajectories = ref([
  {
    name: '北京市区路线',
    description: '北京市区典型行驶轨迹',
    path: [
      [116.478935,39.997761],[116.478939,39.997825],[116.478912,39.998549],
      [116.478998,39.998555],[116.479282,39.99856],[116.479658,39.998528],
      [116.480151,39.998453],[116.480784,39.998302],[116.481149,39.998184],
      [116.481573,39.997997],[116.481863,39.997846],[116.482072,39.997718],
      [116.482362,39.997718],[116.483633,39.998935],[116.48367,39.998968],
      [116.484648,39.999861]
    ]
  },
  {
    name: '环形测试路线',
    description: '简单的环形轨迹用于测试',
    path: [
      [116.397428, 39.90923], [116.398428, 39.90923], [116.398428, 39.91023],
      [116.397428, 39.91023], [116.397428, 39.90923]
    ]
  },
  {
    name: '长安街东西向',
    description: '长安街东西方向行驶轨迹',
    path: [
      [116.391467, 39.906901], [116.392467, 39.906901], [116.393467, 39.906901],
      [116.394467, 39.906901], [116.395467, 39.906901], [116.396467, 39.906901],
      [116.397467, 39.906901], [116.398467, 39.906901], [116.399467, 39.906901],
      [116.400467, 39.906901]
    ]
  },
  {
    name: '复杂城市路线',
    description: '包含转弯和复杂路况的城市轨迹',
    path: [
      [116.405289, 39.904987], [116.405371, 39.905147], [116.405456, 39.905323],
      [116.405542, 39.905501], [116.405631, 39.905682], [116.405722, 39.905866],
      [116.405816, 39.906053], [116.405912, 39.906243], [116.406011, 39.906436],
      [116.406112, 39.906631], [116.406216, 39.906829], [116.406322, 39.907029],
      [116.406431, 39.907232], [116.406542, 39.907437], [116.406656, 39.907645],
      [116.406772, 39.907855], [116.406891, 39.908068], [116.407012, 39.908283],
      [116.407136, 39.908501], [116.407262, 39.908721]
    ]
  }
])

// 计算属性
const canLoadTrajectory = computed(() => {
  if (inputMode.value === 'preset') {
    return selectedPreset.value !== '' && props.mapInstance
  } else {
    return customTrajectoryText.value.trim() && props.mapInstance
  }
})

// 方法定义
const togglePanel = () => {
  isPanelCollapsed.value = !isPanelCollapsed.value
}

const setInputMode = (mode) => {
  inputMode.value = mode
  clearError()
}

const clearError = () => {
  errorMessage.value = ''
}

const validateCustomTrajectory = () => {
  try {
    const data = JSON.parse(customTrajectoryText.value.trim())
    if (!Array.isArray(data)) {
      throw new Error('数据格式错误：应该是数组格式')
    }
    
    for (let i = 0; i < data.length; i++) {
      const point = data[i]
      if (!Array.isArray(point) || point.length !== 2) {
        throw new Error(`第${i + 1}个点格式错误：应该是[经度, 纬度]格式`)
      }
      
      const [lng, lat] = point
      if (typeof lng !== 'number' || typeof lat !== 'number') {
        throw new Error(`第${i + 1}个点数据类型错误：经纬度应该是数字`)
      }
      
      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        throw new Error(`第${i + 1}个点坐标超出范围`)
      }
    }
    
    if (data.length < 2) {
      throw new Error('轨迹点数量不足：至少需要2个点')
    }
    
    clearError()
    alert('轨迹数据验证通过！')
    
  } catch (error) {
    errorMessage.value = `轨迹数据验证失败: ${error.message}`
  }
}

const loadTrajectory = async () => {
  if (!props.mapInstance) {
    errorMessage.value = '地图实例未准备就绪'
    return
  }

  try {
    clearError()
    
    // 清除现有轨迹
    clearTrajectory()
    
    // 获取轨迹路径
    let trajectoryPath = []
    if (inputMode.value === 'preset') {
      if (selectedPreset.value === '') {
        errorMessage.value = '请选择预设轨迹'
        return
      }
      trajectoryPath = presetTrajectories.value[selectedPreset.value].path
    } else {
      // 自定义轨迹
      try {
        trajectoryPath = JSON.parse(customTrajectoryText.value.trim())
      } catch (error) {
        errorMessage.value = '自定义轨迹数据格式错误'
        return
      }
    }
    
    if (!trajectoryPath || trajectoryPath.length < 2) {
      errorMessage.value = '轨迹数据不足，至少需要2个点'
      return
    }
    
    // 确保已加载动画插件
    if (!window.AMap.MoveAnimation) {
      await loadMoveAnimationPlugin()
    }
    
    // 创建轨迹标记（使用自行车图标）
    marker.value = new AMap.Marker({
      map: props.mapInstance,
      position: trajectoryPath[0],
      icon: createBicycleIcon(),
      offset: new AMap.Pixel(-16, -16),
      anchor: 'center'
    })
    
    // 绘制完整轨迹线
    trajectoryPolyline.value = new AMap.Polyline({
      map: props.mapInstance,
      path: trajectoryPath,
      showDir: true,
      strokeColor: "#28F",
      strokeWeight: 6,
      strokeOpacity: 0.8
    })
    
    // 创建已走轨迹线（如果启用）
    if (playbackSettings.value.showTrack) {
      passedPolyline.value = new AMap.Polyline({
        map: props.mapInstance,
        strokeColor: "#AF5",
        strokeWeight: 6,
        strokeOpacity: 0.9
      })
    }
    
    // 监听移动事件
    marker.value.on('moving', (e) => {
      if (passedPolyline.value) {
        passedPolyline.value.setPath(e.passedPath)
      }
      
      // 更新回放状态
      if (playbackStatus.value) {
        const progress = (e.passedPath.length / trajectoryPath.length) * 100
        playbackStatus.value.currentPoint = e.passedPath.length
        playbackStatus.value.progress = Math.min(progress, 100)
      }
      
      // 地图跟随
      props.mapInstance.setCenter(e.target.getPosition(), true)
    })
    
    // 监听动画完成事件
    marker.value.on('moveend', () => {
      isPlaying.value = false
      isPaused.value = false
      
      if (playbackStatus.value) {
        playbackStatus.value.state = 'completed'
        playbackStatus.value.progress = 100
      }
      
      emit('playback-completed')
      console.log('轨迹回放完成')
    })
    
    // 保存轨迹路径
    currentTrajectoryPath.value = trajectoryPath
    
    // 调整地图视野
    props.mapInstance.setFitView([marker.value, trajectoryPolyline.value])
    
    // 初始化回放状态
    playbackStatus.value = {
      state: 'loaded',
      currentPoint: 0,
      totalPoints: trajectoryPath.length,
      progress: 0,
      elapsed: 0,
      startTime: null
    }
    
    trajectoryLoaded.value = true
    
    emit('trajectory-loaded', {
      path: trajectoryPath,
      name: inputMode.value === 'preset' 
        ? presetTrajectories.value[selectedPreset.value].name 
        : '自定义轨迹'
    })
    
    console.log('轨迹加载成功，轨迹点数量:', trajectoryPath.length)
    
  } catch (error) {
    console.error('轨迹加载失败:', error)
    errorMessage.value = `轨迹加载失败: ${error.message}`
  }
}

const loadMoveAnimationPlugin = () => {
  return new Promise((resolve, reject) => {
    AMap.plugin('AMap.MoveAnimation', () => {
      console.log('MoveAnimation 插件加载成功')
      resolve()
    })
  })
}

// 创建自行车图标
const createBicycleIcon = () => {
  // 创建SVG自行车图标
  const bicycleSvg = `
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <dropshadow dx="1" dy="1" stdDeviation="1" flood-color="#000" flood-opacity="0.3"/>
        </filter>
      </defs>
      <!-- 自行车轮子 -->
      <circle cx="8" cy="22" r="6" fill="none" stroke="#333" stroke-width="2"/>
      <circle cx="24" cy="22" r="6" fill="none" stroke="#333" stroke-width="2"/>
      
      <!-- 车轮中心 -->
      <circle cx="8" cy="22" r="1.5" fill="#333"/>
      <circle cx="24" cy="22" r="1.5" fill="#333"/>
      
      <!-- 车架 -->
      <line x1="8" y1="22" x2="16" y2="12" stroke="#4CAF50" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="16" y1="12" x2="24" y2="22" stroke="#4CAF50" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="16" y1="12" x2="16" y2="6" stroke="#4CAF50" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="8" y1="22" x2="24" y2="22" stroke="#4CAF50" stroke-width="2" stroke-linecap="round"/>
      
      <!-- 座椅 -->
      <line x1="12" y1="16" x2="18" y2="16" stroke="#333" stroke-width="3" stroke-linecap="round"/>
      <line x1="15" y1="16" x2="15" y2="12" stroke="#333" stroke-width="2"/>
      
      <!-- 把手 -->
      <line x1="14" y1="6" x2="18" y2="6" stroke="#333" stroke-width="3" stroke-linecap="round"/>
      
      <!-- 踏板 -->
      <circle cx="16" cy="19" r="2" fill="none" stroke="#666" stroke-width="1.5"/>
      <line x1="14" y1="19" x2="18" y2="19" stroke="#666" stroke-width="2"/>
    </svg>
  `
  
  // 将SVG转换为Data URL
  const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(bicycleSvg)
  
  return svgDataUrl
}

const startAnimation = () => {
  if (!marker.value || !currentTrajectoryPath.value.length) {
    errorMessage.value = '请先加载轨迹'
    return
  }
  
  try {
    marker.value.moveAlong(currentTrajectoryPath.value, {
      duration: playbackSettings.value.duration,
      autoRotation: playbackSettings.value.autoRotation,
    })
    
    isPlaying.value = true
    isPaused.value = false
    
    if (playbackStatus.value) {
      playbackStatus.value.state = 'playing'
      playbackStatus.value.startTime = Date.now()
    }
    
    // 开始计时
    startElapsedTimer()
    
    emit('playback-started')
    console.log('轨迹回放开始')
    
  } catch (error) {
    console.error('开始回放失败:', error)
    errorMessage.value = `开始回放失败: ${error.message}`
  }
}

const pauseAnimation = () => {
  if (!marker.value) return
  
  try {
    marker.value.pauseMove()
    isPaused.value = true
    
    if (playbackStatus.value) {
      playbackStatus.value.state = 'paused'
    }
    
    stopElapsedTimer()
    
    emit('playback-paused')
    console.log('轨迹回放暂停')
    
  } catch (error) {
    console.error('暂停回放失败:', error)
    errorMessage.value = `暂停回放失败: ${error.message}`
  }
}

const resumeAnimation = () => {
  if (!marker.value) return
  
  try {
    marker.value.resumeMove()
    isPaused.value = false
    
    if (playbackStatus.value) {
      playbackStatus.value.state = 'playing'
    }
    
    startElapsedTimer()
    
    emit('playback-started')
    console.log('轨迹回放继续')
    
  } catch (error) {
    console.error('继续回放失败:', error)
    errorMessage.value = `继续回放失败: ${error.message}`
  }
}

const stopAnimation = () => {
  if (!marker.value) return
  
  try {
    marker.value.stopMove()
    isPlaying.value = false
    isPaused.value = false
    
    if (playbackStatus.value) {
      playbackStatus.value.state = 'stopped'
      playbackStatus.value.currentPoint = 0
      playbackStatus.value.progress = 0
    }
    
    // 重置标记位置到起点
    if (currentTrajectoryPath.value.length > 0) {
      marker.value.setPosition(currentTrajectoryPath.value[0])
    }
    
    // 清除已走轨迹
    if (passedPolyline.value) {
      passedPolyline.value.setPath([])
    }
    
    stopElapsedTimer()
    
    emit('playback-stopped')
    console.log('轨迹回放停止')
    
  } catch (error) {
    console.error('停止回放失败:', error)
    errorMessage.value = `停止回放失败: ${error.message}`
  }
}

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
  
  // 清除已走轨迹线
  if (passedPolyline.value) {
    passedPolyline.value.setMap(null)
    passedPolyline.value = null
  }
  
  // 重置状态
  trajectoryLoaded.value = false
  isPlaying.value = false
  isPaused.value = false
  currentTrajectoryPath.value = []
  playbackStatus.value = null
  
  stopElapsedTimer()
}

// 计时器相关
let elapsedTimer = null

const startElapsedTimer = () => {
  stopElapsedTimer()
  elapsedTimer = setInterval(() => {
    if (playbackStatus.value && playbackStatus.value.startTime) {
      playbackStatus.value.elapsed = Date.now() - playbackStatus.value.startTime
    }
  }, 100)
}

const stopElapsedTimer = () => {
  if (elapsedTimer) {
    clearInterval(elapsedTimer)
    elapsedTimer = null
  }
}

// 工具函数
const getStatusText = (state) => {
  const statusTexts = {
    'loaded': '已加载',
    'playing': '播放中',
    'paused': '已暂停',
    'stopped': '已停止',
    'completed': '已完成'
  }
  return statusTexts[state] || '未知'
}

const formatDuration = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes > 0) {
    return `${minutes}分${remainingSeconds}秒`
  }
  return `${remainingSeconds}秒`
}

// 监听地图实例变化
watch(() => props.mapInstance, (newInstance) => {
  if (!newInstance) {
    clearTrajectory()
  }
})

// 组件挂载
onMounted(() => {
  console.log('TrajectoryPlayback 组件已挂载')
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
    inputMode.value = 'preset'
    selectedPreset.value = index
  },
  setCustomTrajectory: (path) => {
    console.log('TrajectoryPlayback: 设置自定义轨迹', path)
    inputMode.value = 'custom'
    customTrajectoryText.value = JSON.stringify(path, null, 2)
  },
  // 新增方法：设置并自动加载自定义轨迹
  setAndLoadCustomTrajectory: async (path) => {
    console.log('TrajectoryPlayback: 设置并加载自定义轨迹', path)
    
    // 先清除现有轨迹
    clearTrajectory()
    
    // 设置为自定义模式
    inputMode.value = 'custom'
    customTrajectoryText.value = JSON.stringify(path, null, 2)
    
    // 等待一下让UI更新
    await nextTick()
    
    // 自动加载轨迹
    await loadTrajectory()
    
    console.log('TrajectoryPlayback: 自定义轨迹加载完成')
  }
})
</script>

<style scoped>
.trajectory-playback {
  position: relative;
  width: 100%;
  height: 100%;
}

.playback-panel {
  position: fixed;
  top: 70px; /* 位于导航按钮下方 */
  right: 10px;
  width: 350px;
  max-height: calc(90vh - 80px);
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 1000;
  overflow: hidden;
  transition: all 0.3s ease;
}

.playback-panel.collapsed {
  width: 60px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
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
  max-height: calc(90vh - 140px);
  overflow-y: auto;
}

.trajectory-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
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

.input-mode-buttons {
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
  border-color: #ff6b6b;
  color: #ff6b6b;
}

.mode-btn.active {
  border-color: #ff6b6b;
  background: #ff6b6b;
  color: white;
}

.trajectory-select {
  padding: 10px 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.trajectory-select:focus {
  outline: none;
  border-color: #ff6b6b;
}

.trajectory-info {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  color: #666;
  font-size: 13px;
  font-weight: 500;
}

.info-value {
  color: #333;
  font-size: 13px;
  font-weight: 600;
}

.trajectory-textarea {
  padding: 10px 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 13px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  resize: vertical;
  min-height: 120px;
  transition: border-color 0.2s ease;
}

.trajectory-textarea:focus {
  outline: none;
  border-color: #ff6b6b;
}

.validate-btn {
  padding: 8px 16px;
  border: 2px solid #17a2b8;
  border-radius: 6px;
  background: #17a2b8;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.validate-btn:hover {
  background: #138496;
  border-color: #138496;
}

.playback-settings {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.speed-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.speed-slider {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: #e1e5e9;
  outline: none;
  cursor: pointer;
}

.speed-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ff6b6b;
  cursor: pointer;
}

.speed-label {
  font-size: 12px;
  color: #666;
  font-weight: 600;
  min-width: 70px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

.setting-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.control-buttons {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.control-btn {
  flex: 1;
  padding: 10px 12px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  width: 16px;
  height: 16px;
  stroke-width: 2;
}

.start-btn {
  background: #28a745;
  color: white;
}

.start-btn:hover:not(:disabled) {
  background: #218838;
  transform: translateY(-1px);
}

.play-btn {
  background: #007bff;
  color: white;
}

.play-btn:hover:not(:disabled) {
  background: #0056b3;
  transform: translateY(-1px);
}

.pause-btn {
  background: #ffc107;
  color: #333;
}

.pause-btn:hover:not(:disabled) {
  background: #e0a800;
  transform: translateY(-1px);
}

.resume-btn {
  background: #17a2b8;
  color: white;
}

.resume-btn:hover:not(:disabled) {
  background: #138496;
  transform: translateY(-1px);
}

.stop-btn {
  background: #dc3545;
  color: white;
}

.stop-btn:hover:not(:disabled) {
  background: #c82333;
  transform: translateY(-1px);
}

.status-display {
  margin-top: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.status-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.status-header h4 {
  margin: 0;
  color: #333;
  font-size: 15px;
}

.status-indicator {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.status-indicator.loaded {
  background: #d1ecf1;
  color: #0c5460;
}

.status-indicator.playing {
  background: #d4edda;
  color: #155724;
}

.status-indicator.paused {
  background: #fff3cd;
  color: #856404;
}

.status-indicator.stopped {
  background: #f8d7da;
  color: #721c24;
}

.status-indicator.completed {
  background: #d1ecf1;
  color: #0c5460;
}

.status-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.status-label {
  color: #666;
  font-weight: 500;
}

.status-value {
  color: #333;
  font-weight: 600;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 4px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b6b 0%, #ee5a52 100%);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.error-message {
  margin-top: 16px;
  padding: 12px;
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
  font-size: 14px;
}

.error-icon {
  width: 16px;
  height: 16px;
  stroke-width: 2;
}

.error-text {
  margin: 0;
  color: #c53030;
  font-size: 13px;
  line-height: 1.4;
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
  .playback-panel {
    width: calc(100vw - 20px);
    max-width: 380px;
    top: 60px;
    right: 10px;
  }

  .playback-panel.collapsed {
    width: 50px;
  }

  .control-buttons {
    flex-direction: column;
  }

  .control-btn {
    justify-content: flex-start;
    padding: 12px;
  }
}
</style>
