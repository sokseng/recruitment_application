import { create } from 'zustand'

const useAuthStore = create((set) => ({
  access_token: null,
  hydrated: false,
  user_type: null,

  setAccessToken: (token) => {
    localStorage.setItem('access_token', token)
    set({ access_token: token })
  },

  clearAccessToken: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_type')
    set({ access_token: null, user_type: null })
  },

  setUserType: (user_type) => {
    localStorage.setItem('user_type', user_type)
    set({ user_type })
  },

  hydrate: () => {
    const token = localStorage.getItem('access_token')
    const user_type = localStorage.getItem('user_type')
    set({
      access_token: token,
      user_type: user_type ? Number(user_type) : null,
      hydrated: true,
    })
  },
}))

export default useAuthStore
