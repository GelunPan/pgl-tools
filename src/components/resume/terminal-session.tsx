"use client";

import * as React from "react";
import Link from "next/link";

/* ============================================================================
   TerminalSession —— /resume 的整页「macOS 终端」（2026-09-24 深夜 v2）

   小潘的要求：「完全完全复刻 zhangyu.dev/resume 那个苹果系统的命令行，
   哪怕左上角叉/缩小那些按钮，动效一定要很好」。

   ## 参考站是怎么做的（反编译 page chunk 扒出来的，照此复刻）

   - **窗口**：全屏 `#282935` 底 → 居中一张 `rounded-2xl border shadow-2xl` 终端窗；
     标题栏 `grid-cols-[1fr_2fr_1fr]`：左边红黄绿三灯（**红灯是返回链接**，hover 显 ✕；
     黄/绿 `cursor-not-allowed`）、中间 `用户名@MacBook-Air:~`、右边 `⌥⌘1`。
   - **打字动效 = 三块积木**：
       `Typed`（容器）→ 持有一个索引，只渲染前 `step+1` 个子元素，
         每个子元素通过 `onRendered` 回调通知它「我演完了，放行下一个」；
       `TypedText`（命令行）→ 等 beforeDelay 后**逐字打出**（~150ms/字），
         打字中显示 `~` 前缀 + 闪烁 `█` 光标；打完变粗斜体、光标消失；
       `TypedContent`（输出块）→ 立即显示，停 ~1.5s 再放行下一个。
     每个新元素 `scrollIntoView({ smooth })` 自动滚进视口。
   - **SSR 兜底**：`useSyncExternalStore` 的 server snapshot 返回 true →
     服务端/无 JS 时整页静态直出（SEO、内容永不缺）；hydration 后才切到动画。
     reduced-motion 同样走静态直出 —— 动画只是「附加」，不是可见性的前提。

   ## 与参考站的差异（有意为之）

   - 内容换成小潘自己的（whoami / ls / projects / experience / skills / contact / exit）；
   - 光标闪烁复用 globals.css 的 `.typed-cursor--blink`（50% 硬切，真终端的样子）；
   - 窗口加了一个入场动效 `.resume-win`（reduce 下掐掉）。

   ## 🔴 红线

   - `Math.random()` 只出现在 setTimeout 回调里（打字节奏抖动），**绝不参与渲染**；
   - `Date.now()` 不进渲染 —— Last login 是写死的字符串；
   - reduced-motion / 静态导出下整页内容**必须完整可见**（见 useServerStatic）。
   ============================================================================ */

const noopSubscribe = () => () => {};

