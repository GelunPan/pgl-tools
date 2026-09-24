"use client";

import * as React from "react";

import { SettingsIcon } from "@/components/bento/icons";
import { BENTO_TABS, type BentoTabName } from "@/components/bento/tabs";
import { cn } from "@/lib/utils";

/**
 * 页头 —— 结构照搬 zhangyu.dev 的 `<header>`。
 *
 * 三栏网格（`md:grid-cols-3`）：左 logo / 中导航 / 右设置，`sm:h-36` 固定 144px 高。
 * 这个 144px 不是随便定的 —— 网格区第一行卡片的 y 坐标就是「144（页头）+ 网格
 * padding」，跟参考站逐像素对齐（后来为了给 👋 留天顶空间把网格顶部 padding
 * 加大了，见 bento-card.tsx 的 BentoGrid 注释）。改页头高度会整体位移。
 *
 * ## 胶囊导航的滑动指示器
 *
 * 导航本体是一个 `rounded-full bg-surface-2 p-1.5 shadow-inner` 的胶囊，
 * 里面**第一层**是一个绝对定位的白色圆角块（指示器），**第二层**才是 `<ul>`。
 * 指示器不跟某个 `<li>` 走，而是被 JS 测量后写成 inline 的
 * `transform: translateX(Npx); width: Wpx`，靠 transition 滑过去 ——
 * 所以切 tab 是「白块慢慢滑」，不是「旧的高亮消失、新的出现」。
 *
 * 🔴 首屏（SSR）量不到宽度，此时指示器必须是 `opacity-0`。
 *    否则会在左上角先闪一小块白色，再滑到正确位置。所以用 `ready` 状态门控。
 *
 * ## 2026-09-24 的两处改动
 *
 * 1. **多了一个「全部」**。参考站第一个 tab 就是 All，我们照搬 —— 没有它，
 *    筛过一次就回不到全集。5 项的宽度在 `md` 会有点挤，所以胶囊在中列
 *    `md:grid-cols-3` 里靠 `max-md:justify-self-center` 自己撑开（不再依赖
 *    参考站那个 3 等分列的宽度）。
 * 2. **指示器 1000ms → 700ms**。参考站原值是 1000ms，但它的 1000ms 是配「页面
 *    整块换掉」的；我们这边点一下是**卡片重排 + FLIP 位移**，那段补间是参考站
 *    自己定的 700ms。指示器跟着 700ms 走，整个切换才是**一段**动作而不是两段。
 *    小潘 2026-09-24 的原话是「切换非常缓慢」。
 * 3. 导航变成**受控组件**：`active` / `onChange` 由 /bento 页面持有，
 *    因为筛选要同时驱动 16 张卡的重排。
 *
 * ⚠️ 文字颜色的 `duration-1000` 保持不动 —— 那是整站统一的主题过渡节拍
 *   （见 PROJECT.md 4.7），跟「切 tab 手感」不是一回事。
 */

export function SiteHeader({
  productName = "pgl",
  productSuffix = ".tools",
  active,
  onChange,
  onLogout,
}: {
  productName?: string;
  productSuffix?: string;
  /** 当前分类 */
  active: BentoTabName;
  /** 切分类 */
  onChange: (name: BentoTabName) => void;
  onLogout?: () => void;
}) {
  const listRef = React.useRef<HTMLUListElement>(null);
  const [pill, setPill] = React.useState({ x: 0, w: 0, ready: false });

  /** 量出当前激活项的位置，写给指示器 */
  const measure = React.useCallback(() => {
    const ul = listRef.current;
    if (!ul) return;
    const li = ul.querySelector<HTMLLIElement>(`[data-name="${active}"]`);
    if (!li) return;
    setPill({ x: li.offsetLeft, w: li.offsetWidth, ready: true });
  }, [active]);

  // 首屏 + 字体加载完成后各量一次（Web 字体会让文字宽度变化）
  React.useEffect(() => {
    measure();
    const t = window.setTimeout(measure, 400);
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  return (
    <header className="grid items-center max-sm:my-6 max-sm:gap-4 sm:h-36 sm:grid-cols-[1fr_auto] sm:px-16 md:grid-cols-[1fr_auto_1fr]">
      {/* ---------- 左：渐变字 logo ---------- */}
      <h1 className="min-w-40 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent max-md:hidden max-sm:block max-sm:text-center dark:from-surface-4 dark:to-white/10">
        <a href="/bento">
          <strong className="text-2xl font-bold tracking-tighter xl:text-3xl">
            {productName}
          </strong>
          <small className="font-semibold tracking-normal xl:text-xl">{productSuffix}</small>
        </a>
      </h1>

      {/* ---------- 中：胶囊导航 ---------- */}
      <nav
        aria-label="卡片分类"
        className="relative justify-self-center rounded-full bg-surface-2 p-1.5 shadow-inner dark:bg-surface-1"
      >
        {/* 滑动指示器 */}
        <div
          aria-hidden
          className="absolute inset-y-1.5 left-1.5 rounded-full bg-surface shadow-sm transition-[opacity,transform] duration-700 ease-out dark:bg-surface-2"
          style={{
            transform: `translateX(${pill.x}px)`,
            width: pill.w ? `${pill.w}px` : undefined,
            opacity: pill.ready ? 1 : 0,
          }}
        />
        <ul ref={listRef} className="relative z-10 flex text-sm font-semibold">
          {BENTO_TABS.map((item) => {
            const on = item.name === active;
            return (
              <li
                key={item.name}
                aria-label={item.name}
                data-name={item.name}
                className={cn(
                  // ⚠️ 参考站原值只有 `px-2.5 sm:px-4`。我们把它拆成
                  //    `sm:px-3 lg:px-4`：中文标签比英文单词宽得多，5 项在
                  //    768~1024px 这个区间会顶穿中列（实测 md 下「工具箱」被折成两行）。
                  "px-2.5 py-1 transition-colors duration-1000 ease-out sm:px-3 lg:px-4",
                  on ? "text-brand" : "text-ink-3",
                )}
              >
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => onChange(item.name)}
                  className="cursor-pointer"
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ---------- 右：设置 / 退出 ---------- */}
      <div className="flex items-center gap-2 justify-self-end max-sm:hidden">
        <button
          type="button"
          aria-label="设置"
          className="rounded-full bg-surface-2 p-1 shadow-inner dark:bg-surface-1"
        >
          <SettingsIcon className="size-8 rounded-full p-1.5 text-ink-3 transition-all duration-1000 ease-out hover:text-ink-1" />
        </button>
        {onLogout ? (
          <button
            type="button"
            onClick={onLogout}
            className="rounded-full bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink-3 shadow-inner transition-all duration-1000 ease-out hover:text-ink-1 dark:bg-surface-1"
          >
            退出
          </button>
        ) : null}
      </div>
    </header>
  );
}
