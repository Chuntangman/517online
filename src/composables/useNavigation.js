/**
 * 导航状态管理 Composable
 * 处理标签页切换、下拉菜单显示等导航相关逻辑
 */

import { ref, reactive, onMounted } from 'vue'
import { navItems } from '@/config/routeConfig.js'
import { useRegions } from './useRegions.js'

export function useNavigation() {
  // 当前激活的标签页
  const activeTab = ref('路线规划')
  
  // 导航项数据
  const navigationItems = ref([...navItems])
  
  // 导航下拉菜单显示状态
  const navDropdownVisible = reactive({})
  
  // 使用地区管理
  const { regions, fetchRegions, selectedRegion, setSelectedRegion } = useRegions()
  
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
    
    // 如果是地区选择，更新选中的地区，但不切换面板
    if (regions.value.includes(subItem)) {
      setSelectedRegion(subItem)
      console.log('地区已切换到:', subItem)
      // 地区选择不切换activeTab，保持当前面板
      return true // 返回true表示这是地区选择
    }
    
    // 非地区选择时才切换面板
    activeTab.value = subItem
    return false // 返回false表示这不是地区选择
  }
  
  // 初始化导航数据
  const initializeNavigation = async () => {
    // 获取地区数据
    await fetchRegions()
    
    // 更新地区导航项的下拉菜单
    const regionNavIndex = navigationItems.value.findIndex(item => item.isRegionNav)
    if (regionNavIndex !== -1) {
      navigationItems.value[regionNavIndex].dropdown = [...regions.value]
    }
  }
  
  // 组件挂载时初始化
  onMounted(() => {
    initializeNavigation()
  })
  
  return {
    activeTab,
    navigationItems,
    navDropdownVisible,
    switchTab,
    showNavDropdown,
    hideNavDropdown,
    handleSubNavClick,
    selectedRegion,
    regions,
    initializeNavigation
  }
}
