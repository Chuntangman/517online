/**
 * 坐标系转换工具
 * 专门用于高程数据获取时的坐标转换
 * 支持 GCJ-02（火星坐标系）到 WGS-84 的转换
 */

// π值定义
const PI = Math.PI
const A = 6378245.0  // 长半轴
const EE = 0.00669342162296594323  // 偏心率平方

/**
 * 判断坐标是否在中国境内
 * @param {number} lng 经度
 * @param {number} lat 纬度
 * @returns {boolean} 是否在中国境内
 */
function isInChina(lng, lat) {
  // 中国境外直接返回WGS84坐标
  if (lng < 72.004 || lng > 137.8347) return false
  if (lat < 0.8293 || lat > 55.8271) return false
  return true
}

/**
 * 转换纬度
 * @param {number} lng 经度
 * @param {number} lat 纬度
 * @returns {number} 转换后的纬度差值
 */
function transformLat(lng, lat) {
  let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat +
    0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng))
  ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(lat * PI) + 40.0 * Math.sin(lat / 3.0 * PI)) * 2.0 / 3.0
  ret += (160.0 * Math.sin(lat / 12.0 * PI) + 320 * Math.sin(lat * PI / 30.0)) * 2.0 / 3.0
  return ret
}

/**
 * 转换经度
 * @param {number} lng 经度
 * @param {number} lat 纬度
 * @returns {number} 转换后的经度差值
 */
function transformLng(lng, lat) {
  let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng +
    0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng))
  ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(lng * PI) + 40.0 * Math.sin(lng / 3.0 * PI)) * 2.0 / 3.0
  ret += (150.0 * Math.sin(lng / 12.0 * PI) + 300.0 * Math.sin(lng / 30.0 * PI)) * 2.0 / 3.0
  return ret
}

/**
 * GCJ-02 转换为 WGS-84
 * @param {number} gcjLng GCJ-02 经度
 * @param {number} gcjLat GCJ-02 纬度
 * @returns {Object} WGS-84 坐标 { lng, lat }
 */
export function gcj02ToWgs84(gcjLng, gcjLat) {
  // 数据类型验证
  if (typeof gcjLng !== 'number' || typeof gcjLat !== 'number') {
    console.warn('坐标转换：输入坐标格式错误')
    return { lng: gcjLng, lat: gcjLat }
  }

  // 精度验证
  if (Math.abs(gcjLng) > 180 || Math.abs(gcjLat) > 90) {
    console.warn('坐标转换：输入坐标超出有效范围')
    return { lng: gcjLng, lat: gcjLat }
  }

  // 境外坐标直接返回（无需转换）
  if (!isInChina(gcjLng, gcjLat)) {
    console.log('坐标转换：境外坐标，无需转换')
    return { lng: gcjLng, lat: gcjLat }
  }

  // 计算偏移量
  let dlat = transformLat(gcjLng - 105.0, gcjLat - 35.0)
  let dlng = transformLng(gcjLng - 105.0, gcjLat - 35.0)
  
  const radlat = gcjLat / 180.0 * PI
  let magic = Math.sin(radlat)
  magic = 1 - EE * magic * magic
  const sqrtmagic = Math.sqrt(magic)
  
  dlat = (dlat * 180.0) / ((A * (1 - EE)) / (magic * sqrtmagic) * PI)
  dlng = (dlng * 180.0) / (A / sqrtmagic * Math.cos(radlat) * PI)
  
  const mglat = gcjLat - dlat
  const mglng = gcjLng - dlng

  // console.log(`坐标转换 GCJ-02[${gcjLng}, ${gcjLat}] → WGS-84[${mglng.toFixed(6)}, ${mglat.toFixed(6)}]`)
  
  return {
    lng: parseFloat(mglng.toFixed(6)),
    lat: parseFloat(mglat.toFixed(6))
  }
}

/**
 * 批量转换坐标数组（从 GCJ-02 到 WGS-84）
 * @param {Array} coordinates 坐标数组 [{lng, lat}, ...]
 * @returns {Array} 转换后的 WGS-84 坐标数组
 */
export function batchGcj02ToWgs84(coordinates) {
  if (!Array.isArray(coordinates)) {
    console.warn('批量坐标转换：输入必须是数组')
    return coordinates || []
  }

  return coordinates.map((coord, index) => {
    if (!coord || typeof coord.lng !== 'number' || typeof coord.lat !== 'number') {
      console.warn(`批量坐标转换：坐标 ${index} 格式错误`, coord)
      return coord
    }

    const wgs84Coord = gcj02ToWgs84(coord.lng, coord.lat)
    
    // 保留原始坐标的其他属性
    return {
      ...coord,
      lng: wgs84Coord.lng,
      lat: wgs84Coord.lat,
      // 保存原始 GCJ-02 坐标用于调试
      originalGcj02: {
        lng: coord.lng,
        lat: coord.lat
      }
    }
  })
}

/**
 * 验证坐标转换精度
 * @param {number} gcjLng GCJ-02 经度
 * @param {number} gcjLat GCJ-02 纬度
 * @returns {Object} 转换信息和偏移距离
 */
export function validateTransform(gcjLng, gcjLat) {
  const wgs84 = gcj02ToWgs84(gcjLng, gcjLat)
  
  // 计算偏移距离（米）
  const deltaLng = Math.abs(gcjLng - wgs84.lng)
  const deltaLat = Math.abs(gcjLat - wgs84.lat)
  
  // 粗略计算偏移距离（米）
  const avgLat = (gcjLat + wgs84.lat) / 2
  const lngDistance = deltaLng * 111000 * Math.cos(avgLat * Math.PI / 180)
  const latDistance = deltaLat * 111000
  const totalDistance = Math.sqrt(lngDistance * lngDistance + latDistance * latDistance)
  
  return {
    gcj02: { lng: gcjLng, lat: gcjLat },
    wgs84: wgs84,
    offset: {
      lng: deltaLng,
      lat: deltaLat,
      distance: Math.round(totalDistance)
    },
    isInChina: isInChina(gcjLng, gcjLat)
  }
}

export default {
  gcj02ToWgs84,
  batchGcj02ToWgs84,
  validateTransform,
  isInChina
}
