import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 15000 })

// Interceptor: añade token automáticamente
api.interceptors.request.use(config => {
  const token = localStorage.getItem('krelab_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Interceptor: manejo global de errores
api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      // Solo redirige si NO estás ya en el login
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('krelab_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
