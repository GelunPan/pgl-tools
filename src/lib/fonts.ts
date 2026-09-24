import { asset } from "./asset";

/**
 * 自托管字体（Google Fonts 的官方 woff2，来源是 npm 上的 @fontsource 包）。
 *
 * 🔴 **为什么不用 `<link href="https://fonts.googleapis.com/...">`**（2026-09-24 踩过）：
 * `<head>` 里的**外部样式表是渲染阻塞的** —— 浏览器在它返回或超时之前**一个像素都不画**。
 * 而 `fonts.googleapis.com` 在国内经常连得上却迟迟不响应，于是首屏被无限期挂住；
 * 页面底色又是近黑的 `rgb(12,10,9)`，看起来就是**一直卡在黑屏**。
 * 实测：把 5 个字体请求挂住 → `performance.getEntriesByType("paint")` **一条都没有**
 * （渲染被完全阻塞）；正常网络下也要 2.7s 才首绘。
 * 自托管后整个页面**零外部字体请求**，首屏不再依赖任何第三方网络。
 *
 * 🔴 **为什么放在 `<style>` 里而不是 `globals.css` 里**：
 * CSS 里的 `url()` 是相对**样式表**解析的。构建产物中样式表在
 * `/_next/static/css/xxx.css`，而字体在 `/fonts/`，相对路径两级都对不上；
 * 写绝对路径 `/fonts/x.woff2` 在 basePath = `/pgl-tools` 的部署形态下又会 404。
 * 放进文档内的 `<style>` 就能用 `asset()` 拼出带 basePath 的绝对路径
 * （与 `PROJECT.md` 6.1 第 26 条「public/ 下的路径必须过 asset()」一致）。
 *
 * 只取 **latin 子集**：这几个字体本来就不含汉字，中文走系统字体。
 * 加 `unicode-range` 是为了让中文压根不去匹配这些字体，省掉一次无谓的查找。
 */
const LATIN =
  "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";

type Face = {
  /** `public/fonts/` 下的文件名 */
  file: string;
  family: string;
  weight: number;
  style?: "normal" | "italic";
};

const FACES: Face[] = [
  // 正文 / 标题
  { file: "nunito-latin-400-normal.woff2", family: "Nunito", weight: 400 },
  { file: "nunito-latin-400-italic.woff2", family: "Nunito", weight: 400, style: "italic" },
  { file: "nunito-latin-600-normal.woff2", family: "Nunito", weight: 600 },
  { file: "nunito-latin-700-normal.woff2", family: "Nunito", weight: 700 },
  { file: "nunito-latin-800-normal.woff2", family: "Nunito", weight: 800 },
  // Pinned 便签卡的手写体
  { file: "handlee-latin-400-normal.woff2", family: "Handlee", weight: 400 },
  // 字体预览卡右侧那个衬线 T
  { file: "sorts-mill-goudy-latin-400-normal.woff2", family: "Sorts Mill Goudy", weight: 400 },
  {
    file: "sorts-mill-goudy-latin-400-italic.woff2",
    family: "Sorts Mill Goudy",
    weight: 400,
    style: "italic",
  },
  // 终端卡的等宽字
  { file: "source-code-pro-latin-400-normal.woff2", family: "Source Code Pro", weight: 400 },
  { file: "source-code-pro-latin-600-normal.woff2", family: "Source Code Pro", weight: 600 },
];

/** 生成注入 `<head>` 的 `@font-face` 规则串（构建期就算好，产物里是静态字符串） */
export const FONT_FACE_CSS = FACES.map(
  (f) =>
    `@font-face{font-family:"${f.family}";font-style:${f.style ?? "normal"};` +
    `font-weight:${f.weight};font-display:swap;` +
    `src:url("${asset(`/fonts/${f.file}`)}") format("woff2");` +
    `unicode-range:${LATIN}}`,
).join("");
