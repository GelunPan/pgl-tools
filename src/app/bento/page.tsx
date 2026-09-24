"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { BentoCard, BentoGrid } from "@/components/bento/bento-card";
import { BentoCat } from "@/components/bento/cat";
import { DotGrid } from "@/components/bento/dot-grid";
import {
  ArrowUpRightIcon,
  BookIcon,
  GitForkIcon,
  GithubIcon,
  GlobeIcon,
  HashIcon,
  PinIcon,
  StarIcon,
  TagsIcon,
} from "@/components/bento/icons";
import { SkillPegboard } from "@/components/bento/pegboard";
import { SiteHeader } from "@/components/bento/site-header";
import { type BentoTabName } from "@/components/bento/tabs";
import { TerminalCard } from "@/components/bento/terminal";
import { ThemeToggle } from "@/components/bento/theme-toggle";
import { WaveCanvas } from "@/components/bento/wave-canvas";
import { useBentoTheme } from "@/hooks/use-bento-theme";
import { useConvergeIn } from "@/hooks/use-converge-in";

/* ============================================================================
   /bento —— 工具箱主页

   排布与每一张卡的内部结构**逐类照搬** zhangyu.dev（16 格，4 列 × 6 行 @xl）。
   断点跨度、hover 动效、过渡时长都是量出来的，不是目测的。

   ⚠️ 内容不是照抄的：参考站那份是博主本人的自我介绍、他的 GitHub 仓库和他写的
      文章。这里只搬**信息结构与版式**（几行字、几个字段、字段之间的比例），
      文字换成这个站自己的。要换成真内容时直接改下面几个常量数组即可。
   ============================================================================ */

/* ------------------------------------------------------------------
   数据常量

   🔴 全部写成模块级常量。不要在组件里用 Math.random() / Date.now() 生成
      任何会被渲染的值（比如便签倾角）：静态导出时服务端与客户端会算出不同结果，
      React 直接报 hydration 不一致。要「随机感」就预置一个常量数组。
   ------------------------------------------------------------------ */

/**
 * 便签倾角。量级参考参考站实测值（-1.18 / 0.39 / 2.48 / 0.76 / 4.81 度）——
 * 都是零点几到几度的微倾，绝不是「歪 5 度」那种夸张角度。
 */
const NOTE_TILT = ["-1.18deg", "0.39deg", "2.48deg", "0.76deg", "4.81deg", "-2.4deg"];

/** Pinned 便签（对应参考站的 GitHub 置顶仓库）：名称 / 说明 / 语言 / 语言色 / 两个计数 */
const PINNED = [
  {
    name: "时间戳转换",
    desc: "秒、毫秒、日期串互转，顺手标出时区。",
    lang: "TypeScript",
    color: "#3178c6",
    a: 134,
    b: 26,
  },
  {
    name: "JSON 格式化",
    desc: "压缩、美化、校验一把梭，大文件也不卡。",
    lang: "TypeScript",
    color: "#3178c6",
    a: 954,
    b: 115,
  },
  {
    name: "颜色工具",
    desc: "HEX / RGB / HSL 互转，自动配对比色。",
    lang: "CSS",
    color: "#244776",
    a: 11,
    b: 5,
  },
  {
    name: "文本对比",
    desc: "逐行 diff，增删改分色高亮。",
    lang: "TypeScript",
    color: "#3178c6",
    a: 4,
    b: 0,
  },
  {
    name: "正则测试",
    desc: "边写边匹配，命中部分实时高亮。",
    lang: "TypeScript",
    color: "#3178c6",
    a: 4,
    b: 0,
  },
  {
    name: "编码解码",
    desc: "Base64 / URL / HTML 实体互转。",
    lang: "TypeScript",
    color: "#3178c6",
    a: 2,
    b: 0,
  },
];

/**
 * 字体预览卡的字形序列（25 个格子，其中第 12 个是那个 T 开关，占 3×2）。
 * 顺序照搬参考站的 DOM，不是随便排的 —— 它是「Aa / a / A」的错落分布，
 * 配上 5×6 的网格才有那种字标本的感觉。
 */
const GLYPHS = [
  "Aa", "a", "A",
  "Aa", "a", "a", "Aa", "a", "A", "a", "Aa",
  "SWITCH",
  "Aa", "a", "A",
  "Aa", "a", "a", "Aa", "a", "A", "a", "Aa", "a", "A",
];

