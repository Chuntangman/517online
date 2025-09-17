import { ref } from 'vue'
import axios from 'axios'

/**
 * 高程数据获取服务
 * 使用Open-Elevation API获取指定坐标的海拔高度
 */
export function useElevation() {
  const isLoading = ref(false)
  const error = ref(null)
  const elevationData = ref([])

  // 高程API端点 - 开发环境使用Vite代理，生产环境使用后端API
  const isDevelopment = import.meta.env.DEV
  const ELEVATION_API_URL = isDevelopment 
    ? '/elevation-api/api/v1/lookup'  // 开发环境：Vite代理
    : '/api/v1/elevation/lookup'      // 生产环境：后端API

  /**
   * 获取单个坐标点的高程数据
   * @param {number} latitude - 纬度
   * @param {number} longitude - 经度
   * @returns {Promise<number|null>} 高程值（米）
   */
  const getElevationForPoint = async (latitude, longitude) => {
    try {
      console.log(`获取坐标 [${longitude}, ${latitude}] 的高程数据`)
      
      const response = await axios.get(ELEVATION_API_URL, {
        params: {
          locations: `${latitude},${longitude}`
        },
        timeout: 10000, // 增加超时时间
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      // 处理不同环境的响应格式
      let elevationData
      if (isDevelopment) {
        // 开发环境：直接使用Open-Elevation API响应
        elevationData = response.data
      } else {
        // 生产环境：使用后端API包装的响应
        if (response.data?.success && response.data?.data) {
          elevationData = response.data.data
        } else {
          console.warn('后端API响应格式错误:', response.data)
          return null
        }
      }

      if (elevationData && elevationData.results && elevationData.results.length > 0) {
        const elevation = elevationData.results[0].elevation
        console.log(`高程数据: ${elevation}米`)
        return Math.round(elevation)
      }
      
      console.warn('未获取到有效的高程数据')
      return null
    } catch (err) {
      console.error('获取高程数据失败:', err.message)
      if (err.response?.status === 429) {
        console.warn('API请求频率过高，请稍后再试')
      } else if (err.code === 'ERR_NETWORK') {
        console.warn('网络连接问题或CORS限制')
      }
      return null
    }
  }

  /**
   * 单点查询高程数据（开发环境或批量API失败时使用）
   * @param {Array} sampledCoordinates - 采样后的坐标数组
   * @returns {Promise<Array>} 高程数据数组
   */
  const getSinglePointElevations = async (sampledCoordinates) => {
    const elevations = []
    
    // 分批处理，避免API限制 - 使用更小的批次和更长的延迟
    const batchSize = 2 // 减少批次大小
    for (let i = 0; i < sampledCoordinates.length; i += batchSize) {
      const batch = sampledCoordinates.slice(i, i + batchSize)
      
      // 顺序处理每个点，而不是并行处理
      for (const coord of batch) {
        const elevation = await getElevationForPoint(coord.lat, coord.lng)
        elevations.push(elevation)
        
        // 每个请求之间增加延迟
        if (elevations.length < sampledCoordinates.length) {
          await new Promise(resolve => setTimeout(resolve, 500)) // 增加延迟到500ms
        }
      }
      
      // 批次之间的额外延迟
      if (i + batchSize < sampledCoordinates.length) {
        await new Promise(resolve => setTimeout(resolve, 1000)) // 增加批次间延迟到1秒
      }
    }
    
    return elevations
  }

  /**
   * 批量获取路线点的高程数据
   * @param {Array} coordinates - 坐标数组 [{lng, lat}, ...]
   * @param {number} maxPoints - 最大采样点数（避免API请求过多）
   * @returns {Promise<Array>} 高程数据数组
   */
  const getElevationForRoute = async (coordinates, maxPoints = 6) => {
    if (!coordinates || coordinates.length === 0) {
      console.warn('坐标数组为空')
      return []
    }

    isLoading.value = true
    error.value = null
    elevationData.value = []

    try {
      console.log(`开始获取路线高程数据，原始点数: ${coordinates.length}`)
      
      // 如果坐标点太多，进行采样以减少API调用
      const sampledCoordinates = sampleCoordinates(coordinates, maxPoints)
      console.log(`采样后点数: ${sampledCoordinates.length}`)

      let elevations = []
      
      // 生产环境优先使用批量API
      if (!isDevelopment) {
        try {
          console.log('使用后端批量高程API')
          const response = await axios.post('/api/v1/elevation/batch', {
            coordinates: sampledCoordinates
          }, {
            timeout: 30000, // 批量查询需要更长超时
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          })

          if (response.data?.success && response.data?.data) {
            elevations = response.data.data.map(item => item.elevation)
            console.log('批量高程查询成功:', elevations)
          } else {
            throw new Error('批量API响应格式错误')
          }
        } catch (err) {
          console.warn('批量API失败，回退到单点查询:', err.message)
          // 回退到单点查询
          elevations = await getSinglePointElevations(sampledCoordinates)
        }
      } else {
        // 开发环境使用单点查询
        elevations = await getSinglePointElevations(sampledCoordinates)
      }

      // 过滤掉null值并添加距离信息
      const validElevations = elevations.map((elevation, index) => ({
        elevation: elevation || 0,
        coordinate: sampledCoordinates[index],
        distance: calculateDistanceFromStart(sampledCoordinates, index),
        index
      })).filter(item => item.elevation !== null)

      elevationData.value = validElevations
      console.log(`成功获取 ${validElevations.length} 个点的高程数据`)
      
      return validElevations
    } catch (err) {
      console.error('批量获取高程数据失败:', err)
      error.value = err.message
      return []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 对坐标数组进行采样，减少API调用次数
   * @param {Array} coordinates - 原始坐标数组
   * @param {number} maxPoints - 最大点数
   * @returns {Array} 采样后的坐标数组
   */
  const sampleCoordinates = (coordinates, maxPoints) => {
    if (coordinates.length <= maxPoints) {
      return coordinates
    }

    const step = Math.floor(coordinates.length / maxPoints)
    const sampled = []
    
    // 始终包含起点
    sampled.push(coordinates[0])
    
    // 等间距采样中间点
    for (let i = step; i < coordinates.length - step; i += step) {
      sampled.push(coordinates[i])
    }
    
    // 始终包含终点
    if (coordinates.length > 1) {
      sampled.push(coordinates[coordinates.length - 1])
    }
    
    return sampled
  }

  /**
   * 计算从起点到指定索引点的累计距离
   * @param {Array} coordinates - 坐标数组
   * @param {number} index - 目标点索引
   * @returns {number} 距离（公里）
   */
  const calculateDistanceFromStart = (coordinates, index) => {
    if (index === 0) return 0
    
    let totalDistance = 0
    for (let i = 1; i <= index; i++) {
      totalDistance += calculateDistance(
        coordinates[i-1].lat, coordinates[i-1].lng,
        coordinates[i].lat, coordinates[i].lng
      )
    }
    
    return Math.round(totalDistance * 100) / 100 // 保留两位小数
  }

  /**
   * 计算两点间距离（哈弗辛公式）
   * @param {number} lat1 - 点1纬度
   * @param {number} lng1 - 点1经度
   * @param {number} lat2 - 点2纬度
   * @param {number} lng2 - 点2经度
   * @returns {number} 距离（公里）
   */
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371 // 地球半径（公里）
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  /**
   * 计算高程统计信息
   * @param {Array} elevationData - 高程数据数组
   * @returns {Object} 统计信息
   */
  const calculateElevationStats = (elevationData = elevationData.value) => {
    if (!elevationData || elevationData.length === 0) {
      return {
        maxElevation: 0,
        minElevation: 0,
        totalAscent: 0,
        totalDescent: 0,
        averageElevation: 0
      }
    }

    const elevations = elevationData.map(item => item.elevation)
    const maxElevation = Math.max(...elevations)
    const minElevation = Math.min(...elevations)
    const averageElevation = Math.round(elevations.reduce((a, b) => a + b, 0) / elevations.length)

    let totalAscent = 0
    let totalDescent = 0

    for (let i = 1; i < elevations.length; i++) {
      const diff = elevations[i] - elevations[i - 1]
      if (diff > 0) {
        totalAscent += diff
      } else {
        totalDescent += Math.abs(diff)
      }
    }

    return {
      maxElevation: Math.round(maxElevation),
      minElevation: Math.round(minElevation),
      totalAscent: Math.round(totalAscent),
      totalDescent: Math.round(totalDescent),
      averageElevation,
      elevationRange: Math.round(maxElevation - minElevation)
    }
  }

  /**
   * 清除高程数据
   */
  const clearElevationData = () => {
    elevationData.value = []
    error.value = null
    isLoading.value = false
  }

  return {
    // 响应式数据
    isLoading,
    error,
    elevationData,
    
    // 方法
    getElevationForPoint,
    getElevationForRoute,
    calculateElevationStats,
    clearElevationData
  }
}
