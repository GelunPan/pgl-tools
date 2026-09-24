"use client";

import * as React from "react";

import { usePetSequence } from "@/hooks/use-pet";

/* ============================================================================
   BentoCat —— 第 2 格（个人展示格）里的那只猫（一个可以撸的彩蛋）

   ## 它为什么会「活」

   | 行为             | 触发                    | 实现方式                                 |
   |------------------|-------------------------|------------------------------------------|
   | 视线跟着鼠标跑   | 全窗口 pointermove      | rAF 节流 → 写 --gaze-x/--gaze-y，零重渲染 |
   | 眯眼笑 + 冒气泡  | 点一下                  | React 状态（状态驱动，天生可重播）       |
   | 连点 7 次的彩蛋  | 1.6s 内连点 7 下        | 爱心/星星/爪印两轮齐飞 + 转圈跳 + 专属气泡 |
   | 尾巴摆 / 呼吸 / 呆毛 | 一直在              | 纯 CSS 无限动画                          |

   ## 🔴 四条硬约束（全是本项目已经踩过的坑）

   1. **`Math.random()` / `Date.now()` 绝不参与渲染**。静态导出时服务端与客户端会算出
      不同结果，React 直接报 hydration 不一致。时间戳只允许出现在事件回调里。
   2. **猫本体必须静态绘制、默认可见**，动画只是「附加」。绝不能像挂钩板那样靠
      `animation-fade-in` 才显示 —— reduced-motion 一掐就永远隐身。
   3. **reduced-motion 下**：停掉全部动画、不装 pointermove 监听，但**点击互动照旧**
      （那是状态变化，不是动画）。
   4. **彩蛋有保护期**（`eggCooldownMs`）—— 手快补点不能把彩蛋顶掉。逻辑在
      `hooks/use-pet.ts` 里，那只猫（登录页）共用同一套。

   ## 造型：照着小潘给的参考图（写实风黑猫）做的

   | 部位 | 色值 | 说明 |
   |---|---|---|
   | 毛（主色） | `#302D26` | **暖调炭黑**。参考图的黑猫不是纯黑，是带一点暖褐的深灰 |
   | 毛（受光面） | `#3A362D` | 口鼻区 / 胸口 / 前腿 —— 比主色亮一档，撑出体积感 |
   | 毛（纹理） | `#413C31` | 背上、肩上那几笔短毛（参考图也有这种手绘笔触） |
   | 眼（虹膜） | `#C6D74F` | **黄绿**（参考图就是黄绿的，不是琥珀黄）；上缘再叠 `#DCE566` |
   | 眼（竖缝） | `#14120F` | 细竖缝，外面套一圈 `#16130F` 描边当眼眶 |
   | 鼻 / 嘴 / 趾缝 | `#584F4B` / `#16130F` | 一律**深色**（参考图的黑猫没有粉色鼻子） |
   | 耳内 | `#4A4038` | 暗暖褐，不是粉色 |
   | 胡须 | `#4A4438` | **深色胡须**，画在奶油底色上才看得见 |

   ⚠️ 参考图里**没有**项圈 / 铃铛 / 腮红 / 白肚子 —— 这一版全去掉了（2026-09-24）。

   ## 姿势：趴卧（四爪朝前，抬头看人）

   小潘要求「主页面重新设计一个姿势，确保可爱、动作自然」。趴卧是最自然的一种：
   身体贴地、前腿朝镜头伸出来、尾巴从右侧绕到身前搭在地上、脑袋抬起——
   头能占满将近一半画面（`r=42`，比坐姿还大），**头大 = 显小 = 萌**。

   ## 🔴 底色是奶油米色，不是蓝！

   卡片底（`bento/page.tsx` 那串 class）配的是参考图那种奶油米色。
   黑猫坐在深蓝渐变上会「打架」（小潘 2026-09-24 的原话：让他们不那么冲突），
   米色 + 炭黑才是这只猫的正确打开方式。

   ## 憨态可掬的诀窍

   头大（r=42 快赶上身体）、眼睛大且**一瞳两高光**、耳朵短圆且立着、
   前爪伸到镜头前、尾巴搭在地上 —— 全是「幼态延续」+「猫本来就这样」的特征。
   ============================================================================ */

