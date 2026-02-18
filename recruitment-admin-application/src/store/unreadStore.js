import { create } from "zustand";

export const useUnreadStore = create((set) => ({
  chatCounts: {}, // { roomId: count }
  globalCount: 0,

  setChatCount: (roomId, count) =>
    set((state) => {
      const updated =
        count > 0
          ? { ...state.chatCounts, [roomId]: count }
          : Object.fromEntries(
              Object.entries(state.chatCounts).filter(
                ([id]) => Number(id) !== roomId
              )
            );

      return {
        chatCounts: updated,
        globalCount: Object.values(updated).reduce((a, b) => a + b, 0),
      };
    }),

  incrementChat: (roomId) =>
    set((state) => {
      const updated = {
        ...state.chatCounts,
        [roomId]: (state.chatCounts[roomId] || 0) + 1,
      };

      return {
        chatCounts: updated,
        globalCount: Object.values(updated).reduce((a, b) => a + b, 0),
      };
    }),

  resetChat: (roomId) =>
    set((state) => {
      const updated = { ...state.chatCounts };
      delete updated[roomId];

      return {
        chatCounts: updated,
        globalCount: Object.values(updated).reduce((a, b) => a + b, 0),
      };
    }),

  setAllChats: (counts) =>
    set(() => ({
      chatCounts: counts,
      globalCount: Object.values(counts).reduce((a, b) => a + b, 0),
    })),
}));
