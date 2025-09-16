# 骑行导航功能组件

## 概述

本项目实现了一个完整的骑行导航功能，包含独立的导航组件和集成的地图接口，支持经纬度和地点名称两种搜索模式。

## 功能特性

### 🚴‍♂️ 核心功能
- **路线规划**: 支持经纬度和地点名称两种输入模式
- **实时导航**: 基于高德地图API的骑行路线规划
- **路线显示**: 自定义路线样式和标记点
- **详细指引**: 分步骑行指引和路线信息
- **响应式设计**: 支持PC和移动端

### 🎯 搜索模式
1. **经纬度模式**: 精确的坐标定位
2. **地点名称模式**: 关键字搜索，支持城市限定

### 📊 路线策略
- **推荐路线**: 综合最优路线
- **最短距离**: 距离最短路线

## 文件结构

```
src/components/
├── CyclingNavigation.vue      # 独立的骑行导航组件
├── CyclingNavigationTest.vue  # 测试页面组件
└── Map.vue                   # 集成导航功能的地图组件
```

## 组件使用

### 1. 独立使用CyclingNavigation组件

```vue
<template>
  <div>
    <CyclingNavigation 
      :map-instance="mapInstance"
      :visible="showNavigation"
      @route-planned="handleRoutePlanned"
      @route-cleared="handleRouteCleared"
      @step-highlighted="handleStepHighlighted"
      ref="cyclingNavigationRef"
    />
  </div>
</template>

<script setup>
import CyclingNavigation from '@/components/CyclingNavigation.vue'

const mapInstance = ref(null)
const showNavigation = ref(true)
const cyclingNavigationRef = ref(null)

const handleRoutePlanned = (data) => {
  console.log('路线规划完成:', data)
}

const handleRouteCleared = () => {
  console.log('路线已清除')
}

const handleStepHighlighted = (data) => {
  console.log('步骤高亮:', data)
}
</script>
```

### 2. 使用集成导航的Map组件

```vue
<template>
  <div>
    <Map ref="mapRef" />
  </div>
</template>

<script setup>
import Map from '@/components/Map.vue'

const mapRef = ref(null)

// 编程方式设置导航
const startNavigation = () => {
  // 设置起点（经纬度）
  mapRef.value.setNavigationStart(116.397933, 39.844818)
  
  // 设置终点（经纬度）
  mapRef.value.setNavigationEnd(116.440655, 39.878694)
  
  // 开始导航
  mapRef.value.startNavigation()
}

// 使用地点名称
const startNavigationByKeyword = () => {
  mapRef.value.setNavigationStartKeyword('临泓路6号院', '北京')
  mapRef.value.setNavigationEndKeyword('龙潭公园', '北京')
  mapRef.value.startNavigation()
}
</script>
```

## API 接口

### CyclingNavigation 组件

#### Props
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| mapInstance | Object | null | 高德地图实例 |
| visible | Boolean | true | 是否显示导航面板 |

#### Events
| 事件名 | 参数 | 说明 |
|--------|------|------|
| route-planned | data | 路线规划完成 |
| route-cleared | - | 路线清除 |
| step-highlighted | data | 路线步骤高亮 |

#### Methods
| 方法名 | 参数 | 说明 |
|--------|------|------|
| searchRoute | - | 开始路线搜索 |
| clearRoute | - | 清除当前路线 |
| setStartPoint | lng, lat | 设置起点坐标 |
| setEndPoint | lng, lat | 设置终点坐标 |
| setStartKeyword | keyword, city | 设置起点关键字 |
| setEndKeyword | keyword, city | 设置终点关键字 |

### Map 组件导航相关方法

| 方法名 | 参数 | 说明 |
|--------|------|------|
| toggleNavigation | - | 切换导航面板显示 |
| setNavigationStart | lng, lat | 设置导航起点 |
| setNavigationEnd | lng, lat | 设置导航终点 |
| setNavigationStartKeyword | keyword, city | 设置起点关键字 |
| setNavigationEndKeyword | keyword, city | 设置终点关键字 |
| startNavigation | - | 开始导航规划 |
| clearNavigation | - | 清除导航路线 |

