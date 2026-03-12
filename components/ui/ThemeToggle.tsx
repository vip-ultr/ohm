"use client";

import { Sun, Moon } from "lucide-react";
import { useAppTheme } from "@/hooks/useTheme";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { isDark, toggle } = useAppTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <button
      className="btn-icon"
      onClick={toggle}
      title={mounted ? (isDark ? "Switch to light mode" : "Switch to dark mode") : "Toggle theme"}
      aria-label="Toggle theme"
      suppressHydrationWarning
    >
      {/* Render Moon by default (dark mode), swap after mount */}
      {mounted ? (isDark ? <Sun size={16} /> : <Moon size={16} />) : <Moon size={16} />}
    </button>
  );
}
