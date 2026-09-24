"use client";

import * as React from "react";

import { usePetSequence } from "@/hooks/use-pet";

/* ============================================================================
   LoginCat —— 趴在登录页邮箱框上沿的一只猫（第二个撸猫彩蛋）

   ## 它和不远处 第 2 格那只的区别

   | | 第 2 格 BentoCat | 这里 LoginCat |
   |---|---|---|
   | 姿势 | **趴卧**（四爪朝前、抬头看人） | **坐着**（照小潘给的参考图那副坐相） |
   | 落点 | 奶油米色卡片正中 | **邮箱输入框的顶沿上**（尾巴搭在框边） |
   | 彩蛋 | 连点 7 下 | **连点 5 下 → 直接跳过登录进 `/bento`** |
   | 柔光 | 不需要（米色卡本身有对比） | **必须**（登录页暗色底 ≈ 近黑） |

   撸猫的状态机（连点计数、彩蛋保护期、气泡轮换）在 `hooks/use-pet.ts`，
   两只猫共用同一套 —— 所以「手快补点把彩蛋顶掉」那个 bug 只需要修一次。

   ## 造型：和小潘给的参考图（写实风黑猫）**同一套色板**

   毛 `#302D26`（暖调炭黑）/ 受光面 `#3A362D` / 眼 `#C6D74F`（黄绿）+ 细竖缝 /
   鼻嘴 `#584F4B` `#16130F` / 耳内 `#4A4038` / 深色胡须 `#4A4438`。
   参考图里**没有**项圈铃铛、腮红、白肚子、粉鼻子 —— 这一版都没有。

   ## 🔴 两件事不许动

   1. **不许挡住输入框。** 输入框是 `h-12` 胶囊，猫的底边**只压住顶沿 6px**
      （`h-[76px] top-[-70px]` → bottom = input.top + 6），占位文字完全露得出来。
      `verify-cat.js` 的 B1 会真的去**点输入框正中**、断言 `activeElement` 是 `email`。
   2. **`.cat-halo` 不能删。** 登录页底色是 `bg-background`，暗色下 ≈
      `hsl(20 14.3% 4.1%)` 近黑 —— 炭黑猫直接坐上去就是一团糊。那层暖柔光就是
      「月光」，剪影全靠它立住。**猫靠左摆**（`left-[8%]`）是为了给右侧那句
      暗示文案让位（两者 x 区间不重叠）。

   另外：它是一个真 `<button>`（`type="button"`，不会误提交表单），
   但**不能**给外层的定位包裹加 `pointer-events-none` —— 那会把猫一起废掉。
   ============================================================================ */

/** 普通点击的气泡文案池（和 第 2 格那只不重样，各自有各自的嗲法） */
const HAPPY_TEXTS = [
  "喵？",
  "呼噜～",
  "喵嗷～",
  "摸摸头…",
  "喵呜♡",
];

