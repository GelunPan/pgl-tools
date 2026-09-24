"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { TerminalIcon } from "@/components/bento/icons";

/**
 * 终端卡：一个自说自话的假命令行。
 *
 * ## 一、闲着的时候（打字机循环）
 *
 * 逐字敲、逐字删、循环三句（复刻参考站那句 `> vim_`）。
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
 *
 * ## 二、点一下的时候（2026-09-24 升级：执行完跳 /resume）
 *
 * 参考站那张卡是 `<a href="/resume">`，点一下**跳走**。我们照它的目的地
 * 做了一个自己的 /resume（整页假终端会话，`src/app/resume/page.tsx`，
 * 内容按小潘的工具箱发挥）。点卡片的行为：
 *
 * 1. 回车：命令行末尾落下一个 `↵`，光标转成闪烁态（= 命令提交了）
 * 2. 命令行下方**逐行**吐出输出（每行 160ms 错峰，淡入 + 上浮）
 * 3. 一道绿光自上而下扫过屏幕（`.term-sweep`），像终端刷了一屏
 * 4. 输出吐完再给一小拍 → `router.push("/resume")` —— 不再回 idle
 *
 * 全程只改本地 state，不涉及网络；再点一下会**被忽略**（不打断正在跑的命令）。
 *
 * ### 两条必须守住的线
 *
 * - 🔴 **输出行的可见性不能依赖动画**。`.term-line-in` 只负责「入场」，
 *   元素本身的 opacity 是 1 —— 所以 `prefers-reduced-motion` 下把动画一掐，
 *   行还在，只是不再淡入（这正是 PROJECT.md §6.4 挂钩板踩过的反例）。
 * - 🔴 **`prefers-reduced-motion` 下也要能「点一下就过去」**：输出一次全显，
 *   120ms 后直接跳转，不做逐行、不做扫光。
 */

/** 三句脚本：命令行 + 点了之后吐出来的输出。写死成常量，渲染期不产生任何随机值 */
const SCRIPTS = [
  {
    cmd: "vim",
    out: ["~", "~    ~    ~", "~    ~    ~    ~", "已进入 vim（骗你的，按 :q 退出）"],
  },
  {
    cmd: "cat resume",
    out: ["苹果绿的工具箱 · 潘葛伦", "广州 / 前端 / 爱折腾小零件", "gelun.eu.cc"],
  },
  {
    cmd: "ls tools",
    out: ["时间戳转换    JSON 格式化", "颜色工具      文本对比", "正则测试"],
  },
];

/** 打字 / 退格速度（每字 ms）与停顿 */
const TYPE_MS = 130;
const BACK_MS = 70;
const HOLD_MS = 1600;
const AFTER_MS = 420;

/** 输出行之间的错峰，以及输出停留多久（老版「原地循环」用的，现在被跳转替代） */
const OUT_STEP_MS = 160;

