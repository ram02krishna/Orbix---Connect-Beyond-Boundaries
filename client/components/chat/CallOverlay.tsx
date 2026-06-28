"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { useCallStore } from "@hooks/useCallStore";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { Avatar } from "@components/ui/Avatar";
import { motion, AnimatePresence } from "framer-motion";

export function CallOverlay() {
  const {
    callState,
    callType,
    partner,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleCamera,
  } = useCallStore();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Bind video element streams
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callState]);

  // Duration timer when connected
  useEffect(() => {
    if (callState === "connected") {
      setCallDuration(0);
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setCallDuration(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callState]);

  if (callState === "idle" || !partner) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999] flex flex-col items-center justify-center ios-call-panel text-white select-none overflow-hidden"
      >
        {/* Shifting radial lighting behind call panel */}
        <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-emerald-600/10 blur-[120px] pointer-events-none animate-pulse-slow z-0" />
        <div className="absolute bottom-1/4 right-1/4 h-[500px] w-[500px] rounded-full bg-brand-primary/10 blur-[120px] pointer-events-none animate-pulse z-0" />

        {/* Real-time Video Feeds */}
        {callState === "connected" && callType === "video" && (
          <div className="absolute inset-0 h-full w-full bg-black z-10">
            {/* Remote Video (Full Screen) */}
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center bg-zinc-950/90 text-zinc-400 gap-3">
                <Avatar src={partner.avatarUrl} name={partner.name} size="xl" />
                <p className="text-sm font-semibold animate-pulse">Waiting for video stream...</p>
              </div>
            )}

            {/* Local Video Picture-in-Picture */}
            {!isCameraOff && localStream && (
              <motion.div 
                drag
                dragConstraints={{ left: -10, right: 300, top: -10, bottom: 500 }}
                className="absolute top-6 right-6 w-32 h-44 rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-zinc-900 z-20 cursor-grab active:cursor-grabbing"
              >
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />
              </motion.div>
            )}
          </div>
        )}

        {/* Content Pane */}
        <div className="relative z-20 flex flex-col items-center justify-between h-full w-full max-w-md px-6 py-16 text-center">
          
          {/* Header Info */}
          <div className="space-y-4 mt-8">
            <div className="flex justify-center">
              {callState === "connected" && callType === "video" ? (
                // Small indicator in video call
                <div className="px-4 py-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-md text-xs font-semibold tracking-wide">
                  {formatTime(callDuration)}
                </div>
              ) : (
                // Full Profile graphic in audio / dialing call
                <div className="relative flex items-center justify-center">
                  {/* Breathing animation rings */}
                  <div className={`absolute inset-0 rounded-full bg-brand-primary/20 scale-125 border border-brand-primary/20 ${callState === "connected" ? "" : "animate-ping"}`} />
                  <div className={`absolute inset-0 rounded-full bg-brand-primary/10 scale-150 border border-brand-primary/10 ${callState === "connected" ? "" : "animate-pulse"}`} />
                  
                  <Avatar
                    src={partner.avatarUrl}
                    name={partner.name}
                    size="xl"
                    className="relative z-10 border-2 border-white/15 shadow-2xl h-24 w-24 text-4xl"
                  />
                </div>
              )}
            </div>

            {/* Names & Statuses */}
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">
                {partner.name}
              </h2>
              <p className="text-sm font-medium text-emerald-400 drop-shadow-sm tracking-wide">
                {callState === "outgoing" && "Calling..."}
                {callState === "incoming" && `Incoming ${callType === "video" ? "Video" : "Voice"} Call`}
                {callState === "connected" && (
                  <span className="text-zinc-300 font-semibold">
                    {callType === "video" ? "Video Chat" : formatTime(callDuration)}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Bottom Actions and Controls */}
          <div className="w-full space-y-8 mb-4">
            
            {/* INCOMING CALL ACTIONS */}
            {callState === "incoming" && (
              <div className="flex items-center justify-around w-full px-6">
                {/* Decline Button */}
                <button
                  onClick={declineCall}
                  className="flex flex-col items-center gap-2 group focus:outline-none"
                >
                  <div className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 flex items-center justify-center shadow-lg transition-all duration-150 cursor-pointer">
                    <PhoneOff size={26} className="text-white transform rotate-135" />
                  </div>
                  <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors font-medium">Decline</span>
                </button>

                {/* Accept Button */}
                <button
                  onClick={acceptCall}
                  className="flex flex-col items-center gap-2 group focus:outline-none"
                >
                  <div className="h-16 w-16 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 flex items-center justify-center shadow-lg transition-all duration-150 cursor-pointer animate-bounce">
                    <Phone size={26} className="text-white" />
                  </div>
                  <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors font-medium">Accept</span>
                </button>
              </div>
            )}

            {/* OUTGOING & ACTIVE CALL CONTROLS */}
            {(callState === "outgoing" || callState === "connected") && (
              <div className="flex flex-col items-center gap-8">
                
                {/* Audio/Video Media Toggles */}
                <div className="flex items-center justify-center gap-6">
                  {/* Mute Mic */}
                  <button
                    onClick={toggleMute}
                    disabled={callState === "outgoing"}
                    className={`h-12 w-12 rounded-full flex items-center justify-center border transition-all duration-150 active:scale-95 cursor-pointer disabled:opacity-40 disabled:pointer-events-none ${
                      isMuted
                        ? "bg-red-500/80 border-red-500 text-white"
                        : "bg-white/10 border-white/15 text-white hover:bg-white/20"
                    }`}
                    title={isMuted ? "Unmute Mic" : "Mute Mic"}
                  >
                    {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>

                  {/* Toggle Camera (Only for video calls) */}
                  {callType === "video" && (
                    <button
                      onClick={toggleCamera}
                      disabled={callState === "outgoing"}
                      className={`h-12 w-12 rounded-full flex items-center justify-center border transition-all duration-150 active:scale-95 cursor-pointer disabled:opacity-40 disabled:pointer-events-none ${
                        isCameraOff
                          ? "bg-red-500/80 border-red-500 text-white"
                          : "bg-white/10 border-white/15 text-white hover:bg-white/20"
                      }`}
                      title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
                    >
                      {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
                    </button>
                  )}
                </div>

                {/* Hang Up Button */}
                <button
                  onClick={callState === "outgoing" ? declineCall : endCall}
                  className="flex flex-col items-center gap-2 group focus:outline-none"
                >
                  <div className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 flex items-center justify-center shadow-lg transition-all duration-150 cursor-pointer">
                    <PhoneOff size={26} className="text-white" />
                  </div>
                  <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors font-medium">
                    {callState === "outgoing" ? "Cancel" : "End Call"}
                  </span>
                </button>

              </div>
            )}

          </div>

        </div>

      </motion.div>
    </AnimatePresence>
  );
}
