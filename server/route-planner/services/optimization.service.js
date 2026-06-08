/**
 * 路径优化服务
 * 实现途经点顺序优化算法（TSP简化版）
 */

const amapClient = require('../external/amap.client')
const logger = require('../utils/logger')

class OptimizationService {
  constructor() { this.amapClient = amapClient }

  async optimizeWaypointOrder(waypoints, origin, destination, strategy = 'balanced') {
    const startTime = Date.now()
    logger.info(`开始路径优化`, { waypointCount: waypoints.length, strategy })
    if (!waypoints || waypoints.length < 2) {
      return { optimizedOrder: Array.from({ length: waypoints.length }, (_, i) => i), estimatedDistance: 0, optimizationDetails: { optimized: false, reason: '途经点数量不足' } }
    }
    try {
      let optimizedOrder
      switch (strategy) {
        case 'distance': optimizedOrder = await this.optimizeByDistance(waypoints, origin, destination); break
        case 'time': optimizedOrder = await this.optimizeByTime(waypoints, origin, destination); break
        case 'balanced': default: optimizedOrder = await this.optimizeBalanced(waypoints, origin, destination); break
      }
      const orderedPoints = this.getOrderedList(optimizedOrder, waypoints, origin, destination)
      const estimatedDistance = await this.calculateTotalDistance(orderedPoints)
      const duration = Date.now() - startTime
      return { optimizedOrder, estimatedDistance, optimizationDetails: { optimized: true, strategy, duration: `${duration}ms`, algorithm: this.getAlgorithmName(strategy) } }
    } catch (error) {
      logger.error('路径优化失败', error)
      return { optimizedOrder: Array.from({ length: waypoints.length }, (_, i) => i), estimatedDistance: 0, optimizationDetails: { optimized: false, reason: error.message, fallbackToOriginal: true }, error: error.message }
    }
  }

  async optimizeByDistance(waypoints, origin, destination) {
    const allPoints = [
      { ...origin, isOrigin: true, isDestination: false },
      ...waypoints.map((wp, idx) => ({ ...wp, originalIndex: idx, isOrigin: false, isDestination: false })),
      { ...destination, isOrigin: false, isDestination: true }
    ]
    const initialRoute = this.nearestNeighbor(allPoints, 0, allPoints.length - 1)
    const improvedRoute = this.twoOptImprove(initialRoute, allPoints)
    return improvedRoute.filter(idx => !allPoints[idx].isOrigin && !allPoints[idx].isDestination).map(idx => allPoints[idx].originalIndex)
  }

  async optimizeByTime(waypoints, origin, destination) {
    const allPoints = [origin, ...waypoints, destination]
    const distanceMatrix = await this.buildDistanceMatrix(allPoints)
    const route = this.solveTSPWithMatrix(distanceMatrix, 0, allPoints.length - 1)
    return route.filter((_, idx) => idx !== 0 && idx !== allPoints.length - 1).map(pointIdx => pointIdx - 1)
  }

  async optimizeBalanced(waypoints, origin, destination) {
    if (waypoints.length <= 10) return await this.optimizeByTime(waypoints, origin, destination)
    return await this.optimizeByDistance(waypoints, origin, destination)
  }

  nearestNeighbor(points, startIndex, endIndex) {
    const n = points.length
    const visited = new Set([startIndex, endIndex])
    const route = [startIndex]
    let current = startIndex
    while (visited.size < n) {
      let nearestDist = Infinity, nearestIdx = -1
      for (let i = 0; i < n; i++) {
        if (!visited.has(i)) {
          const dist = this.euclideanDistance(points[current], points[i])
          if (dist < nearestDist) { nearestDist = dist; nearestIdx = i }
        }
      }
      if (nearestIdx === -1) break
      visited.add(nearestIdx); route.push(nearestIdx); current = nearestIdx
    }
    if (!route.includes(endIndex)) route.push(endIndex)
    return route
  }

