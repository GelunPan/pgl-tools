"use client";

import * as React from "react";

import { BeachIcon } from "@/components/bento/icons";

/**
 * 「Explore More」卡：一块会动的沙丘/wave canvas + 反色文字。
 *
 * ## 反色是怎么做的
 *
 * 文字用 `text-white mix-blend-difference`：白色在**白底**上做差值运算得到黑，
 * 在**深色沙丘**上做差值得到白。于是同一行字会「横跨明暗自动翻色」——
 * 沙丘起伏扫过时，字会被吃掉一半再吐出来。这是整张卡的机关，别把
 * `mix-blend-difference` 删了换普通颜色。
 *
 * ## 沙丘的颜色从哪来
 *
 * 🔴 canvas 的绘制色**不是硬编码的**，而是去读自己的 CSS `fill` 属性：
 *    参考站的 canvas 上挂着 `fill-surface-1`（暗色），JS 用
 *    `getComputedStyle(canvas).fill` 把它读出来当 fillStyle。
 *    浅色下没有 `fill-*` 类 → 拿到的就是默认黑，所以日间是「白底黑沙丘」。
 *    这样切主题时不需要任何 JS 分支，跟着 CSS 变量一起变。
 *    我们沿用这个机制（class 里写 `fill-ink-1`，即日间近黑 / 夜间浅色）。
 */

/** 采样一次 canvas 当前的 CSS fill 颜色（跟着主题走） */
function readFill(el: HTMLCanvasElement) {
  const v = getComputedStyle(el).fill;
  return v && v !== "none" ? v : "#000";
}

export function WaveCanvas() {
  const ref = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const cv = ref.current;
    if (!cv) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf: number | null = null;
    let fill = readFill(cv);
    let t = 0;

    /** 尺寸按 devicePixelRatio 放大，避免高分屏发糊 */
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = cv.getBoundingClientRect();
      if (!r.width || !r.height) return;
      cv.width = Math.round(r.width * dpr);
      cv.height = Math.round(r.height * dpr);
      fill = readFill(cv);
    };

    /** 一条沙丘：起点在左侧、缓慢起伏、右侧微微抬升，下面整块填色 */
    const draw = () => {
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      const W = cv.width;
      const H = cv.height;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = fill;

      const base = H * 0.6; // 沙丘基准高度
      const amp = H * 0.055; // 起伏幅度
      ctx.beginPath();
      ctx.moveTo(0, base + Math.sin(t) * amp);
      const steps = 24;
      for (let i = 1; i <= steps; i++) {
        const x = (W * i) / steps;
        const p = i / steps;
        // 两个不同频率的正弦叠加 → 不是规整的波浪，更像被风吹出来的沙丘
        const y =
          base +
          Math.sin(t + p * 2.1) * amp +
          Math.sin(t * 1.7 + p * 5.3) * amp * 0.35 -
          p * H * 0.06; // 右侧整体抬高一点
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      ctx.fill();
    };

    resize();

    if (reduce) {
      draw(); // 只画一帧静态的
      const ro = new ResizeObserver(() => {
        resize();
        draw();
      });
      ro.observe(cv);
      return () => ro.disconnect();
    }

    let frame = 0;
    const loop = () => {
      t += 0.006;
      // 每 30 帧重新采一次颜色：切主题时 <html> 上的 .dark 会变，
      // 缓存的 fill 就过期了（沙丘会留着上一个主题的颜色）。
      // 不每帧采是因为 getComputedStyle 会强制样式重算，太贵。
      if (frame++ % 30 === 0) fill = readFill(cv);
      draw();
      raf = requestAnimationFrame(loop);
    };

    // 离开视口 / 切到后台就停，别白烧 CPU
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && raf === null) raf = requestAnimationFrame(loop);
      else if (!e.isIntersecting && raf !== null) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    });
    io.observe(cv);

    const onVis = () => {
      if (document.hidden && raf !== null) {
        cancelAnimationFrame(raf);
        raf = null;
      } else if (!document.hidden && raf === null) {
        raf = requestAnimationFrame(loop);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    const ro = new ResizeObserver(() => {
      resize();
      draw();
    });
    ro.observe(cv);

    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-clip">
      {/* fill 决定沙丘的绘制色（JS 会读这个属性，见文件头）：
            日间 → ink-1（近黑，白底黑沙丘）
            夜间 → surface-1（slate-800，在 #000212 上压出一层深色沙丘）
          🔴 暗色下别用 ink-1：那是近白色，会把整块卡刷成一片惨白。 */}
      <canvas
        ref={ref}
        className="z-0 size-full rounded-xl bg-surface-1 fill-ink-1 dark:bg-surface dark:fill-surface-1 lg:rounded-2xl xl:rounded-3xl"
      />
      <a
        href="#"
        className="absolute inset-0 z-10 flex items-center justify-center gap-2 text-lg font-semibold text-white mix-blend-difference lg:text-2xl"
      >
        Explore More
        <BeachIcon className="size-8" />
      </a>
    </div>
  );
}
