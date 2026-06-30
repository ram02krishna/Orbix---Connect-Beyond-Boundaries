"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "../ui/Button";

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthCard({ children, title, subtitle }: AuthCardProps) {

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 overflow-hidden aurora-container select-none">
      <div className="absolute inset-0 grid-pattern pointer-events-none z-0" />
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
        <Link href="/">
          <Button
            variant="glass"
            size="sm"
            className="flex items-center gap-1.5 text-sm font-semibold"
          >
            <ArrowLeft size={14} />
            Back to Home
          </Button>
        </Link>

      </div>

      {/* Card */}  
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/80 backdrop-blur-xl shadow-lg z-10"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1.5 text-base text-zinc-500 dark:text-zinc-400">
              {subtitle}
            </p>
          )}
        </div>

        {children}
      </motion.div>
    </div>
  );
}
