# 517骑行驿站 🚴‍♂️

一个集成了路线规划、驿站服务、数据可视化分析的智能骑行平台，为骑行爱好者提供全方位的骑行体验和数据支持。

## 📋 项目概述

517骑行驿站是一个现代化的全栈Web应用，结合了Vue 3前端、Node.js后端、PostgreSQL数据库和DataGear数据可视化平台，为骑行爱好者提供：

- 🗺️ **智能路线规划**：基于高德地图API的多点路线规划和导航
- 🏠 **驿站服务管理**：全国骑行驿站信息查询和服务筛选
- 📊 **数据可视化分析**：集成DataGear平台进行用户行为和路线数据分析
- 🌤️ **实时天气服务**：基于地理位置的天气信息展示
- 📱 **响应式设计**：支持桌面端和移动端的完美体验

## 📖 运维文档

**Docker 部署与运维**：请查看 [运维手册](./OPERATIONS_MANUAL.md)

包含内容：
- 🔧 镜像构建与推送
- 📦 服务器部署与更新
- 🗄️ 数据库管理（备份/恢复）
- 🚀 服务启动/停止/重启
- 🔍 故障排查与日常维护
- 📊 监控与健康检查

## 🏗️ 技术架构

### 前端技术栈
- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite 7.0.6
- **路由**: Vue Router 4.5.1
- **地图服务**: 高德地图 JavaScript API
- **图表库**: Chart.js + Vue-ChartJS
- **HTTP客户端**: Axios
- **样式**: 原生CSS + 响应式设计

### 后端技术栈
- **运行环境**: Node.js (≥20.19.0)
- **Web框架**: Express.js 4.18.2
- **数据库**: PostgreSQL (≥12.0)
- **数据库连接**: node-postgres (pg)
- **安全中间件**: Helmet, CORS
- **日志记录**: Morgan
- **开发工具**: Nodemon

### 数据可视化
- **平台**: DataGear 5.5.0
- **功能**: 数据看板制作、图表分析、报表生成
- **集成方式**: 独立服务，通过API数据交互

### 开发工具
- **包管理**: npm
- **并发运行**: concurrently
- **代码规范**: ESLint (Vue官方配置)
- **开发调试**: Vue DevTools

## 🚀 快速开始

### 环境要求

- Node.js ≥ 20.19.0 或 ≥ 22.12.0
- PostgreSQL ≥ 12.0
- JDK 8+ (用于DataGear)
- npm 或 yarn

### 1. 克隆项目

```bash
git clone <repository-url>
cd 517
```

### 2. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install
cd ..
```

### 3. 环境配置

#### 3.1 后端环境配置

在 `server` 目录下创建 `.env` 文件：

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

#### 3.2 数据库配置

1. 创建PostgreSQL数据库：
```sql
CREATE DATABASE "517database";
```

2. 运行数据库初始化脚本（如果有的话）

#### 3.3 高德地图API配置

在项目中配置高德地图API密钥（已在代码中配置，如需更换请修改相关配置文件）

### 4. 启动服务

#### 4.1 完整启动（推荐）

```bash
# 同时启动前端、后端和DataGear
npm run dev:full
```

这个命令会并发启动：
- 前端开发服务器 (http://localhost:5173)
- 后端API服务器 (http://localhost:3000)
- DataGear数据可视化平台 (http://localhost:50401)

#### 4.2 分别启动

```bash
# 启动前端
npm run dev

# 启动后端（新终端）
cd server
npm run dev

