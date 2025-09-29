<template>
  <div class="weather-widget">
    <!-- 天气图标按钮 -->
    <div 
      class="weather-icon-container" 
      @click="toggleWeatherInfo"
      :class="{ 'expanded': showWeatherInfo }"
    >
      <!-- 天气动画图标 -->
      <div class="weather-icon">
        <img 
          :src="currentWeatherIcon" 
          :alt="currentWeather.weather || '天气'"
          class="weather-gif"
          @error="handleIconError"
        />
      </div>
      
      <!-- 简要温度显示 -->
      <div class="temperature-badge" v-if="currentWeather.temperature">
        {{ currentWeather.temperature }}°
      </div>
    </div>

    <!-- 天气详情面板 -->
    <transition name="weather-panel">
      <div class="weather-panel" v-if="showWeatherInfo">
        <div class="weather-header">
          <h3>{{ currentWeather.city || '当前位置' }}</h3>
          <button class="close-btn" @click="closeWeatherInfo">×</button>
        </div>
        
        <div class="weather-content">
          <!-- 实时天气 -->
          <div class="current-weather">
            <div class="weather-main">
              <div class="weather-icon-large">
                <img :src="currentWeatherIcon" :alt="currentWeather.weather" />
              </div>
              <div class="weather-details">
                <div class="temperature">{{ currentWeather.temperature || '--' }}°C</div>
                <div class="weather-desc">{{ currentWeather.weather || '获取中...' }}</div>
                <div class="update-time">{{ formatTime(currentWeather.reportTime) }}</div>
              </div>
            </div>
            
            <div class="weather-info">
              <div class="info-item">
                <span class="label">风向</span>
                <span class="value">{{ currentWeather.windDirection || '--' }}</span>
              </div>
              <div class="info-item">
                <span class="label">风力</span>
                <span class="value">{{ currentWeather.windPower || '--' }} 级</span>
              </div>
              <div class="info-item">
                <span class="label">湿度</span>
                <span class="value">{{ currentWeather.humidity || '--' }}</span>
              </div>
            </div>
          </div>

          <!-- 天气预报 -->
          <div class="weather-forecast" v-if="forecastData.length > 0">
            <h4>未来天气</h4>
            <div class="forecast-list">
              <div 
                class="forecast-item" 
                v-for="(forecast, index) in forecastData" 
                :key="index"
              >
                <div class="forecast-date">{{ formatDate(forecast.date) }}</div>
                <div class="forecast-weather">
                  <img :src="getWeatherIcon(forecast.dayWeather)" :alt="forecast.dayWeather" />
                  <span>{{ forecast.dayWeather }}</span>
                </div>
                <div class="forecast-temp">
                  {{ forecast.nightTemp }}° / {{ forecast.dayTemp }}°
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="weather-footer">
          <button class="refresh-btn" @click="refreshWeather" :disabled="loading">
            <span v-if="loading">刷新中...</span>
            <span v-else>刷新天气</span>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

// 响应式数据
const showWeatherInfo = ref(false)
const loading = ref(false)
const currentWeather = ref({})
const forecastData = ref([])
const currentWeatherIcon = ref('/weather/晴天.gif')

// Props - 接收经纬度
const props = defineProps({
  longitude: {
    type: [Number, String],
    default: 116.397428 // 北京经度
  },
  latitude: {
    type: [Number, String],
    default: 39.90923 // 北京纬度
  }
})

// 天气图标映射
const weatherIconMap = {
  // 晴天类
  '晴': '/weather/晴天.gif',
  '少云': '/weather/晴天.gif',
  '晴间多云': '/weather/晴天.gif',
  
  // 阴天类
  '多云': '/weather/阴天.gif',
  '阴': '/weather/阴天.gif',
  '霾': '/weather/阴天.gif',
  '中度霾': '/weather/阴天.gif',
  '重度霾': '/weather/阴天.gif',
  '严重霾': '/weather/阴天.gif',
  '雾': '/weather/阴天.gif',
  '浓雾': '/weather/阴天.gif',
  '强浓雾': '/weather/阴天.gif',
  '轻雾': '/weather/阴天.gif',
  '大雾': '/weather/阴天.gif',
  '特强浓雾': '/weather/阴天.gif',
  
  // 雨天类
  '阵雨': '/weather/下雨.gif',
  '小雨': '/weather/下雨.gif',
  '中雨': '/weather/下雨.gif',
  '大雨': '/weather/下雨.gif',
  '暴雨': '/weather/下雨.gif',
  '大暴雨': '/weather/下雨.gif',
  '特大暴雨': '/weather/下雨.gif',
  '强阵雨': '/weather/下雨.gif',
  '极端降雨': '/weather/下雨.gif',
  '毛毛雨/细雨': '/weather/下雨.gif',
  '雨': '/weather/下雨.gif',
  '小雨-中雨': '/weather/下雨.gif',
  '中雨-大雨': '/weather/下雨.gif',
  '大雨-暴雨': '/weather/下雨.gif',
  '暴雨-大暴雨': '/weather/下雨.gif',
  '大暴雨-特大暴雨': '/weather/下雨.gif',
  '冻雨': '/weather/下雨.gif',
  
  // 雷雨类
  '雷阵雨': '/weather/雷雨.gif',
  '雷阵雨并伴有冰雹': '/weather/雷雨.gif',
  '强雷阵雨': '/weather/雷雨.gif',
  
  // 雪天类
  '雪': '/weather/下雪.gif',
  '阵雪': '/weather/下雪.gif',
  '小雪': '/weather/下雪.gif',
  '中雪': '/weather/下雪.gif',
  '大雪': '/weather/下雪.gif',
  '暴雪': '/weather/下雪.gif',
  '小雪-中雪': '/weather/下雪.gif',
  '中雪-大雪': '/weather/下雪.gif',
  '大雪-暴雪': '/weather/下雪.gif',
  '雨雪天气': '/weather/下雪.gif',
  '雨夹雪': '/weather/下雪.gif',
  '阵雨夹雪': '/weather/下雪.gif'
}

