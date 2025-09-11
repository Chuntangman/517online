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
        <!-- 新导航栏 -->
        <nav class="new-navbar">
          <ol class="nav-list">
            <li 
              v-for="(item, index) in newNavItems" 
              :key="index"
              class="nav-item"
              :class="{ active: activeTab === item.name }"
              @click="switchTab(item.name)"
              @mouseenter="showNavDropdown(index)"
              @mouseleave="hideNavDropdown(index)"
            >
              <a href="#0" class="nav-link">{{ item.name }}</a>
              <ol 
                v-if="item.dropdown && navDropdownVisible[index]" 
                class="sub-nav"
              >
                <li 
                  v-for="(subItem, subIndex) in item.dropdown" 
                  :key="subIndex"
                  class="sub-nav-item"
                  @click.stop="handleSubNavClick(subItem)"
                >
                  <a href="#0">{{ subItem }}</a>
                </li>
              </ol>
            </li>
          </ol>
        </nav>

        <!-- 面板内容区 -->
        <div class="panel-content">
          <!-- 路线规划部分 -->
          <div class="route-planning" v-show="activeTab === '路线规划'">
            <div class="input-group">
              <input type="text" placeholder="起点" />
            </div>
            <div class="input-group">
              <input type="text" placeholder="终点" />
            </div>
            <div class="route-options">
              <div class="route-option active">最短距离</div>
              <div class="route-option">最少爬升</div>
              <div class="route-option">风景最优</div>
            </div>
            <button class="action-button">生成路线</button>
          </div>

          <!-- 热门路线展示 -->
          <div class="route-cards" v-show="activeTab === '热门路线'">
            <div class="route-card">
              <div class="route-card-header">
                <span class="route-card-title">环青海湖骑行线路</span>
                <span class="difficulty-badge difficulty-medium">中等难度</span>
              </div>
              <div class="route-card-stats">
                <span>总距离: 360km</span>
                <span>预计时间: 3-4天</span>
              </div>
            </div>

            <div class="route-card">
              <div class="route-card-header">
                <span class="route-card-title">千岛湖环湖线路</span>
                <span class="difficulty-badge difficulty-easy">简单</span>
              </div>
              <div class="route-card-stats">
                <span>总距离: 120km</span>
                <span>预计时间: 1天</span>
              </div>
            </div>
          </div>

          <!-- 地区选择界面 -->
          <div class="region-selection" v-show="activeTab === '地区'">
            <div class="region-header">
              <h2>选择骑行地区</h2>
              <p>选择您感兴趣的骑行地区，探索当地精彩路线</p>
            </div>
            <div class="region-grid">
              <div 
                v-for="region in ['海南岛', '千岛湖', '青海甘肃', '新疆-独库伊犁', '川藏川西&其他']" 
                :key="region"
                class="region-card"
                @click="handleSubNavClick(region)"
              >
                <div class="region-card-header">
                  <h3>{{ region }}</h3>
                </div>
                <div class="region-card-content">
                  <p>探索{{ region }}的精彩骑行路线</p>
                  <span class="region-card-arrow">→</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 具体地区路线展示 -->
          <div class="region-routes" v-show="['海南岛', '千岛湖', '青海甘肃', '新疆-独库伊犁', '川藏川西&其他'].includes(activeTab)">
            <div class="region-header">
              <button class="back-button" @click="activeTab = '地区'">← 返回地区选择</button>
              <h2>{{ activeTab }} 骑行路线</h2>
              <p>探索{{ activeTab }}的精彩骑行路线</p>
            </div>
            <div class="route-cards">
              <div class="route-card">
                <div class="route-card-header">
                  <span class="route-card-title">{{ activeTab }}经典环线</span>
                  <span class="difficulty-badge difficulty-medium">推荐路线</span>
                </div>
                <div class="route-card-stats">
                  <span>风景优美</span>
                  <span>适合骑行</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 驿站服务展示 -->
          <div class="waystation-section" v-show="activeTab === '驿站服务'">
            <!-- 搜索和筛选区域 -->
            <div class="waystation-filters">
              <div class="search-box">
                <input 
                  type="text" 
                  v-model="searchQuery" 
                  placeholder="搜索驿站名称或地址..."
                  @input="filterWaystations"
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
                  @click="toggleService(service)"
                >
                  <span class="service-icon">{{ serviceIcons[service] }}</span>
                  {{ label }}
                </div>
              </div>
            </div>

            <!-- 驿站列表 -->
            <div class="waystation-list">
              <div 
                v-for="station in filteredWaystations" 
                :key="station.ID"
                class="waystation-card"
                @click="showStationDetails(station)"
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
            <div v-if="selectedStation" class="station-modal">
              <div class="modal-content">
                <div class="modal-header">
                  <h2>{{ selectedStation.name }}</h2>
                  <button class="close-button" @click="selectedStation = null">×</button>
                </div>
                <div class="modal-body">
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
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import Map from './Map.vue'
import axios from 'axios'

