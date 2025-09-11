<template>
  <div class="homepage">
    <!-- 主标题区域 -->
    <h1 class="title">517骑行驿站</h1>

    <!-- 卡片容器 -->
    <div class="container">
      <div 
        v-for="(image, index) in images" 
        :key="image.id"
        class="box"
        @mousemove="handleMouseMove($event, index)"
        @mouseenter="handleMouseEnter(index, $event)"
        @mouseleave="handleMouseLeave(index, $event)"
        :ref="`card-${index}`"
      >
        <div 
          class="card-bg" 
          :style="getCardBgImage(image['存储(根目录路径)'])"
        ></div>
        <div class="card-title-bar">
          <div class="card-title-wrapper">
            <div class="card-title-container">
              <span class="title-block"></span>
              <h2 class="card-title">{{ image['图片名'] }}<span class="title-dot"></span></h2>
            </div>
            <div class="card-subtitle-container">
              <div class="subtitle-block"></div>
              <p class="card-subtitle">{{ image['介绍'] }}</p>
            </div>
          </div>
          <button 
            class="card-button"
            @click="handleCardClick(image, index)"
          >
            开始探索
          </button>
        </div>
          </div>
        </div>

  </div>
</template>

<script setup>
import { ref, reactive, shallowReactive, onMounted, onUnmounted, nextTick, customRef } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

// 时间分片处理器
class TimeSlicingScheduler {
  constructor() {
    this.tasks = []
    this.isRunning = false
  }

  schedule(task, priority = 0) {
    this.tasks.push({ task, priority, timestamp: performance.now() })
    this.tasks.sort((a, b) => b.priority - a.priority)
    
    if (!this.isRunning) {
      this.flush()
    }
  }

  flush() {
    this.isRunning = true
    
    const runTasks = () => {
      const start = performance.now()
      
      while (this.tasks.length > 0 && (performance.now() - start < 5)) {
        const { task } = this.tasks.shift()
        try {
          task()
        } catch (error) {
          console.warn('Task execution error:', error)
        }
      }
      
      if (this.tasks.length > 0) {
        requestAnimationFrame(runTasks)
      } else {
        this.isRunning = false
      }
    }
    
    requestAnimationFrame(runTasks)
  }
}

const scheduler = new TimeSlicingScheduler()

// 初始化路由
const router = useRouter()

// 智能响应式数据管理
const images = customRef((track, trigger) => {
  let value = []
  let isPreloading = false
  
  return {
    get() {
      track()
      return value
    },
    set(newValue) {
      value = newValue
      
      // 异步预加载图片
      if (!isPreloading && newValue.length > 0) {
        isPreloading = true
        scheduler.schedule(() => {
          preloadImages(newValue)
        }, 1)
      }
      
      trigger()
    }
  }
})

// 卡片数据 - 使用 shallowReactive 避免深度响应式开销
const cardData = shallowReactive({})

// 智能图片预加载
const preloadImages = (imageList) => {
  const preloadPromises = imageList.map(image => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve(image)
      img.onerror = () => resolve(image) // 即使失败也继续
      
      const imagePath = image['存储(根目录路径)']
      if (imagePath) {
        let cleanPath = ''
        if (imagePath.startsWith('public/') || imagePath.startsWith('public\\')) {
          cleanPath = '/' + imagePath.replace(/^public[\/\\]/, '').replace(/\\/g, '/')
        } else {
          cleanPath = '/' + imagePath.replace(/\\/g, '/')
        }
        
        const parts = cleanPath.split('/')
        const encodedParts = parts.map(part => part ? encodeURIComponent(part) : part)
        img.src = encodedParts.join('/')
      }
    })
  })
  
  Promise.allSettled(preloadPromises).then(() => {
    console.log('图片预加载完成')
  })
}

