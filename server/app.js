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
  origin: process.env.CORS_ORIGIN || 'http://localhost:5174',
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
        }
      },
      examples: {
        getAllWaystations: `${API_PREFIX}/waystations?limit=10&offset=0&region=北京`,
        searchWaystations: `${API_PREFIX}/waystations/search?q=青海湖`,
        getByServices: `${API_PREFIX}/waystations/services?accommodation=1&bike_rental=1`,
        getInBounds: `${API_PREFIX}/waystations/bounds?minLat=39&maxLat=40&minLng=116&maxLng=117`,
        getById: `${API_PREFIX}/waystations/1`
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
