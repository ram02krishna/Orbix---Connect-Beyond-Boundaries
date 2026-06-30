"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useStatusStore, StatusGroup } from "@hooks/useStatusStore";
import { useAuthStore } from "@hooks/useAuthStore";
import { Avatar } from "@components/ui/Avatar";
import { formatDistanceToNow } from "date-fns";

const SLIDE_DURATION = 5000; // 5 seconds per status

export function StatusViewer() {
  const me = useAuthStore((state) => state.user);

  const myStatus = useStatusStore((state) => state.myStatus);
  const recent = useStatusStore((state) => state.recent);
  const viewed = useStatusStore((state) => state.viewed);

  const activeGroupUserId = useStatusStore((state) => state.activeGroupUserId);
  const activeStatusIndex = useStatusStore((state) => state.activeStatusIndex);

  const closeStatusViewer = useStatusStore((state) => state.closeStatusViewer);
  const nextStatus = useStatusStore((state) => state.nextStatus);
  const prevStatus = useStatusStore((state) => state.prevStatus);

  const fetchStatusViewers = useStatusStore((state) => state.fetchStatusViewers);
  const viewers = useStatusStore((state) => state.viewers);

  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showViewers, setShowViewers] = useState(false);

  const intervalRef = useRef<any>(null);
  const startRef = useRef<number>(Date.now());
  const pausedProgressRef = useRef<number>(0);

  let group: StatusGroup | null = null;
  if (activeGroupUserId) {
    if (myStatus && myStatus.user.id === activeGroupUserId) {
      group = myStatus;
    } else {
      group = recent.find((g) => g.user.id === activeGroupUserId) ||
        viewed.find((g) => g.user.id === activeGroupUserId) || null;
    }
  }

  const activeStatus = group ? group.statuses[activeStatusIndex] : null;
  const isOwnStatus = group && me && group.user.id === me.id;

  useEffect(() => {
    if (activeStatus && isOwnStatus) {
      fetchStatusViewers(activeStatus.id);
    }
    setProgress(0);
    pausedProgressRef.current = 0;
    startRef.current = Date.now();
    setShowViewers(false);
  }, [activeGroupUserId, activeStatusIndex, isOwnStatus]);

  useEffect(() => {
    if (!activeStatus || isPaused || showViewers) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    startRef.current = Date.now() - (pausedProgressRef.current * SLIDE_DURATION / 100);

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const percent = Math.min((elapsed / SLIDE_DURATION) * 100, 100);
      setProgress(percent);

      if (percent >= 100) {
        clearInterval(intervalRef.current);
        nextStatus();
      }
    }, 100);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeGroupUserId, activeStatusIndex, isPaused, showViewers]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeGroupUserId) return;
      if (e.key === "Escape") {
        closeStatusViewer();
      } else if (e.key === "ArrowRight") {
        nextStatus();
      } else if (e.key === "ArrowLeft") {
        prevStatus();
      } else if (e.key === " ") {
        e.preventDefault();
        setIsPaused(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeGroupUserId]);

  if (!group || !activeStatus) return null;

  const handleMouseDown = () => {
    setIsPaused(true);
    pausedProgressRef.current = progress;
  };

  const handleMouseUp = () => {
    setIsPaused(false);
  };

  const activeStatusViewers = viewers[activeStatus.id] || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center select-none text-white">
      <div className="relative w-full max-w-md h-full md:h-[90vh] md:max-h-[850px] bg-zinc-950 flex flex-col justify-between overflow-hidden md:rounded-3xl border border-white/5 shadow-2xl">

        <div className="absolute top-4 left-4 right-4 z-30 flex gap-1">
          {group.statuses.map((s, index) => (
            <div key={s.id} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{
                  width: index === activeStatusIndex ? `${progress}%` : index < activeStatusIndex ? "100%" : "0%",
                }}
              />
            </div>
          ))}
        </div>

        <div className="absolute top-8 left-4 right-4 z-30 flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <Avatar src={group.user.avatarUrl} name={group.user.name} size="sm" className="ring-1 ring-blue-500" />
            <div>
              <p className="text-base font-semibold truncate leading-tight">{group.user.name}</p>
              <p className="text-base text-zinc-400 font-medium">
                {formatDistanceToNow(new Date(activeStatus.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          <button
            onClick={closeStatusViewer}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div
          className="flex-1 flex items-center justify-center relative w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
        >
          <div className="absolute inset-0 flex z-10">
            <div
              className="w-[30%] h-full cursor-pointer active:bg-white/5 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                prevStatus();
              }}
            />
            <div className="w-[40%] h-full" />
            <div
              className="w-[30%] h-full cursor-pointer active:bg-white/5 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                nextStatus();
              }}
            />
          </div>

          {activeStatus.mediaUrl ? (
            <div className="w-full h-full flex flex-col justify-center bg-black">
              <img
                src={activeStatus.mediaUrl}
                alt="Status update"
                className="max-h-[75%] w-full object-contain pointer-events-none"
              />
              {activeStatus.caption && (
                <div className="absolute bottom-16 left-4 right-4 z-20 text-center px-4 py-3 rounded-2xl bg-black/60 backdrop-blur-md border border-white/5 text-base leading-relaxed max-h-[120px] overflow-y-auto">
                  {activeStatus.caption}
                </div>
              )}
            </div>
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center p-8 text-center text-xl font-bold leading-normal break-words ${activeStatus.backgroundColor || "bg-zinc-800"
                }`}
            >
              <div className="max-w-xs">{activeStatus.content}</div>
            </div>
          )}
        </div>

        {isOwnStatus && (
          <div className="absolute bottom-4 left-0 right-0 z-30 flex justify-center">
            <button
              onClick={() => {
                setIsPaused(true);
                setShowViewers(true);
              }}
              className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/5 text-base font-semibold flex items-center gap-1.5 cursor-pointer shadow-lg transition-transform hover:scale-105"
            >
              <Eye size={14} />
              {activeStatus.views.length} Views
            </button>
          </div>
        )}
      </div>

      {isOwnStatus && showViewers && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-end justify-center p-4">
          <div className="w-full max-w-md rounded-t-3xl border border-white/10 bg-zinc-900 shadow-2xl flex flex-col max-h-[50vh]">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <span className="text-base font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                <Eye size={14} className="text-blue-500" />
                Viewed By ({activeStatusViewers.length})
              </span>
              <button
                onClick={() => {
                  setShowViewers(false);
                  setIsPaused(false);
                }}
                className="p-1 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
              {activeStatusViewers.length === 0 ? (
                <div className="text-center py-8 text-base text-zinc-500 font-medium">
                  No views yet
                </div>
              ) : (
                activeStatusViewers.map((viewer) => (
                  <div
                    key={viewer.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <Avatar src={viewer.avatarUrl} name={viewer.name} size="xs" />
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold truncate text-white leading-tight">{viewer.name}</p>
                      <p className="text-base text-zinc-500">@{viewer.username}</p>
                    </div>
                    <span className="text-base text-zinc-400 font-medium whitespace-nowrap">
                      {formatDistanceToNow(new Date(viewer.viewedAt), { addSuffix: true })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
