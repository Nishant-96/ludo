import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  senderId: string;
  displayName: string;
  message: string;
  timestamp: string;
}

interface ChatStore {
  messages: ChatMessage[];
  unreadCount: number;
  addMessage: (msg: Omit<ChatMessage, 'id'>) => void;
  markRead: () => void;
  clearChat: () => void;
}

let seq = 0;

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  unreadCount: 0,
  addMessage: (msg) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { ...msg, id: `${msg.senderId}-${msg.timestamp}-${++seq}` },
      ],
      unreadCount: state.unreadCount + 1,
    })),
  markRead: () => set({ unreadCount: 0 }),
  clearChat: () => set({ messages: [], unreadCount: 0 }),
}));
