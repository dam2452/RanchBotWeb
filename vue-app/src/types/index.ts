export interface User {
  id: number
  username: string
  email: string
}

export interface Clip {
  id: string
  name: string
  created_at: string
  duration?: number
}

export interface SearchResult {
  id: string
  text: string
  timestamp: number
  episode?: string
}

export interface LoginCredentials {
  login: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
  confirmPassword: string
}

export interface ApiResponse<T> {
  status: 'success' | 'error'
  data?: T
  message?: string
}

export interface FilterOption {
  name: string
  label?: string
  episode_count?: number
  scene_count?: number
}

export interface SeasonInfo {
  [seasonNumber: string]: number
}

export interface EpisodeInfo {
  number: number
  title?: string
}

export interface ActiveFilters {
  season: string[]
  episode: string[]
  character: string[]
  emotion: string[]
  object: string[]
}
