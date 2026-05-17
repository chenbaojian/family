const app = require('./app');
const { testConnection } = require('./config/database');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // 测试数据库连接
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ 无法连接数据库，请检查数据库配置');
      console.log('💡 提示: 请确保MySQL服务已启动，并运行 npm run init-db 初始化数据库');
      process.exit(1);
    }
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`\n🚀 陈氏家族族谱系统后端服务已启动`);
      console.log(`📡 服务地址: http://localhost:${PORT}`);
      console.log(`📚 API文档: http://localhost:${PORT}/api/health\n`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
}

startServer();