import * as React from "react";
import { useState, useEffect } from "react";
import { Reply, Smile, Trash2, Download, FileText, Pencil, Check, X, Star, Play, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@lib/utils";
import { useAuthStore } from "@hooks/useAuthStore";
import { Avatar } from "@components/ui/Avatar";
import { Button } from "@components/ui/Button";
import { motion } from "framer-motion";
import { API_BASE_URL } from "@lib/api";
import { CustomAudioPlayer } from "./CustomAudioPlayer";
import { MediaLightbox } from "./MediaLightbox";

export interface MessageBubbleProps {
  message: any;
  onReply: (message: any) => void;
  onReact: (messageId: string, emoji: string) => void;
  onDelete: (messageId: string, mode: "me" | "everyone") => void;
  onEdit?: (messageId: string, newContent: string) => Promise<void>;
  onRetry?: (message: any) => void;
  searchQuery?: string;
}

export const MessageBubble = React.memo(function MessageBubble({ message, onReply, onReact, onDelete, onEdit, onRetry, searchQuery }: MessageBubbleProps) {
  const user = useAuthStore((state) => state.user);

  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editVal, setEditVal] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [isStarred, setIsStarred] = useState(false);
  const [showOptionsMobile, setShowOptionsMobile] = useState(false);
  
  const touchTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const bubbleRef = React.useRef<HTMLDivElement>(null);

  // Lightbox viewer states
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState("");
  const [lightboxType, setLightboxType] = useState<"IMAGE" | "VIDEO" | "PDF">("IMAGE");
  const [lightboxName, setLightboxName] = useState("");

  useEffect(() => {
    const starred = localStorage.getItem(`starred:${message.id}`);
    setIsStarred(!!starred);
  }, [message.id]);

  const handleToggleStar = () => {
    if (isStarred) {
      localStorage.removeItem(`starred:${message.id}`);
      setIsStarred(false);
      window.dispatchEvent(new Event("starred-messages-updated"));
    } else {
      localStorage.setItem(
        `starred:${message.id}`,
        JSON.stringify({
          id: message.id,
          chatId: message.chatId,
          content: message.content,
          type: message.type,
          senderName: message.sender.name,
          createdAt: message.createdAt,
        })
      );
      setIsStarred(true);
      window.dispatchEvent(new Event("starred-messages-updated"));
    }
  };

  useEffect(() => {
    if (showOptionsMobile) {
      const handleGlobalClick = (e: MouseEvent | TouchEvent) => {
        if (bubbleRef.current && !bubbleRef.current.contains(e.target as Node)) {
          setShowOptionsMobile(false);
          setShowReactionPicker(false);
        }
      };
      const timeout = setTimeout(() => {
        document.addEventListener("mousedown", handleGlobalClick);
        document.addEventListener("touchstart", handleGlobalClick);
      }, 100);
      return () => {
        clearTimeout(timeout);
        document.removeEventListener("mousedown", handleGlobalClick);
        document.removeEventListener("touchstart", handleGlobalClick);
      };
    }
  }, [showOptionsMobile]);

  const handleSaveEdit = async () => {
    if (!editVal.trim() || editVal === message.content) return;
    try {
      if (onEdit) {
        await onEdit(message.id, editVal);
      }
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save edit:", err);
    }
  };

  const isSelf = message.senderId === user?.id;
  const isDeleted = !!message.deletedAt;
  const isMediaOnly = !isDeleted && message.attachments && message.attachments.length > 0 &&
    message.attachments.some((att: any) => att.fileType === "IMAGE" || att.fileType === "VIDEO") &&
    (message.content === message.attachments[0]?.fileName || !message.content);

  const quickEmojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  const handleDownload = (url: string, filename: string) => {
    const downloadUrl = `${API_BASE_URL}/media/download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(filename)}`;
    window.location.href = downloadUrl;
  };

  const handleConfirmDelete = (mode: "me" | "everyone") => {
    onDelete(message.id, mode);
    setShowDeleteModal(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isDeleted || message.id.startsWith("temp-")) return;
    onReact(message.id, "❤️");
  };

  const handleTouchStart = () => {
    if (isDeleted || message.id.startsWith("temp-")) return;
    touchTimerRef.current = setTimeout(() => {
      setShowOptionsMobile(true);
    }, 500); // 500ms long press
  };

  const handleTouchEndOrMove = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className={cn(
        "flex gap-3 w-full max-w-2xl px-4 py-1.5 transition-all relative group justify-start",
        isSelf ? "ml-auto flex-row-reverse" : "mr-auto flex-row"
      )}
    >

      <div className={cn("flex flex-col max-w-[85%] sm:max-w-[75%]", isSelf ? "items-end" : "items-start")}>
        {!isSelf && (
          <span className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400 pl-2 mb-1">
            {message.sender.name}
          </span>
        )}

        <div
          ref={bubbleRef}
          onDoubleClick={handleDoubleClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEndOrMove}
          onTouchMove={handleTouchEndOrMove}
          className={cn(
            isMediaOnly
              ? "p-1 rounded-2xl relative border shadow-[0_2px_4px_rgba(0,0,0,0.04)] overflow-hidden"
              : "px-4 py-2.5 rounded-2xl relative border text-[15px] leading-normal font-sans font-normal tracking-wide break-words whitespace-pre-wrap shadow-[0_2px_4px_rgba(0,0,0,0.04)]",
            isSelf
              ? "ios-bubble-me rounded-tr-none"
              : "ios-bubble-other rounded-tl-none",
            isDeleted &&
            "italic bg-transparent dark:bg-transparent border-[#e9edef] dark:border-[#222e35]/30 shadow-none text-zinc-400 dark:text-zinc-500",
            message.isSending && "opacity-70 animate-pulse-slow",
            message.hasFailed && "border-red-500/30 bg-red-500/5 dark:bg-red-950/5 text-red-650 dark:text-red-400"
          )}
          style={{
            borderRadius: isDeleted
              ? undefined
              : isSelf
              ? "var(--bubble-radius, 16px) var(--bubble-radius, 16px) 0px var(--bubble-radius, 16px)"
              : "var(--bubble-radius, 16px) var(--bubble-radius, 16px) var(--bubble-radius, 16px) 0px"
          }}
        >
          {/* Options Bar - Positioned outside left/right of the card */}
          {!isDeleted && (
            <div
              className={cn(
                "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex items-center gap-1.5 bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-white/5 backdrop-blur-md rounded-xl p-1 shadow-lg transition-all z-30 select-none",
                isSelf ? "right-full mr-3" : "left-full ml-3",
                showOptionsMobile && "opacity-100"
              )}
            >
              <div className="relative">
                <button
                  onClick={() => setShowReactionPicker(!showReactionPicker)}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                  title="Add Reaction"
                >
                  <Smile size={14} />
                </button>

                {showReactionPicker && (
                  <div className="absolute bottom-10 left-0 flex gap-1.5 p-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-full shadow-2xl z-50 animate-scale-up">
                    {quickEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          onReact(message.id, emoji);
                          setShowReactionPicker(false);
                        }}
                        className="hover:scale-130 active:scale-95 transition-all p-0.5 text-xl cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => onReply(message)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                title="Reply"
              >
                <Reply size={14} />
              </button>

              <button
                onClick={handleToggleStar}
                className={cn(
                  "p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer",
                  isStarred ? "text-amber-550 dark:text-amber-500" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                )}
                title={isStarred ? "Unstar message" : "Star message"}
              >
                <Star size={13} fill={isStarred ? "currentColor" : "none"} />
              </button>

              {isSelf && message.type === "TEXT" && (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setEditVal(message.content || "");
                  }}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                  title="Edit message"
                >
                  <Pencil size={13} />
                </button>
              )}

              {!isDeleted && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#54656f] dark:text-[#aebac1] hover:text-red-500 dark:hover:text-red-400 transition-all cursor-pointer"
                  title="Delete message"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )}
          {!isDeleted && message.replyTo && (
            <div
              className={cn(
                "flex items-start gap-2 border-l-4 pl-2 py-1 pr-1 mb-2 rounded text-xs select-none",
                isSelf
                  ? "border-emerald-600 bg-black/5 dark:border-emerald-400 dark:bg-black/20"
                  : "border-emerald-500 bg-zinc-100 dark:border-emerald-400 dark:bg-[#182229]"
              )}
            >
              <div className="flex-1 min-w-0">
                <p className={cn("font-bold text-[10px]", isSelf ? "text-emerald-800 dark:text-emerald-400" : "text-emerald-600 dark:text-emerald-400")}>
                  {message.replyTo.sender.name}
                </p>
                <p className="truncate max-w-full text-[11px] text-zinc-600 dark:text-zinc-300 mt-0.5">
                  {message.replyTo.content}
                </p>
              </div>
            </div>
          )}

          {!isDeleted && message.attachments && message.attachments.length > 0 && (
            <div className="space-y-2 mb-2 select-none">
              {message.attachments.map((att: any) => {
                const isImg = att.mimeType?.startsWith("image/") || att.fileType === "IMAGE";
                const isVid = att.mimeType?.startsWith("video/") || att.fileType === "VIDEO";
                const isAud = att.mimeType?.startsWith("audio/") || att.fileType === "AUDIO";

                if (isImg) {
                  return (
                    <div
                      key={att.id}
                      onClick={() => {
                        setLightboxUrl(att.fileUrl);
                        setLightboxType("IMAGE");
                        setLightboxName(att.fileName);
                        setLightboxOpen(true);
                      }}
                      className={cn(
                        "relative rounded-xl overflow-hidden max-w-sm group cursor-pointer",
                        isMediaOnly ? "" : "border border-zinc-200/50 dark:border-white/5"
                      )}
                    >
                      <img src={att.fileUrl} alt={att.fileName} className="max-h-64 object-contain transition-transform duration-300 hover:scale-[1.02]" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDownload(att.fileUrl, att.fileName);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/85 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center"
                        title="Download image"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  );
                }

                if (isVid) {
                  return (
                    <div
                      key={att.id}
                      onClick={() => {
                        setLightboxUrl(att.fileUrl);
                        setLightboxType("VIDEO");
                        setLightboxName(att.fileName);
                        setLightboxOpen(true);
                      }}
                      className={cn(
                        "relative rounded-xl overflow-hidden max-w-sm group cursor-pointer",
                        isMediaOnly ? "" : "border border-zinc-200/50 dark:border-white/5"
                      )}
                    >
                      <video src={att.fileUrl} className="max-h-64 object-contain pointer-events-none" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/35 transition-colors">
                        <span className="p-2.5 rounded-full bg-emerald-500 text-white shadow-lg flex items-center justify-center">
                          <Play size={16} fill="currentColor" className="ml-0.5" />
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDownload(att.fileUrl, att.fileName);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/85 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center z-10"
                        title="Download video"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  );
                }

                if (isAud) {
                  return (
                    <div key={att.id} className="flex flex-col gap-1.5 p-1 max-w-xs">
                      <CustomAudioPlayer src={att.fileUrl} isSelf={isSelf} />
                    </div>
                  );
                }

                const isPdf = att.mimeType === "application/pdf" || att.fileName.toLowerCase().endsWith(".pdf");

                return (
                  <div
                    key={att.id}
                    onClick={() => {
                      if (isPdf) {
                        setLightboxUrl(att.fileUrl);
                        setLightboxType("PDF");
                        setLightboxName(att.fileName);
                        setLightboxOpen(true);
                      } else {
                        handleDownload(att.fileUrl, att.fileName);
                      }
                    }}
                    className={cn(
                      "flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer max-w-xs select-none",
                      isSelf
                        ? "bg-black/10 hover:bg-black/15 border-white/10"
                        : "bg-black/5 dark:bg-black/15 border-zinc-250/20 dark:border-white/5 hover:bg-black/10 dark:hover:bg-black/25"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center h-9 w-9 rounded-lg flex-shrink-0 transition-colors",
                        isSelf
                          ? "bg-white/20 text-white"
                          : "bg-zinc-200 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400"
                      )}
                    >
                      <FileText size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-bold truncate", isSelf ? "text-white" : "text-zinc-800 dark:text-zinc-200")}>
                        {att.fileName}
                      </p>
                      <p className={cn("text-[10px] font-semibold", isSelf ? "text-emerald-100/90" : "text-zinc-500 dark:text-zinc-450")}>
                        {(att.fileSize / 1024).toFixed(1)} KB {isPdf && "• PDF"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(att.fileUrl, att.fileName);
                      }}
                      className={cn(
                        "p-1.5 rounded-full transition-colors flex-shrink-0",
                        isSelf
                          ? "hover:bg-white/10 text-white/80 hover:text-white"
                          : "hover:bg-zinc-250/50 dark:hover:bg-zinc-750/50 text-[#54656f] dark:text-[#aebac1] hover:text-zinc-950 dark:hover:text-white"
                      )}
                      title="Download file"
                    >
                      <Download size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Message text or Edit input block */}
          {isEditing ? (
            <div className="flex flex-col gap-2 min-w-[200px] mt-1 select-none">
              <input
                type="text"
                value={editVal}
                onChange={(e) => setEditVal(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#b2e7a6]/60 dark:border-[#025041]/60 bg-white/70 dark:bg-[#182229] text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                placeholder="Edit message..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveEdit();
                  } else if (e.key === "Escape") {
                    setIsEditing(false);
                  }
                }}
              />
              <div className="flex items-center justify-end gap-1.5 self-end">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="p-1 rounded bg-zinc-200/50 hover:bg-zinc-200 dark:bg-zinc-700/30 dark:hover:bg-zinc-700/60 text-zinc-500 dark:text-zinc-400 transition-colors cursor-pointer"
                  title="Cancel"
                >
                  <X size={12} />
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={!editVal.trim() || editVal === message.content}
                  className="p-1 rounded bg-[#00a884] hover:bg-[#008f6f] text-white disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                  title="Save changes"
                >
                  <Check size={12} />
                </button>
              </div>
            </div>
          ) : (
            (!message.attachments || message.attachments.length === 0 || message.content !== message.attachments[0]?.fileName || isDeleted) &&
            message.type !== "AUDIO" && (
              <p className="select-text">
                {isDeleted
                  ? "This message was deleted."
                  : (() => {
                      const text = message.content || "";
                      if (!searchQuery || !text) return text;
                      const parts = text.split(
                        new RegExp(`(${searchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")})`, "gi")
                      );
                      return (
                        <span>
                          {parts.map((part: string, index: number) =>
                            part.toLowerCase() === searchQuery.toLowerCase() ? (
                              <mark
                                key={index}
                                className="bg-amber-300 text-black px-0.5 rounded font-semibold animate-pulse-slow select-text"
                              >
                                {part}
                              </mark>
                            ) : (
                              part
                            )
                          )}
                        </span>
                      );
                    })()}
              </p>
            )
          )}
          {!isDeleted && (
            <div
              className={cn(
                "flex items-center justify-end gap-1 mt-1 text-[11px] font-medium select-none",
                isMediaOnly
                  ? "absolute bottom-3 right-3 bg-black/50 backdrop-blur-md px-2.5 py-0.5 rounded-full text-white border border-white/5 z-20"
                  : isSelf
                  ? "text-white/70"
                  : "text-zinc-550 dark:text-zinc-400"
              )}
            >
              {isStarred && (
                <Star size={10} className="text-amber-500 fill-amber-500 mr-0.5 flex-shrink-0" />
              )}
              {message.editedAt && (
                <span className="text-[10px] opacity-75 mr-0.5">edited •</span>
              )}
              <span>
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {isSelf && (
                <div className="flex items-center ml-1">
                  {message.isSending ? (
                    <Loader2 size={11} className="animate-spin text-white/60 dark:text-zinc-500" />
                  ) : message.hasFailed ? (
                    <button
                      onClick={() => onRetry && onRetry(message)}
                      className="text-red-500 hover:text-red-600 transition-colors cursor-pointer flex items-center"
                      title="Sending failed. Click to retry."
                    >
                      <AlertCircle size={12} className="fill-red-500/10 animate-bounce" />
                    </button>
                  ) : (
                    <span
                      className={cn(
                        "text-[12px] font-bold select-none leading-none tracking-tight",
                        (message.reads?.length > 0 || message.status === "SEEN")
                          ? "text-[#34b7f1]"
                          : isMediaOnly
                          ? "text-white/70"
                          : "text-white/60 dark:text-zinc-400"
                      )}
                      title={
                        (message.reads?.length > 0 || message.status === "SEEN")
                          ? "Read"
                          : message.status === "DELIVERED"
                          ? "Delivered"
                          : "Sent"
                      }
                    >
                      {(message.reads?.length > 0 || message.status === "SEEN" || message.status === "DELIVERED") ? "✓✓" : "✓"}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {!isDeleted && message.reactions?.length > 0 && (
          <div className={cn("flex flex-wrap gap-1 mt-1", isSelf ? "pr-1 justify-end" : "pl-1")}>
            {Object.entries(
              message.reactions.reduce((acc: Record<string, number>, r: any) => {
                acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                return acc;
              }, {})
            ).map(([emoji, count]: [string, any]) => (
              <motion.div
                key={emoji}
                initial={{ scale: 0.75, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 450, damping: 20 }}
                onClick={() => onReact(message.id, emoji)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1f2c34] backdrop-blur-md text-zinc-700 dark:text-zinc-300 cursor-pointer select-none hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm"
              >
                <span className="text-[14px] leading-none select-none flex items-center justify-center">{emoji}</span>
                {count > 1 && <span className="text-[11px] font-bold leading-none text-zinc-500 dark:text-zinc-400 select-none">{count}</span>}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {!isSelf ? (
        <Avatar src={message.sender.avatarUrl} name={message.sender.name} size="sm" className="mt-0.5 flex-shrink-0" />
      ) : (
        <div className="w-1 flex-shrink-0" />
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 select-none">
          <div className="bg-white dark:bg-[#222e35] rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-[#e9edef]/10 dark:border-[#222e35]/30 text-center space-y-5 transform scale-100 transition-transform">
            <div className="flex justify-center">
              <div className="p-3 bg-red-500/10 dark:bg-red-500/5 text-red-500 rounded-2xl">
                <Trash2 size={24} />
              </div>
            </div>
            <div className="space-y-1.5 text-[#111b21] dark:text-[#e9edef]">
              <h3 className="text-lg font-bold">Delete Message?</h3>
              <p className="text-xs text-[#667781] dark:text-[#8696a0] leading-relaxed">
                Would you like to delete this message?
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleConfirmDelete("me")}
                className="w-full py-2.5"
              >
                Delete for Me
              </Button>
              {isSelf && (
                <Button
                  size="sm"
                  onClick={() => handleConfirmDelete("everyone")}
                  className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white border-none"
                >
                  Delete for Everyone
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteModal(false)}
                className="w-full py-2.5"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <MediaLightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        mediaUrl={lightboxUrl}
        mediaType={lightboxType}
        fileName={lightboxName}
      />
    </motion.div>
  );
}, (prevProps, nextProps) => {
  const prevMsg = prevProps.message;
  const nextMsg = nextProps.message;
  if (prevMsg.id !== nextMsg.id) return false;
  if (prevMsg.content !== nextMsg.content) return false;
  if (prevMsg.editedAt !== nextMsg.editedAt) return false;
  if (prevMsg.deletedAt !== nextMsg.deletedAt) return false;

  const prevReactions = prevMsg.reactions || [];
  const nextReactions = nextMsg.reactions || [];
  if (prevReactions.length !== nextReactions.length) return false;
  for (let i = 0; i < prevReactions.length; i++) {
    if (prevReactions[i].emoji !== nextReactions[i].emoji || prevReactions[i].userId !== nextReactions[i].userId) {
      return false;
    }
  }

  const prevReads = prevMsg.reads || [];
  const nextReads = nextMsg.reads || [];
  if (prevReads.length !== nextReads.length) return false;
  for (let i = 0; i < prevReads.length; i++) {
    if (prevReads[i].userId !== nextReads[i].userId || prevReads[i].readAt !== nextReads[i].readAt) {
      return false;
    }
  }
  return true;
});
