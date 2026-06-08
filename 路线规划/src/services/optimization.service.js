/**
 * 路径优化服务
 * 实现途经点顺序优化算法（TSP简化版）
 * 支持多种策略：距离优先、时间优先、平衡模式
 */

const amapClient = require('../external/amap.client')
const logger = require('../utils/logger')

class OptimizationService {
  constructor() {
    this.amapClient = amapClient
  }

  /**
   * 主方法：优化途经点访问顺序
   * 解决旅行商问题(TSP)的近似解
   * 
   * @param {Array} waypoints - 途经点数组 [{longitude, latitude, id, ...}]
   * @param {Object} origin - 起点 {longitude, latitude}
   * @param {Object} destination - 终点 {longitude, latitude}
   * @param {string} strategy - 优化策略：'distance' | 'time' | 'balanced'
   * @returns {Promise<{optimizedOrder: number[], estimatedDistance: number, optimizationDetails: Object}>}
   */
  async optimizeWaypointOrder(waypoints, origin, destination, strategy = 'balanced') {
    const startTime = Date.now()
    
    logger.info(`开始路径优化`, {
      waypointCount: waypoints.length,
      strategy,
      origin: [origin.longitude, origin.latitude],
      destination: [destination.longitude, destination.latitude]
    })

    // 参数校验
    if (!waypoints || waypoints.length < 2) {
      logger.info('途经点少于2个，无需优化')
      return {
        optimizedOrder: Array.from({ length: waypoints.length }, (_, i) => i),
        estimatedDistance: 0,
        optimizationDetails: {
          optimized: false,
          reason: '途经点数量不足'
        }
      }
    }

    try {
      let optimizedOrder
      
      switch (strategy) {
        case 'distance':
          optimizedOrder = await this.optimizeByDistance(waypoints, origin, destination)
          break
          
        case 'time':
          optimizedOrder = await this.optimizeByTime(waypoints, origin, destination)
          break
          
        case 'balanced':
        default:
          optimizedOrder = await this.optimizeBalanced(waypoints, origin, destination)
          break
      }

      // 计算优化后的预估距离
      const orderedPoints = this.getOrderedList(optimizedOrder, waypoints, origin, destination)
      const estimatedDistance = await this.calculateTotalDistance(orderedPoints)

      const duration = Date.now() - startTime

      logger.info('路径优化完成', {
        duration: `${duration}ms`,
        originalOrder: Array.from({ length: waypoints.length }, (_, i) => i),
        optimizedOrder,
        estimatedDistance: `${(estimatedDistance / 1000).toFixed(2)}km`
      })

      return {
        optimizedOrder,
        estimatedDistance,
        optimizationDetails: {
          optimized: true,
          strategy,
          duration: `${duration}ms`,
          algorithm: this.getAlgorithmName(strategy)
        }
      }

    } catch (error) {
      logger.error('路径优化失败', error)
      
      // 优化失败时返回原始顺序
      return {
        optimizedOrder: Array.from({ length: waypoints.length }, (_, i) => i),
        estimatedDistance: 0,
        optimizationDetails: {
          optimized: false,
          reason: error.message,
          fallbackToOriginal: true
        },
        error: error.message
      }
    }
  }

  /**
   * 基于直线距离的贪心优化（最近邻 + 2-opt改进）
   * 适用于不需要精确路况的场景，速度快
   */
  async optimizeByDistance(waypoints, origin, destination) {
    // 构建完整点列表：起点 + 途经点 + 终点
    const allPoints = [
      { ...origin, isOrigin: true, isDestination: false },
      ...waypoints.map((wp, idx) => ({ ...wp, originalIndex: idx, isOrigin: false, isDestination: false })),
      { ...destination, isOrigin: false, isDestination: true }
    ]

    // 步骤1：使用最近邻算法生成初始解
    const initialRoute = this.nearestNeighbor(allPoints, 0, allPoints.length - 1)

    // 步骤2：使用2-opt算法改进初始解
    const improvedRoute = this.twoOptImprove(initialRoute, allPoints)

    // 提取途经点的优化顺序（排除起终点）
    const optimizedOrder = improvedRoute
      .filter(idx => !allPoints[idx].isOrigin && !allPoints[idx].isDestination)
      .map(idx => allPoints[idx].originalIndex)

    return optimizedOrder
  }

