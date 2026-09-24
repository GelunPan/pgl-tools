# 苹果绿的工具箱 · pgl-tools

> 浏览器标签显示「苹果绿的工具箱」，页面左上角标识为 `pgl-tools`。

一个**纯前端**的登录注册演示站点：注册信息保存在浏览器 `localStorage`，登录成功后跳转到欢迎页。不依赖任何后端服务、数据库或第三方 API，构建产物是纯静态文件，可直接部署到 **GitHub Pages**。

> 📄 **接手本项目请先读 [`PROJECT.md`](./PROJECT.md)** —— 那是一份自包含的完整技术说明书，
> 覆盖架构原理、数据模型、构建部署机制、硬约束清单与改动手册。README 只保留日常操作部分。

---

## 功能范围

| 页面 | 路径 | 说明 |
| --- | --- | --- |
| 首页 | `/` | 自动跳转到登录页 |
| 登录 | `/login` | 邮箱 + 密码登录，读取 `localStorage` 中已注册用户；成功后走过渡动效进入工具箱主页。**邮箱框上还趴了一只猫**：点它会眯眼笑，**连点 5 下直接跳过登录进 `/bento`**（彩蛋，见下） |
| 注册 | `/signup` | 选择身份（新手 / 高手）、姓名、邮箱、密码，写入 `localStorage`；成功后跳转登录页 |
| **工具箱主页** | **`/bento`** | **登录后的落点**。近黑底 Bento 网格（4 列 × 6 行 = 16 个模块），**排布与参考站 `zhangyu.dev` 逐格相同**；进页面时所有模块**从屏幕四周汇聚飞入**；点日月模块，整站一起翻成白色（1000ms 过渡）。**角落里还养了一只会跟着鼠标看的猫**（彩蛋，见下） |
| 欢迎（旧） | `/welcome` | 早期的测试页，展示会话信息。已不再是登录落点，保留着 |
| 404 | 任意未知路径 | GitHub Pages 会自动使用构建出的 `404.html` |

### 保留的交互与动画

以下都是原项目组件，**完整保留**：

- `AnimatedCharacters` —— 左侧四个卡通角色：眼球跟随鼠标、随机眨眼、输入时互相对视、密码可见时「偷看」
- `InteractiveHoverButton` —— 登录 / 注册按钮的悬停位移 + 主色填充动画
- `ColorVeil` —— **登录成功过渡（第一段）**：点击登录后，主题蓝从「登录」按钮的位置圆形扩散、
  撑满整个屏幕；扩散到一半时那层蓝**开始悄悄变暗**，扩散结束后 1s 内变成**纯黑**，
  全黑之后才切换页面。
  所以整段过程既看不到页面切换、也感觉不到颜色是什么时候变的 ——
  只有「一层蓝盖过来，安静地暗下去」。
  （实现细节与逐帧实测数据见 `PROJECT.md` 的 4.6 节）
- **汇聚入场**（`/bento`，过渡的第二段）—— 落到工具箱主页时，屏幕先是同色纯黑，
  然后黑幕淡出，**16 个模块各自从屏幕外、沿自己相对屏幕中心的方向飞回网格位**，
  按离屏幕中心的距离错峰，近的先落位、外围最后合拢。全程约 1.6s。
  （见 `PROJECT.md` 的 4.7.8 节）
