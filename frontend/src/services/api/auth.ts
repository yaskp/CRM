import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authService = {
  login: async (emailOrUsername: string, password: string) => {
    const response = await api.post('/auth/login', { 
      email: emailOrUsername,
      username: emailOrUsername,
      password 
    })
    return response.data
  },

  register: async (data: {
    name: string
    email: string
    password: string
    employee_id: string
    phone?: string
  }) => {
    const response = await api.post('/auth/register', data)
    return response.data
  },

  getMe: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },

  refreshToken: async () => {
    const response = await api.post('/auth/refresh')
    return response.data
  },

  logout: async () => {
    await api.post('/auth/logout')
  },
}

export default api

