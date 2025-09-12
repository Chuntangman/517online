/**
 * 目标点路由配置
 * 定义目标点相关的 API 路由
 */

const express = require('express');
const { param, query } = require('express-validator');
const DestinationController = require('../controllers/destinationController');

const router = express.Router();

/**
 * @route   GET /api/v1/destinations
 * @desc    获取所有目标点列表
 * @access  Public
 * @params  ?limit=10&offset=0&region=北京
 */
router.get('/', 
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit 必须是 1-100 之间的整数'),
    query('offset').optional().isInt({ min: 0 }).withMessage('offset 必须是非负整数'),
    query('region').optional().isString().isLength({ min: 1, max: 50 }).withMessage('region 长度必须在 1-50 字符之间')
  ],
  DestinationController.getAllDestinations
);

/**
 * @route   GET /api/v1/destinations/search
 * @desc    搜索目标点
 * @access  Public
 * @params  ?q=keyword
 */
router.get('/search',
  [
    query('q').notEmpty().isLength({ min: 2, max: 50 }).withMessage('搜索关键词长度必须在 2-50 字符之间')
  ],
  DestinationController.searchDestinations
);

/**
 * @route   GET /api/v1/destinations/statistics
 * @desc    获取目标点统计信息
 * @access  Public
 */
router.get('/statistics', DestinationController.getDestinationStatistics);

/**
 * @route   GET /api/v1/destinations/bounds
 * @desc    根据地图边界获取目标点
 * @access  Public
 * @params  ?minLat=39&maxLat=40&minLng=116&maxLng=117
 */
router.get('/bounds',
  [
    query('minLat').notEmpty().isFloat({ min: -90, max: 90 }).withMessage('minLat 必须是有效的纬度'),
    query('maxLat').notEmpty().isFloat({ min: -90, max: 90 }).withMessage('maxLat 必须是有效的纬度'),
    query('minLng').notEmpty().isFloat({ min: -180, max: 180 }).withMessage('minLng 必须是有效的经度'),
    query('maxLng').notEmpty().isFloat({ min: -180, max: 180 }).withMessage('maxLng 必须是有效的经度')
  ],
  DestinationController.getDestinationsInBounds
);

/**
 * @route   GET /api/v1/destinations/route/:routeId
 * @desc    根据热门线路ID获取目标点
 * @access  Public
 * @params  routeId (路径参数)
 */
router.get('/route/:routeId',
  [
    param('routeId').isInt({ min: 1 }).withMessage('路线ID必须是正整数')
  ],
  DestinationController.getDestinationsByRouteId
);

/**
 * @route   GET /api/v1/destinations/:id
 * @desc    根据 ID 获取单个目标点详情
 * @access  Public
 * @params  id (路径参数)
 */
router.get('/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('ID 必须是正整数')
  ],
  DestinationController.getDestinationById
);

module.exports = router;
