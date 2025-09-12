/**
 * 目标点控制器
 * 处理目标点相关的 HTTP 请求和响应
 */

const { validationResult } = require('express-validator');
const DestinationModel = require('../models/destinationModel');

class DestinationController {
  /**
   * 获取所有目标点
   * GET /api/v1/destinations
   */
  static async getAllDestinations(req, res) {
    try {
      // 获取查询参数
      const { limit, offset, region } = req.query;
      
      // 参数验证
      const options = {};
      if (limit) options.limit = parseInt(limit);
      if (offset) options.offset = parseInt(offset);
      if (region) options.region = region;
      
      // 获取数据
      const destinations = await DestinationModel.getAllDestinations(options);
      
      // 返回成功响应
      res.status(200).json({
        success: true,
        message: '获取目标点列表成功',
        data: destinations,
        pagination: {
          limit: options.limit || null,
          offset: options.offset || 0,
          count: destinations.length
        }
      });
      
    } catch (error) {
      console.error('获取目标点列表失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 根据 ID 获取目标点详情
   * GET /api/v1/destinations/:id
   */
  static async getDestinationById(req, res) {
    try {
      // 参数验证
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '参数验证失败',
          errors: errors.array()
        });
      }
      
      const { id } = req.params;
      
      // 获取目标点信息
      const destination = await DestinationModel.getDestinationById(parseInt(id));
      
      if (!destination) {
        return res.status(404).json({
          success: false,
          message: '目标点不存在'
        });
      }
      
      // 返回成功响应
      res.status(200).json({
        success: true,
        message: '获取目标点详情成功',
        data: destination
      });
      
    } catch (error) {
      console.error('获取目标点详情失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 搜索目标点
   * GET /api/v1/destinations/search?q=keyword
   */
  static async searchDestinations(req, res) {
    try {
      const { q: searchTerm } = req.query;
      
      if (!searchTerm || searchTerm.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: '搜索关键词至少需要2个字符'
        });
      }
      
      // 执行搜索
      const destinations = await DestinationModel.searchDestinationsByName(searchTerm.trim());
      
      // 返回搜索结果
      res.status(200).json({
        success: true,
        message: '搜索完成',
        data: destinations,
        searchTerm: searchTerm.trim(),
        count: destinations.length
      });
      
    } catch (error) {
      console.error('搜索目标点失败:', error);
      res.status(500).json({
        success: false,
        message: '搜索失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 根据地图边界获取目标点（用于地图显示）
   * GET /api/v1/destinations/bounds?minLat=39&maxLat=40&minLng=116&maxLng=117
   */
  static async getDestinationsInBounds(req, res) {
    try {
      const { minLat, maxLat, minLng, maxLng } = req.query;
      
      // 参数验证
      if (!minLat || !maxLat || !minLng || !maxLng) {
        return res.status(400).json({
          success: false,
          message: '缺少必要的边界参数 (minLat, maxLat, minLng, maxLng)'
        });
      }
      
      const bounds = {
        minLat: parseFloat(minLat),
        maxLat: parseFloat(maxLat),
        minLng: parseFloat(minLng),
        maxLng: parseFloat(maxLng)
      };
      
      // 验证经纬度范围
      if (bounds.minLat >= bounds.maxLat || bounds.minLng >= bounds.maxLng) {
        return res.status(400).json({
          success: false,
          message: '无效的边界范围'
        });
      }
      
      // 获取指定区域内的目标点
      const destinations = await DestinationModel.getDestinationsInBounds(bounds);
      
      res.status(200).json({
        success: true,
        message: '获取区域目标点成功',
        data: destinations,
        bounds: bounds,
        count: destinations.length
      });
      
    } catch (error) {
      console.error('获取区域目标点失败:', error);
      res.status(500).json({
        success: false,
        message: '获取区域目标点失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 获取目标点统计信息
   * GET /api/v1/destinations/statistics
   */
  static async getDestinationStatistics(req, res) {
    try {
      const statistics = await DestinationModel.getDestinationStatistics();
      
      res.status(200).json({
        success: true,
        message: '获取统计信息成功',
        data: statistics
      });
      
    } catch (error) {
      console.error('获取目标点统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取统计信息失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 根据热门线路ID获取目标点
   * GET /api/v1/destinations/route/:routeId
   */
  static async getDestinationsByRouteId(req, res) {
    try {
      // 参数验证
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '参数验证失败',
          errors: errors.array()
        });
      }
      
      const { routeId } = req.params;
      
      // 获取该线路的目标点
      const destinations = await DestinationModel.getDestinationsByRouteId(parseInt(routeId));
      
      res.status(200).json({
        success: true,
        message: '获取线路目标点成功',
        data: destinations,
        routeId: parseInt(routeId),
        count: destinations.length
      });
      
    } catch (error) {
      console.error('根据线路ID获取目标点失败:', error);
      res.status(500).json({
        success: false,
        message: '获取线路目标点失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = DestinationController;