  twoOptImprove(route, points) {
    let improved = true
    let bestRoute = [...route]
    let bestDistance = this.calculateRouteDistance(bestRoute, points)
    const maxIterations = 100
    let iteration = 0
    while (improved && iteration < maxIterations) {
      improved = false; iteration++
      for (let i = 1; i < bestRoute.length - 2; i++) {
        for (let j = i + 1; j < bestRoute.length - 1; j++) {
          const newRoute = this.twoOptSwap(bestRoute, i, j)
          const newDistance = this.calculateRouteDistance(newRoute, points)
          if (newDistance < bestDistance) { bestRoute = newRoute; bestDistance = newDistance; improved = true }
        }
      }
    }
    return bestRoute
  }

  twoOptSwap(route, i, j) {
    return route.slice(0, i).concat(route.slice(i, j + 1).reverse(), route.slice(j + 1))
  }

  async buildDistanceMatrix(points) {
    try {
      const batchSize = 20; const matrix = []
      for (let i = 0; i < points.length; i += batchSize) {
        const batchOrigins = points.slice(i, Math.min(i + batchSize, points.length))
        const result = await this.amapClient.distanceMatrix(batchOrigins, points, '1')
        matrix.push(...result)
      }
      return matrix
    } catch (error) {
      logger.warn('距离矩阵获取失败，回退到直线距离计算', error.message)
      return this.buildEuclideanMatrix(points)
    }
  }

  buildEuclideanMatrix(points) {
    const n = points.length; const matrix = []
    for (let i = 0; i < n; i++) {
      const row = []
      for (let j = 0; j < n; j++) { row.push({ destinationIndex: j, distance: this.euclideanDistance(points[i], points[j]), duration: 0 }) }
      matrix.push({ originIndex: i, distances: row })
    }
    return matrix
  }

  solveTSPWithMatrix(matrix, startIdx, endIdx) {
    const n = matrix.length
    const visited = new Set([startIdx, endIdx])
    const route = [startIdx]
    let current = startIdx
    while (visited.size < n) {
      let minDist = Infinity, nextIdx = -1
      const currentRow = matrix[current]?.distances || []
      for (let i = 0; i < n; i++) {
        if (!visited.has(i) && currentRow[i] && currentRow[i].distance < minDist) { minDist = currentRow[i].distance; nextIdx = i }
      }
      if (nextIdx === -1) break
      visited.add(nextIdx); route.push(nextIdx); current = nextIdx
    }
    if (!route.includes(endIdx)) route.push(endIdx)
    return route
  }

  euclideanDistance(point1, point2) {
    const lng1 = point1.longitude * Math.PI / 180; const lat1 = point1.latitude * Math.PI / 180
    const lng2 = point2.longitude * Math.PI / 180; const lat2 = point2.latitude * Math.PI / 180
    const dlng = lng2 - lng1; const dlat = lat2 - lat1
    const a = Math.sin(dlat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlng / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return 6371000 * c
  }

  calculateRouteDistance(route, points) {
    let total = 0
    for (let i = 0; i < route.length - 1; i++) total += this.euclideanDistance(points[route[i]], points[route[i + 1]])
    return total
  }

  getOrderedList(optimizedOrder, waypoints, origin, destination) {
    return [origin, ...optimizedOrder.map(idx => waypoints[idx]), destination]
  }

  async calculateTotalDistance(points) {
    if (points.length < 2) return 0
    let total = 0
    for (let i = 0; i < points.length - 1; i++) total += this.euclideanDistance(points[i], points[i + 1])
    return total
  }

  getAlgorithmName(strategy) {
    const names = { distance: '最近邻 + 2-opt (直线距离)', time: '贪心算法 (实际驾驶距离)', balanced: '自适应混合算法' }
    return names[strategy] || '未知算法'
  }
}

module.exports = new OptimizationService()
