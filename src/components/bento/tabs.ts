"use client";

import * as React from "react";

/**
 * 顶部导航的分类定义 —— 与参考站同一套机制。
 *
 * ## 参考站是怎么做的（2026-09-24 反查其 chunk 得到原文）
 *
 * 它的导航是**真链接**（`/` `/posts` `/tags` `/projects` `/about`），
 * 路由一变，`useParams().tab` 就变了；每张卡片再拿这个 tab 跟自己的
 * `data-type` 比一比：
 *
 * ```js
 * const c = tab === rest["data-type"];      // 命中？
 * const f = !tab || c;                      // 没 tab（首页）= 全部命中
 * style={{ filter: f ? "blur(0)" : "blur(3px)",
 *          opacity: f ? 1 : 0.8,
 *          order:   f ? 0 : 1,            // ← 命中者排到最前
 *          ...(f ? {} : { pointerEvents: "none", userSelect: "none" }) }}
 * ```
 *
 * 所以「点一下，对应的就挪到第一位」不是位移动画，而是**`order` 重排**；
 * 「丝滑」则由 `useFlip` 的 FLIP 补间负责（见 `hooks/use-flip.ts`）。
 *
 * ## 我们这边的两处不同（都是有意的）
 *
 * 1. **不走路由，走本地状态。** 本项目是 `output: "export"` 的静态导出，
 *    导航项并不是独立页面（它们只是同一个网格的不同筛选）。本地状态的好处是
 *    切一下**零网络、零跳转**，也就顺手解决了小潘说的「切换非常缓慢」。
 * 2. **多一个「全部」。** 参考站第一个 tab 就是 All（`/`），我们照搬：
 *    没有它，一旦筛过就回不到全集了。
 *
 * ⚠️ 状态**刻意不同步到 URL**：静态导出下服务端预渲染的是「全部」那一版，
 * 想从 `?tab=` 读初值就只能等 hydration 之后再改，会先闪一帧全部再跳到筛选结果。
 */

export const BENTO_TABS = [
  { name: "all", label: "全部" },
  { name: "toolbox", label: "工具箱" },
  { name: "tags", label: "标签" },
  { name: "projects", label: "项目" },
  { name: "about", label: "关于" },
] as const;

export type BentoTabName = (typeof BENTO_TABS)[number]["name"];

/** 卡片能挂的分类（`all` 是导航项，不是卡片分类） */
export type BentoCardType = Exclude<BentoTabName, "all">;

/**
 * 当前分类。用 context 而不是逐层传 props ——
 * 参考站靠 `useParams()` 全局拿，卡片里不用写任何参数；我们等价地用 context，
 * 16 张卡就不用各自记住「自己在哪个分类里被筛」。
 */
export const BentoFilterContext = React.createContext<BentoTabName>("all");

/** 命中判定：`all` 或未分类的卡片永远命中（参考站的 `!tab || c`） */
export function isCardMatched(
  active: BentoTabName,
  dataType: BentoCardType | undefined,
): boolean {
  if (active === "all") return true;
  if (!dataType) return true;
  return active === dataType;
}
