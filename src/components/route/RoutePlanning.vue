<template>
  <div class="route-planning">
    <!-- 智能匹配路线规划 -->
    <div class="planning-section">
      <!-- 难易度滑动条 -->
      <div class="slider-group">
        <label class="slider-label">
          <span>难易度</span>
          <span class="slider-value">{{ difficultyText }}</span>
        </label>
        <input 
          type="range" 
          min="1" 
          max="10" 
          v-model="smartParams.difficulty"
          class="slider difficulty-slider"
          @input="updateDifficultyText"
        />
        <div class="slider-marks">
          <span>易</span>
          <span>难</span>
        </div>
      </div>

      <!-- 风景优先级滑动条 -->
      <div class="slider-group">
        <label class="slider-label">
          <span>风景优先级</span>
          <span class="slider-value">{{ sceneryText }}</span>
        </label>
        <input 
          type="range" 
          min="1" 
          max="10" 
          v-model="smartParams.sceneryPriority"
          class="slider scenery-slider"
          @input="updateSceneryText"
        />
        <div class="slider-marks">
          <span>低</span>
          <span>高</span>
        </div>
      </div>

      <!-- 骑行类型选择 -->
      <div class="type-group">
        <label class="type-label">骑行类型</label>
        <div class="cycling-types">
          <div 
            v-for="type in cyclingTypes" 
            :key="type.key"
            class="type-option"
            :class="{ active: smartParams.cyclingType === type.key }"
            @click="selectCyclingType(type.key)"
          >
            <span class="type-name">{{ type.name }}</span>
            <span class="type-desc">{{ type.description }}</span>
          </div>
        </div>
      </div>

      <!-- 骑行天数滑动条 -->
      <div class="slider-group">
        <label class="slider-label">
          <span>骑行天数</span>
          <span class="slider-value">{{ smartParams.days }}天</span>
        </label>
        <input 
          type="range" 
          min="1" 
          max="15" 
          v-model="smartParams.days"
          class="slider days-slider"
        />
        <div class="slider-marks">
          <span>1天</span>
          <span>15天</span>
        </div>
      </div>

      <!-- 智能匹配按钮 -->
      <button 
        class="action-button smart-match-btn" 
        @click="handleSmartMatch"
        :disabled="isMatching"
      >
        <span v-if="isMatching">匹配中...</span>
        <span v-else>智能匹配路线</span>
      </button>
    </div>

    <!-- 匹配结果展示 -->
    <div class="match-results" v-if="topMatchResults.length > 0">
      <h4>推荐路线 (前{{ topMatchResults.length }}条最佳匹配)</h4>
      <div class="results-list">
        <div 
          v-for="(route, index) in topMatchResults" 
          :key="route.id"
          class="result-item"
          :class="`rank-${index + 1}`"
          @click="selectRoute(route)"
        >
          <div class="rank-badge">{{ index + 1 }}</div>
          <div class="route-info">
            <h5>{{ route.name }}</h5>
            <div class="route-details">
              <span class="region">{{ route.region }}</span>
              <span class="distance">{{ route.distance_km }}km</span>
              <span class="days">{{ route.estimated_days }}天</span>
            </div>
          </div>
          <div class="match-score">
            <span class="score">{{ route.match_score }}</span>
            <span class="score-label">匹配度</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 路线详情弹窗 -->
    <SmartRouteDetailModal
      v-if="showRouteDetail"
      :route="selectedRouteForDetail"
      :smartParams="smartParams"
      :difficultyText="difficultyText"
      :weatherScore="getCurrentWeatherScore()"
      :matchedRoutesCount="matchResults.length"
      @close="closeRouteDetail"
      @route-selected="handleRouteSelected"
      @trajectory-playback="handleTrajectoryPlayback"
      @route-navigate-with-markers="handleRouteNavigateWithMarkers"
      @clear-previous-displays="handleClearPreviousDisplays"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, inject } from 'vue'
import { useRoutePlanning } from '@/composables/useRoutePlanning.js'
import { getWeatherScore } from '@/utils/weatherUtils.js'
import SmartRouteDetailModal from './SmartRouteDetailModal.vue'
import simplifiedAnalytics from '@/utils/simplifiedAnalytics'

// 发射事件到父组件
const emit = defineEmits(['route-generated', 'route-selected', 'trajectory-playback', 'route-navigate-with-markers', 'clear-previous-displays'])

// 使用路线规划组合式函数
const {
  smartMatchRoutes
} = useRoutePlanning()

// 智能匹配参数
const smartParams = reactive({
  difficulty: 5,        // 难易度 1-10
  sceneryPriority: 7,   // 风景优先级 1-10
  cyclingType: '自由',  // 骑行类型
  days: 3              // 骑行天数 1-15
})