/**
 * 窄屏（<lg，3×4 网格）下**保留**的字形下标。
 *
 * 网格会随断点变：base 3×4 = 12 格，lg 起 5×6 = 30 格。
 * 25 个字形塞进 12 格会溢出，所以参考站给大部分字形挂了 `hidden lg:block`：
 * 小屏只留 6 个字形 + 那个跨 3×2（= 6 格）的开关，正好 6 + 6 = 12 格排满；
 * lg 以上 25 个全放出来，24 个单格 + 开关 6 格 = 30 格，也是正好排满。
 * 所以这组下标不是「随便选的」，是让两种网格都能整除的分法。
 */
const GLYPHS_ALWAYS_VISIBLE = new Set([0, 1, 2, 12, 13, 14]);

/** 标签芯片：文字 + 主色（芯片用 `主色33` 做底、主色做 2px 描边，参考站的做法） */
const TAGS: Array<[string, string]> = [
  ["前端", "#61dafb"],
  ["工具", "#f7df1e"],
  ["动效", "#ff9800"],
  ["TypeScript", "#3178c6"],
  ["Next.js", "#000000"],
  ["React", "#61dafb"],
  ["Tailwind", "#38bdf8"],
  ["静态站点", "#47c5fb"],
  ["暗色模式", "#666666"],
  ["Bento", "#ff9800"],
  ["设计系统", "#a78bfa"],
  ["GitHub Pages", "#c5def5"],
];

/** 五张条目卡（对应参考站的文章卡）：标题 / 主分类色 / 分类 / 摘要 */
const ENTRIES = [
  {
    title: "时间戳转换",
    color: "#f05237",
    tag: "开发工具",
    desc: "秒、毫秒、日期字符串互转，顺手把时区也标出来。",
  },
  {
    title: "JSON 格式化",
    color: "#c5def5",
    tag: "开发工具",
    desc: "压缩、美化、校验一把梭，大文件也不卡。",
  },
  {
    title: "颜色工具",
    color: "#61dafb",
    tag: "设计工具",
    desc: "HEX / RGB / HSL 互转，自动配一套对比色。",
  },
  {
    title: "文本对比",
    color: "#f7e018",
    tag: "效率工具",
    desc: "逐行 diff，增删改分色高亮，复制结果一步到位。",
  },
  {
    title: "正则测试",
    color: "#f05237",
    tag: "开发工具",
    desc: "边写边匹配，命中部分实时高亮，常用规则速查。",
  },
];

/* ------------------------------------------------------------------
   便签
   ------------------------------------------------------------------ */
function PinnedNote({
  item,
  index,
}: {
  item: (typeof PINNED)[number];
  index: number;
}) {
  return (
    <a
      href="#"
      // 便签的悬停效果是**双层联动**：
      //   ① 卡片自己的 before/after 两条 skew 阴影（纸张下方那抹投影）跟着放大
      //   ② 内部那块 bg-yellow-100 的「纸面」跟着放大
      // 两者都 scale-[1.03]，看起来就是整张便签轻轻翘起来。
      // ⚠️ 倾角必须写在 inline style 上：Tailwind 的 scale 类会被这个 transform 覆盖，
      //    所以不能靠 class 做倾斜。
      style={{ transform: `rotate(${NOTE_TILT[index % NOTE_TILT.length]})` }}
      className="group/note relative z-10 flex flex-col border-transparent p-4 text-xs transition-transform before:absolute before:inset-x-[3%] before:bottom-[15%] before:top-3/4 before:-z-20 before:skew-y-[5deg] before:shadow-[0_15px_10px_rgba(0,0,0,.6)] before:transition-transform before:duration-500 before:content-['_'] after:absolute after:inset-x-[3%] after:bottom-[15%] after:top-3/4 after:-z-20 after:-skew-y-[5deg] after:shadow-[0_15px_10px_rgba(0,0,0,.6)] after:transition-transform after:duration-500 after:content-['_'] hover:before:scale-[1.03] hover:after:scale-[1.03]"
    >
      {/* 纸面。最后一张多一个圆角（rounded-[0_0_90px_90px/0_0_20px_20px]）＝ 纸角被翻起来 */}
      <div
        className={
          "absolute inset-0 z-10 bg-yellow-100 shadow-[0_0_5px_rgba(0,0,0,.5)] transition-transform duration-500 group-hover/note:scale-[1.03] dark:bg-slate-800" +
          (index === PINNED.length - 1
            ? " rounded-[0_0_90px_90px/0_0_20px_20px]"
            : "")
        }
      />
      <p className="relative z-20 flex items-center gap-2">
        <BookIcon className="size-4 flex-none" />
        <span className="text-base font-semibold">{item.name}</span>
      </p>
      <p className="relative z-20 flex-1">{item.desc}</p>
      <div className="relative z-20 flex gap-5">
        <div className="flex items-center">
          <i
            className="box-content inline-block size-2.5 rounded-full border border-[rgb(255,255,255,0.2)]"
            style={{ background: item.color, color: item.color }}
          />
          <span className="ml-1.5">{item.lang}</span>
        </div>
        <div className="flex items-center">
          <StarIcon className="size-4" />
          <span className="ml-1">{item.a}</span>
        </div>
        <div className="flex items-center">
          <GitForkIcon className="size-4" />
          <span className="ml-1">{item.b}</span>
        </div>
      </div>
    </a>
  );
}

