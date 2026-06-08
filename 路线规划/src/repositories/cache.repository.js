/**
 * 缓存仓库模块
 * 提供统一的数据缓存接口
 * 使用NodeCache实现内存缓存（可扩展为Redis）
 */

const NodeCache = require('node-cache')
const logger = require('../utils/logger')
const config = require('../../config')

class CacheRepository {
  constructor(options = {}) {
    // 初始化NodeCache实例
    this.cache = new NodeCache({
      stdTTL: options.ttl || config.cache.ttl,           // 默认过期时间（秒）
      checkperiod: options.checkPeriod || config.cache.checkPeriod, // 检查周期（秒）
      useClones: true,                                   // 返回数据的深拷贝
      maxKeys: options.maxKeys || config.cache.maxKeys    // 最大缓存数量
    })

    // 统计信息
    this.stats = {
      hits: 0,       // 命中次数
      misses: 0,     // 未命中次数
      sets: 0,       // 设置次数
      deletes: 0     // 删除次数
    }

    logger.info('缓存服务初始化完成', {
      ttl: options.ttl || config.cache.ttl,
      maxKeys: options.maxKeys || config.cache.maxKeys
    })
  }

  /**
   * 获取缓存值
   * @param {string} key - 缓存键
   * @returns {*|null} - 缓存的值，不存在返回null
   */
  get(key) {
    try {
      const value = this.cache.get(key)
      
      if (value !== undefined) {
        this.stats.hits++
        logger.debug(`缓存命中: ${key}`)
        return value
      } else {
        this.stats.misses++
        logger.debug(`缓存未命中: ${key}`)
        return null
      }
    } catch (error) {
      logger.error('读取缓存失败', { key, error: error.message })
      return null
    }
  }

  /**
   * 设置缓存值
   * @param {string} key - 缓存键
   * @param {*} value - 缓存值
   * @param {number} ttl - 过期时间（秒），不传则使用默认值
   * @returns {boolean} - 是否设置成功
   */
  set(key, value, ttl = undefined) {
    try {
      const success = this.cache.set(key, value, ttl)
      
      if (success) {
        this.stats.sets++
        logger.debug(`缓存设置成功: ${key}`)
      } else {
        logger.warn(`缓存设置失败: ${key}`)
      }
      
      return success
    } catch (error) {
      logger.error('设置缓存失败', { key, error: error.message })
      return false
    }
  }

  /**
   * 删除缓存
   * @param {string|string[]} key - 缓存键或键数组
   * @returns {number} - 删除的数量
   */
  delete(key) {
    try {
      const deleted = this.cache.del(key)
      this.stats.deletes += Array.isArray(key) ? key.length : 1
      logger.debug(`缓存删除: ${key}, 数量: ${deleted}`)
      return deleted
    } catch (error) {
      logger.error('删除缓存失败', { key, error: error.message })
      return 0
    }
  }

  /**
   * 检查键是否存在
   * @param {string} key - 缓存键
   * @returns {boolean}
   */
  has(key) {
    return this.cache.has(key)
  }

  /**
   * 获取或设置（带自动回源）
   * 如果缓存存在则直接返回，否则调用fetchFn获取数据并存入缓存
   * @param {string} key - 缓存键
   * @param {Function} fetchFn - 数据获取函数（异步）
   * @param {number} ttl - 过期时间（秒）
   * @returns {Promise<*>} - 缓存的数据
   */
  async getOrSet(key, fetchFn, ttl = undefined) {
    // 先尝试从缓存获取
    const cachedValue = this.get(key)
    if (cachedValue !== null) {
      return cachedValue
    }

    // 缓存未命中，调用fetchFn获取数据
    try {
      const value = await fetchFn()
      
      // 存入缓存（排除null和undefined）
      if (value !== null && value !== undefined) {
        this.set(key, value, ttl)
      }
      
      return value
    } catch (error) {
      logger.error('获取数据失败（未缓存）', { key, error: error.message })
      throw error
    }
  }

  /**
   * 批量获取缓存值
   * @param {string[]} keys - 缓存键数组
   * @returns {Object} - {key: value, ...}
   */
  getMany(keys) {
    const results = {}
    
    keys.forEach(key => {
      results[key] = this.get(key)
    })
    
    return results
  }

  /**
   * 批量设置缓存值
   * @param {Object} data - {key: value, ...}
   * @param {number} ttl - 过期时间（秒）
   */
  setMany(data, ttl = undefined) {
    let successCount = 0
    
    Object.entries(data).forEach(([key, value]) => {
      if (this.set(key, value, ttl)) {
        successCount++
      }
    })
    
    logger.debug(`批量缓存设置完成: ${successCount}/${Object.keys(data).length}`)
    return successCount
  }

