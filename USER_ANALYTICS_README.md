# 用户数据分析系统

## 概述

本系统为517骑行驿站项目新增了完整的用户数据分析功能，能够自动收集和分析用户行为数据，为产品优化和用户体验改进提供数据支持。

## 功能特性

### 📊 数据收集
- **用户行为追踪**: 自动记录页面访问、点击、搜索、地图交互等行为
- **设备信息收集**: 自动识别用户设备类型、操作系统、浏览器等信息
- **用户偏好记录**: 记录语言偏好、主题设置、通知偏好等
- **来源信息分析**: 自动解析用户来源、UTM参数、推广活动等

### 🛠 技术架构

#### 后端 (Node.js + Express + PostgreSQL)
```
server/
├── models/                     # 数据模型
│   ├── userBehaviorModel.js    # 用户行为模型
│   ├── userDeviceInfoModel.js  # 设备信息模型
│   ├── userPreferencesModel.js # 用户偏好模型
│   └── userReferralInfoModel.js # 来源信息模型
├── controllers/
│   └── userAnalyticsController.js # 分析控制器
├── routes/
│   └── userAnalyticsRoutes.js     # 分析路由
└── middleware/
    └── analyticsMiddleware.js      # 数据收集中间件
```

#### 前端 (Vue 3)
```
src/
└── utils/
    └── analytics.js            # 前端分析工具
```

## 数据库表结构

### 1. user_behavior - 用户行为表
记录用户在系统中的各种行为和交互
- `id`: 主键
- `session_id`: 会话ID
- `user_id`: 用户ID（可选）
- `page_url`: 页面URL
- `action_type`: 行为类型
- `action_timestamp`: 行为时间戳
- `referrer_url`: 来源URL
- `search_term`: 搜索词
- `device_info`: 设备信息JSON
- `user_agent`: 用户代理
- `ip_address`: IP地址

### 2. user_device_info - 用户设备信息表
记录用户的设备和技术信息
- `id`: 主键
- `session_id`: 会话ID
- `user_id`: 用户ID（可选）
- `device_type`: 设备类型（desktop/mobile/tablet）
- `operating_system`: 操作系统
- `browser`: 浏览器
- `screen_resolution`: 屏幕分辨率
- `created_at`: 创建时间

### 3. user_preferences - 用户偏好设置表
记录用户的个人偏好和设置
- `id`: 主键
- `session_id`: 会话ID
- `user_id`: 用户ID（可选）
- `language`: 语言偏好
- `theme`: 主题偏好
- `notifications_enabled`: 通知开关
- `created_at`: 创建时间

### 4. user_referral_info - 用户来源信息表
记录用户的访问来源和推广信息
- `id`: 主键
- `session_id`: 会话ID
- `user_id`: 用户ID（可选）
- `source_type`: 来源类型
- `source_url`: 来源URL
- `medium`: 媒介类型
- `campaign_name`: 活动名称
- `created_at`: 创建时间

## API 接口

### 数据收集接口
- `POST /api/v1/analytics/behavior` - 记录用户行为
- `POST /api/v1/analytics/behavior/batch` - 批量记录用户行为
- `POST /api/v1/analytics/preferences` - 记录用户偏好设置
- `POST /api/v1/analytics/referral` - 记录用户来源信息
- `POST /api/v1/analytics/session/init` - 初始化用户会话

### 数据查询接口
- `GET /api/v1/analytics/statistics/behavior` - 获取用户行为统计
- `GET /api/v1/analytics/statistics/pages` - 获取页面访问统计
- `GET /api/v1/analytics/statistics/devices` - 获取设备信息统计
- `GET /api/v1/analytics/statistics/preferences` - 获取用户偏好统计
- `GET /api/v1/analytics/statistics/referrals` - 获取来源信息统计
- `GET /api/v1/analytics/report` - 获取综合分析报告

### 服务状态接口
- `GET /api/v1/analytics/health` - 用户分析服务健康检查

## 自动数据收集

### 中间件自动收集
系统已集成分析中间件，会自动收集以下数据：

1. **页面访问追踪**
   - 自动记录所有GET请求的页面访问
   - 排除静态资源和健康检查接口
   - 记录访问时间、来源、设备信息等

2. **API调用追踪**
   - 自动记录主要API接口的调用
   - 包括驿站、目标点、路线、图片、高程等接口
   - 记录搜索词、查询参数等

3. **错误追踪**
   - 自动捕获和记录系统错误
   - 记录错误信息、堆栈、状态码等

### 前端自动收集
前端分析工具会自动收集：

1. **会话管理**
   - 自动生成和管理会话ID
   - 会话有效期24小时

2. **设备信息检测**
   - 自动检测设备类型、操作系统、浏览器
   - 获取屏幕分辨率

3. **用户偏好检测**
   - 自动检测语言偏好
   - 检测主题偏好（系统偏好或localStorage）

4. **来源信息解析**
   - 自动解析UTM参数
   - 识别常见来源类型（搜索引擎、社交媒体等）

## 使用示例

### 前端手动记录行为
```javascript
import analytics from '@/utils/analytics'

// 记录页面访问
analytics.trackPageView()

// 记录点击事件
analytics.trackClick(element, { button_name: '开始探索' })

// 记录搜索
analytics.trackSearch('青海湖', 'waystation')

// 记录地图交互
analytics.trackMapInteraction('zoom_in', { zoom_level: 15 })

// 记录路线规划
analytics.trackRoutePlanning(
  { lng: 116.4074, lat: 39.9042 }, // 起点
  { lng: 121.4737, lat: 31.2304 }, // 终点
  [/* 途径点 */]
)
```

### 后端查询统计数据
```javascript
// 获取行为统计
const behaviorStats = await axios.get('/api/v1/analytics/statistics/behavior', {
  params: {
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    action_type: 'page_view'
  }
})

// 获取综合报告
const report = await axios.get('/api/v1/analytics/report', {
  params: {
    start_date: '2024-01-01',
    end_date: '2024-12-31'
  }
})
```

## 数据隐私和安全

1. **数据匿名化**: 不收集个人身份信息，使用会话ID进行关联
2. **数据加密**: 敏感数据在传输过程中使用HTTPS加密
3. **数据保留**: 自动清理90天以上的历史数据
4. **访问控制**: API接口可根据需要添加认证和授权

## 性能优化

1. **异步处理**: 数据收集不阻塞主要业务流程
2. **批量发送**: 前端事件批量发送，减少请求次数
3. **数据库优化**: 使用索引优化查询性能
4. **自动清理**: 定时清理过期数据，保持数据库性能

## 部署说明

1. **数据库迁移**: 需要在PostgreSQL中创建4个新表
2. **环境变量**: 无需额外环境变量配置
3. **依赖安装**: 已使用现有依赖，无需额外安装
4. **服务启动**: 分析服务会随主应用自动启动

## 监控和维护

- **健康检查**: `/api/v1/analytics/health`
- **日志监控**: 所有分析操作都有详细日志
- **错误处理**: 完善的错误捕获和处理机制
- **数据清理**: 每24小时自动清理过期数据

## 扩展性

系统设计支持未来扩展：
- 可轻松添加新的行为类型
- 支持用户登录后的个性化分析
- 可集成第三方分析工具
- 支持实时数据流处理