// 获取主页图片数据
const fetchHomepageImages = async () => {
  try {
    const response = await axios.get('/api/v1/images/homepage')
    if (response.data.success) {
      images.value = response.data.data
      // 初始化卡片数据
      images.value.forEach((_, index) => {
        cardData[index] = {
          width: 0,
          height: 0,
          mouseX: 0,
          mouseY: 0,
          mouseLeaveDelay: null
        }
      })
    }
  } catch (error) {
    // 如果API调用失败，使用默认数据
    images.value = [
      { id: 1, '图片名': '主页图1', '介绍': '探索最美的骑行路线', '存储(根目录路径)': 'public\\主页图\\列车.jpg' },
      { id: 2, '图片名': '主页图2', '介绍': '发现沿途的美景', '存储(根目录路径)': 'public\\主页图\\海岸.jpg' },
      { id: 3, '图片名': '主页图3', '介绍': '感受自然的魅力', '存储(根目录路径)': 'public\\主页图\\殿堂.jpg' },
      { id: 4, '图片名': '主页图4', '介绍': '享受骑行的乐趣', '存储(根目录路径)': 'public\\主页图\\牧场.jpg' }
    ]
    // 初始化卡片数据
    images.value.forEach((_, index) => {
      cardData[index] = {
        width: 0,
        height: 0,
        mouseX: 0,
        mouseY: 0,
        mouseLeaveDelay: null
      }
    })
  }
}

// Intersection Observer 优化
const createIntersectionObserver = () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const cardIndex = parseInt(entry.target.dataset.cardIndex)
      
      if (entry.isIntersecting) {
        // 卡片进入视口时激活交互
        scheduler.schedule(() => {
          if (!cardData[cardIndex]) {
            cardData[cardIndex] = {
              width: entry.target.offsetWidth,
              height: entry.target.offsetHeight,
              mouseX: 0,
              mouseY: 0,
              mouseLeaveDelay: null,
              isActive: true
            }
          } else {
            cardData[cardIndex].isActive = true
          }
        }, 2)
      } else {
        // 卡片离开视口时停用交互
        if (cardData[cardIndex]) {
          cardData[cardIndex].isActive = false
          eventPool.delete(cardIndex)
          updateQueue.delete(cardIndex)
        }
      }
    })
  }, {
    threshold: 0.1,
    rootMargin: '50px'
  })
  
  return observer
}

let intersectionObserver = null

// 组件挂载后初始化
onMounted(async () => {
  // 使用 requestIdleCallback 延迟非关键初始化
  requestIdleCallback(() => {
    fetchHomepageImages()
  }, { timeout: 100 })
  
  // 创建 Intersection Observer
  intersectionObserver = createIntersectionObserver()
  
  // 延迟初始化卡片尺寸
  nextTick(() => {
    scheduler.schedule(() => {
      images.value.forEach((_, index) => {
        const cardElement = document.querySelector(`.box:nth-child(${index + 1})`)
        if (cardElement) {
          cardElement.dataset.cardIndex = index
          intersectionObserver.observe(cardElement)
        }
      })
    }, 1)
  })
})


// 简化的背景图片样式函数（只处理静态样式）
const getCardBgTransform = (cardIndex) => {
  // 现在transform由原生DOM直接处理，这里只返回初始状态
  return { transform: 'translate3d(0px, 0px, 0px)' }
}

// 获取图片源路径
const getImageSrc = (imagePath) => {
  if (!imagePath) return ''
  
  let cleanPath = ''
  
  // 处理不同格式的路径
  if (imagePath.startsWith('public/') || imagePath.startsWith('public\\')) {
    // 移除 public/ 或 public\ 前缀
    cleanPath = '/' + imagePath.replace(/^public[\/\\]/, '').replace(/\\/g, '/')
  } else if (imagePath.startsWith('/')) {
    // 已经是绝对路径
    cleanPath = imagePath
  } else {
    // 相对路径，添加前缀
    cleanPath = '/' + imagePath.replace(/\\/g, '/')
  }
  
  // 对中文字符进行URL编码
  const parts = cleanPath.split('/')
  const encodedParts = parts.map(part => part ? encodeURIComponent(part) : part)
  return encodedParts.join('/')
}

// 获取背景图片样式
const getCardBgImage = (imagePath) => {
  const imageUrl = getImageSrc(imagePath)
  return {
    backgroundImage: imageUrl ? `url(${imageUrl})` : 'none'
  }
}


// 简化的性能监控（保留基础监控功能）
const perfMonitor = {
  frameCount: 0,
  lastCheck: performance.now(),
  
  checkPerformance() {
    this.frameCount++
    const now = performance.now()
    
    if (now - this.lastCheck > 1000) {
      const fps = this.frameCount
      this.frameCount = 0
      this.lastCheck = now
      
      // 简单的性能日志
      if (fps < 30) {
        console.warn('Low FPS detected:', fps)
      }
    }
  }
}

// 核心优化：RAF锁帧 + 原生DOM操作，避免Vue响应式开销
let ticking = false
const activeTransforms = new Map() // 存储当前变换状态

