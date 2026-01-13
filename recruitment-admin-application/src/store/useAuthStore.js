import { create } from 'zustand'

const useAuthStore = create((set) => ({
  access_token: null,       // global token
  setAccessToken: (token) => set({ access_token: token }),
  clearAccessToken: () => set({ access_token: null }),
}))

export default useAuthStore
