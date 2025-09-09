/**
 * 数据库配置文件
 * 负责管理 PostgreSQL 数据库连接配置
 */

const { Pool } = require('pg');

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || '517database',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '6912190819',
  // 连接池配置
  max: 20, // 最大连接数
  idleTimeoutMillis: 30000, // 空闲连接超时时间
  connectionTimeoutMillis: 2000, // 连接超时时间
};

// 创建连接池
const pool = new Pool(dbConfig);

/**
 * 测试数据库连接
 */
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ 数据库连接成功');
    client.release();
  } catch (err) {
    console.error('❌ 数据库连接失败:', err.message);
    throw err;
  }
};

/**
 * 执行 SQL 查询
 * @param {string} text - SQL 查询语句
 * @param {Array} params - 查询参数
 * @returns {Promise} 查询结果
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 SQL 查询执行:', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('❌ SQL 查询失败:', err.message);
    throw err;
  }
};

/**
 * 获取数据库客户端连接
 * 用于事务处理
 */
const getClient = async () => {
  return await pool.connect();
};

module.exports = {
  pool,
  query,
  getClient,
  testConnection,
};
