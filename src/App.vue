<script setup>
import Homepage from './components/Homepage.vue'
</script>

<template>
  <Homepage />
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

/* 确保16:9比例的网页显示 */
@media screen and (min-aspect-ratio: 16/9) {
  body {
    background: #000;
  }
  
  #app {
    max-width: 177.78vh; /* 16:9 比例 */
    margin: 0 auto;
    background: #fff;
  }
}
</style>