  /**
   * 基于实际驾驶时间的优化（需调用距离矩阵API）
   * 更准确但耗时较长
   */
  async optimizeByTime(waypoints, origin, destination) {
    // 构建需要查询的点列表
    const allPoints = [origin, ...waypoints, destination]

    // 批量获取距离和时间矩阵
    const distanceMatrix = await this.buildDistanceMatrix(allPoints)

    // 使用动态规划或启发式算法求解TSP
    const route = this.solveTSPWithMatrix(distanceMatrix, 0, allPoints.length - 1)

    // 提取途经点顺序
    const optimizedOrder = route
      .filter((_, idx) => idx !== 0 && idx !== allPoints.length - 1)
      .map(pointIdx => pointIdx - 1) // 减去起点的偏移

    return optimizedOrder
  }

  /**
   * 平衡模式：综合考虑距离和时间
   * 默认推荐策略
   */
  async optimizeBalanced(waypoints, origin, destination) {
    // 根据途经点数量选择策略
    if (waypoints.length <= 10) {
      // 点数较少时使用时间优化（更准确）
      return await this.optimizeByTime(waypoints, origin, destination)
    } else {
      // 点数较多时使用距离优化（更快）
      return await this.optimizeByDistance(waypoints, origin, destination)
    }
  }

  // ==================== 核心算法实现 ====================

  /**
   * 最近邻算法（Nearest Neighbor Heuristic）
   * 从当前点出发，每次选择最近的未访问点
   * @private
   * @param {Array} points - 所有点
   * @param {number} startIndex - 固定的起始索引
   * @param {number} endIndex - 固定的结束索引
   * @returns {Array<number>} - 访问顺序索引数组
   */
  nearestNeighbor(points, startIndex, endIndex) {
    const n = points.length
    const visited = new Set([startIndex, endIndex]) // 起终点已固定访问
    const route = [startIndex]

    let current = startIndex
    
    while (visited.size < n) {
      let nearestDist = Infinity
      let nearestIdx = -1

      // 寻找最近的未访问点
      for (let i = 0; i < n; i++) {
        if (!visited.has(i)) {
          const dist = this.euclideanDistance(points[current], points[i])
          if (dist < nearestDist) {
            nearestDist = dist
            nearestIdx = i
          }
        }
      }

      if (nearestIdx === -1) break

      visited.add(nearestIdx)
      route.push(nearestIdx)
      current = nearestIdx
    }

    // 最后添加终点
    if (!route.includes(endIndex)) {
      route.push(endIndex)
    }

    return route
  }

  /**
   * 2-opt局部搜索改进
   * 通过交换边来优化路径
   * @private
   */
  twoOptImprove(route, points) {
    let improved = true
    let bestRoute = [...route]
    let bestDistance = this.calculateRouteDistance(bestRoute, points)

    const maxIterations = 100
    let iteration = 0

    while (improved && iteration < maxIterations) {
      improved = false
      iteration++

      for (let i = 1; i < bestRoute.length - 2; i++) {
        for (let j = i + 1; j < bestRoute.length - 1; j++) {
          // 尝试2-opt交换
          const newRoute = this.twoOptSwap(bestRoute, i, j)
          const newDistance = this.calculateRouteDistance(newRoute, points)

          if (newDistance < bestDistance) {
            bestRoute = newRoute
            bestDistance = newDistance
            improved = true
          }
        }
      }
    }

    return bestRoute
  }

  /**
   * 2-opt交换操作
   * 反转i到j之间的路径段
   * @private
   */
  twoOptSwap(route, i, j) {
    const newRoute = route.slice(0, i)
    const reversedSegment = route.slice(i, j + 1).reverse()
    const remaining = route.slice(j + 1)
    return newRoute.concat(reversedSegment, remaining)
  }

