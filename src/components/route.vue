<template>
  <div class="route-page">
    <!-- 复用导航栏 -->
    <nav class="navbar">
      <div class="nav-container">
        <div 
          v-for="(item, index) in navItems" 
          :key="index"
          class="nav-item"
          @mouseenter="showDropdown(index)"
          @mouseleave="hideDropdown(index)"
        >
          <button class="nav-button">{{ item.name }}</button>
          <div 
            v-if="item.dropdown && dropdownVisible[index]" 
            class="dropdown"
          >
            <div 
              v-for="(subItem, subIndex) in item.dropdown" 
              :key="subIndex"
              class="dropdown-item"
            >
              {{ subItem }}
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- 主内容区域 -->
    <main class="main-content">
      <!-- 左侧地图容器 -->
      <div class="map-container">
        <Map />
      </div>
      
      <!-- 右侧功能面板 -->
      <div class="content-right">
        <!-- 标签栏 -->
        <div class="panel-tabs">
          <div class="panel-tab active">路线规划</div>
          <div class="panel-tab">热门路线</div>
          <div class="panel-tab">驿站服务</div>
          <div class="panel-tab">骑行攻略</div>
        </div>

        <!-- 面板内容区 -->
        <div class="panel-content">
          <!-- 路线规划部分 -->
          <div class="route-planning">
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
          <div class="route-cards">
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
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import Map from './Map.vue'

// 导航项数据（复用自Homepage）
const navItems = ref([
  {
    name: '路线',
    dropdown: ['海南岛', '千岛湖', '青海甘肃', '新疆-独库伊犁', '川藏川西&其他']
  },
  {
    name: '驿站',
    dropdown: null
  },
  {
    name: '攻略',
    dropdown: null
  },
  {
    name: '活动',
    dropdown: null
  }
])

// 下拉菜单显示状态
const dropdownVisible = reactive({})

// 显示下拉菜单
const showDropdown = (index) => {
  if (navItems.value[index].dropdown) {
    dropdownVisible[index] = true
  }
}

// 隐藏下拉菜单
const hideDropdown = (index) => {
  dropdownVisible[index] = false
}
</script>

<style scoped>
.route-page {
  width: 100vw;
  min-height: 100vh;
  position: relative;
}

/* 顶部导航栏样式（复用自Homepage） */
.navbar {
  position: relative;
  z-index: 100;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  padding: 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.nav-container {
  display: flex;
  align-items: center;
  padding: 0 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.nav-item {
  position: relative;
  margin-right: 30px;
}

.nav-button {
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  font-weight: 500;
  padding: 15px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.nav-button:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* 下拉菜单样式（复用自Homepage） */
.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  min-width: 180px;
  border-radius: 8px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  opacity: 0;
  transform: translateY(-10px);
  animation: dropdownShow 0.3s ease forwards;
}

@keyframes dropdownShow {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-item {
  padding: 12px 20px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid #f0f0f0;
}

.dropdown-item:last-child {
  border-bottom: none;
  border-radius: 0 0 8px 8px;
}

.dropdown-item:first-child {
  border-radius: 8px 8px 0 0;
}

.dropdown-item:hover {
  background: #f8f9fa;
  color: #4CAF50;
  transform: translateX(5px);
}

/* 主内容区域布局 */
.main-content {
  min-height: calc(100vh - 60px); /* 60px是导航栏的高度 */
  background-color: #f8f9fa;
  display: flex;
  padding: 20px;
  gap: 20px;
  position: relative;
}

/* 左侧地图容器 */
.map-container {
  flex: 0 0 60%; /* 3/5 的比例 */
  height: calc(100vh - 100px); /* 减去导航栏高度和内边距 */
  background-color: #ffffff;
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.05),
    0 8px 32px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
}

/* 右侧功能面板 */
.content-right {
  flex: 0 0 40%; /* 2/5 的比例 */
  height: calc(100vh - 100px);
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.05),
    0 8px 32px rgba(0, 0, 0, 0.05);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
}

/* 功能面板标签栏 */
.panel-tabs {
  display: flex;
  background: transparent;
  padding: 20px 20px 0;
  gap: 10px;
}

.panel-tab {
  padding: 12px 20px;
  color: #6c757d;
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.3s ease;
  font-weight: 500;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.panel-tab:hover {
  color: #4CAF50;
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-1px);
}

.panel-tab.active {
  color: #4CAF50;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 功能面板内容区 */
.panel-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
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

/* 响应式设计（复用自Homepage） */
@media (max-width: 768px) {
  .nav-container {
    padding: 0 15px;
    flex-wrap: wrap;
  }
  
  .nav-item {
    margin-right: 15px;
    margin-bottom: 5px;
  }
  
  .nav-button {
    padding: 12px 15px;
    font-size: 14px;
  }
}
</style>
