# 轨迹回放功能组件

## 概述

基于高德地图API 2.0的轨迹回放功能，支持预设轨迹和自定义轨迹的加载与回放，提供完整的播放控制功能。

## 功能特性

### 🎬 核心功能
- **轨迹加载**: 支持预设轨迹和自定义轨迹
- **回放控制**: 开始、暂停、继续、停止功能
- **实时状态**: 显示回放进度、时间、当前位置
- **可视化**: 轨迹路径、移动标记、已走轨迹显示
- **参数设置**: 回放速度、旋转方向、轨迹显示控制

### 🎮 交互方式
1. **预设轨迹**: 选择内置的轨迹数据
2. **自定义轨迹**: 输入JSON格式的轨迹点数据
3. **参数调节**: 回放速度、显示选项可调节
4. **实时控制**: 支持播放过程中的暂停、继续操作

### 📊 预设轨迹
- **北京市区路线**: 典型城市行驶轨迹
- **环形测试路线**: 简单测试用环形路径
- **长安街东西向**: 长安街方向轨迹
- **复杂城市路线**: 包含转弯的复杂轨迹

## 组件使用

### 1. 独立使用TrajectoryPlayback组件

```vue
<template>
  <div>
    <TrajectoryPlayback 
      :map-instance="mapInstance"
      :visible="showTrajectory"
      @trajectory-loaded="handleTrajectoryLoaded"
      @playback-started="handlePlaybackStarted"
      @playback-paused="handlePlaybackPaused"
      @playback-stopped="handlePlaybackStopped"
      @playback-completed="handlePlaybackCompleted"
      ref="trajectoryPlaybackRef"
    />
  </div>
</template>

<script setup>
import TrajectoryPlayback from '@/components/TrajectoryPlayback.vue'

const mapInstance = ref(null)
const showTrajectory = ref(true)
const trajectoryPlaybackRef = ref(null)

const handleTrajectoryLoaded = (data) => {
  console.log('轨迹加载完成:', data)
}

const handlePlaybackStarted = () => {
  console.log('回放开始')
}

const handlePlaybackCompleted = () => {
  console.log('回放完成')
}
</script>
```

### 2. 使用集成轨迹回放的Map组件

```vue
<template>
  <div>
    <Map ref="mapRef" />
  </div>
</template>

<script setup>
import Map from '@/components/Map.vue'

const mapRef = ref(null)

// 编程方式控制轨迹回放
const startTrajectoryDemo = () => {
  // 加载预设轨迹（索引0 = 北京市区路线）
  mapRef.value.loadPresetTrajectory(0)
  
  // 开始回放
  setTimeout(() => {
    mapRef.value.startTrajectoryPlayback()
  }, 1000)
}

// 加载自定义轨迹
const loadCustomTrajectory = () => {
  const customPath = [
    [116.397428, 39.90923],
    [116.398428, 39.90923],
    [116.398428, 39.91023],
    [116.397428, 39.91023]
  ]
  
  mapRef.value.loadCustomTrajectory(customPath)
}
</script>
```

## API 接口

### TrajectoryPlayback 组件

#### Props
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| mapInstance | Object | null | 高德地图实例 |
| visible | Boolean | true | 是否显示回放面板 |

#### Events
| 事件名 | 参数 | 说明 |
|--------|------|------|
| trajectory-loaded | data | 轨迹加载完成 |
| playback-started | - | 回放开始 |
| playback-paused | - | 回放暂停 |
| playback-stopped | - | 回放停止 |
| playback-completed | - | 回放完成 |

#### Methods
| 方法名 | 参数 | 说明 |
|--------|------|------|
| loadTrajectory | - | 加载轨迹 |
| startAnimation | - | 开始回放 |
| pauseAnimation | - | 暂停回放 |
| resumeAnimation | - | 继续回放 |
| stopAnimation | - | 停止回放 |
| clearTrajectory | - | 清除轨迹 |
| setPresetTrajectory | index | 设置预设轨迹 |
| setCustomTrajectory | path | 设置自定义轨迹 |

### Map 组件轨迹回放相关方法

| 方法名 | 参数 | 说明 |
|--------|------|------|
| toggleTrajectory | - | 切换轨迹回放面板 |
| loadPresetTrajectory | index | 加载预设轨迹 |
| loadCustomTrajectory | path | 加载自定义轨迹 |
| startTrajectoryPlayback | - | 开始轨迹回放 |
| pauseTrajectoryPlayback | - | 暂停轨迹回放 |
| stopTrajectoryPlayback | - | 停止轨迹回放 |
| clearTrajectoryPlayback | - | 清除轨迹回放 |

## 使用示例

