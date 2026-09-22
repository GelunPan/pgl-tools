"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { AnimatedCharacters } from "@/components/ui/animated-characters";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";

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

      // 跳转到欢迎页
      router.push("/welcome");
    } catch (err: any) {
      setError(err.message || "登录失败，请重试。");
      toast({
        title: "登录失败",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    toast({
      title: "演示模式",
      description: "当前为纯前端演示，Google 登录暂不可用，请使用邮箱注册登录。",
    });
  };

  return (
    <div className="min-h-screen max-h-screen overflow-hidden grid lg:grid-cols-2">
      {/* Left Content Section with Animated Characters */}
      <div className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600 dark:from-white/90 dark:via-white/80 dark:to-white/70 p-12 text-white dark:text-gray-900">
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
      <div className="flex items-center justify-center p-8 bg-background">
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
              <Label htmlFor="email" className="text-sm font-medium">
                邮箱
              </Label>
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
    </div>
  );
}
