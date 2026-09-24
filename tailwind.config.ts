import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        /* 正文：参考站是 Nunito。字体**自托管**（public/fonts/ + src/lib/fonts.ts），
           --font-nunito 只是字体名，见 PROJECT.md 2.2 / 8.7 */
        body: ["var(--font-nunito)", "Inter", "sans-serif"],
        headline: ["var(--font-nunito)", "Inter", "sans-serif"],
        code: ['"Source Code Pro"', "monospace"],
        /* 手写体：Pinned 便签卡专用（Handlee） */
        handwriting: ["var(--font-handwriting)", "var(--font-nunito)", "sans-serif"],
        /* 衬线：字体预览卡右侧那个 T（Sorts Mill Goudy） */
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        /* ---- Bento 设计系统（RGB 三元组，见 globals.css 同名变量）----
           surface-* = 浮起层级（暗色下越编号越亮）；ink-* = 文字层级；
           hairline = 描边；brand = 强调色。
           注意：不叫 border，因为 `border` 已被上面的 shadcn HSL 变量占用。 */
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          1: "rgb(var(--surface-1) / <alpha-value>)",
          2: "rgb(var(--surface-2) / <alpha-value>)",
          3: "rgb(var(--surface-3) / <alpha-value>)",
          4: "rgb(var(--surface-4) / <alpha-value>)",
        },
        ink: {
          1: "rgb(var(--ink-1) / <alpha-value>)",
          2: "rgb(var(--ink-2) / <alpha-value>)",
          3: "rgb(var(--ink-3) / <alpha-value>)",
          4: "rgb(var(--ink-4) / <alpha-value>)",
        },
        hairline: "rgb(var(--hairline) / <alpha-value>)",
        brand: "rgb(var(--brand) / <alpha-value>)",
      },
      boxShadow: {
        /* 参考站 shadow-bento：几乎看不见的一层，只用来把卡片从底色上「托」起来一点 */
        bento: "0 2px 4px rgba(0, 0, 0, 0.04)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-scale": {
          "0%": {
            opacity: "0",
            transform: "translateY(-50%) scale(0.95)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(-50%) scale(1)",
          },
        },
        /* ---- Bento 微动效（关键帧本体在 globals.css）---- */
        /* 呼吸：只声明终点，配合 alternate 来回荡。
           注意用独立 `scale` 属性，不是 transform —— 头像卡的涟漪靠 inset 定位。 */
        breath: {
          "100%": { scale: "0.8" },
        },
        /* 挥手：👋 */
        hello: {
          "50%": { transform: "translateY(-25%) rotate(15deg)" },
        },
        /* 淡入 / 淡出 */
        "fade-in": {
          "100%": { opacity: "1" },
        },
        "fade-out": {
          "100%": { opacity: "0" },
        },
        /* 终端光标闪烁：用 steps 硬切，不能淡入淡出，否则不像光标 */
        "cursor-blink": {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-scale": "fade-scale 0.2s ease-out",
        /* 时序与参考站逐字一致（见 globals.css 的 keyframes 注释） */
        breath: "breath 2s ease infinite alternate",
        hello: "hello 3s ease infinite",
        "cursor-blink": "cursor-blink 1.1s steps(1) infinite",
        "fade-in": "fade-in 0.5s ease forwards",
        "fade-out": "fade-out 0.5s ease forwards",
      },
    },
  },
  // typography 插件是给首页那张「自我介绍」卡用的（参考站也用 `prose` + `dark:prose-invert`）
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
