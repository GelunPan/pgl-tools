import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Bento 网格容器。
 *
 * ⚠️ 这一串 class 是**从 zhangyu.dev 的 DOM 上直接抄下来的原文**，一个字符都别改
 * （断点、轨道宽度、间距、暗色辉光都是量出来的）。要点三条：
 *
 * 1. **固定轨道宽度 + 居中 + 密集流**。不是 `1fr` 自适应，而是每格写死 px
 *    （base 140 → md 180 → lg 220 → xl 280），再用 `justify-center` 把整块居中 ——
 *    这样屏幕再宽卡片也不会被拉变形，只是两侧留白变多。
 *
 * 2. **`grid-flow-row-dense`** 让不同尺寸的格子自动回填空洞，
 *    所以下面各模块只需要声明 `col-span-*` / `row-span-*`，不必手工排序。
 *
 * 3. 暗色下铺一层极淡的紫色椭圆辉光（`dark:bg-[radial-gradient(...)]`），
 *    避免大块纯黑显得死板；`transition-all duration-1000 ease-out`
 *    让切主题时整块网格跟着 1s 缓慢过渡。
 *
 * 实测（1600px 视口，xl）：`cols = 280px × 4`、`auto-rows = 280px`、
 * `gap = 32px`、`padding = 48px`、`justify-content = center`。
 */
export function BentoGrid({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid grid-flow-row-dense auto-rows-[140px] grid-cols-[repeat(2,140px)] justify-center gap-4 p-4",
        "transition-all duration-1000 ease-out",
        "dark:bg-[radial-gradient(ellipse_100%_40%_at_50%_60%,rgba(102,99,246,0.07),transparent)]",
        "sm:grid-cols-[repeat(4,140px)]",
        "md:auto-rows-[180px] md:grid-cols-[repeat(4,180px)]",
        "lg:auto-rows-[220px] lg:grid-cols-[repeat(4,220px)] lg:gap-6 lg:p-8",
        "xl:auto-rows-[280px] xl:grid-cols-[repeat(4,280px)] xl:gap-8 xl:p-12",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Bento 卡片（模块）外壳 —— 与参考站同一个组件的同一串 class。
 *
 * ## 最关键的一招：暗色下的「1px 渐变细边」
 *
 * 浅色下它就是一个普通的 `border`。但暗色下普通 1px 实线边框会显得发白、发脏，
 * 参考站改用 `::before` 叠一层 **垂直渐变（白 10% → 白 7%）** 并只留 1px 宽：
 *
 * ```
 *   p-px                        ← 撑出 1px 的「边框宽度」
 *   mask-clip: content-box,border-box
 *   mask-image: 两层全黑（= 两层都不透明）
 *   mask-composite: exclude     ← 两层相减 → 只剩中间那 1px 环
 * ```
 *
 * 所以它不是边框，是**被遮罩挖出来的渐变环**，因此能做出「上亮下暗」的立体感，
 * 这是实线 border 做不到的。这几个任意值类一个都不能删
 * （`mask-clip` / `mask-composite` / `mask-image` / `p-px` 四件套，见 PROJECT.md）。
 * 注意 `content-["_"]` 里是**一个下划线**而不是空串 —— 参考站原文如此，
 * 空串在部分浏览器上会让 `::before` 不生成，整条细边消失。
 *
 * ## `bare`：连这 1px 细边都不要的卡片
 *
 * 主题切换卡在参考站里是 `border-none bg-surface shadow-none
 * dark:bg-transparent dark:before:content-none` —— 浅色下无描边（好让月牙用
 * `bg-surface` 咬出来的洞和页面白底对上），暗色下连细边也去掉（卡片彻底融进夜色，
 * 只剩中间的月亮浮着）。渐变细边那 8 个类由 `bare` 直接不输出，
 * 而不是靠 `className` 里再写一句 `dark:before:content-none` 去覆盖 ——
 * 因为 `content-none` 与 `content-["_"]` 在 Tailwind 生成顺序上谁压谁不确定，不能赌。
 */
const CARD_EDGE_DARK = [
  "dark:border-none dark:shadow-none",
  "dark:before:pointer-events-none dark:before:absolute dark:before:inset-0",
  "dark:before:rounded-[inherit] dark:before:content-['_']",
  "dark:before:bg-[linear-gradient(rgba(255,255,255,0.1),rgba(255,255,255,0.07))]",
  "dark:before:p-px",
  "dark:before:[mask-clip:content-box,border-box]",
  "dark:before:[mask-composite:exclude]",
  "dark:before:[mask-image:linear-gradient(black,black),linear-gradient(black,black)]",
];

export function BentoCard({
  className,
  children,
  bare = false,
  ...props
}: React.ComponentProps<"div"> & {
  /** 去掉描边与暗色细边，让卡片完全融进底色（主题切换卡专用） */
  bare?: boolean;
}) {
  return (
    <div
      data-bento-card
      data-bare={bare ? "" : undefined}
      className={cn(
        // 描边用 `border-hairline` 而不是裸 `border`：
        // 本项目里裸 `border` 的 border-color 会回退到 currentColor（正文色），
        // 浅色下就是一道深灰实线，太抢眼。`--hairline` 的颜色值与参考站的
        // `--border` 完全相同（浅 229 231 235 / 暗 51 65 85），换个名字而已。
        "relative rounded-xl border border-hairline p-2.5 text-sm shadow-bento",
        // 主题切换时卡片自身的过渡（与全局 1s 叠加，观感一致）
        "transition-[filter] duration-700",
        bare
          ? "border-none shadow-none"
          : CARD_EDGE_DARK,
        // ---- 响应式圆角 / 内距：12px → 16px → 24px ----
        "lg:rounded-2xl lg:p-4 xl:rounded-3xl",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