// 骑行类型配置
const cyclingTypes = ref([
  {
    key: '休闲',
    name: '休闲',
    description: '40-60公里/天'
  },
  {
    key: '自由',
    name: '自由',
    description: '80-120公里/天'
  },
  {
    key: '挑战',
    name: '挑战',
    description: '150公里以上/天'
  }
])

// 匹配结果
const matchResults = ref([])
const isMatching = ref(false)

// 路线详情弹窗
const showRouteDetail = ref(false)
const selectedRouteForDetail = ref(null)

// 尝试获取天气组件的天气数据
const weatherComponent = inject('weatherComponent', null)

// 计算属性：只显示前3条最佳匹配路线
const topMatchResults = computed(() => {
  return matchResults.value.slice(0, 3)
})

// 计算属性：难易度文本
const difficultyText = computed(() => {
  const value = parseInt(smartParams.difficulty)
  if (value <= 3) return '简单'
  if (value <= 7) return '中等'
  return '困难'
})

// 计算属性：风景优先级文本
const sceneryText = computed(() => {
  const value = parseInt(smartParams.sceneryPriority)
  if (value <= 3) return '不重要'
  if (value <= 7) return '重要'
  return '非常重要'
})

// 更新难易度文本（滑动条变化时调用）
const updateDifficultyText = () => {
  // 这个方法主要是为了触发响应式更新，实际逻辑在computed中
}

// 更新风景优先级文本（滑动条变化时调用）
const updateSceneryText = () => {
  // 这个方法主要是为了触发响应式更新，实际逻辑在computed中
}

// 选择骑行类型
const selectCyclingType = (type) => {
  smartParams.cyclingType = type
}

// 获取当前天气评分
const getCurrentWeatherScore = () => {
  try {
    // 尝试从Weather组件获取天气数据
    if (weatherComponent && weatherComponent.currentWeather && weatherComponent.currentWeather.weather) {
      return getWeatherScore(weatherComponent.currentWeather.weather)
    }
    
    // 如果无法获取天气数据，返回默认值（一般天气）
    return 6
  } catch (error) {
    console.warn('获取天气数据失败，使用默认值:', error)
    return 6
  }
}

// 处理智能匹配
const handleSmartMatch = async () => {
  if (isMatching.value) return
  
  isMatching.value = true
  
  try {
    // 获取当前天气评分
    const weatherScore = getCurrentWeatherScore()
    
    console.log('开始智能匹配，参数:', {
      ...smartParams,
      weatherScore
    })
    
    // 调用智能匹配API，限制返回结果为3条
    const results = await smartMatchRoutes({
      difficulty: parseInt(smartParams.difficulty),
      sceneryPriority: parseInt(smartParams.sceneryPriority),
      cyclingType: smartParams.cyclingType,
      days: parseInt(smartParams.days),
      weatherScore: weatherScore,
      limit: 3
    })
    
    matchResults.value = results || []
    
    // 智能匹配完成，将结果保存到组件状态中，记录将在用户选择路线时进行
    
    // 发射匹配完成事件
    emit('route-generated', {
      mode: 'smart',
      params: smartParams,
      results: topMatchResults.value // 只返回前3条结果
    })
    
  } catch (error) {
    console.error('智能匹配失败:', error)
    // 可以在这里显示错误提示
  } finally {
    isMatching.value = false
  }
}

// 选择路线（点击路线卡片）
const selectRoute = (route) => {
  selectedRouteForDetail.value = route
  showRouteDetail.value = true
}

// 关闭路线详情弹窗
const closeRouteDetail = () => {
  showRouteDetail.value = false
  selectedRouteForDetail.value = null
}

// 处理路线选择（从弹窗中选择路线）
const handleRouteSelected = (routeData) => {
  emit('route-selected', routeData)
}

// 处理轨迹回放（从弹窗中触发）
const handleTrajectoryPlayback = (trajectoryData) => {
  emit('trajectory-playback', trajectoryData)
}

// 处理导航路线标记事件（从弹窗中触发）
const handleRouteNavigateWithMarkers = (routeData) => {
  emit('route-navigate-with-markers', routeData)
}

// 处理清除之前显示的事件（从弹窗中触发）
const handleClearPreviousDisplays = () => {
  emit('clear-previous-displays')
}

// 暴露给父组件的方法
defineExpose({
  smartParams,
  matchResults: topMatchResults, // 只暴露前3条结果
  handleSmartMatch
})
</script>

