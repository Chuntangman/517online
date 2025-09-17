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
router.post('/batch', async (req, res) => {
  try {
    const { coordinates } = req.body
    
    if (!coordinates || !Array.isArray(coordinates)) {
      return res.status(400).json({
        success: false,
        message: '缺少coordinates参数或格式错误'
      })
    }

    console.log(`批量高程查询，坐标数量: ${coordinates.length}`)

    const results = []
    
    // 分批处理，避免API频率限制
    for (let i = 0; i < coordinates.length; i++) {
      const coord = coordinates[i]
      const locations = `${coord.lat},${coord.lng}`
      
      try {
        const response = await axios.get('https://api.open-elevation.com/api/v1/lookup', {
          params: { locations },
          timeout: 10000,
          headers: {
            'User-Agent': 'Cycling-Route-App/1.0'
          }
        })

        if (response.data?.results?.[0]) {
          results.push({
            ...coord,
            elevation: Math.round(response.data.results[0].elevation)
          })
        } else {
          results.push({
            ...coord,
            elevation: null
          })
        }
      } catch (error) {
        console.error(`坐标 ${locations} 高程查询失败:`, error.message)
        results.push({
          ...coord,
          elevation: null
        })
      }

      // 请求间延迟，避免频率限制
      if (i < coordinates.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

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
