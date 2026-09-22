# 苹果绿的工具箱 · pgl-tools

> 浏览器标签显示「苹果绿的工具箱」，页面左上角标识为 `pgl-tools`。

一个**纯前端**的登录注册演示站点：注册信息保存在浏览器 `localStorage`，登录成功后跳转到欢迎页。不依赖任何后端服务、数据库或第三方 API，构建产物是纯静态文件，可直接部署到 **GitHub Pages**。

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

### 1. 推送到 GitHub

```bash
git init
git add .
git commit -m "feat: 精简为登录注册静态页面"
git branch -M main
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

### 2. 开启 Pages

仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。

推送后 `.github/workflows/deploy.yml` 会自动构建并发布，网址为：

- 项目站点：`https://<用户名>.github.io/<仓库名>/`
- 用户主页站点（仓库名为 `<用户名>.github.io`）：`https://<用户名>.github.io/`

工作流会自动判断仓库类型并注入正确的 `basePath`，**无需手动改配置**。

### 3. 手动构建（可选）

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

## 目录结构

```
.
├── .github/workflows/deploy.yml   # GitHub Pages 自动部署
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
