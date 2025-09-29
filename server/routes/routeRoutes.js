/**
 * 路线路由配置
 * 定义路线相关的 API 路由
 */

const express = require('express');
const { param, query } = require('express-validator');
const RouteController = require('../controllers/routeController');

const router = express.Router();

/**
 * @route   GET /api/v1/routes
 * @desc    获取所有路线列表
 * @access  Public
 * @params  ?limit=10&offset=0&region=北京
 */
router.get('/', 
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit 必须是 1-100 之间的整数'),
    query('offset').optional().isInt({ min: 0 }).withMessage('offset 必须是非负整数'),
    query('region').optional().isString().isLength({ min: 1, max: 50 }).withMessage('region 长度必须在 1-50 字符之间')
  ],
  RouteController.getAllRoutes
);

/**
 * @route   GET /api/v1/routes/search
 * @desc    搜索路线
 * @access  Public
 * @params  ?q=keyword
 */
router.get('/search',
  [
    query('q').notEmpty().isLength({ min: 2, max: 50 }).withMessage('搜索关键词长度必须在 2-50 字符之间')
  ],
  RouteController.searchRoutes
);

/**
 * @route   GET /api/v1/routes/distance
 * @desc    根据里程范围筛选路线
 * @access  Public
 * @params  ?min=100&max=500
 */
router.get('/distance',
  [
    query('min').notEmpty().isInt({ min: 0 }).withMessage('min 必须是非负整数'),
    query('max').notEmpty().isInt({ min: 0 }).withMessage('max 必须是非负整数')
  ],
  RouteController.getRoutesByDistance
);

/**
 * @route   GET /api/v1/routes/days
 * @desc    根据预计天数范围筛选路线
 * @access  Public
 * @params  ?min=1&max=7
 */
router.get('/days',
  [
    query('min').notEmpty().isFloat({ min: 0 }).withMessage('min 必须是非负数'),
    query('max').notEmpty().isFloat({ min: 0 }).withMessage('max 必须是非负数')
  ],
  RouteController.getRoutesByDays
);

/**
 * @route   GET /api/v1/routes/condition
 * @desc    根据路况筛选路线
 * @access  Public
 * @params  ?q=良好
 */
router.get('/condition',
  [
    query('q').notEmpty().isLength({ min: 1, max: 20 }).withMessage('路况条件长度必须在 1-20 字符之间')
  ],
  RouteController.getRoutesByRoadCondition
);

/**
 * @route   GET /api/v1/routes/waypoints/all
 * @desc    根据多个途径地点ID筛选路线（包含所有指定地点）
 * @access  Public
 * @params  ?ids=1,2,3
 */
router.get('/waypoints/all',
  [
    query('ids').notEmpty().withMessage('ids 参数不能为空')
  ],
  RouteController.getRoutesByWaypointIds
);

/**
 * @route   GET /api/v1/routes/waypoints/any
 * @desc    根据途径地点ID筛选路线（包含任一指定地点）
 * @access  Public
 * @params  ?ids=1,2,3
 */
router.get('/waypoints/any',
  [
    query('ids').notEmpty().withMessage('ids 参数不能为空')
  ],
  RouteController.getRoutesByAnyWaypointIds
);

/**
 * @route   GET /api/v1/routes/waypoint/:waypointId
 * @desc    根据单个途径地点ID筛选路线
 * @access  Public
 * @params  waypointId (路径参数)
 */
router.get('/waypoint/:waypointId',
  [
    param('waypointId').isInt({ min: 1 }).withMessage('途径地点ID必须是正整数')
  ],
  RouteController.getRoutesByWaypointId
);

/**
 * @route   GET /api/v1/routes/regions
 * @desc    获取所有地区列表
 * @access  Public
 */
router.get('/regions', RouteController.getAllRegions);

/**
 * @route   GET /api/v1/routes/popular
 * @desc    获取热门路线
 * @access  Public
 * @params  ?limit=10
 */
router.get('/popular',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit 必须是 1-100 之间的整数')
  ],
  RouteController.getPopularRoutes
);

/**
 * @route   GET /api/v1/routes/scenery-score
 * @desc    根据风景评分范围筛选路线
 * @access  Public
 * @params  ?min=1&max=10
 */
