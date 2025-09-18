<template>
  <div class="elevation-chart-container" :class="{ 'loading': loading }">
    <div class="chart-header">
      <h6>🏔️ 高程变化图</h6>
      <div class="chart-controls">
        <div class="chart-stats" v-if="!loading && hasValidData">
          <span class="stat-item">
            <span class="stat-label">最高:</span>
            <span class="stat-value max">{{ maxElevation }}m</span>
          </span>
          <span class="stat-item">
            <span class="stat-label">最低:</span>
            <span class="stat-value min">{{ minElevation }}m</span>
          </span>
          <span class="stat-item">
            <span class="stat-label">落差:</span>
            <span class="stat-value range">{{ elevationRange }}m</span>
          </span>
        </div>
        <div class="loading-stats" v-else-if="loading">
          <span class="loading-text">正在获取高程数据...</span>
        </div>
        <!-- 放大按钮 -->
        <button 
          v-if="!loading && hasValidData" 
          @click="toggleZoom"
          class="zoom-button"
          :title="isZoomed ? '退出全屏 (ESC)' : '放大图表'"
        >
          <svg v-if="!isZoomed" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
            <line x1="15" y1="11" x2="7" y2="11"></line>
            <line x1="11" y1="15" x2="11" y2="7"></line>
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 3v3a2 2 0 0 1-2 2H3"></path>
            <path d="m3 3 6 6"></path>
            <path d="m16 3 6 6"></path>
            <path d="M16 3v3a2 2 0 0 0 2 2h3"></path>
            <path d="M8 21v-3a2 2 0 0 1 2-2h3"></path>
            <path d="m3 21 6-6"></path>
            <path d="m21 21-6-6"></path>
            <path d="M16 21v-3a2 2 0 0 0-2-2h-3"></path>
          </svg>
        </button>
      </div>
    </div>
    
    <div class="chart-wrapper">
      <div v-if="loading" class="loading-placeholder">
        <div class="loading-spinner"></div>
        <p>加载高程数据中，请稍候...</p>
      </div>
      <div v-else-if="!hasValidData" class="no-data-placeholder">
        <p>暂无高程数据</p>
        <small>可能是网络问题或API超时</small>
      </div>
      <canvas
        v-else
        ref="chartCanvas"
        class="elevation-canvas"
        :key="`chart-${chartKey}`"
        width="800"
        height="400"
      ></canvas>
    </div>
    
    <!-- 图表说明 -->
    <div class="chart-legend">
      <div class="legend-item">
        <div class="legend-color ascent"></div>
        <span>爬升路段 (>5m)</span>
      </div>
      <div class="legend-item">
        <div class="legend-color descent"></div>
        <span>下降路段 (>5m)</span>
      </div>
      <div class="legend-item">
        <div class="legend-color flat"></div>
        <span>平缓路段 (±5m)</span>
      </div>
    </div>
    
    <!-- 全屏模态框 -->
    <teleport to="body">
      <div v-if="isZoomed" class="chart-modal-overlay" @click="toggleZoom">
        <div class="chart-modal" @click.stop>
          <div class="modal-header">
            <h4>🏔️ 高程变化图 - 详细视图</h4>
            <div class="modal-stats">
              <span class="stat-item">
                <span class="stat-label">最高:</span>
                <span class="stat-value max">{{ maxElevation }}m</span>
              </span>
              <span class="stat-item">
                <span class="stat-label">最低:</span>
                <span class="stat-value min">{{ minElevation }}m</span>
              </span>
              <span class="stat-item">
                <span class="stat-label">落差:</span>
                <span class="stat-value range">{{ elevationRange }}m</span>
              </span>
            </div>
            <button @click="toggleZoom" class="close-button" title="关闭 (ESC)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div class="modal-chart-wrapper">
            <canvas
              ref="modalChartCanvas"
              class="modal-elevation-canvas"
              width="1200"
              height="600"
            ></canvas>
          </div>
          
          <!-- 图表说明 -->
          <div class="modal-chart-legend">
            <div class="legend-item">
              <div class="legend-color ascent"></div>
              <span>爬升路段 (>5m)</span>
            </div>
            <div class="legend-item">
              <div class="legend-color descent"></div>
              <span>下降路段 (>5m)</span>
            </div>
            <div class="legend-item">
              <div class="legend-color flat"></div>
              <span>平缓路段 (±5m)</span>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

// 注册Chart.js组件
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend
)