  /**
   * 构建距离矩阵（调用高德API）
   * @private
   */
  async buildDistanceMatrix(points) {
    try {
      // 分批请求（高德限制每批最多20个点）
      const batchSize = 20
      const matrix = []

      for (let i = 0; i < points.length; i += batchSize) {
        const batchOrigins = points.slice(i, Math.min(i + batchSize, points.length))
        const result = await this.amapClient.distanceMatrix(batchOrigins, points, '1') // type=1表示驾车距离
        
        matrix.push(...result)
      }

      return matrix
    } catch (error) {
      logger.warn('距离矩阵获取失败，回退到直线距离计算', error.message)
      // 回退到欧几里得距离
      return this.buildEuclideanMatrix(points)
    }
  }

  /**
   * 构建欧几里得距离矩阵（备用方案）
   * @private
   */
  buildEuclideanMatrix(points) {
    const n = points.length
    const matrix = []

    for (let i = 0; i < n; i++) {
      const row = []
      for (let j = 0; j < n; j++) {
        row.push({
          destinationIndex: j,
          distance: this.euclideanDistance(points[i], points[j]),
          duration: 0 // 无法估算时间
        })
      }
      matrix.push({ originIndex: i, distances: row })
    }

    return matrix
  }

  /**
   * 使用距离矩阵求解TSP（简化的动态规划/贪心混合）
   * @private
   */
  solveTSPWithMatrix(matrix, startIdx, endIdx) {
    const n = matrix.length
    const visited = new Set([startIdx, endIdx])
    const route = [startIdx]
    let current = startIdx

    // 贪心选择（基于实际驾驶距离）
    while (visited.size < n) {
      let minDist = Infinity
      let nextIdx = -1

      const currentRow = matrix[current]?.distances || []

      for (let i = 0; i < n; i++) {
        if (!visited.has(i) && currentRow[i]) {
          if (currentRow[i].distance < minDist) {
            minDist = currentRow[i].distance
            nextIdx = i
          }
        }
      }

      if (nextIdx === -1) break

      visited.add(nextIdx)
      route.push(nextIdx)
      current = nextIdx
    }

    if (!route.includes(endIdx)) {
      route.push(endIdx)
    }

    return route
  }

  // ==================== 工具方法 ====================

  /**
   * 计算两点间的欧几里得距离（米）
   * 近似计算，用于比较排序
   * @private
   */
  euclideanDistance(point1, point2) {
    const lng1 = point1.longitude * Math.PI / 180
    const lat1 = point1.latitude * Math.PI / 180
    const lng2 = point2.longitude * Math.PI / 180
    const lat2 = point2.latitude * Math.PI / 180

    // Haversine公式计算球面距离
    const dlng = lng2 - lng1
    const dlat = lat2 - lat1
    const a = Math.sin(dlat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlng / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    // 地球半径（米）
    const R = 6371000
    return R * c
  }

  /**
   * 计算整条路线的总距离
   * @private
   */
  calculateRouteDistance(route, points) {
    let total = 0
    for (let i = 0; i < route.length - 1; i++) {
      total += this.euclideanDistance(points[route[i]], points[route[i + 1]])
    }
    return total
  }

  /**
   * 根据优化后的顺序重新排列点位
   * @private
   */
  getOrderedList(optimizedOrder, waypoints, origin, destination) {
    const orderedWaypoints = optimizedOrder.map(idx => waypoints[idx])
    return [origin, ...orderedWaypoints, destination]
  }

  /**
   * 计算有序点列的总距离（调用API或估算）
   * @private
   */
  async calculateTotalDistance(points) {
    if (points.length < 2) return 0

    let total = 0
    for (let i = 0; i < points.length - 1; i++) {
      total += this.euclideanDistance(points[i], points[i + 1])
    }

    return total
  }

  /**
   * 获取算法名称
   * @private
   */
  getAlgorithmName(strategy) {
    const names = {
      distance: '最近邻 + 2-opt (直线距离)',
      time: '贪心算法 (实际驾驶距离)',
      balanced: '自适应混合算法'
    }
    return names[strategy] || '未知算法'
  }
}

// 导出单例
module.exports = new OptimizationService()
