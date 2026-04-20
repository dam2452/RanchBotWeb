import axios, { type AxiosInstance } from 'axios'

const client: AxiosInstance = axios.create({
  baseURL: '/',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status >= 500 && typeof window !== 'undefined') {
      window.location.href = '/error'
    }
    return Promise.reject(error)
  }
)

export { client }
