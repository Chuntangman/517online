/**
 * 清理旧的分析系统文件
 * 删除不再需要的复杂分析功能
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 开始清理旧的分析系统文件...');

// 需要删除的文件列表
const filesToDelete = [
  'server/utils/analyticsFilter.js',
  'server/middleware/analyticsMiddleware.js',
  'server/controllers/userAnalyticsController.js',
  'server/routes/userAnalyticsRoutes.js',
  'server/models/userBehaviorModel.js',
  'server/models/userDeviceInfoModel.js',
  'server/models/userPreferencesModel.js',
  'server/models/userReferralInfoModel.js',
  'src/utils/analytics.js',
  'ANALYTICS_OPTIMIZATION_GUIDE.md'
];

let deletedCount = 0;
let skippedCount = 0;

filesToDelete.forEach(filePath => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ 已删除: ${filePath}`);
      deletedCount++;
    } else {
      console.log(`⚠️  文件不存在，跳过: ${filePath}`);
      skippedCount++;
    }
  } catch (error) {
    console.error(`❌ 删除文件失败 ${filePath}:`, error.message);
  }
});

console.log('\n🧹 清理完成!');
console.log(`✅ 已删除文件: ${deletedCount} 个`);
console.log(`⚠️  跳过文件: ${skippedCount} 个`);
console.log('\n📊 精简的分析系统已就绪，只保留有价值的用户行为记录功能。');
console.log('\n🗃️  记得运行 SQL 脚本创建新的数据表:');
console.log('   server/sql/create_simplified_analytics_table.sql');
console.log('\n🚀 现在可以重新启动服务测试精简的分析功能。');
