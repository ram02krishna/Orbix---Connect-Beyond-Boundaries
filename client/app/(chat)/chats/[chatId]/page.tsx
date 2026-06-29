"use client";

import * as React from "react";
import { useEffect, useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useChatStore } from "@hooks/useChatStore";
import { useSocketStore } from "@hooks/useSocketStore";
import { useAuthStore } from "@hooks/useAuthStore";
import { ChatHeader } from "@components/chat/ChatHeader";
import { MessageList } from "@components/chat/MessageList";
import { MessageInput } from "@components/chat/MessageInput";
import { ProfilePanel } from "@components/profile/ProfilePanel";
import api from "@lib/api";

const EMPTY_MESSAGES: any[] = [];

export default function ChatDetailPage({ params }: { params: Promise<{ chatId: string }> }) {
  const resolvedParams = use(params);
  const chatId = resolvedParams.chatId;
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const socket = useSocketStore((state) => state.socket);
  const isConnected = useSocketStore((state) => state.isConnected);
  
  const selectedChatId = useChatStore((state) => state.selectedChatId);
  const setSelectedChatId = useChatStore((state) => state.setSelectedChatId);
  const messages = useChatStore((state) => state.messages[chatId] ?? EMPTY_MESSAGES);
  const setMessages = useChatStore((state) => state.setMessages);
  const addMessage = useChatStore((state) => state.addMessage);

  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loading, setLoading] = useState(() => {
    const cached = useChatStore.getState().messages[chatId];
    return !cached || cached.length === 0;
  });
  const [hasSetSelected, setHasSetSelected] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Reset loading status when chatId changes to support fast transitions if cache exists
  useEffect(() => {
    const cached = useChatStore.getState().messages[chatId];
    setLoading(!cached || cached.length === 0);
  }, [chatId]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Redirect back to chats list if the selected chat ID gets cleared/deleted
  useEffect(() => {
    if (selectedChatId === chatId) {
      setHasSetSelected(true);
    } else if (hasSetSelected && selectedChatId === null) {
      router.push("/chats");
    }
  }, [selectedChatId, chatId, hasSetSelected, router]);

  // 1. Join Socket Room on Chat Load
  useEffect(() => {
    setSelectedChatId(chatId);

    if (socket && isConnected) {
      socket.emit("chat:join", { chatId });
    }

    return () => {
      if (socket) {
        socket.emit("chat:leave", { chatId });
      }
    };
  }, [chatId, socket, isConnected, setSelectedChatId]);

  // 2. Fetch Messages from REST API
  useEffect(() => {
    const fetchMessages = async () => {
      const cached = useChatStore.getState().messages[chatId];
      if (!cached || cached.length === 0) {
        setLoading(true);
      }
      try {
        const res = await api.get(`/messages/${chatId}`);
        const fetchedMessages = res.data.data.messages;
        setMessages(chatId, fetchedMessages);
        if (fetchedMessages.length < 30) {
          useChatStore.getState().setHasMoreMessages(chatId, false);
        } else {
          useChatStore.getState().setHasMoreMessages(chatId, true);
        }
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      } finally {
        setLoading(false);
      }
    };

    void fetchMessages();
  }, [chatId, setMessages]);

  // 3. Mark messages as read when chatId changes or new messages arrive
  useEffect(() => {
    if (!chatId || !user?.id) return;

    // Check if there are any unread messages from other users
    const hasUnread = messages.some(
      (m) => m.senderId !== user.id && (!m.reads || !m.reads.some((r: any) => r.userId === user.id))
    );

    if (hasUnread) {
      api.post(`/chats/${chatId}/read`).catch((err) => {
        console.error("Failed to mark chat messages as read:", err);
      });
    }
  }, [chatId, messages, user?.id]);

  const handleSendMessage = useCallback(async (
    content: string,
    type: string,
    replyToId?: string | null,
    attachments?: any[]
  ) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: any = {
      id: tempId,
      chatId,
      senderId: user?.id || "",
      type,
      content,
      editedAt: null,
      deletedAt: null,
      createdAt: new Date().toISOString(),
      sender: {
        id: user?.id || "",
        name: user?.name || "Me",
        username: user?.username || "me",
        avatarUrl: user?.avatarUrl || null,
      },
      replyTo: replyToId ? messages.find((m) => m.id === replyToId) : null,
      reactions: [],
      reads: [],
      attachments: attachments || [],
      isSending: true,
    };

    addMessage(chatId, optimisticMessage);

    try {
      const res = await api.post(`/messages/${chatId}`, {
        content,
        type,
        replyToId,
        attachments,
      });

      const message = res.data.data.message;
      useChatStore.getState().resolveOptimisticMessage(chatId, tempId, message);
    } catch (err) {
      console.error("Error sending message:", err);
      useChatStore.getState().failOptimisticMessage(chatId, tempId);
    }
  }, [chatId, addMessage, user, messages]);

  const handleRetryMessage = useCallback(async (msg: any) => {
    const tempId = msg.id;
    useChatStore.getState().retryOptimisticMessage(chatId, tempId);

    try {
      const res = await api.post(`/messages/${chatId}`, {
        content: msg.content,
        type: msg.type,
        replyToId: msg.replyTo?.id || null,
        attachments: msg.attachments || [],
      });
      const message = res.data.data.message;
      useChatStore.getState().resolveOptimisticMessage(chatId, tempId, message);
    } catch (err) {
      console.error("Error retrying message:", err);
      useChatStore.getState().failOptimisticMessage(chatId, tempId);
    }
  }, [chatId]);

  const handleReact = useCallback(async (messageId: string, emoji: string) => {
    if (messageId.startsWith("temp-")) return;
    try {
      await api.post(`/messages/${messageId}/react`, { emoji });
    } catch (err) {
      console.error("Error toggling reaction:", err);
    }
  }, []);

  const handleDeleteMessage = useCallback(async (messageId: string, mode: "me" | "everyone") => {
    if (messageId.startsWith("temp-")) {
      useChatStore.getState().deleteMessage(chatId, messageId, "me");
      return;
    }
    try {
      await api.delete(`/messages/${messageId}?mode=${mode}`);
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  }, [chatId]);

  const handleEditMessage = useCallback(async (messageId: string, content: string) => {
    if (messageId.startsWith("temp-")) return;
    try {
      await api.patch(`/messages/${messageId}`, { content });
    } catch (err) {
      console.error("Error editing message:", err);
      throw err;
    }
  }, []);

  const handleReply = useCallback((msg: any) => {
    setReplyingTo(msg);
  }, []);

  const handleLoadMoreMessages = useCallback(async () => {
    if (loadingMore || messages.length === 0) return;
    const hasMore = useChatStore.getState().hasMoreMessages[chatId] !== false;
    if (!hasMore) return;

    const oldestId = messages[0].id;
    if (oldestId.startsWith("temp-")) return;

    setLoadingMore(true);
    try {
      const res = await api.get(`/messages/${chatId}?cursor=${oldestId}&limit=30`);
      const oldMessages = res.data.data.messages;
      if (oldMessages.length < 30) {
        useChatStore.getState().setHasMoreMessages(chatId, false);
      } else {
        useChatStore.getState().setHasMoreMessages(chatId, true);
      }
      useChatStore.getState().prependMessages(chatId, oldMessages);
    } catch (err) {
      console.error("Failed to load older messages:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [chatId, messages, loadingMore]);

  return (
    <div className="flex-1 flex h-full min-w-0 bg-[#f9fafb] dark:bg-[#030906] text-zinc-900 dark:text-zinc-100 relative overflow-hidden transition-colors duration-300">

      <div className="absolute top-1/4 left-1/3 h-[500px] w-[500px] rounded-full bg-blue-500/8 dark:bg-blue-500/5 blur-[120px] pointer-events-none z-0 blob-glow-1" />
      <div className="absolute bottom-10 right-10 h-[500px] w-[500px] rounded-full bg-brand-primary/8 dark:bg-brand-primary/4 blur-[120px] pointer-events-none z-0 blob-glow-2" />

      <div className="flex-1 flex flex-col h-full min-w-0 bg-white/30 dark:bg-[#111b21]/30 backdrop-blur-3xl relative z-10 border-r border-[#e9edef]/40 dark:border-[#222e35]/15">
        
        <ChatHeader
          chatId={chatId}
          onToggleProfile={() => setIsProfileOpen(!isProfileOpen)}
          isProfileOpen={isProfileOpen}
          isSearchOpen={isSearchOpen}
          setIsSearchOpen={setIsSearchOpen}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <MessageList
          chatId={chatId}
          messages={messages}
          onReply={handleReply}
          onReact={handleReact}
          onDelete={handleDeleteMessage}
          onEdit={handleEditMessage}
          searchQuery={searchQuery}
          onLoadMore={handleLoadMoreMessages}
          loadingMore={loadingMore}
          onRetry={handleRetryMessage}
          isLoading={loading}
        />

        {/* Input Bar */}
        <MessageInput
          chatId={chatId}
          onSendMessage={handleSendMessage}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
      </div>

      {isProfileOpen && (
        <div className="absolute inset-0 sm:relative sm:w-80 flex-shrink-0 h-full border-l border-[#e9edef]/60 dark:border-[#222e35]/30 z-30 shadow-2xl bg-white dark:bg-[#111b21]">
          <ProfilePanel
            chatId={chatId}
            onClose={() => setIsProfileOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
