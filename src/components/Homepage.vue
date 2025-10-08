<template>
  <div class="homepage">
    <!-- 动态背景装饰元素 -->
    <div class="background-decoration">
      <!-- 动态壁纸背景 -->
      <div 
        class="bg-wallpaper" 
        :class="{ 'loading': backgroundLoading, 'error': backgroundError }"
        :style="backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : {}"
      ></div>
      
      <!-- 备用渐变背景 -->
      <div class="bg-gradient" :class="{ 'hidden': backgroundImage && !backgroundError }"></div>
      
      <!-- 装饰图案覆盖层 -->
      <div class="bg-pattern"></div>
      
      <!-- 浮动装饰元素 -->
      <div class="floating-elements">
        <div class="floating-circle circle-1"></div>
        <div class="floating-circle circle-2"></div>
        <div class="floating-circle circle-3"></div>
      </div>
      
      <!-- 背景加载状态 -->
      <div class="bg-loading" v-if="backgroundLoading">
        <div class="loading-spinner"></div>
        <p>正在加载今日壁纸...</p>
      </div>
    </div>
    

    <!-- 可控制的小窗口视频播放器 -->
    <div class="video-player-widget" :class="{ 'minimized': isVideoMinimized, 'hidden': !showVideo, 'fullscreen': isVideoFullscreen }">
      <div class="video-controls">
        <button @click="toggleVideo" class="control-btn close-btn" v-if="showVideo" title="关闭视频">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
        <button @click="toggleMinimize" class="control-btn minimize-btn" v-if="showVideo && !isVideoFullscreen" title="最小化">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13H5v-2h14v2z"/>
          </svg>
        </button>
        <button @click="toggleFullscreen" class="control-btn fullscreen-btn" v-if="showVideo && !isVideoMinimized" :title="isVideoFullscreen ? '退出全屏' : '全屏'">
          <svg v-if="!isVideoFullscreen" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
          </svg>
        </button>
        <button @click="showVideo = true" class="control-btn play-btn" v-if="!showVideo" title="播放视频">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
      </div>
      <div class="video-container" v-if="showVideo && !isVideoMinimized">
        <iframe 
          src="https://player.bilibili.com/player.html?isOutside=true&aid=375573984&bvid=BV1uo4y1m74J&cid=337981426&p=1&autoplay=1&muted=1&high_quality=1&danmaku=0&t=0&as_wide=1&hasMuteBtn=1" 
          scrolling="no" 
          border="0" 
          frameborder="no" 
          framespacing="0" 
          allowfullscreen="true"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
          referrerpolicy="no-referrer-when-downgrade"
          class="video-iframe">
        </iframe>
      </div>
    </div>
    
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
            @click="handleCardClick(image, index, $event)"
          >
            开始探索
          </button>
        </div>
      </div>
    </div>

    <!-- 版权信息区域 -->
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-left">
          <p class="copyright">© 2025 517骑行驿站 - 探索无限可能的骑行之旅</p>
          <p class="description">专业的骑行路线规划与分享平台</p>
        </div>
        <div class="footer-right">
          <div class="social-links">
            <button @click="refreshWallpaper" class="refresh-wallpaper-btn" title="随机更换UHD超高清背景壁纸" @mouseenter="showTooltip = true" @mouseleave="showTooltip = false">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
              </svg>
              <div class="tooltip" v-if="showTooltip">
                UHD超高清背景图片来源于必应
              </div>
            </button>
            <a href="#" class="social-link" title="官方网站">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </a>
            <a href="#" class="social-link" title="联系我们">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, shallowReactive, onMounted, onUnmounted, nextTick, customRef } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import simplifiedAnalytics from '@/utils/simplifiedAnalytics'

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

// 视频播放器控制状态
const showVideo = ref(true) // 默认显示视频
const isVideoMinimized = ref(false)
const isVideoFullscreen = ref(false)

// 动态背景壁纸状态
const backgroundImage = ref('')
const backgroundLoading = ref(true)
const backgroundError = ref(false)

// 工具提示状态
const showTooltip = ref(false)

// 视频控制方法
const toggleVideo = () => {
  showVideo.value = !showVideo.value
  if (!showVideo.value) {
    isVideoMinimized.value = false
    isVideoFullscreen.value = false
  }
}

const toggleMinimize = () => {
  isVideoMinimized.value = !isVideoMinimized.value
  if (isVideoMinimized.value) {
    isVideoFullscreen.value = false
  }
}

