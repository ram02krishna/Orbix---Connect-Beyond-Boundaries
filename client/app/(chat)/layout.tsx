"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@hooks/useAuthStore";
import { useSocketStore } from "@hooks/useSocketStore";
import { useChatStore } from "@hooks/useChatStore";
import { Sidebar } from "@components/sidebar/Sidebar";
import { CallOverlay } from "@components/chat/CallOverlay";
import { StatusViewer } from "@components/status/StatusViewer";
import api from "@lib/api";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const accessToken = useAuthStore((state) => state.accessToken);
  const connectSocket = useSocketStore((state) => state.connectSocket);
  const disconnectSocket = useSocketStore((state) => state.disconnectSocket);
  const setChats = useChatStore((state) => state.setChats);
  const setOnlineStatuses = useChatStore((state) => state.setOnlineStatuses);

  const [mounted, setMounted] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check if store has already hydrated
    if (useAuthStore.persist.hasHydrated()) {
      setIsHydrated(true);
    } else {
      // Subscribe to hydration finish
      const unsub = useAuthStore.persist.onFinishHydration(() => setIsHydrated(true));
      return () => {
        if (unsub) unsub();
      };
    }
  }, []);

  useEffect(() => {
    if (isHydrated && mounted) {
      if (!accessToken) {
        router.push("/login");
      }
    }
  }, [isHydrated, mounted, accessToken, router]);

  // Connect socket and fetch chats list on mount
  useEffect(() => {
    if (!accessToken) return;

    // Connect socket
    connectSocket(accessToken);

    // Fetch user chats and blocked users
    const fetchData = async () => {
      try {
        const [chatsRes, blockedRes] = await Promise.all([
          api.get("/chats"),
          api.get("/users/blocked")
        ]);
        
        // Setup chats
        const chats = chatsRes.data.data.chats;
        setChats(chats);
        
        // Extract online statuses
        const statuses = chatsRes.data.data.onlineStatuses || {};
        setOnlineStatuses(statuses);
        
        // Setup blocked users
        const blockedUsers = blockedRes.data.data.users || [];
        useAuthStore.getState().setBlockedUsers(blockedUsers.map((u: any) => u.id));
        
      } catch (err) {
        console.error("Failed to load chats:", err);
      }
    };

    void fetchData();
  }, [accessToken, connectSocket, setChats, setOnlineStatuses]);

  if (!mounted || !accessToken) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 flex-col gap-4">
        {/* Animated spinner ring */}
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border-2 border-brand-primary/20" />
          <div className="absolute inset-0 rounded-full border-t-2 border-brand-primary animate-spin" />
          <div className="absolute inset-2 rounded-full bg-brand-primary/10 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-brand-primary animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-bold text-zinc-900 dark:text-white">
            Chat<span className="text-brand-primary">Flow</span>
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Connecting...</p>
        </div>
      </div>
    );
  }

  const isRootChats = pathname === "/chats";

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#eff3f1] dark:bg-[#000000] text-zinc-900 dark:text-zinc-100 relative select-none transition-colors duration-300">
      {/* Global WebRTC Call Interface */}
      <CallOverlay />

      {/* Global Status Viewer Player */}
      <StatusViewer />

      {/* Shifting Colorful Gradients for Liquid Glass depth */}
      <div className="absolute top-[-10%] left-[-15%] h-[650px] w-[650px] rounded-full bg-blue-500/12 dark:bg-blue-500/8 blur-[110px] pointer-events-none z-0 blob-glow-1" />
      <div className="absolute bottom-[-10%] right-[-15%] h-[650px] w-[650px] rounded-full bg-purple-500/10 dark:bg-purple-500/8 blur-[110px] pointer-events-none z-0 blob-glow-2" />
      <div className="absolute top-1/4 right-[10%] h-[550px] w-[550px] rounded-full bg-cyan-500/10 dark:bg-cyan-500/6 blur-[110px] pointer-events-none z-0 blob-glow-1" />
      <div className="absolute bottom-1/4 left-[10%] h-[550px] w-[550px] rounded-full bg-pink-500/8 dark:bg-pink-500/5 blur-[110px] pointer-events-none z-0 blob-glow-2" />

      {/* Main Dashboard Layout Container */}
      <div className="flex w-full h-full relative z-10">
        {/* Left Sidebar column */}
        <div
          className={`flex-shrink-0 w-full md:w-80 lg:w-96 h-full ${
            isRootChats ? "block" : "hidden md:block"
          }`}
        >
          <Sidebar />
        </div>

        {/* Center Main View column */}
        <div
          className={`flex-1 h-full min-w-0 flex flex-col relative ${
            isRootChats ? "hidden md:flex" : "flex"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