// Props
const props = defineProps({
  elevationData: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// 响应式数据
const chartCanvas = ref(null)
const chartInstance = ref(null)
const chartKey = ref(0) // 用于强制重新渲染Canvas
const isZoomed = ref(false) // 放大状态
const modalChartCanvas = ref(null) // 模态框Canvas
const modalChartInstance = ref(null) // 模态框图表实例

// 计算属性
const maxElevation = computed(() => {
  if (!props.elevationData.length) return 0
  return Math.max(...props.elevationData.map(item => item.elevation))
})

const minElevation = computed(() => {
  if (!props.elevationData.length) return 0
  return Math.min(...props.elevationData.map(item => item.elevation))
})

const elevationRange = computed(() => {
  return maxElevation.value - minElevation.value
})

const hasValidData = computed(() => {
  return props.elevationData && props.elevationData.length > 0
})

// 根据高程变化计算颜色
const getElevationChangeColor = (current, next) => {
  if (!next) return '#4CAF50' // 最后一个点使用默认颜色
  
  const change = next - current
  const threshold = 5 // 5米的变化阈值
  
  if (change > threshold) {
    return '#f44336' // 红色：爬升
  } else if (change < -threshold) {
    return '#4CAF50' // 绿色：下降
  } else {
    return '#2196F3' // 蓝色：平缓
  }
}

// 处理图表数据
const processChartData = () => {
  if (!props.elevationData || !props.elevationData.length) {
    console.warn('无高程数据')
    return null
  }

  // 确保数据格式正确
  const validData = props.elevationData.filter(item => 
    item && 
    typeof item.distance === 'number' && 
    typeof item.elevation === 'number' &&
    !isNaN(item.distance) && 
    !isNaN(item.elevation) &&
    isFinite(item.distance) &&
    isFinite(item.elevation)
  )

  if (!validData.length) {
    console.warn('无有效高程数据')
    return null
  }

  console.log(`处理高程数据：原始 ${props.elevationData.length} 点，有效 ${validData.length} 点`)
  
  // 简单的数组格式，避免x/y对象格式的问题
  const elevations = validData.map(item => Number(item.elevation.toFixed(1)))
  const labels = validData.map(item => `${item.distance.toFixed(1)}km`)

  // 计算每个点的颜色
  const pointColors = elevations.map((elevation, index) => {
    const nextElevation = elevations[index + 1]
    return getElevationChangeColor(elevation, nextElevation)
  })

  // 计算线段颜色（基于整体趋势）
  const totalChange = elevations[elevations.length - 1] - elevations[0]
  let borderColor = '#4CAF50' // 默认绿色
  if (totalChange > 20) {
    borderColor = '#ff6b6b' // 整体爬升：红色
  } else if (totalChange < -20) {
    borderColor = '#51cf66' // 整体下降：绿色
  } else {
    borderColor = '#339af0' // 整体平缓：蓝色
  }

  console.log(`高程趋势分析：总变化 ${totalChange.toFixed(1)}m，线条颜色 ${borderColor}`)

  return {
    labels: labels,
    datasets: [{
      label: '海拔高度',
      data: elevations,
      borderColor: borderColor,
      backgroundColor: 'transparent',
      borderWidth: 3,
      fill: false,
      tension: 0.2,
      pointBackgroundColor: pointColors, // 每个点不同颜色
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 6, // 稍大的点以显示颜色
      pointHoverRadius: 8,
      pointHoverBackgroundColor: pointColors,
      pointHoverBorderColor: '#ffffff',
      pointHoverBorderWidth: 3,
      segment: {
        borderColor: (ctx) => {
          // 根据相邻两点的高程变化设置线段颜色
          const p0 = ctx.p0?.parsed?.y
          const p1 = ctx.p1?.parsed?.y
          if (p0 !== undefined && p1 !== undefined) {
            const change = p1 - p0
            if (change > 3) return '#f44336' // 爬升：红色
            if (change < -3) return '#4CAF50' // 下降：绿色
            return '#2196F3' // 平缓：蓝色
          }
          return borderColor
        }
      }
    }]
  }
}

// 创建渐变背景
const createGradient = () => {
  if (!chartCanvas.value) return 'rgba(76, 175, 80, 0.2)'
  
  const ctx = chartCanvas.value.getContext('2d')
  const gradient = ctx.createLinearGradient(0, 0, 0, 200) // 使用固定高度200
  gradient.addColorStop(0, 'rgba(76, 175, 80, 0.3)')
  gradient.addColorStop(0.5, 'rgba(76, 175, 80, 0.2)')
  gradient.addColorStop(1, 'rgba(76, 175, 80, 0.1)')
  return gradient
}

// 图表配置选项
const getChartOptions = () => ({
  responsive: false,
  maintainAspectRatio: false,
  devicePixelRatio: 1, // 固定像素比
  datasets: {
    line: {
      clip: false // 禁用clip
    }
  },
  interaction: {
    intersect: false,
    mode: 'point'
  },
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      enabled: true,
      mode: 'point',
      intersect: false,
      backgroundColor: 'rgba(45, 55, 72, 0.9)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: '#4CAF50',
      borderWidth: 1,
      cornerRadius: 6,
      displayColors: false,
      callbacks: {
        title: function(context) {
          try {
            const dataIndex = context[0].dataIndex
            return `距离: ${context[0].label}`
          } catch (e) {
            return '距离信息'
          }
        },
        label: function(context) {
          try {
            const elevation = context.parsed.y || context.raw
            return `海拔: ${elevation}m`
          } catch (e) {
            return `海拔: ${context.raw}m`
          }
        }
      }
    }
  },
  scales: {
    x: {
      type: 'category',
      display: true,
      clip: false,
      title: {
        display: true,
        text: '距离',
        color: '#666'
      },
      grid: {
        display: true,
        color: 'rgba(0, 0, 0, 0.1)'
      },
      ticks: {
        color: '#666',
        maxTicksLimit: 6
      }
    },
    y: {
      type: 'linear',
      display: true,
      clip: false,
      beginAtZero: false,
      title: {
        display: true,
        text: '海拔 (m)',
        color: '#666'
      },
      grid: {
        display: true,
        color: 'rgba(0, 0, 0, 0.1)'
      },
      ticks: {
        color: '#666',
        callback: function(value) {
          return Math.round(value) + 'm'
        }
      }
    }
  },
  elements: {
    point: {
      radius: 4,
      hoverRadius: 6,
      backgroundColor: '#4CAF50',
      borderColor: '#fff',
      borderWidth: 2
    },
    line: {
      tension: 0.3,
      borderWidth: 2
    }
  },
  animation: {
    duration: 0 // 禁用动画避免重绘问题
  }
})

