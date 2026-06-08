/**
 * 地址管理服务
 */

const amapClient = require('../external/amap.client')
const cache = require('../repositories/cache.repository')
const logger = require('../utils/logger')
const { sanitizeAddress } = require('../utils/validators')
const { globalQueue } = require('../utils/request-queue')

class AddressService {
  constructor() {
    this.amapClient = amapClient
    this.cache = cache
    this.requestQueue = globalQueue
  }

  async batchGeocode(addresses) {
    const startTime = Date.now()
    logger.info(`[批量地理编码] 开始处理`, { total: addresses.length })
    const results = new Array(addresses.length).fill(null)
    const errors = []
    const tasksToProcess = []

    addresses.forEach((rawAddr, index) => {
      const address = sanitizeAddress(rawAddr)
      const cacheKey = cache.CacheRepository.geocodeKey(address.fullAddress, address.city)
      const cachedResult = this.cache.get(cacheKey)
      if (cachedResult) {
        results[index] = { ...address, ...cachedResult, fromCache: true }
      } else {
        tasksToProcess.push({ index, address, rawAddr })
      }
    })

    const cacheHitCount = addresses.length - tasksToProcess.length
    logger.info(`[批量地理编码] 缓存命中 ${cacheHitCount}/${addresses.length}, 需要API调用: ${tasksToProcess.length}`)
    if (tasksToProcess.length === 0) {
      return this.buildBatchResult(results, errors, startTime, addresses.length)
    }

    const apiTasks = tasksToProcess.map(({ index, address }) => {
      return async () => {
        const geocoded = await this.amapClient.geocode(address.fullAddress, address.city)
        const result = {
          ...address, longitude: geocoded.longitude, latitude: geocoded.latitude,
          formattedAddress: geocoded.formattedAddress || address.fullAddress,
          adcode: geocoded.adcode || '', city: geocoded.city || address.city, fromCache: false
        }
        const cacheKey = cache.CacheRepository.geocodeKey(address.fullAddress, address.city)
        this.cache.set(cacheKey, { longitude: result.longitude, latitude: result.latitude, formattedAddress: result.formattedAddress, adcode: result.adcode, city: result.city })
        results[index] = result
        return result
      }
    })

    await globalQueue.executeBatch(apiTasks)
    return this.buildBatchResult(results, errors, startTime, addresses.length)
  }

  buildBatchResult(results, errors, startTime, total) {
    const successCount = results.filter(r => r && r.longitude !== null).length
    const duration = Date.now() - startTime
    return {
      success: errors.length === 0 || successCount >= 2,
      data: results, errors,
      statistics: { total, success: successCount, failed: errors.length, hitRate: `${((successCount / total) * 100).toFixed(1)}%`, performance: { totalDuration: `${duration}ms`, averagePerItem: `${Math.round(duration / total)}ms` } }
    }
  }

  async geocode(address, city = '') {
    const cacheKey = cache.CacheRepository.geocodeKey(address, city)
    const cached = this.cache.get(cacheKey)
    if (cached) return cached
    const result = await this.amapClient.geocode(address, city)
    this.cache.set(cacheKey, result)
    return result
  }

  async reverseGeocode(longitude, latitude) {
    const cacheKey = cache.CacheRepository.generateKey('reversegeo', longitude, latitude)
    return await this.cache.getOrSet(cacheKey, () => this.amapClient.reverseGeocode(longitude, latitude))
  }

  async searchSuggestions(keyword, city = '', limit = 10) {
    if (!keyword || keyword.trim().length < 1) throw new Error('搜索关键词不能为空')
    const cacheKey = cache.CacheRepository.inputTipsKey(keyword, city)
    return await this.cache.getOrSet(cacheKey, () => this.amapClient.inputTips(keyword, city, limit), 300)
  }

  validateForRoutePlanning(geocodedAddresses) {
    const validAddresses = geocodedAddresses.filter(addr => addr.longitude && addr.latitude && !addr.geocodeError)
    if (validAddresses.length < 2) {
      return { valid: false, error: '有效的地址不足2个，无法进行路线规划', origin: null, destination: null, waypoints: [] }
    }
    const origin = validAddresses.find(addr => addr.type === 'origin') || validAddresses[0]
    const destination = validAddresses.find(addr => addr.type === 'destination') || validAddresses[validAddresses.length - 1]
    const waypoints = validAddresses.filter(addr => addr.id !== origin.id && addr.id !== destination.id)
    return { valid: true, origin, destination, waypoints, totalCount: validAddresses.length, waypointCount: waypoints.length }
  }

  clearCache() { return true }
}

module.exports = new AddressService()
