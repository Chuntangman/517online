import { createRouter, createWebHistory } from 'vue-router'
import Homepage from '@/components/Homepage.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Homepage
  },
  {
    path: '/route',
    name: 'Route',
    component: () => import('@/components/route.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
