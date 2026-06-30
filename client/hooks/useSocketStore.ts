import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { useChatStore } from "./useChatStore";
import { useCallStore } from "./useCallStore";
import api from "@lib/api";
import { toast } from "sonner";
import { useAuthStore } from "./useAuthStore";
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:5000";

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  connectSocket: (token: string) => void;
  disconnectSocket: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,

  connectSocket: (token) => {
    // If socket is already connected, don't create a new one
    if (get().socket?.connected) return;

    // Disconnect any existing socket before reconnecting
    if (get().socket) {
      get().socket?.disconnect();
    }

    const socket = io(WS_BASE_URL, {
      auth: { token },
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      set({ isConnected: true });
      console.log("🔌 Connected to Orbix WebSocket");
    });

    socket.on("disconnect", () => {
      set({ isConnected: false });
      console.log("🔌 Disconnected from Orbix WebSocket");
    });

    // ─── Real-Time Message Listeners ──────────────────────────────────────────

    socket.on("message:new", async (message) => {
      const chatExists = useChatStore.getState().chats.some((c) => c.id === message.chatId);
      if (!chatExists) {
        try {
          const res = await api.get(`/chats/${message.chatId}`);
          if (res.data?.data?.chat) {
            useChatStore.getState().upsertChat(res.data.data.chat);
          }
        } catch (err) {
          console.error("Failed to fetch new chat details:", err);
        }
      }
      useChatStore.getState().addMessage(message.chatId, message);
      
      // Trigger dynamic chimes and native push notifications
      triggerNotification(message);
    });

    socket.on("message:edited", (message) => {
      useChatStore.getState().editMessage(
        message.chatId,
        message.id,
        message.content,
        message.editedAt
      );
    });

    socket.on("message:deleted", (payload: { messageId: string; chatId: string; mode?: "me" | "everyone" }) => {
      useChatStore.getState().deleteMessage(payload.chatId, payload.messageId, payload.mode);
    });

    socket.on("reaction:change", (payload) => {
      useChatStore.getState().toggleReaction(payload.chatId || "", payload.messageId, {
        userId: payload.userId,
        name: payload.name || "User",
        emoji: payload.emoji,
        action: payload.action,
      });
    });

    socket.on("message:read", (payload) => {
      useChatStore.getState().markMessageRead(
        payload.chatId,
        payload.messageId,
        payload.userId,
        payload.readAt
      );
    });

    socket.on("chat:deleted", (payload: { chatId: string }) => {
      useChatStore.getState().deleteChat(payload.chatId);
    });

    // ─── Real-Time Presence & Typing Listeners ─────────────────────────────────

    socket.on("presence:change", (payload: { userId: string; status: "online" | "offline"; lastSeen?: string }) => {
      const statusValue = payload.status === "online" ? "online" : (payload.lastSeen || "offline");
      useChatStore.getState().setOnlineStatus(payload.userId, statusValue);
    });

    socket.on("typing:start", (payload: { chatId: string; userId: string }) => {
      useChatStore.getState().setUserTyping(payload.chatId, payload.userId, true);
    });

    socket.on("typing:stop", (payload: { chatId: string; userId: string }) => {
      useChatStore.getState().setUserTyping(payload.chatId, payload.userId, false);
    });

    // ─── WebRTC Call Signal Listeners ──────────────────────────────────────────
    socket.on("call:incoming", (payload) => {
      useCallStore.getState().receiveCall(payload);
    });

    socket.on("call:answered", (payload) => {
      useCallStore.getState().handleAnswer(payload.sdp);
    });

    socket.on("call:declined", () => {
      useCallStore.getState().resetCallStore();
      toast.error("Call declined by user");
    });

    socket.on("call:ended", () => {
      useCallStore.getState().resetCallStore();
      toast.info("Call ended");
    });

    socket.on("call:ice-candidate", (payload) => {
      useCallStore.getState().handleIceCandidate(payload.candidate, payload.fromUserId);
    });

    // ─── WebRTC Group Call Signal Listeners ────────────────────────────────────
    socket.on("call:incoming-group", (payload) => {
      useCallStore.getState().receiveGroupCall(payload);
    });

    socket.on("call:participant-joined", (payload) => {
      useCallStore.getState().handleParticipantJoined(payload.userId);
    });

    socket.on("call:participant-left", (payload) => {
      useCallStore.getState().handleParticipantLeft(payload.userId);
    });

    socket.on("call:offer", (payload) => {
      useCallStore.getState().handleGroupOffer(payload.fromUserId, payload.sdp, payload.callType);
    });

    socket.on("call:answer", (payload) => {
      useCallStore.getState().handleGroupAnswer(payload.fromUserId, payload.sdp);
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },
}));

const playNotificationSound = (type: "incoming" | "outgoing") => {
  if (typeof window === "undefined") return;
  const isSoundEnabled = localStorage.getItem("settings-notifications-sound") !== "false";
  if (!isSoundEnabled) return;

  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === "incoming") {
      const now = ctx.currentTime;
      // High-pitched sweet double chime
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(784, now);
      gain1.gain.setValueAtTime(0.1, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.16);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1047, now + 0.08);
      gain2.gain.setValueAtTime(0.08, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.26);
    } else {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      // Fast soft popping bubble ascending tone
      osc.type = "sine";
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(650, now + 0.06);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  } catch (err) {
    console.error("Failed to play notification audio:", err);
  }
};

const triggerNotification = (message: any) => {
  if (typeof window === "undefined" || typeof Notification === "undefined") return;

  const currentUserId = useAuthStore.getState().user?.id;
  if (message.senderId === currentUserId) {
    // Play outgoing pop sound
    playNotificationSound("outgoing");
    return;
  }

  // Play incoming alert chime
  playNotificationSound("incoming");

  const isEnabled = localStorage.getItem("settings-notifications-enabled") !== "false";
  if (!isEnabled) return;

  const showPreviews = localStorage.getItem("settings-notifications-preview") !== "false";

  const pathname = window.location.pathname;
  const currentChatId = pathname.includes("/chats/") ? pathname.split("/chats/")[1] : null;
  const isDifferentChat = currentChatId !== message.chatId;
  const isBackground = document.visibilityState === "hidden" || !document.hasFocus();

  if (isBackground || isDifferentChat) {
    if (Notification.permission === "granted") {
      const senderName = message.sender?.name || "New Message";
      const body = showPreviews ? message.content || "Sent an attachment" : "New message received";

      const notification = new Notification(senderName, {
        body,
        tag: message.chatId,
      });

      notification.onclick = () => {
        window.focus();
        window.location.href = `/chats/${message.chatId}`;
      };
    }
  }
};
