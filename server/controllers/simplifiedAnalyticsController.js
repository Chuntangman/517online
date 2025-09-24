/**
 * 精简的用户分析控制器
 * 只处理有价值的用户行为数据
 */

const UserBehaviorSimplifiedModel = require('../models/userBehaviorSimplifiedModel');
const { getCacheStats } = require('../utils/simplifiedAnalytics');

/**
 * 手动记录轨迹回放使用
 */
const recordTrajectoryPlayback = async (req, res) => {
  try {
    const {
      session_id,
      route_id,
      route_name,
      waypoints_count,
      playback_source
    } = req.body;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: '缺少会话ID'
      });
    }

    const result = await UserBehaviorSimplifiedModel.recordTrajectoryPlayback({
      session_id,
      route_id,
      route_name,
      waypoints_count,
      playback_source
    });

    res.status(201).json({
      success: true,
      message: '轨迹回放记录成功',
      data: result
    });

  } catch (error) {
    console.error('记录轨迹回放失败:', error);
    res.status(500).json({
      success: false,
      message: '记录轨迹回放失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '内部服务器错误'
    });
  }
};

/**
 * 获取用户行为统计
 */
const getBehaviorStatistics = async (req, res) => {
  try {
    const { start_date, end_date, action_type } = req.query;

    const filters = {
      start_date,
      end_date,
      action_type
    };

    const statistics = await UserBehaviorSimplifiedModel.getStatistics(filters);

    res.status(200).json({
      success: true,
      message: '获取用户行为统计成功',
      data: statistics
    });

  } catch (error) {
    console.error('获取用户行为统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户行为统计失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '内部服务器错误'
    });
  }
};

/**
 * 获取热门路线点击统计
 */
const getPopularRouteStats = async (req, res) => {
  try {
    const { start_date, end_date, limit = 20 } = req.query;

    const filters = {
      start_date,
      end_date,
      limit: parseInt(limit)
    };

    const statistics = await UserBehaviorSimplifiedModel.getPopularRouteStats(filters);

    res.status(200).json({
      success: true,
      message: '获取热门路线统计成功',
      data: statistics
    });

  } catch (error) {
    console.error('获取热门路线统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取热门路线统计失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '内部服务器错误'
    });
  }
};

/**
 * 获取导航偏好统计
 */
const getNavigationPreferences = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const filters = { start_date, end_date };
    const statistics = await UserBehaviorSimplifiedModel.getNavigationPreferences(filters);

    res.status(200).json({
      success: true,
      message: '获取导航偏好统计成功',
      data: statistics
    });

  } catch (error) {
    console.error('获取导航偏好统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取导航偏好统计失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '内部服务器错误'
    });
  }
};

/**
 * 获取综合分析报告
 */
const getAnalyticsReport = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const filters = { start_date, end_date };

    // 并行获取各种统计数据
    const [
      behaviorStats,
      popularRouteStats,
      navigationPreferences
    ] = await Promise.all([
      UserBehaviorSimplifiedModel.getStatistics(filters),
      UserBehaviorSimplifiedModel.getPopularRouteStats({ ...filters, limit: 10 }),
      UserBehaviorSimplifiedModel.getNavigationPreferences(filters)
    ]);

    // 计算唯一会话数
    let uniqueSessionsCount = 0;
    if (behaviorStats.statistics && typeof behaviorStats.statistics === 'object') {
      Object.values(behaviorStats.statistics).forEach(statArray => {
        if (Array.isArray(statArray)) {
          statArray.forEach(stat => {
            uniqueSessionsCount += parseInt(stat.unique_sessions || 0);
          });
        }
      });
    }

    const report = {
      summary: {
        total_actions: behaviorStats.total_records,
        unique_sessions: uniqueSessionsCount,
        report_period: {
          start_date: start_date || 'all_time',
          end_date: end_date || 'now'
        }
      },
      behavior_analytics: behaviorStats,
      popular_routes: popularRouteStats,
      navigation_preferences: navigationPreferences,
      insights: {
        most_used_route_policy: navigationPreferences[0]?.route_policy || 'unknown',
        most_clicked_route: popularRouteStats[0]?.route_name || 'none',
        preferred_search_mode: navigationPreferences[0]?.search_mode || 'unknown'
      }
    };

    res.status(200).json({
      success: true,
      message: '获取分析报告成功',
      data: report
    });

  } catch (error) {
    console.error('获取分析报告失败:', error);
    res.status(500).json({
      success: false,
      message: '获取分析报告失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '内部服务器错误'
    });
  }
};

/**
 * 分析系统健康检查
 */
const getAnalyticsHealth = async (req, res) => {
  try {
    // 获取缓存统计信息
    const cacheStats = getCacheStats();
    
    // 检查数据库连接（通过简单查询）
    const dbHealthCheck = await UserBehaviorSimplifiedModel.getStatistics({ 
      start_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      cache_statistics: cacheStats,
      database_status: 'connected',
      recent_24h_records: dbHealthCheck.total_records || 0,
      memory_usage: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      }
    };

    res.status(200).json({
      success: true,
      message: '精简用户分析系统运行正常',
      data: health
    });

  } catch (error) {
    console.error('分析系统健康检查失败:', error);
    res.status(503).json({
      success: false,
      message: '用户分析系统异常',
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: process.env.NODE_ENV === 'development' ? error.message : '系统异常'
      }
    });
  }
};

module.exports = {
  recordTrajectoryPlayback,
  getBehaviorStatistics,
  getPopularRouteStats,
  getNavigationPreferences,
  getAnalyticsReport,
  getAnalyticsHealth
};
