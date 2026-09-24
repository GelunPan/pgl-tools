import type { Metadata } from "next";

import { TerminalSession } from "@/components/resume/terminal-session";

/**
 * /resume —— 点终端卡进来的「简历终端」（2026-09-24 深夜 v2：完全复刻 macOS 终端）。
 *
 * 照 zhangyu.dev/resume 1:1 复刻：#282935 全屏底上居中一张 macOS 终端窗 ——
 * 左上角红黄绿三灯（红灯 = 关闭 = 回工具箱，hover 显 ✕）、标题栏用户名、
 * ⌥⌘1；正文是一段逐字打出来的假终端会话（Typed/TypedText/TypedContent 三积木，
 * 实现在 components/resume/terminal-session.tsx，那里有扒参考站的完整笔记）。
 *
 * 🔴 页面壳是服务端组件（挂 metadata），终端本体是客户端组件；
 *    服务端 / 无 JS / reduced-motion 时整页**静态直出**（useSyncExternalStore 兜底），
 *    内容不依赖动画才可见。
 *
 * 🔴 主题：终端永远深色（跟日夜主题无关），配色照参考站写死。
 */

export const metadata: Metadata = {
  title: "小潘的简历 · 终端版",
  description: "xiaopan@MacBook-Air:~ 的一段终端会话",
};

export default function ResumePage() {
  return <TerminalSession />;
}