const toggleFullscreen = () => {
  isVideoFullscreen.value = !isVideoFullscreen.value
  if (isVideoFullscreen.value) {
    isVideoMinimized.value = false
  }
}

// 必应壁纸API相关方法 - UHD超高清版本
const fetchBingWallpaper = async () => {
  try {
    backgroundLoading.value = true
    backgroundError.value = false
    
    // 使用直接可用的必应壁纸URL（UHD超高清版本）
    const imageUrl = 'https://bing.img.run/uhd.php'
    
    // 预加载图片以确保加载成功
    const img = new Image()
    img.onload = () => {
      backgroundImage.value = imageUrl
      backgroundLoading.value = false
      console.log('✅ 必应UHD壁纸加载成功')
    }
    
    img.onerror = () => {
      console.warn('⚠️ 必应UHD壁纸加载失败，使用渐变背景')
      useFallbackBackground()
    }
    
    // 添加时间戳避免缓存问题
    img.src = `${imageUrl}?t=${Date.now()}`
    
  } catch (error) {
    console.warn('⚠️ 必应UHD壁纸请求失败:', error.message)
    useFallbackBackground()
  }
}

// 备用方案：渐变背景
const useFallbackBackground = () => {
  backgroundImage.value = ''
  backgroundLoading.value = false
  backgroundError.value = true
}

// 随机刷新壁纸 - 使用UHD超高清随机历史壁纸
const refreshWallpaper = async () => {
  try {
    backgroundLoading.value = true
    backgroundError.value = false
    
    // 使用随机必应历史壁纸UHD超高清URL，添加多重随机参数确保每次都不同
    const randomParam = Math.random().toString(36).substring(2, 15)
    const timestamp = Date.now()
    const imageUrl = `https://bing.img.run/rand_uhd.php?r=${randomParam}&t=${timestamp}&cache=${Math.floor(Math.random() * 10000)}`
    
    const img = new Image()
    img.onload = () => {
      // 强制更新背景图片，即使URL相同也要重新渲染
      backgroundImage.value = ''
      setTimeout(() => {
        backgroundImage.value = imageUrl
        backgroundLoading.value = false
        console.log('✅ 随机UHD壁纸加载成功')
      }, 50)
    }
    
    img.onerror = () => {
      console.warn('⚠️ 随机UHD壁纸加载失败')
      useFallbackBackground()
    }
    
    img.src = imageUrl
    
  } catch (error) {
    console.warn('⚠️ 随机UHD壁纸请求失败:', error.message)
    useFallbackBackground()
  }
}

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
    console.log('✅ 图片预加载完成')
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
    console.error('获取主页图片数据失败:', error)
    throw error
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

// 抑制第三方脚本错误和开发者工具警告
const suppressThirdPartyErrors = () => {
  // 捕获并忽略第三方脚本相关的错误
  window.addEventListener('error', (e) => {
    const errorSources = ['bilibili', 's1.hdslb.com', 'devtools', 'chrome-extension', 'bili-user-fingerprint']
    if (e.filename && errorSources.some(source => e.filename.includes(source))) {
      console.log('🔇 第三方脚本错误已抑制:', e.message)
      e.preventDefault()
      return false
    }
    
    // 检查错误消息内容
    if (e.message && errorSources.some(source => e.message.includes(source))) {
      console.log('🔇 第三方错误消息已抑制:', e.message)
      e.preventDefault()
      return false
    }
  })
  
  // 捕获未处理的Promise拒绝
  window.addEventListener('unhandledrejection', (e) => {
    const errorSources = ['bilibili', 's1.hdslb.com', 'devtools', 'runtime.lastError', 'bili-user-fingerprint', 'report is not found']
    if (e.reason) {
      const reasonStr = e.reason.toString()
      if (errorSources.some(source => reasonStr.includes(source))) {
        console.log('🔇 第三方Promise拒绝已抑制:', e.reason)
        e.preventDefault()
        return false
      }
    }
  })
  
  // 抑制Chrome扩展相关的运行时错误
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    try {
      Object.defineProperty(chrome.runtime, 'lastError', {
        get: function() {
          return undefined
        },
        configurable: true
      })
    } catch (error) {
      // 忽略设置失败
    }
  }
  
  // 抑制console中的bilibili相关错误
  const originalConsoleError = console.error
  console.error = function(...args) {
    const message = args.join(' ')
    if (message.includes('bilibili') || message.includes('bili-user-fingerprint')) {
      console.log('🔇 Bilibili控制台错误已抑制:', message)
      return
    }
    originalConsoleError.apply(console, args)
  }
}

