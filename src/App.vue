<script setup>
</script>

<template>
  <router-view></router-view>
</template>

<style>
/* 全局重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 确保不覆盖组件的自定义cursor样式 */
* {
  cursor: inherit;
}

/* 全局默认cursor设置 */
body {
  cursor: auto;
}

html {
  width: 100%;
  height: 100%;
  font-family: 'Montserrat', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow-x: hidden;
  /* 移除全局背景，让各页面自行控制背景 */
}

body {
  width: 100%;
  height: 100%;
  font-family: 'Montserrat', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow-x: hidden;
  /* 恢复默认背景，让各页面自行控制 */
}

/* 确保#app完全填满屏幕 */
#app {
  width: 100vw !important;
  height: 100vh;
  position: relative;
  margin: 0 !important;
  padding: 0 !important;
  max-width: none !important;
  /* 让各页面组件控制自己的背景 */
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
  /* 地图页面的特殊设置 */
}
</style>
