"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      // 🔴 项目默认夜间：defaultTheme 用 dark 而不是 system。
      //    enableSystem 必须关掉 —— 否则系统是浅色的用户会绕过 defaultTheme，
      //    而工具箱主页是「以黑为底」设计的，底色不对整块 bento 都塌。
      defaultTheme="dark"
      enableSystem={false}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
