/**
 * 路线规划管理 Composable
 * 处理路线规划相关的逻辑，包括起终点设置、路线选项等
 */

import { ref, reactive } from 'vue'
import { routeOptions, popularRoutes } from '@/config/routeConfig.js'

export function useRoutePlanning() {
  // 路线规划相关数据
  const routeForm = reactive({
    startPoint: '',
    endPoint: ''
  })
  
  // 路线选项
  const routeOptionsList = ref([...routeOptions])
  
  // 热门路线数据
  const hotRoutes = ref([...popularRoutes])
  
  // 选中的路线选项
  const selectedRouteOption = ref('shortest')
  
  // 设置起点
  const setStartPoint = (point) => {
    routeForm.startPoint = point
  }
  
  // 设置终点
  const setEndPoint = (point) => {
    routeForm.endPoint = point
  }
  
  // 选择路线选项
  const selectRouteOption = (optionKey) => {
    // 更新选项状态
    routeOptionsList.value.forEach(option => {
      option.active = option.key === optionKey
    })
    selectedRouteOption.value = optionKey
  }
  
  // 生成路线
  const generateRoute = () => {
    if (!routeForm.startPoint || !routeForm.endPoint) {
      console.warn('请设置起点和终点')
      return false
    }
    
    console.log('生成路线：', {
      start: routeForm.startPoint,
      end: routeForm.endPoint,
      option: selectedRouteOption.value
    })
    
    // 这里可以添加实际的路线生成逻辑
    // 比如调用地图API或后端服务
    
    return true
  }
  
  // 重置路线规划
  const resetRoutePlanning = () => {
    routeForm.startPoint = ''
    routeForm.endPoint = ''
    selectedRouteOption.value = 'shortest'
    routeOptionsList.value.forEach((option, index) => {
      option.active = index === 0
    })
  }
  
  // 获取路线详情
  const getRouteDetails = (routeId) => {
    return hotRoutes.value.find(route => route.id === routeId)
  }
  
  return {
    // 数据
    routeForm,
    routeOptionsList,
    hotRoutes,
    selectedRouteOption,
    
    // 方法
    setStartPoint,
    setEndPoint,
    selectRouteOption,
    generateRoute,
    resetRoutePlanning,
    getRouteDetails
  }
}
