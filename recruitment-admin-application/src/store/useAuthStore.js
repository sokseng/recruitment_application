import { create } from 'zustand'

const useAuthStore = create((set) => ({
  access_token: null,
  hydrated: false,
  user_type: null,
  user_data: null,

  setAccessToken: (token) => {
    localStorage.setItem('access_token', token)
    set({ access_token: token })
  },

  clearAccessToken: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_type')
    localStorage.removeItem('user_data')
    set({
      access_token: null,
      user_type: null,
      user_data: null,
    })
  },

  setUserData: (userData) => {
    localStorage.setItem('user_data', JSON.stringify(userData))
    set({ user_data: userData })
  },

  setUserType: (user_type) => {
    localStorage.setItem('user_type', user_type)
    set({ user_type })
  },

  hydrate: () => {
    const token = localStorage.getItem('access_token')
    const user_type = localStorage.getItem('user_type')
    const user_data = localStorage.getItem('user_data')
    set({
      access_token: token,
      user_type: user_type ? Number(user_type) : null,
      user_data: user_data ? JSON.parse(user_data) : null,
      hydrated: true,
    })
  },
}))

export default useAuthStore
