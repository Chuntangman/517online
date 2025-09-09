# 517骑行驿站后端服务

基于 Node.js + Express + PostgreSQL 构建的 RESTful API 服务，为517骑行驿站前端应用提供数据支持。

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- PostgreSQL >= 12.0
- npm 或 yarn

### 安装依赖

```bash
cd server
npm install
```

### 环境配置

1. 创建 `.env` 文件（参考 `.env.example`）：

```bash
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=517database
DB_USER=postgres
DB_PASSWORD=6912190819

# API 配置
API_PREFIX=/api/v1

# CORS 配置
CORS_ORIGIN=http://localhost:5174
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
├── app.js                 # 主应用文件
├── package.json           # 依赖配置
├── config/
│   └── database.js        # 数据库配置
├── models/
│   └── waystationModel.js # 驿站数据模型
├── controllers/
│   └── waystationController.js # 驿站控制器
├── routes/
│   └── waystationRoutes.js # 驿站路由
├── middleware/
│   └── errorHandler.js    # 错误处理中间件
└── README.md              # 项目文档
```

## 🔗 API 接口

### 基础信息

- 基础 URL：`http://localhost:3000/api/v1`
- 内容类型：`application/json`
- 字符编码：`UTF-8`

### 驿站接口

#### 1. 获取所有驿站

```http
GET /api/v1/waystations
```

**查询参数：**
- `limit` (可选): 限制返回数量 (1-100)
- `offset` (可选): 偏移量 (>= 0)
- `region` (可选): 地区筛选

**示例：**
```bash
curl "http://localhost:3000/api/v1/waystations?limit=10&offset=0&region=北京"
```

#### 2. 搜索驿站

```http
GET /api/v1/waystations/search?q=关键词
```

**查询参数：**
- `q` (必需): 搜索关键词 (2-50字符)

**示例：**
```bash
curl "http://localhost:3000/api/v1/waystations/search?q=青海湖"
```

#### 3. 按服务类型筛选

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

#### 4. 获取统计信息

```http
GET /api/v1/waystations/statistics
```

#### 5. 根据地图边界获取驿站

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

#### 6. 获取单个驿站详情

```http
GET /api/v1/waystations/:id
```

**路径参数：**
- `id` (必需): 驿站ID

**示例：**
```bash
curl "http://localhost:3000/api/v1/waystations/1"
```

## 📊 数据库结构

### Waystation 表

| 字段 | 类型 | 说明 |
|------|------|------|
| ID | int4 | 驿站ID (主键) |
| 地区 | varchar(255) | 地区 |
| 点名称 | varchar(255) | 驿站名称 (主键) |
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

### 日志记录

- 开发环境：使用 `morgan('dev')` 格式
- 生产环境：使用 `morgan('combined')` 格式
- 错误日志：包含详细的错误信息和请求上下文

## 🔧 扩展功能

### 计划中的功能

1. **用户认证系统**
   - JWT 认证
   - 用户角色管理
   - API 访问控制

2. **路线管理**
   - 路线CRUD操作
   - 路线规划算法
   - 路线评分系统

3. **文件上传**
   - 驿站图片上传
   - 文件存储管理
   - 图片压缩处理

4. **缓存系统**
   - Redis 缓存
   - 查询结果缓存
   - 性能优化

5. **监控和分析**
   - API 访问统计
   - 性能监控
   - 错误追踪

## 📝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 ISC 许可证。详情请参阅 LICENSE 文件。
