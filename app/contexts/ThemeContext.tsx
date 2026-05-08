"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { themes } from "@/app/themes";

type ThemeContextType = {
  themeId: string;
  setThemeId: (id: string) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState("basicLight");
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("theme") || "basicLight";
    setThemeId(saved);
    setMounted(true);
  }, []);

  // Apply theme when it changes
  useEffect(() => {
    if (!mounted) return;

    const theme = themes.find(t => t.id === themeId);
    if (!theme) return;

    const root = document.documentElement;

    // Apply all color properties
    Object.entries(theme).forEach(([key, value]) => {
      if (key === "id" || key === "name") return;
      const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVar, value as string);
    });

    localStorage.setItem("theme", themeId);
  }, [themeId, mounted]);

  return (
    <ThemeContext.Provider value={{ themeId, setThemeId }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