/* ------------------------------------------------------------------
   主页面
   ------------------------------------------------------------------ */
export default function BentoPage() {
  const { theme, toggle } = useBentoTheme();
  const { rootRef, phase } = useConvergeIn();
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [serifOn, setSerifOn] = React.useState(false);
  /** 顶部导航选中的分类。`all` = 不筛。见 components/bento/tabs.ts */
  const [tab, setTab] = React.useState<BentoTabName>("all");

  // 会话只在客户端读，首帧一律空串 —— 否则 SSR 拿到空、CSR 拿到名字，hydration 会炸
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("careercompass_session");
      if (raw) setName(JSON.parse(raw)?.name ?? "");
    } catch {
      /* ignore */
    }
  }, []);

  /**
   * 🔴 入场演出期间不接受切分类。
   *
   * 「汇聚入场」是靠 `[data-converge="flying"]` 这条 CSS 动画驱动 16 张卡的
   * transform 的，而分类重排的 FLIP 用的是同一条 transform —— 两者同时跑必然打架
   * （卡片会从屏幕外飞一半再被 FLIP 拽回来）。boot 到 settled 只有 ~2.9s，
   * 期间点导航本来也没意义，直接吞掉最省事。
   */
  const handleTabChange = React.useCallback(
    (next: BentoTabName) => {
      if (phase !== "settled") return;
      setTab(next);
    },
    [phase],
  );

  const handleLogout = React.useCallback(() => {
    try {
      localStorage.removeItem("careercompass_session");
    } catch {
      /* ignore */
    }
    router.push("/login");
  }, [router]);

  return (
    <div
      ref={rootRef}
      data-converge={phase}
      // ⚠️ 这里**故意不写 bg-***：页面底色要单独出一层（见下），
      //    否则它会盖住 -z-10 的点阵背景。
      className="relative h-screen w-full overflow-hidden font-body text-ink-1"
    >
      {/* 页面底色 #000212（暗）/ 白（亮）。单独出一层是为了让点阵背景能浮在它上面 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-30 bg-surface transition-colors duration-1000"
      />

      {/* 点阵背景：仅日间模式，见 dot-grid.tsx */}
      <DotGrid />

      {/* 全黑幕布：颜色与登录页 ColorVeil 的终色 (#000) 完全一致，
          所以从登录页跳过来的那一瞬看不出切换；进入后再 700ms 淡出，
          露出真正的页面底色 ——#000212（近黑的深蓝，不是纯黑）。 */}
      <div
        aria-hidden
        data-curtain
        className="pointer-events-none absolute inset-0 z-20 bg-black transition-opacity duration-700 ease-out"
        style={{ opacity: phase === "boot" ? 1 : 0 }}
      />

      {/* html/body 上有 overflow:hidden（登录页要求的），滚动必须由内层接管 */}
      <div className="relative z-10 flex h-full flex-col">
        <SiteHeader active={tab} onChange={handleTabChange} onLogout={handleLogout} />

        {/* min-h-0 不能省：flex 子项默认 min-height:auto，不加就撑不出滚动区 */}
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          {/* filterTab = 当前分类。网格内部会把它塞进 context，
              16 张卡各自拿它跟自己的 dataType 比一比，决定 order / 模糊 / 透明度。
              见 tabs.ts 与 bento-card.tsx */}
          <BentoGrid className="min-h-full" filterTab={tab}>
            {/* ================= ① 自我介绍（prose）2×1 =================
                参考站这格是 `prose` + `dark:prose-invert`（typography 插件），
                断点跨度：base 2×2 → md 4×1 → lg 2×1。 */}
            <BentoCard
              dataType="about"
              className="prose z-10 col-span-2 row-span-2 max-w-full bg-gradient-to-br from-white to-amber-50 dark:prose-invert prose-h1:mb-0 dark:from-surface-1 dark:to-white/5 sm:max-lg:prose-p:my-1.5 md:col-span-4 md:row-span-1 md:max-xl:prose-p:my-2 lg:col-span-2 lg:row-span-1"
            >
              <h1 className="relative flex items-start">
                {/* 「欢迎的巴掌」整体再放大一档（5xl→6xl / 6xl→7xl / 8xl→9xl）。
                    同时把 -mt 从 3rem 提到 4rem 抵消多出来的高度 —— 否则 h1 会把
                    底下三段正文往下顶，卡片要撑破。 */}
                <span className="animation-hello -mt-16 inline-block text-6xl sm:ml-12 md:text-7xl xl:text-9xl">
                  👋
                </span>

                {/* 气泡 ①：「对方正在输入…」三个跳动的小点，3 秒后淡出 */}
                <span
                  data-bubble="dots"
                  className="animation-fade-out absolute -top-5 inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-[1.33rem] bg-[#30db5b] px-4 text-xl before:absolute before:-left-0.5 before:bottom-0 before:size-4 before:rounded-full before:bg-inherit before:content-['_'] after:absolute after:-bottom-1.5 after:-left-2.5 after:size-2 after:rounded-full after:bg-inherit after:content-['_'] max-sm:scale-90 sm:left-32 md:left-[60%] md:scale-110 !animation-delay-[3s]"
                >
                  <i className="size-3 animate-pulse rounded-full bg-gray-50" />
                  <i className="size-3 animate-pulse rounded-full bg-gray-50 animation-delay-[0.666s]" />
                  <i className="size-3 animate-pulse rounded-full bg-gray-50 animation-delay-[1.332s]" />
                </span>

                {/* 气泡 ②：真正的问候语，3 秒后才淡入（与 ① 无缝接力） */}
                <span
                  data-bubble="hello"
                  className="animation-fade-in absolute -top-5 inline-flex h-11 items-center whitespace-nowrap rounded-[1.33rem] bg-[#30db5b] px-6 text-xl font-normal text-white opacity-0 before:absolute before:-bottom-px before:-left-2 before:block before:size-6 before:rounded-br-3xl before:bg-[#30db5b] before:content-['_'] after:absolute after:-bottom-px after:-left-3 after:h-6 after:w-3 after:rounded-br-2xl after:bg-white after:content-['_'] max-sm:scale-90 sm:left-32 md:left-[60%] md:scale-110 dark:after:bg-surface-1 !animation-delay-[3s]"
                >
                  你好，我是小潘
                </span>
              </h1>

              <p>
                这里放我的
                <code>工具箱</code>
                ，把零散的小工具收在一屏里，都在
                <a href="https://gelun.eu.cc/">gelun.eu.cc</a>
                。
              </p>
              <p>
                整站以夜间为底：默认近黑，点一下月亮，所有模块会一起
                <code>翻成白天</code>
                。
              </p>
              <p>网格、卡片、明暗切换都已就位，每个格子里填什么，后面再逐个长出来。</p>
            </BentoCard>

            {/* ================= ② 猫咪 1×1（彩蛋） =================
                参考站这格是博主的 3D 形象。这里换成一只**可以撸的猫**：
                视线跟着鼠标跑、点一下眯眼笑并冒出「喵～」，连点 7 次触发彩蛋。
                实现全在 components/bento/cat.tsx（那儿写了四条硬约束）。
                背景是**奶油米色**（照小潘给的黑猫参考图取的色）—— 注意这里**没有**
                `dark:` 分支：黑猫在深色底上会糊，两套主题都得是这层米色。
                猫才是主角，所以卡上只留一层会呼吸的暖光（`.cat-glow`）。 */}
            <BentoCard
              dataType="about"
              className="overflow-clip bg-gradient-to-b from-[#F8F4EB] to-[#E9E1D2] p-0"
            >
              <BentoCat />
            </BentoCard>

            {/* ================= ③ SKILLS 挂钩板 1×2 =================
                跨度：base row-span-4 → sm row-span-2。`!p-0` 必须有，
                否则 base 的 `p-2.5` 会把挂钩板挤进去一圈（挂板要贴边）。 */}
            <BentoCard
              dataType="about"
              className="z-20 row-span-4 max-sm:col-span-2 bg-surface !p-0 sm:row-span-2"
              aria-label="技能挂钩板"
            >
              {/* 右上角那条红丝带：不是简单的斜标签 —— before/after 各画半个
                  40px 的三角（红底 + brightness-75 的暗面），拼出丝带被折回来的立体感。 */}
              <div className="absolute right-0 top-0 w-20 -translate-y-1/2 translate-x-1/4 rotate-12 scale-75 rounded-lg p-1 shadow-lg before:absolute before:inset-x-0 before:bottom-0 before:z-20 before:origin-bottom before:scale-y-50 before:rounded-lg before:border-[40px] before:border-transparent before:border-b-red-500 before:border-l-red-500 before:content-['_'] after:absolute after:inset-x-0 after:bottom-0 after:z-10 after:origin-bottom after:scale-y-50 after:rounded-lg after:border-[40px] after:border-transparent after:border-b-red-500 after:border-r-red-500 after:brightness-75 after:content-['_'] dark:before:border-b-blue-950 dark:before:border-l-blue-950 dark:after:border-b-blue-950 dark:after:border-r-blue-950 xl:scale-100">
                <span className="block h-10 -translate-y-4 rounded bg-amber-50 px-2 py-1 uppercase text-slate-800 shadow dark:bg-gray-200">
                  Skills
                </span>
              </div>

              <SkillPegboard />
            </BentoCard>

            {/* ================= ④ Pinned（便签）2×2 =================
                bg-paper / dark:bg-paper-dark 是 globals.css 里的原版底纹：
                左侧一条竖向「书脊线」+ 每 32px 一条横向蓝线，看起来就是一张方格纸。
                字体走 font-handwriting（Handlee）。 */}
            <BentoCard
              dataType="toolbox"
              className="z-10 col-span-2 row-span-5 flex flex-col border-none bg-paper !p-0 font-handwriting shadow-md dark:bg-paper-dark sm:col-span-3 sm:row-span-4 md:row-span-2 xl:col-span-2"
            >
              <h2 className="flex items-center gap-2 pl-[10%] pt-4 text-2xl font-bold text-brand xl:pt-6">
                <PinIcon className="size-6" />
                Pinned
              </h2>
              <div className="grid flex-1 grid-cols-1 justify-center gap-3 px-4 py-2 text-ink-1 sm:grid-cols-2 sm:grid-rows-3 lg:gap-5 xl:p-6 xl:pl-[10%]">
                {PINNED.map((item, i) => (
                  <PinnedNote key={item.name} item={item} index={i} />
                ))}
              </div>
            </BentoCard>

            {/* ================= ⑤ 字标 1×1 =================
                内部是一个 3×4（lg 起 5×6）的网格，塞着 25 个「Aa / a / A」，
                其中一格是一个跨 3×2 的 T 开关（左 T 用无衬线、右 T 用衬线）。
                悬停整张卡 → 所有字形一起 `rotate-360`（700ms），像字被甩了一圈。 */}
            <BentoCard
              dataType="about"
              className="group grid grid-cols-3 grid-rows-4 items-center justify-items-center bg-surface-1 text-lg font-semibold text-ink-1 lg:grid-cols-5 lg:grid-rows-6"
            >
              {GLYPHS.map((g, i) =>
                g === "SWITCH" ? (
                  <div
                    key="switch"
                    aria-label="Font Toggle Label"
                    className="col-span-3 row-span-2 flex items-center gap-2 p-4 text-3xl"
                  >
                    <span className={serifOn ? "font-serif" : "font-sans"}>T</span>
                    {/* 开关本体。滑块用 `before` 画，选中态靠 before 右移 ——
                        参考站的 `before:translate-x-0.5` 是关，开就是移到另一头。 */}
                    <label
                      className={`relative h-6 w-12 cursor-pointer rounded-lg border shadow-inner duration-500 before:absolute before:inset-y-0.5 before:left-0 before:w-4 before:rounded-md before:bg-surface before:shadow before:transition-transform before:duration-500 before:content-['_'] dark:border-gray-500 dark:before:bg-surface-4 ${
                        serifOn ? "before:translate-x-[1.75rem]" : "before:translate-x-0.5"
                      }`}
                    >
                      {/* 真 input 铺满整个开关：接管点击、键盘和 focus 环 */}
                      <input
                        type="checkbox"
                        aria-label="Font Toggle Switch"
                        checked={serifOn}
                        onChange={(e) => setSerifOn(e.target.checked)}
                        className="absolute inset-0 size-full cursor-pointer opacity-0"
                      />
                    </label>
                    <span className={serifOn ? "font-sans" : "font-serif"}>T</span>
                  </div>
                ) : (
                  <span
                    key={i}
                    className={`origin-bottom-right text-sm transition-transform duration-700 group-hover:rotate-[360deg] xl:text-base ${
                      GLYPHS_ALWAYS_VISIBLE.has(i) ? "" : "hidden lg:block"
                    }`}
                  >
                    {g}
                  </span>
                ),
              )}
            </BentoCard>

            {/* ================= ⑥ 终端 1×1 =================
                底色 #282935 是参考站写死的（不是主题色），暗色下换成 surface-1。
                悬停整卡 hover:scale-105。 */}
            <BentoCard
              dataType="about"
              className="overflow-clip bg-[#282935] !p-0 outline-offset-4 transition-transform duration-700 hover:scale-105 active:scale-[0.98] dark:bg-surface-1"
            >
              <span className="absolute inset-x-0 top-0 flex gap-2 bg-slate-700 px-6 py-3 dark:bg-surface-2">
                <i className="block size-3 rounded-full bg-red-500" />
                <i className="block size-3 rounded-full bg-yellow-400" />
                <i className="block size-3 rounded-full bg-green-500" />
              </span>
              <TerminalCard />
            </BentoCard>

            {/* ================= ⑦ 主题切换 1×1 =================
                `bare` + `bg-surface dark:bg-transparent`：月牙是用「与底色同色的圆」
                从太阳右上角咬出来的，所以卡片底色必须和页面底色一致。 */}
            <BentoCard
              bare
              dataType="about"
              className="group overflow-hidden bg-surface transition-transform duration-700 hover:scale-105 dark:bg-transparent"
            >
              <ThemeToggle theme={theme} onToggle={toggle} />
            </BentoCard>

            {/* ================= ⑧ 标签 4×1 =================
                芯片是「主色 20% 透明做底 + 2px 主色描边」（`#RRGGBB33` 这种写法），
                颜色直接写在 inline style 上 —— 每个标签一个色，不可能全塞进 Tailwind。 */}
            <BentoCard
              dataType="tags"
              className="col-span-2 flex flex-col overflow-clip bg-gradient-to-l from-amber-50 to-surface dark:from-surface-1 max-lg:row-span-2 sm:col-span-3 md:col-span-2 lg:col-span-4"
            >
              <h2 className="mb-4 flex items-center gap-4 text-2xl text-brand">
                <TagsIcon />
                Tags
              </h2>
              <ul className="flex flex-1 flex-wrap items-center gap-1 md:gap-2 lg:gap-4 lg:p-4">
                {TAGS.map(([label, color]) => (
                  <li key={label}>
                    <a
                      href="#"
                      className="flex items-center rounded-2xl px-1 py-0.5 text-sm shadow-sm md:gap-1 md:px-2 md:py-1 lg:text-base"
                      style={{ backgroundColor: `${color}33`, border: `2px solid ${color}` }}
                    >
                      <HashIcon className="size-4" />
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </BentoCard>

            {/* ================= ⑨～⑬ 条目卡 1×1 ×5 =================
                内部用 `grid-rows-subgrid` 跨 4 行，让 5 张卡的标题/标签/摘要/按钮
                **横向对齐**（标题长短不一时尤其明显）。
                底部那颗「Read more」默认 opacity-0 + translate-y-2，
                悬停整卡才滑上来 —— 这是参考站最容易被忽略的动效之一。 */}
            {ENTRIES.map((entry) => (
              <BentoCard
                key={entry.title}
                dataType="toolbox"
                className="group grid grid-rows-[1fr_min-content_2fr] bg-gradient-to-b from-surface-1 to-white dark:bg-[linear-gradient(rgba(255,255,255,0.05)_0%,rgba(255,255,255,0)_100%)] max-lg:p-2 max-md:row-span-2 max-sm:col-span-2 max-sm:row-span-1 xl:grid-rows-[1fr_min-content_2fr_auto]"
              >
                <div className="row-span-4 grid grid-rows-subgrid gap-1 xl:gap-2">
                  <a
                    href="#"
                    className="relative flex items-center text-balance text-sm font-bold lg:text-base xl:text-xl"
                  >
                    <h2>
                      {entry.title}
                      {/* 标题底下那一道 1/3 宽的小色条，颜色跟着主分类走 */}
                      <i
                        className="absolute -bottom-1 left-1 block h-1 w-1/3 opacity-80"
                        style={{ background: entry.color }}
                      />
                    </h2>
                  </a>
                  <p className="mt-1 truncate text-ink-2">
                    <a
                      href="#"
                      className="relative inline-flex items-center px-1 text-xs underline-offset-1 before:absolute before:-inset-x-0 before:-inset-y-4 before:content-['_'] after:content-[',_'] first:pl-0 last:after:content-none hover:underline"
                    >
                      <HashIcon className="size-2.5" />
                      {entry.tag}
                    </a>
                  </p>
                  <p className="text-xs text-ink-4 xl:text-sm">{entry.desc}</p>
                  <p className="flex justify-end max-xl:hidden">
                    <a
                      href="#"
                      className="translate-y-2 items-center rounded-full border border-hairline bg-surface px-2.5 py-1.5 font-semibold opacity-0 outline-offset-4 ring-surface-3 transition-all duration-700 ease-out hover:scale-105 hover:border-transparent hover:ring-4 group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100"
                    >
                      打开工具
                    </a>
                  </p>
                </div>
              </BentoCard>
            ))}

            {/* ================= ⑭ 波浪 canvas 1×1 =================
                canvas 画一道缓慢起伏的沙丘，文字用 mix-blend-difference 反色 ——
                沙丘扫过时字会被吃掉一半再吐出来。见 wave-canvas.tsx。 */}
            <BentoCard
              dataType="toolbox"
              className="flex items-stretch justify-stretch overflow-clip bg-surface outline-offset-4 max-md:col-span-2"
            >
              <WaveCanvas />
            </BentoCard>

            {/* ================= ⑮ GitHub 1×1 ================= */}
            <BentoCard
              dataType="projects"
              className="group flex items-center justify-center bg-gradient-to-b from-surface-1 to-white dark:to-white/5"
            >
              <GithubIcon className="size-24 xl:size-32" />
              <a
                href="https://github.com/gelunpan"
                target="_blank"
                rel="noreferrer"
                className="absolute bottom-3 left-3 flex translate-y-2 items-center rounded-full bg-surface px-2 py-1 text-ink-1 opacity-0 shadow outline-offset-4 transition-all duration-700 ease-out group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100 xl:bottom-6 xl:left-6 xl:px-3 xl:py-2 dark:bg-surface-3"
              >
                <span className="mr-1 text-xs">GitHub</span>
                <ArrowUpRightIcon className="size-4" />
              </a>
            </BentoCard>

            {/* ================= ⑯ 在线站点 1×1 =================
                底色是参考站的「掘金卡」配色（浅蓝→白，暗色降饱和），这格换成我们自己的站。 */}
            <BentoCard
              dataType="projects"
              className="group flex items-center justify-center bg-gradient-to-b from-blue-200 to-white text-black dark:from-blue-300/80 dark:to-white/70"
            >
              <GlobeIcon className="size-24 xl:size-32" />
              <a
                href="https://gelun.eu.cc/"
                target="_blank"
                rel="noreferrer"
                className="absolute bottom-3 left-3 flex translate-y-2 items-center rounded-full bg-surface px-2 py-1 text-ink-1 opacity-0 shadow outline-offset-4 transition-all duration-700 ease-out group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100 xl:bottom-6 xl:left-6 xl:px-3 xl:py-2"
              >
                <span className="mr-1 text-xs">在线站点</span>
                <ArrowUpRightIcon className="size-4" />
              </a>
            </BentoCard>
          </BentoGrid>
        </div>
      </div>
    </div>
  );
}