// 根据天气状况获取图标
const getWeatherIcon = (weather) => {
  if (!weather) return '/weather/晴天.gif'
  
  // 精确匹配
  if (weatherIconMap[weather]) {
    return weatherIconMap[weather]
  }
  
  // 模糊匹配
  const weatherLower = weather.toLowerCase()
  if (weatherLower.includes('雷')) {
    return '/weather/雷雨.gif'
  } else if (weatherLower.includes('雪')) {
    return '/weather/下雪.gif'
  } else if (weatherLower.includes('雨')) {
    return '/weather/下雨.gif'
  } else if (weatherLower.includes('阴') || weatherLower.includes('云') || weatherLower.includes('霾') || weatherLower.includes('雾')) {
    return '/weather/阴天.gif'
  } else {
    return '/weather/晴天.gif'
  }
}

// 获取天气信息
const getWeatherInfo = async (longitude = props.longitude, latitude = props.latitude) => {
  if (!window.AMap) {
    console.error('高德地图API未加载')
    return
  }
  
  loading.value = true
  
  try {
    // 通过经纬度获取城市信息
    const geocoder = new AMap.Geocoder({
      radius: 1000,
      extensions: "all"
    })
    
    geocoder.getAddress([longitude, latitude], (status, result) => {
      if (status === 'complete' && result.info === 'OK') {
        const city = result.regeocode.addressComponent.city || result.regeocode.addressComponent.district
        
        // 获取天气信息
        const weather = new AMap.Weather()
        
        // 获取实时天气
        weather.getLive(city, (err, data) => {
          if (!err) {
            currentWeather.value = {
              ...data,
              longitude,
              latitude
            }
            
            // 更新天气图标
            currentWeatherIcon.value = getWeatherIcon(data.weather)
            
            console.log('实时天气获取成功:', data)
          } else {
            console.error('获取实时天气失败:', err)
          }
          loading.value = false
        })
        
        // 获取天气预报
        weather.getForecast(city, (err, data) => {
          if (!err && data.forecasts) {
            forecastData.value = data.forecasts.slice(0, 4) // 只取前4天
            console.log('天气预报获取成功:', data.forecasts)
          } else {
            console.error('获取天气预报失败:', err)
          }
        })
      } else {
        console.error('地理编码失败:', result)
        loading.value = false
      }
    })
  } catch (error) {
    console.error('获取天气信息失败:', error)
    loading.value = false
  }
}

// 切换天气信息显示
const toggleWeatherInfo = () => {
  showWeatherInfo.value = !showWeatherInfo.value
}

// 关闭天气信息
const closeWeatherInfo = () => {
  showWeatherInfo.value = false
}

// 刷新天气
const refreshWeather = () => {
  getWeatherInfo()
}

// 图标加载错误处理
const handleIconError = (event) => {
  console.error('天气图标加载失败:', event.target.src)
  event.target.src = '/weather/晴天.gif' // 使用默认图标
}

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  return timeStr.replace(/(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})/, '$1 $2')
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
  
  if (date.toDateString() === today.toDateString()) {
    return '今天'
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return '明天'
  } else {
    return `${date.getMonth() + 1}/${date.getDate()}`
  }
}

// 监听经纬度变化
watch(() => [props.longitude, props.latitude], ([newLng, newLat]) => {
  if (newLng && newLat) {
    getWeatherInfo(newLng, newLat)
  }
}, { deep: true })