- **Bento 设计系统 + 全套模块动效**（`/bento`）—— 版式、跨度、设计 token、卡片外壳、
  六个 `@keyframes`、动画时序、字体、页头结构**全部对照 `zhangyu.dev` 的真实 DOM 复刻**
  （方法与扒取产物见 `PROJECT.md` 的 4.7.15）。其中比较有意思的几个：

  | 模块 | 动效 |
  | --- | --- |
  | **黑猫**（第 2 格） | **一只可以撸的黑猫**（本项目自己加的彩蛋，参考站没有）：照小潘给的写实风黑猫参考图做的 —— **暖调炭黑毛 `#302D26` + 黄绿眼 `#C6D74F`**、短圆耳、深色鼻嘴胡须（**没有**项圈/铃铛/腮红/白肚子），背景是参考图那种**奶油米色**。眼睛**跟着鼠标转**，鼠标在页面任何位置都盯得住；点一下 → 眯眼笑 + 冒气泡（文案按次数轮换）；**1.6 秒内连点 7 下** → 爱心/星星/爪印**分两轮齐飞** + 转圈跳 + 吐舌头 + 「喵喵喵！被你发现了 🎉」。尾巴、头顶呆毛、一层暖光一直在动。**彩蛋有 0.5s 保护期**：手快补点不会把它点没 |
  | 页头胶囊导航 | 白块**滑动**指示器（700ms 缓动）+ **分类切换**：点「工具箱 / 标签 / 项目 / 关于」→ 命中的卡片**滑到最前排**（`order` 重排 + FLIP 补间，照参考站逐字节复刻），其余卡片模糊弱化；点「全部」恢复 |
  | SKILLS 挂钩板 | **真的 2D 刚体模拟**：16 个技术徽章从卡片上方逐个掉落、被 13 个挂钩弹开、堆在底部（可点左上角按钮重来） |
  | 终端 | 打字机循环（`vim` → `cat resume` → `ls tools`），停手时光标硬切闪烁；**点一下真的执行** —— 回车 → 逐行吐输出 + 绿光扫屏，再停 1.5s 收走 |
  | 问候气泡 | 「对方正在输入…」三个跳动的点，3s 后接力换成「你好，我是小潘」 |
  | 字体矩阵 | 悬停整卡 → 所有字形一起转 360° |
  | Pinned 便签 | 悬停 → 纸面 + 两层投影一起放大 1.03 倍，像翘起一角 |
  | Tags / 条目卡 / GitHub 卡 | 悬停浮出按钮、整卡微放大 |
  | Explore More | 沙丘 canvas 缓慢起伏，文字用反色混合，沙丘扫过时字被「吃掉一半再吐出来」 |
  | 点阵背景 | 仅日间显示，四周用遮罩晕开 |

  另：`prefers-reduced-motion` 下有**整条降级路径**（不做飞入、不做物理模拟、动画全静态），
  不是简单地把动画关掉就完事 —— 细节见 `PROJECT.md` 4.7.8 末尾。
- **两只可以撸的黑猫**（本项目自己加的彩蛋，参考站没有）—— 都是手写 SVG，不是图片也不是 emoji，
  所以眼睛和尾巴能各自单独动。撸猫的状态机（连点计数 / 表情时长 / 气泡轮换 / **彩蛋保护期**）
  两只共用一份：`src/hooks/use-pet.ts`。

  | | ① 工具箱格那只 | ② 登录页那只 |
  | --- | --- | --- |
  | 位置 | `/bento` 网格**第 2 格**（源码里的第 2 张卡，原「头像」格） | **`/login` 邮箱输入框的顶沿上** |
  | 姿势 | **趴卧**（身体贴地、四爪朝前、抬头看人） | **坐着**（照参考图那副坐相，尾巴搭在框边） |
  | 配色 | **黑猫**：暖调炭黑 `#302D26` + **黄绿眼** `#C6D74F` | 同一套色板 + `.cat-halo` 柔光底 |
  | 眼睛 | 跟着鼠标转（全页面范围） | 同样跟着鼠标转 |
  | 点一下 | 眯眼笑 + 冒气泡 | 眯眼笑 + 冒气泡 |
  | **彩蛋** | **连点 7 下** → 爱心/星星/爪印两轮齐飞 + 转圈跳 + 吐舌头 | **连点 5 下** → **跳过登录直接进 `/bento`** |

  ② 号那只**只压住输入框顶沿 6px**，占位文字照常看得见、框子照常点得着
  （验收脚本会真的去点框子正中，断言焦点落在 `#email` 上）；
  旁边那句「🐾 这么可爱的小猫，谁能忍住不撸一下？」就是它的暗示。
  ⚠️ 黑猫 + 两个深色底＝要额外兜对比度：眯眼笑用**黄绿**笔画、第 2 格卡片底色改成
  **奶油米色**（刻意不留 `dark:` 分支）、登录页那只垫一层 `.cat-halo` 柔光，
  另外 `.cat-svg` 必须有 `position: relative; z-index: 1`（否则柔光会盖在猫脸上）。
  四处都不能回退（见 `PROJECT.md` 4.7.16 与硬约束第 53 条）。

- 密码显示 / 隐藏切换、表单实时校验（Zod + React Hook Form）
- 加载态（"正在登录…"）、Toast 提示、**全站默认夜间主题**（可切换）
- 响应式布局：小屏隐藏角色插画，仅保留表单

