"use client";

import type { BentoTheme } from "@/hooks/use-bento-theme";

/**
 * 日 / 月主题切换（1×1 模块）。
 *
 * 结构逐类照搬 zhangyu.dev 的 `[aria-label="Theme Toggle"]`，一共 7 个绝对定位元素：
 *
 * ```
 *   云 ×3   size-1/5 的圆，各自用 ::before / ::after 再叠两个错位圆 → 三团云
 *   球 ×1   size-1/2，left-1/2 top-1/3 居中偏上；太阳橙红渐变 ↔ 月亮靛蓝渐变
 *   星 ×3   tabler 的 sparkles / north-star，浅色下停在 -top-1/4（视野外）
 * ```
 *
 * 🔴 整个切换**没有一帧 JS 动画**：全部靠 `transition-all duration-1000`
 *    加 `dark:` 变体，切主题时浏览器自己插值。所以任何「切主题时屏蔽 transition」
 *    的开关（next-themes 的 `disableTransitionOnChange`）都不能开，一开全废。
 *
 * 🔴 月牙的做法：球体 `::after` 是一块 `bg-surface` 的圆，`scale 0 → 100`
 *    从右上角咬掉一块。所以它咬出来的「洞」必须和卡片/页面底色同色 ——
 *    卡片因此设成 `bg-surface dark:bg-transparent`，不能随便换底色。
 *    右上角是 `origin-top-right`，所以缩放时贴住右上角不跑偏。
 *
 * 🔴 星星在浅色下被裁掉是**故意的**：它们停在 `-top-1/4`（卡片外 70px），
 *    而主题卡是 `overflow-hidden`，于是浅色下只看得见太阳。暗色下星星才
 *    移到 `top-[15%] / top-[5%] / top-[20%]` 落进卡片里。别「顺手修好」它。
 */
export function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: BentoTheme;
  onToggle: () => void;
}) {
  const isDark = theme === "dark";

  return (
    // 🔴 这个按钮**不能加 `relative`**。参考站的 `<button class="size-full">` 也没有，
    //    于是里面那些 `absolute` 元素的百分比是相对**整张卡片**（xl 下 280px）算的：
    //    球的 `size-1/2` = 140px，才占满卡片一半。
    //    一旦给 button 加 `relative`，包含块缩成卡片的 content box（280 − 2×16 = 248），
    //    球就变成 124px（小了 11%）；云朵的 `dark:-right-1/4` 也会少推 8px，
    //    导致云朵的 `::before` 从卡片右边缘漏出一小条白边。实测过，别加回去。
    // ⚠️ `group` 挂在外层卡片上（见 page.tsx），这里再套一层会截断 group-hover。
    <button
      type="button"
      aria-label="切换夜间模式"
      aria-pressed={isDark}
      onClick={onToggle}
      className="block size-full cursor-pointer outline-none"
    >
      {/* ---------- 三朵云 ---------- */}
      {/* 每朵：本体 + before（左侧错位圆）+ after（右下错位圆），三个圆拼成一朵云。
          暗色下整体飘出卡片左/右边缘（dark:-left-1/3 等）—— 卡片是
          overflow-hidden，所以云会被裁掉一半，看起来像飘出画外。 */}
      <div className={cnCloud("left-[15%] top-[10%]", "dark:-left-1/3")} />
      <div
        className={cnCloud(
          "right-[10%] top-1/4 [transform:rotateY(180deg)_scale(0.75)]",
          "dark:-right-1/4",
        )}
      />
      <div className={cnCloud("left-[5%] top-1/2 scale-75", "dark:-left-1/3")} />

      {/* ---------- 太阳 / 月亮 ---------- */}
      <div
        className={[
          "absolute left-1/2 top-1/3 z-20 size-1/2 -translate-x-1/2 -translate-y-1/3",
          "rounded-full bg-gradient-to-bl from-orange-300 via-orange-500 to-red-600",
          "transition-all duration-1000",
          // 月牙：一块与底色同色的圆，从右上角 scale 0 → 100 咬进来
          "after:absolute after:right-0 after:top-0 after:size-3/4",
          "after:origin-top-right after:scale-0 after:rounded-full after:bg-surface",
          "after:transition-transform after:duration-1000 after:content-['']",
          // 悬停时轻轻上浮 + 缩小
          "group-hover:-translate-y-[15%] group-hover:scale-90",
          "dark:from-slate-600 dark:via-indigo-600 dark:to-indigo-900 dark:after:scale-100",
        ].join(" ")}
      />

      {/* ---------- 三颗星（暗色才落在卡片内） ---------- */}
      <Sparkle className="absolute -top-1/4 left-[15%] size-6 fill-yellow-100 text-yellow-100 transition-all duration-1000 dark:top-[15%]" />
      <NorthStar className="absolute -top-1/4 left-1/2 size-5 text-yellow-50 transition-all duration-1000 dark:top-[5%]" />
      <NorthStar className="absolute -top-1/4 right-[10%] size-6 text-yellow-50 transition-all duration-1000 dark:top-[20%]" />

      {/* 无障碍：主题状态也播报一遍 */}
      <span className="sr-only">{isDark ? "当前夜间模式" : "当前日间模式"}</span>
    </button>
  );
}

/** 一朵云：本体 + 两个错位的圆（tabler 图标的 path 数据来自参考站，MIT） */
function cnCloud(position: string, darkShift: string) {
  return [
    "absolute size-1/5 rounded-full bg-gradient-to-b from-sky-100 to-white",
    "transition-all duration-1000",
    // 左上的错位圆
    "before:absolute before:-left-1/3 before:top-1/4 before:-z-10 before:size-2/3",
    "before:rounded-full before:bg-gradient-to-b before:from-sky-100 before:to-white before:content-['']",
    // 右下的错位圆
    "after:absolute after:-right-1/4 after:top-1/3 after:-z-10 after:size-1/2",
    "after:rounded-full after:bg-gradient-to-b after:from-sky-100 after:to-white after:content-['']",
    position,
    darkShift,
  ].join(" ");
}

function Sparkle({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6z" />
    </svg>
  );
}

function NorthStar({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 12h18" />
      <path d="M12 21v-18" />
      <path d="M7.5 7.5l9 9" />
      <path d="M7.5 16.5l9 -9" />
    </svg>
  );
}