export function LoginCat({
  onSkip,
  disabled = false,
}: {
  /** 连点 5 下触发的「跳过登录」。原点 = 猫的中心，方便幕布从猫身上铺开 */
  onSkip?: (origin: { x: number; y: number }) => void;
  disabled?: boolean;
}) {
  const rootRef = React.useRef<HTMLButtonElement>(null);

  /** 只在事件回调里读，绝不参与渲染 ✓ */
  const originRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const readOrigin = React.useCallback(() => {
    const r = rootRef.current?.getBoundingClientRect();
    originRef.current = r
      ? { x: r.left + r.width / 2, y: r.top + r.height / 2 }
      : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    return originRef.current;
  }, []);

  const { mood, bubble, handlePet } = usePetSequence({
    eggCount: 5,
    windowMs: 1800,
    partyMs: 2600,
    happyTexts: HAPPY_TEXTS,
    eggText: "喵！跟你走～",
    onEgg: () => onSkip?.(readOrigin()),
  });

  /* ---- 视线跟随：和 第 2 格同一套，也是写 CSS 变量、零重渲染 ---- */
  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // 头在 viewBox 的偏左位置（78/200 = 39%），脸高 60/146 = 41%
    const MAX_X = 4.6;
    const MAX_Y = 2.8;
    let raf = 0;

    const apply = (px: number, py: number) => {
      const r = el.getBoundingClientRect();
      if (!r.width) return;
      const ex = r.left + r.width * 0.39;
      const ey = r.top + r.height * 0.41;
      let dx = (px - ex) / (r.width * 0.5);
      let dy = (py - ey) / (r.height * 0.8);
      const len = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, len) / len;
      dx *= k;
      dy *= k;
      el.style.setProperty("--gaze-x", `${(dx * MAX_X).toFixed(2)}px`);
      el.style.setProperty("--gaze-y", `${(dy * MAX_Y).toFixed(2)}px`);
    };

    const onMove = (e: PointerEvent) => {
      if (raf) return;
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

  const pet = React.useCallback(() => {
    if (disabled) return;
    handlePet();
  }, [disabled, handlePet]);

  const happy = mood !== "idle";

  return (
    <button
      ref={rootRef}
      type="button"
      onClick={pet}
      aria-label="摸摸这只黑猫（连点 5 下有惊喜）"
      data-mood={mood}
      data-cat="login"
      className="cat-root cat-root-lie absolute left-[8%] top-[-70px] h-[76px] w-[104px] cursor-pointer border-0 bg-transparent p-0 outline-offset-4"
    >
      {/* 暖柔光底：暗色主题下登录页是近黑底，炭黑猫直接坐上去会糊成一坨 */}
      <span aria-hidden className="cat-halo" />

      {/* 对话气泡：锚在猫头那边（39%），不是身体正中 */}
      {bubble ? (
        <span
          key={bubble.id}
          className="cat-bubble"
          data-egg={bubble.egg ? "" : undefined}
          data-anchor="head"
        >
          {bubble.text}
        </span>
      ) : null}

      {/* 彩蛋特效：爱心 / 星星 / 爪印两轮齐飞，锚点同样跟着头走 */}
      {mood === "party" ? (
        <span aria-hidden className="cat-fx" data-anchor="head">
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

      <svg className="cat-svg" viewBox="0 0 200 146" aria-hidden="true" focusable="false">
        <g className="cat-body cat-body-lie">
          {/* ---- 尾巴：从身体右侧绕出来，搭在框边（= 地面）上，尾巴尖翘起来。
                  先画，尾巴根藏在身体里。 ---- */}
          <g className="cat-tail cat-tail-lie">
            <path
              d="M114 128 C 142 134, 162 130, 170 118"
              fill="none"
              stroke="#302D26"
              strokeWidth="11"
              strokeLinecap="round"
            />
          </g>

          {/* ---- 身体（坐着的钟形）。底下 6px 会被输入框盖住（那就是「坐在框沿上」）---- */}
          <path
            d="M36 134 C 36 104, 50 88, 78 88 C 106 88, 120 104, 120 134 Z"
            fill="#302D26"
          />
          {/* 胸口的受光面。往上、往中间收着画，别糊到前腿那一排 */}
          <ellipse cx="78" cy="114" rx="21" ry="16" fill="#3A362D" />

          {/* ---- 前腿 + 趾缝：比身体亮一档，否则同色糊成一块 ---- */}
          <rect x="60" y="108" width="16" height="26" rx="8" fill="#38342B" />
          <rect x="80" y="108" width="16" height="26" rx="8" fill="#38342B" />
          <g stroke="#16130F" strokeWidth="1.8" strokeLinecap="round" opacity="0.7">
            <path d="M65 126 L65 131" />
            <path d="M71 126 L71 131" />
            <path d="M85 126 L85 131" />
            <path d="M91 126 L91 131" />
          </g>

          {/* ---- 耳朵（先画，让头把耳根盖住）----
              短短圆圆、**立在头顶**，耳高 ≈ 头直径的 0.33，尖角靠同色 stroke +
              round 接合磨圆（比手写贝塞尔好调多了）。 */}
          <path
            className="cat-ear"
            d="M47 30 L53 4 L60 21 Z"
            fill="#302D26"
            stroke="#302D26"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          <path d="M50 25 L53 13 L63 20 Z" fill="#4A4038" />
          <path
            className="cat-ear"
            d="M109 30 L103 4 L96 21 Z"
            fill="#302D26"
            stroke="#302D26"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          <path d="M106 25 L103 13 L93 20 Z" fill="#4A4038" />

          {/* ---- 头。整只是「大脑袋短身子」的憨比例，显小 ---- */}
          <circle className="cat-head" cx="78" cy="56" r="40" fill="#302D26" />

          {/* 口鼻区：比主色亮一档的暖灰 */}
          <ellipse cx="78" cy="78" rx="22" ry="15" fill="#3A362D" />

          {/* ---- 眼睛：黄绿虹膜 + 细竖缝（照参考图）---- */}
          {happy ? (
            /* 眯眼笑 ^ ^，🔴 必须是**亮色** —— 深色画在黑脸上等于没画 */
            <>
              <path
                d="M50 63 Q62 50 74 63"
                fill="none"
                stroke="#C6D74F"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M82 63 Q94 50 106 63"
                fill="none"
                stroke="#C6D74F"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </>
          ) : (
            <>
              {/* 虹膜（静止：眼球不该跟着鼠标滑走），外圈深色描边当眼眶 */}
              <ellipse
                className="cat-iris"
                cx="62"
                cy="60"
                rx="11"
                ry="12"
                fill="#C6D74F"
                stroke="#16130F"
                strokeWidth="1.8"
              />
              <ellipse
                className="cat-iris"
                cx="94"
                cy="60"
                rx="11"
                ry="12"
                fill="#C6D74F"
                stroke="#16130F"
                strokeWidth="1.8"
              />
              {/* 上缘更亮的一层黄 */}
              <ellipse cx="62" cy="56" rx="7.6" ry="5.8" fill="#DCE566" opacity="0.75" />
              <ellipse cx="94" cy="56" rx="7.6" ry="5.8" fill="#DCE566" opacity="0.75" />
              {/* 竖缝 + 两处高光：跟着 --gaze-x / --gaze-y 走 */}
              <g className="cat-eye-gaze">
                <ellipse cx="62" cy="60" rx="1.9" ry="8" fill="#14120F" />
                <circle cx="64.2" cy="56.2" r="2.1" fill="#FFFFFF" opacity="0.95" />
                <circle cx="60" cy="64" r="1.2" fill="#FFFFFF" opacity="0.5" />
              </g>
              <g className="cat-eye-gaze">
                <ellipse cx="94" cy="60" rx="1.9" ry="8" fill="#14120F" />
                <circle cx="96.2" cy="56.2" r="2.1" fill="#FFFFFF" opacity="0.95" />
                <circle cx="92" cy="64" r="1.2" fill="#FFFFFF" opacity="0.5" />
              </g>
            </>
          )}

          {/* ---- 鼻子 + 嘴（深色，照参考图）---- */}
          <path
            d="M73 76.5 L83 76.5 L78 83 Z"
            fill="#584F4B"
            stroke="#584F4B"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M78 83 Q73 88.5 68 84"
            fill="none"
            stroke="#16130F"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
          <path
            d="M78 83 Q83 88.5 88 84"
            fill="none"
            stroke="#16130F"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
          {mood === "party" ? (
            <path d="M75 86 h6 v2 a3 3 0 0 1 -6 0 z" fill="#D98A8A" />
          ) : null}

          {/* ---- 胡须 + 胡须孔。这只小，胡须别飘出身体轮廓太远 ---- */}
          <g fill="#2A2620">
            <circle cx="69" cy="74" r="0.9" />
            <circle cx="67" cy="78.5" r="0.9" />
            <circle cx="69" cy="82.5" r="0.9" />
            <circle cx="87" cy="74" r="0.9" />
            <circle cx="89" cy="78.5" r="0.9" />
            <circle cx="87" cy="82.5" r="0.9" />
          </g>
          <g stroke="#4A4438" strokeWidth="1.5" strokeLinecap="round" opacity="0.9">
            <path d="M62 76 Q48 71 34 72" />
            <path d="M62 82 Q50 86 38 90" />
            <path d="M94 76 Q108 71 122 72" />
            <path d="M94 82 Q106 86 118 90" />
          </g>
        </g>
      </svg>
    </button>
  );
}
