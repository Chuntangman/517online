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
 * @route   GET /api/v1/routes/statistics
 * @desc    获取路线统计信息
 * @access  Public
 */
router.get('/statistics', RouteController.getRouteStatistics);

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
