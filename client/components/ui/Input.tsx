"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          type={type}
          className={cn(
            "w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none transition-colors duration-150 text-base",
            error
              ? "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/30"
              : "border-zinc-200 dark:border-zinc-700 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20",
            className
          )}
          {...props}
        />
        {error && (
          <span className="mt-1.5 block text-xs text-red-500 font-medium px-1">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