// 动态设置单车骑行主题cursor
const setupBicycleCursors = () => {
  // 使用内联SVG创建单车主题的cursor
  const createBicycleCursor = (svgContent, hotspotX = 16, hotspotY = 16) => {
    const svgBase64 = btoa(unescape(encodeURIComponent(svgContent)))
    return `url("data:image/svg+xml;base64,${svgBase64}") ${hotspotX} ${hotspotY}, auto`
  }
  
  // 单车主题SVG图标定义
  const bicycleCursors = {
    // 默认箭头 - 简约单车轮廓
    arrow: createBicycleCursor(`
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <g fill="#2E7D32" stroke="#1B5E20" stroke-width="2">
          <!-- 车轮 -->
          <circle cx="8" cy="20" r="6" fill="none"/>
          <circle cx="24" cy="20" r="6" fill="none"/>
          <!-- 车架 -->
          <path d="M8 20 L16 8 L24 20 M16 8 L20 12 M12 16 L20 16" fill="none"/>
          <!-- 车座 -->
          <rect x="10" y="7" width="4" height="2" rx="1"/>
        </g>
      </svg>
    `, 16, 16),
    
    // 手型指针 - 骑行手势
    hand: createBicycleCursor(`
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <g fill="#388E3C" stroke="#2E7D32" stroke-width="1.5">
          <!-- 手掌 -->
          <ellipse cx="16" cy="18" rx="8" ry="6"/>
          <!-- 握把 -->
          <rect x="12" y="10" width="8" height="3" rx="1.5" fill="#795548"/>
          <!-- 骑行动作线条 -->
          <path d="M8 22 Q16 26 24 22" fill="none" stroke="#4CAF50" stroke-width="2"/>
        </g>
      </svg>
    `, 16, 16),
    
    // 文本选择 - 路标样式
    text: createBicycleCursor(`
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <g fill="#1976D2" stroke="#0D47A1" stroke-width="1.5">
          <!-- 路标柱 -->
          <rect x="15" y="8" width="2" height="20"/>
          <!-- 路标板 -->
          <rect x="8" y="6" width="16" height="8" rx="2"/>
          <!-- 文字线条 -->
          <line x1="10" y1="9" x2="22" y2="9" stroke="#fff" stroke-width="1"/>
          <line x1="10" y1="11" x2="20" y2="11" stroke="#fff" stroke-width="1"/>
        </g>
      </svg>
    `, 16, 16),
    
    // 等待指针 - 转动的车轮
    wait: createBicycleCursor(`
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <g fill="#FF5722" stroke="#D84315" stroke-width="2">
          <!-- 外圈 -->
          <circle cx="16" cy="16" r="10" fill="none"/>
          <!-- 辐条（动态感） -->
          <path d="M16 6 L16 26 M6 16 L26 16 M10.3 10.3 L21.7 21.7 M21.7 10.3 L10.3 21.7" fill="none"/>
          <!-- 中心轮毂 -->
          <circle cx="16" cy="16" r="3"/>
        </g>
      </svg>
    `, 16, 16),
    
    // 移动指针 - 骑行方向箭头
    move: createBicycleCursor(`
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <g fill="#8BC34A" stroke="#558B2F" stroke-width="2">
          <!-- 主箭头 -->
          <path d="M8 16 L24 16 M20 12 L24 16 L20 20" fill="none"/>
          <!-- 车轮轨迹 -->
          <circle cx="8" cy="12" r="2" fill="none" opacity="0.6"/>
          <circle cx="8" cy="20" r="2" fill="none" opacity="0.6"/>
          <!-- 运动线条 -->
          <path d="M2 14 Q6 16 2 18" fill="none" stroke-width="1"/>
        </g>
      </svg>
    `, 16, 16)
  }
  
  // 应用cursor设置（带重试机制）
  const applyCursors = () => {
    const homepageElement = document.querySelector('.homepage')
    if (!homepageElement) {
      console.log('⏳ Homepage元素还未准备好，500ms后重试...')
      setTimeout(applyCursors, 500)
      return
    }
    
    try {
      // 设置默认单车cursor
      homepageElement.style.cursor = bicycleCursors.arrow
      
      // 为普通子元素设置单车cursor
      const allElements = homepageElement.querySelectorAll('*')
      allElements.forEach(el => {
        if (!el.classList.contains('card-button') && 
            !el.classList.contains('box') &&
            !el.classList.contains('loading') &&
            !el.classList.contains('text-selectable')) {
          el.style.cursor = bicycleCursors.arrow
        }
      })
      
      // 为按钮和卡片设置骑行手势cursor
      const interactiveElements = homepageElement.querySelectorAll('.card-button, .box')
      interactiveElements.forEach(el => {
        el.style.cursor = bicycleCursors.hand
      })
      
      // 为等待状态设置转动车轮cursor
      const loadingElements = homepageElement.querySelectorAll('.loading')
      loadingElements.forEach(el => {
        el.style.cursor = bicycleCursors.wait
      })
      
      // 为文本选择设置路标cursor
      const textElements = homepageElement.querySelectorAll('.text-selectable')
      textElements.forEach(el => {
        el.style.cursor = bicycleCursors.text
      })
      
      console.log('✅ 单车主题cursor设置完成')
    } catch (error) {
      console.error('❌ 设置单车cursor时出错:', error)
    }
  }
  
  // 延迟执行以确保DOM已准备好
  setTimeout(applyCursors, 100)
}

