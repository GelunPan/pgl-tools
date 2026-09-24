import type { Metadata } from "next";
import Link from "next/link";

/**
 * /resume —— 点终端卡进来的「简历终端」。
 *
 * 参考站（zhangyu.dev/resume）的整页就是**一段假终端会话**：whoami → ls →
 * 一节节 cat 出来。这里照这个形式重做，内容换成工具箱自己的（小潘说内容可以适当发挥）。
 *
 * 🔴 这是**服务端组件**，整页纯静态输出 —— 没有 hydration 风险，也不需要。
 *    唯一的「动」是光标闪烁（globals.css 的 `.typed-cursor--blink`，50% 硬切），
 *    reduced-motion 下会停 —— 它只是装饰，页面主体不依赖任何动画才可见。
 *
 * 🔴 主题：终端**永远深色**（终端就该是深色的，跟日夜主题无关），
 *    所以这里不接 use-bento-theme，直接写死一套 GitHub-Dark 配色。
 */

export const metadata: Metadata = {
  title: "小潘的简历 · 终端版",
  description: "xiaopan@toolbox:~ 的一段终端会话",
};

/** 终端配色（GitHub Dark，写死不跟主题走） */
const C = {
  fg: "text-[#c9d1d9]",
  dim: "text-[#8b949e]",
  green: "text-[#7ee787]",
  blue: "text-[#79c0ff]",
  yellow: "text-[#f2cc60]",
  purple: "text-[#d2a8ff]",
  red: "text-[#ff7b72]",
};

/** 提示符：xiaopan@toolbox:~$ */
function Prompt({ cmd }: { cmd: string }) {
  return (
    <p className="mt-7 first:mt-0">
      <span className={C.green}>xiaopan@toolbox</span>
      <span className={C.dim}>:</span>
      <span className={C.blue}>~</span>
      <span className={C.dim}>$ </span>
      <span className={C.fg}>{cmd}</span>
    </p>
  );
}

/** 一节输出的标题行，如 ─── projects ─── */
function Section({ name }: { name: string }) {
  return (
    <p className={`mt-2 ${C.yellow}`}>
      ──── {name} ────
    </p>
  );
}

export default function ResumePage() {
  return (
    <div className="min-h-screen bg-[#0d1117] font-mono text-sm leading-relaxed sm:text-base">
      {/* ---------- 窗口标题栏 ---------- */}
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-white/10 bg-[#161b22]/95 px-4 py-2.5 backdrop-blur">
        <span className="size-3 rounded-full bg-[#ff5f56]" />
        <span className="size-3 rounded-full bg-[#ffbd2e]" />
        <span className="size-3 rounded-full bg-[#27c93f]" />
        <span className={`ml-3 text-xs sm:text-sm ${C.dim}`}>
          xiaopan@toolbox: ~ — zsh
        </span>
        <Link
          href="/bento"
          className={`ml-auto rounded-md border border-white/15 px-2.5 py-1 text-xs transition-colors hover:bg-white/10 sm:text-sm ${C.fg}`}
        >
          ← 回工具箱
        </Link>
      </div>

      {/* ---------- 终端正文 ---------- */}
      <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <p className={C.dim}>Last login: Thu Sep 24 18:00:00 on ttys001</p>

        {/* ============ whoami ============ */}
        <Prompt cmd="whoami" />
        <p className={`mt-3 ${C.fg}`}>
          你好，我是 <span className={`font-bold ${C.green}`}>潘葛伦</span>
          （大家都叫我小潘），一名住在
          <span className={C.blue}>广州</span>的前端工程师。
        </p>
        <p className={`mt-2 ${C.fg}`}>
          我喜欢把日常小工具做成
          <span className={C.yellow}>萌萌的、会动的界面</span>
          —— 手头这个
          <span className={C.purple}>「苹果绿的工具箱」</span>
          就是证据：登录页有一只可以撸的黑猫，工具箱格子里还住着另一只。
        </p>

        {/* ============ ls ============ */}
        <Prompt cmd="ls" />
        <p className={`mt-3 ${C.blue}`}>
          projects/ experience/ skills/ contact/
        </p>

        {/* ============ projects ============ */}
        <Prompt cmd="cat projects.txt" />
        <Section name="projects" />
        <p className={`mt-2 ${C.fg}`}>工具箱里常驻的几个小零件：</p>
        <ul className={`mt-2 space-y-1 ${C.fg}`}>
          <li>
            <span className={C.green}>▸</span> 时间戳转换 —— 和 Unix 时间戳讲和
          </li>
          <li>
            <span className={C.green}>▸</span> JSON 格式化 —— 把压缩饼干摊开
          </li>
          <li>
            <span className={C.green}>▸</span> 颜色工具 —— 调出「苹果绿」的那把尺
          </li>
          <li>
            <span className={C.green}>▸</span> 文本对比 —— 一眼看出改了哪几行
          </li>
          <li>
            <span className={C.green}>▸</span> 正则测试 —— 和通配符斗智斗勇
          </li>
        </ul>

        {/* ============ experience ============ */}
        <Prompt cmd="cat experience.log" />
        <Section name="experience" />
        <p className={`mt-2 ${C.fg}`}>
          <span className={C.dim}>2023 → now</span> ｜ 前端开发
        </p>
        <p className={`mt-1 ${C.fg}`}>
          日常在
          <span className={C.blue}> React / Next.js </span>
          里搬砖，偶尔钻进
          <span className={C.yellow}> CSS 动画</span>
          的兔子洞里不出来 ——
          比如为了复刻一个掉落动画，把别人的代码翻了个底朝天。
        </p>

        {/* ============ skills ============ */}
        <Prompt cmd="ls skills/" />
        <Section name="skills" />
        <div className={`mt-2 flex flex-wrap gap-x-5 gap-y-1.5 ${C.fg}`}>
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
            <span key={s}>
              <span className={C.green}>✦ </span>
              {s}
            </span>
          ))}
        </div>

        {/* ============ contact ============ */}
        <Prompt cmd="cat contact.vcf" />
        <Section name="contact" />
        <ul className={`mt-2 space-y-1.5 ${C.fg}`}>
          <li>
            <span className={C.dim}>GitHub </span>
            <a
              className={C.blue + " underline decoration-dotted underline-offset-4 hover:text-[#a5d6ff]"}
              href="https://github.com/GelunPan"
              target="_blank"
              rel="noreferrer"
            >
              github.com/GelunPan
            </a>
          </li>
          <li>
            <span className={C.dim}>站点 </span>
            <span className={C.blue}>gelun.eu.cc</span>
            <span className={C.dim}>（你正在这儿）</span>
          </li>
          <li>
            <span className={C.dim}>邮箱 </span>
            <span className={C.blue}>pangelun@163.com</span>
          </li>
        </ul>

        {/* ============ exit ============ */}
        <Prompt cmd="exit" />
        <p className={`mt-3 ${C.dim}`}>
          logout ——{" "}
          <Link
            href="/bento"
            className={C.green + " underline decoration-dotted underline-offset-4 hover:text-[#b3f0b8]"}
          >
            点这里回工具箱
          </Link>
          ，或者直接关掉这个标签页 🙂
        </p>
        <p className={`mt-1 ${C.fg}`}>
          {/* 光标闪烁复用 globals.css 的 typed-cursor--blink（50% 硬切，真终端的样子）。
              reduced-motion 下它会停成常亮 —— 纯装饰，页面主体不依赖它。 */}
          <span className={`typed-cursor typed-cursor--blink ${C.green}`}>▌</span>
        </p>
      </main>
    </div>
  );
}
