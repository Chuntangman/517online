<template>
  <div class="destinations-section">
    <!-- 地区信息提示 -->
    <div class="region-info">
      <p v-if="selectedRegion === '全部'">
        显示所有地区的常用地点
      </p>
      <p v-else>
        显示 <strong>{{ selectedRegion }}</strong> 地区的常用地点
      </p>
    </div>

    <!-- 搜索框 -->
    <div class="search-container">
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="搜索地点名称或介绍..."
          @input="handleSearch"
        />
        <i class="search-icon">🔍</i>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <p>正在加载常用地点...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <p>加载失败: {{ error }}</p>
      <button @click="fetchDestinations" class="retry-button">重试</button>
    </div>

    <!-- 空状态 -->
    <div v-else-if="filteredDestinations.length === 0" class="empty-state">
      <p>没有找到符合条件的地点</p>
      <p class="empty-hint">试试调整搜索条件或选择其他地区</p>
    </div>

    <!-- 地点卡片列表 -->
    <div v-else class="destinations-list">
      <div 
        v-for="destination in filteredDestinations" 
        :key="destination.id"
        class="destination-card"
        @click="handleDestinationClick(destination)"
      >
        <div class="destination-header">
          <h3>{{ destination.name }}</h3>
          <span class="region-badge">{{ destination.region }}</span>
        </div>
        
        <div class="destination-info">
          <p class="description">
            <span class="info-icon">📝</span>
            {{ destination.description || '待补充' }}
          </p>
          <p class="coordinates" v-if="destination.longitude && destination.latitude">
            <span class="info-icon">📍</span>
            坐标: {{ destination.longitude }}, {{ destination.latitude }}
          </p>
        </div>
      </div>
    </div>

    <!-- 地点详情弹窗 -->
    <div v-if="selectedDestination" class="destination-modal" @click="handleModalBackdropClick">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ selectedDestination.name }}</h2>
          <button class="close-button" @click="handleCloseModal">×</button>
        </div>
        <div class="modal-body">
          <!-- 地点图片展示区域 -->
          <div class="destination-image-section">
            <div v-if="getCurrentDestinationImage(selectedDestination.name)" class="image-container">
              <img 
                :src="getDestinationImageUrl(getCurrentDestinationImage(selectedDestination.name))" 
                :alt="selectedDestination.name"
                class="destination-image"
                @error="handleImageError"
              />
              
              <!-- 图片控制按钮 -->
              <div class="image-controls" v-if="destinationImages[selectedDestination.name] && destinationImages[selectedDestination.name].length > 1">
                <button 
                  class="image-control-btn prev-btn"
                  @click="handlePrevDestinationImage"
                  title="上一张"
                >
                  &#8249;
                </button>
                <button 
                  class="image-control-btn next-btn"
                  @click="handleNextDestinationImage"
                  title="下一张"
                >
                  &#8250;
                </button>
              </div>
              
              <!-- 图片指示器 -->
              <div 
                v-if="destinationImages[selectedDestination.name] && destinationImages[selectedDestination.name].length > 1"
                class="image-indicators"
              >
                <span 
                  v-for="(image, index) in destinationImages[selectedDestination.name]" 
                  :key="index"
                  class="indicator"
                  :class="{ active: currentDestinationImageIndex[selectedDestination.name] === index }"
                  @click="jumpToDestinationImage(selectedDestination.name, index)"
                ></span>
              </div>
            </div>
            
            <!-- 无图片状态 -->
            <div v-else class="no-image-container">
              <div class="no-image-placeholder">
                <span class="no-image-icon">🖼️</span>
                <p>暂无图片</p>
              </div>
            </div>
            
            <!-- 图片描述 -->
            <div v-if="getCurrentDestinationImage(selectedDestination.name)" class="image-description">
              <p>{{ getDestinationImageDescription(getCurrentDestinationImage(selectedDestination.name)) }}</p>
            </div>
          </div>
          
          <div class="destination-details">
            <p><strong>地点名称：</strong>{{ selectedDestination.name }}</p>
            <p><strong>所属地区：</strong>{{ selectedDestination.region || '待补充' }}</p>
            <p><strong>地点介绍：</strong>{{ selectedDestination.description || '待补充' }}</p>
            <p v-if="selectedDestination.longitude && selectedDestination.latitude">
              <strong>经纬度：</strong>{{ selectedDestination.longitude }}, {{ selectedDestination.latitude }}
            </p>
            <p v-if="selectedDestination.nearest_waystation_name">
              <strong>最近驿站：</strong>{{ selectedDestination.nearest_waystation_name }}
              <span v-if="selectedDestination.nearest_waystation_distance">
                (距离约 {{ selectedDestination.nearest_waystation_distance }}km)
              </span>
            </p>
            <p v-if="selectedDestination.popular_route_name">
              <strong>热门线路：</strong>{{ selectedDestination.popular_route_name }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, reactive } from 'vue'
