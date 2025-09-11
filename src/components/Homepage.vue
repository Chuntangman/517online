<template>
  <div class="homepage">
    <!-- 主标题区域 -->
    <h1 class="title">517骑行驿站</h1>

    <!-- 卡片容器 -->
    <div class="container">
      <div 
        v-for="(image, index) in images" 
        :key="image.id"
        class="card-wrap"
        @mousemove="handleMouseMove($event, index)"
        @mouseenter="handleMouseEnter(index)"
        @mouseleave="handleMouseLeave(index)"
        :ref="`card-${index}`"
      >
        <div class="card" :style="getCardStyle(index)">
          <div 
            class="card-bg" 
            :style="[getCardBgTransform(index), getCardBgImage(image['存储(根目录路径)'])]"
          ></div>
          <div class="card-info">
            <h1>{{ image['图片名'] }}</h1>
            <p>{{ image['介绍'] }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 开始骑行之旅按钮 -->
    <div class="cta-section">
      <button 
        class="cta-button"
        @click="startJourney"
      >
        开始骑行之旅
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

// 初始化路由
const router = useRouter()

// 图片数据
const images = ref([])

// 卡片数据
const cardData = reactive({})

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

// 组件挂载后初始化
onMounted(async () => {
  await fetchHomepageImages()
  
  // 初始化卡片尺寸
  setTimeout(() => {
    images.value.forEach((_, index) => {
      const cardElement = document.querySelector(`.card-wrap:nth-child(${index + 1})`)
      if (cardElement) {
        cardData[index].width = cardElement.offsetWidth
        cardData[index].height = cardElement.offsetHeight
      }
    })
  }, 50)
})


// 获取卡片旋转样式（优化版）
const getCardStyle = (cardIndex) => {
  if (!cardData[cardIndex] || !cardData[cardIndex].width) return { transform: 'rotateY(0deg) rotateX(0deg)' }
  
  const { mouseX, mouseY, width, height } = cardData[cardIndex]
  const mousePX = mouseX / width
  const mousePY = mouseY / height
  
  const rX = mousePX * 30
  const rY = mousePY * -30
  
  return {
    transform: `rotateY(${rX}deg) rotateX(${rY}deg)`
  }
}

// 获取卡片背景移动样式（优化版）
const getCardBgTransform = (cardIndex) => {
  if (!cardData[cardIndex] || !cardData[cardIndex].width) return { transform: 'translateX(0px) translateY(0px)' }
  
  const { mouseX, mouseY, width, height } = cardData[cardIndex]
  const mousePX = mouseX / width
  const mousePY = mouseY / height
  
  const tX = mousePX * -40
  const tY = mousePY * -40
  
  return {
    transform: `translateX(${tX}px) translateY(${tY}px)`
  }
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

// 节流函数
const throttle = (func, limit) => {
  let inThrottle
  return function() {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 处理鼠标移动（节流优化）
const handleMouseMove = throttle((e, cardIndex) => {
  if (!cardData[cardIndex]) return
  
  const card = e.currentTarget
  const rect = card.getBoundingClientRect()
  
  cardData[cardIndex].mouseX = e.clientX - rect.left - cardData[cardIndex].width / 2
  cardData[cardIndex].mouseY = e.clientY - rect.top - cardData[cardIndex].height / 2
}, 16) // 约60fps

// 处理鼠标进入
const handleMouseEnter = (cardIndex) => {
  if (cardData[cardIndex]) {
    clearTimeout(cardData[cardIndex].mouseLeaveDelay)
  }
}

// 处理鼠标离开
const handleMouseLeave = (cardIndex) => {
  if (cardData[cardIndex]) {
    cardData[cardIndex].mouseLeaveDelay = setTimeout(() => {
      cardData[cardIndex].mouseX = 0
      cardData[cardIndex].mouseY = 0
    }, 1000)
  }
}

// 开始骑行之旅按钮点击事件
const startJourney = () => {
  router.push('/route')
}
</script>

<style scoped>
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
  padding: 40px 80px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

/* 卡片包装器 */
.card-wrap {
  margin: 10px;
  transform: perspective(800px);
  transform-style: preserve-3d;
  cursor: pointer;
  will-change: transform;
  backface-visibility: hidden;
}

.card-wrap:hover .card-info {
  transform: translateY(0);
}

.card-wrap:hover .card-info p {
  opacity: 1;
}

.card-wrap:hover .card-info,
.card-wrap:hover .card-info p {
  transition: 0.6s var(--hover-easing);
}

.card-wrap:hover .card-info:after {
  transition: 5s var(--hover-easing);
  opacity: 1;
  transform: translateY(0);
}

.card-wrap:hover .card-bg {
  transition: 
    0.6s var(--hover-easing),
    opacity 5s var(--hover-easing);
  opacity: 0.8;
}

.card-wrap:hover .card {
  transition:
    0.6s var(--hover-easing),
    box-shadow 2s var(--hover-easing);
  box-shadow:
    rgba(255, 255, 255, 0.2) 0 0 40px 5px,
    rgba(255, 255, 255, 1) 0 0 0 1px,
    rgba(0, 0, 0, 0.66) 0 30px 60px 0,
    inset #333 0 0 0 5px,
    inset white 0 0 0 6px;
}

/* 卡片 */
.card {
  position: relative;
  flex: 0 0 240px;
  width: 240px;
  height: 320px;
  background-color: transparent;
  overflow: hidden;
  border-radius: 10px;
  box-shadow:
    rgba(0, 0, 0, 0.66) 0 30px 60px 0,
    inset #333 0 0 0 5px,
    inset rgba(255, 255, 255, 0.5) 0 0 0 6px;
  transition: 1s var(--return-easing);
  transform: translateZ(0);
  will-change: transform, box-shadow;
}

/* 卡片背景 */
.card-bg {
  opacity: 0.5;
  position: absolute;
  top: -20px;
  left: -20px;
  width: calc(100% + 40px);
  height: calc(100% + 40px);
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  transition:
    1s var(--return-easing),
    opacity 5s 1s var(--return-easing);
  pointer-events: none;
  transform: translateZ(0);
  will-change: transform, opacity;
}

/* 卡片信息 */
.card-info {
  padding: 20px;
  position: absolute;
  bottom: 0;
  color: var(--text-white);
  transform: translateY(40%);
  transition: 0.6s 1.6s cubic-bezier(0.215, 0.61, 0.355, 1);
  will-change: transform, opacity;
  backface-visibility: hidden;
}

.card-info p {
  opacity: 0;
  text-shadow: rgba(0, 0, 0, 1) 0 2px 3px;
  transition: 0.6s 1.6s cubic-bezier(0.215, 0.61, 0.355, 1);
  line-height: 1.5em;
  margin-top: 10px;
}

.card-info * {
  position: relative;
  z-index: 1;
}

.card-info:after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  background-image: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.6) 100%);
  background-blend-mode: overlay;
  opacity: 0;
  transform: translateY(100%);
  transition: 5s 1s var(--return-easing);
}

.card-info h1 {
  font-family: "Playfair Display", "Microsoft YaHei", serif;
  font-size: 36px;
  font-weight: 700;
  text-shadow: rgba(0, 0, 0, 0.5) 0 10px 10px;
}

/* CTA区域 */
.cta-section {
  text-align: center;
  margin-top: 60px;
}

.cta-button {
  background: linear-gradient(135deg, var(--primary-text), #4E342E);
  color: var(--text-white);
  border: none;
  padding: 18px 40px;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s var(--hover-easing);
  box-shadow: 0 8px 25px rgba(93, 64, 55, 0.3);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-family: "Raleway", sans-serif;
  will-change: transform, box-shadow;
  backface-visibility: hidden;
}

.cta-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 35px rgba(93, 64, 55, 0.4);
  background: linear-gradient(135deg, #4E342E, var(--primary-text));
}

.cta-button:active {
  transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .container {
    padding: 40px 60px;
  }
  
  .title {
    font-size: 2.5rem;
  }
}

@media (max-width: 1024px) {
  .container {
    padding: 40px 40px;
  }
  
  .card {
    width: 220px;
    height: 300px;
  }
  
  .title {
    font-size: 2.2rem;
  }
}

@media (max-width: 768px) {
  .homepage {
    padding: 20px 0;
  }
  
  .container {
    padding: 20px;
    flex-direction: column;
    align-items: center;
  }
  
  .card {
    width: 280px;
    height: 350px;
  }
  
  .title {
    font-size: 2rem;
    margin-bottom: 30px;
  }
  
  .card-info h1 {
    font-size: 1.8rem;
  }
}

@media (max-width: 480px) {
  .card {
    width: 260px;
    height: 320px;
  }
  
  .title {
    font-size: 1.8rem;
  }
  
  .card-info h1 {
    font-size: 1.5rem;
  }
  
  .card-info p {
    font-size: 0.9rem;
  }
  
  .cta-button {
    padding: 15px 30px;
    font-size: 1rem;
  }
}
</style>