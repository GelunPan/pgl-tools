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
 * 当前分类 + 「弱化提示是否已随滚动消散」。
 *
 * 用 context 而不是逐层传 props —— 参考站靠 `useParams()` 全局拿，
 * 卡片里不用写任何参数；我们等价地用 context，16 张卡就不用各自记住
 * 「自己在哪个分类里被筛」。
 *
 * ## 「消散」（2026-09-29 加，小潘点名要的）
 *
 * 未命中的卡本来是 `blur(3px)` + `opacity: .8` —— 那是「你筛的是这一类」
 * 的视觉提示，**站在网格顶部时才成立**。手机上一屏只看得到三四张卡，
 * 筛完满屏都是糊的；往下翻本来就是要看那些被排到后面的卡，再糊着纯属添堵。
 *
 * 所以提示改成**跟着滚动走**：滚动容器上写一个 `--bento-dim`（1 = 全弱化，
 * 0 = 完全清晰，由 `useBentoDim` 按 scrollTop 逐帧写），卡片自己用
 * `blur(calc(var(--bento-dim) * 3px))` 读它 —— 逐帧变化但**零 React 重渲染**。
 *
 * `dissolved` 只在跨过阈值时翻一次（带迟滞），它决定的是**更硬的那件事**：
 * 完全消散后把 `filter` 整个从卡片上撤掉。🔴 不能一直挂着 `blur(0px)` ——
 * `filter` 只要不是 `none` 就会新建一层 backdrop root，⑭ 波浪卡里那句
 * `mix-blend-difference` 的反色会跟着变味（见 bento-card.tsx 的注释）。
 * 顺带把 `pointer-events` 还给卡片：都看清了还不让点，说不过去。
 */
export type BentoFilterState = {
  /** 当前分类 */
  tab: BentoTabName;
  /** 弱化提示是否已随滚动完全消散 */
  dissolved: boolean;
};

export const BentoFilterContext = React.createContext<BentoFilterState>({
  tab: "all",
  dissolved: false,
});

/** 命中判定：`all` 或未分类的卡片永远命中（参考站的 `!tab || c`） */
export function isCardMatched(
  active: BentoTabName,
  dataType: BentoCardType | undefined,
): boolean {
  if (active === "all") return true;
  if (!dataType) return true;
  return active === dataType;
}