// 组件挂载后初始化
onMounted(async () => {
  // 页面加载 - 不再记录通用页面访问，只记录有价值的用户行为
  
  // 抑制第三方脚本错误和开发者工具警告
  suppressThirdPartyErrors()
  
  // 设置单车骑行主题cursor
  nextTick(() => {
    setupBicycleCursors()
  })
  
  // 优先加载背景壁纸
  await fetchBingWallpaper()
  
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
      if (fps < 20) {
        console.warn('⚠️ 性能警告: FPS过低', fps)
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
      const bgElement = card?.querySelector('.card-bg')
      
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
  const bgElement = card?.querySelector('.card-bg')
  
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
    if (el) {
      delete el._cachedRect
      const bgElement = el.querySelector('.card-bg')
      if (bgElement) {
        bgElement.style.transform = 'translate3d(0px, 0px, 0px)'
      }
    }
  })
  
  // 停止调度器
  if (scheduler) {
    scheduler.tasks = []
    scheduler.isRunning = false
  }
})

// 卡片按钮点击处理（支持不同页面跳转）
const handleCardClick = (image, index, event) => {
  // 不再记录通用点击行为，只记录有价值的导航和路线相关行为
  
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
  font-family: "Raleway", "Microsoft YaHei", sans-serif;
  font-weight: 500;
  -webkit-font-smoothing: antialiased;
  padding: 40px 0 0 0;
  margin: 0 !important;
  position: relative;
  left: 0;
  right: 0;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

/* CSS中不设置cursor，完全由JavaScript动态设置 */

/* 所有cursor都由JavaScript动态设置，CSS不参与 */

/* 动态背景装饰样式 */
.background-decoration {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  overflow: hidden;
}

/* 动态壁纸背景 */
.bg-wallpaper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0;
  transition: opacity 1s ease-in-out;
  filter: brightness(0.8) contrast(1.1);
}

.bg-wallpaper:not(.loading):not(.error) {
  opacity: 1;
}

.bg-wallpaper.loading {
  opacity: 0.3;
  filter: blur(2px) brightness(0.6);
}

.bg-wallpaper.error {
  opacity: 0;
}

/* 备用渐变背景 */
.bg-gradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, 
    #2E7D32 0%, 
    #388E3C 25%, 
    #4CAF50 50%, 
    #66BB6A 75%, 
    #81C784 100%);
  opacity: 0.9;
  transition: opacity 1s ease-in-out;
}

.bg-gradient.hidden {
  opacity: 0;
}

/* 装饰图案覆盖层 */
.bg-pattern {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.04) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.1) 0%, transparent 50%);
  background-size: 400px 400px, 300px 300px, 200px 200px;
  animation: patternFloat 20s ease-in-out infinite;
  opacity: 0.6;
  mix-blend-mode: overlay;
}

.floating-elements {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.floating-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  animation: float 6s ease-in-out infinite;
}

.circle-1 {
  width: 80px;
  height: 80px;
  top: 20%;
  left: 10%;
  animation-delay: 0s;
  animation-duration: 8s;
}

.circle-2 {
  width: 120px;
  height: 120px;
  top: 60%;
  right: 15%;
  animation-delay: -2s;
  animation-duration: 10s;
}

.circle-3 {
  width: 60px;
  height: 60px;
  top: 80%;
  left: 70%;
  animation-delay: -4s;
  animation-duration: 6s;
}

