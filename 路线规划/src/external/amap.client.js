/**
 * 高德地图API客户端
 * 封装所有与高德Web服务API的交互
 * 包含：限流、重试、日志、错误处理
 */

const axios = require('axios')
// p-limit v5+ 是ESM模块，需要动态导入
let pLimit
try {
  // 尝试 CommonJS 导入（v4及以下）
  pLimit = require('p-limit')
  if (typeof pLimit !== 'function') {
    throw new Error('Not a function')
  }
} catch (e) {
  // 如果失败，创建一个简单的并发限制器作为替代
  console.warn('注意: p-limit版本不兼容，使用内置的简单限流器')
  pLimit = (concurrency) => {
    let running = 0
    const queue = []
    const run = async (fn) => {
      running++
      try {
        return await fn()
      } finally {
        running--
        if (queue.length > 0) {
          queue.shift()()
        }
      }
    }
    return (fn) => new Promise((resolve) => {
      const task = () => run(fn).then(resolve)
      if (running < concurrency) {
        task()
      } else {
        queue.push(task)
      }
    })
  }
}
const logger = require('../utils/logger')

// 导入配置
const config = require('../../config')
const { BusinessRules } = require('../../config/constants')

class AmapClient {
  constructor() {
    this.apiKey = config.amap.apiKey
    this.baseUrl = config.amap.baseUrl
    
    // 创建HTTP客户端实例（带默认配置）
    this.httpClient = axios.create({
      timeout: BusinessRules.API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8'
      }
    })
    
    // 并发限制器：控制同时进行的API请求数量
    this.limiter = pLimit(BusinessRules.MAX_CONCURRENT_API_CALLS)
    
    // 请求计数器（用于限流）
    this.requestCount = 0
    this.lastResetTime = Date.now()
    this.maxRequestsPerSecond = config.rateLimit.maxRequests

