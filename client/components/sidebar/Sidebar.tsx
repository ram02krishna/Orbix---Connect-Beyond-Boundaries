"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, Settings, LogOut, UserPlus, MessageSquare, X, CircleDot, ChevronLeft, Plus, Users, Camera, Video, Mic, FileText } from "lucide-react";
import { useAuthStore } from "@hooks/useAuthStore";
import { useChatStore } from "@hooks/useChatStore";
import { useSocketStore } from "@hooks/useSocketStore";
import { Avatar } from "@components/ui/Avatar";
import { Input } from "@components/ui/Input";
import api from "@lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { useStatusStore } from "@hooks/useStatusStore";
import { StatusCreator } from "../status/StatusCreator";
import { NewGroupModal } from "./NewGroupModal";
import { CustomAudioPlayer } from "../chat/CustomAudioPlayer";
import { cn } from "@lib/utils";

function StatusAvatarRing({ count, viewedCount, size = 44 }: { count: number; viewedCount: number; size?: number }) {
  if (count <= 0) return null;

  const radius = size / 2 - 2;
  const circumference = 2 * Math.PI * radius;
  const strokeWidth = 2;

  const gapSize = count > 1 ? 3 : 0;
  const totalGapLength = gapSize * count;
  const dashLength = (circumference - totalGapLength) / count;

  const strokeDasharray = `${dashLength} ${gapSize}`;

  return (
    <svg width={size} height={size} className="absolute inset-0 -rotate-90 pointer-events-none">
      {Array.from({ length: count }).map((_, index) => {
        const isViewed = index < viewedCount;
        const strokeColor = isViewed ? "#9ca3af" : "#00D8E3"; // grey-400 or blue-500
        const strokeDashoffset = -index * (dashLength + gapSize);

        return (
          <circle
            key={index}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-300"
          />
        );
      })}
    </svg>
  );
}