### 数据存储

| key | 内容 |
| --- | --- |
| `careercompass_users` | 已注册用户数组 `{ email, password, name, role, createdAt }` |
| `careercompass_session` | 当前登录会话 `{ email, name, role, loginAt }` |

> ⚠️ 这是**纯前端演示**，密码以明文存在 localStorage，仅用于界面演示，**不可用于真实业务**。

> 注：`localStorage` 的 key 仍沿用旧前缀 `careercompass_`（**有意保留**）—— 这样改名之前已经注册过的账号不会被清空，仍可正常登录。

---

## 本地开发

```bash
npm install
npm run dev      # http://localhost:9002
```

其它命令：

| 命令 | 说明 |
| --- | --- |
| `npm run dev:fresh` | **dev 页面报错 / 白屏时先试这个**：清掉 `.next` 缓存再启动 |
| `npm run clean` | 只清 `.next` 构建缓存（可随时再生成，不丢代码） |
| `npm run build` | 生成静态站点到 `out/` |
| `npm run lint` | ESLint 检查 |
| `npm run typecheck` | TypeScript 类型检查 |

> 🔴 **同一个项目同时只能开一个 dev server**。两个一起开会把共用的 `.next` 写坏，
> 页面变成 `Cannot find module './chunks/ssr/[turbopack]_runtime.js'` —— 就是缓存被覆盖了，
> 不是什么代码问题，`npm run dev:fresh` 即可恢复（详见 `PROJECT.md` 8.6）。
> 尤其别用 `npx next dev -p <别的端口>` 去配原来的 `--turbopack`，两套产物格式不同，必坏。

### 页面黑屏 / 空白时怎么排查

按症状对号入座：

| 症状 | 原因 | 怎么办 |
| --- | --- | --- |
| 满屏红字 `Cannot find module ...` | 两个 dev server 抢坏了 `.next` | `npm run dev:fresh`（见上面） |
| **一直黑屏、什么都不出**，但 `curl` 能秒回 HTML | 外部资源**渲染阻塞**（曾经是 Google Fonts） | 2026-09-24 已把字体改成自托管，正常不会再发生。若又出现，按 F12 → Network 找卡在 pending 的**外部样式表**（详见 `PROJECT.md` 8.7） |
| `/bento` 纯黑一片 | 首帧黑幕没退（JS 没跑起来） | 8 秒后会自动脱黑（`PROJECT.md` 8.8）；若 8 秒还没出，看 Console 报什么错 |

> ⚠️ 排查时记住一句话：**服务端返回 200 ≠ 浏览器画得出来**。
> 判断有没有真的画出来，看 `performance.getEntriesByType("paint")` 有没有记录。

本地预览静态产物：

```bash
npx serve out
```

---

## 部署到 GitHub Pages

### 线上地址（已部署 ✅）

| 项 | 值 |
| --- | --- |
| 仓库 | https://github.com/GelunPan/pgl-tools |
| 站点 | **https://gelun.eu.cc/** （自定义域名 + Cloudflare 代理） |
| 旧地址 | https://gelunpan.github.io/pgl-tools/ → 301 自动跳到上面的域名 |
| 部署流水线 | https://github.com/GelunPan/pgl-tools/actions |

推送 `main` 分支后，`.github/workflows/deploy.yml` 会自动构建并发布，无需任何手动操作。

工作流会**自动判断站点挂在哪种路径下**并注入正确的 `basePath`：

| 情况 | basePath |
| --- | --- |
| 仓库已绑定自定义域名（当前状态） | 留空（站点在域名根） |
| 仓库名叫 `<用户名>.github.io` | 留空 |
| 普通项目站点、未绑域名 | `/<仓库名>` |

> 🔴 绑定自定义域名后，站点会从 `/<仓库名>/` 子路径**搬到域名根路径**。
> 如果 `basePath` 没跟着留空，HTML 里的 `/pgl-tools/_next/...` 会全部 404 → **页面白屏**。
> 详见 [`PROJECT.md`](./PROJECT.md) 的 §5.2.1。

---

## 日常更新（改完怎么发上去）

**一条命令搞定**：改完代码后，在项目根目录执行

```powershell
.\deploy.ps1 "说明这次改了什么"
```

它会自动完成 `git add` → `git commit` → `git push`，然后 GitHub Actions 会自动重新构建发布，
大约 1 分钟后线上就是新版本。

