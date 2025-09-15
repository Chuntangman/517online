/**
 * 517骑行驿站后端服务主应用
 * 基于 Express + PostgreSQL 构建的 RESTful API 服务
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// 导入配置和中间件
const { testConnection } = require('./config/database');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// 导入路由
const waystationRoutes = require('./routes/waystationRoutes');
const imageRoutes = require('./routes/imageRoutes');
const destinationRoutes = require('./routes/destinationRoutes');
const routeRoutes = require('./routes/routeRoutes');

// 创建 Express 应用
const app = express();

// 配置端口
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * 中间件配置
 */

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: false, // 如需要可以自定义 CSP 策略
}));

// CORS 配置
app.use(cors({
  origin: function(origin, callback) {
    // 允许来自 localhost 的不同端口的请求
    const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('不允许的来源'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 请求日志中间件
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 解析 JSON 请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 信任代理（如果使用反向代理）
app.set('trust proxy', 1);

/**
 * 健康检查路由
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: '1.0.0'
  });
});

/**
 * API 路由配置
 */
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

// 驿站相关路由
app.use(`${API_PREFIX}/waystations`, waystationRoutes);

// 图片相关路由
app.use(`${API_PREFIX}/images`, imageRoutes);

// 目标点相关路由
app.use(`${API_PREFIX}/destinations`, destinationRoutes);

// 路线相关路由
app.use(`${API_PREFIX}/routes`, routeRoutes);

/**
 * API 文档路由（开发环境）
 */
if (NODE_ENV === 'development') {
  app.get(`${API_PREFIX}/docs`, (req, res) => {
    res.json({
      message: '517骑行驿站 API 文档',
      version: '1.0.0',
      baseUrl: `http://localhost:${PORT}${API_PREFIX}`,
      endpoints: {
        waystations: {
          'GET /waystations': '获取所有驿站列表',
          'GET /waystations/search': '搜索驿站',
          'GET /waystations/services': '按服务类型筛选驿站',
          'GET /waystations/statistics': '获取驿站统计信息',
          'GET /waystations/bounds': '根据地图边界获取驿站',
          'GET /waystations/:id': '获取单个驿站详情'
        },
        images: {
          'GET /images': '获取所有图片',
          'GET /images/homepage': '获取主页图片',
          'GET /images/name/:name': '根据图片名获取图片',
          'GET /images/:id': '获取单个图片',
          'POST /images': '创建新图片',
          'PUT /images/:id': '更新图片',
          'DELETE /images/:id': '删除图片'
        },
        destinations: {
          'GET /destinations': '获取所有目标点列表',
          'GET /destinations/search': '搜索目标点',
          'GET /destinations/statistics': '获取目标点统计信息',
          'GET /destinations/bounds': '根据地图边界获取目标点',
          'GET /destinations/route/:routeId': '根据线路ID获取目标点',
          'GET /destinations/:id': '获取单个目标点详情'
        },
        routes: {
          'GET /routes': '获取所有路线列表',
          'GET /routes/search': '搜索路线',
          'GET /routes/distance': '按里程范围筛选路线',
          'GET /routes/days': '按天数范围筛选路线',
          'GET /routes/condition': '按路况筛选路线',
          'GET /routes/regions': '获取所有地区列表',
          'GET /routes/waypoint/:waypointId': '根据单个途径地点ID筛选路线',
          'GET /routes/waypoints/all': '根据多个途径地点ID筛选路线（包含所有地点）',
          'GET /routes/waypoints/any': '根据途径地点ID筛选路线（包含任一地点）',
          'GET /routes/popular': '获取热门路线',
          'GET /routes/statistics': '获取路线统计信息',
          'GET /routes/:id/waypoints': '获取路线的途径点详情',
          'GET /routes/:id': '获取单个路线详情'
        }
      },
      examples: {
        // 驿站示例
        getAllWaystations: `${API_PREFIX}/waystations?limit=10&offset=0&region=北京`,
        searchWaystations: `${API_PREFIX}/waystations/search?q=青海湖`,
        getByServices: `${API_PREFIX}/waystations/services?accommodation=1&bike_rental=1`,
        getInBounds: `${API_PREFIX}/waystations/bounds?minLat=39&maxLat=40&minLng=116&maxLng=117`,
        getWaystationById: `${API_PREFIX}/waystations/1`,
        
        // 图片示例
        getAllImages: `${API_PREFIX}/images`,
        getHomepageImages: `${API_PREFIX}/images/homepage`,
        getImagesByName: `${API_PREFIX}/images/name/牧场`,
        
        // 目标点示例
        getAllDestinations: `${API_PREFIX}/destinations?limit=10&offset=0&region=青海`,
        searchDestinations: `${API_PREFIX}/destinations/search?q=青海湖`,
        getDestinationsInBounds: `${API_PREFIX}/destinations/bounds?minLat=36&maxLat=37&minLng=99&maxLng=101`,
        getDestinationsByRoute: `${API_PREFIX}/destinations/route/1`,
        getDestinationById: `${API_PREFIX}/destinations/1`,
        
        // 路线示例
        getAllRoutes: `${API_PREFIX}/routes?limit=10&offset=0&region=青海`,
        searchRoutes: `${API_PREFIX}/routes/search?q=青海湖环线`,
        getRoutesByDistance: `${API_PREFIX}/routes/distance?min=100&max=500`,
        getRoutesByDays: `${API_PREFIX}/routes/days?min=3&max=7`,
        getRoutesByCondition: `${API_PREFIX}/routes/condition?q=良好`,
        getAllRegions: `${API_PREFIX}/routes/regions`,
        getRoutesByWaypoint: `${API_PREFIX}/routes/waypoint/1`,
        getRoutesByWaypointsAll: `${API_PREFIX}/routes/waypoints/all?ids=1,2,3`,
        getRoutesByWaypointsAny: `${API_PREFIX}/routes/waypoints/any?ids=1,2,3`,
        getPopularRoutes: `${API_PREFIX}/routes/popular?limit=5`,
        getRouteWaypoints: `${API_PREFIX}/routes/1/waypoints`,
        getRouteById: `${API_PREFIX}/routes/1`
      }
    });
  });
}

/**
 * 错误处理中间件
 */
app.use(notFound);
app.use(errorHandler);

/**
 * 启动服务器
 */
const startServer = async () => {
  try {
    // 测试数据库连接
    await testConnection();
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log('🚀 ========================================');
      console.log(`🚀 517骑行驿站后端服务已启动`);
      console.log(`🚀 环境: ${NODE_ENV}`);
      console.log(`🚀 端口: ${PORT}`);
      console.log(`🚀 API 前缀: ${API_PREFIX}`);
      console.log(`🚀 健康检查: http://localhost:${PORT}/health`);
      if (NODE_ENV === 'development') {
        console.log(`🚀 API 文档: http://localhost:${PORT}${API_PREFIX}/docs`);
      }
      console.log('🚀 ========================================');
    });
    
  } catch (error) {
    console.error('❌ 服务启动失败:', error.message);
    process.exit(1);
  }
};

/**
 * 优雅关闭处理
 */
process.on('SIGTERM', () => {
  console.log('📋 收到 SIGTERM 信号，正在优雅关闭服务...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📋 收到 SIGINT 信号，正在优雅关闭服务...');
  process.exit(0);
});

// 启动服务器
startServer();

module.exports = app;
