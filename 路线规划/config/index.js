/**
 * 主配置文件 - 统一管理所有配置项
 * 职责：加载环境变量，提供统一的配置访问接口
 */

// 加载环境变量
require('dotenv').config()

const amapConfig = require('./amap')
const constants = require('./constants')

/**
 * 服务器配置
 */
const server = {
  // 服务端口
  port: process.env.PORT || 3000,
  
  // 运行环境：development | production | test
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // 是否启用调试模式
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test'
}

/**
 * 缓存配置
 */
const cache = {
  // 缓存过期时间（秒）
  ttl: parseInt(process.env.CACHE_TTL) || 3600,
  
  // 缓存检查周期（秒）
  checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD) || 600,
  
  // 最大缓存数量（防止内存溢出）
  maxKeys: 10000
}

/**
 * API限流配置
 */
const rateLimit = {
  // 时间窗口内最大请求数
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 50,
  
  // 时间窗口大小（毫秒）
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 1000
}

/**
 * 日志配置
 */
const logger = {
  // 日志级别
  level: process.env.LOG_LEVEL || 'info',
  
  // 日志文件路径（生产环境可开启）
  file: process.env.LOG_FILE || null
}

module.exports = {
  server,
  cache,
  rateLimit,
  logger,
  amap: amapConfig,
  constants
}
