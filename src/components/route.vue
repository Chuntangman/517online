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

    <!-- 主内容区域（留白） -->
    <main class="main-content">
      <!-- 这里是留白的内容区域 -->
    </main>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

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

/* 主内容区域（简单的留白样式） */
.main-content {
  min-height: calc(100vh - 60px); /* 60px是导航栏的高度 */
  background-color: #ffffff;
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
