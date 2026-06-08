/**
 * 日志工具模块
 * 基于Winston实现统一日志管理
 * 支持控制台输出和文件输出（可选）
 */

const winston = require('winston')
const path = require('path')

// 获取日志级别配置
const logLevel = process.env.LOG_LEVEL || 'info'

// 自定义日志格式
const customFormat = winston.format.combine(
  // 添加时间戳
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  // 添加颜色（开发环境）
  winston.format.colorize(),
  // 自定义输出格式
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`
    
    // 如果有元数据对象，格式化输出
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`
    }
    
    return log
  })
)

// 创建logger实例
const logger = winston.createLogger({
  level: logLevel,
  format: customFormat,
  
  // 输出目标
  transports: [
    // 控制台输出（始终启用）
    new winston.transports.Console({
      // 开发环境使用简洁格式
      format: process.env.NODE_ENV === 'development'
        ? winston.format.simple()
        : customFormat
    })
  ]
})

// 生产环境：添加文件输出
if (process.env.NODE_ENV === 'production' && process.env.LOG_FILE) {
  logger.add(new winston.transports.File({
    filename: path.join(__dirname, '../../logs/error.log'),
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }))
  
  logger.add(new winston.transports.File({
    filename: path.join(__dirname, '../../logs/combined.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }))
}

// 导出便捷方法
module.exports = {
  /**
   * 记录信息日志
   * @param {string} message - 日志消息
   * @param {Object} meta - 元数据对象
   */
  info: (message, meta = {}) => {
    logger.info(message, meta)
  },
  
  /**
   * 记录错误日志
   * @param {string} message - 日志消息
   * @param {Error|Object} error - 错误对象或元数据
   */
  error: (message, error = {}) => {
    if (error instanceof Error) {
      logger.error(message, {
        message: error.message,
        stack: error.stack,
        ...error
      })
    } else {
      logger.error(message, error)
    }
  },
  
  /**
   * 记录警告日志
   */
  warn: (message, meta = {}) => {
    logger.warn(message, meta)
  },
  
  /**
   * 记录调试日志（仅在开发环境）
   */
  debug: (message, meta = {}) => {
    logger.debug(message, meta)
  },
  
  /**
   * 记录HTTP请求日志
   * @param {Object} req - Express请求对象
   * @param {number} statusCode - 响应状态码
   * @param {number} responseTime - 响应时间(毫秒)
   */
  http: (req, statusCode, responseTime) => {
    const logData = {
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip || req.connection.remoteAddress,
      statusCode,
      responseTime: `${responseTime}ms`
    }
    
    if (statusCode >= 400) {
      logger.warn(`HTTP ${statusCode}`, logData)
    } else {
      logger.info(`HTTP ${statusCode}`, logData)
    }
  },
  
  // 导出原始logger实例（用于特殊场景）
  instance: logger
}
