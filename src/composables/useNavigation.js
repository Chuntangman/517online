/**
 * 导航状态管理 Composable
 * 处理标签页切换、下拉菜单显示等导航相关逻辑
 */

import { ref, reactive } from 'vue'
import { navItems } from '@/config/routeConfig.js'

export function useNavigation() {
  // 当前激活的标签页
  const activeTab = ref('路线规划')
  
  // 导航项数据
  const navigationItems = ref(navItems)
  
  // 导航下拉菜单显示状态
  const navDropdownVisible = reactive({})
  
  // 切换标签页
  const switchTab = (tab, mapRef = null, filteredWaystations = null) => {
    activeTab.value = tab
    
    // 在切换到驿站服务标签时更新地图标记
    if (tab === '驿站服务' && mapRef?.value && filteredWaystations?.value) {
      mapRef.value.updateMarkers(filteredWaystations.value)
    }
  }
  
  // 显示导航下拉菜单
  const showNavDropdown = (index) => {
    if (navigationItems.value[index].dropdown) {
      navDropdownVisible[index] = true
    }
  }
  
  // 隐藏导航下拉菜单
  const hideNavDropdown = (index) => {
    navDropdownVisible[index] = false
  }
  
  // 处理子导航点击
  const handleSubNavClick = (subItem) => {
    console.log('Sub nav clicked:', subItem)
    // 选择地区时切换到该地区的内容
    activeTab.value = subItem
  }
  
  return {
    activeTab,
    navigationItems,
    navDropdownVisible,
    switchTab,
    showNavDropdown,
    hideNavDropdown,
    handleSubNavClick
  }
}
