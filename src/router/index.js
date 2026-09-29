import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import TravelPlan from '../views/TravelPlan.vue'
import HotDestinations from '../views/HotDestinationsPage.vue'
import TripRoutes from '../views/TripRoutes.vue'
import TravelShare from '../views/TravelShare.vue'
import SharePostDetail from '../views/SharePostDetail.vue'
import TravelJournal from '../views/TravelJournal.vue'
import AuthPage from '../views/AuthPage.vue'
import Bookings from '../views/Bookings.vue'
import Favorites from '../views/Favorites.vue'
import LegalDocument from '../views/LegalDocument.vue'
import AdminLayout from '../views/admin/AdminLayout.vue'
import AdminDashboard from '../views/admin/AdminDashboard.vue'
import AdminUsers from '../views/admin/AdminUsers.vue'
import AdminAttractions from '../views/admin/AdminAttractions.vue'
import AdminPosts from '../views/admin/AdminPosts.vue'
import AdminComments from '../views/admin/AdminComments.vue'
import AdminAudit from '../views/admin/AdminAudit.vue'
import AdminModelKeys from '../views/admin/AdminModelKeys.vue'
import { prototypeRoutes } from './prototypeRoutes.js'
import { useAuthStore } from '../stores/authStore'

const routes = [
  { path: '/', name: 'Home', component: Home },
  ...prototypeRoutes,
  { path: '/plan', name: 'TravelPlan', component: TravelPlan },
  { path: '/destinations', name: 'HotDestinations', component: HotDestinations },
  { path: '/routes', name: 'TripRoutes', component: TripRoutes },
  { path: '/share', name: 'TravelShare', component: TravelShare },
  { path: '/share/post/:id', name: 'SharePostDetail', component: SharePostDetail },
  { path: '/journal', name: 'TravelJournal', component: TravelJournal },
  { path: '/auth', name: 'Auth', component: AuthPage },
  { path: '/bookings', name: 'Bookings', component: Bookings },
  { path: '/favorites', name: 'Favorites', component: Favorites },
  { path: '/terms', name: 'Terms', component: LegalDocument, props: { type: 'terms' } },
  { path: '/privacy', name: 'Privacy', component: LegalDocument, props: { type: 'privacy' } },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: '', name: 'AdminDashboard', component: AdminDashboard },
      { path: 'users', name: 'AdminUsers', component: AdminUsers },
      { path: 'attractions', name: 'AdminAttractions', component: AdminAttractions },
      { path: 'posts', name: 'AdminPosts', component: AdminPosts },
      { path: 'comments', name: 'AdminComments', component: AdminComments },
      { path: 'model-keys', name: 'AdminModelKeys', component: AdminModelKeys },
      { path: 'audit', name: 'AdminAudit', component: AdminAudit },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }

    if (to.hash) {
      return { el: to.hash, top: 82, behavior: 'smooth' }
    }

    return { top: 0, behavior: 'smooth' }
  }
})

function safeRedirect(target) {
  return typeof target === 'string' && target.startsWith('/') && !target.startsWith('//')
    ? target
    : '/'
}

router.beforeEach((to) => {
  const auth = useAuthStore()
  const needsAuth = to.matched.some((record) => record.meta.requiresAuth)
  const needsAdmin = to.matched.some((record) => record.meta.requiresAdmin)

  if (needsAuth && !auth.currentUser) {
    return { name: 'Auth', query: { redirect: to.fullPath } }
  }

  if (needsAdmin && !auth.currentUser?.isAdmin) {
    return { name: 'Home' }
  }

  if (to.name === 'Auth' && auth.currentUser) {
    return safeRedirect(to.query.redirect)
  }

  return true
})

export default router