const handleMouseMove = (e, cardIndex) => {
  if (!cardData[cardIndex]?.isActive) return
  
  // RAF锁帧：无论鼠标多快移动，每帧只处理一次
  if (!ticking) {
    ticking = true
    requestAnimationFrame(() => {
      perfMonitor.checkPerformance()
      
      const card = e.currentTarget
      const bgElement = card.querySelector('.card-bg')
      
      if (!card._cachedRect) {
        card._cachedRect = card.getBoundingClientRect()
      }
      
      const rect = card._cachedRect
      const mouseX = e.clientX - rect.left - rect.width / 2
      const mouseY = e.clientY - rect.top - rect.height / 2
      
      // 直接操作DOM，避免Vue响应式
      const tX = (mouseX / rect.width) * -8
      const tY = (mouseY / rect.height) * -8
      
      // 使用GPU加速的transform，避免重排重绘
      const transform = `translate3d(${tX.toFixed(2)}px, ${tY.toFixed(2)}px, 0px)`
      
      if (bgElement && activeTransforms.get(cardIndex) !== transform) {
        bgElement.style.transform = transform
        activeTransforms.set(cardIndex, transform)
      }
      
      ticking = false
    })
  }
}

// 处理鼠标进入 - 缓存布局信息
const handleMouseEnter = (cardIndex, e) => {
  const card = e.currentTarget
  
  // 在mouseenter时缓存布局信息，避免mousemove时重复查询
  const rect = card.getBoundingClientRect()
  card._cachedRect = rect
  
  if (cardData[cardIndex]) {
    clearTimeout(cardData[cardIndex].mouseLeaveDelay)
    cardData[cardIndex].width = rect.width
    cardData[cardIndex].height = rect.height
  }
}

// 处理鼠标离开 - 直接DOM操作重置
const handleMouseLeave = (cardIndex, e) => {
  const card = e.currentTarget
  const bgElement = card.querySelector('.card-bg')
  
  if (cardData[cardIndex]) {
    cardData[cardIndex].mouseLeaveDelay = setTimeout(() => {
      // 直接重置transform，避免Vue响应式
      if (bgElement) {
        bgElement.style.transform = 'translate3d(0px, 0px, 0px)'
      }
      
      // 清理缓存
      activeTransforms.delete(cardIndex)
      delete card._cachedRect
    }, 600) // 减少延迟
  }
}

// 组件卸载时清理资源
onUnmounted(() => {
  // 清理 Intersection Observer
  if (intersectionObserver) {
    intersectionObserver.disconnect()
    intersectionObserver = null
  }
  
  // 清理所有定时器
  Object.values(cardData).forEach(data => {
    if (data && data.mouseLeaveDelay) {
      clearTimeout(data.mouseLeaveDelay)
    }
  })
  
  // 清理DOM缓存和transform状态
  activeTransforms.clear()
  
  document.querySelectorAll('.box').forEach(el => {
    delete el._cachedRect
    const bgElement = el.querySelector('.card-bg')
    if (bgElement) {
      bgElement.style.transform = 'translate3d(0px, 0px, 0px)'
    }
  })
  
  // 停止调度器
  if (scheduler) {
    scheduler.tasks = []
    scheduler.isRunning = false
  }
})

// 卡片按钮点击处理（支持不同页面跳转）
const handleCardClick = (image, index) => {
  // 根据图片名或索引跳转到不同页面
  const routeMap = {
    '主页图1': '/route1',  // 可以根据需要修改路径
    '主页图2': '/route2',
    '主页图3': '/route3', 
    '主页图4': '/route4'
  }
  
  const targetRoute = routeMap[image['图片名']] || `/route/${index + 1}`
  
  console.log(`点击了${image['图片名']}，准备跳转到: ${targetRoute}`)
  
  // 这里可以添加路由跳转逻辑
  // router.push(targetRoute)
  
  // 临时使用原有的路由作为示例
  router.push('/route')
}

</script>

<style scoped>
@import url('https://fonts.googleapis.com/css?family=Lato:300,400|Poppins:300,400,800&display=swap');

/* 定义变量 */
:root {
  --hover-easing: cubic-bezier(0.23, 1, 0.32, 1);
  --return-easing: cubic-bezier(0.445, 0.05, 0.55, 0.95);
  --primary-bg: #BCAAA4;
  --primary-text: #5D4037;
  --text-white: #fff;
}

