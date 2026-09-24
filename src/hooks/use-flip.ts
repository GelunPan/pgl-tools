"use client";

import * as React from "react";

/**
 * FLIP 位移补间 —— 从 zhangyu.dev 的 `useFlip` 逐行移植（2026-09-24 反查其 chunk 得到）。
 *
 * ## 它解决的是什么问题
 *
 * 参考站的顶部导航点一下，**对应的卡片会「挪到第一位」**：卡片自己带
 * `order: 0`（命中）/ `order: 1`（未命中），CSS Grid 一重排，位置是**瞬间**变的
 * —— `order` 不是可插值属性，`transition` 对它无效。
 *
 * 想让这次瞬移看起来「非常丝滑」，就得用 **FLIP**：
 *
 * ```
 *   First  动画前，先记下元素的 rect
 *   Last   状态变完、浏览器完成布局后，再量一次 rect
 *   Invert 用 transform 把元素「扳回」旧位置（此时视觉上它没动过）
 *   Play   把 transform 归零，让浏览器补间 —— 于是它「滑」到新位置
 * ```
 *
 * ## 两个必须踩准的点
 *
 * 1. 🔴 **必须在 `useLayoutEffect` 里量 Last**。放到 `useEffect` 就晚了：
 *    浏览器已经画过一帧「卡片在新位置」，动画起点会变成新位置，位移是 0，等于没动。
 *    `useLayoutEffect` 卡在「DOM 已改、屏幕未画」之间，是唯一的正确时机。
 *
 * 2. 🔴 **首次挂载不能播动画**。首帧只记录 rect 当作下一次的基准，
 *   否则页面一进来所有卡片就会从「上一次的位置」飞一遍。
 *    参考站是用一个 `useUpdateEffect`（内部 `mounted` ref）实现的，这里保留同样的做法。
 *
 * ## 几个刻意的取舍
 *
 * - 用 **Web Animations API**（`el.animate`）而不是「写内联 style + 读下一帧」：
 *   WAAPI 不碰内联 style，`fill: "auto"` 播完自动把 transform 交还给 CSS，
 *   所以卡片自己的 `hover:scale-105`、主题过渡都不会被污染。
 * - **关掉动效时不播**（`prefers-reduced-motion`）：位置变化照常发生（那是状态变化，
 *   不是动画），只是不做补间。跟全站 reduced-motion 的口径一致。
 * - 位移小于 0.5px 直接跳过：主题切换、字体加载等引发的亚像素重排不该触发动画。
 * - `dimensions` 这块来自参考站原文（可补间 width / height），我们暂时用不到，
 *   但保留 —— 以后要做「卡片伸缩」的过渡（比如导航过滤时卡片个数变化）就靠它。
 */
export type FlipDimensions = boolean | "width" | "height";

export interface FlipOptions {
  /** 补间时长，默认 300ms（参考站默认值；它自己用 700ms） */
  duration?: number;
  /** 缓动，默认 `ease`（参考站原值） */
  easing?: string;
  /** 是否连宽高一起补间 */
  dimensions?: FlipDimensions;
}

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

/** 旧 rect 与新 rect 一起算出起止关键帧（参考站原样：布尔 true = 宽高都补） */
function buildKeyframes(
  from: DOMRect,
  to: DOMRect,
  dimensions: FlipDimensions | undefined,
): [Keyframe, Keyframe] {
  const dx = from.x - to.x;
  const dy = from.y - to.y;

  let first: Keyframe = { transform: `translate(${dx}px, ${dy}px)` };
  let last: Keyframe = { transform: "translate(0, 0)" };

  if (dimensions === true) {
    first = { ...first, width: `${from.width}px`, height: `${from.height}px` };
    last = { ...last, width: `${to.width}px`, height: `${to.height}px` };
  } else if (dimensions === "width") {
    first = { ...first, width: `${from.width}px` };
    last = { ...last, width: `${to.width}px` };
  } else if (dimensions === "height") {
    first = { ...first, height: `${from.height}px` };
    last = { ...last, height: `${to.height}px` };
  }

  return [first, last];
}

/**
 * @param deps  触发重排的依赖（本项目的用法是 `[active]`）
 * @returns     挂到目标元素上的 ref
 */
export function useFlip<T extends HTMLElement>(
  deps: React.DependencyList,
  { duration = 300, easing = "ease", dimensions }: FlipOptions = {},
) {
  const ref = React.useRef<T | null>(null);
  const prevRect = React.useRef<DOMRect | null>(null);
  const mounted = React.useRef(false);

  // First：挂载那一帧先记下基准位置（之后所有动画都以它为起点）
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) {
      // 参考站这里会 console.warn，我们保持安静：某些卡片可能条件渲染
      return;
    }
    if (!prevRect.current) prevRect.current = el.getBoundingClientRect();
  }, []);

  // Last → Invert → Play
  React.useLayoutEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }

    const el = ref.current;
    const from = prevRect.current;
    if (!el || !from) return;

    const to = el.getBoundingClientRect();
    // 🔴 先把基准更新掉：连点两下时，第二下的起点必须是「上一段动画的终点」，
    //    否则第二段会从第一次的旧位置起算，卡片会往回甩。
    prevRect.current = to;

    if (
      Math.abs(from.x - to.x) < 0.5 &&
      Math.abs(from.y - to.y) < 0.5 &&
      dimensions === undefined
    ) {
      return;
    }

    if (typeof window === "undefined") return;
    if (window.matchMedia(REDUCED_QUERY).matches) return;

    el.animate(buildKeyframes(from, to, dimensions), {
      duration,
      easing,
      fill: "auto",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
