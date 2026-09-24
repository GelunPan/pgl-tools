import type { Metadata } from 'next';
import './globals.css';
import '@/styles/responsive-touch.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { FONT_FACE_CSS } from '@/lib/fonts';

export const metadata: Metadata = {
  title: '苹果绿的工具箱',
  description: '苹果绿的工具箱 · pgl-tools',
  icons: {
    icon: 'https://i.postimg.cc/nLrDYrHW/icon.png',
    apple: 'https://i.postimg.cc/nLrDYrHW/icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '苹果绿的工具箱',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#6366f1" />
        {/*
          🔴 **这里不要加回任何外部字体 `<link>`**（2026-09-24 踩过，整站黑屏）：
          `<head>` 里的外部样式表是**渲染阻塞**的，`fonts.googleapis.com` 在国内
          经常连得上却迟迟不响应，首屏就被无限期挂住 —— 页面底色是近黑的
          `rgb(12,10,9)`，看起来就是「一直卡在黑屏」。实测把请求挂住时，
          `performance.getEntriesByType("paint")` 一条都没有。

          字体已全部自托管：文件在 `public/fonts/`（Google 官方 woff2，来自 npm
          上的 @fontsource 包），`@font-face` 由 src/lib/fonts.ts 生成。
          现在整个页面**零外部字体请求**，首屏不依赖任何第三方网络。

          ⚠️ 也别改用 next/font/google：本项目是 output:"export" 静态导出，
             它会在**构建期**去抓 Google 字体，构建机没网就整包失败。
        */}
        <style dangerouslySetInnerHTML={{ __html: FONT_FACE_CSS }} />
      </head>
      <body className="font-body antialiased">
        {/*
          ⚠️ 这里**不要**再传 defaultTheme / enableSystem / disableTransitionOnChange。
          defaultTheme 与 enableSystem 由 theme-provider.tsx 统一决定（默认夜间）；
          而 disableTransitionOnChange 会在切换主题的那一瞬屏蔽页面上的**所有** transition，
          日月切换那 1000ms 的形变会被整段掐掉（变形直接跳到位），所以必须去掉。
          Bento 设计系统依赖主题切换时的长过渡，见 PROJECT.md 4.7。
        */}
        <ThemeProvider attribute="class">
            {children}
            <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
