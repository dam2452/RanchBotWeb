import axios, { type AxiosInstance } from 'axios'

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
      const authPaths = ['/login', '/register', '/forgot-password']
      if (!authPaths.includes(window.location.pathname)) {
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }

    if (status >= 500) {
      window.location.href = '/'
    }

    return Promise.reject(error)
  }
)

export { client }
