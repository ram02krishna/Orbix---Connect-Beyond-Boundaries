"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@hooks/useAuthStore";
import { useSocketStore } from "@hooks/useSocketStore";
import { useChatStore } from "@hooks/useChatStore";
import { Sidebar } from "@components/sidebar/Sidebar";
import { CallOverlay } from "@components/chat/CallOverlay";
import { useUIStore } from "@hooks/useUIStore";
import api from "@lib/api";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const token = useAuthStore((state) => state.token);
  const connectSocket = useSocketStore((state) => state.connectSocket);
  const disconnectSocket = useSocketStore((state) => state.disconnectSocket);
  const setChats = useChatStore((state) => state.setChats);
  const setOnlineStatuses = useChatStore((state) => state.setOnlineStatuses);

  const [mounted, setMounted] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen);

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
      if (!token) {
        router.push("/login");
      }
    }
  }, [isHydrated, mounted, token, router]);

  // Connect socket and fetch chats list on mount
  useEffect(() => {
    if (!token) return;

    // Connect socket
    connectSocket(token);

    // Fetch user chats
    const fetchData = async () => {
      try {
        const chatsRes = await api.get("/chats");
        
        // Setup chats
        const chats = chatsRes.data.data.chats;
        setChats(chats);
        
        // Extract online statuses
        const statuses = chatsRes.data.data.onlineStatuses || {};
        setOnlineStatuses(statuses);
        
      } catch (err) {
        console.error("Failed to load chats:", err);
      }
    };

    void fetchData();
  }, [token, connectSocket, setChats, setOnlineStatuses]);

  if (!mounted || !token) {
    return null;
  }

  const isRootChats = pathname === "/chats";

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 relative select-none">
      {/* Main Dashboard Layout Container */}
      <div className="flex w-full h-full relative z-10">
        <div
          className={`flex-shrink-0 h-full transition-all duration-300 overflow-hidden ${
            isRootChats ? "block w-full" : "hidden"
          } md:block ${
            isSidebarOpen 
              ? "md:w-[280px] lg:w-[320px] md:border-r border-zinc-200/60 dark:border-white/5" 
              : "md:w-0 md:border-none"
          }`}
        >
          <div className="w-full md:w-[280px] lg:w-[320px] h-full">
            <Sidebar />
          </div>
        </div>

        {/* Center Main View column */}
        <div
          className={`flex-1 h-full min-w-0 flex flex-col relative bg-[#f0f2f5] dark:bg-[#0b141a] ${
            isRootChats ? "hidden md:flex" : "flex"
          }`}
        >
          {/* WebRTC Call Interface Constrained to Chat Section */}
          <CallOverlay />
          {children}
        </div>
      </div>
    </div>
  );
}
