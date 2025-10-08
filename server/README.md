# 517骑行驿站后端服务

基于 Node.js + Express + PostgreSQL 构建的 RESTful API 服务，为517骑行驿站前端应用提供数据支持。

## 🚀 快速开始

### 环境要求

- Node.js >= 20.19.0 或 >= 22.12.0
- PostgreSQL >= 12.0
- npm 或 yarn

### 安装依赖

```bash
cd server
npm install
```

### 环境配置

1. 创建 `.env` 文件：

```bash
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=517database
DB_USER=postgres
DB_PASSWORD=your_password

# API 配置
API_PREFIX=/api/v1

# CORS 配置
CORS_ORIGIN=http://localhost:5173
```

### 启动服务

```bash
# 开发模式（推荐）
npm run dev

# 生产模式
npm start
```

服务启动后访问：
- 健康检查：http://localhost:3000/health
- API 文档：http://localhost:3000/api/v1/docs（开发环境）

## 📁 项目结构

```
server/
├── app.js                           # 主应用文件
├── package.json                     # 依赖配置
├── config/
│   └── database.js                  # 数据库配置
├── models/                          # 数据模型
│   ├── waystationModel.js          # 驿站数据模型
│   ├── routeModel.js               # 路线数据模型
│   ├── destinationModel.js         # 目标点数据模型
│   ├── imageModel.js               # 图片数据模型
│   └── userBehaviorSimplifiedModel.js # 用户行为数据模型
├── controllers/                     # 控制器
│   ├── waystationController.js     # 驿站控制器
│   ├── routeController.js          # 路线控制器
│   ├── destinationController.js    # 目标点控制器
│   ├── imageController.js          # 图片控制器
│   └── simplifiedAnalyticsController.js # 分析控制器
├── routes/                          # 路由配置
│   ├── waystationRoutes.js         # 驿站路由
│   ├── routeRoutes.js              # 路线路由
│   ├── destinationRoutes.js        # 目标点路由
│   ├── imageRoutes.js              # 图片路由
│   ├── elevationRoutes.js          # 高程数据路由
│   └── simplifiedAnalyticsRoutes.js # 分析路由
├── middleware/
│   ├── errorHandler.js             # 错误处理中间件
│   └── simplifiedAnalyticsMiddleware.js # 分析中间件
├── utils/                          # 工具函数
└── README.md                       # 项目文档
```

## 🔗 API 接口文档

### 基础信息

- **基础 URL**：`http://localhost:3000/api/v1`
- **内容类型**：`application/json`
- **字符编码**：`UTF-8`
- **认证方式**：暂无（公开API）

---

## 🏠 驿站服务接口 (`/waystations`)

### 1. 获取所有驿站

```http
GET /api/v1/waystations
```

**查询参数：**
- `limit` (可选): 限制返回数量 (1-100)，默认10
- `offset` (可选): 偏移量 (>= 0)，默认0
- `region` (可选): 地区筛选

**示例：**
```bash
curl "http://localhost:3000/api/v1/waystations?limit=10&offset=0&region=北京"
```

### 2. 搜索驿站

```http
GET /api/v1/waystations/search
```

**查询参数：**
- `q` (必需): 搜索关键词 (2-50字符)

**示例：**
```bash
curl "http://localhost:3000/api/v1/waystations/search?q=青海湖"
```

### 3. 按服务类型筛选驿站

```http
GET /api/v1/waystations/services
```

**查询参数：**
- `accommodation` (可选): 住宿服务 (0或1)
- `bike_rental` (可选): 租车服务 (0或1)
- `bike_return` (可选): 还车服务 (0或1)
- `maintenance` (可选): 维修服务 (0或1)

**示例：**
```bash
curl "http://localhost:3000/api/v1/waystations/services?accommodation=1&bike_rental=1"
```

### 4. 获取驿站统计信息

```http
GET /api/v1/waystations/statistics
```

### 5. 根据地图边界获取驿站

```http
GET /api/v1/waystations/bounds
```

**查询参数：**
- `minLat` (必需): 最小纬度
- `maxLat` (必需): 最大纬度
- `minLng` (必需): 最小经度
- `maxLng` (必需): 最大经度

**示例：**
```bash
curl "http://localhost:3000/api/v1/waystations/bounds?minLat=39&maxLat=40&minLng=116&maxLng=117"
```

### 6. 获取单个驿站详情

```http
GET /api/v1/waystations/:id
```

**路径参数：**
- `id` (必需): 驿站ID

---

## 🛣️ 路线服务接口 (`/routes`)

### 1. 获取所有路线

```http
GET /api/v1/routes
```

