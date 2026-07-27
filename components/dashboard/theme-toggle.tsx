"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Component yüklendiğinde localStorage'ı kontrol et
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Hydration hatasını önlemek için ilk render'da duruma göre mount state
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button className="flex size-8 sm:size-9 md:size-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-black/5 hover:text-primary cursor-pointer">
        <Moon className="size-4 sm:size-5 opacity-0" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle Dark Mode"
      className="flex size-8 sm:size-9 md:size-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-black/5 hover:text-primary cursor-pointer"
    >
      {isDark ? <Sun className="size-4 sm:size-5" /> : <Moon className="size-4 sm:size-5" />}
    </button>
  );
}