## 测试页面

访问 `/cycling-test` 路径可以进入测试页面，提供以下功能：

### 🧪 测试功能
1. **基础功能测试**: 打开/关闭导航面板，清除路线
2. **预设路线测试**: 6条预设的北京地区骑行路线
3. **自定义测试**: 支持经纬度和地点名称两种模式
4. **API使用示例**: 完整的代码示例

### 📍 预设路线
- 北京经典路线（临泓路到龙潭公园）
- 天安门到故宫
- 北京大学到清华大学
- 首都机场到国贸
- 颐和园到圆明园
- 鸟巢到水立方

## 技术实现

### 🔧 核心技术
- **Vue 3**: 组合式API
- **高德地图API 2.1Beta**: 地图服务和骑行导航
- **AMap.Riding**: 骑行路线规划插件
- **响应式设计**: 支持多设备

### 🎨 样式特性
- **现代化UI**: 毛玻璃效果、渐变色
- **动画效果**: 按钮悬停、加载动画
- **可折叠面板**: 节省屏幕空间
- **滚动优化**: 自定义滚动条样式

### 📱 响应式支持
- **PC端**: 完整功能体验
- **平板端**: 适配中等屏幕
- **手机端**: 优化触摸交互

## 部署和使用

### 1. 环境要求
- Node.js 20.19.0+
- Vue 3.5.18+
- 高德地图API Key

### 2. 安装依赖
```bash
npm install
```

### 3. 配置地图API Key
在 `src/components/Map.vue` 中配置您的高德地图API Key：
```javascript
AMap = await AMapLoader.load({
  key: '您的高德地图API Key',
  version: '2.1Beta',
  plugins: ['AMap.Riding']
})
```

### 4. 启动开发服务器
```bash
npm run dev
```

### 5. 访问测试页面
打开浏览器访问: `http://localhost:5173/cycling-test`

## 使用示例

### 基本用法
```javascript
// 获取地图组件引用
const mapRef = ref(null)

// 设置起终点并开始导航
const startCyclingNavigation = () => {
  mapRef.value.setNavigationStart(116.397933, 39.844818)
  mapRef.value.setNavigationEnd(116.440655, 39.878694)
  mapRef.value.startNavigation()
}

// 使用地点名称
const startNavigationByPlace = () => {
  mapRef.value.setNavigationStartKeyword('天安门', '北京')
  mapRef.value.setNavigationEndKeyword('故宫', '北京')
  mapRef.value.startNavigation()
}

// 清除路线
const clearRoute = () => {
  mapRef.value.clearNavigation()
}
```

### 监听导航事件
```vue
<Map 
  ref="mapRef"
  @cycling-route-planned="handleRoutePlanned"
  @cycling-route-cleared="handleRouteCleared"
/>
```

## 注意事项

1. **API Key**: 需要有效的高德地图API Key
2. **网络连接**: 需要网络连接获取路线数据
3. **浏览器兼容性**: 现代浏览器支持（Chrome 80+, Firefox 75+, Safari 13+）
4. **HTTPS**: 生产环境建议使用HTTPS协议

## 故障排除

### 常见问题
1. **地图不显示**: 检查API Key是否正确
2. **路线规划失败**: 确认起终点坐标或地名正确
3. **导航面板不显示**: 检查地图实例是否正确传递

### 调试方法
- 打开浏览器开发者工具查看控制台日志
- 检查网络请求是否成功
- 验证组件props是否正确传递

## 扩展功能

可以基于现有组件扩展以下功能：
- 多点路径规划
- 路线收藏和历史记录
- 实时位置跟踪
- 语音导航提示
- 路况信息显示

## 许可证

本项目基于现有项目许可证。

## 联系方式

如有问题或建议，请通过项目仓库提交Issue。