  /**
   * 获取或批量设置（智能批量回源）
   * 用于批量操作时，先批量检查缓存，再批量获取缺失的数据
   * 
   * @param {Array<{key: string, fetchFn: Function}>} items - 需要获取的项目
   * @param {number} ttl - 过期时间（秒）
   * @returns {Promise<Object>} - {key: value, ...}
   */
  async getManyOrSet(items, ttl = undefined) {
    const results = {}
    const missingItems = []
    
    // 第1步：批量检查缓存
    items.forEach(({ key }) => {
      const cachedValue = this.get(key)
      if (cachedValue !== null) {
        results[key] = cachedValue  // 缓存命中
      } else {
        missingItems.push(item => item.key === key)  // 需要获取
      }
    })
    
    // 第2步：批量获取缺失数据（串行执行，避免并发过大）
    for (const item of items) {
      if (!results[item.key]) {
        try {
          const value = await item.fetchFn()
          if (value !== null && value !== undefined) {
            this.set(item.key, value, ttl)
            results[item.key] = value
          }
        } catch (error) {
          logger.error('批量获取失败', { key: item.key, error: error.message })
          results[item.key] = null
        }
      }
    }
    
    return results
  }

  /**
   * 智能缓存清理（基于LRU策略）
   * 当缓存接近上限时，清理最久未使用的数据
   * @param {number} targetUsage - 目标使用率（0-1，默认0.8）
   */
  smartCleanup(targetUsage = 0.8) {
    try {
      const stats = this.cache.getStats()
      const usageRatio = stats.keys / this.cache.options.maxKeys
      
      if (usageRatio > targetUsage) {
        // 获取所有键并按访问时间排序
        const allKeys = this.cache.keys()
        
        // 删除最旧的20%数据
        const deleteCount = Math.floor(allKeys.length * 0.2)
        if (deleteCount > 0) {
          const keysToDelete = allKeys.slice(0, deleteCount)
          this.delete(keysToDelete)
          
          logger.info(`[智能清理] 已删除 ${deleteCount} 个过期缓存项`, {
            before: `${(usageRatio * 100).toFixed(1)}%`,
            after: `${((usageRatio - 0.2) * 100).toFixed(1)}%`
          })
          
          return deleteCount
        }
      }
      
      return 0
    } catch (error) {
      logger.error('智能缓存清理失败', error)
      return 0
    }
  }

  /**
   * 清空所有缓存
   */
  flush() {
    try {
      this.cache.flushAll()
      logger.info('缓存已清空')
      return true
    } catch (error) {
      logger.error('清空缓存失败', error)
      return false
    }
  }

  /**
   * 获取缓存统计信息
   * @returns {Object}
   */
  getStats() {
    const cacheStats = this.cache.getStats()
    
    return {
      ...cacheStats,
      customStats: { ...this.stats },
      hitRate: this.stats.hits + this.stats.misses > 0
        ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2) + '%'
        : '0%'
    }
  }

  /**
   * 生成标准的缓存键
   * @param {string} prefix - 键前缀（模块名）
   * @param {...*} args - 键的组成部分
   * @returns {string} - 标准化的缓存键
   */
  static generateKey(prefix, ...args) {
    // 将参数转换为字符串并用:连接
    const parts = args.map(arg => {
      if (typeof arg === 'object') {
        return JSON.stringify(arg)
      }
      return String(arg)
    })
    
    return `${prefix}:${parts.join(':')}`
  }

  /**
   * 地理编码专用缓存键生成
   */
  static geocodeKey(address, city = '') {
    return CacheRepository.generateKey('geocode', address, city)
  }

  /**
   * 路线规划专用缓存键生成
   * @param {string} originStr - 起点坐标字符串
   * @param {string} destStr - 终点坐标字符串
   * @param {string} waypointHash - 途经点哈希
   * @param {number} strategy - 驾车策略
   */
  static routeKey(originStr, destStr, waypointHash, strategy = 0) {
    return CacheRepository.generateKey('route', originStr, destStr, waypointHash, strategy)
  }

  /**
   * 输入提示专用缓存键生成
   */
  static inputTipsKey(keyword, city = '') {
    return CacheRepository.generateKey('inputtips', keyword, city)
  }
}

// 导出单例实例
module.exports = new CacheRepository()
module.exports.CacheRepository = CacheRepository
