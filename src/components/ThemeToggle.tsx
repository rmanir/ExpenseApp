"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-full glass-card animate-pulse" />
    );
  }

  const toggleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full glass-card hover:bg-slate-900/5 dark:hover:bg-white/10 transition-colors w-9 h-9 flex items-center justify-center"
      title={`Theme: ${theme}`}
    >
      {theme === "light" && <Sun className="w-4 h-4 text-amber-500" />}
      {theme === "dark" && <Moon className="w-4 h-4 text-emerald-400" />}
      {theme === "system" && <Monitor className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
    </button>
  );
}
