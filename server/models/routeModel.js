/**
 * 路线数据模型
 * 负责处理 routetable 表的数据库操作
 */

const { query } = require('../config/database');

class RouteModel {
  /**
   * 获取所有路线信息
   * @param {Object} options - 查询选项
   * @param {number} options.limit - 限制返回数量
   * @param {number} options.offset - 偏移量
   * @param {string} options.region - 地区筛选
   * @returns {Promise<Array>} 路线列表
   */
  static async getAllRoutes(options = {}) {
    const { limit, offset, region } = options;
    
    let sql = `
      SELECT 
        "id",
        "地区" as region,
        "线路名称" as name,
        "预计天数" as estimated_days,
        "里程（km）" as distance_km,
        "途径地点id" as waypoint_ids,
        "路况" as road_condition,
        "备注" as remarks,
        "注意事项" as precautions,
        "途径风景打分" as scenery_score,
        "路况打分" as road_difficulty_score
      FROM "public"."routetable"
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
    sql += ' ORDER BY "id" ASC';
    
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
      console.error('获取路线列表失败:', error);
      throw new Error('获取路线信息失败');
    }
  }

  /**
   * 根据 ID 获取单个路线信息
   * @param {number} id - 路线 ID
   * @returns {Promise<Object|null>} 路线信息
   */
  static async getRouteById(id) {
    const sql = `
      SELECT 
        "id",
        "地区" as region,
        "线路名称" as name,
        "预计天数" as estimated_days,
        "里程（km）" as distance_km,
        "途径地点id" as waypoint_ids,
        "路况" as road_condition,
        "备注" as remarks,
        "注意事项" as precautions,
        "途径风景打分" as scenery_score,
        "路况打分" as road_difficulty_score
      FROM "public"."routetable"
      WHERE "id" = $1
    `;
    
    try {
      const result = await query(sql, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('获取路线详情失败:', error);
      throw new Error('获取路线详情失败');
    }
  }

  /**
   * 根据名称搜索路线
   * @param {string} searchTerm - 搜索关键词
   * @returns {Promise<Array>} 匹配的路线列表
   */
  static async searchRoutesByName(searchTerm) {
    const sql = `
      SELECT 
        "id",
        "地区" as region,
        "线路名称" as name,
        "预计天数" as estimated_days,
        "里程（km）" as distance_km,
        "途径地点id" as waypoint_ids,
        "路况" as road_condition,
        "备注" as remarks,
        "注意事项" as precautions,
        "途径风景打分" as scenery_score,
        "路况打分" as road_difficulty_score
      FROM "public"."routetable"
      WHERE "线路名称" ILIKE $1 OR "备注" ILIKE $1
      ORDER BY "id" ASC
    `;
    
    try {
      const searchPattern = `%${searchTerm}%`;
      const result = await query(sql, [searchPattern]);
      return result.rows;
    } catch (error) {
      console.error('搜索路线失败:', error);
      throw new Error('搜索路线失败');
    }
  }

  /**
   * 根据里程范围筛选路线
   * @param {Object} distanceRange - 里程范围
   * @param {number} distanceRange.min - 最小里程
   * @param {number} distanceRange.max - 最大里程
   * @returns {Promise<Array>} 符合条件的路线列表
   */
  static async getRoutesByDistance(distanceRange) {
    const { min, max } = distanceRange;
    
    const sql = `
      SELECT 
        "id",
        "地区" as region,
        "线路名称" as name,
        "预计天数" as estimated_days,
        "里程（km）" as distance_km,
        "途径地点id" as waypoint_ids,
        "路况" as road_condition,
        "备注" as remarks,
        "注意事项" as precautions,
        "途径风景打分" as scenery_score,
        "路况打分" as road_difficulty_score
      FROM "public"."routetable"
      WHERE "里程（km）" BETWEEN $1 AND $2
        AND "里程（km）" IS NOT NULL
      ORDER BY "里程（km）" ASC
    `;
    
    try {
      const result = await query(sql, [min, max]);
      return result.rows;
    } catch (error) {
      console.error('按里程筛选路线失败:', error);
      throw new Error('按里程筛选路线失败');
    }
  }

  /**
   * 根据预计天数范围筛选路线
   * @param {Object} daysRange - 天数范围
   * @param {number} daysRange.min - 最小天数
   * @param {number} daysRange.max - 最大天数
   * @returns {Promise<Array>} 符合条件的路线列表
   */
  static async getRoutesByDays(daysRange) {
    const { min, max } = daysRange;
    
    const sql = `
      SELECT 
        "id",
        "地区" as region,
        "线路名称" as name,
        "预计天数" as estimated_days,
        "里程（km）" as distance_km,
        "途径地点id" as waypoint_ids,
        "路况" as road_condition,
        "备注" as remarks,
        "注意事项" as precautions,
        "途径风景打分" as scenery_score,
        "路况打分" as road_difficulty_score
      FROM "public"."routetable"
      WHERE "预计天数" BETWEEN $1 AND $2
        AND "预计天数" IS NOT NULL
      ORDER BY "预计天数" ASC
    `;
    
    try {
      const result = await query(sql, [min, max]);
      return result.rows;
    } catch (error) {
      console.error('按天数筛选路线失败:', error);
      throw new Error('按天数筛选路线失败');
    }
  }

  /**
   * 根据路况筛选路线
   * @param {string} roadCondition - 路况条件
   * @returns {Promise<Array>} 符合条件的路线列表
   */
  static async getRoutesByRoadCondition(roadCondition) {
    const sql = `
      SELECT 
        "id",
        "地区" as region,
        "线路名称" as name,
        "预计天数" as estimated_days,
        "里程（km）" as distance_km,
        "途径地点id" as waypoint_ids,
        "路况" as road_condition,
        "备注" as remarks,
        "注意事项" as precautions,
        "途径风景打分" as scenery_score,
        "路况打分" as road_difficulty_score
      FROM "public"."routetable"
      WHERE "路况" ILIKE $1
      ORDER BY "id" ASC
    `;
    
    try {
      const searchPattern = `%${roadCondition}%`;
      const result = await query(sql, [searchPattern]);
      return result.rows;
    } catch (error) {
      console.error('按路况筛选路线失败:', error);
      throw new Error('按路况筛选路线失败');
    }
  }

  /**
   * 获取路线统计信息
   * @returns {Promise<Array>} 各地区路线统计
   */
  static async getRouteStatistics() {
    const sql = `
      SELECT 
        "地区" as region,
        COUNT(*) as total_count,
        AVG("里程（km）") as avg_distance,
        AVG("预计天数") as avg_days,
        MIN("里程（km）") as min_distance,
        MAX("里程（km）") as max_distance
      FROM "public"."routetable"
      WHERE "地区" IS NOT NULL
      GROUP BY "地区"
      ORDER BY total_count DESC
    `;
    
    try {
      const result = await query(sql);
      return result.rows;
    } catch (error) {
      console.error('获取路线统计失败:', error);
      throw new Error('获取路线统计失败');
    }
  }

  /**
   * 根据途径地点ID筛选路线
   * @param {number} waypointId - 途径地点ID
   * @returns {Promise<Array>} 包含该地点的路线列表
   */
  static async getRoutesByWaypointId(waypointId) {
    const sql = `
      SELECT 
        "id",
        "地区" as region,
        "线路名称" as name,
        "预计天数" as estimated_days,
        "里程（km）" as distance_km,
        "途径地点id" as waypoint_ids,
        "路况" as road_condition,
        "备注" as remarks,
        "注意事项" as precautions,
        "途径风景打分" as scenery_score,
        "路况打分" as road_difficulty_score
      FROM "public"."routetable"
      WHERE $1 = ANY("途径地点id")
      ORDER BY "id" ASC
    `;
    
    try {
      const result = await query(sql, [waypointId]);
      return result.rows;
    } catch (error) {
      console.error('根据途径地点ID筛选路线失败:', error);
      throw new Error('根据途径地点ID筛选路线失败');
    }
  }

  /**
   * 根据多个途径地点ID筛选路线（包含所有指定地点的路线）
   * @param {Array<number>} waypointIds - 途径地点ID数组
   * @returns {Promise<Array>} 包含所有指定地点的路线列表
   */
  static async getRoutesByWaypointIds(waypointIds) {
    if (!Array.isArray(waypointIds) || waypointIds.length === 0) {
      throw new Error('途径地点ID数组不能为空');
    }
    
    const sql = `
      SELECT 
        "id",
        "地区" as region,
        "线路名称" as name,
        "预计天数" as estimated_days,
        "里程（km）" as distance_km,
        "途径地点id" as waypoint_ids,
        "路况" as road_condition,
        "备注" as remarks,
        "注意事项" as precautions,
        "途径风景打分" as scenery_score,
        "路况打分" as road_difficulty_score
      FROM "public"."routetable"
      WHERE "途径地点id" @> $1::int[]
      ORDER BY "id" ASC
    `;
    
    try {
      const result = await query(sql, [waypointIds]);
      return result.rows;
    } catch (error) {
      console.error('根据多个途径地点ID筛选路线失败:', error);
      throw new Error('根据多个途径地点ID筛选路线失败');
    }
  }

  /**
   * 根据途径地点ID筛选路线（包含任一指定地点的路线）
   * @param {Array<number>} waypointIds - 途径地点ID数组
   * @returns {Promise<Array>} 包含任一指定地点的路线列表
   */
  static async getRoutesByAnyWaypointIds(waypointIds) {
    if (!Array.isArray(waypointIds) || waypointIds.length === 0) {
      throw new Error('途径地点ID数组不能为空');
    }
    
    const sql = `
      SELECT 
        "id",
        "地区" as region,
        "线路名称" as name,
        "预计天数" as estimated_days,
        "里程（km）" as distance_km,
        "途径地点id" as waypoint_ids,
        "路况" as road_condition,
        "备注" as remarks,
        "注意事项" as precautions,
        "途径风景打分" as scenery_score,
        "路况打分" as road_difficulty_score
      FROM "public"."routetable"
      WHERE "途径地点id" && $1::int[]
      ORDER BY "id" ASC
    `;
    
    try {
      const result = await query(sql, [waypointIds]);
      return result.rows;
    } catch (error) {
      console.error('根据任一途径地点ID筛选路线失败:', error);
      throw new Error('根据任一途径地点ID筛选路线失败');
    }
  }

  /**
   * 获取所有不重复的地区列表
   * @returns {Promise<Array>} 地区列表
   */
  static async getAllRegions() {
    const sql = `
      SELECT DISTINCT "地区" as region
      FROM "public"."routetable"
      WHERE "地区" IS NOT NULL AND "地区" != ''
      ORDER BY "地区" ASC
    `;
    
    try {
      const result = await query(sql);
      return result.rows.map(row => row.region);
    } catch (error) {
      console.error('获取地区列表失败:', error);
      throw new Error('获取地区列表失败');
    }
  }

  /**
   * 获取热门路线（根据被目标点引用次数）
   * @param {number} limit - 限制返回数量
   * @returns {Promise<Array>} 热门路线列表
   */
  static async getPopularRoutes(limit = 10) {
    const sql = `
      SELECT 
        r."id",
        r."地区" as region,
        r."线路名称" as name,
        r."预计天数" as estimated_days,
        r."里程（km）" as distance_km,
        r."途径地点id" as waypoint_ids,
        r."路况" as road_condition,
        r."备注" as remarks,
        r."注意事项" as precautions,
        r."途径风景打分" as scenery_score,
        r."路况打分" as road_difficulty_score,
        COUNT(d."热门途径线路id") as reference_count
      FROM "public"."routetable" r
      LEFT JOIN "public"."Destination" d ON r."id" = d."热门途径线路id"
      GROUP BY r."id", r."地区", r."线路名称", r."预计天数", r."里程（km）", 
               r."途径地点id", r."路况", r."备注", r."注意事项", r."途径风景打分", r."路况打分"
      ORDER BY reference_count DESC, r."id" ASC
      LIMIT $1
    `;
    
    try {
      const result = await query(sql, [limit]);
      return result.rows;
    } catch (error) {
      console.error('获取热门路线失败:', error);
      throw new Error('获取热门路线失败');
    }
  }

  /**
   * 根据风景评分范围筛选路线
   * @param {Object} scoreRange - 评分范围
   * @param {number} scoreRange.min - 最小评分
   * @param {number} scoreRange.max - 最大评分
   * @returns {Promise<Array>} 符合条件的路线列表
   */
  static async getRoutesBySceneryScore(scoreRange) {
    const { min, max } = scoreRange;
    
    const sql = `
      SELECT 
        "id",
        "地区" as region,
        "线路名称" as name,
        "预计天数" as estimated_days,
        "里程（km）" as distance_km,
        "途径地点id" as waypoint_ids,
        "路况" as road_condition,
        "备注" as remarks,
        "注意事项" as precautions,
        "途径风景打分" as scenery_score,
        "路况打分" as road_difficulty_score
      FROM "public"."routetable"
      WHERE "途径风景打分" BETWEEN $1 AND $2
        AND "途径风景打分" IS NOT NULL
      ORDER BY "途径风景打分" DESC
    `;
    
    try {
      const result = await query(sql, [min, max]);
      return result.rows;
    } catch (error) {
      console.error('按风景评分筛选路线失败:', error);
      throw new Error('按风景评分筛选路线失败');
    }
  }

  /**
   * 根据路况难度评分范围筛选路线
   * @param {Object} scoreRange - 评分范围
   * @param {number} scoreRange.min - 最小评分
   * @param {number} scoreRange.max - 最大评分
   * @returns {Promise<Array>} 符合条件的路线列表
   */
  static async getRoutesByDifficultyScore(scoreRange) {
    const { min, max } = scoreRange;
    
    const sql = `
      SELECT 
        "id",
        "地区" as region,
        "线路名称" as name,
        "预计天数" as estimated_days,
        "里程（km）" as distance_km,
        "途径地点id" as waypoint_ids,
        "路况" as road_condition,
        "备注" as remarks,
        "注意事项" as precautions,
        "途径风景打分" as scenery_score,
        "路况打分" as road_difficulty_score
      FROM "public"."routetable"
      WHERE "路况打分" BETWEEN $1 AND $2
        AND "路况打分" IS NOT NULL
      ORDER BY "路况打分" ASC
    `;
    
    try {
      const result = await query(sql, [min, max]);
      return result.rows;
    } catch (error) {
      console.error('按路况难度评分筛选路线失败:', error);
      throw new Error('按路况难度评分筛选路线失败');
    }
  }

  /**
   * 根据综合条件筛选路线（包含评分条件）
   * @param {Object} filters - 筛选条件
   * @param {string} filters.region - 地区
   * @param {Object} filters.distanceRange - 里程范围
   * @param {Object} filters.daysRange - 天数范围
   * @param {Object} filters.sceneryScoreRange - 风景评分范围
   * @param {Object} filters.difficultyScoreRange - 难度评分范围
   * @param {number} filters.limit - 限制数量
   * @param {number} filters.offset - 偏移量
   * @returns {Promise<Array>} 符合条件的路线列表
   */
  static async getRoutesByMultipleFilters(filters = {}) {
    const { 
      region, 
      distanceRange, 
      daysRange, 
      sceneryScoreRange, 
      difficultyScoreRange,
      limit, 
      offset 
    } = filters;
    
    let sql = `
      SELECT 
        "id",
        "地区" as region,
        "线路名称" as name,
        "预计天数" as estimated_days,
        "里程（km）" as distance_km,
        "途径地点id" as waypoint_ids,
        "路况" as road_condition,
        "备注" as remarks,
        "注意事项" as precautions,
        "途径风景打分" as scenery_score,
        "路况打分" as road_difficulty_score
      FROM "public"."routetable"
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
    
    // 里程筛选
    if (distanceRange && distanceRange.min !== undefined && distanceRange.max !== undefined) {
      conditions.push(`"里程（km）" BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
      params.push(distanceRange.min, distanceRange.max);
      paramIndex += 2;
    }
    
    // 天数筛选
    if (daysRange && daysRange.min !== undefined && daysRange.max !== undefined) {
      conditions.push(`"预计天数" BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
      params.push(daysRange.min, daysRange.max);
      paramIndex += 2;
    }
    
    // 风景评分筛选
    if (sceneryScoreRange && sceneryScoreRange.min !== undefined && sceneryScoreRange.max !== undefined) {
      conditions.push(`"途径风景打分" BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
      params.push(sceneryScoreRange.min, sceneryScoreRange.max);
      paramIndex += 2;
    }
    
    // 难度评分筛选
    if (difficultyScoreRange && difficultyScoreRange.min !== undefined && difficultyScoreRange.max !== undefined) {
      conditions.push(`"路况打分" BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
      params.push(difficultyScoreRange.min, difficultyScoreRange.max);
      paramIndex += 2;
    }
    
    // 添加条件
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    // 排序（优先按风景评分降序，然后按难度评分升序）
    sql += ' ORDER BY "途径风景打分" DESC, "路况打分" ASC, "id" ASC';
    
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
      console.error('多条件筛选路线失败:', error);
      throw new Error('多条件筛选路线失败');
    }
  }

  /**
   * 智能匹配路线
   * @param {Object} matchParams - 匹配参数
   * @param {number} matchParams.difficulty - 难易度 (1-10, 1最容易, 10最困难)
   * @param {number} matchParams.sceneryPriority - 风景优先级 (1-10, 1最低, 10最高)
   * @param {string} matchParams.cyclingType - 骑行类型 ('休闲', '自由', '挑战')
   * @param {number} matchParams.days - 骑行天数 (1-15)
   * @param {number} matchParams.weatherScore - 天气评分 (3-9, 3差, 6一般, 9好)
   * @param {number} matchParams.limit - 返回结果数量限制
   * @returns {Promise<Array>} 按匹配度排序的路线列表
   */
  static async getSmartMatchedRoutes(matchParams) {
    const { 
      difficulty = 5, 
      sceneryPriority = 5, 
      cyclingType = '自由', 
      days = 3, 
      weatherScore = 6,
      limit = 20 
    } = matchParams;

    // 骑行类型对应的每日里程
    const dailyDistanceMap = {
      '休闲': 50,
      '自由': 100, 
      '挑战': 150
    };

    const dailyDistance = dailyDistanceMap[cyclingType] || 100;
    const expectedDistance = days * dailyDistance; // 预计总里程

    // 天气优先级固定为0.3
    const weatherPriority = 0.3;

    const sql = `
      SELECT 
        "id",
        "地区" as region,
        "线路名称" as name,
        "预计天数" as estimated_days,
        "里程（km）" as distance_km,
        "途径地点id" as waypoint_ids,
        "路况" as road_condition,
        "备注" as remarks,
        "注意事项" as precautions,
        "途径风景打分" as scenery_score,
        "路况打分" as road_difficulty_score
      FROM "public"."routetable"
      WHERE "途径风景打分" IS NOT NULL 
        AND "路况打分" IS NOT NULL
        AND "里程（km）" IS NOT NULL
      ORDER BY "id" ASC
    `;

    try {
      const result = await query(sql);
      const routes = result.rows;

      // 为每条路线计算匹配得分
      const scoredRoutes = routes.map(route => {
        // 1. 风景得分 = (途径风景打分 / 10) * (风景优先级 / 10) * 10
        const sceneryScore = (route.scenery_score / 10) * (sceneryPriority / 10) * 10;

        // 2. 天气得分 = (天气评分 / 10) * 天气优先级 * 10
        const weatherScoreNormalized = (weatherScore / 10) * weatherPriority * 10;

        // 3. 自然条件得分 = 风景得分 * 50% + 天气得分 * 50%
        const naturalScore = sceneryScore * 0.5 + weatherScoreNormalized * 0.5;

        // 4. 难易度得分 = 10 - |路况打分 - 用户难易度选择|
        // 差异越小得分越高，最高10分
        const difficultyDifference = Math.abs(route.road_difficulty_score - difficulty);
        const difficultyScore = Math.max(0, 10 - difficultyDifference);

        // 5. 骑行得分 = 1 / (|预计总里程 - 线路里程| / 50 + 1) * 10
        // 使用50作为归一化因子，使得50公里差异对应约5分的扣分
        const distanceDifference = Math.abs(expectedDistance - route.distance_km);
        const cyclingScore = (1 / (distanceDifference / 50 + 1)) * 10;

        // 6. 最终匹配得分 = 自然条件得分 * 25% + 难易度得分 * 25% + 骑行得分 * 50%
        const finalScore = naturalScore * 0.25 + difficultyScore * 0.25 + cyclingScore * 0.5;

        return {
          ...route,
          // 添加详细的评分信息供调试使用
          match_scores: {
            scenery_score: Number(sceneryScore.toFixed(2)),
            weather_score: Number(weatherScoreNormalized.toFixed(2)),
            natural_score: Number(naturalScore.toFixed(2)),
            difficulty_score: Number(difficultyScore.toFixed(2)),
            cycling_score: Number(cyclingScore.toFixed(2)),
            final_score: Number(finalScore.toFixed(2))
          },
          match_score: Number(finalScore.toFixed(2)),
          // 添加匹配相关信息
          expected_distance: expectedDistance,
          distance_difference: distanceDifference,
          difficulty_difference: difficultyDifference
        };
      });

      // 按匹配得分降序排序
      scoredRoutes.sort((a, b) => b.match_score - a.match_score);

      // 返回前N条结果
      return scoredRoutes.slice(0, limit);

    } catch (error) {
      console.error('智能匹配路线失败:', error);
      throw new Error('智能匹配路线失败');
    }
  }

  /**
   * 获取路线的途径点详情
   * @param {number} routeId - 路线 ID
   * @returns {Promise<Array>} 途径点详情列表（按顺序排列）
   */
  static async getRouteWaypointsDetails(routeId) {
    try {
      // 首先获取路线信息和途径地点ID数组
      const routeResult = await query(
        'SELECT "途径地点id" as waypoint_ids FROM "public"."routetable" WHERE "id" = $1',
        [routeId]
      );
      
      if (!routeResult.rows[0] || !routeResult.rows[0].waypoint_ids) {
        return [];
      }
      
      const waypointIds = routeResult.rows[0].waypoint_ids;
      
      if (!Array.isArray(waypointIds) || waypointIds.length === 0) {
        return [];
      }
      
      // 使用 ANY 查询获取所有相关的目标点
      const sql = `
        SELECT 
          "ID" as id,
          "目标点名称" as name,
          "地区" as region,
          "longitude",
          "latitude",
          "介绍" as description,
          "最近驿站名称" as nearest_waystation_name,
          "最近驿站距离（km）" as nearest_waystation_distance,
          "热门途径线路id" as popular_route_id,
          "热门途径线路名称" as popular_route_name
        FROM "public"."Destination"
        WHERE "ID" = ANY($1::int[])
      `;
      
      const result = await query(sql, [waypointIds]);
      const destinations = result.rows;
      
      // 按照原始路线中的顺序排列途径点
      const orderedWaypoints = waypointIds.map(id => {
        const destination = destinations.find(d => d.id === id);
        return destination || {
          id: id,
          name: '暂无',
          region: '暂无',
          longitude: null,
          latitude: null,
          description: '暂无',
          nearest_waystation_name: '暂无',
          nearest_waystation_distance: null,
          popular_route_id: null,
          popular_route_name: '暂无'
        };
      });
      
      return orderedWaypoints;
      
    } catch (error) {
      console.error('获取路线途径点详情失败:', error);
      throw new Error('获取路线途径点详情失败');
    }
  }
}

module.exports = RouteModel;
