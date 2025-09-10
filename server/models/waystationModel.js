/**
 * 驿站数据模型
 * 负责处理 Waystation 表的数据库操作
 */

const { query } = require('../config/database');

class WaystationModel {
  /**
   * 获取所有驿站信息
   * @param {Object} options - 查询选项
   * @param {number} options.limit - 限制返回数量
   * @param {number} options.offset - 偏移量
   * @param {string} options.region - 地区筛选
   * @returns {Promise<Array>} 驿站列表
   */
  static async getAllWaystations(options = {}) {
    const { limit, offset, region } = options;
    
    let sql = `
      SELECT 
        "ID",
        "地区" as region,
        "点名称" as name,
        "地址" as address,
        "longitude",
        "latitude" as latitude,
        "点备注" as remarks,
        "负责人联系方式" as contact,
        "图片" as image,
        "住宿" as accommodation,
        "租车" as bike_rental,
        "还车" as bike_return,
        "维修" as maintenance
      FROM "public"."Waystation"
    `;
    
    const conditions = [];
    const params = [];
    let paramIndex = 1;
    
    // 地区筛选
    if (region) {
      conditions.push(`"地区" = $${paramIndex}`);
      params.push(region);
      paramIndex++;
    }
    
    // 添加条件
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    // 排序
    sql += ' ORDER BY "ID" ASC';
    
    // 分页
    if (limit) {
      sql += ` LIMIT $${paramIndex}`;
      params.push(limit);
      paramIndex++;
    }
    
    if (offset) {
      sql += ` OFFSET $${paramIndex}`;
      params.push(offset);
    }
    
    try {
      const result = await query(sql, params);
      return result.rows;
    } catch (error) {
      console.error('获取驿站列表失败:', error);
      throw new Error('获取驿站信息失败');
    }
  }

