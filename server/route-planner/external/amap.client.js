/**
 * 高德地图API客户端
 * 封装所有与高德Web服务API的交互
 */

const axios = require('axios')
let pLimit
try {
  pLimit = require('p-limit')
  if (typeof pLimit !== 'function') throw new Error('Not a function')
} catch (e) {
  console.warn('注意: p-limit版本不兼容，使用内置的简单限流器')
  pLimit = (concurrency) => {
    let running = 0
    const queue = []
    const run = async (fn) => {
      running++
      try { return await fn() } finally {
        running--
        if (queue.length > 0) queue.shift()()
      }
    }
    return (fn) => new Promise((resolve) => {
      const task = () => run(fn).then(resolve)
      if (running < concurrency) task()
      else queue.push(task)
    })
  }
}
const logger = require('../utils/logger')
const config = require('../../config')
const { BusinessRules } = require('../../config/constants')

class AmapClient {
  constructor() {
    this.apiKey = config.amap.apiKey
    this.baseUrl = config.amap.baseUrl
    this.httpClient = axios.create({
      timeout: BusinessRules.API_TIMEOUT,
      headers: { 'Content-Type': 'application/json; charset=UTF-8' }
    })
    this.limiter = pLimit(BusinessRules.MAX_CONCURRENT_API_CALLS)
    this.requestCount = 0
    this.lastResetTime = Date.now()
    this.maxRequestsPerSecond = config.rateLimit.maxRequests
    if (!this.apiKey || this.apiKey === '你的高德地图API_KEY') {
      logger.warn('高德地图API Key未配置，请在.env文件中设置AMAP_API_KEY')
    }
  }

  async checkRateLimit() {
    const now = Date.now()
    if (now - this.lastResetTime >= 1000) { this.requestCount = 0; this.lastResetTime = now }
    if (this.requestCount >= this.maxRequestsPerSecond) {
      const waitTime = 1000 - (now - this.lastResetTime)
      if (waitTime > 0) { await new Promise(resolve => setTimeout(resolve, waitTime)); this.requestCount = 0; this.lastResetTime = Date.now() }
    }
    this.requestCount++
  }

  async request(endpoint, params = {}) {
    try {
      // 在发起请求前检查 Key 是否有效
      if (!this.apiKey || this.apiKey === '你的高德地图API_KEY') {
        throw new AmapApiError('INVALID_KEY', 'AMAP_API_KEY 未配置，请在 server/.env 中设置高德地图 API Key\n申请地址: https://console.amap.com/dev/key/app', endpoint)
      }
      await this.checkRateLimit()
      const url = `${this.baseUrl}${endpoint}`
      const requestParams = { ...params, key: this.apiKey, output: 'json' }
      logger.debug(`[AmapAPI] 请求: ${endpoint}`, { params: requestParams })
      const response = await this.httpClient.get(url, {
        params: requestParams,
        timeout: 10000,
        timeoutErrorMessage: `高德API请求超时 (${endpoint})`
      })
      const data = response.data
      if (data.status !== '1') {
        throw new AmapApiError(data.infocode || 'UNKNOWN', data.info || '未知错误', endpoint)
      }
      logger.debug(`[AmapAPI] 成功: ${endpoint}`)
      return data
    } catch (error) {
      if (error instanceof AmapApiError) throw error
      logger.error(`[AmapAPI] 请求失败: ${endpoint}`, {
        message: error.message, code: error.code, isTimeout: error.code === 'ECONNABORTED'
      })
      throw new AmapApiError(
        error.code === 'ECONNABORTED' ? 'TIMEOUT' : 'NETWORK_ERROR',
        error.message || '网络请求失败',
        endpoint,
        { originalCode: error.code }
      )
    }
  }

  async geocode(address, city = null) {
    const params = { address }
    if (city) params.city = city
    const result = await this.request('/geocode/geo', params)
    if (!result.geocodes || result.geocodes.length === 0) {
      throw new AmapApiError('ADDRESS_NOT_FOUND', `无法解析地址: ${address}`, '/geocode/geo')
    }
    const geocode = result.geocodes[0]
    const [longitude, latitude] = geocode.location.split(',').map(Number)
    return { longitude, latitude, formattedAddress: geocode.formatted_address, adcode: geocode.adcode, city: geocode.city || '', district: geocode.district || '' }
  }