import axios from 'axios'
import { useRegions } from '@/composables/useRegions.js'

// 发射事件到父组件
const emit = defineEmits(['destination-selected', 'destinations-filtered'])

// 使用地区管理
const { selectedRegion } = useRegions()

// 响应式数据
const destinations = ref([])
const selectedDestination = ref(null)
const searchQuery = ref('')
const loading = ref(false)
const error = ref('')

// 图片相关数据
const destinationImages = reactive({})
const currentDestinationImageIndex = reactive({})
const imageCarouselTimers = reactive({})

// 获取目标点数据
const fetchDestinations = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const params = {}
    if (selectedRegion.value && selectedRegion.value !== '全部') {
      params.region = selectedRegion.value
    }
    
    const response = await axios.get('/api/v1/destinations', { params })
    
    if (response.data.success) {
      destinations.value = response.data.data || []
      console.log('获取到常用地点数据：', destinations.value.length, '个地点')
    } else {
      throw new Error(response.data.message || '获取数据失败')
    }
  } catch (err) {
    console.error('获取目标点数据失败:', err)
    error.value = err.response?.data?.message || err.message || '网络请求失败'
    destinations.value = []
  } finally {
    loading.value = false
  }
}

// 搜索和地区过滤
const filteredDestinations = computed(() => {
  let filtered = destinations.value
  
  // 地区筛选
  if (selectedRegion.value && selectedRegion.value !== '全部') {
    filtered = filtered.filter(destination => 
      destination.region === selectedRegion.value
    )
  }
  
  // 搜索筛选
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(destination => 
      destination.name?.toLowerCase().includes(query) ||
      destination.description?.toLowerCase().includes(query) ||
      destination.region?.toLowerCase().includes(query)
    )
  }
  
  return filtered
})

// 处理搜索
const handleSearch = () => {
  // 搜索逻辑已在 computed 中处理
  // 发射筛选变化事件给父组件
  emit('destinations-filtered', filteredDestinations.value)
}

// 监听筛选结果变化
watch(filteredDestinations, (newFiltered) => {
  // 目标点筛选结果变化
  emit('destinations-filtered', newFiltered)
}, { immediate: true })

// 获取指定地点的图片
const fetchDestinationImages = async (destinationName) => {
  if (!destinationName) {
    console.warn('地点名称为空，无法获取图片')
    return []
  }
  
  try {
    // 使用现有的图片API，通过名称匹配
    const apiUrl = `/api/v1/images/name/${encodeURIComponent(destinationName)}`
    
    console.log('正在获取地点图片，API地址:', apiUrl)
    const response = await axios.get(apiUrl)
    
    if (response.data && response.data.success && response.data.data) {
      const images = response.data.data
      
      // 存储图片数据
      destinationImages[destinationName] = images
      
      // 初始化当前图片索引
      if (images.length > 0) {
        currentDestinationImageIndex[destinationName] = 0
      }
      
      console.log(`地点 ${destinationName} 图片加载成功，共 ${images.length} 张图片`)
      return images
    } else {
      console.log(`地点 ${destinationName} 没有找到图片`)
      destinationImages[destinationName] = []
      return []
    }
  } catch (error) {
    console.error(`获取地点 ${destinationName} 图片失败:`, error)
    destinationImages[destinationName] = []
    return []
  }
}

// 获取当前显示的图片
const getCurrentDestinationImage = (destinationName) => {
  if (!destinationImages[destinationName] || destinationImages[destinationName].length === 0) {
    return null
  }
  
  const index = currentDestinationImageIndex[destinationName] || 0
  return destinationImages[destinationName][index]
}

// 获取图片URL
const getDestinationImageUrl = (imageData) => {
  if (!imageData || !imageData['存储(根目录路径)']) {
    return ''
  }
  
  // 将Windows路径转换为Web路径
  let imagePath = imageData['存储(根目录路径)']
  imagePath = imagePath.replace(/\\/g, '/')
  
  // 如果路径以public开头，则移除public前缀
  if (imagePath.startsWith('public/')) {
    imagePath = imagePath.substring(7)
  }
  
  // 确保路径以/开头
  if (!imagePath.startsWith('/')) {
    imagePath = '/' + imagePath
  }
  
  return imagePath
}

