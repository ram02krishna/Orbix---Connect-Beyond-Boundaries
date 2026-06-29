"use client";

import * as React from "react";
import { useState, useRef } from "react";
import { X, Image as ImageIcon, Send, Type, Palette } from "lucide-react";
import { useStatusStore } from "@hooks/useStatusStore";
import api from "@lib/api";
import { toast } from "sonner";

interface StatusCreatorProps {
  onClose: () => void;
}

const GRADIENTS = [
  "bg-gradient-to-tr from-[#9c27b0] to-[#e040fb]", // Purple Glow
  "bg-gradient-to-tr from-[#ff5252] to-[#ff4081]", // Pink Passion
  "bg-gradient-to-tr from-[#06A0F8] to-[#05c46b]", // Emerald Glass
  "bg-gradient-to-tr from-[#ff9f43] to-[#ff6b6b]", // Sunset
  "bg-gradient-to-tr from-[#00bcd4] to-[#2196f3]", // Neon Ocean
  "bg-zinc-800", // Dark Minimal
];

export function StatusCreator({ onClose }: StatusCreatorProps) {
  const postStatus = useStatusStore((state) => state.postStatus);
  
  const [mode, setMode] = useState<"text" | "photo">("text");
  const [content, setContent] = useState("");
  const [gradientIndex, setGradientIndex] = useState(0);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handlePost = async () => {
    setUploading(true);
    try {
      if (mode === "text") {
        if (!content.trim()) {
          toast.error("Please type something to post");
          setUploading(false);
          return;
        }
        await postStatus({
          content: content.trim(),
          backgroundColor: GRADIENTS[gradientIndex],
        });
        toast.success("Status posted successfully!");
        onClose();
      } else {
        if (!imageFile) {
          toast.error("Please select an image");
          setUploading(false);
          return;
        }
        
        // Upload image to Cloudinary
        const formData = new FormData();
        formData.append("file", imageFile);

        const uploadRes = await api.post("/media/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const fileUrl = uploadRes.data.data.file.url;
        await postStatus({
          mediaUrl: fileUrl,
          mediaType: "IMAGE",
          caption: caption.trim() || undefined,
        });

        toast.success("Photo status posted!");
        onClose();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to post status update");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-[95%] sm:max-w-md rounded-3xl ios-glass-panel overflow-hidden border border-white/20 shadow-2xl flex flex-col bg-white/20 dark:bg-black/35 backdrop-blur-xl relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">Create Status Update</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-zinc-200/30 dark:hover:bg-zinc-800/30 text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toggle Mode */}
        <div className="flex p-2 border-b border-white/10 gap-2">
          <button
            onClick={() => setMode("text")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-200 ${
              mode === "text"
                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                : "text-zinc-650 dark:text-zinc-300 hover:bg-white/10"
            }`}
          >
            <Type size={14} />
            Text Update
          </button>
          <button
            onClick={() => setMode("photo")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-200 ${
              mode === "photo"
                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                : "text-zinc-650 dark:text-zinc-300 hover:bg-white/10"
            }`}
          >
            <ImageIcon size={14} />
            Photo Update
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-5 min-h-[220px] flex flex-col justify-center items-center">
          {mode === "text" ? (
            <div className="w-full h-full flex flex-col gap-4">
              {/* Text Area */}
              <div
                className={`w-full flex-1 min-h-[160px] rounded-2xl p-4 flex items-center justify-center text-center transition-all duration-300 relative ${GRADIENTS[gradientIndex]}`}
              >
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type a status update..."
                  maxLength={500}
                  className="w-full bg-transparent text-white text-lg font-bold placeholder-white/60 focus:outline-none resize-none text-center overflow-y-auto max-h-[140px]"
                />
              </div>

              {/* Color Selector */}
              <div className="flex items-center gap-2.5 justify-center py-1">
                <Palette size={14} className="text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {GRADIENTS.map((gradient, index) => (
                    <button
                      key={index}
                      onClick={() => setGradientIndex(index)}
                      className={`h-6 w-6 rounded-full border-2 transition-transform duration-200 cursor-pointer ${gradient} ${
                        gradientIndex === index
                          ? "border-blue-400 scale-110 shadow-md"
                          : "border-transparent hover:scale-105"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-4">
              {/* Photo Selector */}
              {!imagePreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full min-h-[160px] rounded-2xl border-2 border-dashed border-white/20 hover:border-blue-500/40 bg-white/5 dark:bg-black/10 flex flex-col items-center justify-center gap-2 cursor-pointer group transition-colors"
                >
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 dark:bg-blue-500/5 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                    <ImageIcon size={20} />
                  </div>
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Click to select photo</span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Supports JPG, PNG</span>
                </div>
              ) : (
                <div className="w-full relative rounded-2xl overflow-hidden aspect-video bg-black flex items-center justify-center group border border-white/10">
                  <img src={imagePreview} alt="Preview" className="max-h-[160px] w-full object-contain" />
                  <button
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/75 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />

              {/* Caption Input */}
              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption..."
                maxLength={100}
                className="w-full px-4 py-2.5 rounded-full ios-glass-input text-base sm:text-xs text-zinc-800 dark:text-white focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-white/10 flex gap-3 bg-white/5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-2xl text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-white/10 cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePost}
            disabled={uploading}
            className="flex-1 py-2.5 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200"
          >
            {uploading ? (
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send size={12} />
                Post Status
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
