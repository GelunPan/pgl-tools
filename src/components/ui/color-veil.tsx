"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

export type VeilOrigin = { x: number; y: number };

/**
 * 幕布终色：纯黑。
 * 🔴 欢迎页的根容器底色必须与它完全一致（`bg-black`），
 *    否则幕布消失的瞬间会露出色差，衔接就断了。
 */
export const VEIL_END_COLOR = "#000000";

/** 缓动：easeOutQuint —— 起步快、收尾慢，「铺满」的推力感更强 */
const SPREAD_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
/** 缓动：标准的慢起慢收 —— 变黑要「无感知」，两头必须软 */
const DARKEN_EASE = "cubic-bezier(0.4, 0, 0.2, 1)";

type ColorVeilProps = {
  /**
   * 扩散圆心（视口坐标，px）。传 null 表示不显示幕布。
   * 一旦从 null 变为一个坐标，幕布就会挂载并从该点开始扩散。
   */
  origin: VeilOrigin | null;
  /** 幕布起始色，默认取主题色 --primary（登录按钮同色） */
  color?: string;
  /**
   * 扩散过程中要过渡到的终色。传 null 表示保持起始色不变。
   * 默认纯黑 —— 配合欢迎页的 `bg-black`，做到「悄悄变暗 → 页面就换了」。
   */
  fadeTo?: string | null;
  /**
   * 从扩散进度的百分之几开始变色。0.5 = 铺到一半时开始慢慢变暗。
   * 范围会被夹到 [0, 1]。
   */
  fadeStartRatio?: number;
  /**
   * 变色时长（ms）。不传则自动推导为
   * 「扩散完成后再过 1000ms 变完」，即总时长 = 扩散时长 + 1000ms。
   */
  fadeDuration?: number;
  /** 扩散时长（ms） */
  duration?: number;
  /**
   * 全部动画播完的回调 —— 在这里做路由跳转，衔接最无缝。
   * 注意不是「扩散完成」，而是「颜色也变完了」，此刻屏幕已是终色。
   */
  onComplete?: () => void;
  className?: string;
};

/**
 * 全屏色幕：从一个点以圆形 clip-path 扩散铺满整个视口，
 * 并在扩散途中悄悄由起始色过渡到终色（默认主题蓝 → 纯黑）。
 *
 * 用途：点击「登录」成功后，幕布从按钮位置扩散铺满屏幕，
 * 跳转后的页面使用与幕布终色相同的底色，视觉上就像
 * 「一层颜色盖过来，安静地暗下去，然后新内容在黑暗里浮现」，
 * 而不是页面切换。
 *
 * 关键点：全部动画播完才触发 onComplete 跳转，因此跳转时幕布已经
 * 是全屏纯黑，与新页面底色完全一致，不会出现白闪或硬切。
 */
export function ColorVeil({
  origin,
  color = "hsl(var(--primary))",
  fadeTo = VEIL_END_COLOR,
  fadeStartRatio = 0.5,
  fadeDuration,
  duration = 760,
  onComplete,
  className,
}: ColorVeilProps) {
  const firedRef = useRef(false);

  // 始终指向最新回调，避免把 onComplete 放进依赖里导致重复计时
  const finishRef = useRef<() => void>(() => {});
  finishRef.current = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    onComplete?.();
  };

  // 变暗从扩散跑到一半时启动（默认 380ms）
  const ratio = Math.min(Math.max(fadeStartRatio, 0), 1);
  const darkenDelayMs = Math.round(duration * ratio);
  // 默认：扩散结束后正好 1s 变完
  const darkenMs =
    fadeDuration ?? Math.max(120, duration - darkenDelayMs + 1000);
  // 整段动画的总时长 = 最后收尾的那个动画
  const totalMs = fadeTo ? darkenDelayMs + darkenMs : duration;

  // 兜底：万一 onAnimationEnd 没触发（例如浏览器降级了动效），也要跳转
  useEffect(() => {
    if (!origin) return;
    firedRef.current = false;
    const timer = window.setTimeout(() => finishRef.current(), totalMs + 300);
    return () => window.clearTimeout(timer);
  }, [origin, totalMs]);

  if (!origin) return null;

  // 半径取「圆心到视口四个角的最远距离」，保证任何位置都能完全铺满
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const radius =
    Math.ceil(
      Math.max(
        Math.hypot(origin.x, origin.y),
        Math.hypot(vw - origin.x, origin.y),
        Math.hypot(origin.x, vh - origin.y),
        Math.hypot(vw - origin.x, vh - origin.y),
      ),
    ) + 8;

  return (
    <div
      aria-hidden
      data-veil-anim
      // 没有变色层时，扩散结束即全部结束；有变色层时由子层接手（见下）
      onAnimationEnd={fadeTo ? undefined : () => finishRef.current()}
      className={cn("pointer-events-none fixed inset-0 z-[60]", className)}
      style={
        {
          background: color,
          "--veil-x": `${origin.x}px`,
          "--veil-y": `${origin.y}px`,
          "--veil-r": `${radius}px`,
          animationName: "veil-spread",
          animationDuration: `${duration}ms`,
          animationTimingFunction: SPREAD_EASE,
          animationFillMode: "forwards",
          willChange: "clip-path",
        } as React.CSSProperties
      }
    >
      {/* 黑色叠加层：在父级的圆形裁剪范围内，从透明慢慢浮上来。
          它比扩散结束得晚，所以由它来触发 onComplete —— 那一刻屏幕已全黑。 */}
      {fadeTo && (
        <div
          data-veil-anim
          onAnimationEnd={() => finishRef.current()}
          className="absolute inset-0"
          style={{
            background: fadeTo,
            opacity: 0,
            animationName: "veil-darken",
            animationDuration: `${darkenMs}ms`,
            animationDelay: `${darkenDelayMs}ms`,
            animationTimingFunction: DARKEN_EASE,
            animationFillMode: "forwards",
            willChange: "opacity",
          }}
        />
      )}
    </div>
  );
}