// 获取图片描述
const getDestinationImageDescription = (imageData) => {
  if (!imageData) {
    return '暂无描述'
  }
  
  return imageData['介绍'] || '暂无描述'
}

// 开始图片轮播
const startDestinationImageCarousel = (destinationName, interval = 4000) => {
  if (!destinationImages[destinationName] || destinationImages[destinationName].length <= 1) {
    return
  }
  
  // 停止已有的轮播
  stopDestinationImageCarousel(destinationName)
  
  // 开始新的轮播
  imageCarouselTimers[destinationName] = setInterval(() => {
    nextDestinationImage(destinationName)
  }, interval)
  
  console.log(`地点 ${destinationName} 开始图片轮播，间隔 ${interval}ms`)
}

// 停止图片轮播
const stopDestinationImageCarousel = (destinationName) => {
  if (imageCarouselTimers[destinationName]) {
    clearInterval(imageCarouselTimers[destinationName])
    delete imageCarouselTimers[destinationName]
    console.log(`地点 ${destinationName} 停止图片轮播`)
  }
}

// 切换到下一张图片
const nextDestinationImage = (destinationName) => {
  if (!destinationImages[destinationName] || destinationImages[destinationName].length <= 1) {
    return
  }
  
  const maxIndex = destinationImages[destinationName].length - 1
  currentDestinationImageIndex[destinationName] = (currentDestinationImageIndex[destinationName] + 1) % (maxIndex + 1)
}

// 切换到上一张图片
const prevDestinationImage = (destinationName) => {
  if (!destinationImages[destinationName] || destinationImages[destinationName].length <= 1) {
    return
  }
  
  const maxIndex = destinationImages[destinationName].length - 1
  currentDestinationImageIndex[destinationName] = currentDestinationImageIndex[destinationName] === 0 
    ? maxIndex 
    : currentDestinationImageIndex[destinationName] - 1
}

// 跳转到指定图片
const jumpToDestinationImage = (destinationName, index) => {
  if (!destinationImages[destinationName] || index < 0 || index >= destinationImages[destinationName].length) {
    return
  }
  
  currentDestinationImageIndex[destinationName] = index
}

// 处理地点卡片点击
const handleDestinationClick = async (destination) => {
  selectedDestination.value = destination
  emit('destination-selected', destination)
  console.log('选择常用地点:', destination)
  
  // 获取并开始轮播地点图片
  if (destination.name) {
    const images = await fetchDestinationImages(destination.name)
    if (images.length > 1) {
      // 延迟开始轮播，让弹窗先显示
      setTimeout(() => {
        startDestinationImageCarousel(destination.name, 4000) // 4秒切换一次
      }, 500)
    }
  }
}

// 处理模态框关闭
const handleCloseModal = () => {
  // 停止图片轮播
  if (selectedDestination.value?.name) {
    stopDestinationImageCarousel(selectedDestination.value.name)
  }
  selectedDestination.value = null
}

// 处理模态框背景点击
const handleModalBackdropClick = () => {
  // 停止图片轮播
  if (selectedDestination.value?.name) {
    stopDestinationImageCarousel(selectedDestination.value.name)
  }
  selectedDestination.value = null
}

// 手动切换图片
const handleNextDestinationImage = () => {
  if (selectedDestination.value?.name) {
    nextDestinationImage(selectedDestination.value.name)
  }
}

const handlePrevDestinationImage = () => {
  if (selectedDestination.value?.name) {
    prevDestinationImage(selectedDestination.value.name)
  }
}

// 处理图片加载错误
const handleImageError = (event) => {
  console.error('图片加载失败:', event.target.src)
  event.target.style.display = 'none'
}

// 清理所有轮播定时器
const cleanupDestinationCarousels = () => {
  Object.keys(imageCarouselTimers).forEach(destinationName => {
    stopDestinationImageCarousel(destinationName)
  })
}

// 监听地区变化，重新获取数据
watch(selectedRegion, (newRegion) => {
  console.log('地区变化，重新获取常用地点数据:', newRegion)
  fetchDestinations()
}, { immediate: false })

// 组件挂载时获取数据
onMounted(() => {
  fetchDestinations()
})

// 组件卸载时清理所有轮播定时器
onUnmounted(() => {
  cleanupDestinationCarousels()
})

