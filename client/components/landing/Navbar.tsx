import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";

export default function Navbar() {
  const [activeNav, setActiveNav] = useState("Features");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
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
    </>
  );
}
