/**
 * Bento 页面用到的全部图标。
 *
 * 路径**逐条**从 zhangyu.dev 的 DOM 里扒出来的（tabler-icons，MIT；GitHub / 掘金
 * 是各自品牌标），不是凭记忆写的 —— 线条粗细、圆头圆角、坐标系都跟参考站一致。
 * 全部内联 SVG，不引图标库。
 *
 * 统一约定：
 *   线框图标  strokeWidth 2 / fill none / stroke currentColor
 *   实心图标  fill currentColor / 无 stroke
 */

type IconProps = { className?: string };

/* ============================ 线框（stroke） ============================ */

function Line({
  className,
  children,
  viewBox = "0 0 24 24",
  size = 24,
}: IconProps & { children: React.ReactNode; viewBox?: string; size?: number }) {
  return (
    <svg
      viewBox={viewBox}
      // 🔴 width / height 属性不能省：tabler 图标原生就带 `width="24" height="24"`。
      //    少写这两个属性时，SVG 会退化成 300×150 的默认尺寸 —— 放在 flex 容器里
      //    会把父元素顶得极高（Tags 卡就因为这个，标题被撑到 1117px 高，
      //    整行标签被 overflow-clip 裁掉，整张卡看着是空的）。
      //    `size-*` 之类的 class 走 CSS，会正常覆盖这里的属性值。
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

/** 标签组 —— Tags 卡标题 */
export function TagsIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M3 8v4.172a2 2 0 0 0 .586 1.414l5.71 5.71a2.41 2.41 0 0 0 3.408 0l3.592 -3.592a2.41 2.41 0 0 0 0 -3.408l-5.71 -5.71a2 2 0 0 0 -1.414 -.586h-4.172a2 2 0 0 0 -2 2z" />
      <path d="M18 19l1.592 -1.592a4.82 4.82 0 0 0 0 -6.816l-4.592 -4.592" />
      <path d="M7 10h-.01" />
    </Line>
  );
}

/** 井号 —— 标签芯片前缀 */
export function HashIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M5 9l14 0" />
      <path d="M5 15l14 0" />
      <path d="M11 4l-4 16" />
      <path d="M17 4l-4 16" />
    </Line>
  );
}

/** 书 —— Pinned 便签上的仓库标记 */
export function BookIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M19 4v16h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12z" />
      <path d="M19 16h-12a2 2 0 0 0 -2 2" />
      <path d="M9 8h6" />
    </Line>
  );
}

/** 星星 —— 仓库 star 数 */
export function StarIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" />
    </Line>
  );
}

/** 分叉 —— 仓库 fork 数 */
export function GitForkIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M12 18m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
      <path d="M7 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
      <path d="M17 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
      <path d="M7 8v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2 -2v-2" />
      <path d="M12 12l0 4" />
    </Line>
  );
}

/** 终端提示符 */
export function TerminalIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M5 7l5 5l-5 5" />
      <path d="M12 19l7 0" />
    </Line>
  );
}

/** 循环箭头 —— SKILLS 挂钩板的「重新掉一遍」按钮 */
export function RefreshIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
      <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
    </Line>
  );
}

/** 齿轮 —— 页头右上角设置 */
export function SettingsIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" />
      <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
    </Line>
  );
}

/** 沙滩伞 —— 「Explore More」卡 */
export function BeachIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M17.553 16.75a7.5 7.5 0 0 0 -10.606 0" />
      <path d="M18 3.804a6 6 0 0 0 -8.196 2.196l10.392 6a6 6 0 0 0 -2.196 -8.196z" />
      <path d="M16.732 10c1.658 -2.87 2.225 -5.644 1.268 -6.196c-.957 -.552 -3.075 1.326 -4.732 4.196" />
      <path d="M15 9l-3 5.196" />
      <path d="M3 19.25a2.4 2.4 0 0 1 1 -.25a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 1 .25" />
    </Line>
  );
}

/** 斜向箭头（指向右上）—— 悬停浮出的胶囊按钮 */
export function ArrowUpRightIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M17 7l-10 10" />
      <path d="M8 7l9 0l0 9" />
    </Line>
  );
}

/** 地球 —— 在线站点卡（对应参考站的掘金标） */
export function GlobeIcon({ className }: IconProps) {
  return (
    <Line className={className} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M3.6 9h16.8" />
      <path d="M3.6 15h16.8" />
      <path d="M11.5 3a17 17 0 0 0 0 18" />
      <path d="M12.5 3a17 17 0 0 1 0 18" />
    </Line>
  );
}

/** 闪光（夜空里那颗四角星） */
export function SparkleIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6z" />
    </Line>
  );
}

/** 北极星（八芒） */
export function NorthStarIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M3 12h18" />
      <path d="M12 21v-18" />
      <path d="M7.5 7.5l9 9" />
      <path d="M7.5 16.5l9 -9" />
    </Line>
  );
}

/* ============================ 实心（fill） ============================ */

/** 图钉（实心）—— Pinned 卡标题 */
export function PinIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={24}
      height={24}
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M15.113 3.21l.094 .083l5.5 5.5a1 1 0 0 1 -1.175 1.59l-3.172 3.171l-1.424 3.797a1 1 0 0 1 -.158 .277l-.07 .08l-1.5 1.5a1 1 0 0 1 -1.32 .082l-.095 -.083l-2.793 -2.792l-3.793 3.792a1 1 0 0 1 -1.497 -1.32l.083 -.094l3.792 -3.793l-2.792 -2.793a1 1 0 0 1 -.083 -1.32l.083 -.094l1.5 -1.5a1 1 0 0 1 .258 -.187l.098 -.042l3.796 -1.425l3.171 -3.17a1 1 0 0 1 1.497 -1.26z" />
    </svg>
  );
}

/** GitHub 品牌标（16×16 坐标系，与参考站一致） */
export function GithubIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={16}
      height={16}
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
    </svg>
  );
}

/**
 * 掘金标（38×38 坐标系，固定品牌蓝 #006CFF 不随主题变）。
 * 参考站在暗色下额外挂 `dark:grayscale-[20%]` 压一点彩度。
 */
export function JuejinIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 38 38"
      width={38}
      height={38}
      fill="#006CFF"
      className={className}
      aria-hidden
    >
      <path d="M22.293 7.583L19.017 5l-3.422 2.699-.178.143 3.6 2.87 3.612-2.87-.336-.259zm12.415 10.018l-15.7 12.38-15.69-12.373L1 19.47l18.008 14.199 18.018-14.207-2.318-1.861zm-15.7 1.004l-8.544-6.736-2.317 1.861 10.86 8.564 10.871-8.572-2.317-1.861-8.553 6.744z" />
    </svg>
  );
}
