import axios from 'axios'
import useAuthStore from '../store/useAuthStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  //Do NOT attach token for login
  if (config.url?.includes('/user/login')) {
    return config
  }

  const token = useAuthStore.getState().access_token

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export default api
