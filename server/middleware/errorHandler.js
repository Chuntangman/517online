/**
 * 全局错误处理中间件
 * 统一处理应用中的错误
 */

/**
 * 404 错误处理中间件
 */
const notFound = (req, res, next) => {
  const error = new Error(`未找到路径 - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * 全局错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  // 如果响应状态码不是错误状态码，设置为 500
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // 处理特定的数据库错误
  if (err.code) {
    switch (err.code) {
      case '23505': // 唯一约束违反
        statusCode = 409;
        message = '数据已存在，违反唯一性约束';
        break;
      case '23503': // 外键约束违反
        statusCode = 400;
        message = '违反外键约束';
        break;
      case '23502': // 非空约束违反
        statusCode = 400;
        message = '缺少必需字段';
        break;
      case '42P01': // 表不存在
        statusCode = 500;
        message = '数据库表不存在';
        break;
      case '28P01': // 身份验证失败
        statusCode = 500;
        message = '数据库连接认证失败';
        break;
      case 'ECONNREFUSED': // 连接被拒绝
        statusCode = 500;
        message = '无法连接到数据库';
        break;
      default:
        // 保持原始错误信息
        break;
    }
  }

  // 记录错误日志
  console.error(`❌ 错误 [${statusCode}]: ${message}`, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // 返回错误响应
  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: {
        url: req.originalUrl,
        method: req.method,
        body: req.body,
        query: req.query,
        params: req.params
      }
    })
  });
};

module.exports = {
  notFound,
  errorHandler
};
