import { create } from "zustand";

export const useUnreadStore = create((set) => ({
  // Unread per chat for chat list
  chatCounts: {}, // { roomId: count }

  // Global unread for navbar
  globalCount: 0,

  setChatCount: (roomId, count) =>
    set((state) => {
      const newChatCounts = { ...state.chatCounts, [roomId]: count };
      const globalCount = Object.values(newChatCounts).reduce(
        (a, b) => a + b,
        0,
      );
      return { chatCounts: newChatCounts, globalCount };
    }),

  incrementChat: (roomId) =>
    set((state) => {
      const newChatCounts = {
        ...state.chatCounts,
        [roomId]: (state.chatCounts[roomId] || 0) + 1,
      };
      const globalCount = Object.values(newChatCounts).reduce(
        (a, b) => a + b,
        0,
      );
      return { chatCounts: newChatCounts, globalCount };
    }),

  resetChat: (roomId) =>
    set((state) => {
      const newChatCounts = { ...state.chatCounts, [roomId]: 0 };
      const globalCount = Object.values(newChatCounts).reduce(
        (a, b) => a + b,
        0,
      );
      return { chatCounts: newChatCounts, globalCount };
    }),

  setAllChats: (counts) =>
    set(() => {
      const globalCount = Object.values(counts).reduce((a, b) => a + b, 0);
      return { chatCounts: counts, globalCount };
    }),
}));