// 组件挂载后初始化
onMounted(async () => {
  // Weather组件挂载
  
  // 等待高德地图API加载
  const waitForAMap = () => {
    return new Promise((resolve) => {
      if (window.AMap) {
        resolve()
      } else {
        const checkAMap = setInterval(() => {
          if (window.AMap) {
            clearInterval(checkAMap)
            resolve()
          }
        }, 100)
      }
    })
  }
  
  await waitForAMap()
  
  // 加载天气插件
  AMap.plugin('AMap.Weather', () => {
    AMap.plugin('AMap.Geocoder', () => {
      getWeatherInfo()
    })
  })
})

// 暴露方法和数据给父组件
defineExpose({
  getWeatherInfo,
  refreshWeather,
  toggleWeatherInfo,
  // 暴露当前天气数据，但不触发新的API调用
  currentWeather: currentWeather
})
</script>

<style scoped>
.weather-widget {
  position: relative;
  z-index: 200;
}

/* 天气图标容器 */
.weather-icon-container {
  position: relative;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.12),
    0 8px 32px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid rgba(255, 255, 255, 0.9);
  overflow: hidden;
}

.weather-icon-container:hover {
  transform: scale(1.08) translateY(-2px);
  box-shadow: 
    0 8px 24px rgba(0, 0, 0, 0.18),
    0 16px 48px rgba(0, 0, 0, 0.12);
}

.weather-icon-container.expanded {
  box-shadow: 
    0 6px 20px rgba(64, 158, 255, 0.2),
    0 12px 40px rgba(64, 158, 255, 0.1);
  border-color: rgba(64, 158, 255, 0.3);
}

/* 天气图标 */
.weather-icon {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  overflow: hidden;
}

.weather-gif {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 50%;
  /* 确保GIF动画正常播放 */
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
  /* 保持透明背景 */
  background: transparent;
}

/* 温度标识 */
.temperature-badge {
  position: absolute;
  bottom: -3px;
  right: -3px;
  background: linear-gradient(135deg, #409eff, #67c23a);
  color: white;
  font-size: 11px;
  font-weight: bold;
  padding: 3px 7px;
  border-radius: 14px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
  min-width: 22px;
  text-align: center;
  border: 2px solid rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
}

/* 天气详情面板 */
.weather-panel {
  position: absolute;
  bottom: 70px;
  left: 0;
  width: 320px;
  max-height: 400px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 16px 64px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.9);
  overflow: hidden;
  z-index: 1000;
}

/* 面板头部 */
.weather-header {
  padding: 16px 20px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.weather-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #909399;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #606266;
}

/* 面板内容 */
.weather-content {
  padding: 0 20px;
  max-height: 280px;
  overflow-y: auto;
}

/* 当前天气 */
.current-weather {
  padding: 16px 0;
}

.weather-main {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.weather-icon-large {
  width: 70px;
  height: 70px;
  flex-shrink: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.weather-icon-large img {
  width: 85%;
  height: 85%;
  object-fit: contain;
  border-radius: 50%;
  background: transparent;
  /* 确保GIF动画正常播放 */
  image-rendering: -webkit-optimize-contrast;
}

.weather-details {
  flex: 1;
}

.temperature {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.weather-desc {
  font-size: 14px;
  color: #606266;
  margin-bottom: 4px;
}

.update-time {
  font-size: 12px;
  color: #909399;
}

.weather-info {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.info-item {
  text-align: center;
  padding: 8px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
}

.info-item .label {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.info-item .value {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

/* 天气预报 */
.weather-forecast {
  padding: 16px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.weather-forecast h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.forecast-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.forecast-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
}

.forecast-date {
  font-size: 12px;
  color: #606266;
  width: 40px;
}

.forecast-weather {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: center;
}

.forecast-weather img {
  width: 24px;
  height: 24px;
  object-fit: contain;
  border-radius: 50%;
  background: transparent;
  /* 确保小尺寸GIF也能正常显示 */
  image-rendering: -webkit-optimize-contrast;
}

.forecast-weather span {
  font-size: 13px;
  color: #303133;
}

.forecast-temp {
  font-size: 12px;
  color: #606266;
  text-align: right;
  width: 60px;
}

/* 面板底部 */
.weather-footer {
  padding: 12px 20px 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.refresh-btn {
  width: 100%;
  padding: 10px;
  background: linear-gradient(135deg, #409eff, #67c23a);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 动画效果 */
.weather-panel-enter-active,
.weather-panel-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  transform-origin: bottom left;
}

.weather-panel-enter-from,
.weather-panel-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}

/* 天气图标动画效果 */
.weather-gif {
  animation: weatherFloat 3s ease-in-out infinite;
}

@keyframes weatherFloat {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-2px);
  }
}

/* 温度徽章脉动效果 */
.temperature-badge {
  animation: tempPulse 2s ease-in-out infinite;
}

@keyframes tempPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .weather-panel {
    width: 280px;
    max-height: 350px;
  }
  
  .weather-main {
    gap: 12px;
  }
  
  .weather-icon-large {
    width: 50px;
    height: 50px;
  }
  
  .temperature {
    font-size: 24px;
  }
  
  .weather-info {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
}
</style>