  async reverseGeocode(longitude, latitude) {
    const result = await this.request('/geocode/regeo', { location: `${longitude},${latitude}` })
    return {
      formattedAddress: result.regeocode.formatted_address,
      addressComponent: result.regeocode.addressComponent,
      roads: result.regeocode.roads || [],
      pois: result.regeocode.pois || []
    }
  }

  async inputTips(keyword, city = '', limit = 10) {
    const result = await this.request('/assistant/inputtips', { keywords: keyword, city, datatype: 'all', output: 'json' })
    return (result.tips || []).filter(tip => tip.location).slice(0, limit).map(tip => ({
      name: tip.name || tip.district || '',
      address: tip.address || tip.district || '',
      district: tip.district || '',
      adcode: tip.adcode || '',
      location: tip.location ? { longitude: parseFloat(tip.location.split(',')[0]), latitude: parseFloat(tip.location.split(',')[1]) } : null
    }))
  }

  async searchPlace(keyword, city, options = {}) {
    const result = await this.request('/place/text', { keywords: keyword, city, offset: options.limit || 10, page: options.page || 1, extensions: 'all' })
    return {
      pois: (result.pois || []).map(poi => ({
        id: poi.id, name: poi.name, address: poi.address || '',
        location: poi.location ? { longitude: parseFloat(poi.location.split(',')[0]), latitude: parseFloat(poi.location.split(',')[1]) } : null,
        type: poi.type || ''
      })),
      total: result.count || 0
    }
  }

  async drivingRoute(origin, destination, waypoints = [], options = {}) {
    const originStr = `${origin.longitude},${origin.latitude}`
    const destStr = `${destination.longitude},${destination.latitude}`
    let waypointStr = ''
    if (waypoints && waypoints.length > 0) {
      waypointStr = waypoints.map(wp => `${wp.longitude},${wp.latitude}`).join('|')
    }
    const params = {
      origin: originStr, destination: destStr,
      extensions: options.extensions || 'all',
      strategy: options.strategy !== undefined ? options.strategy : 0,
      ferry: options.ferry || 0,
      avoidpolygons: options.avoidpolygons || ''
    }
    if (waypointStr) params.waypoints = waypointStr
    const result = await this.request('/direction/driving', params)
    return this.parseDrivingResult(result)
  }

  parseDrivingResult(rawResult) {
    const route = rawResult.route?.paths?.[0]
    if (!route) throw new AmapApiError('ROUTE_NOT_FOUND', '无法获取路线数据', '/direction/driving')
    const steps = route.steps.map(step => ({
      instruction: step.instruction, road: step.road || '', distance: parseInt(step.distance) || 0,
      duration: parseInt(step.duration) || 0, action: step.action || '', polyline: step.polyline || '',
      tolls: parseInt(step.tolls) || 0, toll_distance: parseInt(step.toll_distance) || 0
    }))
    return {
      distance: parseInt(route.distance) || 0, duration: parseInt(route.duration) || 0,
      tolls: parseInt(route.tolls) || 0, toll_distance: parseInt(route.toll_distance) || 0,
      strategy: route.strategy, steps, polyline: route.polyline || ''
    }
  }

  async distanceMatrix(origins, destinations, type = '0') {
    const originsStr = origins.map(o => `${o.longitude},${o.latitude}`).join('|')
    const destsStr = destinations.map(d => `${d.longitude},${d.latitude}`).join('|')
    const result = await this.request('/distance', { origins: originsStr, destination: destsStr, type })
    return result.results.map((row, i) => ({
      originIndex: i,
      distances: row.map(item => ({ destinationIndex: item.destination_id, distance: parseInt(item.distance) || 0, duration: parseInt(item.duration) || 0 }))
    }))
  }

  async batchGeocode(addresses) {
    const results = await Promise.allSettled(
      addresses.map(addr => this.geocode(addr.address, addr.city))
    )
    return results.map((result, index) => ({
      originalAddress: addresses[index],
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason.message : null
    }))
  }

  async healthCheck() {
    try {
      await this.request('/assistant/inputtips', { keywords: '测试' })
      return true
    } catch (error) { return false }
  }
}

class AmapApiError extends Error {
  constructor(code, message, endpoint) {
    super(message)
    this.name = 'AmapApiError'
    this.code = code
    this.endpoint = endpoint
    this.timestamp = new Date().toISOString()
  }
}

module.exports = new AmapClient()
module.exports.AmapApiError = AmapApiError
