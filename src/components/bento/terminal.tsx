"use client";

import * as React from "react";

import { TerminalIcon } from "@/components/bento/icons";

/**
 * 打一个字的命令行，逐字敲、逐字删、循环三句（复刻参考站那句 `> vim_`）。
 *
 * 参考站用的是 typed.js（由它的 `typed-cursor` / `typedjsBlink` 推出来），
 * 但那句循环的话术是**实测出来的**：抓了 14 次文本，序列是
 *   `ls res` → ``（清空）→ `vim` → `cat` → `cat res` → `cat resume` → `cat resum`
 * 说明它在 `vim` / `cat resume` / `ls` 三句之间来回敲和删。
 * 我们照这个行为复刻，只是换成自己站的话术。
 *
 * 🔴 光标闪烁用 `typed-cursor--blink`（0.7s 硬切），**不是**淡入淡出：
 *    淡的会像呼吸灯，只有 `50% { opacity: 0 }` 的硬切才像终端光标。
 *    打字过程中去掉闪烁类（常亮），停手才闪 —— 这是真 typed.js 的行为。
 */

const LINES = ["vim", "cat resume", "ls tools"];

/** 打字 / 退格速度（每字 ms）与停顿 */
const TYPE_MS = 130;
const BACK_MS = 70;
const HOLD_MS = 1600;
const AFTER_MS = 420;

export function TerminalCard() {
  const [text, setText] = React.useState("");
  const [typing, setTyping] = React.useState(true);

  React.useEffect(() => {
    // 降级：直接显示第一句，不做打字机
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setText(LINES[0]);
      setTyping(false);
      return;
    }

    let line = 0;
    let ch = 0;
    let phase: "type" | "hold" | "back" | "gap" = "type";
    let timer: number;

    const tick = () => {
      const target = LINES[line];
      if (phase === "type") {
        ch++;
        setText(target.slice(0, ch));
        setTyping(true);
        if (ch >= target.length) {
          phase = "hold";
          timer = window.setTimeout(tick, HOLD_MS);
          return;
        }
        timer = window.setTimeout(tick, TYPE_MS);
      } else if (phase === "hold") {
        setTyping(false);
        phase = "back";
        timer = window.setTimeout(tick, BACK_MS);
      } else if (phase === "back") {
        ch--;
        setText(target.slice(0, Math.max(0, ch)));
        setTyping(true);
        if (ch <= 0) {
          phase = "gap";
          timer = window.setTimeout(tick, AFTER_MS);
          return;
        }
        timer = window.setTimeout(tick, BACK_MS);
      } else {
        line = (line + 1) % LINES.length;
        ch = 0;
        phase = "type";
        timer = window.setTimeout(tick, TYPE_MS);
      }
    };

    timer = window.setTimeout(tick, 600);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <a
      href="#"
      aria-label="打开命令行"
      className="flex size-full items-center justify-center text-lg text-gray-200 md:text-2xl"
    >
      <TerminalIcon className="mr-2 size-4 text-green-400 md:size-6" />
      <span>{text}</span>
      {/* 光标宽度跟着字体走：用 min-w 撑出一个下划线格 */}
      <span
        aria-hidden
        className={
          "typed-cursor ml-0.5 inline-block" + (typing ? "" : " typed-cursor--blink")
        }
      >
        _
      </span>
    </a>
  );
}
