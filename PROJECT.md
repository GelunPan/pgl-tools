# PROJECT.md — pgl-tools「苹果绿的工具箱」项目说明书

> **这份文档是写给 AI 读的。** 目标是：任何一个从未见过本项目的 AI，读完之后能够准确解释它的工作原理、
> 安全地修改代码、并正确地发布上线。文档自包含，不需要额外的对话历史或外部链接。
>
> 文档版本：2026-09-22 · 语言：中文（技术术语保留英文原名）
> 状态：已上线并绑定自定义域名 **https://pan.gelun.eu.cc/**（Cloudflare 代理）

---

## 0. 30 秒速读（TL;DR）

| 问题 | 答案 |
|---|---|
| 这是什么 | 一个**纯前端**的登录 / 注册演示站点，名叫「苹果绿的工具箱」，英文名 `pgl-tools` |
| 有后端吗 | **完全没有**。没有服务器、没有数据库、没有 API 请求、没有第三方鉴权 |
| 数据存哪 | 浏览器的 `localStorage`（明文，仅演示用） |
| 技术栈 | Next.js 15 App Router + `output: "export"` 静态导出 + React 18 + TypeScript + Tailwind CSS |
| 构建产物 | 纯静态文件，`out/` 目录，约 **1.05 MB / 43 个文件** |
| 部署在哪 | GitHub Pages —— **https://pan.gelun.eu.cc/**（自定义域名 + Cloudflare 代理） |
| 旧地址 | `https://gelunpan.github.io/pgl-tools/` → **301 自动跳转**到新域名，不会失效 |
| 怎么发布 | 本地跑 `.\deploy.ps1 "说明"` → 推送 → GitHub Actions 自动构建部署（约 1 分钟） |
| 源码规模 | `src/` 下仅 **23 个文件**（含 1 个 favicon），无任何遗留业务代码 |
| 一句话原理 | **构建时把所有页面预渲染成 HTML/JS 静态文件；运行时全部逻辑在浏览器里跑，用 localStorage 当数据库** |

---

## 1. 项目定位与边界

### 1.1 这是什么

一个**个人向的工具箱站点**的登录入口部分。目前只实现并保留了三个功能页面：

1. **注册** —— 选择身份（新手 / 高手）、填姓名、邮箱、密码
2. **登录** —— 邮箱 + 密码校验
3. **欢迎页** —— 展示当前登录用户信息，可退出登录

外加一个有动画插画的左右分栏登录界面（左侧四个卡通角色，会跟随鼠标 / 眨眼 / 偷看密码）。

### 1.2 这**不是**什么（重要，避免误判）

- ❌ 不是真实可用的账号系统。**密码以明文存在 localStorage**，任何人打开 DevTools 都能看到。
- ❌ 不是服务端渲染（SSR）应用。**没有任何服务端代码**。
- ❌ 不是全栈项目。原项目那套 Firebase / Genkit AI / Stripe 的东西**已被完整剥离**。

### 1.3 历史来源（供理解上下文，不影响使用）

本项目是从一个 Next.js 15 + Firebase + Genkit 的全栈招聘平台（`careercompass`）**剥离**而来：
删掉了 21 个 AI flow、18 个 API 路由、全部登录后业务页、7 个 React Context、Firebase/Stripe 相关 lib、
middleware、以及 100+ 个 UI 组件。

