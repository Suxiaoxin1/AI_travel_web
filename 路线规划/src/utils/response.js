/**
 * 统一响应格式工具
 * 规范化所有API的返回格式，确保前后端交互一致性
 */

const { HttpStatus, ErrorCodes } = require('../../config/constants')

class ResponseHelper {
  /**
   * 成功响应
   * @param {Object} res - Express响应对象
   * @param {*} data - 返回的数据
   * @param {string} message - 成功消息
   * @param {number} statusCode - HTTP状态码
   */
  static success(res, data = null, message = '操作成功', statusCode = HttpStatus.OK) {
    return res.status(statusCode).json({
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * 创建成功响应（用于POST请求）
   */
  static created(res, data, message = '创建成功') {
    return this.success(res, data, message, HttpStatus.CREATED)
  }

  /**
   * 错误响应
   * @param {Object} res - Express响应对象
   * @param {string} code - 业务错误码
   * @param {string} message - 错误消息
   * @param {number} statusCode - HTTP状态码
   * @param {*} details - 详细错误信息
   */
  static error(res, code, message, statusCode = HttpStatus.INTERNAL_SERVER_ERROR, details = null) {
    return res.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
        details
      },
      timestamp: new Date().toISOString()
    })
  }

  /**
   * 参数验证失败
   */
  static validationError(res, errors) {
    return this.error(
      res,
      ErrorCodes.VALIDATION_ERROR,
      '参数验证失败',
      HttpStatus.UNPROCESSABLE_ENTITY,
      errors
    )
  }

  /**
   * 未找到资源
   */
  static notFound(res, message = '资源不存在') {
    return this.error(res, ErrorCodes.NOT_FOUND, message, HttpStatus.NOT_FOUND)
  }

  /**
   * 服务器内部错误
   */
  static serverError(res, message = '服务器内部错误', details = null) {
    return this.error(
      res,
      ErrorCodes.UNKNOWN_ERROR,
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      details
    )
  }

  /**
   * 外部服务错误
   */
  static externalServiceError(res, message = '外部服务异常', details = null) {
    return this.error(
      res,
      ErrorCodes.EXTERNAL_API_ERROR,
      message,
      HttpStatus.BAD_GATEWAY,
      details
    )
  }

  /**
   * 限流错误
   */
  static rateLimitExceeded(res) {
    return this.error(
      res,
      ErrorCodes.EXTERNAL_API_RATE_LIMIT,
      '请求过于频繁，请稍后重试',
      HttpStatus.TOO_MANY_REQUESTS
    )
  }

  /**
   * 分页响应包装
   * @param {Array} items - 数据列表
   * @param {number} total - 总数
   * @param {number} page - 当前页
   * @param {number} pageSize - 每页数量
   */
  static paginated(res, items, total, page, pageSize, message = '查询成功') {
    return this.success(res, {
      list: items,
      pagination: {
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(total / pageSize)
      }
    }, message)
  }
}

module.exports = ResponseHelper
