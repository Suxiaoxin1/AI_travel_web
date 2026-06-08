/**
 * 应用常量定义
 * 包含错误码、状态码、业务规则等常量
 */

/**
 * HTTP状态码
 */
const HttpStatus = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
}

/**
 * 业务错误码
 * 格式：模块_具体错误
 */
const ErrorCodes = {
  // ===== 通用错误 =====
  SUCCESS: 'SUCCESS',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  
  // ===== 地址相关错误 =====
  ADDRESS_INVALID: 'ADDRESS_INVALID',
  ADDRESS_NOT_FOUND: 'ADDRESS_NOT_FOUND',
  GEOCODE_FAILED: 'GEOCODE_FAILED',
  REVERSE_GEOCODE_FAILED: 'REVERSE_GEOCODE_FAILED',
  BATCH_GEOCODE_PARTIAL_FAILED: 'BATCH_GEOCODE_PARTIAL_FAILED',
  
  // ===== 路线规划错误 =====
  ROUTE_PLAN_FAILED: 'ROUTE_PLAN_FAILED',
  ROUTE_NOT_FOUND: 'ROUTE_NOT_FOUND',
  TOO_MANY_WAYPOINTS: 'TOO_MANY_WAYPOINTS',
  WAYPOINT_OPTIMIZATION_FAILED: 'WAYPOINT_OPTIMIZATION_FAILED',
  
  // ===== 外部服务错误 =====
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  EXTERNAL_API_TIMEOUT: 'EXTERNAL_API_TIMEOUT',
  EXTERNAL_API_RATE_LIMIT: 'EXTERNAL_API_RATE_LIMIT',
  EXTERNAL_API_QUOTA_EXCEEDED: 'EXTERNAL_API_QUOTA_EXCEEDED',
  
  // ===== 系统错误 =====
  CACHE_ERROR: 'CACHE_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
}

/**
 * 地址类型枚举
 */
const AddressType = {
  ORIGIN: 'origin',           // 起点
  DESTINATION: 'destination', // 终点
  WAYPOINT: 'waypoint'        // 途经点
}

/**
 * 优化策略枚举
 */
const OptimizationStrategy = {
  DISTANCE: 'distance',       // 距离优先
  TIME: 'time',               // 时间优先
  BALANCED: 'balanced'        // 平衡模式（推荐）
}

/**
 * 车辆类型
 */
const VehicleType = {
  CAR: 'car',                 // 小轿车
  TRUCK: 'truck',             // 货车
  ELECTRIC: 'electric',       // 电动车
  WALK: 'walk',               // 步行
  BIKE: 'bike'                // 骑行
}

/**
 * 业务规则常量
 */
const BusinessRules = {
  // 最小/最大地址数量
  MIN_ADDRESSES: 2,           // 至少需要起点和终点
  MAX_ADDRESSES: 50,          // 最大支持地址数量
  
  // 地址文本最小长度
  MIN_ADDRESS_LENGTH: 2,
  MAX_ADDRESS_LENGTH: 200,
  
  // 坐标有效范围（中国境内大致范围）
  LNG_RANGE: { min: 73.5, max: 135.1 },  // 经度范围
  LAT_RANGE: { min: 3.8, max: 53.6 },   // 纬度范围
  
  // 路线结果缓存时间（秒）
  ROUTE_CACHE_TTL: 300,       // 5分钟
  
  // 并发控制
  MAX_CONCURRENT_API_CALLS: 5,
  
  // API重试次数
  MAX_RETRY_ATTEMPTS: 3,
  
  // API超时时间（毫秒）
  API_TIMEOUT: 10000
}

/**
 * 响应消息模板
 */
const Messages = {
  // 成功消息
  ROUTE_PLANNED_SUCCESS: '路线规划成功',
  ADDRESSES_GEOCODED_SUCCESS: '地址解析完成',
  OPTIMIZATION_SUCCESS: '路径优化完成',
  
  // 错误消息
  INVALID_ADDRESS_FORMAT: '地址格式无效',
  ADDRESS_REQUIRED: '地址不能为空',
  AT_LEAST_TWO_ADDRESSES: '至少需要两个地址（起点和终点）',
  ONLY_ONE_ORIGIN_ALLOWED: '只能有一个起点',
  ONLY_ONE_DESTINATION_ALLOWED: '只能有一个终点',
  GEOCODE_SERVICE_UNAVAILABLE: '地理编码服务暂时不可用',
  ROUTE_PLAN_SERVICE_UNAVAILABLE: '路线规划服务暂时不可用',
  RATE_LIMIT_EXCEEDED: '请求过于频繁，请稍后重试',
  EXTERNAL_API_ERROR: '外部地图服务异常'
}

module.exports = {
  HttpStatus,
  ErrorCodes,
  AddressType,
  OptimizationStrategy,
  VehicleType,
  BusinessRules,
  Messages
}