/* 全局样式 */
.homepage {
  width: 100vw !important;
  min-height: 100vh;
  background-color: var(--primary-bg);
  font-family: "Raleway", "Microsoft YaHei", sans-serif;
  font-weight: 500;
  -webkit-font-smoothing: antialiased;
  padding: 40px 0;
  margin: 0 !important;
  position: relative;
  left: 0;
  right: 0;
}

/* 主标题 */
.title {
  font-family: "Raleway", "Microsoft YaHei", sans-serif;
  font-size: 3rem;
  font-weight: 700;
  color: var(--primary-text);
  text-align: center;
  margin-bottom: 40px;
  text-shadow: rgba(0, 0, 0, 0.1) 0 2px 4px;
}

/* 容器 */
.container {
  display: flex;
  width: 100%;
  padding: 4% 2%;
  box-sizing: border-box;
  height: 80vh;
  margin-top: 2rem;
}

/* 卡片盒子 - 企业级GPU优化 */
.box {
  flex: 1;
  overflow: hidden;
  transition: flex 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  margin: 0 2%;
  box-shadow: 0 20px 30px rgba(0, 0, 0, 0.1);
  line-height: 0;
  position: relative;
  cursor: pointer;
  border-radius: 10px;
  will-change: flex;
  transform: translateZ(0);
  backface-visibility: hidden;
  -webkit-perspective: 1000px;
  perspective: 1000px;
  contain: layout style paint;
}

.box:hover {
  flex: 1 1 50%;
}

.box:hover .card-bg {
  width: 100%;
  height: 100%;
}

.box:hover .card-info {
  opacity: 1;
  transform: translateY(0);
}

.box:hover .card-title-bar {
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.6) 70%, rgba(0, 0, 0, 0.1) 100%);
}

.box:hover .card-button {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}

.card-button:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 184, 148, 0.4);
  transition: all 0.6s ease;
}

.card-button:hover::before {
  opacity: 1;
  transition: opacity 0.6s linear;
}

.card-button:hover::after {
  opacity: 1;
  transition: opacity 0.6s ease;
}

.card-button:active {
  transform: translateY(-1px) scale(1.02);
}

/* 动画关键帧 */
@keyframes titleBlock {
  0% {
    width: 0%;
    left: 0;
  }
  50% {
    width: 100%;
    left: 0;
  }
  100% {
    width: 0;
    left: 100%;
  }
}

@keyframes subtitleBlock {
  0% {
    width: 0%;
    left: 0;
  }
  50% {
    width: 100%;
    left: 0;
  }
  100% {
    width: 0;
    left: 100%;
  }
}

@keyframes titleFadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes subtitleFadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 0.8;
  }
}

@keyframes dotPopIn {
  0% {
    width: 0px;
    height: 0px;
    background: #74b9ff;
    border: 0px solid #ddd;
    opacity: 0;
  }
  50% {
    width: 8px;
    height: 8px;
    background: #74b9ff;
    opacity: 1;
    bottom: 20px;
  }
  65% {
    width: 6px;
    height: 6px;
    bottom: 0px;
    width: 12px;
  }
  80% {
    width: 8px;
    height: 8px;
    bottom: 15px;
  }
  100% {
    width: 6px;
    height: 6px;
    background: #00cec9;
    border: 0px solid #222;
    bottom: 8px;
  }
}

/* 卡片背景 - 企业级优化 */
.card-bg {
  width: 200%;
  height: 100%;
  object-fit: cover;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1), height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  top: 0;
  left: 0;
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  will-change: width, height, transform;
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  image-rendering: optimizeSpeed;
  contain: layout style paint;
  isolation: isolate;
  z-index: 1;
}

/* 卡片标题栏 - 企业级优化 */
.card-title-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 10vh;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.4) 70%, rgba(0, 0, 0, 0) 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 2;
  transition: background 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateZ(0);
  backface-visibility: hidden;
  contain: layout style paint;
}

.card-title-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  max-width: calc(100% - 120px);
}

.card-title-container {
  position: relative;
  display: flex;
  align-items: center;
  height: 45px;
  min-height: 45px;
  overflow: hidden;
}

.title-block {
  width: 0%;
  height: 100%;
  background: #00b894;
  position: absolute;
  animation: titleBlock 2s cubic-bezier(.74, .06, .4, .92) forwards;
  display: flex;
  z-index: 1;
}

.card-title {
  font-size: 4.5vh;
  color: white;
  margin: 0;
  font-family: 'Poppins', "Microsoft YaHei", sans-serif;
  font-weight: 800;
  animation: titleFadeIn 2s forwards;
  animation-delay: 1.6s;
  opacity: 0;
  display: flex;
  align-items: baseline;
  position: relative;
  z-index: 3;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.5);
}