// 当前激活的标签页
const activeTab = ref('路线规划')

// 驿站数据相关
const waystations = ref([])
const filteredWaystations = ref([])
const selectedStation = ref(null)
const searchQuery = ref('')

// 服务类型定义
const serviceTypes = {
  accommodation: '住宿',
  bike_rental: '租车',
  bike_return: '还车',
  maintenance: '维修'
}

// 服务图标
const serviceIcons = {
  accommodation: '🏠',
  bike_rental: '🚲',
  bike_return: '🅿️',
  maintenance: '🔧'
}

// 选中的服务筛选
const selectedServices = reactive({
  accommodation: false,
  bike_rental: false,
  bike_return: false,
  maintenance: false
})

// 获取驿站数据
const fetchWaystations = async () => {
  try {
    const response = await axios.get('/api/v1/waystations')
    waystations.value = response.data.data
    filteredWaystations.value = response.data.data
  } catch (error) {
    console.error('获取驿站数据失败：', error)
  }
}

// 筛选驿站
const filterWaystations = () => {
  let filtered = waystations.value

  // 搜索筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(station => 
      station.name.toLowerCase().includes(query) ||
      station.address.toLowerCase().includes(query)
    )
  }

  // 服务类型筛选
  const activeServices = Object.entries(selectedServices)
    .filter(([_, value]) => value)
    .map(([key]) => key)

  if (activeServices.length > 0) {
    filtered = filtered.filter(station =>
      activeServices.every(service => station[service] === 1)
    )
  }

  filteredWaystations.value = filtered

  // 更新地图标记
  if (mapRef.value && activeTab.value === '驿站服务') {
    mapRef.value.updateMarkers(filtered)
  }
}

// 切换服务筛选
const toggleService = (service) => {
  selectedServices[service] = !selectedServices[service]
  filterWaystations()
}

// 地图组件引用
const mapRef = ref(null)

// 显示驿站详情
const showStationDetails = (station) => {
  selectedStation.value = station
  
  // 跳转到驿站位置
  if (mapRef.value && station.longitude && station.latitude) {
    mapRef.value.jumpToLocation(station.longitude, station.latitude)
  }
}

// 切换标签页
const switchTab = (tab) => {
  activeTab.value = tab
  
  // 在切换到驿站服务标签时更新地图标记
  if (tab === '驿站服务' && mapRef.value) {
    mapRef.value.updateMarkers(filteredWaystations.value)
  }
}

// 组件挂载时获取数据和设置背景
onMounted(() => {
  fetchWaystations()
  
  // 背景设置已移除
  
  // 地图背景处理已移除
})

// 新导航项数据
const newNavItems = ref([
  {
    name: '路线规划',
    dropdown: null
  },
  {
    name: '热门路线',
    dropdown: null
  },
  {
    name: '驿站服务',
    dropdown: null
  },
  {
    name: '骑行攻略',
    dropdown: null
  },
  {
    name: '地区',
    dropdown: ['海南岛', '千岛湖', '青海甘肃', '新疆-独库伊犁', '川藏川西&其他']
  }
])

// 新导航下拉菜单显示状态
const navDropdownVisible = reactive({})

// 显示新导航下拉菜单
const showNavDropdown = (index) => {
  if (newNavItems.value[index].dropdown) {
    navDropdownVisible[index] = true
  }
}

// 隐藏新导航下拉菜单
const hideNavDropdown = (index) => {
  navDropdownVisible[index] = false
}

