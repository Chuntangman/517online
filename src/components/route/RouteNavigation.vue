<template>
  <nav class="new-navbar">
    <ol class="nav-list">
      <li 
        v-for="(item, index) in navigationItems" 
        :key="index"
        class="nav-item"
        :class="{ 
          active: activeTab === item.name,
          'region-nav': item.isRegionNav
        }"
        @click="handleNavClick(item.name)"
        @mouseenter="showNavDropdown(index)"
        @mouseleave="hideNavDropdown(index)"
      >
        <a href="#0" class="nav-link">
          {{ item.isRegionNav && selectedRegion !== '全部' ? selectedRegion : item.name }}
        </a>
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
</template>

<script setup>
import { useNavigation } from '@/composables/useNavigation.js'

// 接收父组件传递的参数
const props = defineProps({
  mapRef: Object,
  filteredWaystations: Object
})

// 发射事件到父组件
const emit = defineEmits(['tab-changed', 'sub-nav-clicked'])

// 使用导航管理组合式函数
const {
  activeTab,
  navigationItems,
  navDropdownVisible,
  switchTab,
  showNavDropdown,
  hideNavDropdown,
  handleSubNavClick: originalHandleSubNavClick,
  selectedRegion
} = useNavigation()

// 处理导航点击
const handleNavClick = (tabName) => {
  switchTab(tabName, props.mapRef, props.filteredWaystations)
  emit('tab-changed', tabName)
}

// 处理子导航点击
const handleSubNavClick = (subItem) => {
  // 调用原始的处理函数，它会返回是否是地区选择
  const isRegionSelection = originalHandleSubNavClick(subItem)
  
  // 只有当不是地区选择时才发射事件
  if (!isRegionSelection) {
    emit('sub-nav-clicked', subItem)
    emit('tab-changed', subItem)
  }
  // 地区选择时不发射任何事件，避免面板跳转
}

// 暴露给父组件的方法和数据
defineExpose({
  activeTab,
  switchTab: handleNavClick
})
</script>

<style scoped>
/* 新导航栏样式 - 使用青绿色配色 */
.new-navbar {
  width: 100%;
  background: linear-gradient(135deg, #006064 0%, #00838f 50%, #0097a7 100%);
  margin: 0;
  padding: 0;
  border-radius: 12px 12px 0 0;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
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
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

/* 地区导航特殊样式 */
.nav-item.region-nav:before {
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
}

.nav-item.region-nav {
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 50%, #FF9F43 100%);
  border: 2px solid rgba(255, 107, 107, 0.3);
  border-radius: 8px 8px 0 0;
}

.nav-item.region-nav .nav-link {
  color: #ffffff;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
}

.nav-item.region-nav:hover .nav-link,
.nav-item.region-nav.active .nav-link {
  color: #2c3e50;
  text-shadow: 0 1px 3px rgba(255, 255, 255, 0.6);
}

.nav-item:nth-of-type(2):before {
  background: #00ACC1;
}

.nav-item:nth-of-type(3):before {
  background: #26C6DA;
}

.nav-item:nth-of-type(4):before {
  background: #4DD0E1;
}

.nav-item:nth-of-type(5):before {
  background: #80DEEA;
}

.nav-item:nth-of-type(6):before {
  background: #B2EBF2;
}

.nav-item:before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background: #00ACC1;
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
  color: #003d40;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.3);
  font-weight: 600;
}

.nav-item.active .nav-link {
  color: #001f21;
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
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.sub-nav {
  display: block;
  position: absolute;
  top: 100%;
  left: 0;
  width: 120%;
  background: #00838f;
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
  background: rgba(0, 172, 193, 0.15);
}

.sub-nav-item:nth-of-type(2) {
  transform-origin: top right;
  transform: rotate(-1deg);
  background: rgba(38, 198, 218, 0.15);
}

.sub-nav-item:nth-of-type(3) {
  transform-origin: top left;
  transform: rotate(1.5deg);
  background: rgba(77, 208, 225, 0.15);
}

.sub-nav-item:nth-of-type(4) {
  transform-origin: top right;
  transform: rotate(-1.5deg);
  background: rgba(128, 222, 234, 0.15);
}

.sub-nav-item:nth-of-type(5) {
  transform-origin: top center;
  transform: rotate(0.5deg);
  background: rgba(178, 235, 242, 0.15);
}

.sub-nav-item:hover {
  transform: rotate(0deg) scale(1.05);
  background: rgba(0, 172, 193, 0.3);
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
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
  font-weight: 500;
}

.sub-nav-item:hover a {
  color: #003d40;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.3);
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 768px) {
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