/** 服务端渲染 / 无 JS → true（整页静态直出）；客户端 hydration 后 → false（跑动画） */
function useServerStatic() {
  return React.useSyncExternalStore(
    noopSubscribe,
    () => false,
    () => true,
  );
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type RenderedCallback = () => void;

/* --------------------------------------------------------------------------
   Typed —— 打字序列容器：逐个「放行」子元素（照参考站 1:1 复刻）
   -------------------------------------------------------------------------- */
function Typed({ children }: { children: React.ReactNode }) {
  const isStatic = useServerStatic();
  const [step, setStep] = React.useState(0);
  const items = React.Children.toArray(children);

  /* reduced-motion：不做逐段级联，挂载后立刻放行全部 —— 内容即时应见 */
  React.useEffect(() => {
    if (!isStatic && prefersReducedMotion()) setStep(items.length - 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStatic]);

  if (isStatic) return <div>{items}</div>;

  return (
    <div>
      {items.slice(0, step + 1).map((child, i) =>
        React.cloneElement(child as React.ReactElement, {
          active: i === step,
          onRendered: () => setStep((s) => s + 1),
        }),
      )}
    </div>
  );
}

/* --------------------------------------------------------------------------
   TypedText —— 一行命令：逐字打出，打字中带光标，打完变粗斜体
   -------------------------------------------------------------------------- */
function TypedText({
  command,
  active,
  onRendered,
  beforeDelay = 600,
  afterDelay = 450,
}: {
  command: string;
  active?: boolean;
  onRendered?: RenderedCallback;
  beforeDelay?: number;
  afterDelay?: number;
}) {
  const isStatic = useServerStatic();
  const textRef = React.useRef<HTMLSpanElement>(null);
  const cbRef = React.useRef<RenderedCallback | undefined>(undefined);
  React.useEffect(() => {
    cbRef.current = onRendered;
  });

  React.useEffect(() => {
    if (isStatic) return;
    const el = textRef.current;
    if (!el) return;

    const reduced = prefersReducedMotion();
    el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest" });

    const chars = Array.from(command);
    let i = 0;
    let timer = 0;
    el.textContent = "";

    const type = () => {
      if (!textRef.current) return;
      if (i >= chars.length) {
        timer = window.setTimeout(() => cbRef.current?.(), afterDelay);
        return;
      }
      textRef.current.textContent += chars[i++];
      // 每个字 110~190ms 抖动 —— 机械等间隔一眼假，人类打字没有这么匀
      timer = window.setTimeout(type, 110 + Math.random() * 80);
    };

    if (reduced) {
      // reduce：不逐字打，直接整行落下（内容不依赖动画才可见）
      el.textContent = command;
      timer = window.setTimeout(() => cbRef.current?.(), 60);
    } else {
      timer = window.setTimeout(type, beforeDelay);
    }
    return () => window.clearTimeout(timer);
  }, [isStatic, command, beforeDelay, afterDelay]);

  const past = !isStatic && active === false; // 已经打完的历史命令
  return (
    <p
      className={`mt-6 flex items-center gap-1.5 text-gray-200 first:mt-0 ${
        past ? "font-bold italic" : ""
      }`}
    >
      {active ? (
        <span aria-hidden="true" className="text-sky-400">
          ~
        </span>
      ) : null}
      <ChevronIcon />
      <span ref={textRef}>{isStatic ? command : null}</span>
      {active ? (
        <span
          aria-hidden="true"
          className="typed-cursor typed-cursor--blink text-[#7ee787]"
        >
          █
        </span>
      ) : null}
    </p>
  );
}

/* --------------------------------------------------------------------------
   TypedContent —— 一块输出：立即显示，停一会儿再放行下一行
   -------------------------------------------------------------------------- */
function TypedContent({
  children,
  onRendered,
  holdMs = 1400,
}: {
  children: React.ReactNode;
  active?: boolean; // 由 Typed 注入，这里用不上，但必须接住
  onRendered?: RenderedCallback;
  holdMs?: number;
}) {
  const isStatic = useServerStatic();
  const ref = React.useRef<HTMLDivElement>(null);
  const cbRef = React.useRef<RenderedCallback | undefined>(undefined);
  React.useEffect(() => {
    cbRef.current = onRendered;
  });

  React.useEffect(() => {
    if (isStatic) return;
    ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    const t = window.setTimeout(
      () => cbRef.current?.(),
      prefersReducedMotion() ? 100 : holdMs,
    );
    return () => window.clearTimeout(t);
  }, [isStatic, holdMs]);

  return <div ref={ref} className="px-4 py-3 leading-relaxed">{children}</div>;
}

/* 绿色提示符箭头（tabler chevron-right，参考站同款） */
function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-3.5 shrink-0 text-[#7ee787]"
    >
      <path d="M9 6l6 6l-6 6" />
    </svg>
  );
}

/** 链接统一样式（参考站：sky-500 + underline） */
const linkC = "text-sky-500 underline underline-offset-2 hover:text-sky-300";
/** 行内 code 片段（参考站：灰底白字小圆角） */
const codeC = "mx-0.5 rounded bg-gray-700 px-1 text-white";
const strongC = "font-bold text-white";

/* ========================================================================== */

export function TerminalSession() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-[#282935] p-4 font-mono">
      <main className="resume-win flex max-h-[90svh] w-full max-w-prose flex-1 flex-col overflow-hidden rounded-2xl border border-gray-600 shadow-2xl shadow-black">
        {/* ---------- macOS 标题栏：三灯 + 用户名 + 快捷键 ---------- */}
        <header className="grid h-11 flex-none grid-cols-[1fr_2fr_1fr] items-center border-b border-gray-800 bg-zinc-700 px-4 text-xs font-semibold">
          <span className="flex gap-2">
            {/* 红灯 = 关闭 = 回工具箱。hover 时亮出 ✕（参考站同款交互） */}
            <Link aria-label="回到工具箱" href="/bento" className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-sky-400">
              <i className="group relative flex size-3 items-center justify-center rounded-full bg-red-500 text-zinc-900 before:absolute before:-inset-4 before:content-['']">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="invisible size-2.5 group-hover:visible"
                >
                  <path d="M18 6l-12 12" />
                  <path d="M6 6l12 12" />
                </svg>
              </i>
            </Link>
            <i aria-hidden="true" className="block size-3 cursor-not-allowed rounded-full bg-yellow-400" />
            <i aria-hidden="true" className="block size-3 cursor-not-allowed rounded-full bg-green-500" />
          </span>
          <span className="text-center text-gray-400">xiaopan@MacBook-Air:~</span>
          <span className="text-end text-gray-500">⌥⌘1</span>
        </header>

        {/* ---------- 终端正文（打字序列） ---------- */}
        <div className="min-h-60 flex-1 overflow-y-auto p-2 text-sm text-gray-200">
          <p className="mb-2">Last login: Thu Sep 24 21:30:00 on ttys001</p>

          <Typed>
            {/* whoami */}
            <TypedText command="whoami" />
            <TypedContent>
              <p>
                你好，我是 <strong className={strongC}>潘葛伦</strong>
                （大家都叫我小潘），一个住在
                <strong className={strongC}>广州</strong>的前端工程师。
              </p>
              <p className="mt-2">
                我喜欢把日常小工具做成萌萌的、会动的界面 —— 手头这个
                <code className={codeC}>苹果绿的工具箱</code>
                就是证据：登录页有一只可以撸的黑猫，工具箱格子里还住着另一只。
              </p>
            </TypedContent>

            {/* ls */}
            <TypedText command="ls" />
            <TypedContent>
              <div className="grid grid-cols-2 gap-2 px-4 font-semibold text-sky-500">
                <span>projects/</span>
                <span>experience/</span>
                <span>skills/</span>
                <span>contact/</span>
              </div>
            </TypedContent>

            {/* cat projects.txt */}
            <TypedText command="cat projects.txt" />
            <TypedContent>
              <p>工具箱里常驻的几个小零件：</p>
              <ul className="mt-3 space-y-0.5">
                <li className={`font-bold ${strongC}`}>▸ 时间戳转换</li>
                <li>和 Unix 时间戳讲和的小计算器</li>
              </ul>
              <ul className="mt-3 space-y-0.5">
                <li className={`font-bold ${strongC}`}>▸ JSON 格式化</li>
                <li>把压缩饼干摊开、摆整齐</li>
              </ul>
              <ul className="mt-3 space-y-0.5">
                <li className={`font-bold ${strongC}`}>▸ 颜色工具</li>
                <li>调出「苹果绿」的那把尺</li>
              </ul>
              <ul className="mt-3 space-y-0.5">
                <li className={`font-bold ${strongC}`}>▸ 文本对比</li>
                <li>一眼看出这两段话到底改了哪</li>
              </ul>
              <ul className="mt-3 space-y-0.5">
                <li className={`font-bold ${strongC}`}>▸ 正则测试</li>
                <li>和通配符斗智斗勇的练武场</li>
              </ul>
            </TypedContent>

            {/* cat experience.log */}
            <TypedText command="cat experience.log" />
            <TypedContent>
              <p>
                <span className="text-gray-400">2023 → now</span> ｜ 前端开发
              </p>
              <p className="mt-2">
                日常在
                <code className={codeC}>React</code>/
                <code className={codeC}>Next.js</code>
                里搬砖，偶尔钻进
                <code className={codeC}>CSS 动画</code>
                的兔子洞里不出来 —— 比如为了复刻一个掉落动画，
                把别人的代码翻了个底朝天。
              </p>
            </TypedContent>

            {/* ls skills/ */}
            <TypedText command="ls skills/" />
            <TypedContent>
              <div className="flex flex-wrap gap-2">
                {[
                  "JavaScript",
                  "TypeScript",
                  "React",
                  "Next.js",
                  "Tailwind CSS",
                  "CSS 动画",
                  "Node.js",
                  "Git",
                ].map((s) => (
                  <code key={s} className="rounded bg-gray-700 px-1.5 py-0.5 text-white">
                    {s}
                  </code>
                ))}
              </div>
            </TypedContent>

            {/* cat contact.vcf */}
            <TypedText command="cat contact.vcf" />
            <TypedContent>
              <div className="my-3 flex items-center">
                <p className="basis-1/4 text-center font-semibold text-white">Social</p>
                <div className="grid flex-1 grid-cols-2 justify-items-start gap-2">
                  <a
                    className={linkC}
                    href="https://github.com/GelunPan"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Github
                  </a>
                  <a className={linkC} href="https://gelun.eu.cc/" target="_blank" rel="noreferrer">
                    gelun.eu.cc
                  </a>
                </div>
              </div>
              <div className="flex items-center">
                <p className="basis-1/4 text-center font-semibold text-white">Email</p>
                <a className={linkC} href="mailto:pangelun@163.com">
                  pangelun@163.com
                </a>
              </div>
            </TypedContent>

            {/* exit */}
            <TypedText command="exit" />
            <TypedContent>
              <p>
                logout ——{" "}
                <Link className={linkC} href="/bento">
                  点这里回工具箱
                </Link>
                ，或者直接关掉这个标签页 🙂
              </p>
              <p className="mt-2">
                {/* 会话结束后的常驻光标。reduced-motion 下停成常亮 —— 纯装饰 */}
                <span aria-hidden="true" className="typed-cursor typed-cursor--blink text-[#7ee787]">
                  ▌
                </span>
              </p>
            </TypedContent>
          </Typed>
        </div>
      </main>
    </div>
  );
}
