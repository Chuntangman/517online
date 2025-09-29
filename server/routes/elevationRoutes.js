const express = require('express')
const axios = require('axios')
const router = express.Router()

// 高程API代理路由
router.get('/lookup', async (req, res) => {
  try {
    const { locations } = req.query
    
    if (!locations) {
      return res.status(400).json({
        success: false,
        message: '缺少locations参数'
      })
    }

    console.log('高程API请求:', locations)

    // 调用Open-Elevation API
    const response = await axios.get('https://api.open-elevation.com/api/v1/lookup', {
      params: { locations },
      timeout: 10000,
      headers: {
        'User-Agent': 'Cycling-Route-App/1.0'
      }
    })

    // 返回高程数据
    res.json({
      success: true,
      data: response.data
    })

  } catch (error) {
    console.error('高程API请求失败:', error.message)
    
    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        message: '请求频率过高，请稍后再试'
      })
    }

    res.status(500).json({
      success: false,
      message: '获取高程数据失败',
      error: error.message
    })
  }
})

// 批量高程查询
// 接收WGS-84坐标系的坐标数组（前端已转换）
router.post('/batch', async (req, res) => {
  try {
    const { coordinates } = req.body
    
    if (!coordinates || !Array.isArray(coordinates)) {
      return res.status(400).json({
        success: false,
        message: '缺少coordinates参数或格式错误'
      })
    }

    console.log(`批量高程查询（WGS-84坐标），坐标数量: ${coordinates.length}`)

    const results = []
    
    // 🚫 修复：改进批量处理逻辑，减少失败率
    console.log(`🌐 开始批量查询高程数据...`)
    
    for (let i = 0; i < coordinates.length; i++) {
      const coord = coordinates[i]
      const locations = `${coord.lat},${coord.lng}`
      let retryCount = 0
      const maxRetries = 2
      let success = false
      
      while (!success && retryCount <= maxRetries) {
        try {
          const response = await axios.get('https://api.open-elevation.com/api/v1/lookup', {
            params: { locations },
            timeout: 15000, // 增加超时时间
            headers: {
              'User-Agent': 'Cycling-Route-App/1.0',
              'Accept': 'application/json'
            }
          })

          if (response.data?.results?.[0]?.elevation !== undefined) {
            const elevation = response.data.results[0].elevation
            results.push({
              ...coord,
              elevation: elevation !== null ? Math.round(elevation) : null
            })
            console.log(`✅ 坐标 ${locations}: ${elevation}m`)
          } else {
            console.warn(`⚠️ 坐标 ${locations}: 无高程数据`)
            results.push({
              ...coord,
              elevation: null
            })
          }
          success = true
        } catch (error) {
          retryCount++
          if (retryCount <= maxRetries) {
            console.log(`🔄 坐标 ${locations} 重试 ${retryCount}/${maxRetries}: ${error.message}`)
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)) // 递增延迟
          } else {
            console.error(`💥 坐标 ${locations} 查询最终失败:`, error.message)
            results.push({
              ...coord,
              elevation: null
            })
          }
        }
      }

      // 请求间延迟，避免频率限制（减少延迟时间）
      if (i < coordinates.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    }
    
    const validCount = results.filter(r => r.elevation !== null).length
    console.log(`📊 批量查询完成: ${validCount}/${results.length} 个有效数据`)

    res.json({
      success: true,
      data: results
    })

  } catch (error) {
    console.error('批量高程查询失败:', error.message)
    res.status(500).json({
      success: false,
      message: '批量高程查询失败',
      error: error.message
    })
  }
})

module.exports = router
