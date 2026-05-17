import { defineStore } from 'pinia'
import { login, getProfile } from '@/api/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token') || null
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',
    isEditor: (state) => state.user?.role === 'editor' || state.user?.role === 'admin'
  },
  
  actions: {
    async login(credentials) {
      const res = await login(credentials)
      if (res.success) {
        this.token = res.data.token
        this.user = res.data.user
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
      }
      return res
    },
    
    async fetchProfile() {
      const res = await getProfile()
      if (res.success) {
        this.user = res.data
        localStorage.setItem('user', JSON.stringify(res.data))
      }
      return res
    },
    
    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }
})