// 处理子导航点击
const handleSubNavClick = (subItem) => {
  console.log('Sub nav clicked:', subItem)
  // 选择地区时切换到该地区的内容
  activeTab.value = subItem
}

// 背景处理相关代码已移除
</script>

<style>
/* route页面容器 */
.route-page {
  width: 100vw !important;
  min-height: 100vh !important;
  position: relative;
}

/* 新导航栏样式 - 使用青绿色配色 */
.new-navbar {
  width: 100%;
  background: linear-gradient(135deg, #006064 0%, #00838f 50%, #0097a7 100%);
  margin: 0;
  padding: 0;
  border-radius: 12px 12px 0 0;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.2); /* 内阴影增加金属感 */
  /* 添加金属光泽 */
  background-image: 
    linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
}

.nav-list {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  padding: 0;
  margin: 0;
  list-style: none;
  transition: all 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.nav-item {
  display: inline-block;
  padding: 15px 10px;
  flex-grow: 1;
  text-align: center;
  position: relative;
  transition: all 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
  background: linear-gradient(135deg, #006064 0%, #00838f 100%);
  /* 添加轻微的内阴影 */
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.nav-item:nth-of-type(1):before {
  background: #00ACC1; /* 青色 */
}

.nav-item:nth-of-type(2):before {
  background: #26C6DA; /* 亮青色 */
}

.nav-item:nth-of-type(3):before {
  background: #4DD0E1; /* 淡青色 */
}

.nav-item:nth-of-type(4):before {
  background: #80DEEA; /* 浅青色 */
}

.nav-item:nth-of-type(5):before {
  background: #B2EBF2; /* 极浅青色 */
}

.nav-item:before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background: #00ACC1; /* 默认青色 */
  top: 0;
  left: 0;
  z-index: -1;
  transition: all 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
  transform: translateY(-125%) rotate(-5deg);
}

.nav-item:hover:before {
  transform: translateY(0) rotate(0deg);
}

.nav-item.active:before {
  transform: translateY(0) rotate(0deg);
}

.nav-item:hover .nav-link {
  color: #003d40; /* 深青绿色，确保对比度 */
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.3);
  font-weight: 600;
}

.nav-item.active .nav-link {
  color: #001f21; /* 更深的颜色确保可见性 */
  font-weight: 700;
  text-shadow: 0 1px 3px rgba(255, 255, 255, 0.5);
}

.nav-link {
  color: #ffffff;
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 500;
  font-size: 13px;
  display: block;
  padding: 5px;
  transition: all 0.3s ease;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3); /* 添加阴影增强可读性 */
}

.sub-nav {
  display: block;
  position: absolute;
  top: 100%;
  left: 0;
  width: 120%;
  background: #00838f; /* 深青绿色 */
  border-radius: 0 0 8px 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transform: translateY(-110%) translateZ(-5px);
  transform-origin: top left;
  z-index: 1000;
  list-style: none;
  padding: 10px 0;
  margin: 0;
  opacity: 0;
  transition: all 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.nav-item:hover .sub-nav {
  transform: translateY(0) translateZ(-1px);
  opacity: 1;
}

.sub-nav-item {
  display: block;
  margin: 5px 0;
  padding: 8px 15px;
  transition: all 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.sub-nav-item:nth-of-type(1) {
  transform-origin: top left;
  transform: rotate(1deg);
  background: rgba(0, 172, 193, 0.15); /* 青色系 */
}

.sub-nav-item:nth-of-type(2) {
  transform-origin: top right;
  transform: rotate(-1deg);
  background: rgba(38, 198, 218, 0.15); /* 亮青色系 */
}

.sub-nav-item:nth-of-type(3) {
  transform-origin: top left;
  transform: rotate(1.5deg);
  background: rgba(77, 208, 225, 0.15); /* 淡青色系 */
}

.sub-nav-item:nth-of-type(4) {
  transform-origin: top right;
  transform: rotate(-1.5deg);
  background: rgba(128, 222, 234, 0.15); /* 浅青色系 */
}

.sub-nav-item:nth-of-type(5) {
  transform-origin: top center;
  transform: rotate(0.5deg);
  background: rgba(178, 235, 242, 0.15); /* 极浅青色系 */
}

.sub-nav-item:hover {
  transform: rotate(0deg) scale(1.05);
  background: rgba(0, 172, 193, 0.3); /* 悬停时使用青色 */
  padding: 12px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.sub-nav-item a {
  color: #ffffff;
  text-decoration: none;
  font-size: 12px;
  text-transform: none;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4); /* 增强文字可读性 */
  font-weight: 500;
}

.sub-nav-item:hover a {
  color: #003d40; /* 深色确保对比度 */
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.3);
  font-weight: 600;
}

/* 主内容区域布局 */
.main-content {
  min-height: 100vh; /* 去掉顶部导航栏后使用全屏高度 */
  background-color: transparent; /* 透明以显示金色背景 */
  display: flex;
  padding: 20px;
  gap: 20px;
  position: relative;
}

/* 左侧地图容器 */
.map-container {
  flex: 0 0 60%; /* 3/5 的比例 */
  height: calc(100vh - 40px); /* 调整高度适应新布局 */
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

/* 地图相关背景处理已移除 */

/* 右侧功能面板 */
.content-right {
  flex: 0 0 40%; /* 2/5 的比例 */
  height: calc(100vh - 40px); /* 调整高度适应新布局 */
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.05),
    0 8px 32px rgba(0, 0, 0, 0.05);
  overflow: hidden; /* 改为hidden以适应新导航栏 */
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
}

/* 功能面板内容区调整 */

/* 功能面板内容区 */
.panel-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  border-radius: 0 0 16px 16px;
}

