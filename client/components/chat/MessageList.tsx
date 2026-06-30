"use client";

import * as React from "react";
import { useEffect, useState, useMemo } from "react";
import { Virtuoso } from "react-virtuoso";
import { MessageBubble } from "./MessageBubble";
import { MessageSquareOff } from "lucide-react";
import { useChatStore } from "@hooks/useChatStore";
import { motion } from "framer-motion";

interface MessageListProps {
  chatId: string;
  messages: any[];
  onReply: (message: any) => void;
  onReact: (messageId: string, emoji: string) => void;
  onDelete: (messageId: string, mode: "me" | "everyone") => void;
  onEdit?: (messageId: string, newContent: string) => Promise<void>;
  onForward?: (message: any) => void;
  searchQuery?: string;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  onRetry?: (message: any) => void;
  isLoading?: boolean;
}

export function MessageList({
  chatId,
  messages,
  onReply,
  onReact,
  onDelete,
  onEdit,
  onForward,
  searchQuery,
  onLoadMore,
  loadingMore,
  onRetry,
  isLoading = false,
}: MessageListProps) {
  const [customWallpaper, setCustomWallpaper] = useState("doodle");
  const [bubbleRoundness, setBubbleRoundness] = useState("16px");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedWallpaper = localStorage.getItem("chat-wallpaper") || "doodle";
      const savedRoundness = localStorage.getItem("chat-roundness") || "16px";
      setCustomWallpaper(savedWallpaper);
      setBubbleRoundness(savedRoundness);
    }
  }, []);

  const wallpaperStyles: Record<string, React.CSSProperties> = {
    doodle: {},
    emerald: {
      backgroundColor: "rgba(6, 78, 59, 0.15)",
      backgroundImage: "radial-gradient(rgba(0, 216, 227, 0.12) 1.5px, transparent 0)",
      backgroundSize: "28px 28px"
    },
    midnight: {
      backgroundColor: "rgba(15, 23, 42, 0.35)",
      backgroundImage: "radial-gradient(rgba(99, 102, 241, 0.08) 1.5px, transparent 0)",
      backgroundSize: "32px 32px"
    },
    plum: {
      backgroundColor: "rgba(88, 28, 135, 0.12)",
      backgroundImage: "radial-gradient(rgba(236, 72, 153, 0.08) 1.5px, transparent 0)",
      backgroundSize: "24px 24px"
    },
    minimal: {
      backgroundColor: "transparent",
      backgroundImage: "none"
    }
  };

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    
    return date.toLocaleDateString([], {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const items = useMemo(() => {
    const flatList: any[] = [];
    let currentDate = "";

    messages.forEach((msg) => {
      const msgDate = new Date(msg.createdAt).toDateString();
      if (msgDate !== currentDate) {
        flatList.push({ type: "date", value: msgDate, id: `date-${msgDate}` });
        currentDate = msgDate;
      }
      flatList.push({ type: "message", value: msg, id: msg.id });
    });
    
    return flatList;
  }, [messages]);

  const currentChat = useChatStore((state: any) => state.chats.find((c: any) => c.id === chatId));
  const hasHistory = currentChat?.lastMessage != null;

  if (messages.length === 0) {
    if (isLoading && hasHistory) {
      return (
        <div
          className="flex-1 flex flex-col space-y-5 px-6 py-6 select-none whatsapp-wallpaper overflow-hidden"
          style={wallpaperStyles[customWallpaper]}
        >
          <div className="flex justify-center mb-4">
            <span className="flex items-center gap-2 text-base font-bold text-blue-600 dark:text-blue-400 bg-white/80 dark:bg-[#1f2c34]/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-[#e9edef]/15 dark:border-white/5 animate-pulse uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
              Syncing history...
            </span>
          </div>

          <div className="flex flex-col space-y-4 max-w-lg w-full">
            <div className="flex gap-3 items-start animate-pulse max-w-[70%]">
              <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800/80 flex-shrink-0" />
              <div className="flex flex-col gap-1.5 w-full">
                <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800/80 rounded" />
                <div className="h-12 w-full bg-white/60 dark:bg-[#1e2925]/60 border border-zinc-150/40 dark:border-white/5 rounded-2xl rounded-tl-none" />
              </div>
            </div>

            <div className="flex gap-3 items-end justify-end ml-auto w-full max-w-[65%] animate-pulse">
              <div className="flex flex-col gap-1.5 w-full items-end">
                <div className="h-10 w-full bg-blue-500/10 dark:bg-blue-550/5 border border-blue-500/10 rounded-2xl rounded-tr-none" />
              </div>
            </div>

            <div className="flex gap-3 items-start animate-pulse max-w-[80%]">
              <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800/80 flex-shrink-0" />
              <div className="flex flex-col gap-1.5 w-full">
                <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800/80 rounded" />
                <div className="h-16 w-full bg-white/60 dark:bg-[#1e2925]/60 border border-zinc-150/40 dark:border-white/5 rounded-2xl rounded-tl-none" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-2 p-6 select-none whatsapp-wallpaper"
        style={wallpaperStyles[customWallpaper]}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-white/95 dark:bg-[#1f2c34]/95 backdrop-blur-xl px-8 py-7 rounded-2xl border border-white/20 dark:border-white/5 shadow-xl flex flex-col items-center relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="h-16 w-16 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <MessageSquareOff size={32} className="text-blue-500 dark:text-blue-400" />
          </div>
          <p className="text-base font-bold text-[#111b21] dark:text-[#e9edef] mb-1.5">No messages yet</p>
          <p className="text-base text-[#667781] dark:text-[#8696a0] text-center max-w-[240px] leading-relaxed">
            Send a message below to start the conversation in real-time. Say hello! 👋
          </p>
        </motion.div>
      </div>
    );
  }

  if (messages.length > 0 && items.filter(i => i.type === "message").length === 0 && searchQuery) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-2 p-6 select-none whatsapp-wallpaper"
        style={wallpaperStyles[customWallpaper]}
      >
        <div className="bg-white/90 dark:bg-[#1f2c34]/90 px-6 py-5 rounded-xl border border-[#e9edef] dark:border-[#222e35]/30 shadow-[0_1.5px_1px_rgba(0,0,0,0.06)] flex flex-col items-center">
          <p className="text-base font-bold text-[#111b21] dark:text-[#e9edef]">No matches found</p>
          <p className="text-base text-[#667781] dark:text-[#8696a0] text-center max-w-xs mt-1.5 leading-relaxed">
            No messages in this chat match your search query.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 flex flex-col relative z-10 whatsapp-wallpaper overflow-hidden"
      style={{
        ...wallpaperStyles[customWallpaper],
        "--bubble-radius": bubbleRoundness
      } as React.CSSProperties}
    >
      <div className="flex-1 h-full w-full absolute inset-0">
        <Virtuoso
          style={{ height: "100%", width: "100%" }}
          data={items}
          firstItemIndex={0}
          initialTopMostItemIndex={items.length - 1}
          alignToBottom={true}
          followOutput={(isAtBottom: boolean) => isAtBottom ? "smooth" : false}
          startReached={onLoadMore}
          components={{
            Header: () => loadingMore ? (
              <div className="flex justify-center py-4 select-none">
                <span className="flex items-center gap-2 text-base font-semibold text-blue-600 dark:text-blue-400 bg-white/70 dark:bg-[#1f2c34]/70 backdrop-blur-md px-3 py-1.5 rounded-full shadow border border-[#e9edef]/20 dark:border-white/5 animate-fade-in">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-550 animate-ping" />
                  Loading previous messages...
                </span>
              </div>
            ) : <div style={{ height: "20px" }} />
          }}
          itemContent={(index, item) => {
            if (item.type === "date") {
              return (
                <div className="flex justify-center my-4 select-none w-full">
                  <span className="text-base font-medium text-[#54656f] dark:text-[#8696a0] px-3.5 py-1.5 bg-white dark:bg-[#1f2c34] rounded-lg shadow-[0_1px_0.5px_rgba(0,0,0,0.08)] border border-[#e9edef]/60 dark:border-transparent">
                    {formatDateHeader(item.value)}
                  </span>
                </div>
              );
            }

            return (
              <div className="px-4 py-1.5 w-full">
                <MessageBubble
                  message={item.value}
                  onReply={onReply}
                  onReact={onReact}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onRetry={onRetry}
                  onForward={onForward}
                  searchQuery={searchQuery}
                />
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
