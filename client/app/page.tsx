"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, Send, Mic, Video, Phone, Shield, Zap, Users, Hash, 
  Volume2, Lock, Download, Smartphone, Tablet, Laptop, 
  Share2, FileText, Check, Search, Bell, Settings, Plus, 
  Menu, X, ChevronDown, Play, Square, Smile, Paperclip, MapPin, 
  Calendar, ArrowRight, Fingerprint, Star, SendHorizontal, Sparkles, Activity,
  Camera, Reply, Trash2, Pencil, CircleDot, Globe, Cpu, Layers, GitBranch,
  Apple, MonitorSmartphone, ChevronRight
} from "lucide-react";

// Types for Mock Desktop App (matching actual schemas)
interface Chat {
  id: number;
  name: string;
  avatar: string;
  color: string;
  message: string;
  time: string;
  unread: number;
  online: boolean;
  typing: boolean;
  type: "DIRECT" | "GROUP";
  isPinned?: boolean;
}

interface Message {
  id: string;
  sender: string;
  text: string;
  time: string;
  self: boolean;
  isEdited?: boolean;
  isStarred?: boolean;
  media?: { type: "IMAGE" | "VIDEO" | "AUDIO" | "FILE"; value: string; duration?: string };
  reactions?: { emoji: string; count: number }[];
}

interface StatusStory {
  id: number;
  userName: string;
  avatar: string;
  color: string;
  count: number;
  viewedCount: number;
  stories: { type: "text" | "image"; content: string; bg?: string }[];
}