原始完整代码备份在**项目外**：`D:\localrepository\careercompass-original-backup\`（唯一回滚依据）。

> ⚠️ 因为剥离，代码里会看到一些"历史遗迹"，它们是**有意保留**的，不是 bug：
> - `localStorage` 的 key 仍叫 `careercompass_users` / `careercompass_session`（改名会导致老账号全丢）
> - 角色的内部枚举值仍是 `employee` / `employer`，但界面上显示为「新手」/「高手」

---

## 2. 技术栈与依赖

### 2.1 运行时

| 项 | 版本 |
|---|---|
| Next.js | **15.5.12**（App Router） |
| React / React DOM | 18.3.1 |
| TypeScript | 5.x |
| Tailwind CSS | 3.4.1（+ tailwindcss-animate） |
| Node.js | CI 上用 20；本地 20+ 均可 |

### 2.2 关键依赖及其用途

| 包 | 用途 |
|---|---|
| `react-hook-form` + `@hookform/resolvers` + `zod` | 表单状态管理与校验 |
| `@radix-ui/react-*`（label / input / checkbox / radio-group / toast / slot） | 无样式无障碍基础组件 |
| `class-variance-authority` + `clsx` + `tailwind-merge` | 条件 className 组合（shadcn 约定） |
| `next-themes` | 深色 / 浅色主题（跟随系统） |
| `lucide-react` | 图标 |
| `tailwindcss-animate` | 组件动画工具类 |

**运行依赖仅 16 个**，全部为纯前端库。**没有任何后端 / 云服务 SDK**。

### 2.3 常用命令

```bash
npm install                          # 安装依赖
npm run dev                          # 开发服务器 → http://localhost:9002（端口固定 9002）
npm run build                        # 静态导出 → 生成 out/
npm run lint                         # ESLint（注意：版本不匹配，可能报错，不影响构建）
npm run typecheck                    # tsc --noEmit 类型检查
npx serve out                        # 本地预览构建产物
```

---

## 3. 目录结构（完整文件清单）

```
careercompass-main/
├── PROJECT.md                      ← 本文档
├── README.md                       ← 面向人的使用说明（含文案改动速查表）
├── deploy.ps1                      ← 一键发布脚本（add → commit → push → 校验）
│
├── .github/workflows/deploy.yml    ← GitHub Actions 自动构建部署流水线
├── .gitignore                      ← 排除 node_modules / .next / out / .env* / .workbuddy
├── .gitattributes                  ← 统一 LF 换行
├── public/.nojekyll                ← 关闭 GitHub Pages 的 Jekyll 处理
│
├── next.config.ts                  ← ★ 静态导出核心配置
├── package.json                    ← 依赖与脚本
├── tailwind.config.ts              ← Tailwind 主题（设计令牌映射）
├── postcss.config.mjs
├── tsconfig.json                   ← 路径别名 @/* → src/*
├── components.json                 ← shadcn/ui 配置
├── LICENSE                         ← MIT（保留上游版权声明 arsh342）
│
└── src/                            （23 个文件）
    ├── app/
    │   ├── layout.tsx              ← ★ 根布局：ThemeProvider + Toaster + metadata
    │   ├── page.tsx                ← 首页：「/」→ 客户端跳转 /login
    │   ├── not-found.tsx           ← 404（构建为 404.html）
    │   ├── manifest.ts             ← PWA manifest（构建为 manifest.webmanifest）
    │   ├── globals.css             ← ★ 设计令牌（shadcn CSS 变量：颜色/圆角/暗色模式）
    │   ├── favicon.ico
    │   ├── (auth)/                 ← 路由组（括号不影响 URL）
    │   │   ├── layout.tsx          ← 透传容器，无实际作用
    │   │   ├── login/page.tsx      ← ★ 登录页（含动画角色）
    │   │   └── signup/page.tsx     ← ★ 注册页
    │   └── welcome/page.tsx        ← 欢迎页（读会话 + 退出登录）
    │
    ├── components/
    │   ├── theme-provider.tsx      ← next-themes 封装
    │   └── ui/
    │       ├── animated-characters.tsx        ← ★ 四个卡通角色（SVG + 状态动画）
    │       ├── interactive-hover-button.tsx   ← ★ 悬停填充动画按钮
    │       ├── button.tsx  input.tsx  label.tsx
    │       ├── checkbox.tsx  radio-group.tsx
    │       └── toast.tsx  toaster.tsx
    │
    ├── hooks/use-toast.ts          ← Toast 状态管理（reducer 模式）
    ├── lib/utils.ts                ← cn()：clsx + tailwind-merge
    └── styles/responsive-touch.css ← 触屏设备适配微调
```

### 路由对照（URL → 构建产物）

| URL | 源文件 | 构建产物 |
|---|---|---|
| `/` | `app/page.tsx` | `out/index.html` |
| `/login/` | `app/(auth)/login/page.tsx` | `out/login/index.html` |
| `/signup/` | `app/(auth)/signup/page.tsx` | `out/signup/index.html` |
| `/welcome/` | `app/welcome/page.tsx` | `out/welcome/index.html` |
| 任意未知路径 | `app/not-found.tsx` | `out/404.html` |
| `/manifest.webmanifest` | `app/manifest.ts` | `out/manifest.webmanifest` |

> 💡 `trailingSlash: true` 让 Next 生成 `login/index.html` 而不是 `login.html`，
> 这样 GitHub Pages 上访问 `/pgl-tools/login/` 才能直接命中文件，无需重写规则。

---

## 4. 工作原理

### 4.1 整体架构：三层，全在客户端

```
┌──────────────────────────────────────────────────────────────────┐
│                         浏览器（唯一运行环境）                      │
│                                                                  │
│   ① 静态资源层                ② React 运行时          ③ 数据层      │
│   ─────────────              ──────────────         ──────────    │
│   index.html                 页面组件（"use client"）  localStorage │
│   login/index.html    ───►   react-hook-form       ├ users       │
│   signup/index.html           zod 校验             └ session     │
│   welcome/index.html          next-themes                        │
│   404.html                    toast                             │
│   _next/static/*.js  ───►  （全部逻辑在此执行）                    │
│   _next/static/*.css                                            │
└──────────────────────────────────────────────────────────────────┘
                              ▲
                              │ 只有构建期上传，运行期零请求
                              │
┌──────────────────────────────────────────────────────────────────┐
│                    GitHub Pages（纯静态文件托管）                   │
└──────────────────────────────────────────────────────────────────┘
```

**核心机制**：`next build` 在**构建时**把每个路由预渲染成 HTML 骨架 + 对应的 JS/CSS chunk。
浏览器拿到 HTML 后，React 在客户端 hydrate，所有交互逻辑（表单、校验、跳转、读写 localStorage）**全部在浏览器内完成**。
**运行时不会向任何服务器发请求**（除了加载 Google Fonts 和一张远程图标，见 §8.3）。

### 4.2 页面流转

```
       访问 /
         │
         ▼
   ┌───────────┐   已注册？
   │  page.tsx │──────────────► /login ──────────┐
   │ 跳 /login │                （登录页）        │ 点击「立即注册」
   └───────────┘                                 ▼
                                          ┌───────────┐
                                          │  /signup  │  提交成功
                                          │  注册页   │──────┐
                                          └───────────┘      │
                                                             ▼
        登录成功                              toast「注册成功」+ 跳回 /login
       （写入 session）
         │
         ▼
   ┌───────────┐  点击「退出登录」   ┌──────────────┐
   │ /welcome  │──────────────────►│ 删除 session │──► /login
   │  欢迎页   │                   └──────────────┘
   └───────────┘
```

所有跳转都用 `next/navigation` 的 `useRouter()`（客户端跳转），
因为静态导出下没有服务端路由可以处理跳转请求。

### 4.3 数据模型（localStorage schema）

**两个 key，都是 JSON 字符串：**

#### `careercompass_users` —— 已注册用户数组

```jsonc
[
  {
    "email":     "user@example.com",   // string，登录时用（比较时忽略大小写）
    "password":  "123456",             // string，★ 明文存储，仅演示
    "name":      "张三",                // string，注册时填的姓名
    "role":      "employee",           // "employee" | "employer" → 界面显示「新手」/「高手」
    "createdAt": "2026-09-22T10:00:00.000Z"  // ISO 8601
  }
]
```

#### `careercompass_session` —— 当前登录会话（单个对象）

```jsonc
{
  "email":   "user@example.com",
  "name":    "张三",
  "role":    "employee",
  "loginAt": "2026-09-22T12:34:56.789Z"   // ISO 8601
}
```

> 🔴 **这两个 key 的名字不能改。** 改了等于把所有已注册用户的账号清空。
> 它们带 `careercompass_` 前缀是改名遗留，**是有意为之**。

> ⚠️ 注意「30 天内保持登录」这个复选框**目前没有实际逻辑**（`Checkbox` 没有绑定 state），
> 是原项目遗留的 UI。会话本身不设过期时间，登出才会清除。

### 4.4 认证逻辑（伪代码，就是实际实现）

**注册**（`src/app/(auth)/signup/page.tsx`）：

```
onSubmit(values):
    users = JSON.parse(localStorage[careercompass_users] || "[]")   // 读，失败则空数组
    if users.some(u => u.email === values.email):                   // 邮箱查重
        toast.error("该邮箱已被注册")
        return
    users.push({
        email:     values.email,
        password:  values.password,        // ★ 直接存明文，不做哈希
        name:      values.name,
        role:      values.role,            // "employee" | "employer"
        createdAt: new Date().toISOString()
    })
    localStorage[careercompass_users] = JSON.stringify(users)        // 整个数组写回
    toast.success("注册成功")
    router.push("/login")
```

**登录**（`src/app/(auth)/login/page.tsx`）：

```
onSubmit(values):
    setIsLoading(true)
    await sleep(600)                                    // ★ 人为延迟，仅为让加载动画可见
    users = getUsers()
    user  = users.find(u => u.email.toLowerCase() === values.email.toLowerCase())
    if !user:            throw "该邮箱尚未注册，请先注册账号。"
    if user.password !== values.password:  throw "密码不正确，请重试。"
    localStorage[careercompass_session] = JSON.stringify({          // 写入会话
        email: user.email, name: user.name, role: user.role,
        loginAt: new Date().toISOString()
    })
    toast.success("登录成功", `欢迎回来，${user.name}！`)
    router.push("/welcome")
```

**校验规则**（Zod，前后端都没有第二道防线，因为只有前端）：

| 字段 | 规则 | 错误提示 |
|---|---|---|
| email | `z.string().email()` | 请输入有效的邮箱地址。 |
| password | `z.string().min(6)` | 密码至少需要 6 个字符。 |
| name | 非空 | （见 signup 页 schema） |
| role | `z.enum(["employee", "employer"])` | — |

**登出**（`src/app/welcome/page.tsx`）：

```
handleLogout():
    localStorage.removeItem(careercompass_session)
    toast("已退出登录")
    router.push("/login")
```

**欢迎页读取会话**：在 `useEffect` 里读 `careercompass_session` 并 `setState`。
因为 `useEffect` 只在客户端执行，所以**预渲染的 HTML 里不含用户信息**（这是正常的，
不要在静态 HTML 里搜用户名然后判定"没生效"）。

### 4.5 动画实现机制

| 组件 | 机制 |
|---|---|
| `animated-characters.tsx` | 纯 SVG + React state。通过 `requestAnimationFrame` / interval 更新眼球偏移量（跟随鼠标 `mousemove`）、随机间隔眨眼、`isTyping` 时角色互相对视、`showPassword` 时捂眼睛「偷看」。接收三个 props：`isTyping` / `showPassword` / `passwordLength`。 |
| `interactive-hover-button.tsx` | 纯 CSS 过渡：`group` + `group-hover` 让背景色块从左侧滑入填充，文字反色。 |
| 主题切换 | `next-themes` 在 `<html>` 上加 `class="dark"`，Tailwind `darkMode: "class"` 生效。默认 `system`。 |

---

## 5. 构建与部署原理

### 5.1 静态导出（`next.config.ts` 是核心）

```ts
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";   // ★ 部署路径，见 §5.2

const nextConfig: NextConfig = {
  output: "export",              // ★ 关键：开启静态导出，产物在 out/
  basePath,                      // 站点挂载在子路径时必需
  assetPrefix: basePath || undefined,  // JS/CSS 资源前缀同步
  trailingSlash: true,           // 生成 login/index.html 形式
  images: { unoptimized: true }, // ★ 静态导出必须关闭图片优化服务
  typescript: { ignoreBuildErrors: true },  // 类型错误不阻断构建
  eslint:     { ignoreDuringBuilds: true },
  experimental: { optimizePackageImports: ["lucide-react"] },
  compiler: { removeConsole: production ? { exclude: ["error","warn"] } : false },
};
```

#### 🔴 `output: "export"` 的能力边界（改代码前必读）

| 特性 | 静态导出下 | 说明 |
|---|---|---|
| `headers()` / `redirects()` / `rewrites()` | ❌ **不支持** | 已在剥离时删除，**不要加回来**，会直接构建失败 |
| `middleware.ts` | ❌ **不支持** | 已在剥离时删除 |
| Server Actions / Route Handlers（POST 等） | ❌ 不支持 | 没有服务端 |
| `next/image` 优化服务 | ❌ 需 `unoptimized: true` | 已配置 |
| `metadata` / `manifest.ts` 等 metadata 路由 | ⚠️ **支持，但必须显式声明** | 必须在文件里加 `export const dynamic = "force-static";` |
| 动态路由 `[slug]` 无 `generateStaticParams` | ❌ 不支持 | 本项目无动态路由 |
| `useRouter` 客户端跳转 / `useSearchParams` | ✅ 支持 | |
| `localStorage` / 浏览器 API | ✅ 支持（组件需 `"use client"`） | |

> 📌 `manifest.ts` 就是一个踩过的坑：它作为 metadata 路由**能**静态导出，
> 但**必须**写 `export const dynamic = "force-static";`，否则构建报
> `export const dynamic = "force-static" not configured on route "/manifest.webmanifest"`。

### 5.2 basePath 机制（最容易踩的坑）

GitHub Pages 的**项目站点**地址形如 `https://<用户名>.github.io/<仓库名>/`，
所有资源都挂在 `/<仓库名>/` 子路径下。如果 HTML 里引用 `/login` 而非 `/pgl-tools/login`，就会 404。

**解决方案：构建时通过环境变量注入 basePath。**

```bash
# Windows PowerShell
$env:NEXT_PUBLIC_BASE_PATH="/pgl-tools"; npm run build

# macOS / Linux
NEXT_PUBLIC_BASE_PATH="/pgl-tools" npm run build
```

**CI 里自动推导**（`.github/workflows/deploy.yml` 的 Resolve basePath 步骤），三个分支：

```bash
REPO="<仓库名>"
OWNER_LOWER=$(echo "<owner>" | tr 'A-Z' 'a-z')

# ① 仓库已绑定自定义域名 → 站点挂在【域名根路径】下，basePath 必须留空
CNAME=$(gh api "repos/<owner>/<repo>/pages" --jq '.cname // ""' 2>/dev/null || echo "")

if [ -n "$CNAME" ]; then
  value=            # 自定义域名 → 留空（本项目当前就是这种情况）
elif [ "$REPO" = "${OWNER_LOWER}.github.io" ]; then
  value=            # 用户主页站点 → 留空
else
  value=/$REPO      # 普通项目站点 → /pgl-tools
fi
```

> 💡 这段逻辑的价值：
> - 仓库改名 / 搬到用户主页仓库 → **不需要改代码**，CI 自动算出正确的 basePath。
> - 绑定或解绑自定义域名 → **也不需要改代码**，CI 从 GitHub 的 Pages 设置里读真实状态。
>
> ⚠️ 查询失败时会退回 `/REPO` 分支（保证 `github.io` 地址可用）。若看到站点在自定义域名下白屏，
> 先去 Actions 日志确认 `Resolve basePath` 步骤打印的是哪一行。

### 5.2.1 🔴 自定义域名会改变站点的路径位置（本项目已踩过）

这是最容易漏、后果最严重的一条规则：

| Pages 配置 | 站点实际位置 | 正确 basePath |
|---|---|---|
| 无自定义域名（项目站点） | `https://<user>.github.io/<repo>/` | `/<repo>` |
| **已绑定自定义域名** | `https://<domain>/` ← **域名根，没有 /<repo> 前缀** | `""`（空） |

**为什么**：GitHub Pages 按请求的 `Host` 头路由。当访问的是自定义域名，GitHub 查出该域名对应哪个仓库，
直接把该仓库的 Pages 根（即 `out/` 的内容）挂在 `/` 下 —— 于是 `/_next/…`、`/login/` 都在根。

**如果 basePath 没跟着改会怎样**：HTML 里仍写死 `/pgl-tools/_next/…`，
这些地址在域名根下**全部 404** → 页面 HTML 能打开、但 CSS/JS 全挂 → **白屏**。

实测证据（本项目 2026-09-22 绑定 `pan.gelun.eu.cc` 后）：

```
GET https://pan.gelun.eu.cc/          -> 200，HTML 内资源为 /_next/static/...   ✅
GET https://pan.gelun.eu.cc/pgl-tools/_next/...css -> 404                        （子路径不存在）
GET https://pan.gelun.eu.cc/_next/...css           -> 200                        ✅
```

> 🔴 **纯前端 + 静态导出 + 子文件夹路径** 这三者组合下，DNS 层永远解决不了这个前缀问题
> ——因为改动的是「站点挂载在哪」，只有构建时的 basePath 能决定。

### 5.3 CI 流水线（`.github/workflows/deploy.yml`）

**触发条件**：`push` 到 `main` 分支，或手动 `workflow_dispatch`。

```
┌─ Job: build（ubuntu-latest）────────────────────────────────────┐
│ 1. actions/checkout@v4                                          │
│ 2. actions/setup-node@v4  → node 20 + npm cache                 │
│ 3. Resolve basePath       → 已绑自定义域名则留空，否则 /<repo>     │
│ 4. npm install --no-audit --no-fund                             │
│ 5. npm run build          → 注入 NEXT_PUBLIC_BASE_PATH → out/    │
│ 6. touch out/.nojekyll    → 防止 Jekyll 忽略 _next/ 目录          │
│ 7. actions/configure-pages@v5（enablement: true）→ 自动开 Pages   │
│ 8. actions/upload-pages-artifact@v3  → 上传 out/ 作为 artifact     │
└─────────────────────────────────────────────────────────────────┘
                            │ needs: build
                            ▼
┌─ Job: deploy（ubuntu-latest）───────────────────────────────────┐
│ 9. actions/deploy-pages@v4 → 发布到 github-pages 环境             │
└─────────────────────────────────────────────────────────────────┘
```

**需要的权限**（已在 workflow 里声明）：

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

**两个设计决策（不要改）**：

1. 用 `npm install` 而不是 `npm ci`。因为 `package-lock.json` 与 `package.json` 存在不同步的历史，
   `npm ci` 会因为严格校验而失败。
2. `configure-pages@v5` 带 `enablement: true`。仓库新建时 Pages 默认**未开启**，
   首次推送的 run 会在 `Setup Pages` 步骤必然失败。加上这个参数后，CI 会**自动以
   "GitHub Actions" 为源开启 Pages**，长期自愈，无需手动点设置。

### 5.4 一键发布脚本（`deploy.ps1`）

**用法**：

```powershell
.\deploy.ps1 "说明这次改了什么"
```

若提示脚本被禁止运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 "说明"
```

**它做的 4 步 + 1 个自检**：

| 步骤 | 动作 | 失败处理 |
|---|---|---|
| 1/4 | `git add -A` | 检查 `$LASTEXITCODE`，非 0 则退出 |
| 2/4 | `git commit -m <消息>` | 无改动时自动跳过；检查退出码 |
| 3/4 | `git push origin main` | **最多重试 3 次，间隔 4 秒** |
| 4/4 | `git fetch origin main` + 比对 `HEAD` 与 `FETCH_HEAD` | 不一致则报告 MISMATCH 并退出 |
| — | 打印 Actions 与线上地址 | |

> 🔴 **为什么第 3 步要重试、第 4 步要比对？**
> 本机环境里 `git push` 会**偶发静默失败**：返回 `exit=128` 但 stderr 完全为空，
> 看起来像成功、实际没推上去（定位到是 git 凭据管理器在非交互上下文下取 token 失败）。
> 所以脚本必须靠"重试 + 拉回远端比对 SHA"来兜底，**光看退出码不够**。

> 🔴 **脚本的职责边界**：它**只负责推送**，不执行构建。
> 构建部署是推送之后由 GitHub Actions 接手的（接力关系，不是包含关系）。
> 因此：**推送失败 = 构建不会发生**；反之**推送成功 ≠ 构建成功**——
> 构建失败要去 https://github.com/GelunPan/pgl-tools/actions 看日志。

### 5.5 两条路径：本地开发 vs 线上站点

| | 本地开发 | 线上站点 |
|---|---|---|
| 命令 | `npm run dev` | `.\deploy.ps1 "说明"` |
| 生效速度 | 保存文件后**秒级**热更新 | 推送后**约 1 分钟** |
| 谁可见 | 只有你自己（`localhost:9002`） | 所有人（`pan.gelun.eu.cc`） |
| 是否自动 | 是 | 否，**每次都要推送** |

> 🔴 **改代码不会让线上页面实时变化。** 线上是一堆已经构建好的静态文件，
> 必须推送 → 触发 Actions → 重新构建 → 才更新。

### 5.6 自定义域名 + Cloudflare 全貌（当前生效状态）

```
用户浏览器
   │  https://pan.gelun.eu.cc/
   ▼
Cloudflare（橙色云朵 = 已代理）        免费 SSL、CDN 缓存、隐藏源站
   │  SSL 模式必须是「完整 / Full」
   ▼
GitHub Pages（Host: pan.gelun.eu.cc）
   │  GitHub 按 Host 查到该域名属于 pgl-tools 仓库
   ▼
out/ 的内容直接挂在域名根路径 / 下      ← 所以 basePath 必须留空
```

**四段配置分别在哪里、是什么**

| 环节 | 位置 | 当前值 |
|---|---|---|
| DNS | Cloudflare → DNS → 记录 | `CNAME` · 名称 `pan` · 目标 `gelunpan.github.io` · 代理状态：**可橘可灰**（见下） |
| 自定义域名 | GitHub 仓库 → Settings → Pages → Custom domain | `pan.gelun.eu.cc` |
| HTTPS 证书 | GitHub 自动签发（Let's Encrypt） | 状态 `approved` ✅ |
| 强制 HTTPS | 同上页面 → Enforce HTTPS | **已开启** ✅（`http://` → 301 → `https://`） |

**🔴 DNS 的关键细节（很多人在这里配错）**

- CNAME 的目标**只能填裸域名** `gelunpan.github.io`，**绝不能带仓库名或路径**。
  `gelunpan.github.io/pgl-tools` 是无效的 —— DNS 层不识别斜杠，Cloudflare 会直接拒绝保存。
- 「访问域名 → 打开子文件夹」这件事**不是 DNS 能做的**，只能由构建时的 `basePath` 决定（见 §5.2.1）。
- 子域名用 **CNAME**；如果用裸域（apex）则必须用 **A 记录**指向 GitHub 的 4 个 IP：
  `185.199.108.153 / 109 / 110 / 111`。

**🔴 Cloudflare 代理（橙色云朵）的两个硬要求**

1. **SSL/TLS 模式必须是「完整 / Full」，绝不能选「灵活 / Flexible」。**
   因为 GitHub Pages 强制把 HTTP 跳转到 HTTPS；若 Cloudflare 用 HTTP 回源，
   就会形成 `CF → HTTP → GitHub → 301 HTTPS → CF → …` 的**无限重定向循环**。
   （「完全（严格）/ Full Strict」也能用，但没必要，Full 更省心。）
2. **首次绑定域名时先保持灰色云朵（仅 DNS）**，等 GitHub 把证书签下来、验收通过后再切橙色。
   开着代理时外部解析器只能看到 Cloudflare 的 IP，GitHub 的域名校验可能报 `InvalidDNSError`。

**Actions 工作流的部署方式决定了一件重要的事**

本项目用的是 **Actions 部署**（`build_type: workflow`），所以：
**不需要在仓库里放 `CNAME` 文件**。GitHub 官方明确说明，Actions 部署时
「不会创建 `CNAME` 文件，且已存在的 `CNAME` 文件会被忽略、也不是必需」。
域名以 **Settings → Pages 里的设置**为准 —— 这也是为什么工作流要从 Pages API 读 `cname`。

**验收命令（改完 DNS/域名后自查）**

```bash
# 1. DNS 是否指向 GitHub（应看到 185.199.108-111.153）
nslookup pan.gelun.eu.cc

# 2. 站点是否在域名根正常返回，且资源是根路径 /_next/
curl -sI https://pan.gelun.eu.cc/ | head -3
curl -s https://pan.gelun.eu.cc/ | grep -o '/_next/static/css/[^"]*' | head -1

# 3. http 是否强制跳 https（期望 301）
curl -sI http://pan.gelun.eu.cc/ | head -2

# 4. 旧地址是否自动跳新域名（期望 301 → https://pan.gelun.eu.cc/）
curl -sI https://gelunpan.github.io/pgl-tools/ | head -2
```

**⚠️ 安全提醒（建议做）**：在 GitHub 账号级设置里**验证域名所有权**（添加一条 `_github-pages-challenge-*`
的 TXT 记录）。否则万一以后仓库被删或改名，该域名可能被他人抢注到自己的 Pages 站点上（域名接管）。

---

## 6. 🔴 硬约束 / 不变量（AI 修改代码时必须遵守）

按严重程度排序。违反任何一条都会造成实际损失。

### 6.1 绝对不能改

| # | 约束 | 违反后果 |
|---|---|---|
| 1 | **`localStorage` 的 key 名**（`careercompass_users` / `careercompass_session`） | 所有已注册用户的账号立即"消失"，无法登录 |
| 2 | **角色的枚举值** `"employee"` / `"employer"` | 老用户数据里的 role 与代码不匹配，欢迎页角色显示错乱。**要改显示文案就改 JSX 里的字符串，不要动枚举值** |
| 3 | **不要往 `next.config.ts` 加 `headers()` / `redirects()` / `rewrites()`** | 静态导出不支持，`npm run build` 直接失败 |
| 4 | **不要新建 `src/middleware.ts`** | 同上，与 `output: "export"` 冲突 |
| 5 | **不要删 `manifest.ts` 里的 `export const dynamic = "force-static";`** | 构建报错 |
| 6 | **不要从 `next.config.ts` 删 `images.unoptimized`** | 静态导出下图片优化服务不存在，构建失败 |
| 7 | **不要删 `public/.nojekyll`** 或 CI 里的 `touch out/.nojekyll` | GitHub Pages 的 Jekyll 会忽略 `_next/` 目录，站点白屏 |
| 8 | **不要删掉工作流里「自定义域名 → basePath 留空」这个分支**，也不要把 basePath 写死 | 本项目已绑自定义域名，站点在域名根；一旦 basePath 被固定成 `/pgl-tools`，线上立刻白屏（见 §5.2.1） |
| 9 | **不要把 Cloudflare 的 SSL 模式改成「灵活 / Flexible」** | GitHub 强制 HTTPS，会造成无限重定向循环 |

### 6.2 改的时候要小心

| # | 事项 | 说明 |
|---|---|---|
| 8 | **登录页与注册页文案对称** | 两页结构相似，同一句话（如底部小字）两边都有。改一处记得同步另一处 |
| 9 | **新组件必须加 `"use client"`** | 所有页面都依赖浏览器 API（localStorage / useState / useRouter），漏了会构建报错或行为异常 |
| 10 | **`useEffect` 里读 localStorage 要用 try/catch** | 用户可能手动改坏了 JSON，不兜住会整页崩溃 |
| 11 | **不要用 `zodResolver` + `.default()`** | 会让 `z.input` / `z.output` 类型不一致而冲突（剥离时已踩过，signup 的 role 去掉了 `.default("employee")`） |
| 12 | **静态 HTML 里搜不到运行时内容 ≠ 没生效** | 比如欢迎页的用户信息在 `useEffect` 里才渲染，构建产物中必然不存在。要验证请用 `npm run dev` 实际操作 |

### 6.3 环境相关（本机 / 沙箱特有）

| # | 事项 | 正确做法 |
|---|---|---|
| 13 | 预览服务不要指向项目的 `out/` | `next build` 会报 `EBUSY: rmdir 'out'`。**把 `out/` 复制到项目外再 serve** |
| 14 | 构建日志不要写在项目内 | 会被 git 提交。写到项目外，或用完立即删 |
| 15 | 提交信息含中文时不要用 `Out-File -Encoding ascii` | 中文会被替换成 `?`。用 UTF-8 无 BOM 写入后 `git commit -F <文件>` |
| 16 | 沙箱内 `git push` 可能静默失败 | 靠 `deploy.ps1` 的重试 + SHA 比对兜底；在用户自己的终端里跑则有凭据弹窗兜底 |

---

## 7. 常见任务手册

### 7.1 改文案（最高频）

| 想改什么 | 文件 | 具体位置 |
|---|---|---|
| 浏览器标签标题 / PWA 名称 | `src/app/layout.tsx` | `metadata.title` |
| PWA 名称（另一处） | `src/app/manifest.ts` | `name` / `short_name` |
| 登录页标题「欢迎回来！」 | `src/app/(auth)/login/page.tsx` | 第 181 行附近 |
| 登录页副标题 | 同上 | 第 184 行附近 |
| 注册页大标题「创建账号」 | `src/app/(auth)/signup/page.tsx` | 第 177 行附近 |
| 注册页副标题「加入我们吧！」 | 同上 | 第 180 行附近 |
| 角色选项「新手 / 高手」 | 同上 | 第 206、219 行（`<Label>` 内，**不要动相邻的 `value="employee"` / `value="employer"`**） |
| 「我是...」分组标签 | 同上 | 第 188 行 |
| 姓名输入框占位文字 | 同上 | 第 233 行 |
| 底部小字「天天开心」 | 登录页 154 行 / 注册页 150 行 | 两处都要改 |
| 左上角标识 `pgl-tools` | 登录页 / 注册页内的 `<span>` | 各 2 处（桌面版 + 移动版） |
| 图标（远程 URL） | `layout.tsx` 的 `icons` + `manifest.ts` 的 `icons` | 两处都要改 |
| 欢迎页文案 | `src/app/welcome/page.tsx` | 第 48 行 |
| 报错 / 成功提示 | 各页 `toast({...})`、`z.string().min(...)` 的 message | — |
| 404 页面 | `src/app/not-found.tsx` | — |
| 配色 / 圆角 / 主题变量 | `src/app/globals.css` | CSS 变量 |

### 7.2 加一个新页面

1. 在 `src/app/` 下新建目录 + `page.tsx`，例如 `src/app/about/page.tsx`
2. 文件首行写 `"use client";`（如果用到浏览器 API 或 hooks）
3. 用 `<Link href="/about">` 或 `router.push("/about")` 跳转
4. 本地 `npm run dev` 验证
5. ⚠️ **不要用动态路由** `[slug]`（静态导出需要 `generateStaticParams`，本项目没配）
6. `.\deploy.ps1 "新增 about 页"`

### 7.3 给注册表单加一个字段

需要同步改 **4 个地方**，任何一处漏了都会出错：

1. Zod schema（`signupSchema`）加字段 + 校验规则
2. `useForm` 的 `defaultValues` 加默认值
3. JSX 里加对应的 `<Input>` / `<Label>`
4. `onSubmit` 里写进 `localStorage` 的对象

> ⚠️ 第 4 步给 `careercompass_users` 的数组元素加字段是**向后兼容**的：
> 老用户的记录没有这个字段，读取时是 `undefined`。如果你在渲染时用了它，
> 记得给默认值（如 `user.newField ?? "默认值"`），否则会显示空白或报错。

### 7.4 改完的验证顺序

```powershell
npm run dev              # 1. 本地看效果，边改边刷新（秒级生效）
npm run build            # 2. 确认能正常构建（可选但推荐）
.\deploy.ps1 "说明"       # 3. 推到线上（约 1 分钟后生效）
```

**发布后自查清单**：

- [ ] Actions 页面最新 run 是 ✅ build + ✅ deploy
- [ ] 打开 **https://pan.gelun.eu.cc/** 能看到登录页（而不是 404 或白屏）
- [ ] `/login/`、`/signup/`、`/welcome/` 均可正常访问与跳转
- [ ] 浏览器 DevTools → Application → Local Storage 里有 `careercompass_users` / `careercompass_session`
- [ ] 🔴 若白屏：先按 F12 看 Network，如果 `_next/...` 报 404 → **是 basePath 与站点位置不匹配**，
      去 Actions 日志看 `Resolve basePath` 步骤走了哪个分支（见 §5.2.1）

---

## 8. 已知限制与坑

### 8.1 安全（演示性质，不要用于真实业务）

- **密码明文存储**在 localStorage，无哈希、无加盐。
- 任何人都能通过 DevTools 修改 `careercompass_users` 给自己"注册"账号。
- 会话只是一个 localStorage 键，删除即登出，**没有任何签名或过期校验**。
- 因为纯前端，**任何"真实鉴权"都不可能实现**。要真做，必须引入后端。

### 8.2 数据生命周期

- localStorage 是**按域名 + 路径**隔离的。本项目的线上域名是 `gelunpan.github.io`，
  而该域名下可能有其他 GitHub Pages 站点 —— 它们**共享同一个 localStorage 命名空间**。
  本项目用 `careercompass_` 前缀正是为了**避免与同域其他项目（如 `pgl-tools_`）冲突**。
  ⚠️ 所以：**前缀不能改，但也不能去掉前缀**。
- 清除浏览器数据 / 换浏览器 / 换设备 / 换域名 → 用户数据全部丢失。

### 8.3 外部依赖（运行时唯一的网络请求）

| 资源 | 来源 | 影响 |
|---|---|---|
| 图标 | `https://i.postimg.cc/nLrDYrHW/icon.png`（layout.tsx 与 manifest.ts 硬编码） | 该图床挂了 → 图标 404，页面仍可用 |
| 字体 | `fonts.googleapis.com`（Inter / Source Code Pro） | 加载失败 → 回退系统字体 |
| 其他 | 无 | 项目**不请求任何自有后端** |

> ⚠️ 图标是**硬编码的远程 URL**，写了两处（`layout.tsx` 的 `icons` 和 `manifest.ts` 的 `icons`）。
> 如果要换成本地图标，需要同时改这两处，并把文件放进 `public/`。

### 8.4 其他

- `package.json` 里 `eslint-config-next@16.1.4` 与 `next@15.5.12` **大版本不匹配**，
  `npm run lint` 可能报错。**不影响构建与部署**（`eslint.ignoreDuringBuilds: true`）。
- `typescript.ignoreBuildErrors: true` 意味着**类型错误不会阻止部署**。
  想更严格可以先本地跑 `npm run typecheck`。
- `LICENSE` 仍是上游的 `Copyright (c) 2025 arsh342`（MIT 要求保留原声明）。
- 「30 天内保持登录」复选框是**无逻辑的遗留 UI**。
- `.env.local` 里残留了原项目的 Firebase / Stripe 密钥，**全部已失效**，
  且被 `.gitignore` 的 `.env*` 覆盖（不会上传），未删除。

---

## 9. 关键事实速查表

```
项目名（中文）      苹果绿的工具箱
项目名（英文）      pgl-tools
package.json name   pgl-tools

仓库                https://github.com/GelunPan/pgl-tools   （public，默认分支 main）
线上站点            https://pan.gelun.eu.cc/                （自定义域名 + Cloudflare 代理）
旧地址              https://gelunpan.github.io/pgl-tools/   → 301 跳到上面的域名
域名 DNS            Cloudflare：CNAME  pan  →  gelunpan.github.io
Pages 自定义域名    pan.gelun.eu.cc（Actions 部署，无需 CNAME 文件）
HTTPS               GitHub 自动签发，cert=approved，已开启强制 HTTPS
Actions 日志        https://github.com/GelunPan/pgl-tools/actions
本地开发            http://localhost:9002   （端口由 package.json 固定）

构建命令            npm run build           → 产出 out/
构建产物            约 1.05 MB / 43 个文件
发布命令            .\deploy.ps1 "说明"
发布耗时            约 1 分钟
CI 触发条件         push 到 main / 手动 workflow_dispatch
CI Node 版本        20

localStorage key    careercompass_users      已注册用户数组（★不可改）
localStorage key    careercompass_session    当前登录会话（★不可改）
角色枚举            "employee" → 显示「新手」
角色枚举            "employer" → 显示「高手」   （★不可改枚举值，只可改显示文案）

源码文件数          23（src/ 下，含 favicon.ico）
运行依赖数          16（全部纯前端，无后端 SDK）
路由数              6（/ /login/ /signup/ /welcome/ /404.html /manifest.webmanifest）

原始备份            D:\localrepository\careercompass-original-backup\  （项目外，勿删）
```

---

## 10. 给 AI 的附加提示

如果你是接手的 AI，请在动手前记住这几条：

1. **先读 §6 的硬约束表**。那里每一条都是踩过的坑，不是理论风险。
2. **改文案是最安全的改动**（§7.1 有精确行号），改逻辑前先确认没有违反静态导出的限制。
3. **验证方式**：改完跑 `npm run build`，`EXITCODE=0` 且看到 `Exporting (2/2)` 才算成功。
   想验证运行时行为，必须用 `npm run dev` 实际操作，**不能靠搜索静态 HTML**。
4. **不要自作主张"优化"**：不要删 node_modules、不要清空 out/、不要改 localStorage key、
   不要给项目加后端。用户明确表示过在意的是**代码简洁**和**构建产物小**，不是依赖体积。
5. **发布是显式动作**。改完代码不会自动上线，必须跑 `deploy.ps1` 或手动 push。
6. **推送与构建是两段**。`deploy.ps1` 只保证"代码到了 GitHub"，
   "站点构建成功"要去 Actions 页面看。

---

*本文档描述的是一份纯前端演示级代码，请勿用于任何需要真实安全性的场景。*
