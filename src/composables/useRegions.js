/**
 * 地区管理 Composable
 * 处理地区数据获取和筛选逻辑
 * 使用单例模式确保所有组件共享同一个状态
 */

import { ref, reactive } from 'vue'
import axios from 'axios'

// 使用相对路径，由 Nginx 代理到后端
const API_BASE_URL = '/api/v1'

// 全局共享的地区状态
let globalRegionState = null

function createRegionState() {
  // 地区列表
  const regions = ref([])
  
  // 当前选中的地区
  const selectedRegion = ref('全部')
  
  // 加载状态
  const loading = ref(false)
  
  // 错误状态
  const error = ref(null)
  
  /**
   * 获取所有地区列表
   */
  const fetchRegions = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get(`${API_BASE_URL}/routes/regions`)
      if (response.data.success) {
        // 在地区列表前面添加"全部"选项
        regions.value = ['全部', ...response.data.data]
      } else {
        throw new Error(response.data.message || '获取地区列表失败')
      }
    } catch (err) {
      console.error('获取地区列表失败:', err)
      error.value = err.message || '获取地区列表失败'
      // 使用默认地区列表作为后备
      regions.value = ['全部', '海南岛', '千岛湖', '青海甘肃', '新疆-独库伊犁', '川藏川西&其他']
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 设置选中的地区
   * @param {string} region - 地区名称
   */
  const setSelectedRegion = (region) => {
    selectedRegion.value = region
  }
  
  /**
   * 重置选中的地区为全部
   */
  const resetSelectedRegion = () => {
    selectedRegion.value = '全部'
  }
  
  /**
   * 检查是否选择了全部地区
   */
  const isAllRegionsSelected = () => {
    return selectedRegion.value === '全部'
  }
  
  /**
   * 根据地区筛选数据
   * @param {Array} data - 要筛选的数据数组
   * @param {string} regionField - 地区字段名，默认为'region'
   * @returns {Array} 筛选后的数据
   */
  const filterByRegion = (data, regionField = 'region') => {
    if (!data || !Array.isArray(data)) {
      return []
    }
    
    if (isAllRegionsSelected()) {
      return data
    }
    
    return data.filter(item => item[regionField] === selectedRegion.value)
  }
  
  return {
    regions,
    selectedRegion,
    loading,
    error,
    fetchRegions,
    setSelectedRegion,
    resetSelectedRegion,
    isAllRegionsSelected,
    filterByRegion
  }
}

export function useRegions() {
  // 如果还没有创建全局状态，则创建一个
  if (!globalRegionState) {
    globalRegionState = createRegionState()
  }
  
  // 返回全局共享的状态
  return globalRegionState
}
