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

  // 智能匹配路线
  const smartMatchRoutes = async (matchParams) => {
    try {
      console.log('发送智能匹配请求:', matchParams)
      
      // 构建API请求
      const response = await fetch('/api/v1/routes/smart-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(matchParams)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        console.log('智能匹配成功:', data.data)
        return data.data.routes || []
      } else {
        throw new Error(data.message || '智能匹配失败')
      }
      
    } catch (error) {
      console.error('智能匹配API调用失败:', error)
      
      // 如果是开发环境，可以返回模拟数据进行测试
      if (process.env.NODE_ENV === 'development') {
        console.warn('使用模拟数据进行开发测试')
        return getMockMatchResults(matchParams)
      }
      
      throw error
    }
  }

  // 模拟匹配结果（开发环境使用）
  const getMockMatchResults = (matchParams) => {
    return [
      {
        id: 1,
        name: '环青海湖骑行线路',
        region: '青海',
        distance_km: 360,
        estimated_days: 3,
        scenery_score: 9,
        road_difficulty_score: 6,
        match_score: 8.5,
        match_scores: {
          scenery_score: 7.2,
          weather_score: 5.4,
          natural_score: 6.3,
          difficulty_score: 8.0,
          cycling_score: 9.2,
          final_score: 8.5
        }
      },
      {
        id: 2,
        name: '千岛湖环湖线路',
        region: '浙江',
        distance_km: 120,
        estimated_days: 2,
        scenery_score: 8,
        road_difficulty_score: 3,
        match_score: 7.8,
        match_scores: {
          scenery_score: 6.4,
          weather_score: 5.4,
          natural_score: 5.9,
          difficulty_score: 7.0,
          cycling_score: 8.5,
          final_score: 7.8
        }
      },
      {
        id: 3,
        name: '川西环线',
        region: '四川',
        distance_km: 800,
        estimated_days: 8,
        scenery_score: 10,
        road_difficulty_score: 9,
        match_score: 7.2,
        match_scores: {
          scenery_score: 8.0,
          weather_score: 5.4,
          natural_score: 6.7,
          difficulty_score: 5.0,
          cycling_score: 6.8,
          final_score: 7.2
        }
      }
    ]
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
    getRouteDetails,
    smartMatchRoutes
  }
}
