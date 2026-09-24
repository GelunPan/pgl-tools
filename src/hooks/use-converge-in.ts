"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 汇聚入场的三个阶段。
 *
 * - `boot`    卡片全部隐身，屏幕上只有一层纯黑幕布（= 登录页幕布的终色）
 * - `flying`  已量好每张卡的方向与距离，卡片正从屏幕外飞回网格位
 * - `settled` 动画播完，把 transform / filter 彻底交还给 CSS
 */
export type ConvergePhase = "boot" | "flying" | "settled";

/**
 * 单张卡飞行时长。
 * 🔴 必须与 `globals.css` 里 `converge-in` 的 `animation-duration` 完全一致（900ms）。
 *    改一边不改另一边，要么收尾时动画还没播完被硬切（卡片「咔」一下跳到终点），
 *    要么白等一段空档。
 */
const FLY_DURATION = 900;
/** 幕布先散、卡片后飞的间隔，制造「黑幕拉开 → 内容涌进来」的先后感 */
const FLY_BASE_DELAY = 150;
/** 相邻两张卡的错峰步长 */
const STAGGER_STEP = 32;
/**
 * 飞行距离的基准 = 视口对角线 × 这个比例。
 *
 * 刻意**对所有卡片取同一个距离**：如果改成「刚刚好推出屏幕就停」，
 * 靠边的卡片只需挪动几十像素、中间的卡片却要挪近千像素，两者时长相同
 * 就会导致角落的卡片几乎不动、中间的卡片糊成一条线。统一距离后所有卡片
 * 飞行速度一致，方向各不相同 —— 那才是「从四面八方汇聚」的观感。
 *
 * 但这个基准只是**下限**：见下方 `travel` 的取值说明。
 */
const TRAVEL_RATIO = 0.42;
/**
 * 飞行距离的上限 = 视口对角线 × 这个比例，防止个别卡片把统一距离拉爆。
 */
const TRAVEL_MAX_RATIO = 1.4;

/**
 * 驱动 /bento 的汇聚入场。
 *
 * 做法：挂载后量出每张卡的中心，求出「它相对视口中心的方向」，
 * 沿这个方向把卡片推到屏幕外（写成 `--cv-x` / `--cv-y`），
 * 再按「离屏幕中心越近越早落位」的顺序错峰触发 fly 动画。
 *
 * 收尾用的是 `setTimeout` 而不是 `animationend`：
 * 一来 16 张卡要逐个计数太啰嗦，二来 `prefers-reduced-motion` 下动画会被
 * `animation: none` 掐掉、`animationend` 根本不触发，用定时器则天然免疫。
 */
export function useConvergeIn() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [phase, setPhase] = useState<ConvergePhase>("boot");

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const cards = Array.from(
      root.querySelectorAll<HTMLElement>("[data-bento-card]"),
    );

    // 万一这页以后改成没有卡片（或子组件报错没渲染出来），别把用户留在全黑里
    if (!cards.length) {
      setPhase("settled");
      return;
    }

    let frame = 0;
    let timer = 0;

    try {
      // 关了动效就别演了，直接落位
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setPhase("settled");
        return;
      }

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const cx = vw / 2;
      const cy = vh / 2;
      const diagonal = Math.hypot(vw, vh);

      const items = cards.map((el) => {
        const rect = el.getBoundingClientRect();
        const dx0 = rect.left + rect.width / 2 - cx;
        const dy0 = rect.top + rect.height / 2 - cy;
        const dist = Math.hypot(dx0, dy0);
        // 正好压在屏幕中心的卡片没有方向可言，统一让它从正上方来
        const ux = dist < 1 ? 0 : dx0 / dist;
        const uy = dist < 1 ? -1 : dy0 / dist;
        return { el, dist, ux, uy, rect };
      });

      /**
       * 这张卡沿自己的方向要挪多远才**整张**离开视口。
       *
       * 水平出界与竖直出界哪个先发生就算出去了，所以两者取小。
       * 注意用的是 `right` / `bottom`（不是 left / top）：卡片的近端边一越过
       * 视口边界还不算出去，得让远端的 corner 也出去，否则会在边缘露一角。
       */
      const exitDistance = (it: (typeof items)[number]) => {
        const { rect, ux, uy } = it;
        const horizontal =
          ux > 0 ? (vw - rect.left) / ux : ux < 0 ? -rect.right / ux : Infinity;
        const vertical =
          uy > 0 ? (vh - rect.top) / uy : uy < 0 ? -rect.bottom / uy : Infinity;
        return Math.min(horizontal, vertical);
      };

      /**
       * 🔴 统一距离必须「大到所有卡都出屏」。
       *
       * 只按对角线比例算是不够的：页头加高后网格整体下移，左上角那张卡相对
       * 屏幕中心的方向变得很偏水平，固定比例算出来的位移反而推不出左边界 ——
       * 实测起飞点还落在 (-506,-184)，动画一开场它就是「已经在屏幕上晃」而不是
       * 「从画外飞进来」。
       *
       * 所以取 `max(基准, 所有卡出屏所需距离的最大值 × 1.02)`：距离仍然对 16 张卡
       * 完全一致（观感不变），但保证每一张的起点都在视口之外。再叠一个上限兜底，
       * 免得极端窄屏下个别卡片把统一距离拉到离谱。
       */
      const maxExit = items.reduce((m, it) => Math.max(m, exitDistance(it)), 0);
      const travel = Math.min(
        Math.max(diagonal * TRAVEL_RATIO, maxExit * 1.02),
        diagonal * TRAVEL_MAX_RATIO,
      );

      // 近的先落位、外围后合拢 —— 外围最后「扣上」，才有聚拢的推力感
      const order = [...items].sort((a, b) => a.dist - b.dist);

      order.forEach((it, i) => {
        it.el.style.setProperty("--cv-x", `${(it.ux * travel).toFixed(1)}px`);
        it.el.style.setProperty("--cv-y", `${(it.uy * travel).toFixed(1)}px`);
        it.el.style.setProperty(
          "--cv-delay",
          `${FLY_BASE_DELAY + i * STAGGER_STEP}ms`,
        );
      });

      const total =
        FLY_BASE_DELAY + order.length * STAGGER_STEP + FLY_DURATION + 80;

      // 🔴 必须等两帧。第一帧让浏览器把「全黑 + 卡片不可见」真正画出来，
      //    第二帧才改状态触发动画。只等一帧的话 React 的这次更新很可能
      //    被合并进首帧渲染，卡片会直接出现在终点，飞入感整个丢失。
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => setPhase("flying"));
      });
      timer = window.setTimeout(() => setPhase("settled"), total);
    } catch {
      // 任何测量异常都不能把页面留在「全黑 + 卡片全隐身」的状态
      setPhase("settled");
    }

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, []);

  /**
   * ⚠️ `settled` 之后**不要**去清掉 `--cv-x` 等变量：
   * 这些变量只被 `converge-in` 关键帧引用，动画一撤就完全失效，
   * 留着零副作用；而清空它们会触发一次无谓的样式重算，
   * 万一赶在最后一帧动画结束前生效，还会让卡片「弹」回屏幕外一瞬。
   */
  return { rootRef, phase };
}
