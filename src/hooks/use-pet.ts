"use client";

import * as React from "react";

/* ============================================================================
   usePetSequence —— 两只猫共用的「撸猫」状态机

   | 行为           | 触发             | 结果                                        |
   |----------------|------------------|---------------------------------------------|
   | 点一下         | 单击             | mood=happy（眯眼笑）+ 气泡（文案按次数轮换） |
   | 连点 N 下      | windowMs 内 N 下 | mood=party（彩蛋）+ 专属气泡 + onEgg()       |

   ## 🔴 彩蛋保护期（eggCooldownMs）—— 这是踩过的坑

   最早的实现是「看过彩蛋就把计数归零」。结果：第 7 下触发了彩蛋，
   用户手一快第 8 下补点 —— 计数变成 1、不是彩蛋，于是走普通分支把
   mood 从 party 顶成 happy，**彩蛋当场被点没了**。

   修法：触发彩蛋时记一个 `lockUntil = now + partyMs + eggCooldownMs`，
   在这之前来的点击**整颗吞掉**（不改状态、不换文案）。
   即「彩蛋完整播完 + 再等 0.5s」才重新接受点击。

   ## 为什么用 ref 存 options

   `handlePet` 只依赖 `later`，其余参数一律从 `optsRef` 现取。
   这样调用方把文案数组写成行内字面量也不会让回调每帧换身份，
   同时不存在「闭包读到旧 props」的隐患。
   ============================================================================ */

export type PetMood = "idle" | "happy" | "party";

export type PetBubble = { id: number; text: string; egg: boolean };

export type UsePetOptions = {
  /** 连点几下触发彩蛋 */
  eggCount?: number;
  /** 连点判定窗口：两次点击间隔超过它就从 1 重新数 */
  windowMs?: number;
  /** 普通点击的表情持续时长（ms） */
  happyMs?: number;
  /** 彩蛋持续时长（ms）。**必须等于 CSS 里彩蛋动画的总时长**，否则会提前切回 idle */
  partyMs?: number;
  /** 普通气泡停留时长（ms） */
  bubbleMs?: number;
  /** 🔴 彩蛋播完后再锁多久才接受点击（ms）—— 防止手快把彩蛋点没 */
  eggCooldownMs?: number;
  /** 普通点击的文案池，按点击次数依次轮换（写死常量，别用随机） */
  happyTexts?: string[];
  /** 彩蛋文案 */
  eggText?: string;
  /** 彩蛋触发时的一次性副作用（登录页用它跳过登录） */
  onEgg?: () => void;
};

export function usePetSequence(options: UsePetOptions = {}) {
  const {
    eggCount = 7,
    windowMs = 1600,
    happyMs = 900,
    partyMs = 3000,
    bubbleMs = 1400,
    eggCooldownMs = 500,
    happyTexts = ["喵～"],
    eggText = "喵！",
    onEgg,
  } = options;

  const [mood, setMood] = React.useState<PetMood>("idle");
  const [bubble, setBubble] = React.useState<PetBubble | null>(null);

  /* ---- 定时器集中托管：卸载时一次清干净（组件没了定时器还在跑很难查） ---- */
  const timersRef = React.useRef<Set<number>>(new Set());
  const later = React.useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timersRef.current.delete(id);
      fn();
    }, ms);
    timersRef.current.add(id);
  }, []);
  React.useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      timers.clear();
    };
  }, []);

  /* ---- 参数永远现取，回调身份保持稳定 ---- */
  const optsRef = React.useRef(options);
  optsRef.current = options;

  const countRef = React.useRef(0); // 本轮连点计数
  const lastRef = React.useRef(0); // 上一次点击的时间戳
  const lockRef = React.useRef(0); // 彩蛋保护期截止时间戳
  const moodSeqRef = React.useRef(0); // 「收起表情」定时器的守卫
  const bubbleSeqRef = React.useRef(0); // 「收起气泡」定时器的守卫

  const handlePet = React.useCallback(() => {
    const o = optsRef.current;
    const eCount = o.eggCount ?? eggCount;
    const eWindow = o.windowMs ?? windowMs;
    const eHappy = o.happyMs ?? happyMs;
    const eParty = o.partyMs ?? partyMs;
    const eBubble = o.bubbleMs ?? bubbleMs;
    const eCooldown = o.eggCooldownMs ?? eggCooldownMs;

    const now = Date.now(); // 只出现在事件回调里，永远不参与渲染 ✓
    if (now < lockRef.current) return; // 🔴 彩蛋保护期：这一次点击整颗吞掉

    countRef.current =
      now - lastRef.current > eWindow ? 1 : countRef.current + 1;
    lastRef.current = now;

    const isEgg = countRef.current >= eCount;
    if (isEgg) {
      countRef.current = 0;
      lockRef.current = now + eParty + eCooldown;
    }

    /* seq 守卫：连点时前一次的「收起」定时器不能把后一次的提前收掉 */
    moodSeqRef.current += 1;
    const moodSeq = moodSeqRef.current;
    setMood(isEgg ? "party" : "happy");
    later(
      () => {
        if (moodSeqRef.current === moodSeq) setMood("idle");
      },
      isEgg ? eParty : eHappy,
    );

    const pool = o.happyTexts ?? happyTexts;
    const text = isEgg
      ? (o.eggText ?? eggText)
      : pool[(countRef.current - 1) % pool.length];

    bubbleSeqRef.current += 1;
    const bId = bubbleSeqRef.current;
    setBubble({ id: bId, text, egg: isEgg });
    later(
      () => setBubble((b) => (b && b.id === bId ? null : b)),
      isEgg ? eParty : eBubble,
    );

    if (isEgg) o.onEgg?.();
  }, [
    later,
    eggCount,
    windowMs,
    happyMs,
    partyMs,
    bubbleMs,
    eggCooldownMs,
    happyTexts,
    eggText,
  ]);

  return { mood, bubble, handlePet };
}
