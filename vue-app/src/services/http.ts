import axios, { type AxiosInstance } from 'axios'

export const API_BASE = '/api/v1'

const client: AxiosInstance = axios.create({
  baseURL: '/',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window === 'undefined') {
      return Promise.reject(error)
    }

    const status = error.response?.status

    if (status === 401) {
      const publicPaths = ['/', '/login', '/register', '/forgot-password']
      if (!publicPaths.includes(window.location.pathname)) {
        window.location.href = '/'
      }
      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)

export { client }
