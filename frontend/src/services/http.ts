import axios, { type AxiosInstance } from 'axios'

export const API_BASE = '/api/v1'

const client: AxiosInstance = axios.create({
  baseURL: '/',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password']

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window === 'undefined') {
      return Promise.reject(error)
    }

    const status = error.response?.status

    if (status === 401) {
      if (!PUBLIC_PATHS.includes(window.location.pathname)) {
        client.get(`${API_BASE}/auth/logout`).catch(() => {})
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)

export { client }
