"use client";

import * as React from "react";

import { SettingsIcon } from "@/components/bento/icons";
import { cn } from "@/lib/utils";

/**
 * 页头 —— 结构照搬 zhangyu.dev 的 `<header>`。
 *
 * 三栏网格（`md:grid-cols-3`）：左 logo / 中导航 / 右设置，`sm:h-36` 固定 144px 高。
 * 这个 144px 不是随便定的 —— 网格区第一行卡片的 y 坐标就是「144（页头）+ 48（网格
 * padding）= 192」，跟参考站逐像素对齐。改高度会整体位移。
 *
 * ## 胶囊导航的滑动指示器
 *
 * 导航本体是一个 `rounded-full bg-surface-2 p-1.5 shadow-inner` 的胶囊，
 * 里面**第一层**是一个绝对定位的白色圆角块（指示器），**第二层**才是 `<ul>`。
 * 指示器不跟某个 `<li>` 走，而是被 JS 测量后写成 inline 的
 * `transform: translateX(Npx); width: Wpx`，靠 `transition-[opacity,transform] duration-1000`
 * 滑过去 —— 所以切 tab 是「白块慢慢滑」，不是「旧的高亮消失、新的出现」。
 *
 * 🔴 首屏（SSR）量不到宽度，此时指示器必须是 `opacity-0`。
 *    否则会在左上角先闪一小块白色，再滑到正确位置。所以用 `measured` 状态门控。
 *
 * 所有颜色过渡都是 `duration-1000`（1000ms）—— 和整站主题切换同一个节拍，
 * 这是参考站的统一设定，别改成 200/300ms。
 */
const NAV_ITEMS = [
  { name: "toolbox", label: "工具箱" },
  { name: "tags", label: "标签" },
  { name: "projects", label: "项目" },
  { name: "about", label: "关于" },
] as const;

export function SiteHeader({
  productName = "pgl",
  productSuffix = ".tools",
  onLogout,
}: {
  productName?: string;
  productSuffix?: string;
  onLogout?: () => void;
}) {
  const [active, setActive] = React.useState<string>(NAV_ITEMS[0].name);
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
    <header className="grid items-center max-sm:my-6 max-sm:gap-4 sm:h-36 sm:grid-cols-[1fr_auto] sm:px-16 md:grid-cols-3">
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
      <nav className="relative justify-self-center rounded-full bg-surface-2 p-1.5 shadow-inner dark:bg-surface-1">
        {/* 滑动指示器 */}
        <div
          aria-hidden
          className="absolute inset-y-1.5 left-1.5 rounded-full bg-surface shadow-sm transition-[opacity,transform] duration-1000 ease-out dark:bg-surface-2"
          style={{
            transform: `translateX(${pill.x}px)`,
            width: pill.w ? `${pill.w}px` : undefined,
            opacity: pill.ready ? 1 : 0,
          }}
        />
        <ul ref={listRef} className="relative z-10 flex text-sm font-semibold">
          {NAV_ITEMS.map((item) => {
            const on = item.name === active;
            return (
              <li
                key={item.name}
                aria-label={item.name}
                data-name={item.name}
                className={cn(
                  "px-2.5 py-1 transition-colors duration-1000 ease-out sm:px-4",
                  on ? "text-brand" : "text-ink-3",
                )}
              >
                <button
                  type="button"
                  onClick={() => setActive(item.name)}
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
