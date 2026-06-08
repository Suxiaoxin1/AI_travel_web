/**
 * 全局错误处理中间件
 * 统一捕获和处理所有错误，返回标准化的错误响应
 */

const logger = require('../utils/logger')
const ResponseHelper = require('../utils/response')
const { ErrorCodes } = require('../../config/constants')

/**
 * 错误处理中间件
 * 必须在所有其他路由之后注册
 * @param {Error} err - 错误对象
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
function errorHandler(err, req, res, next) {
  // 记录错误日志
  logger.error('请求处理出错', {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip,
    errorMessage: err.message,
    errorStack: err.stack,
    errorCode: err.code,
    statusCode: err.statusCode
  })

  // 根据错误类型返回不同的响应
  if (err.name === 'AppError' || err.code) {
    // 已知的业务错误（有错误码）
    return ResponseHelper.error(
      res,
      err.code || ErrorCodes.UNKNOWN_ERROR,
      err.message || '服务器内部错误',
      err.statusCode || 500,
      process.env.NODE_ENV === 'development' ? err.details : undefined
    )
  }

  if (err.name === 'ValidationError') {
    // 参数验证错误（来自express-validator）
    return ResponseHelper.validationError(res, err.errors || [err.message])
  }

  if (err.name === 'AmapApiError') {
    // 高德API调用错误
    const statusCode = getAmapErrorStatusCode(err.code)
    return ResponseHelper.externalServiceError(
      res,
      `地图服务异常: ${err.message}`,
      {
        apiCode: err.code,
        endpoint: err.endpoint,
        suggestion: '请检查高德地图API Key配置是否正确'
      }
    )
  }

  if (err.name === 'SyntaxError') {
    // JSON解析错误（请求体格式错误）
    return ResponseHelper.error(
      res,
      ErrorCodes.INVALID_REQUEST,
      '请求数据格式错误',
      400,
      '请检查JSON格式是否正确'
    )
  }

  // 默认：未知内部错误
  return ResponseHelper.serverError(
    res,
    process.env.NODE_ENV === 'development' 
      ? err.message 
      : '服务器内部错误，请稍后重试',
    process.env.NODE_ENV === 'development' ? err.stack : null
  )
}

/**
 * 根据高德API错误码映射HTTP状态码
 * @private
 */
