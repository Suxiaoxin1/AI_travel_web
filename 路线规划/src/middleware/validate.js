/**
 * 请求验证中间件
 * 使用express-validator进行参数校验
 */

const { body, query, param, validationResult } = require('express-validator')
const ResponseHelper = require('../utils/response')
const { BusinessRules } = require('../../config/constants')

/**
 * 验证结果处理中间件
 * 在路由中使用此中间件提取验证错误
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    // 格式化错误信息
    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      value: err.value,
      message: err.msg
    }))
    
    return ResponseHelper.validationError(res, formattedErrors)
  }
  
  next()
}

/**
 * 路线规划请求验证规则
 */
const validateRoutePlanRequest = [
  // 验证addresses字段存在且为数组
  body('addresses')
    .isArray()
    .withMessage('addresses必须是数组')
    .notEmpty()
    .withMessage('地址列表不能为空'),
    
  // 验证每个地址对象的基本结构
  body('addresses.*.fullAddress')
    .optional()
    .isString()
    .trim()
    .isLength({ min: BusinessRules.MIN_ADDRESS_LENGTH, max: BusinessRules.MAX_ADDRESS_LENGTH })
    .withMessage(`地址长度应在${BusinessRules.MIN_ADDRESS_LENGTH}-${BusinessRules.MAX_ADDRESS_LENGTH}之间`),
    
  body('addresses.*.address')  // 兼容旧字段名
    .optional()
    .isString()
    .trim(),
    
  // 验证地址类型
  body('addresses.*.type')
    .optional()
    .isIn(['origin', 'destination', 'waypoint'])
    .withMessage('地址类型必须是 origin、destination 或 waypoint'),
    
  // 验证options中的可选参数
  body('options.strategy')
    .optional()
    .isInt({ min: 0, max: 33 })
    .withMessage('驾车策略值应为0-33之间的整数'),
    
  body('options.avoidToll')
    .optional()
    .isBoolean()
    .withMessage('avoidToll必须是布尔值'),
    
  body('options.avoidHighway')
    .optional()
    .isBoolean()
    .withMessage('avoidHighway必须是布尔值'),
    
  body('options.optimizeOrder')
    .optional()
    .isBoolean()
    .withMessage('optimizeOrder必须是布尔值'),
    
  body('options.optimizationStrategy')
    .optional()
    .isIn(['distance', 'time', 'balanced'])
    .withMessage('优化策略必须是 distance、time 或 balanced'),
    
  // 处理验证结果
  handleValidationErrors
]

/**
 * 地址搜索验证规则
 */
const validateAddressSearch = [
  query('keyword')
    .notEmpty()
    .withMessage('搜索关键词不能为空')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('关键词长度应在1-100之间'),
    
  query('city')
    .optional()
    .isString()
    .trim()
    .withMessage('城市参数格式错误'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('限制数量应为1-20之间的整数'),
    
  handleValidationErrors
]

/**
 * 地理编码验证规则
 */
const validateGeocode = [
  query('address')
    .notEmpty()
    .withMessage('地址不能为空')
    .isString()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('地址长度应在2-200之间'),
    
  query('city')
    .optional()
    .isString()
    .trim(),
    
  handleValidationErrors
]

/**
 * 逆地理编码验证规则
 */
const validateReverseGeocode = [
  query('lng')
    .notEmpty()
    .withMessage('经度不能为空')
    .isFloat({ min: BusinessRules.LNG_RANGE.min, max: BusinessRules.LNG_RANGE.max })
    .withMessage(`经度范围应在${BusinessRules.LNG_RANGE.min}-${BusinessRules.LNG_RANGE.max}`),
    
  query('lat')
    .notEmpty()
    .withMessage('纬度不能为空')
    .isFloat({ min: BusinessRules.LAT_RANGE.min, max: BusinessRules.LAT_RANGE.max })
    .withMessage(`纬度范围应在${BusinessRules.LAT_RANGE.min}-${BusinessRules.LAT_RANGE.max}`),
    
  handleValidationErrors
]

/**
 * 仅优化请求验证规则
 */
const validateOptimizeOnly = [
  body('addresses')
    .isArray()
    .withMessage('addresses必须是数组')
    .notEmpty()
    .withMessage('地址列表不能为空')
    .custom(value => {
      if (value.length < 3) {
        throw new Error('至少需要3个地址才能进行路径优化')
      }
      return true
    }),
    
  body('options.optimizationStrategy')
    .optional()
    .isIn(['distance', 'time', 'balanced'])
    .withMessage('优化策略无效'),
    
  handleValidationErrors
]

module.exports = {
  handleValidationErrors,
  validateRoutePlanRequest,
  validateAddressSearch,
  validateGeocode,
  validateReverseGeocode,
  validateOptimizeOnly
}