.title-dot {
  width: 0px;
  height: 0px;
  border-radius: 50%;
  background: #00cec9;
  animation: dotPopIn 0.8s cubic-bezier(.74, .06, .4, .92) forwards;
  animation-delay: 2s;
  margin-left: 5px;
  margin-top: -10px;
  position: absolute;
  bottom: 8px;
  right: -12px;
}

.card-subtitle-container {
  position: relative;
  display: flex;
  align-items: center;
  height: 25px;
  min-height: 25px;
  margin-top: 2px;
  overflow: hidden;
}

.subtitle-block {
  width: 0%;
  height: 100%;
  background: #74b9ff;
  position: absolute;
  animation: subtitleBlock 2s cubic-bezier(.74, .06, .4, .92) forwards;
  animation-delay: 2s;
  display: flex;
  z-index: 1;
}

.card-subtitle {
  animation: subtitleFadeIn 2s forwards;
  animation-delay: 3.2s;
  opacity: 0;
  font-weight: 400;
  font-family: 'Lato', "Microsoft YaHei", sans-serif;
  color: #ffffff;
  font-size: 2.5vh;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 0;
  z-index: 3;
  position: relative;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8), 0 0 6px rgba(0, 0, 0, 0.4);
}

.card-button {
  position: relative;
  background: linear-gradient(56deg, #00b894 0%, #00cec9 46%, #74b9ff 100%);
  color: white;
  border: none;
  padding: 10px 20px 12px;
  border-radius: 10rem;
  font-size: 2.2vh;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  transform: translate3d(20px, 0, 0);
  font-family: "Raleway", sans-serif;
  white-space: nowrap;
  will-change: opacity, transform;
  backface-visibility: hidden;
  contain: layout style paint;
  transform-style: preserve-3d;
  overflow: hidden;
  z-index: 3;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.card-button::before {
  content: "";
  background: linear-gradient(56deg, #00b894 0%, #00cec9 46%, #74b9ff 100%);
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
  border-radius: 10rem;
  transition: opacity 0.4s ease;
  z-index: -1;
}

.card-button::after {
  content: "";
  background: linear-gradient(56deg, #00b894 0%, #00cec9 46%, #74b9ff 100%);
  width: 80%;
  height: 20%;
  position: absolute;
  bottom: -2px;
  left: 10%;
  opacity: 0;
  filter: blur(8px);
  border-radius: 10rem;
  transform: translateZ(-1px);
  transition: opacity 0.6s ease;
  z-index: -1;
}



/* 响应式设计 */
@media (max-width: 1200px) {
  .title {
    font-size: 2.5rem;
  }
  
  .container {
    height: 70vh;
  }
}

@media (max-width: 1024px) {
  .title {
    font-size: 2.2rem;
  }
  
  .container {
    height: 60vh;
    padding: 3% 1%;
  }
  
  .card-title {
    font-size: 4vh;
  }
  
  .card-subtitle {
    font-size: 2.2vh;
  }
  
  .card-button {
    font-size: 2vh;
    padding: 8px 16px 10px;
  }
}

@media (max-width: 768px) {
  .homepage {
    padding: 20px 0;
  }
  
  .container {
    flex-direction: column;
    height: auto;
    padding: 2%;
  }
  
  .box {
    margin: 2% 0;
    height: 300px;
  }
  
  .box:hover {
    flex: 1;
  }
  
  .title {
    font-size: 2rem;
    margin-bottom: 30px;
  }
  
  .card-title {
    font-size: 3.6vh;
  }
  
  .card-subtitle {
    font-size: 1.8vh;
  }
  
  .card-button {
    font-size: 1.8vh;
    padding: 7px 12px 9px;
  }
  
  .card-bg {
    width: 100%;
    height: 100%;
  }
}

@media (max-width: 480px) {
  .title {
    font-size: 1.8rem;
  }
  
  .box {
    height: 250px;
  }
  
  .card-title {
    font-size: 3.2vh;
  }
  
  .card-subtitle {
    font-size: 1.4vh;
    letter-spacing: 1px;
  }

  .card-title-bar {
    height: 8vh;
    padding: 0 15px;
  }
  
  .card-button {
    font-size: 1.5vh;
    padding: 6px 10px 8px;
  }
  
  .card-bg {
    height: calc(100% - 8vh);
  }
  
}
</style>