// 销毁图表实例
const destroyChart = () => {
  if (chartInstance.value) {
    try {
      // 停止所有动画
      chartInstance.value.stop()
      // 销毁图表
      chartInstance.value.destroy()
    } catch (e) {
      console.warn('销毁图表时出错:', e)
    }
    chartInstance.value = null
  }
  
  // 清理Canvas
  if (chartCanvas.value) {
    try {
      const ctx = chartCanvas.value.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, chartCanvas.value.width, chartCanvas.value.height)
      }
    } catch (e) {
      console.warn('清理Canvas时出错:', e)
    }
  }
}

// 验证Canvas是否可用
const validateCanvas = (canvas) => {
  if (!canvas) {
    console.error('Canvas元素为null')
    return false
  }
  
  if (!(canvas instanceof HTMLCanvasElement)) {
    console.error('不是有效的Canvas元素')
    return false
  }
  
  try {
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.error('无法获取Canvas上下文')
      return false
    }
    
    // 测试Canvas是否可用
    ctx.save()
    ctx.restore()
    return true
  } catch (e) {
    console.error('Canvas上下文测试失败:', e)
    return false
  }
}

// 初始化图表
const initChart = async () => {
  try {
    if (!props.elevationData || !props.elevationData.length) {
      console.log('图表初始化跳过：无数据')
      return
    }

    // 销毁现有图表
    destroyChart()

    // 等待Vue更新DOM
    await nextTick()

    // 验证Canvas ref
    const canvas = chartCanvas.value
    if (!canvas) {
      console.error('Canvas ref为null，等待DOM更新')
      return
    }

    if (!(canvas instanceof HTMLCanvasElement)) {
      console.error('Canvas ref不是HTMLCanvasElement')
      return
    }

    // 重置Canvas尺寸和样式
    canvas.width = 800
    canvas.height = 400
    canvas.style.width = '100%'
    canvas.style.height = '200px'

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.error('无法获取Canvas 2D上下文')
      return
    }

    // 清理Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const chartData = processChartData()
    if (!chartData || !chartData.datasets || !chartData.datasets[0]) {
      console.warn('图表数据无效')
      return
    }

    console.log('创建图表，数据点数:', chartData.datasets[0].data.length)

    // 使用简化的Chart.js配置
    chartInstance.value = new Chart(ctx, {
      type: 'line',
      data: chartData,
      options: {
        responsive: false,
        maintainAspectRatio: false,
        animation: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            type: 'category',
            display: true,
            grid: { display: true },
            ticks: { maxTicksLimit: 8 }
          },
          y: {
            type: 'linear',
            display: true,
            beginAtZero: false,
            grid: { display: true }
          }
        },
        elements: {
          point: {
            radius: 4,
            hoverRadius: 6
          },
          line: {
            tension: 0.1,
            borderWidth: 2
          }
        }
      }
    })

    console.log('图表创建成功')
  } catch (error) {
    console.error('创建图表失败:', error)
    destroyChart()
  }
}

