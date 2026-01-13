import { create } from 'zustand'

const useAuthStore = create((set) => ({
  access_token: null,
  hydrated: false,

  setAccessToken: (token) => {
    localStorage.setItem('access_token', token)
    set({ access_token: token })
  },

  clearAccessToken: () => {
    localStorage.removeItem('access_token')
    set({ access_token: null })
  },

  hydrate: () => {
    const token = localStorage.getItem('access_token')
    set({
      access_token: token,
      hydrated: true,
    })
  },
}))

export default useAuthStore
