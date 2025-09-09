/**
 * 驿站路由配置
 * 定义驿站相关的 API 路由
 */

const express = require('express');
const { param, query } = require('express-validator');
const WaystationController = require('../controllers/waystationController');

const router = express.Router();

/**
 * @route   GET /api/v1/waystations
 * @desc    获取所有驿站列表
 * @access  Public
 * @params  ?limit=10&offset=0&region=北京
 */
router.get('/', 
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit 必须是 1-100 之间的整数'),
    query('offset').optional().isInt({ min: 0 }).withMessage('offset 必须是非负整数'),
    query('region').optional().isString().isLength({ min: 1, max: 50 }).withMessage('region 长度必须在 1-50 字符之间')
  ],
  WaystationController.getAllWaystations
);

/**
 * @route   GET /api/v1/waystations/search
 * @desc    搜索驿站
 * @access  Public
 * @params  ?q=keyword
 */
router.get('/search',
  [
    query('q').notEmpty().isLength({ min: 2, max: 50 }).withMessage('搜索关键词长度必须在 2-50 字符之间')
  ],
  WaystationController.searchWaystations
);

/**
 * @route   GET /api/v1/waystations/services
 * @desc    根据服务类型筛选驿站
 * @access  Public
 * @params  ?accommodation=1&bike_rental=1&bike_return=1&maintenance=1
 */
router.get('/services',
  [
    query('accommodation').optional().isIn(['0', '1']).withMessage('accommodation 必须是 0 或 1'),
    query('bike_rental').optional().isIn(['0', '1']).withMessage('bike_rental 必须是 0 或 1'),
    query('bike_return').optional().isIn(['0', '1']).withMessage('bike_return 必须是 0 或 1'),
    query('maintenance').optional().isIn(['0', '1']).withMessage('maintenance 必须是 0 或 1')
  ],
  WaystationController.getWaystationsByServices
);

/**
 * @route   GET /api/v1/waystations/statistics
 * @desc    获取驿站统计信息
 * @access  Public
 */
router.get('/statistics', WaystationController.getWaystationStatistics);

/**
 * @route   GET /api/v1/waystations/bounds
 * @desc    根据地图边界获取驿站
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
  WaystationController.getWaystationsInBounds
);

/**
 * @route   GET /api/v1/waystations/:id
 * @desc    根据 ID 获取单个驿站详情
 * @access  Public
 * @params  id (路径参数)
 */
router.get('/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('ID 必须是正整数')
  ],
  WaystationController.getWaystationById
);

module.exports = router;
