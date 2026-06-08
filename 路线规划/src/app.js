/**
 * Express应用入口
 * 负责初始化服务器、加载中间件、注册路由
 */

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
require('dotenv').config()

// 导入配置
const config = require('../config')

// 导入工具
const logger = require('./utils/logger')
const { errorHandler, notFoundHandler } = require('./middleware/error.handler')

// ==================== 全局异常保护 ====================
// 防止未捕获的异常导致服务崩溃

// 捕获未处理的Promise rejection
process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack
  })
  // 不退出进程，只记录错误
})

// 捕获未捕获的异常
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常', {
    error: error.message,
    stack: error.stack
  })
  // 不立即退出，给时间完成当前请求
})

// 导入路由
const registerRoutes = require('./routes')

// 创建Express应用实例
const app = express()

// ==================== 基础中间件配置 ====================

// 安全头设置（Helmet）
app.use(helmet({
  contentSecurityPolicy: false, // API服务不需要CSP
  crossOriginEmbedderPolicy: false
}))

// CORS跨域配置（允许前端调用）
app.use(cors({
  origin: '*', // 生产环境应限制为具体域名
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 预检请求缓存24小时
}))

// JSON请求体解析
app.use(express.json({ 
  limit: '10mb' // 限制请求体大小
}))
app.use(express.urlencoded({ 
  extended: true,
  limit: '10mb'
}))

// HTTP请求日志（开发环境使用dev格式，生产环境使用combined）
if (config.server.isDev) {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined', {
    skip: (req, res) => res.statusCode < 400 // 只记录错误日志
  }))
}

// 请求ID中间件（用于追踪请求）
app.use((req, res, next) => {
  req.requestId = require('uuid').v4()
  const start = Date.now
  
  // 在响应完成后记录日志
  res.on('finish', () => {
    const duration = Date.now() - req.startTime || 0
    logger.http(req, res.statusCode, duration)
  })
  
  req.startTime = Date.now()
  next()
})

// ==================== 静态路由 ====================

// 根路径 - API信息
app.get('/', (req, res) => {
  res.json({
    name: '多地址路线规划后端服务',
    version: '1.0.0',
    status: 'running',
    environment: config.server.nodeEnv,
    timestamp: new Date().toISOString(),
    endpoints: {
      documentation: '/api',
      healthCheck: '/api/route/health'
    },
    message: '欢迎使用路线规划API服务'
  })
})

// 注册所有API路由
registerRoutes(app)

// ==================== 错误处理中间件（必须最后注册）====================

// 404处理
app.use(notFoundHandler)

// 全局错误处理
app.use(errorHandler)

// ==================== 启动服务器 ====================

const PORT = config.server.port

// 如果直接运行此文件，则启动服务器
if (require.main === module) {
  const server = app.listen(PORT, '127.0.0.1', () => {
    console.log('')
    console.log('='.repeat(60))
    console.log(`  🚀 多地址路线规划服务已启动`)
    console.log(`  📍 本地访问: http://localhost:${PORT}`)
    console.log(`  📡 API文档: http://localhost:${PORT}/api`)
    console.log(`  ❤️  健康检查: http://localhost:${PORT}/api/route/health`)
    console.log('='.repeat(60))
    console.log('')
    
    logger.info(`服务器启动成功`, {
      port: PORT,
      env: config.server.nodeEnv,
      nodeVersion: process.version
    })
    
    // 检查配置状态
    if (!config.amap.apiKey || config.amap.apiKey === '你的高德地图API_KEY') {
      logger.warn('⚠️  高德地图API Key未配置！请在.env文件中设置AMAP_API_KEY')
      console.log('')
      console.log('⚠️  提示：请先配置高德地图API Key才能正常使用路线规划功能')
      console.log('   1. 访问 https://console.amap.com/dev/key/app 申请API Key')
      console.log('   2. 复制 .env.example 为 .env')
      console.log('   3. 在 .env 中填入你的 AMAP_API_KEY')
      console.log('')
    }
  })
  
  // 优雅关闭处理
  process.on('SIGTERM', () => {
    logger.info('收到SIGTERM信号，正在优雅关闭...')
    process.exit(0)
  })
  
  process.on('SIGINT', () => {
    logger.info('收到SIGINT信号(Ctrl+C)，正在关闭...')
    process.exit(0)
  })
}

module.exports = app

// 导出供测试使用
module.exports.config = config
