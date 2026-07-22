import axios from 'axios'

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }

  if (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return 'http://localhost:5000/api'
  }

  return '/api'
}

const api = axios.create({
  baseURL: getBaseUrl(),
})

export default api
