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
| 登录 | `/login` | 邮箱 + 密码登录，读取 `localStorage` 中已注册用户；成功后写入会话并跳转欢迎页 |
| 注册 | `/signup` | 选择身份（新手 / 高手）、姓名、邮箱、密码，写入 `localStorage`；成功后跳转登录页 |
| 欢迎 | `/welcome` | 展示当前登录用户信息，支持退出登录 |
| 404 | 任意未知路径 | GitHub Pages 会自动使用构建出的 `404.html` |

### 保留的交互与动画

以下都是原项目组件，**完整保留**：

- `AnimatedCharacters` —— 左侧四个卡通角色：眼球跟随鼠标、随机眨眼、输入时互相对视、密码可见时「偷看」
- `InteractiveHoverButton` —— 登录 / 注册按钮的悬停位移 + 主色填充动画
- 密码显示 / 隐藏切换、表单实时校验（Zod + React Hook Form）
- 加载态（"正在登录…"）、Toast 提示、深浅色主题跟随系统
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
| `npm run build` | 生成静态站点到 `out/` |
| `npm run lint` | ESLint 检查 |
| `npm run typecheck` | TypeScript 类型检查 |

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
| 站点 | **https://gelunpan.github.io/pgl-tools/** |
| 部署流水线 | https://github.com/GelunPan/pgl-tools/actions |

推送 `main` 分支后，`.github/workflows/deploy.yml` 会自动构建并发布，无需任何手动操作。
工作流会自动判断仓库类型并注入正确的 `basePath`（本项目为 `/pgl-tools`）。

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
# Windows PowerShell
$env:NEXT_PUBLIC_BASE_PATH="/<仓库名>"; npm run build
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
| 谁能看到 | 只有你自己（`localhost:9002`） | 所有人（`gelunpan.github.io/pgl-tools`） |
| 是否自动 | 是，不用做别的 | 否，**每次都要推一次** |

> 🔴 **改代码不会让线上页面实时变化。** 线上是一堆已经构建好的静态文件，
> 必须推送后由 GitHub Actions 重新构建才会更新。

### 常见改动对应文件

| 想改什么 | 文件 | 位置 |
| --- | --- | --- |
| 浏览器标签标题 / PWA 名称 | `src/app/layout.tsx` | `metadata.title` |
| 登录页标题「欢迎回来！」 | `src/app/(auth)/login/page.tsx` | 第 181 行 |
| 登录页副标题 | 同上 | 第 184 行 |
| 注册页副标题「加入我们吧！」 | `src/app/(auth)/signup/page.tsx` | 第 180 行（大标题「创建账号」在第 177 行） |
| 角色选项「新手 / 高手」 | 同上 | 第 206、219 行 |
| 姓名输入框占位文字 | 同上 | 第 233 行 |
| 底部小字「天天开心」 | 登录页 / 注册页 | 154 行 / 150 行 |
| 欢迎页文案 | `src/app/welcome/page.tsx` | 第 48 行 |
| 报错 / 成功提示文字 | 各页的 `toast({ ... })`、`z.string().min(...)` | — |
| 左上角标识 `pgl-tools` | 登录页 / 注册页内的 `<span>` | — |
| 404 页面 | `src/app/not-found.tsx` | — |
| 配色 / 主题变量 | `src/app/globals.css` | — |
| 页面跳转逻辑 | 各页的 `router.push(...)` | — |

> ⚠️ 登录页与注册页结构对称，同一处文案两边都有 —— 改一处记得看看另一处，避免两边不一致。
>
> ⚠️ **别改 `localStorage` 的 key**（`careercompass_users` / `careercompass_session`），改了老账号就读不到了。

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
├── public/.nojekyll               # 关闭 GitHub Pages 的 Jekyll 处理
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx     # 登录页
│   │   │   └── signup/page.tsx    # 注册页
│   │   ├── welcome/page.tsx       # 欢迎页
│   │   ├── page.tsx               # 首页 → 跳转 /login
│   │   ├── not-found.tsx          # 404
│   │   ├── layout.tsx             # 根布局（主题 + Toast）
│   │   ├── globals.css            # 设计令牌（shadcn 变量）
│   │   └── manifest.ts            # PWA manifest
│   ├── components/
│   │   ├── ui/                    # 仅保留登录注册页用到的 9 个组件
│   │   └── theme-provider.tsx
│   ├── hooks/use-toast.ts
│   ├── lib/utils.ts
│   └── styles/responsive-touch.css
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