**查询参数：**
- `limit` (可选): 限制返回数量 (1-100)
- `offset` (可选): 偏移量 (>= 0)
- `region` (可选): 地区筛选

### 2. 搜索路线

```http
GET /api/v1/routes/search
```

**查询参数：**
- `q` (必需): 搜索关键词 (2-50字符)

### 3. 按距离筛选路线

```http
GET /api/v1/routes/distance
```

**查询参数：**
- `min` (必需): 最小距离（公里）
- `max` (必需): 最大距离（公里）

### 4. 按天数筛选路线

```http
GET /api/v1/routes/days
```

**查询参数：**
- `min` (必需): 最小天数
- `max` (必需): 最大天数

### 5. 按路况筛选路线

```http
GET /api/v1/routes/condition
```

**查询参数：**
- `q` (必需): 路况条件（如"良好"）

### 6. 按风景评分筛选路线

```http
GET /api/v1/routes/scenery-score
```

**查询参数：**
- `min` (必需): 最小评分 (1-10)
- `max` (必需): 最大评分 (1-10)

### 7. 按难度评分筛选路线

```http
GET /api/v1/routes/difficulty-score
```

**查询参数：**
- `min` (必需): 最小难度 (1-10)
- `max` (必需): 最大难度 (1-10)

### 8. 多条件筛选路线

```http
GET /api/v1/routes/filters
```

**查询参数：**
- `region` (可选): 地区
- `minDistance` (可选): 最小距离
- `maxDistance` (可选): 最大距离
- `minDays` (可选): 最小天数
- `maxDays` (可选): 最大天数
- `minSceneryScore` (可选): 最小风景评分
- `maxSceneryScore` (可选): 最大风景评分
- `minDifficultyScore` (可选): 最小难度评分
- `maxDifficultyScore` (可选): 最大难度评分

### 9. 按途径点筛选路线

```http
GET /api/v1/routes/waypoints/all?ids=1,2,3    # 包含所有指定地点
GET /api/v1/routes/waypoints/any?ids=1,2,3    # 包含任一指定地点
GET /api/v1/routes/waypoint/:waypointId       # 包含单个地点
```

### 10. 获取热门路线

```http
GET /api/v1/routes/popular
```

**查询参数：**
- `limit` (可选): 限制返回数量

### 11. 智能路线匹配

```http
POST /api/v1/routes/smart-match
```

**请求体：**
```json
{
  "difficulty": "medium",
  "sceneryPriority": 8,
  "cyclingType": "leisure",
  "days": 5,
  "weatherScore": 7,
  "limit": 10
}
```

### 12. 获取所有地区

```http
GET /api/v1/routes/regions
```

### 13. 获取路线统计信息

```http
GET /api/v1/routes/statistics
```

### 14. 获取地区统计信息

```http
GET /api/v1/routes/region-statistics
```

**查询参数：**
- `region` (可选): 地区名称

### 15. 获取路线途径点详情

```http
GET /api/v1/routes/:id/waypoints
```

### 16. 获取单个路线详情

```http
GET /api/v1/routes/:id
```

---

## 📍 目标点服务接口 (`/destinations`)

### 1. 获取所有目标点

```http
GET /api/v1/destinations
```

**查询参数：**
- `limit` (可选): 限制返回数量 (1-100)
- `offset` (可选): 偏移量 (>= 0)
- `region` (可选): 地区筛选

### 2. 搜索目标点

```http
GET /api/v1/destinations/search
```

**查询参数：**
- `q` (必需): 搜索关键词 (2-50字符)

### 3. 获取目标点统计信息

```http
GET /api/v1/destinations/statistics
```

### 4. 根据地图边界获取目标点

```http
GET /api/v1/destinations/bounds
```

**查询参数：**
- `minLat` (必需): 最小纬度
- `maxLat` (必需): 最大纬度
- `minLng` (必需): 最小经度
- `maxLng` (必需): 最大经度

### 5. 根据路线ID获取目标点

```http
GET /api/v1/destinations/route/:routeId
```

### 6. 获取单个目标点详情

```http
GET /api/v1/destinations/:id
```

---

## 🖼️ 图片服务接口 (`/images`)

### 1. 获取所有图片

```http
GET /api/v1/images
```

### 2. 获取主页图片

```http
GET /api/v1/images/homepage
```

### 3. 根据图片名获取图片

```http
GET /api/v1/images/name/:name
```

### 4. 获取单个图片

```http
GET /api/v1/images/:id
```

### 5. 创建新图片

```http
POST /api/v1/images
```

### 6. 更新图片

```http
PUT /api/v1/images/:id
```

### 7. 删除图片

```http
DELETE /api/v1/images/:id
```

---

