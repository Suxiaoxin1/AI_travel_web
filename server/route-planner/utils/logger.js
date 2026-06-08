/**
 * 日志工具模块
 * 基于Winston实现统一日志管理
 */

const winston = require('winston')
const path = require('path')

const logLevel = process.env.LOG_LEVEL || 'info'

const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`
    }
    return log
  })
)

const logger = winston.createLogger({
  level: logLevel,
  format: customFormat,
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'development'
        ? winston.format.simple()
        : customFormat
    })
  ]
})

if (process.env.NODE_ENV === 'production' && process.env.LOG_FILE) {
  logger.add(new winston.transports.File({
    filename: path.join(__dirname, '../logs/error.log'),
    level: 'error',
    maxsize: 5242880,
    maxFiles: 5
  }))
  logger.add(new winston.transports.File({
    filename: path.join(__dirname, '../logs/combined.log'),
    maxsize: 5242880,
    maxFiles: 5
  }))
}

module.exports = {
  info: (message, meta = {}) => { logger.info(message, meta) },
  error: (message, error = {}) => {
    if (error instanceof Error) {
      logger.error(message, { message: error.message, stack: error.stack, ...error })
    } else {
      logger.error(message, error)
    }
  },
  warn: (message, meta = {}) => { logger.warn(message, meta) },
  debug: (message, meta = {}) => { logger.debug(message, meta) },
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
  instance: logger
}