function getAmapErrorStatusCode(amapCode) {
  const codeMap = {
    '10000': 400,   // INVALID_USER_KEY - 无效的key
    '10001': 401,   // USER_NOT_EXIST - key不存在
    '10002': 401,   // SERVICE_NOT_AVAILABLE - 服务未开通
    '10003': 400,   // INVALID_REQUEST - 请求参数非法
    '10004': 429,   // ACCESS_FREQUENCY_EXCEEDED - 访问频率超限
    '10005': 500,   // INSUFFICIENT_PRIVILEGES - 权限不足
    '10006': 403,   // INSUFFICIENT_QUOTA - 配额用完
    '10007': 400,   // INVALID_KEYWORD - 关键字非法
    '10008': 400,   // ILLEGAL_REQUEST - 非法请求
    '10009': 500,   // SERVER_ERROR - 服务器内部错误
    '10010': 400,   // MISSING_PARAMS - 缺少必要参数
    '10011': 400,   // INVALID_OPERATOR - 操作不支持
    '10012': 400,   // INVALID_SIGNATURE - 签名验证失败
    '20000': 400,   // PARAM_INVALID - 参数无效
    '20001': 404,   // MISSING_REQUIRED_PARAMS - 缺少必填参数
    '20002': 400,   // ILLEGAL_REQUEST - 请求参数非法
    '20003': 400,   // PERMISSION_DENIED - 权限不足
    '20004': 400,   // OUT_OF_SERVICE - 服务不可用
    '20005': 429,   // RATE_LIMIT_EXCEEDED - 并发量超限
    '20006': 404,   // RESOURCE_NOT_FOUND - 资源不存在
    '20007': 400,   // PARAM_VALUE_ILLEGAL - 参数值不合法
    '20008': 400,   // MD5_FAILED - MD5加密失败
    '20009': 400,   // REQUEST_BODY_TOO_LARGE - 请求体过大
    '20010': 400,   // URL_ENCODE_FAILED - URL编码失败
    '20011': 400,   // INVALID_IP - IP不在白名单
    '20012': 400,   // ARGUMENTS_MISSING - 缺少参数
    '20013': 400,   // ENGINE_RESPONSE_DATA_ERROR - 引擎返回数据异常
    '20014': 400,   // ENGINE_CONNECT_DATA_ERROR - 引擎连接数据异常
    '20015': 400,   // ENGINE_EXECUTE_TIMEOUT - 引擎执行超时
    '20016': 400,   // ENGINE_RETURN_ERROR - 引擎返回异常
    '20017': 400,   // ENGINE_PARAM_ERROR - 引擎参数异常
    '20018': 400,   // ENGINE_FUNCTION_NOT_FOUND - 引擎功能未找到
    '20019': 400,   // ENGINE_RESPONSE_NO_DATA - 引擎无数据返回
    '20020': 400,   // ENGINE_DATA_EXCEPTION - 引擎数据异常
    '20021': 400,   // ENGINE_CALL_BACK_ERROR - 引擎回调异常
    '20022': 400,   // ENGINE_UPLOAD_FILE_SIZE_ERROR - 引擎上传文件过大
    '20023': 400,   // ENGINE_FILE_PARSING_ERROR - 引擎文件解析失败
    '20024': 400,   // ENGINE_IMAGE_PARSING_ERROR - 引擎图片解析失败
    '20025': 400,   // ENGINE_DOMAIN_ERROR - 引擎域名异常
    '20026': 500,   // ENGINE_FAILED - 引擎失败
    '20027': 400,   // ENGINE_PARAMETER_ERROR - 引擎参数错误
    '20028': 400,   // ENGINE_SQL_ERROR - 引擎SQL错误
    '20029': 400,   // ENGINE_UNKNOW_HOSTNAME - 引擎主机名未知
    '20030': 400,   // ENGINE_NOT_SUPPORT - 引擎不支持该功能
    '20031': 400,   // ENGINE_CONF_ERROR - 引擎配置错误
    '20032': 400,   // ENGINE_TABLE_FULL - 引擎表已满
    '20033': 400,   // ENGINE_UPDATE_FAILED - 引擎更新失败
    '20034': 400,   // ENGINE_INSERT_FAILED - 引擎插入失败
    '20035': 400,   // ENGINE_DELETE_FAILED - 引擎删除失败
    '20036': 400,   // ENGINE_SELECT_FAILED - 引擎查询失败
    '20037': 400,   // ENGINE_QUERY_NO_RESULT - 引擎查询无结果
    '20038': 400,   // ENGINE_QUERY_TIMEOUT - 引擎查询超时
    '20039': 400,   // ENGINE_QUERY_ERROR - 引擎查询错误
    '20040': 400,   // ENGINE_QUERY_EMPTY_RESULT - 引擎查询空结果
    '20041': 400,   // ENGINE_QUERY_RESULT_EXCEED_LIMIT - 引擎查询结果超出限制
    '20042': 400,   // ENGINE_QUERY_RESULT_NOT_UNIQUE - 引擎查询结果不唯一
    '20043': 400,   // ENGINE_QUERY_RESULT_FORMAT_ERROR - 引擎查询结果格式错误
    '20044': 400,   // ENGINE_QUERY_RESULT_PARSE_ERROR - 引擎查询结果解析错误
    '20045': 400,   // ENGINE_QUERY_RESULT_TYPE_ERROR - 引擎查询结果类型错误
    '20046': 400,   // ENGINE_QUERY_RESULT_LENGTH_ERROR - 引擎查询结果长度错误
    '20047': 400,   // ENGINE_QUERY_RESULT_INDEX_ERROR - 引擎查询结果索引错误
    '20048': 400,   // ENGINE_QUERY_RESULT_RANGE_ERROR - 引擎查询结果范围错误
    '20049': 400,   // ENGINE_QUERY_RESULT_COUNT_ERROR - 引擎查询结果数量错误
    '20050': 400,   // ENGINE_QUERY_RESULT_ORDER_ERROR - 引擎查询结果顺序错误
    '30000': 500,   // ENGINE_UNKNOWN_ERROR - 引擎未知错误
    '30001': 500,   // ENGINE_RESPONSE_DATA_ERROR - 引擎返回数据异常
    '30002': 500,   // ENGINE_CONNECT_DATA_ERROR - 引擎连接数据异常
    '30003': 500,   // ENGINE_EXECUTE_TIMEOUT - 引擎执行超时
    '30004': 500,   // ENGINE_RETURN_ERROR - 引擎返回异常
    '30005': 500,   // ENGINE_PARAM_ERROR - 引擎参数异常
    '30006': 500,   // ENGINE_FUNCTION_NOT_FOUND - 引擎功能未找到
    '30007': 500,   // ENGINE_RESPONSE_NO_DATA - 引擎无数据返回
    '30008': 500,   // ENGINE_DATA_EXCEPTION - 引擎数据异常
    '30009': 500,   // ENGINE_CALL_BACK_ERROR - 引擎回调异常
    '30010': 500,   // ENGINE_UPLOAD_FILE_SIZE_ERROR - 引擎上传文件过大
    '30011': 500,   // ENGINE_FILE_PARSING_ERROR - 引擎文件解析失败
    '30012': 500,   // ENGINE_IMAGE_PARSING_ERROR - 引擎图片解析失败
    '30013': 500,   // ENGINE_DOMAIN_ERROR - 引擎域名异常
    '30014': 500,   // ENGINE_UNKNOWN - 引擎未知
    '30015': 500,   // ENGINE_FAILED - 引擎失败
    '30016': 500,   // ENGINE_PARAMETER_ERROR - 引擎参数错误
    '30017': 500,   // ENGINE_SQL_ERROR - 引擎SQL错误
    '30018': 500,   // ENGINE_UNKNOW_HOSTNAME - 引擎主机名未知
    '30019': 500,   // ENGINE_NOT_SUPPORT - 引擎不支持
    '30020': 500,   // ENGINE_CONF_ERROR - 引擎配置错误
    '30021': 500,   // ENGINE_TABLE_FULL - 引擎表满
    '30022': 500,   // ENGINE_UPDATE_FAILED - 引擎更新失败
    '30023': 500,   // ENGINE_INSERT_FAILED - 引擎插入失败
    '30024': 500,   // ENGINE_DELETE_FAILED - 引擎删除失败
    '30025': 500,   // ENGINE_SELECT_FAILED - 引擎查询失败
    '30026': 500,   // ENGINE_QUERY_NO_RESULT - 引擎查询无结果
    '30027': 500,   // ENGINE_QUERY_TIMEOUT - 引擎查询超时
    '30028': 500,   // ENGINE_QUERY_ERROR - 引擎查询错误
    '30029': 500,   // ENGINE_QUERY_RESULT_EXCEED_LIMIT - 引擎查询结果超限
    '30030': 500,   // ENGINE_QUERY_RESULT_NOT_UNIQUE - 引擎查询结果不唯一
    '30031': 500,   // ENGINE_QUERY_RESULT_FORMAT_ERROR - 引擎查询结果格式错
    '30032': 500,   // ENGINE_QUERY_RESULT_PARSE_ERROR - 引擎查询结果解析错
    '30033': 500,   // ENGINE_QUERY_RESULT_TYPE_ERROR - 引擎查询结果类型错
    '30034': 500,   // ENGINE_QUERY_RESULT_LENGTH_ERROR - 引擎查询结果长度错
    '30035': 500,   // ENGINE_QUERY_RESULT_INDEX_ERROR - 引擎查询结果索引错
    '30036': 500,   // ENGINE_QUERY_RESULT_RANGE_ERROR - 引擎查询结果范围错
    '30037': 500,   // ENGINE_QUERY_RESULT_COUNT_ERROR - 引擎查询结果数量错
    '30038': 500,   // ENGINE_QUERY_RESULT_ORDER_ERROR - 引擎查询结果顺序错
  }

  return codeMap[amapCode] || 502
}

/**
 * 404处理中间件
 * 处理未匹配到任何路由的请求
 */
function notFoundHandler(req, res, next) {
  logger.warn(`路由未找到`, {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip
  })

  return ResponseHelper.notFound(res, `接口 ${req.method} ${req.originalUrl} 不存在`)
}

module.exports = {
  errorHandler,
  notFoundHandler
}
