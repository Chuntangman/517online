/**
 * 天气工具函数
 * 用于处理天气相关的评分和分类
 */

/**
 * 根据天气状况计算天气评分
 * @param {string} weather - 天气状况描述
 * @returns {number} 天气评分 (3-9分)
 */
export function getWeatherScore(weather) {
  if (!weather) return 6; // 默认一般天气
  
  const weatherLower = weather.toLowerCase();
  
  // 好天气 (9分): 晴天、阴天、多云
  const goodWeather = [
    '晴', '少云', '晴间多云', '多云', '阴'
  ];
  
  // 一般天气 (6分): 小雨、小雪、轻雾等
  const averageWeather = [
    '阵雨', '小雨', '阵雪', '小雪', '雾', '轻雾', '霾', '中度霾'
  ];
  
  // 差天气 (3分): 极端天气
  const badWeather = [
    '雷阵雨', '雷阵雨并伴有冰雹', '强雷阵雨', '中雨', '大雨', '暴雨', 
    '大暴雨', '特大暴雨', '强阵雨', '极端降雨', '中雪', '大雪', '暴雪',
    '冻雨', '雨夹雪', '阵雨夹雪', '重度霾', '严重霾', '浓雾', '强浓雾', 
    '大雾', '特强浓雾'
  ];
  
  // 精确匹配
  for (const good of goodWeather) {
    if (weather.includes(good)) return 9;
  }
  
  for (const avg of averageWeather) {
    if (weather.includes(avg)) return 6;
  }
  
  for (const bad of badWeather) {
    if (weather.includes(bad)) return 3;
  }
  
  // 模糊匹配
  if (weatherLower.includes('雷') || weatherLower.includes('冰雹') || 
      weatherLower.includes('暴雨') || weatherLower.includes('暴雪')) {
    return 3; // 差天气
  } else if (weatherLower.includes('雨') || weatherLower.includes('雪') || 
             weatherLower.includes('雾') || weatherLower.includes('霾')) {
    return 6; // 一般天气
  } else {
    return 9; // 好天气
  }
}

/**
 * 获取天气描述
 * @param {number} score - 天气评分
 * @returns {string} 天气描述
 */
export function getWeatherDescription(score) {
  if (score >= 8) return '好天气';
  if (score >= 5) return '一般天气';
  return '差天气';
}

/**
 * 获取天气评分的颜色
 * @param {number} score - 天气评分
 * @returns {string} CSS颜色值
 */
export function getWeatherColor(score) {
  if (score >= 8) return '#67c23a'; // 绿色
  if (score >= 5) return '#e6a23c'; // 橙色
  return '#f56c6c'; // 红色
}
