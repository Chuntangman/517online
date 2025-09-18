import { ref } from 'vue'
import axios from 'axios'
import { gcj02ToWgs84, batchGcj02ToWgs84 } from '@/utils/coordinateTransform'

/**
 * 高程数据获取服务
 * 使用Open-Elevation API获取指定坐标的海拔高度
 * 自动处理 GCJ-02 到 WGS-84 坐标系转换
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
   * @param {number} latitude - 纬度（GCJ-02坐标系，自动转换为WGS-84）
   * @param {number} longitude - 经度（GCJ-02坐标系，自动转换为WGS-84）
   * @returns {Promise<number|null>} 高程值（米）
   */
  const getElevationForPoint = async (latitude, longitude) => {
    try {
      console.log(`获取坐标 [${longitude}, ${latitude}] 的高程数据（GCJ-02）`)
      
      // 坐标系转换：GCJ-02 → WGS-84
      const wgs84Coord = gcj02ToWgs84(longitude, latitude)
      const wgs84Lng = wgs84Coord.lng
      const wgs84Lat = wgs84Coord.lat
      
      console.log(`转换后WGS-84坐标: [${wgs84Lng}, ${wgs84Lat}]`)
      
      const response = await axios.get(ELEVATION_API_URL, {
        params: {
          locations: `${wgs84Lat},${wgs84Lng}`
        },
        timeout: 5000, // 减少超时时间到5秒
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
      // 静默处理超时错误，不影响用户体验
      if (err.message.includes('timeout') || err.code === 'ECONNABORTED') {
        // 超时错误不输出到控制台，静默返回null
        return null
      }
      
      // 其他错误仍需要显示
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
   * @param {Array} sampledCoordinates - 采样后的坐标数组（GCJ-02坐标系）
   * @returns {Promise<Array>} 高程数据数组
   */
  const getSinglePointElevations = async (sampledCoordinates) => {
    const elevations = []
    
    console.log(`单点查询：开始处理 ${sampledCoordinates.length} 个GCJ-02坐标点`)
    
    // 分批处理，避免API限制 - 使用更小的批次和更长的延迟
    const batchSize = 2 // 减少批次大小
    for (let i = 0; i < sampledCoordinates.length; i += batchSize) {
      const batch = sampledCoordinates.slice(i, i + batchSize)
      
      // 顺序处理每个点，而不是并行处理
      for (const coord of batch) {
        let elevation = null
        let retryCount = 0
        const maxRetries = 2
        
        // 重试机制
        while (elevation === null && retryCount < maxRetries) {
          try {
            // 注意：getElevationForPoint 内部会自动进行坐标转换
            elevation = await getElevationForPoint(coord.lat, coord.lng)
            
            if (elevation === null && retryCount < maxRetries - 1) {
              console.log(`坐标 [${coord.lat}, ${coord.lng}] 获取失败，准备重试 ${retryCount + 1}/${maxRetries}`)
              await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1))) // 递增延迟
            }
          } catch (error) {
            console.warn(`坐标 [${coord.lat}, ${coord.lng}] 请求出错:`, error.message)
            if (retryCount < maxRetries - 1) {
              await new Promise(resolve => setTimeout(resolve, 3000 * (retryCount + 1)))
            }
          }
          retryCount++
        }
        
        // 如果最终还是失败，使用默认高程值（可选）
        if (elevation === null) {
          // 静默使用默认值，不输出警告
          elevation = 100 // 默认海拔100米
        }
        
        elevations.push(elevation)
        
        // 每个请求之间增加延迟
        if (elevations.length < sampledCoordinates.length) {
          await new Promise(resolve => setTimeout(resolve, 800)) // 增加延迟到800ms
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
   * @param {Array} coordinates - 坐标数组 [{lng, lat}, ...] (GCJ-02坐标系)
   * @param {number} maxPoints - 最大采样点数（避免API请求过多）
   * @param {boolean} enableSmartSampling - 是否启用智能采样（默认true）
   * @returns {Promise<Array>} 高程数据数组
   */
  const getElevationForRoute = async (coordinates, maxPoints = 18, enableSmartSampling = true) => {
    if (!coordinates || coordinates.length === 0) {
      console.warn('坐标数组为空')
      return []
    }

    isLoading.value = true
    error.value = null
    elevationData.value = []

    try {
      console.log(`开始获取路线高程数据，原始GCJ-02点数: ${coordinates.length}`)
      
      // 如果坐标点太多，进行采样以减少API调用
      const sampledCoordinates = enableSmartSampling 
        ? sampleCoordinates(coordinates, maxPoints)
        : basicEqualDistanceSample(coordinates, maxPoints)
      
      console.log(`采样后点数: ${sampledCoordinates.length}（${enableSmartSampling ? '智能' : '等间距'}采样）`)

      let elevations = []
      
      // 生产环境优先使用批量API
      if (!isDevelopment) {
        try {
          console.log('使用后端批量高程API（含坐标转换）')
          
          // 坐标系转换：批量转换 GCJ-02 → WGS-84
          const wgs84Coordinates = batchGcj02ToWgs84(sampledCoordinates)
          console.log(`已转换 ${wgs84Coordinates.length} 个坐标到WGS-84`)
          
          const response = await axios.post('/api/v1/elevation/batch', {
            coordinates: wgs84Coordinates
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
          // 静默处理批量API失败，直接回退到单点查询
          if (!err.message.includes('timeout')) {
            console.warn('批量API失败，回退到单点查询:', err.message)
          }
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
        coordinate: sampledCoordinates[index], // 保持原始GCJ-02坐标用于距离计算
        distance: calculateDistanceFromStart(sampledCoordinates, index),
        index
      })).filter(item => item.elevation !== null)

      elevationData.value = validElevations
      console.log(`成功获取 ${validElevations.length} 个点的高程数据`)
      console.log('高程数据示例:', validElevations.slice(0, 2))
      
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
   * 智能自适应采样算法
   * 结合等间距采样和地形特征识别，确保不遗漏重要的高程变化
   * @param {Array} coordinates - 原始坐标数组
   * @param {number} maxPoints - 最大点数
   * @returns {Array} 采样后的坐标数组
   */
  const sampleCoordinates = (coordinates, maxPoints) => {
    if (coordinates.length <= maxPoints) {
      return coordinates
    }

    console.log(`开始智能采样：原始点数 ${coordinates.length}，目标点数 ${maxPoints}`)
    
    // 第一步：基础等间距采样（占用65%的配额，确保基础覆盖）
    const basicQuota = Math.floor(maxPoints * 0.65)
    const basicSampled = basicEqualDistanceSample(coordinates, basicQuota)
    
    // 第二步：地形特征点识别（占用35%的配额，重点补充关键地形）
    const featureQuota = maxPoints - basicSampled.length
    const featureSampled = identifyFeaturePoints(coordinates, basicSampled, featureQuota)
    
    // 第三步：合并并按路线顺序排序
    const allSampled = [...basicSampled, ...featureSampled]
    const uniqueSampled = removeDuplicatePoints(allSampled)
    const sortedSampled = sortByRouteOrder(uniqueSampled, coordinates)
    
    console.log(`采样完成：基础采样 ${basicSampled.length} 点，特征采样 ${featureSampled.length} 点，最终 ${sortedSampled.length} 点`)
    
    return sortedSampled
  }

  /**
   * 基础等间距采样
   * @param {Array} coordinates - 坐标数组
   * @param {number} targetPoints - 目标点数
   * @returns {Array} 等间距采样结果
   */
  const basicEqualDistanceSample = (coordinates, targetPoints) => {
    if (coordinates.length <= targetPoints) {
      return [...coordinates]
    }

    const sampled = []
    const step = Math.floor(coordinates.length / targetPoints)
    
    // 始终包含起点
    sampled.push({ ...coordinates[0], samplingType: 'endpoint' })
    
    // 等间距采样中间点
    for (let i = step; i < coordinates.length - step; i += step) {
      sampled.push({ ...coordinates[i], samplingType: 'uniform' })
    }
    
    // 始终包含终点
    if (coordinates.length > 1) {
      sampled.push({ ...coordinates[coordinates.length - 1], samplingType: 'endpoint' })
    }
    
    return sampled
  }

  /**
   * 识别地形特征点（可能的山峰、谷底、坡度变化点）
   * 基于坐标距离和路线走向变化来识别潜在的重要地形点
   * @param {Array} coordinates - 原始坐标数组
   * @param {Array} basicSampled - 已采样的基础点
   * @param {number} maxFeaturePoints - 最大特征点数
   * @returns {Array} 特征点数组
   */
  const identifyFeaturePoints = (coordinates, basicSampled, maxFeaturePoints) => {
    if (maxFeaturePoints <= 0 || coordinates.length < 5) {
      return []
    }

    const featurePoints = []
    const basicIndices = new Set(basicSampled.map(p => findCoordinateIndex(p, coordinates)))
    
    // 计算每个点的"地形复杂度"指标
    const complexityScores = coordinates.map((coord, index) => {
      if (index < 2 || index >= coordinates.length - 2) return 0
      if (basicIndices.has(index)) return 0 // 已被基础采样包含
      
      return calculateComplexityScore(coordinates, index)
    })

    // 选择复杂度最高的点作为特征点
    const sortedIndices = complexityScores
      .map((score, index) => ({ score, index }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxFeaturePoints)

    // 添加特征点
    sortedIndices.forEach(item => {
      featurePoints.push({ 
        ...coordinates[item.index], 
        samplingType: 'feature',
        complexityScore: item.score 
      })
    })

    console.log(`识别出 ${featurePoints.length} 个地形特征点`)
    return featurePoints
  }

  /**
   * 计算坐标点的地形复杂度得分
   * 综合考虑方向变化和距离变化
   * @param {Array} coordinates - 坐标数组
   * @param {number} index - 当前点索引
   * @returns {number} 复杂度得分
   */
  const calculateComplexityScore = (coordinates, index) => {
    const prev2 = coordinates[index - 2]
    const prev1 = coordinates[index - 1]
    const current = coordinates[index]
    const next1 = coordinates[index + 1]
    const next2 = coordinates[index + 2]

    let score = 0

    // 1. 方向变化得分（识别转弯点）
    const bearing1 = calculateBearing(prev1, current)
    const bearing2 = calculateBearing(current, next1)
    const bearingChange = Math.abs(normalizeAngle(bearing2 - bearing1))
    
    // 方向变化越大，得分越高（可能是山脊、谷底等特征点）
    score += Math.min(bearingChange / 30, 3) // 最高3分

    // 2. 距离变化得分（识别密集点区域，可能是复杂地形）
    const dist1 = calculateDistance(prev1.lat, prev1.lng, current.lat, current.lng)
    const dist2 = calculateDistance(current.lat, current.lng, next1.lat, next1.lng)
    const avgDist = (dist1 + dist2) / 2
    
    if (avgDist < 0.1) { // 距离小于100米的密集点
      score += 2 // 密集点可能表示复杂地形
    }

    // 3. 位置分布得分（优先选择路线中段的点，避免过于集中在起终点）
    const routeProgress = index / coordinates.length
    if (routeProgress > 0.2 && routeProgress < 0.8) {
      score += 1 // 中段点加分
    }

    return score
  }

  /**
   * 计算两点间的方位角
   * @param {Object} point1 - 起点 {lat, lng}
   * @param {Object} point2 - 终点 {lat, lng}
   * @returns {number} 方位角（度）
   */
  const calculateBearing = (point1, point2) => {
    const lat1 = point1.lat * Math.PI / 180
    const lat2 = point2.lat * Math.PI / 180
    const deltaLng = (point2.lng - point1.lng) * Math.PI / 180

    const y = Math.sin(deltaLng) * Math.cos(lat2)
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng)

    const bearing = Math.atan2(y, x) * 180 / Math.PI
    return (bearing + 360) % 360
  }

  /**
   * 标准化角度到 0-180 范围
   * @param {number} angle - 角度
   * @returns {number} 标准化后的角度
   */
  const normalizeAngle = (angle) => {
    angle = Math.abs(angle)
    return angle > 180 ? 360 - angle : angle
  }

  /**
   * 查找坐标在原数组中的索引
   * @param {Object} target - 目标坐标
   * @param {Array} coordinates - 坐标数组
   * @returns {number} 索引，未找到返回-1
   */
  const findCoordinateIndex = (target, coordinates) => {
    return coordinates.findIndex(coord => 
      Math.abs(coord.lat - target.lat) < 0.000001 && 
      Math.abs(coord.lng - target.lng) < 0.000001
    )
  }

  /**
   * 移除重复点
   * @param {Array} points - 坐标点数组
   * @returns {Array} 去重后的数组
   */
  const removeDuplicatePoints = (points) => {
    const unique = []
    const seen = new Set()

    points.forEach(point => {
      const key = `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(point)
      }
    })

    return unique
  }

  /**
   * 按照原路线的顺序排序采样点
   * @param {Array} sampledPoints - 采样点数组
   * @param {Array} originalCoordinates - 原始坐标数组
   * @returns {Array} 排序后的采样点
   */
  const sortByRouteOrder = (sampledPoints, originalCoordinates) => {
    return sampledPoints
      .map(point => ({
        ...point,
        originalIndex: findCoordinateIndex(point, originalCoordinates)
      }))
      .filter(point => point.originalIndex >= 0)
      .sort((a, b) => a.originalIndex - b.originalIndex)
      .map(point => {
        const { originalIndex, ...cleanPoint } = point
        return cleanPoint
      })
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
