/**
 * 路线规划服务 - 核心业务逻辑
 */

const { v4: uuidv4 } = require('uuid')
const amapClient = require('../external/amap.client')
const addressService = require('./address.service')
const optimizationService = require('./optimization.service')
const cache = require('../repositories/cache.repository')
const logger = require('../utils/logger')
const config = require('../../config')
const { BusinessRules, ErrorCodes, AddressType, Messages } = require('../../config/constants')

class RouteService {
  constructor() {
    this.amapClient = amapClient
    this.addressService = addressService
    this.optimizationService = optimizationService
    this.cache = cache
    this.MAX_WAYPOINTS_PER_REQUEST = config.amap.limits.maxWaypointsPerRequest
  }

  async planRoute(request) {
    const requestId = uuidv4()
    const startTime = Date.now()
    logger.info(`[路线规划] 开始处理请求`, { requestId, addressCount: request.addresses?.length || 0, options: request.options })

    try {
      if (!request.addresses || !Array.isArray(request.addresses) || request.addresses.length < 2) {
        throw new AppError(ErrorCodes.INVALID_REQUEST, Messages.AT_LEAST_TWO_ADDRESSES, 400)
      }

      const geocodeResult = await this.addressService.batchGeocode(request.addresses)
      if (!geocodeResult.success) {
        throw new AppError(ErrorCodes.GEOCODE_FAILED, `地址解析失败：${geocodeResult.errors.length}个地址无法定位`, 400, geocodeResult.errors)
      }

      const validatedAddresses = this.addressService.validateForRoutePlanning(geocodeResult.data)
      if (!validatedAddresses.valid) {
        throw new AppError(ErrorCodes.ADDRESS_NOT_FOUND, validatedAddresses.error, 400)
      }

      const { origin, destination, waypoints } = validatedAddresses
      let optimizedWaypoints = [...waypoints]
      let optimizationResult = null
      const options = request.options || {}

      if (options.optimizeOrder && waypoints.length >= 2) {
        optimizationResult = await this.optimizationService.optimizeWaypointOrder(waypoints, origin, destination, options.optimizationStrategy || 'balanced')
        optimizedWaypoints = optimizationResult.optimizedOrder.map(idx => waypoints[idx])
      }

      let routeResult
      try {
        if (optimizedWaypoints.length <= this.MAX_WAYPOINTS_PER_REQUEST) {
          routeResult = await this.planSingleRoute(origin, destination, optimizedWaypoints, options)
        } else {
          routeResult = await this.planMultiSegmentRoute(origin, destination, optimizedWaypoints, options)
        }
      } catch (routeError) {
        throw new AppError(ErrorCodes.ROUTE_PLAN_FAILED, `路线计算失败: ${routeError.message}`, 500, { originalError: routeError.message })
      }

      if (!routeResult || !routeResult.routes || routeResult.routes.length === 0) {
        throw new AppError(ErrorCodes.ROUTE_PLAN_FAILED, '未能获取有效的路线数据', 500, { routeResult })
      }

      const result = this.buildResponse(requestId, request, geocodeResult.data, validatedAddresses, routeResult, optimizationResult, startTime)
      this.cacheRouteResult(requestId, result)

      const duration = Date.now() - startTime
      logger.info(`[路线规划] 完成`, { requestId, duration: `${duration}ms`, totalDistance: `${(result.data.summary.totalDistance / 1000).toFixed(2)}km`, totalTime: `${Math.round(result.data.summary.totalTime / 60)}分钟` })
      return result

    } catch (error) {
      const duration = Date.now() - startTime
      logger.error(`[路线规划] 失败`, { requestId, duration: `${duration}ms`, error: error.message, code: error.code, stack: error.stack })
      if (error instanceof AppError) throw error

      if (error.code === 'CUQPS_HAS_EXCEEDED_THE_LIMIT' || String(error.message).includes('QPS')) {
        throw new AppError(ErrorCodes.RATE_LIMIT_EXCEEDED, 'API请求频率过高，请稍后重试（建议3-5秒后）', 429, { retryAfter: 5, suggestion: '系统正在自动排队处理，您可以等待后重试' })
      }
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'NETWORK_ERROR') {
        throw new AppError(ErrorCodes.NETWORK_ERROR, '地图服务连接失败，请检查网络连接或稍后重试', 503, { suggestion: '可能是网络不稳定或高德服务暂时不可用' })
      }
      if (String(error.message).includes('地址解析失败')) {
        const partialResult = await this.attemptPartialPlanning(request)
        if (partialResult) return { ...partialResult, warnings: ['部分地址无法定位，已使用可用数据进行规划'], degraded: true }
      }

      throw new AppError(ErrorCodes.ROUTE_PLAN_FAILED, error.message || Messages.ROUTE_PLAN_SERVICE_UNAVAILABLE, 500, { requestId, originalError: error.message, suggestion: '请联系管理员或查看日志获取详细信息' })
    }
  }

  async attemptPartialPlanning(request) {
    try {
      const geocodeResult = await this.addressService.batchGeocode(request.addresses)
      const validAddresses = geocodeResult.data.filter(addr => addr.longitude && addr.latitude && !addr.geocodeError)
      if (validAddresses.length < 2) return null
      return this.executeRoutePlanningWithPreGeocoded({ ...request, addresses: validAddresses.map(addr => ({ fullAddress: addr.formattedAddress || addr.fullAddress, type: addr.type, longitude: addr.longitude, latitude: addr.latitude, preGeocoded: true })) })
    } catch (fallbackError) { logger.error('[降级模式] 降级规划也失败了', fallbackError); return null }
  }

  async executeRoutePlanningWithPreGeocoded(request) {
    return this.planRoute(request)
  }

  async planSingleRoute(origin, destination, waypoints, options) {
    let strategy = 0
    if (options.avoidToll && options.avoidHighway) strategy = config.amap.drivingStrategies.NO_HIGHWAY_NO_FEE
    else if (options.avoidToll) strategy = config.amap.drivingStrategies.AVOID_FEE
    else if (options.avoidHighway) strategy = config.amap.drivingStrategies.NO_HIGHWAY
    else if (options.strategy !== undefined) strategy = options.strategy

    const routeData = await this.amapClient.drivingRoute(origin, destination, waypoints, { strategy, extensions: 'all' })
    return { routes: [routeData], isMerged: false, segmentCount: 1 }
  }

  async planMultiSegmentRoute(origin, destination, waypoints, options) {
    const allRoutes = []; const segments = []
    let currentOrigin = origin
    let remainingWaypoints = [...waypoints]

    while (remainingWaypoints.length > 0) {
      const batchSize = Math.min(15, remainingWaypoints.length)
      const batch = remainingWaypoints.slice(0, batchSize)
      remainingWaypoints = remainingWaypoints.slice(batchSize)
      const segmentDest = remainingWaypoints.length > 0 ? remainingWaypoints[0] : destination

      try {
        const segmentRoute = await this.amapClient.drivingRoute(currentOrigin, segmentDest, batch.slice(0, -1), { strategy: options.strategy || 0, extensions: 'all' })
        segments.push({ index: segments.length, from: currentOrigin.name || currentOrigin.fullAddress, to: segmentDest.name || segmentDest.fullAddress, waypointCount: batch.length, distance: segmentRoute.distance, duration: segmentRoute.duration })
        allRoutes.push(segmentRoute)
        currentOrigin = segmentDest
      } catch (error) {
        throw new AppError(ErrorCodes.ROUTE_PLAN_FAILED, `分段路线规划失败：第${segments.length + 1}段出错`, 500, error.message)
      }
    }

    const mergedRoute = this.mergeMultipleRoutes(allRoutes, segments)
    return { routes: [mergedRoute], isMerged: true, segmentCount: segments.length, segments }
  }

  mergeMultipleRoutes(routes, segmentInfos) {
    let totalDistance = 0, totalDuration = 0, totalTolls = 0
    let allSteps = [], allPolylines = []

    for (let i = 0; i < routes.length; i++) {
      const route = routes[i]
      totalDistance += route.distance; totalDuration += route.duration; totalTolls += route.tolls || 0
      if (route.steps && route.steps.length > 0) {
        if (i > 0 && segmentInfos[i]) { allSteps.push({ instruction: `【第${i + 1}段】到达 ${segmentInfos[i].to}`, road: '', distance: 0, duration: 0, action: 'segment_end', polyline: '' }) }
        allSteps.push(...route.steps)
      }
      if (route.polyline) allPolylines.push(route.polyline)
    }

    return { distance: totalDistance, duration: totalDuration, tolls: totalTolls, toll_distance: routes.reduce((sum, r) => sum + (r.toll_distance || 0), 0), strategy: routes[0]?.strategy || 0, steps: allSteps, polyline: allPolylines.join(';') }
  }

  buildResponse(requestId, originalRequest, geocodedAddresses, validatedInfo, routeResult, optimizationResult, startTime) {
    const { origin, destination, waypoints } = validatedInfo
    const mainRoute = routeResult.routes[0]
    const warnings = []
    if (routeResult.isMerged) warnings.push(`途经点较多，已分为${routeResult.segmentCount}段进行规划`)
    if (originalRequest.addresses.length !== geocodedAddresses.filter(a => a.longitude).length) {
      warnings.push(`${originalRequest.addresses.length - geocodedAddresses.filter(a => a.longitude).length}个地址未能成功解析，已忽略`)
    }

    return {
      success: true,
      data: {
        requestId,
        summary: { totalDistance: mainRoute.distance, totalTime: mainRoute.duration, totalTollFee: mainRoute.tolls || 0, waypointCount: waypoints.length, processingTime: Date.now() - startTime },
        origin: this.sanitizePointForResponse(origin),
        destination: this.sanitizePointForResponse(destination),
        waypoints: waypoints.map(wp => this.sanitizePointForResponse(wp)),
        routes: [{ routeId: `route_${requestId}`, distance: mainRoute.distance, duration: mainRoute.duration, tolls: mainRoute.tolls || 0, steps: mainRoute.steps || [], polyline: mainRoute.polyline || '' }],
        optimization: optimizationResult ? { optimized: optimizationResult.optimizationDetails.optimized, strategy: optimizationResult.optimizationDetails.strategy, algorithm: optimizationResult.optimizationDetails.algorithm, estimatedSavings: optimizationResult.estimatedDistance ? `预估优化节省约 ${(optimizationResult.estimatedDistance * 0.1).toFixed(0)} 米` : null } : null,
        segments: routeResult.segments || null,
        warnings
      },
      timestamp: new Date().toISOString()
    }
  }

  sanitizePointForResponse(point) {
    return { id: point.id, name: point.name || point.fullAddress, fullAddress: point.formattedAddress || point.fullAddress, longitude: point.longitude, latitude: point.latitude, type: point.type, city: point.city || '', adcode: point.adcode || '' }
  }

  cacheRouteResult(requestId, result) {
    try {
      const cacheKey = cache.CacheRepository.generateKey('route_result', requestId)
      this.cache.set(cacheKey, result.data, BusinessRules.ROUTE_CACHE_TTL)
    } catch (error) { logger.warn('缓存路线结果失败', error.message) }
  }

  async optimizeOnly(request) {
    logger.info('[仅优化] 开始路径优化')
    const geocodeResult = await this.addressService.batchGeocode(request.addresses)
    if (!geocodeResult.success) throw new AppError(ErrorCodes.GEOCODE_FAILED, '地址解析失败', 400, geocodeResult.errors)

    const validPoints = geocodeResult.data.filter(p => p.longitude && p.latitude)
    if (validPoints.length < 3) throw new AppError(ErrorCodes.VALIDATION_ERROR, '至少需要3个有效地址才能进行优化', 400)

    const origin = validPoints.find(p => p.type === AddressType.ORIGIN) || validPoints[0]
    const destination = validPoints.find(p => p.type === AddressType.DESTINATION) || validPoints[validPoints.length - 1]
    const waypoints = validPoints.filter(p => p.id !== origin.id && p.id !== destination.id)

    const optimizationResult = await this.optimizationService.optimizeWaypointOrder(waypoints, origin, destination, request.options?.optimizationStrategy || 'balanced')

    return {
      success: true,
      data: {
        requestId: uuidv4(),
        originalOrder: waypoints.map((wp, idx) => ({ index: idx, id: wp.id, name: wp.name || wp.fullAddress })),
        suggestedOrder: optimizationResult.optimizedOrder.map(idx => ({ newIndex: idx, ...this.sanitizePointForResponse(waypoints[optimizationResult.optimizedOrder[idx]]) })),
        estimatedImprovement: optimizationResult.optimizationDetails,
        timestamp: new Date().toISOString()
      }
    }
  }
}

class AppError extends Error {
  constructor(code, message, statusCode = 500, details = null) {
    super(message)
    this.name = 'AppError'; this.code = code; this.statusCode = statusCode; this.details = details; this.timestamp = new Date().toISOString()
  }
}

module.exports = new RouteService()
module.exports.AppError = AppError