// 更新图表
const updateChart = () => {
  if (!chartInstance.value || !props.elevationData.length) return

  const chartData = processChartData()
  if (!chartData) return

  chartData.datasets[0].backgroundColor = createGradient()
  chartInstance.value.data = chartData
  chartInstance.value.update('active')
}

// 创建一个防抖的初始化函数
let initTimeout = null
const debouncedInit = () => {
  if (initTimeout) clearTimeout(initTimeout)
  initTimeout = setTimeout(async () => {
    await nextTick()
    initChart()
  }, 100)
}

// 监听数据变化
watch(() => props.elevationData, (newData) => {
  console.log('高程数据变化:', newData ? newData.length : 0, '个点')
  
  if (newData && newData.length > 0) {
    console.log('准备创建图表')
    debouncedInit()
  } else {
    // 如果没有数据，销毁图表
    destroyChart()
    console.log('无数据，销毁图表')
  }
}, { 
  deep: true, 
  immediate: false
})

// 初始化模态框图表
const initModalChart = async () => {
  await nextTick()
  
  const canvas = modalChartCanvas.value
  if (!canvas) {
    console.error('模态框Canvas ref为null')
    return
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    console.error('无法获取模态框Canvas 2D上下文')
    return
  }

  // 清理Canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const chartData = processChartData()
  if (!chartData) {
    console.warn('模态框图表数据无效')
    return
  }

  console.log('创建模态框图表')

  // 为模态框创建更详细的图表配置
  modalChartInstance.value = new Chart(ctx, {
    type: 'line',
    data: chartData,
    options: {
      responsive: false,
      maintainAspectRatio: false,
      animation: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: { 
          display: true,
          position: 'top',
          labels: {
            font: { size: 14 }
          }
        },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          titleFont: { size: 14 },
          bodyFont: { size: 13 }
        }
      },
      scales: {
        x: {
          type: 'category',
          display: true,
          grid: { 
            display: true,
            color: 'rgba(0,0,0,0.1)'
          },
          ticks: { 
            maxTicksLimit: 12,
            font: { size: 12 }
          },
          title: {
            display: true,
            text: '距离',
            font: { size: 14, weight: 'bold' }
          }
        },
        y: {
          type: 'linear',
          display: true,
          beginAtZero: false,
          grid: { 
            display: true,
            color: 'rgba(0,0,0,0.1)'
          },
          ticks: {
            font: { size: 12 }
          },
          title: {
            display: true,
            text: '海拔 (m)',
            font: { size: 14, weight: 'bold' }
          }
        }
      },
      elements: {
        point: {
          radius: 5,
          hoverRadius: 8
        },
        line: {
          tension: 0.2,
          borderWidth: 3
        }
      }
    }
  })

  console.log('模态框图表创建成功')
}

// 销毁模态框图表
const destroyModalChart = () => {
  if (modalChartInstance.value) {
    try {
      modalChartInstance.value.destroy()
    } catch (e) {
      console.warn('销毁模态框图表时出错:', e)
    }
    modalChartInstance.value = null
  }
}

// 放大/缩小功能
const toggleZoom = async () => {
  if (!isZoomed.value) {
    // 打开模态框
    isZoomed.value = true
    // 延迟创建模态框图表，等待DOM渲染
    setTimeout(() => {
      initModalChart()
    }, 100)
  } else {
    // 关闭模态框
    destroyModalChart()
    isZoomed.value = false
  }
}

