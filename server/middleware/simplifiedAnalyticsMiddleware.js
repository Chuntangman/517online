/**
 * 精简的用户分析中间件
 * 只记录有价值的用户行为偏好数据
 */

const UserBehaviorSimplifiedModel = require('../models/userBehaviorSimplifiedModel');
const { shouldRecordBehavior, getSessionId } = require('../utils/simplifiedAnalytics');

/**
 * 记录导航路线规划
 */
const recordRouteNavigation = async (req, res, next) => {
  // 只在路线规划成功时记录
  const originalSend = res.send;
  
  res.send = function(data) {
    // 检查是否是成功的路线规划响应
    if (res.statusCode === 200 && req.body && 
        (req.body.start_point || req.body.end_point || req.body.startCoordinates)) {
      
      const sessionId = getSessionId(req);
      
      // 防止重复记录
      if (shouldRecordBehavior(sessionId, 'route_navigation', 
          `${req.body.start_point || ''}-${req.body.end_point || ''}`)) {
        
        // 异步记录，不阻塞响应
        setImmediate(async () => {
          try {
            await UserBehaviorSimplifiedModel.recordRouteNavigation({
              session_id: sessionId,
              start_point: req.body.start_point || req.body.startCoordinates,
              end_point: req.body.end_point || req.body.endCoordinates,
              waypoints: req.body.waypoints,
              route_policy: req.body.route_policy || req.body.routePolicy,
              search_mode: req.body.search_mode || req.body.searchMode,
              distance: req.body.distance,
              duration: req.body.duration,
              smart_sampling_enabled: req.body.smart_sampling_enabled || req.body.enableSmartSampling
            });
          } catch (error) {
            console.error('记录路线导航失败:', error);
          }
        });
      }
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

/**
 * 记录热门路线点击
 */
const recordPopularRouteClick = async (req, res, next) => {
  // 检查是否是获取路线详情的请求
  if (req.method === 'GET' && req.path.match(/^\/api\/v1\/routes\/\d+\/waypoints$/)) {
    const routeId = req.params.id || req.path.match(/\/routes\/(\d+)\//)?.[1];
    
    if (routeId) {
      const sessionId = getSessionId(req);
      
      // 防止重复记录（同一路线5分钟内只记录一次）
      if (shouldRecordBehavior(sessionId, 'popular_route_click', routeId)) {
        // 异步记录，不阻塞响应
        setImmediate(async () => {
          try {
            await UserBehaviorSimplifiedModel.recordPopularRouteClick({
              session_id: sessionId,
              route_id: routeId,
              route_name: req.query.name || '未知路线',
              route_region: req.query.region || '未知地区',
              route_distance: req.query.distance,
              route_duration: req.query.duration,
              click_source: 'popular_routes'
            });
          } catch (error) {
            console.error('记录热门路线点击失败:', error);
          }
        });
      }
    }
  }
  
  next();
};

/**
 * 记录智能路线匹配使用
 */
const recordSmartRouteMatch = async (req, res, next) => {
  // 检查是否是智能路线匹配请求
  if (req.method === 'POST' && req.path === '/api/v1/routes/smart-match') {
    const sessionId = getSessionId(req);
    
    // 防止重复记录
    if (shouldRecordBehavior(sessionId, 'smart_route_match', 
        JSON.stringify(req.body.preferences || {}))) {
      
      const originalSend = res.send;
      
      res.send = function(data) {
        // 在成功响应时记录
        if (res.statusCode === 200) {
          setImmediate(async () => {
            try {
              let matchedRoutesCount = 0;
              let selectedRoute = null;
              
              // 尝试解析响应数据
              try {
                const responseData = typeof data === 'string' ? JSON.parse(data) : data;
                if (responseData.success && responseData.data) {
                  matchedRoutesCount = Array.isArray(responseData.data) ? 
                    responseData.data.length : 0;
                  selectedRoute = responseData.data[0] || null;
                }
              } catch (parseError) {
                console.warn('解析智能匹配响应数据失败:', parseError);
              }
              
              await UserBehaviorSimplifiedModel.recordSmartRouteMatch({
                session_id: sessionId,
                match_criteria: req.body.criteria || {},
                preferred_distance: req.body.preferences?.distance,
                preferred_days: req.body.preferences?.days,
                preferred_difficulty: req.body.preferences?.difficulty,
                weather_preference: req.body.preferences?.weather,
                matched_routes_count: matchedRoutesCount,
                selected_route: selectedRoute
              });
            } catch (error) {
              console.error('记录智能路线匹配失败:', error);
            }
          });
        }
        
        originalSend.call(this, data);
      };
    }
  }
  
  next();
};

/**
 * 启动数据清理任务
 */
const startDataCleanupTask = () => {
  // 每天凌晨2点清理过期数据（保留90天）
  const cleanupInterval = 24 * 60 * 60 * 1000; // 24小时

  const cleanup = async () => {
    try {
      console.log('🧹 开始清理过期的用户行为数据...');
      const deletedCount = await UserBehaviorSimplifiedModel.cleanupOldRecords(90);
      console.log(`🧹 数据清理完成，删除了 ${deletedCount} 条记录`);
    } catch (error) {
      console.error('数据清理任务失败:', error);
    }
  };

  // 启动时执行一次（延迟1分钟）
  setTimeout(cleanup, 60000);

  // 设置定时任务
  setInterval(cleanup, cleanupInterval);

  console.log('📊 精简用户分析数据清理任务已启动（每24小时执行一次）');
};

module.exports = {
  recordRouteNavigation,
  recordPopularRouteClick,
  recordSmartRouteMatch,
  startDataCleanupTask
};
