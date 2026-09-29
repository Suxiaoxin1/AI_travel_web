export function unwrap(response) {
  return response.data?.data ?? response.data
}

export function formatDate(value) {
  return value
    ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
    : '未记录'
}

export function truncate(value, size) {
  return value && value.length > size ? `${value.slice(0, size)}…` : value || '未填写'
}

export function getErrorMessage(err, fallback) {
  return err.response?.data?.detail || err.message || fallback
}

export function statusText(status) {
  return ({
    active: '正常',
    suspended: '已停用',
    draft: '草稿',
    published: '已发布',
    hidden: '已隐藏',
    deleted: '已删除',
    archived: '已归档',
  })[status] || status
}

export function auditText(item) {
  return ({
    user_status_updated: '更新了用户账号状态',
    user_admin_role_updated: '调整了管理员权限',
    user_created: '创建了管理员账号',
    attraction_created: '新建了热门景点',
    attraction_updated: '修改了热门景点',
    attraction_archived: '归档了热门景点',
    post_status_updated: '更新了游记审核状态',
    comment_status_updated: '更新了评论审核状态',
  })[item.action] || item.action
}

export function auditDetail(item) {
  const data = item.metadata_json || {}
  const target = item.target_type
    ? `${item.target_type} #${item.target_id || ''}`
    : item.target_nickname || '目标记录'
  return data.reason || data.name || (data.before && data.after ? `${data.before} → ${data.after}` : target)
}

export function activityText(type) {
  return ({ share: '发布游记', plan: '保存行程', journal: '保存手账' })[type] || '更新内容'
}

export function moderationReason(label, item) {
  return prompt(`请输入${label}“${item.title || item.content?.slice(0, 18) || '该内容'}”的处理说明，可留空：`)
}

export const PAGE_SIZE = 10
