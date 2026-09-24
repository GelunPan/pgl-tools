"use client";

import * as React from "react";

import { RefreshIcon } from "@/components/bento/icons";
import { asset } from "@/lib/asset";

/* ============================================================================
   SKILLS 挂钩板 —— 16 个技术徽章从顶上掉下来，被挂钩弹开，最后堆在卡片底部
   ============================================================================

   这不是 CSS 动画，是一个**真的 2D 圆形刚体模拟**（每帧手写积分 + 碰撞求解）。
   实测参考站的行为：徽章每隔一段时间掉下一个（`n = 5 → 7 → 9 → 11 → 13 → 15 → 16`），
   各自带随机初始角速度，撞到挂钩会被撞偏，落到卡片底部后靠相互碰撞堆成一摞。

   ## 逻辑坐标系（关键设计）

   模拟固定在 **280 × 592** 的「逻辑像素」里跑（= xl 断点下这张卡的实际尺寸），
   再用 `transform: scale(sx, sy)` 缩放到卡片真实尺寸。

   🔴 这不是偷懒，而是**复刻参考站的做法，且可以证明等价**：
      参考站在不同断点写死了 `sm:max-lg:scale-50` / `md:max-lg:scale-x-[0.643]` /
      `lg:max-xl:scale-x-[0.786]`。反过来算一遍就发现这些数字 = 卡片宽度 ÷ 280：
        sm  140 ÷ 280 = 0.500  ✓
        md  180 ÷ 280 = 0.643  ✓
        lg  220 ÷ 280 = 0.786  ✓
        xl  280 ÷ 280 = 1.000  ✓
      竖向同理 = 高度 ÷ 592。所以直接用 ResizeObserver 量出来的尺寸去除以 280/592，
      在每个断点上都得到和参考站**一模一样**的缩放系数，还不用维护断点表。

   ## 为什么徽章会「堆在底部」

   挂钩只是**途中的障碍物**（撞到会被弹偏、改变落点），不是落点。徽章最终都沉到底面，
   靠圆-圆碰撞互相挤成一摞 —— 这正是参考站截图里看到的画面（底下一堆斜着的圆徽章）。
   ============================================================================ */

/** 逻辑坐标系尺寸（= xl 断点下卡片的真实尺寸，见上方说明） */
const LOGIC_W = 280;
const LOGIC_H = 592;

/** 徽章半径：直径 50px（参考站 inline style 里写死的 50px） */
const R = 25;
/** 徽章里的 logo 尺寸：50 / √2 ≈ 35.3553 —— 参考站就是这么算的，不是随手填的 */
const LOGO = R * 2 * Math.SQRT2 * 0.5;
/** 挂钩半径：挂钩本体是 size-4（16px），半径 8 */
const PEG_R = 8;

/** 重力（逻辑像素 / 帧²），60fps 下每秒约提升 51px 速度 —— 看着「有重量」但不砸 */
const GRAVITY = 0.85;
/** 撞击地面/挂钩的弹性 */
const REST = 0.42;
/** 每帧速度衰减（空气阻力） */
const AIR = 0.999;
/** 接触地面时的切向/角速度摩擦 */
const GROUND_FRICTION = 0.9;

/** 徽章掉落的间隔（ms）：16 个大约 5 秒落完 */
const DROP_INTERVAL = 320;

/**
 * 挂钩位置（逻辑坐标，取自参考站的 `left-[70px] top-10` 这类 class）。
 * top-10 / 28 / 48 / 72 / 96 是 Tailwind 间距刻度 = 40 / 112 / 192 / 288 / 384px。
 * 5 行 3-2-3-2-3 交错排布，共 13 个。
 */
const PEGS: Array<[number, number]> = [
  [70, 40], [140, 40], [210, 40],
  [105, 112], [175, 112],
  [70, 192], [140, 192], [210, 192],
  [105, 288], [175, 288],
  [70, 384], [140, 384], [210, 384],
];

/**
 * 16 个徽章（顺序照搬参考站）。
 * 图标来自 Simple Icons（CC0），已下载到 `public/brands/` 本地托管 ——
 * 不走 CDN，也不引用参考站自己的资源文件。
 * 路径必须经 `asset()` 拼 basePath，见 src/lib/asset.ts。
 */
const BADGES = [
  "html5", "css", "javascript", "typescript",
  "react", "tailwindcss", "nextdotjs", "gatsby",
  "vuedotjs", "nodedotjs", "expo", "webpack",
  "swift", "nestjs", "prisma", "graphql",
];

type Body = {
  /** 圆心（逻辑坐标） */
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** 旋转角（度） */
  a: number;
  /** 角速度（度/帧） */
  va: number;
  /** 是否已入场（按 DROP_INTERVAL 逐个放行） */
  live: boolean;
};

