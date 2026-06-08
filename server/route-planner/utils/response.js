/**
 * 统一响应格式工具
 */

const { HttpStatus, ErrorCodes } = require('../../config/constants')

class ResponseHelper {
  static success(res, data = null, message = '操作成功', statusCode = HttpStatus.OK) {
    return res.status(statusCode).json({
      success: true, data, message, timestamp: new Date().toISOString()
    })
  }

  static created(res, data, message = '创建成功') {
    return this.success(res, data, message, HttpStatus.CREATED)
  }

  static error(res, code, message, statusCode = HttpStatus.INTERNAL_SERVER_ERROR, details = null) {
    return res.status(statusCode).json({
      success: false,
      error: { code, message, details },
      timestamp: new Date().toISOString()
    })
  }

  static validationError(res, errors) {
    return this.error(res, ErrorCodes.VALIDATION_ERROR, '参数验证失败', HttpStatus.UNPROCESSABLE_ENTITY, errors)
  }

  static notFound(res, message = '资源不存在') {
    return this.error(res, ErrorCodes.NOT_FOUND, message, HttpStatus.NOT_FOUND)
  }

  static serverError(res, message = '服务器内部错误', details = null) {
    return this.error(res, ErrorCodes.UNKNOWN_ERROR, message, HttpStatus.INTERNAL_SERVER_ERROR, details)
  }

  static externalServiceError(res, message = '外部服务异常', details = null) {
    return this.error(res, ErrorCodes.EXTERNAL_API_ERROR, message, HttpStatus.BAD_GATEWAY, details)
  }

  static rateLimitExceeded(res) {
    return this.error(res, ErrorCodes.EXTERNAL_API_RATE_LIMIT, '请求过于频繁，请稍后重试', HttpStatus.TOO_MANY_REQUESTS)
  }

  static paginated(res, items, total, page, pageSize, message = '查询成功') {
    return this.success(res, {
      list: items,
      pagination: { total, page: parseInt(page), pageSize: parseInt(pageSize), totalPages: Math.ceil(total / pageSize) }
    }, message)
  }
}

module.exports = ResponseHelper