## 🏔️ 高程数据接口 (`/elevation`)

### 1. 单点高程查询

```http
GET /api/v1/elevation/lookup
```

**查询参数：**
- `locations` (必需): 坐标点，格式：`lat,lng`

**示例：**
```bash
curl "http://localhost:3000/api/v1/elevation/lookup?locations=39.9042,116.4074"
```

### 2. 批量高程查询

```http
POST /api/v1/elevation/batch
```

**请求体：**
```json
{
  "coordinates": [
    {"lat": 39.9042, "lng": 116.4074},
    {"lat": 40.0042, "lng": 116.5074}
  ]
}
```

---

## 📊 用户分析接口 (`/analytics-simple`)

### 数据记录接口

#### 1. 记录路线导航行为

```http
POST /api/v1/analytics-simple/route-navigation
```

**请求体：**
```json
{
  "session_id": "unique_session_id",
  "start_point": "起点名称",
  "end_point": "终点名称",
  "route_policy": "0",
  "search_mode": "coordinates"
}
```

#### 2. 记录热门路线点击

```http
POST /api/v1/analytics-simple/popular-route-click
```

**请求体：**
```json
{
  "session_id": "unique_session_id",
  "route_id": 123,
  "route_name": "青海湖环线"
}
```

#### 3. 记录智能路线匹配

```http
POST /api/v1/analytics-simple/smart-route-match
```

**请求体：**
```json
{
  "session_id": "unique_session_id",
  "preferred_difficulty": "medium",
  "scenery_preference": 8,
  "matched_routes_count": 5
}
```

#### 4. 记录轨迹回放使用

```http
POST /api/v1/analytics-simple/trajectory-playback
```

**请求体：**
```json
{
  "session_id": "unique_session_id",
  "route_id": 123,
  "route_name": "青海湖环线",
  "waypoints_count": 10,
  "playback_source": "popular_routes"
}
```

### 统计查询接口

#### 1. 获取用户行为统计

```http
GET /api/v1/analytics-simple/statistics/behavior
```

**查询参数：**
- `start_date` (可选): 开始日期 (ISO8601格式)
- `end_date` (可选): 结束日期 (ISO8601格式)
- `action_type` (可选): 行为类型

#### 2. 获取热门路线统计

```http
GET /api/v1/analytics-simple/statistics/popular-routes
```

**查询参数：**
- `start_date` (可选): 开始日期
- `end_date` (可选): 结束日期
- `limit` (可选): 限制数量 (1-100)

#### 3. 获取导航偏好统计

```http
GET /api/v1/analytics-simple/statistics/navigation-preferences
```

**查询参数：**
- `start_date` (可选): 开始日期
- `end_date` (可选): 结束日期

#### 4. 获取综合分析报告

```http
GET /api/v1/analytics-simple/report
```

**查询参数：**
- `start_date` (可选): 开始日期
- `end_date` (可选): 结束日期

#### 5. 分析服务健康检查

```http
GET /api/v1/analytics-simple/health
```

---

## 📊 数据库结构

### Waystation 表（驿站）

| 字段 | 类型 | 说明 |
|------|------|------|
| ID | int4 | 驿站ID (主键) |
| 地区 | varchar(255) | 地区 |
| 点名称 | varchar(255) | 驿站名称 |
| 地址 | varchar(255) | 地址 |
| longitude | float8 | 经度 |
| latitude | float8 | 纬度 |
| 点备注 | varchar(255) | 备注 |
| 负责人联系方式 | varchar(255) | 联系方式 |
| 图片 | varchar(255) | 图片URL |
| 住宿 | int4 | 住宿服务 (0/1) |
| 租车 | int4 | 租车服务 (0/1) |
| 还车 | int4 | 还车服务 (0/1) |
| 维修 | int4 | 维修服务 (0/1) |

### Route 表（路线）

| 字段 | 类型 | 说明 |
|------|------|------|
| ID | int4 | 路线ID (主键) |
| 地区 | varchar(255) | 地区 |
| 路线名 | varchar(255) | 路线名称 |
| 里程 | int4 | 里程（公里） |
| 预计天数 | float4 | 预计天数 |
| 路况 | varchar(255) | 路况描述 |
| 风景评分 | int4 | 风景评分 (1-10) |
| 路况难度评分 | int4 | 难度评分 (1-10) |
| 途径地点 | varchar(255) | 途径地点列表 |

### Destination 表（目标点）

| 字段 | 类型 | 说明 |
|------|------|------|
| ID | int4 | 目标点ID (主键) |
| 地区 | varchar(255) | 地区 |
| 点名称 | varchar(255) | 目标点名称 |
| longitude | float8 | 经度 |
| latitude | float8 | 纬度 |
| 热门线路ID | int4 | 关联的热门线路ID |

