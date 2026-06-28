"use client";

import * as React from "react";
import { useEffect, useRef, useLayoutEffect, useState } from "react";
import { MessageBubble } from "./MessageBubble";
import { MessageSquareOff } from "lucide-react";

interface MessageListProps {
  chatId: string;
  messages: any[];
  onReply: (message: any) => void;
  onReact: (messageId: string, emoji: string) => void;
  onDelete: (messageId: string, mode: "me" | "everyone") => void;
  onEdit?: (messageId: string, newContent: string) => Promise<void>;
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
  searchQuery,
  onLoadMore,
  loadingMore,
  onRetry,
  isLoading = false,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const prevScrollTopRef = useRef<number>(0);
  const oldestMessageIdRef = useRef<string | null>(null);

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
      backgroundImage: "radial-gradient(rgba(16, 185, 129, 0.12) 1.5px, transparent 0)",
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

  const oldestId = messages[0]?.id;

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (oldestId && oldestMessageIdRef.current && oldestId !== oldestMessageIdRef.current) {
      const newScrollHeight = container.scrollHeight;
      const heightDifference = newScrollHeight - prevScrollHeightRef.current;
      container.scrollTop = prevScrollTopRef.current + heightDifference;
    } else {
      container.scrollTop = container.scrollHeight;
    }

    prevScrollHeightRef.current = container.scrollHeight;
    prevScrollTopRef.current = container.scrollTop;
    oldestMessageIdRef.current = oldestId || null;
  }, [messages, oldestId]);

  useEffect(() => {
    prevScrollHeightRef.current = 0;
    prevScrollTopRef.current = 0;
    oldestMessageIdRef.current = null;
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [chatId]);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    if (onLoadMore && !loadingMore && container.scrollTop <= 10) {
      onLoadMore();
    }

    prevScrollTopRef.current = container.scrollTop;
    prevScrollHeightRef.current = container.scrollHeight;
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

  // We no longer filter out history, we pass search query down to bubble highlight triggers instead!
  const filteredMessages = messages;

  // Group messages by date
  const groupedMessages = filteredMessages.reduce((groups: Record<string, any[]>, message) => {
    const dateKey = new Date(message.createdAt).toDateString();
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(message);
    return groups;
  }, {});

  if (messages.length === 0) {
    if (isLoading) {
      return (
        <div
          className="flex-1 flex flex-col space-y-5 px-6 py-6 select-none whatsapp-wallpaper overflow-hidden"
          style={wallpaperStyles[customWallpaper]}
        >
          <div className="flex justify-center mb-4">
            <span className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-white/80 dark:bg-[#1f2c34]/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-[#e9edef]/15 dark:border-white/5 animate-pulse uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              Syncing history...
            </span>
          </div>

          <div className="flex flex-col space-y-4 max-w-lg w-full">
            {/* Incoming Bubble Shimmer */}
            <div className="flex gap-3 items-start animate-pulse max-w-[70%]">
              <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800/80 flex-shrink-0" />
              <div className="flex flex-col gap-1.5 w-full">
                <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800/80 rounded" />
                <div className="h-12 w-full bg-white/60 dark:bg-[#1e2925]/60 border border-zinc-150/40 dark:border-white/5 rounded-2xl rounded-tl-none" />
              </div>
            </div>

            {/* Outgoing Bubble Shimmer */}
            <div className="flex gap-3 items-end justify-end ml-auto w-full max-w-[65%] animate-pulse">
              <div className="flex flex-col gap-1.5 w-full items-end">
                <div className="h-10 w-full bg-emerald-500/10 dark:bg-emerald-550/5 border border-emerald-500/10 rounded-2xl rounded-tr-none" />
              </div>
            </div>

            {/* Incoming Bubble Shimmer */}
            <div className="flex gap-3 items-start animate-pulse max-w-[80%]">
              <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800/80 flex-shrink-0" />
              <div className="flex flex-col gap-1.5 w-full">
                <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800/80 rounded" />
                <div className="h-16 w-full bg-white/60 dark:bg-[#1e2925]/60 border border-zinc-150/40 dark:border-white/5 rounded-2xl rounded-tl-none" />
              </div>
            </div>

            {/* Outgoing Bubble Shimmer */}
            <div className="flex gap-3 items-end justify-end ml-auto w-full max-w-[50%] animate-pulse">
              <div className="flex flex-col gap-1.5 w-full items-end">
                <div className="h-12 w-full bg-emerald-500/10 dark:bg-emerald-550/5 border border-emerald-500/10 rounded-2xl rounded-tr-none" />
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
        <div className="bg-white/90 dark:bg-[#1f2c34]/90 px-6 py-5 rounded-xl border border-[#e9edef] dark:border-[#222e35]/30 shadow-[0_1.5px_1px_rgba(0,0,0,0.06)] flex flex-col items-center">
          <MessageSquareOff size={30} className="text-emerald-500/70 dark:text-emerald-400/70 mb-2" />
          <p className="text-sm font-bold text-[#111b21] dark:text-[#e9edef]">No messages yet</p>
          <p className="text-xs text-[#667781] dark:text-[#8696a0] text-center max-w-xs mt-1 leading-relaxed">
            Send a message below to start the conversation in real-time.
          </p>
        </div>
      </div>
    );
  }

  if (filteredMessages.length === 0 && searchQuery) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-2 p-6 select-none whatsapp-wallpaper"
        style={wallpaperStyles[customWallpaper]}
      >
        <div className="bg-white/90 dark:bg-[#1f2c34]/90 px-6 py-5 rounded-xl border border-[#e9edef] dark:border-[#222e35]/30 shadow-[0_1.5px_1px_rgba(0,0,0,0.06)] flex flex-col items-center">
          <p className="text-sm font-bold text-[#111b21] dark:text-[#e9edef]">No matches found</p>
          <p className="text-xs text-[#667781] dark:text-[#8696a0] text-center max-w-xs mt-1.5 leading-relaxed">
            No messages in this chat match your search query.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-4 flex flex-col space-y-4 relative z-10 whatsapp-wallpaper"
      style={{
        ...wallpaperStyles[customWallpaper],
        "--bubble-radius": bubbleRoundness
      } as React.CSSProperties}
    >
      {loadingMore && (
        <div className="flex justify-center py-2 select-none">
          <span className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-white/70 dark:bg-[#1f2c34]/70 backdrop-blur-md px-3 py-1.5 rounded-full shadow border border-[#e9edef]/20 dark:border-white/5 animate-fade-in">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-550 animate-ping" />
            Loading previous messages...
          </span>
        </div>
      )}

      {Object.entries(groupedMessages).map(([dateKey, list]) => (
        <div key={dateKey} className="space-y-3 w-full flex flex-col">
          {/* Group Date Header */}
          <div className="flex justify-center my-4 select-none">
            <span className="text-[11px] font-medium text-[#54656f] dark:text-[#8696a0] px-3.5 py-1.5 bg-white dark:bg-[#1f2c34] rounded-lg shadow-[0_1px_0.5px_rgba(0,0,0,0.08)] border border-[#e9edef]/60 dark:border-transparent">
              {formatDateHeader(dateKey)}
            </span>
          </div>

          {/* List of messages for this date */}
          {list.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onReply={onReply}
              onReact={onReact}
              onDelete={onDelete}
              onEdit={onEdit}
              onRetry={onRetry}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