@keyframes patternFloat {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(10px, -10px) rotate(1deg); }
  50% { transform: translate(-5px, 5px) rotate(-1deg); }
  75% { transform: translate(-10px, -5px) rotate(0.5deg); }
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

/* 背景加载状态 */
.bg-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  z-index: 10;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.bg-loading p {
  margin: 0;
  font-size: 14px;
  font-weight: 300;
  letter-spacing: 1px;
}

/* 版权栏中的刷新按钮样式 */
.refresh-wallpaper-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.8);
  padding: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  position: relative;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.refresh-wallpaper-btn:hover {
  background: rgba(76, 175, 80, 0.2);
  border-color: rgba(76, 175, 80, 0.4);
  color: white;
  box-shadow: 0 5px 15px rgba(76, 175, 80, 0.3);
}

.refresh-wallpaper-btn:hover svg {
  transform: rotate(180deg) scale(1.1);
  transition: transform 0.3s ease;
}

/* 工具提示样式 */
.tooltip {
  position: absolute;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 1000;
  animation: tooltipFadeIn 0.2s ease-in-out;
}

.tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: rgba(0, 0, 0, 0.8);
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* 视频播放器小窗口样式 */
.video-player-widget {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 12px;
  overflow: hidden;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.video-player-widget.hidden {
  width: 60px;
  height: 40px;
}

.video-player-widget.minimized {
  width: 60px;
  height: 40px;
}

.video-player-widget:not(.hidden):not(.minimized):not(.fullscreen) {
  width: 320px;
  height: 220px;
}

.video-player-widget.fullscreen {
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  width: 100vw !important;
  height: 100vh !important;
  border-radius: 0;
  z-index: 9999;
}

.video-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background: rgba(0, 0, 0, 0.5);
  gap: 8px;
}

.video-player-widget.fullscreen .video-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 8px;
  z-index: 10001;
}

.control-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: white;
  padding: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.video-container {
  width: 100%;
  height: calc(100% - 40px);
  position: relative;
}

.video-player-widget.fullscreen .video-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.video-container .video-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

/* 视频播放器响应式设计 */
@media (max-width: 768px) {
  .video-player-widget:not(.fullscreen) {
    bottom: 15px;
    right: 15px;
  }
  
  .video-player-widget:not(.hidden):not(.minimized):not(.fullscreen) {
    width: 280px;
    height: 180px;
  }
}

@media (max-width: 480px) {
  .video-player-widget:not(.fullscreen) {
    bottom: 10px;
    right: 10px;
  }
  
  .video-player-widget:not(.hidden):not(.minimized):not(.fullscreen) {
    width: 240px;
    height: 150px;
  }
  
  .video-player-widget.hidden,
  .video-player-widget.minimized {
    width: 50px;
    height: 35px;
  }
  
  .control-btn {
    padding: 4px;
  }
}

/* 主标题 - 纯文字强辨识度设计 */
.title {
  font-family: "Impact", "Arial Black", "Franklin Gothic Medium", "Trebuchet MS", sans-serif;
  font-size: 8rem;
  font-weight: 900;
  color: #ffffff;
  text-align: center;
  margin-bottom: 40px;
  position: relative;
  z-index: 10;
  letter-spacing: 8px;
  text-transform: uppercase;
  transition: all 0.3s ease;
  font-stretch: expanded;
  /* 强辨识度文字阴影 */
  text-shadow: 
    /* 主要阴影 - 深色轮廓 */
    -3px -3px 0 #1B5E20,
    3px -3px 0 #1B5E20,
    -3px 3px 0 #1B5E20,
    3px 3px 0 #1B5E20,
    /* 中层阴影 - 增强立体感 */
    -6px -6px 0 #0D4E14,
    6px -6px 0 #0D4E14,
    -6px 6px 0 #0D4E14,
    6px 6px 0 #0D4E14,
    /* 外层发光 */
    0 0 20px rgba(76, 175, 80, 0.8),
    0 0 40px rgba(76, 175, 80, 0.6),
    0 0 60px rgba(76, 175, 80, 0.4),
    /* 深度阴影 */
    0 10px 30px rgba(0, 0, 0, 0.5);
}

