"use client";

import { useCallback, useEffect, useState } from "react";
import { useTheme } from "next-themes";

export type BentoTheme = "dark" | "light";

/**
 * 工具箱主页的主题钩子 —— 对 `next-themes` 的一层薄封装。
 *
 * 为什么是「薄封装」而不是直接用 `useTheme()`：只有一个原因，
 * **静态导出（output: "export"）下服务端拿不到主题**，`theme` 首次渲染必为 `undefined`。
 * 这里把它归一成 `"dark"`，让 SSR / 首帧就渲染成夜间（与 `defaultTheme="dark"` 一致），
 * 这样夜间用户不会经历「先白后黑」的闪烁。
 *
 * 主题真正的落点是 `theme-provider.tsx` → `<html class="dark|light">`，
 * 全站共用一份，所以登录页 / 注册页也会跟着一起切（这是刻意的，见 PROJECT.md 4.7）。
 */
export function useBentoTheme() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // 挂载前一律按 dark 渲染，避免 hydration 不一致
  const resolved: BentoTheme = mounted && theme === "light" ? "light" : "dark";

  const toggle = useCallback(() => {
    setTheme(resolved === "dark" ? "light" : "dark");
  }, [resolved, setTheme]);

  return { theme: resolved, toggle, isDark: resolved === "dark", mounted };
}
