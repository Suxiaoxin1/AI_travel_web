/** 首页改造实验区路由：与线上 `/` 完全隔离，lazy 加载不影响主包默认路径。 */
export const prototypeRoutes = [
  {
    path: '/prototype/home',
    name: 'HomePrototype',
    component: () => import('../views/prototype/HomePrototype.vue'),
    meta: { prototype: true, title: '沉浸开场实验' }
  }
]