/** 普通点击的气泡文案池，按点击次数依次轮换 —— 越点反应越不一样 */
const HAPPY_TEXTS = [
  "喵～",
  "喵呜～",
  "咕噜咕噜…",
  "蹭蹭你 ~",
  "喵？",
  "呼噜呼噜～",
];

export function BentoCat() {
  const rootRef = React.useRef<HTMLButtonElement>(null);
  const { mood, bubble, handlePet } = usePetSequence({
    eggCount: 7,
    partyMs: 3000, // = cat-party 1.5s × 2 次
    happyTexts: HAPPY_TEXTS,
    eggText: "喵喵喵！被你发现了 🎉",
  });

  /* ---- 视线跟随 ----
     🔑 走 CSS 变量而不是 setState：鼠标每动一个像素就重渲染整张卡
        （整只 SVG 猫）太浪费了，直接写 DOM 变量交给合成层去动。
     坐标换算：把「鼠标相对猫脸中心」的方向归一化到一个单位圆里，
     再乘最大位移 —— 这样斜着看和正着看的位移量一致。 */
  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    // 降级：不做跟随（猫照常显示、照常能点）
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    /** 竖缝瞳孔的最大位移（SVG 用户单位，viewBox 200）。
        上限：虹膜 rx 12.5 / 眼缝 rx 2.2 → 水平最多 10.3；ry 14 / 9.5 → 最多 4.5。
        取 5.2 / 3.2 留余量 —— 再大高光就会从虹膜边缘探出去变成一块白斑
        （高光圆心相对眼缝还额外偏了 2.6 / 4.4）。 */
    const MAX_X = 5.2;
    const MAX_Y = 3.2;
    let raf = 0;

    const apply = (px: number, py: number) => {
      const r = el.getBoundingClientRect();
      if (!r.width) return;
      // 脸在卡片高度约 47% 处（趴着，头抬起来）
      const ex = r.left + r.width * 0.5;
      const ey = r.top + r.height * 0.47;

      let dx = (px - ex) / (r.width * 0.6);
      let dy = (py - ey) / (r.width * 0.6);
      const len = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, len) / len;
      dx *= k;
      dy *= k;

      el.style.setProperty("--gaze-x", `${(dx * MAX_X).toFixed(2)}px`);
      el.style.setProperty("--gaze-y", `${(dy * MAX_Y).toFixed(2)}px`);
    };

    const onMove = (e: PointerEvent) => {
      if (raf) return; // rAF 节流：一帧最多算一次
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        apply(e.clientX, e.clientY);
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  /** 开心 / 彩蛋时都是眯眼笑 */
  const happy = mood !== "idle";

  return (
    <button
      ref={rootRef}
      type="button"
      onClick={handlePet}
      aria-label="摸摸这只黑猫（连点 7 下有惊喜）"
      data-mood={mood}
      className="cat-root absolute inset-0 cursor-pointer overflow-clip rounded-[inherit] border-0 bg-transparent p-0 outline-offset-4"
    >
      {/* 背景一层极淡的暖光（会呼吸）。奶油底上的白光几乎看不出来，
          它只是让整张卡「有空气」，别调太亮 —— 猫才是主角 */}
      <span aria-hidden className="cat-glow" />

      {/* 对话气泡 */}
      {bubble ? (
        <span key={bubble.id} className="cat-bubble" data-egg={bubble.egg ? "" : undefined}>
          {bubble.text}
        </span>
      ) : null}

      {/* 彩蛋特效：爱心 / 星星 / 爪印分两轮齐飞（轮到第 8 个元素时第二波开始） */}
      {mood === "party" ? (
        <span aria-hidden className="cat-fx">
          <i>❤️</i>
          <i>💖</i>
          <i>❤️</i>
          <i>✨</i>
          <i>🐾</i>
          <i>⭐</i>
          <i>✨</i>
          <i>💛</i>
        </span>
      ) : null}

      <svg className="cat-svg" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
        {/* 地上那团影子（参考图也有一只柔和的椭圆投影）。它不跟着跳 */}
        <ellipse cx="100" cy="184" rx="62" ry="8" fill="#8A7F66" opacity="0.2" />

        {/* 身体组：呼吸 + 彩蛋时整只跳。**尾巴挂在身体里面**，
            这样跳的时候尾巴根不会跟身体脱开；尾巴自己再叠一层摆动。 */}
        <g className="cat-body">
          {/* ---- 尾巴：从右后方绕出来，搭在身前的地上（参考图就是这个走向）----
                 先画，压在身体后面 —— 尾巴根就藏在身体里 */}
          <g className="cat-tail">
            <path
              d="M148 162 C 184 164, 194 186, 166 189"
              fill="none"
              stroke="#302D26"
              strokeWidth="13"
              strokeLinecap="round"
            />
          </g>

          {/* ---- 身体（趴着的一团：贴地、扁圆）---- */}
          <ellipse cx="100" cy="150" rx="58" ry="32" fill="#302D26" />
          {/* 背上那几笔短毛（参考图的手绘笔触），比主色亮一档 */}
          <g stroke="#413C31" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.9">
            <path d="M50 134 C 56 130, 62 129, 68 130" />
            <path d="M44 150 C 50 147, 56 146, 62 147" />
            <path d="M150 132 C 144 129, 138 128, 132 129" />
          </g>

          {/* ---- 前爪：朝镜头伸出来（趴卧最自然的读法）----
                 比身体亮一档，否则同色会糊成一块；趾缝用深色短线 */}
          <rect x="76" y="148" width="20" height="40" rx="9" fill="#3A362D" />
          <rect x="104" y="148" width="20" height="40" rx="9" fill="#3A362D" />
          <g stroke="#16130F" strokeWidth="2" strokeLinecap="round" opacity="0.75">
            <path d="M82 178 L82 184" />
            <path d="M90 178 L90 184" />
            <path d="M110 178 L110 184" />
            <path d="M118 178 L118 184" />
          </g>

          {/* ---- 耳朵（先画，让头把耳根盖住）----
              短短圆圆、**立在头顶**：耳高 ≈ 头直径的 0.32（老版 0.48，那对高尖三角
              像一对角，小潘说"怪怪的"）。三个尖角靠「同色描边 + round 接合」磨圆。 */}
          <path
            className="cat-ear"
            d="M68 69 L74 42 L80 59 Z"
            fill="#302D26"
            stroke="#302D26"
            strokeWidth="8"
            strokeLinejoin="round"
          />
          <path d="M70 62 L74 51 L82 58 Z" fill="#4A4038" />
          <path
            className="cat-ear"
            d="M132 69 L126 42 L120 59 Z"
            fill="#302D26"
            stroke="#302D26"
            strokeWidth="8"
            strokeLinejoin="round"
          />
          <path d="M130 62 L126 51 L118 58 Z" fill="#4A4038" />

          {/* ---- 头（大！头大才显小）。趴着时头抬起来，所以头就在脸的位置 ---- */}
          <circle className="cat-head" cx="100" cy="96" r="42" fill="#302D26" />

          {/* 头顶那撮呆毛（两耳之间，参考图这里也有几根翘起来的毛）。
              ⚠️ 形状要「短而粗」：老版是 `M100 56 C 106 48, 95 45, 100 38` + 粗 5，
              S 形又细又高，截图里读起来像根触角。现在改成一撮朝右上翘的短毛。 */}
          <path
            className="cat-tuft"
            d="M100 58 C 105 54, 108 48, 106 43"
            fill="none"
            stroke="#302D26"
            strokeWidth="6.5"
            strokeLinecap="round"
          />

          {/* 口鼻区：比主色亮一档的暖灰 */}
          <ellipse cx="100" cy="116" rx="25" ry="17.5" fill="#3A362D" />

          {/* ---- 眼睛：黄绿虹膜 + 细竖缝（照参考图）---- */}
          {happy ? (
            /* 眯眼笑 ^ ^。🔴 必须是**亮色** —— 深色画在黑脸上等于没画。
               用状态切换而不是动画 —— 连点也能立刻看到反馈 */
            <>
              <path
                d="M66 100 Q78 86 90 100"
                fill="none"
                stroke="#C6D74F"
                strokeWidth="4.6"
                strokeLinecap="round"
              />
              <path
                d="M110 100 Q122 86 134 100"
                fill="none"
                stroke="#C6D74F"
                strokeWidth="4.6"
                strokeLinecap="round"
              />
            </>
          ) : (
            <>
              {/* 虹膜（静止：眼球不该跟着鼠标滑走）。外圈深色描边 = 眼眶 */}
              <ellipse
                className="cat-iris"
                cx="78"
                cy="100"
                rx="12.5"
                ry="14"
                fill="#C6D74F"
                stroke="#16130F"
                strokeWidth="2"
              />
              <ellipse
                className="cat-iris"
                cx="122"
                cy="100"
                rx="12.5"
                ry="14"
                fill="#C6D74F"
                stroke="#16130F"
                strokeWidth="2"
              />
              {/* 上缘更亮的一层黄：参考图的眼睛上半偏黄、下半偏绿 */}
              <ellipse cx="78" cy="95.5" rx="8.6" ry="6.6" fill="#DCE566" opacity="0.75" />
              <ellipse cx="122" cy="95.5" rx="8.6" ry="6.6" fill="#DCE566" opacity="0.75" />
              {/* 竖缝 + 一大一小两处高光：整组跟着 --gaze-x / --gaze-y 走。
                  两处高光是「水汪汪」的关键，一颗高光看着像塑料珠。 */}
              <g className="cat-eye-gaze">
                <ellipse cx="78" cy="100" rx="2.2" ry="9.5" fill="#14120F" />
                <circle cx="80.4" cy="95.8" r="2.5" fill="#FFFFFF" opacity="0.95" />
                <circle cx="76" cy="104" r="1.4" fill="#FFFFFF" opacity="0.5" />
              </g>
              <g className="cat-eye-gaze">
                <ellipse cx="122" cy="100" rx="2.2" ry="9.5" fill="#14120F" />
                <circle cx="124.4" cy="95.8" r="2.5" fill="#FFFFFF" opacity="0.95" />
                <circle cx="120" cy="104" r="1.4" fill="#FFFFFF" opacity="0.5" />
              </g>
            </>
          )}

          {/* ---- 鼻子 + 嘴（深色，照参考图）---- */}
          <path
            d="M94.5 112 L105.5 112 L100 118.5 Z"
            fill="#584F4B"
            stroke="#584F4B"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
          <path
            d="M100 119 Q94 126 88 120"
            fill="none"
            stroke="#16130F"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M100 119 Q106 126 112 120"
            fill="none"
            stroke="#16130F"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* 彩蛋时吐一下小舌头 */}
          {mood === "party" ? (
            <path d="M96 122.5 h8 v2.6 a4 4 0 0 1 -8 0 z" fill="#D98A8A" />
          ) : null}

          {/* ---- 胡须 + 胡须孔。深色胡须画在奶油底上才看得见 ---- */}
          <g fill="#2A2620">
            <circle cx="88" cy="110" r="1" />
            <circle cx="85.5" cy="116" r="1" />
            <circle cx="88" cy="121.5" r="1" />
            <circle cx="112" cy="110" r="1" />
            <circle cx="114.5" cy="116" r="1" />
            <circle cx="112" cy="121.5" r="1" />
          </g>
          <g stroke="#4A4438" strokeWidth="1.7" strokeLinecap="round" opacity="0.95">
            <path d="M76 111 Q62 105 48 106" />
            <path d="M76 118 Q63 122 50 127" />
            <path d="M124 111 Q138 105 152 106" />
            <path d="M124 118 Q137 122 150 127" />
          </g>
        </g>
      </svg>
    </button>
  );
}
