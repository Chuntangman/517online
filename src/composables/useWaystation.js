/**
 * 驿站服务管理 Composable
 * 处理驿站数据获取、筛选、搜索和详情显示等逻辑
 */

import { ref, reactive } from 'vue'
import axios from 'axios'
import { serviceTypes, serviceIcons } from '@/config/routeConfig.js'
import { useRegions } from './useRegions.js'

export function useWaystation() {
  // 驿站数据相关
  const waystations = ref([])
  const filteredWaystations = ref([])
  const selectedStation = ref(null)
  const searchQuery = ref('')
  
  // 使用地区管理
  const { selectedRegion, filterByRegion } = useRegions()
  
  // 选中的服务筛选
  const selectedServices = reactive({
    accommodation: false,
    bike_rental: false,
    bike_return: false,
    maintenance: false
  })
  
  // 获取驿站数据
  const fetchWaystations = async () => {
    try {
      // 开发环境API地址
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? '/api/v1/waystations'
        : 'http://localhost:3000/api/v1/waystations'
      
      console.log('正在获取驿站数据，API地址:', apiUrl)
      const response = await axios.get(apiUrl)
      
      console.log('API响应:', response.data)
      
      if (response.data && response.data.data) {
        waystations.value = response.data.data
        filteredWaystations.value = response.data.data
        console.log('驿站数据加载成功，共', response.data.data.length, '个驿站')
        return response.data.data
      } else {
        console.error('API响应格式不正确:', response.data)
        return []
      }
    } catch (error) {
      console.error('获取驿站数据失败：', error)
      // 提供一些模拟数据以便测试界面
      const mockData = [
        {
          ID: 1,
          name: '测试驿站1',
          region: '海南岛',
          address: '海南省海口市测试地址1',
          contact: '13800138001',
          accommodation: 1,
          bike_rental: 1,
          bike_return: 0,
          maintenance: 1,
          longitude: 110.1,
          latitude: 20.1,
          remarks: '这是一个测试驿站'
        },
        {
          ID: 2,
          name: '测试驿站2',
          region: '千岛湖',
          address: '浙江省杭州市淳安县测试地址2',
          contact: '13800138002',
          accommodation: 0,
          bike_rental: 1,
          bike_return: 1,
          maintenance: 0,
          longitude: 119.1,
          latitude: 29.6,
          remarks: '这是另一个测试驿站'
        }
      ]
      waystations.value = mockData
      filteredWaystations.value = mockData
      console.log('使用模拟数据，共', mockData.length, '个驿站')
      return mockData
    }
  }
  
  // 筛选驿站
  const filterWaystations = (mapRef = null, activeTab = null) => {
    let filtered = waystations.value

    // 地区筛选
    filtered = filterByRegion(filtered, 'region')

    // 搜索筛选
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(station => 
        station.name.toLowerCase().includes(query) ||
        station.address.toLowerCase().includes(query)
      )
    }

    // 服务类型筛选
    const activeServices = Object.entries(selectedServices)
      .filter(([_, value]) => value)
      .map(([key]) => key)

    if (activeServices.length > 0) {
      filtered = filtered.filter(station =>
        activeServices.every(service => station[service] === 1)
      )
    }

    filteredWaystations.value = filtered

    // 更新地图标记
    if (mapRef?.value && activeTab?.value === '驿站服务') {
      mapRef.value.updateMarkers(filtered)
    }
    
    return filtered
  }
  
  // 切换服务筛选
  const toggleService = (service, mapRef = null, activeTab = null) => {
    selectedServices[service] = !selectedServices[service]
    filterWaystations(mapRef, activeTab)
  }
  
  // 显示驿站详情
  const showStationDetails = (station) => {
    selectedStation.value = station
    // 地图跳转功能由父组件RouteMain统一处理
  }
  
  // 关闭驿站详情
  const closeStationDetails = () => {
    selectedStation.value = null
  }
  
  // 重置筛选条件
  const resetFilters = () => {
    searchQuery.value = ''
    Object.keys(selectedServices).forEach(key => {
      selectedServices[key] = false
    })
    // 重置时也要应用地区筛选
    filterWaystations()
  }
  
  return {
    // 数据
    waystations,
    filteredWaystations,
    selectedStation,
    searchQuery,
    selectedServices,
    serviceTypes,
    serviceIcons,
    selectedRegion,
    
    // 方法
    fetchWaystations,
    filterWaystations,
    toggleService,
    showStationDetails,
    closeStationDetails,
    resetFilters
  }
}