/** 一个徽章的初始状态：停在卡片上方，带随机水平速度与角速度 */
function spawn(i: number): Body {
  // ⚠️ 这里用 Math.random() 是**安全的**：它只影响 rAF 里的物理，不参与任何渲染输出。
  //    首帧渲染的 inline transform 是一个常量（见 INITIAL_STYLE），
  //    所以 SSR 与 CSR 的输出完全一致，不会 hydration 报错。
  return {
    x: R + Math.random() * (LOGIC_W - R * 2),
    y: -R - Math.random() * 30,
    vx: (Math.random() - 0.5) * 1.6,
    vy: 0,
    a: (Math.random() - 0.5) * 30,
    va: (Math.random() - 0.5) * 9,
    live: i === 0,
  };
}

/** 首帧的固定 transform：所有人都在同一个「场外」位置，保证 SSR / CSR 一致 */
const INITIAL_STYLE = {
  width: R * 2,
  height: R * 2,
  transform: `translate(${LOGIC_W / 2 - R}px, ${-R * 3}px) rotate(0deg)`,
} as const;

export function SkillPegboard() {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState({ x: 1, y: 1 });
  /** 由 rAF 直接写的 transform（走 DOM，不进 React state，避免每帧 re-render） */
  const nodesRef = React.useRef<Array<HTMLDivElement | null>>([]);
  const rafRef = React.useRef<number | null>(null);
  /** 用来强制重跑一遍物理（点重置时用） */
  const [runId, setRunId] = React.useState(0);

  /* ---------- 1. 量卡片尺寸 → 算缩放（见文件头：= 参考站的断点系数） ---------- */
  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const apply = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        setScale({ x: r.width / LOGIC_W, y: r.height / LOGIC_H });
      }
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ---------- 2. 物理主循环 ---------- */
  React.useEffect(() => {
    const bodies = BADGES.map((_, i) => spawn(i));
    const nodes = nodesRef.current;
    const startedAt = performance.now();

    const paint = () => {
      for (let i = 0; i < bodies.length; i++) {
        const n = nodes[i];
        if (!n) continue;
        const b = bodies[i];
        n.style.transform = `translate(${b.x - R}px, ${b.y - R}px) rotate(${b.a}deg)`;
      }
    };

    // 降级：直接摊在底部（不跑模拟），省得动效偏好者还要看一堆徽章乱掉
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      bodies.forEach((b, i) => {
        b.live = true;
        b.x = R + ((i % 5) * (LOGIC_W - R * 2)) / 4;
        b.y = LOGIC_H - R - Math.floor(i / 5) * (R * 0.7);
        b.vx = 0;
        b.vy = 0;
      });
      // 🔴 这里凡是挂了 `animation-fade-in` 的元素都得手工显出来：它们的可见性
      //    完全依赖那个动画（初始 `opacity-0` + `animation: .5s forwards`），
      //    而 reduced-motion 会把动画整个掐掉 —— 不补就会留下「徽章全隐身」
      //    「重置按钮看不见」这类只剩空卡片的残局。
      //    用一次 querySelectorAll 兜底，比逐个点名（徽章 / 图层 / 按钮）更抗改动。
      wrapRef.current
        ?.querySelectorAll<HTMLElement>(".animation-fade-in")
        .forEach((n) => {
          n.style.opacity = "1";
        });
      paint();
      return;
    }

    let last = performance.now();
    /** 连续多少帧「全场几乎不动」—— 用来决定何时收工 */
    let quiet = 0;

    const step = (now: number) => {
      const dt = Math.min(2, Math.max(0.5, (now - last) / 16.667));
      last = now;

      // 放行新徽章
      const elapsed = now - startedAt;
      for (let i = 0; i < bodies.length; i++) {
        if (!bodies[i].live && elapsed >= i * DROP_INTERVAL) bodies[i].live = true;
      }

      for (const b of bodies) {
        if (!b.live) continue;

        b.vy += GRAVITY * dt;
        b.vx *= AIR;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.a += b.va * dt;
        b.va *= 0.995;

        // ---- 左右墙 ----
        if (b.x - R < 0) {
          b.x = R;
          b.vx = Math.abs(b.vx) * 0.5;
          b.va *= 0.9;
        } else if (b.x + R > LOGIC_W) {
          b.x = LOGIC_W - R;
          b.vx = -Math.abs(b.vx) * 0.5;
          b.va *= 0.9;
        }

        // ---- 底面 ----
        if (b.y + R > LOGIC_H) {
          b.y = LOGIC_H - R;
          if (Math.abs(b.vy) > 0.7) {
            b.vy = -Math.abs(b.vy) * REST;
            b.vx *= GROUND_FRICTION;
            b.va *= 0.85;
          } else {
            // 速度太低就直接压住，否则会在底面上抖个不停
            b.vy = 0;
            b.vx *= 0.86;
            b.va *= 0.8;
          }
        }

        // ---- 挂钩（静态圆）----
        for (const [px, py] of PEGS) {
          const dx = b.x - px;
          const dy = b.y - py;
          const min = R + PEG_R;
          const d2 = dx * dx + dy * dy;
          if (d2 >= min * min) continue;
          const d = Math.sqrt(d2) || 0.001;
          const nx = dx / d;
          const ny = dy / d;
          // 先推出穿透，再沿法线反弹
          b.x = px + nx * min;
          b.y = py + ny * min;
          const vn = b.vx * nx + b.vy * ny;
          if (vn < 0) {
            b.vx -= (1 + REST) * vn * nx;
            b.vy -= (1 + REST) * vn * ny;
            // 切向蹭一下 → 转起来，视觉上像被挂钩刮了一下
            b.va += (b.vx * ny - b.vy * nx) * 0.08;
          }
        }
      }

      // ---- 徽章互相碰撞（16 个，O(n²) 完全够用）----
      // 这一层同时负责「堆成一摞」和「把抖动耗掉」。
      for (let i = 0; i < bodies.length; i++) {
        const a = bodies[i];
        if (!a.live) continue;
        for (let j = i + 1; j < bodies.length; j++) {
          const c = bodies[j];
          if (!c.live) continue;
          const dx = c.x - a.x;
          const dy = c.y - a.y;
          const min = R * 2;
          const d2 = dx * dx + dy * dy;
          if (d2 >= min * min) continue;
          const d = Math.sqrt(d2) || 0.001;
          const nx = dx / d;
          const ny = dy / d;
          // 等质量对分穿透量
          const push = (min - d) / 2;
          a.x -= nx * push;
          a.y -= ny * push;
          c.x += nx * push;
          c.y += ny * push;
          const vn = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
          if (vn < 0) {
            const imp = -(1 + REST) * vn * 0.5;
            a.vx -= imp * nx;
            a.vy -= imp * ny;
            c.vx += imp * nx;
            c.vy += imp * ny;
            // 弱碰撞额外加一层阻尼：不然一摞徽章会永远在互相推挤、抖不停
            if (-vn < 1.2) {
              a.vx *= 0.94;
              a.vy *= 0.94;
              c.vx *= 0.94;
              c.vy *= 0.94;
              a.va *= 0.94;
              c.va *= 0.94;
            }
          }
        }
      }

      paint();

      /* ---- 收工判定 ----
         ⚠️ 注意**不能**给单个徽章打「已静止」标记然后跳过积分 ——
            第一个静止的徽章会变成一块不动的平台，后面落上来的徽章撞到它时
            位置会被强行推开，看起来像瞬移。所以这里只做「全场都不动了」的整体判定。 */
      let peak = 0;
      for (const b of bodies) {
        if (!b.live) { peak = Infinity; break; } // 还有没入场的，绝不收工
        peak = Math.max(peak, Math.abs(b.vx) + Math.abs(b.vy) + Math.abs(b.va) * 2);
      }
      quiet = peak < 0.3 ? quiet + 1 : 0;
      if (quiet > 90) {
        rafRef.current = null;
        return; // 不再 requestAnimationFrame，循环自然停
      }
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [runId]);

  const reset = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setRunId((n) => n + 1);
  };

  return (
    <div ref={wrapRef} className="absolute inset-0">
      {/* ---------- 重置按钮（未缩放，贴卡片左上角） ---------- */}
      <button
        type="button"
        onClick={reset}
        aria-label="重新掉落"
        className="animation-fade-in absolute left-4 top-4 z-10 rounded-xl border bg-surface p-1 text-ink-4 opacity-0 shadow"
      >
        <RefreshIcon className="size-6" />
      </button>

      {/* ---------- 模拟层：280×592 逻辑空间，缩放到卡片真实尺寸 ---------- */}
      <div
        data-sim-layer
        className="animation-fade-in absolute bottom-0 left-0 origin-bottom-left opacity-0"
        style={{
          width: LOGIC_W,
          height: LOGIC_H,
          transform: `scale(${scale.x}, ${scale.y})`,
        }}
      >
        {/* 13 个挂钩 */}
        {PEGS.map(([x, y]) => (
          <div
            key={`${x}-${y}`}
            className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border bg-surface-2 shadow-sm"
            style={{ left: x, top: y }}
          />
        ))}

        {/* 16 个徽章：白底圆 + 品牌 logo，带随机倾角堆在底部。
            `animation-fade-in opacity-0` 是参考站照搬过来的：每个徽章先 0.5s 淡入
            再参与下落。少了它，徽章会「啪」地一起出现，没有陆续登场的层次。 */}
        {BADGES.map((slug, i) => (
          <div
            key={`${runId}-${slug}`}
            ref={(el) => {
              nodesRef.current[i] = el;
            }}
            className="animation-fade-in absolute left-0 top-0 flex items-center justify-center rounded-full border bg-surface opacity-0 shadow-sm dark:bg-white dark:grayscale-[20%]"
            style={INITIAL_STYLE}
          >
            <img
              src={asset(`/brands/${slug}.svg`)}
              alt=""
              aria-hidden
              width={LOGO}
              height={LOGO}
              style={{ width: LOGO, height: LOGO, objectFit: "contain" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
