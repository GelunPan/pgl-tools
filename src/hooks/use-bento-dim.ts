"use client";

import * as React from "react";

/* ============================================================================
   useBentoDim —— 「分类弱化提示」跟着滚动渐渐散尽

   ## 它解决的是什么

   顶部导航点一个分类，未命中的卡会被 `order: 1` 推到网格后面，并挂上
   `blur(3px)` + `opacity: .8` —— 这是「你筛的是这一类」的视觉提示。

   问题出在**提示的前提不成立的时候**：卡片是全部保留的（只是被排到后面），
   而在手机上一屏只看得见三四张卡，筛完满屏都是糊的；用户往下翻本来就是要看
   那些被排到后面的卡，糊着纯属添堵 —— 小潘的原话是「整个页面又会自动模糊」。

   所以：**提示只属于网格顶部**。往下滚过 `dissolvePx` 之后，模糊完全撤掉；
   滚回顶部它又回来（该给提示的地方给提示，该放开的地方放开）。

   ## 为什么写 CSS 变量而不是 setState

   滚动每帧都在变。16 张卡 × 每帧一次 setState = 每帧重渲染整页（含整只 SVG 猫、
   挂钩板、点阵），手机上必掉帧。所以：

   - 连续量 `--bento-dim`（1 = 全弱化，0 = 完全清晰）**直接写在滚动容器的
     inline style 上**，卡片用 `blur(calc(var(--bento-dim, 1) * 3px))` 读它 ——
     一次 DOM 写入，一次样式重算，零 React 参与。
   - 只有一个**布尔** `dissolved` 走 state，而且带迟滞、只在跨阈值时翻转。
     它决定的是「`filter` 这个属性还要不要挂在卡片上」（见 tabs.ts 的注释）。

   ## 阈值为什么这么取

   - `dissolvePx = 260`：约等于手机上「一行卡 + 一点余量」。
     太短（<100）会变成「手一抖模糊就没了」，提示跟没给一样；
     太长（>400）则用户已经翻过小半页了还糊着。260 在两种断点下都落在
     「我确实开始往下看了」这个动作上。
   - 翻转阈值 0.02 / 0.12 是**迟滞**：不迟滞的话，指尖停在边界上会因为
     亚像素抖动反复翻转 state，卡片在「有 filter / 没 filter」之间闪。
   ============================================================================ */

export const DIM_DISSOLVE_PX = 260;

/** 低于它算「散尽」（0.02 × 260 ≈ 5px 的余量，指尖停不住那么准） */
const DISSOLVE_AT = 0.02;
/** 高于它才算「重新糊上」（0.12 × 260 ≈ 31px，和上一条拉开距离形成迟滞） */
const RELAPSE_AT = 0.12;

export function useBentoDim(scrollRef: React.RefObject<HTMLDivElement | null>) {
  const [dissolved, setDissolved] = React.useState(false);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let raf = 0;

    const apply = () => {
      raf = 0;
      // iOS 橡皮筋回弹时 scrollTop 会是负数，夹一下别让它算出 >1 的 dim
      const top = Math.max(0, el.scrollTop);
      const dim = Math.max(0, Math.min(1, 1 - top / DIM_DISSOLVE_PX));
      el.style.setProperty("--bento-dim", dim.toFixed(3));
      // 只有跨过阈值才动 state（迟滞见上）
      setDissolved((prev) =>
        dim <= DISSOLVE_AT ? true : dim >= RELAPSE_AT ? false : prev,
      );
    };

    // 首帧先同步一次：从别的页面进来（或刷新后浏览器恢复滚动位置）时，
    // 别等第一次滚动才把变量补上
    apply();

    const onScroll = () => {
      if (raf) return; // rAF 节流：一帧最多算一次
      raf = window.requestAnimationFrame(apply);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [scrollRef]);

  /**
   * 回到网格顶部，**同时把弱化提示恢复到「在顶部」的状态**。
   *
   * 两件事必须一起做，否则会闪：
   * ① 先把 `--bento-dim` 写回 1 并把 `dissolved` 落回 false —— 卡片立刻重新挂上
   *    `blur(3px)`，然后随这次滚动**再**渐渐散掉，全程连续；
   * ② 再平滑滚上去。先滚后写的话，第一帧滚动事件算出来的 dim 已经接近 0，
   *    卡片会「先清清楚楚地滑上来、到顶了才糊一下」，看着像 bug。
   */
  const scrollToTop = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.style.setProperty("--bento-dim", "1");
    setDissolved(false);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }, [scrollRef]);

  return { dissolved, scrollToTop };
}
