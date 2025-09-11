import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// 企业级性能配置
const app = createApp(App, {
  // 启用性能追踪
  performance: true,
  // 关闭开发工具
  devtools: false,
  // 关闭生产提示
  productionTip: false
})

// 全局性能优化配置
app.config.performance = true
app.config.globalProperties.$nextTick = app.config.globalProperties.$nextTick

app.use(router)

// 优化挂载过程
const mount = () => {
  requestIdleCallback(() => {
    app.mount('#app')
  }, { timeout: 100 })
}

// 检查DOM是否准备就绪
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount)
} else {
  mount()
}
