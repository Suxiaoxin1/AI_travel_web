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

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/plan', name: 'TravelPlan', component: TravelPlan },
  { path: '/destinations', name: 'HotDestinations', component: HotDestinations },
  { path: '/routes', name: 'TripRoutes', component: TripRoutes },
  { path: '/share', name: 'TravelShare', component: TravelShare },
  { path: '/share/post/:id', name: 'SharePostDetail', component: SharePostDetail },
  { path: '/journal', name: 'TravelJournal', component: TravelJournal },
  { path: '/auth', name: 'Auth', component: AuthPage },
  { path: '/bookings', name: 'Bookings', component: Bookings },
  { path: '/favorites', name: 'Favorites', component: Favorites },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
