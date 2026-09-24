"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCallback, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { AnimatedCharacters } from "@/components/ui/animated-characters";
import { ColorVeil, type VeilOrigin } from "@/components/ui/color-veil";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { LoginCat } from "@/components/ui/login-cat";

const loginSchema = z.object({
  email: z.string().email({ message: "请输入有效的邮箱地址。" }),
  password: z
    .string()
    .min(6, { message: "密码至少需要 6 个字符。" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// localStorage 中存储用户的 key
const USERS_KEY = "careercompass_users";
const SESSION_KEY = "careercompass_session";

type StoredUser = {
  email: string;
  password: string;
  name: string;
  role: string;
  createdAt: string;
};

function getUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  // 登录成功后的全屏幕布：null = 不显示，有值 = 从该点扩散并逐渐变黑
  const [veil, setVeil] = useState<VeilOrigin | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const email = form.watch("email");
  const password = form.watch("password");

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setError("");

    // 模拟网络延迟，让加载动画可见
    await new Promise((resolve) => setTimeout(resolve, 600));

    try {
      const users = getUsers();
      const user = users.find(
        (u) => u.email.toLowerCase() === values.email.toLowerCase(),
      );

      if (!user) {
        throw new Error("该邮箱尚未注册，请先注册账号。");
      }

      if (user.password !== values.password) {
        throw new Error("密码不正确，请重试。");
      }

      // 登录成功：写入会话
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          email: user.email,
          name: user.name,
          role: user.role,
          loginAt: new Date().toISOString(),
        }),
      );

      toast({
        title: "登录成功",
        description: `欢迎回来，${user.name}！`,
      });

      // 登录成功：不直接跳转，改为让幕布从「登录按钮」的位置扩散铺满全屏，
      // 并在扩散后半程悄悄由主题蓝变纯黑。全部变完之后才跳转（见下方 ColorVeil
      // 的 onComplete），这样跳转时屏幕已经是一片纯黑，与欢迎页底色完全一致
      // —— 既看不到页面切换，也感觉不到颜色是什么时候变的。
      const rect = buttonRef.current?.getBoundingClientRect();
      setVeil(
        rect
          ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
          : { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      );
    } catch (err: any) {
      setError(err.message || "登录失败，请重试。");
      toast({
        title: "登录失败",
        description: err.message,
        variant: "destructive",
      });
      // 只有失败才解除加载态；成功时按钮保持「正在登录…」直到被幕布盖住
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    toast({
      title: "演示模式",
      description: "当前为纯前端演示，Google 登录暂不可用，请使用邮箱注册登录。",
    });
  };

  /**
   * 彩蛋：连点趴在邮箱框上那只猫 5 下 —— 跳过登录，直接进工具箱主页。
   *
   * 走的是和正常登录**完全同一条收尾链路**：先写会话、再从猫的位置把幕布铺开，
   * 由 ColorVeil 的 onComplete 去跳 /bento。所以「蓝→黑→新页面浮现」那套无缝衔接
   * 一模一样，不用另写一套动效。
   *
   * 唯一的区别：先等 1.1s，让彩蛋（爱心/星星/爪印 + 转圈跳）演完小半截再铺幕布，
   * 不然点完立刻就黑屏，等于把彩蛋吃掉了。
   */
  const catSkippedRef = useRef(false);
  const handleCatSkip = useCallback(
    (origin: { x: number; y: number }) => {
      if (catSkippedRef.current) return;
      catSkippedRef.current = true;

      // 也写一份会话：进去之后顶栏才有「退出」，不然点了会莫名其妙回到登录页
      try {
        localStorage.setItem(
          SESSION_KEY,
          JSON.stringify({
            email: "cat@gelun.eu.cc",
            name: "小潘",
            role: "employee",
            loginAt: new Date().toISOString(),
            via: "cat",
          }),
        );
      } catch {
        /* ignore */
      }

      toast({
        title: "🐾 猫咪通道已开启",
        description: "看在你撸得这么认真的份上，直接带你进去～",
      });

      window.setTimeout(() => setVeil(origin), 1100);
    },
    [toast],
  );

  return (
    <div className="min-h-screen max-h-screen overflow-hidden grid lg:grid-cols-2">
      {/* Left Content Section with Animated Characters */}
      <div
        className={cn(
          "relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600 dark:from-white/90 dark:via-white/80 dark:to-white/70 p-12 text-white dark:text-gray-900 transition-all duration-500 ease-out",
          veil && "scale-[1.05] opacity-0",
        )}
      >
        <div className="relative z-20">
          <Link
            href="/login"
            className="flex items-center gap-2 text-lg font-semibold"
          >
            <Image
              src="https://i.postimg.cc/nLrDYrHW/icon.png"
              alt="pgl-tools 标志"
              width={32}
              height={32}
              className="bg-white/10 backdrop-blur-sm p-1 rounded-lg"
            />
            <span>pgl-tools</span>
          </Link>
        </div>

        <div className="relative z-20 flex items-end justify-center h-[500px]">
          <AnimatedCharacters
            isTyping={isTyping}
            showPassword={showPassword}
            passwordLength={password.length}
          />
        </div>

        <div className="relative z-20 flex items-center gap-8 text-sm text-gray-600 dark:text-gray-700">
          <span className="opacity-70">天天开心</span>
        </div>

        {/* Decorative elements */}
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="absolute top-1/4 right-1/4 size-64 bg-gray-400/20 dark:bg-gray-300/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 size-96 bg-gray-300/20 dark:bg-gray-200/20 rounded-full blur-3xl" />
      </div>

      {/* Right Login Section */}
      <div
        className={cn(
          "flex items-center justify-center p-8 bg-background transition-all duration-500 ease-out",
          veil && "scale-[1.05] opacity-0",
        )}
      >
        <div className="w-full max-w-[420px]">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 text-lg font-semibold mb-12">
            <Image
              src="https://i.postimg.cc/nLrDYrHW/icon.png"
              alt="pgl-tools 标志"
              width={32}
              height={32}
              className="dark:bg-white dark:p-1 dark:rounded-md"
            />
            <span>pgl-tools</span>
          </div>

          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              欢迎回来！
            </h1>
            <p className="text-muted-foreground text-sm">
              请输入你的登录信息
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              {/* 标签行右端是那只猫的「暗示」——正好落在它的斜上方。
                  这样安排是为了不额外占竖直空间：登录卡片本来就顶得很紧。 */}
              <div className="flex items-end justify-between gap-3">
                <Label htmlFor="email" className="text-sm font-medium">
                  邮箱
                </Label>
                <span className="cat-hint text-muted-foreground">
                  🐾 这么可爱的小猫，谁能忍住不撸一下？
                </span>
              </div>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="off"
                  {...form.register("email")}
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                  className="h-12 bg-background border-border/60 focus:border-primary"
                />
                {/* 趴在邮箱框上沿的猫（只压住约 3px，占位文字完全露得出来）。
                    连点 5 下 = 跳过登录进 /bento，见 handleCatSkip。 */}
                <LoginCat onSkip={handleCatSkip} disabled={!!veil || isLoading} />
              </div>
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                密码
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...form.register("password")}
                  className="h-12 pr-10 bg-background border-border/60 focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
                <Label
                  htmlFor="remember"
                  className="text-sm font-normal cursor-pointer"
                >
                  30 天内保持登录
                </Label>
              </div>
            </div>

            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg">
                {error}
              </div>
            )}

            <InteractiveHoverButton
              ref={buttonRef}
              type="submit"
              text={isLoading ? "正在登录..." : "登录"}
              className="w-full h-12 text-base font-medium"
              disabled={isLoading}
            />
          </form>

          {/* Sign Up Link */}
          <div className="text-center text-sm text-muted-foreground mt-8">
            还没有账号？{" "}
            <Link
              href="/signup"
              className="text-foreground font-medium hover:underline"
            >
              立即注册
            </Link>
          </div>
        </div>
      </div>

      {/* 登录成功后的幕布：从登录按钮位置扩散铺满整屏，铺满后是主题蓝，
          再在扩散后半程悄悄暗下去变纯黑，全黑之后才跳转工具箱（见下方 onComplete）。
          跳过去的 /bento 首帧也是一层纯黑幕布（同色 #000），然后才淡出露出
          #000212 的夜色底并让所有模块从四周汇聚进来 —— 两段动效是接在一起的。
          注意：它是固定定位，必须挂在没有 transform / filter / opacity 的祖先下，
          否则会被降级成「相对该祖先定位」并跟着一起淡出。 */}
      <ColorVeil origin={veil} onComplete={() => router.push("/bento")} />
    </div>
  );
}
