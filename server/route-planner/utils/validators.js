/**
 * 参数验证器模块
 */

const { BusinessRules, Messages } = require('../../config/constants')
const { v4: uuidv4 } = require('uuid')

function validateAddressList(addresses) {
  const errors = []
  if (!Array.isArray(addresses)) {
    return { valid: false, errors: ['地址列表必须是数组'] }
  }
  if (addresses.length < BusinessRules.MIN_ADDRESSES) {
    errors.push(Messages.AT_LEAST_TWO_ADDRESSES)
  }
  if (addresses.length > BusinessRules.MAX_ADDRESSES) {
    errors.push(`地址数量不能超过${BusinessRules.MAX_ADDRESSES}个`)
  }
  let originCount = 0, destCount = 0
  addresses.forEach((addr, index) => {
    const prefix = `地址[${index}]`
    if (!addr.fullAddress && !addr.address) {
      errors.push(`${prefix}: 地址文本不能为空`)
    } else {
      const addressText = addr.fullAddress || addr.address
      if (addressText.length < BusinessRules.MIN_ADDRESS_LENGTH ||
          addressText.length > BusinessRules.MAX_ADDRESS_LENGTH) {
        errors.push(`${prefix}: 地址长度应在${BusinessRules.MIN_ADDRESS_LENGTH}-${BusinessRules.MAX_ADDRESS_LENGTH}之间`)
      }
    }
    if (!addr.type || !['origin', 'destination', 'waypoint'].includes(addr.type)) {
      errors.push(`${prefix}: 无效的地址类型`)
    } else {
      if (addr.type === 'origin') originCount++
      if (addr.type === 'destination') destCount++
    }
    if (addr.longitude !== undefined && addr.latitude !== undefined) {
      const coordValid = validateCoordinates(addr.longitude, addr.latitude)
      if (!coordValid.valid) {
        errors.push(`${prefix}: 坐标无效 - ${coordValid.message}`)
      }
    }
  })
  if (originCount === 0 && addresses.length > 0) {
    errors.push(Messages.ONLY_ONE_ORIGIN_ALLOWED.replace('只能有', '至少需要1个'))
  } else if (originCount > 1) {
    errors.push(Messages.ONLY_ONE_ORIGIN_ALLOWED)
  }
  if (destCount === 0 && addresses.length > 0) {
    errors.push(Messages.ONLY_ONE_DESTINATION_ALLOWED.replace('只能有', '至少需要1个'))
  } else if (destCount > 1) {
    errors.push(Messages.ONLY_ONE_DESTINATION_ALLOWED)
  }
  return { valid: errors.length === 0, errors }
}

function validateCoordinates(lng, lat) {
  if (typeof lng !== 'number' || typeof lat !== 'number') {
    return { valid: false, message: '坐标必须是数字' }
  }
  if (lng < BusinessRules.LNG_RANGE.min || lng > BusinessRules.LNG_RANGE.max) {
    return { valid: false, message: `经度超出范围(${BusinessRules.LNG_RANGE.min}-${BusinessRules.LNG_RANGE.max})` }
  }
  if (lat < BusinessRules.LAT_RANGE.min || lat > BusinessRules.LAT_RANGE.max) {
    return { valid: false, message: `纬度超出范围(${BusinessRules.LAT_RANGE.min}-${BusinessRules.LAT_RANGE.max})` }
  }
  return { valid: true, message: '' }
}

function validateRouteOptions(options = {}) {
  const errors = []
  const sanitized = {}
  if (options.strategy !== undefined) {
    if (typeof options.strategy !== 'number' || options.strategy < 0 || options.strategy > 33) {
      errors.push('驾车策略值无效（应为0-33之间的整数）')
    } else { sanitized.strategy = options.strategy }
  }
  if (options.avoidToll !== undefined) sanitized.avoidToll = Boolean(options.avoidToll)
  if (options.avoidHighway !== undefined) sanitized.avoidHighway = Boolean(options.avoidHighway)
  if (options.optimizeOrder !== undefined) sanitized.optimizeOrder = Boolean(options.optimizeOrder)
  if (options.optimizationStrategy) {
    const validStrategies = ['distance', 'time', 'balanced']
    if (!validStrategies.includes(options.optimizationStrategy)) {
      errors.push(`优化策略无效，应为: ${validStrategies.join(', ')}`)
    } else { sanitized.optimizationStrategy = options.optimizationStrategy }
  }
  return { valid: errors.length === 0, errors, sanitized }
}

function ensureAddressIds(addresses) {
  return addresses.map(addr => ({ ...addr, id: addr.id || uuidv4() }))
}

function sanitizeAddress(rawAddress) {
  return {
    id: rawAddress.id || uuidv4(),
    name: rawAddress.name || '',
    fullAddress: rawAddress.fullAddress || rawAddress.address || '',
    longitude: rawAddress.longitude || null,
    latitude: rawAddress.latitude || null,
    type: rawAddress.type || 'waypoint',
    sequence: rawAddress.sequence || 0,
    adcode: rawAddress.adcode || '',
    city: rawAddress.city || ''
  }
}

module.exports = {
  validateAddressList,
  validateCoordinates,
  validateRouteOptions,
  ensureAddressIds,
  sanitizeAddress
}
