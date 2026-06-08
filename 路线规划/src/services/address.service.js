/**
 * 地址管理服务
 * 职责：地址的地理编码、逆地理编码、搜索联想等操作
 * 特点：带缓存、智能请求队列、自动重试、速率限制
 */

const amapClient = require('../external/amap.client')
const cache = require('../repositories/cache.repository')
const logger = require('../utils/logger')
const { sanitizeAddress } = require('../utils/validators')
const { globalQueue } = require('../utils/request-queue') // 引入简化的请求队列 v2.0

class AddressService {
  constructor() {
    this.amapClient = amapClient
    this.cache = cache
    this.requestQueue = globalQueue  // 使用共享的请求队列实例
  }

  /**
   * 批量地理编码（主入口） - 优化版 ✨
   * 
   * 改进点：
   * 1. 使用智能请求队列（串行+限流+重试）
   * 2. 优先使用缓存（减少API调用）
   * 3. 自动处理QPS超限错误
   * 4. 详细的进度日志和统计信息
   * 
   * @param {Array} addresses - 原始地址数组 [{fullAddress, city?, ...}]
   * @returns {Promise<{success: boolean, data: Array, errors: Array}>}
   */
  async batchGeocode(addresses) {
    const startTime = Date.now()
    logger.info(`[批量地理编码] 开始处理`, { 
      total: addresses.length,
      queueStats: this.requestQueue.getStats()
    })
    
    const results = new Array(addresses.length).fill(null)
    const errors = []
    
    // 第1步：检查缓存（快速路径，不消耗API配额）
    const tasksToProcess = []  // 需要API调用的任务
    
    addresses.forEach((rawAddr, index) => {
      const address = sanitizeAddress(rawAddr)
      const cacheKey = cache.CacheRepository.geocodeKey(address.fullAddress, address.city)
      const cachedResult = this.cache.get(cacheKey)
      
      if (cachedResult) {
        // 缓存命中 ✅
        results[index] = {
          ...address,
          ...cachedResult,
          fromCache: true
        }
        logger.debug(`地址[${index}] 缓存命中: ${address.fullAddress}`)
      } else {
        // 需要调用API
        tasksToProcess.push({ index, address, rawAddr })
      }
    })
    
    const cacheHitCount = addresses.length - tasksToProcess.length
    logger.info(`[批量地理编码] 缓存命中 ${cacheHitCount}/${addresses.length}, 需要API调用: ${tasksToProcess.length}`)
    
    if (tasksToProcess.length === 0) {
      // 全部缓存命中，直接返回
      return this.buildBatchResult(results, errors, startTime, addresses.length)
    }
    
    // 第2步：使用请求队列串行执行API调用（简单可靠）✅
    console.log(`[批量地理编码] 开始调用高德API (共${tasksToProcess.length}个地址)`)
    
    const apiTasks = tasksToProcess.map(({ index, address, rawAddr }) => {
      return async () => {
        console.log(`[地理编码] 编码地址 [${index}]: ${address.fullAddress}`)
        
        const geocoded = await this.amapClient.geocode(address.fullAddress, address.city)
        
        console.log(`[地理编码] ✅ 成功 [${index}]:`, geocoded.formattedAddress)
          
        // 合并结果
        const result = {
          ...address,
          longitude: geocoded.longitude,
          latitude: geocoded.latitude,
          formattedAddress: geocoded.formattedAddress || address.fullAddress,
          adcode: geocoded.adcode || '',
          city: geocoded.city || address.city,
          fromCache: false
        }
        
        // 存入缓存（供后续使用）
        const cacheKey = cache.CacheRepository.geocodeKey(address.fullAddress, address.city)
        this.cache.set(cacheKey, {
          longitude: result.longitude,
          latitude: result.latitude,
          formattedAddress: result.formattedAddress,
          adcode: result.adcode,
          city: result.city
        })
        
        results[index] = result
        console.log(`[地理编码] ✅ 结果已保存 [${index}]`)
        
        return result
      }
    })
    
    // 使用简化的串行批量执行（逐个处理，避免并发问题）
    console.log(`\n[批量地理编码] 调用 SimpleRequestQueue.executeBatch()...`)
    await globalQueue.executeBatch(apiTasks)
    console.log(`[批量地理编码] 🎉 所有API调用完成!`)
    
    // 输出统计和性能指标
    return this.buildBatchResult(results, errors, startTime, addresses.length)
  }

