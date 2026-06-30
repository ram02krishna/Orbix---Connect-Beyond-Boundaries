import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface User {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface ChatMember {
  id: string;
  chatId: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  joinedAt: string;
  user: User;
}

export interface Attachment {
  id: string;
  messageId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  encryptedKey: string | null;
  mimeType: string;
  thumbUrl: string | null;
  createdAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  type: "TEXT" | "IMAGE" | "VIDEO" | "AUDIO" | "FILE" | "EMOJI" | "SYSTEM";
  content: string | null;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  sender: User;
  replyTo?: {
    id: string;
    content: string | null;
    type: string;
    sender: { id: string; name: string };
  } | null;
  reactions: Array<{
    id: string;
    emoji: string;
    userId: string;
    user: { id: string; name: string };
  }>;
  reads: Array<{ userId: string; readAt: string }>;
  attachments?: Attachment[];
  isSending?: boolean;
  hasFailed?: boolean;
}

export interface Chat {
  id: string;
  type: "DIRECT" | "GROUP";
  title: string | null;
  photoUrl: string | null;
  createdBy: string;
  lastMessageId: string | null;
  createdAt: string;
  updatedAt: string;
  members: ChatMember[];
  lastMessage?: {
    id: string;
    type: string;
    content: string | null;
    createdAt: string;
    sender: { id: string; name: string };
    reads?: Array<{ userId: string; readAt: string }>;
  } | null;
  myRole?: string;
  isPinned?: boolean;
  isArchived?: boolean;
  mutedUntil?: string | null;
  restrictMessagingToAdmins?: boolean;
  restrictInfoToAdmins?: boolean;
}

interface ChatState {
  chats: Chat[];
  messages: Record<string, Message[]>; // Map of chatId -> Message[]
  selectedChatId: string | null;
  typingStatuses: Record<string, string[]>; // Map of chatId -> userIds[] currently typing
  onlineStatuses: Record<string, string>; // Map of userId -> status ("online" or ISO lastSeen string)
  hasMoreMessages: Record<string, boolean>; // Map of chatId -> boolean if there are older messages
  
  setChats: (chats: Chat[]) => void;
  upsertChat: (chat: Chat) => void;
  updateChat: (chatId: string, fields: Partial<Chat>) => void;
  deleteChat: (chatId: string) => void;
  
  setMessages: (chatId: string, messages: Message[]) => void;
  prependMessages: (chatId: string, messages: Message[]) => void;
  addMessage: (chatId: string, message: Message) => void;
  resolveOptimisticMessage: (chatId: string, tempId: string, realMessage: Message) => void;
  failOptimisticMessage: (chatId: string, tempId: string) => void;
  retryOptimisticMessage: (chatId: string, tempId: string) => void;
  editMessage: (chatId: string, messageId: string, content: string, editedAt: string) => void;
  deleteMessage: (chatId: string, messageId: string, mode?: "me" | "everyone") => void;
  
  toggleReaction: (chatId: string, messageId: string, payload: { userId: string; name: string; emoji: string; action: "added" | "removed" }) => void;
  markMessageRead: (chatId: string, messageId: string, userId: string, readAt: string) => void;
  
  setSelectedChatId: (chatId: string | null) => void;
  setUserTyping: (chatId: string, userId: string, isTyping: boolean) => void;
  setOnlineStatus: (userId: string, status: string) => void;
  setOnlineStatuses: (statuses: Record<string, any>) => void;
  setHasMoreMessages: (chatId: string, hasMore: boolean) => void;
  
  isChatsLoading: boolean;
  setIsChatsLoading: (val: boolean) => void;
  clearStore: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      chats: [],
      messages: {},
      selectedChatId: null,
      typingStatuses: {},
      onlineStatuses: {},
      hasMoreMessages: {},
      isChatsLoading: true,

      setIsChatsLoading: (val) => set({ isChatsLoading: val }),
      setChats: (chats) => set({ chats, isChatsLoading: false }),
      clearStore: () => set({
        chats: [],
        messages: {},
        selectedChatId: null,
        typingStatuses: {},
        onlineStatuses: {},
        hasMoreMessages: {},
        isChatsLoading: true
      }),

  upsertChat: (chat) =>
    set((state) => {
      const exists = state.chats.some((c) => c.id === chat.id);
      if (exists) {
        return {
          chats: state.chats.map((c) => (c.id === chat.id ? { ...c, ...chat } : c)),
        };
      }
      return { chats: [chat, ...state.chats] };
    }),

  updateChat: (chatId, fields) =>
    set((state) => ({
      chats: state.chats.map((c) => (c.id === chatId ? { ...c, ...fields } : c)),
    })),

  setMessages: (chatId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [chatId]: messages },
    })),

  prependMessages: (chatId, messages) =>
    set((state) => {
      const thread = state.messages[chatId] || [];
      const uniqueNew = messages.filter(
        (nm) => !thread.some((m) => m.id === nm.id)
      );
      return {
        messages: { ...state.messages, [chatId]: [...uniqueNew, ...thread] },
      };
    }),

  addMessage: (chatId, message) =>
    set((state) => {
      const thread = state.messages[chatId] || [];
      // Prevent duplicate messages in thread
      if (thread.some((m) => m.id === message.id)) return {};

      const tempIndex = thread.findIndex(
        (m) =>
          m.id.startsWith("temp-") &&
          m.senderId === message.senderId &&
          m.content === message.content &&
          m.type === message.type
      );

      let updatedThread;
      if (tempIndex !== -1) {
        updatedThread = [...thread];
        updatedThread[tempIndex] = message;
      } else {
        updatedThread = [...thread, message];
      }

      // Also update the last message details in the corresponding chat item
      const updatedChats = state.chats.map((c) => {
        if (c.id === chatId) {
          return {
            ...c,
            lastMessageId: message.id,
            updatedAt: message.createdAt,
            lastMessage: {
              id: message.id,
              type: message.type,
              content: message.content,
              createdAt: message.createdAt,
              sender: { id: message.senderId, name: message.sender.name },
            },
          };
        }
        return c;
      });

      // Sort chats so the active one goes to the top
      updatedChats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      return {
        messages: { ...state.messages, [chatId]: updatedThread },
        chats: updatedChats,
      };
    }),

  resolveOptimisticMessage: (chatId, tempId, realMessage) =>
    set((state) => {
      const thread = state.messages[chatId] || [];
      const updatedThread = thread.map((m) => (m.id === tempId ? realMessage : m));
      
      if (!thread.some((m) => m.id === tempId) && !thread.some((m) => m.id === realMessage.id)) {
        updatedThread.push(realMessage);
      }

      const updatedChats = state.chats.map((c) => {
        if (c.id === chatId && (c.lastMessageId === tempId || c.lastMessage?.id === tempId)) {
          return {
            ...c,
            lastMessageId: realMessage.id,
            updatedAt: realMessage.createdAt,
            lastMessage: {
              id: realMessage.id,
              type: realMessage.type,
              content: realMessage.content,
              createdAt: realMessage.createdAt,
              sender: { id: realMessage.senderId, name: realMessage.sender.name },
            },
          };
        }
        return c;
      });

      return {
        messages: { ...state.messages, [chatId]: updatedThread },
        chats: updatedChats,
      };
    }),

  failOptimisticMessage: (chatId, tempId) =>
    set((state) => {
      const thread = state.messages[chatId] || [];
      return {
        messages: {
          ...state.messages,
          [chatId]: thread.map((m) =>
            m.id === tempId ? { ...m, isSending: false, hasFailed: true } : m
          ),
        },
      };
    }),

  retryOptimisticMessage: (chatId, tempId) =>
    set((state) => {
      const thread = state.messages[chatId] || [];
      return {
        messages: {
          ...state.messages,
          [chatId]: thread.map((m) =>
            m.id === tempId ? { ...m, isSending: true, hasFailed: false } : m
          ),
        },
      };
    }),

  editMessage: (chatId, messageId, content, editedAt) =>
    set((state) => {
      const thread = state.messages[chatId] || [];
      return {
        messages: {
          ...state.messages,
          [chatId]: thread.map((m) =>
            m.id === messageId ? { ...m, content, editedAt } : m
          ),
        },
      };
    }),

  deleteMessage: (chatId, messageId, mode = "everyone") =>
    set((state) => {
      const thread = state.messages[chatId] || [];
      if (mode === "me") {
        return {
          messages: {
            ...state.messages,
            [chatId]: thread.filter((m) => m.id !== messageId),
          },
        };
      } else {
        return {
          messages: {
            ...state.messages,
            [chatId]: thread.map((m) =>
              m.id === messageId ? { ...m, content: null, deletedAt: new Date().toISOString() } : m
            ),
          },
        };
      }
    }),

  deleteChat: (chatId) =>
    set((state) => {
      const isSelected = state.selectedChatId === chatId;
      return {
        chats: state.chats.filter((c) => c.id !== chatId),
        selectedChatId: isSelected ? null : state.selectedChatId,
      };
    }),

  toggleReaction: (chatId, messageId, payload) =>
    set((state) => {
      const thread = state.messages[chatId] || [];
      return {
        messages: {
          ...state.messages,
          [chatId]: thread.map((m) => {
            if (m.id !== messageId) return m;
            
            let newReactions = [...m.reactions];
            if (payload.action === "removed") {
              newReactions = newReactions.filter(
                (r) => !(r.userId === payload.userId && r.emoji === payload.emoji)
              );
            } else {
              // Add reaction if not already exists
              if (!newReactions.some((r) => r.userId === payload.userId && r.emoji === payload.emoji)) {
                newReactions.push({
                  id: Math.random().toString(),
                  emoji: payload.emoji,
                  userId: payload.userId,
                  user: { id: payload.userId, name: payload.name },
                });
              }
            }
            return { ...m, reactions: newReactions };
          }),
        },
      };
    }),

  markMessageRead: (chatId, messageId, userId, readAt) =>
    set((state) => {
      const thread = state.messages[chatId] || [];
      const updatedMessages = thread.map((m) => {
        if (m.id !== messageId) return m;
        const alreadyRead = m.reads.some((r) => r.userId === userId);
        if (alreadyRead) return m;
        return {
          ...m,
          reads: [...m.reads, { userId, readAt }],
        };
      });

      const updatedChats = state.chats.map((c) => {
        if (c.id === chatId && c.lastMessage && c.lastMessage.id === messageId) {
          const alreadyRead = c.lastMessage.reads?.some((r: any) => r.userId === userId);
          if (!alreadyRead) {
            return {
              ...c,
              lastMessage: {
                ...c.lastMessage,
                reads: [...(c.lastMessage.reads || []), { userId, readAt }],
              },
            };
          }
        }
        return c;
      });

      return {
        messages: {
          ...state.messages,
          [chatId]: updatedMessages,
        },
        chats: updatedChats,
      };
    }),

  setSelectedChatId: (chatId) => set({ selectedChatId: chatId }),

  setUserTyping: (chatId, userId, isTyping) =>
    set((state) => {
      const typers = state.typingStatuses[chatId] || [];
      let newTypers = [...typers];
      
      if (isTyping) {
        if (!newTypers.includes(userId)) {
          newTypers.push(userId);
        }
      } else {
        newTypers = newTypers.filter((id) => id !== userId);
      }

      return {
        typingStatuses: { ...state.typingStatuses, [chatId]: newTypers },
      };
    }),

  setOnlineStatus: (userId, status) =>
    set((state) => ({
      onlineStatuses: { ...state.onlineStatuses, [userId]: status },
    })),

  setOnlineStatuses: (statuses) =>
    set((state) => {
      const mapped: Record<string, string> = {};
      for (const [userId, val] of Object.entries(statuses)) {
        if (typeof val === "object" && val !== null) {
          mapped[userId] = val.status === "online" ? "online" : (val.lastSeen || "offline");
        } else {
          mapped[userId] = val as string;
        }
      }
      return {
        onlineStatuses: { ...state.onlineStatuses, ...mapped },
      };
    }),

  setHasMoreMessages: (chatId, hasMore) =>
    set((state) => ({
      hasMoreMessages: { ...state.hasMoreMessages, [chatId]: hasMore },
    })),
    }),
    {
      name: "chat-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        chats: state.chats,
        messages: state.messages,
        hasMoreMessages: state.hasMoreMessages,
      }), // Only persist these
    }
  )
);
