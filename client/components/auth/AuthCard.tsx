"use client";

import * as React from "react";
import { useEffect, useState } from "react";

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
    <div className="relative flex min-h-[100dvh] items-center justify-center p-4 overflow-hidden bg-white dark:bg-zinc-950 select-none">

      {/* Card */}  
      <div
        className="relative w-full max-w-md p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md z-10"
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
      </div>
    </div>
  );
}
