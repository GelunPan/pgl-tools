/**
 * 静态资源路径前缀。
 *
 * 本项目要同时支持两种部署形态（见 next.config.ts）：
 *   ① 绑了自定义域名（现在是 gelun.eu.cc）→ 站点在根目录，basePath 留空
 *   ② 普通 GitHub Pages 项目站点 → 站点在 /<repo>/ 子路径，basePath = /<repo>
 *
 * 所以**任何写死在 JSX 里的 `/xxx.svg` 都是 bug** —— 在形态 ② 下会 404。
 * 注意 `<img src="brands/x.svg">` 这种相对路径也不行：`/bento/` 页面下会被
 * 解析成 `/bento/brands/x.svg`。必须用这个 helper 拼绝对路径。
 *
 * `NEXT_PUBLIC_` 前缀保证它在构建时被内联进客户端 bundle，SSR 与 CSR 取值一致。
 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** 把 `public/` 下的资源路径拼成带 basePath 的绝对路径 */
export function asset(path: string): string {
  return `${BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}
