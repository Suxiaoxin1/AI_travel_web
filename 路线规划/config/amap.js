/**
 * 高德地图API配置
 * 包含API密钥、请求地址、参数默认值等
 */

const amap = {
  // API Key（从环境变量获取）
  apiKey: process.env.AMAP_API_KEY || '',
  
  // 密钥（用于签名验证，可选）
  secretKey: process.env.AMAP_SECRET_KEY || '',
  
  // 基础URL
  baseUrl: 'https://restapi.amap.com/v3',
  
  // Web服务API基础URL（用于服务端调用）
  webServiceUrl: 'https://restapi.amap.com/v3',
  
  /**
   * 驾车策略选项
   * 参考高德文档：https://lbs.amap.com/api/webservice/guide/api/direction
   */
  drivingStrategies: {
    /** 0-速度优先（时间最短） */
    FASTEST: 0,
    /** 1-费用优先（不走收费） */
    NO_FEE: 1,
    /** 2-距离优先（路程最短） */
    SHORTEST: 2,
    /** 3-不走高速 */
    NO_HIGHWAY: 3,
    /** 4-不走高速且避免收费 */
    NO_HIGHWAY_NO_FEE: 4,
    /** 5-避免收费 */
    AVOID_FEE: 5,
    /** 6-高速优先 */
    HIGHWAY_FIRST: 7,
    /** 8-省时优先（结合路况） */
    TIME_SAVING: 10,
    
    /** 多途经点优化策略 */
    /** 31-使用起点、途经点、终点进行路线规划 */
    MULTI_POINT_PLAN: 31,
    /** 32-使用起点、终点进行路线规划，途经点只是参考 */
    MULTI_POINT_REFERENCE: 32,
    /** 33-使用起点、途经点进行路线规划，终点只是参考 */
    MULTI_POINT_DEST_REF: 33
  },
  
  /**
   * API限制常量
   */
  limits: {
    // 驾车路径规划最大途经点数
    maxWaypointsPerRequest: 16,
    
    // 地理编码单次最大数量
    maxGeocodeBatchSize: 10,
    
    // 距离矩阵最大点数
    maxDistanceMatrixPoints: 20,
    
    // 输入提示返回结果数
    maxInputTipsCount: 10
  },
  
  /**
   * 默认请求参数
   */
  defaults: {
    // 坐标类型：0-经纬度坐标，1-GPS坐标
    output: 'json',
    
    // 返回数据扩展信息
    extensions: 'all'
  }
}

module.exports = amap
