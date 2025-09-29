import { ref } from 'vue'
import axios from 'axios'
import { gcj02ToWgs84, batchGcj02ToWgs84 } from '@/utils/coordinateTransform'

/**
 * 高程数据获取服务 - 优化版
 * 支持多种高程API，自动选择最快的服务
 * 自动处理 GCJ-02 到 WGS-84 坐标系转换
 */
export function useElevation() {
  const isLoading = ref(false)
  const error = ref(null)
  const elevationData = ref([])

  // 单一API配置 - 使用后端批量API（最稳定）
  const ELEVATION_API = {
    batch: '/api/v1/elevation/batch',
    single: '/api/v1/elevation/lookup',
    timeout: 25000 // 增加超时时间到25秒
  }

  // 请求去重机制 - 防止重复获取
  const requestCache = new Map()
  const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

  // 高程获取服务已启动

  /**
   * 生成请求缓存键
   * @param {Array} coordinates - 坐标数组
   * @returns {string} 缓存键
   */
  const generateCacheKey = (coordinates) => {
    const sortedCoords = coordinates.map(c => `${c.lng.toFixed(6)},${c.lat.toFixed(6)}`).sort()
    return `elevation_${sortedCoords.join('_')}`
  }

  /**
   * 检查缓存
   * @param {string} cacheKey - 缓存键
   * @returns {Object|null} 缓存的数据或null
   */
  const getFromCache = (cacheKey) => {
    const cached = requestCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`💾 [优化] 使用缓存数据，键: ${cacheKey}`)
      return cached.data
    }
    if (cached) {
      requestCache.delete(cacheKey) // 清除过期缓存
    }
    return null
  }

  /**
   * 设置缓存
   * @param {string} cacheKey - 缓存键
   * @param {*} data - 要缓存的数据
   */
  const setToCache = (cacheKey, data) => {
    requestCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    })
    console.log(`💾 [优化] 数据已缓存，键: ${cacheKey}`)
  }

  /**
   * 优化的批量高程数据获取 - 支持缓存、去重和重试
   * @param {Array} coordinates - 坐标数组 [{lng, lat}, ...]（GCJ-02坐标系）
   * @param {number} retryCount - 重试次数（默认0）
   * @returns {Promise<Array>} 高程数据数组
   */
  const getBatchElevationOptimized = async (coordinates, retryCount = 0) => {
    if (!coordinates || coordinates.length === 0) {
      return []
    }

    // 检查缓存
    const cacheKey = generateCacheKey(coordinates)
    const cachedData = getFromCache(cacheKey)
    if (cachedData) {
      return cachedData
    }

    // 坐标系转换：批量转换 GCJ-02 → WGS-84
    const wgs84Coordinates = batchGcj02ToWgs84(coordinates)
    
    try {
      const startTime = Date.now()
      console.log(`🌐 [API] 请求高程数据: ${coordinates.length} 个坐标点 ${retryCount > 0 ? `(重试 ${retryCount})` : ''}`)
      
      // 使用后端批量API
      const response = await axios.post(ELEVATION_API.batch, {
        coordinates: wgs84Coordinates
      }, {
        timeout: ELEVATION_API.timeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      const endTime = Date.now()
      console.log(`⏱️ [API] 请求耗时: ${endTime - startTime}ms`)

      // 解析响应
      if (response.data?.success && response.data?.data) {
        const elevations = response.data.data.map((item, index) => {
          // 🚫 修复：避免用0替代null，保持数据真实性
          if (item.elevation === null || item.elevation === undefined) {
            console.warn(`⚠️ 坐标 [${coordinates[index]?.lng}, ${coordinates[index]?.lat}] 高程数据为空`)
            return null
          }
          return Math.round(item.elevation)
        })
        
        const validCount = elevations.filter(e => e !== null).length
        console.log(`✅ [API] 成功获取 ${validCount}/${elevations.length} 个有效高程数据`)
        
        // 缓存结果
        setToCache(cacheKey, elevations)
        return elevations
      }
      
      console.error(`❌ [API] 响应格式错误:`, response.data)
      throw new Error(`批量API响应格式错误: ${JSON.stringify(response.data)}`)
    } catch (err) {
      console.error(`❌ [API] 请求失败 (尝试 ${retryCount + 1}):`, err.message)
      
      // 重试机制：最多重试2次
      if (retryCount < 2) {
        const delay = (retryCount + 1) * 2000 // 递增延迟：2秒、4秒
        console.log(`🔄 [API] ${delay/1000}秒后重试...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        return getBatchElevationOptimized(coordinates, retryCount + 1)
      }
      
      console.error(`💥 [API] 重试次数耗尽，高程数据获取失败`)
      throw err
    }
  }


  /**
   * 优化的单点高程数据获取 - 支持缓存
   * @param {number} latitude - 纬度（GCJ-02坐标系，自动转换为WGS-84）
   * @param {number} longitude - 经度（GCJ-02坐标系，自动转换为WGS-84）
   * @returns {Promise<number|null>} 高程值（米）
   */
  const getElevationForPoint = async (latitude, longitude) => {
    console.log(`🔍 [优化] 单点查询: [${longitude}, ${latitude}]`)
    
    try {
      // 坐标系转换：GCJ-02 → WGS-84
      const wgs84Coord = gcj02ToWgs84(longitude, latitude)
      const wgs84Lng = wgs84Coord.lng
      const wgs84Lat = wgs84Coord.lat
      
      console.log(`🔄 [优化] 坐标转换: [${longitude}, ${latitude}] → [${wgs84Lng}, ${wgs84Lat}]`)
      
      const startTime = Date.now()
      const response = await axios.get(ELEVATION_API.single, {
        params: {
          locations: `${wgs84Lat},${wgs84Lng}`
        },
        timeout: ELEVATION_API.timeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      
      const endTime = Date.now()
      console.log(`⏱️ [优化] 单点API请求耗时: ${endTime - startTime}ms`)

      if (response.data?.success && response.data?.data) {
        const elevationData = response.data.data
        if (elevationData && elevationData.results && elevationData.results.length > 0) {
          const elevation = Math.round(elevationData.results[0].elevation)
          console.log(`✅ [优化] 单点查询成功: [${longitude}, ${latitude}] = ${elevation}m`)
          return elevation
        }
      }
      
      console.warn(`⚠️ [优化] 单点查询无有效数据:`, response.data)
      return null
    } catch (err) {
      console.error(`💥 [优化] 单点查询失败: [${longitude}, ${latitude}]`, {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      })
      return null
    }
  }


  /**
   * 优化的路线高程数据获取 - 支持缓存和去重
   * @param {Array} coordinates - 坐标数组 [{lng, lat}, ...] (GCJ-02坐标系)
   * @param {number} maxPoints - 最大采样点数（默认减少到15以提升速度）
   * @param {boolean} enableSmartSampling - 是否启用智能采样（默认true）
   * @returns {Promise<Array>} 高程数据数组
   */
  const getElevationForRoute = async (coordinates, maxPoints = 15, enableSmartSampling = true) => {
    if (!coordinates || coordinates.length === 0) {
      console.warn('🚫 [优化] 坐标数组为空')
      return []
    }

    isLoading.value = true
    error.value = null
    elevationData.value = []

    try {
      console.log(`📍 开始获取高程数据: ${coordinates.length} 个坐标点`)
      
      // 优化采样：减少点数以提升速度
      const sampledCoordinates = enableSmartSampling 
        ? sampleCoordinates(coordinates, maxPoints)
        : basicEqualDistanceSample(coordinates, maxPoints)
      
      console.log(`📊 采样后: ${sampledCoordinates.length} 个点`)

      // 使用优化的批量获取（支持缓存和去重）
      const elevations = await getBatchElevationOptimized(sampledCoordinates)

      // 🚫 修复：只使用有效的高程数据，避免0值污染真实数据
      const validElevations = elevations
        .map((elevation, index) => ({
          elevation: elevation,
          coordinate: sampledCoordinates[index], // 保持原始GCJ-02坐标用于距离计算
          distance: calculateDistanceFromStart(sampledCoordinates, index),
          index
        }))
        .filter(item => item.elevation !== null && item.elevation !== undefined)
      
      console.log(`📊 有效高程数据: ${validElevations.length}/${elevations.length} 个点`)

      elevationData.value = validElevations
      console.log(`✅ 高程数据获取完成: ${validElevations.length} 个点`)
      
      return validElevations
    } catch (err) {
      console.error('❌ 高程数据获取失败:', err.message)
      error.value = err.message
      throw err
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

  /**
   * 清除请求缓存
   */
  const clearRequestCache = () => {
    requestCache.clear()
    console.log('🗑️ [优化] 请求缓存已清除')
  }

  /**
   * 获取缓存统计信息
   * @returns {Object} 缓存统计
   */
  const getCacheStats = () => {
    const now = Date.now()
    let validCount = 0
    let expiredCount = 0
    
    for (const [key, value] of requestCache.entries()) {
      if (now - value.timestamp < CACHE_DURATION) {
        validCount++
      } else {
        expiredCount++
      }
    }
    
    return {
      total: requestCache.size,
      valid: validCount,
      expired: expiredCount,
      cacheHitRate: requestCache.size > 0 ? (validCount / requestCache.size * 100).toFixed(1) : 0
    }
  }

  /**
   * 定期清理过期缓存
   */
  const cleanupExpiredCache = () => {
    const now = Date.now()
    const keysToDelete = []
    
    for (const [key, value] of requestCache.entries()) {
      if (now - value.timestamp >= CACHE_DURATION) {
        keysToDelete.push(key)
      }
    }
    
    keysToDelete.forEach(key => requestCache.delete(key))
    
    if (keysToDelete.length > 0) {
      console.log(`🧹 [优化] 清理了 ${keysToDelete.length} 个过期缓存`)
    }
  }

  // 定期清理过期缓存（每5分钟）
  setInterval(cleanupExpiredCache, 5 * 60 * 1000)

  return {
    // 响应式数据
    isLoading,
    error,
    elevationData,
    
    // 方法（优化版，支持多API和缓存）
    getElevationForPoint,
    getElevationForRoute,
    calculateElevationStats,
    clearElevationData,
    clearRequestCache,
    getCacheStats
  }
}