  /**
   * 构建批量处理结果
   * @private
   */
  buildBatchResult(results, errors, startTime, total) {
    const successCount = results.filter(r => r && r.longitude !== null).length
    const duration = Date.now() - startTime
    
    logger.info(`[批量地理编码] 完成 ✓`, {
      total,
      success: successCount,
      failed: errors.length,
      hitRate: `${((successCount / total) * 100).toFixed(1)}%`,
      duration: `${duration}ms`,
      avgPerItem: `${(duration / total).toFixed(0)}ms`,
      queueStats: this.requestQueue.getStats()
    })
    
    return {
      success: errors.length === 0 || successCount >= 2,  // 至少成功2个才能规划路线
      data: results,
      errors,
      statistics: {
        total,
        success: successCount,
        failed: errors.length,
        hitRate: `${((successCount / total) * 100).toFixed(1)}%`,
        performance: {
          totalDuration: `${duration}ms`,
          averagePerItem: `${Math.round(duration / total)}ms`
        }
      }
    }
  }

  /**
   * 单个地址地理编码
   * @param {string} address - 地址文本
   * @param {string} city - 城市（可选）
   */
  async geocode(address, city = '') {
    // 检查缓存
    const cacheKey = cache.CacheRepository.geocodeKey(address, city)
    const cached = this.cache.get(cacheKey)
    
    if (cached) {
      logger.info('地理编码命中缓存', { address })
      return cached
    }
    
    // 调用API
    const result = await this.amapClient.geocode(address, city)
    
    // 存入缓存
    this.cache.set(cacheKey, result)
    
    return result
  }

  /**
   * 逆地理编码：坐标转地址
   * @param {number} longitude - 经度
   * @param {number} latitude - 纬度
   */
  async reverseGeocode(longitude, latitude) {
    const cacheKey = cache.CacheRepository.generateKey('reversegeo', longitude, latitude)
    
    return await this.cache.getOrSet(cacheKey, () => 
      this.amapClient.reverseGeocode(longitude, latitude)
    )
  }

  /**
   * 地址输入提示/联想搜索
   * 用于用户输入时的实时建议
   * @param {string} keyword - 搜索关键词
   * @param {string} city - 限定城市（可选）
   * @param {number} limit - 返回数量限制
   */
  async searchSuggestions(keyword, city = '', limit = 10) {
    if (!keyword || keyword.trim().length < 1) {
      throw new Error('搜索关键词不能为空')
    }
    
    // 使用短期缓存（5分钟）
    const cacheKey = cache.CacheRepository.inputTipsKey(keyword, city)
    
    return await this.cache.getOrSet(
      cacheKey,
      () => this.amapClient.inputTips(keyword, city, limit),
      300 // 5分钟过期
    )
  }

  /**
   * 验证地址列表完整性
   * 检查是否有足够的有效地址用于路线规划
   * @param {Array} geocodedAddresses - 已编码的地址数组
   * @returns {{valid: boolean, origin: Object|null, destination: Object|null, waypoints: Array}}
   */
  validateForRoutePlanning(geocodedAddresses) {
    // 过滤出有效的地址（有坐标的）
    const validAddresses = geocodedAddresses.filter(addr => 
      addr.longitude && addr.latitude && !addr.geocodeError
    )
    
    if (validAddresses.length < 2) {
      return {
        valid: false,
        error: '有效的地址不足2个，无法进行路线规划',
        origin: null,
        destination: null,
        waypoints: []
      }
    }
    
    // 提取起点
    const origin = validAddresses.find(addr => addr.type === 'origin') || validAddresses[0]
    
    // 提取终点
    const destination = validAddresses.find(addr => addr.type === 'destination') || validAddresses[validAddresses.length - 1]
    
    // 提取途经点（排除起终点）
    const waypoints = validAddresses.filter(addr => 
      addr.id !== origin.id && addr.id !== destination.id
    )
    
    return {
      valid: true,
      origin,
      destination,
      waypoints,
      totalCount: validAddresses.length,
      waypointCount: waypoints.length
    }
  }

  /**
   * 清除地址相关缓存
   */
  clearCache() {
    // 注意：NodeCache不支持按前缀删除，这里只是示例
    // 生产环境可使用Redis或手动管理
    logger.info('清除地址缓存')
    return true
  }
}

// 导出单例
module.exports = new AddressService()
