"use client";

import { useTheme } from "next-themes";

export function useAppTheme() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const toggle = () => setTheme(isDark ? "light" : "dark");

  return { isDark, toggle, theme: resolvedTheme };
}