    // 检查API Key是否配置
    if (!this.apiKey || this.apiKey === '你的高德地图API_KEY') {
      logger.warn('高德地图API Key未配置，请在.env文件中设置AMAP_API_KEY')
    }
  }

  /**
   * 检查并执行限流
   * @private
   */
  async checkRateLimit() {
    const now = Date.now()
    
    // 每秒重置计数器
    if (now - this.lastResetTime >= 1000) {
      this.requestCount = 0
      this.lastResetTime = now
    }
    
    // 如果达到限制，等待到下一秒
    if (this.requestCount >= this.maxRequestsPerSecond) {
      const waitTime = 1000 - (now - this.lastResetTime)
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime))
        this.requestCount = 0
        this.lastResetTime = Date.now()
      }
    }
    
    this.requestCount++
  }

  /**
   * 通用请求方法（简化版 - 移除内部重试，由RequestQueue统一管理）
   * 
   * 改进点：
   * 1. 添加10秒超时，防止无限等待
   * 2. 移除内部重试逻辑（避免与RequestQueue双重重试）
   * 3. 快速失败，让上层队列处理重试
   *
   * @param {string} endpoint - API端点路径
   * @param {Object} params - 请求参数
   * @returns {Promise<Object>} - API响应数据
   */
  async request(endpoint, params = {}) {
    try {
      // 执行限流检查
      await this.checkRateLimit()

      // 构建完整URL
      const url = `${this.baseUrl}${endpoint}`

      // 添加必要参数
      const requestParams = {
        ...params,
        key: this.apiKey,
        output: 'json'
      }

      logger.debug(`[AmapAPI] 请求: ${endpoint}`, { params: requestParams })

      // 发送GET请求（添加10秒超时）✅ 关键修复
      const response = await this.httpClient.get(url, {
        params: requestParams,
        timeout: 10000,  // 10秒超时，防止无限等待
        timeoutErrorMessage: `高德API请求超时 (${endpoint})`
      })
        
        // 检查响应状态
        const data = response.data

        // 高德API返回状态检查
        if (data.status !== '1') {
          throw new AmapApiError(
            data.infocode || 'UNKNOWN',
            data.info || '未知错误',
            endpoint
          )
        }

        logger.debug(`[AmapAPI] 成功: ${endpoint}`)

        return data

      } catch (error) {
        // 统一处理所有错误（快速失败，由RequestQueue统一重试）
        if (error instanceof AmapApiError) {
          throw error  // 业务错误直接抛出
        }

        // 网络错误/超时 - 包装后抛出，让RequestQueue决定是否重试
        logger.error(`[AmapAPI] 请求失败: ${endpoint}`, {
          message: error.message,
          code: error.code,
          isTimeout: error.code === 'ECONNABORTED'
        })

        throw new AmapApiError(
          error.code === 'ECONNABORTED' ? 'TIMEOUT' : 'NETWORK_ERROR',
          error.message || '网络请求失败',
          endpoint,
          { originalCode: error.code }
        )
      }  // catch结束
  }  // request方法结束

  // ==================== 地理编码相关 ====================

  /**
   * 地理编码：将地址文本转换为经纬度坐标
   * 对火车站、机场等POI优先使用 place/text 搜索，精度更高
   * @param {string} address - 地址文本（如："北京市朝阳区望京"）
   * @param {string} city - 指定查询的城市（可选）
   * @returns {Promise<{longitude: number, latitude: number, formattedAddress: string, adcode: string}>}
   */
  async geocode(address, city = null) {
    // 对火车站、机场、高铁站等特定POI，优先使用 place/text 搜索（POI精度更高）
    const poiKeywords = ['火车站', '机场', '高铁站', '动车站', '客站'];
    const isPoi = poiKeywords.some(kw => address.includes(kw));

    if (isPoi) {
      try {
        const placeResult = await this.searchPlace(address, city, { limit: 3 });
        if (placeResult.pois && placeResult.pois.length > 0) {
          // 优先选择名称最匹配的POI
          const bestPoi = placeResult.pois.find(p =>
            poiKeywords.some(kw => p.name.includes(kw))
          ) || placeResult.pois[0];

          if (bestPoi.location) {
            logger.info(`[POI搜索] 命中精确POI: ${bestPoi.name}`, { address });
            return {
              longitude: bestPoi.location.longitude,
              latitude: bestPoi.location.latitude,
              formattedAddress: bestPoi.address || bestPoi.name || address,
              adcode: '',
              city: city || '',
              district: ''
            };
          }
        }
      } catch (poiErr) {
        logger.warn(`[POI搜索] 失败，回退到地理编码: ${poiErr.message}`, { address });
      }
    }

    // 普通地理编码
    const params = { address }
    if (city) params.city = city

    const result = await this.request('/geocode/geo', params)

    // 解析返回结果
    if (!result.geocodes || result.geocodes.length === 0) {
      throw new AmapApiError('ADDRESS_NOT_FOUND', `无法解析地址: ${address}`, '/geocode/geo')
    }

    const geocode = result.geocodes[0]
    const [longitude, latitude] = geocode.location.split(',').map(Number)

    return {
      longitude,
      latitude,
      formattedAddress: geocode.formatted_address,
      adcode: geocode.adcode,
      city: geocode.city || '',
      district: geocode.district || ''
    }
  }

  /**
   * 逆地理编码：将经纬度坐标转换为地址信息
   * @param {number} longitude - 经度
   * @param {number} latitude - 纬度
   * @returns {Promise<Object>} - 地址详细信息
   */
  async reverseGeocode(longitude, latitude) {
    const params = {
      location: `${longitude},${latitude}`
    }
    
    const result = await this.request('/geocode/regeo', params)
    
    return {
      formattedAddress: result.regeocode.formatted_address,
      addressComponent: result.regeocode.addressComponent,
      roads: result.regeocode.roads || [],
      pois: result.regeocode.pois || []
    }
  }

  /**
   * 输入提示（地址搜索联想）
   * 用于用户输入时的实时搜索建议
   * @param {string} keyword - 搜索关键词
   * @param {string} city - 限定城市（可选）
   * @param {number} limit - 返回结果数量限制
   * @returns {Promise<Array>} - 建议列表
   */
  async inputTips(keyword, city = '', limit = 10) {
    const params = {
      keywords: keyword,
      city,
      datatype: 'all',
      output: 'json'
    }
    
    const result = await this.request('/assistant/inputtips', params)
    
    // 格式化返回结果
    return (result.tips || []).filter(tip => tip.location).slice(0, limit).map(tip => ({
      name: tip.name || tip.district || '',
      address: tip.address || tip.district || '',
      district: tip.district || '',
      adcode: tip.adcode || '',
      location: tip.location ? {
        longitude: parseFloat(tip.location.split(',')[0]),
        latitude: parseFloat(tip.location.split(',')[1])
      } : null
    }))
  }

  /**
   * 关键字搜索POI
   * @param {string} keyword - 关键词
   * @param {string} city - 城市
   * @param {Object} options - 额外选项
   * @returns {Promise<Object>}
   */
  async searchPlace(keyword, city, options = {}) {
    const params = {
      keywords: keyword,
      offset: options.limit || 10,
      page: options.page || 1,
      extensions: 'all'
    }
    if (city) params.city = city
    
    const result = await this.request('/place/text', params)
    
    return {
      pois: (result.pois || []).map(poi => ({
        id: poi.id,
        name: poi.name,
        address: poi.address || '',
        location: poi.location ? {
          longitude: parseFloat(poi.location.split(',')[0]),
          latitude: parseFloat(poi.location.split(',')[1])
        } : null,
        type: poi.type || ''
      })),
      total: result.count || 0
    }
  }

  // ==================== 路线规划相关 ====================

  /**
   * 驾车路径规划
   * 支持多途经点（最多16个）
   * @param {Object} origin - 起点 {longitude, latitude}
   * @param {Object} destination - 终点 {longitude, latitude}
   * @param {Array} waypoints - 途经点数组 [{longitude, latitude}]
   * @param {Object} options - 规划选项
   * @returns {Promise<Object>} - 路线规划结果
   */
  async drivingRoute(origin, destination, waypoints = [], options = {}) {
    // 构建坐标字符串
    const originStr = `${origin.longitude},${origin.latitude}`
    const destStr = `${destination.longitude},${destination.latitude}`
    
    // 构建途经点字符串（用|分隔）
    let waypointStr = ''
    if (waypoints && waypoints.length > 0) {
      waypointStr = waypoints.map(wp => `${wp.longitude},${wp.latitude}`).join('|')
    }
    
    // 构建请求参数
    const params = {
      origin: originStr,
      destination: destStr,
      extensions: options.extensions || 'all',
      strategy: options.strategy !== undefined ? options.strategy : 0,
      ferry: options.ferry || 0,
      avoidpolygons: options.avoidpolygons || ''
    }
    
    // 添加途经点
    if (waypointStr) {
      params.waypoints = waypointStr
    }
    
    const result = await this.request('/direction/driving', params)
    
    // 解析并标准化路线结果
    return this.parseDrivingResult(result)
  }

  /**
   * 解析驾车路线结果
   * @private
   * @param {Object} rawResult - 高德API原始返回
   * @returns {Object} 标准化的路线数据
   */
  parseDrivingResult(rawResult) {
    const route = rawResult.route?.paths?.[0]
    
    if (!route) {
      throw new AmapApiError('ROUTE_NOT_FOUND', '无法获取路线数据', '/direction/driving')
    }
    
    // 解析路线步骤
    const steps = route.steps.map(step => ({
      instruction: step.instruction,
      road: step.road || '',
      distance: parseInt(step.distance) || 0,
      duration: parseInt(step.duration) || 0,
      action: step.action || '',
      polyline: step.polyline || '',
      tolls: parseInt(step.tolls) || 0,
      toll_distance: parseInt(step.toll_distance) || 0
    }))
    
    return {
      distance: parseInt(route.distance) || 0,
      duration: parseInt(route.duration) || 0,
      tolls: parseInt(route.tolls) || 0,
      toll_distance: parseInt(route.toll_distance) || 0,
      strategy: route.strategy,
      steps,
      polyline: route.polyline || ''
    }
  }

  /**
   * 距离矩阵计算
   * 批量计算多个起点到多个终点的距离和时间
   * @param {Array} origins - 起点数组 [{longitude, latitude}]
   * @param {Array} destinations - 终点数组 [{longitude, latitude}]
   * @param {string} type - 距离类型：0-直线距离，1-驾车距离
   * @returns {Promise<Object>}
   */
  async distanceMatrix(origins, destinations, type = '0') {
    // 构建坐标字符串
    const originsStr = origins.map(o => `${o.longitude},${o.latitude}`).join('|')
    const destsStr = destinations.map(d => `${d.longitude},${d.latitude}`).join('|')
    
    const params = {
      origins: originsStr,
      destination: destsStr,
      type
    }
    
    const result = await this.request('/distance', params)
    
    // 解析距离矩阵
    return result.results.map((row, i) => ({
      originIndex: i,
      distances: row.map(item => ({
        destinationIndex: item.destination_id,
        distance: parseInt(item.distance) || 0,
        duration: parseInt(item.duration) || 0
      }))
    }))
  }

  // ==================== 工具方法 ====================

  /**
   * 批量地理编码（并发控制）
   * @param {Array<{address: string, city?: string}>} addresses - 待编码地址数组
   * @returns {Promise<Array>} - 编码结果数组
   */
  async batchGeocode(addresses) {
    // 使用并发限制器批量处理
    const results = await Promise.allSettled(
      addresses.map(addr => 
        this.geocode(addr.address, addr.city)
      )
    )
    
    // 处理结果（包含成功和失败）
    return results.map((result, index) => ({
      originalAddress: addresses[index],
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason.message : null
    }))
  }

  /**
   * 健康检查 - 测试API连接
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    try {
      await this.request('/assistant/inputtips', { keywords: '测试' })
      return true
    } catch (error) {
      logger.error('[AmapAPI] 健康检查失败', error)
      return false
    }
  }
}

/**
 * 自定义高德API错误类
 */
class AmapApiError extends Error {
  constructor(code, message, endpoint) {
    super(message)
    this.name = 'AmapApiError'
    this.code = code
    this.endpoint = endpoint
    this.timestamp = new Date().toISOString()
  }
}

// 导出单例实例
module.exports = new AmapClient()
module.exports.AmapApiError = AmapApiError