// 键盘快捷键支持
const handleKeydown = (event) => {
  if (event.key === 'Escape' && isZoomed.value) {
    toggleZoom()
  }
}

// 组件挂载时添加键盘监听
onMounted(async () => {
  console.log('ElevationChart组件挂载')
  document.addEventListener('keydown', handleKeydown)
  await nextTick()
  
  if (props.elevationData && props.elevationData.length > 0) {
    console.log('挂载时有数据，初始化图表')
    // 短暂延迟确保DOM完全渲染
    setTimeout(() => {
      initChart()
    }, 100)
  } else {
    console.log('挂载时无数据，等待数据')
  }
})

// 组件卸载
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  destroyChart()
  destroyModalChart()
})
</script>

<style scoped>
.elevation-chart-container {
  width: 100%;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid rgba(76, 175, 80, 0.2);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.1);
  transition: all 0.3s ease;
}

.elevation-chart-container:hover {
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.15);
  transform: translateY(-1px);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.chart-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  justify-content: space-between;
}

.chart-header h6 {
  margin: 0;
  color: #2c3e50;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.chart-stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.stat-label {
  color: #666;
  font-weight: 500;
}

.stat-value {
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  background: #f8f9fa;
}

.stat-value.max {
  color: #f44336;
  background: #ffebee;
}

.stat-value.min {
  color: #4CAF50;
  background: #e8f5e9;
}

.stat-value.range {
  color: #ff9800;
  background: #fff3e0;
}

.chart-wrapper {
  position: relative;
  height: 200px;
  width: 100%;
  margin-bottom: 12px;
  min-height: 200px;
  overflow: hidden;
}

.elevation-canvas {
  width: 100% !important;
  height: 200px !important;
  border-radius: 4px;
  display: block;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #666;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-color.ascent {
  background: linear-gradient(45deg, #f44336, #ff6b6b);
}

.legend-color.descent {
  background: linear-gradient(45deg, #4CAF50, #51cf66);
}

.legend-color.flat {
  background: linear-gradient(45deg, #2196F3, #339af0);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .elevation-chart-container {
    padding: 12px;
  }
  
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .chart-stats {
    width: 100%;
    justify-content: space-between;
  }
  
  .chart-wrapper {
    height: 180px;
  }
  
  .legend-item {
    font-size: 10px;
  }
}

/* 加载状态和占位符 */
.loading-stats {
  display: flex;
  align-items: center;
  gap: 8px;
}

.loading-text {
  color: #4CAF50;
  font-size: 12px;
  font-weight: 500;
}

.loading-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #666;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e9ecef;
  border-top: 3px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.no-data-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #999;
  text-align: center;
}

.no-data-placeholder p {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 500;
}

.no-data-placeholder small {
  font-size: 12px;
  color: #ccc;
}

.elevation-chart-container.loading {
  opacity: 0.8;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 放大按钮样式 */
.zoom-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);
}

.zoom-button:hover {
  background: linear-gradient(135deg, #45a049, #388e3c);
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.4);
  transform: translateY(-1px);
}

.zoom-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);
}

/* 模态框样式 */
.chart-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

.chart-modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  max-width: 95vw;
  max-height: 95vh;
  width: 1200px;
  display: flex;
  flex-direction: column;
  animation: scaleIn 0.3s ease;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px 24px;
  border-bottom: 1px solid #e9ecef;
  flex-shrink: 0;
}

.modal-header h4 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
}

.modal-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.close-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: #f8f9fa;
  border: none;
  border-radius: 6px;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: #e9ecef;
  color: #495057;
}

.modal-chart-wrapper {
  flex: 1;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 500px;
}

.modal-elevation-canvas {
  max-width: 100%;
  max-height: 100%;
  border-radius: 8px;
}

.modal-chart-legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  padding: 16px 24px 20px 24px;
  border-top: 1px solid #e9ecef;
  flex-shrink: 0;
}

/* 动画效果 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chart-modal {
    width: 100%;
    height: 100%;
    border-radius: 0;
    max-width: 100vw;
    max-height: 100vh;
  }
  
  .modal-header {
    padding: 16px;
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .modal-stats {
    order: 3;
    width: 100%;
    justify-content: space-between;
  }
  
  .modal-chart-wrapper {
    padding: 12px 16px;
    min-height: 300px;
  }
  
  .modal-chart-legend {
    padding: 12px 16px;
    flex-wrap: wrap;
    gap: 16px;
  }
}
</style>
