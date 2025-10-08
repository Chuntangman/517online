/**
 * 热门路线管理 Composable
 * 处理热门路线数据获取和地区筛选
 */

import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import { useRegions } from './useRegions.js'

// 使用相对路径，由 Nginx 代理到后端
const API_BASE_URL = '/api/v1'

export function usePopularRoutes() {
  // 路线数据
  const allRoutes = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // 使用地区管理
  const { selectedRegion, filterByRegion } = useRegions()
  
  // 筛选后的路线数据
  const filteredRoutes = computed(() => {
    return filterByRegion(allRoutes.value, 'region')
  })
  
  /**
   * 获取热门路线数据
   */
  const fetchPopularRoutes = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get(`${API_BASE_URL}/routes/popular?limit=20`)
      if (response.data.success) {
        allRoutes.value = response.data.data.map(route => ({
          id: route.id,
          title: route.name || `${route.region}经典路线`,
          region: route.region,
          distance: route.distance_km ? `${route.distance_km}km` : '未知',
          duration: route.estimated_days ? `${route.estimated_days}天` : '未知',
          difficulty: getDifficulty(route.distance_km),
          difficultyLabel: getDifficultyLabel(route.distance_km),
          roadCondition: route.road_condition,
          remarks: route.remarks,
          precautions: route.precautions
        }))
      } else {
        throw new Error(response.data.message || '获取热门路线失败')
      }
    } catch (err) {
      console.error('获取热门路线失败:', err)
      error.value = err.message || '获取热门路线失败'
      
      // 使用默认数据作为后备
      allRoutes.value = [
        {
          id: 1,
          title: '环青海湖骑行线路',
          region: '青海甘肃',
          difficulty: 'medium',
          difficultyLabel: '中等难度',
          distance: '360km',
          duration: '3-4天'
        },
        {
          id: 2,
          title: '千岛湖环湖线路',
          region: '千岛湖',
          difficulty: 'easy',
          difficultyLabel: '简单',
          distance: '120km',
          duration: '1天'
        },
        {
          id: 3,
          title: '海南环岛骑行',
          region: '海南岛',
          difficulty: 'hard',
          difficultyLabel: '困难',
          distance: '600km',
          duration: '7天'
        }
      ]
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 根据距离判断难度等级
   */
  const getDifficulty = (distance) => {
    if (!distance) return 'medium'
    if (distance < 100) return 'easy'
    if (distance < 300) return 'medium'
    return 'hard'
  }
  
  /**
   * 根据距离获取难度标签
   */
  const getDifficultyLabel = (distance) => {
    const difficulty = getDifficulty(distance)
    const labels = {
      easy: '简单',
      medium: '中等难度',
      hard: '困难'
    }
    return labels[difficulty] || '中等难度'
  }
  
  /**
   * 获取路线详情
   */
  const getRouteDetails = (routeId) => {
    return allRoutes.value.find(route => route.id === routeId)
  }
  
  // 监听地区变化，自动重新筛选
  watch(selectedRegion, () => {
    console.log('地区变化，重新筛选热门路线:', selectedRegion.value)
  })
  
  // 组件挂载时获取数据
  onMounted(() => {
    fetchPopularRoutes()
  })
  
  return {
    allRoutes,
    filteredRoutes,
    loading,
    error,
    selectedRegion,
    fetchPopularRoutes,
    getRouteDetails
  }
}