/* 路线规划部分 */
.route-planning {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
}

.input-group {
  margin-bottom: 15px;
}

.input-group input {
  width: 100%;
  padding: 10px 15px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.input-group input:focus {
  border-color: #4CAF50;
  outline: none;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}

.route-options {
  display: flex;
  gap: 10px;
  margin: 15px 0;
}

.route-option {
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s ease;
}

.route-option:hover {
  border-color: #4CAF50;
  color: #4CAF50;
}

.route-option.active {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.action-button {
  width: 100%;
  padding: 12px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-button:hover {
  background: #45a049;
  transform: translateY(-1px);
}

/* 热门路线卡片 */
.route-cards {
  display: grid;
  gap: 15px;
  margin-top: 20px;
}

.route-card {
  background: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
}

.route-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.route-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.route-card-title {
  font-weight: 500;
  color: #2c3e50;
}

.route-card-stats {
  display: flex;
  gap: 15px;
  font-size: 13px;
  color: #6c757d;
}

.difficulty-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.difficulty-easy {
  background: #e8f5e9;
  color: #4CAF50;
}

.difficulty-medium {
  background: #fff3e0;
  color: #ff9800;
}

.difficulty-hard {
  background: #ffebee;
  color: #f44336;
}

/* 地区选择界面样式 */
.region-selection {
  padding: 20px 0;
}

.region-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.region-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.region-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(76, 175, 80, 0.15);
  border-color: #4CAF50;
}

.region-card-header h3 {
  color: #2c3e50;
  margin: 0 0 10px 0;
  font-size: 18px;
}

.region-card-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.region-card-content p {
  color: #6c757d;
  margin: 0;
  font-size: 14px;
}

.region-card-arrow {
  color: #4CAF50;
  font-size: 20px;
  font-weight: bold;
  transition: transform 0.3s ease;
}

.region-card:hover .region-card-arrow {
  transform: translateX(5px);
}

/* 地区路线展示样式 */
.region-routes {
  padding: 20px 0;
}

.region-header {
  text-align: center;
  margin-bottom: 30px;
  position: relative;
}

.region-header h2 {
  color: #2c3e50;
  font-size: 24px;
  margin-bottom: 10px;
}

.region-header p {
  color: #6c757d;
  font-size: 16px;
}

.back-button {
  position: absolute;
  left: 0;
  top: 0;
  background: #4CAF50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.back-button:hover {
  background: #45a049;
  transform: translateX(-2px);
}

/* 驿站服务部分样式 */
.waystation-section {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
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
}

.service-badge {
  font-size: 18px;
  opacity: 0.3;
  transition: all 0.3s ease;
}

.service-badge.service-available {
  opacity: 1;
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
  
  .nav-list {
    flex-direction: column;
  }
  
  .nav-item {
    padding: 12px 15px;
  }
  
  .nav-link {
    font-size: 12px;
  }
}
</style>

