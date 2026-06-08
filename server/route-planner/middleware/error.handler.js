/**
 * 全局错误处理中间件
 */

const logger = require('../utils/logger')
const ResponseHelper = require('../utils/response')
const { ErrorCodes } = require('../../config/constants')

function errorHandler(err, req, res, next) {
  logger.error('请求处理出错', {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip,
    errorMessage: err.message,
    errorStack: err.stack,
    errorCode: err.code,
    statusCode: err.statusCode
  })

  if (err.name === 'AppError' || err.code) {
    return ResponseHelper.error(
      res, err.code || ErrorCodes.UNKNOWN_ERROR,
      err.message || '服务器内部错误',
      err.statusCode || 500,
      process.env.NODE_ENV === 'development' ? err.details : undefined
    )
  }

  if (err.name === 'ValidationError') {
    return ResponseHelper.validationError(res, err.errors || [err.message])
  }

  if (err.name === 'AmapApiError') {
    const statusCode = err.code === 'INVALID_KEY' ? 401 : getAmapErrorStatusCode(err.code)
    return ResponseHelper.externalServiceError(
      res, `地图服务异常: ${err.message}`,
      { apiCode: err.code, endpoint: err.endpoint, suggestion: '请检查高德地图API Key配置是否正确' }
    )
  }

  if (err.name === 'SyntaxError') {
    return ResponseHelper.error(res, ErrorCodes.INVALID_REQUEST, '请求数据格式错误', 400, '请检查JSON格式是否正确')
  }

  return ResponseHelper.serverError(
    res,
    process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误，请稍后重试',
    process.env.NODE_ENV === 'development' ? err.stack : null
  )
}

function getAmapErrorStatusCode(amapCode) {
  const codeMap = {
    '10000': 400, '10001': 401, '10002': 401, '10003': 400, '10004': 429,
    '10005': 500, '10006': 403, '10007': 400, '10008': 400, '10009': 500,
    '10010': 400, '10011': 400, '10012': 400,
    '20000': 400, '20001': 404, '20002': 400, '20003': 400, '20004': 400,
    '20005': 429, '20006': 404
  }
  return codeMap[amapCode] || 502
}

function notFoundHandler(req, res, next) {
  logger.warn(`路由未找到`, { method: req.method, url: req.originalUrl || req.url, ip: req.ip })
  return ResponseHelper.notFound(res, `接口 ${req.method} ${req.originalUrl} 不存在`)
}

module.exports = { errorHandler, notFoundHandler }