export default function LandingPage() {
  // Navigation & Interactive States
  const [activeNav, setActiveNav] = useState("Features");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pricingPeriod, setPricingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  // Scroll listener for sticky navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Mouse Glow Position
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  // --- INTERACTIVE DESKTOP MOCKUP STATES ---
  const [chats, setChats] = useState<Chat[]>([
    { id: 1, name: "Rahul", avatar: "R", color: "from-[#06A0F8] to-[#00D8E3]", message: "Are we still meeting for dinner tonight?", time: "12:45 PM", unread: 0, online: true, typing: false, type: "DIRECT", isPinned: true },
    { id: 2, name: "Pooja", avatar: "P", color: "from-[#FF4F8C] to-[#6D5DF6]", message: "Send me those photos from the trip!", time: "11:30 AM", unread: 2, online: true, typing: true, type: "DIRECT", isPinned: true },
    { id: 3, name: "College Friends", avatar: "CF", color: "from-[#00D4FF] to-[#4F8CFF]", message: "Vikram: Anyone up for a movie this weekend?", time: "10:15 AM", unread: 5, online: false, typing: false, type: "GROUP" },
    { id: 4, name: "Family Group", avatar: "FG", color: "from-[#FF9F43] to-[#FF4F8C]", message: "Aarav: Happy birthday mom! 🎉", time: "9:00 AM", unread: 0, online: true, typing: false, type: "GROUP" },
  ]);
  const [selectedChatId, setSelectedChatId] = useState(1);
  const [filterTab, setFilterTab] = useState<"all" | "pinned" | "groups">("all");
  const [activeCall, setActiveCall] = useState<{ active: boolean; type: "voice" | "video" | null }>({ active: false, type: null });
  const [callDuration, setCallDuration] = useState(0);

  // Calls duration counter
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeCall.active) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [activeCall.active]);

  const [mockMessages, setMockMessages] = useState<Record<number, Message[]>>({
    1: [
      { id: "1", sender: "Rahul", text: "Hey, are you free this weekend?", time: "12:40 PM", self: false },
      { id: "2", sender: "You", text: "Yes, I am! What's the plan?", time: "12:42 PM", self: true },
      { id: "3", sender: "Rahul", text: "Are we still meeting for dinner tonight?", time: "12:45 PM", self: false },
    ],
    2: [
      { id: "1", sender: "Pooja", text: "That trip was amazing!", time: "11:20 AM", self: false },
      { id: "2", sender: "Pooja", text: "Send me those photos from the trip!", time: "11:30 AM", self: false },
    ],
    3: [
      { id: "1", sender: "Vikram", text: "Hey guys, anyone up for a movie this weekend?", time: "10:15 AM", self: false },
    ],
    4: [
      { id: "1", sender: "Aarav", text: "Happy birthday mom! 🎉", time: "9:00 AM", self: false },
    ]
  });

  const [desktopInput, setDesktopInput] = useState("");
  const handleSendDesktopMessage = () => {
    if (!desktopInput.trim()) return;
    const newMessage: Message = {
      id: String(Date.now()),
      sender: "You",
      text: desktopInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      self: true
    };
    setMockMessages({
      ...mockMessages,
      [selectedChatId]: [...(mockMessages[selectedChatId] || []), newMessage]
    });
    setDesktopInput("");

    // Simulate typing indicator and response from recipient
    const chatOwner = chats.find(c => c.id === selectedChatId);
    if (chatOwner) {
      setTimeout(() => {
        // Toggle typing
        setChats(prev => prev.map(c => c.id === selectedChatId ? { ...c, typing: true } : c));
        
        setTimeout(() => {
          // Add response message
          const responses: Record<number, string> = {
            1: "Sounds good, I'll be there!",
            2: "Yeah, let me send them over now.",
            3: "I'm in! What time?",
            4: "Thanks Aarav!"
          };
          const responseMsg: Message = {
            id: String(Date.now() + 1),
            sender: chatOwner.name.split(" ")[0],
            text: responses[selectedChatId] || "Got it!",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            self: false
          };
          setMockMessages(prev => ({
            ...prev,
            [selectedChatId]: [...(prev[selectedChatId] || []), responseMsg]
          }));
          setChats(prev => prev.map(c => c.id === selectedChatId ? { ...c, typing: false, message: responseMsg.text } : c));
        }, 1500);
      }, 800);
    }
  };

  // --- INTERACTIVE CHAT EXPERIENCE SANDBOX STATES ---
  const [sandboxMessages, setSandboxMessages] = useState<Message[]>([
    { id: "s1", sender: "Priya (Marketing)", text: "Hey team, this new communication pipeline is incredibly fast! ⚡", time: "1:22 PM", self: false, reactions: [{ emoji: "👍", count: 3 }, { emoji: "🔥", count: 2 }] },
    { id: "s2", sender: "Aaditya (Design Lead)", text: "Agreed, the voice message quality is crystal clear. Check out the audio clip:", time: "1:23 PM", self: false },
    { id: "s3", sender: "Aaditya (Design Lead)", text: "", time: "1:23 PM", self: false, media: { type: "AUDIO", value: "Voice Note (0:12)", duration: "0:12" } },
  ]);
  const [voicePlaying, setVoicePlaying] = useState(false);
  const [voiceProgress, setVoiceProgress] = useState(0);
  const [sandboxInput, setSandboxInput] = useState("");
  const [sandboxTyping, setSandboxTyping] = useState(false);
  const [starredMessages, setStarredMessages] = useState<string[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [showStarredDrawer, setShowStarredDrawer] = useState(false);

  // Voice player animation simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (voicePlaying) {
      interval = setInterval(() => {
        setVoiceProgress((prev) => {
          if (prev >= 100) {
            setVoicePlaying(false);
            return 0;
          }
          return prev + 8;
        });
      }, 300);
    }
    return () => clearInterval(interval);
  }, [voicePlaying]);

  const handleSendSandboxMessage = () => {
    if (!sandboxInput.trim()) return;
    const newMsg: Message = {
      id: String(Date.now()),
      sender: "You",
      text: sandboxInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      self: true
    };
    setSandboxMessages(prev => [...prev, newMsg]);
    setSandboxInput("");

    // Simulate reply
    setSandboxTyping(true);
    setTimeout(() => {
      setSandboxTyping(false);
      const replyMsg: Message = {
        id: String(Date.now() + 1),
        sender: "Priya (Marketing)",
        text: "Wow! Your message was delivered instantly. Check the blue checkmarks! 🚀",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        self: false,
        reactions: [{ emoji: "❤️", count: 1 }]
      };
      setSandboxMessages(prev => [...prev, replyMsg]);
    }, 1800);
  };

  const handleEmojiClick = (msgId: string, emoji: string) => {
    setSandboxMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        const reactions = m.reactions ? [...m.reactions] : [];
        const index = reactions.findIndex(r => r.emoji === emoji);
        if (index > -1) {
          reactions[index] = { ...reactions[index], count: reactions[index].count + 1 };
        } else {
          reactions.push({ emoji, count: 1 });
        }
        return { ...m, reactions };
      }
      return m;
    }));
  };

  const handleToggleStar = (msgId: string) => {
    setStarredMessages(prev => {
      if (prev.includes(msgId)) {
        return prev.filter(id => id !== msgId);
      }
      return [...prev, msgId];
    });
    setSandboxMessages(prev => prev.map(m => m.id === msgId ? { ...m, isStarred: !m.isStarred } : m));
  };

  const handleStartEdit = (msgId: string, text: string) => {
    setEditingMessageId(msgId);
    setEditingText(text);
  };

  const handleSaveEdit = (msgId: string) => {
    if (!editingText.trim()) return;
    setSandboxMessages(prev => prev.map(m => m.id === msgId ? { ...m, text: editingText, isEdited: true } : m));
    setEditingMessageId(null);
  };

  const handleDeleteMessage = (msgId: string) => {
    setSandboxMessages(prev => prev.filter(m => m.id !== msgId));
    setStarredMessages(prev => prev.filter(id => id !== msgId));
  };

  // --- MOCK STATUS/STORIES DATA ---
  const [activeStoryGroup, setActiveStoryGroup] = useState<StatusStory | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);

  const statusStories: StatusStory[] = [
    {
      id: 1,
      userName: "Pooja (Design)",
      avatar: "PD",
      color: "from-[#FF4F8C] to-[#6D5DF6]",
      count: 3,
      viewedCount: 1,
      stories: [
        { type: "text", content: "Working on the new Orbix dark mode dashboard today! 💻", bg: "bg-gradient-to-tr from-blue-600 to-blue-800" },
        { type: "text", content: "Interactive micro-animations are looking extremely smooth.", bg: "bg-gradient-to-tr from-[#6D5DF6] to-[#4F8CFF]" },
        { type: "text", content: "Coffee break! ☕✨", bg: "bg-gradient-to-tr from-rose-600 to-amber-600" }
      ]
    },
    {
      id: 2,
      userName: "Rahul",
      avatar: "KT",
      color: "from-[#06A0F8] to-[#00D8E3]",
      count: 2,
      viewedCount: 0,
      stories: [
        { type: "text", content: "E2E keys successfully tested over WebSockets. Speed is down to 12ms!", bg: "bg-gradient-to-br from-zinc-800 to-zinc-950" },
        { type: "text", content: "Time to merge to production. 🚀", bg: "bg-gradient-to-tr from-[#06A0F8] to-blue-950" }
      ]
    }
  ];

  const handlePlayStories = (group: StatusStory) => {
    setActiveStoryGroup(group);
    setActiveStoryIndex(0);
    setStoryProgress(0);
  };

  // Stories progress simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeStoryGroup) {
      interval = setInterval(() => {
        setStoryProgress(prev => {
          if (prev >= 100) {
            if (activeStoryIndex < activeStoryGroup.stories.length - 1) {
              setActiveStoryIndex(idx => idx + 1);
              return 0;
            } else {
              setActiveStoryGroup(null);
              return 0;
            }
          }
          return prev + 5;
        });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [activeStoryGroup, activeStoryIndex]);

  // --- INTERACTIVE COLLABORATION PANEL STATES ---
  const [uploadedFiles, setUploadedFiles] = useState([
    { name: "UI_Assets_Standard.pdf", size: "12.4 MB", type: "PDF", date: "Today" },
    { name: "Screen_Layouts_V2.png", size: "4.1 MB", type: "IMAGE", date: "Yesterday" },
  ]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const startMockUpload = () => {
    setUploadProgress(0);
  };

  useEffect(() => {
    if (uploadProgress !== null && uploadProgress < 100) {
      const timer = setTimeout(() => {
        setUploadProgress(prev => (prev !== null ? prev + 10 : 0));
      }, 150);
      return () => clearTimeout(timer);
    } else if (uploadProgress === 100) {
      const timer = setTimeout(() => {
        setUploadedFiles(prev => [
          { name: "Interactive_Spec_Sheet.key", size: "18.6 MB", type: "FILE", date: "Just Now" },
          ...prev
        ]);
        setUploadProgress(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [uploadProgress]);

  // --- SECURITY SCAN STATES ---
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);

  const triggerSecurityScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanComplete(false);
    setTimeout(() => {
      setIsScanning(false);
      setScanComplete(true);
    }, 2500);
  };

  // --- ENCRYPTION SANDBOX STATES ---
  const [encryptInput, setEncryptInput] = useState("Namaste Orbix E2E!");
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [encryptedOutput, setEncryptedOutput] = useState("");

  const generateFakeHash = (text: string): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    let result = "";
    for (let i = 0; i < text.length * 2; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return `AES256::${btoa(text).split("").reverse().join("").substring(0, 8)}...${result.substring(0, 24)}==${btoa(text).substring(0, 6)}`;
  };

  const handleEncryptToggle = () => {
    if (isEncrypting) return;
    setIsEncrypting(true);
    setTimeout(() => {
      if (!isEncrypted) {
        setEncryptedOutput(generateFakeHash(encryptInput));
        setIsEncrypted(true);
      } else {
        setEncryptedOutput("");
        setIsEncrypted(false);
      }
      setIsEncrypting(false);
    }, 1000);
  };

  // --- TESTIMONIAL CAROUSEL STATES ---
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const testimonials = [
    {
      name: "Aarav Mehta",
      role: "VP of Engineering at Razorpay",
      quote: "Orbix is an absolute masterpiece of software design. The speed of message transmission and the layout of channels make communication feel effortless. Our teams have saved countless hours.",
      rating: 5,
      avatar: "AM",
      gradient: "from-[#06A0F8] to-[#00D8E3]"
    },
    {
      name: "Ananya Sen",
      role: "Lead Product Designer at Zoho",
      quote: "As a designer, I am incredibly picky about the tools we use. Orbix feels like it was engineered by Apple and designed by Stripe. The animations are buttery smooth, and the UX is spectacular.",
      rating: 5,
      avatar: "AS",
      gradient: "from-[#FF4F8C] to-[#6D5DF6]"
    },
    {
      name: "Rohan Murthy",
      role: "Co-Founder of CRED",
      quote: "We migrated our entire developer community from Slack/Discord to Orbix, and the feedback has been overwhelmingly positive. The security protocols and clean bento architecture are top tier.",
      rating: 5,
      avatar: "RM",
      gradient: "from-[#00D4FF] to-[#4F8CFF]"
    }
  ];

  // Uptime/Counts animation simulation
  const [usersCount, setUsersCount] = useState(1.2);
  const [countriesCount, setCountriesCount] = useState(80);
  const [teamsCount, setTeamsCount] = useState(8.5);

  useEffect(() => {
    const interval = setInterval(() => {
      setUsersCount(prev => (prev < 2.4 ? +(prev + 0.1).toFixed(1) : 2.4));
      setCountriesCount(prev => (prev < 120 ? prev + 2 : 120));
      setTeamsCount(prev => (prev < 15.0 ? +(prev + 0.5).toFixed(1) : 15.0));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const filteredChats = chats.filter(chat => {
    if (filterTab === "pinned") return chat.isPinned;
    if (filterTab === "groups") return chat.type === "GROUP";
    return true;
  });

  return (
    <div className="min-h-screen bg-[#eff3f1] dark:bg-[#000000] text-zinc-900 dark:text-[#fafafa] selection:bg-[#06A0F8]/30 selection:text-zinc-900 dark:selection:text-white font-sans overflow-x-hidden relative transition-colors duration-300">
      
      {/* Enhanced Dark Mode Aurora Background */}
      <div className="absolute top-0 inset-x-0 h-[1200px] overflow-hidden pointer-events-none z-0">
        {/* Light mode blobs */}
        <div className="dark:hidden absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-[#06A0F8]/15 via-blue-800/5 to-transparent blur-[120px] animate-pulse-slow" />
        <div className="dark:hidden absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-bl from-[#00D8E3]/10 via-[#06A0F8]/5 to-transparent blur-[140px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
        {/* Dark mode enhanced blobs */}
        <div className="hidden dark:block dark-blob-1 absolute top-[-15%] left-[-5%] w-[55vw] h-[55vw] rounded-full blur-[130px]" />
        <div className="hidden dark:block dark-blob-2 absolute top-[25%] right-[-8%] w-[45vw] h-[45vw] rounded-full blur-[150px]" />
        <div className="hidden dark:block dark-blob-3 absolute top-[5%] left-[40%] w-[30vw] h-[30vw] rounded-full blur-[100px]" />
        {/* Dark mode floating particles */}
        <div className="hidden dark:block dark-particle" style={{ left: "15%", top: "60%", animationDelay: "0s" }} />
        <div className="hidden dark:block dark-particle" style={{ left: "35%", top: "75%", animationDelay: "1.5s" }} />
        <div className="hidden dark:block dark-particle" style={{ left: "60%", top: "55%", animationDelay: "3s" }} />
        <div className="hidden dark:block dark-particle" style={{ left: "80%", top: "70%", animationDelay: "4.5s" }} />
        <div className="hidden dark:block dark-particle" style={{ left: "50%", top: "40%", animationDelay: "2s" }} />
      </div>

      {/* --- SECTION 1: STICKY NAV SYSTEM --- */}
      <nav 
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled 
            ? "ios-glass-header py-0 dark:border-[#06A0F8]/10 dark:shadow-[0_1px_0_rgba(6, 160, 248,0.06)]" 
            : "bg-transparent border-transparent py-2"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <img 
              src="/logo.png" 
              alt="Orbix Logo" 
              className="w-12 h-12 object-contain drop-shadow-md group-hover:scale-105 transition-transform" 
            />
            <span className="font-semibold text-xl tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-500 dark:from-white dark:via-white dark:to-[#8696a0] bg-clip-text text-transparent">
              Orbix
            </span>
          </a>

          {/* Navigation links - Desktop */}
          <div className="hidden md:flex items-center gap-1 bg-zinc-200/40 dark:bg-[#0A0A0A]/80 border border-zinc-200/60 dark:border-white/[0.07] p-1.5 rounded-full backdrop-blur-md">
            {["Features", "Solutions", "Communities", "Security", "Pricing", "Developers"].map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase()}`}
                onClick={() => setActiveNav(link)}
                className={`relative px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeNav === link ? "text-zinc-900 dark:text-white font-semibold" : "text-zinc-650 dark:text-[#8696a0] hover:text-zinc-950 dark:hover:text-white"
                }`}
              >
                {activeNav === link && (
                  <motion.div 
                    layoutId="activeNavBackground"
                    className="absolute inset-0 bg-white/80 dark:bg-white/[0.08] border border-zinc-200/50 dark:border-white/[0.08] rounded-full z-0"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{link}</span>
              </a>
            ))}
          </div>

          {/* Buttons - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="px-5 py-2.5 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.08] rounded-xl text-sm font-semibold transition-all border border-transparent hover:border-zinc-200 dark:hover:border-white/[0.05]">
              Sign In
            </Link>
            <Link 
              href="/signup" 
              className="relative px-5 py-2.5 bg-gradient-to-tr from-[#06A0F8] to-[#00D8E3] hover:from-[#1661F9] hover:to-[#0ea5e9] rounded-xl font-bold text-white shadow-lg shadow-[#06A0F8]/30 hover:shadow-[#06A0F8]/50 transition-all flex items-center gap-2 group hover:scale-[1.02] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer-move_1.5s_infinite]" />
              <span className="relative z-10">Start Messaging</span>
              <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-zinc-650 dark:text-[#8696a0] hover:text-zinc-900 dark:hover:text-white transition-colors animate-fade-in"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-20 inset-x-0 bg-white/95 dark:bg-[#050505]/98 border-b border-zinc-200/80 dark:border-[#06A0F8]/10 py-6 px-6 flex flex-col gap-4 backdrop-blur-xl md:hidden shadow-lg dark:shadow-2xl"
            >
              {["Features", "Solutions", "Communities", "Security", "Pricing", "Developers"].map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase()}`}
                  onClick={() => {
                    setActiveNav(link);
                    setMobileMenuOpen(false);
                  }}
                  className="text-lg font-medium text-zinc-650 dark:text-[#8696a0] hover:text-zinc-950 dark:hover:text-white py-2 border-b border-zinc-200/30 dark:border-white/[0.03]"
                >
                  {link}
                </a>
              ))}
              <div className="flex flex-col gap-4 pt-4">
                <Link href="/login" className="bg-zinc-100/50 hover:bg-zinc-200/80 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] text-center text-zinc-900 dark:text-white py-3 rounded-xl font-semibold transition-colors border border-zinc-200/80 dark:border-white/[0.08]">
                  Sign In
                </Link>
                <Link href="/signup" className="bg-gradient-to-tr from-[#06A0F8] to-[#00D8E3] py-3 px-6 rounded-xl text-center font-bold shadow-lg shadow-[#06A0F8]/25 text-white active:scale-95 transition-transform">
                  Start Messaging
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* --- SECTION 2: HERO SECTION --- */}
      <section className="relative pt-24 pb-12 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center z-10 min-h-[85vh]">
        {/* Left Side: Headlines */}
        <div className="lg:col-span-5 flex flex-col gap-8 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#06A0F8]/10 border border-[#06A0F8]/20 dark:border-[#06A0F8]/30 rounded-full w-fit">
            <Sparkles className="w-4 h-4 text-[#06A0F8]" />
            <span className="text-sm font-semibold uppercase tracking-[0.15em] text-[#06A0F8]">
              Orbix Web Client
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-[72px] font-bold tracking-tight leading-[1.06] text-zinc-900 dark:text-white dark:drop-shadow-[0_0_20px_rgba(255,255,255,0.25)]">
            Where Every <br />
            <span className="relative inline-block">
              <span className="absolute inset-0 bg-gradient-to-r from-[#06A0F8] via-[#00D8E3] to-[#5D32FA] filter blur-[30px] opacity-40 dark:opacity-60 animate-pulse-slow"></span>
              <span className="relative bg-gradient-to-r from-[#06A0F8] via-[#00D8E3] to-[#5D32FA] bg-clip-text text-transparent">
                Conversation
              </span>
            </span> <br />
            Happens.
          </h1>

          <p className="text-lg md:text-xl text-zinc-650 dark:text-zinc-300 leading-relaxed max-w-lg">
            Orbix Web brings private encrypted chats, collaborative groups, WebRTC voice/video calls, and swipable status sharing together in one beautifully refined platform.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#06A0F8] via-[#00D8E3] to-[#5D32FA] rounded-xl filter blur-[15px] opacity-0 group-hover:opacity-70 dark:group-hover:opacity-100 transition-opacity duration-500"></div>
              <Link 
                href="/signup" 
                className="relative overflow-hidden px-8 py-4 bg-gradient-to-tr from-[#06A0F8] via-[#00D8E3] to-[#5D32FA] hover:scale-[1.02] rounded-xl font-bold shadow-xl shadow-[#06A0F8]/30 text-white transition-all flex items-center gap-2 group-hover:shadow-none"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer-move_1.5s_infinite]" />
                <span className="relative z-10">Start Messaging Free</span>
                <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <Link 
              href="/login" 
              className="group relative px-8 py-4 bg-white/50 hover:bg-white/80 dark:bg-[#0A0A0A]/40 dark:hover:bg-[#0A0A0A]/60 backdrop-blur-md border border-zinc-300/40 dark:border-white/[0.08] hover:dark:border-white/[0.15] rounded-xl font-semibold transition-all flex items-center gap-2 text-zinc-900 dark:text-white overflow-hidden shadow-sm hover:shadow-md dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer-move_1.5s_infinite]" />
              <span className="relative z-10">Sign In</span>
              <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Quick Stats banner inside hero */}
          <div className="grid grid-cols-3 gap-6 border-t border-zinc-200/80 dark:border-[#06A0F8]/15 pt-8 mt-4">
            <div>
              <div className="text-xl font-bold text-zinc-900 dark:text-[#00D8E3]">E2E</div>
              <div className="text-xs text-zinc-550 dark:text-[#8696a0] uppercase tracking-wider mt-1">Encrypted</div>
            </div>
            <div>
              <div className="text-xl font-bold text-zinc-900 dark:text-[#00D8E3]">12ms</div>
              <div className="text-xs text-zinc-550 dark:text-[#8696a0] uppercase tracking-wider mt-1">Latency</div>
            </div>
            <div>
              <div className="text-xl font-bold text-zinc-900 dark:text-[#00D8E3]">100%</div>
              <div className="text-xs text-zinc-550 dark:text-[#8696a0] uppercase tracking-wider mt-1">Data Localized</div>
            </div>
          </div>
        </div>

        {/* Right Side: Exact Desktop Messaging Application mockup */}
        <div className="lg:col-span-7 w-full h-[600px] relative">
          {/* Decorative Back Glowing Circle */}
          <div className="absolute inset-0 bg-[#06A0F8]/20 dark:bg-[#06A0F8]/25 filter blur-[100px] rounded-3xl -z-10 translate-x-8 translate-y-8 animate-pulse-slow" />
          <div className="hidden dark:block absolute inset-0 bg-[#5D32FA]/15 filter blur-[120px] rounded-3xl -z-10 -translate-x-12 translate-y-12 animate-pulse-slow" style={{ animationDelay: "1s" }} />
          
          {/* Main App Frame (Glassmorphic Window matching actual ChatLayout) */}
          <div className="w-full h-full rounded-2xl ios-glass-container border border-zinc-200/80 dark:border-[#06A0F8]/12 shadow-2xl dark:shadow-[0_25px_80px_rgba(0,0,0,0.7),0_0_40px_rgba(6, 160, 248,0.05)] flex overflow-hidden relative">
            
            {/* 1. App Sidebar - Small Utility column */}
            <div className="hidden sm:flex w-16 bg-zinc-100/90 dark:bg-[#0A0A0A]/90 border-r border-zinc-200/50 dark:border-white/[0.06] py-6 flex-col items-center justify-between flex-shrink-0">
              <div className="flex flex-col gap-6 items-center">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#06A0F8] to-[#00D8E3] flex items-center justify-center shadow-md">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                
                {/* Active indicator bar */}
                <div className="w-8 h-[1px] bg-zinc-300 dark:bg-white/[0.08]" />
                
                <button className="p-2.5 rounded-xl bg-zinc-200 dark:bg-white/[0.06] text-zinc-900 dark:text-white">
                  <MessageSquare className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handlePlayStories(statusStories[0])}
                  className="p-2.5 rounded-xl text-zinc-550 dark:text-[#8696a0] hover:text-zinc-900 dark:hover:text-white transition-colors hover:bg-zinc-200/50 dark:hover:bg-white/[0.03] relative"
                >
                  <CircleDot className="w-5 h-5" />
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#00D8E3] animate-pulse" />
                </button>
                <button className="p-2.5 rounded-xl text-zinc-550 dark:text-[#8696a0] hover:text-zinc-900 dark:hover:text-white transition-colors hover:bg-zinc-200/50 dark:hover:bg-white/[0.03]">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-2.5 rounded-xl text-zinc-550 dark:text-[#8696a0] hover:text-zinc-900 dark:hover:text-white transition-colors hover:bg-zinc-200/50 dark:hover:bg-white/[0.03]">
                  <Settings className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-5 items-center">
                <button className="p-2.5 rounded-xl text-zinc-550 dark:text-[#8696a0] hover:text-white transition-colors relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#34b7f1]" />
                </button>
                {/* User avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00D8E3] to-blue-950 flex items-center justify-center font-bold text-xs shadow-inner text-white">
                  ME
                </div>
              </div>
            </div>

            {/* 2. Chats Sidebar - List pane */}
            <div className="hidden md:flex w-64 bg-zinc-50/50 dark:bg-[#0A0A0A]/50 border-r border-zinc-200/50 dark:border-white/[0.06] flex-col flex-shrink-0">
              
              {/* Search Bar */}
              <div className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500 dark:text-[#8696a0]" />
                  <input 
                    type="text" 
                    placeholder="Search chats..." 
                    className="w-full bg-zinc-200/40 dark:bg-white/[0.04] border border-zinc-200/60 dark:border-white/[0.06] rounded-lg py-1.5 pl-9 pr-4 text-xs text-zinc-900 dark:text-white placeholder-zinc-550 dark:placeholder-[#8696a0] focus:outline-none focus:border-[#06A0F8]/50 transition-colors"
                  />
                </div>
              </div>

              {/* Filter Tabs (matching actual Sidebar tabs) */}
              <div className="px-4 pb-2 flex gap-1 border-b border-zinc-200/50 dark:border-white/[0.04]">
                {(["all", "pinned", "groups"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilterTab(tab)}
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      filterTab === tab 
                        ? "bg-[#06A0F8]/10 dark:bg-[#06A0F8]/15 text-[#06A0F8] border border-[#06A0F8]/20" 
                        : "text-zinc-550 dark:text-[#8696a0] hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Chats List */}
              <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
                {filteredChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChatId(chat.id)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left relative cursor-pointer ${
                      selectedChatId === chat.id 
                        ? "bg-white dark:bg-[#06A0F8]/15 border border-zinc-200/60 dark:border-[#06A0F8]/20 shadow-md shadow-blue-500/5 text-zinc-950 dark:text-white" 
                        : "hover:bg-zinc-200/30 dark:hover:bg-white/[0.02] border border-transparent"
                    }`}
                  >
                    {/* Avatar with Status ring */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${chat.color} flex items-center justify-center font-semibold text-xs text-white`}>
                        {chat.avatar}
                      </div>
                      
                      {chat.online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#00D8E3] border-2 border-white dark:border-[#0A0A0A]" />
                      )}
                    </div>

                    {/* Chat Text Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h4 className="text-xs font-semibold text-zinc-900 dark:text-white truncate flex items-center gap-1">
                          {chat.name}
                          {chat.isPinned && <span className="text-xs">📌</span>}
                        </h4>
                        <span className="text-xs text-zinc-500 dark:text-[#8696a0]">{chat.time}</span>
                      </div>
                      <p className="text-sm text-zinc-550 dark:text-[#8696a0] truncate">
                        {chat.typing ? (
                          <span className="text-[#06A0F8] flex items-center gap-1 font-bold">
                            typing...
                          </span>
                        ) : (
                          chat.message
                        )}
                      </p>
                    </div>

                    {/* Unread badge */}
                    {chat.unread > 0 && (
                      <span className="flex-shrink-0 min-w-4 h-4 rounded-full bg-[#06A0F8] text-xs font-bold flex items-center justify-center px-1 text-white">
                        {chat.unread}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Status Section in Sidebar */}
              <div className="p-4 border-t border-zinc-200/50 dark:border-white/[0.06] bg-zinc-200/10 dark:bg-[#0A0A0A]/30">
                <div className="text-xs font-bold text-zinc-550 dark:text-[#8696a0] uppercase tracking-wider mb-2">Recent Status Update</div>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {statusStories.map((grp) => (
                    <div 
                      key={grp.id} 
                      onClick={() => handlePlayStories(grp)}
                      className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0 relative"
                    >
                      <div className="relative w-10 h-10">
                        {/* Circular ring indicating status update */}
                        <div className="absolute inset-0 rounded-full border-2 border-[#00D8E3] p-0.5 animate-pulse" />
                        <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#06A0F8] to-blue-950 flex items-center justify-center text-xs font-bold text-white">
                          {grp.avatar}
                        </div>
                      </div>
                      <span className="text-xs text-zinc-700 dark:text-[#fafafa]">{grp.userName.split(" ")[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Main Chat View */}
            <div className="flex-1 flex flex-col bg-zinc-100/30 dark:bg-[#0A0A0A]/20 relative">
              
              {/* Chat Header */}
              <div className="h-16 px-6 border-b border-zinc-200/50 dark:border-white/[0.06] flex items-center justify-between bg-zinc-50/80 dark:bg-[#0A0A0A]/45">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#06A0F8] to-[#00D8E3] flex items-center justify-center font-bold text-xs text-white">
                    {chats.find(c => c.id === selectedChatId)?.avatar || "CF"}
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-900 dark:text-white">
                      {chats.find(c => c.id === selectedChatId)?.name}
                    </h3>
                    <p className="text-xs text-[#00D8E3] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00D8E3]" />
                      Online
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setActiveCall({ active: true, type: "voice" })}
                    className="p-2 text-zinc-550 dark:text-[#8696a0] hover:text-[#06A0F8] dark:hover:text-white rounded-lg hover:bg-zinc-200/50 dark:hover:bg-white/[0.04]"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setActiveCall({ active: true, type: "video" })}
                    className="p-2 text-zinc-550 dark:text-[#8696a0] hover:text-[#06A0F8] dark:hover:text-white rounded-lg hover:bg-zinc-200/50 dark:hover:bg-white/[0.04]"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                  <div className="w-[1px] h-4 bg-zinc-300 dark:bg-white/[0.08] mx-2" />
                  <button className="p-2 text-zinc-550 dark:text-[#8696a0] hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-[#06A0F8]/10">
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Message Transcript Area */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 flex flex-col justify-end">
                {mockMessages[selectedChatId]?.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col max-w-[70%] ${msg.self ? "self-end items-end" : "self-start items-start"}`}
                  >
                    <span className="text-xs text-zinc-500 dark:text-[#8696a0] mb-1 font-semibold">{msg.sender}</span>
                    <div 
                      className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm relative group ${
                        msg.self 
                          ? "bg-[#06A0F8] text-white rounded-tr-none" 
                          : "bg-white dark:bg-[#222e35]/30 text-zinc-900 dark:text-white border border-zinc-200/50 dark:border-white/[0.05] rounded-tl-none"
                      }`}
                      style={{
                        borderRadius: msg.self ? "16px 16px 0px 16px" : "16px 16px 16px 0px"
                      }}
                    >
                      {msg.text}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs text-zinc-500 dark:text-[#8696a0]">{msg.time}</span>
                      {msg.self && (
                        <span className="text-sm font-bold select-none leading-none tracking-tight text-[#34b7f1] ml-0.5">✓✓</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-zinc-200/50 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-[#0A0A0A]/45">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSendDesktopMessage(); }}
                  className="relative flex items-center"
                >
                  <button type="button" className="p-2 text-zinc-550 dark:text-[#8696a0] hover:text-[#06A0F8] dark:hover:text-white transition-colors mr-1">
                    <Paperclip className="w-4.5 h-4.5" />
                  </button>
                  <input 
                    type="text" 
                    value={desktopInput}
                    onChange={(e) => setDesktopInput(e.target.value)}
                    placeholder={`Message ${chats.find(c => c.id === selectedChatId)?.name.split(" ")[0]}...`}
                    className="flex-1 bg-zinc-200/40 dark:bg-white/[0.04] border border-zinc-200/60 dark:border-white/[0.06] rounded-xl py-2 px-4 text-xs text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-[#8696a0] focus:outline-none focus:border-[#06A0F8]/50 transition-colors"
                  />
                  <button 
                    type="submit"
                    className="ml-2 w-8 h-8 rounded-lg bg-[#06A0F8] hover:bg-[#06A0F8]/95 flex items-center justify-center text-white transition-colors"
                  >
                    <SendHorizontal className="w-4 h-4" />
                  </button>
                </form>
              </div>

              {/* Call Overlay widget */}
              <AnimatePresence>
                {activeCall.active && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute inset-0 bg-white/95 dark:bg-[#0A0A0A]/95 z-20 flex flex-col items-center justify-center p-6"
                  >
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#06A0F8] to-[#00D8E3] flex items-center justify-center text-2xl font-bold mb-4 shadow-xl shadow-[#06A0F8]/20 text-white">
                        {chats.find(c => c.id === selectedChatId)?.avatar}
                      </div>
                      <span className="absolute bottom-4 right-2 w-5 h-5 rounded-full bg-[#00D8E3] border-4 border-white dark:border-[#0A0A0A] animate-ping" />
                    </div>

                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
                      {chats.find(c => c.id === selectedChatId)?.name}
                    </h3>
                    <p className="text-xs text-[#06A0F8] mb-8 font-medium tracking-wide uppercase">
                      {activeCall.type === "voice" ? "HD Voice Call Active" : "HD Video Call Active"}
                    </p>

                    {/* Simulating call audio visualizer waveforms */}
                    <div className="flex gap-1.5 items-end justify-center h-12 mb-12">
                      {[6, 12, 18, 10, 24, 16, 32, 20, 28, 8, 14, 10].map((h, i) => (
                        <motion.div 
                          key={i}
                          className="w-1 bg-[#06A0F8] rounded-full"
                          animate={{ height: [h, h * 0.3, h] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.05, ease: "easeInOut" }}
                        />
                      ))}
                    </div>

                    <div className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-white mb-10">
                      {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, "0")}
                    </div>

                    <button 
                      onClick={() => setActiveCall({ active: false, type: null })}
                      className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 cursor-pointer"
                    >
                      <Square className="w-5 h-5 fill-white text-white" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>

          </div>
        </div>
      </section>

      {/* --- SECTION 3: SCALE & TRUST (CONSUMER FOCUSED) --- */}
      <section className="py-14 bg-zinc-100/50 dark:bg-[#050505] relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 text-center md:text-left items-center">
          <div>
            <span className="text-xs font-bold text-[#06A0F8] tracking-wider uppercase">Scale & Trust</span>
            <h2 className="text-2xl font-bold mt-2 text-zinc-900 dark:text-white">Connecting all of India</h2>
          </div>
          
          <div className="flex flex-col items-center md:items-start">
            <span className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-[#00D8E3] mb-2 tabular-nums">
              {usersCount} Crore+
            </span>
            <span className="text-xs text-zinc-550 dark:text-[#8696a0] uppercase font-semibold tracking-wider">Active Users</span>
          </div>

          <div className="flex flex-col items-center md:items-start">
            <span className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-[#00D8E3] mb-2 tabular-nums">
              10M+
            </span>
            <span className="text-xs text-zinc-550 dark:text-[#8696a0] uppercase font-semibold tracking-wider">Daily Messages</span>
          </div>

          <div className="flex flex-col items-center md:items-start">
            <span className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-[#00D8E3] mb-2 tabular-nums">
              28+
            </span>
            <span className="text-xs text-zinc-550 dark:text-[#8696a0] uppercase font-semibold tracking-wider">States Connected</span>
          </div>
        </div>
      </section>

      {/* --- SECTION 4: FEATURES BENTO GRID --- */}
      <section id="features" className="py-16 px-6 max-w-7xl mx-auto z-10 relative">
        <div className="text-center max-w-3xl mx-auto mb-12 flex flex-col items-center gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#06A0F8]/10 border border-[#06A0F8]/20 rounded-full w-fit">
            <Zap className="w-3.5 h-3.5 text-[#06A0F8]" />
            <span className="text-sm font-semibold uppercase tracking-[0.15em] text-[#06A0F8]">Core Features</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight text-zinc-900 dark:text-white">
            Engineered for the Speed of Thought.
          </h2>
          <p className="text-zinc-650 dark:text-zinc-300 text-base md:text-lg max-w-xl">
            We combined lightning-fast WebSockets with local device encryption to build an instant messaging platform.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: Real-time messaging (2 columns span) */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            onMouseMove={handleMouseMove}
            className="md:col-span-2 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/[0.06] hover:dark:border-[#06A0F8]/60 p-8 flex flex-col justify-between h-[420px] overflow-hidden group relative cf-card-glow transition-all duration-300 hover:scale-[1.02] dark:shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.06)] hover:shadow-xl dark:hover:shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_24px_rgba(6, 160, 248,0.15)]"
          >
            <div className="z-10">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#06A0F8]">Speed & Delivery</span>
              <h3 className="text-2xl font-bold text-zinc-950 dark:text-white tracking-tight mt-2 mb-3">Real-Time Messaging</h3>
              <p className="text-base text-zinc-600 dark:text-[#8696a0] max-w-md">
                No spinners, no queues. Orbix processes events globally in less than 40ms, making conversations feel as natural as talking in person.
              </p>
            </div>

            {/* Illustration: Animated typing & speed checks */}
            <div className="absolute right-8 bottom-4 w-72 h-44 bg-zinc-100/90 dark:bg-[#000000]/80 border border-zinc-200/60 dark:border-white/[0.06] rounded-xl p-4 flex flex-col justify-between shadow-2xl z-10">
              <div className="flex justify-between items-center border-b border-zinc-200/60 dark:border-white/[0.06] pb-2">
                <span className="text-xs font-mono text-[#06A0F8]">LATENCY</span>
                <span className="text-xs bg-[#06A0F8]/10 text-[#06A0F8] dark:bg-[#00D8E3]/20 dark:text-[#00D8E3] px-2 py-0.5 rounded font-mono">12ms OK</span>
              </div>
              <div className="space-y-2 py-3">
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#06A0F8] flex items-center justify-center text-xs font-bold text-white">PD</div>
                  <div className="bg-white/80 dark:bg-white/[0.05] p-2 rounded-lg text-xs max-w-[80%] text-zinc-900 dark:text-white border border-zinc-200 dark:border-transparent">Pushing the WebRTC updates.</div>
                </div>
                <div className="flex gap-2 justify-end">
                  <div className="bg-[#06A0F8] p-2 rounded-lg text-xs max-w-[80%] text-white flex items-center gap-1">
                    Received! ⚡
                    <span className="text-sm font-bold select-none leading-none tracking-tight text-[#34b7f1] ml-1">✓✓</span>
                  </div>
                </div>
              </div>
              <div className="text-xs text-zinc-500 dark:text-[#8696a0] font-mono flex items-center gap-2">
                <Activity className="w-3 h-3 text-[#06A0F8] animate-pulse" />
                Live socket connection active
              </div>
            </div>
          </motion.div>

          {/* Card 2: HD Calls */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/[0.06] hover:dark:border-[#06A0F8]/60 p-8 flex flex-col justify-between h-[420px] overflow-hidden group relative cf-card-glow transition-all duration-300 hover:scale-[1.02] dark:shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.06)] hover:shadow-xl dark:hover:shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_24px_rgba(6, 160, 248,0.15)]"
          >
            <div className="z-10">
              <span className="text-xs font-bold text-[#06A0F8] uppercase tracking-wider">Voice & Video</span>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-2 mb-3">HD WebRTC Calls</h3>
              <p className="text-base text-zinc-600 dark:text-[#8696a0]">
                Crystal clear 1080p video calls and Spatial Audio voice channels.
              </p>
            </div>

            {/* Illustration: Glowing speaker and animated mic scale */}
            <div className="relative h-44 w-full flex items-center justify-center z-10">
              <div className="w-20 h-20 rounded-full bg-[#06A0F8]/10 border border-[#06A0F8]/30 flex items-center justify-center animate-ping absolute" />
              <div className="w-16 h-16 rounded-full bg-[#06A0F8] flex items-center justify-center shadow-lg shadow-[#06A0F8]/30 relative z-20 group-hover:scale-110 transition-transform duration-500">
                <Volume2 className="w-7 h-7 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Card 3: Status Updates */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/[0.06] hover:dark:border-[#06A0F8]/60 p-8 flex flex-col justify-between h-[420px] overflow-hidden group relative cf-card-glow transition-all duration-300 hover:scale-[1.02] dark:shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.06)] hover:shadow-xl dark:hover:shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_24px_rgba(6, 160, 248,0.15)]"
          >
            <div className="z-10">
              <span className="text-sm font-semibold uppercase tracking-[0.12em] text-[#06A0F8]">Stories</span>
              <h3 className="text-2xl font-bold text-zinc-950 dark:text-white tracking-tight mt-2 mb-3">Swipable Statuses</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                Share pictures, videos, or formatted text updates that disappear after 24 hours.
              </p>
            </div>

            {/* Illustration: Status Circle ring */}
            <div className="bg-zinc-100/90 dark:bg-[#000000]/85 border border-zinc-200/60 dark:border-white/[0.06] rounded-xl p-4 flex justify-around mt-4 z-10 shadow-sm group-hover:-translate-y-2 transition-transform duration-500">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#00D8E3]" />
                <div className="absolute inset-1 rounded-full bg-[#06A0F8] flex items-center justify-center text-xs font-bold text-white">PD</div>
              </div>
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-2 border-[#00D8E3]" />
                <div className="absolute inset-1 rounded-full bg-zinc-400 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-900 dark:text-white">KT</div>
              </div>
            </div>
          </motion.div>

          {/* Card 4: End-to-end Encryption */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-2xl bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/[0.06] hover:dark:border-[#06A0F8]/60 p-8 flex flex-col justify-between h-[420px] overflow-hidden group relative cf-card-glow transition-all duration-300 hover:scale-[1.02] dark:shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.06)] hover:shadow-xl dark:hover:shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_24px_rgba(6, 160, 248,0.15)]"
          >
            <div className="z-10">
              <span className="text-xs font-bold text-[#06A0F8] uppercase tracking-wider">Security</span>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-2 mb-3">End-to-End Cryptography</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                Encryption keys reside locally on-device. Zero knowledge, maximum data safety.
              </p>
            </div>

            {/* Scanning Lock Illustration */}
            <div className="bg-zinc-100/90 dark:bg-[#000000]/85 border border-zinc-200/60 dark:border-white/[0.06] rounded-xl p-4 flex items-center justify-between mt-4 z-10 shadow-sm group-hover:border-[#00D8E3]/40 transition-colors duration-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-[#06A0F8] to-[#00D8E3] flex items-center justify-center text-white">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-white">AES-GCM 256</div>
                  <div className="text-xs text-zinc-500 dark:text-[#8696a0] font-mono">0x4F92...B31D</div>
                </div>
              </div>
              <button 
                onClick={triggerSecurityScan}
                className="text-xs font-semibold bg-zinc-200 hover:bg-zinc-300 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border border-zinc-300/60 dark:border-white/[0.08] px-3 py-1.5 rounded-lg text-zinc-900 dark:text-white transition-colors cursor-pointer"
              >
                {isScanning ? "Encrypting..." : scanComplete ? "Secure ✔" : "Verify Keys"}
              </button>
            </div>
          </motion.div>

          {/* Card 5: Message Editing & Starring */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="rounded-2xl bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/[0.06] hover:dark:border-[#06A0F8]/60 p-8 flex flex-col justify-between h-[420px] overflow-hidden group relative cf-card-glow transition-all duration-300 hover:scale-[1.02] dark:shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.06)] hover:shadow-xl dark:hover:shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_24px_rgba(6, 160, 248,0.15)]"
          >
            <div className="z-10">
              <span className="text-xs font-bold text-[#06A0F8] uppercase tracking-wider">Productivity</span>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-2 mb-3">Editing & Starring</h3>
              <p className="text-sm text-zinc-650 dark:text-[#8696a0]">
                Correct typos or bookmark important messages with star indicators.
              </p>
            </div>

            <div className="bg-zinc-100/90 dark:bg-[#000000]/85 border border-zinc-200/60 dark:border-white/[0.06] rounded-xl p-3.5 mt-4 z-10 space-y-2 shadow-sm group-hover:-translate-y-2 transition-transform duration-500">
              <div className="flex items-center justify-between text-sm bg-white dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.05] p-2 rounded-lg text-zinc-700 dark:text-zinc-300">
                <span className="truncate">This is a message with a typo...</span>
                <Pencil className="w-3.5 h-3.5 text-[#06A0F8] flex-shrink-0" />
              </div>
              <div className="flex items-center justify-between text-sm bg-[#06A0F8]/10 border border-[#06A0F8]/20 p-2 rounded-lg text-[#06A0F8] dark:text-white">
                <span className="truncate font-semibold">This is a corrected message</span>
                <span className="text-xs text-[#06A0F8] font-semibold flex items-center gap-1">
                  (edited)
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                </span>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* --- SECTION 5: DEVICE SHOWCASE --- */}
      <section className="py-16 px-6 bg-zinc-100/50 dark:bg-[#0A0A0A]/20 relative z-10 overflow-hidden">
        {/* Decorative Lighting behind devices */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#06A0F8]/6 dark:bg-[#06A0F8]/8 filter blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-[#06A0F8] uppercase tracking-wider">Multi-Device Cloud Sync</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-zinc-900 dark:text-white mt-2 mb-4">
              A Unified Fluid Experience on Any Screen.
            </h2>
            <p className="text-zinc-650 dark:text-[#8696a0] text-lg max-w-lg mx-auto">
              Access your communication history seamlessly on your laptop, desktop, tablet, and mobile device. Offline sync included.
            </p>
          </div>

          {/* Perspective layout container */}
          <div className="w-full flex flex-col lg:flex-row justify-center items-center gap-12 pt-8">
            
            {/* 1. Desktop & Laptop Mockup frame */}
            <div className="w-full max-w-md bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-800/50 rounded-xl p-3 shadow-2xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative group hover:scale-[1.02] hover:-rotate-1 transition-all duration-500">
              <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-zinc-200/50 dark:border-white/[0.06]">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                <span className="text-xs text-zinc-500 dark:text-[#8696a0] ml-2 font-mono">web.orbix.app</span>
              </div>
              <div className="aspect-[16/10] bg-zinc-50 dark:bg-[#000000] rounded-lg overflow-hidden relative flex flex-col items-center justify-center p-6 border border-zinc-200/50 dark:border-white/[0.04]">
                <Laptop className="w-12 h-12 text-[#06A0F8] mb-3" />
                <span className="text-xs font-bold text-zinc-900 dark:text-white">macOS & Windows Client</span>
                <span className="text-xs text-zinc-500 dark:text-[#8696a0] mt-1">120 FPS Rendering</span>
              </div>
            </div>

            {/* 2. Tablet Mockup frame */}
            <div className="w-72 bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/[0.06] rounded-2xl p-2.5 shadow-2xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative group hover:scale-[1.03] hover:rotate-1 transition-all duration-500">
              <div className="aspect-[4/3] bg-zinc-50 dark:bg-[#000000] rounded-xl overflow-hidden relative flex flex-col items-center justify-center p-6 border border-zinc-200/50 dark:border-white/[0.04]">
                <Tablet className="w-10 h-10 text-[#00D8E3] mb-3" />
                <span className="text-xs font-bold text-zinc-900 dark:text-white">iPadOS & Android Tablet</span>
                <span className="text-xs text-zinc-500 dark:text-[#8696a0] mt-1">Optimized Grid View</span>
              </div>
            </div>

            {/* 3. Mobile Mockup frame */}
            <div className="w-56 bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/[0.06] rounded-[2rem] p-3 shadow-2xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative group hover:scale-[1.04] hover:-rotate-2 transition-all duration-500">
              <div className="w-20 h-4 bg-zinc-200 dark:bg-black rounded-full mx-auto mb-2" />
              <div className="aspect-[9/19] bg-zinc-50 dark:bg-[#000000] rounded-[1.5rem] overflow-hidden relative flex flex-col items-center justify-center p-4 border border-zinc-200/50 dark:border-white/[0.04]">
                <Smartphone className="w-8 h-8 text-[#FF4F8C] mb-3" />
                <span className="text-xs font-bold text-center text-zinc-900 dark:text-white">iOS & Android App</span>
                <span className="text-xs text-zinc-500 dark:text-[#8696a0] mt-1 text-center">FaceID Authentication</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- SECTION 6: CHAT EXPERIENCE SANDBOX --- */}
      <section id="chat-sandbox" className="py-16 px-6 max-w-7xl mx-auto z-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Text */}
          <div className="lg:col-span-5 flex flex-col gap-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#06A0F8]/10 border border-[#06A0F8]/20 rounded-full w-fit">
              <Sparkles className="w-3.5 h-3.5 text-[#06A0F8]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#06A0F8]">Interactive Sandbox</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-white">
              Try the Chat Experience.
            </h2>
            <p className="text-zinc-650 dark:text-[#8696a0] text-sm md:text-base leading-relaxed">
              Experience the core mechanics of the actual app. Edit messages, star bookmarks, add reactions, and listen to playable audio clips.
            </p>

            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-3">
                <button 
                  onClick={() => setShowStarredDrawer(!showStarredDrawer)}
                  className="w-8 h-8 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 flex items-center justify-center border border-amber-500/20 transition-all cursor-pointer"
                >
                  <Star className="w-4.5 h-4.5 fill-amber-500" />
                </button>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Starred Bookmarks</h4>
                  <p className="text-xs text-zinc-650 dark:text-[#8696a0]">
                    Star messages to save them to your bookmarks. Currently starred: <span className="text-[#06A0F8] dark:text-white font-bold">{starredMessages.length}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#00D8E3]/20 flex items-center justify-center mt-0.5">
                  <Check className="w-3 h-3 text-[#00D8E3]" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Interactive Editing</h4>
                  <p className="text-xs text-zinc-650 dark:text-[#8696a0]">Hover over your messages and click edit to modify sent content in real-time.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sandbox Container */}
          <div className="lg:col-span-7 w-full max-w-xl mx-auto bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/[0.06] rounded-2xl flex flex-col h-[520px] overflow-hidden shadow-2xl dark:shadow-[0_8px_40px_rgba(0,0,0,0.5)] backdrop-blur-md relative">
            
            {/* Starred Messages Drawer overlay */}
            <AnimatePresence>
              {showStarredDrawer && (
                <motion.div 
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  className="absolute inset-y-0 right-0 w-64 bg-white dark:bg-[#0A0A0A] border-l border-zinc-200/80 dark:border-white/[0.08] z-30 p-4 flex flex-col shadow-lg"
                >
                  <div className="flex justify-between items-center border-b border-zinc-200/55 dark:border-white/[0.06] pb-3 mb-4">
                    <h3 className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-amber-500" />
                      Starred Messages
                    </h3>
                    <button onClick={() => setShowStarredDrawer(false)} className="text-zinc-500 dark:text-[#8696a0] hover:text-zinc-900 dark:hover:text-white cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3">
                    {starredMessages.length === 0 ? (
                      <p className="text-xs text-zinc-500 dark:text-[#8696a0] italic text-center pt-8">No starred messages yet.</p>
                    ) : (
                      starredMessages.map((id) => {
                        const msg = sandboxMessages.find(m => m.id === id);
                        if (!msg) return null;
                        return (
                          <div key={id} className="bg-zinc-100 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.05] p-2.5 rounded-lg">
                            <div className="text-xs text-[#06A0F8] font-bold">{msg.sender}</div>
                            <div className="text-xs text-zinc-800 dark:text-white mt-1 leading-normal">{msg.text || "[Media Note]"}</div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sandbox Header */}
            <div className="px-6 py-4 border-b border-zinc-200/50 dark:border-white/[0.06] flex items-center justify-between bg-zinc-50/50 dark:bg-[#0A0A0A]/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FF4F8C] to-[#6D5DF6] flex items-center justify-center text-xs font-bold text-white">PR</div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Priya (Marketing)</h3>
                  <span className="text-xs text-[#00D8E3] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00D8E3] animate-pulse" />
                    online
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setShowStarredDrawer(true)}
                className="text-xs font-bold text-amber-500 hover:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded cursor-pointer"
              >
                ★ Bookmarks ({starredMessages.length})
              </button>
            </div>

            {/* Sandbox Message transcript */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 flex flex-col justify-end">
              {sandboxMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col max-w-[85%] ${msg.self ? "self-end items-end" : "self-start items-start"}`}
                >
                  <span className="text-xs text-zinc-500 dark:text-[#8696a0] mb-1 font-semibold">{msg.sender}</span>
                  
                  {/* Message bubble */}
                  <div 
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm relative group ${
                      msg.self 
                        ? "bg-[#06A0F8] text-white rounded-tr-none" 
                        : "bg-zinc-100 dark:bg-white/[0.05] text-zinc-900 dark:text-white border border-zinc-200/50 dark:border-white/[0.06] rounded-tl-none"
                    }`}
                    style={{
                      borderRadius: msg.self ? "16px 16px 0px 16px" : "16px 16px 16px 0px"
                    }}
                  >
                    {/* Inline editor */}
                    {editingMessageId === msg.id ? (
                      <div className="flex flex-col gap-2 w-56">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="bg-white/10 dark:bg-zinc-800/80 border border-zinc-300 dark:border-white/20 rounded p-1.5 text-xs text-zinc-950 dark:text-white focus:outline-none"
                          rows={2}
                        />
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setEditingMessageId(null)} className="text-xs text-zinc-500 dark:text-[#8696a0] cursor-pointer">Cancel</button>
                          <button onClick={() => handleSaveEdit(msg.id)} className="text-xs text-[#06A0F8] font-bold cursor-pointer">Save</button>
                        </div>
                      </div>
                    ) : msg.media?.type === "AUDIO" ? (
                      <div className="flex items-center gap-3 w-56">
                        <button 
                          onClick={() => setVoicePlaying(!voicePlaying)}
                          className="w-8 h-8 rounded-full bg-[#06A0F8]/20 text-[#06A0F8] hover:bg-[#06A0F8]/30 flex items-center justify-center transition-all cursor-pointer"
                        >
                          {voicePlaying ? <Square className="w-3.5 h-3.5 fill-[#06A0F8]" /> : <Play className="w-3.5 h-3.5 fill-[#06A0F8]" />}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-1 h-6">
                            {[10, 16, 24, 12, 8, 20, 14, 28, 18, 6, 12, 16, 22, 10, 14].map((h, idx) => (
                              <div 
                                key={idx}
                                className={`w-[2px] rounded-full transition-colors ${
                                  voicePlaying && voiceProgress > (idx / 15) * 100 ? "bg-[#06A0F8]" : "bg-zinc-300 dark:bg-white/20"
                                }`}
                                style={{ height: `${h}px` }}
                              />
                            ))}
                          </div>
                          <div className="flex justify-between text-xs text-zinc-500 dark:text-[#8696a0] mt-1 font-mono">
                            <span>{voicePlaying ? `0:${Math.floor((voiceProgress / 100) * 12).toString().padStart(2, "0")}` : "0:00"}</span>
                            <span>{msg.media.duration}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {msg.text}
                        {msg.isEdited && <span className="text-xs text-zinc-500 dark:text-[#8696a0] italic ml-1">(edited)</span>}
                      </div>
                    )}

                    {/* Hover Options Bar (Star, Edit, Delete, Reply) */}
                    {editingMessageId !== msg.id && (
                      <div className="absolute top-1/2 -right-24 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5 bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/[0.08] p-1.5 rounded-lg shadow-xl z-20 select-none">
                        <button 
                          onClick={() => handleToggleStar(msg.id)}
                          className={`text-xs hover:scale-125 transition-all cursor-pointer ${msg.isStarred ? "text-amber-500" : "text-zinc-500 dark:text-[#8696a0] hover:text-zinc-900 dark:hover:text-white"}`}
                          title="Star Message"
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                        </button>
                        {msg.self && (
                          <button 
                            onClick={() => handleStartEdit(msg.id, msg.text)}
                            className="text-zinc-500 dark:text-[#8696a0] hover:text-zinc-900 dark:hover:text-white text-xs cursor-pointer"
                            title="Edit Message"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="text-red-500 hover:text-red-400 text-xs cursor-pointer"
                          title="Delete Message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {(["👍", "❤️"]).map((emoji) => (
                          <button 
                            key={emoji}
                            onClick={() => handleEmojiClick(msg.id, emoji)}
                            className="hover:scale-125 transition-transform text-xs cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reaction list */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {msg.reactions.map((react, idx) => (
                        <span 
                          key={idx} 
                          className="inline-flex items-center gap-1 bg-zinc-200/50 dark:bg-white/[0.04] border border-zinc-300/40 dark:border-white/[0.06] rounded-full px-2 py-0.5 text-xs font-bold text-zinc-800 dark:text-white"
                        >
                          {react.emoji} {react.count}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs text-zinc-500 dark:text-[#8696a0]">{msg.time}</span>
                    {msg.self && (
                      <span className="text-sm font-bold select-none leading-none tracking-tight text-[#34b7f1] ml-0.5">✓✓</span>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              <AnimatePresence>
                {sandboxTyping && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="flex flex-col items-start gap-1"
                  >
                    <span className="text-xs text-zinc-500 dark:text-[#8696a0] font-semibold">Priya (Marketing)</span>
                    <div className="bg-zinc-150 dark:bg-white/[0.05] px-3.5 py-2.5 rounded-2xl rounded-tl-none border border-zinc-200/60 dark:border-white/[0.06] flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-zinc-400 dark:bg-[#8696a0] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-zinc-400 dark:bg-[#8696a0] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-zinc-400 dark:bg-[#8696a0] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input form */}
            <div className="p-4 border-t border-zinc-200/50 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-[#0A0A0A]/30">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSendSandboxMessage(); }}
                className="relative flex items-center"
              >
                <input 
                  type="text" 
                  value={sandboxInput}
                  onChange={(e) => setSandboxInput(e.target.value)}
                  placeholder="Type a message to Priya..."
                  className="flex-1 bg-zinc-200/40 dark:bg-white/[0.04] border border-zinc-200/60 dark:border-white/[0.06] rounded-xl py-3.5 pl-4 pr-12 text-xs text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-[#8696a0] focus:outline-none focus:border-[#06A0F8]/50 transition-colors"
                />
                <button 
                  type="submit"
                  className="absolute right-2 w-10 h-10 rounded-lg bg-[#06A0F8] hover:bg-[#06A0F8]/95 flex items-center justify-center text-white transition-colors cursor-pointer"
                >
                  <Send className="w-4.5 h-4.5" />
                </button>
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* --- SECTION 7: STATUS/STORIES SHOWCASE --- */}
      <section id="communities" className="py-16 px-6 bg-zinc-100/50 dark:bg-[#0A0A0A]/30 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          
          <div className="text-center max-w-2xl mx-auto mb-12 flex flex-col items-center gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#06A0F8]/10 border border-[#06A0F8]/20 rounded-full w-fit">
              <CircleDot className="w-3.5 h-3.5 text-[#06A0F8]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#06A0F8]">24-Hour Stories</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-white">
              Status & Stories Sharing.
            </h2>
            <p className="text-zinc-650 dark:text-[#8696a0] text-sm max-w-md mx-auto">
              Keep your contacts updated. Post swipable updates that clean themselves up after 24 hours. Click below to view stories in action.
            </p>
          </div>

          {/* Interactive Stories Showcase Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-3xl items-center">
            
            {/* Story update feeds */}
            <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-white/[0.08] p-6 rounded-2xl space-y-4 shadow-xl">
              <h3 className="text-xs font-bold text-zinc-500 dark:text-[#8696a0] uppercase tracking-wider mb-2">Recent Statuses</h3>
              
              {statusStories.map((grp) => (
                <div 
                  key={grp.id}
                  onClick={() => handlePlayStories(grp)}
                  className="flex items-center justify-between p-3 bg-zinc-50/50 dark:bg-white/[0.02] hover:bg-zinc-200/50 dark:hover:bg-white/[0.05] border border-zinc-200/60 dark:border-white/[0.04] rounded-xl cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-11 h-11">
                      {/* Interactive ring helper */}
                      <svg width="44" height="44" className="absolute inset-0 -rotate-90">
                        <circle 
                          cx="22" 
                          cy="22" 
                          r="19" 
                          fill="transparent" 
                          stroke={grp.viewedCount === grp.count ? "#9ca3af" : "#00D8E3"}
                          strokeWidth="2.5"
                          strokeDasharray="119"
                          className="transition-all"
                        />
                      </svg>
                      <div className="absolute inset-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-900 dark:text-white">
                        {grp.avatar}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-white">{grp.userName}</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#8696a0] mt-0.5">{grp.count} status updates</p>
                    </div>
                  </div>
                  <button className="text-xs font-bold text-[#06A0F8] bg-[#06A0F8]/10 px-2.5 py-1.5 rounded cursor-pointer">View</button>
                </div>
              ))}
            </div>

            {/* Active Story Viewer Mockup */}
            <div className="w-64 h-[420px] mx-auto rounded-[2rem] border-8 border-zinc-200 dark:border-[#0A0A0A] bg-zinc-900 dark:bg-zinc-950 shadow-2xl relative overflow-hidden flex flex-col justify-between p-4">
              
              {activeStoryGroup ? (
                <>
                  {/* Status Progress bars */}
                  <div className="flex gap-1 z-10">
                    {activeStoryGroup.stories.map((_, idx) => (
                      <div key={idx} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#00D8E3] transition-all duration-150" 
                          style={{ 
                            width: activeStoryIndex === idx 
                              ? `${storyProgress}%` 
                              : activeStoryIndex > idx 
                              ? "100%" 
                              : "0%" 
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Header info */}
                  <div className="flex items-center gap-2.5 z-10 mt-2">
                    <div className="w-8 h-8 rounded-full bg-[#06A0F8] flex items-center justify-center text-xs font-bold text-white">
                      {activeStoryGroup.avatar}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{activeStoryGroup.userName}</h4>
                      <p className="text-xs text-zinc-300">Just Now</p>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 flex items-center justify-center p-4 z-10">
                    <div className="text-center text-xs text-white font-medium leading-relaxed">
                      {activeStoryGroup.stories[activeStoryIndex].content}
                    </div>
                  </div>

                  {/* Background overlay */}
                  <div className={`absolute inset-0 z-0 ${activeStoryGroup.stories[activeStoryIndex].bg || "bg-zinc-900"}`} />
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-400 dark:text-[#8696a0]">
                  <CircleDot className="w-10 h-10 text-[#06A0F8] animate-pulse mb-3" />
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Story Player</h4>
                  <p className="text-xs mt-1">Select a contact to view their active status story updates.</p>
                </div>
              )}

            </div>

          </div>
        </div>
      </section>

      {/* --- SECTION 8: COLLABORATION SECTION --- */}
      <section className="py-16 px-6 max-w-7xl mx-auto z-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left illustration panels */}
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* File uploader panel */}
            <div className="bg-white/85 dark:bg-[#0A0A0A]/70 border border-zinc-200/50 dark:border-white/[0.08] rounded-xl p-6 flex flex-col justify-between h-[250px] shadow-xl relative overflow-hidden">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#06A0F8]">Shared Files</span>
                  <button 
                    onClick={startMockUpload}
                    className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-zinc-300/60 dark:border-white/[0.08] text-zinc-500 dark:text-[#8696a0] hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Upload indicator */}
                {uploadProgress !== null ? (
                  <div className="bg-zinc-50 dark:bg-[#000000] border border-zinc-200/60 dark:border-white/[0.06] rounded-lg p-3">
                    <div className="flex justify-between items-center text-xs text-zinc-500 dark:text-[#8696a0] mb-2 font-mono">
                      <span>Uploading Interactive_Spec_Sheet...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-200 dark:bg-white/[0.08] rounded-full overflow-hidden">
                      <div className="h-full bg-[#06A0F8] transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-zinc-100/50 dark:bg-white/[0.03] border border-zinc-200/50 dark:border-white/[0.05] rounded-lg p-2.5">
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-zinc-500 dark:text-[#8696a0]" />
                          <div>
                            <div className="text-sm font-semibold text-zinc-950 dark:text-white truncate max-w-[120px]">{file.name}</div>
                            <div className="text-xs text-zinc-500 dark:text-[#8696a0]">{file.size}</div>
                          </div>
                        </div>
                        <span className="text-xs text-zinc-650 dark:text-[#8696a0] bg-zinc-200 dark:bg-white/[0.04] px-1.5 py-0.5 rounded">{file.type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-xs text-zinc-500 dark:text-[#8696a0] flex items-center gap-1">
                <Activity className="w-3 h-3 text-[#00D8E3]" />
                Direct peer-to-peer file sharing
              </div>
            </div>

            {/* Media Lightbox preview card */}
            <div className="bg-white/85 dark:bg-[#0A0A0A]/70 border border-zinc-200/50 dark:border-white/[0.08] rounded-xl p-6 flex flex-col justify-between h-[250px] shadow-xl">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#34b7f1]">Media Lightbox Viewer</span>
                
                <div className="bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.05] rounded-xl p-4 mt-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#34b7f1]/10 flex items-center justify-center">
                      <Camera className="w-5 h-5 text-[#34b7f1]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-950 dark:text-white">Pooja_Design_Draft.png</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#8696a0]">Click attachment to preview inside lightbox</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-zinc-500 dark:text-[#8696a0]">Size: 4.1 MB</span>
                    <button className="text-xs font-semibold px-3 py-1.5 rounded-lg border bg-zinc-200 border-zinc-300 dark:bg-white/[0.04] dark:border-white/[0.08] text-zinc-950 dark:text-white hover:bg-zinc-300 dark:hover:bg-white/[0.08] cursor-pointer">
                      Lightbox Open
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-xs text-zinc-500 dark:text-[#8696a0] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#34b7f1]" />
                India region storage hub (Mumbai)
              </div>
            </div>

          </div>

          {/* Right Text */}
          <div className="lg:col-span-5 flex flex-col gap-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#06A0F8]/10 border border-[#06A0F8]/20 rounded-full w-fit">
              <Share2 className="w-3.5 h-3.5 text-[#06A0F8]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#06A0F8]">Rich Collaboration</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-white">
              Media & Document sharing.
            </h2>
            <p className="text-zinc-650 dark:text-[#8696a0] text-sm md:text-base leading-relaxed">
              Don't leave the conversation to review files. Orbix embeds lightboxes and document helpers so you can manage collaboration right inside the chat window.
            </p>
          </div>
        </div>
      </section>

      {/* --- SECTION 8b: ENCRYPTION SANDBOX --- */}
      <section id="encryption" className="py-20 px-6 max-w-7xl mx-auto z-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

          {/* Left Text Column */}
          <div className="lg:col-span-5 flex flex-col gap-7 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#00D8E3]/10 border border-[#00D8E3]/25 rounded-full w-fit">
              <Lock className="w-3.5 h-3.5 text-[#00D8E3]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#00D8E3]">Zero-Knowledge Privacy</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-extrabold text-zinc-900 dark:text-white leading-[1.1] tracking-tight">
              Military-Grade<br />Cryptography.
            </h2>

            <p className="text-zinc-650 dark:text-[#8696a0] text-sm md:text-base leading-relaxed">
              Orbix protects your identity using modern encryption hashes. Neither Orbix nor third parties can view files or read audio payloads.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#00D8E3]/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <Check className="w-3 h-3 text-[#00D8E3]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">End-to-End Encryption</h4>
                  <p className="text-xs text-zinc-600 dark:text-[#8696a0] mt-0.5">Every chat message is protected by unique, private security key sets.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#00D8E3]/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <Check className="w-3 h-3 text-[#00D8E3]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Zero Server Databases</h4>
                  <p className="text-xs text-zinc-600 dark:text-[#8696a0] mt-0.5">Your decrypted messaging history remains strictly local to user device environments.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#00D8E3]/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <Check className="w-3 h-3 text-[#00D8E3]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">AES-GCM 256-Bit Keys</h4>
                  <p className="text-xs text-zinc-600 dark:text-[#8696a0] mt-0.5">Industry-leading symmetric encryption standard used by global financial institutions.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Encryption Sandbox Card */}
          <div className="lg:col-span-7 flex justify-center lg:justify-end">
            <div className="w-full max-w-lg bg-[#0a101f] border border-[#00D8E3]/20 rounded-2xl p-6 shadow-2xl shadow-[#00D8E3]/10 relative overflow-hidden">
              
              {/* Subtle glow background */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D8E3]/5 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#06A0F8]/5 rounded-full blur-[60px] pointer-events-none" />

              {/* Header */}
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-[#00D8E3]" />
                  <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#00D8E3]">Encryption Sandbox</span>
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2.5 h-2.5 rounded-full bg-[#00D8E3] shadow-sm shadow-[#00D8E3]/50"
                />
              </div>

              {/* Input Message Field */}
              <div className="relative z-10 mb-4">
                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#8696a0] mb-2">Input Message</label>
                <div className="relative">
                  <textarea
                    value={encryptInput}
                    onChange={(e) => { if (!isEncrypted) setEncryptInput(e.target.value); }}
                    disabled={isEncrypted}
                    rows={2}
                    className="w-full bg-[#0d2820] border border-[#00D8E3]/20 rounded-xl px-4 py-3 text-sm text-white placeholder-[#8696a0] focus:outline-none focus:border-[#00D8E3]/50 resize-none transition-colors font-sans disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="Type a message to encrypt..."
                  />
                  {isEncrypted && (
                    <div className="absolute top-2 right-2">
                      <Lock className="w-3.5 h-3.5 text-[#00D8E3]" />
                    </div>
                  )}
                </div>
              </div>

              {/* Network Stream Data Output */}
              <div className="relative z-10 mb-6">
                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#8696a0] mb-2">Network Stream Data</label>
                <div className="bg-[#0d2820] border border-[#00D8E3]/20 rounded-xl px-4 py-3 min-h-[64px] flex items-center">
                  <AnimatePresence mode="wait">
                    {isEncrypting ? (
                      <motion.div
                        key="encrypting"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-3 w-full"
                      >
                        <div className="flex gap-1">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <motion.div
                              key={i}
                              className="w-1.5 h-4 bg-[#00D8E3] rounded-full"
                              animate={{ scaleY: [0.4, 1, 0.4] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-[#00D8E3] font-mono animate-pulse">
                          {isEncrypted ? "Decrypting payload..." : "Encrypting with AES-GCM-256..."}
                        </span>
                      </motion.div>
                    ) : isEncrypted ? (
                      <motion.p
                        key="encrypted"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="text-sm text-[#00D8E3] font-mono leading-relaxed break-all"
                      >
                        {encryptedOutput}
                      </motion.p>
                    ) : (
                      <motion.p
                        key="plaintext"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="text-sm text-[#8696a0] font-sans"
                      >
                        {encryptInput || <span className="italic text-[#4a5568]">Awaiting input...</span>}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Encryption status tags */}
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full transition-all ${
                    isEncrypted 
                      ? "bg-[#00D8E3]/15 text-[#00D8E3] border border-[#00D8E3]/25" 
                      : "bg-white/[0.04] text-[#8696a0] border border-white/[0.08]"
                  }`}>
                    {isEncrypted ? "🔒 Encrypted" : "🔓 Plaintext"}
                  </span>
                  {isEncrypted && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-xs font-mono text-[#8696a0] bg-white/[0.03] px-2 py-1 rounded-full border border-white/[0.06]"
                    >
                      AES-GCM-256 · E2E Protected
                    </motion.span>
                  )}
                </div>
              </div>

              {/* Encrypt / Decrypt Button */}
              <div className="relative z-10">
                <button
                  onClick={handleEncryptToggle}
                  disabled={isEncrypting || !encryptInput.trim()}
                  className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    isEncrypted
                      ? "bg-zinc-700 hover:bg-zinc-600 text-white border border-zinc-600"
                      : "bg-[#00D8E3] hover:bg-[#06A0F8] text-white shadow-lg shadow-[#00D8E3]/25 hover:shadow-[#00D8E3]/40"
                  }`}
                >
                  {isEncrypting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      {isEncrypted ? "Decrypting..." : "Encrypting..."}
                    </>
                  ) : isEncrypted ? (
                    <>
                      <Lock className="w-4 h-4" />
                      Decrypt Message
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Encrypt Message
                    </>
                  )}
                </button>
              </div>

              {/* Footer metadata */}
              <div className="relative z-10 flex items-center justify-between mt-4 pt-4 border-t border-white/[0.06]">
                <span className="text-xs text-[#4a5568] font-mono">Key ID: 0x4F92...B31D</span>
                <span className="text-xs text-[#4a5568] font-mono">Orbix E2E Protocol v3.1</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* --- SECTION 9: PRIVACY & SECURITY --- */}
      <section id="security" className="py-16 px-6 bg-zinc-100/50 dark:bg-[#0A0A0A]/30 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Text */}
          <div className="lg:col-span-6 flex flex-col gap-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00D8E3]/10 border border-[#00D8E3]/20 rounded-full w-fit">
              <Shield className="w-3.5 h-3.5 text-[#00D8E3]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#00D8E3]">RBI & CERT-In Compliant</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-white">
              Privacy as a First Class Citizen.
            </h2>
            <p className="text-zinc-650 dark:text-[#8696a0] text-sm md:text-base leading-relaxed">
              We built Orbix under a strict zero-knowledge architecture. Your encryption keys never leave your physical device, ensuring complete protection. All data resides securely in Indian data centers.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {[
                "End-to-End Encryption", "Private Direct Chats", 
                "Secure Cloud Backups", "Biometric Authentication", 
                "Two-Factor Authentication", "Encrypted Media Assets"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#00D8E3]/25 flex items-center justify-center">
                    <Check className="w-3 h-3 text-[#00D8E3]" />
                  </div>
                  <span className="text-xs font-semibold text-zinc-950 dark:text-white">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Security biometric illustration (Interactive face scanning) */}
          <div className="lg:col-span-6 flex items-center justify-center">
            <div 
              onClick={triggerSecurityScan}
              className="w-80 h-96 bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-white/[0.08] rounded-2xl p-6 flex flex-col justify-between items-center shadow-2xl relative overflow-hidden group cursor-pointer hover:border-[#00D8E3]/50 transition-colors"
            >
              {/* Scan Bar Animation */}
              {isScanning && (
                <motion.div 
                  className="absolute left-0 right-0 h-1 bg-[#00D8E3] shadow-lg shadow-[#00D8E3]/60 z-20"
                  animate={{ top: ["5%", "90%", "5%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              )}

              <div className="w-full flex justify-between items-center">
                <span className="text-xs font-bold text-zinc-500 dark:text-[#8696a0] tracking-wider uppercase">Biometric Gateway</span>
                <span className={`text-xs font-bold uppercase tracking-wider ${scanComplete ? "text-[#00D8E3]" : "text-[#00D8E3]"}`}>
                  {scanComplete ? "APPROVED" : "READY"}
                </span>
              </div>

              {/* Biometric Scan Fingerprint Icon container */}
              <div className="relative my-8">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center bg-zinc-150 dark:bg-white/[0.02] border transition-all ${
                  scanComplete ? "border-[#00D8E3] bg-[#00D8E3]/5" : "border-zinc-200/60 dark:border-white/[0.08] group-hover:border-[#00D8E3]/30"
                }`}>
                  <Fingerprint className={`w-16 h-16 transition-colors ${
                    scanComplete ? "text-[#00D8E3]" : "text-zinc-500 dark:text-[#8696a0] group-hover:text-zinc-800 dark:group-hover:text-white"
                  }`} />
                </div>
                
                {/* Encryption Lock symbol overlay */}
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-white/[0.08] flex items-center justify-center shadow-lg">
                  {scanComplete ? <Check className="w-5 h-5 text-[#00D8E3]" /> : <Lock className="w-4 h-4 text-zinc-950 dark:text-white" />}
                </div>
              </div>

              <div className="w-full text-center">
                <button className="w-full py-3 bg-zinc-200 dark:bg-white/[0.04] border border-zinc-300 dark:border-white/[0.08] rounded-xl text-xs font-semibold tracking-wide transition-all active:scale-[0.98] cursor-pointer text-zinc-950 dark:text-white">
                  {isScanning ? "Scanning Face ID..." : scanComplete ? "Securely Logged In" : "Trigger Scan Validation"}
                </button>
                <p className="text-xs text-zinc-500 dark:text-[#8696a0] mt-2 font-mono">Click anywhere to trigger validation demo</p>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* --- SECTION 11: PRICING SECTION --- */}
      <section id="pricing" className="py-16 px-6 bg-zinc-100/50 dark:bg-[#050505] relative z-10">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-10 flex flex-col items-center gap-4">
            <span className="text-xs font-bold text-[#06A0F8] uppercase tracking-wider">Simple Pricing</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-zinc-900 dark:text-white mt-2">
              Free for Everyone. <span className="text-[#06A0F8]">Always.</span>
            </h2>
            <p className="text-base text-zinc-600 dark:text-zinc-300 max-w-lg">
              Orbix is completely free right now — no hidden fees, no limits, no credit card. Paid plans are coming in the future with extra features.
            </p>
            
          </div>

          {/* Pricing: Single Free Card + Upcoming teaser */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            
            {/* FREE - Current plan */}
            <div className="bg-white dark:bg-[#0A0A0A] border-2 border-[#06A0F8] dark:border-[#06A0F8]/50 rounded-2xl p-8 flex flex-col relative shadow-2xl shadow-[#06A0F8]/10 dark:shadow-[0_0_60px_rgba(6, 160, 248,0.12),0_25px_60px_rgba(0,0,0,0.4)] transition-all hover:-translate-y-1">
              <span className="absolute -top-3.5 left-6 bg-[#06A0F8] text-white text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full">
                ✓ Active Now
              </span>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-extrabold text-zinc-950 dark:text-white">Free</h3>
                  <p className="text-xs text-zinc-500 dark:text-[#8696a0] mt-1">For everyone, forever — no strings attached.</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#06A0F8]/10 border border-[#06A0F8]/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[#06A0F8]" />
                </div>
              </div>
              <div className="text-5xl font-black text-[#06A0F8] mb-1">₹0</div>
              <div className="text-sm text-zinc-500 dark:text-[#8696a0] uppercase font-bold tracking-wider mb-8">Free Forever · No Credit Card</div>
              
              <div className="space-y-3.5 flex-1">
                {[
                  "Unlimited 1-on-1 private chats",
                  "Group chats up to 256 members",
                  "Voice & video calls (WebRTC)",
                  "Share photos, videos & files",
                  "Status updates & stories",
                  "End-to-end encryption always on",
                  "Read receipts & typing indicators",
                  "Message reactions & replies",
                ].map(f => (
                  <div key={f} className="flex items-center gap-2.5 text-xs text-zinc-800 dark:text-zinc-200">
                    <Check className="w-4 h-4 text-[#00D8E3] flex-shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/signup" className="w-full py-3.5 mt-8 bg-[#06A0F8] hover:bg-[#06A0F8]/90 rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-[#06A0F8]/25 flex items-center justify-center gap-2 group">
                Start for Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* PRO - Coming Soon */}
            <div className="bg-white/60 dark:bg-[#080d0a]/60 border border-zinc-200/60 dark:border-white/[0.05] rounded-2xl p-8 flex flex-col relative opacity-75 transition-all">
              <span className="absolute -top-3.5 left-6 bg-zinc-400 dark:bg-zinc-600 text-white text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full">
                Coming Soon
              </span>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-extrabold text-zinc-950 dark:text-white">Orbix Plus</h3>
                  <p className="text-xs text-zinc-500 dark:text-[#8696a0] mt-1">More power for heavy users &amp; families.</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.06] flex items-center justify-center">
                  <Star className="w-5 h-5 text-zinc-400" />
                </div>
              </div>
              <div className="text-3xl font-black text-zinc-400 dark:text-zinc-500 mb-1">₹29<span className="text-base font-normal">/mo</span></div>
              <div className="text-sm text-zinc-400 dark:text-zinc-600 uppercase font-bold tracking-wider mb-8">Launching Later · Stay Tuned</div>
              
              <div className="space-y-3.5 flex-1">
                {[
                  "Everything in Free",
                  "Larger file transfers (up to 2GB)",
                  "HD quality video calls",
                  "Custom chat themes & wallpapers",
                  "Priority message delivery",
                  "Message scheduling",
                ].map(f => (
                  <div key={f} className="flex items-center gap-2.5 text-xs text-zinc-500 dark:text-zinc-500">
                    <Check className="w-4 h-4 text-zinc-300 dark:text-zinc-600 flex-shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <button disabled className="w-full py-3.5 mt-8 bg-zinc-100 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.06] rounded-xl text-sm font-bold text-zinc-400 dark:text-zinc-600 cursor-not-allowed flex items-center justify-center gap-2">
                Notify Me
              </button>
            </div>

            {/* Note card */}
            <div className="bg-gradient-to-br from-[#0a101f] to-[#050a0f] border border-[#06A0F8]/30 rounded-2xl p-8 flex flex-col justify-between shadow-lg dark:shadow-[0_0_40px_rgba(6, 160, 248,0.15)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#06A0F8]/10 filter blur-[40px] rounded-full group-hover:bg-[#06A0F8]/20 transition-all duration-500" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-[#06A0F8]/15 border border-[#06A0F8]/20 flex items-center justify-center mb-6">
                  <MessageSquare className="w-6 h-6 text-[#06A0F8]" />
                </div>
                <h3 className="text-xl font-extrabold text-white mb-3">Built for India</h3>
                <p className="text-base text-[#8696a0] leading-relaxed">
                  Orbix is made for India — lightweight, fast even on 4G, available in your language, and completely private. Your messages belong to you, not us.
                </p>
              </div>
              <div className="mt-8 space-y-3">
                {[
                  { icon: Shield, text: "No ads. No data selling. Ever." },
                  { icon: Lock, text: "E2E encrypted by default" },
                  { icon: Globe, text: "Servers in India (Mumbai)" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2.5 text-xs text-[#8696a0]">
                    <Icon className="w-3.5 h-3.5 text-[#06A0F8] flex-shrink-0" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- SECTION 12: FAQ SECTION --- */}
      <section className="py-16 px-6 max-w-4xl mx-auto z-10 relative">
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-[#06A0F8] uppercase tracking-wider">Answering Inquiries</span>
          <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-white mt-2">Frequently Asked Questions</h2>
        </div>

        {/* Accordions */}
        <div className="space-y-4">
          {[  
            { q: "Is Orbix truly end-to-end encrypted?", a: "Yes. Every message, voice recording, image, file, and call stream is encrypted on-device before hitting the network. We utilize the Signal Protocol and AES-256-GCM cryptography. No one, including Orbix engineers, has access to the cryptographic keys." },
            { q: "Is the app completely free?", a: "Yes! Orbix is 100% free with no limits on messaging, calls, or file sharing. We'll introduce premium cosmetic features in the future, but core features will always be free." },
            { q: "How does the file transfer compare to WhatsApp or Telegram?", a: "Orbix utilizes direct WebRTC data channels for peer-to-peer file transfers, resulting in zero middleman delays. Transfers can hit rates up to 100 MB/s depending on client upload bandwidth speeds." },
            { q: "Is Orbix compliant with Indian data localization laws?", a: "Absolutely. Orbix has dedicated data centers in Mumbai and Bangalore, satisfying the Reserve Bank of India (RBI) data localization guidelines for secure local residency of communication logs." }
          ].map((faq, i) => (
            <div 
              key={i} 
              className="bg-white dark:bg-[#0A0A0A]/90 border border-zinc-200/80 dark:border-white/[0.07] hover:dark:border-[#06A0F8]/40 rounded-xl overflow-hidden shadow-sm hover:shadow-md dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)] hover:scale-[1.01] transition-all duration-300"
            >
              <button
                type="button"
                onClick={() => setActiveFAQ(activeFAQ === i ? null : i)}
                className="w-full p-5 text-left flex justify-between items-center text-xs md:text-sm font-semibold text-zinc-800 dark:text-white transition-colors hover:bg-zinc-200/20 dark:hover:bg-white/[0.02] cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-zinc-550 dark:text-[#8696a0] transition-transform duration-300 ${
                  activeFAQ === i ? "rotate-180 text-zinc-950 dark:text-white" : ""
                }`} />
              </button>
              
              <AnimatePresence>
                {activeFAQ === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-zinc-200/50 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-white/[0.01]"
                  >
                    <p className="p-5 text-sm text-zinc-650 dark:text-[#8696a0] leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* --- SECTION 13: HOW IT WORKS --- */}
      <section className="py-20 px-6 max-w-7xl mx-auto z-10 relative">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#06A0F8]/10 border border-[#06A0F8]/20 rounded-full w-fit mx-auto mb-4">
            <Layers className="w-3.5 h-3.5 text-[#06A0F8]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#06A0F8]">Quick Setup</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-white">
            Up and Running in 3 Steps.
          </h2>
          <p className="text-zinc-650 dark:text-[#8696a0] text-sm mt-4 max-w-lg mx-auto">
            No complex configurations. Orbix is built to get your team communicating in under 60 seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative group">
          {/* Connecting Lines (Desktop only) */}
          <div className="hidden md:block absolute top-24 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-[#06A0F8]/20 via-[#6D5DF6]/20 to-[#FF4F8C]/20 z-0">
            {/* Animated Flow Dot */}
            <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,1)] animate-ping" style={{ left: '0%', animationDuration: '3s' }} />
          </div>

          {/* Step 1 */}
          <div className="relative flex flex-col items-center text-center gap-5 p-8 bg-white/80 dark:bg-[#0A0A0A]/70 border border-zinc-200/80 dark:border-white/[0.08] rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cf-card-glow">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#06A0F8] to-[#00D8E3] flex items-center justify-center shadow-lg shadow-[#06A0F8]/30">
                <Users className="w-7 h-7 text-white" />
              </div>
              <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#06A0F8] text-white text-xs font-black flex items-center justify-center">1</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Create Your Account</h3>
              <p className="text-base text-zinc-600 dark:text-[#8696a0] leading-relaxed">Sign up in seconds with your email or phone number. No credit card required for free tier.</p>
            </div>
            <Link href="/signup" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#06A0F8] hover:text-[#00D8E3] transition-colors">
              Create Account <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Step 2 */}
          <div className="relative flex flex-col items-center text-center gap-5 p-8 bg-white/80 dark:bg-[#0A0A0A]/70 border border-zinc-200/80 dark:border-white/[0.08] rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cf-card-glow">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#6D5DF6] to-[#4F8CFF] flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Hash className="w-7 h-7 text-white" />
              </div>
              <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#6D5DF6] text-white text-xs font-black flex items-center justify-center">2</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Create or Join a Space</h3>
              <p className="text-base text-zinc-600 dark:text-[#8696a0] leading-relaxed">Start a private chat, build a team group, or join a community channel — all in one unified workspace.</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#6D5DF6]">Explore Channels <ChevronRight className="w-3.5 h-3.5" /></span>
          </div>

          {/* Step 3 */}
          <div className="relative flex flex-col items-center text-center gap-5 p-8 bg-white/80 dark:bg-[#0A0A0A]/70 border border-zinc-200/80 dark:border-white/[0.08] rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cf-card-glow">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF4F8C] to-[#FF9F43] flex items-center justify-center shadow-lg shadow-pink-500/30">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#FF4F8C] text-white text-xs font-black flex items-center justify-center">3</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Communicate Freely</h3>
              <p className="text-base text-zinc-600 dark:text-[#8696a0] leading-relaxed">Text, voice, video, share files, react, star messages — all end-to-end encrypted and blazing fast.</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#FF4F8C]">See Features <ChevronRight className="w-3.5 h-3.5" /></span>
          </div>
        </div>
      </section>

      {/* --- SECTION 13b: APP AVAILABILITY SHOWCASE --- */}
      <section id="download" className="py-20 px-6 bg-zinc-100/50 dark:bg-[#0A0A0A]/30 relative z-10 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#06A0F8]/5 dark:bg-[#06A0F8]/8 filter blur-[100px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-16">
            {/* Left: Text */}
            <div className="flex flex-col gap-6 max-w-lg">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#06A0F8]/10 border border-[#06A0F8]/20 rounded-full w-fit">
                <Sparkles className="w-3.5 h-3.5 text-[#06A0F8]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#06A0F8]">Apps Coming Soon</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-white">
                Use on Web Today. <br />
                <span className="text-[#06A0F8]">Apps Launching Soon.</span>
              </h2>
              <p className="text-base text-zinc-600 dark:text-[#8696a0] leading-relaxed">
                Orbix is live right now as a web app — no download needed. Open your browser and start chatting instantly. Our Android, iOS, and desktop apps are coming very soon!
              </p>
              <div className="flex flex-col gap-3">
                {/* App Store - Coming Soon */}
                <div className="relative inline-flex items-center gap-3 px-6 py-4 bg-zinc-900 dark:bg-zinc-800 border border-zinc-800 dark:border-white/[0.06] text-white rounded-xl cursor-not-allowed select-none w-fit shadow-md transition-all">
                  {/* Apple logo */}
                  <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                  <div className="text-left">
                    <div className="text-xs opacity-70 uppercase tracking-wider">Coming to</div>
                    <div className="text-base font-bold">App Store</div>
                  </div>
                  <span className="ml-3 text-xs bg-zinc-800/80 text-zinc-400 px-2.5 py-0.5 rounded-full font-bold uppercase">Soon</span>
                </div>
                {/* Google Play - Coming Soon */}
                <div className="relative inline-flex items-center gap-3 px-6 py-4 bg-zinc-900 dark:bg-zinc-800 border border-zinc-800 dark:border-white/[0.06] text-white rounded-xl cursor-not-allowed select-none w-fit shadow-md transition-all">
                  {/* Correct Google Play icon */}
                  <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 512 512" fill="currentColor"><path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l232.6-233-232.6-233zm258.3 173.8L285.7 194 47 0l258.3 173.8zm-11.4 204.8l19.6 19.6L85.4 512 294 378.6zm0 0"/></svg>
                  <div className="text-left">
                    <div className="text-xs opacity-70 uppercase tracking-wider">Coming to</div>
                    <div className="text-base font-bold">Google Play</div>
                  </div>
                  <span className="ml-3 text-xs bg-zinc-800/80 text-zinc-400 px-2.5 py-0.5 rounded-full font-bold uppercase">Soon</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-[#8696a0]">
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#00D8E3]" /> 100% Free</span>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#00D8E3]" /> No ads</span>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#00D8E3]" /> No data selling</span>
              </div>
            </div>

            {/* Right: Platform Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-sm">
              {/* Web - LIVE */}
              <div className="col-span-full bg-white dark:bg-[#0A0A0A] border-2 border-[#06A0F8] dark:border-[#06A0F8]/60 rounded-2xl p-5 flex items-center gap-4 shadow-lg shadow-[#06A0F8]/10 dark:shadow-[0_0_30px_rgba(6, 160, 248,0.10),0_8px_24px_rgba(0,0,0,0.4)]">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#06A0F8] to-[#00D8E3] flex items-center justify-center flex-shrink-0">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-zinc-900 dark:text-white">Web App</div>
                  <div className="text-xs text-zinc-500 dark:text-[#8696a0] mt-0.5">orbix.app — open in any browser</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#00D8E3] animate-pulse" />
                  <span className="text-xs font-bold text-[#00D8E3]">Live</span>
                </div>
              </div>

              {/* Android */}
              <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/[0.06] hover:dark:border-[#06A0F8]/30 rounded-2xl p-5 flex flex-col items-center text-center gap-3 shadow-sm dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)] transition-all">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#3ddc84] to-[#5af776] flex items-center justify-center opacity-70">
                  {/* Android logo */}
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="white">
                    <path d="M17.523 15.341l1.005-1.74a.374.374 0 0 0-.648-.375l-1.017 1.76A6.558 6.558 0 0 0 14 14.25H10a6.558 6.558 0 0 0-2.862.736L6.12 13.226a.375.375 0 0 0-.648.375l1.005 1.74A6.5 6.5 0 0 0 3.25 21h17.5a6.5 6.5 0 0 0-3.227-5.659zM9 18.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm6 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM7.319 8.596l-1.5-2.598a.75.75 0 0 1 1.299-.75l1.527 2.645A7.454 7.454 0 0 1 12 7.25c.852 0 1.67.143 2.432.407l1.527-2.645a.75.75 0 0 1 1.299.75l-1.5 2.598A7.5 7.5 0 0 1 19.5 14H4.5a7.5 7.5 0 0 1 2.819-5.404z"/>
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-bold text-zinc-900 dark:text-white">Android</div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Google Play Store</div>
                </div>
                <span className="text-xs bg-amber-500/10 text-amber-500 border border-amber-500/25 px-2.5 py-1 rounded-full font-bold">Coming Soon</span>
              </div>

              {/* iOS */}
              <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/[0.06] hover:dark:border-[#06A0F8]/30 rounded-2xl p-5 flex flex-col items-center text-center gap-3 shadow-sm dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)] transition-all">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-zinc-600 to-zinc-400 flex items-center justify-center opacity-70">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.44-2.94 1.42-.15-1.15.41-2.35 1.04-3.11z"/></svg>
                </div>
                <div>
                  <div className="text-sm font-bold text-zinc-900 dark:text-white">iOS</div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">iPhone &amp; iPad</div>
                </div>
                <span className="text-xs bg-amber-500/10 text-amber-500 border border-amber-500/25 px-2.5 py-1 rounded-full font-bold">Coming Soon</span>
              </div>

              {/* Desktop */}
              <div className="col-span-full bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/[0.06] hover:dark:border-[#06A0F8]/30 rounded-2xl p-5 flex items-center gap-4 shadow-sm dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)] transition-all">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#34b7f1] to-[#5dc8f5] flex items-center justify-center opacity-70 flex-shrink-0">
                  {/* Monitor/Desktop SVG */}
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="white">
                    <path d="M20 3H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h6.5l-1.5 3H7a1 1 0 0 0 0 2h10a1 1 0 0 0 0-2h-2l-1.5-3H20a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 13H4V5h16v11z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-zinc-900 dark:text-white">Desktop App</div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Windows &amp; macOS</div>
                </div>
                <span className="text-xs bg-[#34b7f1]/10 text-[#34b7f1] border border-[#34b7f1]/25 px-2.5 py-1 rounded-full font-bold">Coming Soon</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECTION 13c: REAL USER LOVE / SOCIAL PROOF --- */}
      <section className="py-16 px-6 max-w-7xl mx-auto z-10 relative">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#06A0F8]/10 border border-[#06A0F8]/20 rounded-full w-fit mx-auto mb-4">
            <Star className="w-3.5 h-3.5 text-[#06A0F8]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#06A0F8]">What People Say</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-zinc-900 dark:text-white">
            Loved Across India
          </h2>
          <p className="text-base text-zinc-600 dark:text-zinc-300 mt-3 max-w-md mx-auto">
            From college groups to family chats — Orbix is where Indian conversations happen.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: "Priya S.",
              city: "Mumbai",
              avatar: "P",
              color: "#EC4899",
              text: "Finally a chat app that feels as fast as WhatsApp but doesn't sell my data! The encryption is 🔥 and I love the status feature.",
              stars: 5,
            },
            {
              name: "Arjun K.",
              city: "Bengaluru",
              avatar: "A",
              color: "#6D5DF6",
              text: "Been using Orbix for my college group. Video calls are smooth even on 4G and the group features are way better than what we had before.",
              stars: 5,
            },
            {
              name: "Divya R.",
              city: "Chennai",
              avatar: "D",
              color: "#F97316",
              text: "Love that it's completely free and made in India. The UI is so clean — feels premium without paying anything. App coming soon on Android? Can't wait! 🙌",
              stars: 5,
            },
          ].map((review) => (
            <div key={review.name} className="group relative ios-glass-panel hover:dark:border-[#06A0F8]/40 rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-xl dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] dark:hover:shadow-[0_0_30px_rgba(6, 160, 248,0.15)] hover:-translate-y-1 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[#06A0F8]/0 group-hover:to-[#06A0F8]/5 rounded-2xl transition-colors pointer-events-none" />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md"
                    style={{ backgroundColor: review.color }}
                  >
                    {review.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-900 dark:text-white">{review.name}</div>
                    <div className="text-xs text-zinc-500 dark:text-[#8696a0] flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5" />{review.city}
                    </div>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: review.stars }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                  ))}
                </div>
              </div>
              <p className="text-base font-medium text-zinc-600 dark:text-zinc-300 leading-relaxed flex-1 relative z-10">
                &ldquo;{review.text}&rdquo;
              </p>
            </div>
          ))}
        </div>

        {/* User count stat bar */}
        <div className="mt-12 bg-white dark:bg-[#0A0A0A]/80 border border-zinc-200/60 dark:border-[#06A0F8]/12 rounded-2xl p-6 grid grid-cols-2 md:grid-cols-4 gap-6 dark:shadow-[0_0_40px_rgba(6, 160, 248,0.04)]">
          {[
            { value: "100%", label: "Free Forever" },
            { value: "E2E", label: "Encrypted Always" },
            { value: "12ms", label: "Avg. Latency" },
            { value: "🇮🇳", label: "Made in India" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-2xl font-extrabold text-zinc-900 dark:text-[#00D8E3]">{value}</div>
              <div className="text-xs text-zinc-500 dark:text-[#8696a0] uppercase tracking-wider mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* --- SECTION 14: FINAL CTA --- */}
      <section className="py-16 px-6 max-w-7xl mx-auto z-10 relative">
        {/* Glow wrapper container */}
        <div className="bg-gradient-to-br from-[#0a101f] via-[#050a0f] to-[#000000] border border-[#00D8E3]/20 dark:border-[#00D8E3]/30 rounded-3xl p-12 md:p-20 relative overflow-hidden flex flex-col items-center text-center shadow-2xl shadow-[#06A0F8]/10 dark:shadow-[0_0_120px_rgba(6, 160, 248,0.10),0_40px_80px_rgba(0,0,0,0.6)]">
          
          {/* Internal background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#06A0F8]/10 filter blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#00D8E3]/5 filter blur-[60px] rounded-full pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#00D8E3]/15 border border-[#00D8E3]/25 rounded-full w-fit mb-6 relative z-10">
            <Sparkles className="w-3.5 h-3.5 text-[#00D8E3]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#00D8E3]">Get Started Free</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-6 relative z-10">
            Start Connecting <br />
            <span className="bg-gradient-to-r from-[#06A0F8] via-[#00D8E3] to-[#5D32FA] bg-clip-text text-transparent">
              Without Limits.
            </span>
          </h2>
          
          <p className="text-sm text-[#8696a0] max-w-md mb-10 relative z-10">
            Create your free account today and experience real-time, encrypted messaging. No credit card. No limits on the free tier.
          </p>

          <div className="flex flex-wrap justify-center gap-4 relative z-10">
            <Link href="/signup" className="px-8 py-4 bg-[#00D8E3] hover:bg-[#06A0F8] rounded-xl font-semibold shadow-lg shadow-[#00D8E3]/30 hover:shadow-[#00D8E3]/50 text-white transition-all flex items-center gap-2 group">
              Create Free Account
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/login" className="group relative px-8 py-4 bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.12] hover:border-white/[0.2] rounded-xl font-semibold text-white transition-all flex items-center gap-2 overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.2)]">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer-move_1.5s_infinite]" />
              <span className="relative z-10">Sign In</span>
              <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-6 mt-10 pt-10 border-t border-white/[0.06] relative z-10 w-full">
            {[
              { icon: Shield, label: "E2E Encrypted" },
              { icon: Lock, label: "Zero Knowledge" },
              { icon: Globe, label: "India Data Centers" },
              { icon: Cpu, label: "12ms Latency" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-[#8696a0]">
                <Icon className="w-3.5 h-3.5 text-[#00D8E3]" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SECTION 14: FOOTER --- */}
      <footer className="bg-white dark:bg-[#000000] border-t border-zinc-200/80 dark:border-[#06A0F8]/10 py-12 px-6 relative z-10 dark:shadow-[inset_0_1px_0_rgba(6, 160, 248,0.06)]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12">
          
          {/* Logo & Info column */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="Orbix Logo" 
                className="w-12 h-12 object-contain drop-shadow-sm" 
              />
              <span className="font-semibold text-lg text-zinc-950 dark:text-white">Orbix</span>
            </div>
            <p className="text-sm text-zinc-650 dark:text-[#8696a0] leading-relaxed max-w-sm">
              Orbix is a next-generation real-time messaging framework combining privacy, collaboration, and high-performance communication.
            </p>
          </div>

          {/* Links column 1 */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-sm font-bold text-zinc-950 dark:text-white uppercase tracking-wider">Product</h4>
            <ul className="space-y-3 text-sm text-zinc-650 dark:text-[#8696a0]">
              <li><a href="#features" className="hover:text-zinc-950 dark:hover:text-white transition-colors">Features</a></li>
              <li><a href="#security" className="hover:text-zinc-950 dark:hover:text-white transition-colors">Security Specs</a></li>
              <li><a href="#pricing" className="hover:text-zinc-950 dark:hover:text-white transition-colors">Pricing Options</a></li>
              <li><a href="#download" className="hover:text-zinc-950 dark:hover:text-white transition-colors">Downloads</a></li>
            </ul>
          </div>

          {/* Links column 2 */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-sm font-bold text-zinc-950 dark:text-white uppercase tracking-wider">Developers</h4>
            <ul className="space-y-3 text-sm text-zinc-650 dark:text-[#8696a0]">
              <li><a href="#api" className="hover:text-zinc-950 dark:hover:text-white transition-colors">Websocket API</a></li>
              <li><a href="#docs" className="hover:text-zinc-950 dark:hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#github" className="hover:text-zinc-950 dark:hover:text-white transition-colors">Open Source</a></li>
            </ul>
          </div>

          {/* Links column 3 */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-sm font-bold text-zinc-950 dark:text-white uppercase tracking-wider">Legal</h4>
            <ul className="space-y-3 text-sm text-zinc-650 dark:text-[#8696a0]">
              <li><a href="#terms" className="hover:text-zinc-950 dark:hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#privacy" className="hover:text-zinc-950 dark:hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#security" className="hover:text-zinc-950 dark:hover:text-white transition-colors">GDPR Compliance</a></li>
            </ul>
          </div>

          {/* Newsletter signup */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-sm font-bold text-zinc-950 dark:text-white uppercase tracking-wider">Newsletter</h4>
            <p className="text-sm text-zinc-550 dark:text-[#8696a0]">Subscribe to release notes and updates.</p>
            <form onSubmit={(e) => e.preventDefault()} className="flex items-center mt-2 relative">
              <input 
                type="email" 
                placeholder="you@domain.com"
                className="w-full bg-zinc-100/80 dark:bg-white/[0.04] border border-zinc-200/80 dark:border-white/[0.06] rounded-lg py-2.5 px-3 text-sm text-zinc-950 dark:text-white placeholder-[#8696a0] focus:outline-none focus:border-[#06A0F8]/50 transition-colors"
              />
              <button 
                type="submit"
                className="absolute right-1 px-4 py-1.5 bg-[#06A0F8] hover:bg-[#06A0F8]/95 rounded text-sm font-bold text-white transition-colors cursor-pointer"
              >
                Join
              </button>
            </form>
          </div>

        </div>

        {/* Copyright */}
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-zinc-200/50 dark:border-white/[0.04] flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-sm text-zinc-500 dark:text-[#8696a0]">© {new Date().getFullYear()} Orbix Inc. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="#twitter" className="text-sm font-medium text-zinc-500 dark:text-[#8696a0] hover:text-zinc-950 dark:hover:text-white transition-colors">Twitter</a>
            <a href="#github" className="text-sm font-medium text-zinc-500 dark:text-[#8696a0] hover:text-zinc-950 dark:hover:text-white transition-colors">GitHub</a>
            <a href="#discord" className="text-sm font-medium text-zinc-500 dark:text-[#8696a0] hover:text-zinc-950 dark:hover:text-white transition-colors">Discord</a>
          </div>
        </div>
      </footer>

    </div>
  );
}