.title:hover {
  transform: translateY(-5px) scale(1.03);
  /* 增强悬停时的发光效果 */
  text-shadow: 
    /* 主要阴影 - 深色轮廓 */
    -3px -3px 0 #1B5E20,
    3px -3px 0 #1B5E20,
    -3px 3px 0 #1B5E20,
    3px 3px 0 #1B5E20,
    /* 中层阴影 - 增强立体感 */
    -6px -6px 0 #0D4E14,
    6px -6px 0 #0D4E14,
    -6px 6px 0 #0D4E14,
    6px 6px 0 #0D4E14,
    /* 增强的外层发光 */
    0 0 30px rgba(76, 175, 80, 1),
    0 0 60px rgba(76, 175, 80, 0.8),
    0 0 90px rgba(76, 175, 80, 0.6),
    /* 深度阴影 */
    0 15px 40px rgba(0, 0, 0, 0.6);
}

/* 容器 */
.container {
  display: flex;
  width: 100%;
  padding: 4% 2%;
  box-sizing: border-box;
  height: 80vh;
  margin-top: 2rem;
  position: relative;
  z-index: 5;
  flex: 1;
}

/* 卡片盒子 - 无人机旅游风格 */
.box {
  flex: 1;
  overflow: hidden;
  transition: flex 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s ease, box-shadow 0.3s ease;
  margin: 0 2%;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15), 
              0 5px 15px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
  line-height: 0;
  position: relative;
  border-radius: 20px;
  will-change: flex;
  transform: translateZ(0);
  backface-visibility: hidden;
  -webkit-perspective: 1000px;
  perspective: 1000px;
  contain: layout style paint;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.box:hover {
  flex: 1 1 50%;
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25), 
              0 10px 25px rgba(0, 0, 0, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.15);
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
  background: linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.6) 60%, rgba(0, 0, 0, 0.2) 100%);
}

.box:hover .card-button {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}

.card-button:hover {
  transform: translateY(-2px) scale(1.05);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 25px rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
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

/* 卡片背景 - 无人机旅游风格 */
.card-bg {
  width: 200%;
  height: 100%;
  object-fit: cover;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1), height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
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
  opacity: 0.85;
  border-radius: 20px;
  filter: saturate(1.1) contrast(1.05);
}

.box:hover .card-bg {
  opacity: 0.95;
  filter: saturate(1.2) contrast(1.1);
}

/* 卡片标题栏 - 无人机旅游风格 */
.card-title-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 10vh;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.4) 60%, rgba(0, 0, 0, 0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 25px;
  z-index: 2;
  transition: background 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateZ(0);
  backface-visibility: hidden;
  contain: layout style paint;
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 0 0 20px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
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
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 12px 24px 14px;
  border-radius: 25px;
  font-size: 2vh;
  font-weight: 400;
  transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease;
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
  letter-spacing: 1.5px;
  text-transform: uppercase;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
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
    font-size: 6rem;
    letter-spacing: 6px;
  }
  
  .container {
    height: 70vh;
  }
}

@media (max-width: 1024px) {
  .title {
    font-size: 5rem;
    letter-spacing: 5px;
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
    font-size: 4rem;
    letter-spacing: 4px;
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
    font-size: 3rem;
    letter-spacing: 3px;
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

/* 版权信息区域样式 */
.footer {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.05) 100%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 30px 0;
  margin-top: auto;
  position: relative;
  z-index: 10;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.footer-left {
  flex: 1;
  min-width: 300px;
}

.footer-right {
  display: flex;
  align-items: center;
}

.copyright {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
  font-weight: 500;
  margin: 0 0 8px 0;
  font-family: "Raleway", "Microsoft YaHei", sans-serif;
  letter-spacing: 0.5px;
}

.description {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  font-weight: 300;
  margin: 0;
  font-family: "Lato", "Microsoft YaHei", sans-serif;
  letter-spacing: 0.3px;
}

.social-links {
  display: flex;
  gap: 15px;
  align-items: center;
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.social-link:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
  color: white;
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 5px 15px rgba(255, 255, 255, 0.1);
}

/* 版权信息响应式设计 */
@media (max-width: 768px) {
  .footer-content {
    flex-direction: column;
    text-align: center;
    padding: 0 20px;
  }
  
  .footer-left {
    min-width: auto;
    width: 100%;
  }
  
  .copyright {
    font-size: 0.9rem;
  }
  
  .description {
    font-size: 0.8rem;
  }
  
  .social-links {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .footer {
    padding: 20px 0;
  }
  
  .copyright {
    font-size: 0.8rem;
    margin-bottom: 5px;
  }
  
  .description {
    font-size: 0.7rem;
  }
  
  .social-link {
    width: 35px;
    height: 35px;
  }
  
  .social-links {
    gap: 10px;
  }
}

</style>