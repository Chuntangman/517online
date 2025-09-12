/**
 * 驿站图片管理 Composable
 * 处理驿站图片的获取、轮播和显示逻辑
 */

import { ref, reactive } from 'vue'
import axios from 'axios'

export function useStationImages() {
  // 存储所有驿站的图片数据
  const stationImages = reactive({})
  
  // 当前显示的图片索引
  const currentImageIndex = reactive({})
  
  // 轮播定时器
  const carouselTimers = reactive({})
  
  // 获取指定驿站的图片
  const fetchStationImages = async (stationName) => {
    if (!stationName) {
      console.warn('驿站名称为空，无法获取图片')
      return []
    }
    
    try {
      // 开发环境API地址
      const apiUrl = process.env.NODE_ENV === 'production'
        ? `/api/v1/images/name/${encodeURIComponent(stationName)}`
        : `http://localhost:3000/api/v1/images/name/${encodeURIComponent(stationName)}`
      
      console.log('正在获取驿站图片，API地址:', apiUrl)
      const response = await axios.get(apiUrl)
      
      if (response.data && response.data.success && response.data.data) {
        const images = response.data.data
        
        // 存储图片数据
        stationImages[stationName] = images
        
        // 初始化当前图片索引
        if (images.length > 0) {
          currentImageIndex[stationName] = 0
        }
        
        console.log(`驿站 ${stationName} 图片加载成功，共 ${images.length} 张图片`)
        return images
      } else {
        console.log(`驿站 ${stationName} 没有找到图片`)
        stationImages[stationName] = []
        return []
      }
    } catch (error) {
      console.error(`获取驿站 ${stationName} 图片失败:`, error)
      stationImages[stationName] = []
      return []
    }
  }
  
  // 获取当前显示的图片
  const getCurrentImage = (stationName) => {
    if (!stationImages[stationName] || stationImages[stationName].length === 0) {
      return null
    }
    
    const index = currentImageIndex[stationName] || 0
    return stationImages[stationName][index]
  }
  
  // 获取图片URL
  const getImageUrl = (imageData) => {
    if (!imageData || !imageData['存储(根目录路径)']) {
      return ''
    }
    
    // 将Windows路径转换为Web路径
    let imagePath = imageData['存储(根目录路径)']
    imagePath = imagePath.replace(/\\/g, '/')
    
    // 如果路径以public开头，则移除public前缀
    if (imagePath.startsWith('public/')) {
      imagePath = imagePath.substring(7)
    }
    
    // 确保路径以/开头
    if (!imagePath.startsWith('/')) {
      imagePath = '/' + imagePath
    }
    
    return imagePath
  }
  
  // 获取图片描述
  const getImageDescription = (imageData) => {
    if (!imageData) {
      return '暂无描述'
    }
    
    return imageData['介绍'] || '暂无描述'
  }
  
  // 开始图片轮播
  const startImageCarousel = (stationName, interval = 3000) => {
    if (!stationImages[stationName] || stationImages[stationName].length <= 1) {
      return
    }
    
    // 停止已有的轮播
    stopImageCarousel(stationName)
    
    // 开始新的轮播
    carouselTimers[stationName] = setInterval(() => {
      nextImage(stationName)
    }, interval)
    
    console.log(`驿站 ${stationName} 开始图片轮播，间隔 ${interval}ms`)
  }
  
  // 停止图片轮播
  const stopImageCarousel = (stationName) => {
    if (carouselTimers[stationName]) {
      clearInterval(carouselTimers[stationName])
      delete carouselTimers[stationName]
      console.log(`驿站 ${stationName} 停止图片轮播`)
    }
  }
  
  // 切换到下一张图片
  const nextImage = (stationName) => {
    if (!stationImages[stationName] || stationImages[stationName].length <= 1) {
      return
    }
    
    const maxIndex = stationImages[stationName].length - 1
    currentImageIndex[stationName] = (currentImageIndex[stationName] + 1) % (maxIndex + 1)
  }
  
  // 切换到上一张图片
  const prevImage = (stationName) => {
    if (!stationImages[stationName] || stationImages[stationName].length <= 1) {
      return
    }
    
    const maxIndex = stationImages[stationName].length - 1
    currentImageIndex[stationName] = currentImageIndex[stationName] === 0 
      ? maxIndex 
      : currentImageIndex[stationName] - 1
  }
  
  // 跳转到指定图片
  const jumpToImage = (stationName, index) => {
    if (!stationImages[stationName] || index < 0 || index >= stationImages[stationName].length) {
      return
    }
    
    currentImageIndex[stationName] = index
  }
  
  // 清理所有轮播定时器
  const cleanupCarousels = () => {
    Object.keys(carouselTimers).forEach(stationName => {
      stopImageCarousel(stationName)
    })
  }
  
  return {
    // 数据
    stationImages,
    currentImageIndex,
    
    // 方法
    fetchStationImages,
    getCurrentImage,
    getImageUrl,
    getImageDescription,
    startImageCarousel,
    stopImageCarousel,
    nextImage,
    prevImage,
    jumpToImage,
    cleanupCarousels
  }
}