# 启动DataGear（新终端）
cd datagear-5.5.0
# Windows
startup.bat
# Linux/Mac
./startup.sh
```

### 5. 访问应用

- **前端应用**: http://localhost:5173
- **后端API**: http://localhost:3000
- **API文档**: http://localhost:3000/api/v1/docs (开发环境)
- **健康检查**: http://localhost:3000/health
- **DataGear平台**: http://localhost:50401

## 📁 项目结构

```
517/
├── 📁 src/                          # 前端源码
│   ├── 📁 components/               # Vue组件
│   │   ├── Homepage.vue             # 主页组件
│   │   ├── Map.vue                  # 地图组件
│   │   ├── Weather.vue              # 天气组件
│   │   ├── 📁 route/                # 路线相关组件
│   │   │   ├── RouteMain.vue        # 路线主页面
│   │   │   ├── RoutePlanning.vue    # 路线规划
│   │   │   ├── PopularRoutes.vue    # 热门路线
│   │   │   ├── WaystationService.vue # 驿站服务
│   │   │   └── CyclingGuide.vue     # 骑行指南
│   │   └── 📁 icons/                # 图标组件
│   ├── 📁 composables/              # 组合式函数
│   ├── 📁 utils/                    # 工具函数
│   ├── 📁 assets/                   # 静态资源
│   ├── 📁 router/                   # 路由配置
│   ├── App.vue                      # 根组件
│   └── main.js                      # 入口文件
├── 📁 server/                       # 后端源码
│   ├── app.js                       # 主应用文件
│   ├── 📁 config/                   # 配置文件
│   │   └── database.js              # 数据库配置
│   ├── 📁 controllers/              # 控制器
│   ├── 📁 models/                   # 数据模型
│   ├── 📁 routes/                   # 路由定义
│   ├── 📁 middleware/               # 中间件
│   └── 📁 utils/                    # 工具函数
├── 📁 datagear-5.5.0/              # DataGear数据可视化平台
│   ├── startup.bat                  # Windows启动脚本
│   ├── startup.sh                   # Linux/Mac启动脚本
│   ├── datagear-5.5.0.jar         # 主程序
│   └── 📁 config/                   # 配置文件
├── 📁 public/                       # 静态资源
│   ├── 📁 weather/                  # 天气图标
│   ├── 📁 主页图/                   # 主页背景图
│   └── 📁 示例图片/                 # 示例图片资源
├── package.json                     # 前端依赖配置
├── vite.config.js                   # Vite配置
└── README.md                        # 项目文档
```

## 🔧 核心功能

### 1. 智能路线规划
- **多点路线规划**: 支持起点、多个途径点、终点的复杂路线规划
- **实时导航**: 基于高德地图的骑行导航功能
- **路线优化**: 自动计算最优骑行路径
- **高程数据**: 集成高程API，提供路线海拔信息

### 2. 驿站服务管理
- **驿站查询**: 全国骑行驿站信息检索
- **服务筛选**: 按住宿、租车、维修等服务类型筛选
- **地图展示**: 在地图上直观显示驿站位置
- **详情查看**: 驿站详细信息和服务介绍

### 3. 热门路线推荐
- **路线库**: 精选热门骑行路线
- **智能匹配**: 根据用户偏好推荐合适路线
- **路线详情**: 详细的路线信息和骑行攻略
- **用户评价**: 路线评分和用户反馈

### 4. 数据可视化分析
- **用户行为分析**: 基于DataGear的用户行为统计
- **路线热度分析**: 热门路线和地区统计
- **实时数据看板**: 动态数据展示和分析报告
- **自定义图表**: 灵活的数据可视化配置

### 5. 实时天气服务
- **位置天气**: 基于当前位置的实时天气
- **天气预报**: 未来几天的天气趋势
- **骑行建议**: 根据天气条件提供骑行建议

## 🔌 API接口

### 基础信息
- **基础URL**: `http://localhost:3000/api/v1`
- **内容类型**: `application/json`
- **字符编码**: `UTF-8`

### 主要接口模块

#### 驿站服务 (`/waystations`)
- `GET /waystations` - 获取驿站列表
- `GET /waystations/search` - 搜索驿站
- `GET /waystations/services` - 按服务筛选
- `GET /waystations/bounds` - 地图范围内驿站
- `GET /waystations/:id` - 驿站详情