export function TerminalCard() {
  const router = useRouter();
  const [text, setText] = React.useState("");
  const [typing, setTyping] = React.useState(true);
  /** 正在执行哪一句（null = 没在执行） */
  const [runIdx, setRunIdx] = React.useState<number | null>(null);
  /** 已经吐出几行 */
  const [outCount, setOutCount] = React.useState(0);

  /** 打字机跑到第几句。用 ref 是因为执行时要从「当前这一句」取输出 */
  const lineRef = React.useRef(0);
  /** 正在执行 → 打字机暂停（ref 而不是 state：打字机的定时器不该被它重建） */
  const busyRef = React.useRef(false);
  /** 定时器统一收口，卸载时全部清掉 */
  const timersRef = React.useRef<number[]>([]);

  const clearTimers = React.useCallback(() => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  }, []);

  React.useEffect(() => clearTimers, [clearTimers]);

  // ---------------- 打字机 ----------------
  React.useEffect(() => {
    // 降级：直接显示第一句，不做打字机
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setText(SCRIPTS[0].cmd);
      setTyping(false);
      return;
    }

    let ch = 0;
    let phase: "type" | "hold" | "back" | "gap" = "type";
    let timer: number;

    const tick = () => {
      // 正在跑命令：什么都不做，但**继续挂上下一拍**，
      // 否则 run 结束后循环就断了（这是最容易漏的一行）
      if (busyRef.current) {
        timer = window.setTimeout(tick, 200);
        return;
      }

      const target = SCRIPTS[lineRef.current].cmd;
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
        lineRef.current = (lineRef.current + 1) % SCRIPTS.length;
        ch = 0;
        phase = "type";
        timer = window.setTimeout(tick, TYPE_MS);
      }
    };

    timer = window.setTimeout(tick, 600);
    return () => window.clearTimeout(timer);
  }, []);

  // ---------------- 点一下：执行当前这句，然后进简历终端 ----------------
  // 2026-09-24 小潘：「应该要可点击的，点击后会进入一个新的界面」。
  // 参考站那张卡是 <a href="/resume">；我们照它的目的地做一个 /resume
  // （整页假终端会话，见 src/app/resume/page.tsx），点卡片 =
  // 先把当前命令「跑完」（逐行吐输出 + 扫光），再 router.push 过去。
  const run = React.useCallback(() => {
    if (busyRef.current) return; // 不打断正在跑的命令
    busyRef.current = true;

    const idx = lineRef.current;
    const out = SCRIPTS[idx].out;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 命令行补全 + 光标转闪烁态（= 提交了）
    setText(SCRIPTS[idx].cmd);
    setTyping(false);
    setRunIdx(idx);

    if (reduced) {
      setOutCount(out.length);
    } else {
      setOutCount(0);
      out.forEach((_, i) => {
        timersRef.current.push(
          window.setTimeout(() => setOutCount(i + 1), 120 + i * OUT_STEP_MS),
        );
      });
    }

    // 🔴 跳转要等输出**全部吐完**再给一小拍（别吐到一半就把页面带走），
    //    然后就走 —— 不再回到 idle（回 idle 是老版「原地循环」的行为）。
    //    计时器收在 timersRef 里，卸载时统一清掉。
    timersRef.current.push(
      window.setTimeout(
        () => router.push("/resume"),
        reduced ? 120 : 420 + out.length * OUT_STEP_MS,
      ),
    );

    // 兜底清 busy（正常情况下组件随跳转卸载，走不到这里）
    timersRef.current.push(
      window.setTimeout(() => {
        busyRef.current = false;
      }, 4000),
    );
  }, [router]);

  const running = runIdx !== null;
  const out = running ? SCRIPTS[runIdx].out : [];

  return (
    <button
      type="button"
      onClick={run}
      aria-label={running ? "正在打开简历" : "打开简历终端"}
      data-running={running ? "" : undefined}
      className="group/term relative flex size-full cursor-pointer flex-col items-center justify-center overflow-clip text-lg text-gray-200 outline-offset-4 md:text-2xl"
    >
      {/* 扫光：只在执行时出现，自上而下刷一屏 */}
      {running ? (
        <span
          aria-hidden
          className="term-sweep pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-[linear-gradient(rgba(52,211,153,0),rgba(52,211,153,0.16),rgba(52,211,153,0))]"
        />
      ) : null}

      {/* 命令行。🔴 它**不参与纵向布局的变化** —— 输出用绝对定位挂在下面，
          否则吐行的时候这一行会被顶上去，看着像跳了一下。 */}
      <span className="flex items-center">
        <TerminalIcon className="mr-2 size-4 text-green-400 md:size-6" />
        <span>{text}</span>
        {running ? <span className="ml-0.5 text-green-400">↵</span> : null}
        {/* 光标宽度跟着字体走：用 min-w 撑出一个下划线格 */}
        <span
          aria-hidden
          className={
            "typed-cursor ml-0.5 inline-block" + (typing ? "" : " typed-cursor--blink")
          }
        >
          _
        </span>
      </span>

      {/* 输出：贴着中线往下排，逐行淡入 */}
      <span
        aria-live="polite"
        className="absolute inset-x-0 top-1/2 mt-3 flex flex-col items-center gap-0.5 px-4 font-mono text-[11px] leading-tight text-green-300/90 md:text-xs"
      >
        {out.slice(0, outCount).map((line, i) => (
          <span key={`${runIdx}-${i}`} className="term-line-in block">
            {line}
          </span>
        ))}
      </span>
    </button>
  );
}
