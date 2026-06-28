"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";

function SystemThemeEnforcer({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme();

  React.useEffect(() => {
    // Force reset theme to follow the OS/System setting
    setTheme("system");
  }, [setTheme]);

  return <>{children}</>;
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <SystemThemeEnforcer>{children}</SystemThemeEnforcer>
    </NextThemesProvider>
  );
}
