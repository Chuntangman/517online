/**
 * 精简的用户分析路由
 * 只提供有价值的用户行为数据接口
 */

const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();

const {
  recordTrajectoryPlayback,
  getBehaviorStatistics,
  getPopularRouteStats,
  getNavigationPreferences,
  getAnalyticsReport,
  getAnalyticsHealth
} = require('../controllers/simplifiedAnalyticsController');

const UserBehaviorSimplifiedModel = require('../models/userBehaviorSimplifiedModel');

/**
 * @route   POST /api/v1/analytics-simple/route-navigation
 * @desc    记录路线导航行为
 * @access  Public
 */
router.post('/route-navigation', [
  body('session_id').notEmpty().withMessage('会话ID不能为空'),
  body('start_point').optional(),
  body('end_point').optional(),
  body('route_policy').optional().isIn(['0', '1', '2']).withMessage('路线策略必须是有效值'),
  body('search_mode').optional().isIn(['coordinates', 'keyword']).withMessage('搜索模式必须是有效值')
], async (req, res) => {
  try {
    const result = await UserBehaviorSimplifiedModel.recordRouteNavigation(req.body);
    res.status(201).json({
      success: true,
      message: '路线导航记录成功',
      data: result
    });
  } catch (error) {
    console.error('记录路线导航失败:', error);
    res.status(500).json({
      success: false,
      message: '记录路线导航失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '内部服务器错误'
    });
  }
});

/**
 * @route   POST /api/v1/analytics-simple/popular-route-click
 * @desc    记录热门路线点击行为
 * @access  Public
 */
router.post('/popular-route-click', [
  body('session_id').notEmpty().withMessage('会话ID不能为空'),
  body('route_id').isNumeric().withMessage('路线ID必须是数字'),
  body('route_name').notEmpty().withMessage('路线名称不能为空')
], async (req, res) => {
  try {
    const result = await UserBehaviorSimplifiedModel.recordPopularRouteClick(req.body);
    res.status(201).json({
      success: true,
      message: '热门路线点击记录成功',
      data: result
    });
  } catch (error) {
    console.error('记录热门路线点击失败:', error);
    res.status(500).json({
      success: false,
      message: '记录热门路线点击失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '内部服务器错误'
    });
  }
});

/**
 * @route   POST /api/v1/analytics-simple/smart-route-match
 * @desc    记录智能路线匹配行为
 * @access  Public
 */
router.post('/smart-route-match', [
  body('session_id').notEmpty().withMessage('会话ID不能为空'),
  body('preferred_difficulty').optional().isIn(['easy', 'medium', 'hard', '简单', '中等', '困难']).withMessage('难度偏好必须是有效值'),
  body('scenery_preference').optional().isInt({ min: 1, max: 10 }).withMessage('风景偏好必须是1-10的整数'),
  body('matched_routes_count').optional().isInt({ min: 0 }).withMessage('匹配路线数量必须是非负整数')
], async (req, res) => {
  try {
    const result = await UserBehaviorSimplifiedModel.recordSmartRouteMatch(req.body);
    res.status(201).json({
      success: true,
      message: '智能路线匹配记录成功',
      data: result
    });
  } catch (error) {
    console.error('记录智能路线匹配失败:', error);
    res.status(500).json({
      success: false,
      message: '记录智能路线匹配失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '内部服务器错误'
    });
  }
});

/**
 * @route   POST /api/v1/analytics-simple/trajectory-playback
 * @desc    手动记录轨迹回放使用
 * @access  Public
 */
router.post('/trajectory-playback', [
  body('session_id')
    .notEmpty()
    .withMessage('会话ID不能为空'),
  body('route_id')
    .optional()
    .isNumeric()
    .withMessage('路线ID必须是数字'),
  body('route_name')
    .optional()
    .isLength({ max: 200 })
    .withMessage('路线名称不能超过200个字符'),
  body('waypoints_count')
    .optional()
    .isInt({ min: 0 })
    .withMessage('途径点数量必须是非负整数'),
  body('playback_source')
    .optional()
    .isIn(['popular_routes', 'smart_match', 'custom'])
    .withMessage('回放来源必须是有效值')
], recordTrajectoryPlayback);

/**
 * @route   GET /api/v1/analytics-simple/statistics/behavior
 * @desc    获取用户行为统计
 * @access  Public
 */
router.get('/statistics/behavior', [
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('开始日期格式不正确'),
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('结束日期格式不正确'),
  query('action_type')
    .optional()
    .isIn(['route_navigation', 'popular_route_click', 'smart_route_match', 'trajectory_playback'])
    .withMessage('无效的行为类型')
], getBehaviorStatistics);

/**
 * @route   GET /api/v1/analytics-simple/statistics/popular-routes
 * @desc    获取热门路线点击统计
 * @access  Public
 */
router.get('/statistics/popular-routes', [
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('开始日期格式不正确'),
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('结束日期格式不正确'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('限制数量应在1-100之间')
], getPopularRouteStats);

/**
 * @route   GET /api/v1/analytics-simple/statistics/navigation-preferences
 * @desc    获取导航偏好统计
 * @access  Public
 */
router.get('/statistics/navigation-preferences', [
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('开始日期格式不正确'),
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('结束日期格式不正确')
], getNavigationPreferences);

/**
 * @route   GET /api/v1/analytics-simple/report
 * @desc    获取综合分析报告
 * @access  Public
 */
router.get('/report', [
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('开始日期格式不正确'),
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('结束日期格式不正确')
], getAnalyticsReport);

/**
 * @route   GET /api/v1/analytics-simple/health
 * @desc    精简用户分析服务健康检查
 * @access  Public
 */
router.get('/health', getAnalyticsHealth);

/**
 * @route   GET /api/v1/analytics-simple
 * @desc    API信息
 * @access  Public
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '精简用户分析服务',
    description: '只记录有价值的用户行为偏好数据',
    timestamp: new Date().toISOString(),
    endpoints: {
      recording: {
        route_navigation: 'POST /api/v1/analytics-simple/route-navigation',
        popular_route_click: 'POST /api/v1/analytics-simple/popular-route-click',
        trajectory_playback: 'POST /api/v1/analytics-simple/trajectory-playback'
      },
      statistics: {
        behavior: 'GET /api/v1/analytics-simple/statistics/behavior',
        popular_routes: 'GET /api/v1/analytics-simple/statistics/popular-routes',
        navigation_preferences: 'GET /api/v1/analytics-simple/statistics/navigation-preferences'
      },
      report: 'GET /api/v1/analytics-simple/report',
      health: 'GET /api/v1/analytics-simple/health'
    },
    data_types: [
      'route_navigation - 导航路线规划记录（起终点、距离、时长、策略等）',
      'popular_route_click - 热门路线点击记录（路线ID、名称、地区等）',
      'smart_route_match - 智能路线匹配使用记录（偏好参数、匹配结果等）',
      'trajectory_playback - 轨迹回放使用记录（路线信息、来源等）'
    ]
  });
});

module.exports = router;
