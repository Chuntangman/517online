<template>
  <div class="homepage">
    <!-- 顶部导航栏 -->
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
      <!-- 背景滤镜层 -->
      <div class="background-overlay"></div>
      
      <!-- 右侧内容区域 -->
      <div class="content-area">
        <!-- 主标题 -->
        <h1 class="main-title">517骑行驿站</h1>
        
        <!-- 介绍文本 -->
        <p class="intro-text">
          欢迎来到517骑行驿站，探索最美骑行路线，结识志同道合的骑行伙伴，开启您的骑行冒险之旅。
        </p>
        
        <!-- 行动按钮 -->
        <div class="action-button-area">
          <button 
            class="action-button"
            @click="startJourney"
          >
            开始骑行之旅
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

// 初始化路由
const router = useRouter()

// 导航项数据
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

// 开始骑行之旅按钮点击事件
const startJourney = () => {
  router.push('/route')
}
</script>

<style scoped>
.homepage {
  width: 100vw;
  height: 100vh;
  position: relative;
  background-image: url('../assets/左紧右松.jpg');
  background-size: cover;
  background-position: left center;
  background-repeat: no-repeat;
  overflow: hidden;
}

/* 背景滤镜层 */
.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.2);
  z-index: 1;
}

/* 顶部导航栏 */
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

/* 下拉菜单 */
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

/* 主内容区域 */
.main-content {
  position: relative;
  z-index: 50;
  height: calc(100vh - 60px);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 80px 0 40px;
  box-sizing: border-box;
}

.content-area {
  max-width: 45%;
  min-width: 400px;
  text-align: right;
  animation: fadeInRight 1s ease-out;
  padding: 40px 0;
  position: relative;
  z-index: 60;
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 主标题 */
.main-title {
  font-size: 3.5rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 25px;
  text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8), 1px 1px 3px rgba(0, 0, 0, 0.5);
  letter-spacing: 2px;
  line-height: 1.1;
  font-family: 'Montserrat', 'Microsoft YaHei', sans-serif;
  position: relative;
  z-index: 70;
}

/* 介绍文本 */
.intro-text {
  font-size: 1.1rem;
  color: #ffffff;
  line-height: 1.7;
  margin-bottom: 35px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8), 1px 1px 2px rgba(0, 0, 0, 0.6);
  font-weight: 400;
  max-width: 100%;
  position: relative;
  z-index: 70;
}

/* 行动按钮区域 */
.action-button-area {
  margin-top: 40px;
  position: relative;
  z-index: 80;
}

.action-button {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  border: none;
  padding: 16px 35px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
  text-transform: uppercase;
  letter-spacing: 1px;
  position: relative;
  z-index: 90;
  overflow: hidden;
}

.action-button:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(76, 175, 80, 0.4);
  background: linear-gradient(135deg, #45a049, #4CAF50);
}

.action-button:active:not(:disabled) {
  transform: translateY(-1px);
}

.action-button:disabled {
  opacity: 0.8;
  cursor: not-allowed;
}

/* 加载状态 */
.loading-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 - 16:9 比例优化 */
@media (max-width: 1440px) {
  .content-area {
    max-width: 50%;
    min-width: 350px;
  }
  
  .main-title {
    font-size: 3rem;
  }
}

@media (max-width: 1200px) {
  .main-content {
    padding: 0 60px 0 30px;
  }
  
  .content-area {
    max-width: 55%;
    min-width: 320px;
  }
  
  .main-title {
    font-size: 2.8rem;
  }
  
  .intro-text {
    font-size: 1rem;
  }
}

@media (max-width: 1024px) {
  .homepage {
    height: auto;
    min-height: 100vh;
  }
  
  .main-content {
    height: auto;
    min-height: calc(100vh - 60px);
    padding: 40px 40px 0 20px;
    justify-content: center;
  }
  
  .content-area {
    max-width: 70%;
    min-width: 280px;
    text-align: center;
  }
  
  .main-title {
    font-size: 2.5rem;
  }
}

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
  
  .main-content {
    padding: 20px;
  }
  
  .content-area {
    max-width: 90%;
    min-width: auto;
  }
  
  .main-title {
    font-size: 2.2rem;
  }
  
  .intro-text {
    font-size: 0.95rem;
  }
  
  .action-button {
    padding: 14px 28px;
    font-size: 0.95rem;
  }
}

@media (max-width: 480px) {
  .main-title {
    font-size: 1.8rem;
  }
  
  .intro-text {
    font-size: 0.9rem;
  }
  
  .action-button {
    padding: 12px 25px;
    font-size: 0.9rem;
  }
}
</style>
