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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { AnimatedCharacters } from "@/components/ui/animated-characters";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";

const signupSchema = z.object({
  fullName: z.string().min(2, { message: "请输入你的姓名。" }),
  email: z.string().email({ message: "请输入有效的邮箱地址。" }),
  password: z
    .string()
    .min(6, { message: "密码至少需要 6 个字符。" }),
  // 不在这里用 .default()，否则 z.input / z.output 类型不一致会与 zodResolver 冲突；
  // 默认值已由 useForm 的 defaultValues 提供。
  role: z.enum(["employee", "employer"]),
});

type SignupFormValues = z.infer<typeof signupSchema>;

const USERS_KEY = "careercompass_users";

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

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      role: "employee",
    },
  });

  const password = form.watch("password");

  const onSubmit = async (values: SignupFormValues) => {
    setIsLoading(true);
    setError("");

    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 600));

    try {
      const users = getUsers();
      const exists = users.find(
        (u) => u.email.toLowerCase() === values.email.toLowerCase(),
      );

      if (exists) {
        throw new Error("该邮箱已注册，请直接登录。");
      }

      const newUser: StoredUser = {
        email: values.email,
        password: values.password,
        name: values.fullName,
        role: values.role,
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      saveUsers(users);

      toast({
        title: "注册成功",
        description: `欢迎加入，${values.fullName}！请使用邮箱和密码登录。`,
      });

      // 注册成功后跳转到登录页
      router.push("/login");
    } catch (err: any) {
      setError(err.message || "注册失败，请重试。");
      toast({
        title: "注册失败",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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

      {/* Right Signup Section */}
      <div className="flex items-center justify-center p-8 bg-background overflow-y-auto">
        <div className="w-full max-w-[420px] py-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 text-lg font-semibold mb-8">
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
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              创建账号
            </h1>
            <p className="text-muted-foreground text-sm">
              加入我们吧！
            </p>
          </div>

          {/* Signup Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Role Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">我是...</Label>
              <RadioGroup
                defaultValue={form.getValues("role")}
                onValueChange={(val) =>
                  form.setValue("role", val as "employee" | "employer")
                }
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2 border rounded-xl px-4 py-3 flex-1 cursor-pointer hover:bg-muted/50 transition-colors [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5">
                  <RadioGroupItem
                    value="employee"
                    id="employee"
                    className="sr-only"
                  />
                  <Label
                    htmlFor="employee"
                    className="cursor-pointer flex-1 font-medium"
                  >
                    新手
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-xl px-4 py-3 flex-1 cursor-pointer hover:bg-muted/50 transition-colors [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5">
                  <RadioGroupItem
                    value="employer"
                    id="employer"
                    className="sr-only"
                  />
                  <Label
                    htmlFor="employer"
                    className="cursor-pointer flex-1 font-medium"
                  >
                    高手
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">
                姓名
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="请输入你的姓名"
                autoComplete="off"
                {...form.register("fullName")}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                className="h-12 bg-background border-border/60 focus:border-primary"
              />
              {form.formState.errors.fullName && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.fullName.message}
                </p>
              )}
            </div>

            {/* Email */}
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
                className="h-12 bg-background border-border/60 focus:border-primary"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                密码
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="至少 6 个字符"
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

            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg">
                {error}
              </div>
            )}

            <InteractiveHoverButton
              type="submit"
              text={isLoading ? "正在创建账号..." : "创建账号"}
              className="w-full h-12 text-base font-medium"
              disabled={isLoading}
            />
          </form>

          {/* Sign In Link */}
          <div className="text-center text-sm text-muted-foreground mt-8">
            已有账号？{" "}
            <Link
              href="/login"
              className="text-foreground font-medium hover:underline"
            >
              登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