### 基本用法
```javascript
// 获取地图组件引用
const mapRef = ref(null)

// 加载并播放预设轨迹
const playPresetTrajectory = () => {
  // 加载第一个预设轨迹（北京市区路线）
  mapRef.value.loadPresetTrajectory(0)
  
  // 1秒后开始播放
  setTimeout(() => {
    mapRef.value.startTrajectoryPlayback()
  }, 1000)
}

// 加载自定义轨迹
const playCustomTrajectory = () => {
  const trajectoryData = [
    [116.397428, 39.90923], // 起点
    [116.398428, 39.90923], // 中间点
    [116.398428, 39.91023], // 中间点
    [116.397428, 39.91023], // 终点
    [116.397428, 39.90923]  // 回到起点
  ]
  
  mapRef.value.loadCustomTrajectory(trajectoryData)
  
  setTimeout(() => {
    mapRef.value.startTrajectoryPlayback()
  }, 1000)
}

// 控制回放
const controlPlayback = () => {
  // 暂停
  mapRef.value.pauseTrajectoryPlayback()
  
  // 2秒后继续
  setTimeout(() => {
    mapRef.value.startTrajectoryPlayback() // 继续播放
  }, 2000)
  
  // 5秒后停止
  setTimeout(() => {
    mapRef.value.stopTrajectoryPlayback()
  }, 5000)
}
```

### 轨迹数据格式
```javascript
// 标准轨迹数据格式
const trajectoryPath = [
  [经度1, 纬度1], // 第一个点
  [经度2, 纬度2], // 第二个点
  [经度3, 纬度3], // 第三个点
  // ... 更多点
]

// 示例数据
const exampleTrajectory = [
  [116.478935, 39.997761], // 北京某地点1
  [116.478939, 39.997825], // 北京某地点2
  [116.478912, 39.998549], // 北京某地点3
  [116.478998, 39.998555], // 北京某地点4
  [116.479282, 39.99856],  // 北京某地点5
]
```

### 监听回放事件
```vue
<Map 
  ref="mapRef"
  @trajectory-loaded="handleTrajectoryLoaded"
  @playback-started="handlePlaybackStarted"
  @playback-completed="handlePlaybackCompleted"
/>
```

```javascript
const handleTrajectoryLoaded = (data) => {
  console.log('轨迹加载完成:', data.name, '轨迹点数:', data.path.length)
}

const handlePlaybackStarted = () => {
  console.log('轨迹回放开始')
  // 可以在这里隐藏其他UI元素，专注于轨迹回放
}

const handlePlaybackCompleted = () => {
  console.log('轨迹回放完成')
  // 可以在这里显示完成提示或执行后续操作
}
```

## 界面操作

### 在地图页面使用：
1. 访问 `/map` 页面
2. 点击左上角的"轨迹"按钮
3. 在轨迹回放面板中：
   - 选择"预设轨迹"或"自定义轨迹"
   - 配置回放参数（速度、旋转等）
   - 点击"加载轨迹"
   - 点击"开始回放"

### 面板功能：
- **轨迹选择**: 预设轨迹下拉选择或自定义JSON输入
- **参数设置**: 回放速度滑块、自动旋转开关、轨迹显示开关
- **播放控制**: 加载、开始、暂停、继续、停止按钮
- **状态显示**: 实时进度、播放时间、当前位置信息
- **错误提示**: 数据验证和操作错误提示

## 技术实现

### 🔧 核心技术
- **高德地图API 2.0**: 地图服务和动画支持
- **AMap.MoveAnimation**: 轨迹动画插件
- **Vue 3**: 组合式API和响应式数据
- **自定义标记**: 车辆图标和轨迹线样式

### 🎨 视觉特性
- **现代化UI**: 渐变色、圆角、阴影效果
- **动画效果**: 平滑的按钮交互和进度条动画
- **状态指示**: 不同状态的颜色和图标提示
- **响应式布局**: 支持PC和移动端

### 📱 响应式支持
- **PC端**: 完整功能面板，悬浮在地图右上角
- **移动端**: 优化的触摸交互，自适应屏幕尺寸
- **可折叠**: 面板支持展开/收起，节省屏幕空间

## 配置要求

### 1. 环境依赖
- Node.js 20.19.0+
- Vue 3.5.18+
- 高德地图API Key

### 2. API Key配置
在 `src/components/Map.vue` 中配置您的高德地图API Key：
```javascript
AMap = await AMapLoader.load({
  key: '您的高德地图API Key',
  version: '2.1Beta',
  plugins: ['AMap.Riding', 'AMap.MoveAnimation']
})
```

### 3. 启动项目
```bash
npm install
npm run dev
```

## 注意事项

1. **轨迹数据格式**: 必须是二维数组，每个点包含经度和纬度
2. **最小点数**: 轨迹至少需要2个点才能进行回放
3. **坐标范围**: 经度范围[-180, 180]，纬度范围[-90, 90]
4. **性能考虑**: 轨迹点过多可能影响性能，建议适当简化
5. **网络依赖**: 需要网络连接加载地图和插件

## 故障排除

### 常见问题
1. **轨迹不显示**: 检查轨迹数据格式和坐标范围
2. **动画不流畅**: 调整回放速度或减少轨迹点数量
3. **插件加载失败**: 确认网络连接和API Key有效性
4. **面板不显示**: 检查地图实例是否正确初始化

### 调试方法
- 查看浏览器控制台的错误信息
- 使用轨迹数据验证功能检查数据格式
- 确认高德地图API和插件正确加载

## 扩展功能

基于现有组件可以扩展：
- 轨迹录制功能
- 多轨迹同时播放
- 轨迹编辑和优化
- 轨迹分析和统计
- 实时GPS轨迹跟踪

## 许可证

本项目基于现有项目许可证。