router.get('/scenery-score',
  [
    query('min').notEmpty().isInt({ min: 1, max: 10 }).withMessage('min 必须是 1-10 之间的整数'),
    query('max').notEmpty().isInt({ min: 1, max: 10 }).withMessage('max 必须是 1-10 之间的整数')
  ],
  RouteController.getRoutesBySceneryScore
);

/**
 * @route   GET /api/v1/routes/difficulty-score
 * @desc    根据路况难度评分范围筛选路线
 * @access  Public
 * @params  ?min=1&max=10
 */
router.get('/difficulty-score',
  [
    query('min').notEmpty().isInt({ min: 1, max: 10 }).withMessage('min 必须是 1-10 之间的整数'),
    query('max').notEmpty().isInt({ min: 1, max: 10 }).withMessage('max 必须是 1-10 之间的整数')
  ],
  RouteController.getRoutesByDifficultyScore
);

/**
 * @route   GET /api/v1/routes/filters
 * @desc    根据多个条件筛选路线（包含评分条件）
 * @access  Public
 * @params  ?region=北京&minDistance=100&maxDistance=500&minDays=1&maxDays=7&minSceneryScore=5&maxSceneryScore=10&minDifficultyScore=1&maxDifficultyScore=5
 */
router.get('/filters',
  [
    query('region').optional().isString().isLength({ min: 1, max: 50 }).withMessage('region 长度必须在 1-50 字符之间'),
    query('minDistance').optional().isInt({ min: 0 }).withMessage('minDistance 必须是非负整数'),
    query('maxDistance').optional().isInt({ min: 0 }).withMessage('maxDistance 必须是非负整数'),
    query('minDays').optional().isFloat({ min: 0 }).withMessage('minDays 必须是非负数'),
    query('maxDays').optional().isFloat({ min: 0 }).withMessage('maxDays 必须是非负数'),
    query('minSceneryScore').optional().isInt({ min: 1, max: 10 }).withMessage('minSceneryScore 必须是 1-10 之间的整数'),
    query('maxSceneryScore').optional().isInt({ min: 1, max: 10 }).withMessage('maxSceneryScore 必须是 1-10 之间的整数'),
    query('minDifficultyScore').optional().isInt({ min: 1, max: 10 }).withMessage('minDifficultyScore 必须是 1-10 之间的整数'),
    query('maxDifficultyScore').optional().isInt({ min: 1, max: 10 }).withMessage('maxDifficultyScore 必须是 1-10 之间的整数'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit 必须是 1-100 之间的整数'),
    query('offset').optional().isInt({ min: 0 }).withMessage('offset 必须是非负整数')
  ],
  RouteController.getRoutesByMultipleFilters
);

/**
 * @route   POST /api/v1/routes/smart-match
 * @desc    智能匹配路线
 * @access  Public
 * @body    { difficulty, sceneryPriority, cyclingType, days, weatherScore, limit }
 */
router.post('/smart-match', RouteController.getSmartMatchedRoutes);

/**
 * @route   GET /api/v1/routes/statistics
 * @desc    获取路线统计信息
 * @access  Public
 */
router.get('/statistics', RouteController.getRouteStatistics);

/**
 * @route   GET /api/v1/routes/region-statistics
 * @desc    获取基于地区的综合统计信息
 * @access  Public
 * @query   region (可选) - 地区名称，不传或传"全部"表示所有地区
 */
router.get('/region-statistics', RouteController.getRegionStatistics);

/**
 * @route   GET /api/v1/routes/:id/waypoints
 * @desc    获取路线的途径点详情
 * @access  Public
 * @params  id (路径参数)
 */
router.get('/:id/waypoints',
  [
    param('id').isInt({ min: 1 }).withMessage('ID 必须是正整数')
  ],
  RouteController.getRouteWaypoints
);

/**
 * @route   GET /api/v1/routes/:id
 * @desc    根据 ID 获取单个路线详情
 * @access  Public
 * @params  id (路径参数)
 */
router.get('/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('ID 必须是正整数')
  ],
  RouteController.getRouteById
);

module.exports = router;
