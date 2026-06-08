/**
 * 订单持久化存储（本地 JSON 文件）
 * 生产环境可替换为 MongoDB / PostgreSQL / Supabase
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'orders.json');

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readOrders() {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeOrders(orders) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2));
}

/**
 * 创建本地订单记录
 */
function createOrder(order) {
  const orders = readOrders();
  const newOrder = {
    id: order.id,
    fliggyOrderId: order.fliggyOrderId || null,
    destName: order.destName,
    productName: order.productName || order.destName,
    type: order.type || '跟团游',
    contactName: order.contactName,
    contactPhone: order.contactPhone,
    startDate: order.startDate,
    days: order.days,
    people: order.people,
    totalPrice: order.totalPrice,
    status: order.status || 'confirmed',
    payUrl: order.payUrl || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  orders.unshift(newOrder);
  writeOrders(orders);
  return newOrder;
}

/**
 * 获取用户的所有订单
 */
function getUserOrders(phone) {
  const orders = readOrders();
  if (!phone) return orders;
  return orders.filter(o => o.contactPhone === phone);
}

/**
 * 获取单个订单
 */
function getOrderById(id) {
  const orders = readOrders();
  return orders.find(o => o.id === id) || null;
}

/**
 * 更新订单状态
 */
function updateOrderStatus(id, status, fliggyOrderId = null) {
  const orders = readOrders();
  const order = orders.find(o => o.id === id);
  if (!order) return null;
  order.status = status;
  order.updatedAt = new Date().toISOString();
  if (fliggyOrderId) order.fliggyOrderId = fliggyOrderId;
  writeOrders(orders);
  return order;
}

/**
 * 取消订单
 */
function cancelOrder(id) {
  return updateOrderStatus(id, 'cancelled');
}

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
};