  /**
   * 根据 ID 获取单个驿站信息
   * @param {number} id - 驿站 ID
   * @returns {Promise<Object|null>} 驿站信息
   */
  static async getWaystationById(id) {
    const sql = `
      SELECT 
        "ID",
        "地区" as region,
        "点名称" as name,
        "地址" as address,
        "longitude",
        "latitude" as latitude,
        "点备注" as remarks,
        "负责人联系方式" as contact,
        "图片" as image,
        "住宿" as accommodation,
        "租车" as bike_rental,
        "还车" as bike_return,
        "维修" as maintenance
      FROM "public"."Waystation"
      WHERE "ID" = $1
    `;
    
    try {
      const result = await query(sql, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('获取驿站详情失败:', error);
      throw new Error('获取驿站详情失败');
    }
  }

  /**
   * 根据名称搜索驿站
   * @param {string} searchTerm - 搜索关键词
   * @returns {Promise<Array>} 匹配的驿站列表
   */
  static async searchWaystationsByName(searchTerm) {
    const sql = `
      SELECT 
        "ID",
        "地区" as region,
        "点名称" as name,
        "地址" as address,
        "longitude",
        "latitude" as latitude,
        "点备注" as remarks,
        "负责人联系方式" as contact,
        "图片" as image,
        "住宿" as accommodation,
        "租车" as bike_rental,
        "还车" as bike_return,
        "维修" as maintenance
      FROM "public"."Waystation"
      WHERE "点名称" ILIKE $1 OR "地址" ILIKE $1
      ORDER BY "ID" ASC
    `;
    
    try {
      const searchPattern = `%${searchTerm}%`;
      const result = await query(sql, [searchPattern]);
      return result.rows;
    } catch (error) {
      console.error('搜索驿站失败:', error);
      throw new Error('搜索驿站失败');
    }
  }

  /**
   * 根据服务类型筛选驿站
   * @param {Object} services - 服务类型
   * @param {boolean} services.accommodation - 是否提供住宿
   * @param {boolean} services.bike_rental - 是否提供租车
   * @param {boolean} services.bike_return - 是否提供还车
   * @param {boolean} services.maintenance - 是否提供维修
   * @returns {Promise<Array>} 符合条件的驿站列表
   */
  static async getWaystationsByServices(services) {
    const conditions = [];
    const params = [];
    let paramIndex = 1;
    
    // 构建服务筛选条件
    if (services.accommodation) {
      conditions.push(`"住宿" = $${paramIndex}`);
      params.push(1);
      paramIndex++;
    }
    
    if (services.bike_rental) {
      conditions.push(`"租车" = $${paramIndex}`);
      params.push(1);
      paramIndex++;
    }
    
    if (services.bike_return) {
      conditions.push(`"还车" = $${paramIndex}`);
      params.push(1);
      paramIndex++;
    }
    
    if (services.maintenance) {
      conditions.push(`"维修" = $${paramIndex}`);
      params.push(1);
      paramIndex++;
    }
    
    if (conditions.length === 0) {
      throw new Error('至少需要指定一种服务类型');
    }
    
    const sql = `
      SELECT 
        "ID",
        "地区" as region,
        "点名称" as name,
        "地址" as address,
        "longitude",
        "latitude" as latitude,
        "点备注" as remarks,
        "负责人联系方式" as contact,
        "图片" as image,
        "住宿" as accommodation,
        "租车" as bike_rental,
        "还车" as bike_return,
        "维修" as maintenance
      FROM "public"."Waystation"
      WHERE ${conditions.join(' AND ')}
      ORDER BY "ID" ASC
    `;
    
    try {
      const result = await query(sql, params);
      return result.rows;
    } catch (error) {
      console.error('按服务筛选驿站失败:', error);
      throw new Error('按服务筛选驿站失败');
    }
  }

  /**
   * 获取指定地区的驿站统计信息
   * @returns {Promise<Array>} 各地区驿站统计
   */
  static async getWaystationStatistics() {
    const sql = `
      SELECT 
        "地区" as region,
        COUNT(*) as total_count,
        SUM("住宿") as accommodation_count,
        SUM("租车") as bike_rental_count,
        SUM("还车") as bike_return_count,
        SUM("维修") as maintenance_count
      FROM "public"."Waystation"
      WHERE "地区" IS NOT NULL
      GROUP BY "地区"
      ORDER BY total_count DESC
    `;
    
    try {
      const result = await query(sql);
      return result.rows;
    } catch (error) {
      console.error('获取驿站统计失败:', error);
      throw new Error('获取驿站统计失败');
    }
  }

  /**
   * 根据经纬度范围获取驿站（用于地图显示）
   * @param {Object} bounds - 经纬度边界
   * @param {number} bounds.minLat - 最小纬度
   * @param {number} bounds.maxLat - 最大纬度
   * @param {number} bounds.minLng - 最小经度
   * @param {number} bounds.maxLng - 最大经度
   * @returns {Promise<Array>} 指定区域内的驿站
   */
  static async getWaystationsInBounds(bounds) {
    const { minLat, maxLat, minLng, maxLng } = bounds;
    
    const sql = `
      SELECT 
        "ID",
        "地区" as region,
        "点名称" as name,
        "地址" as address,
        "longitude",
        "latitude" as latitude,
        "点备注" as remarks,
        "负责人联系方式" as contact,
        "图片" as image,
        "住宿" as accommodation,
        "租车" as bike_rental,
        "还车" as bike_return,
        "维修" as maintenance
      FROM "public"."Waystation"
      WHERE "latitude" BETWEEN $1 AND $2
        AND "longitude" BETWEEN $3 AND $4
        AND "latitude" IS NOT NULL 
        AND "longitude" IS NOT NULL
      ORDER BY "ID" ASC
    `;
    
    try {
      const result = await query(sql, [minLat, maxLat, minLng, maxLng]);
      return result.rows;
    } catch (error) {
      console.error('获取指定区域驿站失败:', error);
      throw new Error('获取指定区域驿站失败');
    }
  }
}

module.exports = WaystationModel;