<style scoped>
/* 路线规划部分 */
.route-planning {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
  position: relative;
  /* 占满整个可用高度 */
  height: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

/* 规划区域 */
.planning-section {
  min-height: 200px;
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

/* 智能匹配样式 */
.slider-group {
  margin-bottom: 20px;
}

.slider-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.slider-value {
  color: #4CAF50;
  font-weight: 600;
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e0e0e0;
  outline: none;
  cursor: pointer;
  transition: all 0.3s ease;
  -webkit-appearance: none;
  appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #4CAF50;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(76, 175, 80, 0.3);
  transition: all 0.3s ease;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 3px 8px rgba(76, 175, 80, 0.4);
}

.slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #4CAF50;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 6px rgba(76, 175, 80, 0.3);
}

.slider-marks {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
  font-size: 12px;
  color: #909399;
}

/* 不同滑动条的颜色 */
.difficulty-slider {
  background: linear-gradient(to right, #67c23a, #e6a23c, #f56c6c);
}

.scenery-slider {
  background: linear-gradient(to right, #909399, #409eff, #67c23a);
}

.days-slider {
  background: linear-gradient(to right, #409eff, #67c23a);
}

/* 骑行类型选择 */
.type-group {
  margin-bottom: 20px;
}

.type-label {
  display: block;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.cycling-types {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.type-option {
  flex: 1;
  min-width: 100px;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  background: rgba(255, 255, 255, 0.8);
}

.type-option:hover {
  border-color: #4CAF50;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.type-option.active {
  border-color: #4CAF50;
  background: rgba(76, 175, 80, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
}

.type-name {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.type-desc {
  display: block;
  font-size: 12px;
  color: #909399;
}

.type-option.active .type-name {
  color: #4CAF50;
}

/* 按钮样式 */
.action-button {
  width: 100%;
  padding: 12px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.action-button:hover:not(:disabled) {
  background: #45a049;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.action-button:active {
  transform: translateY(0);
}

.action-button:disabled {
  background: #c0c4cc;
  cursor: not-allowed;
  transform: none;
}

.smart-match-btn {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  font-size: 15px;
  font-weight: 600;
}

/* 匹配结果展示 */
.match-results {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.match-results h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  flex-shrink: 0;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.8);
  position: relative;
}

.result-item:hover {
  border-color: #4CAF50;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 排名徽章 */
.rank-badge {
  position: absolute;
  top: -8px;
  left: -8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(76, 175, 80, 0.4);
  z-index: 1;
}

/* 不同排名的特殊样式 */
.result-item.rank-1 {
  border-color: #FFD700;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 255, 255, 0.8));
}

.result-item.rank-1 .rank-badge {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  box-shadow: 0 2px 6px rgba(255, 215, 0, 0.4);
}

.result-item.rank-2 {
  border-color: #C0C0C0;
  background: linear-gradient(135deg, rgba(192, 192, 192, 0.1), rgba(255, 255, 255, 0.8));
}

.result-item.rank-2 .rank-badge {
  background: linear-gradient(135deg, #C0C0C0, #A0A0A0);
  box-shadow: 0 2px 6px rgba(192, 192, 192, 0.4);
}

.result-item.rank-3 {
  border-color: #CD7F32;
  background: linear-gradient(135deg, rgba(205, 127, 50, 0.1), rgba(255, 255, 255, 0.8));
}

.result-item.rank-3 .rank-badge {
  background: linear-gradient(135deg, #CD7F32, #B8860B);
  box-shadow: 0 2px 6px rgba(205, 127, 50, 0.4);
}

.route-info {
  flex: 1;
}

.route-info h5 {
  margin: 0 0 6px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.route-details {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #909399;
}

.route-details span {
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.match-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.score {
  font-size: 16px;
  font-weight: 700;
  color: #4CAF50;
}

.score-label {
  font-size: 10px;
  color: #909399;
}

/* 响应式设计 */

/* 低分辨率优化 (1K分辨率及以下) */
@media (max-height: 900px) {
  .planning-section {
    min-height: 180px;
  }
  
  .slider-group {
    margin-bottom: 16px;
  }
  
  .type-group {
    margin-bottom: 16px;
  }
  
  .match-results {
    margin-top: 16px;
    padding-top: 16px;
  }
  
  .results-list {
    gap: 10px;
  }
  
  .result-item {
    padding: 10px;
  }
}

/* 超低分辨率优化 */
@media (max-height: 768px) {
  .planning-section {
    min-height: 160px;
  }
  
  .slider-group {
    margin-bottom: 12px;
  }
  
  .type-group {
    margin-bottom: 12px;
  }
  
  .match-results {
    margin-top: 12px;
    padding-top: 12px;
  }
  
  .results-list {
    gap: 8px;
  }
  
  .result-item {
    padding: 8px;
  }
  
  .match-results h4 {
    margin-bottom: 10px;
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  .cycling-types {
    flex-direction: column;
  }
  
  .type-option {
    flex: none;
  }
  
  .route-details {
    flex-wrap: wrap;
    gap: 6px;
  }
  
  .result-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .match-score {
    align-self: flex-end;
    flex-direction: row;
    gap: 6px;
  }
}
</style>
