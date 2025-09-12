<template>
  <div class="cycling-guide">
    <div class="guide-header">
      <h2>骑行攻略</h2>
      <p>为您提供专业的骑行建议和实用攻略</p>
    </div>
    
    <div class="guide-content">
      <div class="guide-section">
        <h3>🚴‍♂️ 装备准备</h3>
        <div class="guide-list">
          <div class="guide-item">
            <h4>必备装备</h4>
            <ul>
              <li>头盔 - 安全第一</li>
              <li>骑行服 - 吸湿排汗</li>
              <li>骑行鞋 - 提升效率</li>
              <li>手套 - 保护手掌</li>
            </ul>
          </div>
          <div class="guide-item">
            <h4>辅助装备</h4>
            <ul>
              <li>码表 - 记录数据</li>
              <li>水壶 - 及时补水</li>
              <li>工具包 - 应急维修</li>
              <li>充电宝 - 电力保障</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="guide-section">
        <h3>🗺️ 路线规划</h3>
        <div class="guide-list">
          <div class="guide-item">
            <h4>选择原则</h4>
            <ul>
              <li>根据体能选择难度</li>
              <li>考虑天气和季节</li>
              <li>预留充足的时间</li>
              <li>了解沿途补给点</li>
            </ul>
          </div>
          <div class="guide-item">
            <h4>安全提醒</h4>
            <ul>
              <li>告知他人行程计划</li>
              <li>携带应急联系方式</li>
              <li>关注路况信息</li>
              <li>准备应急预案</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="guide-section">
        <h3>⚙️ 车辆维护</h3>
        <div class="guide-list">
          <div class="guide-item">
            <h4>出发前检查</h4>
            <ul>
              <li>轮胎气压</li>
              <li>刹车系统</li>
              <li>变速器调整</li>
              <li>链条润滑</li>
            </ul>
          </div>
          <div class="guide-item">
            <h4>常见问题</h4>
            <ul>
              <li>爆胎处理</li>
              <li>链条脱落</li>
              <li>刹车失灵</li>
              <li>变速故障</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="guide-section">
        <h3>💪 体能训练</h3>
        <div class="guide-list">
          <div class="guide-item">
            <h4>基础训练</h4>
            <ul>
              <li>有氧耐力训练</li>
              <li>核心力量练习</li>
              <li>腿部肌肉强化</li>
              <li>柔韧性训练</li>
            </ul>
          </div>
          <div class="guide-item">
            <h4>进阶技巧</h4>
            <ul>
              <li>爬坡技巧</li>
              <li>下坡控制</li>
              <li>风阻应对</li>
              <li>节奏掌控</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 发射事件到父组件
const emit = defineEmits(['guide-item-clicked'])

// 处理攻略项目点击
const handleGuideItemClick = (section, item) => {
  emit('guide-item-clicked', { section, item })
  console.log('点击攻略项:', section, item)
}

// 暴露给父组件的方法
defineExpose({
  handleGuideItemClick
})
</script>

<style scoped>
.cycling-guide {
  padding: 20px 0;
  height: 100%;
  overflow-y: auto;
}

.guide-header {
  text-align: center;
  margin-bottom: 30px;
}

.guide-header h2 {
  color: #2c3e50;
  font-size: 24px;
  margin-bottom: 10px;
}

.guide-header p {
  color: #6c757d;
  font-size: 16px;
}

.guide-content {
  display: grid;
  gap: 25px;
}

.guide-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.guide-section h3 {
  color: #2c3e50;
  font-size: 18px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.guide-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.guide-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.guide-item:hover {
  background: #e8f5e9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.guide-item h4 {
  color: #2c3e50;
  font-size: 16px;
  margin-bottom: 10px;
  font-weight: 600;
}

.guide-item ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.guide-item li {
  color: #666;
  font-size: 14px;
  padding: 5px 0;
  padding-left: 20px;
  position: relative;
  line-height: 1.4;
}

.guide-item li:before {
  content: '•';
  color: #4CAF50;
  font-weight: bold;
  position: absolute;
  left: 8px;
}

.guide-item:hover li {
  color: #333;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .guide-list {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .guide-section {
    padding: 15px;
  }
  
  .guide-header {
    padding: 0 10px;
  }
}

/* 滚动条样式 */
.cycling-guide::-webkit-scrollbar {
  width: 6px;
}

.cycling-guide::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.cycling-guide::-webkit-scrollbar-thumb {
  background: #4CAF50;
  border-radius: 3px;
}

.cycling-guide::-webkit-scrollbar-thumb:hover {
  background: #45a049;
}
</style>