> 如果提示脚本被禁止运行，用这条：
> ```powershell
> powershell -ExecutionPolicy Bypass -File .\deploy.ps1 "说明"
> ```

不想用脚本的话，手动三步也一样：

```powershell
git add -A
git commit -m "说明这次改了什么"
git push
```

**只改文案的话**，直接编辑 `src/app/` 下的页面文件，然后跑一次 `.\deploy.ps1` 即可。

### 手动构建（可选）

如果不用 Actions，本地构建时需要自己指定 `basePath`：

```powershell
# Windows PowerShell —— 普通项目站点
$env:NEXT_PUBLIC_BASE_PATH="/<仓库名>"; npm run build

# 已绑定自定义域名（站点在域名根）或本地预览 out/ 时：留空
$env:NEXT_PUBLIC_BASE_PATH=""; npm run build
```

```bash
# macOS / Linux
NEXT_PUBLIC_BASE_PATH="/<仓库名>" npm run build
```

然后把 `out/` 目录内容推送到 `gh-pages` 分支。注意必须在 `out/` 里放一个空的 `.nojekyll` 文件（构建时已自动包含）。

---

## 改动速查：改哪里 → 什么会变

### 先理解两条路径（重点）

| | 本地开发 | 线上站点 |
| --- | --- | --- |
| 命令 | `npm run dev` | `.\deploy.ps1 "说明"` |
| 生效速度 | 保存文件后**秒级**热更新 | 提交推送后**约 1 分钟** |
| 谁能看到 | 只有你自己（`localhost:9002`） | 所有人（`gelun.eu.cc`） |
| 是否自动 | 是，不用做别的 | 否，**每次都要推一次** |

> 🔴 **改代码不会让线上页面实时变化。** 线上是一堆已经构建好的静态文件，
> 必须推送后由 GitHub Actions 重新构建才会更新。

### 常见改动对应文件

