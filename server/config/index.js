/**
 * 主配置文件 - 统一管理所有配置项
 * 职责：加载环境变量，提供统一的配置访问接口
 */

require('dotenv').config()

const amapConfig = require('./amap')
const constants = require('./constants')

const server = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test'
}

const cache = {
  ttl: parseInt(process.env.CACHE_TTL) || 3600,
  checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD) || 600,
  maxKeys: 10000
}

const rateLimit = {
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 50,
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 1000
}

const logger = {
  level: process.env.LOG_LEVEL || 'info',
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
