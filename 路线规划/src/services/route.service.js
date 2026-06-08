/**
 * 路线规划服务 - 核心业务逻辑
 * 
 * 主要功能：
 * 1. 接收多个地址信息
 * 2. 执行地理编码（地址→坐标）
 * 3. 可选：优化途经点顺序
 * 4. 调用地图API计算路线
 * 5. 返回标准化的路线结果
 * 
 * 特点：
 * - 支持大量途经点（>16个时分批处理）
 * - 智能路径优化算法
 * - 完善的错误处理和日志
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
    
    // 高德API限制：单次请求最多16个途经点
    this.MAX_WAYPOINTS_PER_REQUEST = config.amap.limits.maxWaypointsPerRequest
  }

  /**
   * 主方法：执行完整的路线规划流程 ⭐⭐⭐
   * 
   * @param {Object} request - 规划请求对象
   * @param {Array} request.addresses - 地址列表
   * @param {Object} request.options - 规划选项
   * @returns {Promise<Object>} - 标准化的路线规划结果
   */
  async planRoute(request) {
    const requestId = uuidv4()
    const startTime = Date.now()
    
    logger.info(`[路线规划] 开始处理请求`, {
      requestId,
      addressCount: request.addresses?.length || 0,
      options: request.options
    })

    try {
      // ========== 第1步：验证请求数据 ==========
      logger.debug(`[路线规划] 步骤1/5: 验证请求数据`)
      
      if (!request.addresses || !Array.isArray(request.addresses) || request.addresses.length < 2) {
        throw new AppError(
          ErrorCodes.INVALID_REQUEST,
          Messages.AT_LEAST_TWO_ADDRESSES,
          400
        )
      }

      // ========== 第2步：批量地理编码 ==========
      logger.debug(`[路线规划] 步骤2/5: 批量地理编码`)
      
      const geocodeResult = await this.addressService.batchGeocode(request.addresses)
      
      if (!geocodeResult.success) {
        throw new AppError(
          ErrorCodes.GEOCODE_FAILED,
          `地址解析失败：${geocodeResult.errors.length}个地址无法定位`,
          400,
          geocodeResult.errors
        )
      }

      // 验证是否有足够的有效地址用于路线规划
      const validatedAddresses = this.addressService.validateForRoutePlanning(geocodeResult.data)
      
      if (!validatedAddresses.valid) {
        throw new AppError(
          ErrorCodes.ADDRESS_NOT_FOUND,
          validatedAddresses.error,
          400
        )
      }

      const { origin, destination, waypoints } = validatedAddresses

      logger.info(`[路线规划] 地址解析完成`, {
        origin: origin.name || origin.fullAddress,
        destination: destination.name || destination.fullAddress,
        waypointCount: waypoints.length
      })

      // ========== 第3步：可选 - 路径优化 ==========
      let optimizedWaypoints = [...waypoints]
      let optimizationResult = null

      const options = request.options || {}

      if (options.optimizeOrder && waypoints.length >= 2) {
        logger.debug(`[路线规划] 步骤3/5: 执行路径优化`)
        
        optimizationResult = await this.optimizationService.optimizeWaypointOrder(
          waypoints,
          origin,
          destination,
          options.optimizationStrategy || 'balanced'
        )

        // 根据优化后的顺序重新排列途经点
        optimizedWaypoints = optimizationResult.optimizedOrder.map(idx => waypoints[idx])
        
        logger.info(`[路线规划] 路径优化完成`, {
          originalOrder: waypoints.map(w => w.name || w.fullAddress),
          optimizedOrder: optimizedWaypoints.map(w => w.name || w.fullAddress)
        })
      } else {
        logger.debug(`[路线规划] 步骤3/5: 跳过路径优化（未启用或途经点不足）`)
      }

      // ========== 第4步：调用路线规划API ==========
      logger.debug(`[路线规划] 步骤4/5: 计算路线`)

      let routeResult

      try {
        if (optimizedWaypoints.length <= this.MAX_WAYPOINTS_PER_REQUEST) {
          // 途经点数量在限制内，直接调用API
          console.log(`[路线规划] 调用 planSingleRoute()...`)
          routeResult = await this.planSingleRoute(
            origin,
            destination,
            optimizedWaypoints,
            options
          )
          console.log(`[路线规划] ✅ planSingleRoute 完成:`, routeResult ? '有结果' : 'NULL')
        } else {
        // 途经点超过限制，需要分批处理
        logger.warn(`途经点数量(${optimizedWaypoints.length})超过限制(${this.MAX_WAYPOINTS_PER_REQUEST})，启动分批规划模式`)
        
        routeResult = await this.planMultiSegmentRoute(
          origin,
          destination,
          optimizedWaypoints,
          options
        )
        console.log(`[路线规划] ✅ planMultiSegmentRoute 完成:`, routeResult ? '有结果' : 'NULL')
        }
      } catch (routeError) {
        console.error(`[路线规划] ❌ 路线计算失败:`, routeError.message)
        console.error(`[路线规划] 错误详情:`, routeError.stack)
        throw new AppError(
          ErrorCodes.ROUTE_PLAN_FAILED,
          `路线计算失败: ${routeError.message}`,
          500,
          { originalError: routeError.message }
        )
      }

      // 安全检查：确保 routeResult 存在
      if (!routeResult || !routeResult.routes || routeResult.routes.length === 0) {
        console.error(`[路线规划] ❌ routeResult 无效:`, JSON.stringify(routeResult))
        throw new AppError(
          ErrorCodes.ROUTE_PLAN_FAILED,
          '未能获取有效的路线数据',
          500,
          { routeResult }
        )
      }

      // ========== 第5步：组装并返回结果 ==========
      logger.debug(`[路线规划] 步骤5/5: 组装返回结果`)

      const result = this.buildResponse(
        requestId,
        request,
        geocodeResult.data,
        validatedAddresses,
        routeResult,
        optimizationResult,
        startTime
      )

      // 缓存结果（短期缓存，避免重复计算）
      this.cacheRouteResult(requestId, result)

      const duration = Date.now() - startTime
      logger.info(`[路线规划] 完成`, {
        requestId,
        duration: `${duration}ms`,
        totalDistance: `${(result.data.summary.totalDistance / 1000).toFixed(2)}km`,
        totalTime: `${Math.round(result.data.summary.totalTime / 60)}分钟`
      })

      return result

    } catch (error) {
      const duration = Date.now() - startTime
      
      logger.error(`[路线规划] 失败`, {
        requestId,
        duration: `${duration}ms`,
        error: error.message,
        code: error.code,
        stack: error.stack
      })

      // 如果是已知业务错误，直接抛出
      if (error instanceof AppError) {
        throw error
      }

      // ========== 降级处理策略 ==========
      
      // 场景1：QPS超限错误 → 建议用户稍后重试
      if (error.code === 'CUQPS_HAS_EXCEEDED_THE_LIMIT' || 
          String(error.message).includes('QPS')) {
        throw new AppError(
          ErrorCodes.RATE_LIMIT_EXCEEDED,
          'API请求频率过高，请稍后重试（建议3-5秒后）',
          429,  // Too Many Requests
          {
            retryAfter: 5,
            suggestion: '系统正在自动排队处理，您可以等待后重试'
          }
        )
      }

      // 场景2：网络错误 → 提供友好的提示
      if (error.code === 'ECONNREFUSED' || 
          error.code === 'ETIMEDOUT' ||
          error.code === 'NETWORK_ERROR') {
        throw new AppError(
          ErrorCodes.NETWORK_ERROR,
          '地图服务连接失败，请检查网络连接或稍后重试',
          503,  // Service Unavailable
          {
            suggestion: '可能是网络不稳定或高德服务暂时不可用'
          }
        )
      }

      // 场景3：地理编码部分失败 → 尝试用成功的数据进行规划（降级模式）
      if (String(error.message).includes('地址解析失败')) {
        logger.warn(`[路线规划] 启用降级模式 - 部分地址解析失败`)
        
        // 尝试从已解析的地址中提取可用的起点、终点和途经点
        const partialResult = await this.attemptPartialPlanning(request)
        
        if (partialResult) {
          return {
            ...partialResult,
            warnings: ['部分地址无法定位，已使用可用数据进行规划'],
            degraded: true
          }
        }
      }

      // 默认：未知错误包装为标准格式
      throw new AppError(
        ErrorCodes.ROUTE_PLAN_FAILED,
        error.message || Messages.ROUTE_PLAN_SERVICE_UNAVAILABLE,
        500,
        {
          requestId,
          originalError: error.message,
          suggestion: '请联系管理员或查看日志获取详细信息'
        }
      )
    }
  }

  /**
   * 降级规划：当部分地址解析失败时，尝试用成功的数据进行规划
   * @private
   */
  async attemptPartialPlanning(request) {
    try {
      const geocodeResult = await this.addressService.batchGeocode(request.addresses)
      
      // 获取所有有效地址
      const validAddresses = geocodeResult.data.filter(addr => 
        addr.longitude && addr.latitude && !addr.geocodeError
      )

      if (validAddresses.length < 2) {
        return null  // 有效地址不足，无法降级
      }

      logger.info(`[降级模式] 使用 ${validAddresses.length}/${geocodeResult.data.length} 个有效地址`)

      // 构建新的请求对象（只包含有效的地址）
      const partialRequest = {
        ...request,
        addresses: validAddresses.map(addr => ({
          fullAddress: addr.formattedAddress || addr.fullAddress,
          type: addr.type,
          longitude: addr.longitude,
          latitude: addr.latitude,
          preGeocoded: true  // 标记为预编码，避免重复调用API
        }))
      }

      // 重新执行规划流程（跳过地理编码步骤）
      return this.executeRoutePlanningWithPreGeocoded(partialRequest)

    } catch (fallbackError) {
      logger.error('[降级模式] 降级规划也失败了', fallbackError)
      return null
    }
  }

  /**
   * 单次路线规划（途经点 ≤ 16个）
   * 直接调用高德驾车路径规划API
   */
  async planSingleRoute(origin, destination, waypoints, options) {
    try {
      // 构建驾车策略参数
      let strategy = 0 // 默认速度优先
      if (options.avoidToll && options.avoidHighway) {
        strategy = config.amap.drivingStrategies.NO_HIGHWAY_NO_FEE
      } else if (options.avoidToll) {
        strategy = config.amap.drivingStrategies.AVOID_FEE
      } else if (options.avoidHighway) {
        strategy = config.amap.drivingStrategies.NO_HIGHWAY
      } else if (options.strategy !== undefined) {
        strategy = options.strategy
      }

      const routeData = await this.amapClient.drivingRoute(
        origin,
        destination,
        waypoints,
        {
          strategy,
          extensions: 'all'
        }
      )

      return {
        routes: [routeData],
        isMerged: false,
        segmentCount: 1
      }

    } catch (error) {
      logger.error('单段路线规划失败', error)
      throw error
    }
  }

  /**
   * 多段路线规划（途经点 > 16个时使用）
   * 将大问题拆分为多个小问题，分别求解后合并
   * 
   * 策略：
   * 1. 将途经点分成多批（每批≤15个，留1个连接点）
   * 2. 依次规划每一段路线
   * 3. 合并所有段的路线数据
   */
  async planMultiSegmentRoute(origin, destination, waypoints, options) {
    const allRoutes = []
    const segments = []
    
    // 当前起点
    let currentOrigin = origin
    let remainingWaypoints = [...waypoints]
    
    while (remainingWaypoints.length > 0) {
      // 取出一批途经点（最多15个，保留最后一个作为下一段的起点）
      const batchSize = Math.min(15, remainingWaypoints.length)
      const batch = remainingWaypoints.slice(0, batchSize)
      remainingWaypoints = remainingWaypoints.slice(batchSize)
      
      // 这一段的终点：如果有剩余点则用下一个点作为终点，否则用最终终点
      const segmentDest = remainingWaypoints.length > 0 
        ? remainingWaypoints[0] 
        : destination
      
      try {
        // 规划这一段
        const segmentRoute = await this.amapClient.drivingRoute(
          currentOrigin,
          segmentDest,
          batch.slice(0, -1), // 最后一个点作为终点，不放入waypoints
          { strategy: options.strategy || 0, extensions: 'all' }
        )
        
        segments.push({
          index: segments.length,
          from: currentOrigin.name || currentOrigin.fullAddress,
          to: segmentDest.name || segmentDest.fullAddress,
          waypointCount: batch.length,
          distance: segmentRoute.distance,
          duration: segmentRoute.duration
        })
        
        allRoutes.push(segmentRoute)
        
        // 更新下一段的起点
        currentOrigin = segmentDest
        
      } catch (error) {
        logger.error(`分段规划失败 (段${segments.length + 1})`, error)
        throw new AppError(
          ErrorCodes.ROUTE_PLAN_FAILED,
          `分段路线规划失败：第${segments.length + 1}段出错`,
          500,
          error.message
        )
      }
    }
    
    // 合并所有段的数据
    const mergedRoute = this.mergeMultipleRoutes(allRoutes, segments)
    
    return {
      routes: [mergedRoute],
      isMerged: true,
      segmentCount: segments.length,
      segments
    }
  }

  /**
   * 合并多条路线数据
   * @private
   */
  mergeMultipleRoutes(routes, segmentInfos) {
    let totalDistance = 0
    let totalDuration = 0
    let totalTolls = 0
    let allSteps = []
    let allPolylines = []
    
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i]
      
      totalDistance += route.distance
      totalDuration += route.duration
      totalTolls += route.tolls || 0
      
      // 收集所有步骤
      if (route.steps && route.steps.length > 0) {
        // 在每个分段之间添加过渡提示
        if (i > 0 && segmentInfos[i]) {
          allSteps.push({
            instruction: `【第${i + 1}段】到达 ${segmentInfos[i].to}`,
            road: '',
            distance: 0,
            duration: 0,
            action: 'segment_end',
            polyline: ''
          })
        }
        
        allSteps.push(...route.steps)
      }
      
      // 收集折线数据
      if (route.polyline) {
        allPolylines.push(route.polyline)
      }
    }
    
    return {
      distance: totalDistance,
      duration: totalDuration,
      tolls: totalTolls,
      toll_distance: routes.reduce((sum, r) => sum + (r.toll_distance || 0), 0),
      strategy: routes[0]?.strategy || 0,
      steps: allSteps,
      polyline: allPolylines.join(';')
    }
  }

  /**
   * 构建标准化响应数据
   * @private
   */
  buildResponse(requestId, originalRequest, geocodedAddresses, validatedInfo, routeResult, optimizationResult, startTime) {
    const { origin, destination, waypoints } = validatedInfo
    const mainRoute = routeResult.routes[0]

    // 提取警告信息
    const warnings = []
    
    if (routeResult.isMerged) {
      warnings.push(`途经点较多，已分为${routeResult.segmentCount}段进行规划`)
    }
    
    if (originalRequest.addresses.length !== geocodedAddresses.filter(a => a.longitude).length) {
      const failedCount = originalRequest.addresses.length - geocodedAddresses.filter(a => a.longitude).length
      warnings.push(`${failedCount}个地址未能成功解析，已忽略`)
    }

    return {
      success: true,
      data: {
        requestId,
        
        // ===== 总览信息 =====
        summary: {
          totalDistance: mainRoute.distance,           // 总距离（米）
          totalTime: mainRoute.duration,               // 总时间（秒）
          totalTollFee: mainRoute.tolls || 0,          // 总过路费（元）
          waypointCount: waypoints.length,             // 途经点数量
          processingTime: Date.now() - startTime       // 处理耗时（毫秒）
        },
        
        // ===== 关键点位信息 =====
        origin: this.sanitizePointForResponse(origin),
        destination: this.sanitizePointForResponse(destination),
        waypoints: waypoints.map(wp => this.sanitizePointForResponse(wp)),
        
        // ===== 路线详情 =====
        routes: [{
          routeId: `route_${requestId}`,
          distance: mainRoute.distance,
          duration: mainRoute.duration,
          tolls: mainRoute.tolls || 0,
          steps: mainRoute.steps || [],
          polyline: mainRoute.polyline || ''
        }],
        
        // ===== 优化信息（如果进行了优化）=====
        optimization: optimizationResult ? {
          optimized: optimizationResult.optimizationDetails.optimized,
          strategy: optimizationResult.optimizationDetails.strategy,
          algorithm: optimizationResult.optimizationDetails.algorithm,
          estimatedSavings: optimizationResult.estimatedDistance 
            ? `预估优化节省约 ${(optimizationResult.estimatedDistance * 0.1).toFixed(0)} 米` 
            : null
        } : null,
        
        // ===== 分段信息（如果是合并路线）=====
        segments: routeResult.segments || null,
        
        // ===== 警告信息 =====
        warnings
      },
      
      timestamp: new Date().toISOString()
    }
  }

  /**
   * 清理点位数据用于响应（去除敏感或不必要字段）
   * @private
   */
  sanitizePointForResponse(point) {
    return {
      id: point.id,
      name: point.name || point.fullAddress,
      fullAddress: point.formattedAddress || point.fullAddress,
      longitude: point.longitude,
      latitude: point.latitude,
      type: point.type,
      city: point.city || '',
      adcode: point.adcode || ''
    }
  }

  /**
   * 缓存路线规划结果
   * @private
   */
  cacheRouteResult(requestId, result) {
    try {
      const cacheKey = cache.CacheRepository.generateKey('route_result', requestId)
      this.cache.set(cacheKey, result.data, BusinessRules.ROUTE_CACHE_TTL)
    } catch (error) {
      logger.warn('缓存路线结果失败', error.message)
    }
  }

  /**
   * 仅优化途经点顺序（不规划详细路线）
   * 用于快速预览或用户确认后再详细规划
   * 
   * @param {Object} request - 包含addresses和可选的origin、destination索引
   */
  async optimizeOnly(request) {
    logger.info('[仅优化] 开始路径优化')

    // 先进行地理编码
    const geocodeResult = await this.addressService.batchGeocode(request.addresses)
    
    if (!geocodeResult.success) {
      throw new AppError(
        ErrorCodes.GEOCODE_FAILED,
        '地址解析失败',
        400,
        geocodeResult.errors
      )
    }

    // 提取有效的地址点
    const validPoints = geocodeResult.data.filter(p => p.longitude && p.latitude)
    
    if (validPoints.length < 3) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        '至少需要3个有效地址才能进行优化',
        400
      )
    }

    // 确定起终点
    const origin = validPoints.find(p => p.type === AddressType.ORIGIN) || validPoints[0]
    const destination = validPoints.find(p => p.type === AddressType.DESTINATION) || validPoints[validPoints.length - 1]
    const waypoints = validPoints.filter(p => p.id !== origin.id && p.id !== destination.id)

    // 执行优化
    const optimizationResult = await this.optimizationService.optimizeWaypointOrder(
      waypoints,
      origin,
      destination,
      request.options?.optimizationStrategy || 'balanced'
    )

    // 返回优化后的顺序建议
    return {
      success: true,
      data: {
        requestId: uuidv4(),
        originalOrder: waypoints.map((wp, idx) => ({
          index: idx,
          id: wp.id,
          name: wp.name || wp.fullAddress
        })),
        suggestedOrder: optimizationResult.optimizedOrder.map(idx => ({
          newIndex: idx,
          originalIndex: optimizationResult.optimizedOrder[idx],
          ...this.sanitizePointForResponse(waypoints[optimizationResult.optimizedOrder[idx]])
        })),
        estimatedImprovement: optimizationResult.optimizationDetails,
        timestamp: new Date().toISOString()
      }
    }
  }
}

/**
 * 自定义应用错误类
 */
class AppError extends Error {
  constructor(code, message, statusCode = 500, details = null) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
    this.timestamp = new Date().toISOString()
  }
}

// 导出单例
module.exports = new RouteService()
module.exports.AppError = AppError
