"use client";

import * as React from "react";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function ChatsPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#f8f9fa] dark:bg-[#222e35]/15 border-b-4 border-blue-500">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-md flex flex-col items-center select-none"
      >
        {/* WhatsApp Web Style Computer Graphic */}
        <div className="text-[#667781] dark:text-[#8696a0]/70 mb-8 w-60 h-32 flex items-center justify-center">
          <svg width="220" height="120" viewBox="0 0 220 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <rect x="10" y="5" width="160" height="90" rx="8" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="2" />
            <rect x="18" y="13" width="144" height="62" rx="2" fill="currentColor" fillOpacity="0.04" />
            <circle cx="90" cy="85" r="3" fill="currentColor" />
            <path d="M60 100 L120 100" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <path d="M50 108 L130 108" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            
            {/* Phone graphic overlapping */}
            <rect x="145" y="45" width="38" height="68" rx="6" fill="white" className="dark:fill-[#111b21]" stroke="currentColor" strokeWidth="2" />
            <rect x="149" y="51" width="30" height="50" rx="2" fill="currentColor" fillOpacity="0.08" />
            <circle cx="164" cy="107" r="2" fill="currentColor" />
          </svg>
        </div>

        <h1 className="text-2xl font-light text-[#41525d] dark:text-[#e9edef] tracking-tight">
          Orbix Web
        </h1>
        <p className="text-base text-[#667781] dark:text-[#8696a0] mt-3 max-w-sm leading-relaxed">
          Send and receive messages in real-time. Link your phone to chat with friends, create groups, and share media.
        </p>

        <div className="mt-12 flex items-center justify-center gap-1.5 text-base text-[#8696a0] dark:text-[#667781]">
          <Lock size={12} className="text-[#8696a0] dark:text-[#667781]" />
          <span>End-to-end encrypted</span>
        </div>
      </motion.div>
    </div>
  );
}
