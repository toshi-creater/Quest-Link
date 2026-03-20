import { create } from "zustand";

export type ChatMessage = {
  id: string;
  roomId: string;
  user: { id: string; username: string; iconUrl: string | null } | null;
  content: string;
  isSystem: boolean;
  createdAt: Date;
  isNew?: boolean;
};

export type Participant = {
  userId: string;
  isHost: boolean;
  user: { username: string; iconUrl: string | null; avgRating: number | null } | null;
};

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error" | "failed";

type ChatStore = {
  messages: ChatMessage[];
  participants: Participant[];
  connectionStatus: ConnectionStatus;
  setInitial: (messages: ChatMessage[], participants: Participant[]) => void;
  addMessage: (msg: ChatMessage) => void;
  addParticipant: (p: { userId: string; username: string; iconUrl: string | null; avgRating: number }) => void;
  removeParticipant: (userId: string) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
};

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  participants: [],
  connectionStatus: "disconnected",
  setInitial: (messages, participants) => set({ messages, participants }),
  addMessage: (msg) =>
    set((state) => {
      if (state.messages.some((m) => m.id === msg.id)) return state;
      return { messages: [...state.messages, { ...msg, isNew: true }] };
    }),
  addParticipant: (p) =>
    set((state) => {
      const exists = state.participants.some((x) => x.userId === p.userId);
      if (exists) return state;
      const newParticipant: Participant = {
        userId: p.userId,
        isHost: false,
        user: { username: p.username, iconUrl: p.iconUrl, avgRating: p.avgRating },
      };
      return { participants: [...state.participants, newParticipant] };
    }),
  removeParticipant: (userId) =>
    set((state) => ({ participants: state.participants.filter((p) => p.userId !== userId) })),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
}));