### Image 表（图片）

| 字段 | 类型 | 说明 |
|------|------|------|
| ID | int4 | 图片ID (主键) |
| 图片名 | varchar(255) | 图片名称 |
| 介绍 | text | 图片介绍 |
| 存储(根目录路径) | varchar(255) | 存储路径 |

---

## 🛠️ 开发指南

### 添加新的 API 接口

1. 在 `models/` 中添加数据模型方法
2. 在 `controllers/` 中添加控制器方法
3. 在 `routes/` 中添加路由配置
4. 在主应用中注册路由

### 错误处理

所有 API 响应都遵循统一格式：

```json
{
  "success": true/false,
  "message": "操作描述",
  "data": {}, // 成功时的数据
  "error": "", // 失败时的错误信息（仅开发环境）
}
```

### 参数验证

使用 `express-validator` 进行参数验证：

```javascript
const { query, param, body } = require('express-validator');

router.get('/example',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    param('id').isInt({ min: 1 })
  ],
  controller.method
);
```

### 日志记录

- 开发环境：使用 `morgan('dev')` 格式
- 生产环境：使用 `morgan('combined')` 格式
- 错误日志：包含详细的错误信息和请求上下文

### 性能优化

1. **数据库连接池**：使用PostgreSQL连接池管理连接
2. **查询优化**：使用索引和优化的SQL查询
3. **缓存策略**：实现查询结果缓存
4. **分页处理**：大数据集使用分页返回

### 安全特性

1. **CORS配置**：跨域请求安全控制
2. **Helmet安全头**：HTTP安全头设置
3. **输入验证**：严格的参数验证
4. **SQL注入防护**：使用参数化查询
5. **错误信息过滤**：生产环境不暴露敏感错误信息

---

## 🔧 扩展功能

### 已实现功能

1. ✅ **驿站管理系统**
   - 驿站CRUD操作
   - 地理位置查询
   - 服务类型筛选

2. ✅ **路线管理系统**
   - 路线信息管理
   - 多条件筛选
   - 智能匹配算法

3. ✅ **用户行为分析**
   - 行为数据收集
   - 统计分析报告
   - 偏好分析

4. ✅ **高程数据服务**
   - 单点高程查询
   - 批量高程处理

### 计划中的功能

1. **用户认证系统**
   - JWT 认证
   - 用户角色管理
   - API 访问控制

2. **文件上传服务**
   - 驿站图片上传
   - 文件存储管理
   - 图片压缩处理

3. **缓存系统**
   - Redis 缓存
   - 查询结果缓存
   - 性能优化

4. **监控和分析**
   - API 访问统计
   - 性能监控
   - 错误追踪

---

## 📝 API 使用示例

### 获取北京地区的驿站

```bash
curl -X GET "http://localhost:3000/api/v1/waystations?region=北京&limit=5" \
  -H "Content-Type: application/json"
```

### 搜索包含"青海湖"的路线

```bash
curl -X GET "http://localhost:3000/api/v1/routes/search?q=青海湖" \
  -H "Content-Type: application/json"
```

### 智能路线匹配

```bash
curl -X POST "http://localhost:3000/api/v1/routes/smart-match" \
  -H "Content-Type: application/json" \
  -d '{
    "difficulty": "medium",
    "sceneryPriority": 8,
    "cyclingType": "leisure",
    "days": 5,
    "limit": 10
  }'
```

### 记录用户行为

```bash
curl -X POST "http://localhost:3000/api/v1/analytics-simple/route-navigation" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "user_session_123",
    "start_point": "北京",
    "end_point": "青海湖",
    "route_policy": "0",
    "search_mode": "keyword"
  }'
```

---

## 🐛 常见问题

### Q: 数据库连接失败？
A: 请检查PostgreSQL服务是否启动，数据库配置是否正确，确保数据库存在且用户有访问权限。

### Q: API返回500错误？
A: 检查服务器日志，通常是数据库查询错误或参数验证失败。开发环境会返回详细错误信息。

### Q: 高程API请求失败？
A: 高程API依赖外部服务，可能因网络问题或API限制失败。检查网络连接和API使用频率。

### Q: 如何添加新的驿站数据？
A: 目前需要直接在数据库中添加，未来版本将提供管理界面。

---

## 📞 联系方式

- **项目开发者**: 温锦林
- **技术支持**: 请通过 GitHub Issues 联系或电话联系15808955664

## 📄 许可证

本项目采用 ISC 许可证。详情请参阅 LICENSE 文件。

---

**🚴‍♂️ 享受您的骑行数据服务开发之旅！**