#### 路线服务 (`/routes`)
- `GET /routes` - 获取路线列表
- `GET /routes/search` - 搜索路线
- `GET /routes/popular` - 热门路线
- `GET /routes/distance` - 按距离筛选
- `GET /routes/:id` - 路线详情

#### 目标点服务 (`/destinations`)
- `GET /destinations` - 获取目标点列表
- `GET /destinations/search` - 搜索目标点
- `GET /destinations/bounds` - 地图范围内目标点

#### 数据分析 (`/analytics-simple`)
- `GET /analytics-simple/statistics/behavior` - 用户行为统计
- `GET /analytics-simple/statistics/popular-routes` - 热门路线统计
- `GET /analytics-simple/report` - 综合分析报告

详细API文档请访问：http://localhost:3000/api/v1/docs

## 🛠️ 开发指南

### 开发模式

```bash
# 前端热重载开发
npm run dev

# 后端热重载开发
cd server
npm run dev

# 完整开发环境
npm run dev:full
```

### 构建部署

```bash
# 构建前端
npm run build

# 预览构建结果
npm run preview

# 后端生产模式
cd server
npm start
```

### 代码规范

项目使用ESLint进行代码规范检查，主要规则：
- Vue 3 Composition API最佳实践
- ES6+语法规范
- 组件命名规范
- 代码格式化规范

### 性能优化

#### 前端优化
- **组件懒加载**: 路由级别的代码分割
- **图片预加载**: 智能图片预加载机制
- **时间分片**: 大量数据的时间分片处理
- **缓存策略**: HTTP缓存和浏览器缓存优化

#### 后端优化
- **数据库连接池**: PostgreSQL连接池管理
- **查询优化**: SQL查询性能优化
- **缓存机制**: 数据缓存和会话管理
- **API限流**: 防止API滥用的限流机制

## 🔒 安全特性

- **CORS配置**: 跨域请求安全控制
- **Helmet安全头**: HTTP安全头设置
- **输入验证**: 请求参数验证和清理
- **SQL注入防护**: 参数化查询防止SQL注入
- **XSS防护**: 前端输入输出过滤

## 📊 监控与分析

### 应用监控
- **健康检查**: `/health` 端点监控服务状态
- **性能监控**: 请求响应时间和错误率统计
- **日志记录**: 结构化日志记录和分析

### 用户分析
- **行为追踪**: 用户操作行为记录
- **路线偏好**: 用户路线选择偏好分析
- **使用统计**: 功能使用频率统计
- **数据看板**: DataGear可视化数据展示

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📝 更新日志

### v1.0.0 (当前版本)
- ✅ 基础功能实现
- ✅ 路线规划和导航
- ✅ 驿站服务管理
- ✅ 数据可视化集成
- ✅ 用户行为分析
- ✅ 响应式设计

## 🐛 问题反馈

如果您在使用过程中遇到问题，请：

1. 检查 [常见问题](#常见问题) 部分
2. 查看项目 Issues
3. 提交新的 Issue，包含：
   - 问题描述
   - 复现步骤
   - 环境信息
   - 错误日志

## 📞 联系方式

- **项目团队**: 此项目由温锦林独立开发
- **技术支持**: 请通过 GitHub Issues 联系或电话联系15808955664

## 📄 许可证

本项目采用 ISC 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

---

## 🔍 常见问题

### Q: 如何配置高德地图API？
A: 项目已内置高德地图API配置，如需更换请修改相关配置文件中的API密钥。

### Q: DataGear启动失败怎么办？
A: 请确保已安装JDK 8+，并检查端口50401是否被占用。

### Q: 数据库连接失败？
A: 请检查PostgreSQL服务是否启动，数据库配置是否正确。

### Q: 前端页面空白？
A: 请检查后端API服务是否正常运行，浏览器控制台是否有错误信息。

### Q: 如何添加新的驿站数据？
A: 可以通过后端API接口或直接在数据库中添加驿站信息。

---

**🚴‍♂️ 享受您的骑行之旅！**