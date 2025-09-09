<template>
  <div class="map-wrapper">
    <div id="container"></div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'

// 配置安全密钥
window._AMapSecurityConfig = {
  securityJsCode: '256b04738eb486d0bcb6a88487921c4f'
}

// 初始化地图
const initMap = async () => {
  try {
    const AMap = await AMapLoader.load({
      key: 'b7fb4f223f6cbffc2d995a508d10f7cd',
      version: '2.0'
    })

    const map = new AMap.Map('container', {
      viewMode: '2D',
      zoom: 11,
      center: [116.397428, 39.90923], // 默认中心点，后续可以调整
      mapStyle: 'amap://styles/whitesmoke',
      dragEnable: true,      // 启用地图拖拽
      zoomEnable: true,      // 启用地图缩放
      doubleClickZoom: true, // 启用双击放大
      keyboard: true,        // 启用键盘操作
      scrollWheel: true      // 启用鼠标滚轮缩放
    })

    return map
  } catch (error) {
    console.error('地图加载失败：', error)
  }
}

// 组件挂载后初始化地图
onMounted(() => {
  // 为独立地图页面添加特殊类名
  if (window.location.pathname === '/map') {
    document.body.classList.add('map-body')
    document.getElementById('app').classList.add('map-page')
  }

  // 动态加载高德地图 API
  const script = document.createElement('script')
  script.src = 'https://webapi.amap.com/loader.js'
  script.async = true
  script.onload = () => {
    initMap()
  }
  document.head.appendChild(script)

  // 组件卸载时移除类名
  return () => {
    document.body.classList.remove('map-body')
    document.getElementById('app').classList.remove('map-page')
  }
})
</script>

<style>
/* 基础样式 */
.map-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

#container {
  width: 100%;
  height: 100%;
}

/* 地图容器样式 */
:deep(.amap-container) {
  width: 100% !important;
  height: 100% !important;
}

/* 独立地图页面样式 */
:global(.map-page) .map-wrapper,
:global(.map-page) #container,
:global(.map-page) :deep(.amap-container) {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  margin: 0 !important;
  padding: 0 !important;
}
</style>
