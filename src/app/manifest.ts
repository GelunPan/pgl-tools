import type { MetadataRoute } from "next";

// output: "export" 静态导出下，metadata 路由必须显式声明为静态，
// 否则构建报错：export const dynamic = "force-static" not configured on route "/manifest.webmanifest"
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "苹果绿的工具箱",
    short_name: "pgl-tools",
    description: "苹果绿的工具箱 · pgl-tools",
    // 用相对路径，避免部署在 GitHub Pages 子路径（basePath）下时跳错位置
    start_url: ".",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#6366f1",
    orientation: "portrait-primary",
    icons: [
      {
        src: "https://i.postimg.cc/nLrDYrHW/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "https://i.postimg.cc/nLrDYrHW/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
