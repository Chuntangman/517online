<template>
  <div class="route-planning">
    <div class="input-group">
      <input 
        type="text" 
        placeholder="起点" 
        v-model="routeForm.startPoint"
        @input="onStartPointChange"
      />
    </div>
    <div class="input-group">
      <input 
        type="text" 
        placeholder="终点" 
        v-model="routeForm.endPoint"
        @input="onEndPointChange"
      />
    </div>
    <div class="route-options">
      <div 
        v-for="option in routeOptionsList" 
        :key="option.key"
        class="route-option"
        :class="{ active: option.active }"
        @click="handleRouteOptionClick(option.key)"
      >
        {{ option.name }}
      </div>
    </div>
    <button class="action-button" @click="handleGenerateRoute">
      生成路线
    </button>
  </div>
</template>

<script setup>
import { useRoutePlanning } from '@/composables/useRoutePlanning.js'

// 发射事件到父组件
const emit = defineEmits(['route-generated', 'start-point-changed', 'end-point-changed'])

// 使用路线规划组合式函数
const {
  routeForm,
  routeOptionsList,
  selectedRouteOption,
  setStartPoint,
  setEndPoint,
  selectRouteOption,
  generateRoute,
  resetRoutePlanning
} = useRoutePlanning()

// 处理起点变化
const onStartPointChange = () => {
  setStartPoint(routeForm.startPoint)
  emit('start-point-changed', routeForm.startPoint)
}

// 处理终点变化
const onEndPointChange = () => {
  setEndPoint(routeForm.endPoint)
  emit('end-point-changed', routeForm.endPoint)
}

// 处理路线选项点击
const handleRouteOptionClick = (optionKey) => {
  selectRouteOption(optionKey)
}

// 处理生成路线
const handleGenerateRoute = () => {
  const success = generateRoute()
  if (success) {
    emit('route-generated', {
      startPoint: routeForm.startPoint,
      endPoint: routeForm.endPoint,
      option: selectedRouteOption.value
    })
  }
}

// 暴露给父组件的方法
defineExpose({
  resetRoutePlanning,
  routeForm,
  selectedRouteOption
})
</script>

<style scoped>
/* 路线规划部分 */
.route-planning {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
}

.input-group {
  margin-bottom: 15px;
}

.input-group input {
  width: 100%;
  padding: 10px 15px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.input-group input:focus {
  border-color: #4CAF50;
  outline: none;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}

.route-options {
  display: flex;
  gap: 10px;
  margin: 15px 0;
  flex-wrap: wrap;
}

.route-option {
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s ease;
  user-select: none;
}

.route-option:hover {
  border-color: #4CAF50;
  color: #4CAF50;
}

.route-option.active {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.action-button {
  width: 100%;
  padding: 12px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.action-button:hover {
  background: #45a049;
  transform: translateY(-1px);
}

.action-button:active {
  transform: translateY(0);
}
</style>