// 暴露给父组件的数据和方法
defineExpose({
  destinations,
  filteredDestinations,
  selectedDestination,
  fetchDestinations,
  destinationImages,
  currentDestinationImageIndex
})
</script>

<style scoped>
/* 常用地点部分样式 */
.destinations-section {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px 0;
}

/* 地区信息样式 */
.region-info {
  text-align: center;
  padding: 12px 20px;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-radius: 8px;
  margin-bottom: 10px;
}

.region-info p {
  margin: 0;
  color: #1976d2;
  font-size: 14px;
  font-weight: 500;
}

.region-info strong {
  color: #0d47a1;
}

/* 搜索容器样式 */
.search-container {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.search-box {
  position: relative;
}

.search-box input {
  width: 100%;
  padding: 12px 40px 12px 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.search-box input:focus {
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
  outline: none;
}

.search-icon {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

/* 状态样式 */
.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.error-state {
  color: #dc3545;
}

.retry-button {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
  transition: background 0.3s ease;
}

.retry-button:hover {
  background: #0056b3;
}

.empty-hint {
  font-size: 14px;
  color: #999;
  margin-top: 5px;
}

/* 地点列表样式 */
.destinations-list {
  flex: 1;
  overflow-y: auto;
  display: grid;
  gap: 15px;
  padding-right: 5px;
}

.destination-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
}

.destination-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.destination-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 10px;
}

.destination-header h3 {
  margin: 0;
  font-size: 16px;
  color: #2c3e50;
  font-weight: 600;
}

.region-badge {
  padding: 4px 12px;
  background: #e8f5e9;
  color: #4CAF50;
  border-radius: 20px;
  font-size: 12px;
  white-space: nowrap;
}

.destination-info {
  margin: 15px 0;
}

.destination-info p {
  margin: 8px 0;
  color: #666;
  font-size: 14px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  line-height: 1.4;
}

.info-icon {
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 1px;
}

.description {
  font-style: italic;
}

.coordinates {
  font-family: monospace;
  font-size: 12px;
}

/* 地点图片展示样式 */
.destination-image-section {
  margin-bottom: 20px;
  border-radius: 12px;
  overflow: hidden;
  background: #f8f9fa;
}

.image-container {
  position: relative;
  width: 100%;
  height: 250px;
  overflow: hidden;
  border-radius: 8px;
}

.destination-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.destination-image:hover {
  transform: scale(1.05);
}

/* 无图片状态样式 */
.no-image-container {
  width: 100%;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px dashed #ddd;
}

.no-image-placeholder {
  text-align: center;
  color: #999;
}

.no-image-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 10px;
}

.no-image-placeholder p {
  margin: 0;
  font-size: 16px;
  color: #666;
}

/* 图片控制按钮 */
.image-controls {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  pointer-events: none;
}

.image-control-btn {
  pointer-events: auto;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 0 10px;
  opacity: 0;
}

.image-container:hover .image-control-btn {
  opacity: 1;
}

.image-control-btn:hover {
  background: rgba(0, 0, 0, 0.7);
  transform: scale(1.1);
}

/* 图片指示器 */
.image-indicators {
  position: absolute;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
}

.indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.3s ease;
}

.indicator.active {
  background: rgba(255, 255, 255, 0.9);
  transform: scale(1.2);
}

.indicator:hover {
  background: rgba(255, 255, 255, 0.8);
}

/* 图片描述 */
.image-description {
  padding: 15px;
  background: white;
  border-radius: 0 0 8px 8px;
}

.image-description p {
  margin: 0;
  color: #666;
  font-size: 14px;
  text-align: center;
  font-style: italic;
}

/* 地点详情弹窗 */
.destination-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 20px;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-button:hover {
  background: #f5f5f5;
  color: #333;
}

.modal-body {
  padding: 20px;
}

.destination-details p {
  margin: 15px 0;
  color: #666;
  line-height: 1.6;
}

.destination-details strong {
  color: #333;
  font-weight: 600;
}

/* 滚动条样式 */
.destinations-list::-webkit-scrollbar {
  width: 6px;
}

.destinations-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.destinations-list::-webkit-scrollbar-thumb {
  background: #4CAF50;
  border-radius: 3px;
}

.destinations-list::-webkit-scrollbar-thumb:hover {
  background: #45a049;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .destination-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .modal-content {
    width: 95%;
    margin: 10px;
  }
  
  .search-container {
    padding: 15px;
  }
  
  .destination-card {
    padding: 15px;
  }
}
</style>
