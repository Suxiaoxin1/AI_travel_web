/**
 * 缓存仓库模块
 */

const NodeCache = require('node-cache')
const logger = require('../utils/logger')
const config = require('../../config')

class CacheRepository {
  constructor(options = {}) {
    this.cache = new NodeCache({
      stdTTL: options.ttl || config.cache.ttl,
      checkperiod: options.checkPeriod || config.cache.checkPeriod,
      useClones: true,
      maxKeys: options.maxKeys || config.cache.maxKeys
    })
    this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0 }
    logger.info('缓存服务初始化完成', { ttl: options.ttl || config.cache.ttl, maxKeys: options.maxKeys || config.cache.maxKeys })
  }

  get(key) {
    try {
      const value = this.cache.get(key)
      if (value !== undefined) { this.stats.hits++; return value }
      this.stats.misses++; return null
    } catch (error) { logger.error('读取缓存失败', { key, error: error.message }); return null }
  }

  set(key, value, ttl = undefined) {
    try {
      const success = this.cache.set(key, value, ttl)
      if (success) this.stats.sets++
      return success
    } catch (error) { logger.error('设置缓存失败', { key, error: error.message }); return false }
  }

  delete(key) {
    try {
      const deleted = this.cache.del(key)
      this.stats.deletes += Array.isArray(key) ? key.length : 1
      return deleted
    } catch (error) { logger.error('删除缓存失败', { key, error: error.message }); return 0 }
  }

  has(key) { return this.cache.has(key) }

  async getOrSet(key, fetchFn, ttl = undefined) {
    const cachedValue = this.get(key)
    if (cachedValue !== null) return cachedValue
    try {
      const value = await fetchFn()
      if (value !== null && value !== undefined) this.set(key, value, ttl)
      return value
    } catch (error) { logger.error('获取数据失败（未缓存）', { key, error: error.message }); throw error }
  }

  getMany(keys) { const results = {}; keys.forEach(key => { results[key] = this.get(key) }); return results }

  setMany(data, ttl = undefined) {
    let successCount = 0
    Object.entries(data).forEach(([key, value]) => { if (this.set(key, value, ttl)) successCount++ })
    return successCount
  }

  async getManyOrSet(items, ttl = undefined) {
    const results = {}
    for (const item of items) {
      if (!results[item.key]) {
        try {
          const value = await item.fetchFn()
          if (value !== null && value !== undefined) { this.set(item.key, value, ttl); results[item.key] = value }
        } catch (error) { results[item.key] = null }
      }
    }
    return results
  }

  smartCleanup(targetUsage = 0.8) {
    try {
      const stats = this.cache.getStats()
      const usageRatio = stats.keys / this.cache.options.maxKeys
      if (usageRatio > targetUsage) {
        const allKeys = this.cache.keys()
        const deleteCount = Math.floor(allKeys.length * 0.2)
        if (deleteCount > 0) { this.delete(allKeys.slice(0, deleteCount)); return deleteCount }
      }
      return 0
    } catch (error) { logger.error('智能缓存清理失败', error); return 0 }
  }

  flush() { try { this.cache.flushAll(); return true } catch (error) { logger.error('清空缓存失败', error); return false } }

  getStats() {
    const cacheStats = this.cache.getStats()
    return {
      ...cacheStats,
      customStats: { ...this.stats },
      hitRate: this.stats.hits + this.stats.misses > 0 ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2) + '%' : '0%'
    }
  }

  static generateKey(prefix, ...args) {
    const parts = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg))
    return `${prefix}:${parts.join(':')}`
  }

  static geocodeKey(address, city = '') { return CacheRepository.generateKey('geocode', address, city) }
  static routeKey(originStr, destStr, waypointHash, strategy = 0) { return CacheRepository.generateKey('route', originStr, destStr, waypointHash, strategy) }
  static inputTipsKey(keyword, city = '') { return CacheRepository.generateKey('inputtips', keyword, city) }
}

module.exports = new CacheRepository()
module.exports.CacheRepository = CacheRepository