const ChatItem = React.memo(function ChatItem({
  chat,
  partner,
  isSelected,
  isOnline,
  isTyping,
  preview,
  onClick,
  onContextMenu,
  formatTime
}: {
  chat: any;
  partner: any;
  isSelected: boolean;
  isOnline: boolean;
  isTyping: boolean;
  preview: any;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  formatTime: (dateStr: string) => string;
}) {
  const firstName = (name: any) => {
    if (!name || typeof name !== "string") return "";
    return name.split(" ")[0];
  };

  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`flex items-center gap-3.5 px-4.5 py-3.5 cursor-pointer transition-all duration-200 rounded-xl border border-transparent select-none active:scale-[0.99] ${
        isSelected
          ? "bg-white/70 dark:bg-[#1e293b]/80 border-white/60 dark:border-blue-500/20 shadow-md shadow-blue-500/10 text-zinc-950 dark:text-white"
          : "bg-white/20 dark:bg-white/2 border-zinc-200/30 dark:border-white/5 shadow-sm"
      }`}
    >
      <div className="flex-shrink-0">
        <Avatar
          src={partner.avatarUrl}
          name={partner.name}
          size="md"
          showStatus={chat.type === "DIRECT"}
          isOnline={isOnline}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-base sm:text-base font-semibold truncate text-[#111b21] dark:text-[#e9edef] flex items-center">
            {chat.type === "DIRECT" ? firstName(partner.name) : (chat.title || "Group Chat")}
            {chat.isPinned && (
              <span className="text-base text-blue-500 font-bold ml-1.5 flex items-center" title="Pinned Chat">📌</span>
            )}
          </p>
          {chat.lastMessage && (
            <span className={cn("text-base font-semibold flex-shrink-0", preview?.isUnread ? "text-blue-500 font-bold" : "text-[#667781] dark:text-[#8696a0]")}>
              {formatTime(chat.lastMessage.createdAt)}
            </span>
          )}
        </div>

        <p className="text-base text-[#667781] dark:text-[#8696a0] truncate mt-1.5 flex items-center">
          {isTyping ? (
            <span className="text-[#06A0F8] font-bold dark:text-blue-400 flex items-center gap-1">
              <span className="flex gap-0.5 items-center">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </span>
              typing...
            </span>
          ) : preview ? (
            <>
              {preview.isMe && (
                <span className={`font-bold select-none mr-1 leading-none tracking-tight flex-shrink-0 ${
                  preview.isRead ? "text-[#34b7f1] dark:text-[#5D32FA]" : "text-zinc-400 dark:text-zinc-500/80"
                }`}>✓✓</span>
              )}
              <span className="flex items-center gap-1 truncate max-w-full leading-none">
                {preview.type === "IMAGE" && <Camera size={13} className="text-zinc-400 dark:text-zinc-500 flex-shrink-0" />}
                {preview.type === "VIDEO" && <Video size={13} className="text-zinc-400 dark:text-zinc-500 flex-shrink-0" />}
                {preview.type === "AUDIO" && <Mic size={13} className="text-blue-500 dark:text-blue-400 flex-shrink-0" />}
                {preview.type === "FILE" && <FileText size={13} className="text-zinc-400 dark:text-zinc-500 flex-shrink-0" />}
                <span className="truncate">{preview.content}</span>
              </span>
            </>
          ) : (
            <span className="italic text-[#8696a0]">No messages yet</span>
          )}
        </p>
      </div>
      {preview?.isUnread && (
        <div className="flex flex-col justify-center items-end ml-2">
          <span className="bg-[#06A0F8] text-white text-base font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-sm">
            new
          </span>
        </div>
      )}
    </div>
  );
});

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const user = useAuthStore((state) => state.user);
  const logoutStore = useAuthStore((state) => state.logout);
  const disconnectSocket = useSocketStore((state) => state.disconnectSocket);

  const chats = useChatStore((state) => state.chats);
  const selectedChatId = useChatStore((state) => state.selectedChatId);
  const setSelectedChatId = useChatStore((state) => state.setSelectedChatId);
  const upsertChat = useChatStore((state) => state.upsertChat);
  const onlineStatuses = useChatStore((state) => state.onlineStatuses);
  const typingStatuses = useChatStore((state) => state.typingStatuses);
  const isChatsLoading = useChatStore((state) => state.isChatsLoading);

  // Status Store hooks
  const fetchStatuses = useStatusStore((state) => state.fetchStatuses);
  const myStatus = useStatusStore((state) => state.myStatus);
  const recentStatuses = useStatusStore((state) => state.recent);
  const viewedStatuses = useStatusStore((state) => state.viewed);
  const playStatusGroup = useStatusStore((state) => state.playStatusGroup);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [filterTab, setFilterTab] = useState<"all" | "pinned" | "archived" | "groups">("all");
  const [contextMenu, setContextMenu] = useState<{ chatId: string; x: number; y: number } | null>(null);

  const [activePane, setActivePane] = useState<"chats" | "status">("chats");
  const [showCreator, setShowCreator] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);

  // Fetch status updates on mount and track pane changes
  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  // Close context menu on global click
  useEffect(() => {
    const handleClose = () => setContextMenu(null);
    window.addEventListener("click", handleClose);
    return () => window.removeEventListener("click", handleClose);
  }, []);

  const handleTogglePin = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.patch(`/chats/${chatId}/pin`);
      const targetChat = chats.find(c => c.id === chatId);
      if (targetChat) {
        useChatStore.getState().updateChat(chatId, { isPinned: !targetChat.isPinned });
      }
    } catch (err) {
      console.error("Failed to toggle pin:", err);
    }
  };

  const handleToggleArchive = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.patch(`/chats/${chatId}/archive`);
      const targetChat = chats.find(c => c.id === chatId);
      if (targetChat) {
        useChatStore.getState().updateChat(chatId, { isArchived: !targetChat.isArchived });
      }
    } catch (err) {
      console.error("Failed to toggle archive:", err);
    }
  };

  const filteredChats = chats
    .filter((chat) => {
      if (filterTab === "archived") return chat.isArchived;
      if (filterTab === "pinned") return chat.isPinned && !chat.isArchived;
      if (filterTab === "groups") return chat.type === "GROUP" && !chat.isArchived;
      return !chat.isArchived;
    })
    .sort((a, b) => {
      if (filterTab === "all") {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
      }
      const aTime = a.lastMessage?.createdAt || a.updatedAt;
      const bTime = b.lastMessage?.createdAt || b.updatedAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

  // Trigger search when query is typed
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(`/users/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res.data.data.users);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      disconnectSocket();
      logoutStore();
      useChatStore.getState().clearStore();
      router.push("/login");
    }
  };

  const handleStartChat = async (targetUserId: string) => {
    try {
      const res = await api.post("/chats/direct", { targetUserId });
      const chat = res.data.data.chat;
      const targetStatuses = res.data.data.onlineStatuses;

      upsertChat(chat);
      if (targetStatuses) {
        useChatStore.getState().setOnlineStatuses(targetStatuses);
      }
      setSearchQuery("");
      setSearchResults([]);

      setSelectedChatId(chat.id);

      // Pre-fetch messages instantly to eliminate the loading delay on the chat page
      const cached = useChatStore.getState().messages[chat.id];
      if (!cached || cached.length === 0) {
        api.get(`/messages/${chat.id}`).then(res => {
          const fetchedMessages = res.data.data.messages;
          useChatStore.getState().setMessages(chat.id, fetchedMessages);
          if (fetchedMessages.length < 30) {
            useChatStore.getState().setHasMoreMessages(chat.id, false);
          } else {
            useChatStore.getState().setHasMoreMessages(chat.id, true);
          }
        }).catch(err => console.error("Prefetch failed:", err));
      }

      router.push(`/chats/${chat.id}`);
    } catch (err) {
      console.error("Error creating direct chat:", err);
    }
  };

  const getChatPartner = (chat: any) => {
    if (chat.type === "DIRECT" && user) {
      const partner = chat.members.find((m: any) => m.userId !== user.id)?.user;
      return partner || { name: "Saved Messages", avatarUrl: null, id: "" };
    }
    return { name: chat.title || "Group Chat", avatarUrl: chat.photoUrl, id: "" };
  };

  // Returns only the first word of a name
  const firstName = (name: any) => {
    if (!name || typeof name !== "string") return "";
    return name.split(" ")[0];
  };

  const getLastMessagePreview = (chat: any) => {
    if (!chat.lastMessage) return null;
    const senderId = chat.lastMessage.sender?.id || chat.lastMessage.senderId;
    const isMe = senderId === user?.id && chat.lastMessage.type !== "SYSTEM";
    const isRead = chat.lastMessage.reads && chat.lastMessage.reads.length > 0;
    const isReadByMe = chat.lastMessage.reads && chat.lastMessage.reads.some((r: any) => r.userId === user?.id);
    const isUnread = !isMe && !isReadByMe;
    const type = chat.lastMessage.type;
    
    let content = chat.lastMessage.content;
    if (type === "IMAGE") content = "Photo";
    if (type === "VIDEO") content = "Video";
    if (type === "AUDIO") content = "Voice message";
    if (type === "FILE" && (!content || content.startsWith("voice-message-") || content.startsWith("file-"))) content = "Document";

    return { isMe, isRead, isUnread, type, content };
  };

  const formatTime = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }, []);

  const handleChatClick = useCallback((chatId: string) => {
    setSelectedChatId(chatId);

    // Pre-fetch messages instantly to eliminate the loading delay on the chat page
    const cached = useChatStore.getState().messages[chatId];
    if (!cached || cached.length === 0) {
      api.get(`/messages/${chatId}`).then(res => {
        const fetchedMessages = res.data.data.messages;
        useChatStore.getState().setMessages(chatId, fetchedMessages);
        if (fetchedMessages.length < 30) {
          useChatStore.getState().setHasMoreMessages(chatId, false);
        } else {
          useChatStore.getState().setHasMoreMessages(chatId, true);
        }
      }).catch(err => console.error("Prefetch failed:", err));
    }

    router.push(`/chats/${chatId}`);
  }, [router, setSelectedChatId]);

  const handleChatContextMenu = useCallback((chatId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      chatId,
      x: e.clientX,
      y: e.clientY,
    });
  }, []);

  return (
    <div className="flex flex-col h-full border-r border-[#e9edef] dark:border-[#222e35] bg-white/40 dark:bg-[#111b21]/45 backdrop-blur-3xl relative select-none text-zinc-900 dark:text-[#e9edef] overflow-hidden">

      {/* Ambient glass background glow blobs */}
      <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-blue-500/10 dark:bg-blue-500/5 blur-[50px] pointer-events-none z-0 blob-glow-1" />
      <div className="absolute top-1/3 -right-16 h-48 w-48 rounded-full bg-brand-primary/10 dark:bg-brand-primary/5 blur-[50px] pointer-events-none z-0 blob-glow-2" />

      {/* Sidebar Header (Translucent glass) */}
      {activePane === "chats" ? (
        <div className="px-4 h-[60px] flex items-center justify-between border-b border-[#e9edef]/60 dark:border-[#222e35]/40 bg-[#f0f2f5]/65 dark:bg-[#202c33]/70 backdrop-blur-md relative z-10">
          {/* User info */}
          <div
            className="flex items-center gap-3 cursor-pointer group rounded-full p-1 -m-1 transition-all duration-200"
            onClick={() => router.push("/profile")}
          >
            <div className="relative">
              <Avatar src={user?.avatarUrl} name={user?.name} size="sm" />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-[#f0f2f5]/70 dark:ring-[#202c33]/70" />
            </div>
            <div className="hidden sm:block">
              <p className="text-lg font-bold truncate max-w-[150px] text-zinc-900 dark:text-[#e9edef] transition-colors">
                {user?.name ? firstName(user.name) : ""}
              </p>
              <p className="text-base text-zinc-400 dark:text-zinc-500 font-medium">@{user?.username}</p>
            </div>
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowGroupModal(true)}
              className="p-2.5 sm:p-2 rounded-full text-[#54656f] dark:text-[#aebac1] transition-all cursor-pointer active:bg-zinc-200/50 dark:active:bg-zinc-700/30"
              title="New Group"
            >
              <Users size={18} />
            </button>
            <button
              onClick={() => setActivePane("status")}
              className="p-2.5 sm:p-2 rounded-full text-[#54656f] dark:text-[#aebac1] transition-all cursor-pointer active:bg-zinc-200/50 dark:active:bg-zinc-700/30"
              title="Status Updates"
            >
              <CircleDot size={18} />
            </button>
            <button
              onClick={() => router.push("/settings")}
              className="p-2.5 sm:p-2 rounded-full text-[#54656f] dark:text-[#aebac1] transition-all cursor-pointer active:bg-zinc-200/50 dark:active:bg-zinc-700/30"
              title="Settings"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2.5 sm:p-2 rounded-full text-[#54656f] dark:text-[#aebac1] transition-all cursor-pointer active:bg-zinc-200/50 dark:active:bg-zinc-700/30"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 h-[60px] flex items-center justify-between border-b border-[#e9edef]/60 dark:border-[#222e35]/40 bg-[#f0f2f5]/65 dark:bg-[#202c33]/70 backdrop-blur-md relative z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActivePane("chats")}
              className="p-2 sm:p-1.5 rounded-full text-[#54656f] dark:text-[#aebac1] transition-colors cursor-pointer active:bg-zinc-200/50 dark:active:bg-zinc-700/30"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="font-bold text-base text-zinc-900 dark:text-[#e9edef]">Status</span>
          </div>
          <button
            onClick={() => setShowCreator(true)}
            className="p-2 sm:p-1.5 rounded-full text-[#54656f] dark:text-[#aebac1] transition-colors cursor-pointer flex items-center justify-center active:bg-zinc-200/50 dark:active:bg-zinc-700/30"
            title="Post Status"
          >
            <Plus size={18} />
          </button>
        </div>
      )}

      {/* Search Section */}
      {activePane === "chats" && (
        <div className="px-3 py-2 bg-white/30 dark:bg-transparent border-b border-[#e9edef]/40 dark:border-[#222e35]/15 relative z-10">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667781] dark:text-[#8696a0] pointer-events-none" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search or start new chat"
              className="w-full pl-9 pr-8 py-2.5 sm:py-2 rounded-full ios-glass-input text-base md:text-base text-zinc-800 dark:text-[#e9edef] placeholder-[#667781] dark:placeholder-[#8696a0] focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#667781] transition-colors cursor-pointer p-1 active:bg-zinc-200/50 dark:active:bg-zinc-700/30 rounded-full"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* WhatsApp Filter Tabs */}
      {activePane === "chats" && (
        <div className="px-4 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-[#e9edef]/40 dark:border-[#222e35]/10 bg-white/20 dark:bg-black/10 relative z-10">
          {[
            { id: "all", label: "All" },
            { id: "pinned", label: "Pinned" },
            { id: "groups", label: "Groups" },
            { id: "archived", label: "Archived" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-3.5 py-1 text-base font-bold rounded-full transition-all duration-200 cursor-pointer select-none ${filterTab === tab.id
                ? "bg-[#06A0F8] text-white shadow-md shadow-blue-500/20"
                : "bg-zinc-200/50 dark:bg-zinc-800/40 text-[#54656f] dark:text-[#aebac1] hover:bg-zinc-300/40 dark:hover:bg-zinc-700/40"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Main List Area */}
      {activePane === "chats" && (
        <div className="flex-1 overflow-y-auto px-2 pb-4 relative z-10 scrollbar-thin">

          {/* Search Results */}
          <AnimatePresence>
            {searchQuery.trim().length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="mb-3 mt-2"
              >
                <p className="text-base font-bold text-zinc-400 dark:text-zinc-500 px-2 mb-2 uppercase tracking-widest">
                  Search Results
                </p>
                {searching ? (
                  <div className="space-y-2 px-1">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5">
                        <div className="skeleton h-8 w-8 rounded-full flex-shrink-0" />
                        <div className="flex-1 space-y-1.5">
                           <div className="skeleton h-3 w-24 rounded" />
                           <div className="skeleton h-2.5 w-16 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchResults.length === 0 ? (
                  <p className="text-base text-zinc-400 dark:text-zinc-500 px-3 py-2">No users found</p>
                ) : (
                  <div className="space-y-0.5">
                    {searchResults.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => handleStartChat(u.id)}
                        className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl border border-zinc-200/30 dark:border-white/5 cursor-pointer transition-all duration-200 group"
                      >
                        <Avatar src={u.avatarUrl} name={u.name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-semibold truncate text-zinc-800 dark:text-zinc-200">{u.name}</p>
                          <p className="text-base text-zinc-400 truncate">@{u.username}</p>
                        </div>
                        <UserPlus size={15} className="text-brand-primary flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
                <div className="border-t border-zinc-200 dark:border-white/5 mt-3 mb-1" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recent Chats Label */}
          <p className="text-base font-bold text-zinc-400 dark:text-zinc-500 px-2 mb-2 mt-3 uppercase tracking-widest">
            {filterTab === "all" && "Recent Chats"}
            {filterTab === "pinned" && "Pinned Chats"}
            {filterTab === "archived" && "Archived Chats"}
            {filterTab === "groups" && "Groups"}
          </p>

          {/* Chat List */}
          {isChatsLoading ? (
            <div className="space-y-1">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center gap-3.5 px-4.5 py-3.5 rounded-xl border border-transparent animate-pulse">
                  <div className="h-12 w-12 bg-zinc-200/60 dark:bg-zinc-800/60 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2.5 py-1">
                    <div className="h-3.5 w-1/3 bg-zinc-200/60 dark:bg-zinc-800/60 rounded" />
                    <div className="h-3 w-2/3 bg-zinc-200/60 dark:bg-zinc-800/60 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="relative mb-4">
                <div className="h-16 w-16 rounded-2xl flex items-center justify-center">
                  <img src="/logo.png" alt="Orbix Logo" className="w-12 h-12 object-contain opacity-70" />
                </div>
              </div>
              <p className="text-base font-bold text-zinc-700 dark:text-zinc-300">
                {filterTab === "archived" ? "No archived chats" : filterTab === "pinned" ? "No pinned chats" : "No chats yet"}
              </p>
              <p className="text-base text-zinc-400 dark:text-zinc-500 mt-1.5 leading-relaxed max-w-[180px]">
                {filterTab === "all" ? "Search for a username above to start chatting!" : "Your filters returned 0 items."}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredChats.map((chat) => {
                const partner = getChatPartner(chat);
                const isSelected = selectedChatId === chat.id;
                const isOnline = chat.type === "DIRECT" && onlineStatuses[partner.id] === "online";
                const preview = getLastMessagePreview(chat);
                const typers = typingStatuses[chat.id] || [];
                const isTyping = typers.length > 0;

                return (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    partner={partner}
                    isSelected={isSelected}
                    isOnline={isOnline}
                    isTyping={isTyping}
                    preview={preview}
                    onClick={() => handleChatClick(chat.id)}
                    onContextMenu={(e) => handleChatContextMenu(chat.id, e)}
                    formatTime={formatTime}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Status Pane (WhatsApp Status feed) */}
      {activePane === "status" && (
        <div className="flex-1 overflow-y-auto px-3 pb-4 relative z-10 scrollbar-thin">
          {/* My Status */}
          <div className="mt-3">
            <p className="text-base font-bold text-zinc-400 dark:text-zinc-500 px-2 mb-2 uppercase tracking-widest">
              My Status
            </p>
            <div className="flex items-center justify-between px-2.5 py-3 rounded-xl border border-zinc-200/30 dark:border-white/5 bg-white/10 dark:bg-white/2">
              <div
                className="flex items-center gap-3.5 cursor-pointer flex-1 min-w-0"
                onClick={() => {
                  if (myStatus && myStatus.statuses.length > 0) {
                    playStatusGroup(user?.id || "");
                  } else {
                    setShowCreator(true);
                  }
                }}
              >
                <div className="relative h-11 w-11 flex-shrink-0 flex items-center justify-center">
                  <Avatar src={user?.avatarUrl} name={user?.name} size="sm" />
                  {myStatus && myStatus.statuses.length > 0 && (
                    <StatusAvatarRing
                      count={myStatus.statuses.length}
                      viewedCount={myStatus.statuses.length}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold truncate text-[#111b21] dark:text-[#e9edef]">My Status</p>
                  <p className="text-base text-[#667781] dark:text-[#8696a0] truncate mt-0.5">
                    {myStatus && myStatus.statuses.length > 0
                      ? `Latest update • ${formatTime(myStatus.statuses[myStatus.statuses.length - 1].createdAt)}`
                      : "Tap to add status update"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreator(true)}
                className="h-8 w-8 rounded-full bg-blue-500/10 dark:bg-blue-500/5 text-blue-500 transition-all cursor-pointer flex items-center justify-center"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Recent Updates */}
          {recentStatuses.length > 0 && (
            <div className="mt-4">
              <p className="text-base font-bold text-zinc-400 dark:text-zinc-500 px-2 mb-2 uppercase tracking-widest">
                Recent Updates
              </p>
              <div className="space-y-1">
                {recentStatuses.map((group) => {
                  const latestStatus = group.statuses[group.statuses.length - 1];
                  const viewedCount = group.statuses.filter(s => s.views.some(v => v.userId === user?.id)).length;

                  return (
                    <div
                      key={group.user.id}
                      onClick={() => playStatusGroup(group.user.id)}
                      className="flex items-center gap-3.5 px-2.5 py-3 cursor-pointer border border-zinc-200/30 dark:border-white/5 rounded-xl transition-all"
                    >
                      <div className="relative h-11 w-11 flex-shrink-0 flex items-center justify-center">
                        <Avatar src={group.user.avatarUrl} name={group.user.name} size="sm" />
                        <StatusAvatarRing
                          count={group.statuses.length}
                          viewedCount={viewedCount}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold truncate text-[#111b21] dark:text-[#e9edef]">
                          {group.user.name}
                        </p>
                        <p className="text-base text-[#667781] dark:text-[#8696a0] truncate mt-0.5">
                          {formatTime(latestStatus.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Viewed Updates */}
          {viewedStatuses.length > 0 && (
            <div className="mt-4">
              <p className="text-base font-bold text-zinc-400 dark:text-zinc-500 px-2 mb-2 uppercase tracking-widest">
                Viewed Updates
              </p>
              <div className="space-y-1">
                {viewedStatuses.map((group) => {
                  const latestStatus = group.statuses[group.statuses.length - 1];
                  const viewedCount = group.statuses.filter(s => s.views.some(v => v.userId === user?.id)).length;

                  return (
                    <div
                      key={group.user.id}
                      onClick={() => playStatusGroup(group.user.id)}
                      className="flex items-center gap-3.5 px-2.5 py-3 cursor-pointer border border-zinc-200/30 dark:border-white/5 rounded-xl transition-all opacity-80"
                    >
                      <div className="relative h-11 w-11 flex-shrink-0 flex items-center justify-center">
                        <Avatar src={group.user.avatarUrl} name={group.user.name} size="sm" />
                        <StatusAvatarRing
                          count={group.statuses.length}
                          viewedCount={viewedCount}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold truncate text-[#111b21] dark:text-[#e9edef]">
                          {group.user.name}
                        </p>
                        <p className="text-base text-[#667781] dark:text-[#8696a0] truncate mt-0.5">
                          {formatTime(latestStatus.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty Status updates State */}
          {recentStatuses.length === 0 && viewedStatuses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="relative mb-4">
                <div className="h-16 w-16 rounded-2xl bg-blue-500/10 dark:bg-blue-500/5 border border-blue-500/15 flex items-center justify-center shadow-inner text-blue-500">
                  <CircleDot size={28} />
                </div>
              </div>
              <p className="text-base font-bold text-zinc-700 dark:text-zinc-300">No status updates</p>
              <p className="text-base text-zinc-400 dark:text-zinc-500 mt-1.5 leading-relaxed max-w-[180px]">
                Status updates disappear after 24 hours.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Context Menu (Translucent Liquid Glass) */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-[100] w-44 py-1 ios-context-menu text-base text-zinc-800 dark:text-[#e9edef] animate-fade-up select-none shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => handleTogglePin(contextMenu.chatId, e)}
            className="w-full text-left px-4 py-2 font-semibold cursor-pointer transition-colors flex items-center gap-2"
          >
            <span>
              {chats.find((c) => c.id === contextMenu.chatId)?.isPinned ? "Unpin Chat" : "Pin Chat"}
            </span>
          </button>
          <button
            onClick={(e) => handleToggleArchive(contextMenu.chatId, e)}
            className="w-full text-left px-4 py-2 font-semibold cursor-pointer transition-colors border-t border-[#e9edef]/30 dark:border-white/5 flex items-center gap-2"
          >
            <span>
              {chats.find((c) => c.id === contextMenu.chatId)?.isArchived ? "Unarchive Chat" : "Archive Chat"}
            </span>
          </button>
        </div>
      )}

      {/* Status Creator Modal */}
      {showCreator && (
        <StatusCreator onClose={() => setShowCreator(false)} />
      )}

      {/* Group Creator Modal */}
      {showGroupModal && (
        <NewGroupModal
          onClose={() => setShowGroupModal(false)}
          onGroupCreated={(chat) => {
            upsertChat(chat);
            setSelectedChatId(chat.id);
            router.push(`/chats/${chat.id}`);
          }}
        />
      )}

    </div>
  );
}