| 想改什么 | 文件 | 位置 |
| --- | --- | --- |
| 浏览器标签标题 / PWA 名称 | `src/app/layout.tsx` | `metadata.title` |
| 登录页标题「欢迎回来！」 | `src/app/(auth)/login/page.tsx` | 第 247 行 |
| 登录页副标题 | 同上 | 第 207 行 |
| 注册页副标题「加入我们吧！」 | `src/app/(auth)/signup/page.tsx` | 第 180 行（大标题「创建账号」在第 177 行） |
| 角色选项「新手 / 高手」 | 同上 | 第 206、219 行 |
| 姓名输入框占位文字 | 同上 | 第 233 行 |
| 底部小字「天天开心」 | 登录页 / 注册页 | 172 行 / 150 行 |
| 欢迎页文案 | `src/app/welcome/page.tsx` | 第 76、83 行 |
| **登录后落在哪一页** | `src/app/(auth)/login/page.tsx` | 第 366 行 `onComplete={() => router.push("/bento")}`（**连点小猫 5 下的彩蛋走的是同一条链路**，只是幕布原点换成猫的位置，见 `handleCatSkip`） |
| 工具箱页首帧黑幕 | `src/app/bento/page.tsx` | `bg-black` 那层，**必须与 `VEIL_END_COLOR` 一致** |
| 汇聚入场的速度 / 错峰 | `src/hooks/use-converge-in.ts` | 顶部常量 `FLY_DURATION` / `FLY_BASE_DELAY` / `STAGGER_STEP` / `TRAVEL_RATIO` / `TRAVEL_MAX_RATIO`。⚠️ `FLY_DURATION` 必须等于 `globals.css` 里 `converge-in` 的 `animation-duration`（900ms） |
| 登录成功的过渡动效 | `src/components/ui/color-veil.tsx` + `globals.css` 里的 keyframes | 详见 PROJECT.md 4.6 |
| 幕布颜色 / 时长 | `<ColorVeil color fadeTo fadeStartRatio fadeDuration duration>` 或 `--primary` | 起始色跟随主题色 → 终色纯黑；扩散 760ms，变色从 50% 起算，扩散结束后 1s 内变完 |
| 报错 / 成功提示文字 | 各页的 `toast({ ... })`、`z.string().min(...)` | — |
| 左上角标识 `pgl-tools` | 登录页 / 注册页内的 `<span>`；bento 页在 `site-header.tsx` 的 `productName` / `productSuffix` | — |
| 404 页面 | `src/app/not-found.tsx` | — |
| 配色 / 主题变量 | `src/app/globals.css` | shadcn 那套是 HSL；Bento 那套是 RGB，两套互不干涉 |
| 页面跳转逻辑 | 各页的 `router.push(...)` | — |
| **工具箱主页的 16 个模块** | `src/app/bento/page.tsx` | 文件顶部是**所有内容常量**（`PINNED` / `GLYPHS` / `TAGS` / `ENTRIES` / `NOTE_TILT`）—— 改内容只动这里。跨度见 PROJECT.md 4.7.3 |
| 页头 logo 与导航项 | `src/components/bento/site-header.tsx` + `src/components/bento/tabs.ts` | `productName` / `productSuffix`；分类定义在 `tabs.ts` 的 `BENTO_TABS`（含「全部」）。⚠️ 页头高度 `sm:h-36` 不能改（改了整块网格位移）；分类切换的 FLIP 在 `src/hooks/use-flip.ts` |
| 卡片样式 / 圆角 / 细边 / 分类重排 | `src/components/bento/bento-card.tsx` | 细边那四件套一个都不能删，详见 PROJECT.md 4.7.2。⚠️ **网格顶部 `pt-24 xl:pt-28` 是挥手的天顶，不能改小**（硬约束 54）；新卡必须挂 `dataType`（硬约束 55） |
| 日月切换动效 | `src/components/bento/theme-toggle.tsx` | 详见 PROJECT.md 4.7.5。⚠️ 里面的 `<button>` 不能加 `relative` |
| 挂钩板物理参数 / 徽章列表 | `src/components/bento/pegboard.tsx` | `BADGES` / `PEGS` / `GRAVITY` / `DROP_INTERVAL`。加徽章要同时往 `public/brands/` 放 logo |
| 终端话术 / 点击输出 | `src/components/bento/terminal.tsx` | `SCRIPTS`（每句 `cmd` + 点击后逐行吐出的 `out`）、`TYPE_MS` / `OUT_STEP_MS` / `RUN_HOLD_MS` |
| **两只猫**（毛色 / 连点次数 / 瞳孔幅度 / 彩蛋文案） | `src/components/bento/cat.tsx`（**趴卧**）、`src/components/ui/login-cat.tsx`（**坐姿**）、`src/hooks/use-pet.ts`（共用逻辑） | 连点次数 / 判定窗口 / **彩蛋保护期**是传给 `usePetSequence()` 的参数（`eggCount` / `windowMs` / `eggCooldownMs`）；文案在两个文件顶部的 `HAPPY_TEXTS` 与 `eggText`；毛色（暖调炭黑 `#302D26` + 黄绿眼 `#C6D74F`）都写在各自的 SVG 里。尾巴摆幅 / 呼吸 / 呆毛 / 暖光在 `globals.css` 的 `@keyframes cat-tail` / `cat-breathe` / `cat-tuft` / `cat-glow`。⚠️ `cat-party` 的时长必须与 `partyMs` 对齐（见 PROJECT.md 硬约束第 25 条） |
| 登录页那只猫的位置 / 大小 / 暗示文案 | `src/components/ui/login-cat.tsx` + `src/app/(auth)/login/page.tsx` | 猫是 `left-[8%] top-[-70px] h-[76px] w-[104px]`（**只压框子 6px**，不能随便挪 —— 输入框上方只剩 ~56px，改之前先跑 `measure-login2.js`），暗示是登录页里那个 `.cat-hint` 的 `<span>` |
| 沙丘起伏速度 / 颜色 | `src/components/bento/wave-canvas.tsx` | `t += 0.006` 是速度；颜色读的是 class 里的 `fill-ink-1 dark:fill-surface-1` |
| 点阵背景 | `src/components/bento/dot-grid.tsx` | 只有日间显示（`dark:hidden`） |
| 字体 | `public/fonts/` + `src/lib/fonts.ts` | **自托管**，`@font-face` 由 `fonts.ts` 生成后在 `layout.tsx` 用 `<style>` 注入。⚠️ **不要改成 `next/font/google`，也不要加任何外部字体 `<link>`** —— 外部样式表是渲染阻塞的，国内网络下会把首屏挂成黑屏（见 `PROJECT.md` 8.7） |
| 全站默认明暗 | `src/components/theme-provider.tsx` | 默认夜间；改回跟随系统见 PROJECT.md 4.7.4 |
| **新增 `public/` 图片 / 资源** | 引用处 | 路径必须过 `asset()`（`src/lib/asset.ts`），否则换了部署路径就 404 |

