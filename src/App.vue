<script setup>
</script>

<template>
  <router-view></router-view>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  font-family: 'Montserrat', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow-x: hidden;
}

#app {
  width: 100vw;
  height: 100vh;
  position: relative;
}

/* 普通页面使用16:9比例 */
body:not(.map-body) #app {
  max-width: 1920px; /* 典型的16:9宽屏分辨率 */
  margin: 0 auto;
  background: #fff;
}

/* 地图页面使用全屏显示 */
body.map-body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}

body.map-body #app {
  width: 100vw;
  height: 100vh;
  max-width: 100%;
  margin: 0;
  background: #fff;
}
</style>
