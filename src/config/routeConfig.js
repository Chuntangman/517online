/**
 * 路线页面配置文件
 * 包含导航项、服务类型、地区信息等配置数据
 */

// 导航项配置
export const navItems = [
  {
    name: '地区',
    dropdown: ['全部'], // 初始只有全部，实际数据通过API获取
    isRegionNav: true // 标识这是地区导航
  },
  {
    name: '路线规划',
    dropdown: null
  },
  {
    name: '热门路线',
    dropdown: null
  },
  {
    name: '驿站服务',
    dropdown: null
  },
  {
    name: '骑行攻略',
    dropdown: null
  }
]

// 服务类型定义
export const serviceTypes = {
  accommodation: '住宿',
  bike_rental: '租车',
  bike_return: '还车',
  maintenance: '维修'
}

// 服务图标
export const serviceIcons = {
  accommodation: '🏠',
  bike_rental: '🚲',
  bike_return: '🅿️',
  maintenance: '🔧'
}

// 地区列表
export const regions = [
  '海南岛', 
  '千岛湖', 
  '青海甘肃', 
  '新疆-独库伊犁', 
  '川藏川西&其他'
]

// 路线选项配置
export const routeOptions = [
  { key: 'shortest', name: '最短距离', active: true },
  { key: 'least_climb', name: '最少爬升', active: false },
  { key: 'best_scenery', name: '风景最优', active: false }
]

// 默认的热门路线数据
export const popularRoutes = [
  {
    id: 1,
    title: '环青海湖骑行线路',
    difficulty: 'medium',
    difficultyLabel: '中等难度',
    distance: '360km',
    duration: '3-4天'
  },
  {
    id: 2,
    title: '千岛湖环湖线路',
    difficulty: 'easy',
    difficultyLabel: '简单',
    distance: '120km',
    duration: '1天'
  }
]
