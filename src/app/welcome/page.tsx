"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const SESSION_KEY = "careercompass_session";

type Session = {
  email: string;
  name: string;
  role: string;
  loginAt: string;
};

export default function WelcomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  // 离开时整页淡出，与登录页「蓝色幕布盖过来」形成对称的衔接
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        setSession(JSON.parse(raw));
      }
    } catch {
      // ignore
    }
  }, []);

  const leave = (to: string, logout = false) => {
    if (leavingRef.current) return;
    leavingRef.current = true;

    if (logout) {
      localStorage.removeItem(SESSION_KEY);
      toast({
        title: "已退出登录",
        description: "期待你的下次访问。",
      });
    }

    setLeaving(true);
    window.setTimeout(() => router.push(to), 300);
  };

  return (
    // 🔴 底色必须与 ColorVeil 的终色完全一致（#000 / bg-black）。
    // 幕布是「悄悄变黑」的，跳转到这里的瞬间屏幕已经全黑，
    // 同色底才能让页面的切换彻底看不出来 —— 改这里之前先读 PROJECT.md 4.6。
    <div
      className={cn(
        "min-h-screen flex items-center justify-center bg-black text-white transition-opacity duration-300 ease-out",
        leaving && "opacity-0",
      )}
    >
      <div className="text-center max-w-md px-8">
        {/* 内容逐层浮现：幕布铺满后，以下元素按 90ms 间隔依次上浮淡入 */}
        <div
          className="text-6xl mb-6 animate-rise-in"
          style={{ animationDelay: "60ms" }}
        >
          🎉
        </div>

        <h1
          className="text-4xl font-bold tracking-tight mb-4 animate-rise-in"
          style={{ animationDelay: "150ms" }}
        >
          欢迎
        </h1>

        <p
          className="text-white/70 text-lg mb-2 animate-rise-in"
          style={{ animationDelay: "240ms" }}
        >
          登录成功，这是一个空白测试页面。
        </p>

        {session && (
          <div
            className="mt-6 p-4 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm text-left space-y-1 text-sm animate-rise-in"
            style={{ animationDelay: "330ms" }}
          >
            <p>
              <span className="text-white/60">姓名：</span>
              <span className="font-medium">{session.name}</span>
            </p>
            <p>
              <span className="text-white/60">邮箱：</span>
              <span className="font-medium">{session.email}</span>
            </p>
            <p>
              <span className="text-white/60">角色：</span>
              <span className="font-medium">
                {session.role === "employer" ? "高手" : "新手"}
              </span>
            </p>
            <p>
              <span className="text-white/60">登录时间：</span>
              <span className="font-medium">
                {new Date(session.loginAt).toLocaleString("zh-CN")}
              </span>
            </p>
          </div>
        )}

        <div
          className="mt-8 flex items-center justify-center gap-3 animate-rise-in"
          style={{ animationDelay: "420ms" }}
        >
          <Button
            onClick={() => leave("/login", true)}
            variant="outline"
            className="rounded-full border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            退出登录
          </Button>
          <Button
            onClick={() => leave("/login")}
            className="rounded-full bg-white text-primary hover:bg-white/90"
          >
            返回登录页
          </Button>
        </div>
      </div>
    </div>
  );
}
