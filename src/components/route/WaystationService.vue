<template>
  <div class="waystation-section">
    <!-- 地区信息提示 -->
    <div class="region-info">
      <p v-if="selectedRegion === '全部'">
        显示所有地区的驿站
      </p>
      <p v-else>
        显示 <strong>{{ selectedRegion }}</strong> 地区的驿站
      </p>
    </div>

    <!-- 搜索和筛选区域 -->
    <div class="waystation-filters">
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="搜索驿站名称或地址..."
          @input="handleFilterChange"
        />
        <i class="search-icon">🔍</i>
      </div>
      
      <!-- 服务类型筛选 -->
      <div class="service-filters">
        <div 
          v-for="(label, service) in serviceTypes" 
          :key="service"
          class="service-filter"
          :class="{ active: selectedServices[service] }"
          @click="handleServiceToggle(service)"
        >
          <span class="service-icon">{{ serviceIcons[service] }}</span>
          {{ label }}
        </div>
      </div>
    </div>

    <!-- 驿站列表 -->
    <div class="waystation-list">
      <!-- 加载状态 -->
      <div v-if="waystations.length === 0" class="loading-state">
        <p>正在加载驿站数据...</p>
      </div>
      
      <!-- 空状态 -->
      <div v-else-if="filteredWaystations.length === 0" class="empty-state">
        <p>没有找到符合条件的驿站</p>
        <p class="empty-hint">试试调整搜索条件或筛选选项</p>
      </div>
      
      <!-- 驿站卡片列表 -->
      <div 
        v-for="station in filteredWaystations" 
        :key="station.ID"
        class="waystation-card"
        @click="handleStationClick(station)"
      >
        <div class="waystation-header">
          <h3>{{ station.name }}</h3>
          <span class="region-badge">{{ station.region }}</span>
        </div>
        
        <div class="waystation-info">
          <p class="address">
            <span class="info-icon">📍</span>
            {{ station.address }}
          </p>
          <p class="contact" v-if="station.contact">
            <span class="info-icon">📞</span>
            {{ station.contact }}
          </p>
        </div>

        <div class="service-badges">
          <span 
            v-for="(label, service) in serviceTypes" 
            :key="service"
            class="service-badge"
            :class="{ 
              'service-available': station[service] === 1,
              'service-unavailable': station[service] !== 1 
            }"
          >
            {{ serviceIcons[service] }}
          </span>
        </div>
      </div>
    </div>

    <!-- 驿站详情弹窗 -->
    <div v-if="selectedStation" class="station-modal" @click="handleModalBackdropClick">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ selectedStation.name }}</h2>
          <button class="close-button" @click="handleCloseModal">×</button>
        </div>
        <div class="modal-body">
          <!-- 驿站图片展示区域 -->
          <div class="station-image-section">
            <div v-if="getCurrentImage(selectedStation.name)" class="image-container">
              <img 
                :src="getImageUrl(getCurrentImage(selectedStation.name))" 
                :alt="selectedStation.name"
                class="station-image"
                @error="handleImageError"
              />
              
              <!-- 图片控制按钮 -->
              <div class="image-controls" v-if="stationImages[selectedStation.name] && stationImages[selectedStation.name].length > 1">
                <button 
                  class="image-control-btn prev-btn"
                  @click="handlePrevImage"
                  title="上一张"
                >
                  &#8249;
                </button>
                <button 
                  class="image-control-btn next-btn"
                  @click="handleNextImage"
                  title="下一张"
                >
                  &#8250;
                </button>
              </div>
              
              <!-- 图片指示器 -->
              <div 
                v-if="stationImages[selectedStation.name] && stationImages[selectedStation.name].length > 1"
                class="image-indicators"
              >
                <span 
                  v-for="(image, index) in stationImages[selectedStation.name]" 
                  :key="index"
                  class="indicator"
                  :class="{ active: currentImageIndex[selectedStation.name] === index }"
                  @click="jumpToImage(selectedStation.name, index)"
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
            <div v-if="getCurrentImage(selectedStation.name)" class="image-description">
              <p>{{ getImageDescription(getCurrentImage(selectedStation.name)) }}</p>
            </div>
          </div>
          
          <div class="station-details">
            <p><strong>地区：</strong>{{ selectedStation.region }}</p>
            <p><strong>地址：</strong>{{ selectedStation.address }}</p>
            <p><strong>联系方式：</strong>{{ selectedStation.contact || '暂无' }}</p>
            <p><strong>备注：</strong>{{ selectedStation.remarks || '暂无' }}</p>
          </div>
          <div class="service-details">
            <h3>提供服务</h3>
            <div class="service-grid">
              <div 
                v-for="(label, service) in serviceTypes" 
                :key="service"
                class="service-item"
                :class="{ 'available': selectedStation[service] === 1 }"
              >
                <span class="service-icon">{{ serviceIcons[service] }}</span>
                <span class="service-name">{{ label }}</span>
                <span class="service-status">
                  {{ selectedStation[service] === 1 ? '✓' : '✗' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { watch, onMounted, onUnmounted } from 'vue'
import { useWaystation } from '@/composables/useWaystation.js'
import { useStationImages } from '@/composables/useStationImages.js'

// 接收父组件传递的参数
const props = defineProps({
  mapRef: Object,
  activeTab: String
})

// 发射事件到父组件
const emit = defineEmits(['station-selected', 'filters-changed'])

// 使用驿站管理组合式函数
const {
  waystations,
  filteredWaystations,
  selectedStation,
  searchQuery,
  selectedServices,
  serviceTypes,
  serviceIcons,
  selectedRegion,
  fetchWaystations,
  filterWaystations,
  toggleService,
  showStationDetails,
  closeStationDetails
} = useWaystation()

// 使用驿站图片管理组合式函数
const {
  stationImages,
  currentImageIndex,
  fetchStationImages,
  getCurrentImage,
  getImageUrl,
  getImageDescription,
  startImageCarousel,
  stopImageCarousel,
  nextImage,
  prevImage,
  jumpToImage,
  cleanupCarousels
} = useStationImages()

// 处理筛选变化
const handleFilterChange = () => {
  const filtered = filterWaystations(props.mapRef, { value: props.activeTab })
  emit('filters-changed', filtered)
}

// 处理服务筛选切换
const handleServiceToggle = (service) => {
  toggleService(service, props.mapRef, { value: props.activeTab })
  const filtered = filterWaystations(props.mapRef, { value: props.activeTab })
  emit('filters-changed', filtered)
}

// 处理驿站卡片点击
const handleStationClick = async (station) => {
  showStationDetails(station)
  emit('station-selected', station)
  
  // 获取并开始轮播驿站图片
  if (station.name) {
    const images = await fetchStationImages(station.name)
    if (images.length > 1) {
      // 延迟开始轮播，让弹窗先显示
      setTimeout(() => {
        startImageCarousel(station.name, 4000) // 4秒切换一次
      }, 500)
    }
  }
}

// 处理模态框关闭
const handleCloseModal = () => {
  // 停止图片轮播
  if (selectedStation.value?.name) {
    stopImageCarousel(selectedStation.value.name)
  }
  closeStationDetails()
}

// 处理模态框背景点击
const handleModalBackdropClick = () => {
  // 停止图片轮播
  if (selectedStation.value?.name) {
    stopImageCarousel(selectedStation.value.name)
  }
  closeStationDetails()
}

// 手动切换图片
const handleNextImage = () => {
  if (selectedStation.value?.name) {
    nextImage(selectedStation.value.name)
  }
}

const handlePrevImage = () => {
  if (selectedStation.value?.name) {
    prevImage(selectedStation.value.name)
  }
}

// 处理图片加载错误
const handleImageError = (event) => {
  console.error('图片加载失败:', event.target.src)
  event.target.style.display = 'none'
}

// 组件挂载时获取驿站数据
onMounted(async () => {
  try {
    await fetchWaystations()
    console.log('驿站数据加载完成，共', waystations.value.length, '个驿站')
    // 首次加载完成后触发筛选
    handleFilterChange()
  } catch (error) {
    console.error('驿站数据加载失败:', error)
  }
})

// 监听activeTab变化，重新筛选数据
watch(() => props.activeTab, (newTab) => {
  if (newTab === '驿站服务') {
    handleFilterChange()
  }
}, { immediate: true })

// 监听地区变化，重新筛选数据
watch(selectedRegion, (newRegion) => {
  console.log('地区变化，重新筛选驿站数据:', newRegion)
  // 无论当前是否在驿站服务面板，都要更新筛选结果
  handleFilterChange()
}, { immediate: false })

// 组件卸载时清理所有轮播定时器
onUnmounted(() => {
  cleanupCarousels()
})

// 暴露给父组件的数据和方法
defineExpose({
  waystations,
  filteredWaystations,
  selectedStation,
  searchQuery,
  selectedServices,
  filterWaystations: handleFilterChange
})
</script>

<style scoped>
/* 驿站服务部分样式 */
.waystation-section {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.waystation-filters {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.search-box {
  position: relative;
  margin-bottom: 15px;
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

.service-filters {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.service-filter {
  padding: 8px 15px;
  background: #f5f5f5;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 5px;
  user-select: none;
}

.service-filter:hover {
  background: #e8f5e9;
  color: #4CAF50;
}

.service-filter.active {
  background: #4CAF50;
  color: white;
}

.waystation-list {
  flex: 1;
  overflow-y: auto;
  display: grid;
  gap: 15px;
  padding-right: 5px;
}

.waystation-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
}

.waystation-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.waystation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  flex-wrap: wrap;
  gap: 10px;
}

.waystation-header h3 {
  margin: 0;
  font-size: 16px;
  color: #2c3e50;
}

.region-badge {
  padding: 4px 12px;
  background: #e8f5e9;
  color: #4CAF50;
  border-radius: 20px;
  font-size: 12px;
  white-space: nowrap;
}

.waystation-info {
  margin: 15px 0;
}

.waystation-info p {
  margin: 8px 0;
  color: #666;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-icon {
  font-size: 16px;
}

.service-badges {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  flex-wrap: wrap;
}

.service-badge {
  font-size: 18px;
  opacity: 0.3;
  transition: all 0.3s ease;
}

.service-badge.service-available {
  opacity: 1;
}

/* 加载和空状态样式 */
.loading-state, .empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.loading-state p {
  font-size: 16px;
  margin: 0;
}

.empty-state p {
  margin: 10px 0;
}

.empty-hint {
  font-size: 14px;
  color: #999;
}

/* 驿站图片展示样式 */
.station-image-section {
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

.station-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.station-image:hover {
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

/* 驿站详情弹窗 */
.station-modal {
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

.station-details p {
  margin: 10px 0;
  color: #666;
}

.station-details strong {
  color: #333;
}

.service-details {
  margin-top: 20px;
}

.service-details h3 {
  color: #2c3e50;
  margin-bottom: 15px;
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;
}

.service-item {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.service-item.available {
  background: #e8f5e9;
}

.service-icon {
  font-size: 24px;
}

.service-name {
  font-size: 14px;
  color: #666;
}

.service-status {
  font-size: 16px;
  color: #4CAF50;
}

.service-item:not(.available) .service-status {
  color: #f44336;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .service-filters {
    justify-content: center;
  }
  
  .waystation-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .service-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .modal-content {
    width: 95%;
    margin: 10px;
  }
}
</style>