> ⚠️ 登录页与注册页结构对称，同一处文案两边都有 —— 改一处记得看看另一处，避免两边不一致。
>
> ⚠️ **别改 `localStorage` 的 key**（`careercompass_users` / `careercompass_session`），改了老账号就读不到了。
>
> ⚠️ **改外观 / 动效之前，先去 `PROJECT.md` 4.7.15 那份扒取产物里对照参考站的原始 class** ——
> 现在这套版式是逐像素对齐的，凭感觉改很容易破坏对齐关系。**但文案、数据、跳转目标本来就
> 是自己的**，随便改。

### 改完的验证顺序

```powershell
npm run dev              # 1. 本地看效果，边改边刷新（秒级）
npm run build            # 2. 可选：确认能正常构建
.\deploy.ps1 "说明"       # 3. 满意后推到线上（约 1 分钟后生效）
```

---

## 目录结构

```
.
├── PROJECT.md                     # 📄 完整技术说明书（给 AI / 新接手的人看）
├── README.md                      # 本文件：日常操作说明
├── .github/workflows/deploy.yml   # GitHub Pages 自动部署
├── deploy.ps1                     # 一键发布脚本
├── public/
│   ├── .nojekyll                  # 关闭 GitHub Pages 的 Jekyll 处理
│   └── brands/*.svg               # 16 个技术 logo（Simple Icons，CC0，本地托管）
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx     # 登录页
│   │   │   └── signup/page.tsx    # 注册页
│   │   ├── bento/page.tsx         # 工具箱主页 = 登录落点（16 格内容常量都在这）
│   │   ├── welcome/page.tsx       # 欢迎页（旧测试页，已非落点）
│   │   ├── page.tsx               # 首页 → 跳转 /login
│   │   ├── not-found.tsx          # 404
│   │   ├── layout.tsx             # 根布局（主题 + Toast + 注入自托管 @font-face）
│   │   ├── globals.css            # 设计令牌（shadcn HSL + Bento RGB）+ 全部 keyframes
│   │   └── manifest.ts            # PWA manifest
│   ├── components/
│   │   ├── ui/                    # 仅保留登录注册页用到的组件（含 color-veil 过渡幕布、login-cat 坐在邮箱框沿上的黑猫）
│   │   ├── bento/
│   │   │   ├── bento-card.tsx     # BentoGrid + BentoCard（1px 渐变细边 + 分类重排）
│   │   │   ├── site-header.tsx    # 三栏页头 + 胶囊导航（滑动指示器 + 分类切换）
│   │   │   ├── tabs.ts            # 分类定义 / 命中判定 / 筛选 context
│   │   │   ├── dot-grid.tsx       # 点阵背景（仅日间）
│   │   │   ├── pegboard.tsx       # SKILLS 挂钩板（2D 刚体模拟）
│   │   │   ├── terminal.tsx       # 终端（打字机循环 + 点一下真执行）
│   │   │   ├── wave-canvas.tsx    # 沙丘 canvas + 反色文字
│   │   │   ├── theme-toggle.tsx   # 日月主题切换
│   │   │   ├── cat.tsx            # 第 2 格那只**趴卧**的黑猫（点它 / 连点 7 次有彩蛋）
│   │   │   └── icons.tsx          # 内联 SVG 图标（tabler 路径）
│   │   └── theme-provider.tsx
│   ├── hooks/                     # use-toast / use-bento-theme / use-converge-in / use-pet（撸猫状态机）/ use-flip（分类切换的 FLIP 补间）
│   ├── lib/                       # utils.ts（cn）/ asset.ts（basePath 资源路径）/ fonts.ts（@font-face）
│   └── styles/responsive-touch.css
├── public/fonts/*.woff2           # 自托管字体（10 个，latin 子集）
├── next.config.ts                 # output: export 静态导出
├── tailwind.config.ts
└── tsconfig.json
```

---

## 技术栈

Next.js 15（App Router，静态导出）· React 18 · TypeScript · Tailwind CSS 3 · Radix UI · React Hook Form + Zod · next-themes · lucide-react

---

## License

MIT
