import type { NextConfig } from "next";

/**
 * GitHub Pages 部署说明
 * ------------------------------------------------------------------
 * 项目站点地址形如 https://<用户名>.github.io/<仓库名>/ ，
 * 此时必须设置 basePath = "/<仓库名>"。
 * 若仓库名本身就是 <用户名>.github.io（用户主页站点），则 basePath 留空。
 *
 * 本地构建时可通过环境变量手动指定：
 *   $env:NEXT_PUBLIC_BASE_PATH="/my-repo"; npm run build
 * GitHub Actions 工作流会自动探测仓库名并注入该变量。
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // 导出为纯静态站点，产物位于 out/ 目录
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  // 生成 login/index.html 形式，保证 GitHub Pages 上 /login 直接可访问
  trailingSlash: true,
  images: {
    // 静态导出必须关闭 Next.js 图片优化服务
    unoptimized: true,
  },
  typescript: {
    // 沿用原项目设置：类型错误不阻断构建，保证 GitHub Pages 部署稳定。
    // 本地跑通 `npm run typecheck` 后可改为 false。
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
};

export default nextConfig;
