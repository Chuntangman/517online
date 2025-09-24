/**
 * 精简的用户分析系统
 * 只记录有价值的用户行为偏好数据
 */

/**
 * 行为去重缓存 - 防止短时间内重复记录相同行为
 * 格式: { "sessionId:actionType:identifier": timestamp }
 */
const behaviorDeduplicationCache = new Map();

// 去重窗口配置
const BEHAVIOR_DEDUPE_WINDOW = 5 * 60 * 1000; // 5分钟内相同行为去重

/**
 * 清理过期的去重缓存
 */
const cleanupCache = () => {
  const now = Date.now();
  for (const [key, timestamp] of behaviorDeduplicationCache) {
    if (now - timestamp > BEHAVIOR_DEDUPE_WINDOW) {
      behaviorDeduplicationCache.delete(key);
    }
  }
};

// 每分钟清理一次过期缓存
setInterval(cleanupCache, 60 * 1000);

/**
 * 检查行为是否需要记录（去重检查）
 */
const shouldRecordBehavior = (sessionId, actionType, identifier = '') => {
  const dedupeKey = `${sessionId}:${actionType}:${identifier}`;
  const lastRecorded = behaviorDeduplicationCache.get(dedupeKey);
  const now = Date.now();
  
  if (lastRecorded && (now - lastRecorded) < BEHAVIOR_DEDUPE_WINDOW) {
    return false; // 短时间内重复行为，不记录
  }
  
  // 记录时间戳
  behaviorDeduplicationCache.set(dedupeKey, now);
  return true;
};

/**
 * 生成简单的会话ID
 */
const generateSessionId = () => {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

/**
 * 获取或生成会话ID
 */
const getSessionId = (req) => {
  // 优先从请求头获取
  let sessionId = req.get('X-Session-ID');
  
  // 从查询参数获取
  if (!sessionId) {
    sessionId = req.query.session_id;
  }
  
  // 从请求体获取
  if (!sessionId && req.body) {
    sessionId = req.body.session_id;
  }
  
  // 生成新的会话ID
  if (!sessionId) {
    sessionId = generateSessionId();
  }
  
  return sessionId;
};

/**
 * 获取缓存统计信息
 */
const getCacheStats = () => {
  return {
    behaviorDeduplicationCacheSize: behaviorDeduplicationCache.size,
    uptime: process.uptime()
  };
};

module.exports = {
  shouldRecordBehavior,
  generateSessionId,
  getSessionId,
  getCacheStats,
  cleanupCache
};
